# S2 → S0 · S3 drove my first screen and found five. One is fixed; four are open and they are mine.

**Filed 2026-09-01 ~03:20 during close-out. S3's report is at `docs/lanes/log/S3.md` (`7582da56d`);
they changed nothing in `src/`, which was right — these are `components/today/**`.**

---

## FIXED TONIGHT

**#4 · the elided subject.** *"Nothing has happened yet, so undo is free."* sat between the heading
*What needs you* and the count *All 65*. **S3 read the reasoning in the comment before forming a view
and agreed it is sound** — the judgement is right and no count can carry it. **The defect was that
the subject was missing**, so the nearest referent became the queue and a stranger read *"there is
nothing here"* above 65 things that need them.

Now: **"Nothing has happened on this one yet, so undo is free."** Three words, and it is the rarest
kind of wrong sentence — not false, and made to read as its own contradiction by what it left out.

---

## OPEN, AND ALL FOUR ARE MINE

### 1 · Four numbers for one question, no two equal
`All 65` (Ready for your review) · `Waiting on you 93` (run list, same viewport) · `Gates 16` (tab) ·
**77 undecided-and-unexpired in `agent_approvals`.** **S3 could not reconcile them with the database
open** — which is the finding, because a reader cannot possibly.

### 2 · A date the screen contradicts two inches higher
*"The oldest has been waiting 44 days, and is not on this page"*, while a card on the **same screen**
reads **"Waiting 53 days"**. The oldest undecided approval in the database is **38 days**. **44 comes
from neither**, so whatever set it is computed over is not the one the reader is looking at.

### 3 · The headline ignores its own disclaimer
The 93's paragraph says *"17 of these repeat others on this list, and 5 ask for work this board
already shows as finished."* **The screen knows 22 of its items are noise and headlines the
uncorrected total.** The prose is more honest than the number above it — the inversion of the usual
failure, and I wrote the disclaimer myself.

### 5 · False composure — architectural, and the sharpest of the five
**Eight independent `useQuery` calls in `Board.tsx` with no coordination**, so a resolved panel
speaks at full confidence beside one that never answered. S3 saw *"Suggested next"* rendering a read
failure while every neighbour showed settled numbers. **S4 traced it from code independently
(S4-191) and their name for it — FALSE COMPOSURE — is the right one.**

---

## WHY THESE ARE FILED RATHER THAN FIXED, AND IT IS NOT FATIGUE

**#1, #2 and #3 are all one question: which population does each number count?** Fixing any one by
adjusting its own arithmetic would make it agree with the screen and disagree with the database, or
the reverse. **They need the four populations named once** — what `All`, `Waiting on you`, `Gates`
and `agent_approvals` each mean — and then every number derived from that, in one commit. That is a
unit, not a patch, and doing it at 03:20 during a close is how a number gets fixed into a new wrong
shape.

**#5 is architectural.** `SlowRead`/`use-slow-read.ts` already half-know about the neighbourhood, and
the fix is a composure rule across eight reads, not a string.

**And one correction to S3's report, in their favour:** they noted *"Director's read"* is still the
rendered name on main. **Correct — my rename to "Suggested next" is on `lane/control` and unmerged.**
It is not a second instance.

**Timing they measured, which matters for #5:** **979 ms warm** to a readable count (loading cleared
at 104 ms, count painted at 925 ms). Cold 9.3 s is Vite's first compile and production does not pay
it. **So the loading states are brief, and #5 is about what the rest of the screen claims DURING
them.**
