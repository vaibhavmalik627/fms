import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProfileAvatar from "./ProfileAvatar";

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user?.role === "Teacher" && user?.mustResetPassword && location.pathname !== "/teacher-security") {
      navigate("/teacher-security", { replace: true });
    }
  }, [user, location.pathname, navigate]);

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <Link to="/dashboard">FMS</Link>
        </div>
        <nav className="menu">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/attendance">Attendance</NavLink>
          {(user?.role === "Teacher" || user?.role === "Admin") && <NavLink to="/leaves">Leaves</NavLink>}
          <NavLink to="/timetable">Timetable</NavLink>
          {user?.role !== "Teacher" && <NavLink to="/faculty">Faculty</NavLink>}
          {user?.role === "Teacher" && <NavLink to="/my-profile">My Profile</NavLink>}
          {user?.role === "Teacher" && <NavLink to="/teacher-security">Security</NavLink>}
          {user?.role === "Admin" && <NavLink to="/faculty/new">Add Faculty</NavLink>}
        </nav>
        <div className="user-box">
          <ProfileAvatar name={user?.name} profileImage={user?.profileImage} />
          <div className="user-meta">
            <span>{user?.name}</span>
            <small>{user?.role}</small>
          </div>
          <button onClick={onLogout}>Logout</button>
        </div>
      </header>

      <main className="page-wrap">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
