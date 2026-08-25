# UNIT L0-051 — item 29, client half: exhausted is its own state, and it does not dismiss

**Lane:** LANE 0 · **Item:** BUILD-QUEUE #29 (P0) · **Date:** 2026-08-25

## What changed

`src/components/billing/BillingBanner.tsx` (my path; mounted app-wide at
`_authenticated.tsx:194`):

- **New EXHAUSTED branch**, checked first: metering on + balance ≤ 0 renders
  "The AI credits ran out, so agent runs have stopped. Top up and they start
  again from where each one stopped." with an Add credits control. NOT
  session-dismissable — at zero there is nothing left to defer, and the old
  line vanished behind "Later" exactly when it mattered.
- The LOW line keeps its existing threshold + dismissal behaviour and now
  yields to the exhausted state instead of competing with it.

## Why the warning "had no surface"

It did — but only as a low-balance nudge: same treatment for 100 credits and
for 0, dismissible for the session, no exhausted sentence anywhere. The measured
failure (warning fired 20:50, pool empty ~23:4x, six blocked runs, product said
nothing) is closed at the surface layer: zero now stops the app visually, in
one sentence, with the undo named.

## Owed to finish the item

The RUNWAY half ("about N minutes of work left") needs a burn read from
`ai_events`; filed as `requests/L0-024-credit-runway-read.md` with the exact
shape. The pure helpers are already client-safe; only the read is MAIN's.

## Gates

`tsc` 0 · full suite **10,906 pass / 0 fail** · eslint: 0 errors (1 pre-existing
react-refresh warning on the file's exported pure helper, untouched) · no dev
server. Screenshot of the warning state owed under R-11 pass 2 once the login
lands — the exhausted state needs a real zeroed account to render honestly,
which is exactly the fixture MAIN is building.
