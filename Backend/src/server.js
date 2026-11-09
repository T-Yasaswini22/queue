// src/server.js
'use strict';

require('dotenv').config();
const app  = require('./app');
const env  = require('./config/env');
const { testConnection } = require('./config/database');
const logger = require('./utils/logger');

const start = async () => {
  try {
    const dbTime = await testConnection();
    logger.info(`✅  Database connected. Server time: ${dbTime}`);

    const server = app.listen(env.PORT, () => {
      logger.info(`🚀  QueueLess API running on http://localhost:${env.PORT}`);
      logger.info(`📄  API Docs: http://localhost:${env.PORT}/api-docs`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down gracefully.`);
      server.close(async () => {
        const { pool } = require('./config/database');
        await pool.end();
        logger.info('PostgreSQL pool closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
