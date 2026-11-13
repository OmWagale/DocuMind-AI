# 🧠 DocuMind AI
### AI-Powered PDF Question Answering Assistant using Retrieval-Augmented Generation

DocuMind AI is an intelligent PDF question-answering application that allows users to upload a PDF, ask questions in natural language, and receive context-aware answers grounded in the document's content.

Built using **Retrieval-Augmented Generation (RAG)**, semantic embeddings, FAISS vector search, and Google's Gemini API, DocuMind AI retrieves relevant document passages before generating answers. It also provides source references and AI-generated quizzes to make document understanding easier.

---

## ✨ Key Features

- **PDF Upload:** Upload PDF documents through a clean, interactive web interface.
- **Text Extraction:** Extract document text and page information using PyMuPDF.
- **Intelligent Chunking:** Split extracted text into smaller overlapping chunks while preserving context.
- **Semantic Search:** Convert document chunks into embeddings using Sentence Transformers.
- **Vector Retrieval:** Use FAISS to retrieve the most relevant chunks for a user's question.
- **AI-Powered Answers:** Generate context-aware responses using Google's Gemini API.
- **Source References:** Display relevant source passages grouped by page.
- **AI Quiz Generation:** Generate multiple-choice quizzes from uploaded document content.
- **Interactive Quizzes:** Select answers, calculate scores, and view correct answers with explanations.
- **Dark-Themed Interface:** A modern chat-based interface for interacting with documents.

---

## ⚙️ Technology Stack

| Component | Technology |
|---|---|
| Backend | Python, Flask |
| Frontend | HTML, CSS, JavaScript |
| PDF Processing | PyMuPDF |
| Embedding Model | Sentence Transformers |
| Embedding Model Name | `all-MiniLM-L6-v2` |
| Vector Search | FAISS |
| Generative AI | Google Gemini API |
| Environment Management | Python `venv`, `python-dotenv` |

---

## 🏗️ System Architecture

DocuMind AI follows a Retrieval-Augmented Generation workflow.

### Document Processing Pipeline

1. User uploads a PDF.
2. PyMuPDF extracts text and page information.
3. Extracted text is divided into overlapping chunks.
4. Sentence Transformers converts chunks into numerical embeddings.
5. FAISS stores the embeddings for similarity-based retrieval.

### Question Answering Pipeline

1. User submits a question.
2. The question is converted into an embedding.
3. FAISS retrieves the most relevant document chunks.
4. Retrieved context and the question are passed to Gemini.
5. Gemini generates an answer grounded in the retrieved content.
6. The application displays the answer and supporting source passages.

### RAG Workflow

```text
             PDF Upload
                  |
                  v
          Text Extraction
                  |
                  v
           Text Chunking
                  |
                  v
         Generate Embeddings
                  |
                  v
           FAISS Index
                  |
                  |
User Question ----+
       |
       v
Question Embedding
       |
       v
Semantic Retrieval
       |
       v
Relevant Context
       |
       v
     Gemini API
       |
       v
   AI-Generated Answer
       |
       v
 Answer + Source Pages
```

---

## 📁 Project Structure

```text
DocuMind-AI/
│
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── script.js
│
├── src/
│   ├── pdf_processor.py
│   ├── chunking.py
│   ├── embeddings.py
│   ├── retriever.py
│   └── qa_chain.py
│
├── app.py
├── requirements.txt
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

Follow these steps to run DocuMind AI locally.

### 1. Clone the Repository

```bash
git clone https://github.com/OmWagale/DocuMind-AI.git
```

### 2. Navigate to the Project

```bash
cd DocuMind-AI
```

### 3. Create a Virtual Environment

```bash
python -m venv venv
```

### 4. Activate the Environment

**Windows PowerShell:**

```powershell
.\venv\Scripts\Activate.ps1
```

### 5. Install Dependencies

```bash
pip install -r requirements.txt
```

### 6. Configure the Gemini API Key

Create a `.env` file in the project root directory:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Get an API key from [Google AI Studio](https://aistudio.google.com/).

### 7. Run the Application

```bash
python app.py
```

Open the application in your browser at:

```text
http://127.0.0.1:5000
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/upload` | Upload and process a PDF |
| POST | `/ask` | Ask questions about the uploaded document |
| POST | `/generate-quiz` | Generate an MCQ quiz from document content |

---

## 🧪 Retrieval Evaluation

The retrieval component can be evaluated using manually identified relevant document chunks and Recall@K.

Recall@K measures how many relevant chunks are retrieved within the top K results.

This helps assess the quality of semantic retrieval independently of answer generation.

---

## 🔮 Future Improvements

- Multi-PDF knowledge base and cross-document question answering.
- Conversation history and persistent document storage.
- Improved retrieval accuracy through hybrid search and reranking.
- Downloadable quiz reports and performance analytics.
- Deployment to a cloud platform.

---

## 👨‍💻 Author

**Om Wagale**

Computer Engineering Student | AI & Machine Learning Enthusiast

- GitHub: [OmWagale](https://github.com/OmWagale)
- Project Repository: [DocuMind-AI](https://github.com/OmWagale/DocuMind-AI)

---

*DocuMind AI — Turning documents into interactive knowledge.*