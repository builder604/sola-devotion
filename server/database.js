const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'sola-devotion.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    migrate(db);
  }
  return db;
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prayers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'general',
      status TEXT DEFAULT 'active',
      priority TEXT DEFAULT 'normal',
      scripture_ref TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      answered_at DATETIME,
      answer_notes TEXT
    );

    CREATE TABLE IF NOT EXISTS prayer_tags (
      prayer_id INTEGER NOT NULL,
      tag TEXT NOT NULL,
      PRIMARY KEY (prayer_id, tag),
      FOREIGN KEY (prayer_id) REFERENCES prayers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS devotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      passage TEXT NOT NULL,
      translation TEXT DEFAULT 'kjv',
      scripture_text TEXT,
      devotion_title TEXT,
      devotion_text TEXT,
      opening_prayer TEXT,
      closing_prayer TEXT,
      confession_reference TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reading_plan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      passage TEXT NOT NULL,
      book TEXT,
      scheduled_date TEXT,
      completed INTEGER DEFAULT 0,
      notes TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT UNIQUE NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_prayers_status ON prayers(status);
    CREATE INDEX IF NOT EXISTS idx_prayers_category ON prayers(category);
    CREATE INDEX IF NOT EXISTS idx_devotions_date ON devotions(date);
    CREATE INDEX IF NOT EXISTS idx_reading_plan_date ON reading_plan(scheduled_date);
  `);

  // Seed default settings if empty
  const count = db.prepare('SELECT COUNT(*) as c FROM settings').get();
  if (count.c === 0) {
    const insert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    insert.run('translation', process.env.DEFAULT_TRANSLATION || 'kjv');
    insert.run('notification_time', process.env.NOTIFICATION_TIME || '06:00');
    insert.run('notification_enabled', 'true');
  }
}

function getSetting(key) {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  getDb().prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

function getAllSettings() {
  const rows = getDb().prepare('SELECT key, value FROM settings').all();
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

module.exports = { getDb, getSetting, setSetting, getAllSettings };
