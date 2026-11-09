// src/services/staffService.js
'use strict';

const staffRepository  = require('../repositories/staffRepository');
const userRepository   = require('../repositories/userRepository');
const serviceRepository = require('../repositories/serviceRepository');
const ApiError = require('../utils/ApiError');

const getMyServices = async (staffId) => staffRepository.getAssignedServices(staffId);

const assignStaff = async (staffId, serviceId) => {
  const staff = await userRepository.findById(staffId);
  if (!staff) throw ApiError.notFound('User not found.');
  if (staff.role === 'USER') throw ApiError.badRequest('Cannot assign a USER role to a service.');

  const service = await serviceRepository.findById(serviceId);
  if (!service) throw ApiError.notFound('Service not found.');

  const assignment = await staffRepository.assign(staffId, serviceId);
  if (!assignment) throw ApiError.conflict('Staff already assigned to this service.');
  return assignment;
};

const unassignStaff = async (staffId, serviceId) => {
  const removed = await staffRepository.unassign(staffId, serviceId);
  if (!removed) throw ApiError.notFound('Assignment not found.');
  return removed;
};

const getServiceStaff = async (serviceId) => {
  const service = await serviceRepository.findById(serviceId);
  if (!service) throw ApiError.notFound('Service not found.');
  return staffRepository.listAssignments(serviceId);
};

const getMySchedules = async (staffId) => staffRepository.getSchedules(staffId);

const createSchedule = async (staffId, data) => {
  const { serviceId, dayOfWeek, startTime, endTime } = data;
  const assigned = await staffRepository.isAssigned(staffId, serviceId);
  if (!assigned) throw ApiError.forbidden('You are not assigned to this service.');
  return staffRepository.createSchedule({ staffId, serviceId, dayOfWeek, startTime, endTime });
};

const deleteSchedule = async (scheduleId, staffId) => {
  const removed = await staffRepository.deleteSchedule(scheduleId, staffId);
  if (!removed) throw ApiError.notFound('Schedule not found.');
  return removed;
};

module.exports = {
  getMyServices,
  assignStaff,
  unassignStaff,
  getServiceStaff,
  getMySchedules,
  createSchedule,
  deleteSchedule,
};
