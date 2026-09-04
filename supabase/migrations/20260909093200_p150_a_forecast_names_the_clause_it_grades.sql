-- P-150 move 1: THE KEY. A forecast names the clause whose readings grade it.
--
-- ── WHY A COLUMN AND NOT A MATCHING RULE ────────────────────────────────────
-- Measured on production 2026-09-04: 6 decisions name a `forecast_metric`, 1 of
-- them carries a `prd_id`, and the 3 distinct metrics are spelt 4 ways
-- ("tablet_checkout_completion_rate" and "tablet checkout completion rate" are
-- the same metric on two decisions). Readings live on `prds.contract` clauses,
-- keyed by clause id. NOTHING JOINS THEM.
--
-- So "the readings the record holds for this metric" has no definition today,
-- and the only way to compute it without this column is to match a decision's
-- metric prose against a clause's prose. That is exactly the guess P-144 scope 3
-- refused on the record, for the reason that grading against the wrong number is
-- worse than not grading at all. A rule founded on a prose match would import
-- the defect the rule exists to remove.
--
-- ── WHY THE LINK IS WRITTEN AT PLAN AND NOT AT DECIDE ───────────────────────
-- The decision is written BEFORE the spec exists, so at `decision.record` time
-- there is no clause to name. The writer that holds both is `prd.draft` at Plan:
-- it has the track, and the track has the decision. Both sides are set in that
-- one write -- the clause says which decision's forecast it measures, and the
-- decision points back at the clause -- so the link is a recorded fact with an
-- author and a time, never a similarity computed at read time.
--
-- ── NULL IS THE HONEST DEFAULT AND MUST STAY CHEAP ──────────────────────────
-- Every one of the 204 existing decisions gets NULL, and nothing backfills them,
-- because there is no non-guessing way to say which clause any of them meant.
-- A forecast with no clause named has no readings the record can attribute to
-- it, so it is not well founded -- which is the correct answer for a forecast
-- nobody linked, and the same direction every refusal in this area takes.
ALTER TABLE public.decisions
  ADD COLUMN IF NOT EXISTS forecast_clause_id uuid;

COMMENT ON COLUMN public.decisions.forecast_clause_id IS
  'The success-metric clause in prds.contract whose readings grade this forecast. Set at Plan by the writer that holds both the decision and the spec; never matched by prose. NULL means no clause was named, so no reading can be attributed to this forecast.';

-- Read alongside `prds` on the grading path, and always by a small set of ids.
CREATE INDEX IF NOT EXISTS decisions_forecast_clause_id_idx
  ON public.decisions (forecast_clause_id)
  WHERE forecast_clause_id IS NOT NULL;
