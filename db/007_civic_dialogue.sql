-- Original Protesto dialogue schema. No code imported from Polis.
CREATE TABLE IF NOT EXISTS dialogue_topics (
 id uuid PRIMARY KEY,
 case_id uuid NOT NULL REFERENCES civic_cases(id),
 created_by uuid NOT NULL REFERENCES civic_users(id),
 title varchar(140) NOT NULL CHECK(char_length(title)>=8),
 description varchar(1200) NOT NULL CHECK(char_length(description)>=35),
 state varchar(12) NOT NULL DEFAULT 'open' CHECK(state IN('open','closed')),
 created_at timestamptz NOT NULL DEFAULT now(),
 closed_at timestamptz,
 closed_by uuid REFERENCES civic_users(id)
);
CREATE INDEX IF NOT EXISTS dialogue_topics_case_idx ON dialogue_topics(case_id,created_at DESC);
CREATE TABLE IF NOT EXISTS dialogue_statements (
 id uuid PRIMARY KEY,
 topic_id uuid NOT NULL REFERENCES dialogue_topics(id),
 author_id uuid NOT NULL REFERENCES civic_users(id),
 body varchar(360) NOT NULL CHECK(char_length(body)>=25),
 state varchar(12) NOT NULL DEFAULT 'pending' CHECK(state IN('pending','accepted','rejected')),
 reviewed_by uuid REFERENCES civic_users(id),
 reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dialogue_statements_topic_idx ON dialogue_statements(topic_id,state,created_at);
CREATE INDEX IF NOT EXISTS dialogue_statements_queue_idx ON dialogue_statements(state,created_at);
CREATE TABLE IF NOT EXISTS dialogue_reviews (
 id uuid PRIMARY KEY,
 statement_id uuid NOT NULL UNIQUE REFERENCES dialogue_statements(id),
 reviewer_id uuid NOT NULL REFERENCES civic_users(id),
 decision varchar(12) NOT NULL CHECK(decision IN('accepted','rejected')),
 note varchar(1000) NOT NULL CHECK(char_length(note)>=20),
 created_at timestamptz NOT NULL DEFAULT now()
);
-- HMAC per statement/account rather than direct voter_id. Pseudonymous, NOT anonymous.
CREATE TABLE IF NOT EXISTS dialogue_votes (
 statement_id uuid NOT NULL REFERENCES dialogue_statements(id),
 voter_key char(64) NOT NULL,
 choice varchar(10) NOT NULL CHECK(choice IN('agree','disagree','pass')),
 consent_version varchar(12) NOT NULL DEFAULT 'v1',
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(statement_id,voter_key)
);
CREATE TABLE IF NOT EXISTS dialogue_results (
 statement_id uuid PRIMARY KEY REFERENCES dialogue_statements(id),
 participants integer NOT NULL CHECK(participants>=10),
 agree_count integer NOT NULL CHECK(agree_count>=0),
 disagree_count integer NOT NULL CHECK(disagree_count>=0),
 pass_count integer NOT NULL CHECK(pass_count>=0),
 finalized_at timestamptz NOT NULL DEFAULT now(),
 CHECK(participants=agree_count+disagree_count+pass_count)
);
