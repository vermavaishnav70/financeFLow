import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <div className="auth-hero-content">
          <span className="eyebrow">Control Center</span>
          <h1>Stay ahead of spend, cash flow, and team access.</h1>
          <p>
            FinanceFlow keeps records, permissions, and trends in one calm operating surface so
            finance teams can move fast without losing clarity.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <span className="auth-feature-dot" />
              <span>Track income and expenses with clean category-level visibility.</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-dot" />
              <span>See trend movement instantly with dashboard analytics built in.</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-dot" />
              <span>Manage role-based access without leaving the workflow.</span>
            </div>
          </div>
        </div>

        <div className="auth-stats">
          <div className="auth-stat">
            <strong>24h</strong>
            <span>live trend window</span>
          </div>
          <div className="auth-stat">
            <strong>RBAC</strong>
            <span>admin, analyst, viewer</span>
          </div>
          <div className="auth-stat">
            <strong>1 view</strong>
            <span>records, dashboard, users</span>
          </div>
        </div>
      </section>

      <section className="auth-panel-wrap">
        <div className="card auth-panel">
          <div className="auth-brand">
            <div className="logo-circle">FF</div>
            <span className="eyebrow">Secure Sign In</span>
          </div>

          <h2>Welcome back</h2>
          <p className="auth-panel-copy">Sign in to review your latest financial activity and team access.</p>

          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Sign In</button>
          </form>

          <p className="auth-footer">
            Don&apos;t have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
