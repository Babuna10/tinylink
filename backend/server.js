const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import database models
const Link = require('./models/link');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize database
const initializeDatabase = require('./config/init');

// Health check endpoint
app.get('/healthz', async (req, res) => {
  try {
    // Test database connection
    await require('./config/database').query('SELECT 1');
    
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

// API Routes
app.get('/api/links', async (req, res) => {
  try {
    const links = await Link.findAll();
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch links' });
  }
});

app.post('/api/links', async (req, res) => {
  try {
    const { target_url, custom_code } = req.body;

    // Validate URL
    if (!target_url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      new URL(target_url);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    // Create link
    const link = await Link.create({ target_url, custom_code });
    res.status(201).json(link);
  } catch (error) {
    if (error.message === 'Custom code already exists') {
      return res.status(409).json({ error: 'Custom code already exists' });
    }
    res.status(500).json({ error: 'Failed to create link' });
  }
});

app.get('/api/links/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const stats = await Link.getStats(code);
    
    if (!stats) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch link stats' });
  }
});

app.delete('/api/links/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const deletedLink = await Link.delete(code);
    
    if (!deletedLink) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    res.json({ message: 'Link deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

// Frontend routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/code/:code', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Redirect route
app.get('/:code', async (req, res) => {
  const { code } = req.params;
  
  try {
    const link = await Link.findByCode(code);
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    await Link.incrementClicks(code);
    res.redirect(302, link.target_url);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 TinyLink server running on port ${PORT}`);
    console.log(`🗄️ Connected to PostgreSQL database`);
  });
});