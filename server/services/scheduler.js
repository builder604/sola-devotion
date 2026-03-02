const cron = require('node-cron');
const webPush = require('web-push');
const { getDb, getSetting } = require('../database');

let cronJob = null;

function setupPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || 'mailto:user@example.com';

  if (publicKey && privateKey) {
    webPush.setVapidDetails(email, publicKey, privateKey);
    return true;
  }
  return false;
}

function startScheduler() {
  if (!setupPush()) {
    console.log('Push notifications disabled: VAPID keys not configured');
    console.log('Run "npm run generate-vapid-keys" to set up push notifications');
    return;
  }

  // Check every minute if it's time to send notifications
  cronJob = cron.schedule('* * * * *', () => {
    const notifTime = getSetting('notification_time') || '06:00';
    const enabled = getSetting('notification_enabled');

    if (enabled !== 'true') return;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (currentTime === notifTime) {
      sendMorningNotifications();
    }
  });

  console.log('Notification scheduler started');
}

async function sendMorningNotifications() {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  // Get today's devotion
  const devotion = db.prepare('SELECT * FROM devotions WHERE date = ?').get(today);

  const title = devotion
    ? `📖 ${devotion.devotion_title || 'Daily Devotion'}`
    : '📖 Time for your morning devotion';

  const body = devotion
    ? `${devotion.passage} — Open to read today's reflection`
    : 'Open Sola Devotion to generate today\'s devotional';

  // Get active prayer count for the notification
  const prayerCount = db.prepare(
    "SELECT COUNT(*) as c FROM prayers WHERE status = 'active'"
  ).get();

  const payload = JSON.stringify({
    title,
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: {
      url: '/',
      prayerCount: prayerCount.c,
    },
  });

  const subscriptions = db.prepare('SELECT * FROM push_subscriptions').all();

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      );
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Subscription expired, remove it
        db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(sub.id);
      } else {
        console.error('Push notification error:', err.message);
      }
    }
  }
}

async function sendTestNotification() {
  if (!setupPush()) {
    throw new Error('VAPID keys not configured');
  }

  const db = getDb();
  const subscriptions = db.prepare('SELECT * FROM push_subscriptions').all();

  if (subscriptions.length === 0) {
    throw new Error('No push subscriptions registered');
  }

  const payload = JSON.stringify({
    title: '🔔 Sola Devotion',
    body: 'Push notifications are working! Soli Deo Gloria.',
    icon: '/icon-192.png',
  });

  let sent = 0;
  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      );
      sent++;
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(sub.id);
      }
    }
  }

  return sent;
}

function stopScheduler() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
  }
}

module.exports = { startScheduler, stopScheduler, sendTestNotification };
