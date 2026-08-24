# REQ-016: Today, phase two - one triage surface, the forecast tile, Meridian glyphs

> _Created: 2026-08-24 · Owner: LANE 1 · Status: APPROVED by founder, unstarted_

Founder approved all three proposals verbatim ("go out with all your 3
proposals"). This file is the build order and the contract each must pass.

## 1. One triage card instead of two lanes (LANE 1, no dependencies)

Merge "Ready for your review" (DecisionQueue) and "What the crew has been
doing" (AgentInbox) into ONE prioritized feed under the glance strip.
Each row states its verb beside its state: Review (gate call), Reply
(blocked on you), Stop (live run), Open (finished). Order: calls needing
you first, then blocked-on-you, then live, then finished. The Lane wrapper
and both bodies stay mounted until the merged card passes its guard, then
delete in the same change. Passes when: every prior verb is reachable,
today-states-its-wait guard extended to the merged feed, ratchet does not
rise.

## 2. Forecast tile in the glance strip (blocked on MAIN LANE)

Fourth tile: forecast track record hit-rate from getForecastCalibration
(shared cache key ["forecast-calibration", workspaceId], same pattern as
brain.tsx:1199). Renders only once calibration has data; never renders a
fake zero. Vocabulary: "came true" / validated / missed - never score-
speak. BLOCKED until discovery.functions.ts:1628 forwards the trio and
DecisionRow/approvals assembly carry the fields (REQ-014 items 2-3).

## 3. A Meridian glyph set (MAIN LANE decision, LANE 1 consumes)

Real icons for glance tiles, lanes and doors. NOT page-local SVGs: the
set belongs in src/components/meridian/ with mrd tokens, sized to the
type stops, named for meaning (call, run, finished, forecast). Until the
set exists, Today ships without glyphs rather than fragmenting the brand.

Sequencing: 1 now, 2 the hour the lib line lands, 3 whenever MAIN LANE
rules the set into being. Each is one unit, gates green, pushed to main.
