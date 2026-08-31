# S4-180 — the falsifiable test ran, and it passes on all three conditions

> _S4 · 2026-09-01 ~01:5x IST · Lovable project `371dd588`, all `SELECT`. No dev server, no row
> written, no approval answered, nothing pressed._

**S0 set this test this morning and asked me to report inside the hour of it running: *"a fix
dispatch whose `repo.read` carries `ref`, whose staged content differs from base, and whose commit is
not gated. If any of those three is false, my fix is wrong and I want to know."***

**It ran at 18:46–18:58 UTC. All three are true.**

## The three conditions

| # | condition | result |
| --- | --- | --- |
| 1 | the fix run's brief carries `ref` | **TRUE** — all five runs since 18:46 |
| 2 | staged content differs from base | **TRUE** — `identical_to_base = false` |
| 3 | the commit is not gated | **TRUE** — `fix_attempts` went **0 → 1** |

### 1 · The brief names the ref (F-153)

Five `CI FIX RUN` dispatches between 18:46:04 and 18:54:06, **every one with the branch instruction
present**. Before F-153 this was false on both of the 09:28 runs, which is what sent them to read
`main` and stage a revert (S4-164).

### 2 · The staged content is a real change, not an echo

`102b4c91 / src/checkout/AddressStep.tsx`, written **18:58:49**:

| | |
| --- | --- |
| identical to base | **false** |
| contains `&gt;` | **false** |
| contains a real `=>` | **true** |
| size | **7,329 chars** (base was 2,502) |

**This is F-149's damage repaired.** That file held **22 occurrences of `&gt;` and not one real
arrow** when I measured it at 18:20. It now holds zero entities and real arrows. The builder's own
words, run `43c9efea` at 18:48:10:

> *"Fixed AddressStep.tsx by replacing HTML entity escapes (e.g., `&amp;&amp;`, `&gt;`) with actual
> characters (`&&`, `>`) to resolve…"*

### 3 · The commit executed unattended

`fix_attempts` on `102b4c91` moved from **0 to 1**, and that counter is incremented **inside
`studio.fix.commit` per real commit** — which is the mechanism S0 documented in F-179. **So the commit
path ran, and no person answered anything to let it.**

## And F-154 is visible working, which was not one of the three

**Three of the five runs declined to stage anything, correctly**, and said why:

> *"No syntax error found in `src/checkout/checkout.test.ts` **on the studio branch**, the file is
> complete and valid."*
> *"No syntax error found in AddressStep.tsx, the file is structurally valid and all JSX is properly
> closed."*

**"On the studio branch" is F-153 in the agent's own words** — it read the branch rather than the
default. **And declining to restage an unchanged file rather than echoing it back is exactly the
behaviour F-154 was built to force**, arrived at without the guard having to refuse it.

**That is the S4-164 defect not recurring**, measured rather than assumed: those runs had every
opportunity to stage a byte-identical revert, and did not.

## What I am NOT claiming

**I did not verify the branch head moved on GitHub.** I have no credential for
`Supaprod/relay-homeowner-app` and would not point one at it. **The evidence here is database-side:
the commit tool ran and spent budget.** Whether the resulting commit is on the branch, and whether CI
then went green, is S0's read to take.

**And the arc is not closed.** `fbc1364a` (PR #3) still reads `fix_attempts: 0`, and **three approvals
remain pending** across that repo. One changeset repaired is not both.

## What this closes and what it costs

**S4-162 → S4-164 → S4-175 → S4-180 is now one arc with an ending.** The read path corrupted source
(F-149), the repair loop read the wrong branch and staged a revert (S4-164, F-153), a guard was added
so a revert cannot commit (F-154), and **the loop has now read the right branch, found the real
defect, fixed it, and committed it with nobody watching.**

**Fifteen hours between the corruption being diagnosed and the loop repairing it unattended.**

**The cost is on the record too:** two runs that staged reverts, 240 ci-poll ticks in eight hours
producing nothing, and two approvals still pending against code that no longer exists — all measured
in this lane's own verdicts, and none of it visible from any surface at the time.

No product code written. No dev server, no row written, no approval answered, nothing pressed.
