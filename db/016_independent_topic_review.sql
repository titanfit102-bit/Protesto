-- Reviewer-created topics are private until a different reviewer approves.
-- Existing topics are not automatically approved.
ALTER TABLE dialogue_topics ADD COLUMN IF NOT EXISTS review_state varchar(10) NOT NULL DEFAULT 'pending'
 CHECK (review_state IN ('pending','approved','rejected'));
ALTER TABLE dialogue_topics ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES civic_users(id);
ALTER TABLE dialogue_topics ADD COLUMN IF NOT EXISTS review_note varchar(1000);
ALTER TABLE dialogue_topics ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
CREATE INDEX IF NOT EXISTS dialogue_topic_review_queue_idx
 ON dialogue_topics(created_at) WHERE review_state='pending';
