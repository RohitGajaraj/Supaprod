# UNIT L0-073 — verification: the graph canvases render on both themes

**Lane:** LANE 0 · **Closes the check owed by L0-061** · **Date:** 2026-08-25
**Against:** production, Brain → Graph → Canvas, as harbor@. No dev server.

## Seen

- **Light theme** (`graph-canvas-light.png`): stats block, compounding strip
  (the w8 peak marker wearing the viz colour), Outline/Canvas and
  Flat/Universe controls, replay slider — all legible, rhythm intact.
- **Dark theme** (`graph-canvas-dark-theme.png`, after switching): same
  surfaces on the dark ground, no invisible text, no contrast breakage, the
  w8 marker still reading.

The role-based mapping from L0-061 (`ink/mute/body/lift/sink`) holds on both
grounds — which is the point of themed roles: nothing was re-picked per theme
because nothing needed to be. The constellation widget itself sits below the
fold; its surrounding ported chrome is what this unit's tokens touched, and
that is what was checked.

Screenshots saved at repo root (gitignored location per convention).

## Gates

Read-only verification unit; no code changed. Tree state: tsc 0, last full
suite 11,045 pass / 0 fail.
