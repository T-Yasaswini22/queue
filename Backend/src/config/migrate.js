'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
});

const migrationsDirectory = path.resolve(__dirname, '..', '..', '..', 'database', 'migrations');
const migrationLock = 8172609;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [migrationLock]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const files = fs.readdirSync(migrationsDirectory)
      .filter((file) => /^\d+_.+\.sql$/.test(file))
      .sort();
    const { rows: appliedRows } = await client.query(
      'SELECT version, checksum FROM schema_migrations'
    );
    const applied = new Map(appliedRows.map((row) => [row.version, row.checksum]));

    console.log(`Running migrations on database: ${env.DB_NAME}`);
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDirectory, file), 'utf8');
      const checksum = require('crypto').createHash('sha256').update(sql).digest('hex');
      if (applied.has(file)) {
        if (applied.get(file) !== checksum) {
          throw new Error(`Applied migration ${file} has changed; add a new migration instead.`);
        }
        continue;
      }

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)',
          [file, checksum]
        );
        await client.query('COMMIT');
        console.log(`  Applied ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
    console.log('Migrations completed successfully.');
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock($1)', [migrationLock]);
    } finally {
      client.release();
      await pool.end();
    }
  }
}

migrate().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exitCode = 1;
});
