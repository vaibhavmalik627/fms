import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const { login, teacherLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("user");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const target = location.state?.from?.pathname || "/dashboard";

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "teacher") {
        const data = await teacherLogin(form.email, form.password);
        if (data?.mustResetPassword) {
          navigate("/teacher-security", { replace: true });
          return;
        }
      } else {
        await login(form.email, form.password);
      }
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={onSubmit}>
        <h1>Sign In</h1>
        <div className="row login-mode">
          <button
            type="button"
            className={mode === "user" ? "mode-btn active" : "mode-btn"}
            onClick={() => setMode("user")}
          >
            Admin/Viewer
          </button>
          <button
            type="button"
            className={mode === "teacher" ? "mode-btn active" : "mode-btn"}
            onClick={() => setMode("teacher")}
          >
            Teacher
          </button>
        </div>
        <label>Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          required
        />
        {mode === "teacher" ? (
          <>
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              required
            />
          </>
        ) : (
          <>
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              required
            />
          </>
        )}
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
        {mode === "user" && (
          <p className="hint">
            Need an account? <Link to="/register">Register</Link>
          </p>
        )}
      </form>
    </div>
  );
}

export default LoginPage;
