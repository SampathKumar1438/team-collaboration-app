import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import ManagerDashboard from "./pages/ManagerDashboard";
import DeveloperDashboard from "./pages/DeveloperDashboard";
import ReviewerDashboard from "./pages/ReviewerDashboard";

function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case "manager":
      return <ManagerDashboard />;
    case "developer":
      return <DeveloperDashboard />;
    case "reviewer":
      return <ReviewerDashboard />;
    default:
      return <div className="p-8 text-center text-red-500">Unknown role</div>;
  }
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Dashboard />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
