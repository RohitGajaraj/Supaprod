# UNIT L0-009: Receipts read Meridian directly

**Lane:** LANE 0
**Completed:** 2026-08-23T22:00+05:30
**Commit:** 82fe91d6e (24 files)

## What this unit was

The biggest single count of retired-layer reach on my paths: 23 files
importing Receipt from shell/primitives. Governance panels (8), knowledge
panels (6), memory (2), ask cards (2), observe drift (2), learn, and
Discover's audit section.

## Why it was mechanical where the state trio was not

Meridian's Receipt carries an identical prop contract: verb, consequence,
handoff, time, failed, initials - verified side by side before editing
rather than trusted from the name. So the migration is an import-path swap
per file; zero call sites changed.

Nine files imported nothing else from the retired layer and their shell
import line is gone entirely; fourteen keep Block/Button/Record/Prose and
friends for the remaining tranches.

## Measured

| Metric | Before | After | Query |
| --- | --- | --- | --- |
| Ratchet total | 2,641 / 208 | **2,605 / 207** | design:ratchet over merged disk |
| Receipt imports from shell/primitives | 23 files | **0** | grep |
| tsc / bun test | - | exit 0 / 10,650 pass, 0 fail | full suite |

## Handed forward

Remaining shell/primitives consumers on my paths by symbol count:
Button x8 (tier work per M10), Gate x7 (meridian Gate.tsx exists, contract
check needed), Block x7, Prose x10, Pre x5, plus long tail. AskPane.tsx:140
carries an unused AgentPulse import at HEAD, noted not deleted.
