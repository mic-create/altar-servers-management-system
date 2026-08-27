const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for secure connections to Supabase external pooler/database
  }
});

pool.on('connect', () => {
  console.log('Successfully connected to Supabase PostgreSQL database pool.');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client pool', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};