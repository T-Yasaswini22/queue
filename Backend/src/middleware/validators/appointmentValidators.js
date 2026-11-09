// src/middleware/validators/appointmentValidators.js
'use strict';

const { body } = require('express-validator');

const createAppointmentValidator = [
  body('serviceId')
    .notEmpty().withMessage('serviceId is required.')
    .isUUID().withMessage('serviceId must be a valid UUID.'),
  body('type')
    .optional()
    .isIn(['SCHEDULED', 'WALK_IN']).withMessage('type must be SCHEDULED or WALK_IN.'),
  body('scheduledAt')
    .optional()
    .isISO8601().withMessage('scheduledAt must be a valid ISO 8601 date.')
    .toDate()
    .custom((val) => {
      if (val <= new Date()) throw new Error('scheduledAt must be in the future.');
      return true;
    }),
  body('notes').optional().trim().isLength({ max: 500 }),
  body('isPriority').optional().isBoolean(),
];

const rescheduleValidator = [
  body('scheduledAt')
    .notEmpty().withMessage('scheduledAt is required.')
    .isISO8601().withMessage('scheduledAt must be a valid ISO 8601 date.')
    .toDate()
    .custom((val) => {
      if (val <= new Date()) throw new Error('scheduledAt must be in the future.');
      return true;
    }),
];

module.exports = { createAppointmentValidator, rescheduleValidator };
