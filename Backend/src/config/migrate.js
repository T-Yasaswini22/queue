// src/config/migrate.js
'use strict';

require('dotenv').config();
const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
});

const schema = `
-- ─────────────────────────────────────
--  QueueLess Database Schema
-- ─────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Roles ──────────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('USER', 'STAFF', 'ADMIN');

-- ── Users ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(200) NOT NULL UNIQUE,
  phone         VARCHAR(30),
  password_hash TEXT         NOT NULL,
  role          user_role    NOT NULL DEFAULT 'USER',
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users (role);

-- ── Services ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name                     VARCHAR(150) NOT NULL,
  description              TEXT,
  location                 VARCHAR(200),
  avg_service_duration_min INTEGER      NOT NULL DEFAULT 15,
  max_capacity             INTEGER      NOT NULL DEFAULT 100,
  is_active                BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Staff Assignments ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_assignments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID        NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (staff_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_assignments_staff   ON staff_assignments (staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_service ON staff_assignments (service_id);

-- ── Staff Schedules ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_schedules (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID        NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  day_of_week INTEGER    NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time  TIME       NOT NULL,
  end_time    TIME       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_staff_schedules_staff ON staff_schedules (staff_id);

-- ── Appointments ───────────────────────────────────────────────────────────
CREATE TYPE appointment_type   AS ENUM ('SCHEDULED', 'WALK_IN');
CREATE TYPE appointment_status AS ENUM (
  'PENDING', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'
);

CREATE TABLE IF NOT EXISTS appointments (
  id              UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID               NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id      UUID               NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  appointment_type appointment_type  NOT NULL DEFAULT 'SCHEDULED',
  status          appointment_status NOT NULL DEFAULT 'PENDING',
  scheduled_at    TIMESTAMPTZ,
  notes           TEXT,
  is_priority     BOOLEAN            NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_user_id    ON appointments (user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON appointments (service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status     ON appointments (status);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled  ON appointments (scheduled_at);

-- ── Queue Tokens ───────────────────────────────────────────────────────────
CREATE TYPE token_status AS ENUM (
  'WAITING', 'CALLED', 'SKIPPED', 'IN_SERVICE', 'COMPLETED', 'CANCELLED'
);

CREATE TABLE IF NOT EXISTS queue_tokens (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id  UUID         NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id      UUID         NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  token_number    INTEGER      NOT NULL,
  token_date      DATE         NOT NULL DEFAULT CURRENT_DATE,
  status          token_status NOT NULL DEFAULT 'WAITING',
  is_priority     BOOLEAN      NOT NULL DEFAULT FALSE,
  called_at       TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  served_by       UUID         REFERENCES users(id),
  position        INTEGER,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (service_id, token_number, token_date)
);

CREATE INDEX IF NOT EXISTS idx_queue_tokens_service_date ON queue_tokens (service_id, token_date);
CREATE INDEX IF NOT EXISTS idx_queue_tokens_status       ON queue_tokens (status);
CREATE INDEX IF NOT EXISTS idx_queue_tokens_appointment  ON queue_tokens (appointment_id);

-- ── Queue Settings ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS queue_settings (
  id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id               UUID         NOT NULL UNIQUE REFERENCES services(id) ON DELETE CASCADE,
  max_tokens_per_day       INTEGER      NOT NULL DEFAULT 200,
  avg_service_duration_min INTEGER      NOT NULL DEFAULT 15,
  allow_priority           BOOLEAN      NOT NULL DEFAULT TRUE,
  max_priority_per_day     INTEGER      NOT NULL DEFAULT 5,
  auto_call_next           BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Feedback ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  appointment_id UUID        REFERENCES appointments(id) ON DELETE SET NULL,
  service_id     UUID        REFERENCES services(id) ON DELETE SET NULL,
  rating         INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user    ON feedback (user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_service ON feedback (service_id);

-- ── Notifications ──────────────────────────────────────────────────────────
CREATE TYPE notification_type AS ENUM (
  'BOOKING_CONFIRMATION', 'RESCHEDULED', 'CANCELLATION', 'UPCOMING_TURN', 'GENERAL'
);
CREATE TYPE notification_channel AS ENUM ('EMAIL', 'SMS', 'IN_APP');
CREATE TYPE notification_status  AS ENUM ('PENDING', 'SENT', 'FAILED');

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID                  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       notification_type     NOT NULL,
  channel    notification_channel  NOT NULL DEFAULT 'EMAIL',
  status     notification_status   NOT NULL DEFAULT 'PENDING',
  subject    TEXT,
  body       TEXT,
  sent_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

-- ── updated_at trigger ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','services','appointments','queue_tokens',
    'queue_settings','staff_schedules'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON %s;
       CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
      t, t, t, t
    );
  END LOOP;
END $$;
`;

async function migrate() {
  console.log(`Running migrations on database: ${env.DB_NAME}`);
  const client = await pool.connect();
  try {
    await client.query(schema);
    console.log('✅  Migrations completed successfully.');
  } catch (err) {
    console.error('❌  Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
