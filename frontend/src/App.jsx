import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import AttendancePage from "./pages/AttendancePage";
import FacultyDetailsPage from "./pages/FacultyDetailsPage";
import FacultyFormPage from "./pages/FacultyFormPage";
import FacultyListPage from "./pages/FacultyListPage";
import LeavesPage from "./pages/LeavesPage";
import LoginPage from "./pages/LoginPage";
import MyProfilePage from "./pages/MyProfilePage";
import RegisterPage from "./pages/RegisterPage";
import TimetablePage from "./pages/TimetablePage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="leaves" element={<LeavesPage />} />
        <Route path="timetable" element={<TimetablePage />} />
        <Route path="my-profile" element={<MyProfilePage />} />
        <Route path="faculty" element={<FacultyListPage />} />
        <Route path="faculty/new" element={<FacultyFormPage />} />
        <Route path="faculty/:id" element={<FacultyDetailsPage />} />
        <Route path="faculty/:id/edit" element={<FacultyFormPage />} />
      </Route>
    </Routes>
  );
}

export default App;
