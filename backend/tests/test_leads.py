"""API tests for Phase 3: health, leads analyze, save, list, get, and 404."""
from typing import Any
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.schemas.analysis import LeadAnalysisResult


# ---------------------------------------------------------------------------
# Shared test data
# ---------------------------------------------------------------------------
MOCK_ANALYSIS = LeadAnalysisResult(
    project_type="Web Development",
    requirements=["Restaurant website"],
    qualification_status="needs_information",
    qualification_score=60,
    qualification_factors=[
        "Clear project goal: restaurant website",
        "Timeline mentioned: before next month",
        "No budget disclosed",
    ],
    missing_information=["Budget expectations or pricing range", "Exact launch deadline"],
    suggested_questions=[
        "What budget range have you allocated for the project?",
        "When exactly would you like the website to be live?",
    ],
    response_draft="Hello Ahmed, thank you for reaching out about your restaurant website.",
)

SAVE_PAYLOAD: dict[str, Any] = {
    "customer_name": "Ahmed",
    "contact": "ahmed@example.com",
    "inquiry": "I need a website for my restaurant. How much would it cost?",
    "project_type": "Web Development",
    "requirements": ["Restaurant website"],
    "qualification_status": "needs_information",
    "qualification_score": 60,
    "qualification_factors": ["Clear project goal"],
    "missing_information": ["Budget expectations"],
    "suggested_questions": ["What is your budget?"],
    "response_draft": "Hello Ahmed, we will help you.",
    "approved": True,
}

EDITED_PAYLOAD: dict[str, Any] = {
    **SAVE_PAYLOAD,
    "customer_name": "Ahmed (Edited)",
    "response_draft": "This is the human-edited response draft.",
    "qualification_score": 75,
    "approved": False,
}


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------
class TestHealthEndpoint:
    """Test 1 — Health endpoint still works after Phase 3 changes."""

    def test_health_returns_200(self, api_client: TestClient):
        response = api_client.get("/api/v1/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


class TestAnalyzeEndpoint:
    """Test 2 — POST /api/v1/leads/analyze with mocked LangGraph."""

    def test_analyze_returns_200_and_valid_structure(self, api_client: TestClient):
        with patch("app.services.llm_service.run_lead_workflow", return_value=MOCK_ANALYSIS):
            response = api_client.post(
                "/api/v1/leads/analyze",
                json={
                    "customer_name": "Ahmed",
                    "contact": "ahmed@example.com",
                    "inquiry": "I need a website for my restaurant.",
                },
            )
        assert response.status_code == 200
        data = response.json()
        assert "analysis" in data
        a = data["analysis"]
        assert isinstance(a["project_type"], str) and a["project_type"]
        assert isinstance(a["requirements"], list)
        assert a["qualification_status"] in ("qualified", "needs_information", "not_qualified")
        assert 0 <= a["qualification_score"] <= 100
        assert isinstance(a["missing_information"], list)
        assert isinstance(a["suggested_questions"], list)
        assert isinstance(a["response_draft"], str) and a["response_draft"]


class TestValidation:
    """Test 3 — Validation returns 422 for invalid inputs."""

    def test_blank_inquiry_returns_422(self, api_client: TestClient):
        response = api_client.post(
            "/api/v1/leads/analyze",
            json={"customer_name": "Ahmed", "inquiry": "   "},
        )
        assert response.status_code == 422

    def test_missing_customer_name_returns_422(self, api_client: TestClient):
        response = api_client.post(
            "/api/v1/leads/analyze",
            json={"inquiry": "I need a website."},
        )
        assert response.status_code == 422

    def test_empty_customer_name_returns_422(self, api_client: TestClient):
        response = api_client.post(
            "/api/v1/leads/analyze",
            json={"customer_name": "  ", "inquiry": "I need a website."},
        )
        assert response.status_code == 422


class TestCreateLead:
    """Test 4 — POST /api/v1/leads saves the lead."""

    def test_create_lead_returns_201(self, api_client: TestClient):
        response = api_client.post("/api/v1/leads", json=SAVE_PAYLOAD)
        assert response.status_code == 201
        data = response.json()
        assert isinstance(data["id"], int)
        assert data["customer_name"] == "Ahmed"
        assert data["qualification_score"] == 60
        assert data["approved"] is True
        assert "created_at" in data
        assert "updated_at" in data


class TestListLeads:
    """Test 5 — GET /api/v1/leads returns compact list items."""

    def test_list_leads_contains_created_lead(self, api_client: TestClient):
        api_client.post("/api/v1/leads", json=SAVE_PAYLOAD)
        response = api_client.get("/api/v1/leads")
        assert response.status_code == 200
        items = response.json()
        assert isinstance(items, list)
        assert len(items) >= 1
        item = items[0]
        # Must have summary fields
        assert "id" in item
        assert "customer_name" in item
        assert "qualification_status" in item
        assert "qualification_score" in item
        # Must NOT expose full payload in list view
        assert "inquiry" not in item
        assert "response_draft" not in item
        assert "requirements" not in item


class TestGetLead:
    """Test 6 — GET /api/v1/leads/{id} returns full lead."""

    def test_get_lead_by_id_returns_full_record(self, api_client: TestClient):
        create_resp = api_client.post("/api/v1/leads", json=SAVE_PAYLOAD)
        lead_id = create_resp.json()["id"]

        response = api_client.get(f"/api/v1/leads/{lead_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == lead_id
        assert data["customer_name"] == "Ahmed"
        assert data["inquiry"] == SAVE_PAYLOAD["inquiry"]
        assert data["response_draft"] == SAVE_PAYLOAD["response_draft"]


class TestMissingLead:
    """Test 7 — GET /api/v1/leads/{id} for nonexistent ID returns 404."""

    def test_nonexistent_lead_returns_404(self, api_client: TestClient):
        response = api_client.get("/api/v1/leads/99999")
        assert response.status_code == 404


class TestEditedValuesPreserved:
    """Test 8 — Human-edited values are stored and returned exactly."""

    def test_edited_values_preserved(self, api_client: TestClient):
        response = api_client.post("/api/v1/leads", json=EDITED_PAYLOAD)
        assert response.status_code == 201
        lead_id = response.json()["id"]

        detail = api_client.get(f"/api/v1/leads/{lead_id}")
        assert detail.status_code == 200
        data = detail.json()

        assert data["customer_name"] == "Ahmed (Edited)"
        assert data["response_draft"] == "This is the human-edited response draft."
        assert data["qualification_score"] == 75
        assert data["approved"] is False
