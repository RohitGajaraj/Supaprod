# S4 · the proving ground · handed off 2026-08-28

`lane/proof` rebased onto `main` and pushed. **S0 does the integration merges. Do not push to `main`
from a lane.** Full detail, including every claim proved, refuted and unverified:
[`docs/operations/session-handoff.md`](../docs/operations/session-handoff.md).

## The one thing to read first

**The gates could not see the code that proves the product works.** `tsconfig.json` includes `src/**`
only — `e2e/` is absent and every `*.test.ts` is excluded — and `bun test` does not run Playwright
specs. I proved it by breaking a spec and watching all four gates go green on a spec that could not
start, then by putting `const x: number = "definitely not a number"` in it and getting **zero** tsc
errors.

Fixed with `e2e/tsconfig.json` and a `tsc:e2e` gate. **The unit suite is still unchecked: 797 files,
414 type errors.** Not gated, because failing every lane on debt none of them wrote is how a check
gets reverted rather than fixed.

## The gate is now six

`tsc` · **`tsc:e2e`** · **`unreachable`** · **`aliases`** · `docs:check` · `test` · `build`

`unreachable` and `aliases` are new, and both were detectors **this lane had already written and
nothing ran**. `check:unreachable` finds 141 of 656 server functions and 80 of 492 components with no
importer — including all five orphans S3 found by hand. It printed them and exited 0.

Every ratchet freezes today's debt, fails only on growth, and carries an anti-vacuity guard.

## Three rules this session paid for

1. **A scan of nothing must never report clean.** Earned three times: `0 below AA of 0 judged`,
   `0 errors` from a compiler that had died, and `12,531 of 12,531` recalls "rated" — which was
   counting a column default.
2. **A number that is suspiciously total is the same smell as one that is suspiciously round.** Both
   mean the thing being counted is not the thing you think.
3. **Mutation-test with a real defect, not an edited baseline.** A real orphan file proves the
   detector; changing the frozen number only proves the arithmetic.

## Do not re-investigate

The guardrails did **not** go silent 33 days ago — that is when a seed last ran. `--mrd-mute` is
**not** short; the cause was a 17% wash on the selected stage. `spine_tracks.spend_cap_usd` is **fed**
by a resolver. The `md` breakpoint is **not** why tablets fail tap targets. Editing a bash script
mid-run does **not** corrupt its verdict. Full list with evidence in the handoff.

## Left measured and unowned

`meridian/` and `shell/` have no live owner. `Door` (the retry in every failure line, 56x21, inline in
prose), `ReadFailed` (repeats the shell's session sentence and draws a second door), and
**`track_drives` — 323 rows recording every station drive, including 40 human presses, written and
read by nothing.** That last one is the founder's own test failing: the work agents do, recorded
faithfully and never shown.

## Habit worth keeping

**Four defects in my own instrument were found by trying to prove a fix, not by hunting a fault.**
Each returned a confident wrong answer rather than no answer. Verify the thing you just built by
looking for the message you expect and noticing when it does not appear.
