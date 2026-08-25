# Unit 061 · the route census (LANE 1 standing work, R-07)

LANE 1 · 2026-08-25 · measured, not estimated: every `_authenticated*.tsx` in
`src/routes/` read for line count and `throw redirect`. **96 route files total:
48 redirect doors, 47 surfaces, 1 layout** (`_authenticated.tsx` itself carries
`redirect` but is not a door). This matches the queue's "48 of 84 pure
redirects" once index/`$` splits are counted the queue's way.

**No code changed.** Item 6 rules deletion LAST, after a run finishes end to
end; this census records the verdicts that collapse will execute, so the night
it unblocks nobody has to re-read 96 files.

## Verdicts

**KEEP FOREVER — 21 pure one-target stubs (8–11 lines each).** briefing,
cockpit, delegate, inbox, meetings.$id, prompts, roadmap, swarm, memory,
notifications, stakeholder, eval-health, missions.index, outcome, studio.index,
analytics, budgets, discovery, docs, drift, evals, guardrails. A URL that never
dies costs no noun — these render nothing and exist so old links land somewhere
true (`govern.tsx`'s own header states the law: "redirects never drop params
their target honors"). Deleting them is breaking links to save zero words.

**KEEP UNTIL THEIR TARGET'S FATE DECIDES — param-mapping stubs (14–64 lines).**
calendar, chat, integrations, knowledge, changelog, traces, impact, tasks,
artifacts, opportunities, fleet, missions.$missionId, observe, prds.$id, agents,
trust-ledger, track-record, govern, m.index, m.$productId,
$workspaceSlug.$productSlug, studio.$missionId. Each maps legacy params onto a
living surface. When item 6 kills a target, these re-point in the same commit;
when the target survives, so do they.

**ITEM 6'S NAMED FIRST TARGET IS ALREADY RESOLVED.** "discover.tsx vs
discovery.tsx": `/discovery` is an 11-line stub redirecting to
`/discover?tab=signals`; `/discover` is the living surface (127-line shell with
deliberate search-param repair documented in its header). Nothing to collapse —
recorded so item 6 does not open them looking for a duplicate.

**ONE GENUINE TRIO FOR THE COLLAPSE:** `_authenticated.prds.tsx` (7 lines) is a
bare `<Outlet />` layout whose ONLY children are the two redirect stubs
`prds.index` → /plan and `prds.$id` → /plan/spec/$id. All three can leave in
one commit when deletion unblocks, with any inbound `/prds/...` links re-pointed
first (grep before, per the trap list).

**FOUNDER CALLS, NOT MINE:** the Mission Control trio (`m.index`, `m.$productId`,
`$workspaceSlug.$productSlug`) — kept alive deliberately while retirement is
planned (STATUS.md). The 12 `admin.*` surfaces and the `/meridian` gallery stay:
workbench and admin are outside this mission's slice.

**IN FLIGHT BY RULING, NOT CENSUS INPUT:** `today` frozen until promotion vs
`start` (R-15, units 055/057); `boundary` folds into engine-room?safety pending
request 022 (unit 058); `approvals` loses its rail row on promotion day (R-04).

## What the census changes

Nothing tonight. It converts item 6 from "48 of 84 are redirects" into a
per-file disposition: 21 keep-forever, 22 keep-until-target, 1 trio deletable
together, and the rest already governed by standing rulings. The honest number
for the eventual collapse is far smaller than 84: **roughly 4 files delete, ~6
re-point, and the noun count was already paid down by every fold that created a
stub.**

Gates: none owed (no code). Dev server not started.
