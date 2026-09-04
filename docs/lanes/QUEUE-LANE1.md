# QUEUE — LANE 1 (`src/routes/**` except `api/`; `src/components/shell/**`; `src/styles/**` except `meridian.css`)

> _Created: 2026-08-25 · Last updated: 2026-08-25_

> _Written by MAIN 2026-08-25. Fully-specified items, topmost first. The ordered master backlog
> stays [`../../the-first-run/BUILD-QUEUE.md`](../../the-first-run/BUILD-QUEUE.md)._

> **⚠ [`CLAIMS.md`](./CLAIMS.md) exists (founder, 2026-08-25). Check it before touching any
> file, push your claim before coding, remove it when done. Pull before every unit; push after
> every commit. Four sessions share this repo (A = director, B, L0, L1).**

## 1 · Queue #12 — design review: Today (READY, unblocks item 2's replacement)

- **Goal:** answer R-12's five questions about `_authenticated.today.tsx` in your unit file
  BEFORE changing anything; it is the post-auth landing and `/start` replaces it, so this review
  governs the replacement.
- **User value:** the first sixty seconds stop being a status panel.
- **Files:** review-only this item; findings in `coordination/units/`.
- **Acceptance:** five questions answered in writing; every region named with its Meridian
  component; regions with no nameable job killed with the reason.
- **Skills:** none; R-01 (no station names) and the START-HERE test are the rubric.

## 2 · Queue #54 — mount the character (BLOCKED → #53; spec-read now)

- **Goal:** the rail miniature on every surface + the `/start` introduction moment, per
  [`SPEC-PRESENCE.md`](../../the-first-run/SPEC-PRESENCE.md) §Anatomy.
- **User value:** the agent is present everywhere; a live run is one click away (folds queue
  item 10).
- **Files:** `src/components/shell/AppFrame.tsx`, `src/components/shell/run-strip.tsx`,
  `src/routes/_authenticated.start.tsx`.
- **Acceptance:** character visible with true state on every authenticated surface; one click to
  the run; `/start` shows it picking up the sentence; zero station names (R-01); screenshots.
- **Skills:** `frontend-design`; Meridian contract.

## 3 · Queue #32 — swap `JobCards`/`RunComposer` onto Meridian `PickCard`/`Composer` (READY)

As written in the master queue: delete the local copies, no `leading-[` left in
`src/components/shell/`, `design:adoption` stops listing `onramp-parts`.

## 4 · Queue #22 — fold `/boundary` into `/engine-room` (P1)

As written in the master queue; `/approvals` loses its primary rail row per R-04.

## 5 · Queue #70 — the verdict meets the claim it settles (READY; one INBOX answer widens it)

## 6 · Queue #72 — the front door's open-work rows say where each run stands (READY)

- **Goal:** `/start` is now the signed-in home (`SIGNED_IN_HOME` flipped `c4ce719d7`), so its
  "Your open work" rows are the first live thing a person sees — and today each row carries
  only title + hold text. Enrich each row: the station word ("At Build"), when it last moved
  ("moved 4 minutes ago"), and a calm tone for resumable holds (out-of-time, needs-evidence)
  versus the ordinary tone for stuck ones. A person scanning the home tells moving from stuck
  without opening anything.
- **User value:** the first screen answers the first question — "is my work moving?" — in one
  glance, which is the 60-second bar the mission sets for the whole product.
- **Files:** `src/routes/_authenticated.start.tsx` (the open-work section renders inline
  there). The track rows from `listTracks` already carry `station`, `hold`, and `drivenAt`-
  shaped fields — read what the payload has; add NO server round-trip. Station display names:
  the display map the shell uses (`sense`→Discover etc.), never raw ids on screen.
- **Acceptance:** station + relative time render on each row; resumable holds read calm;
  raw station ids never visible; both themes; `--mrd-*` only.

- **Goal:** F-65 (`1b6a986b3`) wired `learnings.decision_id`, so for the first time a settled
  verdict can sit beside the claim it settles. On `/learn`, an opened learning that carries a
  `decision_id` shows the pairing: the claim as written at Decide (`forecast_claim`), the
  horizon date (`forecast_horizon_date`), and the verdict the card already renders.
  `8f0d4a568` put `LearnedCards` on the route; this item carries the pairing into the opened
  detail.
- **User value:** the one pairing on any screen that demonstrates the moat — what the team
  believed before the outcome was known, next to what happened.
- **Files:** `src/routes/_authenticated.learn.tsx` only. Fetch per opened outcome via
  `getLearningGradeContext` (`src/lib/decisions.functions.ts`) — deliberately never folded into
  the list select. That server function returns the decision as `{id,title}` today; the three
  forecast fields need a one-line select extension in a MAIN-owned file — already asked in
  [`INBOX-MAIN.md`](./INBOX-MAIN.md) (C → A, 15:3x). Render the `{id,title}` pairing now if
  you take the item before the answer lands. The card body
  (`src/components/learn/LearnedCards.tsx`) is LANE 0's path — coordinate via INBOX, don't
  cross.
- **Acceptance:** an opened learning with a `decision_id` shows claim + horizon date + verdict
  together; learnings whose `decision_id` is NULL (all 133 existing rows) render exactly
  today's card — absent is the honest shape, no invented pairing; both themes; `--mrd-*` only.
- **Skills:** `frontend-design`; Meridian contract.
