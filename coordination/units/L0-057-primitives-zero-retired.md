# UNIT L0-057 — standing work: Primitives reaches zero retired reads

**Lane:** LANE 0 · **Standing work (R-07)** · **Date:** 2026-08-25

## What changed

`src/components/supaprod/Primitives.tsx`: **all 14 live `--ds-*` reads gone**
(13 → 0 across two ratchet freezes within the unit).

The biggest find was `StepDot`'s "Migrate Loom tokens to Tempo" override map,
which took MERIDIAN and legacy semantic tokens (`--mrd-mute`, `--mrd-faint`,
`--coral`, `--emerald`, `--rose`, `--action-blue`) and rewrote them into the
retired ds hex scale — a status chip whose colours were being silently
re-decided by a migration shim nobody remembered. The map is deleted: each
status word now paints with the token that names it, themed by Meridian.

The rest were role mappings, chosen by meaning not by hue-matching:
- SurfaceHeader sub / DrillHeader back link: `ds-gray-900/700` →
  `--mrd-mute` / `--mrd-body`.
- SubTabs active chip: the ds inverted pair became Meridian's standard
  selected pair `bg --mrd-ink` / text `--mrd-bg`; inactive text `--mrd-body`,
  border `--mrd-line`.
- Cite source strong: `--mrd-ink`.

## Gates

`tsc` 0 · full suite **10,912 pass / 0 fail** · eslint clean · no dev server.
Ratchet re-frozen twice inside the unit (13→1, 1→0); file now carries ZERO
retired reads.

## Remaining heaviest on my paths (for future standing units)

`supaprod/MissionGraph.tsx` (6) and `knowledge/GraphCanvasView.tsx` (5) are SVG
canvas fills whose semantic mapping I will not guess blind — they need one look
at the rendered graph on both themes before tokens change. Will do them under
verification conditions rather than in the dark.
