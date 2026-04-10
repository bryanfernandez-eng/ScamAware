from fastapi import APIRouter
from app.schemas.scan import PhoneScanRequest, PhoneScanResponse

router = APIRouter()


@router.post("/scan/phone", response_model=PhoneScanResponse)
def scan_phone(body: PhoneScanRequest):
    # TODO: replace with real NumVerify / scam database integration
    return PhoneScanResponse(
        risk="suspicious",
        reports=47,
        carrier="Verizon",
        location="United States",
        scam_types=["IRS impersonation", "robocall"],
    )
