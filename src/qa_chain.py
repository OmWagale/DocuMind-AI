
import os
import time
import json

from google import genai
from dotenv import load_dotenv


# Load environment variables
load_dotenv()


# Get Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError(
        "GEMINI_API_KEY not found. Please check your .env file."
    )


# Initialize Gemini client
client = genai.Client(api_key=GEMINI_API_KEY)


def generate_answer(query, retrieved_chunks):
    """
    Generate an answer using Gemini based on retrieved PDF content.
    """

    if not retrieved_chunks:
        return "I could not find relevant information in the uploaded PDF."

    # Combine retrieved chunks into context
    context = ""

    for chunk in retrieved_chunks:
        context += f"\nPage {chunk['page']}:\n{chunk['text']}\n"

    # Prepare prompt
    prompt = f"""
    You are a helpful PDF question-answering assistant.

    Answer the user's question using only the information provided
    in the context below.

    If the answer is not available in the context, clearly say that
    the information is not available in the uploaded PDF.

    Context:
    {context}

    User Question:
    {query}

    Provide a clear and concise answer.
    """

    # Generate answer with automatic retry
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-3.5-flash",
                contents=prompt
            )

            return response.text

        except Exception as error:
            error_message = str(error)

            # Retry temporary server or rate-limit errors
            if (
                ("503" in error_message or "429" in error_message)
                and attempt < 2
            ):
                wait_time = 2 ** (attempt + 1)

                print(
                    f"Gemini temporarily unavailable. "
                    f"Retrying in {wait_time} seconds "
                    f"({attempt + 1}/3)..."
                )

                time.sleep(wait_time)

            else:
                raise

    return "Unable to generate an answer. Please try again later."


def generate_quiz(retrieved_chunks, num_questions=5, difficulty="Medium"):
    """
    Generate multiple-choice quiz questions using retrieved PDF content.
    """

    if not retrieved_chunks:
        raise ValueError("No PDF content available to generate a quiz.")

    # Validate difficulty
    difficulty = difficulty.capitalize()

    if difficulty not in ["Easy", "Medium", "Hard"]:
        raise ValueError("Difficulty must be Easy, Medium, or Hard.")

    # Validate number of questions
    num_questions = int(num_questions)

    if num_questions < 1 or num_questions > 20:
        raise ValueError(
            "Number of questions must be between 1 and 20."
        )

    # Combine retrieved PDF chunks
    context = ""

    for chunk in retrieved_chunks:
        context += f"\nPage {chunk['page']}:\n{chunk['text']}\n"

    # Prepare quiz generation prompt
    prompt = f"""
    You are an expert quiz generator.

    Generate exactly {num_questions} multiple-choice questions
    using ONLY the information in the PDF content below.

    Difficulty level: {difficulty}

    Rules:
    1. Each question must have exactly four options.
    2. Only one option must be correct.
    3. Questions must be based strictly on the PDF content.
    4. Do not use outside knowledge.
    5. Provide a short explanation for every correct answer.
    6. Mention the PDF page number from which the question was derived.
    7. Make questions appropriate for the requested difficulty.

    Return ONLY valid JSON in this exact structure:

    {{
        "questions": [
            {{
                "question": "Question text",
                "options": {{
                    "A": "Option A",
                    "B": "Option B",
                    "C": "Option C",
                    "D": "Option D"
                }},
                "correct_answer": "A",
                "explanation": "Explanation based on the PDF",
                "page": 1
            }}
        ]
    }}

    PDF Content:
    {context}
    """

    # Generate quiz with automatic retry
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-3.5-flash",
                contents=prompt
            )

            result = response.text.strip()

            # Remove Markdown code fences if Gemini adds them
            if result.startswith("```"):
                result = result.split("\n", 1)[1]
                result = result.rsplit("```", 1)[0].strip()

            quiz_data = json.loads(result)

            if "questions" not in quiz_data:
                raise ValueError(
                    "Invalid quiz response from Gemini."
                )

            return quiz_data

        except Exception as error:
            error_message = str(error)

            # Retry temporary server or rate-limit errors
            if (
                ("503" in error_message or "429" in error_message)
                and attempt < 2
            ):
                wait_time = 2 ** (attempt + 1)

                print(
                    f"Gemini temporarily unavailable. "
                    f"Retrying in {wait_time} seconds "
                    f"({attempt + 1}/3)..."
                )

                time.sleep(wait_time)

            else:
                raise

    raise RuntimeError(
        "Unable to generate quiz. Please try again later."
    )
