-- SRS Addendum (2026-09) — schema per spec §2
CREATE TYPE badge_tier_level AS ENUM ('NONE', 'GOLD', 'PLATINUM');
CREATE TYPE discount_coupon_type AS ENUM ('PERCENTAGE', 'FLAT_FIXED');

ALTER TABLE enterprises
  ADD COLUMN IF NOT EXISTS dodo_subscription_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_trial_active BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_paid_subscriber BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS coupons (
  coupon_code TEXT PRIMARY KEY,
  discount_type discount_coupon_type NOT NULL,
  discount_value NUMERIC(10,2) NOT NULL,
  dodo_price_override_id TEXT,
  expires_at TIMESTAMPTZ,
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_certifications (
  certification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  exam_score NUMERIC(5,2) NOT NULL CHECK (exam_score >= 0.00 AND exam_score <= 100.00),
  badge_tier badge_tier_level NOT NULL DEFAULT 'NONE',
  certified_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_employee_course_cert UNIQUE (employee_id, course_id)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS xp_points INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS localization_assets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  region TEXT NOT NULL,
  token TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uniq_region_token UNIQUE (region, token)
);
