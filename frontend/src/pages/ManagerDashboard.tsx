import { useState, useEffect, useCallback } from "react";
import { getTasks, getDevelopers, createTask, getTaskStats } from "../services/api";
import {
  Plus,
  ClipboardList,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  assigned_to: number;
  assigned_to_name: string;
  created_by_name: string;
  reviewer_name: string | null;
  review_comment: string | null;
  created_at: string;
  updated_at: string;
}

interface Developer {
  id: number;
  username: string;
  full_name: string;
}

interface Stats {
  total: number;
  assigned: number;
  in_progress: number;
  completed: number;
  approved: number;
  rejected: number;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  assigned: { label: "Assigned", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: <ClipboardList className="w-3.5 h-3.5" /> },
  in_progress: { label: "In Progress", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", icon: <Clock className="w-3.5 h-3.5" /> },
  completed: { label: "Completed", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: <AlertCircle className="w-3.5 h-3.5" /> },
  approved: { label: "Approved", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected: { label: "Rejected", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function ManagerDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState<number>(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [tasksData, devsData, statsData] = await Promise.all([
        getTasks(),
        getDevelopers(),
        getTaskStats(),
      ]);
      setTasks(tasksData);
      setDevelopers(devsData);
      setStats(statsData);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!assignedTo) {
      setError("Please select a developer");
      return;
    }
    try {
      await createTask(title, description, assignedTo);
      setSuccess("Task created successfully!");
      setTitle("");
      setDescription("");
      setAssignedTo(0);
      setShowForm(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-500 mt-1">Create and manage team tasks</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: "Total", value: stats.total, color: "bg-gray-100 text-gray-800" },
            { label: "Assigned", value: stats.assigned, color: "bg-blue-100 text-blue-800" },
            { label: "In Progress", value: stats.in_progress, color: "bg-yellow-100 text-yellow-800" },
            { label: "Completed", value: stats.completed, color: "bg-purple-100 text-purple-800" },
            { label: "Approved", value: stats.approved, color: "bg-green-100 text-green-800" },
            { label: "Rejected", value: stats.rejected, color: "bg-red-100 text-red-800" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`${color} rounded-xl p-4 text-center`}>
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs font-medium mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            Create New Task
          </h2>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Task title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                rows={3}
                placeholder="Task description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign to Developer
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              >
                <option value={0}>Select a developer</option>
                {developers.map((dev) => (
                  <option key={dev.id} value={dev.id}>
                    {dev.full_name} ({dev.username})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Create Task
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">All Tasks</h2>
          <span className="text-sm text-gray-500 ml-2">({tasks.length})</span>
        </div>
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No tasks yet. Create your first task to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tasks.map((task) => {
              const config = statusConfig[task.status];
              return (
                <div key={task.id} className="px-6 py-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
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
                        <span className="flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" />
                          Assigned to: <strong className="text-gray-600">{task.assigned_to_name}</strong>
                        </span>
                        {task.reviewer_name && (
                          <span>
                            Reviewed by: <strong className="text-gray-600">{task.reviewer_name}</strong>
                          </span>
                        )}
                        {task.review_comment && (
                          <span className="italic">"{task.review_comment}"</span>
                        )}
                      </div>
                    </div>
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
