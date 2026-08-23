# UNIT L0-024: Grids home, cache scoped, spacing completed

**Lane:** LANE 0
**Completed:** 2026-08-24T05:45+05:30
**Commit:** 0812cf702 (5 files)

## What this unit was

Three parallel completions:

1. **Grid swaps** per COMPONENTS.md: EvalScoreChips' sp-grid + --sp-cell-min
   wrapper -> <Grid cellMin={132}>; DetailKit StatStrip's inline
   repeat(count, minmax(0,1fr)) -> <Grid columns={count}>. Disclosed
   change: gap 8px -> Grid's 10px rhythm. 118 ratchet occurrences left
   with the retired grid vocabulary.
2. **LearningDetail cache-key fix**: bare ["learnings"] -> ["learnings",
   activeWorkspaceId] mirroring CompoundingPanel exactly - drill-downs now
   hit the feed's cached rows.
3. **MissionOrchestratorDetail spacing completion**: hero card padding
   "28px 32px" -> s6/s6 per the tie rule - REVERSING L0-019's hold,
   disclosed here: the delta-8 tie was a judgment call and mechanical rule
   application wins until eyes say otherwise. All other literals were
   already on scale from earlier passes.

## Measured

| Metric | Before | After | Query |
| --- | --- | --- | --- |
| Ratchet total | 2,425 / 184 | **2,307 / 180** | design:ratchet over merged disk |
| tsc / bun test | - | exit 0 / 10,659 pass, 0 fail | full suite |

## Handed forward

- Sub-nano sizes (REQ-L0-005 addendum 3): awaiting ruling.
- MissionOrchestratorDetail nearest-stops needing authenticated eyes:
  only alignment/micro constants remain by design.
- REQ-L0-007's three route mounts: awaiting LANE 1.
