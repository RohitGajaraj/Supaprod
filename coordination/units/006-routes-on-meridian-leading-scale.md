# UNIT 006: routes go on Meridian's leading scale, and the double-size hazard dies

**Date:** 2026-08-23 · **Lane:** LANE 1 · **Wave:** 3 (M13 conversion pass)
**Files:** 11 route files, no baseline change (the ratchet does not see leadings; M04)

## What was wrong

18 bare Tailwind leadings across `src/routes`, the exact collision M13 measured:
`leading-tight` (Tailwind 1.25) sat where Meridian says 1.15, `leading-snug` (1.375)
where Meridian says 1.5, `leading-relaxed` where prose happens to match at 1.625.

And a second defect fell out of reading each site before editing, the one M08 warned
about in its "two things you must not do": seven sites carried BOTH an arbitrary size and
a size utility on one element (`text-[13px] text-mrd-prose`, also 12.5px and 14px
variants). The utility is emitted after arbitrary values and wins silently, so every one
of those elements has been rendering at 14px regardless of what the author typed. The
arbitrary sizes were dead code pretending to be a decision. Removed beside their
leadings, which changes nothing today and stops the next reader from trusting either name.

## The conversion

`leading-relaxed` → `leading-mrd-prose` (value-identical) · `leading-tight` →
`leading-mrd-tight` (headings tighten to system) · `leading-snug` → `leading-mrd-snug`
(the crew line gains the air the founder asked for).

Files: traces.$traceId, brain (2 sites), demo, p.$slug, meridian (5), settings, threads,
approvals (2), film, crew, engine-room. Routes now hold zero bare leadings.

## Verification, stated exactly

`tsc` exit 0, full suite 10,726 pass / 0 fail. Computed-value checks ran on public
surfaces only: my authenticated session expired mid-verification and I hold no
credentials to restore it, so /approvals, /brain and the rest were NOT re-rendered under
my eyes this unit. What bounds the risk honestly: the relaxed half is value-identical by
measurement (M13's own table), the tight/snug halves move three headings tighter and one
line looser using utilities whose rendered values were already verified inside Meridian,
and the removed arbitrary sizes were already losing the cascade before removal. MAIN
LANE live-verifies deploys with database access; an eyeball pass on those pages at its
next live check closes this fully. Not claiming more than that.

## Gates

| Gate | Result |
| --- | --- |
| `bunx tsc --noEmit` | exit 0 |
| `bun test` | 10,726 pass / 0 fail across 630 files |
| Ratchet | unchanged at 2,756 — leadings are outside its markers, per M04/M13 |

## Next

Wave 1's last big item on my paths: shell/AppFrame.tsx and shell/primitives.tsx.
