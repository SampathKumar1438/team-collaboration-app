import { useAuth } from "../context/AuthContext";
import { LogOut, Users, Shield, Code, Eye } from "lucide-react";

const roleIcons: Record<string, React.ReactNode> = {
  manager: <Shield className="w-4 h-4" />,
  developer: <Code className="w-4 h-4" />,
  reviewer: <Eye className="w-4 h-4" />,
};

const roleColors: Record<string, string> = {
  manager: "bg-purple-100 text-purple-700",
  developer: "bg-green-100 text-green-700",
  reviewer: "bg-orange-100 text-orange-700",
};

export default function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600" />
          <span className="text-lg font-bold text-gray-800">Team Collab</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{user.full_name}</span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}
            >
              {roleIcons[user.role]}
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
