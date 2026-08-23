# UNIT L0-021: Why-routing persists; the crew inherits the case; Learn gets its face

**Lane:** LANE 0
**Completed:** 2026-08-24T04:30+05:30
**Commit:** 8e73494bc (5 files) + REQ-L0-007 filed

## The founder's authorization, executed

He authorized server-side writes and migrations for the two deepest gaps.
Neither needed a migration: artifact_lineage already carries rationale and
the relation vocabulary already declares "dispatched".

## Why-routing end to end

cluster.server.ts creation path now writes per-member rationales derived
at claim time ("Founded theme <title> (<model summary>)" with summary,
bare title without). Same batch upsert shape as the July attach-time
write. DiscoverSurface's member list reads back through getLineage and
renders each reason under its source label at one step quieter than the
preview. Legacy "Clustered into theme" placeholder = treated as no reason,
rendering nothing - nothing fabricated. Leftover: pre-change members stay
reason-less until re-cluster.

## Crew inherits the case + lineage edge

handOffGoal() ships labelled sections (Bet/Problem/Hypothesis/Target
user/Scores/Critic verdict+summary) capped ~3600 of 4000, blanks say "Not
stated". StartSchema takes origin {kind:"opportunity", id};
startOrchestratedMission upserts opportunity->mission dispatched into
artifact_lineage (copying cluster.server's insert pattern exactly), bare
catch non-fatal. Relation already declared in knowledge-graph vocabulary -
Brain renders it with no new words. Success toast carries bet title.
Other startOrchestratedMission callers pass no origin and are untouched.

## Learn face

OutcomeHistory.tsx lands in brain/: aggregation head via rescoresOf
(N outcomes, paid off/mixed/did not pay off split, net ICE when nonzero),
RecordLine rows carrying full memo plus metric evidence, one-click doors
to graded bets through graph focus. Cache key character-identical to
CompoundingPanel's. Silent while pending/error/empty. Mounting instruction
filed as REQ-L0-007 item 1.

## Measured

tsc exit 0; bun test 10,659 pass, 0 fail across 632 files.
