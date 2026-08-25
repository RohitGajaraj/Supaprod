# UNIT L0-048 — standing work: BriefPanel off the retired spacing scale

**Lane:** LANE 0 · **Standing work (R-07)** · **Date:** 2026-08-25

## What changed

`src/components/knowledge/BriefPanel.tsx`: all eight live `--sp-*` reads ported
onto Meridian, per the mapping law ink.css itself states:

- `--sp-text-prose` → `--mrd-t-prose`; `--sp-leading-body` → `--mrd-lh-prose`
  (ink.css aliases both exactly, so zero visual delta on these two).
- `--sp-space-2` (inside-component) → `--mrd-s3`, the step `gap-mrd-inline`
  uses; `--sp-space-3` (between blocks) → `--mrd-s4`, the step
  `gap-mrd-stack` uses. Values move 8→6 and 12→10 because that IS the scale's
  law, written in ink.css's own comments — recorded here rather than silently.
- `--sp-line-soft` → `--mrd-line-soft`, which is themed by Meridian itself.

Ratchet re-frozen via `design:ratchet`: `BriefPanel.tsx --sp-: 8 -> 0`.

## Gates

`tsc` 0 · full suite **10,898 pass / 0 fail** · eslint clean on the file.
No dev server. Remaining heaviest live-retired files on my paths, for the next
standing units: `ask/AskPane.tsx` (20), `supaprod/Primitives.tsx` (15),
`supaprod/MissionGraph.tsx` (6), `knowledge/GraphCanvasView.tsx` (5).
