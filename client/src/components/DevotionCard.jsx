import ReactMarkdown from 'react-markdown';

export default function DevotionCard({ devotion }) {
  return (
    <div className="card">
      {/* Title */}
      <h2 className="card-title" style={{ marginBottom: 4 }}>
        {devotion.devotion_title || 'Daily Devotion'}
      </h2>
      <p className="devotion-passage">
        {devotion.passage} ({devotion.translation?.toUpperCase()})
      </p>
      <p className="prayer-date" style={{ marginBottom: 16 }}>
        {formatDate(devotion.date)}
      </p>

      {/* Opening Prayer */}
      {devotion.opening_prayer && (
        <div style={{ marginBottom: 16 }}>
          <p className="devotion-section-label">Opening Prayer</p>
          <div className="devotion-prayer">{devotion.opening_prayer}</div>
        </div>
      )}

      {/* Scripture Text */}
      {devotion.scripture_text && (
        <div style={{ marginBottom: 16 }}>
          <p className="devotion-section-label">Scripture</p>
          <div className="scripture-text">{devotion.scripture_text}</div>
        </div>
      )}

      {/* Devotional Reflection */}
      {devotion.devotion_text && (
        <div style={{ marginBottom: 16 }}>
          <p className="devotion-section-label">Reflection</p>
          <div className="devotion-body">
            <ReactMarkdown>{devotion.devotion_text}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Closing Prayer */}
      {devotion.closing_prayer && (
        <div style={{ marginBottom: 12 }}>
          <p className="devotion-section-label">Closing Prayer</p>
          <div className="devotion-prayer">{devotion.closing_prayer}</div>
        </div>
      )}

      {/* Confessional Reference */}
      {devotion.confession_reference && (
        <div className="devotion-confession">
          {devotion.confession_reference}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
