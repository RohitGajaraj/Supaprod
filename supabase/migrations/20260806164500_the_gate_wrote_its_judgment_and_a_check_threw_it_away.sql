-- THE GATE WROTE ITS JUDGMENT AND A CHECK CONSTRAINT THREW IT AWAY, SILENTLY.
--
-- WHAT HAPPENED. `recordJudgment` (src/lib/discovery.functions.ts) inserts a
-- `decisions` row with `source_kind = 'opportunity'` -- the provenance token
-- for the one act /decide exists to capture, a human keeping or dropping a
-- bet. `decisions_source_kind_check` does not admit that value. Measured live
-- on 2026-08-06 with pg_get_constraintdef:
--
--   CHECK (source_kind IS NULL OR source_kind = ANY (ARRAY[
--     'meeting','mission','prd','manual','roadmap','retrospective','critic']))
--
-- So every insert from the gate is refused by the database. supabase-js
-- RESOLVES a refused write rather than throwing, and `recordJudgment` returns
-- early on the error by design so that a bookkeeping failure can never block a
-- person settling a bet. The two behaviours compose into silence: the keystroke
-- succeeds, the person sees the bet move, and nothing is written.
--
-- HOW LONG. Since the "Drop it" caller was written. Live counts today: 267
-- decisions rows -- mission 183, roadmap 28, prd 28, manual 10, critic 8,
-- retrospective 8, meeting 2 -- and ZERO with source_kind 'opportunity'. That
-- zero was read by an earlier audit as "the gate has no caller". It had one.
-- The caller worked and the constraint discarded its output on every press.
--
-- WHY IT IS WORTH A MIGRATION IN LAUNCH WEEK. Deciding is the highest-stakes
-- human act in the product and the richest signal it generates: a person
-- weighing evidence and choosing. The Critic loads precedent out of `decisions`
-- and Learn grades an outcome against the call that caused it, so with this
-- constraint in place neither layer can ever see a judgment made at the gate --
-- the moat's best input, dropped at the moment it is produced.
--
-- WHY 'opportunity' AND NOT AN EXISTING TOKEN. `decisions` has no
-- opportunity_id column (verified: the only artifact FKs are meeting_id,
-- mission_id, prd_id, product_id). `source_kind` is therefore the only place
-- the bet-shaped provenance can live, and reusing 'manual' would file an
-- assembled sentence as something a person typed. The lineage edge
-- (parent_kind 'opportunity') carries the id; this carries the kind.
--
-- FORWARD-ONLY AND WIDENING. Every one of the 267 existing rows already
-- satisfies the new predicate, so the recreate validates without touching data
-- and nothing that was legal becomes illegal. The old constraint is dropped
-- only to be replaced in the same statement pair; Postgres has no ALTER
-- CONSTRAINT for a CHECK predicate.

alter table public.decisions
  drop constraint if exists decisions_source_kind_check;

alter table public.decisions
  add constraint decisions_source_kind_check
  check (
    source_kind is null
    or source_kind = any (array[
      'meeting','mission','prd','manual','roadmap','retrospective','critic','opportunity'
    ])
  );

comment on column public.decisions.source_kind is
  'Where this call came from. ''opportunity'' is the judgment gate on /decide: a human '
  'keeping or dropping a bet, with the rationale assembled from the bet''s own columns '
  'by judgmentFor() rather than typed. Added 2026-08-06 -- until then the gate''s '
  'inserts were refused by this CHECK and swallowed, so no judgment made at the gate '
  'has ever been stored. Any surface mapping this column to a label must handle every '
  'token in the CHECK: SOURCE_LABEL (src/components/knowledge/decisions-shared.ts) '
  'covers only meeting/mission/prd/manual today, so 44 existing rows already fall '
  'through it and this adds a ninth token to the same gap.';
