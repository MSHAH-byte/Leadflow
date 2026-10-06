from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator
from app.schemas.analysis import LeadAnalysisResult


class AnalyzeLeadRequest(BaseModel):
    """Payload to trigger LangGraph AI lead analysis."""

    customer_name: str = Field(..., min_length=1, description="Customer or prospect name.")
    contact: Optional[str] = Field(default=None, description="Contact email or phone number.")
    inquiry: str = Field(..., min_length=1, description="Customer inquiry text.")

    @field_validator("customer_name", "inquiry")
    @classmethod
    def validate_not_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Field cannot be empty or contain only whitespace.")
        return stripped


class AnalyzeLeadResponse(BaseModel):
    """Response containing the structured analysis from LangGraph."""

    analysis: LeadAnalysisResult


class CreateLeadRequest(BaseModel):
    """Payload to save a reviewed or human-edited lead into SQLite."""

    customer_name: str = Field(..., min_length=1)
    contact: Optional[str] = Field(default=None)
    inquiry: str = Field(..., min_length=1)
    project_type: str = Field(..., min_length=1)
    requirements: list[str] = Field(default_factory=list)
    qualification_status: Literal["qualified", "needs_information", "not_qualified"]
    qualification_score: int = Field(..., ge=0, le=100)
    qualification_factors: list[str] = Field(default_factory=list)
    missing_information: list[str] = Field(default_factory=list)
    suggested_questions: list[str] = Field(default_factory=list)
    response_draft: str = Field(...)
    approved: bool = Field(default=False)

    @field_validator("customer_name", "inquiry", "project_type", "response_draft")
    @classmethod
    def validate_not_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Field cannot be empty or contain only whitespace.")
        return stripped


class LeadResponse(CreateLeadRequest):
    """Complete saved lead record with database metadata."""

    id: int
    created_at: str
    updated_at: str


class LeadListItem(BaseModel):
    """Compact summary of a saved lead for list views."""

    id: int
    customer_name: str
    contact: Optional[str] = None
    project_type: str
    qualification_status: Literal["qualified", "needs_information", "not_qualified"]
    qualification_score: int
    approved: bool
    created_at: str
