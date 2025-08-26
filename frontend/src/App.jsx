import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import TakeQuiz from "./pages/TakeQuiz";
import PastPerformance from "./pages/PastPerformance";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Questions from "./pages/admin/Questions";
import Reports from "./pages/admin/Reports";
import NotFound from "./pages/NotFound";
import "./styles.css";

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/quiz/:attemptId" element={<ProtectedRoute><TakeQuiz /></ProtectedRoute>} />
        <Route path="/performance" element={<ProtectedRoute><PastPerformance /></ProtectedRoute>} />

        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/questions" element={<AdminRoute><Questions /></AdminRoute>} />
        <Route path="/admin/reports" element={<AdminRoute><Reports /></AdminRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
