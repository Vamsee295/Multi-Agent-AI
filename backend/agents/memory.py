"""
Conversation Memory helper (Module 8).

Two responsibilities:
  1. Format the last N turns into a compact snippet for agent prompts.
  2. Summarize older turns once a conversation grows long, so agents keep
     useful context without blowing up the prompt size.
"""
from agents.llm_client import generate

MAX_RAW_TURNS = 6          # turns passed verbatim
SUMMARIZE_THRESHOLD = 14   # once history exceeds this many turns, summarize the tail


def format_turns(turns: list[dict]) -> str:
    return "\n".join(f"{t['role']}: {t['content']}" for t in turns)


def build_history_snippet(all_turns: list[dict]) -> str:
    """
    all_turns: chronological list of {"role": "user"|"assistant", "content": str}
    Returns a prompt-ready snippet: an optional summary of older turns + the
    most recent turns verbatim.
    """
    if not all_turns:
        return ""

    if len(all_turns) <= MAX_RAW_TURNS:
        return format_turns(all_turns)

    recent = all_turns[-MAX_RAW_TURNS:]
    older = all_turns[:-MAX_RAW_TURNS]

    if len(all_turns) <= SUMMARIZE_THRESHOLD:
        # Not long enough to justify an LLM summarization call; just trim.
        return format_turns(recent)

    summary = summarize_turns(older)
    return f"[Summary of earlier conversation]\n{summary}\n\n[Recent turns]\n{format_turns(recent)}"


def summarize_turns(turns: list[dict]) -> str:
    transcript = format_turns(turns)
    system_prompt = (
        "You compress customer support transcripts into a short factual summary "
        "(3-5 sentences) preserving any commitments, account details, or unresolved "
        "issues mentioned. Do not add information that isn't in the transcript."
    )
    return generate(system_prompt, transcript)
