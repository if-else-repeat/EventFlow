require('dotenv').config({ path: require('path').resolve(__dirname, '../../../../.env') });
const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');

async function migrate() {
  console.log('Running EventFlow database migrations...');
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('✓ Schema applied successfully');
  } catch (err) {
    console.error('✗ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}
migrate();
