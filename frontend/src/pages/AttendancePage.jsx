import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

function AttendancePage() {
  const { user } = useAuth();
  const [faculties, setFaculties] = useState([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState(user?.role === "Teacher" ? user.id : "");
  const [month, setMonth] = useState(getCurrentMonth());
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [todayRows, setTodayRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
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

      const todayStatusParams = {};
      if (user?.role !== "Teacher" && effectiveFacultyId) {
        todayStatusParams.facultyId = effectiveFacultyId;
      }
      const todayStatusRes = await api.get("/attendance/today-status", {
        params: todayStatusParams,
      });
      setTodayRows(todayStatusRes.data?.rows || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load attendance");
      setRecords([]);
      setSummary(null);
      setTodayRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, effectiveFacultyId]);

  const handlePunch = async (type) => {
    setError("");
    setActionLoading(true);
    try {
      if (type === "in") {
        await api.post("/attendance/punch-in", {});
      } else {
        await api.post("/attendance/punch-out", {});
      }
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update attendance");
    } finally {
      setActionLoading(false);
    }
  };

  const title = useMemo(() => {
    if (user?.role === "Teacher") return "My Attendance";
    return "Attendance Management";
  }, [user]);

  const myToday = todayRows[0] || null;

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

      {user?.role === "Teacher" && (
        <section className="card">
          <h2>Today Attendance</h2>
          <div className="row filters">
            <p>
              <strong>Status:</strong> {myToday?.isPresent ? "Present" : myToday?.attendanceStatus || "Absent"}
            </p>
            <p>
              <strong>Punch In:</strong> {myToday?.punchInAt ? formatDateTime(myToday.punchInAt) : "-"}
            </p>
            <p>
              <strong>Punch Out:</strong> {myToday?.punchOutAt ? formatDateTime(myToday.punchOutAt) : "-"}
            </p>
          </div>
          <div className="row filters">
            <button
              onClick={() => handlePunch("in")}
              disabled={actionLoading || Boolean(myToday?.punchInAt) || myToday?.attendanceStatus === "Leave"}
            >
              {actionLoading ? "Processing..." : "Punch In"}
            </button>
            <button
              onClick={() => handlePunch("out")}
              disabled={actionLoading || !myToday?.punchInAt || Boolean(myToday?.punchOutAt)}
            >
              {actionLoading ? "Processing..." : "Punch Out"}
            </button>
          </div>
        </section>
      )}

      {user?.role === "Admin" && (
        <section className="card">
          <h2>Today Presence Status</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Faculty</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {todayRows.map((row) => (
                  <tr key={row.facultyId}>
                    <td>{row.name}</td>
                    <td>{row.department || "-"}</td>
                    <td>
                      <span className={row.isPresent ? "status-pill active" : "status-pill leave"}>
                        {row.isPresent ? "Present" : row.attendanceStatus || "Absent"}
                      </span>
                    </td>
                    <td>{row.punchInAt ? formatDateTime(row.punchInAt) : "-"}</td>
                    <td>{row.punchOutAt ? formatDateTime(row.punchOutAt) : "-"}</td>
                    <td>{row.attendanceHours ? `${row.attendanceHours}h` : "-"}</td>
                  </tr>
                ))}
                {todayRows.length === 0 && (
                  <tr>
                    <td colSpan="6">No faculty found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
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

function formatDateTime(value) {
  return new Date(value).toLocaleString();
}

export default AttendancePage;
