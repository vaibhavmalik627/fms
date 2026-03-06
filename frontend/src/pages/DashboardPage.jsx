import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import ProfileAvatar from "../components/ProfileAvatar";
import { useAuth } from "../context/AuthContext";

function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [facultyRows, setFacultyRows] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        if (user?.role === "Teacher") {
          const { data } = await api.get(`/faculty/${user.id}`);
          setFacultyRows(data ? [data] : []);
        } else {
          const { data } = await api.get("/faculty", { params: { limit: 6 } });
          setFacultyRows(data.faculty || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const stats = useMemo(() => {
    const total = facultyRows.length;
    const active = facultyRows.filter((item) => item.status === "Active").length;
    return { total, active };
  }, [facultyRows]);

  if (loading) {
    return <section className="card">Loading dashboard...</section>;
  }

  return (
    <section className="dash-stack">
      <div className="dash-head">
        <h1>{user?.role} Dashboard</h1>
        <p className="hint">Welcome back, {user?.name}</p>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="dashboard-grid">
        <article className="card stat-card">
          <p className="stat-label">Profiles in view</p>
          <p className="stat-value">{stats.total}</p>
        </article>
        <article className="card stat-card">
          <p className="stat-label">Active status</p>
          <p className="stat-value">{stats.active}</p>
        </article>
        <article className="card stat-card">
          <p className="stat-label">Role</p>
          <p className="stat-value">{user?.role}</p>
        </article>
      </div>

      {user?.role === "Admin" ? (
        <section className="card">
          <div className="row between">
            <h2>Teacher Profiles (Short View)</h2>
            <Link className="btn" to="/faculty">
              View All
            </Link>
          </div>
          <div className="profile-grid">
            {facultyRows.map((item) => (
              <article key={item._id} className="profile-card">
                <ProfileAvatar name={item.name} profileImage={item.profileImage} large />
                <div>
                  <p className="profile-name">{item.name}</p>
                  <p className="hint">{item.subject || "-"}</p>
                  <p className="hint">{item.department || "-"}</p>
                  <Link to={`/faculty/${item._id}`}>Open profile</Link>
                </div>
              </article>
            ))}
            {facultyRows.length === 0 && <p className="hint">No teacher profiles found.</p>}
          </div>
        </section>
      ) : (
        <section className="card">
          <div className="row between">
            <h2>My Profile</h2>
            {user?.role === "Teacher" && (
              <Link className="btn" to="/my-profile">
                Open Full Profile
              </Link>
            )}
          </div>
          {facultyRows.map((item) => (
            <article key={item._id} className="profile-card">
              <ProfileAvatar name={item.name} profileImage={item.profileImage} large />
              <div>
                <p className="profile-name">{item.name}</p>
                <p className="hint">{item.email || "-"}</p>
                <p className="hint">
                  {item.subject || "-"} | {item.department || "-"}
                </p>
              </div>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}

export default DashboardPage;
