"""
FAISS-backed vector store: build, persist, load, and search over document chunks.
Uses inner-product search on normalized vectors (== cosine similarity).
"""
import json
import os
from dataclasses import dataclass, asdict

import faiss
import numpy as np

from config import get_settings


@dataclass
class IndexedChunk:
    source: str
    text: str


class FaissVectorStore:
    def __init__(self, dim: int, path: str):
        self.dim = dim
        self.path = path
        self.index = faiss.IndexFlatIP(dim)
        self.chunks: list[IndexedChunk] = []

    def reset(self) -> None:
        """Drop all vectors and metadata from the in-memory store."""
        self.index = faiss.IndexFlatIP(self.dim)
        self.chunks = []

    def add(self, vectors: np.ndarray, chunks: list[IndexedChunk]) -> None:
        assert vectors.shape[0] == len(chunks)
        self.index.add(vectors)
        self.chunks.extend(chunks)

    def search(self, query_vector: np.ndarray, top_k: int = 4) -> list[tuple[IndexedChunk, float]]:
        if self.index.ntotal == 0:
            return []
        scores, indices = self.index.search(np.expand_dims(query_vector, axis=0), top_k)
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            results.append((self.chunks[idx], float(score)))
        return results

    def save(self) -> None:
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        faiss.write_index(self.index, f"{self.path}.faiss")
        with open(f"{self.path}.meta.json", "w") as f:
            json.dump([asdict(c) for c in self.chunks], f)

    @classmethod
    def load(cls, dim: int, path: str) -> "FaissVectorStore":
        store = cls(dim, path)
        if os.path.exists(f"{path}.faiss") and os.path.exists(f"{path}.meta.json"):
            store.index = faiss.read_index(f"{path}.faiss")
            with open(f"{path}.meta.json") as f:
                store.chunks = [IndexedChunk(**c) for c in json.load(f)]
        return store


_store: FaissVectorStore | None = None


def get_vector_store(dim: int = 384) -> FaissVectorStore:
    global _store
    if _store is None:
        settings = get_settings()
        _store = FaissVectorStore.load(dim, settings.VECTOR_STORE_PATH)
    return _store


def reset_vector_store(dim: int = 384) -> FaissVectorStore:
    """Create a fresh empty store and remove any persisted index files."""
    global _store
    settings = get_settings()
    path = settings.VECTOR_STORE_PATH
    for suffix in (".faiss", ".meta.json", ".manifest.json"):
        file_path = f"{path}{suffix}"
        if os.path.exists(file_path):
            os.remove(file_path)
    _store = FaissVectorStore(dim, path)
    return _store
