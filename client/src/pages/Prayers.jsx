import { useState, useEffect, useCallback } from 'react';
import PrayerForm from '../components/PrayerForm';
import PrayerList from '../components/PrayerList';
import * as api from '../api';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'answered', label: 'Answered' },
];

const CATEGORY_FILTERS = [
  { value: '', label: 'All Categories' },
  { value: 'personal', label: 'Personal' },
  { value: 'family', label: 'Family' },
  { value: 'church', label: 'Church' },
  { value: 'world', label: 'World' },
  { value: 'thanksgiving', label: 'Thanksgiving' },
  { value: 'confession', label: 'Confession' },
  { value: 'intercession', label: 'Intercession' },
];

export default function Prayers() {
  const [prayers, setPrayers] = useState([]);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPrayer, setEditingPrayer] = useState(null);
  const [error, setError] = useState(null);

  const loadPrayers = useCallback(async () => {
    try {
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      if (categoryFilter) filters.category = categoryFilter;
      const data = await api.getPrayers(filters);
      setPrayers(data);
    } catch (err) {
      setError(err.message);
    }
  }, [statusFilter, categoryFilter]);

  const loadStats = async () => {
    try {
      const data = await api.getPrayerStats();
      setStats(data);
    } catch (err) {
      // stats are non-critical
    }
  };

  useEffect(() => {
    loadPrayers();
    loadStats();
  }, [loadPrayers]);

  async function handleSubmit(form) {
    try {
      if (editingPrayer) {
        await api.updatePrayer(editingPrayer.id, form);
      } else {
        await api.createPrayer(form);
      }
      setShowForm(false);
      setEditingPrayer(null);
      loadPrayers();
      loadStats();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      let updates = { status };
      if (status === 'answered') {
        const notes = prompt('How was this prayer answered? (optional)');
        if (notes !== null) updates.answer_notes = notes;
      }
      await api.updatePrayer(id, updates);
      loadPrayers();
      loadStats();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this prayer request?')) return;
    try {
      await api.deletePrayer(id);
      loadPrayers();
      loadStats();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEdit(prayer) {
    setEditingPrayer(prayer);
    setShowForm(true);
  }

  return (
    <div>
      {/* Stats */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.active}</div>
            <div className="stat-label">Active</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.answered}</div>
            <div className="stat-label">Answered</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.ongoing}</div>
            <div className="stat-label">Ongoing</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total</div>
          </div>
        </div>
      )}

      {/* Add Button */}
      <button
        className="btn btn-primary btn-block mb-16"
        onClick={() => { setEditingPrayer(null); setShowForm(true); }}
      >
        + New Prayer Request
      </button>

      {error && <div className="error-msg">{error}</div>}

      {/* Status Filters */}
      <div className="filters">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            className={`filter-chip ${statusFilter === f.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Category Filters */}
      <div className="filters">
        {CATEGORY_FILTERS.map(f => (
          <button
            key={f.value}
            className={`filter-chip ${categoryFilter === f.value ? 'active' : ''}`}
            onClick={() => setCategoryFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Prayer List */}
      <PrayerList
        prayers={prayers}
        onEdit={handleEdit}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />

      {/* Modal Form */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) { setShowForm(false); setEditingPrayer(null); }
        }}>
          <div className="modal-content">
            <h3 className="modal-title">
              {editingPrayer ? 'Edit Prayer Request' : 'New Prayer Request'}
            </h3>
            <PrayerForm
              prayer={editingPrayer}
              onSubmit={handleSubmit}
              onCancel={() => { setShowForm(false); setEditingPrayer(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
