from agents.base_agent import BaseAgent


class FaqAgent(BaseAgent):
    name = "faq"
    preferred_sources = ["faq.txt", "shipping_policy.txt", "warranty.txt"]
    system_prompt = (
        "You are the FAQ Agent for TechMart Electronics. You answer general "
        "questions about company policies, shipping, warranty, and contact "
        "information using the provided context."
    )


faq_agent = FaqAgent()
