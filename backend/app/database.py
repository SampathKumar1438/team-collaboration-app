import sqlite3
import os

DATABASE_PATH = os.path.join(os.path.dirname(__file__), "collaboration.db")


def get_db():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('manager', 'developer', 'reviewer')),
            full_name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'assigned' CHECK(status IN ('assigned', 'in_progress', 'completed', 'approved', 'rejected')),
            assigned_to INTEGER,
            created_by INTEGER NOT NULL,
            reviewer_id INTEGER,
            review_comment TEXT,
            image_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (assigned_to) REFERENCES users(id),
            FOREIGN KEY (created_by) REFERENCES users(id),
            FOREIGN KEY (reviewer_id) REFERENCES users(id)
        );
    """)

    # Insert sample users if they don't exist
    sample_users = [
        ("manager1", "manager123", "manager", "Alice Manager"),
        ("developer1", "dev123", "developer", "Bob Developer"),
        ("developer2", "dev456", "developer", "Charlie Developer"),
        ("reviewer1", "rev123", "reviewer", "Diana Reviewer"),
    ]

    for username, password, role, full_name in sample_users:
        cursor.execute(
            "INSERT OR IGNORE INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)",
            (username, password, role, full_name),
        )

    conn.commit()
    conn.close()
