# UNIT L0-052 — items 28 and 24: the run starts itself when asked, and can be handed to somebody

**Lane:** LANE 0 · **Items:** BUILD-QUEUE #28, #24 · **Date:** 2026-08-25

## Item 28 — `autoStart` (ratified from REQ-3)

`TrackRun` gains `autoStart?: boolean`, default false. Fires `run.mutate()` once
per mount **only when `drivenAt === null`** — the guard is the point: a person
landing from the composer watches work begin with no click; a person reopening a
finished run reads it instead of re-spending on it. The mutation stays behind
TrackRun's control (one writer); the route only passes the flag — per the
ruling, the route must never call `driveTrackNow` on mount. LANE 1's half is
passing `?start=true` through to the prop; my side accepts it from any caller.

## Item 24 — paste into a PR thread

New `CopyRunSummary` inside `TrackRun`: one quiet control, "Copy a summary of
this run". The text is built from rows the run wrote — title, where it is, the
hold sentence verbatim, each station with its filed things by name ("Decide:
Add dark mode…"), and the link. Plain words, never a JSON dump. On success the
control SAYS what it copied ("Copied. Paste it wherever the review happens.")
through a polite status region; failure says that too instead of pretending.
It is a real Meridian `Action`, so keyboard reachability comes free (R-19).
Reads the SHARED chain cache entry — no second fetch, no extra poll.

## Gates

`tsc` 0 · full suite **10,906 pass / 0 fail** · eslint clean · no dev server.

## What would prove them false

28: landing on `/track/:id?start=true` for an ALREADY-driven track firing a walk
(the guard must hold), or auto-start firing twice on one mount. 24: clipboard
receiving JSON or ids; the copied confirmation not announcing; no keyboard path.
Both are R-11 pass 2 items once the login lands.
