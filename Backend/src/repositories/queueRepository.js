// src/repositories/queueRepository.js
'use strict';

const db = require('../config/database');

const TOKEN_FIELDS = `
  qt.id, qt.appointment_id, qt.service_id, qt.token_number, qt.token_date,
  qt.status, qt.is_priority, qt.called_at, qt.completed_at, qt.served_by,
  qt.position, qt.created_at, qt.updated_at,
  s.name AS service_name,
  u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
  a.appointment_type, a.notes
`;

const findTokenById = async (id) => {
  const { rows } = await db.query(
    `SELECT ${TOKEN_FIELDS}
     FROM queue_tokens qt
     JOIN services     s ON s.id = qt.service_id
     JOIN appointments a ON a.id = qt.appointment_id
     JOIN users        u ON u.id = a.user_id
     WHERE qt.id = $1`,
    [id]
  );
  return rows[0] || null;
};

const findTokenByAppointment = async (appointmentId) => {
  const { rows } = await db.query(
    `SELECT * FROM queue_tokens
     WHERE appointment_id = $1
     ORDER BY (status IN ('WAITING', 'CALLED', 'SKIPPED', 'IN_SERVICE')) DESC,
              created_at DESC
     LIMIT 1`,
    [appointmentId]
  );
  return rows[0] || null;
};

/**
 * Generate the next sequential token number for a service on a given date.
 * Uses SELECT FOR UPDATE to prevent races.
 */
const nextTokenNumber = async (client, serviceId, tokenDate) => {
  const { rows } = await client.query(
    `INSERT INTO queue_token_counters (service_id, token_date, last_token_number)
     VALUES ($1, $2, 1)
     ON CONFLICT (service_id, token_date) DO UPDATE
       SET last_token_number = queue_token_counters.last_token_number + 1
     RETURNING last_token_number AS next`,
    [serviceId, tokenDate]
  );
  return rows[0].next;
};

const createToken = async (client, { appointmentId, serviceId, tokenNumber, tokenDate, isPriority }) => {
  const { rows: [counter] } = await client.query(
    `UPDATE queue_token_counters
     SET last_position = last_position + 1
     WHERE service_id = $1 AND token_date = $2
     RETURNING last_position`,
    [serviceId, tokenDate]
  );
  if (!counter) throw new Error('Queue counter was not allocated before token creation.');
  const position = counter.last_position;

  const { rows } = await client.query(
    `INSERT INTO queue_tokens
       (appointment_id, service_id, token_number, token_date, status, is_priority, position)
     VALUES ($1, $2, $3, $4, 'WAITING', $5, $6)
     RETURNING *`,
    [appointmentId, serviceId, tokenNumber, tokenDate, isPriority || false, position]
  );
  return rows[0];
};

/**
 * Get the queue for a service on a date, ordered by priority + position.
 */
const getQueue = async (serviceId, tokenDate) => {
  const { rows } = await db.query(
    `SELECT ${TOKEN_FIELDS}
     FROM queue_tokens qt
     JOIN services     s ON s.id = qt.service_id
     JOIN appointments a ON a.id = qt.appointment_id
     JOIN users        u ON u.id = a.user_id
     WHERE qt.service_id = $1
       AND qt.token_date  = $2
       AND qt.status NOT IN ('COMPLETED', 'CANCELLED')
     ORDER BY qt.is_priority DESC, qt.position ASC`,
    [serviceId, tokenDate]
  );
  return rows;
};

/**
 * Get the next WAITING token atomically (FOR UPDATE SKIP LOCKED).
 */
const lockNextWaiting = async (client, serviceId, tokenDate) => {
  const { rows } = await client.query(
    `SELECT qt.*
     FROM queue_tokens qt
     WHERE qt.service_id = $1
       AND qt.token_date  = $2
       AND qt.status = 'WAITING'
     ORDER BY qt.is_priority DESC, qt.position ASC
     LIMIT 1
     FOR UPDATE SKIP LOCKED`,
    [serviceId, tokenDate]
  );
  return rows[0] || null;
};

const updateTokenStatus = async (client, id, status, extra = {}) => {
  const setClauses = ['status = $1', 'updated_at = NOW()'];
  const values = [status];
  let idx = 2;

  if (extra.calledAt !== undefined) { setClauses.push(`called_at = $${idx++}`); values.push(extra.calledAt); }
  if (extra.completedAt !== undefined) { setClauses.push(`completed_at = $${idx++}`); values.push(extra.completedAt); }
  if (extra.servedBy !== undefined) { setClauses.push(`served_by = $${idx++}`); values.push(extra.servedBy); }

  values.push(id);
  const { rows } = await client.query(
    `UPDATE queue_tokens SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] || null;
};

const getQueueStats = async (serviceId, tokenDate) => {
  const { rows } = await db.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'WAITING')     AS waiting,
       COUNT(*) FILTER (WHERE status = 'CALLED')      AS called,
       COUNT(*) FILTER (WHERE status = 'IN_SERVICE')  AS in_service,
       COUNT(*) FILTER (WHERE status = 'COMPLETED')   AS completed,
       COUNT(*) FILTER (WHERE status = 'CANCELLED')   AS cancelled,
       COUNT(*) FILTER (WHERE status = 'SKIPPED')     AS skipped,
       COUNT(*)                                       AS total
     FROM queue_tokens
     WHERE service_id = $1 AND token_date = $2`,
    [serviceId, tokenDate]
  );
  return rows[0];
};

const countPriorityToday = async (client, serviceId, tokenDate) => {
  const { rows } = await client.query(
    `SELECT COUNT(*) FROM queue_tokens
     WHERE service_id = $1 AND token_date = $2 AND is_priority = TRUE`,
    [serviceId, tokenDate]
  );
  return parseInt(rows[0].count, 10);
};

module.exports = {
  findTokenById,
  findTokenByAppointment,
  nextTokenNumber,
  createToken,
  getQueue,
  lockNextWaiting,
  updateTokenStatus,
  getQueueStats,
  countPriorityToday,
};
