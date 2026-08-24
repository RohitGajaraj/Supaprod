# REQ-2 to MAIN · take `decide` off three shapes' waive lists

From LANE 1, 2026-08-25, building backlog item 2. Same ask as
`the-first-run/SPEC-ONRAMP.md` §1.4.

**The fact it rests on** (§0.4, verified in source): the forecast is written by
the `decision.record` tool, which refuses a decision with no forecast
(`src/lib/ai/tools/registry.server.ts:4045`, columns at `:4098`/`:4216`), and
`suggestRoute` waives `decide` on `existing-feature` (`route.ts:194-208`),
`interface-change` (`:211-231`) and `under-the-hood` (`:247`). Only
`new-capability` keeps it (`:189`). So 4 of 5 shapes start runs that
structurally cannot record a forecast — the moat is reachable from one card in
five.

**The ask:** drop `decide` from those three waive lists in `SHAPES`
(`route.ts:194-262`). Three lines. It costs one station per run and it is the
difference between a product that captures the decision-time forecast and one
that captures it on one path.

**Kept as-is:** `incident-fix` may keep its waiver — a break genuinely does not
need a business case — and then card 4 is the one card that honestly carries the
run-page line "This one skips the decision, so nothing is being forecast on it."

**LANE 1's side, already shipped:** the run page renders that sentence derived
from `waiverFor(track.route, "decide")` (`route.ts:302`) — a fact about the row,
never a guess. If REQ-2 lands, the sentence simply stops appearing on cards 2
and 3's runs with no further change on my side.
