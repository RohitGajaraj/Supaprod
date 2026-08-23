# UNIT L0-010: Seven gate surfaces read Meridian's Gate

**Lane:** LANE 0
**Completed:** 2026-08-23T22:45+05:30
**Commit:** 5a541e903

## What this unit was

Gate x7 migrated: ApprovalsPanel, HouseRulesPanel, TrustGraduations,
ControlsPanel (governance), MemoryReviewQueue, DecisionQueue, AskGateCard.
Meridian's Gate carries the identical contract including linesLabel, whose
comment records a shipped regression it exists to prevent - so this is an
import-path swap per file with zero call-site edits. Three files dropped
their shell import line entirely.

## Tooling slip caught by the compiler

The first conversion script mis-parsed brace positions on multi-symbol
import lines and emitted `{ {` into DecisionQueue and AskGateCard.
tsc failed at the import line immediately; fixed by hand and the remaining
five converted with a corrected brace-slicing parser. Recorded because it
re-confirms the repo's oldest lesson: run the compiler before claiming
anything.

## Measured

| Metric | Before | After | Query |
| --- | --- | --- | --- |
| Ratchet total | 2,605 / 207 | **2,594 / 204** | design:ratchet over merged disk |
| Gate imports from shell/primitives | 7 files | **0** | grep |
| tsc / bun test | - | exit 0 / 10,650 pass, 0 fail | full suite |

## Handed forward

Remaining shell/primitives consumers on my paths: Button x8 (tier work),
Block x7, Prose x10, Pre x5, plus singletons. Block has no direct Meridian
equivalent named in M08-M10 - likely a meridian-gap request or Surface;
check before converting.
