# S4-157 · The detector for the commonest defect was run by nothing

> _S4, 2026-08-28. Static, whole-repo, deterministic across consecutive runs._

## The class

S3 spent the night finding components that are **exported, complete, correct, and imported by
nothing**, and named the class: *"the most common defect I have found on these surfaces — more common
than wrong logic, and completely invisible to every gate we have."*

Five instances, found by hand:

| | |
| --- | --- |
| `MessageMetaFooter` | the only control that can rate a recall — **S4-155** |
| `AutoChip` | the only visible trace of a machine-raised decision, on **166 of 369** rows |
| `OutcomeHistory` | 188 lines, built for *"Brain > Outcomes, beside CompoundingPanel"* |
| `AskInPlace` | 176 lines |
| `LiveTicker` | 99 lines, *"the top bar"* |

## This lane already had the detector, and nothing called it

```
$ bun run check:unreachable
141 of 656 server functions have NO importer in src/.
80 of 492 exported components in src/components have NO importer.
```

**It finds all five.** Every single one S3 discovered by reading code.

**And it exited 0, and appeared in no gate.** `grep -c "check:unreachable" scripts/lane-gates.sh`
returned **0**.

> So the class was not invisible for want of an instrument. **The instrument existed, found
> everything, and told nobody.**

That is the same shape as the baseline comparison in `S4-146`, computed on every surface and never
printed, and it is the fourth time tonight a check has been correct and unheard. **Writing the
detector is not the job. Wiring it is.**

## Now a gate, and a ratchet

`141` and `80` is debt nobody in flight wrote, and a check that fails everywhere on the day it is
switched on is the one somebody reverts — the lesson already paid for by this repo's Meridian ratchet.
So it **fails on an increase and never on the number itself**, with the frozen counts in
`e2e/unreachable-baseline.json` and the new number printed whenever it improves.

**Anti-vacuity guard included**, because tonight has earned it: if either population is zero the scan
did not run, and it refuses rather than reporting clean. A sizing run earlier reported *"0 errors"*
from a compiler that had died, and the zero looked exactly like a pass.

### Mutation-tested with a real orphan, not a fiddled number

```
$ cat > src/components/supaprod/S4OrphanProbe.tsx   # exported, imported by nothing
$ bun run check:unreachable
  UNREACHABLE COUNT ROSE: components 80 -> 81.
  Something exported is imported by nothing. That is finished work that never
  reached a screen … invisible to tsc, eslint, the build and the tests.
  exited with code 1

$ rm src/components/supaprod/S4OrphanProbe.tsx
  Holding at 141 server functions and 80 components with no importer.   exit 0
```

Testing it with a real file rather than by lowering the baseline exercises the **detector**, not just
the comparison — which is the difference between proving the guard and proving the arithmetic.

## What the number is not

- **80 orphaned components is not 80 defects.** The check says so itself: a helper exported for
  testing, or a component library with unused exports, lands here legitimately. `Primitives.tsx`
  alone contributes 5.
- **The five above are defects** because each is a finished feature that never reached a screen, and
  that is a judgement about those five rather than a property of the count.
- **`AutoChip` is already fixed** on `lane/platform`, so this number should fall by one when that
  merges. The ratchet allows that and asks for the baseline to be lowered.

## Verdict

- **CONFIRMED: the detector existed, found all five hand-found orphans, and no gate ran it.**
- **FIXED: `unreachable` is now a gate**, frozen at 141 and 80, failing only on an increase,
  mutation-tested with a real orphan in both directions.
