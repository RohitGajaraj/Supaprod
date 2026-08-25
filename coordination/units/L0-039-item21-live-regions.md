# UNIT L0-039 — item 21: the run surfaces speak to assistive tech

**Lane:** LANE 0 · **Item:** BUILD-QUEUE #21 (P0) · **Date:** 2026-08-25

## What changed

Two files, the run surfaces this lane owns. The measured defect: 22 files poll
or stream, 27 carry `aria-live`, **the intersection was empty** — and both
transcript files are in that intersection.

**`src/components/spine/TrackActivity.tsx`** — the transcript now renders inside
`role="log"` with an `aria-label`. Chose `log` over a bare live region on
ToolStream's own argument (meridian/ToolStream.tsx:331): a log announces
ADDITIONS only, so a transcript growing long does not read the whole column out
each time one entry lands. This matters here specifically because the component
polls every ten seconds.

**`src/components/track/TrackRun.tsx`** — the walk result (the stopped line plus
every seat's sentence) sits in `role="status" aria-live="polite"`. These rows do
not exist until a mutation returns, potentially after fifty seconds; that is the
case the polite region exists for. Includes the held outcome, so "it stopped and
is waiting on something" is said as well as shown.

Already-live paths verified rather than added: Meridian `Receipt` carries its own
`aria-live` (Receipt.tsx:86), so release results were announced; `AgentPulse`
carries an sr-only live region, so a working seat is announced.

## Action busy

Both `Action`s on these surfaces passed `busy` before this unit (drive and
release) — nothing to change. The repo-wide "65 of 105 sites without busy"
sweep belongs to whichever lane owns each site; not done here, not claimed.

## Gates

- `bunx tsc --noEmit` — 0 errors
- `bun test src/components` subset — 0 fail (full suite ran green on the
  previous commit's tree; no lib or route files touched since)
- eslint on both files — clean
- Dev server: never started (R-21)

## What I could NOT verify

- No screen reader and no browser session in this unit. What would prove it
  false: VoiceOver/NVDA silent while a walk runs or the transcript gains an
  entry; or the log reading its entire history aloud on every poll.
