# S4-134 · All 29 surfaces have a contrast number, and it can only get better

> _S4, 2026-08-27. Every surface in `e2e/surface-baseline.json` measured in a real browser against
> the dev server on :8080, dead backend, the 18 authenticated ones signed in. **Nothing was unjudged
> on any surface**, so every count is of the whole page. Measured on `lane/proof`, which does not
> contain S3's `cc23c49fc` or `0b295b0a2`._

## The state of the product, in one table

**18 signed-in surfaces**

| clean (0 below AA) | judged |
| --- | --- |
| `/today` 47 · `/approvals` 45 · `/brain` 31 · `/threads` 52 · `/guardrails` 63 · `/engine-room` 66 · `/settings` 69 · `/start` 59 · `/plan` 25 · `/inbox` 46 · `/crew` 91 · `/sync` 59 | 653 |

| 2 below AA each | `/learn` · `/ship` · `/build` · `/decide` · `/design` · `/discover` |
| --- | --- |

**11 public surfaces**

| surface | below AA | judged |
| --- | --- | --- |
| **`/`** | **83** | 248 |
| `/faq` `/privacy` `/security` `/updates` | **7** each | 35–50 |
| `/pricing` 105 · `/subprocessors` 69 · `/ard` 39 · `/checkout` 24 · `/brief` 15 · `/investors` 15 | 0 | 267 |

> **The signed-in product is in far better shape than the shop window.** Twelve of eighteen
> authenticated surfaces are clean. The single worst surface in the product is the home page.

## The six signed-in surfaces are one Meridian token

`/learn`, `/ship`, `/build`, `/decide`, `/design` and `/discover` each report exactly 2, and the two
are identical everywhere:

```
span.sp-stage-n     4.43:1 needs 4.5:1 at 11.5px/400   "07"
span.sp-stage-state 4.43:1 needs 4.5:1 at 12.5px/400   "count unavailable"
```

`src/styles/shell.css:772` and `:930` both set `color: var(--mrd-mute)`, and

```css
--mrd-mute: oklch(0.7 0.006 70);   /* meridian.css:324 — "labels, metadata" */
```

**This is not six defects. It is one design-system token, 0.07 short, on the station strip's ground.**

| `--mrd-mute` | sRGB | ratio |
| --- | --- | --- |
| `oklch(0.70 0.006 70)` today | `#a19e9a` | **4.43** |
| **`oklch(0.71 0.006 70)`** | `#a4a19d` | **4.60** |

**One hundredth of lightness clears 12 elements across 6 surfaces.** Not mine to change: `CLAUDE.md`
says a gap in Meridian is built in Meridian, and a token used product-wide is not a verify-lane edit.
Raised with **S0**.

## The number can now only go down

Contrast joined the baseline as `contrastBelow`, and it is **the only check in this spec that fails a
build on a count**.

Everything else here needs a person to read it: a drifting gradient may be decoration, a long line
may be a table, and a rising failure-sentence count may be a surface that started explaining itself —
that last one actually happened, and no threshold fixes it. **Contrast needs nobody.** 4.5:1 is
published, the ratio is arithmetic on two colours, and a surface that stops clearing it has no second
reading.

**It is a ratchet, not a bar.** It fails on getting *worse* than the recorded number, never on the
number itself, so tonight's 83 on `/` blocks nobody and new debt is a build failure.

### Proven in both directions, because a ceiling asserted is a ceiling nobody has seen work

```
/faq baseline lowered to 0 (it measures 7)
  1 failed
  Text on a surface dropped BELOW WCAG AA where it used to clear it...
    /faq: 0 -> 7 below AA, worst shapes: p 4.10:1 needs 4.5:1 at 14px/400 "Last updated August 7,
    2026"; a 4.10:1 ... "Security"; a 4.10:1 ... "ARD"
restored to 7
  1 passed (20.8s)
```

It names the surface, the movement, and the three worst shapes with their ratios and their actual
text, so the failure is actionable without opening a screenshot.

## A latent flaw in the baseline, found by running the same command twice

`/learn` signed out measures **0 below AA of 11 judged**. Signed in it is **2 of 62**. Signed out it
is the *login page*.

**One baseline entry per path cannot hold both**, and nothing recorded which run produced a number —
true of every check in that file since it was written, not just contrast. Comparing across the two
reports an improvement or a regression that is really a redirect.

Entries now carry `mode`, and a mismatch **refuses to compare** rather than guessing:

```
/learn: baseline was taken signed-in, this run is public. Not compared.
```

Three unit tests cover it, including the case where the stored entry predates the field, which is the
one that would have called every surface a regression on the first run after the upgrade. `bun test`
runs them with no browser.

## What these numbers are not

- **They are dark theme, one browser, one dead backend.** S3 shipped a fix tonight reading 4.10 in
  dark that would have been roughly 3.8 for a light-theme viewer, and **this sweep could not have
  seen it**. Every count here carries that limit.
- **A ratio is not a diagnosis.** `/demo`'s `"Join the beta"` measured 2.41:1 and I reported the
  colour as too dark. It was not: both sides were resolving to light-theme values because the page
  pinned nothing. The check cannot tell "too dark" from "wrong theme entirely", and those need
  opposite fixes.
- **An ancestor `opacity` under-reports**, since it fades text without changing either computed
  colour.
- **`/terms` is still not measured.** It is not in the baseline.

## Verdict

- **29 of 29 surfaces have a measured number, with nothing unjudged on any of them.**
- **CONFIRMED: `--mrd-mute` is 0.07 short**, 12 elements, 6 surfaces, one token. **S0's.**
- **The ratchet is armed and mutation-tested both ways.** Existing debt is a queue; new debt fails.
