from fastapi import APIRouter, HTTPException

from app.schemas.scan import LinkScanRequest, LinkScanResponse
from app.services import link_scanner

router = APIRouter(prefix="/scan")


@router.post("/link", response_model=LinkScanResponse)
async def scan_link(body: LinkScanRequest):
    try:
        return await link_scanner.scan_link(str(body.url))
    except RuntimeError as e:
        # Missing API key or config error
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
            raise HTTPException(status_code=429, detail="Gemini API quota exhausted. Try again later.")
        raise HTTPException(status_code=500, detail=str(e))
