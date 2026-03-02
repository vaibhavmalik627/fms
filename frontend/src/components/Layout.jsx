import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const uploadsBase = import.meta.env.VITE_UPLOADS_BASE_URL || "http://localhost:5000";

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
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
          {user?.role === "Admin" && <NavLink to="/faculty/new">Add Faculty</NavLink>}
        </nav>
        <div className="user-box">
          {user?.profileImage ? (
            <img
              className="avatar"
              src={`${uploadsBase}/uploads/${user.profileImage}`}
              alt={user.name}
            />
          ) : (
            <div className="avatar-placeholder">{user?.name?.slice(0, 1) || "U"}</div>
          )}
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
