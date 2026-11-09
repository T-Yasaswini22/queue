// src/services/appointmentService.js
'use strict';

const { withTransaction } = require('../config/database');
const appointmentRepository = require('../repositories/appointmentRepository');
const queueRepository       = require('../repositories/queueRepository');
const serviceRepository     = require('../repositories/serviceRepository');
const ApiError              = require('../utils/ApiError');
const { parsePagination, buildMeta } = require('../utils/pagination');
const notificationService   = require('./notificationService');

/**
 * Book a new appointment and issue a queue token atomically.
 */
const createAppointment = async (userId, data) => {
  const { serviceId, type = 'SCHEDULED', scheduledAt, notes, isPriority = false } = data;

  const service = await serviceRepository.findById(serviceId);
  if (!service) throw ApiError.notFound('Service not found.');
  if (!service.is_active) throw ApiError.badRequest('Service is currently inactive.');

  const settings = await serviceRepository.getSettings(serviceId);
  const durationMin = settings?.avg_service_duration_min || service.avg_service_duration_min || 15;

  const tokenDate = scheduledAt
    ? new Date(scheduledAt).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const result = await withTransaction(async (client) => {
    // Check double-booking for scheduled appointments
    if (type === 'SCHEDULED' && scheduledAt) {
      const conflict = await appointmentRepository.checkConflict(
        client, serviceId, scheduledAt, durationMin
      );
      if (conflict) throw ApiError.conflict('This time slot is already booked.');
    }

    // Check daily token cap
    if (settings) {
      const stats = await queueRepository.getQueueStats(serviceId, tokenDate);
      if (parseInt(stats.total, 10) >= settings.max_tokens_per_day) {
        throw ApiError.conflict('Daily capacity reached for this service.');
      }
    }

    // Check priority cap
    if (isPriority && settings?.allow_priority) {
      const priorityCount = await queueRepository.countPriorityToday(
        client, serviceId, tokenDate
      );
      if (priorityCount >= (settings.max_priority_per_day || 5)) {
        throw ApiError.conflict('Maximum priority slots for today have been reached.');
      }
    }

    const appointment = await appointmentRepository.create(client, {
      userId,
      serviceId,
      type,
      scheduledAt: scheduledAt || null,
      notes,
      isPriority,
    });

    const tokenNumber = await queueRepository.nextTokenNumber(client, serviceId, tokenDate);
    const token = await queueRepository.createToken(client, {
      appointmentId: appointment.id,
      serviceId,
      tokenNumber,
      tokenDate,
      isPriority,
    });

    return { appointment, token };
  });

  // Send confirmation (non-blocking)
  notificationService
    .sendBookingConfirmation(userId, result.appointment, result.token)
    .catch(() => {});

  return result;
};

const getMyAppointments = async (userId, query) => {
  const { page, limit, offset } = parsePagination(query);
  const { rows, total } = await appointmentRepository.findByUser(userId, {
    status: query.status,
    limit,
    offset,
  });
  return { appointments: rows, meta: buildMeta(total, page, limit) };
};

const getAppointmentById = async (id, requestingUser) => {
  const appointment = await appointmentRepository.findById(id);
  if (!appointment) throw ApiError.notFound('Appointment not found.');

  // Ownership check — staff and admin can view any
  if (
    requestingUser.role === 'USER' &&
    appointment.user_id !== requestingUser.id
  ) {
    throw ApiError.forbidden();
  }
  return appointment;
};

const rescheduleAppointment = async (id, userId, { scheduledAt }) => {
  const appointment = await appointmentRepository.findById(id);
  if (!appointment) throw ApiError.notFound('Appointment not found.');
  if (appointment.user_id !== userId) throw ApiError.forbidden();

  if (!['CONFIRMED', 'PENDING'].includes(appointment.status)) {
    throw ApiError.badRequest('Only confirmed or pending appointments can be rescheduled.');
  }
  if (appointment.appointment_type === 'WALK_IN') {
    throw ApiError.badRequest('Walk-in appointments cannot be rescheduled.');
  }

  const service  = await serviceRepository.findById(appointment.service_id);
  const settings = await serviceRepository.getSettings(appointment.service_id);
  const duration = settings?.avg_service_duration_min || service.avg_service_duration_min || 15;

  const updated = await withTransaction(async (client) => {
    const conflict = await appointmentRepository.checkConflict(
      client, appointment.service_id, scheduledAt, duration, id
    );
    if (conflict) throw ApiError.conflict('This time slot is already booked.');

    return appointmentRepository.update(id, { status: 'RESCHEDULED', scheduled_at: scheduledAt });
  });

  notificationService.sendRescheduled(userId, updated).catch(() => {});
  return updated;
};

const cancelAppointment = async (id, requestingUser) => {
  const appointment = await appointmentRepository.findById(id);
  if (!appointment) throw ApiError.notFound('Appointment not found.');

  const isOwner = appointment.user_id === requestingUser.id;
  const isAdmin  = requestingUser.role === 'ADMIN';

  if (!isOwner && !isAdmin) throw ApiError.forbidden();
  if (appointment.status === 'CANCELLED') throw ApiError.badRequest('Already cancelled.');
  if (appointment.status === 'COMPLETED') throw ApiError.badRequest('Cannot cancel a completed appointment.');

  await withTransaction(async (client) => {
    await appointmentRepository.update(id, { status: 'CANCELLED' });

    // Cancel associated queue token
    const token = await queueRepository.findTokenByAppointment(id);
    if (token && ['WAITING', 'CALLED', 'SKIPPED'].includes(token.status)) {
      await queueRepository.updateTokenStatus(client, token.id, 'CANCELLED');
    }
  });

  const updated = await appointmentRepository.findById(id);
  notificationService.sendCancellation(requestingUser.id, updated).catch(() => {});
  return updated;
};

const getAllAppointments = async (query) => {
  const { page, limit, offset } = parsePagination(query);
  const { rows, total } = await appointmentRepository.findAll({
    userId:    query.userId,
    serviceId: query.serviceId,
    status:    query.status,
    from:      query.from,
    to:        query.to,
    limit,
    offset,
  });
  return { appointments: rows, meta: buildMeta(total, page, limit) };
};

module.exports = {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  rescheduleAppointment,
  cancelAppointment,
  getAllAppointments,
};
