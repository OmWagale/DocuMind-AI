
def split_text_into_chunks(pages, chunk_size=500, overlap=100):
    """
    Split extracted PDF text into smaller overlapping chunks.

    Args:
        pages (list): Extracted PDF pages from pdf_processor.py.
        chunk_size (int): Maximum number of characters per chunk.
        overlap (int): Number of overlapping characters.

    Returns:
        list: Chunks containing text and original page numbers.
    """

    if chunk_size <= 0:
        raise ValueError("Chunk size must be greater than zero.")

    if overlap < 0 or overlap >= chunk_size:
        raise ValueError("Overlap must be non-negative and smaller than chunk size.")

    chunks = []

    for page_data in pages:
        text = page_data["text"]
        page_number = page_data["page"]

        start = 0

        while start < len(text):
            end = start + chunk_size

            chunk_text = text[start:end].strip()

            if chunk_text:
                chunks.append({
                    "text": chunk_text,
                    "page": page_number
                })

            start += chunk_size - overlap

    return chunks
