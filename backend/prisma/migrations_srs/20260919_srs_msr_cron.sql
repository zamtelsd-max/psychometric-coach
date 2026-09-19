-- SRS FR-8.2: stored monthly status reports
CREATE TABLE IF NOT EXISTS monthly_reports (
  id TEXT PRIMARY KEY,
  enterprise_id TEXT NOT NULL REFERENCES enterprises(id),
  month TEXT NOT NULL,
  data JSONB NOT NULL,
  emailed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uniq_enterprise_month UNIQUE (enterprise_id, month)
);
