import pytest
from app.graph.graph import create_lead_graph, route_missing_info, run_lead_workflow
from app.graph.state import LeadState
from app.schemas.analysis import LeadAnalysisResult


def test_graph_nodes_and_edges():
    """Verify the compiled graph contains all required Phase 2 nodes."""
    graph = create_lead_graph()
    expected_nodes = {
        "extract_lead_information",
        "classify_inquiry",
        "evaluate_qualification",
        "check_missing_information",
        "generate_qualification_questions",
        "draft_response",
    }
    assert expected_nodes.issubset(set(graph.nodes.keys()))


def test_conditional_routing_branches():
    """Test 4: Verify both branches of conditional routing."""
    # Branch A: Missing information exists -> route to generate_qualification_questions
    state_with_missing: LeadState = {
        "inquiry": "I need an app.",
        "missing_information": ["Budget expectations", "Target platform"],
    }
    assert route_missing_info(state_with_missing) == "generate_qualification_questions"

    # Branch B: No missing information -> route directly to draft_response
    state_without_missing: LeadState = {
        "inquiry": "I need an app with full specs and fixed budget.",
        "missing_information": [],
    }
    assert route_missing_info(state_without_missing) == "draft_response"


def test_restaurant_inquiry_with_structured_contact():
    """Test 1: Restaurant inquiry with supplied customer name and contact."""
    inquiry = "Hi, I need a website for my restaurant. How much would it cost? We need it before next month."
    customer_name = "Ahmed"
    contact = "ahmed@example.com"

    result = run_lead_workflow(
        inquiry=inquiry,
        customer_name=customer_name,
        contact=contact,
    )

    # 1. Structure and type
    assert isinstance(result, LeadAnalysisResult)

    # 2. Project type and grounded requirements
    assert "web" in result.project_type.lower()
    reqs_text = " ".join(result.requirements).lower()
    assert "restaurant" in reqs_text or "website" in reqs_text

    # Verify no invented features
    assert "responsive design" not in reqs_text
    assert "contact information" not in reqs_text

    # 3. Customer name & contact must NOT be in missing_information
    missing_text = " ".join(result.missing_information).lower()
    assert "customer name" not in missing_text
    assert "ahmed" not in missing_text
    assert "email" not in missing_text
    assert "contact details" not in missing_text

    # 4. Budget & exact deadline can be identified as missing
    assert len(result.missing_information) > 0

    # 5. Suggested questions must NOT ask for name or email/phone
    questions_text = " ".join(result.suggested_questions).lower()
    assert "what is your name" not in questions_text
    assert "what is your email" not in questions_text
    assert "phone number" not in questions_text

    # 6. Response draft must not invent unrequested features
    draft_lower = result.response_draft.lower()
    assert "responsive" not in draft_lower

    # 7. Qualification score and status
    assert 0 <= result.qualification_score <= 100
    assert result.qualification_status in ("qualified", "needs_information", "not_qualified")


def test_detailed_inquiry_explicit_requirements():
    """Test 2: Detailed inquiry with several explicit requirements."""
    inquiry = (
        "I need an ecommerce website for my clothing business. "
        "It should have Stripe payments, product search, customer accounts, "
        "and an admin dashboard. Our target launch date is December 1. "
        "Our budget is around $5,000."
    )

    result = run_lead_workflow(inquiry=inquiry)

    reqs_text = " ".join(result.requirements).lower()
    # Explicit requirements should be captured
    assert "stripe" in reqs_text or "payment" in reqs_text
    assert "product search" in reqs_text or "search" in reqs_text
    assert "account" in reqs_text
    assert "admin" in reqs_text or "dashboard" in reqs_text

    # Check that score reflects commercial readiness
    assert result.qualification_score >= 70
    assert result.qualification_status in ("qualified", "needs_information")


def test_structured_contact_information_not_missing():
    """Test 3: Contact metadata should never appear in missing info or questions."""
    inquiry = "We need an inventory automation script for our warehouse."
    customer_name = "Ahmed"
    contact = "ahmed@example.com"

    result = run_lead_workflow(
        inquiry=inquiry,
        customer_name=customer_name,
        contact=contact,
    )

    for item in result.missing_information:
        item_lower = item.lower()
        assert "customer name" not in item_lower
        assert "ahmed" not in item_lower
        assert "email" not in item_lower
        assert "contact" not in item_lower

    for q in result.suggested_questions:
        q_lower = q.lower()
        assert "your name" not in q_lower
        assert "your email" not in q_lower
        assert "phone number" not in q_lower
