# The craft law: no AI slop, and the brand mark is ours

> _Created: 2026-07-28 · Last updated: 2026-08-03_

> Founder ruling, 2026-07-28. Binding on every surface in the rebuild, and on every agent that
> touches a pixel. This overrides any conflicting guidance, including design skills and plugins.

> [!IMPORTANT]
> **AMENDED 2026-07-29 by [`FOUNDER-VERDICT-2026-07-29.md`](./FOUNDER-VERDICT-2026-07-29.md),
> which wins wherever it and this file disagree.** All four design directions were rejected. Two
> parts of this document are now superseded:
>
> - **The palette.** The interface is **monochrome by default** - black, grey, white, slate,
>   silver, on a pure dark ground. **Ember is rare**, and explicitly NOT the default for approval
>   buttons, actions or tasks. **Blue carries agent activity. Green and red carry status** (diffs,
>   counts, tick marks). The earlier one-ember-locus rule is replaced by this.
> - **The type.** Geist Pixel is retired, including from hero moments, at the founder's own request
>   and against his earlier ruling. The typeface choice is now ours to make, judged on whether it
>   reads as an enterprise instrument.
>
> Everything else here - the ban list, the human-touch signals, the five tests, and the brand mark
> section - stands unchanged and is reinforced by the verdict, whose central complaint was that the
> four directions read as *"an AI vibe coding something"*.

## Why this exists

The founder's words: *"You need to completely avoid giving the feeling that it's being redesigned
by AI, and there is no human touch to it. It needs to really feel like touched by human, designed
by human, does not have the AI slop."*

An interface reads as machine-made not because a machine made it, but because it takes every
default. Slop is the absence of decisions. Every rule below exists to force a decision.

---

## 1. The brand mark is not a design decision

**Use the existing SupaprodMark. Never invent, redraw, or "modernise" it.**

It is a seven-petal epitrochoid, one continuous curve, defined in
[`src/components/supaprod/SupaprodMark.tsx`](../../../src/components/supaprod/SupaprodMark.tsx):

```
u(t) = ( (R-r)·cos t + d·cos(K·t),  (R-r)·sin t - d·sin(K·t) )
R = 7   r = 1   d = 3   K = (R-r)/r = 6   ->  seven petals
viewBox 0 0 100 100, pad 10, 420 steps
```

Seven petals are the seven loop stages, drawn as one unbroken journey. The core is the
intelligence the loop revolves around. **The meaning is the product**, which is why it is not
interchangeable with a generic glyph.

- The exact path is exported as `SUPAPROD_MARK_PATH` from that component. In standalone HTML,
  define it once in `<defs>` and `<use>` it, rather than pasting a 5.9KB path repeatedly.
- **The logo path itself never rotates.** Treatments may animate around it; the geometry holds.
- Any revolve is slow, 150 to 180 seconds. A fast glint steals attention.
- Prior generated marks, dot-circles, and improvised glyphs are all defects. So is any petal count
  other than seven.

**Failure found 2026-07-28:** all three Phase 0 design directions invented their own mark, because
the brief said "no invented brand marks" without supplying the real one. Fixed by this document.

---

## 2. Banned, because they are what a machine picks by default

Each of these is greppable. A surface containing one is not done.

**Colour**
- Violet-to-indigo and violet-to-cyan gradients. The `#6366f1` / `#8b5cf6` / `#a855f7` family is
  the single loudest tell in AI-generated interfaces.
- Gradient-filled text (`background-clip: text`).
- Glowing mesh orbs or blurred colour blobs used as background decoration.
- More than one accent hue doing the same job. If two colours mean "important", one is wrong.

**Type**
- Inter, Roboto, Open Sans, Arial, Helvetica as the primary face. Not because they are bad, but
  because they are the default, and the default is the tell.
- More than three weights in the whole system.
- Letter-spacing left at browser default on display sizes. Large type always needs negative
  tracking; small uppercase always needs positive.

**Material**
- Glassmorphism as a card default. Blur is chrome material, for things that float over content.
  A content card that blurs what is behind it is decoration pretending to be depth.
- Soft drop shadows on everything. Shadow means elevation. If everything is elevated, nothing is.
- A single radius applied everywhere. Nested containers need concentric radii, computed, not
  guessed: inner radius = outer radius minus the gap.

**Layout**
- Bento grids chosen for looks rather than because the content has that shape.
- Everything centred. Centring is what you do when you have not decided on a hierarchy.
- Perfectly even spacing with no optical correction. Mathematically equal is not visually equal.
- Symmetry without a reason.

**Iconography**
- Emoji as interface icons. (Currently shipping in `AppShell.tsx:265-315`.)
- Sparkle glyphs to signify "AI".
- Thick-stroked generic icon sets. Line weight must match the type's weight.

**Motion**
- `linear` or `ease-in-out`. Real things accelerate and settle.
- Animation on `width`, `height`, `top`, `left`. Transform and opacity only.
- Motion that performs rather than confirms. If removing it loses no information, remove it.

**Copy**
- "Effortlessly", "seamlessly", "unlock", "supercharge", "elevate", "in today's fast-paced".
- Em dashes and en dashes. Banned outright by
  [`conventions/humanized-output.md`](../../conventions/humanized-output.md), in what we
  author AND in what the platform generates for users.
- Vague category words: bare "AI", bare "agents", "copilot", "operating system". Qualify them.

---

## 3. What human-made actually looks like

Slop is the absence of decisions, so the cure is visible decisions.

- **Optical over mathematical.** A circle beside a square needs to be slightly larger to look the
  same size. An icon left of a label needs less gap than the grid says. Someone noticed.
- **One idea per screen, stated confidently.** A machine hedges by including everything.
- **Asymmetry with a reason.** A 60/40 split because the content demands it beats 50/50.
- **Type doing the hierarchy**, before colour or weight or boxes are reached for.
- **Restraint that costs something.** The impressive move is the effect that was built and then
  removed.
- **One idiosyncratic detail per surface**, chosen not defaulted. The thing a person would point
  at. Exactly one, or it becomes noise.
- **Real content at real lengths**, including the long name, the empty case, and the error.
- **Density that varies with importance.** Uniform density is a template.

---

## 4. The tests

Before any surface is called done:

- **The grayscale test.** Remove all colour. Is the hierarchy still legible? If colour was
  carrying the structure, the structure was never there.
- **The default test.** For every value on screen, could you name why it is that and not the
  framework default? Any value you cannot defend is a decision not yet made.
- **The screenshot test.** Put it beside Linear, Stripe, Vercel, Arc, Raycast. Not "is it as
  good", but "does it look like it came from the same profession".
- **The point test.** Can you point at the one thing a person chose here? If not, nobody did.
- **The slop grep.** Zero hits for the banned hex families, `background-clip: text`, emoji in
  chrome, `ease-in-out`, and the banned copy words.

---

## 5. On design skills and plugins

Use them for their anti-pattern lists and their craft techniques. Do not adopt their aesthetics
wholesale.

Concretely: the `high-end-visual-design` skill's banned-list (fonts, icons, generic borders, harsh
shadows, default easings) and its craft techniques (nested enclosures, concentric radii, motion
physics, magnetic hover) are sound and adopted. Its recommended vibes are not: "glowing purple and
emerald mesh orbs" and blanket `backdrop-blur-2xl` are themselves the slop this document bans, and
they are wrong for a dense working product regardless.

A skill is a source, not an authority. Judge it.
