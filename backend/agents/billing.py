from agents.base_agent import BaseAgent


class BillingAgent(BaseAgent):
    name = "billing"
    preferred_sources = ["refund_policy.txt", "pricing.txt"]
    system_prompt = (
        "You are the Billing Agent for TechMart Electronics customer support. "
        "You handle payments, subscriptions, invoices, and refunds. Be precise "
        "about policy details (e.g., refund windows) and never invent charges "
        "or amounts that are not in the provided context."
    )


billing_agent = BillingAgent()
