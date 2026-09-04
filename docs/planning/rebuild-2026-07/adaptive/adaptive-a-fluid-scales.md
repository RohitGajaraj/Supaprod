# Adaptive Proposal A - Fluid Scales and Typography

> _Created: 2026-07-28 · Last updated: 2026-08-03_

> Rebuild 2026-07 · adaptive layout system · **proposal A of 3**
> Owner angle: the mathematics. Type scale, space scale, measure, density, and the units that make
> OS text scaling and browser zoom work.
> Status: proposed contract, not yet ratified.

---

## 0. What this document owns, and what it hands off

**I own:** every *length* in the authenticated app and the rule that produces it. The fluid root,
the modular type scale, leading and tracking as functions of size, the space scale, radii, stroke
invariants, reading measure, numeric and monospace behavior, and the definition of density.

**I hand off:**

| To | What |
| --- | --- |
| Proposal B (regions and composition) | Where the extra inline size on an ultrawide *goes*. I supply `--col-min` in `ch` and the `repeat(auto-fit, minmax(...))` formula so column count derives from measure rather than from a breakpoint. B decides which regions exist and their priority order when space is removed. |
| Proposal B | Which elements are container roots. I define the density tiers and what changes inside them; B decides the region tree those containers hang off. |
| Proposal C (migration and component contract) | The `Panel` / `PanelBody` two-element shape that container queries require, the ESLint rules, and the codemod. I supply the exact legacy-value mapping table; C owns sequencing. |

Where the three proposals must agree: **one fluid root, everything in `rem`, container queries in
`em`, measure in `ch`.** Those four choices are load-bearing for all three.

---

## 1. Ground truth (measured 2026-07-28, not estimated)

I read `src/styles.css` (3715 lines), `src/routes/__root.tsx`,
`src/components/mission/MissionShellView.tsx`, `src/routes/_authenticated.build.index.tsx`,
`src/routes/_authenticated.settings.tsx`, and `src/hooks/use-density.ts`.

```
Tailwind                       4.3.3   (confirmed: bun.lock, exact pin, no range ambiguity)
Vite                           8.1.4
Container queries in src/         0
Responsive breakpoint usages      5     (across ~75 _authenticated*.tsx files)

Hardcoded font sizes
  text-[Npx] arbitrary classes  580
  inline fontSize: <number>     207
  inline fontSize: "Npx"         18
                        TOTAL   805     across 23 distinct values

Units in src/styles.css
  px literals                   578
  rem literals                   12
```

The 23 distinct font sizes, by frequency:

```
10px  151      12.5px 48      9.5px  19      15px   8      22px  3      26px  1
11px  133      10.5px 30      11.5px 17      14px   4      17px  3      21px  1
12px   64       9px   27      13.5px  9      52px   3      34px  2      18px  1
13px   51                                    46px   1      32px  1      28px  1
```

### 1.1 The root cause, which is mechanical and fixable

The brief says inline styles are the reason the app cannot adapt. That is true but it is the
*second* cause. The first is this:

**The Tempo type tokens are not in Tailwind's `@theme` block, so no font-size utilities exist.**

`src/styles.css` has exactly one `@theme` block, lines 55-145. It declares `--font-*` and five
`--spacing-*` aliases. It declares **zero `--text-*` size keys**. The Tempo scale
(`--text-hero`, `--tempo-text-base`, `--text-mono-floor`, ...) lives at lines 2010-2037, inside
`[data-obsidian] { ... }` which opens at 1886 and closes at 2144. A stale comment at line 2004 calls
that "this same @theme block" - it is not one. Tailwind v4 only reads `@theme`.

The consequence: there has never been a `text-body` or `text-label` utility to reach for. The type
classes that do exist (`.text-copy-13`, `.text-heading-24`) are hand-written in
`@layer components` with px baked into both the value *and the class name*:

```css
/* src/styles.css:3569 - current */
.text-heading-24 { font: 600 24px/32px var(--font-sans); letter-spacing: -0.96px; }
```

So a developer needing 11px metadata writes `text-[11px]`, because that is the only thing that
works. 805 times. **The 23-value sprawl is not indiscipline; it is the absence of an API.** Fixing
the token namespace removes the incentive, and only then is a lint rule fair to enforce.

### 1.2 Three more findings that constrain the design

**`body` is px.** `src/styles.css:429` sets `body { font-size: 13px }`, and `[data-obsidian]`
raises `--tempo-text-base` to `14px`. The authenticated shell carries `data-obsidian`, so **the
app's real base is 14px** - not the 13px the Tempo contract states. I build on the measured 14px.

A px body size means browser *page* zoom works (it scales px) but the user's **default font size
preference is silently discarded**. Someone who sets 20px in browser settings gets 13px. This is
the single highest-value line in the file to change, and it costs nothing to change: `13px` and
`0.8125rem` render identically at default settings.

**`letter-spacing` is px.** `-4.32px` on a 72px heading is `-0.06em`. The moment type becomes
fluid, px tracking is wrong at every size except one. Every tracking value must become `em`.

**A live namespace collision.** Tailwind v4 owns `--text-*` for font sizes. The repo uses
`--text-primary`, `--text-body`, `--text-muted`, `--text-subtle`, `--text-faint` as *colors*
(lines 1910-1914). They sit inside `[data-obsidian]`, so today Tailwind ignores them and nothing
breaks. The instant anyone moves a color token into `@theme` to get a utility, it collides with
the font-size namespace. Resolved in §3.4.

---

## 2. The target range

Everything below is in **CSS pixels**, which is the correct frame: OS display scaling is already
absorbed before CSS sees it. A 27" 5K at "looks like 2560" reports 2560 CSS px; a 3440×1440
ultrawide at 100% reports 3440 CSS px. We never compensate for OS scaling ourselves, because the
platform already did, and doing it twice is how apps end up cartoonish on a Mac and microscopic on
a Windows box.

| Band | CSS px (inline) | Status | Behavior |
| --- | --- | --- | --- |
| Below 600 | < 600 | **Supported, not optimized** | Single column, thread-first. No phone-native design ships in this rebuild. Nothing is unreachable; nothing is delightful. |
| Narrow | 600 - 1024 | Supported | Root font-size at the user's own base. Container density drops to `snug` / `narrow`. Split-screen half-window and 200% zoom on a 1440 laptop (= 720 CSS px) both land here. |
| Design range | **1024 - 2560** | **Optimized** | Root font-size interpolates continuously ×1.0 → ×1.2. Every laptop and every normal desktop lives here. |
| Wide | 2560 - 4096 | **Optimized** | Type frozen at ×1.2. Extra inline size becomes *regions and columns*, never wider text. This is the extended-monitor case. |
| Beyond | > 4096 | Supported, capped | Shell caps at `--shell-max` and centers. Justified in §7.3. |

**Zoom.** Page zoom needs no special handling: it shrinks the CSS viewport, which the fluid root
already tracks. Text-only resize (browser default font size, OS font scaling) is handled by the
`1em` lower clamp in §2.1 and verified in CI at a 24px root.

**What we do not support:** print, and viewports under 320 CSS px. Both are stated so the CI
matrix has an honest lower bound rather than an implied infinite one.

---

## 3. The architecture: one knob, not thirty

### 3.1 The decision

Almost every fluid type system writes a `clamp()` per token - thirty-odd formulas, each
independently driftable. That is the wrong shape here, for a reason specific to this product.

Ask what should happen when the founder moves the window to the extended monitor. For a dense
agentic surface showing five agents building in parallel with file trees, diffs, CI checks and
terminal output, the answer is **the same design, larger** - not a design whose headings grow
faster than its padding. A marketing page wants expanding hierarchy on a big canvas. A work
surface wants invariant proportion, because the proportions *are* the design and the content is
already competing for attention.

If every length scales by the same factor, then the scale factor is a single number, and the
correct implementation of a single number is **one fluid root font-size with everything else in
`rem`**.

This buys, in order of importance:

1. **Drift becomes impossible.** There is one formula. A token cannot fall out of step with the
   others because there is nothing to fall out of step with.
2. **No flash on load.** The authenticated subtree is `ssr: false`. A CSS-only system is correct at
   first paint, before React hydrates. Any JS-measured approach would visibly resize.
3. **Tailwind's whole default scale becomes fluid for free.** `p-4`, `gap-2`, `text-sm`, `size-8`
   are all rem-based in v4 and ride the root without being touched.
4. **Radix, shadcn, and every third-party rem value come along** with no patching.
5. **One `clamp()` evaluation per document** instead of thirty per element.

### 3.2 The root formula

```css
/* src/styles/tokens/scale.css */
:root {
  /* The one knob. Interpolates ×1.0 at 1024px to ×1.2 at 2560px, then holds.
   *
   * Derivation, at a 16px user base:
   *   want f(1024) = 16.0px and f(2560) = 19.2px, linear in viewport width
   *   1vw at 1024px = 10.24px; at 2560px = 25.60px
   *   c · (25.60 - 10.24) = 19.2 - 16.0  ->  c = 3.2 / 15.36 = 0.208333 (vw coefficient)
   *   a · 16 = 16.0 - 0.208333 · 10.24   ->  a = 13.8667 / 16 = 0.866667 (em coefficient)
   *
   * The lower bound is 1em, NOT 1rem. This is the accessibility guarantee and it is a
   * specification detail, not a style preference: per CSS Values 4, `rem` on the root element
   * resolves against the *initial* value of font-size (16px), while `em` resolves against the
   * *inherited* value, which is the user's own browser or OS setting. `clamp(1em, ...)`
   * therefore means "never smaller than what the user asked for". `clamp(1rem, ...)` would
   * mean "never smaller than 16px", which silently overrides a user who chose 20px.
   */
  font-size: clamp(1em, 0.86667em + 0.20833vw, 1.2em);
}
```

Verification of the endpoints, at a 16px user base:

| Viewport | Root font-size | Factor | Base body text (`0.875rem`) |
| --- | --- | --- | --- |
| 1024 (split-screen half of a 2048 display) | 16.00px | 1.000 | 14.00px |
| 1280 | 16.53px | 1.033 | 14.47px |
| 1440 (MacBook Air default) | 16.87px | 1.054 | 14.76px |
| 1728 (16" MacBook Pro default) | 17.47px | 1.092 | 15.28px |
| 2560 | 19.20px | 1.200 | 16.80px |
| 3440 (ultrawide) | 19.20px | 1.200 | 16.80px |

At a 20px user base and a 1024px viewport the middle term computes to 19.47px, below the `1em`
floor, so the clamp returns **20px**. The user's preference is never reduced. That property is
asserted in CI (§11.3).

### 3.3 Why `vw` here is safe, and where it would not be

The standard warning against `html { font-size: ...vw }` applies to formulas with **no `em`
component**, which do override the user. This formula's `em` term supplies 87% of the value at the
low end, and the `1em` floor is a hard guarantee. The residual is that pure text-only resize does
not scale the `vw` contribution - at a 20px base and 2560px viewport the user gets 22.67px rather
than a proportional 24px. That is a 6% shortfall against a value that is still 42% above baseline
and above their stated preference. CI asserts the floor, not the ideal.

One trap worth writing down: **`rem` inside media-query conditions resolves against the initial
root font size, not the fluid computed one.** Tailwind v4's `--breakpoint-*` defaults are in rem.
They stay stable and do not become self-referential. Breakpoints are safe. `em` inside *container*
queries behaves differently and that difference is load-bearing - see §9.2.

### 3.4 Resolving the `--text-*` collision

Tailwind v4 owns `--text-*` for font sizes. Before any of this ships:

```
--text-primary  ->  --ink-strong      (--ink-* already partially exists: --ink, --ink-muted,
--text-body     ->  --ink-body         --ink-subtle, --ink-faint at lines 2106-2109, so this
--text-muted    ->  --ink-muted        consolidates two half-built namespaces rather than
--text-subtle   ->  --ink-subtle       inventing a third)
--text-faint    ->  --ink-faint
```

Mechanical rename, ~350 call sites, no visual change. It is a prerequisite, not a nice-to-have:
without it, `--text-body` cannot become the base type token.

---

## 4. The type scale

### 4.1 Parameters

```
base    0.875rem   = 14px at ×1.0, 16.8px at ×1.2   (the app's measured base, §1.2)
ratio   1.2        minor third
range   step -1 .. step 7
```

**Why 1.2.** A dense product UI needs *few* sizes with *small* gaps. A major third (1.25) or larger
opens the metadata band too far - at 1.25 the step below base lands at 11.2px and the step above at
17.5px, and 17.5px is too loud for a panel title next to 14px body. A minor third keeps adjacent
steps distinguishable but not disruptive, which is what a board showing five parallel agents needs.

**Why the scale ratio does not widen at the top end.** Utopia's method interpolates the *ratio*
across the viewport so headings grow faster than body. That is correct for editorial and marketing
surfaces and it is the right call for the public landing. It is the wrong call here: on a 3440px
board, headings that outgrow their padding read as shouting. §3.1 is the reasoning; this is the
consequence. **The landing may widen its ratio. The app does not.** Two different documents, two
different jobs.

**Why the floor is step −1 and not step −2.** Step −2 computes to 9.72px. The app currently ships
9px and 9.5px (46 occurrences). Neither is defensible at arm's length on a laptop, and both fail
any honest legibility review. Cutting the scale at step −1 raises the app's metadata floor from
**9px to 11.67px**. That is a visible quality gain, not a compromise, and it is the reason 489 of
the 580 arbitrary classes collapse into one token.

### 4.2 Leading, derived

Leading must tighten as size grows. Fitted to the app's own existing values:

```
lh(s) = 1 + 7.7 / s        (s = font size in px at ×1.0, result unitless, floor 1.1)

  k = 7.7 is set by the design's stated body leading: lh(14) = 1 + 7.7/14 = 1.55  exactly.
```

This reproduces the existing ladder closely (24px → 1.32 vs the current 1.333; 32px → 1.24 vs the
current 1.25) while being continuous and derivable rather than hand-set nine times. Line-heights
ship **unitless**, so they scale with the fluid root automatically and the ratio is invariant.

### 4.3 Tracking, derived

```
track(s) = max(-0.06em, -0.02em - 0.001538em · (s - 14))

  Fitted to the three points the current system actually uses, converted from px to em:
    14px  -0.28px  = -0.020em
    24px  -0.96px  = -0.040em
    40px  -2.40px  = -0.060em   and it saturates: 48, 56, 64, 72px are all -0.060em
  Slope = (-0.06 + 0.02) / (40 - 14) = -0.0015385 per px, clamped at -0.06em.
```

Always `em`. Never px. This is the single rule that makes fluid headings not fall apart.

### 4.4 The token table

Every value below is generated by the three formulas above. Nothing is hand-picked.

| Token | Step | `rem` | px @×1.0 | px @×1.2 | `line-height` | `letter-spacing` | Role |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `--text-micro` | −1 | `0.7292rem` | 11.67 | 14.00 | `1.66` | `-0.016em` | mono metadata, timestamps, counts, badge text |
| `--text-body` | 0 | `0.875rem` | 14.00 | 16.80 | `1.55` | `-0.020em` | **base.** all UI copy, labels, table cells, inputs |
| `--text-lead` | 1 | `1.05rem` | 16.80 | 20.16 | `1.46` | `-0.024em` | panel titles, emphasized copy, empty-state body |
| `--text-title` | 2 | `1.26rem` | 20.16 | 24.19 | `1.38` | `-0.030em` | card titles, drawer headers |
| `--text-h3` | 3 | `1.512rem` | 24.19 | 29.03 | `1.32` | `-0.036em` | section headings |
| `--text-h2` | 4 | `1.8144rem` | 29.03 | 34.84 | `1.27` | `-0.043em` | surface headings |
| `--text-h1` | 5 | `2.1773rem` | 34.84 | 41.80 | `1.22` | `-0.052em` | the one h1 per surface |
| `--text-display` | 6 | `2.6127rem` | 41.80 | 50.17 | `1.18` | `-0.060em` | hero moments |
| `--text-score` | 7 | `3.1353rem` | 50.17 | 60.19 | `1.15` | `-0.060em` | Geist Pixel numerals only, max one per surface |

Nine steps. The app currently ships 23 values. Hierarchy in the 11-14px band is carried by the ink
ramp, the sans/mono split, and tracking - which is what `docs/design/archive/tempo-v5.md` already specifies and
what the 805 hand-written sizes were substituting for.

### 4.5 Shipping it as Tailwind v4 theme keys

The whole point is that a developer reaching for 11px metadata finds `text-micro` instead of
inventing `text-[11px]`. v4's paired-value syntax carries size, leading and tracking in one
utility:

```css
/* src/styles/tokens/type.css - imported into styles.css AFTER @import "tailwindcss" */
@theme {
  --text-micro: 0.7292rem;
  --text-micro--line-height: 1.66;
  --text-micro--letter-spacing: -0.016em;

  --text-body: 0.875rem;
  --text-body--line-height: 1.55;
  --text-body--letter-spacing: -0.02em;

  --text-lead: 1.05rem;
  --text-lead--line-height: 1.46;
  --text-lead--letter-spacing: -0.024em;

  --text-title: 1.26rem;
  --text-title--line-height: 1.38;
  --text-title--letter-spacing: -0.03em;

  --text-h3: 1.512rem;
  --text-h3--line-height: 1.32;
  --text-h3--letter-spacing: -0.036em;

  --text-h2: 1.8144rem;
  --text-h2--line-height: 1.27;
  --text-h2--letter-spacing: -0.043em;

  --text-h1: 2.1773rem;
  --text-h1--line-height: 1.22;
  --text-h1--letter-spacing: -0.052em;

  --text-display: 2.6127rem;
  --text-display--line-height: 1.18;
  --text-display--letter-spacing: -0.06em;

  --text-score: 3.1353rem;
  --text-score--line-height: 1.15;
  --text-score--letter-spacing: -0.06em;
}
```

Yielding `text-micro` ... `text-score`. Weight stays a separate axis (`font-medium`,
`font-semibold`), because coupling weight into the size token is what forced the current system
into `text-heading-14` *and* `text-label-14` *and* `text-button-14` - three classes for one size.

The nine `.text-heading-*` / `.text-copy-* ` / `.text-label-*` component classes at
`src/styles.css:3545-3660` are deleted. Their names encode px, so they cannot be made fluid without
lying.

### 4.6 The migration mapping

Nearest step in log space. This table is the codemod's input.

| Legacy | Count | → Token | | Legacy | Count | → Token |
| --- | --- | --- | --- | --- | --- | --- |
| 9px | 27 | `text-micro` | | 16px | 2 | `text-lead` |
| 9.5px | 19 | `text-micro` | | 17px | 3 | `text-lead` |
| 10px | 151 | `text-micro` | | 18px | 1 | `text-lead` |
| 10.5px | 30 | `text-micro` | | 20px | - | `text-title` |
| 11px | 133 | `text-micro` | | 21px | 1 | `text-title` |
| 11.5px | 17 | `text-micro` | | 22px | 3 | `text-title` |
| 12px | 64 | `text-micro` | | 24px | - | `text-h3` |
| 12.5px | 48 | `text-micro` | | 25px | 2 | `text-h3` |
| 13px | 51 | `text-body` | | 26px | 1 | `text-h3` |
| 13.5px | 9 | `text-body` | | 28px | 1 | `text-h2` |
| 14px | 4 | `text-body` | | 32px | 1 | `text-h1` ⚑ |
| 15px | 8 | `text-body` | | 34px | 2 | `text-h1` |
| | | | | 46px | 1 | `text-display` ⚑ |
| | | | | 52px | 3 | `text-score` |

**561 of 580 arbitrary classes collapse into `text-micro` and `text-body`.** ⚑ marks the two
genuinely ambiguous sites (near-equidistant in log space); a human picks those, the codemod flags
them rather than guessing.

---

## 5. The space scale

Space is a **√2 progression snapped to the 4px grid**, expressed as multiples of the Tailwind v4
spacing unit (`0.25rem`). The alternation 1.5× / 1.33× has a geometric mean of 1.414.

| Token | ×unit | `rem` | px @×1.0 | px @×1.2 |
| --- | --- | --- | --- | --- |
| `--spacing-4xs` | 0.5 | `0.125rem` | 2 | 2.4 |
| `--spacing-3xs` | 1 | `0.25rem` | 4 | 4.8 |
| `--spacing-2xs` | 2 | `0.5rem` | 8 | 9.6 |
| `--spacing-xs` | 3 | `0.75rem` | 12 | 14.4 |
| `--spacing-s` | 4 | `1rem` | 16 | 19.2 |
| `--spacing-m` | 6 | `1.5rem` | 24 | 28.8 |
| `--spacing-l` | 8 | `2rem` | 32 | 38.4 |
| `--spacing-xl` | 12 | `3rem` | 48 | 57.6 |
| `--spacing-2xl` | 16 | `4rem` | 64 | 76.8 |
| `--spacing-3xl` | 24 | `6rem` | 96 | 115.2 |

```css
@theme {
  --spacing-4xs: 0.125rem;  --spacing-3xs: 0.25rem;  --spacing-2xs: 0.5rem;
  --spacing-xs:  0.75rem;   --spacing-s:   1rem;     --spacing-m:   1.5rem;
  --spacing-l:   2rem;      --spacing-xl:  3rem;     --spacing-2xl: 4rem;
  --spacing-3xl: 6rem;
}
```

This reproduces the repo's existing 4 / 8 / 12 / 16 / 24 rhythm exactly and extends it properly.
The one casualty is `--space-10: 40px`, which is off-scale between `l` (32) and `xl` (48) and maps
to `l`. Because the whole scale is `rem`, **type and space grow by the identical factor**, so the
ratio of ink to whitespace is invariant across the entire range. That invariant is what makes the
ultrawide rendering read as *the same design* rather than a stretched one.

The five px tokens in `@theme` (`--page-inset-v: 36px`, `--page-inset-h: 32px`, and the
`--spacing-*` aliases pointing at px customs) are replaced by scale tokens. The comment above them
says "Responsive page insets"; they were never responsive.

---

## 6. Radii, strokes, and the only justified pixels

### 6.1 Radii

Same √2 progression, in `rem`, so corners stay proportional as everything scales.

| Token | `rem` | px @×1.0 | Applies to |
| --- | --- | --- | --- |
| `--radius-xs` | `0.25rem` | 4 | chips, inline badges |
| `--radius-s` | `0.375rem` | 6 | inputs, small buttons |
| `--radius-m` | `0.5rem` | 8 | controls (matches current `--radius-control`) |
| `--radius-l` | `0.75rem` | 12 | cards (matches current `--radius-card`) |
| `--radius-xl` | `1rem` | 16 | panels, drawers (current `--radius-panel: 14px` snaps to 16) |
| `--radius-full` | `9999px` | - | pills - see §6.3 |

**Nested corners are a formula, not a value.** A card inside a panel must have a smaller radius or
the concentric curves visibly diverge:

```css
/* inner radius = outer radius − the gap between them, floored at zero */
.panel > .card {
  border-radius: max(0px, calc(var(--radius-outer) - var(--pad-i)));
}
```

Because both operands are `rem`, this stays correct at every scale factor without a second value
being authored.

### 6.2 Borders stay crisp

Borders are **never** scaled. A hairline is a rendering primitive, not a design value: its job is
to be the thinnest cleanly-rendered line the display can produce. Scaling `1px` by 1.2 gives
`1.2px`, which the compositor resolves to a blurred 1-or-2px edge that reads as a rendering bug.

```css
:root { --stroke-hairline: 1px; }

/* Optional, and off by default: on 2dppx+ displays a half-pixel border is
 * crisper and lighter. Enable per-surface only after a visual review, because
 * on some panel/backdrop combinations 0.5px disappears entirely. */
@media (min-resolution: 2dppx) {
  :root { --stroke-hairline-fine: 0.5px; }
}
```

The same applies to icon stroke width: `stroke-width` stays `1.5` in the SVG's own coordinate
space, which scales with the icon box while remaining optically consistent.

### 6.3 The three px values that survive, and why

Every other px in the app is a defect. These three are invariants:

| Value | Why it is genuinely invariant |
| --- | --- |
| `--stroke-hairline: 1px` | A device concern, not a design one (§6.2). It carries no semantic size and must not scale. |
| `--focus-ring-width: 2px` | WCAG 2.4.11 / 2.4.13 minimum focus indicator thickness. An accessibility floor set by a standard, not by us. |
| `--radius-full: 9999px` | A sentinel meaning "fully rounded", not a measurement. `50%` is wrong for non-square elements; `9999px` is the standard idiom. |

**The enforceable rule:** *a px literal may appear as a floor inside `max()`, never as a value.*

```css
/* right - rides the scale, but never violates the WCAG 2.5.8 24x24 target minimum */
.control { min-block-size: max(2rem, 24px); min-inline-size: max(2rem, 24px); }

/* wrong - frozen, ignores both the scale and the user's font preference */
.control { min-block-size: 32px; }
```

Control heights become `2rem` / `2.25rem` / `2.5rem`, which is exactly Tempo's 32 / 36 / 40 at
×1.0, now with a floor.

---

## 7. Measure, eye travel, and the ultrawide answer

### 7.1 A wide canvas must never produce a wide line

Fluid type alone does not fix measure. A `text-body` paragraph in a 3000px container is a 300-
character line regardless of how the font size was computed. The cap is structural:

```css
:root {
  /* Geist Sans: the `ch` unit is the advance of "0", ~0.60em. Average mixed-case
   * English advance is ~0.51em. So 1ch renders ~1.18 characters, and the
   * 45-75 character reading band maps to roughly 38-64ch.
   * These are calibrated, not guessed, and CI measures the rendered result (§11.4). */
  --measure-prose: 58ch;   /* ~68 characters. Long-form: docs, spec bodies, AI prose. */
  --measure-ui:    76ch;   /* ~90 characters. Dense rows, table cells, log lines. */
  --measure-code: 100ch;   /* Geist Mono: 1ch == 1 character exactly. The 100-col convention. */
}

[data-measure="prose"] { max-inline-size: min(100%, var(--measure-prose)); }
[data-measure="ui"]    { max-inline-size: min(100%, var(--measure-ui)); }
[data-measure="code"]  { max-inline-size: min(100%, var(--measure-code)); }
```

`ch` is the right unit precisely because it is font-relative: as the fluid root grows, `1ch` grows
with it, so **the character count stays constant while the pixel width changes**. A measure
expressed in px would silently drift to 90 characters at ×1.2. The `data-measure` attribute is also
the CI hook - §11.4 measures the rendered characters-per-line of every element carrying it.

### 7.2 The ultrawide answer: fill, in measure-capped regions

On a 3440px monitor: **the app fills the display, but as several regions each capped at a readable
measure. It does not cap the shell at 1240px, and it does not let any single region run 3000px
wide.**

Capping the whole app and centering it wastes the monitor the founder deliberately plugged in.
Letting one region fill it produces two failures at once: a 300-character measure, and - the worse
one for this product - **unbounded eye travel**. On a dense board, correlating an agent name on the
left with its CI status on the right across 3000px means a physical head turn and a lost saccade
target. Reading measure is about lines; eye travel is about rows. Both cap at roughly the same
place, around 100-120 characters.

The app's shape already supplies the regions: thread, work canvas, live activity strip. So the
extra width is *occupied*, not padded:

| Inline size | Composition |
| --- | --- |
| ~1024 | Canvas only. Thread and activity collapse to rails. |
| ~1440 | Thread + canvas. |
| ~1920 | Thread + canvas + activity strip. |
| ~2560 | All three, each at comfortable measure; canvas begins to column. |
| ~3440 | All three at their measure caps; canvas holds 2-3 columns. |

Within the canvas, **column count derives from measure, with zero breakpoints**:

```css
.canvas-columns {
  display: grid;
  gap: var(--spacing-m);
  /* --col-min in ch, so it rides the fluid root and stays measure-correct.
   * min(100%, ...) is the standard guard that stops overflow when the container
   * is narrower than one column. */
  --col-min: 34ch;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--col-min)), 1fr));
}
```

This is my handoff to proposal B: **B decides which regions exist and their collapse priority; the
column count inside any region is arithmetic, not a breakpoint.**

### 7.3 Outside the range

**Above 4096 CSS px** the shell caps and centers:

```css
:root { --shell-max: 260ch; }   /* ~4400px at ×1.2 with base type */
.app-shell { max-inline-size: var(--shell-max); margin-inline: auto; }
```

Stated honestly: past three occupied regions there is no fourth region with content to hold, so
additional width would become padding either way. Capping makes that an intentional composition
rather than an accident, and it keeps total eye travel bounded. `ch` again, so the cap tracks the
type rather than a monitor generation.

**Below 600 CSS px** the layout is single-column and the density tier is `narrow`. Everything is
reachable and nothing is broken; it is not a designed experience and we say so rather than
implying a phone story we have not built.

---

## 8. Numeric and monospace content under scaling

This app is full of costs, token counts, durations, diff line numbers, CI timings, and terminal
output. Four rules:

**Tabular figures on anything that changes.** The repo already uses `tabular-nums` in 277 places;
make it the default for the numeric role rather than a per-site decision:

```css
[data-numeric], .stat, td[data-numeric], .metric-value {
  font-variant-numeric: tabular-nums lining-nums;
  font-feature-settings: "tnum" 1, "lnum" 1;
}
```

Without this, a live cost ticker reflows its own column on every tick, which is far more visible
during a demo than any layout bug.

**Numeric columns are sized in `ch`, and that is exact.** With tabular figures every digit has the
identical advance, so a column that must hold `$1,234.56` is `min-inline-size: 10ch` - precisely,
at every scale factor, with no measurement and no magic number.

**Monospace gets its own base.** Geist Mono at the same nominal size reads noticeably larger than
Geist Sans (bigger x-height, wider advance). Setting mono one notch down keeps optical parity:

```css
:root { --font-size-mono-ratio: 0.9286; }  /* = 13/14: mono at step 0 optically matches sans */
code, pre, kbd, [data-mono] { font-size: calc(1em * var(--font-size-mono-ratio)); }
```

`em`, so it composes at any step. Mono metadata labels use `text-micro` plus the existing
`--tracking-mono: 0.12em`, which is the one place tracking goes positive.

**Terminal, diff and editor panes are the exception that needs JS.** Monaco (`@monaco-editor/react`)
computes its own metrics in px and does not read the CSS cascade. It must be told the current
scale, and re-told when it changes:

```ts
// src/hooks/use-scale-factor.ts
// Monaco and any canvas-measured pane read px. Everything else in the app rides the
// fluid root through rem and needs none of this.
export function useRootFontSize() {
  const [px, setPx] = useState(() =>
    typeof window === "undefined"
      ? 16
      : parseFloat(getComputedStyle(document.documentElement).fontSize),
  );
  useEffect(() => {
    const read = () =>
      setPx(parseFloat(getComputedStyle(document.documentElement).fontSize));
    const ro = new ResizeObserver(read);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, []);
  return px;
}

// consumer:
const rootPx = useRootFontSize();
<Editor options={{ fontSize: Math.round(rootPx * 0.875 * 0.9286) }} />
```

`ResizeObserver` on the root element, not a `resize` listener, so it also fires when the user
changes their font size without resizing the window.

---

## 9. Density as a function of available space

This is the question the brief asks last and it is the one that decides whether the system feels
designed. **The same panel should feel comfortable at large sizes and compact when squeezed,
without becoming a different design.**

### 9.1 The two axes, and why one is not enough

§3 gives a *global, viewport-driven* axis. It cannot answer this question, because a panel squeezed
into a 320px rail on a 3440px monitor is in a wide viewport and a narrow container simultaneously.
So there are two orthogonal axes, and they change different things:

| | Axis 1 - Scale | Axis 2 - Density |
| --- | --- | --- |
| Driven by | viewport width | **container** inline size |
| Mechanism | fluid root font-size | container queries |
| Changes | *everything*, proportionally | **spacing and affordance only** |
| Never changes | - | **type size. Ever.** |
| Answers | "I moved to the extended monitor" | "this panel got squeezed" |

Type size is frozen on axis 2 deliberately, and this matches the rule `docs/design/archive/tempo-v5.md` §8 already
states ("Compact = rows lose one rhythm step; type NEVER changes"). If a panel shrank its type when
narrowed, the same content would be a different size in two places on one screen - the definition of
becoming a different design.

### 9.2 Density is one step down the space scale

The whole mechanism is: **each tier shifts the panel's padding and gap one step down the √2 space
scale.** One step ≈ 30% tighter, which reads as compact without reading as different, and it
introduces zero new numbers.

```css
/* src/styles/density.css */

/* A container cannot style itself with its own @container query, so a panel is two
 * elements: the container root, and the surface that reads the query. This shape is
 * a hard requirement of the CSS, not a preference. Handoff: proposal C owns the
 * Panel / PanelBody component contract. */
.panel {
  container-type: inline-size;
  container-name: panel;
}

.panel > .panel-body {
  --pad-i: var(--spacing-m);    /* 24 */
  --pad-b: var(--spacing-s);    /* 16 */
  --gap:   var(--spacing-xs);   /* 12 */
  --row-b: var(--spacing-xs);   /* 12 */

  padding: var(--pad-b) var(--pad-i);
  gap: var(--gap);
}

/* Thresholds are in `em`, and that choice is the substance of this section.
 * Density is about CAPACITY - how much content fits - and capacity is measured
 * in text units, not pixels. Inside a container query, `em` resolves against the
 * container's own font-size, so a container that is 48em wide fits the same amount
 * of text whether the root is scaled 1.0x or 1.2x. A px threshold would flip a
 * panel to "compact" on an ultrawide purely because the type got bigger, which is
 * exactly backwards. */

@container panel (inline-size < 48em) {          /* snug */
  .panel-body {
    --pad-i: var(--spacing-s);    /* 24 -> 16 */
    --pad-b: var(--spacing-xs);   /* 16 -> 12 */
    --gap:   var(--spacing-2xs);  /* 12 -> 8  */
    --row-b: var(--spacing-2xs);
  }
}

@container panel (inline-size < 30em) {          /* narrow */
  .panel-body {
    --pad-i: var(--spacing-xs);   /* 16 -> 12 */
    --pad-b: var(--spacing-2xs);  /* 12 -> 8  */
    --gap:   var(--spacing-3xs);  /* 8  -> 4  */
    --row-b: var(--spacing-3xs);
  }
  /* Affordance, not size: labels that no longer earn their width become
   * icon-only, with the label preserved as the accessible name. */
  .panel-body [data-label-optional] { display: none; }
}

@container panel (inline-size > 72em) {          /* roomy */
  .panel-body {
    --pad-i: var(--spacing-l);    /* 24 -> 32 */
    --pad-b: var(--spacing-m);    /* 16 -> 24 */
    --gap:   var(--spacing-s);    /* 12 -> 16 */
  }
}
```

Four tiers - `narrow` / `snug` / `default` / `roomy` - spanning exactly two steps of the space
scale in each direction.

### 9.3 The manual toggle folds into the same mechanism

`src/hooks/use-density.ts` writes `data-density="compact"` and `src/styles.css:2195` currently
responds with two hand-picked px values (`14px → 10px`, `18px → 14px`). That becomes the identical
one-step shift, so the user's preference and the container's constraint speak the same language and
compose rather than fight:

```css
[data-density="compact"] .panel-body {
  --pad-i: var(--spacing-s);
  --pad-b: var(--spacing-xs);
  --gap:   var(--spacing-2xs);
  --row-b: var(--spacing-2xs);
}
```

Per Tempo's existing exemption, the loop rail and the top bar opt out (`data-density-exempt`);
their heights are structural and belong to proposal B.

### 9.4 Alternative considered and rejected: continuous density

`padding: clamp(var(--spacing-xs), 3cqi, var(--spacing-l))` would make density perfectly smooth
with no tiers. Rejected for three reasons: it lands off the 4px grid at almost every width; it
gives two side-by-side panels of slightly different widths visibly different padding, which reads
as sloppy rather than responsive; and it has no discrete states, so there is nothing for CI to
assert. Tiers are testable. That decides it.

---

## 10. The escape from inline styles

### 10.1 Why it is unavoidable for this angle specifically

An inline `style={{}}` cannot contain a media query, a container query, or a pseudo-class. A
component whose font size lives in `style={{ fontSize: 11 }}` is frozen at 11px forever: no scale,
no density, no user font preference. The 805 hardcoded sizes are not a tidiness problem, they are
805 opt-outs from the system.

### 10.2 The sequence

**Step 0 - remove the incentive (§1.1, §3.4).** Rename `--text-*` colors to `--ink-*`, then add the
type and space tokens to `@theme`. Until `text-micro` exists, `text-[11px]` is the *correct* thing
for a developer to write and no rule against it is defensible. This step is a prerequisite for
every step below.

**Step 1 - codemod the arbitrary Tailwind classes.** 580 sites, table in §4.6, purely mechanical:

```
text-[10px]  ->  text-micro          (489 sites collapse to this one token)
text-[13px]  ->  text-body            (72 sites)
...
```

**Step 2 - codemod inline `fontSize`.** 225 sites. `fontSize: 11` → drop the property, add
`className="text-micro"`, merging with any existing `className` via the repo's `cn()`.

**Step 3 - an intermediate state is allowed, and is the pragmatic bridge.** An inline style *can*
carry a custom property, and a custom property *can* be redefined by a container query. So a
component that is not yet fully converted can do:

```tsx
// legal intermediate: the value is now systemic and container-queryable,
// even though the declaration is still inline
<div style={{ padding: "var(--pad-b) var(--pad-i)" }} />
```

This matters for `_authenticated.settings.tsx` (275 inline styles, 3433 lines), where a full
rewrite in one pass is not sensible. Layout properties migrate to classes first; paint properties
(`background`, `color`, `boxShadow`) may stay inline indefinitely - they are static and harmless.

**Step 4 - lock the door.** Once the codemod is clean, the ESLint rule below makes regression
impossible.

### 10.3 The lint rule

```js
// eslint.config.js
{
  rules: {
    "no-restricted-syntax": ["error",
      {
        selector:
          "JSXAttribute[name.name='style'] ObjectExpression > " +
          "Property[key.name=/^(fontSize|letterSpacing|lineHeight|fontWeight)$/]",
        message:
          "Typography is delivered by class, never inline. Inline styles cannot carry " +
          "container queries, so an inline font-size is permanently frozen. " +
          "Use a type utility: text-micro | text-body | text-lead | text-title | " +
          "text-h3 | text-h2 | text-h1 | text-display | text-score. " +
          "See docs/planning/rebuild-2026-07/adaptive/adaptive-a-fluid-scales.md section 4.",
      },
      {
        selector:
          "JSXAttribute[name.name='style'] ObjectExpression > " +
          "Property[key.name=/^(padding|margin|gap|width|height|maxWidth|minWidth)/]" +
          "[value.type='Literal'][value.raw=/^[0-9]/]",
        message:
          "Bare numeric lengths in inline styles become frozen px. Use a spacing " +
          "utility, or reference a token: style={{ padding: 'var(--pad-b) var(--pad-i)' }}.",
      },
    ],
  },
}
```

The scoped esquery selector matches only `style={{}}` object properties, so a `fontSize` passed to
Monaco's options object (§8) is untouched - which is correct, since that one genuinely needs px.

---

## 11. Verification: what fails CI

Four gates, cheapest first. Gates 1 and 2 are pure Node and run in seconds; gate 4 needs a browser.

### 11.1 Gate 1 - static scan (`scripts/check-fluid-scale.mjs`)

Modeled on the existing `scripts/check-humanized.sh`: same reporting shape (`file:line  reason`),
same `STRICT` convention, wired into `bun run lint` and the CI workflow.

| Rule | Fails on |
| --- | --- |
| A1 | `font-size` or `letter-spacing` with a px value anywhere in `src/**` |
| A2 | `text-[...px]`, `leading-[...px]`, `tracking-[...px]` arbitrary Tailwind values |
| A3 | `fontSize` / `letterSpacing` / `lineHeight` keys inside a JSX `style={{}}` |
| A4 | a px literal outside the allowlist: `1px`, `0px`, `-1px`, `2px` in a focus-ring context, `9999px`, and any px appearing inside `max(...)` |
| A5 | a `--text-*` custom property whose value is a color (the §3.4 collision, permanently) |

```js
#!/usr/bin/env node
// scripts/check-fluid-scale.mjs
// Static guard for the fluid scale contract.
//   docs/planning/rebuild-2026-07/adaptive/adaptive-a-fluid-scales.md
// Exit 1 on any hit. STRICT=0 to downgrade to a warning during the migration.
import { readFileSync } from "node:fs";
import { globSync } from "node:fs";

const STRICT = process.env.STRICT !== "0";
const FILES = globSync("src/**/*.{ts,tsx,css}", { exclude: (p) => p.includes("routeTree.gen") });

// px is legal only as a floor inside max(), or as one of the three §6.3 invariants.
const PX_ALLOWED = /(?:max\([^)]*?\d+px|(?<![\d.])(?:0|1|-1|9999)px\b)/;

const RULES = [
  { id: "A1", re: /(?:font-size|letter-spacing)\s*:\s*[^;]*?\d+(?:\.\d+)?px/g,
    msg: "px font-size/letter-spacing: use a rem token; tracking must be em" },
  { id: "A2", re: /\b(?:text|leading|tracking)-\[[^\]]*?\d+(?:\.\d+)?px\]/g,
    msg: "arbitrary px type utility: use text-micro..text-score" },
  { id: "A3", re: /style=\{\{[^}]*?\b(?:fontSize|letterSpacing|lineHeight)\s*:/g,
    msg: "inline typography cannot carry a container query: use a class" },
  { id: "A5", re: /--text-[a-z-]+\s*:\s*(?:#|rgb|hsl|oklch|color-mix)/g,
    msg: "--text-* is Tailwind's font-size namespace: use --ink-* for colors" },
];

let hits = 0;
for (const file of FILES) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (line.trimStart().startsWith("*") || line.trimStart().startsWith("//")) return;
    for (const r of RULES) {
      r.re.lastIndex = 0;
      if (r.re.test(line)) { console.error(`  ${file}:${i + 1}  [${r.id}] ${r.msg}`); hits++; }
    }
    // A4: any remaining px literal must be allow-listed
    for (const m of line.matchAll(/(?<![\w-])-?\d+(?:\.\d+)?px/g)) {
      const ctx = line.slice(Math.max(0, m.index - 24), m.index + m[0].length + 4);
      if (!PX_ALLOWED.test(ctx)) {
        console.error(`  ${file}:${i + 1}  [A4] unjustified px "${m[0]}" (floors go inside max())`);
        hits++;
      }
    }
  });
}
console.log(hits ? `\nHITS=${hits}` : "fluid-scale: clean");
process.exit(hits && STRICT ? 1 : 0);
```

### 11.2 Gate 2 - scale integrity (`bun test`)

Asserts the token file still *is* a scale. This catches the failure mode where someone adds a
"just one more" step and quietly breaks the ratio.

```ts
// src/styles/__tests__/scale.test.ts
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const css = readFileSync("src/styles/tokens/type.css", "utf8");
const rem = (name: string) =>
  parseFloat(css.match(new RegExp(`--text-${name}:\\s*([\\d.]+)rem`))![1]);

const STEPS = ["micro","body","lead","title","h3","h2","h1","display","score"];

test("type scale is geometric at ratio 1.2", () => {
  const v = STEPS.map(rem);
  for (let i = 1; i < v.length; i++) {
    expect(v[i] / v[i - 1]).toBeCloseTo(1.2, 3);
  }
});

test("leading decreases monotonically as size grows", () => {
  const lh = STEPS.map((s) =>
    parseFloat(css.match(new RegExp(`--text-${s}--line-height:\\s*([\\d.]+)`))![1]));
  for (let i = 1; i < lh.length; i++) expect(lh[i]).toBeLessThan(lh[i - 1]);
  expect(lh[0]).toBeLessThanOrEqual(1.7);
  expect(lh.at(-1)!).toBeGreaterThanOrEqual(1.1);
});

test("tracking is em, tightens with size, and saturates at -0.06em", () => {
  const tr = STEPS.map((s) => {
    const m = css.match(new RegExp(`--text-${s}--letter-spacing:\\s*(-?[\\d.]+)em`));
    expect(m, `${s} tracking must be em, never px`).not.toBeNull();
    return parseFloat(m![1]);
  });
  for (let i = 1; i < tr.length; i++) expect(tr[i]).toBeLessThanOrEqual(tr[i - 1]);
  expect(Math.min(...tr)).toBeGreaterThanOrEqual(-0.06);
});

test("the metadata floor never drops below 11 CSS px at default root", () => {
  expect(rem("micro") * 16).toBeGreaterThanOrEqual(11);
});

test("root clamp lower bound is 1em, so a user font preference is never reduced", () => {
  const scale = readFileSync("src/styles/tokens/scale.css", "utf8");
  expect(scale).toMatch(/font-size:\s*clamp\(\s*1em\s*,/);
  expect(scale).not.toMatch(/font-size:\s*clamp\(\s*1rem\s*,/); // the classic a11y bug
});

test("every space token is an integer multiple of the 4px grid unit (or the 2px half-step)", () => {
  const sp = readFileSync("src/styles/tokens/space.css", "utf8");
  for (const [, v] of sp.matchAll(/--spacing-[a-z0-9]+:\s*([\d.]+)rem/g)) {
    expect((parseFloat(v) * 16) % 2).toBe(0);
  }
});
```

### 11.3 Gate 3 - the CI matrix

```yaml
# .github/workflows/ci.yml - added to the existing `checks` job
      - name: Fluid scale contract
        run: node scripts/check-fluid-scale.mjs

# new job
  adaptive:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    strategy:
      fail-fast: false
      matrix:
        width: [600, 1024, 1280, 1440, 1728, 2560, 3440]
        root:  [16, 24]          # default, and a user who set a large font
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bunx playwright install --with-deps chromium
      - run: bun run build
      - run: bunx playwright test tests/adaptive
        env:
          VIEWPORT_WIDTH: ${{ matrix.width }}
          ROOT_FONT_PX:   ${{ matrix.root }}
```

Playwright is not currently a devDependency (the repo runs `bun test` only) - adding it is a
prerequisite for this gate. The `root: 24` column is the one that would have caught the `body {
font-size: 13px }` defect on the day it was written.

### 11.4 Gate 4 - rendered assertions

Five assertions per surface per matrix cell. The measure check is the centerpiece: it measures the
*rendered* characters per line rather than trusting the `ch` calibration in §7.1.

```ts
// tests/adaptive/fluid.spec.ts
import { test, expect } from "@playwright/test";

const WIDTH = Number(process.env.VIEWPORT_WIDTH ?? 1440);
const ROOT  = Number(process.env.ROOT_FONT_PX ?? 16);

const SURFACES = ["/build", "/today", "/settings", "/plan", "/sync", "/traces"];

test.beforeEach(async ({ page, context }) => {
  await page.setViewportSize({ width: WIDTH, height: 900 });
  // Emulate the browser's default-font-size preference. This is text-only resize,
  // which is what `vw`-based systems break on; page zoom is covered by the width matrix.
  const cdp = await context.newCDPSession(page);
  await cdp.send("Page.setFontSizes", { fontSizes: { standard: ROOT, fixed: ROOT } });
});

for (const path of SURFACES) {
  test(`${path} @ ${WIDTH}px / ${ROOT}px root`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");

    // 1. No horizontal overflow, and name the culprit rather than just failing.
    const overflowing = await page.evaluate(() => {
      const docW = document.documentElement.clientWidth;
      return [...document.querySelectorAll("*")]
        .filter((el) => el.getBoundingClientRect().right > docW + 1)
        .slice(0, 5)
        .map((el) => `${el.tagName.toLowerCase()}.${(el.className || "").toString().slice(0, 60)}`);
    });
    expect(overflowing, "elements overflow the viewport").toEqual([]);

    // 2. Reading measure. Measures actual characters per line via the element's own
    //    computed font, so it validates the ch calibration instead of assuming it.
    const wide = await page.evaluate(() => {
      const ctx = document.createElement("canvas").getContext("2d")!;
      const SAMPLE =
        "the quick brown fox jumps over a lazy dog while five agents build in parallel";
      const bad: { sel: string; chars: number }[] = [];
      for (const el of document.querySelectorAll<HTMLElement>("[data-measure]")) {
        const cs = getComputedStyle(el);
        ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ${cs.fontFamily}`;
        const avgAdvance = ctx.measureText(SAMPLE).width / SAMPLE.length;
        const contentW =
          el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        const chars = contentW / avgAdvance;
        const cap = el.dataset.measure === "prose" ? 80 : 110;
        if (chars > cap) bad.push({ sel: el.className.slice(0, 60), chars: Math.round(chars) });
      }
      return bad;
    });
    expect(wide, "measure exceeds the reading band").toEqual([]);

    // 3. Legibility floor. Nothing renders below 11 CSS px.
    const tiny = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("*")]
        .filter((el) => el.textContent?.trim() && el.children.length === 0)
        .map((el) => ({ px: parseFloat(getComputedStyle(el).fontSize), sel: el.className }))
        .filter((x) => x.px < 11)
        .slice(0, 5));
    expect(tiny, "text below the 11px legibility floor").toEqual([]);

    // 4. Snap check: every rendered size is ON the scale. This is what makes a
    //    24th value impossible to reintroduce, in any syntax, from any source.
    const off = await page.evaluate(() => {
      const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const STEPS = [0.7292, 0.875, 1.05, 1.26, 1.512, 1.8144, 2.1773, 2.6127, 3.1353];
      // mono is a fixed 0.9286 ratio off any step (section 8)
      const allowed = STEPS.flatMap((r) => [r * rootPx, r * rootPx * 0.9286]);
      return [...document.querySelectorAll<HTMLElement>("*")]
        .filter((el) => el.textContent?.trim() && el.children.length === 0)
        .map((el) => ({ px: parseFloat(getComputedStyle(el).fontSize), sel: el.className }))
        .filter((x) => !allowed.some((a) => Math.abs(a - x.px) < 0.5))
        .slice(0, 8);
    });
    expect(off, "font size is not on the scale").toEqual([]);

    // 5. WCAG 2.5.8 target size, which shrinking density must never violate.
    const small = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("button, a, [role=button], input, select")]
        .map((el) => ({ r: el.getBoundingClientRect(), sel: el.className }))
        .filter((x) => x.r.width > 0 && (x.r.width < 24 || x.r.height < 24))
        .slice(0, 5));
    expect(small, "interactive target below 24x24 CSS px").toEqual([]);
  });
}
```

Assertion 4 is the one that makes this durable. It does not care whether a size arrived from a
Tailwind class, an inline style, a third-party stylesheet, or a future refactor - **if a rendered
font size is not on the scale, CI is red.** That is the mechanical answer to "how is this proved,
automatically", and it is why the 23 values cannot come back.

---

## 12. Summary of the contract

| Concern | Rule |
| --- | --- |
| Root | `font-size: clamp(1em, 0.86667em + 0.20833vw, 1.2em)` - one knob, `1em` floor is the a11y guarantee |
| Type | 9 steps, ratio 1.2, base `0.875rem`, floor `text-micro` at 11.67px |
| Leading | `1 + 7.7/s`, unitless, shipped as a table |
| Tracking | `max(-0.06em, -0.02em - 0.001538em·(s−14))`, **always em** |
| Space | √2 on the 4px grid, `0.125rem` → `6rem`, all `rem` |
| Radii | √2, all `rem`; nested = `max(0px, calc(outer − pad))` |
| Strokes | never scale; `1px` hairline, `2px` focus ring |
| px | legal only inside `max()` as a floor, plus 3 named invariants |
| Measure | `ch`, capped at 58 / 76 / 100ch by role; verified by rendered character count |
| Ultrawide | fill in measure-capped regions; columns via `repeat(auto-fit, minmax(min(100%, 34ch), 1fr))`; shell caps at `260ch` past ~4096px |
| Density | container queries in `em`; shifts spacing one step down the scale; **type never changes** |
| Inline styles | typography and layout lengths banned by ESLint; paint properties may remain |
| Proof | static scan + scale-integrity tests + a 7×2 rendered matrix with an on-scale snap check |

### Open questions for the ratification session

1. **Base 14px is measured, not specified.** `docs/design/archive/tempo-v5.md` says 13px; `[data-obsidian]`
   overrides to 14px and that is what ships. I built on 14. The contract should be corrected to
   match reality, or the app corrected to match the contract - but the discrepancy should not
   survive the rebuild.
2. **The 11.67px floor loses today's 9px and 10px metadata.** I consider that a quality gain
   (§4.1). It is the most visible single change in this proposal and deserves an explicit founder
   look before the codemod runs.
3. **Playwright is a new devDependency.** Gate 4 does not exist without it. `bunfig.toml` enforces
   a 24h supply-chain guard, so this needs to be added deliberately rather than mid-migration.
4. **`--container-standard: 1240px` / `--container-work: 1520px`** are in `@theme`, which in
   Tailwind v4 makes them container-query *names* (`@standard:`, `@work:` variants). They are being
   used as max-widths. Proposal B should reclaim that namespace as part of the region work.
