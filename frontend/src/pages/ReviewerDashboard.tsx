import { useState, useEffect, useCallback, useRef } from "react";
import { getTasks, reviewTask, uploadImage, getUploadUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Upload,
  Image,
  Clock,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  MessageSquare,
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
  image_path: string | null;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  completed: { label: "Pending Review", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: <AlertCircle className="w-3.5 h-3.5" /> },
  approved: { label: "Approved", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected: { label: "Rejected", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: <XCircle className="w-3.5 h-3.5" /> },
  assigned: { label: "Assigned", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: <ClipboardList className="w-3.5 h-3.5" /> },
  in_progress: { label: "In Progress", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", icon: <Clock className="w-3.5 h-3.5" /> },
};

export default function ReviewerDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [reviewComments, setReviewComments] = useState<Record<number, string>>({});
  const [uploadingTask, setUploadingTask] = useState<number | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

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

  const handleReview = async (taskId: number, action: "approved" | "rejected") => {
    setError("");
    setSuccess("");
    setActionLoading(taskId);
    try {
      await reviewTask(taskId, action, reviewComments[taskId] || undefined);
      setSuccess(`Task ${action} successfully!`);
      setReviewComments((prev) => {
        const updated = { ...prev };
        delete updated[taskId];
        return updated;
      });
      loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to review task");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpload = async (taskId: number, file: File) => {
    setError("");
    setSuccess("");
    setUploadingTask(taskId);
    try {
      await uploadImage(taskId, file);
      setSuccess("Image uploaded successfully!");
      loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploadingTask(null);
    }
  };

  const pendingTasks = tasks.filter((t) => t.status === "completed");
  const reviewedTasks = tasks.filter((t) => t.status === "approved" || t.status === "rejected");

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviewer Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome, {user?.full_name}. Review completed tasks below.
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

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-purple-100 text-purple-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold">{pendingTasks.length}</div>
          <div className="text-xs font-medium mt-1">Pending Review</div>
        </div>
        <div className="bg-green-100 text-green-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold">
            {tasks.filter((t) => t.status === "approved").length}
          </div>
          <div className="text-xs font-medium mt-1">Approved</div>
        </div>
        <div className="bg-red-100 text-red-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold">
            {tasks.filter((t) => t.status === "rejected").length}
          </div>
          <div className="text-xs font-medium mt-1">Rejected</div>
        </div>
      </div>

      {/* Pending Review */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-800">Pending Review</h2>
          <span className="text-sm text-gray-500 ml-1">({pendingTasks.length})</span>
        </div>
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading tasks...</div>
        ) : pendingTasks.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No tasks pending review.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {pendingTasks.map((task) => (
              <div key={task.id} className="px-6 py-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-purple-50 border-purple-200 text-purple-700">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Pending Review
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-500 mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                      <span>
                        Developer: <strong className="text-gray-600">{task.assigned_to_name}</strong>
                      </span>
                      <span>
                        Manager: <strong className="text-gray-600">{task.created_by_name}</strong>
                      </span>
                    </div>

                    {/* Image preview */}
                    {task.image_path && (
                      <div className="mb-3">
                        <img
                          src={getUploadUrl(task.image_path)}
                          alt="Task attachment"
                          className="max-w-xs rounded-lg border border-gray-200"
                        />
                      </div>
                    )}

                    {/* Review comment input */}
                    <div className="flex items-start gap-2 mb-3">
                      <MessageSquare className="w-4 h-4 text-gray-400 mt-2.5" />
                      <input
                        type="text"
                        placeholder="Add a review comment (optional)"
                        value={reviewComments[task.id] || ""}
                        onChange={(e) =>
                          setReviewComments((prev) => ({
                            ...prev,
                            [task.id]: e.target.value,
                          }))
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReview(task.id, "approved")}
                        disabled={actionLoading === task.id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReview(task.id, "rejected")}
                        disabled={actionLoading === task.id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                      <button
                        onClick={() => fileInputRefs.current[task.id]?.click()}
                        disabled={uploadingTask === task.id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        {uploadingTask === task.id ? (
                          <>Uploading...</>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Upload Image
                          </>
                        )}
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        ref={(el) => { fileInputRefs.current[task.id] = el; }}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(task.id, file);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviewed Tasks */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <Image className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">Reviewed Tasks</h2>
          <span className="text-sm text-gray-500 ml-1">({reviewedTasks.length})</span>
        </div>
        {reviewedTasks.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No reviewed tasks yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviewedTasks.map((task) => {
              const config = statusConfig[task.status];
              return (
                <div key={task.id} className="px-6 py-4 hover:bg-gray-50 transition">
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
                    <p className="text-sm text-gray-500 mb-1">{task.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>
                      Developer: <strong className="text-gray-600">{task.assigned_to_name}</strong>
                    </span>
                    {task.review_comment && (
                      <span className="italic">
                        Comment: "{task.review_comment}"
                      </span>
                    )}
                  </div>
                  {task.image_path && (
                    <div className="mt-2">
                      <img
                        src={getUploadUrl(task.image_path)}
                        alt="Task attachment"
                        className="max-w-xs rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
