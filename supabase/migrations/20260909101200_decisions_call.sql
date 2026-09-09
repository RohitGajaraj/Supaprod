-- WHICH WAY THE DECISION WENT, AS ITS OWN COLUMN.
--
-- `decisions.status` was carrying two facts at once: whether the RECORD was
-- approved, and which way the CALL went. `decision.record` collapsed them --
-- `status: a.call === 'do-not-build' && gate.status === 'approved' ? 'declined'
-- : gate.status` -- so a decline that was not auto-approved lost its direction
-- entirely, and an approved decline became indistinguishable, structurally,
-- from an approval of a yes. The direction survived only in the title's first
-- word.
--
-- Measured 2026-09-09 (worktree-1-68, confirmed here): of 61 agent-written
-- decisions, 41 are `approved` and 16 of those have a title that reads as a
-- refusal; 20 are `declined`. `intent` exists and is non-null on 5 rows out of
-- 422, so it is not this field and never was. Reading the direction off the
-- title is the trap this repo has now been bitten by twice: it works until a
-- model rewords, and an absent line looks exactly like a run that did not need
-- one.
--
-- WHY IT MATTERS MORE THAN DISPLAY. 31 runs decided decline-or-wait at Decide
-- and 11 of them filed a spec, a design or a code change afterwards. Whatever
-- dispatches Plan cannot read the direction either. That is not proof of cause
-- and this migration does not claim it; it is that the information needed to
-- avoid it is not in the row.
alter table public.decisions add column if not exists "call" text;

alter table public.decisions drop constraint if exists decisions_call_check;
alter table public.decisions add constraint decisions_call_check
  check ("call" is null or "call" in ('build', 'do-not-build'));

comment on column public.decisions."call" is
  'Which way the call went: build, or do-not-build. NULL means the direction was never recorded, which is not the same as build. Independent of status, which is the approval state of the record.';

-- ── THE BACKFILL FILLS ONLY WHAT IS CERTAIN ─────────────────────────────────
--
-- Two sources, both facts rather than readings of prose, and everything else
-- stays NULL. A guessed direction is worse than an absent one: absent says "we
-- do not know", and a guess says the opposite of what happened 16 times.
--
-- 1. The tool call that wrote the row. `decision.record` records its own `call`
--    argument in `tool_calls.args`, so where the recorded title still matches
--    exactly, the model's own answer is on file. 27 of 61 match.
update public.decisions d
set "call" = tc.call
from (
  select distinct on (t.args->>'title') t.args->>'title' as title, t.args->>'call' as call
  from public.tool_calls t
  where t.tool_name = 'decision.record' and t.args ? 'call'
  order by t.args->>'title', t.created_at desc
) tc
where d."call" is null
  and d.source_kind = 'agent'
  and d.title = tc.title
  and tc.call in ('build', 'do-not-build');

-- 2. The writer's own rule, run backwards. This tool sets `status='declined'`
--    ONLY when the call was `do-not-build`, so for its own rows that status IS
--    the direction. It says nothing about `approved`, which is why the reverse
--    is not written here.
update public.decisions
set "call" = 'do-not-build'
where "call" is null and source_kind = 'agent' and status = 'declined';
