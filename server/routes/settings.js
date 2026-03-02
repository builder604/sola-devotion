const express = require('express');
const { getAllSettings, setSetting } = require('../database');

const router = express.Router();

// GET /api/settings
router.get('/', (req, res) => {
  res.json(getAllSettings());
});

// PUT /api/settings
router.put('/', (req, res) => {
  const allowedKeys = ['translation', 'notification_time', 'notification_enabled'];

  for (const [key, value] of Object.entries(req.body)) {
    if (allowedKeys.includes(key)) {
      setSetting(key, String(value));
    }
  }

  res.json(getAllSettings());
});

module.exports = router;
