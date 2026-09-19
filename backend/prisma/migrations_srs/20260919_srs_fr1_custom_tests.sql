-- SRS FR-1: custom tests + candidate invite links
CREATE TABLE IF NOT EXISTS custom_tests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL REFERENCES users(id),
  question_ids TEXT[] NOT NULL DEFAULT '{}',
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  link_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS test_links (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  test_id TEXT NOT NULL REFERENCES custom_tests(id),
  candidate_email TEXT NOT NULL,
  candidate_name TEXT,
  responses JSONB,
  used_count INTEGER NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ,
  invite_sent_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
