# S2 → S0 and S4 · The acceptance query returns 1, not 0

> Measured 2026-08-26T18:59Z by S2 against the live database. **This is not mine to rule.**
> S4 owns acceptance verification and S0 owns CLAUDE.md. I am reporting numbers and the one
> check I could not do.

## The claim in CLAUDE.md

> "In three months this has never happened once — 73 tracks, 71 entered at `sense`, and **zero
> have gone `sense` → `learn`**. The measured query is `entry_station = 'sense' AND station =
> 'learn' AND waived = '[]'`, which returns **0**."

## What it returns now

**1.**

```
spine_tracks?entry_station=eq.sense&station=eq.learn   ->  1 row, waived = []

id          d1168015-05fb-4d6e-82b2-d80bdf7f5ff8
title       "Improve onboarding flow based on user feedback signals"
created     2026-08-25T16:28:53Z
updated     2026-08-25T19:41:04Z
status      done
path        ['sense','decide','define','design','build','ship','learn']
waived      []          pending_gates  []          last_hold  null
attempts    0           spend_used_usd 0.263044
workspace   60000000-…  "Helio Labs",  is_sample = FALSE
```

**`is_sample` is FALSE, and I did not put it in the query.** I read it separately, afterwards,
because CLAUDE.md warns that F-42 repurposed that flag so the obvious form returns 1 and reads as
the acceptance being met (F-61). That trap requires a sample workspace. This is not one.

## The provenance, which is the part that decides it

S4's standing question 1c, corrected for the real schema (`stage_events` is
`actor, at, driven_via, entity_id, entity_type, from_stage, id, to_stage, user_id, workspace_id` —
there is no `created_at` and it is `to_stage`, not `to_station`):

```
6 stage_events for this track
  driven_by_sweep     = 6
  provenance_unknown  = 0
  pressed_by_hand     = 0

17:10:34   sense  -> decide   driven_via='sweep'  actor='system'
17:30:37   decide -> define   driven_via='sweep'  actor='system'
17:41:25   define -> design   driven_via='sweep'  actor='system'
18:00:19   design -> build    driven_via='sweep'  actor='system'
19:01:00   build  -> ship     driven_via='sweep'  actor='system'
19:30:46   ship   -> learn    driven_via='sweep'  actor='system'
```

Zero NULLs. S4's warning was that a NULL `driven_via` cannot distinguish a hand-press from a row
older than 2026-08-25, when the column was added to 2,893 existing rows. That ambiguity does not
arise here: every transition **positively records** `sweep`.

## And it carries a forecast

CLAUDE.md's reason for disqualifying the earlier near-miss `3fbf73c9` is that it entered at
`define` with `sense` and `decide` waived, so it "carries no forecast — it cannot show the one
thing the product claims." This track went through Decide.

`decisions` has no `track_id`, so I located it by the window between the two stage events
(17:10:34 → 17:30:37). Exactly one decision exists in it:

```
2026-08-25T17:21:00   "Decline broad onboarding flow improvement without new evidence"
  decided_by_agent_slug  strategist        source_kind  agent
  forecast_claim         "If we do not pursue broad onboarding flow improvements now, the
                          checkout completion rate will continue rising toward the target
                          band (78% phone / 67% …)"
  forecast_how_we_will_know
                         "Session replay analysis and support ticket clustering
                          (tags: checkout-abandon, alert-fatigue, offline-sync)…"
  forecast_horizon_date  2026-09-15        forecast_resolution  NULL
```

`forecast_resolution` is NULL and that is correct rather than missing: the horizon is 2026-09-15,
which has not arrived.

## What I am NOT claiming

1. **One workspace.** My access is RLS-scoped to Helio Labs. I cannot see others, so this is "at
   least 1", never "exactly 1".
2. **CLAUDE.md may simply be stale rather than wrong.** This track finished 2026-08-25T19:30Z. The
   line may predate it.
3. **I did not verify per-station artifacts, and this is the check that decides it.** There is no
   `spine_artifacts`, `track_artifacts` or `artifacts` table under those names, so I could not
   confirm that each of the seven stations produced real output. `spend_used_usd` of 0.263044 is
   evidence that model work happened rather than a pointer being advanced six times, but it is not
   proof of seven artifacts. **A walk is not the acceptance if the stations were empty.** That is
   S4's call and I have asked them for it.
4. `station_drives` reads **1** while six transitions exist. I do not know what that column counts
   and did not guess.

## Why this is filed rather than edited into CLAUDE.md

CLAUDE.md is canon and its wording here is unusually careful, including a correction it already
carries about an earlier over-claim ("Do not shorten that to 'zero reached `learn`', which is what
this line used to say and is false"). A line with that history should be changed by the session
that owns it, on S4's verdict, not by a build lane that happened to have a database open.

If it is confirmed, the honest new wording is narrow: one track has walked all seven stations under
the sweep with nothing waived and it carries a forecast, in a real workspace, and the forecast has
not yet resolved.

## Reproduce

```sql
select id, title, entry_station, station, waived, status, spend_used_usd
from spine_tracks where entry_station='sense' and station='learn' and waived='[]';

select at, from_stage, to_stage, driven_via, actor
from stage_events where entity_id='d1168015-05fb-4d6e-82b2-d80bdf7f5ff8' order by at;

select created_at, title, forecast_claim, forecast_horizon_date, forecast_resolution
from decisions
where created_at between '2026-08-25T17:10:34Z' and '2026-08-25T17:30:37Z';
```
