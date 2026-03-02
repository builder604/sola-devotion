export default function PrayerList({ prayers, onEdit, onStatusChange, onDelete }) {
  if (prayers.length === 0) {
    return (
      <div className="empty-state">
        <h3>No prayer requests yet</h3>
        <p>"Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God." — Philippians 4:6</p>
      </div>
    );
  }

  return (
    <div>
      {prayers.map(prayer => (
        <div key={prayer.id} className={`prayer-item ${prayer.status === 'answered' ? 'answered' : ''} ${prayer.priority}`}>
          <div className="prayer-title">{prayer.title}</div>

          {prayer.description && (
            <div className="prayer-desc">{prayer.description}</div>
          )}

          {prayer.scripture_ref && (
            <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--gold)', marginBottom: 6 }}>
              {prayer.scripture_ref}
            </div>
          )}

          <div className="prayer-meta">
            <span className="badge badge-category">{prayer.category}</span>
            <span className={`badge badge-status ${prayer.status}`}>{prayer.status}</span>
            {prayer.priority !== 'normal' && (
              <span className={`badge badge-priority ${prayer.priority}`}>{prayer.priority}</span>
            )}
            {(prayer.tags || []).map(tag => (
              <span key={tag} className="badge badge-tag">{tag}</span>
            ))}
            <span className="prayer-date">{formatDate(prayer.created_at)}</span>
          </div>

          {prayer.answer_notes && (
            <div style={{
              marginTop: 8,
              padding: '8px 12px',
              background: '#e8f5e9',
              borderRadius: 'var(--radius)',
              fontSize: '0.85rem',
              color: 'var(--green)',
            }}>
              {prayer.answer_notes}
            </div>
          )}

          <div className="prayer-actions">
            {prayer.status === 'active' && (
              <>
                <button
                  className="btn btn-sm btn-gold"
                  onClick={() => onStatusChange(prayer.id, 'answered')}
                >
                  Answered
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => onStatusChange(prayer.id, 'ongoing')}
                >
                  Ongoing
                </button>
              </>
            )}
            {prayer.status === 'answered' && (
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => onStatusChange(prayer.id, 'active')}
              >
                Reopen
              </button>
            )}
            {prayer.status === 'ongoing' && (
              <button
                className="btn btn-sm btn-gold"
                onClick={() => onStatusChange(prayer.id, 'answered')}
              >
                Answered
              </button>
            )}
            <button className="btn btn-sm btn-secondary" onClick={() => onEdit(prayer)}>
              Edit
            </button>
            <button className="btn btn-sm btn-danger" onClick={() => onDelete(prayer.id)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
