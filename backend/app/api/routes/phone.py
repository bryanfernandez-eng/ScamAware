from fastapi import APIRouter
from app.schemas.phone import PhoneRequest
from app.services.phone_services import analyze_phone
import json

router = APIRouter()

@router.post("/scan/phone")
def scan_phone(request: PhoneRequest):

    result = analyze_phone(request.phone)

    try:
        return json.loads(result)
    except:
        return {
            "risk": "medium",
            "is_scam": None,
            "summary": result,
            "signals": [],
            "explanation": "Raw model output (JSON parsing failed)",
            "tips": []
        }