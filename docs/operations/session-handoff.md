# SESSION HANDOFF — 2026-08-26, S0 CONDUCTOR: the self-check repaired, and the acceptance query corrected

> _Last updated: 2026-08-26_

> **This replaces the S0-001 handoff that stood here.** That page reported "S0-001 IMPLEMENTED,
> tests pass clean (11,383 pass)" and listed *"no attempt penalty"* as a feature. Both were wrong.
> See F-76.

## Read this first

**The acceptance query returns 1 now, and the acceptance is NOT met (F-79).** Every document in this
repo calls `entry_station='sense' AND station='learn' AND waived='[]'` the only measure, and says it
returns 0. It returns **1**, for track `d1168015`. A session that runs it and stops there reports the
first acceptance in three months and is wrong.

The track genuinely walked all seven — six `stage_events`, every one `actor='system'` **and**
`driven_via='sweep'`, so nobody pressed anything and F-55's field does its job. But approval
`bdf32286` was raised against its Build mission `310bd16b` at 18:11 UTC and **rejected at 18:48
UTC** — 37 minutes later, and 2 days 23 hours before `expires_at`, so it was decided rather than
expired. R-18 requires *no human touching it mid-run*. `agent_approvals.decided_by` is **NULL**: the
schema records no decider, which is a second defect. The honest query, which returns **0**, is in
[`OPERATING-MODEL-5-SESSIONS.md`](../../the-first-run/OPERATING-MODEL-5-SESSIONS.md) §2.

## What shipped this session

**F-76 — the self-verifying spine could never pass five of its seven stations.** S0-001 (13:33 today)
built the right thing, gap #1, and asked a schema nobody checked:

| station | it asked for | what exists |
| --- | --- | --- |
| decide | `decisions.forecast_text` | **`forecast_claim`** |
| define | `prds.brief` | **`body_md`** |
| design | kind `design_memory` | **`prototype`** (19 rows) |
| ship | kind `deployment` | **never filed once** — that gap is F-36 |
| learn | kind `verdict` | **`learning`** (4 rows) |

Only `sense` and `build` named anything real. PostgREST rejects a select naming a column that does
not exist; the code destructured only `data`, so `data ?? []` turned *"the query failed"* into *"the
work is empty"*. **The hold had no bound either** — `attempts` was left at 0, so
`MAX_STATION_ATTEMPTS` never tripped, `decideCorrection` was never reached, and every stuck-work
alarm stayed silent while each tick re-ran the full crew at real cost.

**It never fired in production.** The sweep has been idle since 2026-08-25 19:41 UTC. But six tracks
sit at `decide` and would all have hit it on the next tick.

**The 22 tests that declared it verified imported nothing but `vitest`**, asserted on inline mocks,
and printed `MISSION GATE MET` with a hardcoded acceptance count of 1. `verifyStationOutput` was not
exported and could not have been called. Both files deleted; replaced by
`src/lib/spine/the-self-check-must-ask-the-real-schema.test.ts`, which imports the function and
guards its column names against the generated `types.ts`.

Rule adopted: **a check that could not be COMPUTED must pass.** Only a positive reading of empty
output may fail a station.

## State

- `main` at `2789c1ed4`. Commits: `e13c24b5f`, `a185d3f5c`, `6b41152cb`, `b9d907a54`, `c890659eb`.
- Gates: `bun test src/lib/spine/` **708 pass / 0 fail**; `bunx tsc --noEmit` **exit 0**;
  `bun run docs:check` **exit 0**. Dev server never started (R-21).
- Lanes S1 and S2 have pushed `lane/run` and `lane/control`.

## Blockers and what is owed

1. **DO NOT DEPLOY YET.** Lovable's GitHub sync is stalled at `62feb61f4` (its `updated_at` is
   08:53 UTC, before the pushes). An empty commit (`c890659eb`) did **not** unstick it. Deploying
   while `latest_commit_sha` is `62feb61f4` ships the **broken** self-check. Verify sha parity first.
2. **`docs/lanes/QUEUE-S1.md` … `QUEUE-S4.md` do not exist.** §4 makes S0 owe every lane two fully
   specified items, and a blocked lane is S0's failure. Only the superseded `QUEUE-LANE0/1` exist.
3. **F-77 OPEN** — the check reads only this visit's harvest, so a crew split across ticks is judged
   on a partial view.
4. **F-78 OPEN** — `reason` is never persisted and `priorHold` reaches `correction.ts` rather than
   the station brief, so a retried station re-runs identical inputs. **Devin's loop is half-built
   until the reason reaches the brief**, which is the whole point of gap #1.
