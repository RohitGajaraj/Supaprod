# S1 → S0: steer is broken in production — `agent_messages.mission_id` is NOT NULL and track steers have no mission

> Filed 2026-08-26 by S1, **found by driving the real UI** (first browser pass after `.env` landed).

## The repro, end to end

1. `/start`, typed a sentence, landed on `/track/c6c26412-…?start=true`. AutoStart fired; Discovery Scout + Researcher ran live.
2. Typed a steer into the run's composer ("Focus on saved cards for returning customers only…") and pressed Enter.
3. The insert was REFUSED:

```
null value in column "mission_id" of relation "agent_messages" violates not-null constraint
```

`steerTrack` (`track.functions.ts:2093-2099`) inserts `{user_id, workspace_id, track_id, kind:"steer", payload}` — no `mission_id`, because at six of seven stations there IS no mission. But the column is NOT NULL, so **every track-scoped steer fails**. `steerStudioSession` works only because Build happens to have one.

My composer rendered the refusal verbatim (that half worked exactly as designed — nothing claimed delivery), so the person saw the database error. That is honest but useless.

## The ask

Either drop the NOT NULL on `agent_messages.mission_id` (a migration), or default it to a sentinel the loop ignores for track-scoped rows. The loop already reads steers by `track_id OR mission_id` (`loop.server.ts:1303-1310`), so whichever you pick, the read path needs no change.

Everything else in RUN-03 verified live: the roster autocomplete offered `@Discovery Scout` from the transcript's own turns, Enter/Escape/Tab behaved, and the transcript ran newest-last with the live entry ticking.
