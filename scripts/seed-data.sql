-- ENA Visitor Management — seed data (PostgreSQL)
-- Run after schema.sql: psql "$DATABASE_URL" -f scripts/seed-data.sql
-- Default password for all seeded accounts: Ena@321# (bcrypt)

BEGIN;

TRUNCATE visitor_checkins, appointments, audit_logs, users, departments CASCADE;

-- Departments (manager_id filled after users)
INSERT INTO departments (id, name, description, manager_id, status) VALUES
  ('11111111-1111-1111-1111-111111111101'::uuid, 'Human Resources', 'HR Department', NULL, 'Active'),
  ('11111111-1111-1111-1111-111111111102'::uuid, 'Finance', 'Finance Department', NULL, 'Active'),
  ('11111111-1111-1111-1111-111111111103'::uuid, 'Operations', 'Operations Department', NULL, 'Active'),
  ('11111111-1111-1111-1111-111111111104'::uuid, 'IT', 'Information Technology', NULL, 'Active');

INSERT INTO users (id, full_name, email, password_hash, role, department_id, status, must_change_password) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Daniel Admin', 'daniel.admin@ena.et', '$2a$10$K9S.4nZU8ZFRc4ysC96qTuTgvbpWA.G6j59PkOOejAeFC5eIaDVyK', 'Admin', NULL, 'Active', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1'::uuid, 'Abel Manager', 'abel.manager@ena.et', '$2a$10$K9S.4nZU8ZFRc4ysC96qTuTgvbpWA.G6j59PkOOejAeFC5eIaDVyK', 'Manager', '11111111-1111-1111-1111-111111111101'::uuid, 'Active', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2'::uuid, 'Sarah Manager', 'sarah.manager@ena.et', '$2a$10$K9S.4nZU8ZFRc4ysC96qTuTgvbpWA.G6j59PkOOejAeFC5eIaDVyK', 'Manager', '11111111-1111-1111-1111-111111111102'::uuid, 'Active', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3'::uuid, 'Kebrom Manager', 'kebrom.manager@ena.et', '$2a$10$K9S.4nZU8ZFRc4ysC96qTuTgvbpWA.G6j59PkOOejAeFC5eIaDVyK', 'Manager', '11111111-1111-1111-1111-111111111103'::uuid, 'Active', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4'::uuid, 'Liya Manager', 'liya.manager@ena.et', '$2a$10$K9S.4nZU8ZFRc4ysC96qTuTgvbpWA.G6j59PkOOejAeFC5eIaDVyK', 'Manager', '11111111-1111-1111-1111-111111111104'::uuid, 'Active', true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 'Selam Reception', 'selam.reception@ena.et', '$2a$10$K9S.4nZU8ZFRc4ysC96qTuTgvbpWA.G6j59PkOOejAeFC5eIaDVyK', 'Reception', '11111111-1111-1111-1111-111111111101'::uuid, 'Active', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, 'Tesfaye Security', 'tesfaye.security@ena.et', '$2a$10$K9S.4nZU8ZFRc4ysC96qTuTgvbpWA.G6j59PkOOejAeFC5eIaDVyK', 'Security', '11111111-1111-1111-1111-111111111101'::uuid, 'Active', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid, 'Hiwot Viewer', 'hiwot.viewer@ena.et', '$2a$10$K9S.4nZU8ZFRc4ysC96qTuTgvbpWA.G6j59PkOOejAeFC5eIaDVyK', 'Viewer', NULL, 'Active', true);

UPDATE departments SET manager_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1'::uuid WHERE id = '11111111-1111-1111-1111-111111111101'::uuid;
UPDATE departments SET manager_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2'::uuid WHERE id = '11111111-1111-1111-1111-111111111102'::uuid;
UPDATE departments SET manager_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3'::uuid WHERE id = '11111111-1111-1111-1111-111111111103'::uuid;
UPDATE departments SET manager_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4'::uuid WHERE id = '11111111-1111-1111-1111-111111111104'::uuid;

INSERT INTO appointments (id, visitor_name, visitor_email, visitor_phone, directorate, location, appointment_date, appointment_time, purpose, other_visitor_names, host_user_id, department_id, status, created_by) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01'::uuid, 'John Doe', 'john@example.com', '+251912345678', 'Chief Executive Officer (CEO)', 'ENA', CURRENT_DATE, '10:00', 'Business meeting', '[]'::jsonb, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 'Confirmed', 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02'::uuid, 'Jane Smith', 'jane@example.com', '+251912345679', 'Directorate of Finance, Budget and Procurement', 'POA', CURRENT_DATE, '14:00', 'Financial review', '["Alex Smith"]'::jsonb, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2'::uuid, '11111111-1111-1111-1111-111111111102'::uuid, 'CheckedIn', 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03'::uuid, 'Michael Brown', 'michael@example.com', '+251912345680', 'Directorate of Information Communication Technology', 'Both', CURRENT_DATE + 1, '09:00', 'System implementation', '[]'::jsonb, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4'::uuid, '11111111-1111-1111-1111-111111111104'::uuid, 'Scheduled', 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04'::uuid, 'Sarah Johnson', 'sarah.j@example.com', '+251912345681', 'Directorate of Human Resource Development and Management', 'ENA', CURRENT_DATE - 1, '15:00', 'HR consultation', '[]'::jsonb, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 'CheckedOut', 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05'::uuid, 'David Lee', 'david@example.com', '+251912345682', 'Federal Desk', 'ENA', CURRENT_DATE - 2, '11:00', 'General inquiry', '[]'::jsonb, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1'::uuid, '11111111-1111-1111-1111-111111111101'::uuid, 'CheckedOut', 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa06'::uuid, 'Emma Wilson', 'emma@example.com', '+251912345683', 'Regional Desk', 'POA', CURRENT_DATE, '16:00', 'Partnership', '["Tom Wilson"]'::jsonb, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3'::uuid, '11111111-1111-1111-1111-111111111103'::uuid, 'Scheduled', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid);

INSERT INTO visitor_checkins (id, appointment_id, has_car, plate_number, has_material, materials_name, additional_visitors, badge_number, check_in_time, check_out_time, checked_in_by, checked_out_by) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccc01'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02'::uuid, true, 'AA-1234-BB', false, NULL, '["Alex Smith"]'::jsonb, 'ENA-1001', now() - interval '2 hours', now() - interval '30 minutes', 'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, 'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid),
  ('cccccccc-cccc-cccc-cccc-cccccccccc02'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04'::uuid, false, NULL, true, 'Laptop bag', '[]'::jsonb, 'ENA-1002', now() - interval '1 day', now() - interval '1 day' + interval '45 minutes', 'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, 'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid),
  ('cccccccc-cccc-cccc-cccc-cccccccccc03'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05'::uuid, true, 'ET-9999-XX', false, NULL, '[]'::jsonb, 'ENA-1003', now() - interval '2 days', now() - interval '2 days' + interval '1 hour', 'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid);

INSERT INTO audit_logs (id, action, entity_type, entity_id, user_id, old_values, new_values) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddd0001'::uuid, 'LOGIN', 'user', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1'::uuid, NULL, '{"email":"abel.manager@ena.et"}'::jsonb),
  ('dddddddd-dddd-dddd-dddd-dddddddd0002'::uuid, 'CREATE', 'appointment', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, NULL, '{"visitor_name":"John Doe"}'::jsonb),
  ('dddddddd-dddd-dddd-dddd-dddddddd0003'::uuid, 'CHECK_IN', 'visitor_checkin', 'cccccccc-cccc-cccc-cccc-cccccccccc01'::uuid, 'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, NULL, '{"appointment_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02"}'::jsonb),
  ('dddddddd-dddd-dddd-dddd-dddddddd0004'::uuid, 'UPDATE', 'appointment', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, '{"status":"Confirmed"}'::jsonb, '{"status":"CheckedIn"}'::jsonb),
  ('dddddddd-dddd-dddd-dddd-dddddddd0005'::uuid, 'CHECK_OUT', 'visitor_checkin', 'cccccccc-cccc-cccc-cccc-cccccccccc01'::uuid, 'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, '{"check_out_time":null}'::jsonb, '{"check_out_time":"set"}'::jsonb);

COMMIT;
