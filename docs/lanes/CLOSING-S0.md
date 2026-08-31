# CLOSING NOTE — S0 · CONDUCTOR

> _Created: 2026-09-01 · Last updated: 2026-09-01_
>
> Written to the founder's close-out format: **DONE · PENDING · OBSERVATIONS · NEXT.** For tomorrow
> morning rather than for the archive.

---

## DONE

**The loop walked five stations of seven with nobody touching it, and then corrected itself.**
`ce846e9b`: `sense → decide → define → design → build` in seventy minutes, every drive
`driven_via='sweep'`, zero presses, zero answered approvals, nothing waived. At Build it met a
repository that has nothing to do with the work and refused, three times, correctly — and at 21:10
**the correction machinery sent it back to Define and reset its attempts, unattended.** Six
transitions, every one `actor='system'`. A clean walk would have shown the loop can go forwards; this
showed it notices it is stuck and acts.

**The Build→Ship repair loop ran unattended for the first time.** `studio.fix.commit` executed twice
against `102b4c91` with no approval answered, and F-149's damage — 22 HTML entities and not one real
`=>` — is repaired by the loop itself. **Four findings had to compose:** F-152 released the mode,
F-153 put the branch `ref` in the brief, F-154 stopped it staging a revert, **F-179** raised the
dispatch ceiling that had retired the head sha for ever.

**Fourteen findings filed and fixed tonight (F-175 … F-187).** The ones that matter most:

| | |
| --- | --- |
| **F-178** | A waived station left no mark, so `waived='[]'` certified a track that skipped four stations. **I opened that hole myself in F-174 hours earlier** |
| **F-181** | The station job is read by every seat, so Decide told the critic to record. **14 decisions for one question → 1**, verified live |
| **F-179** | A CI fix that commits nothing spends no budget and retires its head sha for ever |
| **F-175** | Six hold sites computed a reason and threw it away. **97 held tracks, one `last_hold_because`** |
| **F-185** | The model was never shown a tool's parameters. **146,239 tokens on one identifier** |
| **F-184** | Nothing told a person the evidence was silent on their subject. The door is built and **live on `/start`** |

**Every lane merged to main and the fleet is at zero.** Four lanes, ~230 commits, gated on the merged
tree rather than on any one branch.

## PENDING

**The founder's, and nothing moves without them:**

1. **`CREATE POLICY` is refused on the database path** (F-180, corrected). `ALTER` turned out to work
   after all — **my first diagnosis named a whole statement class from four failures in one window
   and was too broad.** The notices table is applied with RLS **enabled and no policy**, which is
   deny-all and therefore safe; the owner-select policy is the one statement outstanding.
2. **`CLAUDE.md:166` claims a gate that does not exist** (F-182). `docs-doctor` runs from neither the
   git hook nor the four Claude Code hooks. It is quoted as a reason not to check by hand.
3. **`is_sample` authority, and which timestamp is canonical.** Two flags on the deployments join that
   never both clear; then `created_at` versus `deployed_at` with 20 of 24 rows backdated.
4. **F-187 — the acceptance query's own F-79 clause reaches 1 answered approval of 176.** It is in
   `CLAUDE.md` verbatim. **Not changed tonight on purpose**, because the fix depends on whether the
   other 175 are genuinely track-less, and rewriting the acceptance query at 03:00 with a candidate
   live is the worst moment to touch it.

## OBSERVATIONS

**The dominant defect class all night was a state that looks healthy and is terminal.** F-175's silent
hold, F-178's unrecorded waiver, F-179's dead changeset with `fix_attempts: 0` and a tick reporting
`ok` every two minutes for eight hours. **Every instrument said fine.**

**The second was an instrument reporting confidently on a partial sample.** I published a wrong ship
count from one `is_sample` flag, a wrong date from one row's horizon, a wrong N+1 justification from a
component that does not fetch, and I ran `cmd | head; echo $?` — which reports `head`'s status — for
most of the session until S2 caught it. **That habit then caught two failures once and fourteen
another time, and a corrupted merge that would have put a broken tree on main.**

**Five source-text assertions broke on edits that changed no behaviour.** Each was fixed by asking
what the test meant to ask rather than what its anchor happened to catch.

**The strongest mechanism in this fleet is two lanes measuring the same thing and disagreeing.** It
caught F-85, the `is_sample` split, the horizon date, and F-187 — and in the last case the
disagreement was *itself* irreproducible, which is what put the join under a microscope. **The
disagreement was not the finding; it was the instrument that produced one.**

**And the crew is not the weak part.** Three seats across two tracks independently reported that the
evidence was thin, and the Build seat named the repository it had been handed and where the work
actually belongs. **Every time a station "failed" tonight it was telling the truth.**

## NEXT

1. **Bind the track to a product.** `ce846e9b` will circle rather than die because `product_id` is
   NULL and Build reaches the workspace default repo. **A re-plan cannot reach a binding fault.**
   This is the top of S4's list and mine.
2. **`2fdf93b6`, candidate four**, is chosen against all three failure modes at once — evidenced,
   implementable in the connected repo, and not an attribution claim. Watch it.
3. **S3's `/start` measurements**: four different answers to *"what needs me?"* on the first screen a
   signed-in person sees, which is where the sixty seconds is measured. S2's.
4. **Gap #8** — anchor the objects in the run pane. S1 and S2 both name it as the highest-value
   remaining item, and `presenceAnchor()` still has one caller.
5. **The demo approval queues expire 2026-09-25**, inside the SkyDeck window, and they thin before
   they empty.
