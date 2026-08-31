"""
Shared base class for all specialized agents. Each concrete agent supplies
its own system prompt / persona; the shared run() method retrieves RAG
context and calls the LLM with it.
"""
import time
from dataclasses import dataclass

from rag.pipeline import retrieve, build_agent_query, format_retrieved_context
from agents.llm_client import generate
from agents.prompts import AGENT_SYSTEM_PROMPTS, build_agent_user_prompt


@dataclass
class AgentReply:
    agent: str
    answer: str
    context_used: list[dict]
    retrieval_time_ms: float = 0.0
    chunks_count: int = 0


class BaseAgent:
    name: str = "base"
    system_prompt: str = "You are a helpful customer support assistant."
    preferred_sources: list[str] = []

    def run(
        self,
        message: str,
        history_snippet: str = "",
        use_rag: bool = True,
        model: str = None,
        response_style: str = "balanced",
    ) -> AgentReply:
        if use_rag:
            t_rag_start = time.monotonic()
            retrieval_query = build_agent_query(self.name, message)
            context = retrieve(
                retrieval_query,
                agent=self.name,
                preferred_sources=self.preferred_sources or None,
            )
            t_rag_end = time.monotonic()
            retrieval_time_ms = round((t_rag_end - t_rag_start) * 1000, 2)
        else:
            context = []
            retrieval_time_ms = 0.0

        context_block = format_retrieved_context(context) if context else "(RAG retrieval disabled by user setting)"

        system = AGENT_SYSTEM_PROMPTS.get(self.name, self.system_prompt)
        user_prompt = build_agent_user_prompt(
            self.name,
            message,
            history_snippet,
            context_block,
            response_style=response_style,
        )
        answer = generate(system, user_prompt, model_override=model)
        return AgentReply(
            agent=self.name,
            answer=answer,
            context_used=context,
            retrieval_time_ms=retrieval_time_ms,
            chunks_count=len(context),
        )
