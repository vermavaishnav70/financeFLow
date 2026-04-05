import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { ENV } from '../config/env';
import { ArrowDownCircle, ArrowUpCircle, CalendarDays, Edit2, FileText, RotateCcw, Tag, Trash2, Wallet, X } from 'lucide-react';
import { TableSkeleton } from '../components/LoadingState';

const PREDEFINED_CATEGORIES = ['Salary', 'Rent', 'Groceries', 'Utilities', 'Transportation', 'Entertainment', 'Healthcare', 'Other'];
const DEFAULT_LIMIT = 10;

const buildDefaultFilters = () => ({
  page: 1,
  limit: DEFAULT_LIMIT,
  state: 'active',
  type: '',
  category: '',
  startDate: '',
  endDate: '',
  minAmount: '',
  maxAmount: '',
  search: '',
  sortBy: 'date',
  sortOrder: 'desc',
});

export default function Records() {
  const { token, user } = useAuth();
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState(buildDefaultFilters);
  const [filterDraft, setFilterDraft] = useState(buildDefaultFilters);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ type: 'EXPENSE', amount: '', category: 'Groceries', otherCategory: '', date: new Date().toISOString().split('T')[0], description: '' });

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params.set(key, value);
        }
      });
      const requestUrl = params.toString()
        ? `${ENV.API_BASE_URL}/records?${params.toString()}`
        : `${ENV.API_BASE_URL}/records`;
      const filteredRes = await fetch(requestUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (filteredRes.ok) {
        const data = await filteredRes.json();
        const nextRecords = Array.isArray(data.data) ? data.data : (data.data?.records || []);
        setRecords(nextRecords);
        setPagination({
          page: data.meta?.page ?? appliedFilters.page,
          limit: data.meta?.limit ?? appliedFilters.limit,
          total: data.meta?.total ?? nextRecords.length,
          totalPages: data.meta?.totalPages ?? 1,
        });
      }
    } catch (err) {
      console.error("Records fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, token]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    const { body, documentElement } = document;

    if (isModalOpen) {
      body.classList.add('modal-open');
      documentElement.classList.add('modal-open');
    }

    return () => {
      body.classList.remove('modal-open');
      documentElement.classList.remove('modal-open');
    };
  }, [isModalOpen]);

  const handleOpenModal = (record = null) => {
    if (record) {
      setEditingId(record.id);
      const isCustomCategory = !PREDEFINED_CATEGORIES.includes(record.category) && record.category;
      setFormData({
        type: record.type,
        amount: record.amount,
        category: isCustomCategory ? 'Other' : record.category,
        otherCategory: isCustomCategory ? record.category : '',
        date: record.date ? record.date.split('T')[0] : '',
        description: record.description || ''
      });
    } else {
      setEditingId(null);
      setFormData({ type: 'EXPENSE', amount: '', category: 'Groceries', otherCategory: '', date: new Date().toISOString().split('T')[0], description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      amount: parseFloat(formData.amount),
      category: formData.category === 'Other' ? formData.otherCategory : formData.category
    };

    const url = editingId ? `${ENV.API_BASE_URL}/records/${editingId}` : `${ENV.API_BASE_URL}/records`;
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchRecords();
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/records/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchRecords();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestore = async (id) => {
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/records/${id}/recover`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchRecords();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const canEdit = () => user.role === 'ADMIN';
  const canCreate = user.role === 'ADMIN';
  const isAdmin = user.role === 'ADMIN';
  const isDeletedView = appliedFilters.state === 'deleted';

  const clearFilters = () => {
    const resetFilters = buildDefaultFilters();
    setFilterDraft(resetFilters);
    setAppliedFilters(resetFilters);
  };

  const modalContent = isModalOpen ? (
    <div className="modal-backdrop">
      <div className="card modal-card" style={{ animation: 'fadeIn 0.2s' }}>
        <div className="modal-header">
          <div className="stack-sm">
            <span className="eyebrow">{editingId ? 'Update Entry' : 'New Entry'}</span>
            <h3>{editingId ? 'Edit record' : 'Add record'}</h3>
            <p className="modal-copy">Capture the essentials clearly so your dashboard and reports stay clean.</p>
          </div>
          <button className="icon-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
        </div>
        <form onSubmit={handleSave} className="record-form">
          <div className="form-group">
            <label className="form-label">Record type</label>
            <div className="segmented-control" role="tablist" aria-label="Record type">
              <button
                type="button"
                className={`segment ${formData.type === 'EXPENSE' ? 'active expense' : ''}`}
                onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
              >
                <ArrowDownCircle size={16} />
                Expense
              </button>
              <button
                type="button"
                className={`segment ${formData.type === 'INCOME' ? 'active income' : ''}`}
                onClick={() => setFormData({ ...formData, type: 'INCOME' })}
              >
                <ArrowUpCircle size={16} />
                Income
              </button>
            </div>
          </div>

          <div className="record-form-grid">
            <div className="form-group">
              <label className="form-label">Amount</label>
              <div className="field-shell">
                <div className="field-icon"><Wallet size={16} /></div>
                <div className="field-body">
                  <span className="field-caption">Value</span>
                  <div className="amount-input-wrap">
                    <span className="amount-prefix">$</span>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input field-input amount-input"
                      required
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Date</label>
              <div className="field-shell">
                <div className="field-icon"><CalendarDays size={16} /></div>
                <div className="field-body">
                  <span className="field-caption">Transaction date</span>
                  <input type="date" className="form-input field-input" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <div className="field-shell">
                <div className="field-icon"><Tag size={16} /></div>
                <div className="field-body">
                  <span className="field-caption">Classification</span>
                  <select className="form-input field-input select-input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {[...PREDEFINED_CATEGORIES, 'Other'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {formData.category === 'Other' && (
              <div className="form-group">
                <label className="form-label">Custom category</label>
                <div className="field-shell">
                  <div className="field-icon"><Tag size={16} /></div>
                  <div className="field-body">
                    <span className="field-caption">Custom label</span>
                    <input type="text" className="form-input field-input" required placeholder="Enter category name" value={formData.otherCategory} onChange={e => setFormData({...formData, otherCategory: e.target.value})} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <div className="field-shell textarea-shell">
              <div className="field-icon"><FileText size={16} /></div>
              <div className="field-body">
                <span className="field-caption">Optional note</span>
                <textarea className="form-input field-input record-textarea" rows={3} placeholder="Add context for future you or your team" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Create Record'}</button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="page-title">
          <span className="eyebrow">Ledger</span>
          <h1>Financial records</h1>
          <p className="page-subtitle">Create, edit, and review the raw transactions driving your dashboard.</p>
        </div>
        {canCreate ? <button className="btn btn-primary" onClick={() => handleOpenModal()}>+ Add Record</button> : null}
      </div>

      <div className="panel form-panel">
        <div className="panel-header">
          <div className="panel-title">
            <h3>Filter records</h3>
            <p>Refine the ledger by type, category, date, amount, or keyword.</p>
          </div>
        </div>
        <div className="inline-form-grid">
          {isAdmin ? (
            <select className="form-input table-select" value={filterDraft.state} onChange={(e) => setFilterDraft({ ...filterDraft, state: e.target.value })}>
              <option value="active">Active records</option>
              <option value="deleted">Deleted only</option>
              <option value="all">All records</option>
            </select>
          ) : null}
          <select className="form-input table-select" value={filterDraft.type} onChange={(e) => setFilterDraft({ ...filterDraft, type: e.target.value })}>
            <option value="">All types</option>
            <option value="INCOME">INCOME</option>
            <option value="EXPENSE">EXPENSE</option>
          </select>
          <select className="form-input table-select" value={filterDraft.category} onChange={(e) => setFilterDraft({ ...filterDraft, category: e.target.value })}>
            <option value="">All categories</option>
            {PREDEFINED_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <input className="form-input" type="date" value={filterDraft.startDate} onChange={(e) => setFilterDraft({ ...filterDraft, startDate: e.target.value })} />
          <input className="form-input" type="date" value={filterDraft.endDate} onChange={(e) => setFilterDraft({ ...filterDraft, endDate: e.target.value })} />
          <input className="form-input" type="number" step="0.01" placeholder="Min amount" value={filterDraft.minAmount} onChange={(e) => setFilterDraft({ ...filterDraft, minAmount: e.target.value })} />
          <input className="form-input" type="number" step="0.01" placeholder="Max amount" value={filterDraft.maxAmount} onChange={(e) => setFilterDraft({ ...filterDraft, maxAmount: e.target.value })} />
          <input className="form-input" placeholder="Search description" value={filterDraft.search} onChange={(e) => setFilterDraft({ ...filterDraft, search: e.target.value })} />
          <select className="form-input table-select" value={filterDraft.sortBy} onChange={(e) => setFilterDraft({ ...filterDraft, sortBy: e.target.value })}>
            <option value="date">Sort by date</option>
            <option value="amount">Sort by amount</option>
            <option value="createdAt">Sort by created time</option>
          </select>
          <select className="form-input table-select" value={filterDraft.sortOrder} onChange={(e) => setFilterDraft({ ...filterDraft, sortOrder: e.target.value })}>
            <option value="desc">Newest / highest first</option>
            <option value="asc">Oldest / lowest first</option>
          </select>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setAppliedFilters({ ...filterDraft, page: 1 })}
          >
            Apply filters
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>
      </div>

      <div className="panel table-shell">
        <div className="panel-header table-toolbar">
          <div className="panel-title">
            <h3>{isDeletedView ? 'Deleted records' : 'Record listing'}</h3>
            <p>
              {pagination.total === 0
                ? 'No records match this view yet.'
                : `Showing ${records.length} of ${pagination.total} records.`}
            </p>
          </div>
          <div className="pagination-summary">
            <span>Rows per page</span>
            <select
              className="form-input table-select"
              value={String(filterDraft.limit)}
              onChange={(e) => {
                const nextLimit = Number(e.target.value);
                setFilterDraft({ ...filterDraft, limit: nextLimit });
                setAppliedFilters({ ...appliedFilters, limit: nextLimit, page: 1 });
              }}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton columns={6} rows={6} />
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center">No records found.</td>
                </tr>
              ) : (
                records.map(record => (
                  <tr key={record.id} className={record.isDeleted ? 'row-muted' : ''}>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge badge-${record.type === 'INCOME' ? 'success' : 'danger'}`}>
                        {record.type}
                      </span>
                    </td>
                    <td>{record.category}</td>
                    <td className={`amount ${record.type === 'INCOME' ? 'income' : 'expense'}`}>
                      ${parseFloat(record.amount).toFixed(2)}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {record.description || '-'}
                      {record.isDeleted ? <span className="inline-note">Deleted</span> : null}
                    </td>
                    <td>
                      {canEdit(record) && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {record.isDeleted ? (
                            <button className="icon-btn" onClick={() => handleRestore(record.id)} title="Restore" style={{ color: 'var(--success-color)' }}>
                              <RotateCcw size={16} />
                            </button>
                          ) : (
                            <>
                              <button className="icon-btn" onClick={() => handleOpenModal(record)} title="Edit"><Edit2 size={16} /></button>
                              <button className="icon-btn" onClick={() => handleDelete(record.id)} title="Delete" style={{ color: 'var(--danger-color)' }}><Trash2 size={16} /></button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="pagination-bar">
          <div className="pagination-copy">
            Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
          </div>
          <div className="pagination-actions">
            <button
              type="button"
              className="btn btn-secondary pagination-btn"
              disabled={pagination.page <= 1 || loading}
              onClick={() => setAppliedFilters({ ...appliedFilters, page: appliedFilters.page - 1 })}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-secondary pagination-btn"
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => setAppliedFilters({ ...appliedFilters, page: appliedFilters.page + 1 })}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {typeof document !== 'undefined' && modalContent ? createPortal(modalContent, document.body) : null}
    </div>
  );
}
