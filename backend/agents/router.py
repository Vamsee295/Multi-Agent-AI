"""
Agent Router (Module 4) + Response Aggregator (Module 7 downstream).

Given a customer message:
  1. Detect intent(s) + sentiment via the Intent Detection Agent.
  2. Invoke the matching specialized agent(s) — supports multi-agent queries.
  3. Aggregate their answers into a single coherent response.
  4. Decide whether to escalate (angry/frustrated + low confidence → escalate).
"""
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass

from agents.intent_detection import detect_intent
from agents.aggregator import aggregate_responses
from agents.billing import billing_agent
from agents.technical import technical_agent
from agents.product import product_agent
from agents.complaint import complaint_agent
from agents.faq import faq_agent

AGENT_REGISTRY = {
    "billing": billing_agent,
    "technical": technical_agent,
    "product": product_agent,
    "complaint": complaint_agent,
    "faq": faq_agent,
}

ESCALATION_CONFIDENCE_THRESHOLD = 0.45


@dataclass
class RoutedResponse:
    final_message: str
    agents_invoked: list[str]
    intent_confidence: float
    retrieved_context: list[dict]
    escalated: bool
    sentiment: str
    sentiment_score: float
    response_time_ms: int


def _run_agents_parallel(agents_to_run, message: str, history_snippet: str):
    """Run specialized agents concurrently; preserve intent order in results."""
    if len(agents_to_run) == 1:
        return [agents_to_run[0].run(message, history_snippet)]

    order = {agent.name: idx for idx, agent in enumerate(agents_to_run)}
    replies = []
    with ThreadPoolExecutor(max_workers=len(agents_to_run)) as pool:
        futures = {
            pool.submit(agent.run, message, history_snippet): agent
            for agent in agents_to_run
        }
        for future in as_completed(futures):
            replies.append(future.result())

    replies.sort(key=lambda r: order.get(r.agent, 99))
    return replies


def route_and_respond(message: str, history_snippet: str = "") -> RoutedResponse:
    t_start = time.monotonic()

    intent = detect_intent(message)
    agents_to_run = [AGENT_REGISTRY[name] for name in intent.agents if name in AGENT_REGISTRY]

    if not agents_to_run:
        agents_to_run = [faq_agent]
        intent.agents = ["faq"]

    replies = _run_agents_parallel(agents_to_run, message, history_snippet)

    final_message = aggregate_responses(message, replies)

    all_context = [c for r in replies for c in r.context_used]

    # Escalate if: complaint agent active, or low confidence, or negative sentiment
    escalated = (
        "complaint" in intent.agents
        and intent.confidence < 0.8
    ) or intent.confidence < ESCALATION_CONFIDENCE_THRESHOLD or (
        intent.sentiment in ("frustrated", "angry") and intent.confidence < 0.75
    )

    if escalated:
        final_message += (
            "\n\n_This conversation has been flagged for review by a human agent "
            "to ensure it's fully resolved._"
        )

    elapsed_ms = int((time.monotonic() - t_start) * 1000)

    return RoutedResponse(
        final_message=final_message,
        agents_invoked=intent.agents,
        intent_confidence=intent.confidence,
        retrieved_context=all_context,
        escalated=escalated,
        sentiment=intent.sentiment,
        sentiment_score=intent.sentiment_score,
        response_time_ms=elapsed_ms,
    )
