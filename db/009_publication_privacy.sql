-- Keep internal case narrative separate from what is intentionally released.
ALTER TABLE civic_cases ADD COLUMN IF NOT EXISTS public_title varchar(120);
ALTER TABLE civic_cases ADD COLUMN IF NOT EXISTS public_description text;
ALTER TABLE civic_cases ADD COLUMN IF NOT EXISTS public_source_url text;
