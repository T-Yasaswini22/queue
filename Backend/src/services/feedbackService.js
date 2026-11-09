// src/services/feedbackService.js
'use strict';

const feedbackRepository    = require('../repositories/feedbackRepository');
const appointmentRepository = require('../repositories/appointmentRepository');
const ApiError = require('../utils/ApiError');
const { parsePagination, buildMeta } = require('../utils/pagination');

const submitFeedback = async (userId, data) => {
  const { appointmentId, serviceId, rating, comment } = data;

  // Validate appointment ownership if provided
  if (appointmentId) {
    const appointment = await appointmentRepository.findById(appointmentId);
    if (!appointment) throw ApiError.notFound('Appointment not found.');
    if (appointment.user_id !== userId) throw ApiError.forbidden();
    if (appointment.status !== 'COMPLETED') {
      throw ApiError.badRequest('Feedback can only be submitted for completed appointments.');
    }
  }

  return feedbackRepository.create({ userId, appointmentId, serviceId, rating, comment });
};

const getMyFeedback = async (userId, query) => {
  const { page, limit, offset } = parsePagination(query);
  const { rows, total } = await feedbackRepository.findByUser(userId, { limit, offset });
  return { feedback: rows, meta: buildMeta(total, page, limit) };
};

const getAllFeedback = async (query) => {
  const { page, limit, offset } = parsePagination(query);
  const { rows, total } = await feedbackRepository.findAll({
    serviceId: query.serviceId,
    rating:    query.rating ? parseInt(query.rating, 10) : undefined,
    limit,
    offset,
  });
  return { feedback: rows, meta: buildMeta(total, page, limit) };
};

const getServiceRatings = async (serviceId) =>
  feedbackRepository.getServiceRatingSummary(serviceId);

module.exports = { submitFeedback, getMyFeedback, getAllFeedback, getServiceRatings };
