"""
Embedding model wrapper. Uses sentence-transformers locally (no external API
calls, no cost) so RAG works out of the box without an internet-dependent key.
"""
from functools import lru_cache
import numpy as np
from sentence_transformers import SentenceTransformer

from config import get_settings


@lru_cache
def get_embedder() -> SentenceTransformer:
    settings = get_settings()
    return SentenceTransformer(settings.EMBEDDING_MODEL)


def embed_texts(texts: list[str]) -> np.ndarray:
    model = get_embedder()
    vectors = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    return np.asarray(vectors, dtype="float32")


def embed_query(query: str) -> np.ndarray:
    return embed_texts([query])[0]
