"""
RAG pipeline: ingest knowledge_base/*.txt|*.pdf into the vector store, and
retrieve top-k relevant chunks for a user query at request time.
"""
import glob
import hashlib
import json
import os

from config import get_settings
from embeddings.embedder import embed_texts, embed_query
from vectorstore.faiss_store import get_vector_store, reset_vector_store, IndexedChunk
from rag.chunker import chunk_text
from agents.prompts import AGENT_DOMAIN_HINTS

# Preferred knowledge-base sources per agent (used to prioritize retrieval).
AGENT_PREFERRED_SOURCES: dict[str, list[str]] = {
    "billing": ["refund_policy.txt", "pricing.txt"],
    "technical": ["user_manual.txt", "installation_guide.txt"],
    "product": ["products.txt", "pricing.txt"],
    "complaint": ["refund_policy.txt", "warranty.txt"],
    "faq": ["faq.txt", "shipping_policy.txt", "warranty.txt"],
}


def _read_pdf(path: str) -> str:
    from pypdf import PdfReader
    reader = PdfReader(path)
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def _read_file(path: str) -> str:
    if path.lower().endswith(".pdf"):
        return _read_pdf(path)
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def _kb_paths() -> list[str]:
    settings = get_settings()
    return sorted(
        glob.glob(os.path.join(settings.KNOWLEDGE_BASE_DIR, "*.txt"))
        + glob.glob(os.path.join(settings.KNOWLEDGE_BASE_DIR, "*.pdf"))
    )


def _kb_file_hashes(paths: list[str]) -> dict[str, str]:
    hashes: dict[str, str] = {}
    for path in paths:
        with open(path, "rb") as f:
            hashes[os.path.basename(path)] = hashlib.sha256(f.read()).hexdigest()
    return hashes


def _manifest_path() -> str:
    settings = get_settings()
    return f"{settings.VECTOR_STORE_PATH}.manifest.json"


def _load_manifest() -> dict | None:
    path = _manifest_path()
    if not os.path.exists(path):
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _save_manifest(file_hashes: dict[str, str], chunk_count: int) -> None:
    path = _manifest_path()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"files": file_hashes, "chunk_count": chunk_count}, f)


def _index_is_current(file_hashes: dict[str, str]) -> bool:
    manifest = _load_manifest()
    if not manifest:
        return False
    store = get_vector_store()
    return (
        manifest.get("files") == file_hashes
        and store.index.ntotal == manifest.get("chunk_count", 0)
        and store.index.ntotal > 0
    )


def ingest_knowledge_base() -> int:
    """
    Reads every document in the knowledge_base directory, chunks it, embeds
    the chunks, and stores them in the FAISS index. Returns the number of
    chunks indexed.

    Re-ingestion is skipped when the on-disk index matches the current KB
    file hashes and chunk count. Otherwise the index is rebuilt from scratch
    (never appended to an existing index).
    """
    settings = get_settings()
    paths = _kb_paths()
    if not paths:
        return 0

    file_hashes = _kb_file_hashes(paths)
    if _index_is_current(file_hashes):
        return get_vector_store().index.ntotal

    store = reset_vector_store()

    all_chunks: list[IndexedChunk] = []
    all_texts: list[str] = []

    for path in paths:
        raw = _read_file(path)
        for chunk in chunk_text(raw, settings.CHUNK_SIZE, settings.CHUNK_OVERLAP):
            all_chunks.append(IndexedChunk(source=os.path.basename(path), text=chunk))
            all_texts.append(chunk)

    if not all_texts:
        return 0

    vectors = embed_texts(all_texts)
    store.add(vectors, all_chunks)
    store.save()
    _save_manifest(file_hashes, len(all_texts))
    return len(all_texts)


def build_agent_query(agent: str, message: str) -> str:
    """Expand the retrieval query with domain keywords for the target agent."""
    hint = AGENT_DOMAIN_HINTS.get(agent, "")
    if not hint:
        return message
    return f"{message}\n\nRelated topics: {hint}"


def format_retrieved_context(chunks: list[dict]) -> str:
    """Format RAG chunks with source attribution for the LLM prompt."""
    if not chunks:
        return "No relevant documents found."
    parts = []
    for i, chunk in enumerate(chunks, 1):
        parts.append(
            f"[{i}] Source: {chunk['source']} (relevance: {chunk['score']:.2f})\n"
            f"{chunk['text']}"
        )
    return "\n\n".join(parts)


def retrieve(
    query: str,
    top_k: int | None = None,
    agent: str | None = None,
    preferred_sources: list[str] | None = None,
) -> list[dict]:
    settings = get_settings()
    store = get_vector_store()
    k = top_k or settings.RETRIEVAL_TOP_K

    sources = preferred_sources
    if sources is None and agent:
        sources = AGENT_PREFERRED_SOURCES.get(agent)

    # Fetch extra candidates when filtering by agent-specific sources.
    search_k = k * 4 if sources else k
    query_vec = embed_query(query)
    results = store.search(query_vec, top_k=min(search_k, max(store.index.ntotal, 1)))

    threshold = settings.RETRIEVAL_SCORE_THRESHOLD
    if threshold > 0:
        results = [(c, s) for c, s in results if s >= threshold]

    if sources:
        preferred = [r for r in results if r[0].source in sources]
        other = [r for r in results if r[0].source not in sources]
        results = (preferred + other)[:k]
    else:
        results = results[:k]

    return [{"source": c.source, "text": c.text, "score": score} for c, score in results]
