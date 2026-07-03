alter table public.mission_steps add column if not exists playbook_id text;

ALTER TABLE public.eval_suites ADD COLUMN IF NOT EXISTS prd_id uuid REFERENCES public.prds (id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_eval_suites_prd ON public.eval_suites (prd_id) WHERE prd_id IS NOT NULL;

ALTER TABLE public.assumptions
  ALTER COLUMN decision_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS prd_id uuid REFERENCES public.prds (id) ON DELETE CASCADE;
ALTER TABLE public.assumptions DROP CONSTRAINT IF EXISTS assumptions_source_chk;
ALTER TABLE public.assumptions ADD CONSTRAINT assumptions_source_chk CHECK (decision_id IS NOT NULL OR prd_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_assumptions_prd ON public.assumptions (prd_id) WHERE prd_id IS NOT NULL;