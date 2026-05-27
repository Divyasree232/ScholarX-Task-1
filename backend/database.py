import sqlite3
import os
import json
from datetime import datetime

DATABASE_FILE = "backend/documents.db"

class Database:
    @staticmethod
    def get_connection():
        """Establishes connection to the SQLite database."""
        conn = sqlite3.connect(DATABASE_FILE)
        conn.row_factory = sqlite3.Row
        return conn

    @classmethod
    def initialize(cls):
        """Initializes database tables."""
        conn = cls.get_connection()
        cursor = conn.cursor()
        
        # Create documents table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                file_size INTEGER,
                mime_type TEXT,
                extracted_text TEXT,
                predicted_category TEXT,
                confidence REAL,
                model_used TEXT,
                all_predictions TEXT, -- JSON string of other models
                keywords TEXT,        -- JSON string of extracted keywords
                confidence_distribution TEXT, -- JSON string
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        conn.close()

    @classmethod
    def save_document(cls, filename, file_size, mime_type, text, prediction_result):
        """Saves classification result to history."""
        cls.initialize()
        conn = cls.get_connection()
        cursor = conn.cursor()
        
        all_preds_json = json.dumps(prediction_result.get("all_predictions", {}))
        keywords_json = json.dumps(prediction_result.get("keywords", []))
        dist_json = json.dumps(prediction_result.get("confidence_distribution", []))
        
        cursor.execute("""
            INSERT INTO documents (
                filename, file_size, mime_type, extracted_text, 
                predicted_category, confidence, model_used, 
                all_predictions, keywords, confidence_distribution
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            filename,
            file_size,
            mime_type,
            text,
            prediction_result.get("prediction"),
            prediction_result.get("confidence"),
            prediction_result.get("model_used"),
            all_preds_json,
            keywords_json,
            dist_json
        ))
        
        inserted_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return inserted_id

    @classmethod
    def get_all_documents(cls, limit=50, category=None, search=None):
        """Retrieves list of classified documents with optional filters."""
        cls.initialize()
        conn = cls.get_connection()
        cursor = conn.cursor()
        
        query = "SELECT * FROM documents WHERE 1=1"
        params = []
        
        if category:
            query += " AND predicted_category = ?"
            params.append(category)
            
        if search:
            query += " AND (filename LIKE ? OR extracted_text LIKE ?)"
            params.append(f"%{search}%")
            params.append(f"%{search}%")
            
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        documents = []
        for row in rows:
            doc = dict(row)
            # Parse JSON fields
            doc["all_predictions"] = json.loads(doc["all_predictions"] or "{}")
            doc["keywords"] = json.loads(doc["keywords"] or "[]")
            doc["confidence_distribution"] = json.loads(doc["confidence_distribution"] or "[]")
            documents.append(doc)
            
        conn.close()
        return documents

    @classmethod
    def delete_document(cls, doc_id):
        """Deletes a document from the database by ID."""
        cls.initialize()
        conn = cls.get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        conn.commit()
        conn.close()

    @classmethod
    def get_statistics(cls):
        """Generates analytical data for the dashboard."""
        cls.initialize()
        conn = cls.get_connection()
        cursor = conn.cursor()
        
        # 1. Total documents classified
        cursor.execute("SELECT COUNT(*) FROM documents")
        total_docs = cursor.fetchone()[0]
        
        # 2. Category distribution
        cursor.execute("""
            SELECT predicted_category, COUNT(*) as count, AVG(confidence) as avg_confidence 
            FROM documents 
            GROUP BY predicted_category
        """)
        categories = []
        for row in cursor.fetchall():
            categories.append({
                "category": row["predicted_category"],
                "count": row["count"],
                "avg_confidence": round(row["avg_confidence"], 4)
            })
            
        # 3. Model utilization count
        cursor.execute("SELECT model_used, COUNT(*) as count FROM documents GROUP BY model_used")
        models = {row["model_used"]: row["count"] for row in cursor.fetchall()}
        
        # 4. Monthly uploads trend (last 7 days or weeks)
        cursor.execute("""
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM documents 
            GROUP BY DATE(created_at) 
            ORDER BY date DESC 
            LIMIT 7
        """)
        trends = [{"date": row["date"], "count": row["count"]} for row in cursor.fetchall()]
        # Reverse to chronologically ascending
        trends.reverse()
        
        conn.close()
        return {
            "total_documents": total_docs,
            "category_distribution": categories,
            "model_utilization": models,
            "upload_trends": trends
        }
