const express = require('express');
const { getDb } = require('../database');

const router = express.Router();

const VALID_CATEGORIES = ['general', 'personal', 'family', 'church', 'world', 'thanksgiving', 'confession', 'intercession'];
const VALID_STATUSES = ['active', 'answered', 'ongoing'];
const VALID_PRIORITIES = ['urgent', 'high', 'normal'];

// GET /api/prayers - List prayer requests with optional filters
router.get('/', (req, res) => {
  const db = getDb();
  const { status, category, priority, search } = req.query;

  let sql = 'SELECT * FROM prayers WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (priority) {
    sql += ' AND priority = ?';
    params.push(priority);
  }
  if (search) {
    sql += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY CASE priority WHEN "urgent" THEN 1 WHEN "high" THEN 2 ELSE 3 END, created_at DESC';

  const prayers = db.prepare(sql).all(...params);

  // Attach tags
  const tagStmt = db.prepare('SELECT tag FROM prayer_tags WHERE prayer_id = ?');
  for (const prayer of prayers) {
    prayer.tags = tagStmt.all(prayer.id).map(t => t.tag);
  }

  res.json(prayers);
});

// GET /api/prayers/stats - Prayer statistics
router.get('/stats', (req, res) => {
  const db = getDb();

  const total = db.prepare('SELECT COUNT(*) as c FROM prayers').get().c;
  const active = db.prepare("SELECT COUNT(*) as c FROM prayers WHERE status = 'active'").get().c;
  const answered = db.prepare("SELECT COUNT(*) as c FROM prayers WHERE status = 'answered'").get().c;
  const ongoing = db.prepare("SELECT COUNT(*) as c FROM prayers WHERE status = 'ongoing'").get().c;

  const byCategory = db.prepare(
    'SELECT category, COUNT(*) as count FROM prayers GROUP BY category ORDER BY count DESC'
  ).all();

  res.json({ total, active, answered, ongoing, byCategory });
});

// GET /api/prayers/:id - Get single prayer
router.get('/:id', (req, res) => {
  const db = getDb();
  const prayer = db.prepare('SELECT * FROM prayers WHERE id = ?').get(req.params.id);

  if (!prayer) {
    return res.status(404).json({ error: 'Prayer request not found' });
  }

  prayer.tags = db.prepare('SELECT tag FROM prayer_tags WHERE prayer_id = ?')
    .all(prayer.id).map(t => t.tag);

  res.json(prayer);
});

// POST /api/prayers - Create prayer request
router.post('/', (req, res) => {
  const db = getDb();
  const { title, description, category, priority, scripture_ref, tags } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const cat = VALID_CATEGORIES.includes(category) ? category : 'general';
  const pri = VALID_PRIORITIES.includes(priority) ? priority : 'normal';

  const result = db.prepare(
    'INSERT INTO prayers (title, description, category, priority, scripture_ref) VALUES (?, ?, ?, ?, ?)'
  ).run(title.trim(), description?.trim() || null, cat, pri, scripture_ref?.trim() || null);

  // Insert tags
  if (tags && Array.isArray(tags)) {
    const tagStmt = db.prepare('INSERT OR IGNORE INTO prayer_tags (prayer_id, tag) VALUES (?, ?)');
    for (const tag of tags) {
      if (tag.trim()) tagStmt.run(result.lastInsertRowid, tag.trim().toLowerCase());
    }
  }

  const prayer = db.prepare('SELECT * FROM prayers WHERE id = ?').get(result.lastInsertRowid);
  prayer.tags = db.prepare('SELECT tag FROM prayer_tags WHERE prayer_id = ?')
    .all(prayer.id).map(t => t.tag);

  res.status(201).json(prayer);
});

// PUT /api/prayers/:id - Update prayer request
router.put('/:id', (req, res) => {
  const db = getDb();
  const { title, description, category, priority, status, scripture_ref, answer_notes, tags } = req.body;

  const existing = db.prepare('SELECT * FROM prayers WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Prayer request not found' });
  }

  const updates = {
    title: title?.trim() || existing.title,
    description: description !== undefined ? (description?.trim() || null) : existing.description,
    category: VALID_CATEGORIES.includes(category) ? category : existing.category,
    priority: VALID_PRIORITIES.includes(priority) ? priority : existing.priority,
    status: VALID_STATUSES.includes(status) ? status : existing.status,
    scripture_ref: scripture_ref !== undefined ? (scripture_ref?.trim() || null) : existing.scripture_ref,
    answer_notes: answer_notes !== undefined ? (answer_notes?.trim() || null) : existing.answer_notes,
  };

  // Set answered_at when status changes to answered
  let answered_at = existing.answered_at;
  if (status === 'answered' && existing.status !== 'answered') {
    answered_at = new Date().toISOString();
  }

  db.prepare(`
    UPDATE prayers SET title=?, description=?, category=?, priority=?, status=?, scripture_ref=?, answer_notes=?, answered_at=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(
    updates.title, updates.description, updates.category, updates.priority,
    updates.status, updates.scripture_ref, updates.answer_notes, answered_at,
    req.params.id
  );

  // Update tags
  if (tags && Array.isArray(tags)) {
    db.prepare('DELETE FROM prayer_tags WHERE prayer_id = ?').run(req.params.id);
    const tagStmt = db.prepare('INSERT OR IGNORE INTO prayer_tags (prayer_id, tag) VALUES (?, ?)');
    for (const tag of tags) {
      if (tag.trim()) tagStmt.run(req.params.id, tag.trim().toLowerCase());
    }
  }

  const prayer = db.prepare('SELECT * FROM prayers WHERE id = ?').get(req.params.id);
  prayer.tags = db.prepare('SELECT tag FROM prayer_tags WHERE prayer_id = ?')
    .all(prayer.id).map(t => t.tag);

  res.json(prayer);
});

// DELETE /api/prayers/:id - Delete prayer request
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM prayer_tags WHERE prayer_id = ?').run(req.params.id);
  db.prepare('DELETE FROM prayers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
