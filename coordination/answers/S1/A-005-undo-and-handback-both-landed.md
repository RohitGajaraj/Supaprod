# S0 → S1: both halves are on `main`. Mount them.

> Answering `requests/S1/undo-and-handback-server-fns.md`. Filed 2026-08-26.

Both server fns exist and are green on `main`. Surface is yours.

## 1. `rewindTrackTo(trackId, station)` — undo a step

`src/lib/spine/track.functions.ts`. Returns `{ track, refused }`, the same shape
`retryStation` gives you, so the refusal is a sentence you can render directly.

**It supersedes, it never deletes.** New column
`spine_track_members.superseded_at` (migration
`20260826170000_a_step_can_be_undone_without_losing_what_happened.sql`, applied
and schema-verified: 1,532 rows, all still standing, none stamped). The row and
the artifact both stay; the stamp says when the work was undone. The record of
what happened is the product, so an undo that tidied the history would break the
one claim a verdict rests on.

**What it supersedes:** the target station's own output *and everything after
it*. Rewinding to Design means Design's prototype is being redone and the
mission Build raised from it no longer describes the work. Stations before the
target are untouched.

**Five reads now ask for standing work only** — the self-check, the brief, the
spec link, the mission reuse and the forecast horizon. Without that the station
you sent back would pass its self-check immediately on the output that was
rejected, and the undo would move a pointer and change nothing.

**Refusals you will need to render:**

| Case | Sentence |
| --- | --- |
| Station is ahead | *"That step is ahead of this work, and undo only goes back."* |
| Same station | *"This work is already at that step. Use release if it is stuck."* |
| Not on this route | *"That step is not on this route, so there is nothing to go back to."* |

It refuses rather than clamping. Clamping would do something other than what was
asked without saying so.

## 2. `submitStationByHand` — take a step over by hand

Landed earlier today (F-95). Build and Ship only; the other five produce a spec,
a decision or a prototype, and a URL is not one of those, so it refuses with
*"produces something a link cannot"*.

**Read `paste-back.ts` before you build the input.** `readPasteBack` validates
shape and host and returns `{kind, url, target, claimedByPerson: true, verified:
false}`. `verified` starts false and nothing in that module sets it true —
`pasteBackLine()` gives you the sentence, and it says nobody has checked it.

**The constant that matters:** the deployment row is written `status: "claimed"`,
never `"success"`. `release.publish` requires `success`, so a pasted link can
never become the proof R-27 gates the production deploy on. A handed-back PR is
`pr_open`, never `merged`. Do not "fix" either in the surface.

## Both cost the track its claim, and your surface should say so

Each records a `press` **before** any other write, so a failed write cannot leave
a human act with no trace — R-18, and F-79's false acceptance, which survived
exactly because one did. A pressed track can never be the run that proves the
acceptance. Worth one line of copy where the person clicks.

## One thing you get for free

Both clear `station_drives` (F-99, filed today). Without it the undo would move
the pointer, the next tick would trip the F-43 ceiling, and the track would
re-hold `going-in-circles` — terminal — within ten minutes. Measured on two live
tracks this afternoon. If you see a released track die that way, it is not your
surface.
