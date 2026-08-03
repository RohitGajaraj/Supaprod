# Tempo v5 — Supaprod design system reference package

> _Created 2026-07-10. The v5 "Tempo" system: the base derived faithfully from Vercel's
> Geist design system (vercel.com/geist), with Supaprod's own identity on top — the
> **ember** accent scale (`#FF6B2C` family) in the brand/interactive role their blue
> plays, our icon/illustration/logo treatment, and Supaprod-specific pattern extensions.
> Dark-first; light is a secondary theme generated from the same token names._

**The contract lives at [`/DESIGN-TEMPO.md`](../../docs/design/archive/tempo-v5.md).** This folder is the
evidence and tooling under it. When look/feel/IA disagreement arises anywhere, the contract wins.

## Contents

| Path                    | What it is                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TEMPO.md`              | **The portable distribution** — one self-contained, tool-agnostic brief (laws + core tokens + rules of thumb) for any AI builder or human: Lovable knowledge, Codex/Cursor rules, onboarding.                                                                                                                                                                                                            |
| `tokens/colors.css`     | Both themes, all 10 scales + gray-alpha + backgrounds + ember + focus ring. Values extracted from the live Geist site; never invent a hex.                                                                                                                                                                                                                                                               |
| `tokens/typography.css` | Geist Sans/Mono/Pixel stacks + the full type class system (`text-heading-72`…`text-copy-13-mono`, Strong/Subtle modifiers).                                                                                                                                                                                                                                                                              |
| `tokens/materials.css`  | Radii, shadow set, the 8 material presets (base→fullscreen), motion timing, control sizes (32/36/40), popover anatomy, z-index, page width.                                                                                                                                                                                                                                                              |
| `tokens/spacing.css`    | The 4px-base space ramp and gap rhythm.                                                                                                                                                                                                                                                                                                                                                                  |
| `tokens/fonts.css`      | `@font-face` for self-hosted Geist Sans/Mono variable + 5 Pixel faces (files in `/public/fonts/geist/`, SIL OFL 1.1).                                                                                                                                                                                                                                                                                    |
| `research/`             | Re-implementation-grade specs of every documented Geist component (one file per component; index in its `README.md`), plus `_foundations.md`, `_public-sources.md` (what is publicly liftable vs re-implemented), and **`vercel-composition-playbook.md`** (the 2026-07-15 Vercel homepage reference study: anatomy, extraction rules, and the waiting list of blocked patterns with unlock conditions). |
| `applied/`              | How real surfaces implement the contract, with founder rulings. **`2026-07-15-landing-v2-ink-and-starfield.md` is the canonical record for the public landing + every public page** (theme, color codes, three-voice grammar, taste profile, session chronology, in-product porting guide); `2026-07-13-app-port-and-design-rulings.md` covers the app port.                                             |
| `patterns/`             | The extension library (contract §9): AI-interface and enterprise workflow patterns beyond the Geist catalog, each marked Extension with its sources (Linear/Stripe/Notion/Figma/Arc/Anthropic/Perplexity — inspiration only, never a second base). Includes `audit-trace-tag.md` (the clickable id chip).                                                                                                |
| `applied/`              | Dated build records: the "why + what" behind the design rulings applied to real surfaces. `2026-07-13-app-port-and-design-rulings.md` captures the full authenticated-app port (IA, ember=needs-human/blue=machine grammar, glass chrome, Pixel usage, monotone source logos, agent gems, TopBar/PageHeader chrome, audit trace-tag).                                                                    |

## Provenance & licensing

- **Fonts**: official `geist` npm package (github.com/vercel/geist-font), SIL Open Font
  License 1.1 — self-hosting permitted; license ships next to the files.
- **Token values, component anatomy, guidelines**: factual parameters observed in Vercel's
  public documentation. The `@vercel/geist` component library itself is **not** publicly
  published; every component is re-implemented by us on React 19 + Tailwind v4 + Radix.
- **Ember scale**: ours, constructed in Geist's 10-step scale structure.

## Relationship to previous systems

Supersedes **Loom v4**, **Obsidian v3**, and the **Ember Editorial** landing system as the
standing design instruction (founder ruling 2026-07-10). The old packages remain in
`design-reference/obsidian-v3/` and the retired root contracts for history only.
