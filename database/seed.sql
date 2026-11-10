-- Development identities get random, unusable password hashes. Set real credentials
-- through the application's registration/password-reset flow, never in this file.
INSERT INTO users (name, email, phone, password_hash, role)
VALUES
  ('QueueLess Administrator', 'admin@queueless.local', NULL, crypt(gen_random_uuid()::text, gen_salt('bf')), 'ADMIN'),
  ('Sample Staff Member', 'staff@queueless.local', '+1-555-0101', crypt(gen_random_uuid()::text, gen_salt('bf')), 'STAFF'),
  ('Sample Customer', 'customer@queueless.local', '+1-555-0102', crypt(gen_random_uuid()::text, gen_salt('bf')), 'USER')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  is_active = TRUE;

INSERT INTO services (name, description, location, avg_service_duration_min, max_capacity)
VALUES
  ('General Consultation', 'General consultation and advice.', 'Building A, Room 101', 15, 100),
  ('Eye Clinic', 'Vision screening and eye care.', 'Building B, Room 201', 20, 80),
  ('Dental Care', 'Dental examination and routine care.', 'Building C, Room 301', 30, 60),
  ('Pharmacy', 'Prescription pickup and medication guidance.', 'Ground Floor', 5, 200)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  location = EXCLUDED.location,
  avg_service_duration_min = EXCLUDED.avg_service_duration_min,
  max_capacity = EXCLUDED.max_capacity,
  is_active = TRUE;

INSERT INTO queue_settings (service_id, max_tokens_per_day, avg_service_duration_min)
SELECT id, max_capacity, avg_service_duration_min
FROM services
ON CONFLICT (service_id) DO UPDATE SET
  max_tokens_per_day = EXCLUDED.max_tokens_per_day,
  avg_service_duration_min = EXCLUDED.avg_service_duration_min;

INSERT INTO staff_assignments (staff_id, service_id)
SELECT u.id, s.id
FROM users u
CROSS JOIN services s
WHERE u.email = 'staff@queueless.local'
  AND s.name IN ('General Consultation', 'Eye Clinic')
ON CONFLICT (staff_id, service_id) DO NOTHING;

INSERT INTO staff_schedules (
  staff_id, service_id, day_of_week, start_time, end_time,
  break_start_time, break_end_time, is_available
)
SELECT u.id, s.id, d.day_of_week, TIME '09:00', TIME '17:00',
       TIME '12:30', TIME '13:00', TRUE
FROM users u
CROSS JOIN services s
CROSS JOIN (VALUES (1), (2), (3), (4), (5)) AS d(day_of_week)
WHERE u.email = 'staff@queueless.local'
  AND s.name IN ('General Consultation', 'Eye Clinic')
ON CONFLICT (staff_id, service_id, day_of_week, start_time) DO NOTHING;

INSERT INTO service_schedules (
  service_id, day_of_week, start_time, end_time, break_start_time,
  break_end_time, slot_duration_min, max_appointments_per_slot
)
SELECT s.id, d.day_of_week, TIME '09:00', TIME '17:00',
       TIME '12:30', TIME '13:00', s.avg_service_duration_min, 1
FROM services s
CROSS JOIN (VALUES (1), (2), (3), (4), (5)) AS d(day_of_week)
WHERE s.name IN ('General Consultation', 'Eye Clinic', 'Dental Care', 'Pharmacy')
ON CONFLICT (service_id, day_of_week, start_time) DO UPDATE SET
  end_time = EXCLUDED.end_time,
  break_start_time = EXCLUDED.break_start_time,
  break_end_time = EXCLUDED.break_end_time,
  slot_duration_min = EXCLUDED.slot_duration_min,
  max_appointments_per_slot = EXCLUDED.max_appointments_per_slot,
  is_available = TRUE;
