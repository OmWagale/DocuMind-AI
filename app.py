
import os

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename


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


# Function to validate uploaded files
def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


# PDF Upload API
@app.route("/upload", methods=["POST"])
def upload_pdf():

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

    return jsonify({
        "message": "PDF uploaded successfully!",
        "filename": filename
    }), 200


# Run Flask application
if __name__ == "__main__":
    app.run(debug=True)
