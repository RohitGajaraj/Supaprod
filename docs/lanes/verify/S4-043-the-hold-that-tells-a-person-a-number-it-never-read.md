# S4-043 · The hold that tells a person a number it never read, about work that is sitting right there

> _S4, 2026-08-26, measured against the live database, read only, with the code beside it. This is
> the diagnosis behind `S4-041`: why 32 of 60 open tracks are terminally parked._

## What the person is told

`correction.ts:574-578` sets the hold, and the sentence a person reads is:

```ts
return {
  action: "escalate",
  reason: "station-cannot-finish",
  because: `${label(i.station)} has what it needs on the record and still finished empty
            ${MAX_STATION_ATTEMPTS} times. Nothing earlier on this route can fix that, so it
            needs your eyes on the station rather than on the work.`,
};
```

Three assertions in one sentence: the station **finished empty**, it did so **three times**, and the
reader should look **at the station rather than at the work**.

## What the rows say

```sql
SELECT count(*) AS terminally_held,
       count(*) FILTER (WHERE attempts = 0) AS attempts_zero,
       count(*) FILTER (WHERE attempts < 3) AS attempts_under_three,
       count(*) FILTER (WHERE EXISTS (SELECT 1 FROM spine_track_members m
                                      WHERE m.track_id=t.id AND m.station=t.station)) AS filed_at_held_station
FROM spine_tracks t WHERE status='open' AND last_hold='station-cannot-finish';
```

| | |
| --- | --- |
| terminally held | **32** |
| `attempts = 0` | **13** |
| `attempts < 3` | **19** |
| **filed work at the very station they are held on** | **20** |
| both `attempts = 0` and filed there | **12** |

**Nineteen of thirty two carry a hold whose stated count their own row contradicts. Twenty of thirty
two filed work at the station the hold says finished empty.**

## The mechanism, and it is one token

`MAX_STATION_ATTEMPTS` is a **constant interpolated into the message**. The sentence does not read
`i.attempts`. So the hold says "three times" on a track whose attempt counter reads zero, and it will
say "three times" whatever the row holds.

That is the whole defect for the count. The "finished empty" half is separate and worse, because the
work is on the record and joinable.

## One track, in full

```
id              44f207cb-0e68-454b-b389-7017082b8fc1
title           "Checklist steps vanish when the crew drops signal in a basem…"
station         sense          last_hold  station-cannot-finish
attempts        0              station_drives  56
filed at sense  20 signals     newest artifact  2026-08-20 01:21:19
created         2026-08-01     last driven      2026-08-25 05:48:15
```

Twenty signals sit at `sense`. The attempt counter reads zero. The hold tells a person the station
finished empty three times and to go and look at the station.

## Why `attempts` is zero, which is already documented and is not the finding

`driver.ts:482-497` explains it under F-43, and even names this track:

> *"`attempts` bounds a station that FILES NOTHING, and is deliberately not incremented by
> `out-of-time` … A station that runs out of time on every pass holds `out-of-time` forever, keeps
> `attempts` at 0 forever, and is dispatched forever. MEASURED 2026-08-25: **316 runs on one track
> since 2026-08-01, reporting `attempts: 0`**, plus 174, 90, 77, 63 and 56 on five more. **776 runs,
> roughly $2.70, and not one advanced a station.**"*

That comment is describing the same population I just measured, and the 56 it lists is the track
above. So `attempts = 0` beside high drive counts is understood and expected.

**What is not accounted for is a terminal hold whose message asserts an attempt count it never
reads, placed on tracks that produced.**

## What it costs, concretely

These 32 are excluded from the sweep by `track-tick.ts:119-120`, so nothing will drive them again.
The only exit is `retryStation`, one human press per track, and `S4-041` establishes that no surface
anywhere says they are waiting. The message they are waiting behind points the person at the station
rather than at the work, and for twenty of them the work is the thing that disproves the message.

**A person who follows that instruction goes to inspect a station that filed twenty signals.**

## What I am not claiming

- **I have not established how these tracks reached this branch with `attempts` below three.** The
  branch is a fall-through reached when the station has its inputs; whether the caller had a
  different attempts value at the time, or the counter was reset later by a path that left the hold,
  I did not determine. **Both are checkable and neither is guessed at here.**
- **I have not shown that releasing them would help.** A station that could not converge in 56 drives
  may not converge in 57. `S4-041` says the same.
- Whether F-76's broken self-check put them here is plausible on the dates and **unproven**. I am not
  asserting it.

## Verdict

**CONFIRMED.** A terminal hold states a count it does not read and a fact the record disproves, on
32 tracks, 20 of which filed at the station named. Class: a state not derived from the row it
describes, which is the same standard `S4-028` applied to the surfaces, applied here to the record.

**Two fixes, and both are small:**

1. **Read the row.** Interpolate the track's actual `attempts`, not the constant. One token.
2. **Check before asserting empty.** The join that disproves it is one `EXISTS` against
   `spine_track_members` on `(track_id, station)`, which the escalation path can run before it
   chooses this reason at all. If the station filed, this is the wrong hold.

`src/lib/spine/**` is S0's. I have changed nothing.
