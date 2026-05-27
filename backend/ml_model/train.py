import os
import pickle
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import LinearSVC
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

from backend.utils.preprocessor import TextPreprocessor

CATEGORIES = [
    "Invoice/Financial",
    "Resume/CV",
    "Legal Contract",
    "Scientific Paper",
    "Business Proposal"
]

SYNTHETIC_DATA_TEMPLATES = {
    "Invoice/Financial": [
        "Invoice {id} - Payment Due. Please remit {amount} by {date}. Description of services provided, including tax and total fees.",
        "Billing Invoice for consulting work. Total amount due: ${amount}. Payment terms: Net 30. Bank transfer info included.",
        "Receipt of transaction {id}. Total paid: ${amount}. Thank you for your business. Transaction processed on {date}.",
        "Monthly utility statement. Account number {id}. Balance due: ${amount}. Please pay by the due date to avoid service interruption.",
        "Purchase Order invoice. Vendor billing statement. Items: laptops, servers, accessories. Total payable: ${amount} including state taxes."
    ],
    "Resume/CV": [
        "Resume of {name}. Education: BS in Computer Science from {uni}. Experience: Senior Software Engineer at {company} with skills in React, Python, Flask, Machine Learning.",
        "Curriculum Vitae for {name}. PhD researcher at {uni} in Artificial Intelligence. Published multiple papers in NLP. Python, PyTorch, Scikit-learn.",
        "Experienced Project Manager. Profile: {name}. Over 10 years leading agile development teams. Education: MBA from {uni}. Certifications: PMP, Scrum Master.",
        "{name} - Full Stack Developer. Portfolio and work experience at {company}. Technical skills: JavaScript, Node.js, SQL, AWS, Git, CI/CD. BS in IT.",
        "Data Scientist CV. {name}. Strong background in statistical analysis, predictive modeling, pandas, numpy, scikit-learn. Master of Science from {uni}."
    ],
    "Legal Contract": [
        "This Non-Disclosure Agreement (the 'Agreement') is entered into between party A and party B on this day. The parties agree to keep all proprietary information confidential.",
        "Lease Agreement contract. This rental contract is made between landlord and tenant. Terms of tenancy, monthly rent, and security deposit guidelines are outlined herein.",
        "Software Licensing Agreement. The licensor grants the licensee a non-exclusive, non-transferable license to use the proprietary software package under the terms stated.",
        "Employment Contract between {company} and the employee {name}. The position is full-time. Compensation, benefits, termination clauses, and duties are detailed.",
        "Partnership Agreement. The partners agree to establish a business venture. Distribution of profits, liability rules, management roles, and dissolution procedures are defined."
    ],
    "Scientific Paper": [
        "Abstract: In this paper, we propose a novel neural network architecture for NLP. Methodology: We evaluate our model on standard benchmarks. Results show state-of-the-art accuracy.",
        "Introduction: Deep Learning has transformed image classification. Discussion: We present empirical evidence demonstrating the efficiency of our algorithm. Figures and Tables included.",
        "Study of quantum computing limits. Section 2: Mathematical Framework. We define the state vectors and operators. References: Smith et al., 2024.",
        "An analysis of global climate patterns. Experimental setup: Data collected over a decade from global stations. Discussion: Findings suggest a correlation between carbon levels and temperatures.",
        "On the convergence of gradient descent algorithms in deep learning. Theorem 1: Convergence proof under standard assumptions. Empirical validation and computational complexity."
    ],
    "Business Proposal": [
        "Business proposal for project implementation. Objective: Upgrade internal IT architecture. Scope: Deployment of React-based frontends and Flask servers. Estimated Budget: ${amount}.",
        "Marketing Strategy Proposal. Target market analysis, competitor review, and budget forecast for the launch of our new product. Key performance indicators and schedule.",
        "Request for Proposal (RFP) response. {company} offers enterprise cloud solutions. Detailed cost estimation, implementation roadmap, and service level agreements (SLA).",
        "Executive Summary: A pitch for the expansion of operations. We outline market size, potential growth, strategic partnerships, and required financial investment.",
        "Project Proposal: Next-gen document management system. Features: automated OCR, ML categorization, search. Timeline: 6 months. Team members: {name}."
    ]
}

def generate_synthetic_dataset(num_samples_per_category=60):
    """Generates a larger synthetic dataset to train the models."""
    data = []
    preprocessor = TextPreprocessor()
    
    # Names, companies, dates, universities for variety
    names = ["John Smith", "Emily Davis", "Michael Chen", "Sarah Jenkins", "David Brown", "Anna Kovacs"]
    unis = ["Stanford University", "MIT", "UC Berkeley", "Oxford", "Harvard", "IIT"]
    companies = ["Google", "Microsoft", "Amazon", "TechCorp", "Innovate LLC", "Global Finance"]
    dates = ["2026-06-01", "2026-07-15", "2026-05-20", "2026-08-10"]
    
    for category, templates in SYNTHETIC_DATA_TEMPLATES.items():
        for i in range(num_samples_per_category):
            template = np.random.choice(templates)
            
            # Fill template variables
            text = template.format(
                id=np.random.randint(1000, 9999),
                amount=f"{np.random.randint(500, 15000):,}",
                date=np.random.choice(dates),
                name=np.random.choice(names),
                uni=np.random.choice(unis),
                company=np.random.choice(companies)
            )
            
            # Add some extra randomized keywords to increase text length and features
            if category == "Invoice/Financial":
                text += " invoice bill receipt transaction payment tax total charge account due outstanding bank swift"
            elif category == "Resume/CV":
                text += " resume curriculum vitae cv experience education skills software engineer languages developer github profile"
            elif category == "Legal Contract":
                text += " agreement contract clause indemnity liability signature jurisdiction breach hereinafter witnesseth hereby"
            elif category == "Scientific Paper":
                text += " abstract introduction methodology results discussion references study citation model dataset hypothesis dataset"
            elif category == "Business Proposal":
                text += " proposal client budget strategy project goal target roadmap schedule roi implementation solution"
                
            cleaned_text = preprocessor.clean_text(text)
            data.append({"text": text, "cleaned_text": cleaned_text, "category": category})
            
    return pd.DataFrame(data)

def train_and_save_models():
    """Trains Naive Bayes, SVM, and Logistic Regression models and saves them."""
    print("Generating synthetic dataset...")
    df = generate_synthetic_dataset(num_samples_per_category=100)
    
    # Save the dataframe for inspection or training dashboard
    os.makedirs("backend/ml_model/saved_models", exist_ok=True)
    df.to_csv("backend/ml_model/saved_models/training_dataset.csv", index=False)
    
    X = df['cleaned_text']
    y = df['category']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Vectorization
    print("Vectorizing text using TF-IDF...")
    vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    
    # Save Vectorizer
    with open("backend/ml_model/saved_models/vectorizer.pkl", "wb") as f:
        pickle.dump(vectorizer, f)
        
    models = {
        "Naive Bayes": MultinomialNB(alpha=0.1),
        "SVM": LinearSVC(C=1.0, random_state=42),
        "Logistic Regression": LogisticRegression(C=1.0, random_state=42, max_iter=200)
    }
    
    performance_summary = {}
    
    for name, model in models.items():
        print(f"Training {name} model...")
        model.fit(X_train_vec, y_train)
        
        # Save model
        filename = name.lower().replace(" ", "_")
        with open(f"backend/ml_model/saved_models/{filename}_model.pkl", "wb") as f:
            pickle.dump(model, f)
            
        # Evaluate
        preds = model.predict(X_test_vec)
        acc = accuracy_score(y_test, preds)
        
        # Calculate metrics
        precision, recall, f1, _ = precision_recall_fscore_support(y_test, preds, average='weighted', zero_division=0)
        
        # Category-wise performance
        cat_prec, cat_rec, cat_f1, _ = precision_recall_fscore_support(y_test, preds, labels=CATEGORIES, zero_division=0)
        category_metrics = {}
        for idx, cat in enumerate(CATEGORIES):
            category_metrics[cat] = {
                "precision": float(cat_prec[idx]),
                "recall": float(cat_rec[idx]),
                "f1": float(cat_f1[idx])
            }
        
        performance_summary[name] = {
            "accuracy": float(acc),
            "precision": float(precision),
            "recall": float(recall),
            "f1": float(f1),
            "category_metrics": category_metrics
        }
        print(f"{name} Accuracy: {acc:.4f}")
        
    # Save performance summary
    with open("backend/ml_model/saved_models/performance_summary.json", "w") as f:
        json.dump(performance_summary, f, indent=4)
        
    print("All models trained and saved successfully!")
    return performance_summary

if __name__ == "__main__":
    train_and_save_models()
