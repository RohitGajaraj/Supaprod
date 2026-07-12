-- RPT-39: trace provenance for the nightly retro agent.
--
-- The retro pass (src/routes/api/public/hooks/retro-tick.ts) drafts house rules
-- from AGENT EXECUTION TRACES (`agent_runs`) rather than from human `learnings`
-- (RF-04's source). It reuses the same review-gated `house_rules` substrate so
-- an approved rule reaches the chokepoint with zero new review UI, but it needs
-- its own provenance array: the retro cites `agent_runs.id`, not `learnings.id`.
--
-- Additive + forward-only: a plain array with a default, so every existing
-- RF-04 insert (which never sets it) keeps working unchanged, and a non-empty
-- source_run_ids is the marker that distinguishes a retro-sourced draft from an
-- outcome-distilled one (used by retro-tick's per-day idempotency guard).

alter table public.house_rules
  add column if not exists source_run_ids uuid[] not null default '{}';
