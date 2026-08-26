# QUEUE — S1 · THE RUN (`lane/run`)

> _Written by S0 2026-08-26. **S0 writes this file; you read it and never write it.** Two fully
> specified items, topmost first. Take the top one that is not BLOCKED. The master backlog stays
> [`../../the-first-run/BUILD-QUEUE.md`](../../the-first-run/BUILD-QUEUE.md); your brief is
> [`SESSION-1-THE-RUN.md`](../../the-first-run/SESSION-1-THE-RUN.md)._
>
> **Ask in `coordination/requests/S1/`. You have no database — every count, row and deploy is a
> question to S0, answered in `coordination/answers/S1/` within one unit.**

## 1 · The ask happens in place, once — brief unit 4

- **Goal:** `TrackConsent` becomes the only place consent is ever asked. A boundary call raised
  mid-run renders **in the transcript where the work is**, is answerable there, and the answer
  widens the authority for the **whole class**, not the single instance. Nothing routes a person to
  a detached queue.
- **User value (§0 q1/q2):** the person stops hunting a queue to unblock work they are already
  looking at — and stops losing runs to asks nobody ever saw. **What they stop doing: opening
  `/approvals` at all.**
- **The measured reason this is first, and it is now sharper than your brief states.** Your brief
  cites 90 asks with zero ever approved. S0 re-measured on 2026-08-26: **323 approvals all-time,
  120 with a real human answer** — so the detached queue is not universally ignored, but the ones
  that die still die detached. **And one of those answers is the reason the acceptance is not met:**
  approval `bdf32286` was raised against track `d1168015`'s Build mission at 18:11 UTC and rejected
  at 18:48 UTC, mid-run — the only thing standing between this product and its first-ever
  acceptance (F-79). **The ask you are moving into the transcript is the exact mechanism that broke
  the loop.** Say that in your unit file.
- **Files:** `src/components/track/TrackConsent.tsx` (exists, and is already imported by
  `src/components/track/TrackRun.tsx` — verified 2026-08-26, so this is a wiring and behaviour unit,
  not a new component). The class-widening rule is server-side and **not yours**:
  `src/lib/ai/approval-policy.ts` holds `resolveApprovalPolicy`, which S0 confirms has **zero
  callers** — that claim in your brief is TRUE. **File an ask to S0 for the caller rather than
  writing in `src/lib/**`.**
- **Acceptance:** a raised ask renders in the transcript without navigation; answering it there
  unblocks the run without a restart; the answer visibly states the class it covered; no path in
  your prefix sends a person to `/approvals` to answer anything. Both themes, `--mrd-*` only, and a
  designed state for "asked and waiting" that is calm rather than alarming.
- **CHECKED FIRST (answer in your unit file):** `TrackConsent` and `TrackRun` — say what they
  already do and what you added. A new consent component is a fail.

## 2 · "I'm on it — you can leave this page" — brief unit 2

- **Goal:** the run is watchable **and leavable**. The surface says so in the product's own plain
  voice at the moment work starts, and leaving is visibly safe. Visible agency must not mean
  mandatory attendance.
- **User value (§0 q1/q2):** the person closes the tab and gets on with their day. **What they stop
  doing: sitting and watching a progress pane to make sure it does not die.**
- **Why now:** this is authorised gap #2's half that lives in your prefix. Gemini's line is the
  model — *"I'm on it — you can leave this page in the meantime."* The other half (a notification
  actually reaching them) is **S3's**, so do not build a notification; build the promise and make it
  true. **Do not promise delivery that does not exist yet** — that is standard #7 (honesty) and it
  is the one that deletes a feature rather than sending it back.
- **Files:** `src/components/track/TrackRun.tsx` and the run route `track.$trackId`. Resume-after-
  leave state must be derived from a row that exists (`spine_tracks.driven_at`, `last_hold`,
  `attempts`) — **never a timer.** A state the data cannot prove is a state you do not draw (§1.3).
- **Acceptance:** close the tab mid-run, reopen the route, and the run is where it should be with no
  loss and no "reconnecting" theatre; the leave-safe line appears when work genuinely starts (not on
  mount); nothing claims a notification will arrive until S3 ships one.
- **CHECKED FIRST:** `TrackRun`, `TrackActivity` — both exist and `TrackActivity` was rebuilt once
  because nobody grepped. Say what you reused.

## Standing, every unit

`git fetch origin && git rebase origin/main` · `cat docs/lanes/NOW-*.md` ·
`cat coordination/answers/S1/*.md` · rewrite `docs/lanes/NOW-S1.md` · append `docs/lanes/log/S1.md` ·
commit explicit paths (**never `git add -A`**) · `git push -u origin HEAD`. **R-21: check
`lsof -ti:5173` before starting a dev server, say `DEVSERVER` in your NOW line while you hold it,
and kill it the moment the check is done.**
