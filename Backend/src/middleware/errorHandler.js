// src/middleware/errorHandler.js
'use strict';

const ApiError = require('../utils/ApiError');
const logger   = require('../utils/logger');
const env      = require('../config/env');

/**
 * Global Express error-handling middleware.
 * Must be registered AFTER all routes.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Log unexpected errors
  if (!err.isOperational) {
    logger.error('Unhandled error:', {
      message: err.message,
      stack:   err.stack,
      path:    req.path,
      method:  req.method,
    });
  }

  // PostgreSQL unique-violation → 409
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry – resource already exists.',
    });
  }

  // PostgreSQL foreign-key violation → 400
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced resource does not exist.',
    });
  }

  // JWT errors bubble up as ApiError from jwt.js
  const statusCode = err.statusCode || 500;
  const message =
    err.isOperational
      ? err.message
      : env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  const body = { success: false, message };
  if (err.errors && err.errors.length > 0) body.errors = err.errors;
  if (env.NODE_ENV !== 'production' && !err.isOperational) body.stack = err.stack;

  res.status(statusCode).json(body);
};

module.exports = errorHandler;
