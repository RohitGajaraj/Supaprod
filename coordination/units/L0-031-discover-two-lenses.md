# UNIT L0-031: Discover through both lenses + the editor rework

**Lane:** LANE 0
**Completed:** 2026-08-24T20:30+05:30
**Commits:** e94dd2f97 (editor rework), 0ec4ef0a9 + 3443767e2 (Discover)

## What this unit was

Founder browser review of the spec editor (five named defects) plus the
Discover census executed engine-side. Subagent provider was failing
repeatedly; the editor rework landed via an agent whose report died but
whose edits survived, verified and committed; Discover fixes executed
directly.

Editor: bar wears MoreMenu's surface family; ask field takes typing
(root cause: Input unreachable by ref, autoFocus lost every focus race -
Input now takes a ref like its Textarea sibling); bar geometry measures
row pitch from a mirror probe instead of guessing from a line-height
string that can read "normal" (phantom bands root-caused); DOCUMENT /
MARKDOWN segmented control, DOCUMENT default, prose selection opens the
bar via rangeToRects, Keep splices by unique exact match and refuses
ambiguous matches honestly.

Discover: themes.list carries status/reason/reopened (the crew can no
longer re-propose declined clusters); research.synthesize delegates to
the canonical clusterer (second clusterer gone); dead 80-line
promoteSignalToOpportunity deleted; decline can carry a reason (optional,
post-hoc, keyboard verb stays instant); reasons render on Settled rows;
re-opened clusters say "returned after declining" in the ranking.

## Measured

| Metric | Before | After |
| --- | --- | --- |
| Crew themes triage visibility | none | status + reason + reopened |
| Theme clusterers | 2 drifting | 1 canonical |
| Spec editor default view | raw markdown | rendered document |
| tsc / full suite | - | exit 0 / 10,824 pass, 0 fail |

## Handed forward

- Decide fixes next: forecast block in DecisionDetail, setDecisionForecast
  door, approval-queue crew read (census in session log).
- Build census done; its REQ (review-verdict surfacing, run share/export,
  build.* crew reads, trims) queued behind Decide.
- Browser pass on the editor rework still owed (geometry + typing were
  root-caused and unit-tested; real-layout confirmation pending).
