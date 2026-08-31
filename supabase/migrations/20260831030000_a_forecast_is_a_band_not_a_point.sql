-- A FORECAST IS A BAND, NOT A POINT — gap #15.
--
-- ── THE FINDING UNDERNEATH THE GAP, AND IT IS WORSE THAN "NO BAND" ────────
-- Measured 2026-08-31: `decisions` carries eleven `forecast_*` columns and NOT
-- ONE OF THEM HOLDS A NUMBER. `forecast_claim` is text, `forecast_how_we_will_know`
-- is text, `forecast_horizon_date` is a date. So a forecast today is PROSE plus a
-- deadline, and the grader can only ask a model to judge a sentence.
--
-- That is why the grader "has processed zero workspaces in its life" (F-51). It
-- was never short of a band; it was short of anything to compute WITH.
--
-- ── WHY THE BAND LIVES ON THE DECISION AND THERE IS NO `bands.yaml` ───────
-- Anthropic put thresholds in a service-level file. Ours belong to the decision:
-- every forecast has its own metric, its own horizon and its own tiers, and a
-- workspace-level default is a fallback rather than the record
-- (`SPEC-STATION-MODEL-AND-ARTIFACTS.md` §2.6).
--
-- ── DIRECTION IS EXPLICIT BECAUSE INFERRING IT IS A GUESS ─────────────────
-- "Abandonment falls below 5%" is lower-is-better; "conversion reaches 12%" is
-- higher-is-better. It could be inferred from predicted-vs-baseline, and that
-- inference is wrong exactly when the two are equal — which is a real forecast
-- ("hold the line"). One column removes a guess from the one place the product
-- is graded.
--
-- ── AND THE HONESTY GUARD IS A COLUMN, NOT A CONVENTION ───────────────────
-- `forecast_observations` records how many readings the baseline came from.
-- §3 B: "a band derived from fewer than N observations must say so; a tier that
-- fires on noise is theatre and gets the feature deleted rather than fixed."
-- A band that cannot say how well-founded it is will be trusted as if it were.
--
-- Every column is NULLABLE and nothing backfills. 369 decisions predate this and
-- a forecast written as prose is still a forecast; inventing numbers for them
-- would be seeding the one table whose credibility is the product.
ALTER TABLE public.decisions
  ADD COLUMN IF NOT EXISTS forecast_metric            text,
  ADD COLUMN IF NOT EXISTS forecast_direction         text,
  ADD COLUMN IF NOT EXISTS forecast_baseline          numeric,
  ADD COLUMN IF NOT EXISTS forecast_predicted         numeric,
  ADD COLUMN IF NOT EXISTS forecast_band_drifting_at  numeric,
  ADD COLUMN IF NOT EXISTS forecast_band_missed_at    numeric,
  ADD COLUMN IF NOT EXISTS forecast_observations      integer,
  ADD COLUMN IF NOT EXISTS forecast_if_drifting       text,
  ADD COLUMN IF NOT EXISTS forecast_if_missed         text;
