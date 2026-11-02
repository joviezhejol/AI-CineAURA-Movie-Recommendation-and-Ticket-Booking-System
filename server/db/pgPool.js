const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

let pool = null;

function getPgPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  // Neon and cloud PostgreSQL services typically require SSL
  const isSsl = connectionString.includes('sslmode=require') ||
                process.env.NODE_ENV === 'production' ||
                connectionString.includes('neon.tech') ||
                connectionString.includes('render.com');

  pool = new Pool({
    connectionString,
    ssl: isSsl ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err);
  });

  return pool;
}

// Initialize tables on connected PostgreSQL database
async function initPgSchema(targetPool = null) {
  const activePool = targetPool || getPgPool();
  if (!activePool) {
    throw new Error('PostgreSQL pool not available - DATABASE_URL is not set');
  }

  const sqlPath = path.join(__dirname, 'pgSchema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = await activePool.connect();
  try {
    await client.query(sql);
    console.log('✅ PostgreSQL schema successfully verified/initialized');
  } finally {
    client.release();
  }
}

module.exports = {
  getPgPool,
  initPgSchema
};
