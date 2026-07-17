---
name: cadence-tempo
description: The Cadence v5 "Tempo" design system (adopted 2026-07-10; supersedes Loom/Obsidian/Ember). Invoke BEFORE any design, UI, UX, styling, component, landing-page, or visual work on any Cadence surface. Loads the contract, tokens, per-component specs, and pattern extensions.
---

# Cadence design — v5 "Tempo"

Cadence's design language is **v5 "Tempo"** (adopted 2026-07-10): the base derived
faithfully from Vercel's Geist design system — dark-first, gray-carried, materials-based —
with Cadence's own identity layered on top: the **ember** accent scale (`#FF6B2C` family)
in the brand role, Geist Pixel as the brand display face, our icon/illustration treatment,
and subtle personality touches (Arc-school, one per surface max). Enterprise-grade and
proven; we adopt and adapt, we do not invent.

## Read order (do this first)

1. [`/DESIGN-TEMPO.md`](../../../DESIGN-TEMPO.md) — THE contract. Its 11 sections are
   mandatory law. When anything else disagrees, the contract wins.
2. [`/design-reference/tempo-v5/tokens/`](../../../design-reference/tempo-v5/tokens/) —
   `colors.css` (both themes + ember), `typography.css` (class system), `materials.css`
   (radii/shadows/presets/motion/sizes), `spacing.css`, `fonts.css`. **Copy tokens
   verbatim. Never invent a hex, radius, shadow, or easing.**
3. [`/design-reference/tempo-v5/research/<component>.md`](../../../design-reference/tempo-v5/research/) —
   before building or restyling ANY component, read its spec: exact anatomy, variants,
   sizes, states, API shape, best practices. `_foundations.md` for the system model;
   `_public-sources.md` for what is liftable vs re-implemented.
4. [`/design-reference/tempo-v5/patterns/`](../../../design-reference/tempo-v5/patterns/) —
   the extension library for everything beyond the Geist catalog (navigation shell,
   forms, tables, dashboards, search/filters, dialogs/drawers, notifications, command
   palette, property panels, settings, onboarding/empty states, AI interfaces, workflow
   builders). Follow the matching pattern doc; if none exists, write one per the
   extension protocol (contract §9) in the same session.
5. **Public landing / any public page:** read FIRST the applied record
   [`/design-reference/tempo-v5/applied/2026-07-15-landing-v2-ink-and-starfield.md`](../../../design-reference/tempo-v5/applied/2026-07-15-landing-v2-ink-and-starfield.md)
   (ink/starfield theme, three-voice color grammar, Pixel rulings, founder vocabulary bans,
   taste profile + session chronology) and its companion reference study
   [`/design-reference/tempo-v5/research/vercel-composition-playbook.md`](../../../design-reference/tempo-v5/research/vercel-composition-playbook.md)
   (the Vercel anatomy, extraction rules, and the waiting list of blocked patterns with
   unlock conditions). Never restyle a public page without them.


## Hard laws (enforce in every output)

- **Dark-first.** `:root` is dark; light is `[data-theme='light']` from the same token
  names. Every surface must render in both; never a theme-only hex.
- **Color roles.** Steps 100-300 component backgrounds (default/hover/active), 400-600
  borders, 700-800 high-contrast fills, 900-1000 text/icons. Gray carries the UI. Ember =
  brand/CTA/selection/focus (one primary CTA per view). Blue = links/info. Red/amber/green
  = error/warning/success. Status color on status only.
- **Three faces, three jobs.** Geist Sans = all UI text. Geist Mono = technical content
  (ids, paths, code, timestamps, tabular numbers). Geist Pixel = brand moments ONLY
  (heroes, launches, empty-state headlines, AI moments; max once per screen) — never body
  copy, never dense UI. Newsreader/Schibsted/JetBrains Mono/Codystar/Caveat are retired;
  Inter/Roboto stay banned. Type only via the `text-heading/button/label/copy-*` classes.
- **Materials, not hand-rolled chrome.** Elevation via the 8 presets (base/small/medium/
  large; tooltip/menu/modal/fullscreen). 6px everyday radius, 12px floating, 16px
  takeover. Never stack materials; lowest elevation that reads.
- **Controls snap to 32/36/40px.** Medium (36) is default. Popovers: 6px pad, 36px rows.
  Spacing from the 4px `--geist-space` ramp; 24px gap rhythm.
- **Motion**: swift easing `cubic-bezier(.175,.885,.32,1.1)`; 200ms popovers, 300ms
  overlays (scale from .96); gate on `prefers-reduced-motion`; springy settle allowed,
  bounce never.
- **Identity layer** (contract §8): lucide outline icons 16px/1.5px stroke, one
  treatment; geometric grid-born illustrations only; the pixel "C" monogram + Geist Sans
  wordmark; at most ONE personality touch per surface and it never costs legibility.
- **Component contracts** from the specs: destructive Button pairs with confirming Toast;
  disabled pairs with explaining Tooltip; >2 sibling actions become Menu/Split Button;
  icon-only requires `aria-label`; focus ring never removed.
- **Voice + humanized output remain law**: plain-words outcome-first controls, no
  AI-cliché phrasing, no em/en dashes in UI strings, empty states are instructions.
- **The Tempo test** (contract §11) is the shipping gate: both themes, token-traced
  colors, class-system type, preset materials, 32/36/40 controls, spec/pattern followed,
  grayscale pass, focus ring, reduced-motion, humanized voice, ≤1 personality touch.

## Scope

ALL Cadence surfaces: the authenticated app AND the public landing/marketing pages — one
system, both themes. Implementation stack: Radix primitive where one exists + shadcn/ui
structure + Tailwind v4 consuming `--ds-*` tokens; shared primitives in
`src/components/ui/`. Fonts are self-hosted at `/public/fonts/geist/` (SIL OFL) — never
add Google Fonts links. For throwaway mocks, copy the tokens into the HTML file.
