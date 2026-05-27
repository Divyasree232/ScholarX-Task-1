import re
import string
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

# Automatically download required NLTK datasets if not present
def download_nltk_resources():
    resources = ['punkt', 'stopwords', 'wordnet', 'omw-1.4']
    for resource in resources:
        try:
            nltk.data.find(f'corpora/{resource}' if resource in ['stopwords', 'wordnet', 'omw-1.4'] else f'tokenizers/{resource}')
        except LookupError:
            try:
                nltk.download(resource, quiet=True)
            except Exception as e:
                print(f"Error downloading NLTK resource {resource}: {e}")

# Call it once at import
download_nltk_resources()

class TextPreprocessor:
    def __init__(self):
        try:
            self.stop_words = set(stopwords.words('english'))
        except Exception:
            self.stop_words = set()
        self.lemmatizer = WordNetLemmatizer()

    def clean_text(self, text):
        """
        Preprocesses document text:
        1. Lowercasing
        2. Removing punctuation and digits
        3. Tokenization
        4. Stopword removal
        5. Lemmatization
        """
        if not text or not isinstance(text, str):
            return ""

        # 1. Lowercase
        text = text.lower()

        # Remove line breaks and extra spaces
        text = re.sub(r'\s+', ' ', text)

        # Remove email addresses, URLs
        text = re.sub(r'\S+@\S+', '', text)
        text = re.sub(r'http\S+|www\S+|https\S+', '', text)

        # Keep only letters
        text = re.sub(r'[^a-zA-Z\s]', '', text)

        # 3. Tokenization
        try:
            tokens = word_tokenize(text)
        except Exception:
            # Fallback if NLTK tokenizer fails
            tokens = text.split()

        # 4. Stopword removal & 5. Lemmatization
        cleaned_tokens = []
        for word in tokens:
            if word not in self.stop_words and len(word) > 2:
                try:
                    lemmatized = self.lemmatizer.lemmatize(word)
                except Exception:
                    lemmatized = word
                cleaned_tokens.append(lemmatized)

        return " ".join(cleaned_tokens)
