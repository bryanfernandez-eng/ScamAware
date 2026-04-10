from fastapi import APIRouter
from app.schemas.message import MessageRequest
from app.services.message_service import analyze_message
import json

router = APIRouter()

@router.post("/scan/message")
def scan_message(request: MessageRequest):

    result = analyze_message(request.message)

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