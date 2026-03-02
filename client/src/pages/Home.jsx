import { useState, useEffect } from 'react';
import DevotionCard from '../components/DevotionCard';
import PassageSelector from '../components/PassageSelector';
import * as api from '../api';

export default function Home() {
  const [devotion, setDevotion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    loadToday();
    api.getSettings().then(setSettings).catch(() => {});
  }, []);

  async function loadToday() {
    try {
      setLoading(true);
      const data = await api.getTodayDevotion();
      if (data.exists) {
        setDevotion(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate(passage) {
    setGenerating(true);
    setError(null);
    try {
      const data = await api.generateDevotion(passage, null, settings.translation);
      setDevotion(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenerate() {
    if (!devotion) return;
    try {
      await api.deleteDevotion(devotion.id);
      setDevotion(null);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        <p>Loading today's devotion...</p>
      </div>
    );
  }

  return (
    <div>
      {error && <div className="error-msg">{error}</div>}

      {generating && (
        <div className="card text-center">
          <div className="loading-spinner" />
          <p style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '1.1rem' }}>
            Preparing your devotion...
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: 8 }}>
            "Open my eyes, that I may behold wondrous things out of your law." — Psalm 119:18
          </p>
        </div>
      )}

      {!devotion && !generating && (
        <>
          <div className="card text-center" style={{ marginBottom: 16 }}>
            <p style={{
              fontFamily: "'Crimson Pro', Georgia, serif",
              fontSize: '1.1rem',
              fontStyle: 'italic',
              color: 'var(--brown-light)',
            }}>
              "Your word is a lamp to my feet and a light to my path."
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: 4 }}>
              Psalm 119:105
            </p>
          </div>
          <PassageSelector onSelect={handleGenerate} loading={generating} />
          <NextFromPlan onSelect={handleGenerate} />
        </>
      )}

      {devotion && !generating && (
        <>
          <DevotionCard devotion={devotion} />
          <div className="text-center mt-16">
            <button className="btn btn-secondary btn-sm" onClick={handleRegenerate}>
              Regenerate with a different passage
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function NextFromPlan({ onSelect }) {
  const [next, setNext] = useState(null);

  useEffect(() => {
    api.getNextPassage().then(data => {
      if (data.exists) setNext(data);
    }).catch(() => {});
  }, []);

  if (!next) return null;

  return (
    <div className="card mt-16">
      <p className="devotion-section-label">Next in Reading Plan</p>
      <p style={{
        fontFamily: "'Crimson Pro', Georgia, serif",
        fontSize: '1.1rem',
        fontWeight: 600,
        marginBottom: 12,
      }}>
        {next.passage}
      </p>
      <button
        className="btn btn-gold btn-block"
        onClick={() => onSelect(next.passage)}
      >
        Use this passage for today
      </button>
    </div>
  );
}
