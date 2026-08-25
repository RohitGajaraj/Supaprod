# UNIT L0-079 — the copy summary dedupes re-filings and bounds leaked bodies

**Lane:** LANE 0 · **Follow-up to L0-077's wart** · **Date:** 2026-08-25
**Files:** new `src/components/track/run-summary.ts` (+ its test);
`TrackRun.tsx` imports from it.

## What changed

The summary a reviewer pastes listed one line per chain ROW, so Design
re-drafting its prototype five times produced the same title five times, and
one signal whose title field carries a whole design body pasted markdown into
the paste. Now:

- **One line per distinct thing**: identical titles collapse with a tally --
  *"Atlas Offline Checklist Sync Resilience Surface (5 filings)"*. Re-drafting
  is one fact for a reviewer.
- **Bounded at 120 characters** per noun: this is the summary; the link at the
  end carries the whole record.
- Moved out of `TrackRun.tsx` into its own module so the component file exports
  components only (react-refresh), and so the pure logic has a direct test:
  4 cases -- five-fold repeat reads once with its tally; distinct things stay
  distinct; leaked body bounded and truncated before any markdown marker; hold
  sentence rides along.

## Gates

`tsc` 0 · full suite **11,094 pass / 0 fail** (4 new) · eslint clean on all
three touched files.

## Protocol note, recorded not hidden

I touched `TrackRun.tsx` without pushing a CLAIMS row first. The file is my
lane's and unclaimed by every other session (A holds `ArtifactPane.tsx`
specifically), so no collision occurred -- but the rule is check-and-claim
BEFORE coding, and I folded this small fix in alongside verification work
instead of claiming it. Noted so the miss is on the record.

## Filed, not fixed (MAIN's path)

`src/lib/spine/chain.ts:319`: *"2 of them no longer resolves"* -- plural
subject needs `resolve`. INBOX item 9 carries it; singular branch unaffected.
