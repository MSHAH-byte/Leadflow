"""SQLite schema and model definitions for LeadFlow."""

CREATE_LEADS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    contact TEXT,
    inquiry TEXT NOT NULL,
    project_type TEXT NOT NULL,
    requirements TEXT NOT NULL,
    qualification_status TEXT NOT NULL,
    qualification_score INTEGER NOT NULL,
    qualification_factors TEXT NOT NULL,
    missing_information TEXT NOT NULL,
    suggested_questions TEXT NOT NULL,
    response_draft TEXT NOT NULL,
    approved INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
"""
