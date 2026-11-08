
import faiss
import numpy as np


def build_faiss_index(embeddings):
    """
    Build a FAISS index using document embeddings.
    """

    embeddings = np.asarray(embeddings, dtype="float32")

    if embeddings.ndim != 2 or embeddings.shape[0] == 0:
        raise ValueError("Embeddings must be a non-empty 2D array.")

    if not np.isfinite(embeddings).all():
        raise ValueError("Embeddings contain invalid values.")

    dimension = embeddings.shape[1]

    if dimension == 0:
        raise ValueError("Embedding dimension cannot be zero.")

    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)

    return index


def search_similar_chunks(query_embedding, index, chunks, top_k=3):
    """
    Retrieve the most relevant document chunks.
    """

    query_embedding = np.asarray(
        query_embedding, dtype="float32"
    ).reshape(1, -1)

    if query_embedding.shape[1] != index.d:
        raise ValueError("Query and document embedding dimensions do not match.")

    if not np.isfinite(query_embedding).all():
        raise ValueError("Query embedding contains invalid values.")

    if index.ntotal == 0:
        return []

    if len(chunks) != index.ntotal:
        raise ValueError("Number of chunks does not match FAISS index size.")

    if top_k <= 0:
        raise ValueError("top_k must be greater than zero.")

    top_k = min(top_k, index.ntotal)

    distances, indices = index.search(query_embedding, top_k)

    results = []

    for distance, chunk_index in zip(distances[0], indices[0]):

        if chunk_index == -1:
            continue

        results.append({
            "text": chunks[chunk_index]["text"],
            "page": chunks[chunk_index]["page"],
            "distance": float(distance),
            "chunk_index": int(chunk_index)
        })

    return results


def evaluate_retrieval(index, chunks, test_cases, top_k=3):
    """
    Evaluate retrieval using Recall@K.

    Each test case must contain:
    - query_embedding
    - relevant_chunk_indices
    """

    if not test_cases:
        raise ValueError("Test cases cannot be empty.")

    recall_scores = []

    for test_case in test_cases:

        relevant_chunks = set(
            test_case["relevant_chunk_indices"]
        )

        if not relevant_chunks:
            continue

        retrieved = search_similar_chunks(
            test_case["query_embedding"],
            index,
            chunks,
            top_k
        )

        retrieved_indices = {
            result["chunk_index"] for result in retrieved
        }

        relevant_retrieved = (
            retrieved_indices & relevant_chunks
        )

        recall = len(relevant_retrieved) / len(relevant_chunks)

        recall_scores.append(recall)

    if not recall_scores:
        raise ValueError("No valid evaluation test cases found.")

    return {
        "recall_at_k": float(np.mean(recall_scores)),
        "total_test_cases": len(recall_scores),
        "top_k": top_k
    }
