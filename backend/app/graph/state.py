from typing import Any, Literal, Optional
from typing_extensions import TypedDict


class LeadState(TypedDict, total=False):
    """LangGraph state representation for the lead qualification workflow."""

    customer_name: Optional[str]
    contact: Optional[str]
    inquiry: str
    extracted_information: dict[str, Any]
    project_type: Optional[str]
    requirements: list[str]
    qualification_status: Optional[Literal["qualified", "needs_information", "not_qualified"]]
    qualification_score: Optional[int]
    qualification_factors: list[str]
    missing_information: list[str]
    suggested_questions: list[str]
    response_draft: Optional[str]
