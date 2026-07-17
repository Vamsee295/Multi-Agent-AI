"""
Intent Detection Agent (Module 3).

Classifies an incoming customer message into one or more of:
billing, technical, product, complaint, faq.

Also performs sentiment analysis — frustrated/angry messages
automatically co-invoke the complaint agent for escalation.

Uses keyword scoring as the fast offline baseline and LLM classification
when a real provider is configured (hybrid mode).
"""
import json
import re
from dataclasses import dataclass, field

from config import get_settings
from agents.llm_client import generate_json
from agents.prompts import (
    INTENT_CLASSIFIER_SYSTEM,
    SENTIMENT_CLASSIFIER_SYSTEM,
    VALID_AGENTS,
    VALID_SENTIMENTS,
    build_intent_user_prompt,
    build_sentiment_user_prompt,
)

INTENT_KEYWORDS = {
    "billing": [
        r"\bpay(ment|ed)?\b", r"\bbill(ing)?\b", r"\bcharge[ds]?\b", r"\brefund(ed)?\b",
        r"\binvoice\b", r"\bsubscription\b", r"\bcard\b", r"\bprice\b", r"\bpremium\b",
    ],
    "technical": [
        r"\blogin\b", r"\bpassword\b", r"\berror\b", r"\bbug\b", r"\bcrash(ed|ing)?\b",
        r"\binstall(ation)?\b", r"\bnot working\b", r"\blocked\b", r"\bsync\b",
    ],
    "product": [
        r"\bfeature[s]?\b", r"\bcompar(e|ison)\b", r"\bavailab(le|ility)\b",
        r"\bspecs?\b", r"\bpricing\b", r"\bplan[s]?\b",
    ],
    "complaint": [
        r"\bcomplain(t)?\b", r"\bterrible\b", r"\bawful\b", r"\bangry\b", r"\bfrustrat(ed|ing)\b",
        r"\bworst\b", r"\bdisappoint(ed|ing)\b", r"\bescalat(e|ion)\b",
    ],
    "faq": [
        r"\bpolicy\b", r"\bhours\b", r"\bcontact\b", r"\bshipping\b", r"\bwarranty\b",
        r"\bhow do i\b", r"\bwhat is\b",
    ],
}

SENTIMENT_KEYWORDS = {
    "angry":     [r"\bfurious\b", r"\boutrageous\b", r"\bunacceptable\b", r"\bscam\b",
                  r"\bhorrible\b", r"\bterrible\b", r"\bawful\b", r"\bangry\b"],
    "frustrated":[r"\bfrustrat(ed|ing)\b", r"\bdisappoint(ed|ing)\b", r"\bworst\b",
                  r"\bnot working\b", r"\bstill not\b", r"\bkeep(s)? failing\b",
                  r"\bwhy (is|isn't|are|aren't|can't|won't)\b"],
    "positive":  [r"\bthank(s|ful)?\b", r"\bgreat\b", r"\bexcellent\b", r"\bhappy\b",
                  r"\bperfect\b", r"\bawesome\b", r"\blove\b"],
}


@dataclass
class IntentResult:
    agents: list[str]
    confidence: float
    sentiment: str = "neutral"
    sentiment_score: float = 0.5


def _detect_sentiment_keywords(message: str) -> tuple[str, float]:
    text = message.lower()
    for sentiment, patterns in SENTIMENT_KEYWORDS.items():
        hits = sum(1 for p in patterns if re.search(p, text))
        if hits:
            score = min(0.95, 0.6 + 0.1 * hits)
            return sentiment, round(score, 2)
    return "neutral", 0.5


def _detect_intent_keywords(message: str) -> IntentResult:
    text = message.lower()
    scores: dict[str, int] = {}

    for agent, patterns in INTENT_KEYWORDS.items():
        hits = sum(1 for p in patterns if re.search(p, text))
        if hits:
            scores[agent] = hits

    if not scores:
        agents = ["faq"]
        confidence = 0.35
    else:
        max_hits = max(scores.values())
        agents = [agent for agent, hits in scores.items() if hits >= max(1, max_hits - 1)]
        confidence = min(0.95, 0.5 + 0.15 * max_hits)

    sentiment, sentiment_score = _detect_sentiment_keywords(message)

    # Frustrated/angry → always co-invoke complaint agent
    if sentiment in ("frustrated", "angry") and "complaint" not in agents:
        agents.append("complaint")

    return IntentResult(
        agents=agents,
        confidence=round(confidence, 2),
        sentiment=sentiment,
        sentiment_score=sentiment_score,
    )


def _detect_sentiment_llm(message: str) -> tuple[str, float]:
    try:
        data = generate_json(SENTIMENT_CLASSIFIER_SYSTEM, build_sentiment_user_prompt(message))
        sentiment = data.get("sentiment", "neutral")
        if sentiment not in VALID_SENTIMENTS:
            sentiment = "neutral"
        score = float(data.get("sentiment_score", 0.5))
        score = max(0.0, min(1.0, score))
        return sentiment, round(score, 2)
    except Exception:
        return _detect_sentiment_keywords(message)


def _detect_intent_llm(message: str) -> IntentResult:
    data = generate_json(INTENT_CLASSIFIER_SYSTEM, build_intent_user_prompt(message))

    agents = [a for a in data.get("agents", []) if a in VALID_AGENTS]
    if not agents:
        agents = ["faq"]

    confidence = float(data.get("confidence", 0.5))
    confidence = max(0.0, min(1.0, confidence))

    sentiment, sentiment_score = _detect_sentiment_llm(message)

    if sentiment in ("frustrated", "angry") and "complaint" not in agents:
        agents.append("complaint")

    return IntentResult(
        agents=agents,
        confidence=round(confidence, 2),
        sentiment=sentiment,
        sentiment_score=sentiment_score,
    )


def detect_intent(message: str) -> IntentResult:
    settings = get_settings()
    mode = settings.INTENT_DETECTION_MODE.lower()

    if mode == "keyword" or settings.LLM_PROVIDER == "mock":
        return _detect_intent_keywords(message)

    if mode == "llm":
        try:
            return _detect_intent_llm(message)
        except Exception:
            return _detect_intent_keywords(message)

    # hybrid: LLM with keyword fallback
    try:
        return _detect_intent_llm(message)
    except Exception:
        return _detect_intent_keywords(message)
