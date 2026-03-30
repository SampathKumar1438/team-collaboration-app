import { useState, useEffect, useCallback } from "react";
import { getTasks, updateTaskStatus } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  RefreshCw,
  Play,
  CheckCircle,
  ClipboardList,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  assigned_to_name: string;
  created_by_name: string;
  reviewer_name: string | null;
  review_comment: string | null;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  assigned: { label: "Assigned", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: <ClipboardList className="w-3.5 h-3.5" /> },
  in_progress: { label: "In Progress", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", icon: <Clock className="w-3.5 h-3.5" /> },
  completed: { label: "Completed", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: <AlertCircle className="w-3.5 h-3.5" /> },
  approved: { label: "Approved", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected: { label: "Rejected", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function DeveloperDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTasks();
      setTasks(data);
    } catch {
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleStatusUpdate = async (taskId: number, newStatus: string) => {
    setError("");
    setSuccess("");
    setActionLoading(taskId);
    try {
      await updateTaskStatus(taskId, newStatus);
      setSuccess(`Task status updated to "${newStatus.replace("_", " ")}"`);
      loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const getActionButton = (task: Task) => {
    if (actionLoading === task.id) {
      return (
        <span className="text-sm text-gray-400 px-3 py-1.5">Updating...</span>
      );
    }
    switch (task.status) {
      case "assigned":
        return (
          <button
            onClick={() => handleStatusUpdate(task.id, "in_progress")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition"
          >
            <Play className="w-3.5 h-3.5" />
            Start Working
          </button>
        );
      case "in_progress":
        return (
          <button
            onClick={() => handleStatusUpdate(task.id, "completed")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Mark Complete
          </button>
        );
      case "rejected":
        return (
          <button
            onClick={() => handleStatusUpdate(task.id, "in_progress")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition"
          >
            <Play className="w-3.5 h-3.5" />
            Rework
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Developer Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome, {user?.full_name}. Here are your assigned tasks.
          </p>
        </div>
        <button
          onClick={loadTasks}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {success}
        </div>
      )}

      {/* Task Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Assigned", count: tasks.filter((t) => t.status === "assigned").length, color: "bg-blue-100 text-blue-800" },
          { label: "In Progress", count: tasks.filter((t) => t.status === "in_progress").length, color: "bg-yellow-100 text-yellow-800" },
          { label: "Completed", count: tasks.filter((t) => t.status === "completed").length, color: "bg-purple-100 text-purple-800" },
          { label: "Approved", count: tasks.filter((t) => t.status === "approved").length, color: "bg-green-100 text-green-800" },
        ].map(({ label, count, color }) => (
          <div key={label} className={`${color} rounded-xl p-4 text-center`}>
            <div className="text-2xl font-bold">{count}</div>
            <div className="text-xs font-medium mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Task List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">My Tasks</h2>
        </div>
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No tasks assigned to you yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tasks.map((task) => {
              const config = statusConfig[task.status];
              return (
                <div key={task.id} className="px-6 py-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.color}`}
                        >
                          {config.icon}
                          {config.label}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-500 mb-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>
                          Created by: <strong className="text-gray-600">{task.created_by_name}</strong>
                        </span>
                        {task.reviewer_name && (
                          <span>
                            Reviewed by: <strong className="text-gray-600">{task.reviewer_name}</strong>
                          </span>
                        )}
                      </div>
                      {task.review_comment && task.status === "rejected" && (
                        <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                          <strong>Reviewer feedback:</strong> {task.review_comment}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">{getActionButton(task)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
