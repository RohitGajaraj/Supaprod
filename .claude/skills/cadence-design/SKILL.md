---
name: cadence-design
description: Use this skill BEFORE designing, redesigning, or building ANY Cadence UI (app surfaces, components, prototypes, mocks, slides). Loads the v3 "Obsidian" design contract, tokens, component anatomies, and behavior notes so every output is on-brand. Triggers - any design work, new surface, redesign, component, color, font, motion, icon, empty state, or UI copy question on this repo.
user-invocable: true
---

# Cadence design (Obsidian v3)

Cadence's design language is **v3 "Obsidian"** (adopted as doctrine 2026-07-02): a calm
instrument. A jet-black cockpit where the machine's work glows softly in glacier, and the
only thing that ever asks for attention, in ember orange, is a decision that genuinely
needs a human. Warm asks, cool works.

## Read order (do this first)

1. [`/DESIGN-OBSIDIAN.md`](../../../DESIGN-OBSIDIAN.md): THE design contract. Its 9
   standing instructions (§12) are mandatory. When anything else disagrees, the contract wins.
2. [`/design-reference/obsidian-v3/tokens/`](../../../design-reference/obsidian-v3/tokens/)
   holds the custom properties (`colors.css`, `typography.css`, `geometry.css`,
   `motion.css`, `fonts.css`): copy them verbatim. Never invent a hex, a duration, or an easing.
3. [`/design-reference/obsidian-v3/components.md`](../../../design-reference/obsidian-v3/components.md)
   gives the exact component anatomies and states (CallCard, Mission row, slide-over,
   status dots, verdict chips, aurora card, toast, buttons).
4. [`/design-reference/obsidian-v3/implementation-notes.md`](../../../design-reference/obsidian-v3/implementation-notes.md)
   covers the state model, behaviors, keyboard map, routing suggestion, and a11y requirements.
5. [`/design-reference/obsidian-extensions.md`](../../../design-reference/obsidian-extensions.md)
   specifies the surfaces the handoff stubbed: the ⌘K palette + capability catalog, the
   Ask (⌘J) panel, Settings + Admin posture, onboarding, Engine Room room details, chart
   grammar, micro-interaction recipes, density modes, and the empty-state catalog.
6. When in doubt about how anything should LOOK, open the founder-approved specimen
   `design-reference/obsidian-v3/design-reference/obsidian-specimen.html` or the runnable
   six-surface prototype `design-reference/obsidian-v3/design-reference/cadence-app.html`
   in a browser.

## Hard laws (enforce in every output)

- **Colors only from the tokens.** Ember `#FF6B2C` = needs-a-human ONLY (calls, gates, the
  one primary CTA per screen); never decoration, never a label color. Glacier `#7FD1DC` =
  the machine voice. Violet only inside the shimmer gradient and the working butterfly.
  Blossom = information (links, citations). Moss/madder = outcomes only. Focus ring = 2px
  glacier; selection = ember at 28% (`--focus-ring`, `--selection` in the tokens).
- **The restraint budget per screen:** at least 90% neutral; one ember CTA; at most one
  aurora card; at most one shimmer; at most two pencil annotations; status color only on
  actual status. Grayscale test before shipping.
- **Type:** Newsreader (display, one italic emotional word per screen max), Schibsted
  Grotesk (all UI, 13px base), JetBrains Mono (metadata, mono-caps with middots), Codystar
  (aurora numerals ONLY), Caveat (pencil ONLY). Never Inter, Roboto, or Fraunces.
- **Iconography:** there is NO icon set. Nav uses the mono numeral index (01-05). The only
  pictorial element is the Butterfly mark (`design-reference/obsidian-v3/assets/`, never
  redraw). Affordances are unicode in mono (`→`, `⌘K`, `·`). Status = 6px glowing dot +
  mono-caps word, never an icon.
- **Motion:** one easing `cubic-bezier(0.23,1,0.32,1)`; 140/200/280ms. Only live pulses,
  step progress, and arrivals move on their own; decoration never animates; everything
  gates on `prefers-reduced-motion`.
- **Voice + humanized-output law:** a sharp PM's voice; plain-words buttons (Approve, Send
  back, Challenge) with the consequence in helper text; mechanism names banned on controls;
  no em/en dashes (use the middot), no AI-cliche words, no exclamation marks, no emoji,
  in UI strings AND agent output. Empty states are instructions with a time estimate.
- **Placement algorithm before any new surface** (contract §12.1): which of the 7 objects,
  which intent, which layer; needs attention = a Call in the one queue; rare = Cmd+K.
  Features NEVER add nav items. IA is fixed: Today, Discover, Plan, Build, Brain + Ask
  (Cmd+J) + one Engine Room door.

## Scope

Applies to every authenticated app surface. The public landing page keeps the Ember
Editorial parchment system (`/DESIGN.md`); do not mix the two. For throwaway mocks and
slides, copy the tokens into a static HTML file; for production code, port tokens as CSS
custom properties and follow `implementation-notes.md`.
