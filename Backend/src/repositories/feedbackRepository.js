// src/repositories/feedbackRepository.js
'use strict';

const db = require('../config/database');

const FIELDS = `
  f.id, f.user_id, f.appointment_id, f.service_id, f.rating, f.comment, f.created_at,
  u.name AS user_name, s.name AS service_name
`;

const create = async ({ userId, appointmentId, serviceId, rating, comment }) => {
  const { rows } = await db.query(
    `INSERT INTO feedback (user_id, appointment_id, service_id, rating, comment)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, appointmentId || null, serviceId || null, rating, comment || null]
  );
  return rows[0];
};

const findByUser = async (userId, { limit, offset }) => {
  const countResult = await db.query(
    'SELECT COUNT(*) FROM feedback WHERE user_id = $1',
    [userId]
  );
  const { rows } = await db.query(
    `SELECT ${FIELDS}
     FROM feedback f
     JOIN users    u ON u.id = f.user_id
     LEFT JOIN services s ON s.id = f.service_id
     WHERE f.user_id = $1
     ORDER BY f.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return { rows, total: parseInt(countResult.rows[0].count, 10) };
};

const findAll = async ({ serviceId, rating, limit, offset }) => {
  const conditions = [];
  const values = [];
  let idx = 1;

  if (serviceId) { conditions.push(`f.service_id = $${idx++}`); values.push(serviceId); }
  if (rating)    { conditions.push(`f.rating = $${idx++}`); values.push(rating); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await db.query(
    `SELECT COUNT(*) FROM feedback f ${where}`,
    values
  );

  values.push(limit, offset);
  const { rows } = await db.query(
    `SELECT ${FIELDS}
     FROM feedback f
     JOIN users    u ON u.id = f.user_id
     LEFT JOIN services s ON s.id = f.service_id
     ${where}
     ORDER BY f.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    values
  );

  return { rows, total: parseInt(countResult.rows[0].count, 10) };
};

const getServiceRatingSummary = async (serviceId) => {
  const { rows } = await db.query(
    `SELECT
       ROUND(AVG(rating), 2) AS avg_rating,
       COUNT(*) AS total_reviews,
       COUNT(*) FILTER (WHERE rating = 5) AS five_star,
       COUNT(*) FILTER (WHERE rating = 4) AS four_star,
       COUNT(*) FILTER (WHERE rating = 3) AS three_star,
       COUNT(*) FILTER (WHERE rating = 2) AS two_star,
       COUNT(*) FILTER (WHERE rating = 1) AS one_star
     FROM feedback
     WHERE service_id = $1`,
    [serviceId]
  );
  return rows[0];
};

module.exports = { create, findByUser, findAll, getServiceRatingSummary };
