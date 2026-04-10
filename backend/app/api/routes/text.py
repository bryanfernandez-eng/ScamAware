from fastapi import APIRouter
from app.schemas.scan import TextScanRequest, TextScanResponse

router = APIRouter()


@router.post("/scan/text", response_model=TextScanResponse)
def scan_text(body: TextScanRequest):
    # TODO: replace with real NLP / URL extraction integration
    return TextScanResponse(
        risk="suspicious",
        score=0.75,
        flags=[
            {"type": "urgency_language", "excerpt": "Your account has been compromised", "link_risk": None},
            {"type": "suspicious_link", "excerpt": "http://bit.ly/abc123", "link_risk": "dangerous"},
        ],
    )
