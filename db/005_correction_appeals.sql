CREATE TABLE IF NOT EXISTS correction_appeals(
 id uuid PRIMARY KEY,
 correction_id uuid NOT NULL UNIQUE REFERENCES case_corrections(id),
 author_id uuid NOT NULL REFERENCES civic_users(id),
 reason varchar(2000) NOT NULL CHECK(char_length(reason)>=30),
 state varchar(12) NOT NULL DEFAULT 'pending' CHECK(state IN('pending','accepted','rejected')),
 reviewer_id uuid REFERENCES civic_users(id),
 review_note varchar(1000),
 created_at timestamptz NOT NULL DEFAULT now(),
 reviewed_at timestamptz
);
CREATE INDEX IF NOT EXISTS correction_appeals_state_idx ON correction_appeals(state,created_at ASC);
CREATE INDEX IF NOT EXISTS correction_appeals_author_idx ON correction_appeals(author_id,created_at DESC);
