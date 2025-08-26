import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function AdminRoute({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}
