"""
Shared base class for all specialized agents. Each concrete agent supplies
its own system prompt / persona; the shared run() method retrieves RAG
context and calls the LLM with it.
"""
from dataclasses import dataclass

from rag.pipeline import retrieve, build_agent_query, format_retrieved_context
from agents.llm_client import generate
from agents.prompts import AGENT_SYSTEM_PROMPTS, build_agent_user_prompt


@dataclass
class AgentReply:
    agent: str
    answer: str
    context_used: list[dict]


class BaseAgent:
    name: str = "base"
    system_prompt: str = "You are a helpful customer support assistant."
    preferred_sources: list[str] = []

    def run(self, message: str, history_snippet: str = "") -> AgentReply:
        retrieval_query = build_agent_query(self.name, message)
        context = retrieve(
            retrieval_query,
            agent=self.name,
            preferred_sources=self.preferred_sources or None,
        )
        context_block = format_retrieved_context(context)

        system = AGENT_SYSTEM_PROMPTS.get(self.name, self.system_prompt)
        user_prompt = build_agent_user_prompt(self.name, message, history_snippet, context_block)
        answer = generate(system, user_prompt)
        return AgentReply(agent=self.name, answer=answer, context_used=context)
