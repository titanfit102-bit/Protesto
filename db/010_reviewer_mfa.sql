-- Per-account MFA is staged, not enabled globally until reviewer enrollment.
ALTER TABLE civic_users ADD COLUMN IF NOT EXISTS totp_secret_encrypted text;
ALTER TABLE civic_users ADD COLUMN IF NOT EXISTS totp_last_counter bigint NOT NULL DEFAULT -1;
ALTER TABLE civic_users ADD CONSTRAINT totp_reviewer_only CHECK (
 totp_secret_encrypted IS NULL OR role IN ('reviewer','admin')
);
