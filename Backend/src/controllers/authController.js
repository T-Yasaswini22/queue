// src/controllers/authController.js
'use strict';

const authService   = require('../services/authService');
const ApiResponse   = require('../utils/ApiResponse');
const asyncHandler  = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  const { user, token } = await authService.register({ name, email, phone, password });
  ApiResponse.created(res, 'Account created successfully.', { user, token });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, token } = await authService.login({ email, password });
  ApiResponse.ok(res, 'Login successful.', { user, token });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  ApiResponse.ok(res, 'User profile retrieved.', { user });
});

const logout = asyncHandler(async (req, res) => {
  // JWT is stateless; instruct the client to discard the token
  ApiResponse.ok(res, 'Logged out successfully. Please discard your token.');
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, { currentPassword, newPassword });
  ApiResponse.ok(res, 'Password changed successfully.');
});

module.exports = { register, login, getMe, logout, changePassword };
