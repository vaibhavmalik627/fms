import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const EMPTY_FORM = {
  name: "",
  subject: "",
  department: "",
  email: "",
  phone: "",
  qualification: "",
  experience: "",
  joiningDate: "",
  status: "Active",
};

function FacultyFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    const run = async () => {
      try {
        const { data } = await api.get(`/faculty/${id}`);
        setForm({
          name: data.name || "",
          subject: data.subject || "",
          department: data.department || "",
          email: data.email || "",
          phone: data.phone || "",
          qualification: data.qualification || "",
          experience: data.experience ?? "",
          joiningDate: data.joiningDate ? data.joiningDate.slice(0, 10) : "",
          status: data.status || "Active",
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load faculty");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id, isEdit]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (file) payload.append("profileImage", file);

      if (isEdit) {
        await api.put(`/faculty/${id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/faculty", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      navigate("/faculty");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save faculty");
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== "Admin") {
    return (
      <section className="card">
        <h1>Admin Access Required</h1>
        <p className="hint">Only admins can create or update faculty records.</p>
        <Link className="btn" to="/faculty">
          Back to list
        </Link>
      </section>
    );
  }

  if (loading) return <section className="card">Loading...</section>;

  return (
    <section className="card">
      <h1>{isEdit ? "Edit Faculty" : "Add Faculty"}</h1>
      <form className="grid-form" onSubmit={onSubmit}>
        <label>Name</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
        />
        <label>Subject</label>
        <input
          required
          value={form.subject}
          onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
        />
        <label>Department</label>
        <input
          required
          value={form.department}
          onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
        />
        <label>Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
        />
        <label>Phone</label>
        <input
          value={form.phone}
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
        />
        <label>Qualification</label>
        <input
          value={form.qualification}
          onChange={(e) => setForm((p) => ({ ...p, qualification: e.target.value }))}
        />
        <label>Experience (Years)</label>
        <input
          type="number"
          min="0"
          value={form.experience}
          onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value }))}
        />
        <label>Joining Date</label>
        <input
          type="date"
          value={form.joiningDate}
          onChange={(e) => setForm((p) => ({ ...p, joiningDate: e.target.value }))}
        />
        <label>Status</label>
        <select
          value={form.status}
          onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
        >
          <option value="Active">Active</option>
          <option value="On Leave">On Leave</option>
        </select>
        <label>Profile Image</label>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        {error && <p className="error span-2">{error}</p>}
        <div className="span-2 row">
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          <Link className="btn muted" to="/faculty">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}

export default FacultyFormPage;
