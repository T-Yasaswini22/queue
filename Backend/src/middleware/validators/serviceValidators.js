// src/middleware/validators/serviceValidators.js
'use strict';

const { body } = require('express-validator');

const createServiceValidator = [
  body('name')
    .trim().notEmpty().withMessage('Name is required.')
    .isLength({ max: 150 }).withMessage('Name must be at most 150 characters.'),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('location').optional().trim().isLength({ max: 200 }),
  body('avgServiceDurationMin')
    .optional().isInt({ min: 1, max: 480 }).withMessage('Duration must be 1–480 minutes.'),
  body('maxCapacity')
    .optional().isInt({ min: 1 }).withMessage('Capacity must be a positive integer.'),
];

const updateServiceValidator = [
  body('name').optional().trim().isLength({ min: 1, max: 150 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('location').optional().trim().isLength({ max: 200 }),
  body('avg_service_duration_min')
    .optional().isInt({ min: 1, max: 480 }),
  body('max_capacity').optional().isInt({ min: 1 }),
  body('is_active').optional().isBoolean(),
];

const queueSettingsValidator = [
  body('maxTokensPerDay').optional().isInt({ min: 1 }),
  body('avgServiceDurationMin').optional().isInt({ min: 1, max: 480 }),
  body('allowPriority').optional().isBoolean(),
  body('maxPriorityPerDay').optional().isInt({ min: 0 }),
  body('autoCallNext').optional().isBoolean(),
];

module.exports = { createServiceValidator, updateServiceValidator, queueSettingsValidator };
