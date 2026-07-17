"""
Evaluates RAG retrieval quality against a small labeled query set, as called
for in Phase 6 (Testing & Evaluation) of the project plan.

Run from the backend/ directory:
    python scripts/evaluate_retrieval.py

Reports precision@k (did the expected source appear in the top-k results?)
and mean top-1 similarity score.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rag.pipeline import ingest_knowledge_base, retrieve

LABELED_QUERIES = [
    {"query": "What is the refund window for a physical product?", "expected_source": "refund_policy.txt"},
    {"query": "How long does standard shipping take?", "expected_source": "shipping_policy.txt"},
    {"query": "What does the warranty cover?", "expected_source": "warranty.txt"},
    {"query": "How much does the Premium plan cost per month?", "expected_source": "pricing.txt"},
    {"query": "What are your customer support hours?", "expected_source": "faq.txt"},
    {"query": "Can I get a refund on a subscription I haven't used?", "expected_source": "refund_policy.txt"},
]


def evaluate(top_k: int = 3) -> None:
    n_chunks = ingest_knowledge_base()
    print(f"Indexed {n_chunks} chunks from knowledge_base/\n")

    hits = 0
    top1_scores = []

    for case in LABELED_QUERIES:
        results = retrieve(case["query"], top_k=top_k)
        sources = [r["source"] for r in results]
        hit = case["expected_source"] in sources
        hits += hit
        top1_scores.append(results[0]["score"] if results else 0.0)

        status = "PASS" if hit else "FAIL"
        print(f"[{status}] \"{case['query']}\"")
        print(f"       expected: {case['expected_source']}  |  retrieved: {sources}")

    precision_at_k = hits / len(LABELED_QUERIES)
    mean_top1 = sum(top1_scores) / len(top1_scores)

    print(f"\nPrecision@{top_k}: {precision_at_k:.2%}")
    print(f"Mean top-1 similarity score: {mean_top1:.3f}")


if __name__ == "__main__":
    evaluate()
