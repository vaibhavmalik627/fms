import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function TeacherSecurityPage() {
  const { user, teacherChangePassword } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  if (user?.role !== "Teacher") {
    return (
      <section className="card">
        <h1>Access denied</h1>
      </section>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setSaving(true);
    try {
      await teacherChangePassword(form.oldPassword, form.newPassword);
      setSuccess("Password updated successfully.");
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => navigate("/dashboard"), 600);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card">
      <h1>Teacher Security</h1>
      <p className="hint">
        {user.mustResetPassword
          ? "You must change your password before continuing."
          : "Update your account password."}
      </p>
      <form className="grid-form" onSubmit={onSubmit}>
        <label>Current Password</label>
        <input
          type="password"
          value={form.oldPassword}
          onChange={(e) => setForm((p) => ({ ...p, oldPassword: e.target.value }))}
          required
        />
        <label>New Password</label>
        <input
          type="password"
          value={form.newPassword}
          onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
          minLength={8}
          required
        />
        <label>Confirm New Password</label>
        <input
          type="password"
          value={form.confirmPassword}
          onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
          minLength={8}
          required
        />
        <div className="span-2">
          <button type="submit" disabled={saving}>
            {saving ? "Updating..." : "Update Password"}
          </button>
        </div>
        {error && <p className="error span-2">{error}</p>}
        {success && <p className="hint span-2">{success}</p>}
      </form>
    </section>
  );
}

export default TeacherSecurityPage;
