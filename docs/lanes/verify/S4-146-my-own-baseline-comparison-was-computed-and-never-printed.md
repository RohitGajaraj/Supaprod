# S4-146 · My own baseline comparison was computed and never printed

> _S4, 2026-08-28. Found while verifying a new guard end to end, which is the only reason it was found
> at all._

## The defect, in my own harness

```ts
const drift: string[] = [];          // line 1308
…
if (moved) drift.push(moved);        // line 1437
```

**And nothing ever read it.** `drift` was declared, pushed to on every surface, and never printed,
never asserted, never written to the report.

So **every `REGRESSED` and `IMPROVED` line this spec has ever computed went into an array and stopped
there**, and `e2e/surface-baseline.json` — 29 surfaces of recorded numbers — has been decorative since
it was written. The comparison ran correctly every time and reported to nobody.

**This is the exact shape this lane has spent the night finding in other people's code:** a check that
runs, computes the right answer, and routes it nowhere. `loadGuardrails` swallowing a failed read.
Four panels saying *"no launch plan yet"* on a failed one. A guard scanning the retired token family.
Mine is the same class and I shipped it.

**It was found by looking for a NEW message and not seeing it.** I added the viewport guard below,
ran a phone check expecting *"Not compared"*, and got nothing. The message was not missing — it was
never routed. **A feature I could only find by testing the feature I had just added.**

Fixed: the report now ends with a baseline block, which says either what moved or that nothing did.

```
=== AGAINST THE RECORDED BASELINE ===
  /faq: baseline was taken at 1280x900, this run is 390x844. Not compared.
A RISE IS A PROMPT TO READ THE LIST, NEVER A VERDICT: a surface that starts
explaining itself scores worse and is better. Only contrast fails a build.
```

## The guard that found it: the baseline never recorded its width

A baseline entry records whether it was taken **signed in** — because the same path signed out is the
login page — and did **not** record the **width**. A responsive layout at 390 is a different set of
elements from the same page at 1280.

**So the contrast ratchet, the one check here that fails a build, was comparing phone runs against
desktop numbers.**

**Measured before deciding it mattered.** Contrast at 390 across six public surfaces:

| surface | at 390 | at 1280 |
| --- | --- | --- |
| `/` | 83 below of **233** judged | 83 below of **248** |
| `/faq` | 7 of 35 | 7 of 35 |
| `/security` | 7 of 36 | 7 of 36 |
| `/pricing` | 0 of 105 | 0 of 105 |
| `/product` | 0 of 45 | 0 of 49 |
| `/checkout` | 0 of 24 | 0 of 24 |

**Identical failures at both widths, and no phone-only defect on any of them.** The desktop baseline
was not hiding anything.

**That is a fact about today's CSS, not a property of the check.** The ratchet was getting the right
answer by luck, and one responsive rule would have ended that silently. Entries now carry `viewport`,
a mismatch refuses to compare, and an entry without one still compares so existing baselines keep
working. Three unit tests, no browser.

## Verdict

- **CONFIRMED and fixed: the baseline comparison was never printed.** 29 surfaces of recorded numbers
  did nothing for as long as the file has existed.
- **CONFIRMED and closed: the ratchet compared across viewports.** It agreed by luck on all six
  surfaces measured; it now declines instead.
- **Measured negative: no phone-only contrast defect** on `/`, `/pricing`, `/product`, `/faq`,
  `/security` or `/checkout`.
