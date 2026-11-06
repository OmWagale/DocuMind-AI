
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
const composerArea = document.getElementById("composer-area");

// Navigation elements
const chatNavButton = document.getElementById("chat-nav-btn");
const quizNavButton = document.getElementById("quiz-nav-btn");
const breadcrumb = document.getElementById("breadcrumb");

// Quiz elements
const quizWorkspace = document.getElementById("quiz-workspace");
const quizSettings = document.getElementById("quiz-settings");
const quizContent = document.getElementById("quiz-content");
const quizResults = document.getElementById("quiz-results");
const quizQuestionCount = document.getElementById("quiz-question-count");
const quizDifficulty = document.getElementById("quiz-difficulty");
const generateQuizButton = document.getElementById("generate-quiz-btn");
const welcomeQuizButton = document.getElementById("welcome-quiz-btn");

let uploadedDocument = false;
let currentFilename = "";
let currentQuiz = [];
let selectedAnswers = {};


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


// Switch between chat and quiz workspaces
function showWorkspace(workspace) {
    const showQuiz = workspace === "quiz";

    welcomeScreen.hidden = true;
    chatMessages.hidden = showQuiz;
    quizWorkspace.hidden = !showQuiz;
    composerArea.hidden = showQuiz;

    chatNavButton.classList.toggle("active", !showQuiz);
    quizNavButton.classList.toggle("active", showQuiz);

    breadcrumb.innerHTML = showQuiz
        ? 'Workspace / <strong>Quiz Generator</strong>'
        : 'Workspace / <strong>Document Chat</strong>';

    if (showQuiz) {
        if (!uploadedDocument) {
            showToast("Please upload a PDF first.");
            showWorkspace("chat");
            welcomeScreen.hidden = true;
            return;
        }
    } else {
        questionInput.focus();
    }
}


// Reset quiz display
function resetQuiz() {
    currentQuiz = [];
    selectedAnswers = {};

    quizContent.replaceChildren();
    quizResults.replaceChildren();

    quizContent.hidden = true;
    quizResults.hidden = true;
    quizSettings.hidden = false;

    generateQuizButton.disabled = false;
    generateQuizButton.innerHTML = "<span>✦</span> Generate Quiz";
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

        // Show chat screen
        showWorkspace("chat");
        welcomeScreen.hidden = true;
        chatMessages.hidden = false;

        // Enable question input
        questionInput.disabled = false;
        sendButton.disabled = false;
        questionInput.placeholder = "Ask anything about your PDF...";

        // Reset previous quiz
        resetQuiz();

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
            `Your document "${data.filename}" has been uploaded successfully. You can now ask questions or generate a quiz about it.`,
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


// Generate quiz
generateQuizButton.addEventListener("click", async () => {
    if (!uploadedDocument) {
        showToast("Please upload a PDF first.");
        return;
    }

    const numQuestions = Number(quizQuestionCount.value);
    const difficulty = quizDifficulty.value;

    generateQuizButton.disabled = true;
    generateQuizButton.textContent = "Generating quiz...";

    quizContent.hidden = true;
    quizResults.hidden = true;

    try {
        const response = await fetch(`${API_BASE_URL}/generate-quiz`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                num_questions: numQuestions,
                difficulty: difficulty
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Quiz generation failed.");
        }

        currentQuiz = data.quiz.questions;
        selectedAnswers = {};

        if (!currentQuiz || currentQuiz.length === 0) {
            throw new Error("No questions were generated.");
        }

        quizSettings.hidden = true;

        renderQuiz();

        showToast("Your quiz is ready!");

    } catch (error) {
        showToast(error.message);
        console.error("Quiz generation error:", error);

        generateQuizButton.disabled = false;
        generateQuizButton.innerHTML = "<span>✦</span> Generate Quiz";
    }
});


// Render quiz questions
function renderQuiz() {
    quizContent.replaceChildren();

    const heading = document.createElement("div");
    heading.className = "quiz-progress";

    const title = document.createElement("h3");
    title.textContent = "Your Quiz";

    const description = document.createElement("p");
    description.textContent =
        `${currentQuiz.length} questions • ${quizDifficulty.value} difficulty`;

    heading.appendChild(title);
    heading.appendChild(description);

    quizContent.appendChild(heading);

    currentQuiz.forEach((question, index) => {
        const card = document.createElement("div");
        card.className = "quiz-question-card";

        const questionNumber = document.createElement("p");
        questionNumber.className = "quiz-question-number";
        questionNumber.textContent = `QUESTION ${index + 1}`;

        const questionText = document.createElement("h3");
        questionText.textContent = question.question;

        card.appendChild(questionNumber);
        card.appendChild(questionText);

        const optionsContainer = document.createElement("div");
        optionsContainer.className = "quiz-answer-options";

        Object.entries(question.options).forEach(([key, value]) => {
            const label = document.createElement("label");
            label.className = "quiz-answer-option";

            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = `question-${index}`;
            radio.value = key;

            radio.addEventListener("change", () => {
                selectedAnswers[index] = key;

                optionsContainer.querySelectorAll(
                    ".quiz-answer-option"
                ).forEach(option => {
                    option.classList.remove("selected");
                });

                label.classList.add("selected");
            });

            const optionKey = document.createElement("span");
            optionKey.className = "option-key";
            optionKey.textContent = key;

            const optionText = document.createElement("span");
            optionText.className = "option-text";
            optionText.textContent = value;

            label.appendChild(radio);
            label.appendChild(optionKey);
            label.appendChild(optionText);

            optionsContainer.appendChild(label);
        });

        card.appendChild(optionsContainer);
        quizContent.appendChild(card);
    });

    // Submit quiz button
    const submitButton = document.createElement("button");
    submitButton.type = "button";
    submitButton.className = "submit-quiz-btn";
    submitButton.textContent = "Submit Quiz";

    submitButton.addEventListener("click", submitQuiz);

    quizContent.appendChild(submitButton);

    quizContent.hidden = false;
    quizContent.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// Submit quiz and calculate score
function submitQuiz() {
    const unanswered = currentQuiz.length -
        Object.keys(selectedAnswers).length;

    if (unanswered > 0) {
        showToast(`Please answer all ${unanswered} remaining question(s).`);
        return;
    }

    let score = 0;

    currentQuiz.forEach((question, index) => {
        if (selectedAnswers[index] === question.correct_answer) {
            score++;
        }
    });

    displayQuizResults(score);

    quizContent.hidden = true;
    quizResults.hidden = false;

    quizResults.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// Display quiz results and explanations
function displayQuizResults(score) {
    quizResults.replaceChildren();

    const total = currentQuiz.length;
    const percentage = Math.round((score / total) * 100);

    const resultHeader = document.createElement("div");
    resultHeader.className = "quiz-result-header";

    const resultTitle = document.createElement("h2");
    resultTitle.textContent = "Quiz Completed!";

    const resultScore = document.createElement("div");
    resultScore.className = "quiz-score";
    resultScore.textContent = `${score}/${total}`;

    const resultPercentage = document.createElement("p");
    resultPercentage.textContent = `${percentage}% Score`;

    const resultMessage = document.createElement("p");

    if (percentage === 100) {
        resultMessage.textContent = "Perfect score! Excellent work!";
    } else if (percentage >= 70) {
        resultMessage.textContent = "Great job! You understand this document well.";
    } else if (percentage >= 40) {
        resultMessage.textContent = "Good effort! Review the explanations to improve.";
    } else {
        resultMessage.textContent = "Keep learning! Try reviewing the PDF again.";
    }

    resultHeader.appendChild(resultTitle);
    resultHeader.appendChild(resultScore);
    resultHeader.appendChild(resultPercentage);
    resultHeader.appendChild(resultMessage);

    quizResults.appendChild(resultHeader);

    // Display individual answer reviews
    const reviewHeading = document.createElement("h3");
    reviewHeading.className = "quiz-review-heading";
    reviewHeading.textContent = "Answer Review";

    quizResults.appendChild(reviewHeading);

    currentQuiz.forEach((question, index) => {
        const isCorrect =
            selectedAnswers[index] === question.correct_answer;

        const reviewCard = document.createElement("div");
        reviewCard.className = "quiz-review-card";

        const questionTitle = document.createElement("h4");
        questionTitle.textContent =
            `${index + 1}. ${question.question}`;

        const userAnswer = document.createElement("p");
        userAnswer.textContent =
            `Your answer: ${selectedAnswers[index]} - ${question.options[selectedAnswers[index]]}`;

        const correctAnswer = document.createElement("p");
        correctAnswer.textContent =
            `Correct answer: ${question.correct_answer} - ${question.options[question.correct_answer]}`;

        const explanation = document.createElement("p");
        explanation.textContent =
            `Explanation: ${question.explanation}`;

        const page = document.createElement("p");
        page.textContent = `Source: Page ${question.page}`;

        reviewCard.classList.add(
            isCorrect ? "correct-answer" : "incorrect-answer"
        );

        const status = document.createElement("span");
        status.className = "answer-status";
        status.textContent = isCorrect ? "Correct" : "Incorrect";

        reviewCard.appendChild(status);
        reviewCard.appendChild(questionTitle);
        reviewCard.appendChild(userAnswer);
        reviewCard.appendChild(correctAnswer);
        reviewCard.appendChild(explanation);
        reviewCard.appendChild(page);

        quizResults.appendChild(reviewCard);
    });

    // Generate another quiz button
    const retryButton = document.createElement("button");
    retryButton.type = "button";
    retryButton.className = "generate-quiz-btn";
    retryButton.textContent = "Generate Another Quiz";

    retryButton.addEventListener("click", () => {
        resetQuiz();

        quizResults.hidden = true;
        quizSettings.hidden = false;

        quizSettings.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });

    quizResults.appendChild(retryButton);
}


// Sidebar navigation
chatNavButton.addEventListener("click", () => {
    if (!uploadedDocument) {
        welcomeScreen.hidden = false;
        chatMessages.hidden = true;
        quizWorkspace.hidden = true;
        composerArea.hidden = false;
        return;
    }

    showWorkspace("chat");
});

quizNavButton.addEventListener("click", () => {
    showWorkspace("quiz");
});


// Welcome screen quiz button
welcomeQuizButton.addEventListener("click", () => {
    if (!uploadedDocument) {
        showToast("Please upload a PDF first.");
        return;
    }

    showWorkspace("quiz");
});


// Suggested questions
document.querySelectorAll(".suggestion-card[data-question]").forEach(button => {
    button.addEventListener("click", () => {
        questionInput.value = button.dataset.question;

        if (uploadedDocument) {
            showWorkspace("chat");
            chatForm.requestSubmit();
        } else {
            showToast("Upload a PDF first to ask questions.");
        }
    });
});


// New conversation
newChatButton.addEventListener("click", () => {
    chatMessages.replaceChildren();

    resetQuiz();

    if (uploadedDocument) {
        showWorkspace("chat");
        welcomeScreen.hidden = true;
        chatMessages.hidden = false;

        showToast(
            "Conversation cleared. Your uploaded PDF is still available."
        );
    } else {
        quizWorkspace.hidden = true;
        chatMessages.hidden = true;
        welcomeScreen.hidden = false;
        composerArea.hidden = false;

        chatNavButton.classList.add("active");
        quizNavButton.classList.remove("active");

        breadcrumb.innerHTML =
            'Workspace / <strong>Document Chat</strong>';

        showToast("Ready for a new conversation.");
    }
});


// Enter to send, Shift + Enter for a new line
questionInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        chatForm.requestSubmit();
    }
});
