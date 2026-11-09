// src/config/swagger.js
'use strict';

const swaggerJsdoc    = require('swagger-jsdoc');
const swaggerUi       = require('swagger-ui-express');
const env             = require('./env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'QueueLess API',
      version: '1.0.0',
      description:
        'Digital Appointment Management System – RESTful API documentation.',
      contact: { name: 'QueueLess Team', email: 'support@queueless.app' },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id:         { type: 'string', format: 'uuid' },
            name:       { type: 'string' },
            email:      { type: 'string', format: 'email' },
            phone:      { type: 'string' },
            role:       { type: 'string', enum: ['USER', 'STAFF', 'ADMIN'] },
            is_active:  { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Service: {
          type: 'object',
          properties: {
            id:                       { type: 'string', format: 'uuid' },
            name:                     { type: 'string' },
            description:              { type: 'string' },
            location:                 { type: 'string' },
            avg_service_duration_min: { type: 'integer' },
            max_capacity:             { type: 'integer' },
            is_active:                { type: 'boolean' },
          },
        },
        Appointment: {
          type: 'object',
          properties: {
            id:               { type: 'string', format: 'uuid' },
            user_id:          { type: 'string', format: 'uuid' },
            service_id:       { type: 'string', format: 'uuid' },
            appointment_type: { type: 'string', enum: ['SCHEDULED', 'WALK_IN'] },
            status: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'],
            },
            scheduled_at: { type: 'string', format: 'date-time' },
            is_priority:  { type: 'boolean' },
          },
        },
        QueueToken: {
          type: 'object',
          properties: {
            id:             { type: 'string', format: 'uuid' },
            appointment_id: { type: 'string', format: 'uuid' },
            service_id:     { type: 'string', format: 'uuid' },
            token_number:   { type: 'integer' },
            token_date:     { type: 'string', format: 'date' },
            status: {
              type: 'string',
              enum: ['WAITING', 'CALLED', 'SKIPPED', 'IN_SERVICE', 'COMPLETED', 'CANCELLED'],
            },
            is_priority:    { type: 'boolean' },
            position:       { type: 'integer' },
            estimated_wait_minutes: { type: 'integer' },
          },
        },
        Feedback: {
          type: 'object',
          properties: {
            id:             { type: 'string', format: 'uuid' },
            user_id:        { type: 'string', format: 'uuid' },
            appointment_id: { type: 'string', format: 'uuid' },
            service_id:     { type: 'string', format: 'uuid' },
            rating:         { type: 'integer', minimum: 1, maximum: 5 },
            comment:        { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors:  { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);

const setup = (app) => {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
      customSiteTitle: 'QueueLess API Docs',
    })
  );
  app.get('/api-docs.json', (_req, res) => res.json(specs));
};

module.exports = { setup };
