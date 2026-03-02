import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

function LeavesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fromDate: "",
    toDate: "",
    reason: "",
  });

  const fetchRows = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/leaves");
      setRows(data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const submitRequest = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/leaves", form);
      setForm({ fromDate: "", toDate: "", reason: "" });
      await fetchRows();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit leave request");
    }
  };

  const reviewRequest = async (id, status) => {
    try {
      await api.put(`/leaves/${id}/status`, { status });
      await fetchRows();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update leave status");
    }
  };

  if (user?.role !== "Teacher" && user?.role !== "Admin") {
    return (
      <section className="card">
        <h1>Leaves</h1>
        <p className="hint">Only Admin and Teacher roles can access leave workflows.</p>
      </section>
    );
  }

  return (
    <section className="dash-stack">
      <div className="card">
        <h1>Leave Request System</h1>
        <p className="hint">
          {user?.role === "Teacher"
            ? "Submit leave request and track approvals."
            : "Review teacher leave requests and approve/reject."}
        </p>
      </div>

      {user?.role === "Teacher" && (
        <form className="card grid-form" onSubmit={submitRequest}>
          <label>From Date</label>
          <input
            type="date"
            value={form.fromDate}
            onChange={(e) => setForm((p) => ({ ...p, fromDate: e.target.value }))}
            required
          />
          <label>To Date</label>
          <input
            type="date"
            value={form.toDate}
            onChange={(e) => setForm((p) => ({ ...p, toDate: e.target.value }))}
            required
          />
          <label className="span-2">Reason</label>
          <input
            className="span-2"
            value={form.reason}
            onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
            placeholder="Brief reason"
            required
          />
          <div className="span-2">
            <button type="submit">Submit Request</button>
          </div>
        </form>
      )}

      {error && <p className="error">{error}</p>}

      <section className="card">
        <h2>{user?.role === "Teacher" ? "My Requests" : "All Requests"}</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Faculty</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Reason</th>
                  <th>Status</th>
                  {user?.role === "Admin" && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row._id}>
                    <td>{row.facultyId?.name || "-"}</td>
                    <td>{new Date(row.fromDate).toLocaleDateString()}</td>
                    <td>{new Date(row.toDate).toLocaleDateString()}</td>
                    <td>{row.reason}</td>
                    <td>{row.status}</td>
                    {user?.role === "Admin" && (
                      <td className="actions">
                        <button
                          type="button"
                          disabled={row.status !== "Pending"}
                          onClick={() => reviewRequest(row._id, "Approved")}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="danger"
                          disabled={row.status !== "Pending"}
                          onClick={() => reviewRequest(row._id, "Rejected")}
                        >
                          Reject
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={user?.role === "Admin" ? 6 : 5}>No leave requests found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

export default LeavesPage;
