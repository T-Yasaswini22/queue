// src/repositories/serviceRepository.js
'use strict';

const db = require('../config/database');

const findById = async (id) => {
  const { rows } = await db.query('SELECT * FROM services WHERE id = $1', [id]);
  return rows[0] || null;
};

const findAll = async ({ search, isActive, limit, offset }) => {
  const conditions = [];
  const values = [];
  let idx = 1;

  if (search) {
    conditions.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`);
    values.push(`%${search}%`);
    idx++;
  }
  if (isActive !== undefined) {
    conditions.push(`is_active = $${idx++}`);
    values.push(isActive);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await db.query(`SELECT COUNT(*) FROM services ${where}`, values);

  values.push(limit, offset);
  const { rows } = await db.query(
    `SELECT * FROM services ${where}
     ORDER BY name ASC
     LIMIT $${idx++} OFFSET $${idx}`,
    values
  );

  return { rows, total: parseInt(countResult.rows[0].count, 10) };
};

const create = async ({ name, description, location, avgServiceDurationMin, maxCapacity }) => {
  const { rows } = await db.query(
    `INSERT INTO services (name, description, location, avg_service_duration_min, max_capacity)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, description || null, location || null, avgServiceDurationMin || 15, maxCapacity || 100]
  );
  return rows[0];
};

const update = async (id, fields) => {
  const allowed = ['name', 'description', 'location', 'avg_service_duration_min', 'max_capacity', 'is_active'];
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
    `UPDATE services SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] || null;
};

const getSettings = async (serviceId) => {
  const { rows } = await db.query(
    'SELECT * FROM queue_settings WHERE service_id = $1',
    [serviceId]
  );
  return rows[0] || null;
};

const upsertSettings = async (serviceId, settings) => {
  const {
    maxTokensPerDay = 200,
    avgServiceDurationMin = 15,
    allowPriority = true,
    maxPriorityPerDay = 5,
    autoCallNext = false,
  } = settings;

  const { rows } = await db.query(
    `INSERT INTO queue_settings
       (service_id, max_tokens_per_day, avg_service_duration_min, allow_priority, max_priority_per_day, auto_call_next)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (service_id) DO UPDATE SET
       max_tokens_per_day       = EXCLUDED.max_tokens_per_day,
       avg_service_duration_min = EXCLUDED.avg_service_duration_min,
       allow_priority           = EXCLUDED.allow_priority,
       max_priority_per_day     = EXCLUDED.max_priority_per_day,
       auto_call_next           = EXCLUDED.auto_call_next,
       updated_at               = NOW()
     RETURNING *`,
    [serviceId, maxTokensPerDay, avgServiceDurationMin, allowPriority, maxPriorityPerDay, autoCallNext]
  );
  return rows[0];
};

module.exports = { findById, findAll, create, update, getSettings, upsertSettings };
