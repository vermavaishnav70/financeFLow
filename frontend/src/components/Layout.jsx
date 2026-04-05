import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, LogOut, KeyRound, LayoutDashboard, Receipt, Users, X } from 'lucide-react';
import { ENV } from '../config/env';
import './Layout.css';

export default function Layout() {
  const { theme, toggleTheme } = useTheme();
  const { user, token, logout } = useAuth();
  const location = useLocation();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const navLinks = [{ name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> }];

  if (user?.role === 'ANALYST' || user?.role === 'ADMIN') {
    navLinks.push({ name: 'Records', path: '/records', icon: <Receipt size={20} /> });
  }

  if (user?.role === 'ADMIN') {
    navLinks.push({ name: 'Users', path: '/users', icon: <Users size={20} /> });
  }

  useEffect(() => {
    const { body, documentElement } = document;

    if (isPasswordModalOpen) {
      body.classList.add('modal-open');
      documentElement.classList.add('modal-open');
    }

    return () => {
      body.classList.remove('modal-open');
      documentElement.classList.remove('modal-open');
    };
  }, [isPasswordModalOpen]);

  const openPasswordModal = () => {
    setIsPasswordModalOpen(true);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordError('');
  };

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordError('');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      setPasswordError('');
      const res = await fetch(`${ENV.API_BASE_URL}/users/me/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update password');
      }

      closePasswordModal();
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="logo-circle">FF</div>
          <div className="brand-copy">
            <h2>FinanceFlow</h2>
            <p>Analytics-first money operations</p>
          </div>
        </div>

        <div className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.icon}
              <span>{link.name}</span>
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <button className="icon-btn" onClick={openPasswordModal} aria-label="Change Password">
            <KeyRound size={20} />
          </button>

          <div className="user-profile">
            <div className="user-copy">
              <span className="user-name">{user?.name}</span>
              <span className="user-role-copy">Signed in and synced</span>
            </div>
            <span className={`badge badge-${user?.role === 'ADMIN' ? 'danger' : 'success'}`}>
              {user?.role}
            </span>
          </div>

          <button className="icon-btn logout-btn" onClick={logout} aria-label="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="main-content">
        <div className="container">
          <Outlet />
        </div>
      </main>

      {typeof document !== 'undefined' && isPasswordModalOpen ? createPortal(
        <div className="modal-backdrop">
          <div className="card modal-card" style={{ animation: 'fadeIn 0.2s' }}>
            <div className="modal-header">
              <div className="stack-sm">
                <span className="eyebrow">Security</span>
                <h3>Change password</h3>
                <p className="modal-copy">Update your password for the current account.</p>
              </div>
              <button className="icon-btn" onClick={closePasswordModal} aria-label="Close Password Dialog">
                <X size={20} />
              </button>
            </div>
            {passwordError ? <div className="form-error">{passwordError}</div> : null}
            <form className="record-form" onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label className="form-label">Current password</label>
                <input
                  className="form-input"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">New password</label>
                <input
                  className="form-input"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm new password</label>
                <input
                  className="form-input"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closePasswordModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
}
