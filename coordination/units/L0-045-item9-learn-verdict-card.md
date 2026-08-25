# UNIT L0-045 — item 9: the forecast and its verdict, on the run

**Lane:** LANE 0 · **Item:** BUILD-QUEUE #9 · **Date:** 2026-08-25

## What changed

`src/components/track/ArtifactPane.tsx`:

- **The Learn card** (`LearningCard`), per SPEC-ARTIFACTS §9 — the one station
  whose artifact is a JOIN of two rows: the track's learning member joined to
  the track's decide member. Renders **Predicted** (claim, how-we-will-know,
  due day) → **Actually** (verdict chip + rationale + who graded) → **What we
  now believe** (the learning's summary on the recessed ground, verdict chip:
  validated→pass / missed→fail / mixed→hold, metric beside it).
- **The honest empty state is the design**: zero forecasts have ever been
  graded on a real workspace, so "Actually" names WHICH nothing it is —
  "Not due until <date>." vs "Due N days ago and not graded." Never a
  placeholder verdict, never a fabricated one.
- **The loop's closing moves are real controls now (M-3 has never run once):**
  - ungraded + due → grade it (hit / did-not / cannot-tell + one-line
    rationale) through `settleForecast`, commit dead until both chosen;
  - ungraded + not due → `deferForecastCheck` (+14 days), quiet, labelled as
    what it is;
  - graded → "Disagree with this verdict" opens Meridian's `ReasonField`
    (server floor: 3 chars of argument) through `reopenForecast`, which writes
    `forecast_resolution_log` BEFORE clearing — the first writer that table
    will ever have.
- All three invalidate `["track-artifacts"]` on success; every control passes
  `busy`.

The Decide-side forecast card itself landed in L0-042 (slice 2): claim,
observable, due date, ungraded word, authorship always named.

## Checked first

Composed only: `StatusChip`, `Prose`, `RunNote`, `Field/Input`,
`ReasonField`, `Action`. One guard caught me and is the system working: my
first selected-state used an invented `text-mrd-on-ink`; the
every-utility-paints test failed the build for naming a token the bridge does
not expose. Corrected to the existing `bg-mrd-ink text-mrd-bg` pair
(ApprovalCard's own).

## Gates

`tsc` 0 · full suite **10,881 pass / 0 fail** (the guard included) · eslint
clean · dev server never started (R-21).

## What would prove it false

A learning row rendering without its joined decision half when one exists; a
fabricated verdict where resolution is null; grading enabled with no rationale;
reopen accepting a two-character reason (server refuses — surface must show
its words). Live data: no real learning rows exist at `learn` on any open
track, so this renders against seeded rows only until M-2 lands the first full
walk — stated rather than hidden.
