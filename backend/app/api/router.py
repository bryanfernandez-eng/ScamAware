from fastapi import APIRouter
from app.api.routes import health, link, text, file, phone

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(link.router, tags=["scan"])
api_router.include_router(text.router, tags=["scan"])
api_router.include_router(file.router, tags=["scan"])
api_router.include_router(phone.router, tags=["scan"])
