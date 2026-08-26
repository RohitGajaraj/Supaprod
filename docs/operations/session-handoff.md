# Session handoff

> _Last updated: 2026-08-26, S0 CONDUCTOR_

## The finding that matters most: F-99

**The spine bounds a station twice, and only one ceiling had a door.**

- `MAX_STATION_ATTEMPTS = 3` bounds a station that **files nothing**.
- `MAX_STATION_DRIVES = 12` (F-43) bounds a station **dispatched forever without
  converging** — the case `attempts` cannot see, because `out-of-time`
  deliberately costs no attempt.

Both are right. `retryStation` reset `attempts` and left `station_drives`
untouched, so a released track cleared its hold, was driven once, tripped F-43
and re-held as `going-in-circles` — **terminal** — inside one tick.

Measured on the live database: **every open track on a sweep-drivable workspace
was already past the ceiling — 81, 63, 53, 42, 40, 29.** The documented way to
recover work could not recover any of it, and it failed in the worst direction:
the hold cleared, the board showed the work moving, and it was terminal again
before anyone looked twice.

This is the best available answer to *why 73 tracks and zero `sense` → `learn`*.

**Fixed as a split, not a reset.** A person's release clears the ceiling; the
automatic escalation-resume in `driver.server.ts` deliberately does not, because
a machine path that clears its own ceiling has none. The test pins the presence
**and** the absence, and was mutation-tested both ways.

## Live experiment — check this first

Track `8391835f` (design, *"unopened notification setting"*) was released
2026-08-26 16:08 UTC with `station_drives = 0`. It carries **27 real artifacts**,
including **2 `prototype` rows at design** — exactly what F-76's broken check
could not see, because it asked for kind `design_memory` while design files
`prototype`.

**RESULT, 16:10 UTC — it worked.** The sweep drove it, it did **not** trip
`going-in-circles`, `station_drives` went 0 → 1, and it **filed a new
`prototype` at 16:10:47 — its first artifact in 34 hours**. It now holds
`out-of-time`, which is resumable and costs no attempt, so it drives again next
tick. Keep watching it: the question now is whether design's self-check passes
and hands on to build.

## What not to do

**Do not release the other 21 sense-graveyard tracks (F-92 is superseded).** All
24 sit on `is_sample = true` workspaces, which `track-tick` excludes **by id**.
The sweep can never reach them; three were released and did not move. Reviving
them would resume the spend the exclusion exists to stop — 89% of a day's AI
spend on demo fixtures, measured 2026-08-21.

## The acceptance has no clean candidate

Of 7 open tracks on sweep-drivable workspaces, **3 are pressed and 4 are
terminally held**. `c6c26412` is **not** clean — its drive log opens
`press@13:09`, at creation. That error was filed and corrected the same day.

The measured query is in [`CLAUDE.md`](../../CLAUDE.md) and now returns 0
**because the disqualification is in the SQL** rather than in prose someone has
to remember (F-97).

## State

`main` at `c569d7c89`, all four lanes 0 ahead. Gates: 11,629 tests / 0 fail,
`tsc` 0, `docs:check` 0. Lovable sync is current. No dev server was started
(R-21).
