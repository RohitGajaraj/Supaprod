# OBS-PORT (G14) — The Obsidian v3 port: how to verify, per ID

> Status · In progress (started 2026-07-02) · All authenticated app surfaces · Initiative bible: [`../planning/obsidian-port-plan.md`](../planning/obsidian-port-plan.md)

## What it does

Ports every authenticated app surface to the v3 "Obsidian" design system (the contract at [`/DESIGN-OBSIDIAN.md`](../../DESIGN-OBSIDIAN.md)): jet-black cockpit, Ember strictly needs-a-human, Glacier the machine voice, mono-index rail, five destinations + Ask + one Engine Room door. The public landing page keeps parchment and is out of scope. THE PROTOTYPE IS THE FLOOR (founder ruling 2026-07-02): every ported surface must be indistinguishable from `design-reference/obsidian-v3/design-reference/cadence-app.html` at 1440px before anything is added.

## Why it exists

Founder doctrine ruling 2026-07-02 (see `plan.md` §4 and `docs/strategy/session-decisions.md`): the v3 Obsidian handoff replaced Ember Editorial parchment for all app surfaces. This page is the running how-to-verify manual, one section per shipped OBS ID.

## How it is built (the architecture of the port)

- **Scope mechanism:** a `[data-obsidian]` attribute scope in `src/styles.css`. Tokens apply only under elements carrying the attribute; the landing page never carries it. Each surface adopts the scope as it ports (the OBS-02 shell first), keeping the port surface-by-surface and revertible, never a big-bang variable flip.
- **Semantic bridge:** under the scope, the shadcn/parchment variable names (`--background`, `--card-foreground`, `--ink`, `--surface-1`, `--focus-blue`, ...) are remapped to Obsidian values, so any not-yet-ported component rendered under an Obsidian scope degrades to a coherent dark theme instead of unreadable dark-on-dark.
- **Colors only from the tokens:** never invent a hex outside the token layer. Grep gate per ID.

---

## OBS-01 · Tokens + fonts foundation (✅ 2026-07-02)

**What shipped:** the five `design-reference/obsidian-v3/tokens/*.css` files ported verbatim into `src/styles.css` as the `[data-obsidian]` scoped layer (colors, typography scale, geometry, motion vars + shimmer gradient), the semantic bridge, the eight `cad*` keyframes, density variables (`--density-*`, extensions §8: compact drops one rhythm step, type never changes), and the two Obsidian-only font families (Codystar, Caveat) added to the root head in `src/routes/__root.tsx`.

**Deltas to know:**

- The landing page's brand-mark flutter keyframe was renamed `cadFlutter` → `cadFlutterBrand` (identical values, zero visual change) because keyframe names are global in CSS and the canonical v3 `cadFlutter` (amplitude 0.72) now belongs to the Obsidian layer. Anyone porting the shell (OBS-02) uses `cadFlutter` as the contract names it.
- Nothing carries `data-obsidian` yet. The layer is live CSS but inert until OBS-02 attaches the attribute to the app shell. This honors the bible's "surface-by-surface, NOT a big-bang token flip".
- Obsidian's `--rose` is a user-behavior DATA color (`#E89AB0`), unlike parchment's alert role. Alerts under the scope use `--destructive` (madder).

**How to verify (repeatable):**

1. `bun run dev`, open any page, and in the console run:
   `const p = document.createElement("div"); p.setAttribute("data-obsidian",""); document.body.appendChild(p); getComputedStyle(p).getPropertyValue("--glacier")` → `#7fd1dc`. Same for any token in the layer (108 sampled at ship time, zero missing).
2. Density: set `data-density="compact"` on the probe → `--density-card-pad` flips 20px → 16px.
3. Landing untouched: body background/color still parchment; `.cad-flutter` computes `animation-name: cadFlutterBrand` at 3.2s.
4. Reduced motion: emulate `prefers-reduced-motion: reduce` → every animation duration collapses to ~0 (global gate in `src/styles.css` covers the Obsidian keyframes).
5. Hex gate: every hex in the diff sits inside the Obsidian token layer (`git diff` + grep).

**Gates at ship:** tsc 0 · build clean · bun test 1871 pass (3 pre-existing env failures in `src/lib/rag/embed.test.ts`, confirmed failing on the baseline) · prettier + eslint clean · impeccable audit (one hardening applied: `::selection` on the scope element itself).

---

## OBS-02 · App shell — pending

## OBS-03 · Core primitives — pending

_Sections are appended here as each ID ships, with the prototype-parity screenshots noted per the bible's 8-point checklist._
