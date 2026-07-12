-- RPT-50 rung 3 (increment 1): record when a self-improvement fix is APPLIED.
--
-- The apply turns a flag's grounded suggested fix into a GOVERNED, injection-
-- screened, REVERSIBLE house_rule (live in every agent's system prompt via the
-- chokepoint) plus a receipted decision on the ledger with an outcome window --
-- closing the loop detect -> diagnose -> propose -> APPLY. These columns mark the
-- proposal as applied so the loop closes and the UI shows the applied state
-- (with what it changed) instead of re-offering the same fix. The applied change
-- is undoable through the house_rule supersession + the PC-10 rewind machinery,
-- so nothing here is one-way.

alter table public.self_improve_proposals add column if not exists applied_at timestamptz;
alter table public.self_improve_proposals add column if not exists applied_house_rule_id uuid;
