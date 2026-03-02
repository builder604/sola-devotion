import { useState } from 'react';

const BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
  'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
  'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel',
  'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians',
  'Ephesians', 'Philippians', 'Colossians',
  '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy',
  'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
  '1 John', '2 John', '3 John', 'Jude', 'Revelation',
];

export default function PassageSelector({ onSelect, loading }) {
  const [passage, setPassage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredBooks = passage.trim()
    ? BOOKS.filter(b => b.toLowerCase().startsWith(passage.toLowerCase().replace(/\s*\d.*$/, '')))
    : [];

  function handleSubmit(e) {
    e.preventDefault();
    if (passage.trim() && !loading) {
      onSelect(passage.trim());
    }
  }

  function selectBook(book) {
    setPassage(book + ' ');
    setShowSuggestions(false);
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h3 className="card-title" style={{ marginBottom: 8 }}>
        Generate Today's Devotion
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: 12 }}>
        Enter a passage to study (e.g., "Romans 8:1-11", "Psalm 23", "John 3:16-21")
      </p>

      <div className="form-group" style={{ position: 'relative' }}>
        <input
          type="text"
          className="form-input"
          value={passage}
          onChange={e => {
            setPassage(e.target.value);
            setShowSuggestions(e.target.value.length > 0);
          }}
          onFocus={() => setShowSuggestions(passage.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Enter passage reference..."
          disabled={loading}
        />
        {showSuggestions && filteredBooks.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--white)',
            border: '1px solid var(--gray-300)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: 200,
            overflowY: 'auto',
            zIndex: 10,
          }}>
            {filteredBooks.slice(0, 8).map(book => (
              <div
                key={book}
                onClick={() => selectBook(book)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  borderBottom: '1px solid var(--gray-100)',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--cream)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                {book}
              </div>
            ))}
          </div>
        )}
      </div>

      <button type="submit" className="btn btn-primary btn-block" disabled={!passage.trim() || loading}>
        {loading ? 'Generating devotion...' : 'Generate Devotion'}
      </button>
    </form>
  );
}
