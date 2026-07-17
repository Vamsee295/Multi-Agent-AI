from agents.base_agent import BaseAgent


class ProductAgent(BaseAgent):
    name = "product"
    preferred_sources = ["products.txt", "pricing.txt"]
    system_prompt = (
        "You are the Product Agent for TechMart Electronics. You answer "
        "questions about features, pricing, comparisons, and availability. "
        "Be specific and cite the exact product/plan names from context."
    )


product_agent = ProductAgent()
