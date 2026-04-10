from fastapi import APIRouter
from app.api.routes import health,phone, scan,message

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(phone.router, tags=["phone"])
api_router.include_router(scan.router, tags=["scan"])
api_router.include_router(message.router, tags=["message"])
