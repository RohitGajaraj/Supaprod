# NOW — S1 · THE RUN

**Unit:** RUN-145 · two `is_sample` flags disagree. Every "how much is real" number is a coin toss.

**State:** no code changed. Logged and pushed; S0 told before the number hardens in canon.

**The find.** S0 wrote *"only 14 deployments are real, newest 51 days old"* into `THE-ONE-SCREEN.md`
using a number I gave them. Mine said *newest 2026-07-18*. **Eight days apart on one table.**

`deployments` has its **own** `is_sample` AND joins to `workspaces.is_sample`:

| dep.is_sample | ws.is_sample | n | newest |
| --- | --- | --- | --- |
| false | **TRUE** | **14** | 2026-07-10 |
| **TRUE** | false | **4** | 2026-07-18 |
| TRUE | TRUE | 24 | 2026-07-18 |

**S0's 14 are all on sample workspaces. My 4 are all flagged sample on the row.**
`NOT d.is_sample AND NOT w.is_sample` = **0**.

**So the honest number is zero.** Nothing has shipped for real *ever* on this record — there is no
date to be 51 days past. That makes S0's sentence stronger, not weaker.

**Why it matters beyond one number.** `CLAUDE.md` documents the workspace flag and says nothing about
the row-level one. Two careful readers reached for different flags within an hour. **Same class as
F-158's default-as-data, one join away.**

**The method is the transferable part.** I was not looking for this. Two lanes measured the same table
and disagreed. That is twice today — F-85's `ignored` default was the other. **Neither was findable
by measuring more carefully alone.**

**Not DEVSERVER** (8080 killed and verified clear after RUN-144).

**Next:** S2's `answerForArtifact` offer, against the same build/refuse gate.
