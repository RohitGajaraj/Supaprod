# S4-070 · How many times does one dead read announce itself?

> _Created: 2026-08-27 · Last updated: 2026-08-27_

> _S4, 2026-08-27. A quality metric S3 asked for, built and measured. Six product surfaces, signed
> in, one unreachable database. `bash e2e/check-motion.sh --signed-in <paths>`._

## The number

**One dead backend. How many distinct failure statements does a person read?**

| surface | distinct statements | "Try again" |
| --- | --- | --- |
| `/today` | **2** | 0 |
| `/approvals` | 3 | 1 |
| `/threads` | 3 | 0 |
| `/guardrails` | **6** | 1 |
| `/brain` | **7** | 1 |
| `/learn` | **7** | 2 |

**S3's threshold: above two, the surface needs work.** Four of six are above it.

## Why this is a real metric and not a tidiness score

Failure states are the states nobody designs. They are assembled a component at a time, each one
locally correct, and **nobody sees the total until the page renders with everything broken** — which
is a condition that does not occur in development, does not occur in review, and is exactly what this
harness manufactures.

`/brain` and `/learn` at 7 are not badly written. Every one of those sentences is good:

> *"The standing rules did not load, so this is not a claim that nothing is standing."*
> *"The map did not load. Nothing it draws is lost, and the Graph tab still holds it."*

**That is the point.** Seven excellent sentences about one failure is still seven, and the person
reads a wall. The defect is not in any component; it is only visible in the sum.

## The cross-check, which is why the number can be trusted

S3 rendered `/guardrails` by hand and counted **six**. This measured **seven**, and the extra one was
the **tab label "What went wrong"**, matched by a bare `went wrong` in my pattern.

Anchoring it to `something went wrong` brings the tool to **6, matching their hand count exactly**.
A metric another lane will act on cannot count a tab as an error, and the only reason I found it was
that somebody counted the same page independently.

## What it does not do

- **It counts sentences, not causes.** Two statements from two genuinely different failed reads is
  honest and scores the same as two from one.
- **It cannot tell a duplicated fact from a scoped one.** S3's fix separates "the chip owns the
  state, the sub owns the consequence", which is right and still counts as two.
- **`/guardrails` is measured BEFORE `b79766374`**, which S3 reports takes it from six to three and
  four retries to two. Not in my tree yet, so not re-measured. Their number, not mine.

## Also settled here: the station strip is not clipped-unreachable

`S4-069` left open whether the phone station strip actually scrolls, or only looks like it does. A
general check now reports any element whose content is wider than its box **and** whose `overflow-x`
is `hidden`, which together mean unreachable.

At 390x844 on `/today` and `/approvals` it found **only `span.sp-sr-only`** — screen-reader text,
which is clipped on purpose and is now excluded with the reason written down. **The station strip is
not in the list, so it is not clipped-unreachable**, and `shell.css`'s claim survives on the point
that mattered. Whether it *signals* that it scrolls is a design question this cannot answer.
