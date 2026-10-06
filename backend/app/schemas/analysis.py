from typing import Literal, Optional
from pydantic import BaseModel, Field


class ExtractedLeadInfo(BaseModel):
    """Structured information extracted from initial lead inquiry."""

    customer_name: Optional[str] = Field(
        default=None, description="Customer or prospect name if mentioned."
    )
    contact: Optional[str] = Field(
        default=None, description="Contact method, email, or phone if mentioned."
    )
    business_type: Optional[str] = Field(
        default=None, description="Business type, company, or industry (e.g. restaurant)."
    )
    timeline: Optional[str] = Field(
        default=None, description="Project timeline or urgency if indicated."
    )
    budget: Optional[str] = Field(
        default=None, description="Budget indication or pricing inquiry if mentioned."
    )
    key_details: list[str] = Field(
        default_factory=list, description="Key extracted project details."
    )


class InquiryClassification(BaseModel):
    """Classification of the inquiry project type and requirements."""

    project_type: str = Field(
        ...,
        description="Category of the project (e.g., 'Web Development', 'Mobile App', 'E-commerce', 'Automation').",
    )
    requirements: list[str] = Field(
        default_factory=list,
        description="Extracted functional or technical requirements.",
    )


class QualificationEvaluation(BaseModel):
    """Heuristic assessment of lead qualification."""

    qualification_status: Literal["qualified", "needs_information", "not_qualified"] = Field(
        ...,
        description="Qualification state: 'qualified', 'needs_information', or 'not_qualified'.",
    )
    qualification_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Heuristic qualification score between 0 and 100.",
    )
    qualification_factors: list[str] = Field(
        default_factory=list,
        description="Concise reasons justifying the score and status. No chain-of-thought.",
    )


class MissingInfoCheck(BaseModel):
    """Check for missing project critical details."""

    has_missing_info: bool = Field(
        ...,
        description="True if critical information (scope, timeline, budget, technical needs) is missing.",
    )
    missing_information: list[str] = Field(
        default_factory=list,
        description="List of specific information gaps required to proceed with an estimate or proposal.",
    )


class SuggestedQuestions(BaseModel):
    """Qualification questions to ask the prospect."""

    suggested_questions: list[str] = Field(
        default_factory=list,
        description="Concise, high-value clarifying questions to ask the lead.",
    )


class ResponseDraft(BaseModel):
    """Draft message to the lead."""

    response_draft: str = Field(
        ...,
        description="Polite, professional response to the lead addressing their inquiry and next steps.",
    )


class LeadAnalysisResult(BaseModel):
    """Final consolidated lead analysis result."""

    project_type: str
    requirements: list[str]
    qualification_status: Literal["qualified", "needs_information", "not_qualified"]
    qualification_score: int = Field(..., ge=0, le=100)
    qualification_factors: list[str]
    missing_information: list[str]
    suggested_questions: list[str]
    response_draft: str
