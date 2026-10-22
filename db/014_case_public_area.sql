-- Public geography must be expressly reviewed; never expose raw reporter area.
-- Historical published records remain withheld until editor approves public_area.
ALTER TABLE civic_cases ADD COLUMN IF NOT EXISTS public_area varchar(80);
