# UNIT L0-008: The state trio leaves the retired layer

**Lane:** LANE 0
**Completed:** 2026-08-23T21:10+05:30
**Commit:** eeda1e57d (11 files)

## What this unit was

Mission #4 (empty/loading/error states), first tranche: the ten component
files importing Empty, Failed or Loading from the retired shell/primitives
layer migrated onto Meridian's own parts. Route files in the same grep
belong to LANE 1 and were left alone.

## The mapping, per symbol

- Failed -> ReadFailedLine (surface-parts): identical three-prop contract,
  nine pure swaps.
- Loading: the retired component branches internally. Plain reads became
  LoadingState with the old sentence as label; the one agent-branch site
  found (ContradictionAuditSection's contradiction-auditor pulse) became
  AgentPulse with seed and detail preserved.
- Empty -> EmptyRegion demanded authorship: a title stating what is empty
  as a fact about THIS surface. Four titles written ("Nothing asked yet",
  "No runs yet", "No lessons yet", "Nothing to point at yet"), old copy
  kept verbatim as body text.

## Files

ask/{AskSwitcher,AskRunCard,AskTurn,AskPane}, cockpit/AgentInspector,
connections/{ProductBindings,WorkspaceBindings}Section,
knowledge/ContradictionAuditSection, today/PushedInsights,
trust/ReceiptDetailSheet.

Import hygiene: trio symbols removed everywhere; non-trio shell symbols
(Button, Block, Receipt, Record, Prose, Pre and friends) deliberately stay
- they are separate follow-up work, not this unit's scope. One correction
during the pass: an agent-authored duplicate surface-parts import in
AskSwitcher was merged back into one line.

## Measured

| Metric | Before | After | Query |
| --- | --- | --- | --- |
| Ratchet total | 2,665 / 208 | **2,641 / 208** | design:ratchet over merged disk |
| Trio imports from shell/primitives (components) | 15 file-sites | 0 | grep import lines |
| tsc / bun test | - | exit 0 / 10,733 tests, 0 fail | full suite |

Process note: two agent runs from before the session interrupt had already
converted some of these files; every overlap was verified against the spec
rather than re-edited, one duplicate import merged, and the final tree
gated as a whole. The ratchet failure that forced the re-freeze listed
eight files' usage counts falling - the guard confirming the reclaims.

## Handed forward

1. Remaining shell/primitives consumers on my paths by count: Receipt x22
   call sites (meridian has its own Receipt.tsx - contract check needed),
   Button x8 (tier work), Gate x7 (meridian Gate.tsx exists), Block x7,
   Prose x10, Pre x5.
2. AskPane.tsx:140 imports AgentPulse unused at HEAD; pre-existing, noted
   not deleted per surgical rule.
3. LoadingState renders an elapsed counter the retired Loading never
   showed; correct per spec but worth eyeballing on the run card where
   polling stretches time.
