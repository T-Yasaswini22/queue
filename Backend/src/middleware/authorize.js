// src/middleware/authorize.js
'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Role-based authorization middleware factory.
 * Usage: authorize('ADMIN'), authorize('STAFF', 'ADMIN')
 *
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized());
  }
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission to perform this action.'));
  }
  next();
};

module.exports = authorize;
