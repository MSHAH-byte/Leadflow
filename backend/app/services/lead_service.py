from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Optional

from app.db.database import get_connection
from app.schemas.lead import CreateLeadRequest, LeadListItem, LeadResponse


def create_lead(
    lead_in: CreateLeadRequest, custom_db_path: Optional[str | Path] = None
) -> LeadResponse:
    """Save reviewed/edited lead record into SQLite."""
    now_iso = datetime.now(timezone.utc).isoformat()
    conn = get_connection(custom_db_path)
    try:
        with conn:
            cursor = conn.execute(
                """
                INSERT INTO leads (
                    customer_name,
                    contact,
                    inquiry,
                    project_type,
                    requirements,
                    qualification_status,
                    qualification_score,
                    qualification_factors,
                    missing_information,
                    suggested_questions,
                    response_draft,
                    approved,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    lead_in.customer_name,
                    lead_in.contact,
                    lead_in.inquiry,
                    lead_in.project_type,
                    json.dumps(lead_in.requirements),
                    lead_in.qualification_status,
                    lead_in.qualification_score,
                    json.dumps(lead_in.qualification_factors),
                    json.dumps(lead_in.missing_information),
                    json.dumps(lead_in.suggested_questions),
                    lead_in.response_draft,
                    1 if lead_in.approved else 0,
                    now_iso,
                    now_iso,
                ),
            )
            lead_id = cursor.lastrowid
            if lead_id is None:
                raise RuntimeError("Failed to retrieve inserted lead ID.")

        return LeadResponse(
            id=lead_id,
            customer_name=lead_in.customer_name,
            contact=lead_in.contact,
            inquiry=lead_in.inquiry,
            project_type=lead_in.project_type,
            requirements=lead_in.requirements,
            qualification_status=lead_in.qualification_status,
            qualification_score=lead_in.qualification_score,
            qualification_factors=lead_in.qualification_factors,
            missing_information=lead_in.missing_information,
            suggested_questions=lead_in.suggested_questions,
            response_draft=lead_in.response_draft,
            approved=lead_in.approved,
            created_at=now_iso,
            updated_at=now_iso,
        )
    finally:
        conn.close()


def get_leads(custom_db_path: Optional[str | Path] = None) -> list[LeadListItem]:
    """Retrieve summarized list of saved leads ordered newest first."""
    conn = get_connection(custom_db_path)
    try:
        cursor = conn.execute(
            """
            SELECT
                id,
                customer_name,
                contact,
                project_type,
                qualification_status,
                qualification_score,
                approved,
                created_at
            FROM leads
            ORDER BY id DESC
            """
        )
        rows = cursor.fetchall()
        return [
            LeadListItem(
                id=row["id"],
                customer_name=row["customer_name"],
                contact=row["contact"],
                project_type=row["project_type"],
                qualification_status=row["qualification_status"],
                qualification_score=row["qualification_score"],
                approved=bool(row["approved"]),
                created_at=row["created_at"],
            )
            for row in rows
        ]
    finally:
        conn.close()


def get_lead_by_id(
    lead_id: int, custom_db_path: Optional[str | Path] = None
) -> Optional[LeadResponse]:
    """Retrieve full details of a saved lead by ID."""
    conn = get_connection(custom_db_path)
    try:
        cursor = conn.execute(
            """
            SELECT * FROM leads WHERE id = ?
            """,
            (lead_id,),
        )
        row = cursor.fetchone()
        if row is None:
            return None

        return LeadResponse(
            id=row["id"],
            customer_name=row["customer_name"],
            contact=row["contact"],
            inquiry=row["inquiry"],
            project_type=row["project_type"],
            requirements=json.loads(row["requirements"]),
            qualification_status=row["qualification_status"],
            qualification_score=row["qualification_score"],
            qualification_factors=json.loads(row["qualification_factors"]),
            missing_information=json.loads(row["missing_information"]),
            suggested_questions=json.loads(row["suggested_questions"]),
            response_draft=row["response_draft"],
            approved=bool(row["approved"]),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )
    finally:
        conn.close()
