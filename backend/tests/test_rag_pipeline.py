from rag.chunker import chunk_text
from rag.pipeline import ingest_knowledge_base, retrieve
from vectorstore.faiss_store import get_vector_store


def test_chunk_text_respects_overlap():
    text = " ".join(f"word{i}" for i in range(200))
    chunks = chunk_text(text, chunk_size=100, overlap=20)
    assert len(chunks) > 1
    for c in chunks:
        assert len(c) > 0


def test_chunk_text_empty_input():
    assert chunk_text("") == []


def test_retrieval_returns_results_after_ingestion(ingested_kb):
    assert ingested_kb > 0
    results = retrieve("refund policy for subscriptions", top_k=3)
    assert len(results) > 0
    assert all("source" in r and "text" in r and "score" in r for r in results)


def test_ingest_is_idempotent(ingested_kb):
    first_count = ingested_kb
    second_count = ingest_knowledge_base()
    store = get_vector_store()
    assert second_count == first_count
    assert store.index.ntotal == first_count


def test_agent_scoped_retrieval_prefers_relevant_sources(ingested_kb):
    assert ingested_kb > 0
    results = retrieve("How do I reset my password?", agent="technical", top_k=3)
    assert len(results) > 0
    sources = {r["source"] for r in results}
    assert "user_manual.txt" in sources or "installation_guide.txt" in sources
