-- SW-6 (mission 3.12, cold start): auto-sensing is ON for every NEW workspace.
--
-- WHY: the audit found the connect -> ingest link dead for real signups: all
-- pull ingestion runs only inside sense-tick, which filters on
-- auto_sense_enabled = true, and that column defaulted false with no setter
-- anywhere in the product (only the two demo accounts were flipped on, by
-- migration). Every real user who connected a source waited forever with zero
-- signals. sense-tick itself is rule-based (no AI spend) and bounded (5
-- workspaces/tick, 50 updates each); the downstream AI pipeline is bounded by
-- the default spend caps that 20260707195000_sw6_fresh_workspace_guards.sql
-- seeds for every user. Ordering: guards (195000) < crons (202000) < this
-- (203000), so activation can never apply without the guards.
--
-- Scope: DEFAULT only, so it binds for workspaces created from now on.
-- Existing real workspaces are armed at connect time by kickFirstIngest
-- (first-ingest.server.ts), which is the moment the user expresses intent,
-- rather than by a blanket backfill here.

alter table public.workspaces
  alter column auto_sense_enabled set default true;
