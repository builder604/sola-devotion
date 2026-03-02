const express = require('express');
const { getDb } = require('../database');
const { sendTestNotification } = require('../services/scheduler');

const router = express.Router();

// GET /api/push/vapid-key - Get the public VAPID key for client subscription
router.get('/vapid-key', (req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    return res.status(503).json({ error: 'Push notifications not configured' });
  }
  res.json({ publicKey: key });
});

// POST /api/push/subscribe - Register a push subscription
router.post('/subscribe', (req, res) => {
  const db = getDb();
  const { endpoint, keys } = req.body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'Invalid subscription object' });
  }

  db.prepare(
    'INSERT OR REPLACE INTO push_subscriptions (endpoint, p256dh, auth) VALUES (?, ?, ?)'
  ).run(endpoint, keys.p256dh, keys.auth);

  res.json({ success: true });
});

// DELETE /api/push/unsubscribe - Remove a push subscription
router.delete('/unsubscribe', (req, res) => {
  const db = getDb();
  const { endpoint } = req.body;

  if (!endpoint) {
    return res.status(400).json({ error: 'Missing endpoint' });
  }

  db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint);
  res.json({ success: true });
});

// POST /api/push/test - Send a test notification
router.post('/test', async (req, res) => {
  try {
    const sent = await sendTestNotification();
    res.json({ success: true, sent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
