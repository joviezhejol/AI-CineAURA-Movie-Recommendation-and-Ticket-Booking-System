/**
 * Unified Async Database Layer for AI CineAura
 * 
 * Supports both PostgreSQL (primary when DATABASE_URL is set)
 * and SQLite (fallback when DATABASE_URL is not provided or in local offline mode).
 * All queries across the app use standard async/await signatures:
 *   - db.query(sql, params) -> { rows, rowCount }
 *   - db.getOne(sql, params) -> first row or null
 *   - db.getAll(sql, params) -> array of rows
 *   - db.execute(sql, params) -> { changes, rowCount }
 *   - db.withTransaction(callback) -> atomic transaction runner
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const { getPgPool, initPgSchema } = require('./pgPool');

let sqliteDb = null;
let pgPoolInstance = null;
let isPostgres = false;

// Convert $1, $2 placeholders to ? for SQLite compatibility
function convertToSqliteParams(sql, params) {
  let paramIndex = 1;
  const convertedSql = sql.replace(/\$\d+/g, () => '?');
  return { sql: convertedSql, params: params || [] };
}

function initSqliteFallback() {
  const Database = require('better-sqlite3');
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'cineaura.db');
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');
}

// Check database mode
const databaseUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.trim();

if (databaseUrl) {
  try {
    pgPoolInstance = getPgPool();
    isPostgres = true;
    console.log('🐘 Initialized PostgreSQL mode using DATABASE_URL');
  } catch (err) {
    console.error('Failed to initialize PostgreSQL pool, falling back to local SQLite:', err.message);
    initSqliteFallback();
    isPostgres = false;
  }
} else {
  console.log('📁 DATABASE_URL not detected. Running on local SQLite database (server/data/cineaura.db)');
  initSqliteFallback();
  isPostgres = false;
}

const db = {
  isPostgres: () => isPostgres,
  getRawSqlite: () => sqliteDb,
  getRawPgPool: () => pgPoolInstance,

  async query(sql, params = []) {
    if (isPostgres && pgPoolInstance) {
      const res = await pgPoolInstance.query(sql, params);
      return res;
    } else {
      const { sql: sqliteSql, params: sqliteParams } = convertToSqliteParams(sql, params);
      const isSelect = /^\s*SELECT/i.test(sqliteSql);
      if (isSelect) {
        const rows = sqliteDb.prepare(sqliteSql).all(...sqliteParams);
        return { rows, rowCount: rows.length };
      } else {
        const info = sqliteDb.prepare(sqliteSql).run(...sqliteParams);
        return { rows: [], rowCount: info.changes };
      }
    }
  },

  async getOne(sql, params = []) {
    if (isPostgres && pgPoolInstance) {
      const res = await pgPoolInstance.query(sql, params);
      return res.rows[0] || null;
    } else {
      const { sql: sqliteSql, params: sqliteParams } = convertToSqliteParams(sql, params);
      const row = sqliteDb.prepare(sqliteSql).get(...sqliteParams);
      return row || null;
    }
  },

  async getAll(sql, params = []) {
    if (isPostgres && pgPoolInstance) {
      const res = await pgPoolInstance.query(sql, params);
      return res.rows;
    } else {
      const { sql: sqliteSql, params: sqliteParams } = convertToSqliteParams(sql, params);
      return sqliteDb.prepare(sqliteSql).all(...sqliteParams);
    }
  },

  async execute(sql, params = []) {
    if (isPostgres && pgPoolInstance) {
      const res = await pgPoolInstance.query(sql, params);
      return { rowCount: res.rowCount };
    } else {
      const { sql: sqliteSql, params: sqliteParams } = convertToSqliteParams(sql, params);
      const info = sqliteDb.prepare(sqliteSql).run(...sqliteParams);
      return { rowCount: info.changes };
    }
  },

  // Atomic transaction runner supporting both engines
  async withTransaction(callback) {
    if (isPostgres && pgPoolInstance) {
      const client = await pgPoolInstance.connect();
      try {
        await client.query('BEGIN');
        const txHelper = {
          query: (sql, params = []) => client.query(sql, params),
          getOne: async (sql, params = []) => {
            const res = await client.query(sql, params);
            return res.rows[0] || null;
          },
          getAll: async (sql, params = []) => {
            const res = await client.query(sql, params);
            return res.rows;
          },
          execute: async (sql, params = []) => {
            const res = await client.query(sql, params);
            return { rowCount: res.rowCount };
          }
        };
        const result = await callback(txHelper);
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } else {
      // SQLite Transaction: execute manually with BEGIN / COMMIT to support async callbacks seamlessly
      sqliteDb.exec('BEGIN IMMEDIATE');
      try {
        const txHelper = {
          query: async (sql, params = []) => {
            const { sql: sqliteSql, params: sqliteParams } = convertToSqliteParams(sql, params);
            const isSelect = /^\s*SELECT/i.test(sqliteSql);
            if (isSelect) {
              const rows = sqliteDb.prepare(sqliteSql).all(...sqliteParams);
              return { rows, rowCount: rows.length };
            } else {
              const info = sqliteDb.prepare(sqliteSql).run(...sqliteParams);
              return { rows: [], rowCount: info.changes };
            }
          },
          getOne: async (sql, params = []) => {
            const { sql: sqliteSql, params: sqliteParams } = convertToSqliteParams(sql, params);
            return sqliteDb.prepare(sqliteSql).get(...sqliteParams) || null;
          },
          getAll: async (sql, params = []) => {
            const { sql: sqliteSql, params: sqliteParams } = convertToSqliteParams(sql, params);
            return sqliteDb.prepare(sqliteSql).all(...sqliteParams);
          },
          execute: async (sql, params = []) => {
            const { sql: sqliteSql, params: sqliteParams } = convertToSqliteParams(sql, params);
            const info = sqliteDb.prepare(sqliteSql).run(...sqliteParams);
            return { rowCount: info.changes };
          }
        };
        const result = await callback(txHelper);
        sqliteDb.exec('COMMIT');
        return result;
      } catch (err) {
        sqliteDb.exec('ROLLBACK');
        throw err;
      }
    }
  }
};

module.exports = db;
