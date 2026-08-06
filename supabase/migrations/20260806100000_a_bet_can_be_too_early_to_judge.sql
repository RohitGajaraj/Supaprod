-- "TOO EARLY TO TELL" HAD NOWHERE TO LIVE, SO THE ONLY EXITS WERE VERDICTS.
--
-- WHAT WAS FOUND. `learnings.verdict` is constrained to exactly
-- validated | missed | mixed. Three permanent judgments and no fourth door. A
-- person looking at a bet that shipped last week -- or one whose metric has not
-- moved because nothing could have moved it yet -- had to pick one of those
-- three or abandon the queue and leave the bet sitting on the desk.
--
-- WHY THAT IS A MOAT DEFECT RATHER THAN A UI GAP. Those rows ARE the precedent
-- pool: `getFocusNext` and the Decide ranking read settled outcomes to re-rank
-- the next call. Recording "it did not work" about a bet that has not had time
-- to work teaches the brain something false, and the product's whole claim is
-- that it learns from this record. A wrong verdict does not sit still, it
-- compounds into every later recommendation.
--
-- WHY NOT A FOURTH VERDICT VALUE. Adding `too_early` to that CHECK would put a
-- row in the precedent pool that every consumer must remember to exclude. That
-- is the `is_sample` defect this repo has already paid for twice: a value whose
-- correctness depends on every future reader remembering it exists. A deferral
-- is the ABSENCE of an outcome, not a kind of outcome, and it should not be
-- stored where outcomes are stored.
--
-- WHY NOT `launch_plans.check_by`, WHICH ALREADY EXISTED. That was the first fix
-- and it has a hole. `launch_plans` rows are created by the user-triggered
-- "generate launch plan" action, not guaranteed at ship time, and
-- `launch_plans.positioning` is NOT NULL and AI-generated, so a row cannot be
-- conjured to defer against. `rearmOutcomeCheck` does
-- `.update(...).eq("prd_id", ...).single()`, which THROWS on zero rows -- so
-- pressing "Too early to tell" on a freshly shipped spec with no launch plan
-- would error, which is precisely the case the button exists to serve.
--
-- THE CHECK BELONGS ON THE THING BEING CHECKED. A spec row always exists for a
-- shipped spec, by definition.

alter table public.prds
  add column if not exists outcome_check_by timestamptz,
  add column if not exists outcome_deferred_at timestamptz,
  add column if not exists outcome_deferred_count integer not null default 0;

comment on column public.prds.outcome_check_by is
  'When this shipped spec should come back to the Learn desk. NULL means due now. '
  'A future value is how the product says "too early to tell" WITHOUT writing a '
  'verdict, because a deferral is the absence of an outcome rather than a kind '
  'of one, and learnings rows feed the ranking.';

comment on column public.prds.outcome_deferred_count is
  'How many times a person has looked at this bet and said it was too early. '
  'This is SIGNAL, not bookkeeping: a bet deferred repeatedly is one whose metric '
  'never moves, which is worth surfacing rather than hiding. Zero for every bet '
  'settled first time.';

-- Carry over what the old mechanism already knew, so nothing that is currently
-- deferred springs back onto the desk the moment this ships. `launch_plans` is
-- one-row-per-prd, so there is nothing to aggregate.
update public.prds p
set outcome_check_by = lp.check_by
from public.launch_plans lp
where lp.prd_id = p.id
  and lp.check_by is not null
  and p.outcome_check_by is null;

-- The Learn desk reads exactly this: shipped, unsettled, and due. Partial,
-- because settled specs are the overwhelming majority over time and they are
-- never on the desk again.
create index if not exists prds_outcome_due_idx
  on public.prds (workspace_id, outcome_check_by)
  where outcome is null and shipped_at is not null;
