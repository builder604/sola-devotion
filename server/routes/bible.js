const express = require('express');
const { fetchPassage, getAvailableTranslations } = require('../services/bibleService');

const router = express.Router();

// GET /api/bible/translations - List available translations
router.get('/translations', (req, res) => {
  const translations = getAvailableTranslations();
  const list = Object.entries(translations).map(([key, t]) => ({
    key,
    name: t.name,
    source: t.source,
  }));
  res.json(list);
});

// GET /api/bible/passage?ref=Romans+8:1-11&translation=kjv
router.get('/passage', async (req, res) => {
  const { ref, translation = 'kjv' } = req.query;

  if (!ref) {
    return res.status(400).json({ error: 'Missing "ref" query parameter' });
  }

  try {
    const passage = await fetchPassage(ref, translation);
    res.json(passage);
  } catch (err) {
    console.error('Bible fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
