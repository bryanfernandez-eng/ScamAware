from enum import Enum
from pydantic import BaseModel, HttpUrl


class RiskLevel(str, Enum):
    safe = "safe"
    suspicious = "suspicious"
    dangerous = "dangerous"


class LinkScanRequest(BaseModel):
    url: HttpUrl


class LinkScanResponse(BaseModel):
    risk: RiskLevel
    score: float          # 0.0 – 1.0
    url: str
    threats: list[str]    # e.g. ["phishing", "malware"]
    details: str          # human-readable Gemini summary
