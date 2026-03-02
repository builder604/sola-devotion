import { useState, useEffect } from 'react';
import DevotionCard from '../components/DevotionCard';
import * as api from '../api';

export default function History() {
  const [devotions, setDevotions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const data = await api.getDevotions(60);
      setDevotions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function viewDevotion(date) {
    try {
      const data = await api.getDevotion(date);
      setSelected(data);
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        <p>Loading history...</p>
      </div>
    );
  }

  if (selected) {
    return (
      <div>
        <button className="btn btn-secondary btn-sm mb-16" onClick={() => setSelected(null)}>
          &larr; Back to History
        </button>
        <DevotionCard devotion={selected} />
      </div>
    );
  }

  if (devotions.length === 0) {
    return (
      <div className="empty-state">
        <h3>No devotions yet</h3>
        <p>Your devotion history will appear here after you generate your first daily devotion.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="card-title mb-16">Devotion History</h3>
      {devotions.map(d => (
        <div
          key={d.id}
          className="card"
          style={{ cursor: 'pointer' }}
          onClick={() => viewDevotion(d.date)}
        >
          <div className="flex-between">
            <div>
              <div style={{
                fontFamily: "'Crimson Pro', Georgia, serif",
                fontWeight: 600,
                fontSize: '1rem',
              }}>
                {d.devotion_title || 'Daily Devotion'}
              </div>
              <div className="devotion-passage">{d.passage}</div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
              {formatDate(d.date)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
