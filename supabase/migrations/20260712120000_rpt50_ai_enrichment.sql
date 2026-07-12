-- RPT-50 (AI rung): grounded, on-demand enrichment cache for self-improvement proposals.
--
-- The DETERMINISTIC flag (title/detail/evidence) stays the load-bearing core -- it
-- decides WHETHER something is a problem, from a real number over a real sample, and
-- never calls the AI. This layer adds an optional, human-triggered, CITED AI
-- explanation ("why this is happening") + suggested fix, grounded ONLY in the real
-- records behind the flag. It is cached on the proposal row so the AI call runs at
-- most once per proposal (cost-controlled -- on demand, not bulk-nightly for every
-- workspace), and is null until a human asks for it. The AI never invents a flag or
-- changes its severity; it only explains one the numbers already earned.

alter table public.self_improve_proposals add column if not exists ai_explanation text;
alter table public.self_improve_proposals add column if not exists ai_suggested_fix text;
-- How many real records the AI explanation was grounded on (0 = it declined to guess).
alter table public.self_improve_proposals add column if not exists ai_grounded_on integer;
alter table public.self_improve_proposals add column if not exists ai_enriched_at timestamptz;
