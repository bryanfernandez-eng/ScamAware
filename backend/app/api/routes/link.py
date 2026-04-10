from fastapi import APIRouter, HTTPException
from app.schemas.scan import LinkScanRequest, LinkScanResponse
from app.services.link_scanner import scan_link

router = APIRouter()


@router.post("/scan/link", response_model=LinkScanResponse)
async def scan_link_route(body: LinkScanRequest):
    try:
        result = await scan_link(body.url)
        return LinkScanResponse(url=body.url, **result)
    except Exception as err:
        raise HTTPException(status_code=502, detail=f"Link scan error: {err}")
