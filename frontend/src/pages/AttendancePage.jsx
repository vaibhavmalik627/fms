import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

function AttendancePage() {
  const { user } = useAuth();
  const [faculties, setFaculties] = useState([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState(user?.role === "Teacher" ? user.id : "");
  const [month, setMonth] = useState(getCurrentMonth());
  const [date, setDate] = useState(getTodayDate());
  const [status, setStatus] = useState("Present");
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const effectiveFacultyId = user?.role === "Teacher" ? user.id : selectedFacultyId;

  useEffect(() => {
    const loadFaculties = async () => {
      if (user?.role === "Teacher") return;
      try {
        const { data } = await api.get("/faculty", { params: { limit: 300 } });
        setFaculties(data.faculty || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load faculty list");
      }
    };
    loadFaculties();
  }, [user]);

  const fetchData = async () => {
    setError("");
    setLoading(true);
    try {
      const params = { month };
      if (effectiveFacultyId) params.facultyId = effectiveFacultyId;
      const recordsRes = await api.get("/attendance", { params });
      setRecords(recordsRes.data || []);

      if (effectiveFacultyId || user?.role === "Teacher") {
        const summaryRes = await api.get("/attendance/summary", { params });
        setSummary(summaryRes.data || null);
      } else {
        setSummary(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load attendance");
      setRecords([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!effectiveFacultyId && user?.role !== "Teacher") return;
    fetchData();
  }, [month, effectiveFacultyId]);

  const markAttendance = async (e) => {
    e.preventDefault();
    setError("");
    if (!selectedFacultyId) {
      setError("Select faculty first");
      return;
    }
    try {
      await api.post("/attendance/mark", {
        facultyId: selectedFacultyId,
        date,
        status,
      });
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark attendance");
    }
  };

  const title = useMemo(() => {
    if (user?.role === "Teacher") return "My Attendance";
    return "Attendance Management";
  }, [user]);

  return (
    <section className="dash-stack">
      <div className="card">
        <h1>{title}</h1>
        <div className="row filters">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          {user?.role !== "Teacher" && (
            <select value={selectedFacultyId} onChange={(e) => setSelectedFacultyId(e.target.value)}>
              <option value="">Select Faculty</option>
              {faculties.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name}
                </option>
              ))}
            </select>
          )}
          <button onClick={fetchData}>Refresh</button>
        </div>
        {error && <p className="error">{error}</p>}
      </div>

      {user?.role === "Admin" && (
        <form className="card row filters" onSubmit={markAttendance}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Leave">Leave</option>
          </select>
          <button type="submit">Mark Attendance</button>
        </form>
      )}

      {summary && (
        <div className="dashboard-grid">
          <article className="card stat-card">
            <p className="stat-label">Present</p>
            <p className="stat-value">{summary.present}</p>
          </article>
          <article className="card stat-card">
            <p className="stat-label">Absent</p>
            <p className="stat-value">{summary.absent}</p>
          </article>
          <article className="card stat-card">
            <p className="stat-label">Attendance %</p>
            <p className="stat-value">{summary.attendancePercent}%</p>
          </article>
        </div>
      )}

      <section className="card">
        <h2>Monthly Records</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Faculty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((row) => (
                  <tr key={row._id}>
                    <td>{new Date(row.date).toLocaleDateString()}</td>
                    <td>{row.facultyId?.name || "-"}</td>
                    <td>
                      <span className={row.status === "Present" ? "status-pill active" : "status-pill leave"}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan="3">No attendance records for selected month.</td>
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

function getCurrentMonth() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export default AttendancePage;
