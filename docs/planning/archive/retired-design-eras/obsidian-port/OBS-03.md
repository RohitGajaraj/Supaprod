# OBS-03 · Core primitive set (Obsidian)

> _Created: 2026-07-02 · The self-contained build+implementation spec for the Obsidian primitive library. Read the hub ([`README.md`](./README.md)) once for shared canon; everything specific to this item is embedded below. When this spec and the contract disagree, the contract wins; when a fine visual detail differs between the contract text and the runnable prototype, the prototype's rendering is the founder-approved outcome._

## 1. Snapshot

| Field | Value |
| --- | --- |
| ID | OBS-03 |
| Rank | #4 |
| Tier | 1 (foundation, strictly ordered) |
| Status | pending |
| Category | Cockpit |
| Depends on | OBS-02 (shell) · transitively OBS-01 (tokens + fonts) |
| Blocks | OBS-04, OBS-05, OBS-06, OBS-07, OBS-08, OBS-09 (every surface consumes these primitives) |
| One-line what | The Obsidian primitive set every surface reuses: `Button`, `StatusDot`, `VerdictChip`, `MonoLabel`, `Toast` (singleton), `SlideOver` chassis (dialog + focus trap + restore), `CallCard`, `MissionRow`, `AuroraCard`, `Citation` chip, `PencilNote`, each to the exact `components.md` anatomy with every state designed. |
| Dashboard row | [`../SOURCE-OF-TRUTH.md`](../../../SOURCE-OF-TRUTH.md) group G14, row OBS-03 |
| Summary bible | [`../obsidian-port-plan.md`](../obsidian-port-plan.md) |

## 2. Why we are doing it

Obsidian's first law is **one object, one anatomy**: everything is one of seven objects (Signal, Opportunity, Spec, Mission, Call, Outcome, Learning), each rendered with exactly one card, one status language, identical everywhere. That law is only real if there is a single, shared library of components that renders those anatomies. OBS-03 is that library. Every surface item (OBS-04 through OBS-09) consumes these primitives verbatim; none of them re-implements a button, a status dot, or a card. If a primitive drifts here, it drifts everywhere at once, which is exactly the coherence the port is buying.

The second law, **one queue for attention** (ember reserved for a decision that needs a human), lives in two of these primitives specifically: `CallCard` (the atomic unit of the attention queue) and the ember `Button` variant. Ember appears nowhere else in this set. `StatusDot`, `VerdictChip`, `AuroraCard`, `Citation`, and `PencilNote` carry the cool machine palette (glacier, moss, madder, marigold, blossom) so that when ember does appear, it means one thing.

The third law, **depth on demand**, is the `SlideOver` chassis: the second layer of the three-layer model (quiet list → slide-over → full view). It also carries the accessibility contract for the whole port (dialog role, focus trap, restore focus on close), which the prototype deliberately omits and production must add.

The tie to the v11 guiding star (trust at the point of decision) and the engine-room doctrine (calm front, deep engine behind one door) is direct: these primitives are the vocabulary in which a calm instrument speaks. The restraint budget is enforced at the component level here so no downstream surface can accidentally break it (one ember `Button` per screen, at most one `AuroraCard`, at most two `PencilNote`s, status color only on actual status).

## 3. What we are building

**Scope IN**

- A new Obsidian primitive module (home decided in §6): the eleven primitives named in the one-line what, each matching its `components.md` anatomy exactly, each with every interaction state designed (hover, focus, active, disabled, empty, loading, error where applicable).
- The `Toast` singleton controller: one toast at a time, replaces (never stacks), auto-dismisses after 3.6s, `cadRise` 200ms entrance.
- The `SlideOver` chassis: `role="dialog"` + `aria-modal`, focus trap, focus restore on close, Esc + scrim-click close, `cadSlideIn` 240ms, scrim `rgba(4,4,5,0.6)` + `blur(3px)`.
- A dev-only specimen route that renders every primitive in every state (the storybook substitute; see §5 step 12) so a reviewer can walk the set side by side with the prototype.
- Unit tests for the pure logic: `StatusDot` color/animation mapping, `VerdictChip` tone mapping, the `Toast` singleton replace-not-stack behavior, the `SlideOver` focus-trap + restore contract.

**Scope OUT (no feature work rides along)**

- No server functions, no `*.functions.ts`, no data-flow changes. These primitives are **pure presentational components**: they take props and render. They read no query keys and call no mutations. Downstream surface items (OBS-04..09) wire them to the real server fns (`discovery.functions.ts`, mission/build server fns, `knowledge` fns, etc.) read-only; OBS-03 must not touch those files.
- No new AI surface, no `CallSurface` literal, no `runtime.server.ts` change.
- No route consolidation (that is OBS-10). The only route added is the dev specimen, which OBS-10 will fold or gate for production.
- No shell/rail work (that is OBS-02). OBS-03 assumes `[data-obsidian]` and the token layer already exist on the authenticated layout.
- The parchment `Primitives.tsx` set is **not deleted** here (parchment surfaces still import it until OBS-10 finishes the fold). See §8.

## 4. Current state

Real files verified 2026-07-02:

- **`src/components/supaprod/Primitives.tsx`** exists and is the **parchment "Ember Editorial"** primitive set. It exports `SupaprodMark`, `MonoLabel` (takes a **lucide** icon prop), `StepDot`, `StatusBadge`, `VerdictChip` (parchment tones `moss|ember|indigo|orchid|saffron|madder` mapped to parchment vars `--emerald`, `--action-blue`, `--agent`, `--saffron`, `--rose`), `SurfaceHeader`, `TabRow`, `EmptyState` (takes a lucide icon), `RiskTag`, `SubTabs`, `Cite`. These use parchment tokens (`--ember`, `--saffron`, `--action-blue`, `--ink-subtle`, `--soft-stone`, `--dur-fast`) and the `.dot`, `.mono-label`, `.cite`, `.btn` CSS classes from the parchment `styles.css`. They are **not** Obsidian: wrong palette, lucide icons, parchment class names. They stay for parchment consumers; OBS-03 supersedes them with a parallel Obsidian set (decision in §6).
- **`src/components/supaprod/`** also holds `AppShell.tsx`, `TopBar.tsx`, `CommandPalette.tsx`, `LoopThread.tsx`, `AttentionBell.tsx`, `BudgetBar.tsx`, `AmbientChip.tsx`, `FlowWidget.tsx`, `LineageDrawer.tsx`, `MissionGraph.tsx`, `MachineViewToggle.tsx`, `MeetingDetailBody.tsx`, `Sketch.tsx`, `CookingBanner.tsx`, `DocEditor.tsx`, `editor/`. All parchment, all import `lucide-react`. None are touched by OBS-03 (shell is OBS-02).
- **`[data-obsidian]` token layer + the 5 fonts + 8 keyframes** are introduced by OBS-01 (append-only under `[data-obsidian]` in `src/styles.css`; Codystar + Caveat added to the `<link>` in `src/routes/__root.tsx`). OBS-01/02 specs are not yet written to this folder (only `README.md` is present) but the token values are frozen in the hub §5 and the handoff `tokens/*.css`. **Before starting, verify OBS-01 has landed the `[data-obsidian]` layer** (grep `src/styles.css` for `data-obsidian` and for `--canvas`); if it has not, the primitives will render unstyled. OBS-03 assumes those CSS custom properties resolve.
- The **runnable prototype** `design-reference/obsidian-v3/design-reference/cadence-app.html` is the pixel floor and renders every one of these primitives; the **butterfly assets** live at `design-reference/obsidian-v3/assets/butterfly-{idle,working,ember}.svg` (never redraw; `CallCard`/`MissionRow`/etc. do not use them, but `SlideOver` and the specimen may reference the working/idle marks).

What stays: the parchment `Primitives.tsx` (untouched). What changes: a new Obsidian primitive module is added; nothing existing is edited by OBS-03.

## 5. How - step by step

Build top to bottom. Each step names the file and the change. All new components are **pure and typed**; no data fetching.

1. **Create the home** `src/components/obsidian/` and the barrel `src/components/obsidian/index.ts`. (Rationale for a new folder rather than extending `supaprod/Primitives.tsx` in §6.)

2. **`primitives.tsx`** - `MonoLabel` and `Button`.
   - `MonoLabel`: mono-caps metadata row, 9.5px, letter-spacing 0.11em, `--font-mono`, color defaults `--text-subtle`, accepts a `tone` prop (`glacier|blossom|moss|madder|marigold|muted|faint`) that only recolors the text, and children that already include middot `·` separators. **No icon prop** (iconography law: there is no icon set; the caller passes unicode affordances like `→` inline).
   - `Button`: variants `primary` (ember fill `#FF6B2C`, ink `--cta-ink #0A0A0B`, 13px/600, radius `--radius-control 8`, padding 9/18; hover fill `--ember-deep #C2571F`; press transform `scale(0.985)` 140ms), `secondary` (fill `--hover #1D1D21`, 1px `--hairline-strong rgba(255,255,255,0.09)`, text `--text-primary`, 13px/500, padding 8/18; hover fill `#242429`), `quiet` (mono-caps glacier text link, e.g. `OPEN →`; hover text `#EAF6FF`, no fill/border). All variants: `:focus-visible` = 2px `--glacier #7FD1DC` outline offset 2. Disabled: 45% opacity, cursor default, no hover. `loading`: label swapped for the `cadPulse` glacier dot + retained width (no layout shift).

3. **`status.tsx`** - `StatusDot`. 6px circle + mono word, always paired (status never relies on color alone). State → color/glow/animation, ported verbatim from the prototype `STATUS` map:
   - `working` glacier `#7FD1DC`, glow `0 0 8px 1px rgba(127,209,220,0.6)`, `cadPulse 2s ease-in-out infinite`, label ink `#7FD1DC`.
   - `gate` / `waiting` ember `#FF6B2C`, glow `0 0 10px 2px rgba(255,107,44,0.55)`, `cadGlow 1.8s ease-in-out infinite`, label ink `#FF6B2C`.
   - `done` / `shipped` moss `#7FBF8E`, glow `0 0 8px 1px rgba(127,191,142,0.5)`, `anim none`, label ink `#7FBF8E`.
   - `queued` slate `#55524C`, no glow, no anim, flat.
   - Also expose the contract's extra states as thin aliases: `thinking` blossom breathe (`cadGlow`, `--blossom #E5BDDF`), `in-review` marigold `#E8B44C`, `blocked` madder `#E06557`. Props: `state`, `word` (the mono label, required - enforces the no-color-alone rule). Motion respects `prefers-reduced-motion` via the keyframes' own media block (OBS-01).

4. **`verdict.tsx`** - `VerdictChip`. Mono 8.5-9px caps 600, pill (`--radius-pill 99`), 12% tinted fill, 45%-alpha border of the same hue. Tone map (from `components.md`): `SHIP`/`VALIDATED`/`KEPT` moss (text `--moss-bright #8FD9A0`) · `KILL`/`MISSED` madder (text `--madder-bright #EE7A6C`) · `REVISE` ember (text `#FF8B52`) · `CRITIC REVIEW`/`WATCH` marigold `#E8B44C` · `DRAFTING` glacier `#7FD1DC` · `PENDING` neutral (transparent fill, `--text-faint` text, faint hairline border). No dot, no icon; the tone color is the meaning. This is a rendered judgment, distinct from `StatusDot` (live state).

5. **`aurora.tsx`** - `AuroraCard`. Radius `--radius-aurora 16`, `bg #0F1B12` (healthy), two `aria-hidden` drifting radial blobs (marigold at 0.34 alpha `cadDriftA 9s`, moss at 0.4 alpha `cadDriftB 12s`), outer glow `0 0 55px rgba(127,191,142,0.09)`. Content slots: mono-caps label (`MonoLabel`), the numeral in `--font-dotted "Codystar"` at `--text-score 52px`, mono-caps note. Hue prop encodes state: `healthy` moss-forward (bg `#0F1B12`), `attention` ember-forward, `failing` madder-forward. Enforce max one per screen at the call site (documented, not runtime-guarded).

6. **`citation.tsx`** - `Citation`. Superscript blossom chip `[n]` (`--blossom` / link `--link`), mono, with a hover popover card showing the source name (bold, `--text-primary`) + verbatim quote (`--text-body`). Reuse the parchment `Cite` shape (source + body props) but Obsidian tokens and glass popover (backdrop blur 20, 8% white hairline). Keyboard-focusable (`<button>`), popover on focus as well as hover.

7. **`pencil.tsx`** - `PencilNote`. Caveat (`--font-pencil`) ~17px, one of three inks: `best-bet` lime `--pencil-lime #CDE07A`, `pet-feature` blossom `--pencil-blossom #E5BDDF`, `scope-creep` apricot `--pencil-apricot #FFB27A`. Rotated ~ -2deg, neon underline (a thin same-ink underline with a soft glow). Positioned by the caller (absolute, typically top-right -11px). Max two per screen (call-site law). `aria-hidden` is NOT applied - it is the PM's own voice and should be read; but it is decorative annotation, so mark it appropriately with `role="note"`.

8. **`toast.tsx`** - `Toast` + `ToastHost` singleton controller.
   - Visual: fixed bottom-center, `--raised #17171A` pill, moss 40% border + moss glow (`0 0 18px rgba(127,191,142,0.12)` paired with `0 8px 30px rgba(0,0,0,0.5)` per the prototype), 13px `--text-primary`, `cadRise 200ms`.
   - Behavior: **singleton** - a `ToastHost` holds a single `toast: string | null`; a new toast **replaces** the current one and resets the 3.6s timer. Never stacks. Expose an imperative `showToast(message)` (context + hook `useToast`). Auto-clear after 3.6s. `aria-live="polite"` region so it is announced.

9. **`slideover.tsx`** - `SlideOver` chassis (the a11y-carrying primitive).
   - Visual: 480px (max 92vw), fixed right, `bg #101013`, left hairline `--hairline-strong` (9% white), shadow `-30px 0 60px rgba(0,0,0,0.5)`, `cadSlideIn 240ms`. Scrim `rgba(4,4,5,0.6)` + `blur(3px)`, `aria-hidden`, click closes.
   - A11y contract (production MUST add what the prototype omits): `role="dialog"` + `aria-modal="true"`, `aria-labelledby` pointing at the header title; **focus trap** (Tab/Shift+Tab cycle within the panel); **restore focus** to the element that had it before open, on close; Esc closes; scrim click closes. Provide `open`, `onClose`, `title`, `children` (header slot, body slot, footer slot). Footer strip helper: 11px `--text-faint`.

10. **`callcard.tsx`** - `CallCard` (the atomic unit). Container `--surface-card-deep #0E0E10`, border `1px rgba(255,107,44,0.25)`, radius `--radius-card 12`, padding 20/22. Anatomy top to bottom (exact from `components.md`):
    1. Kind chip: `MonoLabel` 9px caps ember in an ember-hairline pill (`SHIP IT?` / `WORTH BUILDING?` / `SPEND`) + expiry in faint mono caps (`EXPIRES IN 6H`).
    2. Title: Newsreader `--text-card-title 20px`/460, lh 1.3.
    3. Body: 13px/1.65 `--text-muted`.
    4. Evidence rows: source pill (blossom mono 8.5px, blossom hairline) + verbatim quote 12.5px `--text-body`.
    5. Actions: primary ember `Button` + secondary `Button` + consequence helper 11.5px `--text-subtle`.
    - Add a `compact` prop for the slide-over gate variant: chip reads `YOUR CALL`, title 17px, tighter padding.
    - Props are pure: `{ kind, expiry, title, body, ev:[{src,text}], okLabel, noLabel, consequence, onOk, onNo }`. `onOk`/`onNo` are wired by the surface; `CallCard` calls them and nothing else.

11. **`missionrow.tsx`** - `MissionRow`. Full-width **real `<button>`**, 14/18 padding, bottom `--hairline`, hover fill `#141416`. Cells left to right: `StatusDot` · title 13.5px/600 `--text-primary` (ellipsis) · `VerdictChip` (done missions only) · step label mono 9px right-aligned width 96px (color follows the dot state) · cost mono 9px `--text-faint` width 44px right. Props: `{ status, title, verdict?, stepLabel, cost, onOpen }`.

12. **Specimen route** `src/routes/_authenticated.obsidian-specimen.tsx` (dev-only). Wrap in `[data-obsidian]`, render each primitive in every state in a labeled grid: `Button` (primary/secondary/quiet × default/hover-note/disabled/loading), `StatusDot` (all 6 states), `VerdictChip` (all tones), `MonoLabel`, `CallCard` (full + compact + empty/all-clear note), `MissionRow` (working/gate/done/queued), `AuroraCard` (healthy/attention/failing), `Citation` (with popover), `PencilNote` (three inks), a `Toast` trigger button, a `SlideOver` trigger button. This is the storybook substitute and the parity-review harness. Gate it out of production nav (no rail entry; reachable only by direct URL) - OBS-10 folds or removes it.

13. **Barrel + tests.** Export all from `src/components/obsidian/index.ts`. Write `src/components/obsidian/__tests__/primitives.test.ts(x)`: (a) `StatusDot` maps each state to the exact color/glow/anim; (b) `VerdictChip` maps each tone to the exact hue; (c) `Toast` replaces rather than stacks and clears after 3.6s (fake timers); (d) `SlideOver` traps focus and restores it to the opener on close; (e) `MissionRow`/`CallCard` render as real `<button>`s / expose their actions.

**Test steps (manual):** `bun run dev`, open `/obsidian-specimen`, walk each primitive against the prototype at 1440px; trigger the toast twice fast (verify replace, not stack); open the slide-over, Tab through (verify trap), Esc (verify restore focus); toggle OS reduced-motion (verify all animation stops).

## 6. Structure

**Decision: new folder `src/components/obsidian/`, do NOT extend `supaprod/Primitives.tsx`.** Reasons: (1) the parchment set stays live for ~50 parchment routes until OBS-10 finishes the fold - editing it in place would break them; (2) a clean Obsidian barrel gives OBS-04..09 one import surface and makes the eventual parchment deletion a folder-level operation; (3) the two sets share names (`MonoLabel`, `VerdictChip`, `Citation`) but differ in tokens, tones, and the icon/no-icon rule, so co-locating invites accidental cross-import.

Component tree / new files:

```
src/components/obsidian/
├── index.ts               (barrel - exports all primitives)
├── primitives.tsx         (MonoLabel, Button)
├── status.tsx             (StatusDot)
├── verdict.tsx            (VerdictChip)
├── aurora.tsx             (AuroraCard)
├── citation.tsx           (Citation)
├── pencil.tsx             (PencilNote)
├── toast.tsx              (Toast, ToastHost, ToastProvider, useToast)
├── slideover.tsx          (SlideOver chassis + useFocusTrap helper)
├── callcard.tsx           (CallCard)
├── missionrow.tsx         (MissionRow)
└── __tests__/
    └── primitives.test.tsx
src/routes/
└── _authenticated.obsidian-specimen.tsx   (dev specimen; NEW)
```

- `ToastProvider` mounts once (the surface items or the shell wrap the app subtree; for OBS-03 the specimen route wraps itself, and the provider is documented for OBS-02/04 to hoist). `src/routes/routeTree.gen.ts` regenerates for the new route - never hand-edit it.
- **Data flow: none.** Every primitive is pure props in, JSX out. No server fns, no query keys, no mutations are consumed or modified by OBS-03. Surface items pass real data down. This item is explicitly **not** allowed to touch any `*.functions.ts`.

## 7. Design elements

All values below are the frozen tokens (hub §5); do not invent a hex, duration, or easing. Scoped to `[data-obsidian]`.

**Surfaces / ink:** `--canvas #0A0A0B` · `--card #111113` · `--surface-card-deep #0E0E10` · `--raised #17171A` · `--hover #1D1D21` · `--hairline rgba(255,255,255,0.07)` · `--hairline-strong rgba(255,255,255,0.09)`. Ink: `--text-primary #F2F0ED` · `--text-body #B5AFA6` · `--text-muted #9C978F` · `--text-subtle #7D786F` · `--text-faint #55524C`.

**Role colors (one job each):** `--ember #FF6B2C` (`--ember-deep #C2571F` press · `--cta-ink #0A0A0B`) - needs a human, only in `Button` primary + `CallCard`. `--glacier #7FD1DC` - machine voice, working dot, focus ring, quiet-link hover `#EAF6FF`. `--blossom #E5BDDF` (`--fuchsia #C2337E` depth) - links + `Citation`. `--moss #7FBF8E` (`--moss-bright #8FD9A0`) - positive verdicts + toast border. `--madder #E06557` (`--madder-bright #EE7A6C`) - negative verdicts. `--marigold #E8B44C` - in-review only. Pencil inks: `--pencil-lime #CDE07A` · `--pencil-blossom #E5BDDF` · `--pencil-apricot #FFB27A`.

**Type:** `--font-ui "Schibsted Grotesk"` 13px base/1.55, 600 headings · `--font-serif "Newsreader"` for card titles (`--text-card-title 20px`/450-460, lh 1.3) · `--font-mono "JetBrains Mono"` 9.5-10px caps, 0.10-0.12em tracking, middot `·` separators · `--font-dotted "Codystar"` for `AuroraCard` numerals only (`--text-score 52px`) · `--font-pencil "Caveat"` for `PencilNote` only (~17px). Sizes used: `--text-base 13px`, `--text-sm 12px`, `--text-helper 11.5px`, `--text-mono-label 9.5px`, `--text-mono-micro 8.5px`.

**Geometry:** grid 4px; spacing 4/8/12/16/24/40. Radii `--radius-control 8` · `--radius-card 12` · `--radius-panel 14` · `--radius-pill 99` · `--radius-aurora 16`.

**Motion:** one easing `--ease cubic-bezier(0.23,1,0.32,1)`; durations `--dur-control 140ms` / `--dur-panel 200ms` / `--dur-page 280ms`. Keyframes used (from OBS-01's `motion.css`): `cadPulse 2s` (working dot), `cadGlow 1.8s` (gate/thinking dot), `cadDriftA 9s`/`cadDriftB 12s` (aurora blobs), `cadRise 200ms` (toast), `cadSlideIn 240ms` (slide-over). Hover is **tonal, not spatial** (lift the surface one step + brighten the hairline; nothing translates). All motion gated by `prefers-reduced-motion` + the in-product toggle.

**Glows (verbatim from the prototype):** working dot `0 0 8px 1px rgba(127,209,220,0.6)` · gate dot `0 0 10px 2px rgba(255,107,44,0.55)` · done dot `0 0 8px 1px rgba(127,191,142,0.5)` · Today badge `0 0 10px rgba(255,107,44,0.4)` · aurora outer `0 0 55px rgba(127,191,142,0.09)` · toast `0 8px 30px rgba(0,0,0,0.5), 0 0 18px rgba(127,191,142,0.12)` · slide-over `-30px 0 60px rgba(0,0,0,0.5)`.

**Interaction states, per primitive:**

- `Button` primary - default: ember fill. Hover: fill `--ember-deep`, hairline unchanged. Active/press: `scale(0.985)` for 140ms. Focus: 2px glacier outline offset 2. Disabled: 45% opacity, no hover/press. Loading: label → glacier `cadPulse` dot, width held.
- `Button` secondary - hover fill `#242429`; else as primary for focus/disabled.
- `Button` quiet - glacier text; hover text `#EAF6FF`; focus ring same.
- `StatusDot` - the four core + three alias states above; the mono word is always present (no hover needed; it is not interactive). If placed inside an interactive row, the row owns hover.
- `VerdictChip` - static (non-interactive); no hover/focus. Empty/`PENDING` tone is the "no verdict yet" state.
- `CallCard` - its buttons carry the states; the card itself: default border `rgba(255,107,44,0.25)`; on the answered transition the surface removes it (the card leaves the queue). Empty state = the all-clear card (moss border, handled by the surface, not this primitive) - `CallCard` renders nothing when there are no calls.
- `MissionRow` - default `--surface-card-deep`; hover fill `#141416` (tonal); focus 2px glacier ring; active row press subtle. Loading (mission list fetching) is the surface's skeleton, not this primitive.
- `SlideOver` - open: `cadSlideIn`; scrim fades in. Focus: trapped inside; on close, restored to opener. Error/empty body is the surface's content.
- `Toast` - enter `cadRise 200ms`; singleton replace; auto-exit 3.6s. No hover.
- `AuroraCard` - static drift; no interactive states; `aria-hidden` blobs.
- `Citation` - default superscript chip; hover/focus reveals the glass popover; focus ring glacier.
- `PencilNote` - static, decorative-but-read (`role="note"`); no interactive states.

## 8. Restructuring / renaming / modification

- **New folder** `src/components/obsidian/` with 10 component files + `index.ts` barrel + `__tests__/`. (§6.)
- **New route** `src/routes/_authenticated.obsidian-specimen.tsx` (dev specimen). `routeTree.gen.ts` regenerates - do not hand-edit.
- **No renames, no moves, no deletions** of existing files. The parchment `src/components/supaprod/Primitives.tsx` is **left intact** (parchment routes still import it until OBS-10). This is deliberate: OBS-03 adds a parallel Obsidian set; it does not migrate the old one. The eventual deletion of the parchment set is an OBS-10 concern once every surface has flipped.
- **Lucide removal:** OBS-03 introduces **zero** `lucide-react` imports (the Obsidian iconography law: no icon set; `MonoLabel` drops the parchment `icon` prop; affordances are unicode `→` / `⌘K`). It does not remove lucide from existing chrome (that is per-surface OBS-02/04..09 work).
- **No nav-model edit** (`src/lib/nav-model.ts` is OBS-02/OBS-10). **No route fold** (OBS-10). **No redirects.**

## 9. Copy / voice

Primitives are mostly slots the surfaces fill, but the specimen and the default strings must be humanized (no em/en dashes, no exclamation marks, middot `·` separators, plain-words buttons, consequence in helper text).

- **Button labels (samples in the specimen):** `Approve` · `Send back` · `Build this` · `Start` · `Challenge` · quiet links `OPEN →` · `HOW I GOT THIS →`. Never a mechanism name on the control.
- **CallCard sample:** kind chip `SHIP IT?`; expiry `EXPIRES IN 6H`; title `Ship the checkout fix?`; consequence helper `Opens the pull request · nothing ships without you`.
- **StatusDot words:** `WORKING` · `WAITING ON YOU` · `SHIPPED` · `QUEUED` · `THINKING` · `IN REVIEW` · `BLOCKED`. Step-label form: `SCOUT · STEP 2/5`.
- **VerdictChip words:** `SHIP` · `VALIDATED` · `KEPT` · `KILL` · `MISSED` · `REVISE` · `CRITIC REVIEW` · `WATCH` · `DRAFTING` · `PENDING`.
- **Toast voice samples:** `Good call. The PR is open.` · `Sent back to Scout. Revising now.`
- **AuroraCard note sample:** `ON TRACK · +3.2 THIS WEEK`.
- **PencilNote inks:** `best bet` · `pet feature?` · `scope creep`.
- **SlideOver footer strip:** `Every hop cites the memory it drew on · Esc closes`.
- **Empty state (the all-clear, rendered by the surface not this primitive, but voiced here for consistency):** an instruction with a time estimate, e.g. `Zero calls. Enjoy the quiet roadmap.` The primitive-level empty case: `CallCard` renders nothing at zero calls; the surface shows the moss all-clear card.
- **Metadata:** mono-caps with middots and tabular numerals: `$0.84` · `WED · JUL 2` · `312 TICKETS · $0.22`.

## 10. Acceptance criteria

- [ ] `src/components/obsidian/` exports all eleven primitives via `index.ts`; each renders under `[data-obsidian]` using only Obsidian tokens (zero hexes outside the token set, verified by grep).
- [ ] `Button` has primary/secondary/quiet variants with correct hover, press `scale(0.985)`/140ms, disabled 45% opacity, loading (glacier pulse, no layout shift), and a 2px glacier focus ring.
- [ ] `StatusDot` renders all seven states with the exact prototype color + glow + animation and always shows its mono word; motion stops under reduced-motion.
- [ ] `VerdictChip` renders all ten tones with 12% fill + 45% border of the matching hue; static; `PENDING` is the neutral no-verdict state.
- [ ] `CallCard` matches the `components.md` anatomy (kind chip + expiry, Newsreader 20px title, muted body, blossom evidence rows, ember primary + secondary + consequence helper) and has a `compact` gate variant (`YOUR CALL`, 17px title).
- [ ] `MissionRow` is a real `<button>`, cells in the exact order and widths (step 96px, cost 44px), hover `#141416`, done-only verdict chip.
- [ ] `AuroraCard` renders the two `aria-hidden` drifting blobs, the Codystar numeral, the outer moss glow, and a hue prop that shifts healthy/attention/failing.
- [ ] `Citation` is a focusable blossom superscript chip revealing a glass popover with source + verbatim quote on hover and focus.
- [ ] `PencilNote` renders in Caveat, three inks, ~-2deg rotation, neon underline, `role="note"`.
- [ ] `Toast` is a singleton: a second call replaces the first (no stack), auto-clears at 3.6s, `aria-live="polite"`, `cadRise 200ms`.
- [ ] `SlideOver` is `role="dialog"` + `aria-modal`, traps focus, restores focus to the opener on close, closes on Esc and scrim click, animates `cadSlideIn 240ms`, scrim `rgba(4,4,5,0.6)`+blur(3px).
- [ ] `/obsidian-specimen` renders every primitive in every state and is not in the production rail.
- [ ] OBS-03 touches no `*.functions.ts`, no server logic, no existing file except adding the new folder + route.
- [ ] `tsc --noEmit` = 0; new unit tests green; every new string passes the humanized-output scan.

## 11. Prototype-parity checklist (the last gate, tailored)

Open `design-reference/obsidian-v3/design-reference/cadence-app.html` and `/obsidian-specimen` side by side at 1440px:

1. **Rail:** N/A for this item (no rail is rendered by OBS-03; verify the specimen sits inside OBS-02's shell if present, else on `--canvas`).
2. **Surface chrome:** the specimen uses `--canvas` and Obsidian container padding; primitives sit on `--card`/`--surface-card-deep` exactly.
3. **Type:** `CallCard` title Newsreader 20px/460; `MissionRow` title 13px/600; mono labels 9-9.5px caps with middots; Codystar only on `AuroraCard`; Caveat only on `PencilNote`.
4. **Color:** zero hexes outside tokens; ember only on `Button` primary + `CallCard`; dot/badge/aurora/toast glows match the exact values in §7.
5. **Motion:** hover 140ms one-step tonal lift; slide-over `cadSlideIn 240ms`; toast `cadRise 200ms`; dot pulses/glows only on live status; reduced-motion kills all.
6. **Behavior:** `Toast` singleton (3.6s, replace); `SlideOver` focus trap + restore + Esc + scrim; `MissionRow`/`CallCard` are real buttons; `StatusDot` never color-alone.
7. **Copy:** plain-words buttons, consequence helpers, mono-caps metadata, no em/en dashes, no exclamation marks.
8. **Grayscale** screenshot of the specimen still reads (every dot has its word, every verdict has its label); restraint budget respected (one ember button, one aurora, no more than two pencils in any single composition).

## 12. Verification + gates

- **`tsc --noEmit` = 0** - the real gate in a lane worktree.
- **`bun test`** green, including the new `src/components/obsidian/__tests__/primitives.test.tsx`: `StatusDot` state→style map, `VerdictChip` tone→hue map, `Toast` singleton replace + 3.6s clear (fake timers), `SlideOver` focus-trap + restore, `CallCard`/`MissionRow` render as `<button>`.
- **`bun run build`** - RED in lane worktrees on the pre-existing node20-vs-ESM `lovable-tagger` error (hub §11); do not chase it. Run the full build on the primary checkout before publish.
- **Grayscale test** - specimen screenshot with color removed still reads.
- **Restraint budget** - audited on the specimen compositions.
- **`impeccable` / humanized-output scan** - grep every new string for `-`, `-`, `!`, and the banned words (seamlessly, leverage, empower, robust, unlock, delve). Zero hits.
- **Manual checks** - the §5 test steps: fast double-toast (replace), slide-over Tab-trap + Esc-restore, reduced-motion kill, focus rings visible on every control.
- **Side-by-side prototype screenshots** in the ship report for each primitive in its key states.

## 13. Risks · gotchas · founder-gates

- **Depends on OBS-01/OBS-02 landing first.** If `[data-obsidian]` and the fonts/keyframes are not yet in `src/styles.css` / `__root.tsx`, the primitives render unstyled and Codystar/Caveat fall back. Verify OBS-01 has landed before starting (grep `src/styles.css` for `data-obsidian`, `--canvas`, `cadSlideIn`). The OBS-01/OBS-02 specs are not yet written to this folder as of 2026-07-02.
- **Name collision with parchment `Primitives.tsx`.** `MonoLabel`, `VerdictChip`, `Citation` exist in both idioms. Keep imports explicit (`@/components/obsidian` vs `@/components/supaprod/Primitives`); the barrel prevents accidental default cross-import. Do not let a surface import the parchment `VerdictChip` by muscle memory.
- **Focus trap is the highest-risk piece.** The prototype omits it; production must add it and restore focus. Get the trap + restore right and test it (headless focus assertions are brittle; the unit test plus a manual Tab-walk both run). A leaky trap is an accessibility failure, not a cosmetic one.
- **Toast singleton timing.** Use one timer, cleared and reset on every `showToast`; a stale timer from a replaced toast must not dismiss the new one early. Cover with fake timers.
- **Aurora restraint.** `AuroraCard` is visually loud; enforce max-one-per-screen at the call site in OBS-04/08/09 review, since the primitive cannot know the page context.
- **Specimen route in production.** The dev specimen must not appear in the production rail or be indexed; OBS-10 folds/removes it. Flag this in the ship report so it is not forgotten.
- **Founder-gates: none.** OBS-03 is presentation-only, adds no route the user reaches by default, and changes no data. No founder sign-off required beyond the standard parity review.

## 14. Interlinks

- **Hub / shared canon:** [`README.md`](./README.md) (design DNA §5, restraint budget §4, parity checklist §5.9, state model §5.10, a11y contract §5.12).
- **Build-order neighbors:** depends on [`OBS-02.md`](./OBS-02.md) (shell) and transitively [`OBS-01.md`](./OBS-01.md) (tokens+fonts); blocks and is consumed by [`OBS-04.md`](./OBS-04.md) (Today), [`OBS-05.md`](./OBS-05.md) (Build - heaviest `MissionRow`/`SlideOver`/`CallCard`-gate consumer), [`OBS-06.md`](./OBS-06.md) (Discover - `PencilNote`/`Citation`), [`OBS-07.md`](./OBS-07.md) (Plan), [`OBS-08.md`](./OBS-08.md) (Brain - `AuroraCard`/`VerdictChip`), [`OBS-09.md`](./OBS-09.md) (Engine Room - `AuroraCard`). Later: [`OBS-11.md`](./OBS-11.md) supersedes the parchment `CommandPalette` with a glass palette reusing this `SlideOver`-class chassis; [`OBS-15.md`](./OBS-15.md) chart grammar rides the `AuroraCard`/pencil layer.
- **Canon anchors:** [`../../../design-reference/obsidian-v3/components.md`](../../../design-reference/obsidian-v3/components.md) anatomies - CallCard, Buttons, Status dots, Verdict chips, Aurora score card, Mission row, Mission slide-over, Toast, Signal card, Opportunity row, Citations (`Cite`), Pencil annotations. [`design/archive/obsidian-v3.md`](../../../../design/archive/obsidian-v3.md) §9 (canonical anatomies), §6 (geometry + motion + interaction states), §2/§3 (role + working palette), §12 (standing instructions - "design every state"). [`../../../design-reference/obsidian-v3/implementation-notes.md`](../../../design-reference/obsidian-v3/implementation-notes.md) § Accessibility (the slide-over dialog/trap/restore contract). [`../../../design-reference/obsidian-extensions.md`](../../../../../design-reference/obsidian-extensions.md) (stub-surface specs that reuse these primitives).
- **Prototype (the floor):** [`../../../design-reference/obsidian-v3/design-reference/cadence-app.html`](../../../design-reference/obsidian-v3/design-reference/cadence-app.html). **Assets:** `design-reference/obsidian-v3/assets/butterfly-{idle,working,ember}.svg` (never redraw).
- **Existing code superseded (not deleted):** [`../../../src/components/supaprod/Primitives.tsx`](../../../src/components/supaprod/Primitives.tsx).
- **Doctrine ties:** [`../../conventions/engine-room-doctrine.md`](../../../../conventions/engine-room-doctrine.md) · [`../../conventions/design-context.md`](../../../../conventions/design-context.md) · [`../../conventions/humanized-output.md`](../../../../conventions/humanized-output.md) · [`../../strategy/v11-guiding-star.md`](../../../../strategy/v11-guiding-star.md).
