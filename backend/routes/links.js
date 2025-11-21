const express = require('express');
const router = express.Router();
const Link = require('../models/link');
const validUrl = require('valid-url');

// GET /api/links - List all links
router.get('/', async (req, res) => {
  try {
    const links = await Link.findAll();
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch links' });
  }
});

// GET /api/links/:code - Get link stats
router.get('/:code', async (req, res) => {
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

// POST /api/links - Create new short link
router.post('/', async (req, res) => {
  try {
    const { target_url, custom_code } = req.body;

    // Validate URL
    if (!target_url || !validUrl.isUri(target_url)) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    // Create link
    const link = await Link.create({ target_url, custom_code });
    
    res.status(201).json(link);
  } catch (error) {
    if (error.message === 'Custom code already exists') {
      return res.status(409).json({ error: 'Custom code already exists' });
    }
    if (error.message.includes('Code can only contain')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create link' });
  }
});

// DELETE /api/links/:code - Delete link
router.delete('/:code', async (req, res) => {
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

module.exports = router;