import { useState, useEffect } from 'react';
import * as api from '../api';

export default function ReadingPlan() {
  const [entries, setEntries] = useState([]);
  const [newPassage, setNewPassage] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPlan();
  }, []);

  async function loadPlan() {
    try {
      const data = await api.getReadingPlan();
      setEntries(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddPassage(e) {
    e.preventDefault();
    if (!newPassage.trim()) return;
    try {
      await api.addToReadingPlan({ passage: newPassage.trim() });
      setNewPassage('');
      loadPlan();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleBulkAdd() {
    const passages = bulkInput
      .split('\n')
      .map(p => p.trim())
      .filter(Boolean);

    if (passages.length === 0) return;

    try {
      await api.addBulkPassages(passages);
      setBulkInput('');
      setShowBulk(false);
      loadPlan();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleComplete(entry) {
    try {
      await api.updateReadingEntry(entry.id, { completed: !entry.completed });
      loadPlan();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteReadingEntry(id);
      loadPlan();
    } catch (err) {
      setError(err.message);
    }
  }

  const completed = entries.filter(e => e.completed).length;
  const total = entries.length;

  return (
    <div>
      <div className="card">
        <h3 className="card-title">Reading Plan</h3>
        {total > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{
              background: 'var(--gray-200)',
              borderRadius: 10,
              height: 8,
              overflow: 'hidden',
              marginBottom: 4,
            }}>
              <div style={{
                background: 'var(--navy)',
                height: '100%',
                width: `${total ? (completed / total) * 100 : 0}%`,
                borderRadius: 10,
                transition: 'width 0.3s',
              }} />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
              {completed} of {total} passages completed
            </p>
          </div>
        )}
      </div>

      {/* Add Single Passage */}
      <form onSubmit={handleAddPassage} className="card">
        <div className="flex gap-8">
          <input
            type="text"
            className="form-input"
            value={newPassage}
            onChange={e => setNewPassage(e.target.value)}
            placeholder="Add passage (e.g., Romans 8)"
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={!newPassage.trim()}>
            Add
          </button>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm mt-8"
          onClick={() => setShowBulk(!showBulk)}
        >
          {showBulk ? 'Hide' : 'Bulk add'}
        </button>

        {showBulk && (
          <div className="mt-8">
            <textarea
              className="form-textarea"
              value={bulkInput}
              onChange={e => setBulkInput(e.target.value)}
              placeholder="Enter one passage per line:&#10;Romans 1&#10;Romans 2&#10;Romans 3&#10;..."
              rows={6}
            />
            <button
              type="button"
              className="btn btn-primary btn-block mt-8"
              onClick={handleBulkAdd}
              disabled={!bulkInput.trim()}
            >
              Add All Passages
            </button>
          </div>
        )}
      </form>

      {error && <div className="error-msg">{error}</div>}

      {/* Reading List */}
      {entries.length === 0 ? (
        <div className="empty-state">
          <h3>No passages in your reading plan</h3>
          <p>Add Bible passages above to build your study plan. The next unread passage will be suggested for your daily devotion.</p>
        </div>
      ) : (
        <div>
          {entries.map(entry => (
            <div
              key={entry.id}
              className={`reading-item ${entry.completed ? 'completed' : ''}`}
            >
              <div
                className={`reading-check ${entry.completed ? 'checked' : ''}`}
                onClick={() => toggleComplete(entry)}
              >
                {entry.completed && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className="reading-passage">{entry.passage}</span>
              {entry.scheduled_date && (
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                  {entry.scheduled_date}
                </span>
              )}
              <button
                className="btn btn-sm btn-danger"
                onClick={() => handleDelete(entry.id)}
                style={{ padding: '4px 8px' }}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
