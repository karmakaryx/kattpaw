import os
import sqlite3

import config

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), os.getenv("DB_NAME"))

def get_db_connection() -> sqlite3.Connection:
    return sqlite3.connect(DB_PATH)

def init_db():
    conn = get_db_connection()

    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS snapshot (
                id TEXT PRIMARY KEY,
                file_name TEXT,
                chat_summary TEXT,
                chat_history TEXT,
                code_snippet TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("CREATE INDEX IF NOT EXISTS idx_file_name ON snapshot(file_name)")
        conn.commit()

    finally:
        conn.close()
