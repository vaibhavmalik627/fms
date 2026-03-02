import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

function FacultyListPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchFaculty = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/faculty", {
        params: {
          search: search || undefined,
          department: department || undefined,
        },
      });
      setRows(data.faculty || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to fetch faculty");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const onDelete = async (id) => {
    if (!window.confirm("Delete this faculty record?")) return;
    try {
      await api.delete(`/faculty/${id}`);
      setRows((prev) => prev.filter((f) => f._id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  if (user?.role === "Teacher") {
    return (
      <section className="card">
        <h1>Limited Access</h1>
        <p className="hint">Teacher accounts can view only their own profile.</p>
        <div className="row">
          <Link className="btn" to="/my-profile">
            Open My Profile
          </Link>
          <Link className="btn muted" to="/dashboard">
            Go to Dashboard
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="row between">
        <h1>Faculty</h1>
        {user?.role === "Admin" && (
          <Link className="btn" to="/faculty/new">
            Add Faculty
          </Link>
        )}
      </div>

      <div className="row filters">
        <input
          placeholder="Search by name or subject"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          placeholder="Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        />
        <button onClick={fetchFaculty}>Apply</button>
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading faculty list...</p>
      ) : (
        <>
          <p className="hint">Total: {total}</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Subject</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => (
                  <tr key={f._id}>
                    <td>{f.name}</td>
                    <td>{f.subject}</td>
                    <td>{f.department}</td>
                    <td>
                      <span className={f.status === "Active" ? "status-pill active" : "status-pill leave"}>
                        {f.status}
                      </span>
                    </td>
                    <td className="actions">
                      <Link to={`/faculty/${f._id}`}>View</Link>
                      {user?.role === "Admin" && (
                        <>
                          <Link to={`/faculty/${f._id}/edit`}>Edit</Link>
                          <button className="danger" onClick={() => onDelete(f._id)}>
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan="5">
                      <div className="empty-state">
                        <p>No faculty records found.</p>
                        {user?.role === "Admin" && (
                          <Link className="btn" to="/faculty/new">
                            Add your first faculty
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

export default FacultyListPage;
