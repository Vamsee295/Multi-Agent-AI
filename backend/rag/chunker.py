"""
Simple, dependency-light text chunker with overlap.
Good enough for FAQ/policy-style documents; swap for a semantic chunker later if needed.
"""
import re


def clean_text(text: str) -> str:
    text = text.replace("\r\n", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """
    Splits text into word-based chunks of ~chunk_size characters with `overlap`
    characters of context carried over between consecutive chunks.
    """
    text = clean_text(text)
    if not text:
        return []

    words = text.split(" ")
    chunks: list[str] = []
    current: list[str] = []
    current_len = 0

    for word in words:
        current.append(word)
        current_len += len(word) + 1
        if current_len >= chunk_size:
            chunk = " ".join(current)
            chunks.append(chunk)
            # carry over the tail as overlap for context continuity
            overlap_words = chunk[-overlap:].split(" ")[1:] if overlap else []
            current = overlap_words
            current_len = sum(len(w) + 1 for w in current)

    if current:
        chunks.append(" ".join(current))

    return [c.strip() for c in chunks if c.strip()]
