# S4-131 · The seven stations are the least readable text on the home page

> _S4, 2026-08-27. Measured in a real browser against the running dev server on :8080, four public
> surfaces, dead backend. Public surfaces render fully without a database, so this is the shop window
> measured as a visitor gets it. Every count below names its population._

## Why contrast, and why now

Everything else this lane measures is motion or structure. **This is the only measurement of how the
product LOOKS that does not need an opinion.** WCAG AA is 4.5:1 for body text and 3:1 for large text,
the ratio is arithmetic on two colours, and it is the same number any frontier lab's own audit runs.
Most of "premium" is judgement. This part of it is not, so it is now measured on every run.

## What it found

| surface | below AA | judged | not computable |
| --- | --- | --- | --- |
| **`/`** | **12** | 141 | 107 |
| `/pricing` | 0 | **0** | 105 |
| `/product` | 0 | 40 | 9 |
| `/demo` | 0 | **3** | 11 |

**On `/`, the twelve worst pieces of text include all seven station names.**

```
span 2.94:1 needs 4.5:1 at 10px/400 "Discover"
span 2.94:1 needs 4.5:1 at 10px/400 "Decide"
span 2.94:1 needs 4.5:1 at 10px/400 "Plan"
span 2.94:1 needs 4.5:1 at 10px/400 "Design"
span 2.94:1 needs 4.5:1 at 10px/400 "Build"
span 2.94:1 needs 4.5:1 at 10px/400 "Ship"
span 2.94:1 needs 4.5:1 at 10px/400 "Learn"
span 2.94:1 needs 4.5:1 at 10px/400 "mission trace / replayed"
span.font-mono.text-mrd-nano 4.10:1 needs 4.5:1 at 10px/400 "Code" / "Design" / "Docs" / "Work"
```

**The seven stations are the product.** `README.md` tells the whole thing as three layers and seven
stations; the home page names them at 10px and 2.94:1, which is the lowest contrast on the surface.
The one idea a visitor must leave with is rendered as the least readable text on the page.

## Cause, at one line

`src/components/landing/replay/Replay.tsx:21`

```ts
faint: "#565c66",     // on card: "#0d0d0e"
```

A station not yet reached is drawn in `R.faint`; reached is `R.text` (`#e6e8eb`), working is `R.blue`.
`#565c66` on `#0d0d0e` is **2.88:1 by hand**, against 2.94 measured — the small gap is the exact
ancestor the text actually sits on, and the two agreeing is the check verifying itself.

**The dimming is right and the value is too low.** Future stations SHOULD recede; that is the
strip's whole argument. WCAG does not object to hierarchy, it objects to the floor.

**`#737b87` computes to 4.54:1 on the same ground** and is a small lift in the same hue, so `text` at
about 15:1 still reads as arrived and `faint` still reads as pending. Offered as a starting value to
verify in place, not as a design ruling: the ground varies where `R.faint` is reused.

## The result that is NOT a pass, and this is why the population is printed

**`/pricing` reports zero failures out of ZERO judged.** 105 elements were not computable. Read
without its population that line says the page is clean; it says nothing at all. `/demo` judged 3 of
14 and is nearly as empty.

The cause is the check's own honesty rule: the effective background is the first ancestor painting an
**opaque** colour, and anything painting an image or a gradient in that chain makes the true backdrop
uncomputable from styles. `/pricing` evidently paints one high in its tree, so every element under it
is unjudged. **This is the same behaviour axe-core has** — it returns those as *incomplete* rather
than guessing — so the rule is right and the coverage is poor. Worst-case evaluation against a
gradient's own colour stops would convert most of that 105 into a real answer, and that is the next
unit rather than a caveat left standing.

## What it does not do yet, said plainly

- **It reports; it does not fail the build.** Four lanes are pushing tonight and a first-ever
  threshold across 29 surfaces, turned on before the number is known, blocks work on debt nobody
  measured. The number is now known for four surfaces. Gating follows once the other 25 are measured,
  which is ordering, not deferral.
- **An `opacity` on an ANCESTOR fades text without changing either computed colour**, so a faded
  block reads as its unfaded ratio here. This under-reports; it cannot invent a failure.
- **Signed-in surfaces are not covered by this run.** Under a dead backend they render error states,
  so their contrast is measurable but unrepresentative of the populated product.

## Verdict

- **CONFIRMED on `/`**, 12 shapes below AA of 141 judged, worst 2.94:1, all seven station names among
  them. **S3's** call: `landing/**` is theirs, and it is one constant.
- **`/product` is a genuine pass**, 0 of 40 judged.
- **`/pricing` and `/demo` are not measured**, and were not reported as clean.
