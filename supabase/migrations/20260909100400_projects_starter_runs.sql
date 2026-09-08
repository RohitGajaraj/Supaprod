-- Lane 3, 2026-09-08: a fresh product's first three run sentences, written once
-- and kept on the product row (Lane 1's item 3, the home after FirstRun).
--
-- ── WHY A COLUMN ─────────────────────────────────────────────────────────────
-- After FirstRun the home is an invitation over nothing: ExampleJobs draws only
-- when evidence has arrived, and none has. The first thing the machine can do
-- for a new product is read what the person said about it (its name and north
-- star) and offer three runs worth starting, each with why. That is one model
-- call, made once, so the read the home makes is a row read and the home can
-- show the wait as the agent's first visible work ("Reading what you said about
-- Prism") rather than a blank.
--
-- ── SHAPE ────────────────────────────────────────────────────────────────────
-- starter_runs: { "runs": [ { "sentence": "...", "why": "..." } ] } with at most
-- three entries; NULL until generated. starter_runs_at: when it was written, so
-- a stale set can be told from a fresh one and a regeneration is a dated fact.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS starter_runs jsonb,
  ADD COLUMN IF NOT EXISTS starter_runs_at timestamptz;

COMMENT ON COLUMN public.projects.starter_runs IS
  'Up to three run sentences for a fresh product, generated once from its name and north star: {"runs":[{"sentence","why"}]}. NULL until generated.';
COMMENT ON COLUMN public.projects.starter_runs_at IS
  'When starter_runs was written. NULL until generated.';
