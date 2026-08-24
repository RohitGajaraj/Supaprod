# UNIT L0-033: Build through both lenses

**Lane:** LANE 0
**Completed:** 2026-08-25T00:20+05:30
**Commits:** cb4f07fcd (crew reads + trims + two red-main repairs)

## What this unit was

Fifth station through the two-lens method; the last read-side asymmetry.
Build had twelve write tools and zero reads. build.list_sessions,
build.get_run, build.changeset_history close it - the crew can ask what
previous builds changed and whether they merged before proposing new work.

Trims: refreshStudioCi (doorless since the engine-room move), 
listBuilderRuns (superseded; its PR join doubly dead), 
StudioRunDetail.model (declared, never fetched).

Red-main repairs from the other lane's pushes: the chips test's ink-
assertion was unwritable as ported (now checks the semantic stops); the
storage scanner miscounted the preview auth adapter's forwarding setItem
as a product key (skipped as the SDK forward it is).

## Measured

| Metric | Before | After |
| --- | --- | --- |
| Crew build read tools | 0 | 3 (+30 tests) |
| Dead exports | 2 + 1 phantom field | 0 |
| tsc / suite / build | - | exit 0 / 10,646 pass 0 fail / succeeds |

## Handed forward

- REQ-L0-019 to file: Build route-side (review-verdict surfacing, run
  share/export, halted-since at workspace scope, cost query).
- All five censused stations now carry their engine-side closure:
  Brain (L0-026), Plan (L0-028), Ship (L0-030), Discover (L0-031),
  Decide (L0-032), Build (this unit).
