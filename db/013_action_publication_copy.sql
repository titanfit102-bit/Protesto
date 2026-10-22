-- Source citizen action fields stay private until separate editorial approval.
ALTER TABLE civic_actions ADD COLUMN IF NOT EXISTS public_title varchar(120);
ALTER TABLE civic_actions ADD COLUMN IF NOT EXISTS public_description text;
ALTER TABLE civic_actions ADD COLUMN IF NOT EXISTS public_area varchar(120);
ALTER TABLE civic_actions ADD CONSTRAINT civic_actions_public_copy_check CHECK(
 (public_title IS NULL AND public_description IS NULL AND public_area IS NULL)
 OR (public_title IS NOT NULL AND public_description IS NOT NULL AND public_area IS NOT NULL)
);
