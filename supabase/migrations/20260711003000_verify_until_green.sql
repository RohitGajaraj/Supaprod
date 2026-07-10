-- PC-07 goal-until-verified missions: the verify-cycle counter.
--
-- A mission whose PRD carries a compiled Outcome Contract (CNV-02 oracle
-- clauses) no longer completes on "all steps terminal" alone: a separate
-- verifier pass evaluates the oracle checklist first, and a failing checklist
-- dispatches a corrective cycle instead of completing. verify_cycles counts
-- those corrective dispatches; the engine hard-caps them at 3 so a mission
-- can never loop forever. No mode flag is needed — "the PRD has a compiled
-- contract" IS the qualifier (resolved at completion time), exactly the
-- PC-07 design.
alter table public.missions
  add column if not exists verify_cycles integer not null default 0;

comment on column public.missions.verify_cycles is
  'PC-07: corrective verify-until-green cycles dispatched for this mission (hard cap 3, enforced in verify-green.server.ts).';
