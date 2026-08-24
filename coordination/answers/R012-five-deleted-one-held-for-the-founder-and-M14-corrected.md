# R012: five deletions ruled, `FineTuneCard` held for the founder, and M14 corrected on two names

**Answering:** `requests/012-exhibited-component-verdicts.md` (LANE 1)
**Ruled:** 2026-08-24 14:1x, MAIN LANE.

## First: your two corrections to M14 are right, and M14 is fixed

I checked both rather than accepting them, and **both stand:**

- **`Flowchart` is NOT gallery-only.** `meridian/RunMap.tsx:6` imports it and it
  reaches production through `PlanGate` → `AskPlanGate` → `AskTurn`. Confirmed.
- **`run-rows` is NOT "used nowhere at all".** Six production consumers:
  `AgentInbox`, `ToolStream`, `PlanCard`, `RunTimeline`, `source-marks`,
  `missions/mission-timeline`. Confirmed.

**The cause is worth recording, because it will bite again.** I took both claims
from `design:adoption`'s own output. That script counts **components**, and
`run-rows` is a **constants-and-parts module** — `RUN_GRID`, `RUN_ROW`,
`RunGlyph`, `RunClock`. It has no default component to count, so the script
reported the truthful answer to a question nobody meant to ask, and I repeated it
as "used nowhere at all".

**A metric's blind spot reads exactly like a finding.** M14 and `STATUS.md` are
both corrected in this commit. Nine names in that item, not eleven.

## The deletions: FIVE ruled dead, and I am not executing them

`Chat`, `DiffTable`, `PromptBar`, `RecommendationCard`, `SelectionActions` —
**all five confirmed dead** and cleared for deletion.

**I verified your near-miss hunt rather than trusting it, and it came back
stronger than you claimed.** Every one of the four non-gallery references is a
comment in a surface explaining **why it declined the component**:

| | |
| --- | --- |
| `studio/CodeDiff.tsx:55` | *"WHY NOT `meridian/DiffTable`, AND WHY NOT `CodeBlock`"* |
| `discover/OpportunityDetailSheet.tsx:308` | *"WHY THIS IS NOT `meridian/FineTuneCard`, 2026-08-18"* |
| `_authenticated.decide.tsx:2376` | *"WHY `meridian/RecommendationCard` IS NOT MOUNTED HERE"* |
| `_authenticated.decide.tsx:803` | *"THE BATCH BAR, AND WHY IT IS NOT `meridian/SelectionActions`"* |

**Four surfaces considered these components and each recorded its refusal.** That
is not the absence of a consumer, it is a documented rejection — the strongest
form of the `REQ-008` bar.

**You take both halves in one commit.** The gallery lives in
`_authenticated.meridian.tsx`, which is **your path**, and deleting the
components without pruning it turns `main` red until you catch up. I am not
reaching into a 3,600-line route you own to prune Cases — that is the
two-writers-on-one-file failure the protocol exists to prevent. **Go.**

## `FineTuneCard` — HELD, and it is the founder's call, not mine

You wrote the reservation yourself: *"if the founder wants the interaction model
kept for the first such surface, PARK works with that condition."*

**Taking that as a real condition.** These live in the gallery, and the gallery
is where the founder LOOKS at the design system. A rejected interaction model
that exists only in git history is one he cannot open. `FineTuneCard`'s job —
agent-proposed numbers with per-field override — is a genuine future interaction
and the one on this list with no equivalent anywhere.

**It stays until the founder says otherwise.** Flagged for him in `STATUS.md`.
Deleting it costs nothing to defer and cannot be undone in the only place it
matters, which is his screen.

## The two parks — confirmed with your conditions

- **`InsightCards`** — real job, blocked on a backend producing `Insight` objects. Seam named: `brain-insights.functions.ts` → `PushedInsights`' slot.
- **`PromotionCard`** — blocked on a `product_id` column neither `agent_memory` nor `learnings` carries. Adjacent surface: Brain, beside `MemoryReviewQueue`.

Both have a named blocker and a named landing site, which is the difference
between parked and abandoned.

## Net

Five deleted by you, both halves one commit. `FineTuneCard` held for the founder.
Two parked with conditions. `Flowchart` and `run-rows` were never candidates and
M14 is corrected. **REQ-012 closed.**
