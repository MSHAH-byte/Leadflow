import logging
from fastapi import APIRouter, HTTPException, status
from app.schemas.lead import (
    AnalyzeLeadRequest,
    AnalyzeLeadResponse,
    CreateLeadRequest,
    LeadListItem,
    LeadResponse,
)
from app.services.llm_service import analyze_lead_inquiry
from app.services.lead_service import create_lead, get_leads, get_lead_by_id

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/analyze",
    response_model=AnalyzeLeadResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze Lead Inquiry",
    description="Run the LangGraph AI workflow on a customer inquiry. Does NOT save the lead.",
)
def analyze_lead(request: AnalyzeLeadRequest) -> AnalyzeLeadResponse:
    analysis = analyze_lead_inquiry(
        customer_name=request.customer_name,
        inquiry=request.inquiry,
        contact=request.contact,
    )
    return AnalyzeLeadResponse(analysis=analysis)


@router.post(
    "",
    response_model=LeadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save Lead",
    description="Persist a reviewed (and optionally edited) lead analysis to SQLite. No LLM calls are made.",
)
def save_lead(request: CreateLeadRequest) -> LeadResponse:
    try:
        return create_lead(request)
    except Exception as exc:
        logger.exception("Failed to save lead: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save lead due to an internal error.",
        ) from exc


@router.get(
    "",
    response_model=list[LeadListItem],
    status_code=status.HTTP_200_OK,
    summary="List Leads",
    description="Return saved leads as compact list items, newest first.",
)
def list_leads() -> list[LeadListItem]:
    try:
        return get_leads()
    except Exception as exc:
        logger.exception("Failed to retrieve leads: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve leads.",
        ) from exc


@router.get(
    "/{lead_id}",
    response_model=LeadResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Lead",
    description="Return the full details of a single saved lead.",
)
def get_lead(lead_id: int) -> LeadResponse:
    lead = get_lead_by_id(lead_id)
    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead with id {lead_id} not found.",
        )
    return lead
