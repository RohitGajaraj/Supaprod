# DESIGN-TEMPO.md — the v5 "Tempo" design contract

> _Adopted 2026-07-10 (founder ruling). **Tempo is THE standing design system for every
> Cadence surface — the authenticated app AND the public landing/marketing pages.** It
> supersedes Loom v4 (`DESIGN-LOOM.md`), Obsidian v3 (`DESIGN-OBSIDIAN.md`), and the Ember
> Editorial landing system (`DESIGN.md`); those files are retired history. When any other
> file disagrees with this one on look, feel, tokens, type, or component anatomy, this
> contract wins. Lineage: v1 tokens · v2 Ember Editorial · v3 Obsidian · v4 Loom ·
> **v5 Tempo**._

## 0. What Tempo is

**Tempo derives its base from Vercel's Geist design system** (vercel.com/geist) —
structure, token architecture, typography model, materials, component anatomy, and
documentation quality mirrored deliberately: we are adopting an enterprise-grade, proven
system, not inventing one. On that base, Tempo layers **Cadence's own identity** so the
result is recognizably ours:

1. **The ember brand color** (`#FF6B2C` family) as a full 10-step scale in the role
   Geist's blue plays for brand/interactive accents.
2. **Our own identity layer** (§8): icon treatment, illustration language, logo usage,
   Geist Pixel as the brand display face, and sanctioned personality touches.
3. **Cadence-specific pattern extensions** (§9): AI/agent interfaces and enterprise
   workflow patterns Geist does not document.

Where Geist is silent, we fill gaps from the craft of Linear, Stripe, Notion, Figma, Arc
Browser, Anthropic, and Perplexity — **inspiration only, never a second base** — and every
such addition is documented as an EXTENSION so it never conflicts with the derived core.

The evidence and tooling live in [`design-reference/tempo-v5/`](./design-reference/tempo-v5/README.md):

- `tokens/*.css` — canonical values (colors both themes, typography, materials, spacing,
  fonts). **Copy tokens verbatim. Never invent a hex, radius, shadow, or easing.**
- `research/<component>.md` — a re-implementation-grade spec of every documented Geist
  component (sections, API surface, code examples, paraphrased best practices, design
  notes). **Before building or restyling any component, read its spec.**
- `research/_foundations.md`, `research/_public-sources.md` — the system model and what is
  publicly liftable (fonts: yes, SIL OFL; Geist component code: not published — we
  re-implement on React 19 + Tailwind v4 + Radix).
- `patterns/<pattern>.md` — the extension library (§9): anatomy, variants, states,
  accessibility, responsive behavior, interaction model, tokens, implementation guidance,
  usage examples for every reusable pattern beyond Geist's catalog.

## 1. Theme law — dark-first

- **Dark is the default experience.** `:root` IS the dark theme. Light is a secondary
  theme produced from the same token names via `[data-theme='light']` / `.light-theme`.
- Never author a surface dark-only or light-only. Every token consumed must resolve in
  both themes; test both before shipping.
- Backgrounds: `--ds-background-100` (#0a0a0a dark / #fff light) for pages and component
  fills; `--ds-background-200` sparingly, only for subtle differentiation.

## 2. Color law — the role model

Ten scales × ten steps (`--ds-<scale>-100…1000`), identical role semantics in every scale:

| Steps    | Role                                             |
| -------- | ------------------------------------------------ |
| 100–300  | Component backgrounds: default / hover / active  |
| 400–600  | Borders: default / hover / active                |
| 700–800  | High-contrast backgrounds (solid fills)          |
| 900–1000 | Text and icons: secondary / primary (accessible) |

- **Gray carries the interface.** A screen is neutral by default; chromatic color appears
  only with meaning.
- **Ember = the brand.** Primary CTAs, active/selected states, focus ring, brand moments.
  One primary CTA per view. Ember takes every place Geist's own docs use blue _as brand_.
- **Ember-on-forms ruling (founder-delegated decision, 2026-07-11):** ordinary form
  actions (Save, Apply, Update, submit rows) use the neutral `default` button variant —
  the high-contrast invert fill (gray-1000 on background), the Geist/Linear premium
  read. Ember fills are reserved for the view's ONE true primary CTA (Deploy, Upgrade,
  Start teardown, hero actions) and brand moments. A settings page full of ember Saves
  fails the restraint budget by definition.
- **Blue = informational** (links, info notes). **Red = danger/error. Amber = warning.
  Green = success. Teal/Purple/Pink = data-viz and Geist-specified component states
  only.** Status color goes on actual status, never decoration.
- Use `--ds-gray-alpha-*` when layering over unknown backgrounds.
- Focus ring: `--ds-focus-ring` (2px background + 2px ember). Never remove focus
  visibility.

**Glacier / machine-voice narrowing (founder ruling, 2026-07-11 — supersedes the
2026-07-06 Loom v4.1 color ruling on this point):** the app carries a second
accent, `--glacier` (aliased today to `--ds-blue-600`), originally scoped as
"the machine voice — live state, agent presence, mono-label accent" and used
that way across ~114 files. That is too broad: a screen with two competing
saturated accents (ember for human action, glacier for machine presence)
fails the restraint budget even when each individual use looked reasonable in
isolation. Vercel's own product reserves blue for narrow, literal status
moments (a "Building" deployment badge), never as an ambient tint. Going
forward, `--glacier`/`--machine`/`--blossom`/`--link` may only be used for:
literal status badges/chips/pills (a "Live"/"Running"/"Streaming" indicator),
citation/source chips, and hyperlinks. They may NOT be used for: icon fill on
non-status icons, decorative borders/glows/hover tints, background washes,
card accents, or as a generic "this is AI-related" tint outside an actual
status control. Default everything else to gray (`--ds-gray-900/1000` text,
`--ds-gray-400/600` borders); ember remains the only brand accent for
interactive/selected/primary elements. `--action-blue` (links + literal
running-state text, aliased to `--ds-blue-600`) keeps its existing narrow
scope unchanged — it was already status/link-only. Chart/data-viz series
(`--chart-2` etc.) are unaffected; a chart legitimately needs multiple hues.

## 3. Typography law — three faces, three jobs

**Verified against vercel.com/font (2026-07-11):** Vercel built Geist for developers and
designers on three Swiss-design principles — simplicity, minimalism, speed — with
"precision, clarity, and functionality." Mono shipped first for code-environment
readability; Sans followed for general typographic needs; Pixel followed for display
variation. Vercel states no rigid hierarchy beyond "the right face for the context" —
which is exactly the three-lane split below. No deviation needed; our lane assignment
already matches Vercel's own usage intent one-to-one.

Self-hosted (no Google Fonts, no CDN): `/public/fonts/geist/` + `tokens/fonts.css`.
Exact `@font-face` names in use, all self-hosted variable fonts (weight axis 100-900
except Pixel, which is a fixed-weight 400 display face): `"Geist"`, `"Geist Mono"`,
`"Geist Pixel Square"` / `Circle` / `Grid` / `Line` / `Triangle`.

1. **Geist Sans** (`--font-sans`) — every interface string. The only UI face.
2. **Geist Mono** (`--font-mono`) — technical content: ids, slugs, paths, code, hashes,
   timestamps, tabular numbers, keyboard shortcuts.
3. **Geist Pixel** (`--font-pixel`; Square is the default face, Circle/Grid/Line/Triangle
   are sanctioned alternates) — **brand moments only**: heroes, launch screens, feature
   announcements, empty-state headlines, AI-moment flourishes, big numerals. Never
   long-form text, never dense UI, never body copy, never controls.

Type is consumed through the class system (`tokens/typography.css`), never ad-hoc:
`text-heading-72…14` (600 weight, tight tracking) for page/section titles;
`text-button-16/14/12` inside button-rendering components only; `text-label-*` for single
lines (14 is the UI workhorse; mono variants pair one size down); `text-copy-*` for
multi-line text (14 most common, 13 where space is premium). `<strong>` nested inside
gives Strong (labels/copy) or Subtle (headings). Tabular numerals for changing numbers.

**Retired faces: Newsreader, Schibsted Grotesk, JetBrains Mono, IBM Plex Mono, Codystar,
Caveat, Silkscreen** — do not reintroduce. Inter/Roboto remain banned as ever.

**Known footgun (found + fixed 2026-07-11):** `src/styles.css` carries a legacy
`[data-obsidian]` token block (ported from the retired Obsidian v3 app contract) that
still declares the old Ember-era voice vars — `--font-serif`, `--font-ui`, `--font-dotted`,
`--font-pencil` — by their legacy names, because ~130 components still reference those
var names directly. A _second_, later `[data-obsidian]` block was added to re-alias them
to Geist and wins the cascade (same selector, later source order beats the earlier
block) — but the earlier block still held literal retired-font strings until this fix,
so a routine refactor that removed the later block (or reordered them) would have
silently un-fixed the whole app. The literal strings are gone now; every legacy-named
var aliases via `var()` to `--font-sans` / `--font-mono` / `--font-pixel`. **Rule going
forward: a legacy-named font var may only ever hold a `var()` alias to the Tempo trio,
never a literal font-family string — in either `[data-obsidian]` block.** A landing-page
`<link>` to Google Fonts for IBM Plex Mono + Silkscreen was also found still loading
live (`src/routes/index.tsx`) and removed — self-hosted Geist only, no Google Fonts.

## 4. Materials law — elevation is a preset

Radii, fills, strokes, and shadows come ONLY from the material presets
(`tokens/materials.css`), which encode elevation role:

- On the page: `material-base` / `small` / `medium` / `large` (6/6/12/12px radius).
- Above the page: `material-tooltip` (6px, lightest, the only stemmed element) /
  `menu` (12px) / `modal` (12px) / `fullscreen` (16px).
- Pick the lowest elevation that reads; never stack two materials on one element; never
  hand-roll a border+shadow+radius combo. Z-index comes from `--ds-z-*` bands and must
  agree with the material role.

## 5. Layout, spacing, controls

- 4px base unit; the `--geist-space-*` ramp and gap rhythm (`24px` gap, `12px` half,
  `8px` quarter, `32px` section) govern all layout spacing.
- Every control (button, input, select, combobox trigger…) snaps to the three heights:
  **32 / 36 / 40px** (`--ds-size-small/medium/large`); medium is the default.
- Page content max-width `--ds-page-width` (1400px).
- Popovers share one anatomy: 6px padding, 36px rows, 6px row radius.

## 6. Motion law

- One easing family: `--ds-motion-timing-swift` `cubic-bezier(.175,.885,.32,1.1)`.
- Overlays: scale from 0.96, 300ms. Popovers: 200ms. Micro-interactions ≤ 200ms.
- Motion is feedback, not decoration; everything gates on `prefers-reduced-motion`.
- Character (Arc-inspired, subtle): springy settle on floating surfaces via the swift
  easing's slight overshoot — never bouncy, never long, never on text.

## 7. Component canon

Every Geist-documented component has a spec in `design-reference/tempo-v5/research/`.
The build rule:

1. **Read the spec first.** Match its anatomy, variants, sizes, and states exactly
   (ember substituting for brand-blue).
2. Implement on our stack: Radix primitive where one exists, shadcn/ui structure,
   Tailwind v4 classes consuming the `--ds-*` tokens. Shared primitives live in
   `src/components/ui/` — never bespoke one-off restyles inline.
3. Respect the cross-component contracts (destructive Button → confirming Toast;
   disabled control → explaining Tooltip; >2 sibling actions → Menu/Split Button;
   icon-only → `aria-label` required).
4. For anything Geist does not cover, use the matching `patterns/` extension doc (§9);
   if none exists yet, write it in the same session following the extension protocol.

## 8. Identity layer — recognizably Cadence

The base is Geist; these are the elements that make Tempo ours. Tweaks sit ON TOP of the
derived base and never contradict §§1–7.

- **Brand color**: ember (`--ds-ember-*`). The single chromatic voice of the brand.
- **Brand display face**: Geist Pixel (Square) under the §3 brand-moment rules — this
  face IS the visual signature of Cadence surfaces.
- **Icons**: lucide, 16px default (20px in headers), consistent 1.5px stroke, always
  paired with the text label except in `svgOnly` buttons with `aria-label`. Icon color
  follows the text color of its pairing (gray-900/1000); ember icons only on brand/active
  states. No filled/duotone styles; outline only — one treatment everywhere.
- **Illustration & graphics**: geometric, grid-born compositions built from the system's
  own primitives (pixel-font glyphs, 1px `--ds-gray-400` grid lines, ember accents on
  ≤10% of the composition) — never stock illustration styles, never gradients-as-decor,
  never emoji. Empty states get one small composition max.
- **Logo & branding**: the Cadence wordmark set in Geist Sans 600 with tight tracking;
  the pixel "C" monogram (Geist Pixel Square) as the compact mark. Clear space = the
  monogram's own width; never recolor beyond gray-1000/ember; the retired Butterfly mark
  is not carried into v5.
- **Personality touches (Arc-inspired, deliberately subtle)**: one moment of delight per
  surface maximum — a pixel-face numeral, an ember glow on a completed run, a springy
  settle on a palette open. Personality never costs legibility, density, or calm; when in
  doubt, cut it.

## 9. Pattern extensions — AI + enterprise workflow

Geist documents primitives; Cadence is an agentic product OS and needs more. The
extension library lives at `design-reference/tempo-v5/patterns/` — one doc per reusable
pattern, each with: anatomy, variants, states, accessibility, responsive behavior,
interaction model, tokens used, implementation guidance, and usage examples.

**Extension protocol**: derive from the closest Geist primitives first; borrow judgment
from Linear/Stripe/Notion/Figma/Arc/Anthropic/Perplexity only where Geist is silent; mark
every doc `Extension` with its sources; an extension may compose core tokens/components
but never redefine them.

Covered pattern families (each its own doc): navigation shell & sidebar; forms &
validation; tables & data grids; dashboards & stat cards; search & filtering; dialogs,
drawers & sheets; notifications & inbox; command palette; property/inspector panels;
settings screens; onboarding & empty states; **AI interfaces** (chat/ask surfaces,
streaming output, agent activity & run timelines, approval/HITL gates, receipts & trust
evidence, model/tool pickers); **workflow & pipeline builders**.

## 10. What survives from the old contracts

These Cadence operating laws are **orthogonal to the visual system and remain in force**:

- **Humanized output** (`docs/conventions/humanized-output.md`): zero AI fingerprints in
  UI strings and generated output; no em/en dashes in UI copy; no AI-cliché phrasing.
- **Voice**: sharp-PM plain-words controls (Approve, Send back, Challenge) with the
  consequence stated in helper text; outcome-first naming; mechanism names stay off
  controls. Empty states are instructions, not apologies.
- **Engine-Room doctrine** (`docs/conventions/engine-room-doctrine.md`): calm front, deep
  engine; machinery behind one door; the surface-placement algorithm. **IA amendment
  (founder ruling 2026-07-11): the LIVE IA is canonical — the rail as `src/lib/nav-model.ts`
  ships it today (six destinations including Decide, plus the visible Engine Room and
  Trust Ledger rows per the 2026-07-04 ruling). Future IA changes amend this contract,
  not the other way around.**
- **Affordance ≠ emphasis** and one-primary-CTA-per-screen (now expressed through the
  button variants: default=primary, secondary, tertiary, error, warning).
- **Restraint budget, restated for v5**: ≥90% of any screen neutral; chromatic color only
  with meaning; at most one ember primary CTA per view; Geist Pixel at most once per
  screen; grayscale test before shipping.

Everything visual from v1–v4 that conflicts with the Geist-derived base is retired: the
parchment landing system, the Obsidian jet-black + glacier/ember role split, aurora
cards, shimmer, pencil annotations, Codystar numerals, mono-caps-with-middots metadata,
and the numeral-index navigation.

## 11. Enforcement

- **The skill**: `.claude/skills/cadence-tempo/` loads this contract + tokens + specs +
  patterns and MUST be invoked before any design/UI work. The old `cadence-design` skill
  is disconnected (deprecation stub).
- **The Tempo test** before shipping any surface: (1) both themes render from the same
  tokens; (2) every color traces to a `--ds-*` token in its correct role step; (3) type
  only via the class system, three faces in their lanes; (4) elevation only via material
  presets; (5) controls on the 32/36/40 grid; (6) the matching `research/` spec or
  `patterns/` doc was followed; (7) grayscale pass still reads; (8) focus ring intact;
  (9) `prefers-reduced-motion` respected; (10) humanized voice on every string;
  (11) at most one personality touch, and it costs nothing.
- Implementation order (the porting phase) is a separate plan; this file governs every
  pixel built from 2026-07-10 onward.
- **Automated guard**: `src/__tests__/design-tempo-font-guard.test.ts` fails the test
  suite if any retired font-family literal (§3) reappears anywhere in `src/`, including
  inside CSS custom-property values — the exact class of regression documented in §3's
  known footgun. Extend that test's banned-string list if a new face is ever retired.
