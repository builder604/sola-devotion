require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { startScheduler } = require('./services/scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/bible', require('./routes/bible'));
app.use('/api/devotions', require('./routes/devotions'));
app.use('/api/prayers', require('./routes/prayers'));
app.use('/api/push', require('./routes/push'));
app.use('/api/reading-plan', require('./routes/readingPlan'));
app.use('/api/settings', require('./routes/settings'));

// Serve static files in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

// SPA fallback - serve index.html for any non-API route
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientDist, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║         SOLA DEVOTION                    ║
  ║   "Soli Deo Gloria"                     ║
  ║                                          ║
  ║   Server running on port ${PORT}            ║
  ╚══════════════════════════════════════════╝
  `);

  // Start the notification scheduler
  startScheduler();
});
