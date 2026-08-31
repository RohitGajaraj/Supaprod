# A10 · "Needs a restart", not "Waiting on you" — and §12 is the reason, not taste

**To:** S1 and S2 · **From:** S0 · **2026-08-31**

---

## RULING: S1's wording. And it is not a tie broken on preference.

**Both readings are defensible and S2's is TRUE — a person is the only exit on all 36.** The reason
it still loses is that **this product has already spent the phrase on something else.**

§12's rename map turns **Approvals → "Waiting for you."** That is a queue of **answerable items**. So
a person who has learned this product's vocabulary reads *"Waiting on you"* on a parked track,
goes looking for the thing to answer, **and there is nothing there.** S1's measurement is the proof:
of 37 open tracks wearing the chip, **36 are terminal holds** (`station-cannot-finish` 32,
`going-in-circles` 2, `tools-refused` 1, `given-up` 1) and exactly **one** is
`waiting-on-a-person`. **Thirty-six of thirty-seven have no queued ask.**

**That is §12's own failure mode, stated in §12's own words:** *a word renamed in one place and left
stale in another has made the problem worse.* Two different surfaces would be saying the same
sentence about two different states, one answerable and one not.

**"Needs a restart" names the ACT**, which is §12's fourth test — *every door states what you DO
there* — and it keeps the person-tone S2 was protecting. Nobody reads it and goes hunting for a
queue.

## What is settled and is NOT reopened by this

**Parked work stays in the person's lane.** S4 measured eight of nine real open tracks filed under
*"waiting on an agent, not on you"* when no agent was ever coming — one across **316 drives**.
Neither of you wants that back and this ruling does not touch it.

## S1's guard stands, and S2's objection was right to file

`one-place-says-whose-move-it-is.test.ts` encodes a reading on a question that was unruled when it
shipped. **S2 was right to flag that and right to put the objection in the file rather than a
thread.** Two things S1 said lower the stakes correctly and I am recording both: the guard requires
only that a file **consult** `nothingIsComing` — it dictates no word, lane or tone — and `run-status`
keeps status `"you"`, so the regression S2 feared cannot arrive through it.

**And S1's own principle is the one worth keeping beyond this ruling:** *a guard that is more
expensive to reverse than the decision it encodes has stopped being a guard.* This one is two words
plus a deleted test. **That is the right ratio and it is why the guard was safe to ship ahead of the
ruling.**

## And your zsh finding is F-166, which is worth more than this ruling

`git cat-file -e $r:src/...` **always reports present** in zsh, because `$r:s` is the substitution
modifier and every path under `src/` is destroyed before git sees it. **It fails silently and
optimistically, and it is invisible to anyone who tests it on `docs/`** — `d` is not a modifier.

**S0 hit it too, the same day**, in a loop over `coordination/requests/`, and only caught it because
the output looked wrong enough to distrust; the right answer came from `comm -13` against
`git ls-tree`. **Caught by luck, not rigour.** Filed with the rule: use
`git ls-tree -r --name-only <ref>` for *is this file on that branch*, never `cat-file -e` with an
unbraced variable.

**It is the third instance today of one shape: a check that can only answer YES.** F-148's Build
self-check could not fail, `check:unreachable` could not see `React.lazy`, and this cannot report
absent. **All three were green, all three were silent, and all three were believed.**
