const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /healthz - Health check endpoint
router.get('/', async (req, res) => {
  try {
    // Test database connection
    await db.query('SELECT 1');
    
    res.json({
      ok: true,
      version: '1.0',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      version: '1.0',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

module.exports = router;