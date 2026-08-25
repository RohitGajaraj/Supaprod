# QUEUE — LANE 0 (`src/components/**` except `meridian/`, `shell/`)

> _Written by MAIN 2026-08-25. Fully-specified items, topmost first. The ordered master backlog
> stays [`../../the-first-run/BUILD-QUEUE.md`](../../the-first-run/BUILD-QUEUE.md); this file is
> your paste-ready view of the rows you own. Take the top item that is not BLOCKED._

> **⚠ [`CLAIMS.md`](./CLAIMS.md) exists (founder, 2026-08-25). Check it before touching any
> file, push your claim before coding, remove it when done. Pull before every unit; push after
> every commit. Four sessions share this repo (A = director, B, L0, L1).**

## 1 · Queue #65 — the transcript says who caused each leg (READY — server half landed `8dc50c963`)

- **Goal:** `stage_events.driven_via` distinguishes `sweep` / `press` / `continuation`
  (queue 64). The run transcript should SHOW it: a row a person caused carries a quiet
  "you pressed run here" marker; a sweep row reads as the product moving on its own;
  `continuation`, `foreground` and NULL rows claim nothing about a person.
- **User value:** watching a run, you can SEE the loop moving itself versus being nudged —
  acceptance criterion 2 made visible on the screen instead of living only in a SQL query.
- **Files:** `src/components/spine/TrackActivity.tsx` (+ a test). The server half is DONE:
  `getTrackActivity` now returns `{ turns, transitions }`; `transitions` is
  `TrackTransition[]` (`from`, `to`, `at`, `drivenVia`) exported from
  `src/lib/spine/track.functions.ts`.
- **Acceptance:** the three origins render distinctly; a NULL/`foreground` row never claims a
  person acted; both themes pass; no raw colour, `--mrd-*` only.
- **Skills:** none needed; gates as always.

## 1b · Queue #66 — a hold says which try this was (READY — server half landed `8dc50c963`)

- **Goal:** `spine_tracks.attempts` counts real failures against `MAX_STATION_ATTEMPTS = 3`
  (`driver.ts:424`), and the "Why it stopped" region hides it. Round 7's live track sat at
  `build` on `attempts: 2`, hold `produced-nothing`, and the screen could not say "the next
  failure is the last".
- **User value:** a person reading a held run knows how close it is to giving up, without SQL.
- **Files:** `src/components/track/TrackRun.tsx` (hold region only — MAIN also holds edits
  there for queue 64, landed; pull first). `Track.attempts` is now on the payload (0 when the
  row predates the counter).
- **Acceptance:** a held track with `attempts > 0` names the try ("second of three"); a moving
  track shows nothing; copy passes the say-it-in-a-meeting test, no drama.
- **Skills:** none needed; gates as always.

## Done this cycle

- **#55 `AUTO_MAX` 8 → 24** — shipped; the constant is live in `TrackRun.tsx` and Round 7
  walked `sense → build` in 13 minutes on it.
- **INBOX #6 expiry copy** — shipped, claim released (`9c7b6b904`).

## 2 · Queue #53 is MAIN-held — do not take it

The character component moved to MAIN by the founder's 2026-08-25 direction (critical builds
stay with MAIN). `src/components/presence/**` is MAIN's path until 52–53 land; **do not write
there.** Your next items after #55 are the owed verifications below.

## 3 · Owed verifications now unblocked (production redeployed 08:3x UTC)

Run the pre-written falsifiers for items **24, 28, 34, 29, 23** from their unit files, and the
both-theme graph-canvas pass (L0-061). Record each in `coordination/units/`.

## Standing answers from MAIN (your INBOX items)

- **#5 `expiresAtIso`:** blessed as built — keep the client-side conversion; the field is not
  being added.
- **#6 expiry copy:** render with `Intl.DateTimeFormat` in the viewer's locale/zone, weekday +
  day month + HH:mm ("by Wed 27 Aug, 15:41"). Keep the raw ISO in a `title` attribute.
