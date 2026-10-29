
import fitz
from pathlib import Path


def extract_text_from_pdf(pdf_path):
    """
    Extract text from a PDF while preserving original page numbers.

    Args:
        pdf_path (str): Path to the PDF file.

    Returns:
        list: A list of dictionaries containing page numbers and text.

    Raises:
        FileNotFoundError: If the PDF file does not exist.
        ValueError: If the file is not a valid or readable PDF.
    """

    pdf_path = Path(pdf_path)

    # Check whether the file exists
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")

    # Check whether the path points to a file
    if not pdf_path.is_file():
        raise ValueError(f"The provided path is not a file: {pdf_path}")

    # Check the file extension
    if pdf_path.suffix.lower() != ".pdf":
        raise ValueError("The provided file must have a .pdf extension.")

    pages = []

    try:
        # Open the PDF document
        with fitz.open(str(pdf_path)) as pdf:

            # Check whether the PDF contains pages
            if pdf.page_count == 0:
                raise ValueError("The PDF contains no pages.")

            # Process each page, starting page numbering from 1
            for page_number, page in enumerate(pdf, start=1):

                # Extract text and remove surrounding whitespace
                text = page.get_text("text").strip()

                # Store only pages containing extractable text
                if text:
                    pages.append({
                        "page": page_number,
                        "text": text
                    })

    except (FileNotFoundError, ValueError):
        raise
    except Exception as error:
        raise ValueError(
            f"Unable to read the PDF file: {error}"
        ) from error

    # Return the extracted page information
    if not pages:
        raise ValueError(
            "No extractable text found in the PDF. "
            "The document may be scanned or image-based and may require OCR."
        )

    return pages
