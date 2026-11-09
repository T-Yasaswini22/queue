// tests/helpers/testDb.js
'use strict';

require('dotenv').config();
process.env.NODE_ENV = 'test';

const { Pool } = require('pg');
const env = require('../../src/config/env');

const pool = new Pool({
  host:     env.DB_HOST,
  port:     env.DB_PORT,
  database: env.DB_NAME, // uses TEST_DB_NAME via env.js
  user:     env.DB_USER,
  password: env.DB_PASSWORD,
});

const cleanTables = async () => {
  await pool.query(`
    TRUNCATE TABLE
      notifications, feedback, queue_tokens, queue_settings,
      appointments, staff_schedules, staff_assignments, services, users
    RESTART IDENTITY CASCADE
  `);
};

const closePool = async () => pool.end();

module.exports = { pool, cleanTables, closePool };
