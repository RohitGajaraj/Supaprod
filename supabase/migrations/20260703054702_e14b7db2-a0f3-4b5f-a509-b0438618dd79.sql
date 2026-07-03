ALTER TABLE public.prds
  ADD COLUMN IF NOT EXISTS contract jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS contract_migrated_at timestamptz;