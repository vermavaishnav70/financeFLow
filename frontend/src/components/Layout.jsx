import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, LogOut, LayoutDashboard, Receipt, Users } from 'lucide-react';
import './Layout.css';

export default function Layout() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();

  const navLinks = [{ name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> }];

  if (user?.role === 'ANALYST' || user?.role === 'ADMIN') {
    navLinks.push({ name: 'Records', path: '/records', icon: <Receipt size={20} /> });
  }

  if (user?.role === 'ADMIN') {
    navLinks.push({ name: 'Users', path: '/users', icon: <Users size={20} /> });
  }

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
    </div>
  );
}
