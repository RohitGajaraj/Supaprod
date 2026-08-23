# UNIT L0-016: Block to Region, Pre to Pre - the census was wrong and the ruling proved it

**Lane:** LANE 0
**Completed:** 2026-08-24T02:30+05:30
**Commit:** c11625a86 (13 files)

## What this unit was

Executing answers/RL0-005: my REQ-L0-005 premise (no Meridian home for
Block or Pre) was false - both live in surface-parts.tsx. Lesson recorded
by the ruling: grep meridian's EXPORTS, not file names; there is no barrel
and the reasonable-looking ls conclusion was wrong.

## The three-way judgment RL0-005 required

Exactly one more/onMore call site exists tree-wide:
ReceiptDetailSheet's "Close". Judgment: goTo/onGoTo. It neither navigates
to a named destination nor reveals a section nor dispatches work - it ends
the sheet's view of its subject, which is the plain-button slot that
announces no state. Reasoning recorded beside the site.

All other Block sites are plain title/sub/lead/children compositions;
Region accepts them unchanged.

## The Pre margin check per site

The retired .sp-pre baked margin-top: var(--sp-space-3) = 12px; Meridian's
Pre deliberately sets none. All seven sites sit directly under content they
separated from (summary lines, count rows, region headers), so each takes
a mt-mrd-4 wrapper div = 10px, the nearest stop to 12.

Deviation from the ruling disclosed: RL0-005's example said mt-mrd-3, but
s3 is 6px - half the retired air. I took the nearest stop by pixel distance
per the UL0-002 nearest-stop discipline instead.

TestStationPanel converted as well: it lives in obsidian/, the layer
scheduled for deletion, so every retired import it sheds is one less
blocker when that deletion lands.

## Measured

| Metric | Before | After | Query |
| --- | --- | --- | --- |
| Ratchet total | 2,530 / 198 | **2,498 / 197** | design:ratchet over merged disk |
| Block/Pre imports from shell/primitives | 12 files | **0** | grep |
| tsc / bun test | - | exit 0 / 10,650 pass, 0 fail | full suite |

## Handed forward

Remaining shell/primitives reach on my paths: Select x2, Record x4,
Value x3, SelectionBar x2 - all in REQ-L0-005 addendum 2 awaiting ruling.
MissionOrchestratorDetail spacing-role pass remains the big open surface
item.
