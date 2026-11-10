CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE user_role AS ENUM ('USER', 'STAFF', 'ADMIN');
CREATE TYPE appointment_type AS ENUM ('SCHEDULED', 'WALK_IN');
CREATE TYPE appointment_status AS ENUM (
  'PENDING', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'
);
CREATE TYPE token_status AS ENUM (
  'WAITING', 'CALLED', 'SKIPPED', 'IN_SERVICE', 'COMPLETED', 'CANCELLED'
);
CREATE TYPE notification_type AS ENUM (
  'BOOKING_CONFIRMATION', 'RESCHEDULED', 'CANCELLATION', 'UPCOMING_TURN', 'GENERAL'
);
CREATE TYPE notification_channel AS ENUM ('EMAIL', 'SMS', 'IN_APP');
CREATE TYPE notification_status AS ENUM ('PENDING', 'SENT', 'FAILED');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL CHECK (length(btrim(name)) > 0),
  email VARCHAR(254) NOT NULL UNIQUE CHECK (email = lower(email)),
  phone VARCHAR(30),
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'USER',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_active ON users (is_active) WHERE is_active;

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL UNIQUE CHECK (length(btrim(name)) > 0),
  description TEXT,
  location VARCHAR(200),
  avg_service_duration_min INTEGER NOT NULL DEFAULT 15 CHECK (avg_service_duration_min > 0),
  max_capacity INTEGER NOT NULL DEFAULT 100 CHECK (max_capacity > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_services_active_name ON services (name) WHERE is_active;

CREATE TABLE staff_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (staff_id, service_id)
);

CREATE INDEX idx_staff_assignments_service ON staff_assignments (service_id, staff_id);

CREATE OR REPLACE FUNCTION validate_staff_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  assigned_role user_role;
BEGIN
  SELECT role INTO assigned_role FROM users WHERE id = NEW.staff_id;
  IF assigned_role NOT IN ('STAFF', 'ADMIN') THEN
    RAISE EXCEPTION 'Only staff or admin accounts can be assigned to services'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_staff_assignments_validate_role
  BEFORE INSERT OR UPDATE OF staff_id ON staff_assignments
  FOR EACH ROW EXECUTE FUNCTION validate_staff_assignment();

CREATE TABLE staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL,
  service_id UUID NOT NULL,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start_time TIME,
  break_end_time TIME,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time),
  CHECK (
    (break_start_time IS NULL AND break_end_time IS NULL)
    OR (
      break_start_time IS NOT NULL AND break_end_time IS NOT NULL
      AND break_end_time > break_start_time
      AND break_start_time >= start_time AND break_end_time <= end_time
    )
  ),
  UNIQUE (staff_id, service_id, day_of_week, start_time),
  FOREIGN KEY (staff_id, service_id)
    REFERENCES staff_assignments(staff_id, service_id) ON DELETE CASCADE
);

CREATE INDEX idx_staff_schedules_availability
  ON staff_schedules (staff_id, service_id, day_of_week, start_time)
  WHERE is_available;

CREATE TABLE service_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start_time TIME,
  break_end_time TIME,
  slot_duration_min INTEGER NOT NULL DEFAULT 15 CHECK (slot_duration_min > 0),
  max_appointments_per_slot INTEGER NOT NULL DEFAULT 1 CHECK (max_appointments_per_slot > 0),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time),
  CHECK (
    (break_start_time IS NULL AND break_end_time IS NULL)
    OR (
      break_start_time IS NOT NULL AND break_end_time IS NOT NULL
      AND break_end_time > break_start_time
      AND break_start_time >= start_time AND break_end_time <= end_time
    )
  ),
  UNIQUE (service_id, day_of_week, start_time)
);

CREATE INDEX idx_service_schedules_availability
  ON service_schedules (service_id, day_of_week, start_time)
  WHERE is_available;

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  assigned_staff_id UUID,
  appointment_type appointment_type NOT NULL DEFAULT 'SCHEDULED',
  status appointment_status NOT NULL DEFAULT 'PENDING',
  scheduled_at TIMESTAMPTZ,
  scheduled_end_at TIMESTAMPTZ,
  notes TEXT,
  is_priority BOOLEAN NOT NULL DEFAULT FALSE,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (scheduled_end_at IS NULL OR (scheduled_at IS NOT NULL AND scheduled_end_at > scheduled_at)),
  UNIQUE (id, user_id),
  UNIQUE (id, service_id),
  FOREIGN KEY (assigned_staff_id, service_id)
    REFERENCES staff_assignments(staff_id, service_id) ON DELETE RESTRICT
);

CREATE INDEX idx_appointments_user_created ON appointments (user_id, created_at DESC);
CREATE INDEX idx_appointments_service_scheduled ON appointments (service_id, scheduled_at);
CREATE INDEX idx_appointments_status_scheduled ON appointments (status, scheduled_at);
CREATE INDEX idx_appointments_assigned_staff_scheduled
  ON appointments (assigned_staff_id, scheduled_at)
  WHERE assigned_staff_id IS NOT NULL;

ALTER TABLE appointments
  ADD CONSTRAINT appointments_staff_no_overlap
  EXCLUDE USING gist (
    assigned_staff_id WITH =,
    tstzrange(scheduled_at, scheduled_end_at, '[)') WITH &&
  )
  WHERE (
    assigned_staff_id IS NOT NULL
    AND scheduled_at IS NOT NULL
    AND scheduled_end_at IS NOT NULL
    AND appointment_type = 'SCHEDULED'
    AND status IN ('PENDING', 'CONFIRMED', 'RESCHEDULED')
  );

CREATE TABLE queue_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL UNIQUE REFERENCES services(id) ON DELETE CASCADE,
  max_tokens_per_day INTEGER NOT NULL DEFAULT 200 CHECK (max_tokens_per_day BETWEEN 1 AND 9999),
  avg_service_duration_min INTEGER NOT NULL DEFAULT 15 CHECK (avg_service_duration_min > 0),
  allow_priority BOOLEAN NOT NULL DEFAULT TRUE,
  max_priority_per_day INTEGER NOT NULL DEFAULT 5 CHECK (max_priority_per_day >= 0),
  auto_call_next BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE queue_token_counters (
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  token_date DATE NOT NULL,
  last_token_number INTEGER NOT NULL DEFAULT 0 CHECK (last_token_number BETWEEN 0 AND 9999),
  last_position BIGINT NOT NULL DEFAULT 0 CHECK (last_position >= 0),
  PRIMARY KEY (service_id, token_date)
);

CREATE TABLE queue_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL,
  service_id UUID NOT NULL,
  token_number INTEGER NOT NULL CHECK (token_number BETWEEN 1 AND 9999),
  token_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status token_status NOT NULL DEFAULT 'WAITING',
  is_priority BOOLEAN NOT NULL DEFAULT FALSE,
  called_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  served_by UUID REFERENCES users(id) ON DELETE SET NULL,
  position BIGINT NOT NULL CHECK (position > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (service_id, token_date, token_number),
  UNIQUE (service_id, token_date, position),
  FOREIGN KEY (appointment_id, service_id)
    REFERENCES appointments(id, service_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX uq_queue_tokens_one_active_per_appointment
  ON queue_tokens (appointment_id)
  WHERE status IN ('WAITING', 'CALLED', 'SKIPPED', 'IN_SERVICE');
CREATE INDEX idx_queue_tokens_live_order
  ON queue_tokens (service_id, token_date, is_priority DESC, position)
  WHERE status IN ('WAITING', 'CALLED', 'SKIPPED', 'IN_SERVICE');
CREATE INDEX idx_queue_tokens_status_date ON queue_tokens (status, token_date);

CREATE TABLE queue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES queue_tokens(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(30) NOT NULL CHECK (
    event_type IN (
      'TOKEN_ISSUED', 'CALLED', 'SKIPPED', 'SERVICE_STARTED',
      'COMPLETED', 'CANCELLED', 'REQUEUED'
    )
  ),
  from_status token_status,
  to_status token_status NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_queue_events_token_time ON queue_events (token_id, occurred_at DESC);
CREATE INDEX idx_queue_events_actor_time ON queue_events (actor_user_id, occurred_at DESC)
  WHERE actor_user_id IS NOT NULL;

CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  appointment_id UUID,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (appointment_id),
  FOREIGN KEY (appointment_id, user_id)
    REFERENCES appointments(id, user_id) ON DELETE RESTRICT
);

CREATE INDEX idx_feedback_user_created ON feedback (user_id, created_at DESC);
CREATE INDEX idx_feedback_service_rating ON feedback (service_id, rating);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appointment_id UUID,
  type notification_type NOT NULL,
  channel notification_channel NOT NULL DEFAULT 'EMAIL',
  status notification_status NOT NULL DEFAULT 'PENDING',
  subject TEXT,
  body TEXT,
  sent_at TIMESTAMPTZ,
  delivery_attempts SMALLINT NOT NULL DEFAULT 0 CHECK (delivery_attempts >= 0),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (appointment_id, user_id)
    REFERENCES appointments(id, user_id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_created ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_pending ON notifications (created_at)
  WHERE status = 'PENDING';
CREATE INDEX idx_notifications_appointment ON notifications (appointment_id)
  WHERE appointment_id IS NOT NULL;

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(80) NOT NULL,
  resource_id UUID,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor_time ON audit_logs (actor_user_id, occurred_at DESC);
CREATE INDEX idx_audit_logs_resource_time ON audit_logs (resource_type, resource_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_service_schedules_updated_at BEFORE UPDATE ON service_schedules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_queue_settings_updated_at BEFORE UPDATE ON queue_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_queue_tokens_updated_at BEFORE UPDATE ON queue_tokens
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION set_appointment_end_time()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  duration_min INTEGER;
BEGIN
  IF NEW.scheduled_at IS NULL THEN
    NEW.scheduled_end_at := NULL;
  ELSIF NEW.scheduled_end_at IS NULL
    OR (TG_OP = 'UPDATE' AND NEW.scheduled_at IS DISTINCT FROM OLD.scheduled_at
        AND NEW.scheduled_end_at IS NOT DISTINCT FROM OLD.scheduled_end_at) THEN
    SELECT COALESCE(qs.avg_service_duration_min, s.avg_service_duration_min)
      INTO duration_min
      FROM services s
      LEFT JOIN queue_settings qs ON qs.service_id = s.id
      WHERE s.id = NEW.service_id;
    NEW.scheduled_end_at := NEW.scheduled_at + make_interval(mins => duration_min);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_appointments_set_end_time
  BEFORE INSERT OR UPDATE OF scheduled_at, scheduled_end_at, service_id ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_appointment_end_time();

CREATE OR REPLACE FUNCTION enforce_appointment_slot_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  schedule_row service_schedules%ROWTYPE;
  service_has_schedule BOOLEAN;
  day_of_week_value SMALLINT;
  start_time_value TIME;
  end_time_value TIME;
  slot_offset_seconds NUMERIC;
  slot_start TIMESTAMPTZ;
  active_count INTEGER;
BEGIN
  IF NEW.appointment_type <> 'SCHEDULED'
     OR NEW.scheduled_at IS NULL
     OR NEW.status NOT IN ('PENDING', 'CONFIRMED', 'RESCHEDULED') THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM service_schedules WHERE service_id = NEW.service_id
  ) INTO service_has_schedule;
  IF NOT service_has_schedule THEN
    RETURN NEW;
  END IF;

  day_of_week_value := EXTRACT(DOW FROM NEW.scheduled_at)::SMALLINT;
  SELECT * INTO schedule_row
  FROM service_schedules
  WHERE service_id = NEW.service_id
    AND day_of_week = day_of_week_value
    AND is_available
    AND NEW.scheduled_at::TIME >= start_time
    AND NEW.scheduled_at::TIME < end_time
  ORDER BY start_time DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active service schedule covers the requested appointment time'
      USING ERRCODE = 'check_violation';
  END IF;

  start_time_value := NEW.scheduled_at::TIME;
  end_time_value := NEW.scheduled_end_at::TIME;
  IF NEW.scheduled_end_at IS NULL THEN
    SELECT NEW.scheduled_at::TIME + make_interval(mins => avg_service_duration_min)
      INTO end_time_value
    FROM services WHERE id = NEW.service_id;
  END IF;

  slot_offset_seconds := EXTRACT(EPOCH FROM (start_time_value - schedule_row.start_time));
  IF MOD(slot_offset_seconds, schedule_row.slot_duration_min * 60) <> 0
     OR end_time_value > schedule_row.end_time
     OR (
       schedule_row.break_start_time IS NOT NULL
       AND start_time_value < schedule_row.break_end_time
       AND end_time_value > schedule_row.break_start_time
     ) THEN
    RAISE EXCEPTION 'Appointment time is outside an available service slot'
      USING ERRCODE = 'check_violation';
  END IF;

  slot_start := date_trunc('day', NEW.scheduled_at)
    + schedule_row.start_time
    + make_interval(mins => (
      FLOOR(slot_offset_seconds / (schedule_row.slot_duration_min * 60))
      * schedule_row.slot_duration_min
    )::INTEGER);
  PERFORM pg_advisory_xact_lock(
    hashtextextended(NEW.service_id::text || ':' || slot_start::text, 0)
  );

  SELECT COUNT(*)::INTEGER INTO active_count
  FROM appointments
  WHERE service_id = NEW.service_id
    AND scheduled_at = slot_start
    AND appointment_type = 'SCHEDULED'
    AND status IN ('PENDING', 'CONFIRMED', 'RESCHEDULED')
    AND id <> NEW.id;

  IF active_count >= schedule_row.max_appointments_per_slot THEN
    RAISE EXCEPTION 'Appointment capacity reached for this service slot'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_appointments_z_enforce_slot_capacity
  BEFORE INSERT OR UPDATE OF service_id, scheduled_at, scheduled_end_at, appointment_type, status
  ON appointments
  FOR EACH ROW EXECUTE FUNCTION enforce_appointment_slot_capacity();

CREATE OR REPLACE FUNCTION enforce_queue_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  daily_limit INTEGER;
  priority_limit INTEGER;
  priority_allowed BOOLEAN;
  issued_count INTEGER;
  issued_priority_count INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(
    hashtextextended(NEW.service_id::text || ':' || NEW.token_date::text, 0)
  );

  SELECT COALESCE(qs.max_tokens_per_day, s.max_capacity),
         COALESCE(qs.max_priority_per_day, 5),
         COALESCE(qs.allow_priority, TRUE)
    INTO daily_limit, priority_limit, priority_allowed
    FROM services s
    LEFT JOIN queue_settings qs ON qs.service_id = s.id
    WHERE s.id = NEW.service_id;

  SELECT COUNT(*)::INTEGER,
         COUNT(*) FILTER (WHERE is_priority)::INTEGER
    INTO issued_count, issued_priority_count
    FROM queue_tokens
    WHERE service_id = NEW.service_id AND token_date = NEW.token_date;

  IF issued_count >= daily_limit THEN
    RAISE EXCEPTION 'Daily token capacity reached for service % on %',
      NEW.service_id, NEW.token_date USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.is_priority AND NOT priority_allowed THEN
    RAISE EXCEPTION 'Priority tokens are disabled for service %', NEW.service_id
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.is_priority AND issued_priority_count >= priority_limit THEN
    RAISE EXCEPTION 'Daily priority token capacity reached for service %', NEW.service_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_queue_tokens_capacity
  BEFORE INSERT ON queue_tokens
  FOR EACH ROW EXECUTE FUNCTION enforce_queue_capacity();

CREATE OR REPLACE FUNCTION record_queue_event()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  event_name VARCHAR(30);
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO queue_events (token_id, actor_user_id, event_type, from_status, to_status)
    VALUES (NEW.id, NEW.served_by, 'TOKEN_ISSUED', NULL, NEW.status);
    RETURN NEW;
  END IF;

  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  IF NOT (
    (OLD.status = 'WAITING' AND NEW.status IN ('CALLED', 'CANCELLED'))
    OR (OLD.status = 'CALLED' AND NEW.status IN ('SKIPPED', 'IN_SERVICE', 'COMPLETED', 'CANCELLED'))
    OR (OLD.status = 'SKIPPED' AND NEW.status IN ('WAITING', 'CANCELLED'))
    OR (OLD.status = 'IN_SERVICE' AND NEW.status IN ('COMPLETED', 'CANCELLED'))
  ) THEN
    RAISE EXCEPTION 'Invalid queue token transition: % -> %', OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;

  event_name := CASE NEW.status
    WHEN 'CALLED' THEN 'CALLED'
    WHEN 'SKIPPED' THEN 'SKIPPED'
    WHEN 'IN_SERVICE' THEN 'SERVICE_STARTED'
    WHEN 'COMPLETED' THEN 'COMPLETED'
    WHEN 'CANCELLED' THEN 'CANCELLED'
    WHEN 'WAITING' THEN 'REQUEUED'
  END;

  INSERT INTO queue_events (token_id, actor_user_id, event_type, from_status, to_status)
  VALUES (NEW.id, NEW.served_by, event_name, OLD.status, NEW.status);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_queue_tokens_record_event
  AFTER INSERT OR UPDATE OF status ON queue_tokens
  FOR EACH ROW EXECUTE FUNCTION record_queue_event();

CREATE OR REPLACE FUNCTION validate_feedback_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  appointment_status_value appointment_status;
  appointment_service_id UUID;
BEGIN
  IF NEW.appointment_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT status, service_id
    INTO appointment_status_value, appointment_service_id
    FROM appointments
    WHERE id = NEW.appointment_id;

  IF appointment_status_value IS DISTINCT FROM 'COMPLETED' THEN
    RAISE EXCEPTION 'Feedback requires a completed appointment'
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.service_id IS NOT NULL AND NEW.service_id <> appointment_service_id THEN
    RAISE EXCEPTION 'Feedback service must match the appointment service'
      USING ERRCODE = 'check_violation';
  END IF;
  NEW.service_id := appointment_service_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_feedback_validate_appointment
  BEFORE INSERT OR UPDATE OF appointment_id, user_id, service_id ON feedback
  FOR EACH ROW EXECUTE FUNCTION validate_feedback_appointment();
