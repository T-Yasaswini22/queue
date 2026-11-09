// src/services/adminService.js
'use strict';

const { query }          = require('../config/database');
const userRepository     = require('../repositories/userRepository');
const ApiError           = require('../utils/ApiError');
const { parsePagination, buildMeta } = require('../utils/pagination');

const listUsers = async (queryParams) => {
  const { page, limit, offset } = parsePagination(queryParams);
  const isActive =
    queryParams.active !== undefined ? queryParams.active === 'true' : undefined;

  const { rows, total } = await userRepository.list({
    search:   queryParams.search,
    role:     queryParams.role,
    isActive,
    limit,
    offset,
  });
  return { users: rows, meta: buildMeta(total, page, limit) };
};

const getUserById = async (id) => {
  const user = await userRepository.findById(id);
  if (!user) throw ApiError.notFound('User not found.');
  return user;
};

const updateUser = async (id, data) => {
  const user = await userRepository.findById(id);
  if (!user) throw ApiError.notFound('User not found.');
  return userRepository.update(id, data);
};

const deactivateUser = async (id) => {
  const user = await userRepository.findById(id);
  if (!user) throw ApiError.notFound('User not found.');
  return userRepository.update(id, { is_active: false });
};

const getDashboardStats = async () => {
  const today = new Date().toISOString().slice(0, 10);

  const [users, services, appointments, queueToday] = await Promise.all([
    query(`SELECT
             COUNT(*)                              AS total_users,
             COUNT(*) FILTER (WHERE role='USER')  AS users_count,
             COUNT(*) FILTER (WHERE role='STAFF') AS staff_count,
             COUNT(*) FILTER (WHERE role='ADMIN') AS admin_count,
             COUNT(*) FILTER (WHERE is_active)    AS active_users
           FROM users`),

    query(`SELECT
             COUNT(*)                             AS total_services,
             COUNT(*) FILTER (WHERE is_active)    AS active_services
           FROM services`),

    query(`SELECT
             COUNT(*)                                        AS total_appointments,
             COUNT(*) FILTER (WHERE status='CONFIRMED')     AS confirmed,
             COUNT(*) FILTER (WHERE status='COMPLETED')     AS completed,
             COUNT(*) FILTER (WHERE status='CANCELLED')     AS cancelled,
             COUNT(*) FILTER (WHERE DATE(created_at)=$1)    AS today_bookings
           FROM appointments`, [today]),

    query(`SELECT
             COUNT(*) FILTER (WHERE status='WAITING')    AS waiting,
             COUNT(*) FILTER (WHERE status='CALLED')     AS called,
             COUNT(*) FILTER (WHERE status='IN_SERVICE') AS in_service,
             COUNT(*) FILTER (WHERE status='COMPLETED')  AS completed,
             COUNT(*)                                    AS total
           FROM queue_tokens
           WHERE token_date = $1`, [today]),
  ]);

  return {
    users:        users.rows[0],
    services:     services.rows[0],
    appointments: appointments.rows[0],
    queueToday:   queueToday.rows[0],
  };
};

const getReports = async ({ from, to, serviceId }) => {
  const params = [];
  const conditions = [];
  let idx = 1;

  if (from)      { conditions.push(`DATE(a.created_at) >= $${idx++}`); params.push(from); }
  if (to)        { conditions.push(`DATE(a.created_at) <= $${idx++}`); params.push(to); }
  if (serviceId) { conditions.push(`a.service_id = $${idx++}`); params.push(serviceId); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await query(
    `SELECT
       s.name                                            AS service_name,
       COUNT(a.id)                                       AS total_appointments,
       COUNT(a.id) FILTER (WHERE a.status='COMPLETED')  AS completed,
       COUNT(a.id) FILTER (WHERE a.status='CANCELLED')  AS cancelled,
       COUNT(a.id) FILTER (WHERE a.status='NO_SHOW')    AS no_show,
       ROUND(AVG(f.rating), 2)                          AS avg_rating
     FROM appointments a
     JOIN services s ON s.id = a.service_id
     LEFT JOIN feedback f ON f.appointment_id = a.id
     ${where}
     GROUP BY s.id, s.name
     ORDER BY total_appointments DESC`,
    params
  );
  return rows;
};

module.exports = { listUsers, getUserById, updateUser, deactivateUser, getDashboardStats, getReports };
