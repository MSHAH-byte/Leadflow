from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get("/health", summary="Health Check")
def get_health() -> dict[str, str]:
    return {
        "status": "ok",
        "app_name": settings.PROJECT_NAME,
        "environment": settings.APP_ENV,
    }
