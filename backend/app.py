import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

from backend.database import Database
from backend.utils.extractor import TextExtractor
from backend.ml_model.predict import classifier
from backend.ml_model.train import train_and_save_models

app = Flask(__name__)
# Enable CORS for all routes, allowing React app on local port to communicate with Flask
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size

# Initialize database
Database.initialize()

# Check and train models on startup if they don't exist
def ensure_models_trained():
    if not classifier.is_trained():
        print("Models not found or vectorizer missing! Initiating auto-training on startup...")
        try:
            train_and_save_models()
            # Reload classifier resources
            classifier.load_resources()
            print("Auto-training finished successfully.")
        except Exception as e:
            print(f"Error during startup model training: {e}")

ensure_models_trained()

@app.route('/api/status', methods=['GET'])
def get_status():
    """Checks the status of the ML models and DB."""
    return jsonify({
        "success": True,
        "models_trained": classifier.is_trained(),
        "available_models": list(classifier.models.keys()) if classifier.is_trained() else [],
        "database_status": "Connected"
    })

@app.route('/api/model-info', methods=['GET'])
def get_model_info():
    """Returns training performance metrics for all algorithms."""
    summary_path = "backend/ml_model/saved_models/performance_summary.json"
    if not os.path.exists(summary_path):
        return jsonify({
            "success": False,
            "error": "Performance summary not found. Models may not be trained."
        }), 400
        
    try:
        with open(summary_path, 'r') as f:
            summary = json.load(f)
        return jsonify({
            "success": True,
            "performance": summary
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to load performance metrics: {str(e)}"
        }), 500

@app.route('/api/train', methods=['POST'])
def trigger_retraining():
    """Triggers manual training of the machine learning model."""
    try:
        summary = train_and_save_models()
        classifier.load_resources()
        return jsonify({
            "success": True,
            "message": "Model retrained and loaded successfully!",
            "performance": summary
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to train models: {str(e)}"
        }), 500

@app.route('/api/classify-text', methods=['POST'])
def classify_text():
    """Classifies custom input text directly."""
    data = request.json or {}
    text = data.get("text", "")
    model_name = data.get("model", "Logistic Regression")
    
    if not text.strip():
        return jsonify({"success": False, "error": "No text provided"}), 400
        
    if not classifier.is_trained():
        return jsonify({"success": False, "error": "ML models are not trained yet"}), 500
        
    result = classifier.predict(text, model_name)
    if not result.get("success"):
        return jsonify(result), 400
        
    # Save the classification to history
    doc_id = Database.save_document(
        filename="Manual Text Input",
        file_size=len(text),
        mime_type="text/plain",
        text=text,
        prediction_result=result
    )
    
    result["id"] = doc_id
    return jsonify(result)

@app.route('/api/upload', methods=['POST'])
def upload_document():
    """Handles PDF, DOCX, Image uploads, extracts text, and predicts category."""
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file part in the request"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "No selected file"}), 400
        
    model_name = request.form.get("model", "Logistic Regression")
    
    try:
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        file_size = os.path.getsize(file_path)
        mime_type = file.content_type
        
        # 1. Extract text
        print(f"Extracting text from {filename}...")
        extracted_text = TextExtractor.extract_text(file_path)
        
        if not extracted_text.strip():
            # Clean up uploaded file
            os.remove(file_path)
            return jsonify({
                "success": False,
                "error": "No readable text could be extracted from this document. Please ensure it is not blank or password protected."
            }), 400
            
        # 2. Run Classification
        print(f"Classifying extracted text using model: {model_name}...")
        result = classifier.predict(extracted_text, model_name)
        
        if not result.get("success"):
            os.remove(file_path)
            return jsonify(result), 400
            
        # 3. Save to database
        doc_id = Database.save_document(
            filename=filename,
            file_size=file_size,
            mime_type=mime_type,
            text=extracted_text,
            prediction_result=result
        )
        
        result["id"] = doc_id
        
        # Clean up file after successful extraction to save space, 
        # since we already stored extracted text in sqlite DB.
        os.remove(file_path)
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Exception during upload handling: {e}")
        return jsonify({"success": False, "error": f"An error occurred: {str(e)}"}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    """Retrieves list of all past classifications with search filters."""
    category = request.args.get("category")
    search = request.args.get("search")
    limit = int(request.args.get("limit", 50))
    
    try:
        docs = Database.get_all_documents(limit=limit, category=category, search=search)
        return jsonify({
            "success": True,
            "documents": docs
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/documents/<int:doc_id>', methods=['DELETE'])
def delete_document(doc_id):
    """Deletes a document from the database by ID."""
    try:
        Database.delete_document(doc_id)
        return jsonify({
            "success": True,
            "message": "Document record deleted successfully"
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Returns analytics data for dashboard charts."""
    try:
        stats = Database.get_statistics()
        return jsonify({
            "success": True,
            "stats": stats
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
