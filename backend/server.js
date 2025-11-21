const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.json({
    ok: true,
    version: '1.0',
    timestamp: new Date().toISOString(),
    database: 'not connected'
  });
});

// Simple in-memory storage (temporary)
let links = [];

// API Routes
app.get('/api/links', (req, res) => {
  res.json(links);
});

app.post('/api/links', (req, res) => {
  const { target_url, custom_code } = req.body;
  
  if (!target_url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  const code = custom_code || Math.random().toString(36).substring(2, 8);
  
  // Check if code already exists
  if (links.find(link => link.code === code)) {
    return res.status(409).json({ error: 'Custom code already exists' });
  }
  
  const newLink = {
    code,
    target_url,
    clicks: 0,
    last_clicked: null,
    created_at: new Date().toISOString()
  };
  
  links.push(newLink);
  res.status(201).json(newLink);
});

app.get('/api/links/:code', (req, res) => {
  const { code } = req.params;
  const link = links.find(l => l.code === code);
  
  if (!link) {
    return res.status(404).json({ error: 'Link not found' });
  }
  
  res.json(link);
});

app.delete('/api/links/:code', (req, res) => {
  const { code } = req.params;
  const index = links.findIndex(l => l.code === code);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Link not found' });
  }
  
  links.splice(index, 1);
  res.json({ message: 'Link deleted successfully' });
});

// Frontend routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/code/:code', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Redirect route (simple version)
app.get('/:code', (req, res) => {
  const { code } = req.params;
  const link = links.find(l => l.code === code);
  
  if (!link) {
    return res.status(404).json({ error: 'Link not found' });
  }
  
  // Increment clicks
  link.clicks++;
  link.last_clicked = new Date().toISOString();
  
  res.redirect(302, link.target_url);
});

// Smart port finding function
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`🚀 TinyLink server running on http://localhost:${port}`);
    console.log(`📊 Using temporary in-memory storage`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

// Start the server with automatic port finding
startServer(PORT);