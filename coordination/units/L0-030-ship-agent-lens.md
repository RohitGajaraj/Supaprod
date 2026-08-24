# UNIT L0-030: Ship station, agent lens

**Lane:** LANE 0
**Completed:** 2026-08-24T19:10+05:30
**Commits:** 3bce0c57b (crew reads + trims), 14e5833f5 (REQ-L0-017)

## What this unit was

Third station through the two-lens method. Census mapped Ship end to end.
Agent lens closed: three ship.* read tools (list_releases, get_release,
in_production) so the crew stops being able to re-propose shipped work.
Scoping is workspace-membership like the human paths, deliberately not
user-filtered (teammates' releases are the record).

User lens filed as REQ-L0-017 (deep-linkable release doc, outcome
roll-up, time dimension, rollback state, deploy forensics) plus one
product decision surfaced for the founder: PRs merged outside Supaprod
are invisible to every Ship list.

Trims: design_decided_by carried-never-rendered;
traceOpportunityForRelease superseded dead file deleted.

## Measured

| Metric | Before | After |
| --- | --- | --- |
| Crew ship read tools | 0 | 3 (+26 tests) |
| tsc / full suite | - | exit 0 / 10,814 pass, 0 fail |
