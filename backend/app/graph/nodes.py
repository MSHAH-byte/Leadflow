from typing import cast
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq

from app.core.config import settings
from app.graph.prompts import (
    CHECK_MISSING_INFO_SYSTEM,
    CLASSIFY_INQUIRY_SYSTEM,
    DRAFT_RESPONSE_SYSTEM,
    EVALUATE_QUALIFICATION_SYSTEM,
    EXTRACT_INFO_SYSTEM,
    GENERATE_QUESTIONS_SYSTEM,
)
from app.graph.state import LeadState
from app.schemas.analysis import (
    ExtractedLeadInfo,
    InquiryClassification,
    MissingInfoCheck,
    QualificationEvaluation,
    ResponseDraft,
    SuggestedQuestions,
)


def get_llm() -> ChatGroq:
    """Instantiate and return the configured Groq chat model."""
    return ChatGroq(
        model=settings.GROQ_MODEL,
        temperature=0.0,
        groq_api_key=settings.GROQ_API_KEY,
    )


def extract_lead_information(state: LeadState) -> dict:
    """Node 1: Extract factual lead details from the raw inquiry text."""
    llm = get_llm().with_structured_output(ExtractedLeadInfo)
    prompt = f"Lead Inquiry:\n{state.get('inquiry', '')}"
    result = cast(
        ExtractedLeadInfo,
        llm.invoke([SystemMessage(content=EXTRACT_INFO_SYSTEM), HumanMessage(content=prompt)]),
    )

    updates: dict = {
        "extracted_information": result.model_dump(),
    }
    if result.customer_name and not state.get("customer_name"):
        updates["customer_name"] = result.customer_name
    if result.contact and not state.get("contact"):
        updates["contact"] = result.contact

    return updates


def classify_inquiry(state: LeadState) -> dict:
    """Node 2: Classify the inquiry project category and explicit functional requirements."""
    llm = get_llm().with_structured_output(InquiryClassification)
    prompt = (
        f"Inquiry: {state.get('inquiry', '')}\n"
        f"Extracted Information: {state.get('extracted_information', {})}"
    )
    result = cast(
        InquiryClassification,
        llm.invoke([SystemMessage(content=CLASSIFY_INQUIRY_SYSTEM), HumanMessage(content=prompt)]),
    )

    return {
        "project_type": result.project_type,
        "requirements": result.requirements,
    }


def evaluate_qualification(state: LeadState) -> dict:
    """Node 3: Assess lead qualification status, numeric score, and concise factors."""
    llm = get_llm().with_structured_output(QualificationEvaluation)
    prompt = (
        f"Inquiry: {state.get('inquiry', '')}\n"
        f"Project Type: {state.get('project_type', '')}\n"
        f"Explicit Requirements: {state.get('requirements', [])}\n"
        f"Extracted Details: {state.get('extracted_information', {})}"
    )
    result = cast(
        QualificationEvaluation,
        llm.invoke(
            [SystemMessage(content=EVALUATE_QUALIFICATION_SYSTEM), HumanMessage(content=prompt)]
        ),
    )

    return {
        "qualification_status": result.qualification_status,
        "qualification_score": result.qualification_score,
        "qualification_factors": result.qualification_factors,
    }


def check_missing_information(state: LeadState) -> dict:
    """Node 4: Identify whether critical project details are missing."""
    known_name = state.get("customer_name")
    known_contact = state.get("contact")

    llm = get_llm().with_structured_output(MissingInfoCheck)
    prompt = (
        f"Inquiry: {state.get('inquiry', '')}\n"
        f"Known Customer Name: {known_name if known_name else 'Not provided'}\n"
        f"Known Contact Details: {known_contact if known_contact else 'Not provided'}\n"
        f"Project Type: {state.get('project_type', '')}\n"
        f"Identified Explicit Requirements: {state.get('requirements', [])}\n"
        f"Extracted Details: {state.get('extracted_information', {})}"
    )
    result = cast(
        MissingInfoCheck,
        llm.invoke(
            [SystemMessage(content=CHECK_MISSING_INFO_SYSTEM), HumanMessage(content=prompt)]
        ),
    )

    raw_missing = result.missing_information if result.has_missing_info else []

    # Filter out contact/CRM metadata if already supplied
    filtered_missing: list[str] = []
    for item in raw_missing:
        item_lower = item.lower()
        if known_name and ("customer name" in item_lower or "client name" in item_lower or item_lower.strip() == "name"):
            continue
        if known_contact and ("contact" in item_lower or "email" in item_lower or "phone" in item_lower):
            continue
        filtered_missing.append(item)

    return {
        "missing_information": filtered_missing,
    }


def generate_qualification_questions(state: LeadState) -> dict:
    """Node 5: Generate clarifying questions for any identified missing information."""
    missing = state.get("missing_information", [])
    if not missing:
        return {"suggested_questions": []}

    known_name = state.get("customer_name")
    known_contact = state.get("contact")

    llm = get_llm().with_structured_output(SuggestedQuestions)
    prompt = (
        f"Customer Name: {known_name if known_name else 'Unknown'}\n"
        f"Customer Contact: {known_contact if known_contact else 'Unknown'}\n"
        f"Project Type: {state.get('project_type', '')}\n"
        f"Original Inquiry: {state.get('inquiry', '')}\n"
        f"Missing Information Gaps: {missing}"
    )
    result = cast(
        SuggestedQuestions,
        llm.invoke(
            [SystemMessage(content=GENERATE_QUESTIONS_SYSTEM), HumanMessage(content=prompt)]
        ),
    )

    # Filter out questions asking for name or contact info if already known
    filtered_questions: list[str] = []
    for q in result.suggested_questions:
        q_lower = q.lower()
        if known_name and ("your name" in q_lower or "who is this" in q_lower):
            continue
        if known_contact and ("email" in q_lower or "phone" in q_lower or "best way to reach" in q_lower or "best number" in q_lower):
            continue
        filtered_questions.append(q)

    return {
        "suggested_questions": filtered_questions,
    }


def draft_response(state: LeadState) -> dict:
    """Node 6: Draft a customized, professional reply to the client."""
    client_name = state.get("customer_name")
    greeting_name = client_name if client_name else "there"

    llm = get_llm().with_structured_output(ResponseDraft)
    prompt = (
        f"Client Name: {greeting_name}\n"
        f"Inquiry: {state.get('inquiry', '')}\n"
        f"Project Type: {state.get('project_type', '')}\n"
        f"Explicit Requirements: {state.get('requirements', [])}\n"
        f"Suggested Questions to Include: {state.get('suggested_questions', [])}\n"
        f"Qualification Status: {state.get('qualification_status', '')}"
    )
    result = cast(
        ResponseDraft,
        llm.invoke([SystemMessage(content=DRAFT_RESPONSE_SYSTEM), HumanMessage(content=prompt)]),
    )

    return {
        "response_draft": result.response_draft,
    }
