# RETRACTED · S2 · "The acceptance query returns 1" — I reported the wrong query, and the acceptance is NOT met

> Filed 2026-08-26T18:59Z by S2. **Retracted and rewritten 2026-08-27T00:40Z by S2**, after S3
> (service-role access) caught it and after I verified the disqualifier myself.
> **The filename is now wrong and is kept only because S4 already has this path.**

## The correction, first

**The acceptance is NOT met. The honest query returns 0.** The `1` I reported comes from the short
query, which CLAUDE.md explicitly says must not be reported as the acceptance.

Track `d1168015` is the **near miss**, not the hit. Everything I measured about its sweep
provenance is accurate and none of it is the test.

## The disqualifier, which I verified independently before accepting it

```
agent_approvals
  id           bdf32286-31ed-458d-b524-9333c4f78ef4
  tool_name    studio.pr.merge
  status       rejected
  created_at   2026-08-25T18:11:17Z
  decided_at   2026-08-25T18:48:31Z
  decided_by   NULL          <- the row cannot name who decided
  mission_id   310bd16b-c9cd-433e-863d-1d3f799699f6
```

**A person rejected a merge 37 minutes into the run**, between the `design -> build` transition at
18:00:19 and `build -> ship` at 19:01:00. R-18 requires *"no human touching it mid-run"*. It fails.

The six `driven_via='sweep'` transitions are real and they are not sufficient: **a stage_event
records who moved the pointer, not who answered a question that had to be answered before it could
move.** The short query cannot see an answered boundary call, which is the entire reason the join
form exists.

## How I got it wrong, because the mechanism matters more than the mistake

**I read a stale CLAUDE.md.** The copy injected into my session at start says the query "returns
**0**" and carries the `is_sample`/F-42 warning. The file **on disk** had already been updated
(F-97, F-79) and says the opposite:

> "**as of 2026-08-26 it returns 1, not the 0 this file used to promise** (F-97). The 1 is
> `d1168015`, and it is NOT the acceptance: a person answered a boundary call mid-run (F-79), which
> R-18 disqualifies. **That query on its own has stopped being the test.** … **Do not report a
> non-zero result from the short query as the acceptance.**"

So I did not discover anything. I re-derived a documented finding and then reported it as the
opposite of what the canon concludes, including the one sentence that names this exact failure.

Two lessons worth keeping, since both are cheap and I paid for neither:

1. **A document injected at session start is a snapshot, not the file.** In a repo where five
   sessions write continuously, anything canonical must be re-read from disk before it is relied
   on. I re-read `NOW-*.md` religiously and never re-read the file that defines the goal.
2. **My `is_sample` reasoning was also stale and also backwards.** I wrote that `is_sample = false`
   means the F-42 trap does not apply. The current file records (F-90) that the old reason was
   backwards: `is_sample = true` means "a demo fixture, and NO tick may spend on it", so the sweep
   *skips* those workspaces. `track-tick.ts:85` excludes them via `sampleWorkspaceIds`. My
   conclusion happened to be harmless; my reasoning for it was wrong.

## What survives, and is still worth having

The measurements themselves stand and were verified twice, by me through RLS and by S3 through
service-role:

- `d1168015` walked all seven stations, `waived = []`, status `done`, `spend_used_usd` 0.263044.
- Six `stage_events`, **all** `driven_via='sweep'`, `actor='system'`. Zero NULL provenance, so
  S4's hand-press-versus-old-row ambiguity does not arise for this track.
- It **does** carry a forecast written at Decide (17:21:00, agent `strategist`, horizon
  2026-09-15, `forecast_resolution` NULL because the horizon has not arrived). That is genuinely
  different from `3fbf73c9`, which skipped Decide and carries none.

So the near miss is closer than the previous one: it has the forecast, and it lost only on a single
human answer to a merge gate. **The remaining gap is one rejected approval, not a missing station
and not a missing forecast.** That is a small and nameable distance, and it is the useful thing in
this file.

## Still not verified by anyone

Per-station artifacts. There is no `spine_artifacts` / `track_artifacts` / `artifacts` table under
those names. `spend_used_usd` of 0.263044 shows model work happened rather than a pointer moving
six times, but it is not proof that seven stations each produced output. If the acceptance is ever
claimed, that check has to exist.

## Reproduce the honest form

```sql
SELECT count(*) FROM spine_tracks t
WHERE t.entry_station = 'sense' AND t.station = 'learn' AND t.waived = '[]'
  AND t.id NOT IN (SELECT r.track_id FROM agent_approvals a
                   JOIN agent_runs r ON r.mission_id = a.mission_id
                   WHERE a.decided_at IS NOT NULL AND r.track_id IS NOT NULL);
-- 0
```
