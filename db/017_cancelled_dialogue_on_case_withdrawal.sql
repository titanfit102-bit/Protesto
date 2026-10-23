-- Introduce an explicit case-withdrawal cancellation state for dialogue topics.
-- Existing 007 migration remains checksum-protected; this is additive.
ALTER TABLE dialogue_topics DROP CONSTRAINT dialogue_topics_state_check;
ALTER TABLE dialogue_topics ADD CONSTRAINT dialogue_topics_state_check
 CHECK (state IN ('open','closed','cancelled'));
ALTER TABLE dialogue_topics ADD COLUMN cancelled_at timestamptz;
ALTER TABLE dialogue_topics ADD COLUMN cancelled_by uuid REFERENCES civic_users(id);
ALTER TABLE dialogue_topics ADD CONSTRAINT dialogue_topics_cancellation_metadata_check
 CHECK (
  (state='cancelled' AND cancelled_at IS NOT NULL AND cancelled_by IS NOT NULL)
  OR
  (state<>'cancelled' AND cancelled_at IS NULL AND cancelled_by IS NULL)
 );
