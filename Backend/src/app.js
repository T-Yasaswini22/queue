// src/app.js
'use strict';

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const morgan       = require('morgan');
const env          = require('./config/env');
const swagger      = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// ── Route imports ──────────────────────────────────────────────────────────
const authRoutes        = require('./routes/auth.routes');
const serviceRoutes     = require('./routes/service.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const queueRoutes       = require('./routes/queue.routes');
const staffRoutes       = require('./routes/staff.routes');
const feedbackRoutes    = require('./routes/feedback.routes');
const adminRoutes       = require('./routes/admin.routes');

const app = express();

// ── Security & Parsing ────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Request Logging ────────────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Global rate limiter ────────────────────────────────────────────────────
app.use('/api/', generalLimiter);

// ── Swagger Documentation ─────────────────────────────────────────────────
swagger.setup(app);

// ── Health Check ──────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/services',     serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/queue',        queueRoutes);
app.use('/api/staff',        staffRoutes);
app.use('/api/feedback',     feedbackRoutes);
app.use('/api/admin',        adminRoutes);

// ── 404 handler ────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ── Global error handler ───────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
