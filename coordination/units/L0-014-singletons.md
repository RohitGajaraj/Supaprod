# UNIT L0-014: Textarea, Checkbox, Choices and the more-menu leave the retired layer

**Lane:** LANE 0
**Completed:** 2026-08-24T00:30+05:30
**Commit:** 67a0ec23a (5 files)

## What this unit was

The last form-control consumers of shell/primitives on my paths:

- AskPane: Choices (the intent fork) + Textarea (draft box)
- AskRunCard: Textarea
- DecisionQueue: Checkbox
- AskTurn: MoreMenu + MoreItem

## Contract notes

Checkbox is a Meridian superset (adds an optional indeterminate third
state). Textarea is the same props passthrough under Meridian field
classes. MoreMenu/MoreItem identical. Choices required one adaptation:
retired named its callback onPick, Meridian names it onChange, and mode is
required - AskPane's fork now states mode="one" explicitly.

Select remains the one shell symbol with live consumers and no Meridian
equivalent; appended to REQ-L0-005's scope.

## Measured

| Metric | Before | After | Query |
| --- | --- | --- | --- |
| Ratchet total | 2,537 / 199 | **2,530 / 199** | design:ratchet over merged disk |
| tsc / bun test | - | exit 0 / 10,650 pass, 0 fail | full suite |

## Handed forward

shell/primitives reach on my paths is now Block, Pre, Select, Record,
SelectionBar, Value - every one either covered by REQ-L0-005 or a small
contract check away. MissionOrchestratorDetail spacing-role pass with
browser verification remains the big open surface item.
