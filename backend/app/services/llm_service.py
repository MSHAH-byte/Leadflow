import logging
from typing import Optional
from fastapi import HTTPException

from app.graph.graph import run_lead_workflow
from app.schemas.analysis import LeadAnalysisResult

logger = logging.getLogger(__name__)


def analyze_lead_inquiry(
    customer_name: str,
    inquiry: str,
    contact: Optional[str] = None,
) -> LeadAnalysisResult:
    """Execute LangGraph lead workflow with safe error handling."""
    try:
        return run_lead_workflow(
            inquiry=inquiry,
            customer_name=customer_name,
            contact=contact,
        )
    except Exception as exc:
        logger.exception("AI workflow execution failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Failed to analyze lead inquiry due to an internal service error.",
        ) from exc