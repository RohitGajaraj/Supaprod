# S4-130 · A clean merge into `main` does not mean the lanes agree

> _Created: 2026-08-27 · Last updated: 2026-08-27_

> _S4, 2026-08-27. Measured with `git merge-tree` against the four lane branches as fetched at the
> time of writing. Read-only: no branch, no checkout and no working tree was touched._

## What was found

Every branch merges cleanly into `main`. Two of them do not merge cleanly into **each other**.

```
main x lane/run         clean
main x lane/platform    clean
main x lane/control     clean
main x lane/proof       clean

lane/run  x lane/platform   clean
lane/run  x lane/control    CONFLICT (content): src/routes/_authenticated.approvals.tsx
lane/platform x lane/control clean
```

Both sides are real work and neither is wrong:

| branch | commit |
| --- | --- |
| `lane/run` | `367c58f97` the cap was throwing away the oldest calls, under a page promising oldest first |
| `lane/control` | `1359d70cc` the call you are about to settle says how long it has waited |

One lane reworked how the approvals queue counts and pages; the other added waiting time to the same
rows. Same file, adjacent concerns.

## Why no gate could see it

`lane-gates.sh` gained a merge check in `S4-126`, and it compares against `origin/main` only. **A
conflict between two lanes is invisible to a main-only check by construction**: `main` contains
neither side yet, so both branches answer *"merges cleanly into origin/main"* truthfully, right up
until the second one lands. The lane that lands second then owns a conflict it had no way to know
about, discovered at the deploy, when both sides have moved on from the code.

## The fix, and the part of it that matters

The gate now also compares `HEAD` against every other `origin/lane/*` branch, and when it conflicts
it names the other side's commit — so the message you send has a subject line in it rather than a
request for one:

```
Conflicts with origin/lane/control - not with main, only with that lane
  CONFLICT (content): Merge conflict in src/routes/_authenticated.approvals.tsx
  their side: 1359d70cc The call you are about to settle says how long it has waited
```

**The sibling refs are re-fetched first, and that is the part that makes the line worth printing.**
Comparing against a ref last fetched hours ago answers a question about the past, and *clean* is
precisely the answer nobody goes back to re-check. The fetch is read-only, writes only
remote-tracking refs, and is bounded at 25s: if it cannot finish, the gate says its view is stale
rather than printing a reassuring line it cannot support.

Informational, like the main check. A collision with another lane is not a reason to hold your own
commit; it is a reason to say something today.

**Verified both ways.** The conflict path was exercised against the known-conflicting pair and
printed the block above. The clean path prints `Merges cleanly with all 3 other lane(s), refs just
fetched.`

## The compounding this makes concrete

`S4-124` measured the deploy gap at 182 commits with exactly one conflicting file. Re-measured today:
**199 commits, and a second conflict that did not exist at the first measurement.** The gap grew and
a collision arrived with it, inside one working session. That is the argument for deploying sooner,
with a number rather than an adjective.

## PROVED FALSE, in the same unit: bash does not corrupt this script when it is edited mid-run

While making this change I edited `lane-gates.sh` **while a gate was running**, then killed that run
on the grounds that its verdict could not be trusted — bash reads a script incrementally by byte
offset, so an edit that shifts offsets can, in principle, make a running instance resume inside
different text and end on something other than its verdict. For a file whose entire design is *"the
last line is always the verdict"*, that would be the worst possible failure.

**I could not reproduce it, and I tried at three sizes spanning the real file's 12,178 bytes:**

| script size | edit landing mid-run | last line |
| --- | --- | --- |
| 4,043 B | insert above the unread final line | `VERDICT: GREEN` |
| 8,103 B | same | `VERDICT: GREEN` |
| 16,223 B | same | `VERDICT: GREEN` |

The edit was a truncate-and-rewrite of the same inode, which is exactly what my real edit did. All
three survived, exit `0`, verdict intact.

**So the run I killed was probably fine, and the 28-line snapshot guard I had already written was
reverted rather than shipped.** Shipping it would have meant a confident, well-commented defence
against an incident I cannot demonstrate — which is the exact failure this lane exists to catch, and
it is not less of one for being in tooling rather than on a surface.

Recorded as a negative so nobody spends the afternoon on it again. **What is still true:** do not
edit a script another lane is running, because the hazard is real in the general case even where this
bash on this platform absorbed it. What is **not** true is that a gate run overlapping an edit must be
thrown away.
