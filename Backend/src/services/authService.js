// src/services/authService.js
'use strict';

const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const { signToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

const register = async ({ name, email, phone, password, role = 'USER' }) => {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw ApiError.conflict('An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  const user = await userRepository.create({ name, email, phone, passwordHash, role });

  const token = signToken({ id: user.id, role: user.role });
  return { user, token };
};

const login = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password.');
  }
  if (!user.is_active) {
    throw ApiError.unauthorized('Account deactivated. Contact support.');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  // Strip the hash before returning
  const { password_hash, ...safeUser } = user;
  const token = signToken({ id: safeUser.id, role: safeUser.role });
  return { user: safeUser, token };
};

const getMe = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) throw ApiError.notFound('User not found.');
  return user;
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await userRepository.findByEmail(
    (await userRepository.findById(userId)).email
  );
  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw ApiError.badRequest('Current password is incorrect.');

  const hash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
  await userRepository.updatePassword(userId, hash);
};

module.exports = { register, login, getMe, changePassword };
