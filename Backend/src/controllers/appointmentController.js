// src/controllers/appointmentController.js
'use strict';

const appointmentService = require('../services/appointmentService');
const ApiResponse        = require('../utils/ApiResponse');
const asyncHandler       = require('../utils/asyncHandler');

const createAppointment = asyncHandler(async (req, res) => {
  const { serviceId, type, scheduledAt, notes, isPriority } = req.body;
  const result = await appointmentService.createAppointment(req.user.id, {
    serviceId, type, scheduledAt, notes, isPriority,
  });
  ApiResponse.created(res, 'Appointment booked successfully.', result);
});

const getMyAppointments = asyncHandler(async (req, res) => {
  const result = await appointmentService.getMyAppointments(req.user.id, req.query);
  ApiResponse.ok(res, 'Appointments retrieved.', result.appointments, result.meta);
});

const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.getAppointmentById(
    req.params.id,
    req.user
  );
  ApiResponse.ok(res, 'Appointment retrieved.', { appointment });
});

const rescheduleAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.rescheduleAppointment(
    req.params.id,
    req.user.id,
    req.body
  );
  ApiResponse.ok(res, 'Appointment rescheduled.', { appointment });
});

const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.cancelAppointment(
    req.params.id,
    req.user
  );
  ApiResponse.ok(res, 'Appointment cancelled.', { appointment });
});

const getAllAppointments = asyncHandler(async (req, res) => {
  const result = await appointmentService.getAllAppointments(req.query);
  ApiResponse.ok(res, 'Appointments retrieved.', result.appointments, result.meta);
});

module.exports = {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  rescheduleAppointment,
  cancelAppointment,
  getAllAppointments,
};
