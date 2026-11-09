// src/config/database.js
'use strict';

const { Pool } = require('pg');
const env = require('./env');
const logger = require('../utils/logger');

const poolConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

if (env.DB_SSL) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  logger.debug(`Connected to PostgreSQL database: ${env.DB_NAME}`);
});

pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL pool error:', err);
});

/**
 * Execute a query using the pool.
 * @param {string} text - SQL query string with $1, $2, ... placeholders
 * @param {Array}  params - Query parameters
 * @returns {Promise<pg.QueryResult>}
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Query executed', { text, duration, rows: result.rowCount });
    return result;
  } catch (err) {
    logger.error('Query error', { text, params, error: err.message });
    throw err;
  }
};

/**
 * Get a pooled client for transactions.
 * Always call client.release() in a finally block.
 */
const getClient = () => pool.connect();

/**
 * Run a callback inside a serializable transaction.
 * Automatically commits or rolls back.
 */
const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Test the database connection.
 */
const testConnection = async () => {
  const result = await query('SELECT NOW() AS now');
  return result.rows[0].now;
};

module.exports = { query, getClient, withTransaction, testConnection, pool };
