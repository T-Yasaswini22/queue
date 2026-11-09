// src/utils/jwt.js
'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('./ApiError');

/**
 * Sign a JWT token.
 * @param {object} payload   - Token payload (avoid sensitive fields)
 * @param {string} [expires] - Expiry string (default from env)
 */
const signToken = (payload, expires = env.JWT_EXPIRES_IN) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: expires });

/**
 * Verify and decode a JWT token.
 * @param {string} token
 * @returns {object} decoded payload
 * @throws ApiError 401 if invalid or expired
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token expired. Please log in again.');
    }
    throw ApiError.unauthorized('Invalid token.');
  }
};

module.exports = { signToken, verifyToken };
