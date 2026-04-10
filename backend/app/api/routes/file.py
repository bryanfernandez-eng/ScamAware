from fastapi import APIRouter, UploadFile, File
from app.schemas.scan import FileScanResponse

router = APIRouter()


@router.post("/scan/file", response_model=FileScanResponse)
async def scan_file(file: UploadFile = File(...)):
    # TODO: replace with real VirusTotal file hash / content scan
    return FileScanResponse(
        risk="safe",
        score=0.02,
        file_hash="d41d8cd98f00b204e9800998ecf8427e",
        threats=[],
    )
