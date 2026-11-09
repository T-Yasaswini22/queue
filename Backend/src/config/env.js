// src/config/env.js
'use strict';

const fs = require('fs');
const path = require('path');

const envDir = path.resolve(__dirname, '../..');
const envFile = ['.env', '.env.example']
  .map((file) => path.join(envDir, file))
  .find((file) => fs.existsSync(file));

if (envFile) {
  require('dotenv').config({ path: envFile });
  if (path.basename(envFile) === '.env.example') {
    console.warn(
      'Using .env.example values because no .env file was found. Update the database credentials in Backend/.env before starting the app.'
    );
  }
} else {
  console.warn(
    'No .env or .env.example file found. Using default configuration values. Add a database config file before starting the app.'
  );
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,

  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT, 10) || 5432,
  DB_NAME:
    process.env.NODE_ENV === 'test'
      ? process.env.TEST_DB_NAME || 'queueless_test'
      : process.env.DB_NAME || 'queueless',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_SSL: process.env.DB_SSL === 'true',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'change_this_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Bcrypt
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:4200',

  // Email
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || 'dev',
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || 'no-reply@queueless.app',
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'QueueLess',

  // SMS
  SMS_PROVIDER: process.env.SMS_PROVIDER || 'dev',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_FROM_NUMBER: process.env.TWILIO_FROM_NUMBER,

  // Notifications
  NOTIFICATIONS_ENABLED: process.env.NOTIFICATIONS_ENABLED === 'true',

  // Queue defaults
  DEFAULT_SERVICE_DURATION_MINUTES:
    parseInt(process.env.DEFAULT_SERVICE_DURATION_MINUTES, 10) || 15,
  MAX_PRIORITY_PER_QUEUE: parseInt(process.env.MAX_PRIORITY_PER_QUEUE, 10) || 5,

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

module.exports = env;
