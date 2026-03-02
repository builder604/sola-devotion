import { useState, useEffect } from 'react';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'personal', label: 'Personal' },
  { value: 'family', label: 'Family' },
  { value: 'church', label: 'Church' },
  { value: 'world', label: 'World' },
  { value: 'thanksgiving', label: 'Thanksgiving' },
  { value: 'confession', label: 'Confession' },
  { value: 'intercession', label: 'Intercession' },
];

const PRIORITIES = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function PrayerForm({ prayer, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'normal',
    scripture_ref: '',
    tags: '',
  });

  useEffect(() => {
    if (prayer) {
      setForm({
        title: prayer.title || '',
        description: prayer.description || '',
        category: prayer.category || 'general',
        priority: prayer.priority || 'normal',
        scripture_ref: prayer.scripture_ref || '',
        tags: (prayer.tags || []).join(', '),
      });
    }
  }, [prayer]);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      ...form,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    });
  }

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Prayer Request Title *</label>
        <input
          type="text"
          className="form-input"
          value={form.title}
          onChange={e => update('title', e.target.value)}
          placeholder="What would you like to pray for?"
          required
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          className="form-textarea"
          value={form.description}
          onChange={e => update('description', e.target.value)}
          placeholder="Additional details or context..."
          rows={3}
        />
      </div>

      <div className="flex gap-8">
        <div className="form-group" style={{ flex: 1 }}>
          <label>Category</label>
          <select
            className="form-select"
            value={form.category}
            onChange={e => update('category', e.target.value)}
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ flex: 1 }}>
          <label>Priority</label>
          <select
            className="form-select"
            value={form.priority}
            onChange={e => update('priority', e.target.value)}
          >
            {PRIORITIES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Related Scripture</label>
        <input
          type="text"
          className="form-input"
          value={form.scripture_ref}
          onChange={e => update('scripture_ref', e.target.value)}
          placeholder="e.g., Philippians 4:6-7"
        />
      </div>

      <div className="form-group">
        <label>Tags (comma-separated)</label>
        <input
          type="text"
          className="form-input"
          value={form.tags}
          onChange={e => update('tags', e.target.value)}
          placeholder="e.g., healing, provision, guidance"
        />
      </div>

      <div className="modal-actions">
        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
          {prayer ? 'Update Prayer' : 'Add Prayer Request'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
