import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <div className="auth-hero-content">
          <span className="eyebrow">Team Onboarding</span>
          <h1>Bring your finance workflow into one reliable rhythm.</h1>
          <p>
            Set up your workspace, invite collaborators, and start tracking operational money
            movement with a cleaner interface from day one.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <span className="auth-feature-dot" />
              <span>Create role-aware access for admins, analysts, and viewers.</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-dot" />
              <span>Standardize records with categories, notes, and dates from the start.</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-dot" />
              <span>Get immediate visibility into income, expense, and balance movement.</span>
            </div>
          </div>
        </div>

        <div className="auth-stats">
          <div className="auth-stat">
            <strong>Fast</strong>
            <span>create an account in minutes</span>
          </div>
          <div className="auth-stat">
            <strong>Clear</strong>
            <span>shared financial context</span>
          </div>
          <div className="auth-stat">
            <strong>Safe</strong>
            <span>permissions built into the flow</span>
          </div>
        </div>
      </section>

      <section className="auth-panel-wrap">
        <div className="card auth-panel">
          <div className="auth-brand">
            <div className="logo-circle">FF</div>
            <span className="eyebrow">Create Workspace</span>
          </div>

          <h2>Create account</h2>
          <p className="auth-panel-copy">Join FinanceFlow and start organizing spending with more confidence.</p>

          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input type="text" className="form-input" required value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Account</button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
