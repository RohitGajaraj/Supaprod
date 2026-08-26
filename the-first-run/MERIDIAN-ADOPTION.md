# Meridian adoption, measured — 2026-08-25

> _MAIN LANE owns `src/components/meridian/**`. This is the census, the correction to the founder's
> figure, and the ruling on what each lane must compose rather than invent._

## The number, and it is not 20%

```
Meridian .tsx files (excluding tests): 47
Exported components + constants:      121
Adopted (>=1 importer outside meridian/, tests and the gallery):  95   (79%)
Unadopted (zero real importers):                                  26   (21%)
```

**Founder's figure was "about 20% used". Measured, it is 79% adopted.** The instinct behind the
figure is still right — there IS a large unused surface — but it is a fifth of the system, not four
fifths, and knowing which fifth is what makes it actionable.

**Of the 26 unadopted, 9 are constants** (`IDLE_AFTER_MS`, `TASK_LABEL`, `TASK_TONE`,
`TERMINAL_TASK_STATUS`, `RUN_GRID`, `RUN_ROW`, `RUN_LINE`, `RUN_STACK`, `STATION_GLYPHS`,
`WORK_GLYPHS`) and are consumed inside their own module. **17 are real components with no door.**

## The find: `run-rows.tsx` is the run vocabulary, and nothing imports it

22.8KB. **Nine components and four layout constants, zero importers.** Built to close a defect its
own header names:

> *`PlanCard`, `RunTimeline` and `ToolStream` are three views of one run and they shipped as three
> products. Measured across them: three mark sizes (13, 13, 18), three gutters (6, 8, 10px), three
> subject sizes (12.5, 12.5, 13), two of them with no time column at all... Every one of those passed
> typecheck, tests and the ratchet. That is the arbitrariness failure.*

And its numbers are not preference — `Thinking` is **ported from beautifului.dev's own source**, which
is the standard `DESIGN-SYSTEM.md` sets.

| Component | What it draws |
| --- | --- |
| `RunGlyph` | the mark for a step, sized once for all three views |
| `RunClock` / `RunClockEmpty` | **the time column — the ticking clock the step list needs** |
| `RunTook` | elapsed duration, in the clock column rather than the label |
| `RunSubject` | what the step acted on |
| `RunMeta`, `RunNote` | the secondary line, and an aside |
| `RunRail`, `RunRailBreak` | the vertical spine connecting steps, and its discontinuity |

**Ruled: backlog item 5 (the run's step list) composes `run-rows`. It does not invent one.** This is
exactly the vocabulary asked for, it already matches beautifului.dev, and building a second one would
recreate the arbitrariness failure the file was written to end.

## The other unadopted components, and what each is for

| Component | File | Ruling |
| --- | --- | --- |
| `Flowchart` | `Flowchart.tsx` | **Hold.** A flowchart of stations is the station-diagram front door that R-01 and the positioning canon both reject. Do not adopt without a ruling |
| `InsightCards`, `Entity` | `InsightCards.tsx` | **Candidate for the artifact pane** at `sense` — themes and entities are exactly what Discover produces. LANE 0 to evaluate against `SPEC-ARTIFACTS.md` §3 |
| `PromotionCard`, `NoPromotions` | `PromotionCard.tsx` | **Candidate for `decide`** — a promotion is a cluster becoming a track. Evaluate, do not force |
| `PairMark` | `marks.tsx` | Two actors on one row — the **handoff** between stations. Evaluate for the step list |

## The standing rule this earns

**Before building any new component, grep `src/components/meridian/` for one that already does it.**
This repo's dominant defect is not missing work, it is unwired work: `TrackActivity` and `TrackChain`
were built to a founder ruling and sat with zero importers for 24 days; `resolveApprovalPolicy` has
zero callers; `run-rows` is 22.8KB of exactly-right primitives nobody reached for.

**A unit that adds a component must say, in its unit file, which Meridian component it checked first
and why that one did not serve.** A unit that cannot answer that is rejected on review.

## What MAIN owes

When a lane files a genuine gap, MAIN designs the primitive against **beautifului.dev as the floor**
(ported from real source, never from a screenshot), builds it in `src/components/meridian/`,
documents it in `docs/design/DESIGN-SYSTEM.md`, and answers the request with the component name and
its props. **Lanes never add to `meridian/`.**
