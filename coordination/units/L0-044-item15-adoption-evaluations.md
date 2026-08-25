# UNIT L0-044 — item 15: three candidates evaluated, none adopted, reasons recorded

**Lane:** LANE 0 · **Item:** BUILD-QUEUE #15 · **Date:** 2026-08-25

The acceptance is "each either adopted with the surface named, or rejected in
the unit file with the reason". All three are now evaluated against real,
shipped surfaces (items 3 and 1 landed first, so this evaluation is against
rendering code, not intentions). `Flowchart` stays HELD per the queue.

## 1. `InsightCards` (+ `Trend/Split/ThresholdInsight`) for the sense pane — REJECTED

Its information model is a paged analytics deck: numeric `InsightSeries`
(forecast vs actual), verdict chips, a measured 528px pager floor
(InsightCards.tsx:1217+). Discover produces *rows the run wrote* — signals with
text bodies, clusters with frequency/severity — and SPEC-ARTIFACTS §3 asks for
those rendered as themselves. There is no series to chart and no verdict to
page through; forcing one would fabricate numbers from prose. The pane's
`SignalCard`/`ThemeCard` (ArtifactPane.tsx) render the rows directly.
`Entity` (the @name dot chip) was considered for forecast authorship on the
Decide card and rejected there too: a sentence ("Recorded by the strategist
agent") carries the fact; a decorative chip does not.

## 2. `PromotionCard` for decide — REJECTED

Read against its own props: it renders an `agent_memory` LESSON being promoted
into house rules — `lesson`, `learnedIn`, promotion evidence, approve/not-yet/
never (PromotionCard.tsx:157+). That is a Brain/governance decision about
knowledge, not a run's Decide station recording a product call. The two share
nothing but the word "approve". The Decide card's subject is the decision row
itself with its forecast; adopting PromotionCard would have been adoption for
adoption's sake, which the item explicitly forbids.

## 3. `PairMark` for the handoff — REJECTED (evaluated in unit L0-041)

The transcript's handoff is agent→agent; `PairMark` draws agent+YOU
(marks.tsx:288, "the crew drafted it and you changed it"). The handoff moment
wears the `handoff` RunGlyph instead (two arcs passing), which is the shape
drawn for exactly that fact. PairMark's natural home remains a surface where a
person edits agent output; none exists on my surfaces yet.

## Net

No new adoptions from this list; no component forced onto a surface that does
not fit. The unadopted-component census should record these three as evaluated-
rejected rather than merely unused. The transcript DID adopt `run-rows.tsx`
wholesale in L0-041, which moves the census number where it matters.
