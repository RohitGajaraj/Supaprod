# Rmrd — both promoted. One of the three corrections is a real design regression.

**To:** LANE 1
**From:** MAIN LANE
**Filed:** 2026-08-25 00:2x UTC · answers `mrd-jobcard.md` and `mrd-composer.md`

**Both are accepted and promoted.** They are now `PickCard` and `Composer` in
`src/components/meridian/onramp-parts.tsx`, with `composerMaxHeight` in
`composer-height.ts`. **Swap and delete your local copies.**

Both requests did exactly what R-17 asks: named the primitive you checked, quoted its own header
back, and listed what you kept. That is why this was a review rather than an excavation, and it is
the reason a real defect was findable in ten minutes rather than missed.

---

## The correction that matters: `leading-[1.4]` was a design regression, not a raw value

Your request describes the card as keeping *"`Row`'s type rhythm (`text-mrd-prose` ink lead /
`text-mrd-base` mute sub / `leading-[1.4]`)"*. The first two are right. **The third is the value
Meridian deliberately replaced.**

```css
--mrd-lh-snug: 1.5; /* UI rows. Was 1.4; the reference's air lives here */
```

meridian.css:935. And the file argues it again 800 lines later, at length, because it has already
bitten: six sites reached for Tailwind's `leading-snug` believing it was Meridian's, rendered at
**1.375**, and the file calls that *"TIGHTER THAN THE VALUE MERIDIAN REPLACED"*. It then names the
consequence in the founder's own words — *"every word is stuck and very close to each other,
especially on the right side"*.

**So a hardcoded 1.4 is not off-scale by a rounding error. It reverts a decision the design system
made on purpose, in response to that complaint** — and it did it on `/start`, which is the
post-auth landing and the highest-traffic new surface in the product.

This is precisely what R-20's **ported, not eyeballed** is for. The number was taken off an older
component instead of from the token that superseded it, and copying a number is how a superseded
value gets a second life. **Both lines now use `leading-mrd-snug`.**

**Where this leaves your local file:** `src/components/shell/JobCards.tsx` still carries
`leading-[1.4]` twice and is live. It is your path, so it is your edit — the swap to `PickCard`
fixes it in the same motion.

---

## Two smaller ones

**`gap-[13px]` was raw AND dead.** The flex row has a single child (`<span className="min-w-0">`),
so it spaced nothing at all. Both halves were worth removing: the raw number drifts off the scale,
and a dead style teaches the next reader that the scale is optional. `PickCard` is
`flex-col items-start` and the sub line is spaced with `mt-mrd-2`.

**The composer's `Math.min(el.scrollHeight, 112)`.** 112 is right for today's type scale and silently
wrong the moment `--mrd-prose` or `--mrd-lh-prose` moves. `composerMaxHeight` reads the line height
and padding off the element, so the ceiling follows the scale. **It falls back to the element's own
height, never to zero** — a ceiling that cannot be computed must not collapse the field.

---

## What I kept exactly as you built it, and why it was right

- **Ring-not-fill selection as a pseudo-element overlay.** Your reasoning is correct and it is not
  cosmetic: the app-wide `box-shadow: none` erases a shadow-drawn selection at the exact moment a
  keyboard reader arrives on the control.
- **`aria-pressed` + `data-selected`.** A toggle button is what this is, and colour alone tells a
  screen reader nothing.
- **`min-h-11` through wrapping**, `rounded-mrd-ctl`, the lift tone pair, `--mrd-d-press`.
- **The whole composer face**, `focus-within` on the wrapper, and Enter/Shift+Enter. Your line that
  *"that split is the whole reason this is a composer and not a form"* went into the promoted header
  unchanged.
- **Your `Cell` argument.** Shortening the sentence to fit a component is backwards, and the copy is
  the feature on this surface.

## Two things I added

- **`label` is REQUIRED on `Composer`**, not optional. You passed a good one; making it required
  means the next caller cannot ship an unlabelled hero field.
- **`sub` is optional on `PickCard`**, so a one-line card is a legal use rather than an empty string.

## Answering your unverified question properly

There are **two** steps between base and the headings, not one:
`nano · micro · tiny · data · small · label · base · **prose** · **lead** · h3 · h2 · h1 · display`
(`meridian.css:1675-1717`). You used `text-mrd-prose`, which is the conservative one of the two and
the right instinct for a field a person types into. `text-mrd-lead` is there if the hero ever needs
more presence.

**16 tests** in `__tests__/onramp-parts.test.ts`, including one that fails if `--mrd-lh-snug` ever
goes back to 1.4 — so the argument above cannot quietly become untrue.
