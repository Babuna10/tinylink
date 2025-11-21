const db = require('../config/database');
const { nanoid } = require('nanoid');

class Link {
  // Create links table
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS links (
        id SERIAL PRIMARY KEY,
        code VARCHAR(10) UNIQUE NOT NULL,
        target_url TEXT NOT NULL,
        clicks INTEGER DEFAULT 0,
        last_clicked TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_code ON links(code);
      CREATE INDEX IF NOT EXISTS idx_created_at ON links(created_at);
    `;
    
    await db.query(query);
    console.log('✅ Links table created/verified');
  }

  // Create a new short link
  static async create({ target_url, custom_code = null }) {
    const code = custom_code || nanoid(6);
    
    // Validate code format
    if (!/^[A-Za-z0-9_-]{1,10}$/.test(code)) {
      throw new Error('Code can only contain letters, numbers, hyphens, and underscores (1-10 characters)');
    }

    const query = `
      INSERT INTO links (code, target_url)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [code, target_url]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Custom code already exists');
      }
      throw error;
    }
  }

  // Find link by code
  static async findByCode(code) {
    const query = 'SELECT * FROM links WHERE code = $1';
    const result = await db.query(query, [code]);
    return result.rows[0];
  }

  // Get all links
  static async findAll() {
    const query = 'SELECT * FROM links ORDER BY created_at DESC';
    const result = await db.query(query);
    return result.rows;
  }

  // Increment click count
  static async incrementClicks(code) {
    const query = `
      UPDATE links 
      SET clicks = clicks + 1, last_clicked = CURRENT_TIMESTAMP 
      WHERE code = $1
    `;
    await db.query(query, [code]);
  }

  // Delete link by code
  static async delete(code) {
    const query = 'DELETE FROM links WHERE code = $1 RETURNING *';
    const result = await db.query(query, [code]);
    return result.rows[0];
  }

  // Get link stats
  static async getStats(code) {
    const link = await this.findByCode(code);
    if (!link) return null;
    
    return {
      code: link.code,
      target_url: link.target_url,
      clicks: link.clicks,
      last_clicked: link.last_clicked,
      created_at: link.created_at
    };
  }
}

module.exports = Link;