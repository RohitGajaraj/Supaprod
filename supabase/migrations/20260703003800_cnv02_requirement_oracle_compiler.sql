-- CNV-02: the requirement-to-oracle compiler. Acceptance criteria (a spec's
-- contract.success_metrics clauses, CNV-01) compile to eval cases for the
-- clauses an LLM judge can grade, and unverifiable clauses auto-file as
-- watched assumptions (FS-02) instead of being silently asserted.
--
-- Reuses the existing eval engine (eval_suites/eval_cases) rather than
-- inventing a parallel one: a spec's compiled eval cases live in one suite,
-- keyed by prd_id. CI-covered and UAT-checklist clauses do not get a new
-- table — Cadence cannot dynamically create GitHub Actions checks per
-- clause, so "ci" classification is inline metadata on the clause itself
-- (contract jsonb, no schema change needed for that half); "uat" adds two
-- inline fields the clause already reserves room for (oracle_kind/oracle_ref
-- from CNV-01) plus a checked/checked_at pair below.

ALTER TABLE public.eval_suites
  ADD COLUMN IF NOT EXISTS prd_id uuid REFERENCES public.prds (id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_eval_suites_prd ON public.eval_suites (prd_id) WHERE prd_id IS NOT NULL;

-- FS-02's assumptions table required a decision_id (typed rows extracted at
-- decision time). Unverifiable spec clauses are a second, equally valid
-- source: relax the FK to optional and add prd_id, so the existing
-- assumption-watch cron (watchAssumptions, keyed on workspace_id + status,
-- never touches decision_id directly) picks up spec-sourced assumptions for
-- free with zero changes to the watcher itself.
ALTER TABLE public.assumptions
  ALTER COLUMN decision_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS prd_id uuid REFERENCES public.prds (id) ON DELETE CASCADE;
ALTER TABLE public.assumptions
  DROP CONSTRAINT IF EXISTS assumptions_source_chk;
ALTER TABLE public.assumptions
  ADD CONSTRAINT assumptions_source_chk CHECK (decision_id IS NOT NULL OR prd_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_assumptions_prd ON public.assumptions (prd_id) WHERE prd_id IS NOT NULL;
