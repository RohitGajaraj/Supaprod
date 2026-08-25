# UNIT L0-042 — item 3 slice 2: Decide renders as itself, on real data

**Lane:** LANE 0 · **Item:** BUILD-QUEUE #3 · **Date:** 2026-08-25

## What changed

`src/components/track/ArtifactPane.tsx` now consumes `getTrackArtifacts`
(RL0-021, in main in the §1 shape) alongside the chain:

- **The Decide card** (SPEC-ARTIFACTS §4): status chip on the five-word scale,
  `rationale` as prose, the rejected alternatives listed under "Rejected"
  (rendered only from an actual array of strings — never coerced), and **the
  forecast block**: claim, how-we-will-know, due day, and the honest ungraded
  word — "Not due yet." vs "Due N days ago, not graded." A graded forecast
  renders its verdict chip plus rationale. "Recorded by the {agent} agent" /
  "Recorded by you" always renders; every live forecast is agent-authored and
  the reader is entitled to know which of us believed it.
- **Two real actions on Decide** (R-03): when no forecast exists, a write-once
  form through `setDecisionForecast` that says "Once recorded this cannot be
  edited" BEFORE the press; when the call is pending, Approve/Reject through
  `updateDecision`. Both invalidate `["track-artifacts"]`.
- **Discover renders both artifacts read-only**: signal cards (title ?? content
  lead, body, source · kind · time, clustered marker, source link) and cluster
  cards (summary, frequency/severity/confidence, dismissed reason). Their
  inline actions are deliberately NOT in this unit — nothing pretends at a
  control it does not have.
- Plan keeps `getPrd` + `savePrd` (full-row edit beats the fields subset).
- Kinds without a renderer (changeset, deployment, prototype, learning) keep
  honest title lines; no stub bodies.

## The one convention worth MAIN's eyes

`forecast_horizon_date` requires an ISO instant with offset; a person choosing
a due date has a day. The form sends `<day>T12:00:00Z` and says "Due <day>".
If you want a different convention (end of day, local offset), it is one line
in `ForecastForm`.

## Checked first

- Meridian: composed only — `StatusChip`, `Prose`, `Row`, `RunNote`,
  `mrd-eyebrow`/`mrd-meta` roles, `Field/Input/Textarea`, `Action`. No new
  component; no `mrd-` request. SPEC-CONSENT's card work is item 1 and comes
  next, not here.

## Gates

- `bunx tsc --noEmit` 0 · full suite **10,836 pass / 0 fail** · eslint clean.
- Dev server: never started (R-21).
- **Live-data verification owed to cross-check (R-11 pass 2):** track
  `897d1834-0d44-45bd-ad3d-29b7b1206041` carries 3 signals + 3 clusters +
  a decision with a complete forecast (horizon 2026-09-01). Expected on
  `/track/<id>`: Discover tab shows three signal cards and three cluster
  cards; Decide tab shows the decision with the forecast block reading
  "Not due yet." and "Recorded by the strategist agent". What proves it false:
  empty cards, a fabricated verdict, or the forecast form showing despite a
  recorded claim.
