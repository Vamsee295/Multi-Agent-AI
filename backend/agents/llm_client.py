"""
Thin LLM client abstraction so agents don't care which provider is configured.
Supports OpenAI, Google Gemini, Groq (Llama 3), or a deterministic "mock" mode
that lets the whole system run end-to-end with zero API keys for local dev
and grading/demo purposes.
"""
import json
import re

from config import get_settings


def _chat_messages(system_prompt: str, user_prompt: str) -> list[dict]:
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]


def generate(system_prompt: str, user_prompt: str) -> str:
    settings = get_settings()
    provider = settings.LLM_PROVIDER.lower()

    if provider == "openai":
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        resp = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=_chat_messages(system_prompt, user_prompt),
            temperature=0.3,
        )
        return resp.choices[0].message.content or ""

    if provider == "groq":
        from groq import Groq
        client = Groq(api_key=settings.GROQ_API_KEY)
        resp = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=_chat_messages(system_prompt, user_prompt),
            temperature=0.3,
        )
        return resp.choices[0].message.content or ""

    if provider == "gemini":
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash", system_instruction=system_prompt)
        resp = model.generate_content(user_prompt)
        return resp.text or ""

    return _mock_generate(system_prompt, user_prompt)


def generate_json(system_prompt: str, user_prompt: str) -> dict:
    """Request a JSON object from the LLM and parse it."""
    settings = get_settings()
    provider = settings.LLM_PROVIDER.lower()

    json_instruction = (
        "\n\nRespond with ONLY a valid JSON object. No markdown, no explanation."
    )

    if provider == "openai":
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        resp = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=_chat_messages(system_prompt, user_prompt + json_instruction),
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        raw = resp.choices[0].message.content or "{}"
        return json.loads(raw)

    if provider == "groq":
        from groq import Groq
        client = Groq(api_key=settings.GROQ_API_KEY)
        resp = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=_chat_messages(system_prompt, user_prompt + json_instruction),
            temperature=0.1,
        )
        return _parse_json_response(resp.choices[0].message.content or "{}")

    if provider == "gemini":
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash", system_instruction=system_prompt)
        resp = model.generate_content(user_prompt + json_instruction)
        return _parse_json_response(resp.text or "{}")

    # mock: derive JSON from keyword intent for offline tests
    from agents.intent_detection import _detect_intent_keywords
    message_match = re.search(r'"""(.+?)"""', user_prompt, re.DOTALL)
    message = message_match.group(1).strip() if message_match else user_prompt
    result = _detect_intent_keywords(message)
    return {"agents": result.agents, "confidence": result.confidence}


def _parse_json_response(raw: str) -> dict:
    raw = raw.strip()
    fence = re.search(r"```(?:json)?\s*(.*?)\s*```", raw, re.DOTALL)
    if fence:
        raw = fence.group(1)
    return json.loads(raw)


def _mock_generate(system_prompt: str, user_prompt: str) -> str:
    context_match = re.search(
        r"Retrieved company context.*?:\n(.*?)\n\nCustomer message:",
        user_prompt,
        re.DOTALL,
    )
    message_match = re.search(r"Customer message: (.*?)(?:\n\n|$)", user_prompt, re.DOTALL)

    context_block = context_match.group(1).strip() if context_match else ""
    customer_message = message_match.group(1).strip() if message_match else ""

    agent_type = "Support"
    for label in ("Billing", "Technical", "Product", "Complaint", "FAQ"):
        if label in system_prompt:
            agent_type = label
            break

    if not context_block or context_block == "No relevant documents found.":
        return (
            f"I'm the TechMart {agent_type} Agent. I couldn't find company documentation "
            f"directly related to your request: '{customer_message}'. Could you clarify?"
        )

    chunks = [c.strip() for c in re.split(r"\n\n(?=\[\d+\] Source:)", context_block) if c.strip()]
    if not chunks:
        chunks = [context_block]

    response_text = (
        f"I'm the TechMart {agent_type} Agent. Based on our company documents:\n\n"
    )
    for chunk in chunks:
        source_match = re.search(r"Source: (\S+)", chunk)
        source = source_match.group(1) if source_match else "company docs"
        body = re.sub(r"^\[\d+\] Source:.*?\n", "", chunk, count=1).strip()
        first_line = next((line.strip() for line in body.split("\n") if line.strip()), body)
        response_text += f"- ({source}) {first_line}\n"

    return response_text
