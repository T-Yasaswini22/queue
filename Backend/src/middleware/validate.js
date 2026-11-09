// src/middleware/validate.js
'use strict';

const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Run express-validator result check after chain of validators.
 * Usage: [...validators, validate]
 */
const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({
      field:   e.path || e.param,
      message: e.msg,
    }));
    return next(ApiError.badRequest('Validation failed.', details));
  }
  next();
};

module.exports = validate;
