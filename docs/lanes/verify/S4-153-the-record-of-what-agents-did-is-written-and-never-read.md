# S4-153 · The record of what agents did is written and never read

> _S4, 2026-08-28. Measured against the live database and the whole repository. This one is aimed at
> the founder's own test — **"the work agents do made visible on screen rather than implied"**._

## The finding

**`track_drives` has 323 rows and no reader.**

```
src/lib/spine/track-drives.server.ts:72
  await (client as TrackDrivesClient).from("track_drives").insert({ … })
```

That INSERT is the only reference to the table in the product. Searched across `src/**` and the whole
repo for a `select`, an `rpc`, or any read:

> **The only `SELECT` on `track_drives` anywhere is inside a test's documentation string** —
> `"SELECT driven_via, count(*) FROM track_drives WHERE track_id = $1 GROUP BY 1"` — a query written
> for a human to paste into a console.

No server function reads it. No route reads it. No component reads it. **It is write-only.**

## Why this table and not any other

`track_drives` is the append-only record of **every station drive the machine has ever performed**:

| `driven_via` | drives | tracks |
| --- | --- | --- |
| `sweep` | **277** | 13 |
| **`press`** | **40** | **19** |
| `continuation` | 6 | 3 |

**323 drives. This is the work.** It is the one place that records, per drive, whether the machine
moved itself or a person moved it.

**And `driven_via` is the column the product's central claim depends on.** `CLAUDE.md`'s acceptance
query excludes tracks a human pressed:

```sql
AND t.id NOT IN (SELECT d.track_id FROM track_drives d WHERE d.driven_via = 'press')
```

> **19 tracks carry a human press.** That is what disqualifies them under R-18's *"no human touching
> it mid-run"* — and **there is no screen on which a person can see it.**

## What that means against the bar

The product's claim is that agents do the work and you can watch it happen on one screen. The
database holds a complete, per-drive record of exactly that, written faithfully 323 times.

**The screen shows none of it**, and the one question the record answers — *did the machine do this,
or did I?* — is answerable today only by someone with database access writing SQL.

This is the inverse of every other finding in this lane. Everywhere else I have been hunting **state
on screen the data cannot prove**. This is **data that proves the claim and never reaches a screen**.

## What I am not claiming

- **The other agent-work tables all have readers.** `stage_events` (11,125 rows), `tool_calls`
  (2,279), `agent_run_checkpoints` (10,694), `agent_memory` (2,040), `mission_steps` (366) and
  `missions` (397) each have module-level readers. `track_drives` is the exception, not the pattern.
- **This is not the same as a dead writer.** The write works, the rows are correct, and the log has
  already been used to settle questions this lane could not answer any other way.
- **I did not trace every reader to a rendered pixel.** A module-level reader is evidence the data is
  reachable, not proof it is drawn. `track_drives` needed no such tracing: there is no reader at all.
- **`pg_stat_user_tables.n_live_tup` is useless here** and I nearly used it. It reported 21
  `agent_runs` where `count(*)` is 2,847, and 1 `spine_track_members` where a single track has 15.
  It is an autovacuum estimate. Every count above is `count(*)`.

## Verdict

- **CONFIRMED: `track_drives` is written 323 times and read nowhere in the product.**
- **CONFIRMED: 40 presses across 19 tracks** are recorded and invisible, and they are precisely the
  fact that decides whether the acceptance is met.
- **Owner: whoever holds `spine/`.** The fix is not a migration — the data is already there and
  correct. It is a surface that says who drove this work.
