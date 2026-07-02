-- RF-05: Playbook selection by win rate (v12 §3.2, Tier 1, Size S).
--
-- `rankPlaybooksByOutcome` (PLAYBOOK-REGISTRY, migration 20260624060000) has
-- been live and verified since v11 but nothing ever consumed it. This adds
-- one nullable column so `mission.plan` can record which playbook it bound to
-- a step (src/lib/ai/tools/orchestrator.server.ts), read back later when the
-- step reaches a terminal state to auto-record a `playbook_runs` row
-- (src/lib/ai/mission-advance.server.ts). Additive, backward compatible.

alter table public.mission_steps
  add column if not exists playbook_id text;
