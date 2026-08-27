# S4-131 · The seven stations are the least readable text on the home page

> _S4, 2026-08-27. Measured in a real browser against the running dev server on :8080, four public
> surfaces, dead backend. Public surfaces render fully without a database, so this is the shop window
> measured as a visitor gets it. Every count below names its population._

> ## CORRECTION, same evening, and BOTH numbers below were wrong
>
> **The check was measuring the wrong half of the product, and then truncating what it found.**
>
> **1. Meridian is built on `oklch()`** — 139 uses in `meridian.css`, 68 in `styles.css`, plus
> `color-mix()`. The first parser understood only `rgb()`, so it silently skipped every element the
> design system coloured and judged only components carrying hex literals. `/pricing` reporting *0 of
> 0 judged* was not a gradient problem, which is what I guessed first and what the gradient work
> below was aimed at. It was that.
>
> Anything the browser understands is now resolved by painting it into a 1x1 canvas and reading the
> pixel back, in the sRGB the screen actually shows.
>
> **2. "12 shapes below AA" was the length of a list capped at 12.** The cap was a display limit and
> I reported it as the finding. A measurement that silently truncates reads as complete, which is
> worse than one that refuses to answer. It now returns the true element count, the shape count, and
> says how many shapes are not listed.
>
> **Re-measured with both fixed, nothing unjudged on any surface:**
>
> | surface | below AA | in shapes | judged | not computable |
> | --- | --- | --- | --- | --- |
> | **`/`** | **83** | 80 | 248 | **0** |
> | **`/demo`** | **9** | 9 | 14 | **0** |
> | `/pricing` | 0 | 0 | **105** | **0** |
> | `/product` | 0 | 0 | 49 | **0** |
>
> **`/` is 83, not 12.** A third of its judged text is below AA. **`/demo` is worse in proportion —
> nine of fourteen** — and was reported as clean by the blind version:
>
> ```
> a.inline-block.px-8       2.41:1 needs 4.5:1 at 14px/500  "Join the beta"
> a.text-xs.text-zinc-600   2.56:1 needs 4.5:1 at 12px/400  "Security" "ARD" "Changelog"
>                                                            "Proof" "Privacy" "Terms"
> p.text-xs.text-zinc-600   2.56:1 needs 4.5:1 at 12px/400  "(c) 2026 Supaprod"
> p.text-mrd-nano.font-mono 2.56:1 needs 4.5:1 at 10px/400  "The film - 2:22 - sound on"
> ```
>
> **`"Join the beta"` at 2.41:1 is the lowest ratio on any public surface, and it is the primary call
> to action on the demo page.**
>
> **`/pricing` and `/product` are now genuine passes**, at 0 of 105 and 0 of 49. The earlier file
> said they were not measured, which was true, and this is what they say once they are.
>
> **Measured on `lane/proof`, which does NOT contain S3's `cc23c49fc`.** That fix raises `R.faint`
> to `#787f8b` and is not in these numbers.
>
> The station-strip finding below stands and was the reason S3 went looking. Its cause and its fix
> were right. Its scale was understated by seven times.

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
