from typing import Any, Literal, Optional, cast
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from app.graph.nodes import (
    check_missing_information,
    classify_inquiry,
    draft_response,
    evaluate_qualification,
    extract_lead_information,
    generate_qualification_questions,
)
from app.graph.state import LeadState
from app.schemas.analysis import LeadAnalysisResult


def route_missing_info(
    state: LeadState,
) -> Literal["generate_qualification_questions", "draft_response"]:
    """Conditional router: checks if missing info requires question generation."""
    missing = state.get("missing_information", [])
    if missing and len(missing) > 0:
        return "generate_qualification_questions"
    return "draft_response"


def create_lead_graph() -> CompiledStateGraph:
    """Build and compile the LeadFlow LangGraph workflow."""
    workflow = StateGraph(cast(Any, LeadState))

    # 1. Register nodes
    workflow.add_node("extract_lead_information", extract_lead_information)
    workflow.add_node("classify_inquiry", classify_inquiry)
    workflow.add_node("evaluate_qualification", evaluate_qualification)
    workflow.add_node("check_missing_information", check_missing_information)
    workflow.add_node("generate_qualification_questions", generate_qualification_questions)
    workflow.add_node("draft_response", draft_response)

    # 2. Add sequential edges
    workflow.add_edge(START, "extract_lead_information")
    workflow.add_edge("extract_lead_information", "classify_inquiry")
    workflow.add_edge("classify_inquiry", "evaluate_qualification")
    workflow.add_edge("evaluate_qualification", "check_missing_information")

    # 3. Add conditional edge after check_missing_information
    workflow.add_conditional_edges(
        "check_missing_information",
        route_missing_info,
        {
            "generate_qualification_questions": "generate_qualification_questions",
            "draft_response": "draft_response",
        },
    )

    # 4. Connect branches to completion
    workflow.add_edge("generate_qualification_questions", "draft_response")
    workflow.add_edge("draft_response", END)

    return workflow.compile()


lead_graph = create_lead_graph()


def run_lead_workflow(
    inquiry: str,
    customer_name: Optional[str] = None,
    contact: Optional[str] = None,
) -> LeadAnalysisResult:
    """Execute the full lead evaluation workflow and return typed LeadAnalysisResult."""
    initial_state: LeadState = {
        "inquiry": inquiry,
        "customer_name": customer_name,
        "contact": contact,
        "extracted_information": {},
        "requirements": [],
        "qualification_factors": [],
        "missing_information": [],
        "suggested_questions": [],
    }

    final_state = lead_graph.invoke(initial_state)

    return LeadAnalysisResult(
        project_type=final_state.get("project_type", "General Inquiry"),
        requirements=final_state.get("requirements", []),
        qualification_status=final_state.get("qualification_status", "needs_information"),
        qualification_score=final_state.get("qualification_score", 50),
        qualification_factors=final_state.get("qualification_factors", []),
        missing_information=final_state.get("missing_information", []),
        suggested_questions=final_state.get("suggested_questions", []),
        response_draft=final_state.get("response_draft", ""),
    )
