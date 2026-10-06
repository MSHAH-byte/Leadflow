from fastapi import APIRouter
from app.api.v1.endpoints import health
from app.api.routes import leads

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(leads.router, prefix="/leads", tags=["Leads"])
