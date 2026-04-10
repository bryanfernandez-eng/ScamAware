import json
import re
import urllib.parse

from app.core.gemini import get_client
from app.core.config import settings
from app.schemas.scan import LinkScanResponse, RiskLevel

_PROMPT = """\
You are a cybersecurity analyst. Analyze the following URL for scam, phishing, \
malware, and other security risks.

URL: {url}

Respond with ONLY a JSON object (no markdown, no code fences) in this exact shape:
{{
  "risk": "safe" | "suspicious" | "dangerous",
  "score": <float 0.0-1.0, where 1.0 = most dangerous>,
  "threats": [<list of threat category strings, empty if safe>],
  "details": "<1-2 sentence human-readable summary>"
}}

When assessing, consider:
- Is the domain a known lookalike or typosquat of a legitimate brand?
- Does it use a URL shortener that hides the real destination?
- Does the path contain suspicious patterns (login, verify, account, password, etc.)?
- Is the TLD unusual for the claimed brand?
- Are there excessive subdomains or encoded characters that obscure the destination?
"""


def _parse_response(raw: str, url: str) -> LinkScanResponse:
    """Extract JSON from Gemini output and build the response model."""
    # Strip any accidental markdown fences
    cleaned = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()
    data = json.loads(cleaned)
    return LinkScanResponse(
        url=url,
        risk=RiskLevel(data["risk"]),
        score=float(data["score"]),
        threats=data.get("threats", []),
        details=data.get("details", ""),
    )


async def scan_link(url: str) -> LinkScanResponse:
    client = get_client()
    prompt = _PROMPT.format(url=url)

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=prompt,
    )

    return _parse_response(response.text, url)
