from agents.intent_detection import detect_intent


def test_billing_query():
    result = detect_intent("I was charged twice for my subscription this month")
    assert "billing" in result.agents


def test_technical_query():
    result = detect_intent("I forgot my password and login keeps giving an error")
    assert "technical" in result.agents


def test_multi_intent_billing_and_technical():
    result = detect_intent("I paid yesterday but Premium is still locked")
    assert "billing" in result.agents
    assert "technical" in result.agents


def test_complaint_query():
    result = detect_intent("This is the worst experience, I am extremely frustrated")
    assert "complaint" in result.agents


def test_faq_fallback_for_unmatched_query():
    result = detect_intent("blah unrelated gibberish xyz")
    assert result.agents == ["faq"]
    assert result.confidence < 0.5
