# OBS-PORT (G14) · The Obsidian v3 port: how to verify, per ID

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

## OBS-02 · App shell: pending

## OBS-03 · Core primitives (🔨 lane2, 2026-07-02 - library shipped, one slice deferred)

**What shipped:** the full Obsidian primitive set OBS-04..09 consume, in a new `src/components/obsidian/` folder (parallel to, not replacing, the parchment `cadence/Primitives.tsx`, which stays live for ~50 parchment routes until OBS-10 folds them):

- `MonoLabel` + `Button` (`primitives.tsx`) - primary/secondary/quiet variants, press `scale(0.985)`/140ms, 2px glacier focus ring, loading state (label fades, width holds, no layout shift).
- `StatusDot` (`status.tsx`) - 9 states (4 core + 3 contract aliases + 2 word-sharing pairs), always paired with its mono word (status never relies on color alone).
- `VerdictChip` (`verdict.tsx`) - 10 tones, 12%-fill/45%-border formula, `PENDING` as the neutral no-verdict state.
- `AuroraCard` (`aurora.tsx`) - the Loop-Health-class score card: two `aria-hidden` drifting blobs, Codystar numeral, hue prop (healthy/attention/failing).
- `Citation` (`citation.tsx`) - keyboard-focusable superscript chip revealing a glass popover on hover AND focus.
- `PencilNote` (`pencil.tsx`) - Caveat annotation, 3 inks, `role="note"` (read, not hidden).
- `Toast` + `ToastProvider`/`useToast` (`toast.tsx`) - a framework-free singleton controller (`createToastController`, independently unit-testable): a new `show()` replaces the current message and resets the 3.6s timer, never stacks.
- `SlideOver` (`slideover.tsx`) - the a11y-carrying chassis, built on `@radix-ui/react-dialog` (already vendored for `ui/sheet.tsx`) rather than a hand-rolled focus trap: Radix owns `role="dialog"` + `aria-modal`, focus trap, restore-on-close, Esc, and scrim-click-close.
- `CallCard` (`callcard.tsx`) - the attention-queue atomic unit, full + compact (`YOUR CALL`) gate variant.
- `MissionRow` (`missionrow.tsx`) - a real `<button>` row, exact cell order/widths.

**Deliberately deferred (not part of this diff):** the dev-only `/obsidian-specimen` route. Its file (`src/routes/_authenticated.obsidian-specimen.tsx`) matches OBS-02's active shell claim glob (`src/routes/_authenticated.*.tsx`); the ledger's file-glob reservation correctly refused the overlap (`lane.sh claim` → exit 3, CONFLICT). This does not block downstream surfaces: OBS-04..09 only import `@/components/obsidian`, which is complete and gate-green.

**Adversarial review (5-lens Workflow + skeptical verify pass) - confirmed fixes applied:**

- `StatusDot`'s `queued` color was reading the wrong token (`--slate` = `#6E6A64`, a chart-axis color) instead of the spec-literal `#55524C` (`--text-faint`).
- `Toast`'s live region was mounting/unmounting instead of staying persistently in the DOM - a real announcement-drop risk on VoiceOver/Safari and older NVDA/Firefox pairings, since some AT only reliably announces a live region that already existed before its content changed. Fixed: the `aria-live="polite"` wrapper is always mounted; only its text and opacity toggle.
- `Citation`'s popover had no ARIA relationship to its trigger (`role="presentation"`, no `aria-describedby`) - a screen-reader user tabbing to `[1]` heard only "1, button." Fixed: stable `id` + `aria-describedby` on the button + `role="tooltip"` on the panel.
- `SlideOver`'s chassis title now hardcodes the components.md-literal 21px for the Mission-slide-over anatomy (was reusing `CallCard`'s 20px `--text-card-title` token); the footer strip now reads the spec-literal 11px (was 11.5px, no matching token existed).
- `VerdictChip`'s `PENDING` border switched from the general `--hairline` to `--hairline-faint` (the token's own doc comment is "faint dividers," matching the spec's "faint hairline" wording).
- Two untokenized transition durations (`160ms`, Tailwind's `duration-150`) now read `var(--dur-control)` (140ms), the button/hover-motion token.
- `CallCard`'s kind chip and `AuroraCard`'s label/note now compose the named `MonoLabel` primitive (added an `ember` tone) instead of hand-rolled spans, per the anatomy's own naming.
- Three em dashes in code comments cleaned up in passing (Tier 2, non-blocking, but zero-cost since already touching those lines).

**Left as a documented interpretation, not silently invented:** `AuroraCard`'s `attention`/`failing` backgrounds use `color-mix(in oklab, var(--ember|--madder) 12%, var(--surface-card-deep))` - the spec gives only a qualitative "ember-forward"/"madder-forward" with no literal hex, so this derives from the real role tokens rather than inventing a new hex. The glass-popover "8% white hairline" wording in README §5.1 has no matching token in the `[data-obsidian]` layer (only 5%/7%/9% exist); `Citation` uses the closest token (`--hairline-strong`, 9%) - flagged for the doc owner to reconcile, not resolved unilaterally in code.

**Testing approach:** pure-logic / shallow-element tests only (`ComponentName.render(props, ref)` called directly, no DOM renderer) - this matches the codebase's existing convention (zero jsdom/happy-dom dependency exists anywhere in the repo). Visual and interactive verification (double-toast replace, slide-over Tab-trap + Esc-restore, reduced-motion kill) runs manually per the spec's own §5 test steps. Along the way, fixed a real tsconfig gap: `"exclude"` only listed `src/**/*.test.ts`, so this repo's first-ever `.test.tsx` file would have typechecked without `bun:test`'s ambient types; added `"src/**/*.test.tsx"` alongside it.

**How to verify (repeatable):**

1. `bunx tsc --noEmit` → 0 errors.
2. `bun test src/components/obsidian/__tests__/primitives.test.tsx` → 15 pass (state maps, tone maps, Toast singleton replace + fake-timer auto-clear, MissionRow/CallCard structural real-button checks, SlideOver's `onOpenChange(false)` → `onClose` wiring).
3. `bun test` (full suite) → 1889 pass, 0 fail.
4. Grep every new file for a hex outside the token layer; every literal hex present traces to an exact spec value (e.g. `#FF8B52` for `VerdictChip`'s `REVISE` text, verbatim from `components.md`) or is derived from a real token via `rgba()`/`color-mix()`.
5. Once OBS-02 lands and the specimen route follows: open `/obsidian-specimen` next to `design-reference/obsidian-v3/design-reference/cadence-app.html` at 1440px and walk the 8-point prototype-parity checklist per primitive.

**Gates at ship:** tsc 0 · 15 new tests / 1889 total pass · `bun run build` not run in-worktree (pre-existing node20/ESM `lovable-tagger` error unrelated to this diff, per the hub's build-gate note) · humanized-output clean on every new UI-facing string.

_Sections are appended here as each ID ships, with the prototype-parity screenshots noted per the bible's 8-point checklist._
