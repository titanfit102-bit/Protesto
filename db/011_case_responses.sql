-- Unverified citizen responses. Do not represent submitters as institutions.
CREATE TABLE IF NOT EXISTS case_responses (
 id uuid PRIMARY KEY,
 case_id uuid NOT NULL REFERENCES civic_cases(id),
 author_id uuid NOT NULL REFERENCES civic_users(id),
 body varchar(1800) NOT NULL CHECK (char_length(body)>=40),
 source_url text NOT NULL DEFAULT '',
 state varchar(10) NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','accepted','rejected')),
 public_body varchar(1800),
 reviewer_id uuid REFERENCES civic_users(id),
 review_note varchar(1000),
 reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (case_id,author_id),
 CHECK (state<>'accepted' OR public_body IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS case_responses_state_time_idx ON case_responses(state,created_at);
