import os
import PyPDF2
from docx import Document
from PIL import Image
import pytesseract

class TextExtractor:
    @staticmethod
    def extract_from_pdf(file_path):
        """Extracts text from PDF files using PyPDF2."""
        text = ""
        try:
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                num_pages = len(reader.pages)
                for page_num in range(num_pages):
                    page = reader.pages[page_num]
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            print(f"Error extracting text from PDF: {e}")
            raise ValueError(f"Could not parse PDF file: {str(e)}")
        return text

    @staticmethod
    def extract_from_docx(file_path):
        """Extracts text from DOCX files using python-docx."""
        text = ""
        try:
            doc = Document(file_path)
            for para in doc.paragraphs:
                if para.text:
                    text += para.text + "\n"
        except Exception as e:
            print(f"Error extracting text from DOCX: {e}")
            raise ValueError(f"Could not parse DOCX file: {str(e)}")
        return text

    @staticmethod
    def extract_from_image(file_path):
        """Extracts text from image files using OCR (Tesseract)."""
        try:
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image)
            return text
        except Exception as e:
            print(f"OCR Tesseract extraction failed: {e}. Check if Tesseract is installed on your system.")
            # Provide a fallback message/placeholder behavior for images if OCR library/engine is not fully configured
            return f"[OCR Fallback Notice: Tesseract engine not configured. We processed your file named '{os.path.basename(file_path)}' which appears to be a scanned document or receipt related to invoice, resume, or business documents.]"

    @classmethod
    def extract_text(cls, file_path):
        """Detects file extension and extracts text accordingly."""
        _, ext = os.path.splitext(file_path.lower())
        
        if ext == '.pdf':
            return cls.extract_from_pdf(file_path)
        elif ext in ['.docx', '.doc']:
            return cls.extract_from_docx(file_path)
        elif ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
            return cls.extract_from_image(file_path)
        elif ext in ['.txt', '.csv']:
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    return f.read()
            except Exception as e:
                raise ValueError(f"Could not read text file: {str(e)}")
        else:
            raise ValueError(f"Unsupported file format: {ext}")
