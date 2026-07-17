from agents.aggregator import aggregate_responses
from agents.base_agent import AgentReply
from rag.pipeline import build_agent_query, format_retrieved_context


def test_build_agent_query_adds_domain_hints():
    query = build_agent_query("billing", "I was charged twice")
    assert "I was charged twice" in query
    assert "refunds" in query.lower() or "billing" in query.lower()


def test_format_retrieved_context_includes_sources():
    chunks = [
        {"source": "refund_policy.txt", "text": "30-day refund window.", "score": 0.87},
    ]
    formatted = format_retrieved_context(chunks)
    assert "refund_policy.txt" in formatted
    assert "0.87" in formatted
    assert "30-day refund window" in formatted


def test_format_retrieved_context_empty():
    assert format_retrieved_context([]) == "No relevant documents found."


def test_aggregator_mock_preserves_agent_headers():
    replies = [
        AgentReply(agent="billing", answer="Your payment was processed.", context_used=[]),
        AgentReply(agent="technical", answer="Try logging out and back in.", context_used=[]),
    ]
    result = aggregate_responses("Premium still locked after payment", replies)
    assert "Billing Agent" in result
    assert "Technical Agent" in result
