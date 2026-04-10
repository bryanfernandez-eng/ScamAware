from fastapi import APIRouter
from app.schemas.scan import LinkScanRequest, LinkScanResponse

router = APIRouter()


@router.post("/scan/link", response_model=LinkScanResponse)
def scan_link(body: LinkScanRequest):
    # TODO: replace with real VirusTotal / Google Safe Browsing integration
    return LinkScanResponse(
        risk="dangerous",
        score=0.94,
        details={
            "matched_feeds": ["Google Safe Browsing", "OpenPhish"],
            "threat_types": ["phishing", "malware"],
            "redirects_to": None,
        },
    )
