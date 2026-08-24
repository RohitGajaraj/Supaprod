# Experiment: can a track finish — 2026-08-25 02:0x

> _MAIN LANE. Running now. This file is the record so the result survives the session, whichever way
> it goes. **A negative result is a finding and gets written up the same as a positive one.**_

## The hypothesis

Agents could not record a decision because **nothing told them what day it is**. `decision.record`
refuses a `forecast_horizon_date` in the past — correctly, so a fabricated horizon cannot land — and
a model reasoning from its training cutoff guessed the year, guessed low, was refused, and spent its
whole step budget guessing. One strategist run burned **68,260 tokens** saying so out loud. The
station then failed three times and the track was marked `given-up`.

**If that was the only wall, a reset track should now move past the station it died on.**

## What was changed, and when

| | |
| --- | --- |
| Fix | One line in the agent system prompt: today's date, UTC, date-only. `src/lib/ai/loop.server.ts` |
| Deployed | **Verified present in Lovable HEAD 2026-08-25 02:0x** by reading the file back, not assumed |
| Reset | 2 of 5 `given-up` tracks in the only live workspace `0b792d52-82e2-43e2-adc5-8a26e5c800b4` |

```sql
UPDATE spine_tracks SET attempts = 0, last_hold = NULL, seat_cursor = 0,
       driven_at = now() - interval '1 day'
WHERE id IN ('f9e41393-7774-4b30-9368-0c2f2670acf1','c4b12e7c-2be4-4ef3-aa54-14645bf28510')
  AND workspace_id = '0b792d52-82e2-43e2-adc5-8a26e5c800b4' AND last_hold = 'given-up';
```

**Two, not five, on purpose.** Five would cost five times the spend to learn the same thing, and if
the hypothesis is wrong I would rather find out for $0.30 than $1.50. `driven_at` is backdated so
both sort first under the tick's `ORDER BY driven_at ASC`.

| Track | Station at reset | Why this one |
| --- | --- | --- |
| `f9e41393` EU Timezone Tier-1 Support Latency | `decide` | **The station the date bug actually bit.** Direct test of the fix |
| `c4b12e7c` Silent Failures via Swallowed DB Errors | `design` | **Furthest along, so the shortest path to `learn`.** Probes what is beyond `decide` |

## Baseline, so movement is unambiguous

Before reset, all five carried `attempts 3`, `last_hold 'given-up'`, and had not moved since
2026-08-24 20:30. Across the product's whole history: **59 tracks, 58 entered at `sense`, ZERO have
ever reached `learn`.**

## What each outcome means

| Result | Reading |
| --- | --- |
| Both advance a station | The clock was the wall. Reset the other three |
| `decide` advances, `design` does not | Fix was right; a **second, different** wall sits later on the route |
| Neither advances | The clock was **not** the wall, or not the only one. Re-open the autopsy — do not reset again |
| A track reaches `learn` | **The first end-to-end run in this product's history.** Screenshot it, record the SQL, tell the founder first |

## The wall I already expect past `design`

`ship` has **never** had a single `spine_track_members` row, of any kind, ever — while `deployments`
holds 42 successful rows (`src/lib/spine/attach.ts:217-220`, measured 2026-08-20). **Shipping happens,
and it happens outside the spine.** So a track may reach `ship` and be unable to record that it
shipped. If `c4b12e7c` stalls exactly there, that is the finding, and it is an architectural one
rather than a bug: the spine does not observe the thing that actually deploys.

## Status

- [x] Fix deployed and verified in Lovable HEAD
- [x] Two tracks reset
- [ ] First tick observed
- [ ] Movement or no movement recorded with SQL
- [ ] Result written up either way
