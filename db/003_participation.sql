BEGIN;
CREATE TABLE IF NOT EXISTS civic_actions(
 id uuid PRIMARY KEY,
 author_id uuid NOT NULL REFERENCES civic_users(id),
 kind varchar(15) NOT NULL CHECK(kind IN('initiative','gathering')),
 subtype varchar(60),
 title varchar(120) NOT NULL CHECK(char_length(title)>=8),
 description text NOT NULL CHECK(char_length(description)>=25),
 area varchar(120) NOT NULL,
 event_date date,
 state varchar(15) NOT NULL DEFAULT 'pending' CHECK(state IN('pending','published','rejected','archived')),
 reviewer_id uuid REFERENCES civic_users(id),
 reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((kind='initiative' AND subtype IS NOT NULL AND event_date IS NULL) OR (kind='gathering' AND event_date IS NOT NULL AND subtype IS NULL))
);
CREATE INDEX IF NOT EXISTS civic_actions_state_date_idx ON civic_actions(state,created_at DESC);
CREATE INDEX IF NOT EXISTS civic_actions_author_date_idx ON civic_actions(author_id,created_at DESC);
CREATE TABLE IF NOT EXISTS action_reviews(
 id uuid PRIMARY KEY,
 action_id uuid NOT NULL REFERENCES civic_actions(id),
 reviewer_id uuid NOT NULL REFERENCES civic_users(id),
 decision varchar(15) NOT NULL CHECK(decision IN('published','rejected','archived')),
 note varchar(1000) NOT NULL CHECK(char_length(note)>=15),
 created_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
