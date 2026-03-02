const express = require('express');
const { getDb } = require('../database');

const router = express.Router();

// GET /api/reading-plan - Get all reading plan entries
router.get('/', (req, res) => {
  const db = getDb();
  const entries = db.prepare(
    'SELECT * FROM reading_plan ORDER BY sort_order ASC, scheduled_date ASC, id ASC'
  ).all();
  res.json(entries);
});

// GET /api/reading-plan/next - Get next unread passage
router.get('/next', (req, res) => {
  const db = getDb();
  const next = db.prepare(
    'SELECT * FROM reading_plan WHERE completed = 0 ORDER BY sort_order ASC, scheduled_date ASC, id ASC LIMIT 1'
  ).get();

  if (!next) {
    return res.json({ exists: false });
  }

  res.json({ exists: true, ...next });
});

// POST /api/reading-plan - Add passage to reading plan
router.post('/', (req, res) => {
  const db = getDb();
  const { passage, book, scheduled_date, notes } = req.body;

  if (!passage || !passage.trim()) {
    return res.status(400).json({ error: 'Passage is required' });
  }

  // Get max sort order
  const max = db.prepare('SELECT MAX(sort_order) as m FROM reading_plan').get();
  const sortOrder = (max.m || 0) + 1;

  const result = db.prepare(
    'INSERT INTO reading_plan (passage, book, scheduled_date, notes, sort_order) VALUES (?, ?, ?, ?, ?)'
  ).run(passage.trim(), book?.trim() || null, scheduled_date || null, notes?.trim() || null, sortOrder);

  const entry = db.prepare('SELECT * FROM reading_plan WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(entry);
});

// POST /api/reading-plan/bulk - Add multiple passages at once
router.post('/bulk', (req, res) => {
  const db = getDb();
  const { passages } = req.body;

  if (!passages || !Array.isArray(passages) || passages.length === 0) {
    return res.status(400).json({ error: 'Passages array is required' });
  }

  const max = db.prepare('SELECT MAX(sort_order) as m FROM reading_plan').get();
  let sortOrder = (max.m || 0) + 1;

  const stmt = db.prepare(
    'INSERT INTO reading_plan (passage, book, scheduled_date, sort_order) VALUES (?, ?, ?, ?)'
  );

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      const p = typeof item === 'string' ? item : item.passage;
      const book = typeof item === 'string' ? null : item.book;
      const date = typeof item === 'string' ? null : item.scheduled_date;
      stmt.run(p.trim(), book, date, sortOrder++);
    }
  });

  insertMany(passages);

  const entries = db.prepare(
    'SELECT * FROM reading_plan ORDER BY sort_order ASC, id ASC'
  ).all();

  res.status(201).json(entries);
});

// PUT /api/reading-plan/:id - Update entry
router.put('/:id', (req, res) => {
  const db = getDb();
  const { passage, book, scheduled_date, completed, notes } = req.body;

  const existing = db.prepare('SELECT * FROM reading_plan WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Entry not found' });
  }

  db.prepare(`
    UPDATE reading_plan SET passage=?, book=?, scheduled_date=?, completed=?, notes=?
    WHERE id=?
  `).run(
    passage?.trim() || existing.passage,
    book !== undefined ? (book?.trim() || null) : existing.book,
    scheduled_date !== undefined ? scheduled_date : existing.scheduled_date,
    completed !== undefined ? (completed ? 1 : 0) : existing.completed,
    notes !== undefined ? (notes?.trim() || null) : existing.notes,
    req.params.id
  );

  const entry = db.prepare('SELECT * FROM reading_plan WHERE id = ?').get(req.params.id);
  res.json(entry);
});

// DELETE /api/reading-plan/:id - Remove entry
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM reading_plan WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
