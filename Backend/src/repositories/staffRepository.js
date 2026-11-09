// src/repositories/staffRepository.js
'use strict';

const db = require('../config/database');

const getAssignedServices = async (staffId) => {
  const { rows } = await db.query(
    `SELECT s.*, sa.id AS assignment_id
     FROM staff_assignments sa
     JOIN services s ON s.id = sa.service_id
     WHERE sa.staff_id = $1
     ORDER BY s.name`,
    [staffId]
  );
  return rows;
};

const isAssigned = async (staffId, serviceId) => {
  const { rows } = await db.query(
    'SELECT id FROM staff_assignments WHERE staff_id = $1 AND service_id = $2',
    [staffId, serviceId]
  );
  return rows.length > 0;
};

const assign = async (staffId, serviceId) => {
  const { rows } = await db.query(
    `INSERT INTO staff_assignments (staff_id, service_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [staffId, serviceId]
  );
  return rows[0];
};

const unassign = async (staffId, serviceId) => {
  const { rows } = await db.query(
    'DELETE FROM staff_assignments WHERE staff_id = $1 AND service_id = $2 RETURNING *',
    [staffId, serviceId]
  );
  return rows[0] || null;
};

const listAssignments = async (serviceId) => {
  const { rows } = await db.query(
    `SELECT u.id, u.name, u.email, u.phone, u.role, sa.id AS assignment_id
     FROM staff_assignments sa
     JOIN users u ON u.id = sa.staff_id
     WHERE sa.service_id = $1
     ORDER BY u.name`,
    [serviceId]
  );
  return rows;
};

// ─── Schedules ───────────────────────────────────────────────────────────────

const getSchedules = async (staffId) => {
  const { rows } = await db.query(
    `SELECT ss.*, s.name AS service_name
     FROM staff_schedules ss
     JOIN services s ON s.id = ss.service_id
     WHERE ss.staff_id = $1
     ORDER BY ss.day_of_week, ss.start_time`,
    [staffId]
  );
  return rows;
};

const createSchedule = async ({ staffId, serviceId, dayOfWeek, startTime, endTime }) => {
  const { rows } = await db.query(
    `INSERT INTO staff_schedules (staff_id, service_id, day_of_week, start_time, end_time)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [staffId, serviceId, dayOfWeek, startTime, endTime]
  );
  return rows[0];
};

const deleteSchedule = async (id, staffId) => {
  const { rows } = await db.query(
    'DELETE FROM staff_schedules WHERE id = $1 AND staff_id = $2 RETURNING *',
    [id, staffId]
  );
  return rows[0] || null;
};

module.exports = {
  getAssignedServices,
  isAssigned,
  assign,
  unassign,
  listAssignments,
  getSchedules,
  createSchedule,
  deleteSchedule,
};
