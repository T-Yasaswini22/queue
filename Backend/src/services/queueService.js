// src/services/queueService.js
'use strict';

const { withTransaction }     = require('../config/database');
const queueRepository         = require('../repositories/queueRepository');
const serviceRepository       = require('../repositories/serviceRepository');
const staffRepository         = require('../repositories/staffRepository');
const appointmentRepository   = require('../repositories/appointmentRepository');
const ApiError                = require('../utils/ApiError');
const notificationService     = require('./notificationService');

const getQueueForService = async (serviceId, dateStr) => {
  const service = await serviceRepository.findById(serviceId);
  if (!service) throw ApiError.notFound('Service not found.');

  const tokenDate = dateStr || new Date().toISOString().slice(0, 10);
  const tokens    = await queueRepository.getQueue(serviceId, tokenDate);
  const stats     = await queueRepository.getQueueStats(serviceId, tokenDate);
  const settings  = await serviceRepository.getSettings(serviceId);
  const durationMin = settings?.avg_service_duration_min || service.avg_service_duration_min || 15;

  // Compute estimated wait for each waiting token
  const enriched = tokens.map((t, idx) => {
    const waitingAhead = tokens
      .slice(0, idx)
      .filter((x) => x.status === 'WAITING').length;
    return {
      ...t,
      estimated_wait_minutes: waitingAhead * durationMin,
    };
  });

  return { tokens: enriched, stats, tokenDate };
};

const getTokenById = async (tokenId) => {
  const token = await queueRepository.findTokenById(tokenId);
  if (!token) throw ApiError.notFound('Token not found.');
  return token;
};

/**
 * Call the next WAITING token in the queue.
 * Only staff assigned to the service may call.
 */
const callNextToken = async (serviceId, staffId) => {
  const assigned = await staffRepository.isAssigned(staffId, serviceId);
  if (!assigned) throw ApiError.forbidden('You are not assigned to this service.');

  const tokenDate = new Date().toISOString().slice(0, 10);

  return withTransaction(async (client) => {
    const token = await queueRepository.lockNextWaiting(client, serviceId, tokenDate);
    if (!token) throw ApiError.notFound('No waiting tokens in the queue.');

    const updated = await queueRepository.updateTokenStatus(client, token.id, 'CALLED', {
      calledAt: new Date(),
      servedBy: staffId,
    });

    notificationService.sendUpcomingTurn(token.appointment_id, updated).catch(() => {});
    return updated;
  });
};

/**
 * Skip a token — move it back to end of WAITING or mark SKIPPED.
 */
const skipToken = async (tokenId, staffId) => {
  const token = await queueRepository.findTokenById(tokenId);
  if (!token) throw ApiError.notFound('Token not found.');
  if (token.status !== 'CALLED') throw ApiError.badRequest('Only CALLED tokens can be skipped.');

  const assigned = await staffRepository.isAssigned(staffId, token.service_id);
  if (!assigned) throw ApiError.forbidden('You are not assigned to this service.');

  return withTransaction(async (client) => {
    return queueRepository.updateTokenStatus(client, tokenId, 'SKIPPED');
  });
};

/**
 * Mark a CALLED / IN_SERVICE token as COMPLETED.
 */
const completeToken = async (tokenId, staffId) => {
  const token = await queueRepository.findTokenById(tokenId);
  if (!token) throw ApiError.notFound('Token not found.');
  if (!['CALLED', 'IN_SERVICE'].includes(token.status)) {
    throw ApiError.badRequest('Only CALLED or IN_SERVICE tokens can be completed.');
  }

  const assigned = await staffRepository.isAssigned(staffId, token.service_id);
  if (!assigned) throw ApiError.forbidden('You are not assigned to this service.');

  return withTransaction(async (client) => {
    const updated = await queueRepository.updateTokenStatus(client, tokenId, 'COMPLETED', {
      completedAt: new Date(),
      servedBy: staffId,
    });

    // Mark appointment completed
    await appointmentRepository.update(token.appointment_id, { status: 'COMPLETED' });
    return updated;
  });
};

/**
 * Mark a token as IN_SERVICE (optional transition between CALLED → IN_SERVICE).
 */
const startService = async (tokenId, staffId) => {
  const token = await queueRepository.findTokenById(tokenId);
  if (!token) throw ApiError.notFound('Token not found.');
  if (token.status !== 'CALLED') throw ApiError.badRequest('Token must be in CALLED state.');

  const assigned = await staffRepository.isAssigned(staffId, token.service_id);
  if (!assigned) throw ApiError.forbidden('You are not assigned to this service.');

  return withTransaction(async (client) =>
    queueRepository.updateTokenStatus(client, tokenId, 'IN_SERVICE')
  );
};

module.exports = {
  getQueueForService,
  getTokenById,
  callNextToken,
  skipToken,
  completeToken,
  startService,
};
