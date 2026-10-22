-- A declaration about PDF bytes reviewed locally by an authorized editor.
-- No PDF content is uploaded or stored by this migration.
CREATE TABLE IF NOT EXISTS source_fingerprints (
 source_id uuid PRIMARY KEY REFERENCES case_sources(id) ON DELETE CASCADE,
 sha256_hex char(64) NOT NULL CHECK(sha256_hex ~ '^[0-9a-f]{64}$'),
 byte_length integer NOT NULL CHECK(byte_length BETWEEN 5 AND 8388608),
 media_type text NOT NULL CHECK(media_type='application/pdf'),
 reviewed_by uuid NOT NULL REFERENCES civic_users(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
-- Prevent silently editing an existing declaration. Authorized retention deletion
-- remains possible; this is not an external immutable timestamp or notarization.
CREATE FUNCTION reject_source_fingerprint_update() RETURNS trigger AS $$
BEGIN
 RAISE EXCEPTION 'Source fingerprint attestations cannot be edited';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER source_fingerprint_no_update BEFORE UPDATE ON source_fingerprints
FOR EACH ROW EXECUTE FUNCTION reject_source_fingerprint_update();
