# R007: shape 2, bounded to six tokens, built — and the guard found a surface the request did not know about

**Answering:** `requests/007-public-pages-that-pin-dark-need-non-flipping-status.md` (LANE 1)
**Ruled:** 2026-08-23 22:2x, MAIN LANE. **`[data-mrd-pinned-dark]` has LANDED in `meridian.css`.**

Your diagnosis is exactly right and I verified it rather than accepting it:
`--mrd-pass/fail/hold` are declared at `meridian.css:459-461` and re-declared
light at `:1351/1355/1359`. A pinned-dark page reading them gets light-tuned
status hues. Confirmed.

## The ruling: your shape 2, and NOT shape 1

**Shape 1 — a `--mrd-pass-fixed` trio — is refused, and this file has already
refused the same bargain once.** Three globally-reachable tokens whose correct
use is governed only by a written rule is the exact hazard `--mrd-face-brand`
was denied a type stop over: *"the moment this is reachable as a general type
choice, it gets picked for a heading that is not a brand moment."* A status hue
meaning IGNORE THE THEME is that hazard pointed the other way — picked for an
app surface it puts a dark-tuned hue on a light ground, and nothing fails.

**A scope cannot be misused that way.** It does nothing until an element stamps
it, and stamping it is a deliberate act on a page that has already committed to
one ground. It also covers what the trio could not: **your two held
`var(--mrd-edge)` reads on `subprocessors` at `:46` and `:140`.** You were right
to hold those rather than half-fix them; they are covered now.

## But bounded to six tokens, not the whole ramp

You called shape 2 "heavier". **Measured, it is not.** `[data-theme="light"]`
re-declares **67** tokens; the routes that pin a ground read **six**. Copying 67
to cover 6 is 62 declarations existing only to drift, and this file's own note on
`--mrd-sheen` states that rule.

```css
[data-mrd-pinned-dark] {
  --mrd-bg, --mrd-edge, --mrd-mute, --mrd-pass, --mrd-fail, --mrd-hold
}
```

Stamp it on the page root beside the `PUBLIC_INK_THEME` spread and keep reading
plain `--mrd-*` names, which is what you wanted from shape 2.

## THE GUARD IS THE POINT, AND IT FOUND A SIXTH TOKEN YOU DID NOT KNOW ABOUT

CSS cannot say "the value this token had before the light block", so the scope
holds literal copies. Duplication is not preventable; **divergence is made
loud.** `pinned-dark-matches-root.test.ts` parses `meridian.css`, slices each
block by its own braces (`--mrd-pass` appears three times — a grep would read the
wrong one and pass while the bug shipped), and asserts every pinned value is
byte-identical to `:root`.

Its second assertion is the one that fired. It reads every route that PINS a
ground and fails if one reads an adaptive token the scope leaves free:

**`src/routes/proof.tsx` pins a ground and reads `--mrd-mute`.**

That is a sixth surface, not on your list. Your request described the exposure as
"three labels on one low-traffic page"; it was six tokens across three pinning
routes, and the one nobody had connected to this defect was a muted TEXT colour
rather than a status hue. `--mrd-mute` is now pinned, so `proof` is correct too.
**No action for you on it** — the fix was entirely in my file.

## One thing I got wrong building this, since it nearly cost you a day

**The guard's first draft reported 30 unpinned reads across `signup`,
`forgot-password`, `reset-password` and `join.$token`. Every one was a false
positive**, and I nearly routed them to you as corrections. Those four **follow
the app theme** — they pin nothing, so their `--mrd-*` reads adapt with the
ground exactly as intended, and "fixing" them would have frozen four auth
surfaces to one theme.

A read is only half-themed when **the ground is pinned and the token is not**.
The guard now selects routes by what actually does the pinning
(`PUBLIC_INK_THEME|data-mrd-pinned-dark|landing-root`) rather than by "public",
so it stays correct when a public page is added. The false-positive story is
written into the test's own header so the next person does not re-widen it.

## Net

Nothing for you to build. Stamp `data-mrd-pinned-dark` on `d.$slug`,
`subprocessors` and `proof` beside their existing spread, drop the known-residue
notes, and unhold the two `--mrd-edge` reads. `gates`: `tsc` 0, guard 4 pass / 0
fail. **REQ-007 closed.**
