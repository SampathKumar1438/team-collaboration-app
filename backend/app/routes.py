import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel
from typing import Optional

from .database import get_db
from .auth import create_token, get_current_user, require_role

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# --- Pydantic Models ---

class LoginRequest(BaseModel):
    username: str
    password: str


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: int


class TaskStatusUpdate(BaseModel):
    status: str


class ReviewAction(BaseModel):
    action: str  # 'approved' or 'rejected'
    comment: Optional[str] = None


# --- Auth Routes ---

@router.post("/api/auth/login")
async def login(request: LoginRequest):
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        "SELECT id, username, password, role, full_name FROM users WHERE username = ?",
        (request.username,),
    )
    user = cursor.fetchone()
    db.close()

    if not user or user["password"] != request.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token = create_token(user["id"], user["username"], user["role"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"],
            "full_name": user["full_name"],
        },
    }


# --- User Routes ---

@router.get("/api/users")
async def get_users(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT id, username, role, full_name FROM users")
    users = [dict(row) for row in cursor.fetchall()]
    db.close()
    return users


@router.get("/api/users/developers")
async def get_developers(current_user: dict = Depends(require_role("manager"))):
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        "SELECT id, username, role, full_name FROM users WHERE role = 'developer'"
    )
    developers = [dict(row) for row in cursor.fetchall()]
    db.close()
    return developers


# --- Task Routes ---

@router.post("/api/tasks", status_code=status.HTTP_201_CREATED)
async def create_task(
    task: TaskCreate,
    current_user: dict = Depends(require_role("manager")),
):
    db = get_db()
    cursor = db.cursor()

    # Verify assigned user is a developer
    cursor.execute("SELECT id, role FROM users WHERE id = ?", (task.assigned_to,))
    assignee = cursor.fetchone()
    if not assignee or assignee["role"] != "developer":
        db.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task can only be assigned to a developer",
        )

    cursor.execute(
        """INSERT INTO tasks (title, description, assigned_to, created_by, status)
           VALUES (?, ?, ?, ?, 'assigned')""",
        (task.title, task.description, task.assigned_to, current_user["user_id"]),
    )
    db.commit()
    task_id = cursor.lastrowid
    db.close()

    return {"id": task_id, "message": "Task created successfully"}


@router.get("/api/tasks")
async def get_tasks(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.cursor()

    role = current_user["role"]
    user_id = current_user["user_id"]

    if role == "manager":
        cursor.execute("""
            SELECT t.*, 
                   u1.full_name as assigned_to_name,
                   u2.full_name as created_by_name,
                   u3.full_name as reviewer_name
            FROM tasks t
            LEFT JOIN users u1 ON t.assigned_to = u1.id
            LEFT JOIN users u2 ON t.created_by = u2.id
            LEFT JOIN users u3 ON t.reviewer_id = u3.id
            ORDER BY t.updated_at DESC
        """)
    elif role == "developer":
        cursor.execute("""
            SELECT t.*,
                   u1.full_name as assigned_to_name,
                   u2.full_name as created_by_name,
                   u3.full_name as reviewer_name
            FROM tasks t
            LEFT JOIN users u1 ON t.assigned_to = u1.id
            LEFT JOIN users u2 ON t.created_by = u2.id
            LEFT JOIN users u3 ON t.reviewer_id = u3.id
            WHERE t.assigned_to = ?
            ORDER BY t.updated_at DESC
        """, (user_id,))
    elif role == "reviewer":
        cursor.execute("""
            SELECT t.*,
                   u1.full_name as assigned_to_name,
                   u2.full_name as created_by_name,
                   u3.full_name as reviewer_name
            FROM tasks t
            LEFT JOIN users u1 ON t.assigned_to = u1.id
            LEFT JOIN users u2 ON t.created_by = u2.id
            LEFT JOIN users u3 ON t.reviewer_id = u3.id
            WHERE t.status IN ('completed', 'approved', 'rejected')
            ORDER BY t.updated_at DESC
        """)

    tasks = [dict(row) for row in cursor.fetchall()]
    db.close()
    return tasks


@router.put("/api/tasks/{task_id}/status")
async def update_task_status(
    task_id: int,
    update: TaskStatusUpdate,
    current_user: dict = Depends(require_role("developer")),
):
    valid_transitions = {
        "assigned": ["in_progress"],
        "in_progress": ["completed"],
        "rejected": ["in_progress"],
    }

    db = get_db()
    cursor = db.cursor()

    cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
    task = cursor.fetchone()

    if not task:
        db.close()
        raise HTTPException(status_code=404, detail="Task not found")

    if task["assigned_to"] != current_user["user_id"]:
        db.close()
        raise HTTPException(status_code=403, detail="You can only update your own tasks")

    current_status = task["status"]
    allowed = valid_transitions.get(current_status, [])

    if update.status not in allowed:
        db.close()
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from '{current_status}' to '{update.status}'. Allowed: {allowed}",
        )

    cursor.execute(
        "UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (update.status, task_id),
    )
    db.commit()
    db.close()

    return {"message": f"Task status updated to '{update.status}'"}


@router.put("/api/tasks/{task_id}/review")
async def review_task(
    task_id: int,
    review: ReviewAction,
    current_user: dict = Depends(require_role("reviewer")),
):
    if review.action not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Action must be 'approved' or 'rejected'")

    db = get_db()
    cursor = db.cursor()

    cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
    task = cursor.fetchone()

    if not task:
        db.close()
        raise HTTPException(status_code=404, detail="Task not found")

    if task["status"] != "completed":
        db.close()
        raise HTTPException(status_code=400, detail="Only completed tasks can be reviewed")

    cursor.execute(
        """UPDATE tasks SET status = ?, reviewer_id = ?, review_comment = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?""",
        (review.action, current_user["user_id"], review.comment, task_id),
    )
    db.commit()
    db.close()

    return {"message": f"Task {review.action} successfully"}


@router.post("/api/tasks/{task_id}/upload")
async def upload_image(
    task_id: int,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_role("reviewer")),
):
    db = get_db()
    cursor = db.cursor()

    cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
    task = cursor.fetchone()

    if not task:
        db.close()
        raise HTTPException(status_code=404, detail="Task not found")

    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        db.close()
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    # Save file
    ext = file.filename.split(".")[-1] if file.filename else "png"
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    cursor.execute(
        "UPDATE tasks SET image_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (filename, task_id),
    )
    db.commit()
    db.close()

    return {"message": "Image uploaded successfully", "filename": filename}


@router.get("/api/tasks/stats")
async def get_task_stats(current_user: dict = Depends(require_role("manager"))):
    db = get_db()
    cursor = db.cursor()

    cursor.execute("""
        SELECT status, COUNT(*) as count FROM tasks GROUP BY status
    """)
    stats = {row["status"]: row["count"] for row in cursor.fetchall()}

    cursor.execute("SELECT COUNT(*) as total FROM tasks")
    total = cursor.fetchone()["total"]

    db.close()

    return {
        "total": total,
        "assigned": stats.get("assigned", 0),
        "in_progress": stats.get("in_progress", 0),
        "completed": stats.get("completed", 0),
        "approved": stats.get("approved", 0),
        "rejected": stats.get("rejected", 0),
    }
