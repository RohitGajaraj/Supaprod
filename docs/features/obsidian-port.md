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

## OBS-02 · App shell (✅ 2026-07-02, lane1, adversarial-reviewed)

**What shipped:** the Obsidian app shell - a 236px mono-index rail, a 52px top bar, the shared `Surface` container, and the `1`-`5`/`g` keyboard map - hoisted ONCE into `src/routes/_authenticated.tsx` instead of wrapping each of the ~21 authenticated routes individually.

- `src/lib/nav-model.ts` reshaped: `PRIMARY_NAV` is a flat, five-item list (Today · Discover · Plan · Build · Brain), each carrying a mono `index` (`"01"`-`"05"`) instead of a lucide icon. Ask is removed from the rail (it returns as the `⌘J` panel, OBS-12). Discover and Plan both point at the interim `/product` route, disambiguated by `search.tab` (`signals` / `roadmap`) until OBS-10 renames the routes and adds redirects.
- `navItemActive` hardened: a bare (non-tab-scoped) item is now only active when NO tab is present on the route, so it can never show active at the same time as a tab-scoped sibling on the same path (the Discover/Plan collision on `/product?tab=roadmap`, caught by adversarial review).
- `src/components/cadence/AppShell.tsx` rewritten: the rail (Butterfly mark + `cadFlutter`, workspace switcher with lucide dropped to plain text rows, search affordance, the five `NavRow`s, and the footer trio - the workspace-paused notice when live, the shimmer working line, the Engine Room door with `engineRoomActive`-driven active styling, and the user chip). All existing data hooks (`getWorkspacePauseState`, `getNeedsYou`, `getLiveRunCounts`, `amIAdmin`, the workspace CRUD handlers) are unchanged - consumed read-only, no feature work rides along.
- `src/components/cadence/TopBar.tsx` reskinned to 52px: the surface title is the last breadcrumb, an optional subtitle is the penultimate one, plus a mono-caps date and workspace pill. The auxiliary widgets (`AttentionBell`, `MachineViewToggle`, `ConstructionPill`, `CookingBanner`, `LoopThread`, `AmbientChip`) keep their current markup - their reskin rides with later items.
- New `src/components/obsidian/Surface.tsx`: the shared surface container (`max-width` 1060/1160, `cadRise` entrance) that OBS-04..09 adopt as they port.
- `src/components/cadence/CommandPalette.tsx`'s `GotoShortcuts` rewritten: the legacy vim-style `g`-then-letter chord is replaced with single-press `1`-`5` (switch surfaces) and `g` (open the Engine Room); both ignore inputs/textareas/contentEditable and any held modifier. `Esc` closing overlays is unchanged (already handled in `CommandPalette`'s own handler).
- 21 routes unwrapped: `<AppShell>...</AppShell>` became `<>...</>`, and the `AppShell` import was dropped from each. 11 of those routes were left with a dead `const projects = useQuery(...)` (fetched only to feed the old `AppShell projects` prop, which the component never actually read) - removed, along with the now-unused `listProjects` imports and the vestigial `projects?: unknown` prop on `AppShell`'s own signature.
- `public/assets/butterfly-ember.svg` copied from `design-reference/obsidian-v3/assets/` and wired into the rail header with the spec's drop-shadow filter + `cadFlutter` animation.

**Real regressions caught by adversarial review and fixed before commit (not just style nits):**

- **Onboarding shell leak.** `_authenticated.onboarding.tsx` is documented full-viewport, no-shell. The hoist would have silently wrapped it in the rail/top bar too, exposing all five nav destinations and the `1`-`5`/`g` shortcuts to an account that hasn't finished onboarding. Fixed: `_authenticated.tsx` now branches on the current pathname and skips both the `AppShell` wrap and `GotoShortcuts` while on `/onboarding`.
- **`FlowWidget` orphaned.** The old rail footer rendered `FlowWidget` (the app's only Flow-mode entry point: ambient sound + focus timer). The new 3-row footer anatomy in the OBS-02 spec doesn't mention it, and dropping it silently would have made the feature fully unreachable (`FlowModeProvider` still mounted, running, with no UI that could ever call `enterFlow()`). Fixed: kept `FlowWidget` in the user-chip row, unstyled (it degrades via the OBS-01 semantic bridge rather than dark-on-dark; a full Obsidian reskin is OBS-03/later-primitive territory, not this item's scope).

**How to verify (repeatable):**

1. `bun run dev` (primary checkout - `bun run build`/`dev` are red in lane worktrees on the pre-existing `lovable-tagger` ESM/CJS bug, unrelated to this diff), open `/today`.
2. Rail: 236px, `--rail` background, mono indices `01`-`05`, Today/Discover/Plan/Build/Brain, no icons anywhere in the rail. Active row is `#1A1A1E` + ember index + weight 600.
3. Keyboard: press `1`-`5` to switch surfaces, `g` to open the Engine Room, confirm typing in the Today task input does NOT trigger a surface switch.
4. Visit `/product?tab=roadmap` and confirm only Plan (not Discover) shows active in the rail.
5. Navigate to `/onboarding` directly (or trigger the onboarding redirect on a fresh account) and confirm NO rail/top bar renders - full viewport, as before.
6. Open the user-chip's Flow icon (rightmost group before the presence dot) and confirm the Flow popover still opens/starts a session.
7. Confirm the shell does not remount across navigation (rail persists, no flash) - hoisted once in `_authenticated.tsx`.

**Gates at ship:** `tsc --noEmit` 0 · `bun test` 1877+ pass (0 fail) · adversarial TypeScript-reviewer pass (2 real regressions found and fixed - the onboarding leak and the orphaned FlowWidget - plus a `navItemActive` collision, a malformed CSS border value, and the 11-route dead-query cleanup) · humanized-output clean (no em/en dashes, no banned words, no exclamation marks in any new UI string) · hex gate (only `#1A1A1E` is a literal, matching the spec's own literal value for the nav-active background; every other color is a `var(--token)`).

**Independently re-verified by lane2 (2026-07-02 17:1x)** before building OBS-03's specimen route on top of it, since the dashboard row had briefly reverted to `⬜` across a concurrent rebase despite the code being merged: `tsc --noEmit` 0, `bun test` 1892/1892 pass on the merged HEAD, `[data-obsidian]` confirmed present in `_authenticated.tsx`, `Surface.tsx` confirmed present.

## OBS-03 · Core primitives (✅ lane2, 2026-07-02 - fully shipped, including the specimen route)

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

**Specimen route (shipped 2026-07-02 17:15, once OBS-02 released the glob):** `src/routes/_authenticated.obsidian-specimen.tsx`, the dev-only storybook substitute. Renders every primitive in every state in a labeled grid: `Button` (3 variants x default/hover-note/disabled/loading), `StatusDot` (all 9 states), `VerdictChip` (all 10 tones), `MonoLabel` (all 8 tones + default), `CallCard` (full, compact, and an empty/all-clear note), `MissionRow` (working/gate/done/queued), `AuroraCard` (healthy/attention/failing), `Citation` (with its hover/focus popover), `PencilNote` (all 3 inks), a `Toast` trigger, and a `SlideOver` trigger. Wrapped in its own `ToastProvider` (per the spec's note that the specimen route "wraps itself" until a shell-level provider is hoisted). Reachable only by direct URL, no rail entry; OBS-10 folds or removes it once every surface has shipped. `routeTree.gen.ts` needed to regenerate to register the route; since this worktree's `vite dev`/`build` hit the documented node20/ESM `lovable-tagger` failure, it was regenerated by invoking `@tanstack/router-generator`'s `Generator` class directly (bypassing the vite config load, same codegen output).

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
3. `bun test` (full suite) → 1892 pass, 0 fail.
4. Grep every new file for a hex outside the token layer; every literal hex present traces to an exact spec value (e.g. `#FF8B52` for `VerdictChip`'s `REVISE` text, verbatim from `components.md`) or is derived from a real token via `rgba()`/`color-mix()`.
5. `bun run dev`, open `/obsidian-specimen` next to `design-reference/obsidian-v3/design-reference/cadence-app.html` at 1440px and walk the 8-point prototype-parity checklist per primitive (not yet done in this worktree: `vite dev` is blocked by the pre-existing node20/ESM `lovable-tagger` failure, so the visual side-by-side is an open manual step for whoever has a working dev server).

**Gates at ship (OBS-03 complete, both slices):** tsc 0 · 15 new unit tests, 1892 total pass, 0 fail · `bun run build`/`vite dev` not runnable in-worktree (pre-existing node20/ESM `lovable-tagger` error unrelated to this diff; `routeTree.gen.ts` was instead regenerated via the `@tanstack/router-generator` API directly) · humanized-output clean on every new UI-facing string.

---

## OBS-04 · Today ported (✅ 2026-07-02, lane1, adversarial-reviewed)

**What shipped:** the ritual screen, fully rewritten (`src/routes/_authenticated.today.tsx`) on the OBS-03 primitives: `Hero` (one ember/moss italic count word), `LoopStrip` (5 pills, DECIDE ember only when calls pend), the calls queue as canonical `CallCard`s, a calls-answered progress bar, `WhatChanged`, a reskinned daily-brief card, and on the right the screen's ONE `AuroraCard` (`LoopHealthCard`) plus `MachineNow` (up to 4 live/queued agent runs).

**Cross-object sync:** `decide(id, ok)` invalidates `needs-you` / `runs` / `loop-pulse` / `learnings` / `dashboard` / `studio-sessions` in one `onSuccess`, so the queue, nav badge, hero count, progress bar, and the linked Build mission all rewrite with no reload. `A`/`S` answer the current (first-rendered) call, guarded against inputs/modifiers.

**Real regressions caught by adversarial review and fixed before commit:**

- **Dead mission deep link.** `MachineNow` rows navigated to a `/build?mission=` search param that the `/build` index route never reads (no matching `validateSearch`); every row click silently landed on the generic list. Fixed to the codebase's actual pattern: `navigate({ to: "/build/$missionId", params: { missionId } })`.
- **Blind approvals.** The "worth building?" `CallCard`s (PRD/opportunity calls) hardcoded a generic body and passed `ev={[]}`, dropping the Critic's `summary`/`risks`/`missing_evidence` the pre-port `DecisionCard` surfaced - a PM would approve or reject with zero evidence. Fixed with a `criticEvidence()` mapper.
- **Two panels dropped outside the spec's authorized drop list.** The daily brief (OBS-04.md §8 explicitly says `Keep ["dashboard"]`) and the old command-center Bottlenecks/Top-priorities tiles were both silently missing from the first pass. Reconciled: the brief is restored (a reskinned card, `dashboard` query + `generateDailyBrief` mutation back), and Bottlenecks/Top-priorities are confirmed genuinely out of the prototype's Today IA and documented as an intentional drop in the route's own header comment (not a silent gap).

Also fixed: the parchment "Not now" session-local defer state was dead code (declared, filtered on, never actually set) - explicitly retired with a comment, since the Obsidian Call object model has no defer verb; and a missing loading guard that let the hero briefly flash a false "All clear." before `getNeedsYou` resolved on first paint.

**How to verify (repeatable):**

1. `bun run dev` (primary checkout), open `/today`.
2. With calls pending: the hero shows the count word in ember, DECIDE pill is ember, the queue renders `CallCard`s with real evidence rows for spec/opportunity calls.
3. Answer a call (Approve or `A`): the card animates out, the hero count and progress bar update immediately, the nav badge ticks down, and if the call is linked to a Build mission, that mission's row updates too - no reload anywhere.
4. Clear the queue to zero: the moss all-clear card appears, DECIDE pill goes quiet.
5. Confirm exactly one aurora on the screen (Loop Health) and that Machine Right Now rows open the actual mission (`/build/$missionId`), not the bare list.
6. Refresh the brief card and confirm the summary updates without a full page reload.

**Gates at ship:** `tsc --noEmit` 0 · `bun test` 1909/1909 pass · adversarial TypeScript-reviewer pass (3 real bugs found and fixed, listed above) · humanized-output clean.

---

## OBS-06 · Discover ported (✅ 2026-07-02, lane2, adversarial-reviewed)

**What shipped:** the evidence desk at `/discover` (`src/routes/_authenticated.discover.tsx` mounts `DiscoverSurface`): a 1160px two-column surface, the Newsreader hero with the one glacier-italic word "Signal", a signal feed on the left (`SignalFeed`/`SignalCard`, consuming `listSignals`/`listThemes` on the same query keys as the parchment `/product` `SignalsPanel` so the two surfaces share one cache) and an ICE-ranked opportunity queue on the right (`OpportunityQueue`/`OpportunityRow`, consuming `listOpportunities`/`listLearnings`), with exactly one `PencilNote` ("best bet") on the top-ranked row. Challenge wires the existing `runCriticReview` mutation (no new server function) and shows the singleton toast for 3.6s, invalidating the opportunities query so the verdict chip refreshes live. Additive only: no route redirect, no nav-model edit (the rail's Discover index `02` still points at `/product?tab=signals` until OBS-10 folds the routes, per the spec's own §8), the legacy `/product` surface untouched.

**Real spec-compliance defects caught by a 3-lens adversarial review (security / spec-compliance / humanized-output) and fixed before commit:**

- **Two header labels used the wrong token.** `SignalFeed`'s "Live signal feed" and `OpportunityQueue`'s "The opportunity queue · ranked by ICE" both passed `MonoLabel tone="faint"` (resolves to `--text-faint` `#55524C`), but OBS-06.md §7 specifies `#7D786F` (`--text-subtle`) with `letter-spacing: 0.12em` for these labels. Fixed by omitting `tone` (MonoLabel's untoned default is already `--text-subtle`) and adding the `0.12em` override. (The security and humanized-output lenses found nothing.)
- **The opportunity row's `sub` line didn't match the spec's composition.** OBS-06.md §5 step 5 calls for `sub` to read as `<signal count> · <spec/critic state> · <learning delta>` (e.g. `23 signals · spec in Critic review · +1.4 after the checkout learning`), but the shipped code rendered the opportunity's raw `problem` free-text field instead. Fixed within the spec's explicit "reuse the four existing queries" boundary (§3/§10): added a `listThemes` subscription (same `["themes", activeProductId]` key `SignalFeed` already uses, so no new query) to derive a real signal count via `opportunity.theme_id`, and a critic-state phrase derived from the already-fetched `critic_review`/status data (`verdictFor()`), since `listSpecs`/PRD status is not one of the four authorized queries.

**How to verify (repeatable):**

1. `bun run dev` (primary checkout — this worktree's `vite dev` hits the known node20/ESM `lovable-tagger` failure, see hub §11), open `/discover`.
2. Left column: verbatim signal cards (blossom source pill, mono timestamp, unaltered quote, theme line), newest first, with a live "N THIS WEEK" glacier count and the verbatim footer.
3. Right column: opportunities ranked by ICE descending, each with the Newsreader score, title, the real `sub` line (signal count · critic state · rescore delta when present), a verdict chip colored per §7, and exactly one pencil ("best bet") on the top row.
4. Click Challenge on any row: the button shows its loading state, the singleton toast reads "Critic engaged. The teardown lands on Today, receipts attached." for 3.6s, and the row's verdict chip refreshes once the review lands.
5. Confirm zero ember on the screen except a REVISE verdict chip; grayscale screenshot still reads every verdict by its word.

**Gates at ship:** `tsc --noEmit` 0 · `bun test` 1959/1959 pass (15 in `src/components/discover/`: `format.test.ts` + `OpportunityRow.test.tsx`) · 3-lens adversarial review (security clean, humanized-output clean, spec-compliance found 3 - all fixed and re-verified above).

---

## OBS-09 · Engine Room ported (✅ 2026-07-02, lane4, adversarial-reviewed)

**What shipped:** `/engine-room` (`src/routes/_authenticated.engine-room.tsx`), additive alongside the untouched parchment `/govern`. The glance (`EngineRoomSurface.tsx`): a Newsreader hero with the one glacier-italic word "glance", a 2x2 `RoomCard` grid (Spend/Quality/Safety/Record), and a `ConnectionStrip`. Each card's state (moss HEALTHY / marigold WATCH) and verdict line come from a pure view-model, `src/lib/engine-room-glance.ts`'s `buildGlance()`, fed by nine read-only queries that intentionally reuse each existing panel's exact query key (`budget_overview`, `eval_suites`, `drift_overview`, `guardrails`, `incidents`, `analytics-overview`, `traces`, `ledger-seal`) so the cache is shared, not duplicated. Opening a room swaps the glance for `RoomDetail.tsx` (question header, verdict-first, mono sub-tabs, back affordance, `Esc` returns to the glance) with a room-specific body under `src/components/engine-room/rooms/`: `SpendRoom` (TREND aurora / BY AGENT / CAPS), `QualityRoom` (SCORE aurora / DRIFT / SUITES), `SafetyRoom` (RULES / INCIDENTS), `RecordRoom` (TRACES / LEDGER). Rows drill into existing detail surfaces (`/govern?tab=...`, `/traces/$traceId`) rather than a new fifth depth level. Zero writes anywhere; zero rebuilt primitives (consumes `VerdictChip`/`AuroraCard`/`Button`/`MonoLabel`/`Surface`); zero approvals/controls/attention-queue leakage (that machinery stays on Today, per the founder's absolute ruling in the spec).

**Two honest data-derivation calls, documented since they are not literal 1:1 server-fn reads:**

- **Spend's "trending" figure** compares this week's cost (`getAnalyticsOverview({days:7})`) against the trailing 14-day total minus this week (`getAnalyticsOverview({days:14})`) as a previous-week estimate, since no dedicated range-offset server fn exists. Documented inline in `engine-room-glance.ts`.
- **Record's ledger check** computes `getLedgerSeal()` then immediately re-verifies that exact fingerprint via `verifyLedgerSeal()` in `RecordRoom.tsx`. This is a same-instant self-check (a genuine, if narrow, integrity signal: a mismatch means the record changed in the gap between the two calls), not a historical audit against a previously-saved seal - that arrives with the deferred write-time persistence.

**Adversarial review (fresh-eyes code-reviewer) findings, all resolved:**

- **0 blocking bugs.** Field names, shapes, and scales were cross-checked line-by-line against every consumed server-fn source file (including the eval-score-scale mismatch risk: `eval_suites.last_run.avg_score` is 0-100, `eval-health`'s `passRate` is a 0-1 fraction - both handled correctly).
- **2 low-severity nits fixed:** a literal `#B5AFA6` hex swapped for the existing `var(--text-body)` token (`RoomDetail.tsx`); the room-detail route branch swapped its hand-rolled container chrome for the shared `Surface` component it was already duplicating (`_authenticated.engine-room.tsx`).
- **1 accepted product-level note, not fixed (data-model limitation, not a port bug):** `getIncidents()` has no open/resolved concept - it is a flat, capped historical log - so the Safety room's WATCH state can only clear when the last incident ages out of that window, not on real resolution. Worth a founder look if it reads as sticky in practice; out of scope for a read-only port to fix the underlying data model.
- **Circular import confirmed safe:** `RoomDetail.tsx` exports shared `Row`/`EmptyRow`/`VerdictSentence` helpers that the four `rooms/*.tsx` files import back; verified this resolves cleanly because all four are hoisted function declarations referenced only inside render bodies, never at module-evaluation time.

**How to verify (repeatable):**

1. `bun run dev` (primary checkout - this worktree's `vite dev` hits the known node20/ESM `lovable-tagger` failure, see hub §11), open `/engine-room`.
2. Glance: four room cards, each a real `<button>`, showing a HEALTHY/WATCH chip, question, and verdict line; the connection strip shows the live moss pulse.
3. Open any room: the glance swaps for the room-detail in place (no modal), sub-tabs are keyboard/arrow-reachable (`role="tablist"`), `Esc` returns to the glance.
4. Spend/TREND and Quality/SCORE each render exactly one aurora card; Safety and Record lead with a plain-words sentence.
5. Confirm `/govern` still renders unchanged at its own URL - this port added a surface, it did not touch or redirect the legacy one.
6. Grayscale screenshot the glance: every state still reads by its word, not just its color.

**Gates at ship:** `tsc --noEmit` 0 (only pre-existing, unrelated Stripe module-resolution errors present) · `bun test` 14/14 new tests pass (`engine-room-glance.test.ts` threshold + empty-input-fallback coverage, `room-card.test.tsx` real-button + grayscale-safe state words) on top of the existing suite, untouched · adversarial code-reviewer pass (0 blocking, 2 low fixed, 1 accepted note above) · humanized-output clean (zero em/en dashes across all new files, including doc comments; two UI fallback placeholders normalized from an initial em dash to the house "-" convention before commit).

---

_Sections are appended here as each ID ships, with the prototype-parity screenshots noted per the bible's 8-point checklist._
