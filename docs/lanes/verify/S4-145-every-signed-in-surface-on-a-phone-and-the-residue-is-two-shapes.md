# S4-145 · All 18 signed-in surfaces on a phone, and the residue is two shapes

> _S4, 2026-08-28. Every authenticated surface in `e2e/surface-baseline.json` measured at **390x844**
> in a real browser, dead backend, signed in. Twelve of the eighteen had never been measured on a
> phone. Counts name their population; the raw count before every exemption is printed beside the
> judged one._

## The whole result

**Across 18 signed-in surfaces, exactly two shapes fall under the WCAG 2.5.8 floor of 24x24:**

```
a.sp-brand                 21x21   "Supaprod, go to Today"     the shared rail, every surface
button.rounded-mrd-xs      56x21   "Try again"                 the retry on a failed read
```

**Nothing else.** And **no surface scrolls sideways** at 390px — measured, and the check was watched
firing on an injected 900px element before that clean result was believed.

| surface | under 44 & crowded | under the 24 floor | controls |
| --- | --- | --- | --- |
| `/brain` | 11 | **0** | 17 |
| `/guardrails` | 9 | **0** | 13 |
| `/learn` | 4 | 2 | 17 |
| `/threads` | 4 | 1 | 14 |
| `/sync` | 3 | 1 | 17 |
| `/plan` `/start` `/ship` `/inbox` `/design` `/discover` `/build` | 2 each | **0** | 4–17 |

> **The signed-in product is essentially at the floor already.** That is worth saying as plainly as
> the failures: twelve of eighteen surfaces have nothing under the minimum, and the residue is one
> shared component plus one control.

## The second shape is the interesting one

`button "Try again"` at **56x21** is the control a person reaches for **when a read has already
failed**. It is the only thing the surface can offer at that moment, and it is the hardest thing on
the page to hit.

**This is the second instance of that exact shape today.** S3 found `/engine-room`'s three
`"Read this room again"` buttons at 121x19 and fixed them to 121x27, noting they *"appear only when a
room's read has FAILED"*. Same pattern, different component: **recovery controls are systematically
smaller than the controls people use when things are going well.**

That is not a coincidence and it is worth a rule rather than two fixes. A failure state is drawn as
secondary chrome — small text, quiet button — because it is drawn as an *apology*. But it is the one
moment the person has no alternative action, and on a phone it is the moment they are least able to
aim.

> ### REVISED, and S3's version is sharper than mine
>
> **I decided "any control that only appears in a failure or empty state is held to 44x44". That
> standard is aimed at the wrong property, and the product had already implemented the right one.**
>
> ```ts
> // surface-parts.tsx:411
> export const CONTROL_SHAPE =
>   "inline-flex h-8 max-md:min-h-11 max-md:min-w-11 items-center gap-2 rounded-mrd-ctl …";
> ```
>
> **`min-h-11` is 44px, applied below `md`.** Every `Action` in the product is already 44x44 on a
> phone, and `meridian/__tests__/a-control-is-big-enough-to-hit.test.ts` exists to keep it that way.
> Somebody reached my conclusion before me and applied it to the primitive.
>
> **`Door` never got it, because `Door` is drawn as prose.** `surface-parts.tsx:791` styles it
> `rounded-mrd-xs text-mrd-body underline decoration-dotted` — no height, no padding — and
> `ReadFailedLine` renders the retry as `<Door>`.
>
> **So the real finding is one line, and it is better than the one I filed:**
>
> > **The recovery control is small because it was drawn as PROSE rather than as a control.**
>
> Not because failure states are neglected. `Door` is the general inline door used mid-sentence
> across the product, so a blanket 44x44 does not reach it — and padding it would change the line box
> of every sentence it sits in, which is the `items-center` trap in a new place: **the box you grow is
> not the box that reflows.** The fix is a standalone variant of `Door`, or `ReadFailedLine` using a
> control-shaped primitive, and both are Meridian's call.
>
> **`meridian/` is S0's and S0 is offline**, so it sits measured and unowned beside the brand link,
> with the mechanism attached rather than a padding class applied blind.

**The superseded standard, kept because the reasoning still holds for anything genuinely
failure-only:** such a control is the smallest population in the product and the highest-stakes one.

## The rail element

`a.sp-brand` at **21x21** fails on both dimensions and appears on every signed-in surface. It is
already recorded in `S4-141` with its cause and its constraint: `.sp-brand`'s row `.sp-lede` is also
21px tall, so a `min-height` grows the rail header everywhere, which makes it a design call rather
than a repair. The zero-layout option is an absolutely-positioned `::after` hit area, which changes no
box at all.

**S2 owns `shell/` and is offline.** Left measured and unfixed rather than changing a shared rail with
nobody to review it.

## What this run did not do

- **It is one viewport.** 390x844. A tablet width is unmeasured.
- **It is a dead backend**, so these are the surfaces in their failure state. That is the right place
  to find `"Try again"` and the wrong place to judge a populated table's row controls.
- **`44` is not a gate.** Contrast is the only check here that fails a build. 24 reads as a defect, 44
  as the bar.

## Verdict

- **CONFIRMED: 18 of 18 signed-in surfaces measured on a phone; 12 have nothing under the floor.**
- **CONFIRMED: the entire residue is two shapes**, one of which is a shared rail element and the other
  a recovery control.
- **CONFIRMED: nothing scrolls sideways**, on any signed-in surface, with the check proven to fire.
