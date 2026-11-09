// src/services/notificationService.js
'use strict';

/**
 * Notification Service
 * ─────────────────────────────────────────────────────────────────
 * Supports two adapters:
 *   • DevAdapter  — logs to console; safe when credentials are absent
 *   • SmtpAdapter — sends real email via Nodemailer
 *
 * Configure by setting EMAIL_PROVIDER=smtp in .env and supplying SMTP_* vars.
 * SMS via Twilio is wired but optional; set SMS_PROVIDER=twilio + TWILIO_* vars.
 * ─────────────────────────────────────────────────────────────────
 */

const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');
const userRepository = require('../repositories/userRepository');

// ── Adapters ─────────────────────────────────────────────────────────────────

class DevAdapter {
  async send({ to, subject, body }) {
    logger.info(`[DEV NOTIFICATION] To: ${to} | Subject: ${subject}`);
    logger.debug(body);
  }
}

class SmtpAdapter {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }

  async send({ to, subject, body }) {
    await this.transporter.sendMail({
      from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
      to,
      subject,
      html: body,
    });
  }
}

const emailAdapter =
  env.EMAIL_PROVIDER === 'smtp' && env.SMTP_HOST && env.SMTP_USER
    ? new SmtpAdapter()
    : new DevAdapter();

// ── Template helpers ──────────────────────────────────────────────────────────

const templates = {
  bookingConfirmation: (appointment, token) => ({
    subject: `Booking Confirmed – Token #${token.token_number}`,
    body: `
      <h2>Booking Confirmed!</h2>
      <p>Your appointment has been confirmed.</p>
      <ul>
        <li><strong>Service:</strong> ${appointment.service_name}</li>
        <li><strong>Token Number:</strong> #${token.token_number}</li>
        <li><strong>Date:</strong> ${token.token_date}</li>
        ${appointment.scheduled_at ? `<li><strong>Scheduled At:</strong> ${appointment.scheduled_at}</li>` : ''}
      </ul>
      <p>Thank you for using QueueLess!</p>
    `,
  }),

  rescheduled: (appointment) => ({
    subject: `Appointment Rescheduled`,
    body: `
      <h2>Appointment Rescheduled</h2>
      <p>Your appointment has been rescheduled to <strong>${appointment.scheduled_at}</strong>.</p>
      <p>Service: ${appointment.service_name}</p>
    `,
  }),

  cancellation: (appointment) => ({
    subject: `Appointment Cancelled`,
    body: `
      <h2>Appointment Cancelled</h2>
      <p>Your appointment for <strong>${appointment.service_name}</strong> has been cancelled.</p>
      <p>If you did not request this, please contact support.</p>
    `,
  }),

  upcomingTurn: (token) => ({
    subject: `It's almost your turn – Token #${token.token_number}`,
    body: `
      <h2>Your Turn is Coming Up!</h2>
      <p>Token <strong>#${token.token_number}</strong> for <strong>${token.service_name}</strong> has been called.</p>
      <p>Please proceed to the service area.</p>
    `,
  }),
};

// ── Public API ────────────────────────────────────────────────────────────────

const notify = async (userId, templateFn, ...args) => {
  if (!env.NOTIFICATIONS_ENABLED) return;
  try {
    const user = await userRepository.findById(userId);
    if (!user || !user.email) return;
    const { subject, body } = templateFn(...args);
    await emailAdapter.send({ to: user.email, subject, body });
  } catch (err) {
    logger.warn('Notification failed:', err.message);
  }
};

const sendBookingConfirmation = (userId, appointment, token) =>
  notify(userId, templates.bookingConfirmation, appointment, token);

const sendRescheduled = (userId, appointment) =>
  notify(userId, templates.rescheduled, appointment);

const sendCancellation = (userId, appointment) =>
  notify(userId, templates.cancellation, appointment);

const sendUpcomingTurn = async (appointmentId, token) => {
  // We need to find the user from the appointment
  if (!env.NOTIFICATIONS_ENABLED) return;
  try {
    const { query } = require('../config/database');
    const { rows } = await query(
      'SELECT user_id FROM appointments WHERE id = $1',
      [appointmentId]
    );
    if (!rows[0]) return;
    await notify(rows[0].user_id, templates.upcomingTurn, token);
  } catch (err) {
    logger.warn('Upcoming turn notification failed:', err.message);
  }
};

module.exports = {
  sendBookingConfirmation,
  sendRescheduled,
  sendCancellation,
  sendUpcomingTurn,
};
