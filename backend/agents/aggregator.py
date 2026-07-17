"""
Response Aggregator — merges answers from multiple specialist agents into
a single coherent customer-facing reply.
"""
from agents.llm_client import generate
from agents.prompts import AGGREGATOR_SYSTEM, build_aggregator_user_prompt
from agents.base_agent import AgentReply
from config import get_settings


def aggregate_responses(customer_message: str, replies: list[AgentReply]) -> str:
    if len(replies) == 1:
        return replies[0].answer

    settings = get_settings()

    # Mock/offline mode: preserve visible multi-agent structure for demos.
    if settings.LLM_PROVIDER == "mock":
        sections = [f"**{r.agent.title()} Agent:**\n{r.answer}" for r in replies]
        return "\n\n".join(sections)

    sections = [(r.agent, r.answer) for r in replies]
    user_prompt = build_aggregator_user_prompt(customer_message, sections)
    return generate(AGGREGATOR_SYSTEM, user_prompt)
