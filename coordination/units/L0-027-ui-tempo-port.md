# UNIT L0-027: ui/* leaves the Tempo scale where Meridian has an answer

**Lane:** LANE 0
**Completed:** 2026-08-24T07:10+05:30
**Commit:** 6d1128842 (R013 item 2, ruled as one unit)

## What this unit was

MAIN LANE's R013 queued the nine-file ui/** port off --ds-* as LANE 0's
next unit and the prerequisite for deleting styles.css's Tempo scale.
A value-verified mapping table was built first (separate research pass);
the port then applied it exactly, stopping on four genuine gaps instead
of inventing tokens.

109 -> 25 var(--ds-) references across ten files. The 25 survivors are
precisely: link hue (--ds-blue-700/-800), z-modal/-menu/-drawer,
size-medium/-large, popover-row-height. All filed as ADDENDUM 6 with
requests for Meridian-side stops or rulings.

Bug found by the port: --ds-overlay-backdrop-color/-opacity were defined
NOWHERE - dialog, alert-dialog and sheet backdrops rendered fully
transparent. Now bg-mrd-scrim; opacity modifiers deleted (scrim carries
alpha).

Also in-unit: shadcn alias classes (bg-secondary/text-foreground/
border-border) swapped to their Meridian answers at the call site;
gray-400 split by role (field/edge/line); text-label-14 retired to
mrd-label/mrd-base; focus rings rewritten to the outline pattern except
input.tsx, which is not exempt from focus-ring-is-inherited and carries
border steps per the founder's caret ruling (2026-08-15).

One out-of-scope assertion updated: obsidian/button-consolidation.test
pinned ui/button's old amber string; now asserts bg-mrd-hold.

## Measured

| Metric | Before | After |
| --- | --- | --- |
| var(--ds- in ui/** | 109 | **25 (all NO-FIT gaps)** |
| Overlay backdrops | transparent | scrim |
| tsc / full suite | - | exit 0 / 10,713 pass, 0 fail |

## Handed forward

- MAIN LANE: addendum 6 carries the four gap requests; until they land,
  the Tempo scale deletion waits on exactly those tokens.
