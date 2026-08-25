# UNIT L0-041 — item 11: the transcript moves, in the one run vocabulary

**Lane:** LANE 0 · **Item:** BUILD-QUEUE #11 · **Date:** 2026-08-25

## What changed

`src/components/spine/TrackActivity.tsx` rewritten to compose
`src/components/meridian/run-rows.tsx` — the ported vocabulary that had zero
importers (R-13 named it the transcript's vocabulary; now it draws one):

- Each turn renders as `RUN_ROW`: `RunClock` (wall clock, `<time>`, tabular) ·
  `RunGlyph` + `RunRail` (station glyph from `GLYPH_FOR_STATION`; the handoff
  moment wears the `handoff` glyph — two arcs passing) · `RUN_LINE` with
  `RunSubject`, a chip only when there is something to say, and `RunTook`.
- **A new entry landing reads as movement.** Arrivals after the first paint
  animate once: `animation: mrd-fade-up var(--mrd-d-enter) var(--mrd-ease)
  both`. The first page of data never animates — twenty rows playing one
  entrance is noise. Seen-id tracking in refs; no duration literal anywhere on
  the file.
- **The live entry's clock ticks.** A `working` turn carries `LiveTook` →
  `useElapsed(Date.parse(t.at))`, which reports the WORK's age, not the
  component's (use-elapsed's own stated contract).
- Meta line names the handoff ("picked up from Plan") and the station;
  `t.said` moved to `RunNote`, which wraps rather than truncates.
- The `role="log"` region and honest empty/error states from L0-039 are kept.

## Checked first / adoption

- Meridian `Row` was the previous paint; replaced because R-13 + item 11 name
  run-rows as THE transcript vocabulary and three views of one run is the
  drift this mission exists to end.
- `ToolStream` composed first as the reference caller of the same vocabulary —
  same structure, one divergence: my enter animation uses `var(--mrd-d-enter)`
  where ToolStream has a raw `300ms` (R-20 §4: a raw duration is a fail; MAIN
  may wish to snap ToolStream's two literals).
- **run-rows adoption rises**: it now has a second importer chain
  (`useElapsed` → formatElapsed, plus TrackActivity directly).

## Gates

- `bunx tsc --noEmit` — 0 errors · full suite **10,809 pass / 0 fail** ·
  eslint clean on the file.
- Dev server: never started (R-21). What would prove it false: entries
  repainting instead of animating on arrival; the live row showing a static
  time instead of a ticking figure; motion playing on first load; any raw
  ms/duration in the diff.

## Not done here

- Item 15's PairMark evaluation is NOT silently skipped: the handoff on this
  surface is agent→agent, which `PairMark` does not draw (it is agent+you,
  marks.tsx:288). Its natural home is a surface where a person edits agent
  output. Full evaluation lands with item 15 when the sense/decide panes can
  be built (blocked on `getTrackArtifacts`, request L0-021).
