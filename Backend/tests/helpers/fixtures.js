// tests/helpers/fixtures.js
'use strict';

const bcrypt = require('bcryptjs');
const { pool } = require('./testDb');

const createUser = async ({
  name     = 'Test User',
  email    = 'test@example.com',
  password = 'Secret1234',
  role     = 'USER',
  phone    = null,
} = {}) => {
  const passwordHash = await bcrypt.hash(password, 4); // low rounds for speed in tests
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, phone, role, is_active, created_at`,
    [name, email.toLowerCase(), phone, passwordHash, role]
  );
  return rows[0];
};

const createService = async ({
  name                   = 'Test Service',
  description            = 'A test service',
  avgServiceDurationMin  = 10,
  maxCapacity            = 50,
  isActive               = true,
} = {}) => {
  const { rows } = await pool.query(
    `INSERT INTO services (name, description, avg_service_duration_min, max_capacity, is_active)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, description, avgServiceDurationMin, maxCapacity, isActive]
  );
  // Create default queue settings
  await pool.query(
    `INSERT INTO queue_settings (service_id, avg_service_duration_min, max_tokens_per_day)
     VALUES ($1, $2, 200)
     ON CONFLICT DO NOTHING`,
    [rows[0].id, avgServiceDurationMin]
  );
  return rows[0];
};

const loginAndGetToken = async (request, app, email, password = 'Secret1234') => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.data?.token;
};

module.exports = { createUser, createService, loginAndGetToken };
