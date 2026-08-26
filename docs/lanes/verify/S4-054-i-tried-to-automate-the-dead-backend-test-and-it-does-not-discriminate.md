# S4-054 · I tried to automate the dead backend test. It does not discriminate yet.

> _S4, 2026-08-27. Built, ran, and reported honestly. The spec ships as a tool rather than a gate,
> and the reason is the finding._

## What I set out to do

`S4-051` formalised the dead backend test as a rule. A rule nobody can run is a slogan, so I built it
as a spec any lane could run before shipping an animated surface: `e2e/s4-motion-must-be-earned.spec.ts`.

Point the app at a database that does not exist, load a surface, sample it twice past settle, and
fail if it is still changing. If it moves with no backend, a clock moves it.

## Three instruments, none of which work

**1. Rendered text.** Sampled every visible element's text, twice, nine seconds apart.
**Result: PASSED on `/`** — the one surface already proven to animate with no backend, with
screenshots, in `S4-039`. The station strip changes its **fill**. Its labels never change.

**2. Class and inline style attributes.** Sampled `class` and `style` on every visible element.
**Result: zero of 549 elements changed** over fifteen seconds on the same page. The fill moves
without touching an attribute readable from that side.

**3. Screenshot hashing.** Hashed the viewport instead. It discriminates on the probe: three
different hashes at 6s, 15s, 25s on `/`, which matches what the eye sees.
**Result against real pages: it flagged ALL FOUR surfaces**, including `/pricing`, `/product` and
`/demo`, which carry no state machine at all. They move because those pages have **ambient background
motion**.

## Why that third result is the finding rather than a tuning problem

The spec's own definition, written before it was run, says decoration that carries no state claim is
**not** theatre. Ambient motion is decoration. So the pixel instrument answers *"did the screen
change"* when the question is *"did a STATE change"*, and those come apart on every well-designed
marketing page.

**A gate that fails all four surfaces would be worse than no gate.** It teaches people to skip it,
which is exactly the trap I filed against my own baseline check earlier tonight when it would have
failed other lanes' correct work.

**So the spec now reports and does not assert.** It prints which surfaces are still redrawing and
says plainly that a surface on that list is not automatically theatre, then leaves the judgement to a
person looking at the screenshots.

## What automating it would actually require

A signal none of the three instruments carry: **which elements are state-bearing.** The strip is
theatre because its fill claims a station completed. A gradient drifting behind the hero claims
nothing. Nothing in the DOM distinguishes those, and no threshold on pixel difference would either,
because the strip's change is smaller than the gradient's.

The honest options, none of which I can do from `e2e/**` alone:

1. **Mark state-bearing elements in the source** (`data-state-of="station-3"` or similar) and have
   the spec sample only those. Cheap, and it makes the claim explicit at the point it is made.
2. **Scope the spec to surfaces that have a state machine** and accept it says nothing about the rest.
3. **Keep it human**, which is what `S4-039` did and what actually produced the finding.

Option 1 is the one that would work and it needs a convention, not a test. That is S0's call.

## What I am not doing

**I am not shipping a threshold I cannot justify**, and I am not scoping it to `/` so it passes.
Either would produce a green check that means nothing, which is the class of defect this session
exists to find.

## Verdict

**The rule stands and the automation does not.** `S4-051`'s dead backend test remains the right
method and remains manual: point at a dead database, look at what moves, ask whether it was a state.
It found the hero strip that way and it will find the next one.

The spec is committed as an instrument for that, not as a gate. **The measurement is automated. The
judgement is not, and pretending otherwise was the mistake I caught in myself before committing.**
