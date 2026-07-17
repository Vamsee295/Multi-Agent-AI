"""
Shared pytest fixtures. Mocks the embedding model so the full test suite runs
offline/deterministically without downloading sentence-transformers weights
or needing an internet connection — the real model is still used in
production (see embeddings/embedder.py).
"""
import sys
import os
import hashlib
import numpy as np
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _deterministic_vector(text: str, dim: int = 384) -> np.ndarray:
    seed = int(hashlib.sha256(text.encode()).hexdigest(), 16) % (2**31)
    rng = np.random.RandomState(seed)
    vec = rng.rand(dim).astype("float32")
    return vec / np.linalg.norm(vec)


@pytest.fixture(autouse=True)
def mock_embeddings(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "mock")
    monkeypatch.setenv("INTENT_DETECTION_MODE", "keyword")

    from config import get_settings
    get_settings.cache_clear()

    import embeddings.embedder as embedder_module

    def fake_embed_texts(texts):
        return np.vstack([_deterministic_vector(t) for t in texts])

    def fake_embed_query(text):
        return _deterministic_vector(text)

    monkeypatch.setattr(embedder_module, "embed_texts", fake_embed_texts)
    monkeypatch.setattr(embedder_module, "embed_query", fake_embed_query)

    import rag.pipeline as pipeline_module
    monkeypatch.setattr(pipeline_module, "embed_texts", fake_embed_texts)
    monkeypatch.setattr(pipeline_module, "embed_query", fake_embed_query)

    import vectorstore.faiss_store as store_module
    store_module._store = None  # reset singleton between tests

    import rag.pipeline as pipeline_module
    for suffix in (".faiss", ".meta.json", ".manifest.json"):
        path = pipeline_module._manifest_path().replace(".manifest.json", suffix)
        if os.path.exists(path):
            os.remove(path)

    yield


@pytest.fixture
def ingested_kb():
    from rag.pipeline import ingest_knowledge_base
    count = ingest_knowledge_base()
    return count
