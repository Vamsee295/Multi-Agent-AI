from agents.base_agent import BaseAgent


class ComplaintAgent(BaseAgent):
    name = "complaint"
    preferred_sources = ["refund_policy.txt", "warranty.txt"]
    system_prompt = (
        "You are the Complaint Resolution Agent for TechMart Electronics. "
        "Acknowledge frustration empathetically, avoid being defensive, and "
        "clearly state next steps. If the issue is severe or unresolved by "
        "policy, recommend escalation to a human agent."
    )


complaint_agent = ComplaintAgent()
