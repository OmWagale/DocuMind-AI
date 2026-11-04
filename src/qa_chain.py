
import os
import time

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
