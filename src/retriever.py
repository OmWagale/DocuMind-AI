import faiss
import numpy as np
def build_faiss_index(embeddings):
    """
    Build a FAISS index using the generated embeddings.

    Args:
        embeddings (numpy.ndarray): Embedding vectors of text chunks.

    Returns:
        faiss.IndexFlatL2: FAISS index containing the embeddings.
    """

    # Convert embeddings into float32 format
    embeddings = np.array(embeddings).astype("float32")

    # Get the embedding dimension
    dimension = embeddings.shape[1]

    # Create a FAISS index using L2 distance
    index = faiss.IndexFlatL2(dimension)

    # Add embeddings to the index
    index.add(embeddings)

    return index
def search_similar_chunks(query_embedding, index, chunks, top_k=3):
    """
    Retrieve the most relevant text chunks for a given query.

    Args:
        query_embedding (numpy.ndarray): Embedding of the user's question.
        index: FAISS index containing document embeddings.
        chunks (list): Original text chunks with page numbers.
        top_k (int): Number of relevant chunks to retrieve.

    Returns:
        list: Retrieved chunks with their similarity distances.
    """

    # Convert query embedding into float32 format
    query_embedding = np.array(query_embedding).astype("float32")

    # Reshape query embedding for FAISS
    query_embedding = query_embedding.reshape(1, -1)

    # Search for the nearest vectors
    distances, indices = index.search(query_embedding, top_k)

    results = []

    # Retrieve the corresponding text chunks
    for distance, chunk_index in zip(distances[0], indices[0]):

        if chunk_index == -1:
            continue

        results.append({
            "text": chunks[chunk_index]["text"],
            "page": chunks[chunk_index]["page"],
            "distance": float(distance)
        })

    return results