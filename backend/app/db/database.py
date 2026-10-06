from pathlib import Path
import sqlite3
from typing import Optional

from app.core.config import settings
from app.db.models import CREATE_LEADS_TABLE_SQL


def get_db_path(custom_path: Optional[str | Path] = None) -> Path:
    """Resolve database path and ensure directory exists."""
    if custom_path is not None:
        path = Path(custom_path)
    else:
        path = settings.resolved_db_path

    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def get_connection(custom_path: Optional[str | Path] = None) -> sqlite3.Connection:
    """Create and return a configured SQLite connection."""
    db_path = get_db_path(custom_path)
    conn = sqlite3.connect(str(db_path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db(custom_path: Optional[str | Path] = None) -> None:
    """Initialize SQLite database and ensure tables exist."""
    conn = get_connection(custom_path)
    try:
        with conn:
            conn.execute(CREATE_LEADS_TABLE_SQL)
    finally:
        conn.close()
