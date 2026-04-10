from fastapi import APIRouter
from app.api.routes import health, link, phone, file, text,message

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(link.router, tags=["scan"])
api_router.include_router(phone.router, tags=["phone"])
api_router.include_router(file.router, tags=["file"])
api_router.include_router(text.router, tags=["text"])
api_router.include_router(message.router, tags=["message"])
