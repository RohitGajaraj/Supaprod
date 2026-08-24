REQ-014: the forecast does not travel - and the other cross-path gaps from the full station audit

Five stations walked this cycle through both lenses (user; external agent
over MCP with no UI), per the founder's re-imagining mandate. Four
routes-only moves shipped in units 027 (Decide keyboard spine, approvals
snooze/send-back doors, Brain's forecast track-record rung, Design's
forward dispatch verb). Everything below needs hands or files outside
src/routes/** and components/today/**, so it is routed here with evidence.
One theme dominates and repeats at every layer.

THE THEME: the moat artifact is stranded.

Agents are REQUIRED to carry a forecast: decision.record refuses without
all three parts (registry.server.ts:3700-3776), MCP record_decision equally
(mcp.functions.ts:1022-1075). The human Decide Gate records NONE:
recordJudgment inserts title + boilerplate rationale + status only
(discovery.functions.ts:1741-1885, keep path :3402-410). The queue then
hides forecasts even when agents submit them: listDecisions selects no
forecast columns (decisions.functions.ts:163-165), so a human approves an
agent's bet without seeing its belief. Downstream, zero grep hits for
forecast rendering anywhere in plan.spec.$id, design, or runs pages - my
builder attempted to render it on spec/design and proved NO reachable read
carries the fields (getDecisionPrecedent lives in decision-precedent
.functions.ts and returns agent_memory matches plus a governing-shape
without forecast columns). Brain buries calibration three doors deep
(Graph tab strip only); Learn's desk grades but the verdict influences
nothing downstream (no reference in pm-impact.ts or insights.functions.ts;
settleForecastImpl patches decisions only), reopenForecast has zero callers
while ForecastDeskPanel copy promises exactly that.

ASKS, smallest first:

1. listDecisions select += forecast_claim / how_we_will_know /
   horizon_date / resolution columns; approvals' decision-family evidence
   prints them as the first lines under the focused gate
   (decisions.functions.ts + approvals-queue.functions.ts).
2. A governing-decision forecast read reachable from routes - extend
   getDecisionCurrency's governing shape or add getGoverningForecast - so
   plan.spec.$id, design and runs.$missionId can render what the bet was
   taken under. My builders stand ready; the render sites are mine.
3. recordJudgment accepts the forecast trio on keep (or routes keep through
   createDecision's existing optional-forecast path), making the human Gate
   match what both agent doors already demand.
4. design_gate predicate fix x3: .is("design_gate_status", null) is
   unsatisfiable under NOT NULL DEFAULT 'pending'
   (approvals-queue.functions.ts:324-347, today.functions.ts:291/:511) -
   ~80 undecided gates invisible to the single pull point. Previously
   flagged as a founder call; restating with the audit behind it.
5. Discover headless parity: registry tools theme.promote /
   theme.set_status / theme.precedent wrapping existing server fns
   (promoteThemeToOpportunity discovery.functions.ts:1378, setThemeStatus
   :657, getThemePrecedent :1254); MCP log_signal + list_themes; widen
   get_prd/search_prds to carry contract + critic_review; draft_spec
   upgraded toward the generatePrd path. Today an external agent can ingest
   and cluster but cannot promote, decline, merge, or read precedent -
   Discover's job stops at the UI border.
6. Learn loop closure: wire reopenForecast into ForecastDeskPanel's
   agent-settled rows (the copy promises it), and give settleForecastImpl a
   guidance write-back that insights/pm-impact read so the next Discover/
   Decide surface can say "forecasts on bets like this came true N of M".

SECOND THEME, smaller: steer/interrupt reachability. Build's live rows are
read-only while the one steer box lives a navigation away on the run page,
and cancelRun exists only on Today. A steer affordance on build.index live
rows calling existing steerStudioSession would close it (CrewWorking action
slot = LANE 0 component - flagged, not planned).

Third: Ship-Learn is a data edge without product edges - WhatShipped's
"not settled yet" line names Learn with no door, and Learn's verdict has no
way back to the release doc. Both halves are component files on LANE 0's
side of the line; routing requested.

Every claim above carries the auditing scout's file:line; I can produce the
full audit text for any item on request. None of it blocks tonight's work -
but items 1-3 are the difference between a product that grades opinions and
a product that grades beliefs, and they are all small once routed.
