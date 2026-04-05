import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ENV } from '../config/env';
import { RotateCcw, Trash2 } from 'lucide-react';
import { TableSkeleton } from '../components/LoadingState';

export default function Users() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'VIEWER',
    status: 'ACTIVE',
  });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data.data) ? data.data : (data.data?.users || []));
      }
    } catch (err) {
      console.error("Users fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setAuditLoading(true);
      const res = await fetch(`${ENV.API_BASE_URL}/audit?limit=12`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(Array.isArray(data.data) ? data.data : (data.data?.logs || []));
      }
    } catch (err) {
      console.error('Audit logs fetch error:', err);
    } finally {
      setAuditLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
    fetchAuditLogs();
  }, [fetchAuditLogs, fetchUsers]);

  if (user?.role !== 'ADMIN') {
    return <div className="loading-copy">Access denied.</div>;
  }

  const createUser = async (e) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      setCreateError('');
      const res = await fetch(`${ENV.API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(createForm)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create user');
      }

      setCreateForm({
        name: '',
        email: '',
        password: '',
        role: 'VIEWER',
        status: 'ACTIVE',
      });
      fetchUsers();
      fetchAuditLogs();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const updateRole = async (id, newRole) => {
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        fetchUsers();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/users/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchUsers();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchUsers();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="page-title">
          <span className="eyebrow">Admin</span>
          <h1>User management</h1>
          <p className="page-subtitle">Adjust roles, access status, and workspace membership from one place.</p>
        </div>
      </div>

      <div className="panel form-panel">
        <div className="panel-header">
          <div className="panel-title">
            <h3>Create user</h3>
            <p>Add a workspace user and assign their initial access level.</p>
          </div>
        </div>
        {createError ? <div className="form-error">{createError}</div> : null}
        <form className="inline-form-grid" onSubmit={createUser}>
          <input
            className="form-input"
            placeholder="Full name"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            required
          />
          <input
            className="form-input"
            type="email"
            placeholder="Email address"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            required
          />
          <input
            className="form-input"
            type="password"
            placeholder="Temporary password"
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            required
          />
          <select
            className="form-input table-select"
            value={createForm.role}
            onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
          >
            <option value="VIEWER">VIEWER</option>
            <option value="ANALYST">ANALYST</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <select
            className="form-input table-select"
            value={createForm.status}
            onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
          <button className="btn btn-primary" type="submit" disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </div>

      <div className="panel table-shell">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton columns={5} rows={5} />
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">No users found.</td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700 }}>{u.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td>
                      <select
                        className="form-input table-select"
                        style={{ padding: '0.25rem 0.5rem', width: 'auto', display: 'inline-block' }}
                        value={u.role}
                        onChange={(e) => updateRole(u.id, e.target.value)}
                      >
                        <option value="VIEWER">VIEWER</option>
                        <option value="ANALYST">ANALYST</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className="form-input table-select"
                        style={{ padding: '0.25rem 0.5rem', width: 'auto', display: 'inline-block' }}
                        value={u.status || 'ACTIVE'}
                        onChange={(e) => updateStatus(u.id, e.target.value)}
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </td>
                    <td>
                      {user.id !== u.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {u.status === 'INACTIVE' ? (
                            <button
                              className="icon-btn"
                              onClick={() => updateStatus(u.id, 'ACTIVE')}
                              style={{ color: 'var(--success-color)' }}
                              title="Restore User"
                            >
                              <RotateCcw size={18} />
                            </button>
                          ) : (
                            <button
                              className="icon-btn"
                              onClick={() => deleteUser(u.id)}
                              style={{ color: 'var(--danger-color)' }}
                              title="Deactivate User"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel table-shell">
        <div className="panel-header" style={{ padding: '1.25rem 1.25rem 0' }}>
          <div className="panel-title">
            <h3>Recent audit log</h3>
            <p>Track who changed users and records across the workspace.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Target</th>
                <th>Performed By</th>
              </tr>
            </thead>
            <tbody>
              {auditLoading ? (
                <TableSkeleton columns={5} rows={6} />
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">No audit activity found.</td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td><span className="badge badge-neutral">{log.action}</span></td>
                    <td style={{ textTransform: 'capitalize' }}>{log.entity}</td>
                    <td><span className="code-chip">{log.entityId.slice(0, 8)}</span></td>
                    <td>{log.performer?.name || log.performer?.email || 'Unknown'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
