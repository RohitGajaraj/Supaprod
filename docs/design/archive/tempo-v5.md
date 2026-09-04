# DESIGN-TEMPO.md — the v5 "Tempo" design contract

> _Created: 2026-07-11 · Last updated: 2026-08-03_

> _Adopted 2026-07-10 (founder ruling). **Tempo is THE standing design system for every
> Supaprod surface — the authenticated app AND the public landing/marketing pages.** It
> supersedes Loom v4 (`docs/design/archive/loom-v4.md`), Obsidian v3 (`docs/design/archive/obsidian-v3.md`), and the Ember
> Editorial landing system (`docs/design/archive/ember-editorial-landing.md`); those files are retired history. When any other
> file disagrees with this one on look, feel, tokens, type, or component anatomy, this
> contract wins. Lineage: v1 tokens · v2 Ember Editorial · v3 Obsidian · v4 Loom ·
> **v5 Tempo**. Applied records (how surfaces implement this contract, with founder
> rulings): the app port `design-reference/tempo-v5/applied/2026-07-13-app-port-and-design-rulings.md`;
> the public landing + all public pages `design-reference/tempo-v5/applied/2026-07-15-landing-v2-ink-and-starfield.md`
> with its companion reference study `design-reference/tempo-v5/research/vercel-composition-playbook.md`
> (2026-07-15, read both before touching any public surface; the two cross-reference each other)._

## 0. What Tempo is

**Tempo derives its base from Vercel's Geist design system** (vercel.com/geist) —
structure, token architecture, typography model, materials, component anatomy, and
documentation quality mirrored deliberately: we are adopting an enterprise-grade, proven
system, not inventing one. On that base, Tempo layers **Supaprod's own identity** so the
result is recognizably ours:

1. **The ember brand color** (`#FF6B2C` family) as a full 10-step scale in the role
   Geist's blue plays for brand/interactive accents.
2. **Our own identity layer** (§8): icon treatment, illustration language, logo usage,
   Geist Pixel as the brand display face, and sanctioned personality touches.
3. **Supaprod-specific pattern extensions** (§9): AI/agent interfaces and enterprise
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

| Steps | Role |
| --- | --- |
| 100–300 | Component backgrounds: default / hover / active |
| 400–600 | Borders: default / hover / active |
| 700–800 | High-contrast backgrounds (solid fills) |
| 900–1000 | Text and icons: secondary / primary (accessible) |

- **Gray carries the interface.** A screen is neutral by default; chromatic color appears
  only with meaning.
- **Ember = the brand.** Primary CTAs, active/selected states, brand moments.
  One primary CTA per view. Ember takes every place Geist's own docs use blue _as brand_.
  Focus ring uses ember (`--ds-focus-color`), see §2 focus ring rule below.
- **Ember-on-forms ruling (founder-delegated decision, 2026-07-11):** ordinary form
  actions (Save, Apply, Update, submit rows) use the neutral `default` button variant —
  the high-contrast invert fill (gray-1000 on background), the Geist/Linear premium
  read. Ember fills are reserved for the view's ONE true primary CTA (Deploy, Upgrade,
  Start teardown, hero actions) and brand moments. A settings page full of ember Saves
  fails the restraint budget by definition.
- **Blue = informational** (links, info notes). **Red = danger/error. Amber = warning. Ember = focus ring.
  Green = success. Teal/Purple/Pink = data-viz and Geist-specified component states
  only.** Status color goes on actual status, never decoration.
- Use `--ds-gray-alpha-*` when layering over unknown backgrounds.
- Focus ring: `--ds-focus-ring-outline` (2px offset outline in `--ds-focus-color`, ember). Never remove focus visibility. Dark theme: `oklch(60% 0.18 50)` / Light theme: `oklch(65% 0.18 50)`.
  Never remove focus visibility. Dark theme: `oklch(60% 0.18 50)` / Light theme: `oklch(65% 0.18 50)`.

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

**Rich-blue recalibration + violet retirement (founder ruling, 2026-07-11
late — refines the ruling above; the narrowing WHERE blue may appear stands,
this changes WHAT the blue is):**

- **The blue values.** The first glacier pass anchored the scale on the
  platform's `#84b3ec`, which read CHALKY on black (low chroma at high
  lightness), and the founder's correction was explicit: a flagged color is a
  brief to redesign, never to flatten to gray. The `--ds-blue-*` scale keeps
  hue ~215 with more chroma at slightly deeper lightness: dark 600 `#5c9bf0`
  (~6.9:1 on `--ds-background-100`), 900 `#9dc4fa`, 1000 `#e0eefe`; light 600
  `#2e6ed6` (AA on white). Canonical values in `tokens/colors.css` + the
  matching `src/styles.css` blocks. Stock Geist `#0090ff` stays retired.
- **Violet is retired from every machine/AI treatment.** `--agent`, the
  shimmer + thread gradients, and the `--violet-shimmer` alias all resolve
  inside the blue family now. Purple remains ONLY categorical (data-viz
  series, graph node kinds). Agent identity ramps must not sit in the
  violet/magenta band.
- **The two-voice grammar.** Ember = the human's move (gates, approvals,
  the one primary CTA). Rich blue = the machine at work (the `.agent-live` /
  `.ai-working-word` shimmer, running badges, `--thread-gradient`). The demo
  sentence: "orange is my move, blue is theirs."
- **The AI-presence signature.** The flowing light-sweep (`--shimmer-gradient`,
  a blue-family gradient; `agent-shimmer` keyframes) is THE marker for
  machine-working moments, at most one per screen, always reduced-motion
  gated. `.ai-working-word` pairs it with the Pixel face for hero AI moments;
  `ShimmerText` (src/components/supaprod/ShimmerText.tsx) is the shared
  component consumers use — never re-roll a private shimmer.
- **Theme trio.** `light`, `dark`, and `system` (live `prefers-color-scheme`
  tracking) via `useTheme()` in `src/hooks/use-theme.tsx`. Dark stays the
  default; both themes resolve from the same token names.

## 2.1 Color semantics audit (2026-07-17)

Exhaustive audit of all `var(--glacier)` / `var(--machine)` / `var(--blossom)` usage across 54 call sites in the authenticated app (Waves 1-2). Findings:

**All 54 uses are LEGITIMATE by the §2 narrowing rules:**
- Hyperlinks (navigation): `MissionSlideOver`, `ask-blocks`, `engine-room/RoomDetail`, `brain.tsx` ("Go to Memory"), `ReceiptDetailSheet` (PR link, deploy URL) — link color is explicitly permitted.
- Live/running status: `brain.tsx` (live sync dot + live count text), `missions/MissionOrchestratorDetail` (`live ? glacier : moss`), `cockpit/LoopHealthBanner` ("Loop working"), `studio/PreviewPanel` (live chip + dot) — literal running-state indicator.
- Active state chips: `plan/GoalsPanel` + `LoopsPanel` (`active: glacier` goal/loop status), `governance/PromptsPanel` ("testing" prompt status, "draft" version status) — literal item status.
- Machine-working state: `obsidian/AskPanel` (dictation listening border/bg/icon), `FocusDock` (closing phase dot) — active machine/input state per the two-voice grammar.
- DRAFTING status chip: `obsidian/verdict.tsx`, `plan/SpecDetail`, `plan/format.ts` — DRAFTING = machine is working, not decorative.
- Speaker categorical: `audio/AudioTranscriptPanel` (Speaker A dot) — treated as a data-viz categorical series (chart-exempt per §2).

**No violations found.** The narrowing ruling has been honored. Every remaining use of glacier outside this list was already neutralized in the 2026-07-11 narrowing pass (confirmed by grep: no glacier on icon fills, decorative borders, glows, or card background washes in any live-rendered component).

**Ember discipline:** All accent (ember) buttons are ONE-per-view. CTA grammar upheld. No decorative ember found outside brand/active/selected states.

## 3. Typography law — three faces, three jobs

**Verified against vercel.com/font (2026-07-11):** Vercel built Geist for developers and
designers on three Swiss-design principles — simplicity, minimalism, speed — with
"precision, clarity, and functionality." Mono shipped first for code-environment
readability; Sans followed for general typographic needs; Pixel followed for display
variation. Vercel states no rigid hierarchy beyond "the right face for the context" —
which is exactly the three-lane split below. No deviation needed; our lane assignment
already matches Vercel's own usage intent one-to-one.

Self-hosted (no Google Fonts, no CDN): `/public/fonts/geist/` + `design-reference/tempo-v5/tokens/fonts.css`.
Exact `@font-face` names in use, all self-hosted variable fonts (weight axis 100-900
except Pixel, which is a fixed-weight 400 display face): `"Geist"`, `"Geist Mono"`,
`"Geist Pixel Square"` / `Circle` / `Grid` / `Line` / `Triangle`.

1. **Geist Sans** (`--font-sans`) — every interface string. The only UI face. 9 weights
   (100–900) available; UI typically uses 400/500/600.
2. **Geist Mono** (`--font-mono`) — technical content: ids, slugs, paths, code, hashes,
   timestamps, tabular numbers, keyboard shortcuts. 7 weights (100–700) available.
3. **Geist Pixel** (`--font-pixel`; Square is the default face, Circle/Grid/Line/Triangle
   are sanctioned alternates) — **brand moments only**: heroes, launch screens, feature
   announcements, empty-state headlines, AI-moment flourishes, big numerals. Never
   long-form text, never dense UI, never body copy, never controls. Fixed-weight 400 only.

Type is consumed through the class system (`design-reference/tempo-v5/tokens/typography.css`), never ad-hoc:
`text-heading-72…14` (600 weight, tight tracking) for page/section titles;
`text-button-16/14/12` inside button-rendering components only; `text-label-20…12` for single
lines (14 is the UI workhorse; mono variants pair one size down, e.g. `text-label-14-mono`); 
`text-copy-24…13` for multi-line text (14 most common, 13 where space is premium; mono variants available). 
`<strong>` nested inside gives Strong (labels/copy) or Subtle (headings). Tabular numerals for changing numbers.

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
(`design-reference/tempo-v5/tokens/materials.css`), which encode elevation role:

**On-page surfaces** (3-tier):
- `material-base` — minimal elevation (6px radius, hairline border, minimal shadow).
- `material-small` — subtle raise (6px radius, border, small shadow).
- `material-medium` — card elevation (12px radius, border, medium shadow).
- `material-large` — prominent surfaces (12px radius, border, large shadow).

**Floating surfaces** (above the page):
- `material-tooltip` (6px radius, lightest, the only stemmed element).
- `material-menu` (12px radius, elevated shadow).
- `material-modal` (12px radius, strong shadow, dark backdrop).
- `material-fullscreen` (16px radius, takeover shadow, dark backdrop).

Pick the lowest elevation that reads; never stack two materials on one element; never
hand-roll a border+shadow+radius combo. Z-index comes from `--ds-z-*` bands (drawer: 200,
modal: 300, menu: 2001, toast: 5000, tooltip: 99999) and must agree with the material role.

## 5. Layout, spacing, controls

- 4px base unit; the `--geist-space-*` ramp and gap rhythm (`24px` gap, `12px` half,
  `8px` quarter, `32px` section) govern all layout spacing.
- Every control (button, input, select, combobox trigger…) snaps to the three heights:
  **32 / 36 / 40px** (`--ds-size-small/medium/large`); medium is the default.
- Page content max-width `--ds-page-width` (1400px).
- Popovers share one anatomy: 6px padding, 36px rows, 6px row radius.

## 6. Motion law

- One easing family: `--ds-motion-timing-swift` `cubic-bezier(0.175, 0.885, 0.32, 1.1)`.
  This Swift curve has a subtle overshoot (~1.1 tail) for springy, confident motion without
  being bouncy.
- Overlay/modal animations: scale from 0.96, 300ms via `--ds-motion-overlay-duration`.
- Popover animations: 200ms via `--ds-motion-popover-duration`.
- Micro-interactions (hover states, focus rings): ≤ 150ms.
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
4. **Button variants (unified Tempo grammar, per `src/components/ui/button.tsx`):**
   - `accent` — the ONE primary "needs-human" CTA per view (solid ember).
   - `default` — ordinary confirmations, neutral high-contrast invert (gray-1000 on bg).
   - `secondary` — raised surface with visible border (gray-200).
   - `tertiary` / `ghost` — transparent, low-emphasis (aliases; neutral interactive).
   - `outline` — bordered variant with hover tint.
   - `link` — inline text navigation (blue, underlined on hover).
   - `destructive` — risk action (red fill).
   - `warning` — caution action (amber fill).
5. For anything Geist does not cover, use the matching `patterns/` extension doc (§9);
   if none exists yet, write it in the same session following the extension protocol.

## 8. Identity layer — recognizably Supaprod

The base is Geist; these are the elements that make Tempo ours. Tweaks sit ON TOP of the
derived base and never contradict §§1–7.

- **Brand color**: ember (`--ds-ember-*`). The single chromatic voice of the brand.
- **Brand display face**: Geist Pixel (Square) under the §3 brand-moment rules — this
  face IS the visual signature of Supaprod surfaces.
- **Icons**: lucide, 16px default (20px in headers), consistent 1.5px stroke, always
  paired with the text label except in `svgOnly` buttons with `aria-label`. Icon color
  follows the text color of its pairing (gray-900/1000); ember icons only on brand/active
  states. No filled/duotone styles; outline only — one treatment everywhere.
- **Illustration & graphics**: geometric, grid-born compositions built from the system's
  own primitives (pixel-font glyphs, 1px `--ds-gray-400` grid lines, ember accents on
  ≤10% of the composition) — never stock illustration styles, never gradients-as-decor,
  never emoji. Empty states get one small composition max.
- **Logo & branding**: the Supaprod wordmark set in Geist Sans 600 with tight tracking;
  the pixel "C" monogram (Geist Pixel Square) as the compact mark. Clear space = the
  monogram's own width; never recolor beyond gray-1000/ember; the retired Butterfly mark
  is not carried into v5.
- **Personality touches (Arc-inspired, deliberately subtle)**: one moment of delight per
  surface maximum — a pixel-face numeral, an ember glow on a completed run, a springy
  settle on a palette open. Personality never costs legibility, density, or calm; when in
  doubt, cut it.

## 9. Pattern extensions — AI + enterprise workflow

Geist documents primitives; Supaprod is an agentic product OS and needs more. The
extension library lives at `design-reference/tempo-v5/patterns/` — one doc per reusable
pattern, each with: anatomy, variants, states, accessibility, responsive behavior,
interaction model, tokens used, implementation guidance, and usage examples.

**Extension protocol**: derive from the closest Geist primitives first; borrow judgment
from Linear/Stripe/Notion/Figma/Arc/Anthropic/Perplexity only where Geist is silent; mark
every doc `Extension` with its sources; an extension may compose core tokens/components
but never redefine them.

**Covered pattern families** (each its own doc in `design-reference/tempo-v5/patterns/`):
- Structural: navigation shell & sidebar, property/inspector panels, settings screens.
- Data: forms & validation, tables & data grids, dashboards & stat cards, search & filtering.
- Interaction: dialogs/drawers/sheets, notifications/inbox, command palette, onboarding & empty states.
- **AI/Enterprise**: chat/ask surfaces, streaming output, agent activity & run timelines,
  approval/HITL gates, receipts & trust evidence, model/tool pickers, workflow & pipeline builders.

**Named extensions shipped for the v5 app port:**
- **Audit trace-tag** (founder ruling 2026-07-13: "everything should have a traceable audit id
  generated out of this platform") — the clickable `PREFIX·XXXXXX` id chip that opens an entity's
  verifiable lineage. Documented at [`design-reference/tempo-v5/patterns/audit-trace-tag.md`](../../../design-reference/tempo-v5/patterns/audit-trace-tag.md);
  feature: [`features/audit-id-lineage.md`](../../features/audit-id-lineage.md).
- **Empty-state pattern** — canonical `EmptyState` component; one small composition max per screen.
- **Loading skeleton pattern** — minimal visual feedback, no noise.
- **Error states** — 3-tier (inline validation, recovery path, fatal/full-page).

The full reasoning behind every design ruling applied when porting the authenticated app to
Tempo — the lifecycle IA ("The Supaprod Loop"), the **ember = needs-human / blue = machine**
color grammar (with purple/indigo retired from all machine treatments), glass chrome, Geist Pixel usage,
monotone source logos, agent liquid-glass gems, and the TopBar/PageHeader chrome — is recorded in
[`design-reference/tempo-v5/applied/2026-07-13-app-port-and-design-rulings.md`](../../../design-reference/tempo-v5/applied/2026-07-13-app-port-and-design-rulings.md).

## 10. Responsive behavior — breakpoints and adaptation

Supaprod is a desktop-first product (the primary user is a PM planning on a multi-monitor
desk), but all surfaces must be responsive and touch-friendly. Breakpoints (via Tailwind):

| Breakpoint | Width | Adaptation |
| --- | --- | --- |
| **Default** | ≥1280 | Full layout: rail sidebar + content + optional right panel. |
| `lg` | ≥1024 | Rail stays fixed; content adjusts; side panels may collapse. |
| `md` | ≥768 | Rail collapses to icon-only; TopBar may truncate breadcrumbs. |
| `sm` | ≥640 | Navigation moves to bottom nav (mobile-style); sidebar hidden. |
| `xs` | ≥320 | Single-column, full-width content; all chrome min-viable. |

**Mobile touch targets** (all platforms ≤768px):
- Control hit target floor: **44px** (WCAG touch recommendation). The 32/36/40px grid
  applies to desktop; mobile controls may padding-wrap to 44px minimum.
- Tap spacing: at least 8px between interactive elements to prevent mis-taps.

**Rail behavior**:
- Desktop (≥768px): **Fixed left sidebar, 256px wide**, showing icon + label.
- Tablet (640–767px): **Collapses to icon-only, 64px wide**; labels appear on hover.
- Mobile (<640px): **Slides into bottom nav (5 visible + overflow menu)**; sidebar hidden.

**TopBar behavior**:
- Desktop: Full breadcrumb + theme toggle + Ask + weather + ticker.
- Tablet (≥768px): Breadcrumb may truncate; secondary items optionally hidden.
- Mobile (<768px): Breadcrumb single-line (ellipsis truncation); Ask button pinned; weather hidden.

**Layout width**:
- `--ds-page-width: 1400px` — content container max-width (desktop standard).
- `--ds-page-width-with-margin: calc(1400px + 48px)` — with 24px margins each side.
- Mobile: full bleed on small screens; 16px–24px margin floor.

**Responsive utilities** (Tailwind): use standard breakpoints (`sm`, `md`, `lg`, `xl`, `2xl`)
for conditional layout. E.g. `hidden md:block` = hide on mobile, show at tablet+. Never
hardcode `@media` queries; use Tailwind responsive prefixes.

## 11. What survives from the old contracts

These Supaprod operating laws are **orthogonal to the visual system and remain in force**:

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

## 11a. Typography implementation status (Geist Pixel per-surface, 2026-07-17)

Geist Pixel is THE brand display face — one moment per surface max. Wave 1-2 audit results:

| Surface | Pixel moment | Component |
| --- | --- | --- |
| Today | ✓ Hero headline, autonomy counter, PixelStat counts | `TodayHeroCard`, `ColdStartOnramp`, `AutonomyCard`, `PixelStat` |
| Discover | ✓ Page header h1 (via `PageHeader`) + confidence annotation | `PageHeader`, `OpportunityRow`, `DiscoverSurface` |
| Plan | ✓ Page header h1 (via `PageHeader`) | `PageHeader` |
| Brain/Memory | ✓ Page header h1 + BrainStatTrio counts | `PageHeader`, `BrainStatTrio` |
| Engine Room | ✓ Page header h1 + throughput PixelStat | `PageHeader`, `EngineRoomSurface` (PixelStat) |
| Settings | ✓ Settings h1 | `_authenticated.settings.tsx` (h1 at var(--font-pixel)) |
| Build | ✓ Page header h1 + mission step counter | `PageHeader`, `_authenticated.build.index.tsx` |
| Ship | ✓ Page header h1 | `PageHeader` |
| Learn | ✓ Page header h1 | `PageHeader` |
| Design | ✓ Page header h1 | `PageHeader` |
| Onboarding | ✓ Welcome headline + step headline | `ObsidianOnboarding` |
| Cockpit/Observe | Redirects to Engine Room (covered above) | n/a |
| Empty states | ✓ All canonical `EmptyState` headlines | `EmptyState` component |
| Auth scaffold | ✓ Sign-in headline | `AuthScaffold` |

**Status: all 14 surfaces have exactly one Geist Pixel moment.** The `PageHeader` component (used by 8+ surfaces) is the primary delivery vehicle — its `<h1>` renders in `var(--font-pixel)` at `clamp(21px, 2.5vw, 29px)`, which satisfies the brand-moment rule for every surface that uses it.

**Enforcement note:** `PageHeader` itself notes "No serif, no italic, no Pixel face here" for the header-as-chrome argument — this was OVERRIDDEN by an explicit decision to use Pixel for the h1 as the surface's one brand moment (see `design-reference/tempo-v5/applied/2026-07-13-app-port-and-design-rulings.md`). The comment in PageHeader.tsx predates this ruling and should be read as "Pixel is not used for subtitle/eyebrow/USP" rather than "Pixel is not used at all".

## 12. Enforcement

- **The skill**: `.claude/skills/supaprod-tempo/` loads this contract + tokens + specs +
  patterns and MUST be invoked before any design/UI work. The old `supaprod-design` skill
  is disconnected (deprecation stub).
- **The Tempo test** before shipping any surface: (1) both themes render from the same
  tokens; (2) every color traces to a `--ds-*` token in its correct role step; (3) type
  only via the class system, three faces in their lanes; (4) elevation only via material
  presets; (5) controls on the 32/36/40 grid; (6) the matching `research/` spec or
  `patterns/` doc was followed; (7) grayscale pass still reads; (8) focus ring intact
  (`--ds-focus-ring-outline`, glacier blue, 2px offset); (9) `prefers-reduced-motion`
  respected; (10) humanized voice on every string; (11) at most one personality touch,
  and it costs nothing; (12) responsive breakpoints tested at 320/640/768/1024/1280px.
- Implementation order (the porting phase) is a separate plan; this file governs every
  pixel built from 2026-07-10 onward.
- **Automated guard**: `src/__tests__/design-tempo-font-guard.test.ts` fails the test
  suite if any retired font-family literal (§3) reappears anywhere in `src/`, including
  inside CSS custom-property values — the exact class of regression documented in §3's
  known footgun. Extend that test's banned-string list if a new face is ever retired.
- **Code references**: `design-reference/tempo-v5/tokens/` (canonical values, never invent);
  `design-reference/tempo-v5/research/` (Geist component specs); `design-reference/tempo-v5/patterns/`
  (extension docs); `design-reference/tempo-v5/applied/` (session decisions and reasoning).

**Wave 1-2 audit results (2026-07-17) — enforcement checklist additions:**
- (13) **Pixel presence verified:** every authenticated surface must have exactly one Geist Pixel moment. Use `PageHeader` as the vehicle wherever the page title qualifies; use `PixelStat` for the one headline metric. Never add a second Pixel element.
- (14) **Glacier audit:** before adding any `var(--glacier)` / `var(--machine)` / `var(--blossom)` use, it must be one of: (a) a hyperlink, (b) a literal live/running/streaming status indicator, (c) an active machine-working state (dictation, streaming), or (d) a status chip/badge with a named state. All other uses must use gray or ember.
- (15) **Icon stroke at size:** standard icons (16px and above): `strokeWidth={1.5}`. Compact icons under 16px may use up to 1.9 for legibility. Never use 2.0+ outside the checkbox/radio checkmark.
- (16) **Unlabeled inputs:** every `<input>` and `<textarea>` must have either (a) an associated `<label htmlFor>`, or (b) an `aria-label` attribute. Placeholder text alone does not satisfy this rule.
- (17) **Focus ring on `.lift` buttons:** the `.lift` CSS class now includes `focus-visible:outline` (added 2026-07-17). Any other bespoke button class added in the future must include `focus-visible` styles explicitly.
- (18) **Skeleton aria-hidden:** loading skeleton elements should carry `aria-hidden="true"` so AT does not read them as content. The canonical `Skeleton` component was updated 2026-07-17.
- (19) **Reduced motion:** the global CSS gate in `src/styles.css` (`@media (prefers-reduced-motion: reduce)`) kills all animations platform-wide — this is the single source of truth. Component-level `motion-reduce:` Tailwind classes add finer control where needed.
