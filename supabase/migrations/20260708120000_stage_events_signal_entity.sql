-- SW-5 (mission 3.1 / 3.11, deliverable C): allow entity_type = 'signal' on
-- stage_events. A sensed signal (GitHub issue/release/star, or any source) now
-- writes a stage_events row, so the DONE-WHEN "visible trail = SIG trace ref +
-- stage_events row" holds, and the Trust Ledger chain's signal node reads from
-- the same substrate as every other link.
--
-- Safe + idempotent: widening a CHECK can never fail on existing rows (every
-- current value stays valid). Drop the auto-named inline CHECK from
-- 20260707190000_stage_events_foundations.sql and recreate it with 'signal' added.

ALTER TABLE public.stage_events
  DROP CONSTRAINT IF EXISTS stage_events_entity_type_check;

ALTER TABLE public.stage_events
  ADD CONSTRAINT stage_events_entity_type_check
  CHECK (entity_type IN ('spec', 'mission', 'opportunity', 'theme', 'decision', 'goal', 'loop', 'signal'));
