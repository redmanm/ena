-- ENA Visitor Management System — PostgreSQL schema
-- Run: psql "$DATABASE_URL" -f scripts/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Departments first (manager_id FK added after users exist)
CREATE TABLE departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL UNIQUE,
  description text,
  manager_id uuid,
  status varchar(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name varchar(255) NOT NULL,
  email varchar(255) NOT NULL UNIQUE,
  phone_number varchar(50),
  password_hash varchar(255) NOT NULL,
  role varchar(32) NOT NULL CHECK (role IN ('Admin', 'Manager', 'Reception', 'Security', 'Viewer')),
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  status varchar(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  must_change_password boolean NOT NULL DEFAULT true,
  last_login timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Managers must belong to a department
ALTER TABLE users
  ADD CONSTRAINT users_manager_requires_department
  CHECK (role <> 'Manager' OR department_id IS NOT NULL);

ALTER TABLE departments
  ADD CONSTRAINT departments_manager_id_fkey
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

-- One manager per department + a manager can manage only one department
CREATE UNIQUE INDEX uniq_departments_manager_id ON departments (manager_id) WHERE manager_id IS NOT NULL;
CREATE UNIQUE INDEX uniq_manager_department ON users (department_id) WHERE role = 'Manager';

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_department_id ON users (department_id);
CREATE INDEX idx_users_status ON users (status);

CREATE INDEX idx_departments_manager_id ON departments (manager_id);
CREATE INDEX idx_departments_status ON departments (status);

CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name varchar(255) NOT NULL,
  visitor_email varchar(255),
  visitor_phone varchar(50),
  visitor_company varchar(255),
  location varchar(16) NOT NULL CHECK (location IN ('ENA', 'POA', 'Both')),
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  purpose text,
  other_visitor_names jsonb NOT NULL DEFAULT '[]'::jsonb,
  host_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  status varchar(32) NOT NULL DEFAULT 'Scheduled'
    CHECK (status IN ('Scheduled', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled')),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_host_user_id ON appointments (host_user_id);
CREATE INDEX idx_appointments_department_id ON appointments (department_id);
CREATE INDEX idx_appointments_created_by ON appointments (created_by);
CREATE INDEX idx_appointments_status ON appointments (status);
CREATE INDEX idx_appointments_appointment_date ON appointments (appointment_date);

CREATE TABLE visitor_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  has_car boolean NOT NULL DEFAULT false,
  plate_number varchar(50),
  has_material boolean NOT NULL DEFAULT false,
  materials_name varchar(500),
  additional_visitors jsonb NOT NULL DEFAULT '[]'::jsonb,
  badge_number varchar(50),
  check_in_time timestamptz NOT NULL DEFAULT now(),
  check_out_time timestamptz,
  checked_in_by uuid REFERENCES users(id) ON DELETE SET NULL,
  checked_out_by uuid REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_visitor_checkins_appointment_id ON visitor_checkins (appointment_id);
CREATE INDEX idx_visitor_checkins_check_in_time ON visitor_checkins (check_in_time);
CREATE INDEX idx_visitor_checkins_checked_in_by ON visitor_checkins (checked_in_by);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action varchar(64) NOT NULL,
  entity_type varchar(64) NOT NULL,
  entity_id uuid,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX idx_notifications_department_id ON notifications (department_id);
CREATE INDEX idx_notifications_read_at ON notifications (read_at);
