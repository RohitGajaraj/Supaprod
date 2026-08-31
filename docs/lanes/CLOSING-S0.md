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

## THE DEPLOY

**Fired at 22:04 UTC and landed at 22:06:32** — `5dbe51fe`, moving the origin-served
`x-deployment-id` from `b1a8ccf1…` to `f8ae362b…`. Verified per F-165 by the header the ORIGIN
serves, not by the id the publish returned, because publish status has lied three times in one night
and *"compare BYTES"* is retracted: an HTML md5 changes on every fetch, content-hashed asset names
cannot move for a server-side change, minification removes the symbol a grep looks for, and the root
HTML names only the 38 shell assets.

**S1, S3 and S4 each declined the deploy independently and in writing**, and between them named the
failure mode — the fleet ending with every lane assuming another has it — before it could happen.
S4's reason is the one to keep: *an irreversible outward act whose authorisation reaches you relayed
through two peers is not the same as being told directly.*

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

**AND THE NIGHT'S SHARPEST FINDING IS S4'S SYNTHESIS, MADE DURABLE BY S1: FIVE INSTRUMENTS ACROSS
FOUR LANES, EACH RETURNING A CLEAN CONFIDENT ANSWER ABOUT SOMETHING IT STRUCTURALLY COULD NOT SEE.**
S3's guard regex that could not cross the dot in `data.monthlyGrantCredits - data.balanceCredits` —
the exact spelling that shipped the defect. Their `innerText` probe reading against an `aria-label`.
Their `count(*)` reporting 77 for 7 because it counted approval-by-run pairs. S4's CSP gate whose
evidence for an origin was **the security log's record of its own past finding about that origin.**
And S1's relayed `git log` truncation warning, which they had not measured and which does not
reproduce anywhere — 8,319 commits, three worktrees, no truncation.

**S4's line is the one to carry: a finding that confirms your prior is the one you are least likely
to check.** S1 spent the night refusing unverified claims from three lanes and then relayed a third
party's to two of them, because it agreed with what they already believed about instruments. **They
wrote the retraction into their log rather than deleting the messages**, which is the right shape:
the mechanism is worth more than the correction.

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
3. **S3's `/start` measurements, and this is where tomorrow starts.** The first screen a signed-in
   person sees gives **several different answers to *"what needs me?"*** — All 65, Waiting on you 93,
   the Gates tab 16 — drawn from **a fifteen-call deduped union across eleven tables**, and **not one
   of them names its population.** S3 could not reconcile them with the source and the database open.
   **Every number is individually true, which is what makes it harder than a wrong number.**
   `components/today/**`, so S2's, and it is the screen §0.7 measures the sixty seconds on.

   > **A FIGURE I CARRIED HERE WAS ALREADY RETRACTED AND S2 CAUGHT IT BEFORE IT REACHED THE FOUNDER.**
   > I had listed *"`agent_approvals` 77"* as one of the four. **It is 7.** S3 withdrew it, S2 verified
   > the withdrawal with their own query rather than accepting it, and the cause is the same fan-out
   > that produced F-187: `count(*)` joined on `mission_id` counts approval-by-run PAIRS, and one
   > mission holds 28 runs. **The finding is unharmed** — that table was only ever one contributor to
   > the union — **but a retracted number inside a correct finding is exactly what gets the finding
   > dismissed when somebody re-measures it.**
4. **Gap #8** — anchor the objects in the run pane. S1 and S2 both name it as the highest-value
   remaining item, and `presenceAnchor()` still has one caller.
5. **The demo approval queues expire 2026-09-25**, inside the SkyDeck window, and they thin before
   they empty.
6. **S3-Q2, the layer-02 vocabulary sweep, is NOT in S3's closing note** and they flagged the gap
   themselves rather than pushing a commit mid-deploy to fix it. `QUEUE-S3.md` on main carries it with
   the fuller reasoning — **not frozen** (§0.7 names twenty routes and six component directories;
   `docs/pitch/**` is in neither), correctly ranked below their unfinished job 1, and with the
   measurement that matters: `public/brief.html` is clean while the deck has **drifted 77 lines**
   against a README requiring them byte-identical. **If tomorrow starts from a closing note rather
   than from the queue, that item is invisible**, which is why it is here.
