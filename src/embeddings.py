
from sentence_transformers import SentenceTransformer


def load_embedding_model(model_name="all-MiniLM-L6-v2"):
    """
    Load the Sentence Transformer embedding model.

    Args:
        model_name (str): Name of the pretrained model.

    Returns:
        SentenceTransformer: Loaded embedding model.
    """

    model = SentenceTransformer(model_name)

    return model


def generate_embeddings(chunks, model):
    """
    Convert text chunks into numerical embeddings.

    Args:
        chunks (list): List of dictionaries containing text and page number.
        model (SentenceTransformer): Loaded embedding model.

    Returns:
        numpy.ndarray: Numerical embeddings for all chunks.
    """

    if not chunks:
        raise ValueError("No text chunks provided for embedding generation.")

    # Extract text from each chunk
    texts = []

    for chunk in chunks:
        if "text" not in chunk or not chunk["text"].strip():
            raise ValueError("Each chunk must contain non-empty text.")

        texts.append(chunk["text"])

    # Generate embeddings
    embeddings = model.encode(
        texts,
        convert_to_numpy=True,
        show_progress_bar=True
    )

    return embeddings
