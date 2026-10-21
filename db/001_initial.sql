CREATE TABLE IF NOT EXISTS civic_users (
 id uuid PRIMARY KEY,
 email text NOT NULL UNIQUE CHECK (email=lower(email)),
 password_hash text NOT NULL,
 role text NOT NULL CHECK(role IN ('reporter','reviewer','admin')),
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash text PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES civic_users(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS civic_cases (
 id uuid PRIMARY KEY,
 author_id uuid NOT NULL REFERENCES civic_users(id),
 title varchar(120) NOT NULL CHECK(char_length(title)>=8),
 description text NOT NULL CHECK(char_length(description)>=25),
 area varchar(80) NOT NULL,
 category varchar(60) NOT NULL,
 source_url text NOT NULL DEFAULT '',
 state text NOT NULL DEFAULT 'pending' CHECK(state IN('pending','published','rejected','archived')),
 created_at timestamptz NOT NULL DEFAULT now(),
 reviewed_at timestamptz,
 reviewed_by uuid REFERENCES civic_users(id)
);
CREATE INDEX IF NOT EXISTS civic_cases_author_date_idx ON civic_cases(author_id,created_at DESC);
CREATE INDEX IF NOT EXISTS civic_cases_state_date_idx ON civic_cases(state,created_at DESC);
CREATE TABLE IF NOT EXISTS review_history (
 id uuid PRIMARY KEY,
 case_id uuid NOT NULL REFERENCES civic_cases(id),
 reviewer_id uuid NOT NULL REFERENCES civic_users(id),
 decision text NOT NULL CHECK(decision IN('published','rejected')),
 note varchar(1000) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_entries (
 id uuid PRIMARY KEY,
 actor_id uuid REFERENCES civic_users(id),
 action varchar(80) NOT NULL,
 object_type varchar(40) NOT NULL,
 object_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_entries_date_idx ON audit_entries(created_at DESC);
