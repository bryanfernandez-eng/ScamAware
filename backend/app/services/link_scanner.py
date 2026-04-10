import json
import re
from openai import OpenAI
from app.core.config import settings

client = OpenAI(api_key=settings.openai_api_key)

_PROMPT = """\
You are a cybersecurity analyst. Analyze the following URL for scam, phishing, \
malware, and other security risks.

URL: {url}

Respond with ONLY a valid JSON object in this exact shape:
{{
  "risk": "safe or suspicious or dangerous",
  "score": <float 0.0-1.0, where 1.0 = most dangerous>,
  "matched_feeds": [<list of threat intelligence source names that would flag this, empty if safe>],
  "threat_types": [<list of threat category strings like "phishing", "malware", empty if safe>],
  "redirects_to": <null or string if the URL is a shortener pointing elsewhere>
}}

When assessing, consider:
- Is the domain a known lookalike or typosquat of a legitimate brand?
- Does it use a URL shortener that hides the real destination?
- Does the path contain suspicious patterns (login, verify, account, password, etc.)?
- Is the TLD unusual for the claimed brand?
- Are there excessive subdomains or encoded characters that obscure the destination?
"""


async def scan_link(url: str) -> dict:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": _PROMPT.format(url=url)}],
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content
    data = json.loads(raw)

    return {
        "risk": data["risk"],
        "score": float(data["score"]),
        "details": {
            "matched_feeds": data.get("matched_feeds", []),
            "threat_types": data.get("threat_types", []),
            "redirects_to": data.get("redirects_to"),
        },
    }
