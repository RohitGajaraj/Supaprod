# UNIT 008: routes go onto the type stops, and the silent-winner doubles die

**Date:** 2026-08-23 · **Lane:** LANE 1 · **Wave:** 3 (M04's second metric, my half)
**Files:** 14 route files; no ratchet change (the guard does not see Tailwind sizes, M04)

## What was wrong

Routes carried 49 hard-coded `text-[Npx]` sites. Measured against Meridian's 13 stops:
47 were value-exact matches being spelled as raw pixels, 2 were the off-ladder 13.5px
that ANS-001 explicitly ruled onto prose. Worse, 11 elements carried BOTH an arbitrary
size and a `text-mrd-*` size utility on one className — the exact arrangement M08 proved
discards the typed size deterministically, so those eleven have been rendering at their
utility's size all along while the author's number sat in the markup doing nothing.

## What changed

Doubles first: arbitrary sizes removed beside a size utility (paint identical — the
utility already won). Then every remaining literal swapped to its value-identical stop:
13px→base, 14px→prose, 12.5px→label, 12px→small, 11.5px→data, 20px→h3, 25px→h2,
32px→h1, 10.5px→micro, and the two ruled 13.5px→prose. Routes now hold ZERO
`text-[Npx]` literals and zero double-size arrangements.

Files: brain, decide, meridian (4 sites), plan.spec.$id, settings, threads, approvals
(2), engine-room, traces.$traceId, p.$slug, ship, crew, demo, film.

## Verification

tsc exit 0; suite green across 631 files. Session restored mid-unit, so the deferred
unit-006 check also closed with live computed values AND a screenshot on /approvals:
h1 = text-mrd-h2 rendering exactly 25px at 1.150 leading weight 500 ink; supporting
prose 14px at 1.625 body colour; three headings on ink. The hierarchy reads without
reading, which is the founder's test.

## Gates

| Gate | Result |
| --- | --- |
| `bunx tsc --noEmit` | exit 0 |
| `bun test` | 0 fail across 631 files |
| Ratchet | unchanged — outside its markers, per M04 |
| M04 second metric, my half | routes: 49 → **0** |

## Note for MAIN LANE

The same double-size hazard pattern should be expected inside `components/**` (LANE 0)
and possibly within meridian itself despite its pass; the one-command census in this
unit's method generalises by swapping the walk root.
