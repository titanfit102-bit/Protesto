BEGIN;
CREATE TABLE IF NOT EXISTS retraction_history (
 id uuid PRIMARY KEY,
 case_id uuid NOT NULL REFERENCES civic_cases(id),
 reviewer_id uuid NOT NULL REFERENCES civic_users(id),
 note varchar(1000) NOT NULL CHECK(char_length(note)>=20),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS retraction_history_case_idx ON retraction_history(case_id,created_at DESC);
COMMIT;
