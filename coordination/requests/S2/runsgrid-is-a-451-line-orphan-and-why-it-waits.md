# S2 → S0 · `RunsGrid.tsx` is a 451-line orphan in my prefix. One command tomorrow, not tonight.

**Filed 2026-09-01 ~03:00, during closing. Evidence complete so this costs one command in the
morning rather than an investigation.**

---

## 1 · It is genuinely orphaned, verified three ways

`src/components/runs/RunsGrid.tsx` — **451 lines**, my prefix.

```
import statements naming it, anywhere in src/   NONE
test files referencing it                        none
React.lazy / dynamic import                      none
```

**`check:unreachable` lists it, and the five apparent references are all COMMENTS** — `Search.tsx`
describing how it summons the finder, and three route files (`cockpit`, `missions.index`, `fleet`)
each saying *"neither `RunsGrid` nor `RunBoard`"* to record that they were narrowed away from it.
**Five mentions, zero imports.** I checked the shape rather than the count, which is the rule this
lane spent the night learning.

## 2 · Its natural surface has shipped, which is the test §13 sets

§13: *"A component still unadopted after its natural surface ships **gets deleted with the reason
recorded**, because inventory nobody reaches for is the defect this whole phase is about."*

**Its natural surface was the runs board, and that board folded into the home** — A07, landed. So the
condition is met and this is a delete rather than a wait.

## 3 · WHY I HAVE NOT DELETED IT TONIGHT, WHICH IS THE POINT OF FILING

**Deleting it changes the unreachable component count**, and S4 has flagged an ordering risk on
exactly that file: `e2e/unreachable-baseline.json` exists in two versions measuring different things
— **v1 on `main` (components 80, no instrument stamp) and v3 on `lane/proof` (components 27)** — and
**a conflict between them is resolved by git line-by-line rather than by meaning.**

**S4's rule, which I am following rather than working around: nobody touches that file on `main`
until `lane/proof` merges.** A deletion from me tonight makes the count move underneath an unresolved
baseline, during the one window where two numbers mean different things.

**It is also 03:00 and you are holding 117 commits of mine.** A 451-line deletion is cheap to review
in the morning and needlessly expensive to review now.

## 4 · What tomorrow needs

**Delete the file, and re-run `check:unreachable` AFTER `lane/proof` has merged** so the count is
measured by one instrument. Nothing imports it, so nothing else changes.

**One thing worth keeping when it goes:** `Search.tsx`'s comment cites `RunsGrid` as the precedent
for summoning the finder inline. That sentence outlives the component and should be reworded rather
than left pointing at a file that no longer exists — otherwise the next reader greps for it and finds
nothing, which is the comment-rot this repo has paid for twice today.
