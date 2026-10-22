-- Separate unreviewed originals from explicitly reviewed public text.
-- Legacy content defaults to NULL and is not automatically exposed.
ALTER TABLE dialogue_topics ADD COLUMN IF NOT EXISTS public_title varchar(140);
ALTER TABLE dialogue_topics ADD COLUMN IF NOT EXISTS public_description varchar(1200);
ALTER TABLE dialogue_topics ADD CONSTRAINT dialogue_topic_public_pair CHECK (
 (public_title IS NULL AND public_description IS NULL)
 OR (public_title IS NOT NULL AND public_description IS NOT NULL)
);
ALTER TABLE dialogue_statements ADD COLUMN IF NOT EXISTS public_body varchar(360);
