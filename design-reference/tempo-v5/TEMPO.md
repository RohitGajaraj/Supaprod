# Tempo — the Supaprod design system (portable distribution)

> Self-contained brief for ANY AI builder or human (Lovable, OpenAI Codex, Cursor, Claude
> Code, Gemini, a new hire). Paste this file into the tool's knowledge/rules, or point it
> here. It condenses the full contract (`/DESIGN-TEMPO.md`) and inlines the core tokens;
> the deep material (per-component specs, pattern library, full token CSS) lives beside
> this file. When in conflict, the root contract wins.

## Identity in one paragraph

Tempo is Supaprod's design system, v5 (adopted 2026-07-10). Its base derives from Vercel's
Geist design system — token architecture, color role model, typography system, materials,
component anatomy — with Supaprod's own identity on top: the **ember** orange brand scale
where Geist uses blue, Geist Pixel as the brand display face, a restrained
personality layer, and Supaprod-specific AI/enterprise patterns. Dark mode is the default
experience; light is a full first-class theme generated from the same token names.

## Files in this package

- `tokens/colors.css` — all color tokens, both themes (`:root` = dark,
  `[data-theme='light']` overrides)
- `tokens/typography.css` — font stacks + the complete type class system
- `tokens/materials.css` — radii, shadows, the 8 material presets, motion, control sizes,
  z-index
- `tokens/spacing.css` — the 4px space ramp and gap rhythm
- `tokens/fonts.css` — @font-face for self-hosted Geist Sans/Mono/Pixel (SIL OFL 1.1;
  woff2 files in the app repo at `/public/fonts/geist/`)
- `research/` — 75 re-implementation-grade component specs (anatomy, variants, states,
  API, best practices) — read the matching spec before building any component
- `patterns/` — 14 extension patterns: navigation shell, forms, tables, dashboards,
  search/filtering, dialogs/drawers, notifications, command palette, property panels,
  settings, onboarding/empty states, AI interfaces, workflow builder,
  iconography/illustration

## The ten laws

1. **Dark-first.** Dark is default; light ships equally, from the same token names. Never
   hardcode a theme-only color.
2. **Tokens only.** Every color/radius/shadow/easing traces to a token below or in
   `tokens/`. Never invent a hex.
3. **Color roles.** In every 10-step scale: 100-300 component backgrounds
   (default/hover/active), 400-600 borders (default/hover/active), 700-800 high-contrast
   fills, 900-1000 text/icons (secondary/primary). Gray carries the UI.
4. **Ember is the brand.** One ember primary CTA per view; ember on active/selected
   states, focus ring, brand moments. Blue = links/info only. Red = error, amber =
   warning, green = success. Status color on actual status, never decoration.
5. **Three typefaces, three jobs.** Geist Sans: every UI string. Geist Mono: technical
   content (ids, paths, code, timestamps, tabular numbers). Geist Pixel: brand moments
   only (heroes, launch/empty-state headlines, big numerals; max once per screen; never
   body copy or controls). No other fonts, ever.
6. **Type via classes.** `text-heading-72…14` (600 weight, tight tracking),
   `text-button-16/14/12`, `text-label-20…12` (+`-mono`), `text-copy-24…13` (+`-mono`).
   No ad-hoc font sizing.
7. **Materials, not hand-rolled chrome.** Elevation only via presets: on-page
   `material-base/small/medium/large`; floating `material-tooltip/menu/modal/fullscreen`.
   Radii: 6px everyday, 12px floating, 16px takeover. Never stack materials.
8. **The size grid.** Controls are 32/36/40px tall (medium 36 default). Spacing from the
   4px ramp; 24px gap rhythm; content max-width 1400px. Popovers: 6px pad, 36px rows.
9. **Motion is feedback.** One easing `cubic-bezier(.175,.885,.32,1.1)`; 200ms popovers,
   300ms overlays scaling from 0.96; respect `prefers-reduced-motion`; decoration never
   animates.
10. **Humanized voice.** Plain-words, outcome-first labels (Title Case verbs: "Deploy
    Project", never "Submit"/"OK"). No AI-cliché phrasing, no em/en dashes in UI strings,
    no emoji in chrome. Empty states are instructions with a next step, never apologies.

## Core tokens (dark / light)

Backgrounds: `--ds-background-100` #0a0a0a / #fff · `--ds-background-200` #000 / #fafafa

Gray: 100 #1a1a1a/#f2f2f2 · 200 #1f1f1f/#ebebeb · 300 #292929/#e6e6e6 · 400 #2e2e2e/#eaeaea ·
500 #454545/#c9c9c9 · 600 #878787/#a8a8a8 · 700 #8f8f8f/#8f8f8f · 800 #7d7d7d/#7d7d7d ·
900 #a0a0a0/#4d4d4d · 1000 #ededed/#171717

Ember (brand): 100 #331206/#fff1e9 · 200 #421808/#ffece2 · 300 #57200b/#ffe3d3 ·
400 #66260d/#ffd3bb · 500 #7f2f10/#ffb28a · **600 #ff6b2c/#ff8c52** · 700 #f05a1a/#f05a1a ·
800 #d94e12/#d1440e · 900 #ff8f5e/#a63508 · 1000 #ffefe6/#431704

Blue 600/700 (links/info): #0090ff / #0070f7 (dark uses 600, light uses 700 for text-on-white)
Red 600/800 (error): #f32e40 dark · #e70022 light high-contrast
Amber 600-800 (warning) · Green 600-900 (success) · Teal/Purple/Pink: data-viz only
(full scales in `tokens/colors.css`)

Focus ring: `0 0 0 2px var(--ds-background-100), 0 0 0 4px <ember>` — never removed.

Type quick reference: UI workhorse `text-label-14` (14/20 400); body `text-copy-14`
(14/20 400); secondary `text-copy-13` (13/18); headings 600 with negative tracking
(h1 page `text-heading-32`, section `text-heading-20`); buttons `text-button-14` (500).

## Component rules of thumb

- Buttons: variants default (primary, one per view) / secondary / tertiary / error /
  warning; sizes 32/36/40 (+tiny for icon-only); icon-only requires `aria-label`;
  destructive action pairs with a confirming toast; disabled pairs with an explaining
  tooltip; more than two sibling actions collapse into a Menu or Split Button.
- Inputs/selects/combobox share the same heights, border ladder (gray-400 → 500 hover →
  600/focus ring), and error presentation (red border + `text-copy-13` message below).
- Tables: `text-label-14` cells, mono for ids/hashes/times, status via 8px dot +
  mono-caps word, row hover gray-100, sticky header on `--ds-background-100`.
- Overlays: modal ≤ 560px for confirms; drawers for side context; one floating layer at
  a time; backdrop black at 0.8.
- Full anatomy per component: `research/<component>.md`. App-level composites (nav shell,
  settings, AI surfaces, workflow canvas…): `patterns/<pattern>.md`.

## Implementation notes (any stack)

- The tokens are plain CSS custom properties — framework-agnostic. On React, build on
  Radix primitives + shadcn/ui structure consuming `--ds-*` variables via Tailwind.
- Theme switch = toggle `data-theme="light"` on the root element (persist per user;
  default dark; honor OS preference on first run only if the product chooses to).
- Fonts: self-host the `geist` npm package woff2 files (SIL OFL 1.1 — include the
  license file). Never load fonts from Google Fonts or any CDN.
- Icons: lucide (outline only), 16px default / 20px headers, 1.5px stroke, colored like
  the adjacent text; ember only on brand/active states.
- Ship gate ("the Tempo test"): both themes render · every color is a correct-role token
  · type via classes only · materials only · 32/36/40 controls · matching spec/pattern
  followed · grayscale still reads · focus ring intact · reduced-motion respected ·
  humanized strings · at most one personality touch.

## Provenance & license

Base: Vercel's Geist design system (public documentation; token values are facts, and
our components are original re-implementations — Vercel's `@vercel/geistcn` library is
not publicly published). Fonts: Geist Sans/Mono/Pixel, SIL Open Font License 1.1, from
`vercel/geist-font`. Ember scale and all extension patterns: Supaprod originals.
Inspiration credits (judgment only): Linear, Stripe, Notion, Figma, Arc, Anthropic,
Perplexity.
