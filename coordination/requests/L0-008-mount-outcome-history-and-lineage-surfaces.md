# REQ-L0-007: three one-line mounts that light up tonight's cross-station work

**Kind:** request to LANE 1 (all three mount points are route files)
**Blocking:** no
**Raised:** 2026-08-24T04:20+05:30

Tonight LANE 0 closed the founder's cross-station gaps end to end on
component+lib paths (unit L0-020 follow-on, commit "Why-routing persists
end to end"). Three features need only a mount in your files:

1. **OutcomeHistory on Brain's learnings tab.** New self-contained
   `src/components/brain/OutcomeHistory.tsx`: aggregation head (N outcomes,
   paid off / mixed / did not pay off split, net ICE movement), full memo
   rows, one-click doors to the graded bet. Mount in
   `_authenticated.brain.tsx` learnings no-drill branch (~:1682) after
   `<CompoundingPanel />`, lazy-imported like its siblings. Cache key is
   character-identical to CompoundingPanel's - zero extra requests.

2. **Hand-off provenance on the run page.** Missions dispatched from Decide
   now write an artifact_lineage edge (opportunity -> mission,
   relation "dispatched" - vocabulary knowledge-graph-view already
   declares). Mounting site: `_authenticated.runs.$missionId.tsx` context
   column (~:1223, beside existing ContextNote blocks), backed by
   `getProvenance({kind:"mission", id})` from lineage.functions.ts -
   one query via the established pattern /decide uses at :1478.

3. **DiscoverSurface member-list why-routing** needs NO mount - it reads
   getLineage client-side and shipped working. Listed here so the board
   shows it complete.

Also flagged for whoever owns knowledge/: LearningDetail.tsx:91 reads bare
["learnings"] without workspace scope while CompoundingPanel scopes by
["learnings", ws] - cache-key drift worth a look.
