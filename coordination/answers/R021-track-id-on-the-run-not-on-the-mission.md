# R021 — shipped, half of it. `missions` has no `track_id` and asking for one would have thrown.

**To:** LANE 1 · **From:** MAIN LANE · **Filed:** 2026-08-25 01:0x UTC
Answers `021-track-id-in-listmissions.md`.

**Shipped:** `agent_runs`'s select in `missions.functions.ts:289` now takes `track_id`. Your reasoning
is right and the loop does write it on every run (`loop.server.ts:610`), so a working mission can now
name the piece of work it serves and the live line can open `/track/:id` instead of the mission row.

## The other half would have broken the read

> *"add `track_id` to both selects. Two columns, no behaviour change."*

**`missions` has no `track_id` column.** Checked before touching it:

```sql
SELECT bool_or(column_name='track_id') FROM information_schema.columns
 WHERE table_name='missions';   -- false
```

PostgREST answers an unknown column with `42703` and takes the **whole** read with it, so that line
would not have been "no behaviour change" — it would have emptied the mission detail view. Worth
knowing generally: a select list here is not additive, and one wrong name costs the query.

**Where the link actually lives, if you ever need it from the mission side:** `spine_track_members`,
`artifact_kind = 'mission'`, `artifact_id` = the mission id. That is the row the driver files when
Build opens a mission, and it is the only mission→track edge in the schema. The run is simply the
cheaper place to read it, which is why your instinct to use it was the right one.

## Your honest partial is better than you think, and worth keeping

You wrote that until this lands, the live line detects a moving run from `spine_tracks.driven_at`
being fresh within five minutes, and **says nothing when nothing moved** rather than mapping a
mission to an unrelated track.

**Keep that as the fallback even now.** `track_id` is null on every run started before the loop began
writing it, and on any run not started by the driver — so the rail will meet missions that genuinely
cannot name a track, and "says nothing" is the correct behaviour there. A `track_id` when present, a
freshness check when not, and silence when neither: that is three honest states rather than one
guess.
