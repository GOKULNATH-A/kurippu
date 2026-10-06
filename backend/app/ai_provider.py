"""
AI Provider Abstraction Layer

Supports:
  - mock: Built-in mock that uses regex/heuristics (no API key needed)
  - openai: OpenAI-compatible APIs (ChatGPT, etc.)
  - gemini: Google Gemini API

Provider is selected via AI_PROVIDER env variable.
"""
from __future__ import annotations
import json
import re
import logging
from abc import ABC, abstractmethod
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)

EXTRACTION_PROMPT = """
You are an expert document analyzer for KURIPPU — a document-to-action platform.

Analyze the following document text and extract actionable information.

Return ONLY valid JSON with this exact structure:
{
  "summary": "Brief 2-3 sentence summary",
  "key_points": ["point 1", "point 2"],
  "actions": [
    {
      "title": "Action title",
      "description": "What needs to be done",
      "deadline": "YYYY-MM-DD or null",
      "deadline_time": "HH:MM or null",
      "priority": "low|medium|high|urgent",
      "assignee": "Person name or null",
      "confidence": 0.95,
      "evidence": "Exact sentence from document that triggered this action",
      "evidence_page": 1
    }
  ],
  "events": [
    {
      "title": "Event title",
      "description": "Event details",
      "event_date": "YYYY-MM-DD or null",
      "event_time": "HH:MM or null",
      "location": "Location or null"
    }
  ],
  "people": ["Name 1", "Name 2"],
  "decisions": ["Decision 1"],
  "requirements": ["Requirement 1"],
  "important_dates": [
    {"date": "YYYY-MM-DD", "label": "What this date is for"}
  ]
}

Document text:
\"\"\"
{text}
\"\"\"
"""


class AIProvider(ABC):
    @abstractmethod
    async def extract(self, text: str) -> dict:
        """Extract structured information from document text."""
        ...

    @property
    @abstractmethod
    def name(self) -> str:
        ...

    @property
    @abstractmethod
    def model(self) -> str:
        ...


class MockAIProvider(AIProvider):
    """
    Heuristic-based mock provider — no API key needed.
    Uses regex patterns to find dates, names, and action verbs.
    """

    @property
    def name(self) -> str:
        return "mock"

    @property
    def model(self) -> str:
        return "heuristic-v1"

    async def extract(self, text: str) -> dict:
        import re
        from datetime import datetime

        text_lower = text.lower()

        # Extract dates
        date_patterns = [
            r'\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b',
            r'\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b',
            r'\b(jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b',
            r'\b(october|november|december|january|february|march|april|may|june|july|august|september)\s+\d{1,2}(?:st|nd|rd|th)?\b',
        ]
        found_dates = []
        for pat in date_patterns:
            found_dates.extend(re.findall(pat, text, re.IGNORECASE))

        # Extract names (capitalized words that appear near action verbs)
        name_pattern = r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:is|will|should|must|needs?\s+to|has\s+to)\b'
        names = list(set(re.findall(name_pattern, text)))[:5]

        # Extract action sentences
        action_verbs = [
            "submit", "prepare", "complete", "review", "send", "create", "attend",
            "finish", "deliver", "present", "upload", "write", "update", "schedule",
            "confirm", "book", "arrange", "organize", "collect", "verify"
        ]

        sentences = re.split(r'[.!?\n]+', text)
        action_sentences = []
        for sent in sentences:
            sent = sent.strip()
            if len(sent) < 10:
                continue
            if any(v in sent.lower() for v in action_verbs):
                action_sentences.append(sent)

        # Extract deadline sentences
        deadline_keywords = ["due", "deadline", "by", "before", "submit", "on or before", "no later than"]
        deadline_sentences = [s for s in sentences if any(k in s.lower() for k in deadline_keywords) and len(s.strip()) > 10]

        # Build actions
        actions = []
        seen_titles = set()
        for i, sent in enumerate(action_sentences[:6]):
            # Try to find a date near this sentence
            deadline = None
            for dp in date_patterns:
                m = re.search(dp, sent, re.IGNORECASE)
                if m:
                    deadline = self._parse_date(m.group(0))
                    break

            # Determine priority
            priority = "medium"
            if any(w in sent.lower() for w in ["urgent", "immediate", "asap", "critical"]):
                priority = "urgent"
            elif any(w in sent.lower() for w in ["important", "required", "must", "deadline"]):
                priority = "high"
            elif any(w in sent.lower() for w in ["optional", "if possible", "consider"]):
                priority = "low"

            # Generate title from sentence
            title = self._make_title(sent)
            if title in seen_titles or len(title) < 5:
                continue
            seen_titles.add(title)

            assignee = None
            for name in names:
                if name in sent:
                    assignee = name
                    break

            actions.append({
                "title": title,
                "description": sent.strip(),
                "deadline": deadline,
                "deadline_time": None,
                "priority": priority,
                "assignee": assignee,
                "confidence": round(0.7 + (0.25 * (1 if deadline else 0.5) * (1 if assignee else 0.8)), 2),
                "evidence": sent.strip(),
                "evidence_page": 1,
            })

        # Build events from deadline sentences that look like meetings
        events = []
        meeting_keywords = ["meeting", "session", "conference", "presentation", "seminar", "workshop", "event"]
        for sent in sentences:
            sent = sent.strip()
            if any(k in sent.lower() for k in meeting_keywords) and len(sent) > 10:
                date = None
                time = None
                for dp in date_patterns:
                    m = re.search(dp, sent, re.IGNORECASE)
                    if m:
                        date = self._parse_date(m.group(0))
                        break
                time_m = re.search(r'\b(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?|\d{1,2}\s*(?:AM|PM|am|pm))\b', sent)
                if time_m:
                    time = time_m.group(0)
                events.append({
                    "title": self._make_title(sent),
                    "description": sent,
                    "event_date": date,
                    "event_time": time,
                    "location": None,
                })
                if len(events) >= 3:
                    break

        # Key points
        key_points = [s.strip() for s in sentences if 20 < len(s.strip()) < 200][:5]

        # Summary
        summary = f"Document contains {len(sentences)} sections with {len(actions)} potential actions identified. "
        if names:
            summary += f"Key people mentioned: {', '.join(names[:3])}. "
        if found_dates:
            summary += f"Important dates were detected in the document."

        return {
            "summary": summary.strip(),
            "key_points": key_points,
            "actions": actions,
            "events": events,
            "people": names,
            "decisions": [s.strip() for s in sentences if "decided" in s.lower() or "agreed" in s.lower()][:3],
            "requirements": [s.strip() for s in sentences if "required" in s.lower() or "must" in s.lower() or "mandatory" in s.lower()][:3],
            "important_dates": [{"date": self._parse_date(d) or d, "label": "Date found in document"} for d in found_dates[:5]],
        }

    def _parse_date(self, date_str: str) -> Optional[str]:
        """Try to parse a date string to YYYY-MM-DD."""
        from datetime import datetime
        formats = [
            "%m/%d/%Y", "%d/%m/%Y", "%m-%d-%Y", "%d-%m-%Y",
            "%B %d, %Y", "%B %d %Y", "%b %d, %Y", "%b %d %Y",
            "%B %d", "%b %d",
        ]
        for fmt in formats:
            try:
                dt = datetime.strptime(date_str.strip(), fmt)
                if dt.year == 1900:
                    dt = dt.replace(year=datetime.now().year)
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                continue
        return None

    def _make_title(self, sentence: str) -> str:
        """Generate a short action title from a sentence."""
        # Remove common fillers and take first 60 chars
        cleaned = re.sub(r'\b(please|kindly|you|we|the|a|an|is|are|was|were)\b', '', sentence, flags=re.IGNORECASE)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        # Title case the first 8 words
        words = cleaned.split()[:8]
        title = ' '.join(words).title()
        if len(title) > 60:
            title = title[:57] + "..."
        return title


class OpenAIProvider(AIProvider):
    """OpenAI and OpenAI-compatible API provider."""

    def __init__(self):
        try:
            from openai import AsyncOpenAI
            base_url = settings.AI_BASE_URL or None
            self._client = AsyncOpenAI(
                api_key=settings.AI_API_KEY,
                base_url=base_url,
            )
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
            self._client = None

    @property
    def name(self) -> str:
        return "openai"

    @property
    def model(self) -> str:
        return settings.AI_MODEL or "gpt-4o-mini"

    async def extract(self, text: str) -> dict:
        if not self._client:
            raise RuntimeError("OpenAI client not initialized")

        prompt = EXTRACTION_PROMPT.replace("{text}", text[:8000])

        response = await self._client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a precise document analyzer. Always return valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content
        return json.loads(raw)


class GeminiProvider(AIProvider):
    """Google Gemini API provider."""

    def __init__(self):
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.AI_API_KEY)
            self._model = genai.GenerativeModel(settings.AI_MODEL or "gemini-1.5-flash")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
            self._model = None

    @property
    def name(self) -> str:
        return "gemini"

    @property
    def model(self) -> str:
        return settings.AI_MODEL or "gemini-1.5-flash"

    async def extract(self, text: str) -> dict:
        import asyncio
        if not self._model:
            raise RuntimeError("Gemini client not initialized")

        prompt = EXTRACTION_PROMPT.replace("{text}", text[:8000])
        # Gemini SDK is sync; run in thread pool
        response = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: self._model.generate_content(prompt),
        )
        raw = response.text
        # Strip markdown code fences if present
        raw = re.sub(r'^```(?:json)?\s*', '', raw, flags=re.MULTILINE)
        raw = re.sub(r'\s*```$', '', raw, flags=re.MULTILINE)
        return json.loads(raw.strip())


def get_ai_provider() -> AIProvider:
    """Factory — returns the appropriate provider based on settings."""
    provider = settings.AI_PROVIDER.lower()
    if provider == "openai" and settings.AI_API_KEY:
        try:
            return OpenAIProvider()
        except Exception as e:
            logger.warning(f"Failed to create OpenAI provider, falling back to mock: {e}")
    elif provider == "gemini" and settings.AI_API_KEY:
        try:
            return GeminiProvider()
        except Exception as e:
            logger.warning(f"Failed to create Gemini provider, falling back to mock: {e}")
    return MockAIProvider()


async def safe_extract(text: str) -> dict:
    """
    Run extraction with primary provider; fall back to mock on any error.
    Never crashes the application.
    """
    provider = get_ai_provider()
    try:
        result = await provider.extract(text)
        _validate_extraction(result)
        return result, provider.name, provider.model
    except Exception as e:
        logger.error(f"AI extraction failed with {provider.name}: {e}. Falling back to mock.")
        try:
            mock = MockAIProvider()
            result = await mock.extract(text)
            return result, mock.name, mock.model
        except Exception as e2:
            logger.error(f"Mock extraction also failed: {e2}")
            return _empty_extraction(), "mock", "fallback"


def _validate_extraction(data: dict) -> None:
    """Validate required fields exist in AI response."""
    required = ["summary", "actions"]
    for key in required:
        if key not in data:
            data[key] = [] if key != "summary" else ""
    if not isinstance(data.get("actions"), list):
        data["actions"] = []
    if not isinstance(data.get("key_points"), list):
        data["key_points"] = []


def _empty_extraction() -> dict:
    return {
        "summary": "Document processed but content could not be analyzed.",
        "key_points": [],
        "actions": [],
        "events": [],
        "people": [],
        "decisions": [],
        "requirements": [],
        "important_dates": [],
    }
