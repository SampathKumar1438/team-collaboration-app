# Team Collaboration App

A role-based team collaboration application with JWT authentication, SQLite database, and distinct dashboards for Manager, Developer, and Reviewer roles.

## Features

### Roles
- **Manager**: Creates and assigns tasks to developers, tracks overall progress with statistics
- **Developer**: Views assigned tasks, updates task status through the lifecycle
- **Reviewer**: Reviews completed tasks, approves/rejects them, can upload images

### Task Lifecycle
```
Assigned → In Progress → Completed → Approved / Rejected
                                         ↓
                                    In Progress (rework)
```

### Authentication
JWT-based authentication with predefined sample credentials:

| Role      | Username    | Password    |
|-----------|-------------|-------------|
| Manager   | manager1    | manager123  |
| Developer | developer1  | dev123      |
| Developer | developer2  | dev456      |
| Reviewer  | reviewer1   | rev123      |

## Tech Stack

- **Backend**: FastAPI (Python) + SQLite + JWT
- **Frontend**: React + TypeScript + Tailwind CSS + Vite

## Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+
- Poetry (Python package manager)

### Backend Setup
```bash
cd backend
poetry install
poetry run fastapi dev app/main.py --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend API on `http://localhost:8000`.

## API Endpoints

| Method | Endpoint                      | Role      | Description                |
|--------|-------------------------------|-----------|----------------------------|
| POST   | /api/auth/login               | Public    | Login with credentials     |
| GET    | /api/users                    | All       | List all users             |
| GET    | /api/users/developers         | Manager   | List developers            |
| GET    | /api/tasks                    | All       | Get tasks (role-filtered)  |
| POST   | /api/tasks                    | Manager   | Create and assign a task   |
| PUT    | /api/tasks/{id}/status        | Developer | Update task status         |
| PUT    | /api/tasks/{id}/review        | Reviewer  | Approve or reject a task   |
| POST   | /api/tasks/{id}/upload        | Reviewer  | Upload image for a task    |
| GET    | /api/tasks/stats              | Manager   | Get task statistics        |
