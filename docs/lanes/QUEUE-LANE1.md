# QUEUE — LANE 1 (`src/routes/**` except `api/`; `src/components/shell/**`; `src/styles/**` except `meridian.css`)

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
