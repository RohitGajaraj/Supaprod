# Handoff: Supaprod App · Obsidian shell

## Overview

Supaprod is the operating system for product judgment: governed agents run the
product loop (sense, decide, define, build, ship, learn) and the human makes
only the calls that matter. This package covers the complete authenticated
app prototype in the v3 "Obsidian" design language: a 236px rail, six
surfaces (Today, Discover, Plan, Build, Brain, Engine Room), a mission
slide-over, a command palette stub, toasts, and keyboard navigation.

## About the design files

The HTML files here are **design references** — working prototypes that show
intended look and behavior, NOT production code to copy directly. Recreate
them in the target codebase using its existing patterns. The repo already
uses React + TanStack Router + Tailwind v4 with a legacy parchment theme;
`REPO-LINKING.md` in this folder explains how to adopt the new contract and
supersede the old one. If building fresh, React + Tailwind with the tokens as
CSS custom properties is the recommended match.

## Read order

1. `docs/design/archive/obsidian-v3.md` — THE design contract. Its 9 standing instructions
   are mandatory. When any other file disagrees with it, the contract wins.
2. `design-reference/cadence-app.html` — the full six-surface prototype
   (self-contained; open in a browser). This is the primary spec.
3. `design-reference/obsidian-specimen.html` — the founder-approved visual
   specimen the contract was distilled from (self-contained).
4. `design-reference/ui-kit-shell.html` — tokenized shell distillation
   (references `../tokens/`; open from this folder).
5. `tokens/` + `styles.css` — copy these custom properties verbatim.
6. `components.md` — component inventory with anatomies and states.
7. `implementation-notes.md` — behavior, interactions, data model, a11y.
8. `assets/` — the Butterfly mark SVGs (three status states). Never redraw.
9. `REPO-LINKING.md` — how to commit the contract into the repo.

## The three laws (from the contract)

1. **One object, one anatomy.** Signal, Opportunity, Spec, Mission, Call,
   Outcome, Learning: one card, one detail view, one status language.
2. **One queue for attention.** Every gate is a Call in one queue with one
   badge. Ember #FF6B2C is reserved exclusively for needs-a-human.
3. **Depth on demand.** Quiet list → slide-over → full view; layer one never
   shows more than one decision's worth of information.

## Hard rules (enforce in code review / CI)

- Colors only from `tokens/colors.css`. Never invent a hex.
- Ember never decorates; one ember CTA per screen.
- Plain-words buttons (Approve, Send back, Challenge); consequence in helper
  text; mechanism names banned on controls.
- Humanized-output law: no em/en dashes (use the middot), no AI-cliche words,
  no exclamation marks, no emoji — in UI strings AND agent output.
- Restraint budget per screen: ≥90% neutral, ≤1 aurora card, ≤1 shimmer,
  ≤2 pencil annotations. Grayscale test before merging.
- Fonts: Newsreader, Schibsted Grotesk, JetBrains Mono, Codystar (aurora
  numerals only), Caveat (pencil only). Never Inter/Roboto/Fraunces.
- All motion gates on `prefers-reduced-motion`.
