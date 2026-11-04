CREATE TABLE IF NOT EXISTS contact_rate_limits (
  key_hash TEXT PRIMARY KEY,
  bucket INTEGER NOT NULL,
  attempts INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS contact_rate_limits_seen ON contact_rate_limits(last_seen_at);
