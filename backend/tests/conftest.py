"""
conftest.py: Shared test fixtures for Phase 3 API tests.

Uses a temporary SQLite database injected via pytest fixtures.
The real data/leadflow.db is never touched.
"""

from collections.abc import Generator
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.db.database import init_db
from app.main import app as fastapi_app
from app.services.lead_service import (
    create_lead as original_create_lead,
    get_leads as original_get_leads,
    get_lead_by_id as original_get_lead_by_id,
)


@pytest.fixture(scope="function")
def test_db_path(tmp_path: Path) -> Path:
    """Create and initialize an isolated temporary SQLite database."""
    db = tmp_path / "test_leadflow.db"
    init_db(custom_path=db)
    return db


@pytest.fixture(scope="function")
def api_client(test_db_path: Path) -> Generator[TestClient, None, None]:
    """
    Return a TestClient that uses the isolated temporary database.

    The routes import lead-service functions directly, so the patches target
    the references inside app.api.routes.leads.

    The application lifespan is also patched so startup initialization uses
    the temporary database instead of the production database.
    """

    def patched_create_lead(request, custom_db_path=None):
        return original_create_lead(
            request,
            custom_db_path=test_db_path,
        )

    def patched_get_leads(custom_db_path=None):
        return original_get_leads(
            custom_db_path=test_db_path,
        )

    def patched_get_lead_by_id(lead_id, custom_db_path=None):
        return original_get_lead_by_id(
            lead_id,
            custom_db_path=test_db_path,
        )

    def patched_init_db(custom_path=None):
        return init_db(custom_path=test_db_path)

    with (
        patch(
            "app.api.routes.leads.create_lead",
            side_effect=patched_create_lead,
        ),
        patch(
            "app.api.routes.leads.get_leads",
            side_effect=patched_get_leads,
        ),
        patch(
            "app.api.routes.leads.get_lead_by_id",
            side_effect=patched_get_lead_by_id,
        ),
        patch(
            "app.main.init_db",
            side_effect=patched_init_db,
        ),
    ):
        with TestClient(fastapi_app) as client:
            yield client