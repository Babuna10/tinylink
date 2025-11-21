const Link = require('../models/link');

async function initializeDatabase() {
  try {
    await Link.createTable();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

module.exports = initializeDatabase;