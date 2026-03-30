import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { login } from "../services/api";
import { LogIn, Users, Shield, Code, Eye } from "lucide-react";

export default function LoginPage() {
  const { loginUser } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(username, password);
      loginUser(data.token, data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Team Collab</h1>
          <p className="text-blue-200 mt-2">Role-based collaboration platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign In</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Enter password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3 font-medium">
              Quick login with sample credentials:
            </p>
            <div className="space-y-2">
              <button
                onClick={() => fillCredentials("manager1", "manager123")}
                className="w-full flex items-center gap-3 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm transition text-left"
              >
                <Shield className="w-4 h-4 text-purple-600" />
                <span className="text-purple-800 font-medium">Manager</span>
                <span className="text-purple-500 ml-auto text-xs">
                  manager1 / manager123
                </span>
              </button>
              <button
                onClick={() => fillCredentials("developer1", "dev123")}
                className="w-full flex items-center gap-3 px-4 py-2.5 bg-green-50 hover:bg-green-100 rounded-lg text-sm transition text-left"
              >
                <Code className="w-4 h-4 text-green-600" />
                <span className="text-green-800 font-medium">Developer</span>
                <span className="text-green-500 ml-auto text-xs">
                  developer1 / dev123
                </span>
              </button>
              <button
                onClick={() => fillCredentials("reviewer1", "rev123")}
                className="w-full flex items-center gap-3 px-4 py-2.5 bg-orange-50 hover:bg-orange-100 rounded-lg text-sm transition text-left"
              >
                <Eye className="w-4 h-4 text-orange-600" />
                <span className="text-orange-800 font-medium">Reviewer</span>
                <span className="text-orange-500 ml-auto text-xs">
                  reviewer1 / rev123
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
