-- Raw source titles and links are never automatically public.
-- Historical accepted rows keep NULL approved metadata until a fresh review.
ALTER TABLE case_sources ADD COLUMN IF NOT EXISTS public_title varchar(160);
ALTER TABLE case_sources ADD COLUMN IF NOT EXISTS public_url text;
ALTER TABLE case_sources ADD CONSTRAINT case_sources_public_pair_check
 CHECK ((public_title IS NULL) = (public_url IS NULL));
