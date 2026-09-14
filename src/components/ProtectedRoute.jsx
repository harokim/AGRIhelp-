import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="loading-spinner" /><p>Loading AGRIhelp...</p></div>;
  if (!user) return <Navigate to="/" replace />;
  if (user.status === "inactive") return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === "engineer" ? "/engineer" : "/client"} replace />;
  return children;
}
