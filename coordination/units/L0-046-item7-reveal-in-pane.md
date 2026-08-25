# UNIT L0-046 — item 7: clicking a filed thing reveals the thing

**Lane:** LANE 0 · **Item:** BUILD-QUEUE #7 · **Date:** 2026-08-25

## What changed

- `src/components/spine/TrackChain.tsx` — member rows take an optional
  `onOpenStation`. When a run surface can reveal output in place, a resolved
  member row becomes clickable and its action word becomes "Show it"; a
  missing row stays the settled negative it is and opens nothing. Without the
  prop (lists that only show work) behaviour is unchanged.
- `src/components/track/ArtifactPane.tsx` — the pane's tab is now controllable
  (`active` / `onActiveChange`), keeping its own default (where the work
  stands) when uncontrolled.
- `src/components/track/TrackRun.tsx` — holds the shared pointer: chain row
  click sets it, the pane follows. The record answers "what do I have"; this
  wires "show me" from the record to the thing itself, which is the item's
  whole sentence.

## Gates

`tsc` 0 · full suite **10,881 pass / 0 fail** · eslint clean on all three
files · dev server never started (R-21).

## What would prove it false

Clicking a chain member leaving the pane on its previous tab; a missing
artifact's row acting like a control; the record list on another surface
gaining phantom controls (it must not — only TrackRun passes the prop).
