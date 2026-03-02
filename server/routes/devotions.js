const express = require('express');
const { getDb, getSetting } = require('../database');
const { fetchPassage } = require('../services/bibleService');
const { generateDevotion } = require('../services/devotionService');

const router = express.Router();

// GET /api/devotions/today - Get today's devotion
router.get('/today', (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const devotion = db.prepare('SELECT * FROM devotions WHERE date = ?').get(today);

  if (!devotion) {
    return res.json({ exists: false, date: today });
  }

  res.json({ exists: true, ...devotion });
});

// GET /api/devotions/:date - Get devotion by date
router.get('/:date', (req, res) => {
  const db = getDb();
  const devotion = db.prepare('SELECT * FROM devotions WHERE date = ?').get(req.params.date);

  if (!devotion) {
    return res.status(404).json({ error: 'No devotion found for this date' });
  }

  res.json(devotion);
});

// GET /api/devotions - List recent devotions
router.get('/', (req, res) => {
  const db = getDb();
  const limit = parseInt(req.query.limit) || 30;
  const devotions = db.prepare(
    'SELECT id, date, passage, translation, devotion_title FROM devotions ORDER BY date DESC LIMIT ?'
  ).all(limit);
  res.json(devotions);
});

// POST /api/devotions/generate - Generate a new devotion
router.post('/generate', async (req, res) => {
  const db = getDb();
  const { passage, date, translation: reqTranslation } = req.body;

  if (!passage) {
    return res.status(400).json({ error: 'Missing "passage" in request body' });
  }

  const targetDate = date || new Date().toISOString().split('T')[0];
  const translation = reqTranslation || getSetting('translation') || 'kjv';

  // Check if devotion already exists for this date
  const existing = db.prepare('SELECT * FROM devotions WHERE date = ?').get(targetDate);
  if (existing) {
    return res.json({ exists: true, ...existing });
  }

  try {
    // Fetch the scripture text
    const scripture = await fetchPassage(passage, translation);

    // Generate the devotional via Claude
    const devotion = await generateDevotion(passage, scripture.text, scripture.translation);

    // Save to database
    const stmt = db.prepare(`
      INSERT INTO devotions (date, passage, translation, scripture_text, devotion_title, devotion_text, opening_prayer, closing_prayer, confession_reference)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      targetDate,
      scripture.reference || passage,
      translation,
      scripture.text,
      devotion.title,
      devotion.devotion_text,
      devotion.opening_prayer,
      devotion.closing_prayer,
      devotion.confession_reference
    );

    const saved = db.prepare('SELECT * FROM devotions WHERE id = ?').get(result.lastInsertRowid);
    res.json({ exists: true, ...saved });
  } catch (err) {
    console.error('Devotion generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/devotions/:id - Delete a devotion
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM devotions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
