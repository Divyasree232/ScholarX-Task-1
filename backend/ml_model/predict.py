import os
import pickle
import numpy as np
from backend.utils.preprocessor import TextPreprocessor

class DocumentClassifier:
    def __init__(self):
        self.preprocessor = TextPreprocessor()
        self.vectorizer = None
        self.models = {}
        self.load_resources()

    def load_resources(self):
        """Loads models and vectorizer if they exist."""
        base_path = "backend/ml_model/saved_models"
        
        try:
            vec_path = os.path.join(base_path, "vectorizer.pkl")
            if os.path.exists(vec_path):
                with open(vec_path, "rb") as f:
                    self.vectorizer = pickle.load(f)
            
            model_files = {
                "Naive Bayes": "naive_bayes_model.pkl",
                "SVM": "svm_model.pkl",
                "Logistic Regression": "logistic_regression_model.pkl"
            }
            
            for name, filename in model_files.items():
                path = os.path.join(base_path, filename)
                if os.path.exists(path):
                    with open(path, "rb") as f:
                        self.models[name] = pickle.load(f)
        except Exception as e:
            print(f"Error loading models or vectorizer: {e}")

    def is_trained(self):
        """Checks if models are successfully loaded."""
        return self.vectorizer is not None and len(self.models) > 0

    def extract_important_keywords(self, text, top_n=5):
        """Extracts top keywords in the text based on TF-IDF representation."""
        if not self.vectorizer or not text:
            return []
            
        cleaned = self.preprocessor.clean_text(text)
        if not cleaned:
            return []
            
        # Vectorize single document
        vec = self.vectorizer.transform([cleaned])
        feature_names = self.vectorizer.get_feature_names_out()
        
        # Get tf-idf scores
        scores = vec.toarray()[0]
        
        # Sort indices by score desc
        sorted_indices = np.argsort(scores)[::-1]
        
        keywords = []
        for idx in sorted_indices[:top_n]:
            if scores[idx] > 0:
                keywords.append({
                    "word": str(feature_names[idx]),
                    "score": float(scores[idx])
                })
                
        return keywords

    def predict(self, text, model_name="Logistic Regression"):
        """
        Predicts category, confidence scores, and returns comparative outputs.
        """
        if not self.is_trained():
            return {
                "success": False,
                "error": "Models have not been trained yet. Please run the training script."
            }

        cleaned = self.preprocessor.clean_text(text)
        if not cleaned:
            return {
                "success": False,
                "error": "The document text is empty or could not be preprocessed."
            }

        # Vectorize
        X_vec = self.vectorizer.transform([cleaned])
        
        # Get predictions and confidences for all models
        results = {}
        
        for name, model in self.models.items():
            pred = model.predict(X_vec)[0]
            confidence = 0.0
            
            # Estimate confidence/probabilities
            if hasattr(model, "predict_proba"):
                probs = model.predict_proba(X_vec)[0]
                class_idx = list(model.classes_).index(pred)
                confidence = float(probs[class_idx])
            elif hasattr(model, "decision_function"):
                # For LinearSVC, we can pass decision score through softmax
                dec = model.decision_function(X_vec)[0]
                # Softmax calculation
                exp_dec = np.exp(dec - np.max(dec))  # stable softmax
                probs = exp_dec / np.sum(exp_dec)
                class_idx = list(model.classes_).index(pred)
                confidence = float(probs[class_idx])
            
            results[name] = {
                "prediction": str(pred),
                "confidence": round(confidence, 4)
            }

        # Select the active model's response
        if model_name not in results:
            model_name = "Logistic Regression"  # fallback
            
        active_res = results[model_name]
        
        # Get keywords
        keywords = self.extract_important_keywords(text)

        # Generate confidence details for breakdown visual
        all_categories = list(self.models[model_name].classes_)
        confidence_distribution = []
        
        # Build list of confidences per category for graphs
        if hasattr(self.models[model_name], "predict_proba"):
            probs = self.models[model_name].predict_proba(X_vec)[0]
            for cat, prob in zip(all_categories, probs):
                confidence_distribution.append({
                    "category": cat,
                    "confidence": round(float(prob), 4)
                })
        elif hasattr(self.models[model_name], "decision_function"):
            dec = self.models[model_name].decision_function(X_vec)[0]
            exp_dec = np.exp(dec - np.max(dec))
            probs = exp_dec / np.sum(exp_dec)
            for cat, prob in zip(all_categories, probs):
                confidence_distribution.append({
                    "category": cat,
                    "confidence": round(float(prob), 4)
                })

        return {
            "success": True,
            "prediction": active_res["prediction"],
            "confidence": active_res["confidence"],
            "model_used": model_name,
            "all_predictions": results,
            "keywords": keywords,
            "confidence_distribution": sorted(confidence_distribution, key=lambda x: x["confidence"], reverse=True),
            "cleaned_length": len(cleaned.split())
        }
# Simple singleton pattern
classifier = DocumentClassifier()
