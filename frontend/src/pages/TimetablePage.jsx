import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SUBJECT_OPTIONS = [
  "Computer Networks",
  "DBMS",
  "Operating Systems",
  "Data Structures",
  "Software Engineering",
  "Artificial Intelligence",
  "Web Development",
];
const CLASSROOM_OPTIONS = ["C-101", "C-102", "C-103", "C-104", "C-105", "C-106", "C-107"];

function TimetablePage() {
  const { user } = useAuth();
  const [faculties, setFaculties] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ dayOfWeek: "", facultyId: "" });
  const [form, setForm] = useState({
    facultyId: "",
    subject: "",
    classroom: "",
    dayOfWeek: "Monday",
    startTime: "09:00",
    endTime: "10:00",
  });

  const fetchFaculties = async () => {
    if (user?.role === "Teacher") return;
    try {
      const { data } = await api.get("/faculty", { params: { limit: 300 } });
      setFaculties(data.faculty || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load faculty list");
    }
  };

  const fetchTimetable = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.dayOfWeek) params.dayOfWeek = filters.dayOfWeek;
      if (user?.role !== "Teacher" && filters.facultyId) params.facultyId = filters.facultyId;
      const { data } = await api.get("/timetable", { params });
      setRows(data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load timetable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculties();
    fetchTimetable();
  }, []);

  const createSlot = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/timetable", form);
      setForm((p) => ({ ...p, subject: "", classroom: "" }));
      await fetchTimetable();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create timetable slot");
    }
  };

  const deleteSlot = async (id) => {
    if (!window.confirm("Delete this timetable slot?")) return;
    try {
      await api.delete(`/timetable/${id}`);
      await fetchTimetable();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete slot");
    }
  };

  return (
    <section className="dash-stack">
      <div className="card">
        <h1>Timetable / Class Assignment</h1>
        <div className="row filters">
          <select value={filters.dayOfWeek} onChange={(e) => setFilters((p) => ({ ...p, dayOfWeek: e.target.value }))}>
            <option value="">All Days</option>
            {DAYS.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
          {user?.role !== "Teacher" && (
            <select value={filters.facultyId} onChange={(e) => setFilters((p) => ({ ...p, facultyId: e.target.value }))}>
              <option value="">All Faculty</option>
              {faculties.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name}
                </option>
              ))}
            </select>
          )}
          <button onClick={fetchTimetable}>Apply</button>
        </div>
        {error && <p className="error">{error}</p>}
      </div>

      {user?.role === "Admin" && (
        <form className="card grid-form" onSubmit={createSlot}>
          <label>Faculty</label>
          <select
            value={form.facultyId}
            onChange={(e) => setForm((p) => ({ ...p, facultyId: e.target.value }))}
            required
          >
            <option value="">Select Faculty</option>
            {faculties.map((f) => (
              <option key={f._id} value={f._id}>
                {f.name}
              </option>
            ))}
          </select>
          <label>Subject</label>
          <input
            list="subject-options"
            value={form.subject}
            onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
            placeholder="Select or type subject"
            required
          />
          <datalist id="subject-options">
            {SUBJECT_OPTIONS.map((subject) => (
              <option key={subject} value={subject} />
            ))}
          </datalist>
          <label>Classroom</label>
          <input
            list="classroom-options"
            value={form.classroom}
            onChange={(e) => setForm((p) => ({ ...p, classroom: e.target.value }))}
            placeholder="Choose classroom (C-101 to C-107)"
            required
          />
          <datalist id="classroom-options">
            {CLASSROOM_OPTIONS.map((room) => (
              <option key={room} value={room} />
            ))}
          </datalist>
          <label>Day</label>
          <select
            value={form.dayOfWeek}
            onChange={(e) => setForm((p) => ({ ...p, dayOfWeek: e.target.value }))}
          >
            {DAYS.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
          <label>Start Time</label>
          <input
            type="time"
            value={form.startTime}
            onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
            required
          />
          <label>End Time</label>
          <input
            type="time"
            value={form.endTime}
            onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
            required
          />
          <div className="span-2">
            <button type="submit">Assign Class Slot</button>
          </div>
        </form>
      )}

      <section className="card">
        <h2>Schedule</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Faculty</th>
                  <th>Subject</th>
                  <th>Classroom</th>
                  {user?.role === "Admin" && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row._id}>
                    <td>{row.dayOfWeek}</td>
                    <td>
                      {row.startTime} - {row.endTime}
                    </td>
                    <td>{row.facultyId?.name || "-"}</td>
                    <td>{row.subject}</td>
                    <td>{row.classroom}</td>
                    {user?.role === "Admin" && (
                      <td>
                        <button className="danger" onClick={() => deleteSlot(row._id)}>
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={user?.role === "Admin" ? 6 : 5}>No timetable slots found.</td>
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

export default TimetablePage;
