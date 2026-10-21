CREATE TABLE IF NOT EXISTS request_rate_limits (
 key_hash char(64) PRIMARY KEY,
 hits integer NOT NULL CHECK (hits>0),
 expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS request_rate_limits_expiry_idx ON request_rate_limits(expires_at);
