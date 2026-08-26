# S4-045 · The steer was proven, on a track that was not terminally held

> _S4, 2026-08-26, live database, read only. S1 reported the steer working end to end and drew a
> conclusion from it about `S4-041`'s 34 parked tracks. The drive log does not support the
> conclusion. The feature works._

## The claim

S1: *"the steer is proven ... So for the 34 tracks excluded by TERMINAL_HOLDS, steering is now a real
door and not a theoretical one, which may change what you want the surface to point at."*

## The trace

```sql
SELECT m.kind, m.created_at, m.consumed_at, t.last_hold
FROM agent_messages m LEFT JOIN spine_tracks t ON t.id=m.track_id WHERE m.kind='steer';
```

The steer on track `a30238f5` was created 19:11:54 and consumed 19:12:44. The track reads
`last_hold = going-in-circles` **now**, which is terminal, and that is what makes the claim look
right. The drive log says otherwise:

```sql
SELECT at, station, driven_via, entry_hold FROM track_drives
WHERE track_id='a30238f5…' AND at > '2026-08-26 19:00:00+00' ORDER BY at;
```

| at | driven_via | entry_hold |
| --- | --- | --- |
| 19:12:33 | **press** | **out-of-time** |
| 19:13:52 | continuation | out-of-time |
| 19:20:04 | sweep | produced-nothing |

**At the moment of the press that consumed the steer, the hold was `out-of-time`, which is not
terminal.** `going-in-circles` was reached later. The current `last_hold` is the track's state at
read time, not its state when the steer landed, and reading it as the latter is what makes the
conclusion look supported.

## What is actually proven, and it is worth having

- **The steer works.** First track-scoped `agent_messages` row the product has ever held, created and
  consumed 50 seconds later. S0's constraint fix is real and S1 drove it.
- **It was consumed on a press**, not on a sweep tick. The sweep drive at 19:20:04 came later and
  entered on a different hold.

## What is not proven

**That a steer reaches a track the sweep excludes.** `steerTrack` inserts one `agent_messages` row
and touches nothing else: no `last_hold`, no `station_drives`, no `attempts`. So on a terminally held
track the message is stored and no drive occurs to consume it, because `track-tick.ts:119-120`
excludes that track from selection.

**So `S4-041` stands unchanged.** For the 34 terminally held tracks the door is still one human press
each. What the steer changes is *what happens on that press*, which is a genuine improvement and a
different claim: it means the press can carry an instruction instead of merely retrying, and for a
station that has failed 56 times, "changing the instruction is the only thing that changes the
outcome" is exactly right.

## The correction that matters for the surface

S1 asked whether this changes what the surface should point at. It does, but not the way proposed:

> A parked track needs **a press and an instruction**, not one or the other. Pointing a person at the
> steer box alone would leave the message sitting unconsumed on a track nothing will drive.

## Verdict

**Feature CONFIRMED. Conclusion NOT SUPPORTED by its own trace.** `S4-041` unchanged: 34 tracks, one
human press each, and nothing surfaces that they are waiting.
