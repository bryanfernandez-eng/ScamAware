from __future__ import annotations

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel


class RiskLevel(str, Enum):
    safe = "safe"
    suspicious = "suspicious"
    dangerous = "dangerous"


# --- Requests ---

class LinkScanRequest(BaseModel):
    url: str

class TextScanRequest(BaseModel):
    content: str

class PhoneScanRequest(BaseModel):
    phone: str


# --- Responses ---

class LinkScanResponse(BaseModel):
    risk: RiskLevel
    score: float
    details: dict

class TextFlag(BaseModel):
    type: str
    excerpt: str
    link_risk: Optional[RiskLevel] = None

class TextScanResponse(BaseModel):
    risk: RiskLevel
    score: float
    flags: List[TextFlag]

class FileScanResponse(BaseModel):
    risk: RiskLevel
    score: float
    file_hash: str
    threats: List[str]

class PhoneScanResponse(BaseModel):
    risk: RiskLevel
    reports: int
    carrier: Optional[str] = None
    location: Optional[str] = None
    scam_types: List[str]
