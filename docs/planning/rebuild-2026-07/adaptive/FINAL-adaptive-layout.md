# FINAL - The Adaptive Layout Contract

> _Created: 2026-07-28 · Last updated: 2026-08-03_

> Rebuild 2026-07 · the merged, ratified contract. Supersedes proposals A, B and C, which are
> retained as reasoning records only.
> Written 2026-07-28 against the live tree. Every count, version, line number and token value below
> was read or executed this session.
> **When this document and any other design or planning doc disagree about size, composition,
> thresholds, or units, this document wins.**

---

## 0. The founder's call-out, and what it actually demands

> _"You need to design the application which will adapt dynamically based on the screen size. [...]
> If I'm switching to laptop it should dynamically adapt, and if I'm moving my display to the
> extended monitor it should adapt. You cannot just design it for a particular pixel and ask the
> user to switch to a particular thing. That's a constraint."_ - 2026-07-28, binding

He is right, and the defect is mechanical, not aesthetic. Three things are true at once and all
three have to be fixed together:

1. **There is no width model.** 5 Tailwind breakpoint utilities across ~75 authenticated route
   files (`3 md:`, `2 xl:` - verified by grep). 0 container queries anywhere in `src/`.
2. **Layout lives where a query is syntactically impossible.** 992 inline `style={{}}` objects in
   the authenticated routes; 97 of them carry a reflow-critical property. An inline style cannot
   contain `@media`, `@container`, `:hover`, or `:focus-visible`. This is *the* reason the app
   cannot adapt.
3. **The type system has no API.** `src/styles.css` has exactly one `@theme inline` block (line 55)
   and it declares **zero** font-size keys. There has never been a `text-body` utility to reach
   for, so developers wrote `text-[11px]` - 805 times, across 23 distinct values. The sprawl is the
   absence of an API, not indiscipline.

The workaround that was proposed before - record the demo at a fixed window size - is papering over
(2). This contract retires it. **The demo is recorded at whatever the machine is, and the
composition is scripted with `?focus=`, not with the window manager.**

---

## 1. What the three proposals got right, and every conflict resolved

The three angles are complementary and all three are absorbed. But they contradict each other in
seven places, and a contract that ships both sides of a contradiction is not a contract. Every one
is resolved here, in the open, with the loser's reasoning preserved.

| # | Conflict | A said | B said | C said | **Resolution** |
| --- | --- | --- | --- | --- | --- |
| 1 | **Does type scale with the viewport?** | root `clamp(1em, 0.867em + 0.208vw, 1.2em)` - ×1.0 → ×1.2 across 1024→2560 | silent | "Nothing gets bigger. Abundance buys *more*, never *larger*." | **C wins the principle, A wins the mechanism.** The `vw` term is deleted. See §1.1. |
| 2 | **What is the app's base font size?** | 14px (measured) | - | 13px (from `docs/design/archive/tempo-v5.md`) | **14px.** Verified: `_authenticated.tsx:135` sets `data-obsidian` on `documentElement`; `styles.css:2359` raises `--tempo-text-base` to `14px` inside `[data-obsidian]`. C built on a value the app does not ship. |
| 3 | **Threshold units** | `em` (density), `ch` (measure) | `rem` (composition), `ch` (measure), never `ch` for bands | `ch` for everything | **B's split, exactly: `rem` decides composition, `ch` decides measure.** A font swap may nudge a wrap point; it may never flip a band. `em` is dropped - see §1.2. |
| 4 | **Does the shell query itself?** | - | "a component may not query itself" (§5.3) | `[data-shell]` declares `container: shell / size` **and** `@container shell (...) { [data-shell] { ... } }` | **B is right and C's shell is broken.** A container cannot be styled by its own query - C's tier rules would never match and the shell would be permanently non-adaptive. Fixed with a two-element shell. See §1.3. |
| 5 | **Ultrawide** | fill in measure-capped regions, shell caps at `260ch` (~4400px) | 4 lanes max (`136rem`), then gutters grow; a **peripheral lane** lives in the right gutter | recompose to 4 capped columns, cap the band, center the surplus | **C's answer, C's cap (3159px, independently re-derived here), B's peripheral lane rejected.** See §7. |
| 6 | **Inline-style rule** | ban typography + numeric lengths; paint may stay | `style` may contain **custom properties only**; hard rule | ban only the 97 reflow-critical props; count ratchet | **All three, sequenced as three tranches with a ratchet.** B's rule is the end state; C's ratchet is the mechanism; A's typography ban is tranche 2. See §9. |
| 7 | **How wide is one column?** | `58ch` prose cap | `34rem` = 544px = "66ch + 2 × pane-pad" (arithmetic does not reproduce) | 48/66/75 chars → 343/459/518px at a 13px base | **Re-derived from scratch at the real 14px base and machine-calibrated.** `--container-col: 30rem` = 480px = exactly 64 characters. See §3. |

### 1.1 Why the fluid `vw` root is deleted - the biggest single call

Proposal A's §2 states the correct law:

> _"OS display scaling is already absorbed before CSS sees it. [...] We never compensate for OS
> scaling ourselves, because the platform already did, and doing it twice is how apps end up
> cartoonish on a Mac and microscopic on a Windows box."_

Then A's §3.2 adds `font-size: clamp(1em, 0.86667em + 0.20833vw, 1.2em)`, which is compensating for
OS scaling. That is an internal contradiction, and the law is the part that is right.

A 27" 2560 monitor at ~700mm and a 14" 1512 MacBook at ~500mm have almost identical angular pixel
size (0.0216° vs 0.0228°). There is no perceptual deficit to correct. If the user *does* want larger
text on the big display, macOS "Larger Text", Windows display scaling, and browser zoom all already
deliver it - **and all three arrive as a smaller CSS pixel count, which this system handles by
recomposing.** Scaling type on top of that is the double-scaling A warned about.

Worse, a growing root actively fights the composition: at ×1.2 a 480px column holds 53 characters
instead of 64, so columns would have to get wider, so fewer would fit. The ultrawide would gain
*less* parallel context, which is the opposite of what the founder asked for.

**What survives from A, in full:** the one-knob idea, everything in `rem`, tracking in `em`, measure
in `ch`, the `1em`-not-`1rem` accessibility reasoning, the derived leading and tracking formulas,
the px-only-inside-`max()` rule, the on-scale snap check.

**What replaces the `vw` term** is the same knob handed to the person who actually knows the answer:

```css
/* src/styles/tokens/scale.css */
html {
  /* The one knob. `100%` resolves against the USER's browser/OS font-size preference,
   * never against a hardcoded 16px - this is A's `1em` accessibility guarantee, expressed
   * in the form that has no viewport term. Someone who sets 20px gets 20px.
   *
   * --ui-scale is a USER preference (Settings > Display > Interface size), not a guess about
   * their monitor. Default 1. Stamped pre-paint by the existing theme script in __root.tsx.
   * Because every length in the app is rem, this one property rescales the entire UI - * including every container-query threshold, which is exactly right: bigger text means
   * fewer characters per pane means a narrower composition. */
  font-size: calc(100% * var(--ui-scale, 1));
}
```

Permitted values: `0.875 | 1 | 1.125 | 1.25`. Anything else is a bug.

### 1.2 Why `rem`, not `em`, for every threshold

Inside a container query, `em` resolves against the **container's** computed font-size and `rem`
against the **root's**. They are identical unless something between root and container overrides
`font-size` - at which point `em` silently changes the meaning of every threshold below it. That is
a bug factory.

So: **all thresholds are `rem`**, and container roots are forbidden from setting `font-size`
(§11.2, static check S6). That makes the two units equivalent by construction and removes the
ambiguity rather than documenting it.

`rem` in a container query tracks `--ui-scale`, so A's density argument ("capacity should be
measured in text units, not pixels") is fully preserved. `rem` in a **media** query does *not* - it resolves against the initial 16px - which is a second, independent reason the shell composes
with a container query rather than a media query.

### 1.3 The defect in C that had to be caught

```css
/* adaptive-c §5, AS WRITTEN - this never matches. */
[data-shell] { container: shell / size; }
@container shell (min-width: 1054px) {
  [data-shell] { grid-template-columns: ... }   /* ← styles its own container */
}
```

A query named `shell` resolves to the nearest **ancestor** named `shell`. `[data-shell]` is not its
own ancestor, there is no other `shell` container, so the rule contributes nothing and the shell
stays in its default composition at every width. The entire tier ladder would be dead on arrival.

The fix is structural, applied uniformly at every level of the hierarchy (§4.3): **a container
declares, a single structural child composes.**

---

## 2. The supported range, stated as a guarantee

CSS pixels of the **shell element**. This is the correct frame because OS display scaling, browser
zoom, and a split-screen half-window all change exactly this number - one mechanism covers all
three, and there is no separate "zoom story".

### 2.1 Inline (width)

| Tier | Range | Composition | Commitment |
| --- | --- | --- | --- |
| **S0 Stack** | `320 - 447` | one region at a time + a region switcher; composer docked; gate inline | **Supported, CI-swept, not designed.** No visual baselines. This is the WCAG 1.4.10 floor (1280px at 400% zoom = 320px) and the phone-portrait case. Vertical scrolling only - never horizontal. |
| **S1 Focus** | `448 - 1224` | one focused pane + two `44px` rails | **Supported.** Half a 1440 window (720), a 13" at 175% zoom (823), a 1080p at 200% (960), a 1280 at 200% (640). |
| **S2 Pair** | `1225 - 1945` | thread + canvas | **Designed.** Every laptop: 1280, 1440, 1512, 1680, 1728, and 1920 externals. The primary composition. |
| **S3 Triad** | `1946 - 2426` | thread + canvas + context | **Designed.** 2048, 2304, a 1920 window on a 2560 desktop. |
| **S4 Field** | `2427 - 3159` | thread + canvas + context + ledger | **Designed.** 2560 (27" 1440p, 5K logical), 3440 ultrawide, 3840 4K. |
| **cap** | `> 3159` | S4, centered, symmetric gutters | **Designed.** Nothing new happens, and that is the guarantee. |
| below `320` | `< 320` | - | **Unsupported and untested.** Declared, so the CI matrix has an honest lower bound. |

### 2.2 Block (height)

| VTier | Range | Chrome |
| --- | --- | --- |
| **H0** | `< 364` | activity strip + composer become one overlay sheet summoned by `⌘J`; the work area keeps the whole viewport |
| **H1 Compressed** | `364 - 405` | spine numeric; strip merges into the composer's top line |
| **H2 Standard** | `406 - 429` | spine labeled; strip one line |
| **H3 Full** | `≥ 430` | spine full with the drawn return edge; strip up to 3 lines |

Only two coarse-ish vertical bands do real work, and both sit far from mobile URL-bar `dvh` jitter,
so chrome collapse can never flip one.

### 2.3 Zoom, OS scaling, and text-only resize - all three, no extra code

- **Browser page zoom.** `effective CSS px = physical px / zoom`, exactly. A 1440×900 laptop at
  200% presents `720×450` and lands in **S1 / H3** - a fully supported, fully composed state. At
  400% it presents `360×225` → **S0 / H0**, still functional, still no horizontal scroll. This is
  why §11.4 tests zoom by setting a viewport rather than building a fake zoom harness.
- **OS display scaling** (macOS More Space / Larger Text, Windows 125-175%) changes the same number
  the same way. Absorbed before CSS sees it (§1.1). We never compensate.
- **Text-only resize** (a user whose browser default is 20px). `html { font-size: calc(100% * ...) }`
  means root = 20px, so every `rem` threshold rises 25% and the layout composes one tier narrower at
  the same physical width. Their text stays readable instead of a four-column layout crushing 20px
  type into 360px columns. **A px-based ladder gets this exactly backwards**, which is why the
  ladder is `rem`.

### 2.4 What we explicitly do not support

Print (beyond a `@media print` that hides chrome), viewports under 320 CSS px, and any flow that
asks the user to resize their window.

---

## 3. Token tables

### 3.1 Type

Base `0.875rem` (**14px** - the measured live value, §1 conflict 2), ratio **1.2** (minor third: a
dense product UI needs few sizes with small gaps; at 1.25 the step above base lands at 17.5px, too
loud for a panel title beside 14px body). Nine steps, `-1 ... 7`.

Leading is derived, not hand-set: `lh(s) = 1 + 7.7/s` (s in px at scale 1). `k = 7.7` is fixed by
the design's stated body leading - `lh(14) = 1.55` exactly. Shipped **unitless** so the ratio is
invariant under `--ui-scale`.

Tracking is derived: `track(s) = max(-0.06em, -0.02em - 0.0015385em · (s - 14))`, fitted to the three
points the current system already uses. **Always `em`, never px.** This is the single rule that
keeps headings from falling apart when anything rescales.

| Token | Step | `rem` | px | `line-height` | `letter-spacing` | Role |
| --- | --- | --- | --- | --- | --- | --- |
| `--text-micro` | −1 | `0.7292rem` | 11.67 | `1.66` | `-0.016em` | metadata, timestamps, counts, badge text |
| `--text-body` | 0 | `0.875rem` | **14.00** | `1.55` | `-0.020em` | **base.** all UI copy, labels, table cells, inputs |
| `--text-lead` | 1 | `1.05rem` | 16.80 | `1.46` | `-0.024em` | panel titles, emphasized copy, empty-state body |
| `--text-title` | 2 | `1.26rem` | 20.16 | `1.38` | `-0.030em` | card titles, drawer headers |
| `--text-h3` | 3 | `1.512rem` | 24.19 | `1.32` | `-0.036em` | section headings |
| `--text-h2` | 4 | `1.8144rem` | 29.03 | `1.27` | `-0.043em` | surface headings |
| `--text-h1` | 5 | `2.1773rem` | 34.84 | `1.22` | `-0.052em` | the one h1 per surface |
| `--text-display` | 6 | `2.6127rem` | 41.80 | `1.18` | `-0.060em` | hero moments |
| `--text-score` | 7 | `3.1353rem` | 50.17 | `1.15` | `-0.060em` | Geist Pixel numerals only, max one per surface |

Shipped as Tailwind v4 theme keys so `text-micro` ... `text-score` exist as utilities:

```css
/* src/styles/tokens/type.css - imported AFTER @import "tailwindcss" */
@theme {
  --text-micro: 0.7292rem;   --text-micro--line-height: 1.66;   --text-micro--letter-spacing: -0.016em;
  --text-body: 0.875rem;     --text-body--line-height: 1.55;    --text-body--letter-spacing: -0.02em;
  --text-lead: 1.05rem;      --text-lead--line-height: 1.46;    --text-lead--letter-spacing: -0.024em;
  --text-title: 1.26rem;     --text-title--line-height: 1.38;   --text-title--letter-spacing: -0.03em;
  --text-h3: 1.512rem;       --text-h3--line-height: 1.32;      --text-h3--letter-spacing: -0.036em;
  --text-h2: 1.8144rem;      --text-h2--line-height: 1.27;      --text-h2--letter-spacing: -0.043em;
  --text-h1: 2.1773rem;      --text-h1--line-height: 1.22;      --text-h1--letter-spacing: -0.052em;
  --text-display: 2.6127rem; --text-display--line-height: 1.18; --text-display--letter-spacing: -0.06em;
  --text-score: 3.1353rem;   --text-score--line-height: 1.15;   --text-score--letter-spacing: -0.06em;
}
```

Weight stays a separate axis (`font-medium`, `font-semibold`). Coupling weight into the size token
is what forced the current system into `text-heading-14` *and* `text-label-14` *and*
`text-button-14` - three classes for one size. The nine `.text-heading-*` / `.text-copy-*` /
`.text-label-*` component classes at `styles.css:3545-3660` are deleted: their names encode px, so
they cannot be made honest.

**Mono has its own base.** Geist Mono at the same nominal size reads larger than Geist Sans:

```css
:root { --font-size-mono-ratio: 0.9286; }  /* 13/14 - mono at step 0 optically matches sans */
code, pre, kbd, [data-mono] { font-size: calc(1em * var(--font-size-mono-ratio)); }
```

`em`, so it composes at any step. This is also the release valve for the metadata floor:
**sans metadata renders at 11.67px and mono metadata at 10.83px** - two distinguishable small
sizes, both above the legibility floor, so collapsing the old 9-12.5px band does not flatten the
hierarchy.

**Migration mapping** (nearest step in log space; this table is the codemod's input):

| Legacy | Count | → | | Legacy | Count | → |
| --- | --- | --- | --- | --- | --- | --- |
| 9px | 27 | `text-micro` | | 15px | 8 | `text-body` |
| 9.5px | 19 | `text-micro` | | 16px | 2 | `text-lead` |
| 10px | 151 | `text-micro` | | 17px | 3 | `text-lead` |
| 10.5px | 30 | `text-micro` | | 18px | 1 | `text-lead` |
| 11px | 133 | `text-micro` | | 21px | 1 | `text-title` |
| 11.5px | 17 | `text-micro` | | 22px | 3 | `text-title` |
| 12px | 64 | `text-micro` | | 25px | 2 | `text-h3` |
| 12.5px | 48 | `text-micro` | | 26px | 1 | `text-h3` |
| 13px | 51 | `text-body` | | 28px | 1 | `text-h2` |
| 13.5px | 9 | `text-body` | | 32px | 1 | `text-h1` ⚑ |
| 14px | 4 | `text-body` | | 34px | 2 | `text-h1` |
| | | | | 46px | 1 | `text-display` ⚑ |
| | | | | 52px | 3 | `text-score` |

**561 of 580 arbitrary classes collapse into `text-micro` and `text-body`.** ⚑ marks the two sites
near-equidistant in log space; the codemod flags them for a human rather than guessing.

### 3.2 Space, radii, strokes

Space is a **√2 progression snapped to the 4px grid** (the alternation 1.5× / 1.33× has geometric
mean 1.414). This reproduces the repo's existing 4/8/12/16/24 rhythm exactly and extends it
properly. The one casualty is `--space-10: 40px`, off-scale between `l` and `xl`; it maps to `l`.

| Token | ×0.25rem | `rem` | px | | Radius | `rem` | px | Applies to |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `--spacing-4xs` | 0.5 | `0.125rem` | 2 | | `--radius-xs` | `0.25rem` | 4 | chips, inline badges |
| `--spacing-3xs` | 1 | `0.25rem` | 4 | | `--radius-s` | `0.375rem` | 6 | inputs, small buttons |
| `--spacing-2xs` | 2 | `0.5rem` | 8 | | `--radius-m` | `0.5rem` | 8 | controls |
| `--spacing-xs` | 3 | `0.75rem` | 12 | | `--radius-l` | `0.75rem` | 12 | cards |
| `--spacing-s` | 4 | `1rem` | 16 | | `--radius-xl` | `1rem` | 16 | panels, drawers |
| `--spacing-m` | 6 | `1.5rem` | 24 | | `--radius-full` | `9999px` | - | pills (a sentinel, not a measurement) |
| `--spacing-l` | 8 | `2rem` | 32 | | | | | |
| `--spacing-xl` | 12 | `3rem` | 48 | | Control | `rem` | px | |
| `--spacing-2xl` | 16 | `4rem` | 64 | | `--control-sm` | `max(2rem, 24px)` | 32 | |
| `--spacing-3xl` | 24 | `6rem` | 96 | | `--control-md` | `max(2.25rem, 24px)` | 36 | |
| | | | | | `--control-lg` | `max(2.5rem, 24px)` | 40 | |

Because the whole scale is `rem`, **type and space rescale by the identical factor**, so the ratio
of ink to whitespace is invariant. That invariant is what makes a `--ui-scale: 1.25` rendering read
as the same design rather than a stretched one.

**Nested corners are a formula, not a value** - otherwise concentric curves visibly diverge:

```css
.panel > .card { border-radius: max(0px, calc(var(--radius-outer) - var(--pad-i))); }
```

**Borders never scale.** A hairline is a rendering primitive, not a design value. Scaling `1px` by
1.25 gives `1.25px`, which the compositor resolves to a blurred edge that reads as a rendering bug.

### 3.3 The four px values that survive, and the enforceable rule

Every other px literal in the adaptive layer is a defect and CI fails on one.

| Value | Why it is genuinely invariant |
| --- | --- |
| `--stroke-hairline: 1px` | A device concern. Carries no semantic size and must not scale. |
| `--focus-ring-width: 2px` | WCAG 2.4.11 / 2.4.13 minimum focus indicator thickness. A standard, not a preference. |
| `--hit-min: 44px` | A fingertip is ~9mm. Human anatomy, not a type ramp. It must **not** scale with `--ui-scale`, which is exactly why it cannot be expressed in `ch` or `rem`. |
| `--radius-full: 9999px` | A sentinel meaning "fully rounded". `50%` is wrong for non-square elements. |

> **The rule: a px literal may appear as a floor inside `max()`, never as a value.**
> `min-block-size: max(2rem, 24px)` - right. `min-block-size: 32px` - wrong.

### 3.4 Two namespace collisions that must be cleared first

Both verified live; both are prerequisites, not nice-to-haves.

**(a) `--text-*` is simultaneously a color namespace and a size namespace, and Tailwind v4 owns it
for sizes.** Inside the *same* `[data-obsidian]` block: `--text-body: #c6c0b8` (line 2354) and
`--text-h1: 32px` (line 2361). Today nothing breaks because none of it is in `@theme`; the instant
a color token moves into `@theme` to earn a utility, it collides with the font-size namespace.

```
--text-primary → --ink-strong     (--ink-* already exists: --ink, --ink-muted, --ink-subtle,
--text-body    → --ink-body        --ink-faint - this consolidates two half-built namespaces
--text-muted   → --ink-muted       rather than inventing a third)
--text-subtle  → --ink-subtle
--text-faint   → --ink-faint
```

Mechanical rename, ~350 call sites, zero visual change.

**(b) `--container-standard: 1240px` / `--container-work: 1520px`** (`styles.css:2408-2409`) are
**deleted**. They are the fixed-width cap this contract exists to kill, and the `--container-*`
namespace is claimed by the band ladder in §3.5. (Correcting proposal A's open question 4: they are
*not* in `@theme` today - the block closes at line 148 - so there is no live Tailwind collision, but
there will be the moment the ladder lands.)

### 3.5 The band ladder - one measured seed, seven derived steps

```css
/* src/styles/adaptive.css - the ONLY file permitted to define a size threshold. */
@theme {
  /* THE SEED. Machine-measured, never hand-typed.
   * Definition: 64 characters of Geist Sans at --text-body, plus 2 x --pane-pad.
   * Derivation, at root 16px:
   *   1ch = advance of "0" in Geist Sans = 0.60em = 0.525rem
   *   average mixed-case advance = 0.83ch (the ch-correction constant, machine-calibrated)
   *   -> 1 character = 0.83 x 0.525rem = 0.43575rem = 6.972px
   *   64 x 0.43575rem = 27.888rem, + 2 x 1rem pane padding = 29.888rem
   *   -> 30rem, a 0.37% rounding, well inside the 2% CI tolerance.
   * Regenerate with `bun run adaptive:calibrate`; asserted by e2e/adaptive/measure.spec.ts. */
  --container-col: 30rem;      /* 480px - ONE MEASURE. THE ANCHOR. */

  /* Every other step is an exact multiple. No independent value exists. */
  --container-nub:  7.5rem;    /* 120px - col x 0.25 - icon only */
  --container-rail: 15rem;     /* 240px - col x 0.5 - one truncated line */
  --container-slat: 22.5rem;   /* 360px - col x 0.75 - 46.9 chars ≈ the 48-char minimum measure */
  --container-wide: 45rem;     /* 720px - col x 1.5 - content at measure + a meta rail */
  --container-duo:  60rem;     /* 960px - col x 2 */
  --container-trio: 90rem;     /* 1440px - col x 3 */
  --container-quad: 120rem;    /* 1920px - col x 4 */

  /* The reading ceiling: 75 characters + padding = 34.681rem -> 34.75rem (0.2% rounding). */
  --container-colmax: 34.75rem; /* 556px */
}
```

Registering these under Tailwind v4's `--container-*` namespace does two jobs at once, and the
coincidence is the entire point:

1. it generates the container-query variants `@nub: @rail: @slat: @col: @wide: @duo: @trio: @quad:`
2. it generates the matching width utilities `max-w-col`, `max-w-slat`, ...

So **the width at which a component changes composition is literally the same token as the width it
caps its content to.** A component switches to two columns exactly when a second full column fits.
The switch point and the cap cannot drift apart, because they are one custom property.

Verified character capacity (content width ÷ 6.972px):

| Band | px | characters |
| --- | --- | --- |
| `slat` | 360 | **46.9** ≈ the 48-char minimum |
| `col` | 480 | **64.0** ← the anchor, by construction |
| `colmax` | 556 | **74.9** ≈ the 75-char ceiling |

### 3.6 Measure caps - `ch`, and only `ch`

```css
:root {
  --measure-min:   39.75ch;  /* 48 chars - nothing narrower is a reading column */
  --measure-ideal:    53ch;  /* 64 chars - the anchor's own content width */
  --measure-max:   62.25ch;  /* 75 chars - the hard reading ceiling, everywhere, always */
  --measure-code:   100ch;   /* Geist Mono: 1ch == 1 character exactly. The 100-col convention. */
}
[data-measure="prose"] { max-inline-size: min(100%, var(--measure-max)); }
[data-measure="ui"]    { max-inline-size: min(100%, var(--measure-code)); }
[data-measure="code"]  { max-inline-size: min(100%, var(--measure-code)); }
```

`ch` is correct here precisely because it is font-relative: as `--ui-scale` grows, `1ch` grows with
it, so **the character count stays constant while the pixel width changes**. A px measure would
silently drift to 90 characters at `--ui-scale: 1.25`.

> **The unit law, stated once: `rem` decides composition, `ch` decides measure.**
> A font swap may nudge a wrap point by a character. It may never flip a band.

That separation also requires a metric-matched fallback, because Geist ships `font-display: swap`
(`styles.css:2946`) and the fallback's different metrics would otherwise move every `ch` width when
the real font arrives:

```css
@font-face {
  font-family: "Geist Fallback";
  src: local("Helvetica Neue"), local("Arial");
  size-adjust: 96.5%;        /* calibrated by `bun run adaptive:calibrate` */
  ascent-override: 95%; descent-override: 25%; line-gap-override: 0%;
}
:root { --font-sans: "Geist", "Geist Fallback", ui-sans-serif, system-ui, sans-serif; }
```

---

## 4. The container hierarchy

### 4.1 Who declares a container

> **A box declares a container if and only if it allocates width to content it does not itself
> control.** Allocators declare. Consumers only read.

| Element | Selector | `container-type` | `container-name` | Why |
| --- | --- | --- | --- | --- |
| Shell | `[data-shell]` | `size` | `shell` | Owns region composition and the only block-size decisions. `100dvh` makes `size` legal. |
| Region pane | `[data-region]` | `inline-size` | `pane measure` | thread, canvas, context, ledger, and every drawer/tray body. Allocates to arbitrary caller content. |
| Lane | `[data-lane]` | `inline-size` | `pane measure` | A canvas sub-column is itself an allocator; a card in the left lane must ask the lane, not the canvas. |
| Card | `[data-card]` | `inline-size` | `card measure` | Allocates to its own children. |
| Table | `[data-table]` | `inline-size` | `table measure` | Rows query the table, not the pane, because the table may scroll horizontally inside the pane. |
| Popover body | `[data-popover-body]` | `inline-size` | `pane measure` | Radix portals to `document.body`, escaping every container. Without this a form inside a dialog silently renders in its narrowest band forever. |
| everything else | - | none | - | consumers |

### 4.2 The dual-name alias

`container-name` takes a list. Every allocator carries a specific name **and** the shared alias
`measure`:

```css
@layer components {
  [data-shell] {
    container-type: size; container-name: shell;
    block-size: 100dvh; inline-size: 100%;
    max-inline-size: var(--shell-band-max); margin-inline: auto;
    overflow: clip;
  }
  [data-region], [data-lane] {
    container-type: inline-size; container-name: pane measure;
    min-inline-size: 0;          /* the grid-blowout guard: without it a pane never shrinks */
    min-block-size: 0;
    scrollbar-gutter: stable;    /* the oscillation fix - see §4.5 */
  }
  [data-card]  { container-type: inline-size; container-name: card measure;  min-inline-size: 0; }
  [data-table] { container-type: inline-size; container-name: table measure; min-inline-size: 0; }
  [data-popover-body] { container-type: inline-size; container-name: pane measure; }
}
```

A named query resolves to the nearest ancestor carrying that name. So:

- `@container measure (...)` = "the box that immediately allocated my width", whatever kind it is.
  This is what almost every component uses, and it is what makes one component work unchanged in a
  rail, a card, a drawer and a full canvas.
- `@container pane (...)` = "the region", skipping any intervening card.
- `@container table (...)` = "the table", used only by rows and cells.
- `@container shell (...)` = "the whole app", used only by the shell grid.

**Unnamed container queries are banned** (§11.2, check S4). An unnamed `@container (...)` binds to the
nearest container of *any* name, which under nesting will silently be the card when you meant the
pane. In Tailwind variant form that means `@col/measure:`, never bare `@col:`.

### 4.3 The two-element rule (this is what C got wrong)

CSS forbids a container from being styled by its own query - otherwise the query would change the
size the query reads. So **every allocator renders exactly one structural child that carries the
query-driven layout.** This is structural in the primitive, not a rule people have to remember:

```tsx
// src/components/shell/AppShell.tsx - the fix for §1.3
<div data-shell>                      {/* measures. container-name: shell */}
  <div data-shell-grid>               {/* composes. reads @container shell */}
    <header  data-region="topbar" />
    <nav     data-region="spine" />
    <aside   data-region="thread" />
    <section data-region="canvas" />
    <aside   data-region="context" />
    <aside   data-region="ledger" />
    <div     data-region="strip" />
    <div     data-region="composer" />
  </div>
</div>
```

```tsx
// and identically at every level
export function Pane({ id, children }: PaneProps) {
  return (
    <div data-region={id}>
      <div data-pane-body className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)]">{children}</div>
    </div>
  );
}
```

### 4.4 The fallback is safe by construction

Per spec, if no ancestor matches the queried name, **the query never matches** - it does not throw
and it does not fall back to the viewport. Therefore:

> **Every component's default, unqueried styles are its narrowest correct composition.**

A card dropped into a page with no pane above it renders stacked, single-column, meta hidden.
Nothing clipped, nothing overlapping. It looks under-used, never broken. That is why narrow-first
is a rule here rather than a style. A dev-only `useContainerGuard` warns, and §11.3 check 6 fails
CI on the same condition in real DOM.

### 4.5 Containment side effects, written down so they do not become bugs

`container-type: inline-size` implies `contain: layout inline-size style`:

1. **`position: fixed` descendants are trapped** - `contain: layout` makes the element a containing
   block for fixed/absolute. `FocusDock` is "fixed bottom-center" today and would pin to whatever
   pane contains it. **Rule: `position: fixed` is legal only as a direct child of `[data-shell]`.**
   Everywhere else it is banned (§11.2, check S7). Overlays portal.
2. **Each container is a stacking context.** z-index inside a pane is scoped to that pane - this
   kills the global z-index arms race, but cross-region elevation must portal to the shell.
3. **Margins do not collapse across a container boundary.** Panes use `gap`, never margins.

`container-type: size` on the shell adds `contain: size`: contents cannot grow the shell. That is
exactly what we want (regions scroll internally, the page never does) and it is only legal because
the shell's size is set explicitly.

**The oscillation trap.** A query at 480px reveals a column, content gets taller, a scrollbar takes
15px, the container is now 465px, the query un-matches, the scrollbar goes, repeat. Containment
prevents a true infinite loop but the user sees flicker. Fixed by `scrollbar-gutter: stable` on
every pane, asserted by §11.2 check S8.

---

## 5. The shell grid

### 5.1 Regions, and the one elastic region

| Region | rank | kind | width | Notes |
| --- | --- | --- | --- | --- |
| `canvas` | 0 | core | `minmax(--canvas-min, 1fr)`, field capped at `--canvas-max` | **the only elastic region** |
| `thread` | 1 | core | `var(--container-col)` - 480px, fixed | |
| `context` | 2 | aux | `var(--container-col)` - 480px, fixed | promoted from its drawer |
| `ledger` | 3 | aux | `var(--container-col)` - 480px, fixed | promoted from the approvals tray |

> **The continuity law: only the canvas pays.** Side columns are a fixed `--container-col` at every
> tier. Within a tier only the canvas changes, and it changes continuously as `1fr`. At a tier
> boundary only the canvas changes, by exactly `col + hairline = 481px`, which is precisely the
> arriving column. **Every other region is pixel-stable across every width in the range.** This is
> asserted, not asserted-to (§11.1).

This is the merge's sharpest simplification. Proposals B and C both proposed `clamp(min, N cqi,
max)` side columns with generated coefficients; running the boundary arithmetic shows that produces
a 105px lurch in the thread and a 255px lurch in the canvas at each promotion, plus a codegen step
to maintain the coefficients. Fixing the side columns removes the lurch, removes the codegen,
removes the drift risk, and *is* C's own law ("nothing gets bigger") applied honestly.

```css
@theme {
  --pane-pad:    1rem;      /* 16px = --space-4 */
  --sub-gutter:  1.5rem;    /* 24px = --space-6 */
  --rail-w:      2.75rem;   /* 44px = max(--control-sm + 2 x --spacing-3xs, --hit-min) */

  --canvas-min:   46.5rem;  /*  744px = 2 x slat   + 1 gutter - 2 minimum-measure sub-columns */
  --canvas-ideal: 61.5rem;  /*  984px = 2 x col    + 1 gutter - 2 ideal sub-columns */
  --canvas-max:  107.25rem; /* 1716px = 3 x colmax + 2 gutters - 3 sub-columns, the ceiling */

  /* The band cap: three fixed columns + the canvas at its ceiling + three hairlines.
   * 3 x 480 + 1716 + 3 = 3159px. Not a chosen number - the sum of the parts. */
  --shell-band-max: 197.4375rem;   /* 3159px */
}
```

### 5.2 Tier floors - derived, never typed

The **promotion law**: an auxiliary region is admitted only when every incumbent is at least at its
*ideal*. An inspector never starves the canvas.

| Tier | Derivation | Floor |
| --- | --- | --- |
| S0 | WCAG 1.4.10 reflow floor | `320` |
| S1 | `slat + 2 x rail-w` = 360 + 88 | **`448`** |
| S2 | `col + canvas-min + 1` = 480 + 744 + 1 | **`1225`** |
| S3 | `col + canvas-ideal + col + 2` = 480 + 984 + 480 + 2 | **`1946`** |
| S4 | `3 x col + canvas-ideal + 3` = 1440 + 984 + 3 | **`2427`** |
| cap | `3 x col + canvas-max + 3` = 1440 + 1716 + 3 | **`3159`** |

Boundary behaviour, computed:

| At | Below the floor | At the floor | What moved |
| --- | --- | --- | --- |
| 1946 | thread 480, canvas 1464 | thread 480, **canvas 984**, context 480 | canvas −480, context +480. Thread unchanged. |
| 2427 | thread 480, context 480, canvas 1464 | thread 480, context 480, **canvas 984**, ledger 480 | canvas −480, ledger +480. Everything else unchanged. |

Both promotions have the identical shape, and the canvas lands at exactly two ideal sub-columns
each time. That symmetry is a consequence of the rule, not a number typed at the end.

### 5.3 The grid

```css
@layer shell {
  [data-shell-grid] {
    display: grid;
    block-size: 100%;
    grid-template-rows:
      var(--topbar-h)        /* topbar - never sacrificed */
      auto                   /* spine - condenses, never removed */
      minmax(0, 1fr)         /* work - the panes */
      auto                   /* strip - compresses to one line */
      auto;                  /* composer - never sacrificed */
    grid-template-areas:
      "topbar   topbar   topbar   topbar"
      "spine    spine    spine    spine"
      "thread   canvas   context  ledger"
      "strip    strip    strip    strip"
      "composer composer composer composer";
    /* DEFAULT = S0. Narrowest correct composition, per §4.4. */
    grid-template-columns: minmax(0, 1fr) 0 0 0;
    --shell-tier: S0;
  }
  [data-shell-grid] :is([data-region="context"], [data-region="ledger"]) { display: none; }
  [data-shell-grid] [data-region="thread"] { display: none; }   /* S0: region switcher instead */
  [data-region="canvas"] { grid-area: canvas; }

  /* ---------- S1 Focus: one pane, two rails, nothing removed ---------- */
  @container shell (width >= 28rem) {              /* 448px */
    [data-shell-grid] {
      --shell-tier: S1;
      grid-template-columns: var(--rail-w) minmax(0, 1fr) var(--rail-w) 0;
    }
    [data-shell-grid] [data-region="thread"] { display: flex; --peeled: 1; }
  }

  /* ---------- S2 Pair ---------- */
  @container shell (width >= 76.5625rem) {         /* 1225px */
    [data-shell-grid] {
      --shell-tier: S2;
      grid-template-columns: var(--container-col) minmax(var(--canvas-min), 1fr) 0 0;
    }
    [data-shell-grid] [data-region="thread"] { --peeled: 0; }
  }

  /* ---------- S3 Triad ---------- */
  @container shell (width >= 121.625rem) {         /* 1946px */
    [data-shell-grid] {
      --shell-tier: S3;
      grid-template-columns:
        var(--container-col) minmax(var(--canvas-min), 1fr) var(--container-col) 0;
    }
    [data-shell-grid] [data-region="context"] { display: flex; }
  }

  /* ---------- S4 Field ---------- */
  @container shell (width >= 151.6875rem) {        /* 2427px */
    [data-shell-grid] {
      --shell-tier: S4;
      grid-template-columns:
        var(--container-col) minmax(var(--canvas-min), 1fr)
        var(--container-col) var(--container-col);
    }
    [data-shell-grid] [data-region="ledger"] { display: flex; }
  }
  /* No rule above the cap. The cap is `max-inline-size` on [data-shell] (§4.2) plus the
   * absence of a fifth rule - a consequence, not a number typed at the end. */
}
```

`--shell-tier` is stamped on `[data-shell-grid]` so a browser test can read back which tier the CSS
actually applied and assert it equals the TypeScript `tierFor(width)`. That single assertion is what
makes CSS/JS drift impossible (§11.3 check 7).

### 5.4 The canvas field

Sub-column count is explicit and capped at three. `auto-fit` is not used here because at
`--canvas-max` it would silently produce a fourth column.

```css
[data-region="canvas"] > [data-canvas-field] {
  display: grid;
  gap: var(--sub-gutter);
  grid-template-columns: minmax(0, 1fr);
  max-inline-size: var(--canvas-max);
  margin-inline: auto;
}
@container pane (width >= 46.5rem) {   /*  744px = 2 x slat + gutter */
  [data-canvas-field] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@container pane (width >= 70.5rem) {   /* 1128px = 3 x slat + 2 gutters */
  [data-canvas-field] { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
[data-canvas-field] > [data-lane] > * { max-inline-size: min(100%, var(--measure-max)); }
```

### 5.5 Vertical chrome, all derived

```css
[data-shell] {
  --topbar-h:        calc(var(--control-md) + 2 * var(--spacing-2xs));  /* 52px - the shipped
                                                                          h-[52px] turns out to be
                                                                          exactly this; keep the
                                                                          derivation, drop the literal */
  --spine-h-numeric: var(--control-sm);                                  /* 32 */
  --spine-h-labeled: calc(var(--control-sm) + var(--spacing-2xs));       /* 40 */
  --spine-h-full:    calc(var(--control-sm) + var(--spacing-xs)
                          + var(--spacing-2xs) + 0.75rem);               /* 64 */
  --strip-h:         calc(var(--spacing-s) + 1.3 * var(--text-body));    /* 34 */
  --dock-h:          calc(var(--control-lg) + var(--spacing-xs) + var(--spacing-s)); /* 68 */
  --work-floor:      13.25rem;   /* 212px = 3 thread blocks (2 body lines + 1 micro line)
                                    + 2 gaps - the smallest window in which a conversation
                                    reads as a conversation */
  --dock-max-block:  30cqb;      /* no bottom dock may ever eat more than 30% of the shell */
}
```

Vertical floors: `H1 = topbar + spine-numeric + dock + work-floor = 364`;
`H2 = topbar + spine-labeled + strip + dock + work-floor = 406`;
`H3 = topbar + spine-full + strip + dock + work-floor = 430`.

```css
@layer shell {
  @container shell (height < 26.875rem) {   /* 430 - H2 */
    [data-shell-grid] { --shell-vtier: H2; }
    [data-region="spine"] { --spine-mode: labeled; }
    [data-region="spine"] [data-spine-return] { display: none; }  /* decoration goes first */
  }
  @container shell (height < 25.375rem) {   /* 406 - H1 */
    [data-shell-grid] { --shell-vtier: H1; }
    [data-region="spine"] { --spine-mode: numeric; }
    [data-region="strip"] { display: none; }
    [data-region="composer"] [data-strip-inline] { display: flex; }  /* I3 survives here */
  }
  @container shell (height < 22.75rem) {    /* 364 - H0 */
    [data-shell-grid] { --shell-vtier: H0; }
    [data-region="strip"], [data-region="composer"] { position: fixed; inset-block-end: 0; }
    [data-shell-grid]:not([data-dock-open]) [data-region="composer"] [data-composer-body] { display: none; }
  }
  [data-region="composer"] { max-block-size: var(--dock-max-block); }
}
```

`--dock-max-block: 30cqb` is the law that stops an expanded composer from eating the gate. It is a
proportion of the shell, so it holds at every height.

### 5.6 Density is the same ladder, not a second axis

Proposal A proposed four density tiers (`narrow`/`snug`/`default`/`roomy`) on the container axis,
alongside B's eight composition bands on the same axis. Two ladders measuring the same quantity is
one ladder too many. **Density is what the low bands do to padding**, and it never touches type
size - matching `docs/design/archive/tempo-v5.md` §8 ("Compact = rows lose one rhythm step; type NEVER changes").

```css
[data-card] > [data-card-body] {
  --pad-i: var(--spacing-m);   /* 24 */
  --pad-b: var(--spacing-s);   /* 16 */
  --gap:   var(--spacing-xs);  /* 12 */
  padding: var(--pad-b) var(--pad-i);
  gap: var(--gap);
}
@container measure (width < 22.5rem) {          /* below slat: one step down the √2 scale */
  [data-card-body] { --pad-i: var(--spacing-s); --pad-b: var(--spacing-xs); --gap: var(--spacing-2xs); }
}
@container measure (width < 15rem) {            /* below rail: two steps, plus affordance loss */
  [data-card-body] { --pad-i: var(--spacing-xs); --pad-b: var(--spacing-2xs); --gap: var(--spacing-3xs); }
  [data-card-body] [data-label-optional] { display: none; }  /* label survives as the accessible name */
}
@container measure (width >= 90rem) {           /* trio and up: one step up */
  [data-card-body] { --pad-i: var(--spacing-l); --pad-b: var(--spacing-m); --gap: var(--spacing-s); }
}
/* The manual toggle speaks the same language, so preference and constraint compose. */
[data-density="compact"] [data-card-body] {
  --pad-i: var(--spacing-s); --pad-b: var(--spacing-xs); --gap: var(--spacing-2xs);
}
```

One step ≈ 30% tighter, which reads as compact without reading as different, and it introduces zero
new numbers. `src/hooks/use-density.ts` currently responds with two hand-picked px values
(`14px → 10px`, `18px → 14px`); those are replaced by the shift above. The spine and topbar opt out
(`data-density-exempt`) - their heights are structural.

**Continuous density was considered and rejected** (`padding: clamp(--spacing-xs, 3cqi, --spacing-l)`):
it lands off the 4px grid at almost every width; two side-by-side panes of slightly different widths
get visibly different padding, which reads as sloppy rather than responsive; and it has no discrete
states, so there is nothing for CI to assert. Tiers are testable. That decides it.

---

## 6. Component composition - the seven archetypes

Every component reads `measure`, so one component works unchanged in a rail, a drawer, a canvas lane
and a popover. Full CSS lives in `src/styles/archetypes.css` inside `@layer components` so Tailwind
utilities can still override per instance. Contracts, in brief:

| Archetype | Selector | Default (narrowest) | `slat` 360 | `col` 480 | `wide` 720 | `duo` 960 | `trio` 1440 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Work card | `[data-card="work"]` | status + truncated title, actions below | + meta line | | title/meta/actions share rows | + inline preview strip (diff summary, CI dots) | |
| List row | `[data-row="list"]` | icon only | + trailing value | + secondary line, stacked | secondary inline; hover actions | | |
| Data table | `[data-table]` | stacked label/value list | | real table, priority 1-2 | + priority 3 | + priority 4 | |
| Stat row | `[data-statrow]` | 1 per row | `auto-fit` `minmax(nub,1fr)` | | `minmax(rail,1fr)` | | |
| Detail panel | `[data-region="detail"]` | one scroll column, meta folded into `<details>` | | | + sticky meta rail, `<details>` becomes `display: contents` | | + a third utility lane |
| Form | `[data-form]` | stacked, label above field | | label beside field (`--label-col: 14ch`) | | two field columns | |
| Diff | `[data-diff]` | unified, +/− in the gutter | | | | **split** (2 × col = exactly 2 code measures) | + review rail |

Three rules that fall out and matter more than the table:

**Column priority is markup, because it is a product decision.**
```tsx
<div data-cell data-label="Job"           data-priority="1">{blurb}</div>
<div data-cell data-label="Stage"         data-priority="3">{stage}</div>
<div data-cell data-label="Last activity" data-priority="4">{when}</div>
```
This replaces `settings.tsx:2599`'s `"132px minmax(0,1fr) 46px 104px 132px 40px 22px"` - 476px of
fixed columns plus six 12px gaps = 548px before the flexible column gets a single pixel, which is
legible in a canvas and destroyed in a 480px context column **at the same viewport width**.

**A settings section and a drawer form become literally the same JSX.** No `isDrawer` prop, no
variant. That deletion is the whole argument for container queries in one component.

**`display: contents` preserves state across a recomposition.** The detail panel's `<details>` is a
disclosure when narrow and a flat list when wide, same DOM, no conditional rendering, so **no state
is lost when the pane resizes**. Any archetype that conditionally renders instead will drop focus
and scroll position on resize - that is a rule, not a preference (§11.2 check S9).

### 6.1 Where a media query is still correct, wrong, or beside the point

**STILL CORRECT** - properties of the human, the device, or the session. None of these are about how
much room a component got. They live in exactly one file, `src/styles/environment.css`, and CI
allowlists them:

```css
@media (prefers-reduced-motion: reduce) { ... }
@media (prefers-color-scheme: dark) { ... }
@media (prefers-contrast: more) { :root { --ink-hairline: rgba(255,255,255,0.22); } }
@media (forced-colors: active) { ... }
@media (hover: hover) and (pointer: fine) { /* hover-reveal affordances may exist at all */ }
@media (pointer: coarse) { /* the 44px hit-area expansion - see §8 */ }
@media (display-mode: standalone) { [data-shell] { padding-block-end: env(safe-area-inset-bottom); } }
@media (scripting: none) { /* relevant precisely because the authenticated tree is ssr:false */ }
@media print { [data-region="thread"], [data-region="composer"] { display: none; } }
@media (min-resolution: 2dppx) { /* raster asset swaps only */ }
```

**WRONG** - every size decision. The four live examples (`styles.css:394`, `:401`, `:1536`, `:2418`)
all shrink `--page-inset-*` or similar by *window* width. Page inset is a property of the pane: a
480px context column on a 3440px screen wants the small inset. All four become container rules. CI
fails the build on a new one.

> **The rule of thumb that always resolves it: if resizing the browser window would change the
> answer but moving the same component into a drawer would not, it is a media query. Otherwise it
> is a container query.** Every layout decision in this app fails that test.

**NEITHER** - the browser already measures better than we do. Do not replace intrinsic layout with
queries:

- `repeat(auto-fit, minmax(<token>, 1fr))` already responds to the parent's width. Used correctly at
  `settings.tsx:960, 1435, 2175, 2774`; the only defect is magic px minimums (150/120/240) instead
  of ladder tokens.
- `flex-wrap: wrap` with `min-inline-size` on items.
- `text-overflow: ellipsis` + `min-inline-size: 0`.
- **An overflow menu.** `MissionShellView.tsx:307-344` hides four topbar doors with `hidden sm:flex` - a *viewport* decision about whether a *flex row* has room. On a 3440 those buttons show whether
  or not the row is crowded; on a 900px window they vanish even when there is room. The right fix is
  neither query: a `[data-overflow-row]` that moves items into a `...` menu when they do not fit,
  measured by one `ResizeObserver` on the row. That is a content-fit question with no CSS answer,
  and it is on the allowlist (§11.2 check S10).

> Use a container query when a component must become a **structurally different thing**. Use
> intrinsic layout when it must become the **same thing, resized**.

---

## 7. The ultrawide answer

**Recompose. Four capped columns, band caps at 3159px, surplus centered and deliberately empty.**

On a 3440 display: **3159 used, 281px of symmetric gutter (140 a side, 4.1% of the screen).** That
number was derived from measure and cognition, not from the founder's monitor, and it lands within
8% of it. That is a check on the model, not a target of it.

### Why not stretch

Past ~75 characters the return sweep from line-end to next-line-start loses its target and the
reader re-reads or skips. At 3440px a single prose column is ~400 characters - not "wide",
unreadable. The same effect hits data: a row whose label is at x=0 and whose value is at x=3300
cannot be scanned as one row. **A stretched thread on an ultrawide is objectively worse than a
capped one**, so any system that "fills" by widening its text column has made the extended monitor
a downgrade. That is the founder's complaint, arriving by a different road.

### Why not cap-and-letterbox

Capping at 1240/1520 (what `--container-standard`/`--container-work` do today) or 1060 (the retired
`AppShell`) paints 2000px of background and wastes the one thing an ultrawide gives you: **parallel
context.** Five agents building in parallel is a multi-lane problem and the founder owns the monitor
for it.

### Why it stops at four regions and three sub-columns

Eye travel, not taste. A 34" 3440 panel at ~600mm subtends ~67°. The no-head-turn cone is roughly
±15° ≈ **1380 CSS px**; comfortable saccadic scanning extends to ~±30° ≈ **2700 CSS px**. So:
content the user must *read and act on* sits inside ~1400px around the working fixation; content the
user *scans between* may occupy up to ~2700px; beyond that is peripheral.

The 3159px band puts thread + canvas (the correlate-and-act pair, ~1464px) inside the no-head-turn
cone, and all four regions inside the scanning cone with room to spare. A fifth region or a fourth
canvas sub-column crosses out of what one person tracks simultaneously - at that point you do not
have a wider workspace, you have a second task, and a second task belongs in a second window.

**The promotion ladder is ordered by how much foveal attention a region needs**, which is why the
ledger is outermost and the thread and canvas are central.

### Rejected: proposal B's peripheral lane

B proposed hosting a live ticker / run ledger / cost meter in the right gutter above `quad`, with
rules that it must never be the only path to an action, never the only rendering of required
information, always dismissible, never carrying the needs-you ember.

Those rules are correct, and taken together they prove the content is **redundant by construction**.
Redundant content in the periphery is decoration, which the `docs/design/archive/tempo-v5.md` restraint budget
already forbids, and it competes for attention with the one thing this product exists to surface
(§8, I1). The 140px-per-side gutter on the founder's actual monitor is not enough for it anyway.

**Revisit condition, stated so the idea is not silently lost:** if a real surface ever needs a
fifth *non-redundant* region, it is admitted through §5.2's promotion law as S5 with a derived
floor - not smuggled into a gutter.

---

## 8. The collapse priority order

### 8.1 The invariant set - never sacrificed, at any width or height

The product's job, stated once because everything below is justified against it:

> **A human is in this app to make judgment calls at gates.** Everything else - the loop rail, the
> activity strip, the canvas, the receipts - exists so that judgment is informed. Therefore **the
> gate is the last thing to give way, and it never gives way.** A layout that hides the decision to
> preserve the dashboard has inverted the product.

| # | Invariant | Why it cannot go |
| --- | --- | --- |
| **I1** | **The open gate** - its claim, its evidence line, and both buttons | This is the product. |
| **I2** | **The composer**, collapsed to a strip at minimum | If the human cannot answer, the app is broken. |
| **I3** | **The activity truth** - at minimum `N working · M waiting on you` | The machine must never work invisibly. It may compress to a count. It may never become nothing. |
| **I4** | **Escape** - the account control (sign-out) and the way back to the room | Learned the hard way when the retired `AppShell` stranded `signOut` (see the comment at `MissionShellView.tsx:359-364`). |
| **I5** | **Loop position** - the current stage, in some form | Without it every gate becomes context-free. May become a single `03/07 Plan ▾` chip. May not vanish. |

CI asserts all five are present, visible, and inside the viewport at every swept width and height
(§11.3 check 2).

### 8.2 The demotion ladder - what gives way, cheapest first

Ordering rule, stated once: **rank by distance from the gate.** A thing is cheap to demote when it
is (a) decoration, (b) has a permanent home one click away, or (c) is recoverable from what remains
on screen.

| # | What gives | How | Why it is cheap |
| --- | --- | --- | --- |
| 1 | Spine return-edge caption, `Starts from:` / `Ends with:` caps | hidden | Pure ornament; `Spine.tsx` already renders them behind optional props. |
| 2 | Topbar recessed doors - Crew, Under the hood, Artifacts, Threads | one `More` menu (overflow row, §6.1) | Already off-nav by the Engine-Room doctrine: depth, not chrome. |
| 3 | **Ledger column** | back to the approvals tray | The column is a *promoted view of the tray*. The tray is its permanent home, one key away. |
| 4 | Spine receipts + state words (`SPEC-52`, `writing the change`) | dot + number + label | Receipts are one click in; the strip still carries the live verb. |
| 5 | **Context column** | back to its drawer | Engine-Room doctrine: depth on demand behind one door. Same component, different presentation. |
| 6 | Product-switcher label | mark + chevron | The name is recoverable from the canvas masthead. |
| 7 | Spine labels | dot + number, full loop in a popover | The number preserves I5 wayfinding at a third of the width. |
| 8 | **Thread column** | peels to a `44px` rail carrying: unread pip, last agent line (truncated), **gate marker** | Gates land inline in the thread, so it may never be *removed*. As a rail it still announces a gate, and `:focus-within` unpeels it with zero JS. |
| 9 | Activity strip detail lines | one summary line | I3 preserved at its floor. |
| 10 | Canvas sub-columns | 3 → 2 → 1, then the field becomes internal tabs | Content stays reachable; only simultaneity is lost. |
| - | **STOP** | | Below this only I1 - I5 remain. There is nothing further to take. |

Vertical, same principle: spine return edge → strip detail → strip itself (summary migrates into the
composer's top line) → composer body becomes a summoned sheet. I2 and I3 survive every step.

### 8.3 The promotion ladder - the half most systems never write down

| # | What arrives | At |
| --- | --- | --- |
| 1 | Thread promotes from rail to resident column | S2, `≥ 1225` |
| 2 | Canvas gains a second sub-column | canvas `≥ 744` |
| 3 | Canvas gains a third sub-column | canvas `≥ 1128` |
| 4 | Spine gains receipts, state words, the drawn return edge | H3, `≥ 430` tall |
| 5 | **Context** promotes from drawer to resident column | S3, `≥ 1946` |
| 6 | **Ledger** promotes from tray to resident column | S4, `≥ 2427` |
| 7 | Activity strip shows up to 3 per-agent lines instead of the summary | S3 + H3 |

**Nothing on that list gets bigger.** Type does not grow, padding does not grow, no column exceeds
75 characters. **Abundance buys more, never larger.** That single rule is what makes an ultrawide
feel designed rather than zoomed, and it is why the `vw` root scale had to go (§1.1).

### 8.4 Focus mode, and why the demo workaround dies here

`focus ∈ { null, thread, canvas, context, ledger }`. When set, the focused region takes the whole
work row and every other region peels to a rail. Topbar, spine, strip and composer are unaffected - they are chrome and invariants, not competitors.

**Focus is not a special mode. S1 *is* focus mode, made mandatory by width**, so there is one code
path:

```
resolvedFocus = intent.focus ?? (tier === "S1" ? gateRegion ?? "thread" : null)
```

At S1 with an open gate, focus lands on the region holding the gate. That is I1 expressed at the
tightest tier: **when there is exactly one pane's worth of room, the pane you get is the one with
the decision in it.**

**Focus lives in the URL as `?focus=canvas`**, so it survives reload, is linkable, is scriptable,
and - the point - **a demo is recorded by pinning `?focus=`, not by pinning the window size.** That
directly retires the workaround the founder called out.

Keys: `⌘.` toggles focus on the region containing `document.activeElement`; `Esc` exits; `⌘1` - `⌘4`
go straight to a region; `⌘J` focuses the composer from anywhere; `⌘G` jumps to the oldest open gate
and focuses its primary button, unpeeling whatever it lives in.

One real product consequence falls out rather than being decided: a side-by-side diff needs two
100-column mono tracks ≈ 1440px, which exceeds the canvas's non-focused allocation at most tiers.
So **side-by-side diff is a canvas-focus capability**; unified diff is the everywhere default.

### 8.5 What survives a resize

```ts
// src/lib/shell/intent.ts
type Intent   = { focus: RegionId | null; contextOpen: boolean; ledgerOpen: boolean; threadPeeled: boolean };
type Capacity = { tier: TierId; vtier: VTierId };

/** THE RULE: capacity clamps intent for rendering, and NEVER writes back into it. */
export function resolve(intent: Intent, cap: Capacity): Resolved { /* pure */ }
```

Because capacity never mutates intent, **shrinking and re-growing returns to the exact previous
composition.** Drag a window narrow and back and you get your columns back, in the state you left
them. This is the single most-noticed behaviour of a good adaptive shell and the single most-common
bug in a bad one. Asserted in §11.1.

**Promotion and demotion are the same component in a different presentation, never two components.**
A region never unmounts when it moves between column, overlay and rail, so scroll position, form
drafts, expanded rows, text selection and in-flight streams all survive. This forbids Radix `Dialog`
for the three promotable regions - it portals to `document.body` and remounts on open, and the state
dies. Radix `Dialog` remains correct for genuinely modal things (destructive confirms, the command
palette); it is wrong for a region that holds a resident form.

**The asymmetry law: growing reveals, shrinking never covers.** If context was an open column at S3
and the window shrinks to S2, it demotes to a *closed* rail with a "kept" pip - never to an
auto-opened overlay, which would suddenly cover the canvas the user was reading. If context was an
open overlay at S1 and the window grows to S3, it promotes to an open column, because revealing more
of what you asked for is always welcome.

**Transitions.** Grid track *counts* cannot interpolate, so we do not pretend they can: the columns
snap and the arriving region does `opacity 0→1` + `translateX(1rem→0)` from its own edge over
`200ms`; the leaving region does the reverse with `transition-behavior: allow-discrete` +
`@starting-style`. Within a tier nothing animates because nothing steps - the canvas `1fr` tracks
continuously. **All motion is suppressed during an active window drag**, which is the only JS the
layout needs and exists to stop a strobe when a drag crosses a tier boundary (container queries have
no hysteresis):

```ts
// src/components/shell/useResizeSettle.ts - ~15 lines, one job, adaptive-allow: resize-observer
const ro = new ResizeObserver(() => {
  root.setAttribute("data-resizing", "");
  clearTimeout(t);
  t = setTimeout(() => root.removeAttribute("data-resizing"), 120);
});
```
```css
[data-shell][data-resizing] *, [data-shell][data-resizing] { transition: none !important; }
@media (prefers-reduced-motion: reduce) { [data-shell] *, [data-shell] { transition: none !important; } }
```

Layout itself stays pure CSS - no JS in the paint path, therefore no first-paint flash despite
`ssr: false`.

---

## 9. First paint under `ssr: false`

`src/routes/_authenticated.tsx:22` sets `ssr: false` for the whole authenticated subtree. The server
sends no app markup; React renders after the client bundle boots. There are exactly two ways to make
a layout adapt and only one survives that:

| Mechanism | Correct before hydration? | First paint |
| --- | --- | --- |
| JS measurement (`useMediaQuery`, `innerWidth`, `ResizeObserver` → state) | **No** | renders a guessed default, then reflows once JS measures. A visible snap on every load, worse on a cold Worker start. |
| CSS container queries | **Yes** | correct at first paint, zero JS. |

The stylesheet is `<link>`ed from `__root.tsx:18` and is render-blocking, so container queries
evaluate during the first layout pass. **The composition is correct before React exists.**

Because composition is pure CSS, the shell skeleton can be server-rendered *above* the `ssr: false`
boundary and is already in the right tier:

```tsx
// src/routes/__root.tsx - inside the SSR'd shell, above the ssr:false boundary
<body suppressHydrationWarning>
  <div data-shell data-booting>
    <div data-shell-grid>
      <div data-region="topbar"   className="ink-skeleton" />
      <div data-region="spine"    className="ink-skeleton" />
      <div data-region="thread"   className="ink-skeleton" />
      <div data-region="canvas"   className="ink-skeleton" />
      <div data-region="strip"    className="ink-skeleton" />
      <div data-region="composer" className="ink-skeleton" />
      {children}   {/* the ssr:false app mounts here and removes data-booting */}
    </div>
  </div>
  <Scripts />
</body>
```

Three properties follow, each removing a real defect: no flash of wrong composition (at 3440 the
skeleton already shows four regions, at 900 one); no reflow when the app mounts (the skeleton boxes
*are* the boxes, React fills them); and the existing dark-first bootstrap (`__root.tsx:197`, `:218`)
keeps working so the skeleton is on-brand from frame one.

**Corollary, enforced:** `window.innerWidth`, `matchMedia` for size, and `ResizeObserver` are banned
in the layout path. The allowlist is narrow and documented - virtualization row measurement,
canvas/chart drawing, `useResizeSettle`, and the overflow row - and each site carries an
`adaptive-allow:` comment. None of them decide composition.

Two more first-paint guards: **no `content-visibility: auto` on any container** (it defers layout,
which defers container evaluation, which reproduces exactly the flash we removed - allowed only on
off-screen list items *inside* a pane); and the shell uses `100dvh` with vertical bands far from any
URL-bar delta, so mobile chrome collapse cannot flip a band.

---

## 10. The escape from inline styles

### 10.1 The measurement, and why it is smaller than it looks

Measured this session:

| Count | Scope |
| --- | --- |
| **992** | `style={{` occurrences across `src/routes/_authenticated*.tsx` |
| **275 / 67 / 54 / 49** | the worst files: `settings`, `sync`, `build.index`, `today` |
| **97** | of the 992 carrying a **reflow-critical** property (`gridTemplateColumns`, `gridTemplateRows`, `minWidth`, `maxWidth`, `flexBasis`) |
| **3** | the same, in `src/components/mission/*.tsx` |
| **805** | hardcoded font sizes (580 `text-[Npx]` + 225 inline `fontSize`) across 23 distinct values |

**The layout escape is a 100-site problem, not a 992-site problem.** Most inline styles are `color`,
`background`, `borderColor` - token reads that carry no layout and are already theme-adaptive
because they resolve to custom properties.

The codebase already knows the rule. `settings.tsx:2190`:

```tsx
// Border color lives in classes (not inline) so hover can win;
// inline styles would beat the hover utility.
```

One instance of the correct instinct, applied once, in a 3433-line file.

### 10.2 The end-state rule

> **`style` may contain custom properties only. Any key not starting with `--` is a build error.**

```tsx
// BANNED - a declaration. Cannot be queried, cannot be hovered, wins over every class.
<div style={{ display: "grid", gridTemplateColumns: "380px minmax(0,1fr)" }} />

// CORRECT - a runtime-computed VALUE handed to CSS, which then owns all the conditionals.
<div data-diff style={{ "--digits": String(lineCount).length } as CSSProperties} />
```

The rule splits the problem along the real fault line. Runtime-computed *values* (a progress
percentage, a diff gutter's digit count, a virtualized row offset, a stagger index) genuinely belong
in JS and are fine as custom properties - CSS then consumes them inside container queries, hover
states and media queries freely. Static *declarations* never belong in JS.

### 10.3 The bridge that makes the rule fair

The reason people reach for `style={{ color: "var(--ink-subtle)" }}` is that the ink tokens are not
registered with Tailwind: `src/styles/ink.css` defines 40+ `--ink-*` / `--voice-*` properties and the
`@theme inline` block registers none of them. Register them once and the codemod becomes a lookup
table:

```css
/* append to the existing @theme inline block in src/styles.css */
@theme inline {
  --color-ink-bg: var(--ink-bg);            --color-ink-panel: var(--ink-panel);
  --color-ink-raised: var(--ink-raised);    --color-ink-text: var(--ink-text);
  --color-ink-body: var(--ink-body);        --color-ink-subtle: var(--ink-subtle);
  --color-ink-faint: var(--ink-faint);      --color-ink-hairline: var(--ink-hairline);
  --color-voice-human: var(--voice-human);  --color-voice-machine: var(--voice-machine);
  --color-voice-memory: var(--voice-memory);
  --radius-control: var(--ink-radius-control); --radius-panel: var(--ink-radius-panel);
}
```

| Inline, found in the tree today | Replacement |
| --- | --- |
| `style={{ color: "var(--ink-subtle)" }}` | `className="text-ink-subtle"` |
| `style={{ background: "var(--ink-raised)" }}` | `className="bg-ink-raised"` |
| `style={{ fontSize: 12.5 }}` | `className="text-micro"` |
| `style={{ display: "grid", gap: 8 }}` | `className="grid gap-2"` |
| `style={{ marginTop: 10 }}` | delete; the parent owns `gap` |
| `style={{ gridTemplateColumns: "380px minmax(0,1fr)" }}` | the shell grid (§5.3) |
| `style={{ gridTemplateColumns: "132px minmax(0,1fr) 46px ..." }}` | `[data-table]` + `data-priority` (§6) |

**Step 0 is a prerequisite for any lint rule.** Until `text-micro` exists, `text-[11px]` is the
*correct* thing for a developer to write and no rule against it is defensible. Ship §3.1's `@theme`
block and §3.4's renames first; only then is the gate fair.

### 10.4 Three tranches, each with a ratchet - not a stop-the-world migration

BUILD-ONLY MODE is active, so a 992-site rewrite is not on. The pressure is applied instead as a
one-way ratchet: the lint rule blocks new sites immediately, and a committed baseline count may only
ever go down. The number reaches zero on its own schedule.

| Tranche | Rule | Scope | Baseline | When |
| --- | --- | --- | --- | --- |
| **1** | ban `width\|minWidth\|maxWidth\|height\|minHeight\|maxHeight\|gridTemplate*\|flexBasis\|columnCount` in `style={{}}` | `src/routes/**`, `src/components/**` | **100** (97 + 3, measured) | now - this is the one that unblocks adaptivity |
| **2** | ban `fontSize\|letterSpacing\|lineHeight\|fontWeight` in `style={{}}`, and `text-[...px]` / `leading-[...px]` / `tracking-[...px]` | same | measured at landing (~805) | after §3.1's `@theme` block ships |
| **3** | **custom properties only** | `src/app/**` (the rebuilt tree) | **0**, no grandfather | from commit one |

```js
// eslint.config.js - tranche 1, extending the existing no-restricted-syntax block
{
  selector:
    "JSXAttribute[name.name='style'] Property[key.name=/^(width|minWidth|maxWidth|height|minHeight|maxHeight|gridTemplate|gridTemplateColumns|gridTemplateRows|gridTemplateAreas|flexBasis|columnCount)$/]",
  message:
    "Layout in style={{}} cannot answer a container query, so it is frozen forever. Use a data-* " +
    "hook in src/styles/archetypes.css, or pass the shape as a custom property (--cols-*) and let " +
    "CSS choose. See docs/planning/rebuild-2026-07/adaptive/FINAL-adaptive-layout.md section 10.",
}
```

**The legal intermediate state**, which is the pragmatic bridge for `settings.tsx` (275 inline
styles, 3433 lines) where a full rewrite in one pass is not sensible: an inline style *can* assign a
custom property, and a class-based rule inside a container query *can* read it.

```tsx
// before - cannot respond to its container (settings.tsx:2599, and 96 siblings)
<div style={{ display: "grid", gridTemplateColumns: "132px minmax(0,1fr) 46px 104px 132px 40px 22px" }}>

// after - the shape is declared as data; CSS decides which shape applies at which width
<div data-grid="agent-roster"
     style={{ "--cols-wide": "132px minmax(0,1fr) 46px 104px 132px 40px 22px" } as CSSProperties}>
```
```css
[data-grid="agent-roster"] { display: grid; gap: var(--spacing-xs);
                             grid-template-columns: var(--cols-narrow, 1fr auto); }
@container measure (width >= 40rem) { [data-grid="agent-roster"] { grid-template-columns: var(--cols-mid); } }
@container measure (width >= 60rem) { [data-grid="agent-roster"] { grid-template-columns: var(--cols-wide); } }
```

Note `@container measure`, not `@media`: that roster now adapts to *its slot*, so it works
identically in the canvas at S2, in the context column at S4, and in a drawer at S1.

**Migration order** (highest reflow risk first, from the measured file list):
`_authenticated.settings.tsx` → `_authenticated.admin.pricing.tsx` → `_authenticated.traces.$traceId.tsx`
→ `_authenticated.engine-room.tsx` → `components/mission/faces.tsx` → `_authenticated.build.index.tsx`.

---

## 11. Verification - what fails CI

Four gates in cost order. **Gates 0 and 1 need no browser and run today with zero new
dependencies** (`bun test` is the configured runner; `@happy-dom/global-registrator` is already a
devDependency). Gates 2 and 3 need Playwright.

> **Prerequisite, verified:** `playwright.config.ts` and ten `e2e/*.spec.ts` files exist, but
> `@playwright/test` is **not** in `devDependencies` and is not installed - the entire e2e suite is
> currently dead code. Adding it is a deliberate step, and `bunfig.toml`'s 24h `minimumReleaseAge`
> supply-chain guard means it must be added on purpose, not mid-migration.

### 11.0 Gate 0 - the algebra and the sweep (`bun test`, milliseconds, no browser)

**This is the load-bearing gate.** The composition table is written **once, in TypeScript**, and it
feeds (a) a CSS codegen for the tier floors, (b) the runtime predicate for keyboard/aria/intent
clamping, and (c) these tests. Nothing hand-writes a threshold.

```ts
// src/lib/shell/composition.ts   (values generated from adaptive.css by scripts/read-shell-tokens.mjs,
//                                 so the algebra can never drift from the stylesheet)
export const T = { col: 480, slat: 360, colmax: 556,
                   canvasMin: 744, canvasIdeal: 984, canvasMax: 1716,
                   rail: 44, hairline: 1 } as const;

export const REGIONS = {
  canvas:  { rank: 0, kind: "core", min: T.canvasMin, ideal: T.canvasIdeal, max: T.canvasMax },
  thread:  { rank: 1, kind: "core", min: T.col,       ideal: T.col,         max: T.col },
  context: { rank: 2, kind: "aux",  min: T.col,       ideal: T.col,         max: T.col },
  ledger:  { rank: 3, kind: "aux",  min: T.col,       ideal: T.col,         max: T.col },
} as const;

export const TIERS = [
  { id: "S0", resident: [] },
  { id: "S1", resident: ["canvas"] },
  { id: "S2", resident: ["thread", "canvas"] },
  { id: "S3", resident: ["thread", "canvas", "context"] },
  { id: "S4", resident: ["thread", "canvas", "context", "ledger"] },
] as const;

export const BAND_MAX = 3 * T.col + T.canvasMax + 3 * T.hairline;   // 3159
```

```ts
// src/lib/shell/composition.test.ts
test("tier floors are strictly increasing and unique", () => {
  const f = TIERS.map((t) => tierFloor(t.id));
  expect(f).toEqual([...f].sort((a, b) => a - b));
  expect(new Set(f).size).toBe(f.length);
});

test("an auxiliary region never starves a core region", () => {
  for (const t of TIERS) {
    const aux = t.resident.filter((r) => REGIONS[r].kind === "aux");
    if (!aux.length) continue;
    const coreIdeal = t.resident.filter((r) => REGIONS[r].kind === "core")
      .reduce((s, r) => s + REGIONS[r].ideal, 0);
    expect(tierFloor(t.id)).toBeGreaterThanOrEqual(coreIdeal);
  }
});

test("the band cap is the sum of the parts", () => {
  expect(BAND_MAX).toBe(3 * T.col + T.canvasMax + 3 * T.hairline);
});

test("the ladder is exact multiples of the anchor", async () => {
  const css = await Bun.file("src/styles/adaptive.css").text();
  const rem = (k: string) => Number(css.match(new RegExp(`--container-${k}:\\s*([\\d.]+)rem`))![1]);
  for (const [k, m] of Object.entries({ nub: .25, rail: .5, slat: .75, wide: 1.5, duo: 2, trio: 3, quad: 4 }))
    expect(rem(k)).toBeCloseTo(rem("col") * m, 5);
});

// --- the sweep: ~4,800 assertions, no browser, catches the original defect ---

test("the resident set never shrinks as width grows, 320..5120, every 1px", () => {
  let prev = new Set<RegionId>();
  for (let w = 320; w <= 5120; w++) {
    const now = new Set(TIERS.find((t) => t.id === tierFor(w))!.resident);
    for (const r of prev) expect(now.has(r), `${r} lost at ${w}px`).toBe(true);
    prev = now;
  }
});

test("ONLY THE CANVAS PAYS: no incumbent region changes width at a tier boundary", () => {
  for (let w = 321; w <= 5120; w++) {
    const a = widths(w - 1), b = widths(w);
    for (const r of ["thread", "context", "ledger"] as const)
      if (a[r] && b[r]) expect(b[r], `${r} jumped at ${w}px`).toBe(a[r]);
  }
});

test("the canvas is continuous within a tier and pays exactly one column at a boundary", () => {
  for (let w = 321; w <= 5120; w++) {
    const d = widths(w).canvas - widths(w - 1).canvas;
    const boundary = tierFor(w) !== tierFor(w - 1);
    if (!boundary) expect(Math.abs(d)).toBeLessThanOrEqual(1);
    else if (w >= 1946) expect(d).toBe(-(T.col + T.hairline));   // -481, exactly
  }
});

test("the invariant set survives every width, every height, every intent", () => {
  for (let w = 320; w <= 5120; w += 7)
    for (const h of [320, 364, 406, 430, 800, 1440])
      for (const intent of INTENT_MATRIX) {                       // 16 combinations
        const r = resolve(intent, { tier: tierFor(w), vtier: vtierFor(h) });
        expect(r.composerPresent).toBe(true);            // I2
        expect(r.activitySummaryPresent).toBe(true);     // I3
        expect(r.escapePresent).toBe(true);              // I4
        expect(r.loopIndicator).not.toBe("none");        // I5
        if (intent.hasOpenGate) expect(r.gateVisibleIn).not.toBeNull();   // I1
      }
});

test("resize is reversible: capacity never mutates intent", () => {
  const intent = { focus: null, contextOpen: true, ledgerOpen: true, threadPeeled: false };
  const before = structuredClone(intent);
  for (const w of [3440, 1200, 700, 420, 700, 1200, 3440]) resolve(intent, { tier: tierFor(w), vtier: "H3" });
  expect(intent).toEqual(before);
});

test("shrinking never covers: a demoted open region parks closed", () => {
  const r = resolve({ focus: null, contextOpen: true, ledgerOpen: false, threadPeeled: false },
                    { tier: "S1", vtier: "H3" });
  expect(r.regions.context.presentation).toBe("rail");   // never "overlay"
});
```

### 11.1 What this gate would have caught

The original defect, exactly: "the app is designed for 1440." A layout with no width model fails
`the resident set never shrinks` and `the invariant set survives every width` on the first run.

### 11.2 Gate 1 - the static scan (`bun test`, sub-second)

| # | Check | Fails on |
| --- | --- | --- |
| S1 | inline style declarations | any `style={{}}` key not starting with `--`, in `src/app/**`; the tranche-1/2 property sets elsewhere |
| S2 | viewport breakpoints | `sm:`/`md:`/`lg:`/`xl:`/`2xl:` anywhere in `src/app/**` |
| S3 | `@media` outside the allowlist | any `@media` outside `src/styles/environment.css`, or any size feature (`min-width`/`max-width`) anywhere |
| S4 | unnamed container queries | `@container (` with no name; bare `@col:` Tailwind variants |
| S5 | magic px in layout properties | a px literal in a size/grid/gap property that is not `1px`, `2px`, `44px`, or inside `max()` |
| S6 | `font-size` on a container root | a rule whose selector matches `[data-region]`, `[data-lane]`, `[data-card]` or `[data-table]` and sets `font-size` (§1.2) |
| S7 | `position: fixed` outside the shell | `fixed` in a component that is neither `[data-shell]` nor a `createPortal` call (§4.5) |
| S8 | missing scrollbar gutter | `adaptive.css` lacking `scrollbar-gutter: stable` (§4.5) |
| S9 | conditional render across a band | a component whose band rule uses `{cond && <X/>}` where CSS could use `display: contents` (§6) |
| S10 | JS measurement in the layout path | `window.innerWidth`, size `matchMedia`, or `new ResizeObserver` without an `adaptive-allow:` comment (§9) |
| S11 | px type or px tracking | `font-size`/`letter-spacing` with a px value; `text-[...px]` / `tracking-[...px]` |
| S12 | the `--text-*` collision | a `--text-*` property whose value is a color (§3.4a), permanently |
| S13 | the ratchet | reflow-critical inline-style count above the committed `layout-ratchet.json` baseline (100) |

### 11.3 Gate 2 - the browser sweep (Playwright, on any `src/styles/**` or `src/components/shell/**` diff)

Replaces the current three fixed viewports (1280/768/320 - precisely how a fixed-artboard app passes
its own tests) with a **derived, boundary-aware sweep**: every tier floor, every floor ±1, every
vtier floor, plus 24 pseudo-random widths seeded per run so drift is found rather than memorised.

```ts
// e2e/10-adaptive-sweep.spec.ts
import { TIERS, tierFloor, BAND_MAX, tierFor } from "../src/lib/shell/composition";
const WIDTHS = [320, 448,
  ...TIERS.flatMap((t) => { const f = tierFloor(t.id); return [f - 1, f, f + 1]; }),
  640, 720, 960, 1280, 1440, 1512, 1728, 1920, 2560, 3440, BAND_MAX, BAND_MAX + 1, 3840, 5120,
  ...seededSample(24, 320, 5120)].filter((w) => w >= 320).sort((a, b) => a - b);
const HEIGHTS = [225, 364, 406, 430, 800, 1440];
```

Per surface, per rung:

1. **No horizontal page scroll, ever.** `documentElement.scrollWidth <= clientWidth`, and no element
   overflows its pane unless it carries `data-scroll="x"` (diffs, terminals, wide tables scroll
   *inside* themselves).
2. **The invariant set** - I1 - I5 present, visible, and inside the viewport. The gate's primary
   button `toBeInViewport()` after `seedOpenGate(page)`.
3. **Reading measure** - no text run exceeds 75 characters, measured by dividing each text node's
   `Range.getBoundingClientRect()` width by that node's own computed average advance. This catches
   an ultrawide stretch regression directly.
4. **Legibility floor** - nothing renders below 11 CSS px (10.5 for mono).
5. **On-scale snap** - every rendered `font-size` is on the nine-step scale (or a step × the
   `0.9286` mono ratio). *This does not care whether the size arrived from a Tailwind class, an
   inline style, a third-party stylesheet or a future refactor: if a rendered size is not on the
   scale, CI is red.* It is what makes the 23 values impossible to reintroduce.
6. **No orphan components** - nothing carrying `[data-card]`/`[data-row]`/`[data-form]`/`[data-table]`
   has zero container ancestors (§4.4).
7. **CSS and JS agree** - `getComputedStyle(grid).getPropertyValue("--shell-tier")` equals
   `tierFor(w)`. This closes the drift loop permanently.
8. **Touch target = hit area, not box size.** The current assertion measures bounding rects, which is
   why `styles.css:1546` inflates every control to 44px below 768px - the standard is about *target*
   size, not *visual* size. Replaced by probing the four corners of a 44px square around each
   control's centre with `elementFromPoint` and confirming they hit the same control. The 32px
   control stays 32px; the finger gets 44px.

Plus a zoom pass at 1440×900 and 2560×1440 with `document.body.style.zoom = "2"`, asserting 1 and 2
only - zoom's job is to prove the demotion ladder fires, not to re-prove measure. Browser zoom needs
no API beyond that: §2.3 establishes `effective CSS px = physical px / zoom`, so the `720×450` and
`360×225` rungs *are* the 200% and 400% tests. Saying so instead of building a fake zoom harness is
the honest call.

### 11.4 Gate 3 - the proof harness and the calibration

**The proof harness** is a dev-only route rendering one component inside a pane of an exact width - no login, no database, no seeded workspace:

```
/__proof/$archetype?w=480&fixture=overflowing
```

7 archetypes × 9 widths × 5 fixtures (`empty`, `typical`, `overflowing`, `longest-strings`, `rtl`)
= **315 screenshot + overflow + clipping assertions per run**, each ~200ms. This is only possible
because container queries make a component testable in isolation; a viewport-query design cannot be
tested this way at all.

**The calibration test** keeps the one seed constant honest:

```ts
// e2e/adaptive/measure.spec.ts
test("--container-col still equals 64 characters of Geist + 2 x pane-pad", async ({ page }) => {
  await page.goto("/__proof/measure");
  await page.waitForFunction(() => document.fonts.status === "loaded");
  const { measured, token } = await page.evaluate(() => { /* render a 64-char probe, measure it */ });
  expect(Math.abs(measured - token) / token,
    "--container-col drifted. Run: bun run adaptive:calibrate").toBeLessThan(0.02);
});
```

That is what makes "no magic numbers" a mechanical property rather than a promise: the single seed in
the whole system is machine-measured, and if anyone changes the body type size, the pane padding or
the font, the build fails with the command that regenerates it. The same spec re-derives the `0.83`
ch-correction constant and the `Geist Fallback` `size-adjust`.

### 11.5 Wiring

```jsonc
"scripts": {
  "test:adaptive":     "bun test src/lib/shell src/__tests__/adaptive-static.test.ts",
  "test:adaptive:e2e": "playwright test e2e/adaptive e2e/10-adaptive-sweep.spec.ts",
  "adaptive:calibrate":"playwright test e2e/adaptive/measure.spec.ts --update-snapshots",
  "prebuild":          "bash scripts/check-migrations.sh && bun run test:adaptive"
}
```

Gates 0 and 1 run on **every build** (sub-second, no browser). Gates 2 and 3 run in CI and on
`test:adaptive:e2e`. Screenshot baselines live under `e2e/adaptive/__screenshots__/`, so a
composition change requires an explicit `--update-snapshots` - which is exactly the review moment we
want.

---

## 12. Build order

Steps 1-4 ship no UI and are safe to land first; they make every later step falsifiable.

| # | Deliverable | Depends on | Unlocks |
| --- | --- | --- | --- |
| 1 | `--text-*` → `--ink-*` rename (§3.4a); delete `--container-standard` / `--container-work` (§3.4b) | - | everything |
| 2 | `src/styles/tokens/{scale,type,space}.css` - the `@theme` blocks (§3.1-3.3) + `html { font-size: calc(100% * var(--ui-scale,1)) }` | 1 | tranche 2 |
| 3 | `src/styles/adaptive.css` - the band ladder + container declarations (§3.5, §4.2) | 2 | Gate 0 |
| 4 | `src/lib/shell/{composition,intent}.ts` (pure, no React) + `scripts/read-shell-tokens.mjs` | 3 | Gates 0, 1 |
| 5 | `src/styles/environment.css` - the media-query allowlist (§6.1) | - | Gate 1 S3 |
| 6 | ESLint tranche 1 + `layout-ratchet.json` baseline at 100 | - | Gate 1 S13 |
| 7 | `AppShell.tsx` (**two-element**, §4.3) + `ShellRegion.tsx` + `useResizeSettle.ts` | 3, 4 | Gate 0 |
| 8 | Port `MissionShellView`'s five regions onto `AppShell` - the `data-region` hooks already exist | 7 | Gate 2 |
| 9 | `context` and `ledger` regions: one component, three presentations (§8.5) | 8 | Gates 0, 2 |
| 10 | Focus mode + `?focus=` + the keymap (`⌘.` `⌘1-4` `⌘J` `⌘G` `Esc`) | 8 | Gate 2 |
| 11 | Add `@playwright/test` (deliberate, per `bunfig.toml`); `e2e/10-adaptive-sweep.spec.ts` | 8 | Gates 2, 3 |
| 12 | `src/styles/archetypes.css` - the seven contracts (§6) + `/__proof/$archetype` | 3 | Gate 3 |
| 13 | Type codemod (§3.1 table) + ESLint tranche 2 | 2, 12 | Gate 2 checks 4, 5 |
| 14 | Migrate the six files in §10.4's order to `data-*` + `@container measure` | 6, 12 | Gate 1 S13 → 0 |

---

## 13. The six tests, answered

| Test | How this contract passes it |
| --- | --- |
| **1. Resize** | Only the canvas ever changes width, and inside a tier it changes as `1fr` - continuously, sub-pixel. At the two promotion boundaries it gives up exactly `481px` while every other region stays pixel-identical. Asserted at every 1px step from 320 to 5120 (§11.0). |
| **2. Monitor switch** | Composition, not stretch: 1440 laptop → thread + canvas; 1920 → thread + 3-column canvas; 2560 → four regions; 3440 → four regions at the 3159px cap with 140px gutters. No column ever exceeds 75 characters, on any monitor, in any tier, in focus mode. |
| **3. Zoom** | `effective CSS px = physical px / zoom`, exactly, so zoom walks *down* the same tier ladder: 1440×900 at 200% → `720×450` → S1/H3, fully composed; at 400% → `360×225` → S0/H0, still functional, still no horizontal scroll. The 320px floor is the WCAG 1.4.10 requirement, met deliberately. |
| **4. Density** | Small: the band ladder steps padding down the √2 scale and drops optional labels - the same design, compact, never a different one. Large: the canvas holds up to three full-measure lanes and three side regions promote in, so 3159px is genuinely occupied rather than padded. Type never changes on the container axis, at either end. |
| **5. Gate** | I1 - I5 are structurally exempt from the demotion ladder, which is itself ordered by *distance from the gate*. At S1 - one pane's worth of room - `resolvedFocus` lands on the region holding the gate. The thread may peel to a rail but never disappears, because gates land in it, and the rail still carries the gate marker. `⌘G` reaches the oldest open gate from any tier, any focus state, any peel. Asserted across every width × height × intent combination. |
| **6. Buildability** | Tailwind v4.3.3 (verified installed) supports `@theme` container-query variants and `@container` natively. Every threshold is a literal `rem` in one file. There are no generated `cqi` coefficients to maintain, because side columns are fixed. Gates 0 and 1 run today on `bun test` with zero new dependencies. The one seed constant is machine-measured and CI-verified. The only open procurement item is `@playwright/test`, and it is named as such. |

---

## 14. What is still unowned, named so it does not get lost

1. **Virtualized lists inside containers.** A virtualizer measures row height in JS; a band change
   alters row height in CSS. The invalidation path between them is real work and belongs to whoever
   owns the list surface.
2. **Persisted user sizing.** If the thread ever becomes drag-resizable, the persisted width must be
   stored as a *band* and restored as a width, or a user restores a 900px thread onto a 1280px
   laptop.
3. **RTL.** The contract uses logical properties throughout (`inline-size`, `padding-inline`,
   `inset-inline-end`) and the proof harness has an `rtl` fixture, but no surface has been reviewed
   in RTL.
4. **The `docs/design/archive/tempo-v5.md` base-size discrepancy.** The contract says 13px; `[data-obsidian]` ships
   14px; this document builds on the measured 14px. Either the contract is corrected to match
   reality or the app is corrected to match the contract - the discrepancy must not survive the
   rebuild.
5. **The 11.67px metadata floor** replaces today's 9px and 10px sans metadata (46 + 151 sites). It
   is a quality gain and mono still reaches 10.83px, but it is the most visible single change in
   this document and deserves an explicit founder look before the codemod runs.
