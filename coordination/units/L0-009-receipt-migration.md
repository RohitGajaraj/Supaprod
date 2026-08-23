# UNIT L0-009: Twenty-three files read receipts from Meridian

**Lane:** LANE 0
**Completed:** 2026-08-23T22:00+05:30
**Commit:** 82fe91d6e (24 files)

## What this unit was

The largest single symbol still reaching shell/primitives on my paths:
Receipt, at 23 importing files. Meridian's own Receipt carries an identical
prop contract ({verb, consequence, handoff?, time?, failed?, initials?}),
verified side by side before any edit, so the migration is an import-path
change per file with zero call-site edits. Nine of the twenty-three files
imported nothing else retired, so their shell import line died entirely;
fourteen keep other symbols for later tranches.

Coverage: governance (9 panels), knowledge (6), memory (2), observe (2),
ask (2), learn (1), plus ContradictionAuditSection already counted.

## Measured

| Metric | Before | After | Query |
| --- | --- | --- | --- |
| Ratchet total | 2,641 / 208 | **2,605 / 207** | design:ratchet over merged disk |
| Receipt imports from shell/primitives | 23 files | 0 | grep |
| tsc / bun test | - | exit 0 / 10,650 pass, 0 fail | full suite |

## Handed forward

Remaining shell/primitives consumers by count: Button x8, Gate x7,
Block x7, Prose x10, Pre x5, Select x2 and singletons (Choices, Textarea,
MoreMenu/MoreItem, Checkbox, CtxRow/CtxHead/CtxBody re-exports). The Gate
count overlaps approvals surfaces where meridian/Gate.tsx exists; contract
check next tranche.
