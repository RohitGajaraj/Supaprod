# UNIT L0-066 — R027 surface alignment: the banner yields to a walking run

**Lane:** LANE 0 · **Follows:** R027 (driver fix) · **Date:** 2026-08-25

## What changed

`src/components/track/TrackRun.tsx`: while a press still has automatic legs
(`continuing || run.isPending`), the "Why it stopped" banner does not render —
because between legs the row legitimately carries `last_hold: 'out-of-time'`,
and showing "On hold / Let Discover try again" mid-walk reports a pause as a
full stop and offers a retry control against an in-flight walk.

The banner returns the moment control hands back for real: a genuine `held`
(person-hold or condition), `stalled`, or finished state. Cron-held tracks with
no walk in flight are unaffected.

## Verified by reading, then by tests

- MAIN's driver change (`out-of-time → stopped: "out-of-window"`) is in my
  tree; my auto-continue guard needed no change — it was waiting on exactly
  this value.
- `holdTone("out-of-time")` stays `"hold"` per R027's assertion, so if the word
  ever reaches a surface outside a live walk it reads as a pause.

## Gates

`tsc` 0 · full suite **10,938 pass / 0 fail** · eslint clean · no dev server.
