
import os

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

from src.pdf_processor import extract_text_from_pdf
from src.chunking import split_text_into_chunks
from src.embeddings import load_embedding_model, generate_embeddings
from src.retriever import build_faiss_index, search_similar_chunks
from src.qa_chain import generate_answer


# Initialize Flask application
app = Flask(__name__)

# Enable CORS
CORS(app)


# Configure PDF upload folder
UPLOAD_FOLDER = "uploads"

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Create upload folder if it does not exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Allow only PDF files
ALLOWED_EXTENSIONS = {"pdf"}


# Load the embedding model once
print("Loading embedding model...")
embedding_model = load_embedding_model()
print("Embedding model loaded successfully!")


# Store the currently uploaded PDF's data
document_index = None
document_chunks = None


# Function to validate uploaded files
def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


# Process uploaded PDF
def process_pdf(file_path):
    """
    Extract, chunk, embed, and index an uploaded PDF.
    """

    # Step 1: Extract text
    pages = extract_text_from_pdf(file_path)

    # Step 2: Split text into chunks
    chunks = split_text_into_chunks(
        pages,
        chunk_size=500,
        overlap=100
    )

    # Step 3: Generate embeddings
    embeddings = generate_embeddings(
        chunks,
        embedding_model
    )

    # Step 4: Build FAISS index
    index = build_faiss_index(embeddings)

    return index, chunks


# PDF Upload API
@app.route("/upload", methods=["POST"])
def upload_pdf():

    global document_index, document_chunks

    # Check whether a file was provided
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded."}), 400

    file = request.files["file"]

    # Check whether a file was selected
    if file.filename == "":
        return jsonify({"error": "No file selected."}), 400

    # Validate file extension
    if not allowed_file(file.filename):
        return jsonify({"error": "Only PDF files are allowed."}), 400

    # Secure the filename
    filename = secure_filename(file.filename)

    if not filename:
        return jsonify({"error": "Invalid filename."}), 400

    # Save uploaded PDF
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(file_path)

    # Process the uploaded PDF
    try:
        new_index, new_chunks = process_pdf(file_path)

        document_index = new_index
        document_chunks = new_chunks

    except Exception as error:
        return jsonify({
            "error": f"PDF processing failed: {str(error)}"
        }), 500

    return jsonify({
        "message": "PDF uploaded and processed successfully!",
        "filename": filename,
        "total_chunks": len(document_chunks)
    }), 200

# Question Answering API
@app.route("/ask", methods=["POST"])
def ask_question():

    # Check whether a PDF has been uploaded
    if document_index is None or document_chunks is None:
        return jsonify({
            "error": "Please upload a PDF before asking questions."
        }), 400

    # Get question from request
    data = request.get_json()

    if not data or "question" not in data:
        return jsonify({
            "error": "Please provide a question."
        }), 400

    query = data["question"].strip()

    if not query:
        return jsonify({
            "error": "Question cannot be empty."
        }), 400

    try:
        # Generate embedding for the question
        query_embedding = embedding_model.encode(
            [query],
            convert_to_numpy=True
        )

        # Retrieve relevant chunks
        retrieved_chunks = search_similar_chunks(
            query_embedding,
            document_index,
            document_chunks,
            top_k=3
        )

        # Generate answer using Gemini
        answer = generate_answer(
            query,
            retrieved_chunks
        )

        return jsonify({
            "question": query,
            "answer": answer,
            "sources": [
                {"page": chunk["page"], "text": chunk["text"]}
                for chunk in retrieved_chunks
            ]
        }), 200

    except Exception as error:
        return jsonify({
            "error": f"Unable to generate answer: {str(error)}"
        }), 500
# Run Flask application
if __name__ == "__main__":
    app.run(debug=True)
