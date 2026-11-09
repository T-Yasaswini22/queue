// src/controllers/staffController.js
'use strict';

const staffService = require('../services/staffService');
const ApiResponse  = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getMyServices = asyncHandler(async (req, res) => {
  const services = await staffService.getMyServices(req.user.id);
  ApiResponse.ok(res, 'Assigned services retrieved.', { services });
});

const getMySchedules = asyncHandler(async (req, res) => {
  const schedules = await staffService.getMySchedules(req.user.id);
  ApiResponse.ok(res, 'Schedules retrieved.', { schedules });
});

const createSchedule = asyncHandler(async (req, res) => {
  const schedule = await staffService.createSchedule(req.user.id, req.body);
  ApiResponse.created(res, 'Schedule created.', { schedule });
});

const deleteSchedule = asyncHandler(async (req, res) => {
  await staffService.deleteSchedule(req.params.id, req.user.id);
  ApiResponse.ok(res, 'Schedule deleted.');
});

// Admin-only
const assignStaff = asyncHandler(async (req, res) => {
  const { staffId, serviceId } = req.body;
  const assignment = await staffService.assignStaff(staffId, serviceId);
  ApiResponse.created(res, 'Staff assigned.', { assignment });
});

const unassignStaff = asyncHandler(async (req, res) => {
  const { staffId, serviceId } = req.body;
  const result = await staffService.unassignStaff(staffId, serviceId);
  ApiResponse.ok(res, 'Staff unassigned.', { result });
});

const getServiceStaff = asyncHandler(async (req, res) => {
  const staff = await staffService.getServiceStaff(req.params.serviceId);
  ApiResponse.ok(res, 'Service staff retrieved.', { staff });
});

module.exports = {
  getMyServices, getMySchedules, createSchedule, deleteSchedule,
  assignStaff, unassignStaff, getServiceStaff,
};
