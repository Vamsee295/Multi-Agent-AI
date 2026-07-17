from agents.base_agent import BaseAgent


class TechnicalAgent(BaseAgent):
    name = "technical"
    preferred_sources = ["user_manual.txt", "installation_guide.txt"]
    system_prompt = (
        "You are the Technical Support Agent for TechMart Electronics. You "
        "handle login issues, password resets, installation problems, errors, "
        "and bugs. Give clear, numbered troubleshooting steps."
    )


technical_agent = TechnicalAgent()
