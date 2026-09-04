# S4-137 · On a phone, most of the home page's controls are under the tappable floor

> _Created: 2026-08-28 · Last updated: 2026-08-28_

> _S4, 2026-08-28. Measured at **390x844**, a real browser, dead backend, public surfaces. Public
> pages render fully without a database, so this is what a visitor on a phone actually gets._

## The measurement

WCAG 2.5.8 sets the floor at **24x24 CSS pixels**. Apple's guidance is **44x44** and Google's is 48.
Both numbers are reported because they answer different questions: 24 is *does this pass*, 44 is
*would anyone ship this*.

| surface | under 44px and crowded | under the 24px floor | of controls |
| --- | --- | --- | --- |
| **`/`** | **18** | **17** | 31 |
| **`/demo`** | 8 | **7** | 12 |
| `/pricing` | 2 | **0** | 13 |
| `/checkout` | 2 | **0** | 8 |
| `/brief` | 0 | 0 | 4 |

> **17 of 31 controls on the home page are below the WCAG minimum on a phone.** More than half.

## What they are

```
input.flex-1.h-12                     358x19  UNDER 24  "Work email"
a.text-sm.text-zinc-400                44x20  UNDER 24  "Sign in"
button.inline-block.text-xs           243x16  UNDER 24  "Add the bet you want red"
button.text-xs.font-mono               21x22  UNDER 24  "M"
a.hover:text-zinc-200                  84x17  UNDER 24  "How it works"
a.hover:text-zinc-200                  38x17  UNDER 24  "Demo"
a.hover:text-zinc-200                  45x17  UNDER 24  "Pricing"
a.hover:text-zinc-200                  54x17  UNDER 24  "Updates"
a.hover:text-zinc-200                  83x17  UNDER 24  "Track record"
button.film-share.flex                 36x36            "Share the film"
```

**Read the first line twice.** The primary email capture on the home page is **19 pixels tall** on a
phone — the class says `h-12`, which is 48px, and the rendered box is 19. Something is collapsing it.
That is the single control the entire page is asking a visitor to use.

**The whole nav is 17px tall.** Five links, each one under the floor, sitting next to each other,
which is exactly the mis-tap case the standard is about.

`/demo`'s seven are the same hand-rolled footer already carrying the 2.56:1 contrast finding from
`S4-133` — the same six links, failing two different standards for two different reasons.

## What the check excuses, each from the standard rather than invented

- **An inline link inside a sentence.** WCAG exempts it: making it 44px tall wrecks the paragraph,
  and the sentence around it is the target. Detected as `display: inline` with text on both sides.
- **A control that is small but SPACED.** WCAG 2.5.8's own exception — a target with nothing else
  within the shortfall is not a mis-tap risk. This is why `/pricing`'s two 27px-tall buttons are
  reported at 44 but not at 24, and why the count is *"under 44px **and crowded**"* rather than a raw
  size census.
- Anything hidden, zero-sized, or inside `aria-hidden`.

## It reports and does not fail the build

Contrast fails, because 4.5:1 is one published number and a surface that stops clearing it has no
second reading. **This is a judgement.** A dense table's row controls and a marketing page's primary
button are not held to one threshold, and a check that fails builds on a judgement is a check people
learn to route around. The numbers go in the report; the ratchet stays on contrast.

## A defect in my own reporting, caught before it reached a verdict

The first run printed *"10 shapes under 44px, **17** of them under 24"*, which cannot be true of ten
things. `under24` counts **elements**; the list is deduped and capped at ten **shapes**.

**This is the second time tonight I made that exact mistake** — the contrast check published "12
shapes below AA" when 12 was its display cap. Both now name what they count, and the corrected home
page figure is 18 controls in 18 shapes, not 10.

## Verdict

- **CONFIRMED: 17 of 31 controls on `/` are under the WCAG 24px floor at 390x844.** **S3's**,
  `landing/**`.
- **The 19px-tall email input is the one to fix first**, because it is the page's primary action and
  its own class asks for 48px.
- **`/pricing`, `/checkout` and `/brief` pass the floor cleanly.**
