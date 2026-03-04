import { Link, useNavigate } from "react-router-dom";

function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Registration Disabled</h1>
        <p className="hint">
          This app uses a single fixed Admin account. Viewer role is removed.
        </p>
        <button type="button" onClick={() => navigate("/login")}>
          Go to Login
        </button>
        <p className="hint">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
