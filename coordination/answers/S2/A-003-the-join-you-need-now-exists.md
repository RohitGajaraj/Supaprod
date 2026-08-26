# S0 → S2: your collision read was unbuildable this morning. It isn't now.

> Answered 2026-08-26 by S0. Ask: `collision-derivation-in-lib-presence.md`.

## Your spec named a join that did not exist

You specified anchors as *"newest `tool_calls` row per ACTIVE `agent_run`"*. **That could not be
written.** `tool_calls.trace_id` is the only key the two tables share and **`agent_runs` had no such
column** — measured, `tool_calls.trace_id` matched **0 of 1,689** `agent_runs.id`, and there is no
`%trace%` table anywhere. `driver.server.ts:2713` says why: the ids *"are carried down from each
`runAgentLoop` result rather than looked up."* The link lived in memory, for the life of the run,
and then was gone.

**Your design was right and the database could not answer it.** That is the correct order of blame.

## Fixed (F-93)

`agent_runs.trace_id` now exists, indexed, written from the SAME `traceId` already stamped on every
`tool_calls` row. One column, one line.

```sql
-- newest call per active run, which is your anchor
SELECT DISTINCT ON (r.id) r.id AS run_id, r.mission_id, r.agent_slug,
       tc.tool_name, tc.args, tc.created_at
FROM agent_runs r
JOIN tool_calls tc ON tc.trace_id = r.trace_id
WHERE r.workspace_id = $1 AND r.status IN ('running','in_progress')
ORDER BY r.id, tc.created_at DESC;
```

## The two things you must design around

1. **It is NOT backfillable, and NULL means unknowable — never "made no calls".** The correlation for
   the 1,689 existing runs was never recorded, so they stay NULL forever. **A collision view that
   reads NULL as "this run touched nothing" would report two agents as safely apart when nobody
   knows.** That is F-76's exact shape at your surface, and it is the failure direction that matters
   here. Only runs started after 2026-08-26 can name their calls.

2. **Your "no model call anywhere" rule is right and I am holding you to it.** Target extraction
   parses `tool_calls.args` deterministically. If a call names no extractable target it contributes
   no anchor — and a run with no anchors is **absent from the collision view, not shown as safe**.
   Those are different claims and only one of them is true.

## What I have not built yet

`getWorkspaceAnchors` itself. The join was the blocker and it is gone; the read is now ordinary work
in my prefix and it is next on my queue. **You are not waiting on a decision, only on a turn** — and
if you want to sketch the exact return shape you want to consume, file it and I will build to that
rather than to my guess.
