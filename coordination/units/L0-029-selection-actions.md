# UNIT L0-029: SelectionActions - the passage-to-agent toolbar, built into Meridian

**Lane:** LANE 0
**Completed:** 2026-08-24T08:40+05:30
**Commit:** d1e7e3215

## What this unit was

Founder directive: inline + AI editing for specs, with any new component
living in the Meridian design system. Investigation found Meridian had
DOCUMENTED SelectionActions three times (surface-parts.tsx:1776,
DiscoverSurface:289/:2985) and never built it - a genuine gap. Built
there per the ruling.

- meridian/SelectionActions.tsx: four phases (nothing handed / working /
  keep-or-discard / broken), rect anchoring + textarea mirror measuring,
  rangeToRects for future prose consumers, Ask-AI-to-edit instruction
  field, before/after diff with Keep primary. One recorded deviation:
  Escape reports upward instead of self-hiding.
- prdAssist instruct mode at the chokepoint (discovery.functions.ts),
  citation markers preserved, byte-compatible legacy payloads.
- Spec editor rewired: capture-at-select-time (focus can no longer eat
  your place), epoch guard on abandoned runs, Keep refuses stale splices;
  fire-and-forget replacement deleted.
- COMPONENTS.md regenerated; FineTuneCard evaluated and passed over
  (property inspector for design props - different job).

Also repaired main red-on-arrival from Unit 034 (--text-mrd-* namespace
does not exist; glance strip hid behind the headline union) - then LANE 1
withdrew the strip mid-rebase and their deletion won.

## Measured

| Metric | Before | After |
| --- | --- | --- |
| AI edit affordance | 4 fixed verbs, silent replace | verbs + free instruction + diff/Keep/Discard |
| tsc / suite / build | - | exit 0 / 10,788 pass 0 fail / succeeds |

## Handed forward

- GEOMETRY UNVERIFIED IN A BROWSER: mirror-div measurement needs real
  layout; happy-dom computes none. Dev-server pass owed before publish.
- Release document and prose surfaces can adopt SelectionActions via
  rangeToRects when their lanes pick it up.
