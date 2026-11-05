
const API_BASE_URL = "http://127.0.0.1:5000";

// HTML elements
const pdfInput = document.getElementById("pdf-input");
const welcomeScreen = document.getElementById("welcome-screen");
const chatMessages = document.getElementById("chat-messages");
const chatForm = document.getElementById("chat-form");
const questionInput = document.getElementById("question-input");
const sendButton = document.getElementById("send-button");
const documentList = document.getElementById("document-list");
const documentCount = document.getElementById("document-count");
const toast = document.getElementById("toast");
const newChatButton = document.getElementById("new-chat-btn");

let uploadedDocument = false;
let currentFilename = "";

// Show notification
function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;

    setTimeout(() => {
        toast.hidden = true;
    }, 3000);
}

// Safely escape HTML
function escapeHTML(text) {
    return String(text).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Convert basic Markdown into formatted HTML
function formatMarkdown(text) {
    let html = escapeHTML(text);

    // Headings
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

    // Bold and italic
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

    // Unordered lists
    html = html.replace(/^\s*[-*] (.+)$/gm, "<li>$1</li>");
    html = html.replace(/((?:<li>.*?<\/li>\s*)+)/gs, "<ul>$1</ul>");

    // Line breaks
    html = html.replace(/\n/g, "<br>");

    return html;
}

// Add message to chat
function addMessage(text, sender) {
    const message = document.createElement("div");
    message.className = `message ${sender}`;

    const content = document.createElement("div");
    content.className = "message-content";

    if (sender === "assistant") {
        content.innerHTML = formatMarkdown(text);
    } else {
        content.textContent = text;
    }

    message.appendChild(content);
    chatMessages.appendChild(message);

    chatMessages.scrollTop = chatMessages.scrollHeight;

    return message;
}

// Create animated loading message
function addLoadingMessage() {
    const message = document.createElement("div");
    message.className = "message assistant";

    const content = document.createElement("div");
    content.className = "message-content";

    const loadingDots = document.createElement("div");
    loadingDots.className = "loading-dots";

    for (let i = 0; i < 3; i++) {
        const dot = document.createElement("span");
        loadingDots.appendChild(dot);
    }

    content.appendChild(loadingDots);
    message.appendChild(content);
    chatMessages.appendChild(message);

    chatMessages.scrollTop = chatMessages.scrollHeight;

    return message;
}

// Display source references
function addSources(sources, message) {
    if (!sources || sources.length === 0) return;

    const sourceContainer = document.createElement("div");
    sourceContainer.className = "source-container";

    const heading = document.createElement("strong");
    heading.textContent = "Sources";
    sourceContainer.appendChild(heading);

    const pages = [...new Set(
        sources.map(source => source.page)
    )];

    pages.forEach(page => {
        const source = document.createElement("p");
        source.textContent = `Page ${page}`;
        sourceContainer.appendChild(source);
    });

    message.appendChild(sourceContainer);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Upload PDF
pdfInput.addEventListener("change", async () => {
    const file = pdfInput.files[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
        showToast("Please select a PDF file.");
        pdfInput.value = "";
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    showToast("Uploading and processing PDF...");

    try {
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "PDF upload failed.");
        }

        uploadedDocument = true;
        currentFilename = data.filename;

        // Switch to chat screen
        welcomeScreen.hidden = true;
        chatMessages.hidden = false;

        // Enable question input
        questionInput.disabled = false;
        sendButton.disabled = false;
        questionInput.placeholder = "Ask anything about your PDF...";

        // Update document list
        documentCount.textContent = "1";
        documentList.replaceChildren();

        const documentItem = document.createElement("div");
        documentItem.className = "sidebar-item";

        const documentName = document.createElement("span");
        documentName.textContent = `▤ ${data.filename}`;

        documentItem.appendChild(documentName);
        documentList.appendChild(documentItem);

        addMessage(
            `Your document "${data.filename}" has been uploaded successfully. You can now ask questions about it.`,
            "assistant"
        );

        showToast("PDF processed successfully!");

    } catch (error) {
        showToast(error.message);
        console.error("Upload error:", error);

    } finally {
        pdfInput.value = "";
    }
});

// Ask question
chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const question = questionInput.value.trim();

    if (!question) return;

    if (!uploadedDocument) {
        showToast("Please upload a PDF first.");
        return;
    }

    // Display user's question
    addMessage(question, "user");

    questionInput.value = "";
    sendButton.disabled = true;
    questionInput.disabled = true;

    // Show animated loading indicator
    const loadingMessage = addLoadingMessage();

    try {
        const response = await fetch(`${API_BASE_URL}/ask`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                question: question
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unable to get an answer.");
        }

        // Display formatted answer
        loadingMessage.querySelector(".message-content").innerHTML =
            formatMarkdown(data.answer);

        // Display source pages
        addSources(data.sources, loadingMessage);

    } catch (error) {
        loadingMessage.querySelector(".message-content").textContent =
            `Error: ${error.message}`;

        console.error("Question error:", error);

    } finally {
        sendButton.disabled = false;
        questionInput.disabled = false;
        questionInput.focus();
    }
});

// Suggested questions
document.querySelectorAll(".suggestion-card").forEach(button => {
    button.addEventListener("click", () => {
        questionInput.value = button.dataset.question;

        if (uploadedDocument) {
            chatForm.requestSubmit();
        } else {
            showToast("Upload a PDF first to ask questions.");
        }
    });
});

// New conversation
newChatButton.addEventListener("click", () => {
    chatMessages.replaceChildren();
    chatMessages.hidden = true;
    welcomeScreen.hidden = false;

    showToast(
        "Conversation cleared. Your uploaded PDF is still available."
    );
});

// Enter to send, Shift + Enter for a new line
questionInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        chatForm.requestSubmit();
    }
});
