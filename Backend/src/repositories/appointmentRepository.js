// src/repositories/appointmentRepository.js
'use strict';

const db = require('../config/database');

const APPT_FIELDS = `
  a.id, a.user_id, a.service_id, a.appointment_type, a.status,
  a.scheduled_at, a.notes, a.is_priority, a.created_at, a.updated_at,
  s.name AS service_name,
  u.name AS user_name, u.email AS user_email, u.phone AS user_phone
`;

const findById = async (id) => {
  const { rows } = await db.query(
    `SELECT ${APPT_FIELDS}
     FROM appointments a
     JOIN services s ON s.id = a.service_id
     JOIN users    u ON u.id = a.user_id
     WHERE a.id = $1`,
    [id]
  );
  return rows[0] || null;
};

const findByUser = async (userId, { status, limit, offset }) => {
  const conditions = ['a.user_id = $1'];
  const values = [userId];
  let idx = 2;

  if (status) {
    conditions.push(`a.status = $${idx++}`);
    values.push(status);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const countResult = await db.query(
    `SELECT COUNT(*) FROM appointments a ${where}`,
    values
  );

  values.push(limit, offset);
  const { rows } = await db.query(
    `SELECT ${APPT_FIELDS}
     FROM appointments a
     JOIN services s ON s.id = a.service_id
     JOIN users    u ON u.id = a.user_id
     ${where}
     ORDER BY a.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    values
  );

  return { rows, total: parseInt(countResult.rows[0].count, 10) };
};

const findAll = async ({ userId, serviceId, status, from, to, limit, offset }) => {
  const conditions = [];
  const values = [];
  let idx = 1;

  if (userId) { conditions.push(`a.user_id = $${idx++}`); values.push(userId); }
  if (serviceId) { conditions.push(`a.service_id = $${idx++}`); values.push(serviceId); }
  if (status) { conditions.push(`a.status = $${idx++}`); values.push(status); }
  if (from) { conditions.push(`a.scheduled_at >= $${idx++}`); values.push(from); }
  if (to) { conditions.push(`a.scheduled_at <= $${idx++}`); values.push(to); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await db.query(
    `SELECT COUNT(*) FROM appointments a ${where}`,
    values
  );

  values.push(limit, offset);
  const { rows } = await db.query(
    `SELECT ${APPT_FIELDS}
     FROM appointments a
     JOIN services s ON s.id = a.service_id
     JOIN users    u ON u.id = a.user_id
     ${where}
     ORDER BY a.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    values
  );

  return { rows, total: parseInt(countResult.rows[0].count, 10) };
};

const create = async (client, { userId, serviceId, type, scheduledAt, notes, isPriority }) => {
  const { rows } = await client.query(
    `INSERT INTO appointments
       (user_id, service_id, appointment_type, status, scheduled_at, notes, is_priority)
     VALUES ($1, $2, $3, 'CONFIRMED', $4, $5, $6)
     RETURNING *`,
    [userId, serviceId, type, scheduledAt || null, notes || null, isPriority || false]
  );
  return rows[0];
};

const update = async (id, fields) => {
  const allowed = ['status', 'scheduled_at', 'notes'];
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
    `UPDATE appointments SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] || null;
};

/**
 * Check for conflicting scheduled appointments (same service, same time slot ±duration).
 */
const checkConflict = async (client, serviceId, scheduledAt, durationMin, excludeId = null) => {
  const halfDuration = durationMin / 2;
  let q = `
    SELECT id FROM appointments
    WHERE service_id = $1
      AND status IN ('CONFIRMED', 'PENDING')
      AND appointment_type = 'SCHEDULED'
      AND ABS(EXTRACT(EPOCH FROM (scheduled_at - $2::timestamptz)) / 60) < $3
  `;
  const params = [serviceId, scheduledAt, halfDuration * 2];

  if (excludeId) {
    q += ` AND id != $4`;
    params.push(excludeId);
  }

  const { rows } = await client.query(q, params);
  return rows.length > 0;
};

module.exports = { findById, findByUser, findAll, create, update, checkConflict };
