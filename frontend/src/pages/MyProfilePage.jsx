import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FacultyDetailsPage from "./FacultyDetailsPage";

function MyProfilePage() {
  const { user } = useAuth();

  if (!user) return null;
  if (user.role !== "Teacher") {
    return <Navigate to="/dashboard" replace />;
  }

  return <FacultyDetailsPage facultyId={user.id} />;
}

export default MyProfilePage;
