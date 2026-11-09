// src/repositories/userRepository.js
'use strict';

const db = require('../config/database');

const SAFE_FIELDS = `
  id, name, email, phone, role, is_active, created_at, updated_at
`;

const findById = async (id) => {
  const { rows } = await db.query(
    `SELECT ${SAFE_FIELDS} FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
};

const findByEmail = async (email) => {
  const { rows } = await db.query(
    `SELECT id, name, email, phone, password_hash, role, is_active, created_at, updated_at
       FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );
  return rows[0] || null;
};

const create = async ({ name, email, phone, passwordHash, role = 'USER' }) => {
  const { rows } = await db.query(
    `INSERT INTO users (name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${SAFE_FIELDS}`,
    [name, email.toLowerCase(), phone || null, passwordHash, role]
  );
  return rows[0];
};

const update = async (id, fields) => {
  const allowed = ['name', 'phone', 'role', 'is_active'];
  const setClauses = [];
  const values = [];
  let idx = 1;

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      setClauses.push(`${key} = $${idx++}`);
      values.push(fields[key]);
    }
  }
  if (setClauses.length === 0) return findById(id);

  values.push(id);
  const { rows } = await db.query(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${idx}
     RETURNING ${SAFE_FIELDS}`,
    values
  );
  return rows[0] || null;
};

const updatePassword = async (id, passwordHash) => {
  await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
    passwordHash,
    id,
  ]);
};

const list = async ({ search, role, isActive, limit, offset }) => {
  const conditions = [];
  const values = [];
  let idx = 1;

  if (search) {
    conditions.push(
      `(name ILIKE $${idx} OR email ILIKE $${idx})`
    );
    values.push(`%${search}%`);
    idx++;
  }
  if (role) {
    conditions.push(`role = $${idx++}`);
    values.push(role);
  }
  if (isActive !== undefined) {
    conditions.push(`is_active = $${idx++}`);
    values.push(isActive);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query(
    `SELECT COUNT(*) FROM users ${where}`,
    values
  );

  values.push(limit, offset);
  const { rows } = await db.query(
    `SELECT ${SAFE_FIELDS} FROM users ${where}
     ORDER BY created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    values
  );

  return { rows, total: parseInt(countResult.rows[0].count, 10) };
};

const remove = async (id) => {
  await db.query('DELETE FROM users WHERE id = $1', [id]);
};

module.exports = { findById, findByEmail, create, update, updatePassword, list, remove };
