# QUEUE — S4 · THE PROVING GROUND (`lane/proof`)

> _Rewritten by S0 2026-08-31. **S0 writes this file; you read it and never write it.** Your brief is
> [`SESSION-4-THE-PROVING-GROUND.md`](../../the-first-run/SESSION-4-THE-PROVING-GROUND.md)._
>
> **You write `e2e/**` and `docs/lanes/verify/**` and NOTHING in `src/`.** You cannot fix what you
> find, and that is what makes you worth having.

---

## S4-Q1 · The unregistered-writer ratchet — F-161, and it is yours because it needs no `src/`

**Goal.** A standing check that names any commit on any lane branch written by a session outside the
fleet.

**Why you.** It is the enforcement half of a finding **you and S1 and S2 each hit from a different
side today**, and it lives entirely in a script and a verdict — no product code.

**The detector already works and is free.** Every registered fleet session stamps a
`Claude-Session:` trailer. The foreign writers do not. Run against `origin/lane/run` this afternoon
it named, correctly and without a false positive on content: `d9acc36e3` (*"S1 UNIT 7 PLANNING"*, a
unit S1 never started, **no trailers at all**), the `1636 → 105` truncation of
`docs/operations/session-handoff.md`, and **a duplicated RUN-126 pair under two SHAs**.

```bash
for c in $(git log -40 --format=%h origin/lane/<x>); do
  git log -1 --format=%B "$c" | grep -q 'Claude-Session' || echo "$c"
done
```

**Acceptance.** Merge commits are excluded (they legitimately carry no trailer) and the exclusion is
**stated, not silent** · the output names the branch, the sha, the time and the subject · **it
reports rather than blocks** — this is evidence for a founder ruling on which session owns which
worktree, not a gate · **it must not fire on S1's withdrawn case**: their first report was a benign
mid-flight rebase and they retracted it correctly, so the ratchet has to separate a rebase from a
foreign writer, which is exactly what the trailer does.

## S4-Q2 · The golden set, built from real graded runs — gap #24

**Goal.** Your verdicts become cases a change can be tested against, instead of being proved one at
a time by hand.

**Why it is queued second and not first.** *"Build it from real graded runs — one built from a
broken pipeline encodes the breakage."* **The pipeline is still broken**: the honest acceptance
query returns **0**, the only two real learnings are a **duplicate pair** (F-158), and the sweep's
whole budget goes to one track that cannot move (F-155). **So build the harness now and seed it
only from runs that were genuinely graded.** An empty golden set that says so is worth more than a
full one built from `is_sample` rows.

**Acceptance.** Every case names the run it came from and the date it was graded · **no case is
seeded** — and if that leaves the set nearly empty, **the set says nearly empty** (standard #7) ·
the set is versioned and a change is tested against **the records that failed**, which is the
startup guide's own mechanic.

**Standing, unchanged.** Adversarially verify Tier 0 as it lands — **S0 cannot sign off its own
spine work (R-11)**, and you have already corrected S0 four times today, including refusing a defect
S0 told you to file. **That is the job working.** Plus the two drift checks: an unargued departure
from the playbook, and any lane rebuilding what the vendor gives away.
