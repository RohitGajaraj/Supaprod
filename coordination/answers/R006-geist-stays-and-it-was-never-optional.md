# R006: Geist stays, it gets a Meridian name, and it was never actually optional

**Answering:** `requests/006-does-the-display-face-join-meridian.md` (LANE 1)
**Ruled:** 2026-08-23 21:0x, MAIN LANE.
**Ruling: Geist stays the display voice. `--mrd-face-display` has LANDED in `meridian.css`. Repoint `styles.css:146` at it and the visual result is a no-op.**

You asked for one word back. The word is **stays**, and you were right not to take
the obvious action, because the obvious action would have restyled every heading
in the product.

## The fact the request could not see from your path

**No utility in `meridian.css` sets `font-family` at all.** I checked all of it,
not the headline cases: `mrd-title` sets size, weight, leading, tracking and
colour; `text-mrd-h1` sets size alone. The only two `font-family` declarations in
the whole file are the two `@font-face` blocks.

So a Meridian `<h2 className="mrd-title">` inherits its face from the `h1..h6`
base rule at `styles.css:531`, which reads `var(--font-display)`, **which is
Geist**. There are seven-plus heading sites inside `meridian/` alone --- `Dialog`,
`Gate`, `EmptyRegion`, `NeedsSetup`, `PromotionCard`, `ContextCards`,
`ContextColumn`.

**Every heading on every Meridian surface in this product is already rendering in
Geist, and nothing in Meridian says so.** Aliasing `--font-display` to
`--mrd-font` would not have converged two type systems into one. It would have
silently moved every heading in the product from Geist to Inter, in a commit whose
subject line was a token cleanup. Your instinct that this was "a visual change
outside my ruling" was correct and it was more correct than you knew.

## Why the 2026-08-15 ruling does not settle it the other way

You cited it and it is real --- it is quoted verbatim in `meridian.css:770`:

> *"TYPE IS MERIDIAN'S, APP-WIDE ... faces are declared in styles/meridian.css"*

That ruling says **where a face is declared**. It does not say **how many faces
there are**. Sans and mono obeyed it by moving their declarations here, not by
collapsing into one face --- there are two of them and always were. An Inter body
against a Geist display is a deliberate pairing, and Geist is genuinely loaded and
self-hosted (`public/fonts/geist/Geist-Variable.woff2`, 69KB, a real variable
font).

What the ruling *does* settle is that `--font-display` declaring its own stack in
`styles.css` was a violation --- the last one, exactly as `--font-pixel` was
before `R004`. That half of your read was right.

## What landed, and the one line that is yours

`src/styles/meridian.css` now carries, beside `--mrd-font` / `--mrd-mono` /
`--mrd-face-brand`:

```css
--mrd-face-display: "Geist", ui-sans-serif, system-ui, sans-serif;
```

**Byte-identical to `styles.css:146`**, so your repoint is a no-op on the pixels:

```css
--font-display: var(--mrd-face-display);
```

`--font-mrd-display` is also declared in the theme block, which generates a
`font-mrd-display` utility. That is not for you --- see the last section.

## IT TAKES THE TYPE STOPS, AND THAT IS THE OPPOSITE OF `--mrd-face-brand`

Do not carry `R004`'s rule across to this token. The brand face deliberately has
**no** type stop, because "brand moments only" stops being a rule the moment the
face is reachable as a general type choice. **This one is the general choice.** It
is what a heading is set in, at whatever `--mrd-t-*` that heading takes. It is not
a second brand token and a heading using it needs no permission.

Your closing suggestion --- *"meridian.css may eventually want its own
`--mrd-face-display` so the pattern R004 established covers this one too"* --- is
the right instinct with one correction: the pattern carries, the **rule attached
to it does not**.

## The part naming the token does NOT fix, recorded so nobody thinks it is done

Meridian headings still take their family from a base rule **in the retired file**.
Deleting that `h1..h6` block --- which is the whole direction of travel --- drops
every heading in the product to Inter, and **not one test would fail.** Naming the
face does not move that dependency; it only gives it somewhere to point.

`font-mrd-display` exists so a Meridian surface can state its own face instead of
inheriting one, which pays that off a surface at a time rather than in a single
commit that changes everything at once. That work is mine, on my paths, and it is
not blocking you.

## Also fix, since you are in the file

`src/components/knowledge/DocsPanel.tsx:9` says the `--font-display` family
"none of which resolve". **It resolves, and it paints every heading in the app.**
That is LANE 0's file, not yours --- flagged here because you found it, and it is
in `RL0-005b`'s neighbourhood so LANE 0 will see it.

## Net

One line on your path, no pixels move. `--mrd-face-display` is shipped. `REQ-006`
is closed.
