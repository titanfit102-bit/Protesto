CREATE TABLE IF NOT EXISTS case_sources (
 id uuid PRIMARY KEY,
 case_id uuid NOT NULL REFERENCES civic_cases(id) ON DELETE CASCADE,
 submitted_by uuid NOT NULL REFERENCES civic_users(id),
 title varchar(160) NOT NULL CHECK (char_length(title)>=8),
 url text NOT NULL CHECK (left(url,8)='https://'),
 context varchar(700) NOT NULL CHECK (char_length(context)>=20),
 state varchar(12) NOT NULL DEFAULT 'pending' CHECK(state IN('pending','accepted','rejected')),
 reviewed_by uuid REFERENCES civic_users(id),
 reviewed_at timestamptz,
 review_note varchar(1000),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(case_id,url)
);
CREATE INDEX IF NOT EXISTS case_sources_case_state_idx ON case_sources(case_id,state,created_at);
CREATE TABLE IF NOT EXISTS case_corrections (
 id uuid PRIMARY KEY,
 case_id uuid NOT NULL REFERENCES civic_cases(id),
 author_id uuid NOT NULL REFERENCES civic_users(id),
 reason varchar(2000) NOT NULL CHECK(char_length(reason)>=30),
 counter_source_url text NOT NULL DEFAULT '',
 state varchar(12) NOT NULL DEFAULT 'pending' CHECK(state IN('pending','accepted','rejected')),
 reviewer_id uuid REFERENCES civic_users(id),
 review_note varchar(1000),
 reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS case_corrections_state_idx ON case_corrections(state,created_at);
CREATE INDEX IF NOT EXISTS case_corrections_author_idx ON case_corrections(author_id,created_at DESC);
