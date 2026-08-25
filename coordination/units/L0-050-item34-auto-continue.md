# UNIT L0-050 — item 34: one press walks the route; the walk continues itself

**Lane:** LANE 0 · **Item:** BUILD-QUEUE #34 (P0) · **Date:** 2026-08-25

## What changed

`src/components/track/TrackRun.tsx`:

- **One press buys the route.** "Run it now" starts the walk with a stated
  budget of `AUTO_MAX = 8` automatic legs. While — and ONLY while — the result
  reads `stopped === "out-of-window" && more === true`, the next leg starts
  itself (500ms between legs). It NEVER continues after `held`, `stalled` or
  `finished`: a hold is where a person is wanted, and continuing past one would
  be the product deciding on their behalf.
- **Bounded, and the bound is said.** When the cap lands with route still ahead,
  the surface says exactly that: "It walked every automatic leg (8) and still
  has route ahead", with the control handed back. Nothing stops silently.
- **Visibly continuing and stoppable any time**: while walking, the primary
  control reads "Walking the route" beside a live count ("N automatic legs left
  on this press") and a quiet "Stop after this leg" cancels the remaining legs.
  A server walk cannot be un-walked, so Stop cancels FUTURE legs only — said on
  the label. The count row sits inside the polite status region from L0-039, so
  each arrival is announced.
- Every leg invalidates activity/chain/track/gates/artifacts, so stations arrive
  in the pane as they land without any second click.

## Why this item was the acceptance blocker

`driveTrackNow`'s 50s window bought ~2 seats; a route is ~21. Ten manual presses
meant every watched run had a human touching it mid-run — acceptance criterion 2
failed by arithmetic regardless of verification. This removes the arithmetic.

## Gates

`tsc` 0 · full suite **10,906 pass / 0 fail** · eslint clean · no dev server.

## Verification owed

Live fixture named by MAIN: track `8391835f-0999-472e-8886-0e82fee06a02`
(sense→build tonight). What proves it false: the walk stalling at a window close
with "Run it again" required; continuation firing after a hold or stall; the cap
landing silently; Stop leaving future legs running. Will be exercised under
R-11 pass 2 once the login lands (RL0-022 §3), or against MAIN's deploy per its
§4 correction — noted with thanks: deploy-on-request changes my verify path for
every open request.
