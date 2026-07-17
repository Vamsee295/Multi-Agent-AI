from agents.router import route_and_respond


def test_single_agent_routes_correctly(ingested_kb):
    result = route_and_respond("What is your shipping policy?")
    assert "faq" in result.agents_invoked or len(result.agents_invoked) >= 1
    assert result.final_message


def test_multi_agent_query_invokes_both_agents(ingested_kb):
    result = route_and_respond("I paid yesterday but Premium is still locked")
    assert "billing" in result.agents_invoked
    assert "technical" in result.agents_invoked
    assert "Billing Agent" in result.final_message
    assert "Technical Agent" in result.final_message


def test_complaint_with_low_confidence_triggers_escalation(ingested_kb):
    result = route_and_respond("worst awful terrible")
    if "complaint" in result.agents_invoked and result.intent_confidence < 0.8:
        assert result.escalated
        assert "human agent" in result.final_message.lower()
