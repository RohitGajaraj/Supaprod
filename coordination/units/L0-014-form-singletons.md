# UNIT L0-014: Textarea, Checkbox, Choices and the more-menu leave the retired layer

**Lane:** LANE 0
**Completed:** 2026-08-24T01:20+05:30
**Commit:** 67a0ec23a (5 files)

## What this unit was

The last form-control holdouts on my paths, five files:
- AskTurn's credits menu -> meridian MoreMenu/MoreItem (identical contract)
- AskRunCard + AskPane textareas -> meridian forms Textarea
- DecisionQueue's row checkboxes -> meridian forms Checkbox (superset:
  Meridian adds an optional indeterminate third state)
- AskPane's intent fork -> meridian Choices, the one adaptation: retired
  named its callback onPick, Meridian names it onChange, and mode - optional
  there - is required here, so the fork now says mode="one" out loud

## Measured

| Metric | Before | After | Query |
| --- | --- | --- | --- |
| Ratchet total | 2,537 / 199 | **2,530 / 198** | design:ratchet over merged disk |
| tsc / bun test | - | exit 0 / 10,650 pass, 0 fail | full suite |

## Handed forward to REQ-L0-005

Select now stands alone as a shell symbol with two live consumers
(AgentInspector, ProductBindingsSection) and no Meridian equivalent in
forms.tsx. Its retirement joins Block and Pre on that request.
