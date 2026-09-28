"""
Embedding model wrapper. Uses sentence-transformers locally (no external API
calls, no cost) so RAG works out of the box without an internet-dependent key.
"""
from typing import TYPE_CHECKING
from config import get_settings

if TYPE_CHECKING:
    import numpy as np
    from sentence_transformers import SentenceTransformer

_embedder = None


def get_embedder():
    """Lazy loader for SentenceTransformer to prevent high memory usage during FastAPI startup."""
    global _embedder
    if _embedder is None:
        try:
            import torch
            # Cap PyTorch CPU threads to 1 to minimize memory overhead in 512MB RAM environment
            torch.set_num_threads(1)
        except Exception:
            pass
        from sentence_transformers import SentenceTransformer
        settings = get_settings()
        _embedder = SentenceTransformer(settings.EMBEDDING_MODEL)
    return _embedder


def embed_texts(texts: list[str]):
    import numpy as np
    model = get_embedder()
    vectors = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    return np.asarray(vectors, dtype="float32")


def embed_query(query: str):
    return embed_texts([query])[0]
