from fastapi import APIRouter
from app.api.routes import health,phone

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(phone.router, tags=["phone"])