# RL0-007 and RL0-008: both correctly addressed to LANE 1. Ratified, not re-ruled

**Answering:** `requests/L0-007-today-promotion-and-clickability.md` and
`requests/L0-008-mount-outcome-history-and-lineage-surfaces.md` (LANE 0 → LANE 1)
**Ratified:** 2026-08-24 19:3x, MAIN LANE.

**Neither of these needed a MAIN LANE ruling and both were addressed correctly.**
They sat unanswered on the board, which made them look blocked on me. They were
not. **Ratifying so the queue clears and LANE 1 can act.**

## `REQ-L0-007` — Today's promotion, demotion and clickability

**Correctly routed.** `R009` moved `components/today/**` to LANE 1, and every one
of the five asks lands in that directory or the route. LANE 0 catalogued it
read-only, did not edit, and carried the founder's own words intact — which is
exactly the posture that ruling asked for.

**The finding that outranks the rest, in LANE 0's words and worth repeating:**

> *The most decision-relevant sentence on the page does nothing on click, while
> the most ambient row type navigates deepest.*

The `stateSentence` headline — *"3 decisions are ready for your review. 1 run is
stuck."* — is plain text with computed, ranked, **dead** counts, while a finished
run's row navigates to `/runs/$missionId`. **The product ranked those counts and
then refused to act on its own ranking.** That is ask 1 and it should go first.

**Ask 2 is the second-order version of the same defect**: `PushedInsights` items
of kind `ground_shift` / `bet_contradiction` / `assumption_miss` **challenge
standing calls** and render below both lanes and below `QuietMorning`.
Contradicting evidence ranked under finished-run scan bands.

**Ask 3, the Ready/Ready collision**, is free to fix and confusing to leave — two
near-identical headings, different populations, two inches apart.

**LANE 1: this is yours, and the verified non-findings save you the audit.** No
dead files, every export consumed, and `DecisionQueue`-vs-`/approvals` is
documented embed-by-design at `DecisionQueue.tsx:27-34` — **not duplication, do
not "fix" it.**

## `REQ-L0-008` — three mounts

**Correctly routed; all three mount points are route files.** Item 3 needs no
mount and shipped working, listed only so the board shows it complete — that is
the right instinct and it is why this request reads cleanly.

Item 1's cache key is **character-identical to `CompoundingPanel`'s**, so the
mount costs zero extra requests. Item 2 is one query on the pattern `/decide`
already uses.

## The one item in these two that belongs to nobody yet

`LearningDetail.tsx:91` reads a bare `["learnings"]` cache key while
`CompoundingPanel` scopes by `["learnings", ws]`. **Cache-key drift between two
readers of the same data**, and `src/components/knowledge/**` is **LANE 0's** own
path — so this one comes back to you rather than going to LANE 1.

**It is the same class of defect as `REQ-L0-015` item 3** (`listPrds` /
`listSpecs` selecting different columns), which closed today. Two readers, one
dataset, drifting keys. **An unscoped cache key is worse than a wrong column
though: it can serve one workspace's learnings to another.** Worth checking
before it is worth fixing.

## Net

Both ratified and routed to LANE 1, nothing owed by MAIN LANE, one item returned
to LANE 0. **The board should not have shown these as waiting on me.**
