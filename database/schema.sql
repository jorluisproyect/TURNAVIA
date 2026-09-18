-- TURNAVIA MVP - PostgreSQL / Neon
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('MASTER','CLINIC_ADMIN','RECEPTION','DOCTOR','PATIENT');
CREATE TYPE appointment_status AS ENUM ('PENDING','AWAITING_PAYMENT','PAYMENT_REVIEW','PAYMENT_REJECTED','CONFIRMED','ON_THE_WAY','ARRIVED','IN_CONSULTATION','COMPLETED','CANCELLED','NO_SHOW');
CREATE TYPE doctor_day_status AS ENUM ('NORMAL','DELAYED','SUSPENDED');
CREATE TYPE subscription_status AS ENUM ('TRIAL','ACTIVE','PAST_DUE','CANCELLED');

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  type text NOT NULL DEFAULT 'CLINIC',
  phone text,
  email text,
  logo_url text,
  subscription_status subscription_status NOT NULL DEFAULT 'TRIAL',
  monthly_price numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  city text,
  state text,
  country text DEFAULT 'Venezuela',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  role user_role NOT NULL,
  full_name text NOT NULL,
  email text UNIQUE,
  phone text,
  password_hash text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  public_slug text UNIQUE NOT NULL,
  specialty text NOT NULL,
  license_number text,
  bio text,
  default_appointment_minutes integer NOT NULL DEFAULT 30 CHECK (default_appointment_minutes > 0),
  accepts_online_booking boolean NOT NULL DEFAULT true,
  consultation_price numeric(10,2) NOT NULL DEFAULT 0,
  consultation_currency text NOT NULL DEFAULT 'USD',
  payment_instructions text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE doctor_locations (
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  room text,
  PRIMARY KEY (doctor_id, location_id)
);

CREATE TABLE availability_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  slot_minutes integer NOT NULL DEFAULT 30,
  max_patients integer,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE TABLE patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  national_id text,
  phone text NOT NULL,
  email text,
  birth_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  location_id uuid NOT NULL REFERENCES locations(id),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status appointment_status NOT NULL DEFAULT 'CONFIRMED',
  source text NOT NULL DEFAULT 'PATIENT_WEB',
  reason_short text,
  cancellation_reason text,
  created_by_user_id uuid REFERENCES users(id),
  consultation_price numeric(10,2),
  consultation_currency text NOT NULL DEFAULT 'USD',
  payment_method text,
  payment_reference text,
  payment_proof_url text,
  payment_submitted_at timestamptz,
  payment_approved_at timestamptz,
  reschedule_used boolean NOT NULL DEFAULT false,
  policy_accepted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
CREATE INDEX appointments_doctor_start_idx ON appointments(doctor_id, starts_at);
CREATE INDEX appointments_patient_start_idx ON appointments(patient_id, starts_at);

CREATE TABLE doctor_status_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  work_date date NOT NULL DEFAULT current_date,
  status doctor_day_status NOT NULL DEFAULT 'NORMAL',
  delay_minutes integer NOT NULL DEFAULT 0,
  note text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (doctor_id, work_date)
);

CREATE TABLE waitlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  desired_date date NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES doctors(id) ON DELETE CASCADE,
  plan_code text NOT NULL,
  monthly_price numeric(10,2) NOT NULL,
  status subscription_status NOT NULL DEFAULT 'TRIAL',
  started_at timestamptz NOT NULL DEFAULT now(),
  next_billing_at timestamptz,
  CHECK ((organization_id IS NOT NULL) <> (doctor_id IS NOT NULL))
);

CREATE TABLE audit_events (
  id bigserial PRIMARY KEY,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Comercialización / prueba / pagos (fase operativa)
CREATE TYPE payment_provider AS ENUM ('PAYPAL','BINANCE');
CREATE TYPE payment_status AS ENUM ('PENDING','UNDER_REVIEW','COMPLETED','FAILED','REFUNDED');

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS activation_price numeric(10,2);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  provider payment_provider NOT NULL,
  provider_reference text,
  customer_reference text,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status payment_status NOT NULL DEFAULT 'PENDING',
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS payments_org_created_idx ON payments(organization_id, created_at DESC);
