from openai import OpenAI
from app.core.config import settings
import os

client = OpenAI(api_key=settings.openai_api_key)

def analyze_phone(phone: str):
    prompt = f"""
You are ScamAware AI, a cybersecurity expert.
Analyze this phone number for scam risk:
{phone}
Return ONLY valid JSON:
{{
  "risk": "low | medium | high",
  "is_scam": true,
  "summary": "short explanation",
  "signals": ["list any scam indicators"],
  "explanation": "simple explanation for non-technical users",
  "tips": ["what the user should do"]
}}
Focus on:
- robocalls
- impersonation scams (IRS, bank, delivery)
- suspicious patterns
- spam likelihood
"""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )
    return response.choices[0].message.content