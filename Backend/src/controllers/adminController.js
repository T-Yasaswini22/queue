// src/controllers/adminController.js
'use strict';

const adminService = require('../services/adminService');
const ApiResponse  = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const listUsers = asyncHandler(async (req, res) => {
  const result = await adminService.listUsers(req.query);
  ApiResponse.ok(res, 'Users retrieved.', result.users, result.meta);
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await adminService.getUserById(req.params.id);
  ApiResponse.ok(res, 'User retrieved.', { user });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await adminService.updateUser(req.params.id, req.body);
  ApiResponse.ok(res, 'User updated.', { user });
});

const deactivateUser = asyncHandler(async (req, res) => {
  const user = await adminService.deactivateUser(req.params.id);
  ApiResponse.ok(res, 'User deactivated.', { user });
});

const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  ApiResponse.ok(res, 'Dashboard statistics retrieved.', { stats });
});

const getReports = asyncHandler(async (req, res) => {
  const { from, to, serviceId } = req.query;
  const report = await adminService.getReports({ from, to, serviceId });
  ApiResponse.ok(res, 'Report generated.', { report });
});

module.exports = {
  listUsers, getUserById, updateUser, deactivateUser,
  getDashboardStats, getReports,
};
