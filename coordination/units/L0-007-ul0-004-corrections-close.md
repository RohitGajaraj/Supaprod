# UNIT L0-007: C-01, C-02 and C-03 close

**Lane:** LANE 0
**Completed:** 2026-08-23T20:05+05:30
**Closing commit:** 220b1bbb1

Per answers/000-OPEN-CORRECTIONS: this unit names which commit closed which
row.

## C-01 (defect): Skip announced work it does not do

`busy={save.isPending}` off Skip in BriefFormationFlow; `disabled={save.isPending}`
on. Its handler is a synchronous setPhase, so aria-busy was a false statement.
The step's own save still blocks the skip so it cannot race the write.

## C-02 (defect): MonoLabel reached Meridian one level short

Three parts:

1. MonoLabel wears Meridian's own `mrd-eyebrow` utility instead of the retired
   `.mono-label` class (nano 10px, weight 650, tracked uppercase, --mrd-mute).
   Weight deliberately rises 500 to 650 per the ruling; contrast improves from
   4.51:1-passing-by-a-hundredth to 5.36:1.
2. RiskTag and DrillHeader, two further `.mono-label` wearers in the same file,
   moved onto mrd-eyebrow with their colour overrides intact.
3. TabRow deleted outright: zero consumers repo-wide, and its only content was
   wrapping FlashlightTabs from the Obsidian barrel. With it gone,
   supaprod/Primitives no longer imports anything retired, so importing
   MonoLabel no longer reaches Obsidian by proxy. Ratchet entry for the file:
   --ds- 17 to 16, obsidian import and usage to 0.

## C-03 (product call): Back could abandon a mid-write

Taken as suggested: all three Back controls disable during their step's write.
Reasoning recorded inline at each site: walking back mid-upsert abandons an
in-flight versioned save, which is destructive; Skip blocking while Back stayed
live blocked the harmless control and left the dangerous one free.

## The guard that had to move

`a-working-control-says-so.test.ts` failed all four sites: its contract said
bare `disabled={x.isPending}` always wants busy. C-01 is exactly the case its
header claimed could not exist - a bystander control whose own handler does no
work, where busy would be the false announcement rather than the honest one.
Extended with an exemption register following focus-ring-is-inherited's house
pattern, keyed by file AND exact expression so any new bare-pending shape in an
exempted file still fails and must earn its own reasoned entry. One entry only:
BriefFormationFlow / save.isPending, citing C-01 and C-03.

This is a shared test file; if MAIN LANE prefers a different shape for the
register, say so in an answer and I will re-shape it.

## Measured

| Metric | Before | After | Query |
| --- | --- | --- | --- |
| Ratchet total | 2,684 / 209 | **2,681 / 209** | design:ratchet over merged disk |
| Primitives obsidian reach | import 1 + usage 1 | 0 / 0 | baseline diff |
| .mono-label classes in supaprod/Primitives | 3 | 0 | grep |
| Bare-pending disabled on bystanders | unpoliced | registered with reasons | guard scan |
| tsc / bun test | - | exit 0 / 10,733 tests, 0 fail | full suite |

## Handed forward

Disk space fact from MAIN LANE's audit stands: ~18GB free after the video
restore. If renders should leave git entirely, that remains a founder ruling;
until then they stay restored on disk.
