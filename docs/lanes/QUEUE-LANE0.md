# QUEUE — LANE 0 (`src/components/**` except `meridian/`, `shell/`)

> _Written by MAIN 2026-08-25. Fully-specified items, topmost first. The ordered master backlog
> stays [`../../the-first-run/BUILD-QUEUE.md`](../../the-first-run/BUILD-QUEUE.md); this file is
> your paste-ready view of the rows you own. Take the top item that is not BLOCKED._

> **⚠ [`CLAIMS.md`](./CLAIMS.md) exists (founder, 2026-08-25). Check it before touching any
> file, push your claim before coding, remove it when done. Pull before every unit; push after
> every commit. Four sessions share this repo (A = director, B, L0, L1).**

## Done · Queue #71 — the crew at work is a live row (SHIPPED `b60fa7a47`, unit in BUILDLOG)

- **Goal:** while a station's crew is actually mid-visit (the sweep is serving this track right
  now), the transcript's newest edge shows it as a LIVE row — "The build crew is at work,
  started 40s ago" — distinct from settled rows, gone the moment the visit ends. Tonight's
  watch sat on a run screen while three real crews worked and the screen showed nothing until
  the visit closed; the product was moving and looked still, which is the exact opposite of
  the visible-agency bet.
- **User value:** the founder watches the loop MOVE, not just its wake — phase 3 of the
  mission made real on the one screen that matters.
- **Files:** `src/components/spine/TrackActivity.tsx` (+ its test). Signal for "mid-visit":
  the activity payload's newest turn/transition timestamps versus `track.drivenAt` — a visit
  is in flight when the track was picked up but not yet stamped (PHASE-3's faster polling,
  already landed, gives you fresh reads). Do NOT add a server read; derive from what the
  payload carries. If the payload cannot distinguish in-flight, file that to INBOX-MAIN as
  the finding instead of faking it — a pulse that lies is worse than none.
- **Acceptance:** live row appears only while a visit is genuinely in flight; settled rows
  unchanged; both themes; `--mrd-*` only; no drama in the copy ("The build crew is at work"
  passes the meeting test).

## 1 · Queue #67 — waiting on the calendar is not an alarm (DELIVERED per handoff `7febf0a9b` — verify then move to Done)

- **Goal:** Learn now holds `needs-evidence` when its forecast is not yet due (shipped
  `ac333b2c8`): resumable, no attempt burned, nothing waiting on a person. The hold surfaces
  still paint every hold as a stoppage. A learn track waiting on time must read CALM — "the
  forecast comes due 8 Sep; Learn returns then" — with the date, never an amber alarm and never
  a Run-it-now nudge (pressing run on it would only spend money asking a question whose answer
  is a date).
- **User value:** a person scanning a stalled board tells "waiting on time" from "waiting on
  me" without opening anything — B's amendment, carried to the screen.
- **Files:** `src/components/track/TrackRun.tsx` (hold region: `holdReason === "needs-evidence"
  && track.station === "learn"` → calm tone, date, no release control), and the same case in
  `TrackStart`'s row chips if it paints holds. The date: the decide member's
  `forecast_horizon_date` is already in `getTrackArtifacts`' decision fields — read it from the
  pane's existing query, do not add a server read.
- **Acceptance:** dated calm sentence on a pre-horizon learn hold; ordinary needs-evidence
  (sense, no signals) keeps today's rendering; both themes; `--mrd-*` only.

## 1b · Queue #68 — one track owns the sweep: the observation session (READY NOW, time-boxed)

- **Goal:** harbor holds exactly ONE open track (`7977dc06`, at ship) and the sweep serves it
  every ~10 minutes — the most predictable live-walk window this product has ever had. Spend it:
  sign in as `harbor@` (`docs/operations/demo-credentials.md`), sit on `/track/7977dc06…`, and
  OBSERVE everything your ledger owes eyes: transcript motion (L0-041), character
  Thinking/Working/Resting (L0-069b), queue-65 origin markers live, queue-66 try-count copy,
  the expiry sentence rendered. Screenshot each, both themes where feasible.
- **User value:** six CODE-SHIPPED rows become VERIFIED-LIVE or honestly fail; the founder gets
  the film of his product moving.
- **Files:** none (verification unit). READ-ONLY: never press Run it now, never answer a gate —
  a `press` row would land in the record B keeps.
- **Acceptance:** BUILDLOG rows updated with what was SEEN, screenshots filed in your unit;
  anything that did not render as specced becomes a filed finding, not a silent pass.

## Done · Queue #69 — the finished count tells the truth (GUARD WRITTEN, unit L0-086, test handed to MAIN via INBOX 18)

- **Goal:** any surface you own that answers "has a piece of work finished end to end?" — a
  done badge, a board tile, a finished count — derives it from the track row itself:
  `entry_station === "sense" && station === "learn" && waived.length === 0`. Never from
  `workspace.is_sample`: F-42 repurposed that flag to mean "the sweep may drive here", so the
  obvious join counts track `3fbf73c9` — entered at `define` with `sense`+`decide` waived, no
  forecast written — and reads as the loop having completed when it has not (F-61). The honest
  form returns 0 today, and the first screen that ever shows 1 must be believable.
- **User value:** when a screen finally says "finished", it is true.
- **Files:** swept at `37a9c0776`: no surface in your path derives completion via `is_sample`
  today, so this is the guard rail, not a repair. Wherever a done/finished state renders now or
  next (`src/components/track/TrackRun.tsx`'s end state, any status tile you add), read the
  three fields off the already-fetched track row.
- **Acceptance:** every current done/finished render traced to the three fields, recorded in
  your unit file; a shape test in the style of
  `src/__tests__/ticks-do-not-run-on-sample-workspaces.test.ts` that fails when a `src/`
  surface derives completion from `is_sample` — `src/__tests__/` sits outside your path, so
  route the test through [`INBOX-MAIN.md`](./INBOX-MAIN.md) if MAIN should land it.
- **Skills:** none; F-61 in
  [`../../the-first-run/FINDINGS-LEDGER.md`](../../the-first-run/FINDINGS-LEDGER.md) is the
  rubric.

## Done · Queue #65 — the transcript says who caused each leg (SHIPPED `7fa621e8f`, unit L0-080)

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

## Done · Queue #66 — a hold says which try this was (SHIPPED `17c060f4c`, unit L0-081)

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
