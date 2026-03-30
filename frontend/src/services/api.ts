const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getToken(): string | null {
  return localStorage.getItem("token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

export async function login(username: string, password: string) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Login failed");
  }
  return res.json();
}

export async function getUsers() {
  const res = await fetch(`${API_URL}/api/users`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function getDevelopers() {
  const res = await fetch(`${API_URL}/api/users/developers`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch developers");
  return res.json();
}

export async function getTasks() {
  const res = await fetch(`${API_URL}/api/tasks`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function createTask(
  title: string,
  description: string,
  assigned_to: number
) {
  const res = await fetch(`${API_URL}/api/tasks`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ title, description, assigned_to }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create task");
  }
  return res.json();
}

export async function updateTaskStatus(taskId: number, status: string) {
  const res = await fetch(`${API_URL}/api/tasks/${taskId}/status`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to update status");
  }
  return res.json();
}

export async function reviewTask(
  taskId: number,
  action: string,
  comment?: string
) {
  const res = await fetch(`${API_URL}/api/tasks/${taskId}/review`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ action, comment }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to review task");
  }
  return res.json();
}

export async function uploadImage(taskId: number, file: File) {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/api/tasks/${taskId}/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to upload image");
  }
  return res.json();
}

export async function getTaskStats() {
  const res = await fetch(`${API_URL}/api/tasks/stats`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export function getUploadUrl(filename: string): string {
  return `${API_URL}/uploads/${filename}`;
}
