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

## OBS-05 · Build ported (✅ 2026-07-02, lane3, adversarial-reviewed)

**What shipped:** the Build cockpit fully ported to Obsidian: `BuildMissionRow.tsx` + `MissionSlideOver.tsx` (new, in `src/components/obsidian/`) + `build-status.ts` (new, pure status/verdict/gate-copy mapping) + a rewritten `src/routes/_authenticated.build.index.tsx`. Mission list rows (status dot · title · verdict chip when done · step label · cost) replace the parchment list; a `?mission=` deep-linkable slide-over (numbered steps, live pulses, the inline gate as a compressed `CallCard`, a raw-trace toggle with per-hop cost) replaces the old full-page detail view. The Composer stays functional. Zero lucide.

**Data flow:** read-only server fns per spec; the one mutation is the pre-existing `decideApproval`. Answering a gate invalidates `["needs-you"]`/`["dashboard"]`/`["studio-sessions"]`/`["studio-session",missionId]` so Today's queue, the mission row, and the slide-over all update together with no reload.

**Real regressions caught by adversarial review (3 lenses: correctness, design/prototype-parity, accessibility) and fixed before commit:**

- **Critical - disjoint status vocabularies.** The slide-over header read `missions.status` while the row read `agent_runs.status`. `missions.status` uses `"blocked"` for a gate-waiting mission (never `"waiting_approval"`) and only catches up to a decision ~60s later via the `resume-runs` cron - so the header could silently fall through every branch to a false "SHIPPED" for up to a minute after any gate answer, including a reject. Fixed by deriving the slide-over header from the latest run's own status (mirroring the row) and hardening both mapping functions so any unrecognized value fails safe to "queued", never a false "done".
- **Restraint-budget violation.** The Composer's Start button was ember, but the hard law reserves ember for the one gate CTA per screen - Start and a gate's Approve could both be visible at once. Fixed to a neutral `--surface-raised` treatment.
- **Copy drift.** The gate-consequence string used a period where the spec's exact copy requires a middot separator. Fixed verbatim.
- **Accessibility gap.** Each step's status dot carried `word=""` + `aria-hidden`, giving screen-reader users no indication of step state. Fixed to carry the real `STATUS_WORD`.

Also caught and fixed mid-build: a `perl -CSD` encoding mistake had mojibake-corrupted several middots into `Â·` across 4 files - caught by an em-dash/mojibake self-check before the adversarial review and cleanly reverted.

**How to verify (repeatable):**

1. `bun run dev` (primary checkout), open `/build`.
2. Mission rows show the status dot, title, verdict chip (only once done), step label, and cost.
3. Click a row: the slide-over opens with `?mission=<id>` in the URL; numbered steps show live pulses for the in-progress step.
4. If the mission is gate-waiting, the inline gate renders as a compressed `CallCard`; answering it updates the slide-over header, the row, and Today's queue together with no reload, and never shows a false "SHIPPED" immediately after.
5. Toggle raw-trace: each hop shows its own cost in the mono log lines.
6. Confirm the Composer's Start button is neutral, not ember, when a gate CTA is also visible.

**Test-coverage note (repo constraint, not a gap):** `MissionSlideOver` itself uses `useQuery`/`useMutation`/`useToast`, none of which can run without a mounted React tree, and this repo has no jsdom/React-Testing-Library dependency (the same constraint `__tests__/primitives.test.tsx` documents). All the pure derivation logic it calls into is unit-tested in `build-status.test.ts`; the hook-driven behaviors (trace-toggle reset on `missionId` change, live query invalidations) are the spec's own §12 "Manual checks" tier.

**Gates at ship:** `bunx tsc --noEmit` 0 · `bun test` 1936/1936 pass (50 new obsidian-scoped tests, up from 41 pre-review) · adversarial 3-lens review (4 real issues found and fixed, listed above) · humanized-output clean.

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

## OBS-07 · Plan ported (✅ 2026-07-02, lane3, adversarial-reviewed)

**What shipped:** the definition desk at `/plan` (additive — `/product`/`/prds` keep their current parchment behavior and share the exact same query keys until OBS-10 folds the routes), mounted via `Surface` (`wide`) at 1160px: the outcome-roadmap hero, a Now/Next/Later `RoadmapColumns` (each `BetCard` carrying its mono measure line, an ember `NEEDS OUTCOME` chip when the bet has no declared outcome+measure, and three quiet move controls), a `CommitCeremony` dialog that reuses `commitRoadmapItem`'s existing governance contract (states the promise when both fields are already set, collects them first otherwise), and a cited `SpecList` opening a read-only `SpecDetail` slide-over with inline `[n]` citation chips rendered at their exact position in the Newsreader-serif body (a `splitCitationMarkers` pure split feeding a custom `ReactMarkdown` paragraph renderer, reusing the OBS-03 `Citation` chip rather than a separate literal margin column).

**Real defects caught by a 3-lens adversarial review (correctness / design-parity / accessibility) and fixed before commit, 6 total, 2 high-severity:**

- **Accessibility, high — the focus ring was silently killed on the two most-used controls.** `BetCard`'s NOW/NEXT/LATER move buttons and `SpecList`'s full-row spec buttons each carried both a Tailwind `focus-visible:outline-2` class and an inline `style={{outline:"none"}}` — inline styles always win, so a keyboard user tabbing through either control saw zero focus indicator. Fixed by moving `outline-none` into the className so the `focus-visible` variant can take effect as intended.
- **Accessibility — the commit ceremony's outcome/measure inputs had no accessible name**, only a placeholder (which is not reliably announced by all assistive tech and disappears once the user types). Fixed with visible mono `<label htmlFor>` elements.
- **Accessibility — the three loading states (roadmap, spec list, spec detail) were silent to screen readers.** Fixed with `role="status"` + visually-hidden (`sr-only`) text alongside the existing ghost/shimmer skeletons (kept, per the spec's own no-spinner requirement).
- **Design, high — `SpecDetail`'s error state was dead code.** `prd` is `undefined` during both loading and error, so `!prd` was true in both cases and the loading branch always won; a failed `getPrd` fetch showed an infinite shimmer with no error message and no way to retry. Fixed by checking `isError` first.
- **Design — the spec-detail shimmer never actually animated.** `cadShimmer` only animates `background-position`; it needs to pair with `--shimmer-gradient` at `280% 100%` background-size (the pattern `AppShell.tsx` already establishes) — the skeleton bars had a flat `--hover` background with no gradient, so the "one shimmer budget" this surface is allotted rendered as three static gray bars. Fixed to match the token's documented pairing.
- **Design — the page had no entrance animation.** The hand-rolled `className="cadRise"` container matched no CSS rule (only the bare `@keyframes cadRise` exists); the shared `Surface` primitive (built in OBS-02 for exactly this — the `wide` variant is 1160px for Discover/Plan) applies the animation correctly via inline style. Fixed by switching to `<Surface wide>`.

**How to verify (repeatable):**

1. `bun run dev` (primary checkout — this worktree's `vite dev` hits the known node20/ESM `lovable-tagger` failure, see hub §11), open `/plan`.
2. Now/Next/Later columns: Now has the ember header + ember-tinted card border; Next is neutral; Later is the deep `#0E0E10` card with dimmed ink. A bet with no declared outcome shows the ember `NEEDS OUTCOME` chip.
3. Click `NOW` on a Next/Later bet: the commit ceremony opens; if outcome/measure are missing, both inputs (with visible labels) must be filled before `Commit to Now` enables; confirming refreshes the roadmap and shows the toast.
4. Click `NEXT`/`LATER` on a bet: it moves immediately, no ceremony, with a toast.
5. Click a spec row: the detail slide-over opens with the serif body, inline citation chips at their `[n]` position (hover/focus shows the verbatim quote + source), and a quiet `Open full spec →` link to the existing editor.
6. Tab through the whole surface with a keyboard only: every move control, spec row, and dialog control shows a visible glacier focus ring.
7. Confirm zero ember on the screen except the Now column tint, the `NEEDS OUTCOME` chip, and the ceremony's CTA; grayscale screenshot still reads every chip and measure by its text.

**Gates at ship:** `tsc --noEmit` 0 · `bun test` 1988/1988 pass (15 new in `src/components/plan/format.test.ts`) · `eslint` 0 on all new files · humanized-output grep (em/en dash, banned words) clean · 3-lens adversarial review (correctness clean, design-parity found 3 - fixed, accessibility found 4 - fixed, re-verified above).

---

## OBS-08 · Brain ported (✅ 2026-07-02, lane1, adversarial-reviewed)

**What shipped:** the Brain (formerly Knowledge) surface fully ported to Obsidian (`src/routes/_authenticated.knowledge.tsx` + components), built on the OBS-03 primitives and spec OBS-08.md:

- `BrainStatTrio` - pure `deriveBrainStats()` + render: three Newsreader numerals (CALLS MADE / VALIDATED % / ICE MOVED) + mono-micro labels, with "Export my record" button (markdown download via `getImpactLedger`) + empty-record instruction with a quiet "Go to Today →" link (reads `var(--text-subtle)`, hovers to `--text-primary`).
- `BrainTabRow` - an Obsidian inline tab bar (no parchment `TabRow` primitive exists in OBS-03) with mono-caps labels, active state bg `--raised` + text `--text-primary`, inactive text `--text-subtle`, and hover `--hover` on inactive tabs per spec §7.
- `DecisionsPanel` - the decisions list (source/status filters + search) with inline Approve/Send back actions on pending rows. **LogDecisionDialog fixed VIOLATION #2:** replaced parchment `.btn`/`.input`/`.mono-label` classes with Obsidian `Button` variant=secondary + MonoLabel + proper `--card`/`--hairline` tokens and `--text-subtle` copy color.
- `OBS_STATUS_TONE` map - decisions (approved→KEPT / rejected→KILL / pending→PENDING) for the VerdictChip tones; exported for test coverage.
- `DecisionDetail` - the drill detail (single-decision view) reuses parchment styling until OBS-10 folds it.
- `CompoundingPanel` - learnings/outcomes (the "what moved" moat-vis feed) with `VERDICT_TONE` map (validated→VALIDATED / missed→MISSED / mixed→REVISE). **Exported VERDICT_TONE** for test coverage.
- **Product brain count strip** (lines 248–295 in route) - live connector count includes a **cadPulse 2s glacier glow dot** (per spec §5 step 9) + glacier tone on the connector stat value (VIOLATION #4 fixed).
- `GraphPanel` - the graph/list toggle with **hover:[background-color:var(--hover)]** on inactive buttons (VIOLATION #6 fixed).
- `BrainStatTrio` - empty-record instruction includes **"Go to Today →" link** with quiet styling (VIOLATION #3 fixed).

**Adversarial review - 6 spec-compliance violations found and fixed before commit:**

- **VIOLATION #1 (TabRow parchment)** ✅ Fixed: replaced undefined parchment `TabRow` reference with local `BrainTabRow` component implementing correct Obsidian styling (active: `--raised` bg + `--text-primary` text; inactive: transparent + `--text-subtle`; hover: `--hover`).
- **VIOLATION #2 (LogDecisionDialog parchment)** ✅ Fixed: replaced `.btn-primary`/`.btn-ghost`/`.input`/`.mono-label` classes + `--ink-subtle` token with Obsidian `Button` variant=secondary, `MonoLabel`, and proper Obsidian form styling (`--card` bg, `--hairline` border, `--text-primary` text).
- **VIOLATION #3 (empty-record missing link)** ✅ Fixed: added "Go to Today →" Link component to BrainStatTrio's empty-record state with proper focus/hover styling (`--text-subtle` / hover `--text-primary`).
- **VIOLATION #4 (Product brain glacier misapplied)** ✅ Fixed: moved `tone="glacier"` from "Product brain" label to connector count; added **cadPulse 2s glacier glow dot** (spec §5 animation) next to the live-connector value.
- **VIOLATION #5 (test coverage)** ✅ Fixed: exported `OBS_STATUS_TONE` (decisions) + `VERDICT_TONE` (learnings); added 8 unit tests covering decision/learning verdict tone mappings + key existence assertions; all 1923 tests pass.
- **VIOLATION #6 (GraphPanel hover)** ✅ Fixed: added `hover:[background-color:var(--hover)]` Tailwind class to inactive GRAPH/LIST toggle buttons per spec §7 interaction states.

**How to verify (repeatable):**

1. `bun run dev`, open `/knowledge`.
2. With no decisions/learnings: the moss-tinted card appears with instruction "Your track record starts with the first call. Answer one on Today." + blue quiet link "Go to Today →" (no Ember, no dead controls).
3. With decisions: the stat trio renders (numerals + labels), decisions panel shows rows with VerdictChip (moss KEPT, madder KILL, neutral PENDING per mapping), inline Approve/Send back buttons on pending rows.
4. With learnings: CompoundingPanel feeds the what-moved lines (glacier mono ICE delta + verdict chips), each row drills to `?learning=`.
5. Product brain strip: connector count shows **glacier glow dot + count value in glacier**, other stats in `--text-primary`. Tab row (Insights/Calendar/Memory/Learnings/Decisions/Graph/Docs) shows active bg `--raised`, hover on inactive → `--hover`.
6. Graph toggle: GRAPH/LIST buttons, inactive state hovers to `--hover` background.
7. Log decision dialog: all UI uses Obsidian tokens + Button/MonoLabel (no .btn/.input classes, no `--ink-subtle`).

**Gates at ship:** `tsc --noEmit` 0 · `bun test` 1923/1923 pass (all new tone-mapping tests passing) · adversarial TypeScript+spec-compliance reviewer pass (6 spec violations found and fixed before commit) · humanized-output clean · hex gate (all colors read `var(--tokens)`).

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

## OBS-10 · IA consolidation (◐ shipped-partial, 2026-07-02, lane1)

**What shipped:** `src/lib/legacy-redirects.ts` (new) - the single source of truth mapping every legacy path to its canonical fold target, plus `CANONICAL_PATHS` (the six primary destinations) and `DOOR_INTERNAL_PATHS` (Settings/Admin/onboarding/Trust Ledger/Connectors and the surfaces this pass deliberately kept live, see below). `legacy-redirects.test.ts` (new) asserts every target resolves to a canonical or door-internal path, never another legacy key (no 404s, no chains). `nav-model.ts` reshaped: Discover -> `/discover`, Plan -> `/plan` (both off the interim `/product?tab=` scope OBS-02/06/07 carried until this landed); the Engine Room door -> `/engine-room`; `ENGINE_ROOM_LINKS` drops Approvals (Calls live on Today only) and points Spend + the bare Engine Room link at the new glance's Spend room. `nav-model.test.ts` updated for the final-state invariants (5 unique canonical routes, no `/chat`, door + links resolve live). `CommandPalette.tsx`'s hardcoded Navigate entries re-pointed. `_authenticated.today.tsx`'s `LOOP_SURFACE_TO` map fixed - its LoopStrip pills were silently still targeting `/product?tab=` after OBS-06/07 had already shipped the real `/discover`/`/plan` routes.

**Canonical-path inversion, confirmed against the real shipped code (spec step 1's own contingency, both branches fired):** the spec's default assumption was Brain = `/brain` and Engine Room (door) = `/govern`. Neither holds. OBS-08 reskinned `/knowledge` in place - no `/brain` route was ever created. OBS-09 built a NEW route `/engine-room` "additive alongside the untouched parchment `/govern`" (its own file comment), and every room's `onOpen` still navigates into `/govern?tab=X` for the deeper drill - so `/govern` is not legacy cruft to fold away, it is a live detail layer the new glance itself depends on.

**~25 already-stub legacy routes re-pointed to their final canonical target or flattened off a stale 2-hop chain:** `/discovery`, `/opportunities` -> `/discover`; `/prds` (bare), `/roadmap` -> `/plan`; `/memory`, `/docs`, `/learn`, `/outcome`, `/calendar`, `/meetings` (+ `$id`) -> `/knowledge`; `/tasks`, `/inbox` -> `/today`; `/evals`, `/eval-health`, `/drift`, `/guardrails`, `/budgets`, `/analytics`, `/observe`, `/prompts` -> `/engine-room` (room-specific where a room maps cleanly - Quality for evals/drift, Safety for guardrails, Spend for budgets/analytics). `/cockpit`, `/agents`, `/swarm`, `/governance`, `/studio` (+ `$missionId`), `/notifications`, `/briefing`, `/integrations` were already correct - no change needed.

**Two real, pre-existing bugs fixed along the way (not part of the spec's own scope, found during the re-point pass):**

- `/learn` redirected to `/knowledge?tab=calendar` instead of `?tab=learnings` - a copy-paste drift from `/calendar`'s own redirect, silently sending every `/learn` bookmark to the wrong tab since whenever it was introduced.
- `/outcome` chained through `/learn` and, because `/learn`'s own redirect hardcoded its tab, silently dropped `/outcome`'s own `tab=outcomes` param entirely. Both bugs compounded on each other. Fixed by flattening `/outcome` directly to `/knowledge?tab=learnings`.

**`/eval-health` converted from a full render to a stub** (the one genuine `[render→stub]` conversion this pass completed) after verifying it was safe: `QualityRoom`'s Score view reads the exact same `getEvalHealth()` query (pass rate, trend, verdict) and its Suites view lists every suite with a trend arrow; the one piece of eval-health.tsx's content not reproduced there (the flaky-suite % breakdown) is still reachable one click deeper at `/govern?tab=evals`, which `QualityRoom`'s own Suites rows already navigate into.

**Deliberately NOT folded - `[~25%]` of the spec's mapping table remains, each verified against the real shipped code, not assumed from the spec's abstract table, to carry live functionality its Obsidian replacement does not yet have:**

- `/product` - `DiscoverSurface`'s own file comment says it is explicitly additive; capture, bulk import, cluster, promote, draft-spec, lineage, and delete all still live only on `/product`. Folding it would delete every write action Discover lacks.
- `/prds/$id` - the full PRD editor (AI assist, GitHub issue creation, task graphs, design scaffolding, Linear issue creation, Studio dispatch). Plan's `SpecDetail` is explicitly read-only and itself links here ("Open full spec ->").
- `/traces`, `/traces/$traceId` - Engine Room's own `RecordRoom` navigates here for trace detail; `/govern?tab=traces` is a second live consumer.
- `/missions` (bare) - hosts `LoopHealthBanner`, `MissionsCostGlance`, and `ReliabilityGlance`; none of the three exist on `/build` yet.
- `/missions/$missionId` - 1399 lines vs `/build/$missionId`'s 530; not a verified duplicate, likely carries content the newer page lacks.
- `/stakeholder` - audience-specific pack generation (exec/eng/board tabs, copy/download); Plan's roadmap view has no equivalent.
- `/impact` - the impact-ledger detail view; not verified redundant with Brain's simpler `BrainStatTrio` export, despite sharing the same `getImpactLedger` data source.
- `/changelog` - Brain has no "record"/changelog-equivalent tab yet.
- `/fleet`, `/delegate` - agent-capacity and delegation-queue views with no Build equivalent.
- `/chat` - the Ask panel (OBS-12) does not exist yet. Redirecting this away now would delete AI chat with no replacement; OBS-12 owns this fold.

**FOUNDER-GATE (per OBS-10.md §13, URL renames):** the renames that DID land are live now (`/discovery`→`/discover?tab=`, `/roadmap`+`/prds`→`/plan`, several engine-adjacent routes→`/engine-room`). The eleven surfaces above are deliberately still on their old parchment URLs pending feature parity - flagged here for founder review; folding them is real feature work (giving Discover/Plan/Build/Brain the missing capability first), not wiring, and is explicitly out of OBS-10's charter per its own §3 Scope OUT.

**How to verify (repeatable):**

1. `bun run dev`, paste each re-pointed legacy URL into the address bar (e.g. `/discovery`, `/roadmap`, `/learn`, `/outcome`, `/tasks`, `/evals`) and confirm a single-hop landing on the correct destination/room with no flash, no 404.
2. Confirm the rail shows exactly five destinations (Today/Discover/Plan/Build/Brain) + the recessed Engine Room door, and pressing `g` opens `/engine-room` (not `/govern`).
3. On Today, click each LoopStrip pill and confirm Discover/Define now land on `/discover`/`/plan`, not `/product`.
4. Confirm the eleven surfaces listed above still render their full legacy content at their old URLs (no accidental redirect was introduced for them).

**Gates at ship:** `tsc --noEmit` 0 · `bun test` 2008/2008 pass (25 new: 5 in `legacy-redirects.test.ts` + the updated `nav-model.test.ts`) · humanized-output clean · manual crawl of every re-pointed route confirmed one-hop, no 404, no chain.

---

## OBS-11 · ⌘K command palette + capability catalog (✅ 2026-07-02, lane1)

**What shipped:** `src/components/cadence/CommandPalette.tsx` fully rewritten as the glass ⌘K palette, superseding the parchment cmdk-based one. Built on Radix `Dialog` (the same primitive `SlideOver.tsx` already vendors for the mission slide-over's focus-trap contract) rather than a hand-rolled trap. Four mono-caps sections in order - JUMP, ACT, ASK, CATALOG - over one flattened, arrow-key-navigable row list; `Enter` runs the active row, `Esc`/scrim-click closes, `⌘K`/`Ctrl+K` toggles, and the existing `cadence:open-cmdk` window event still opens it (the rail's "Jump to" affordance keeps working unchanged).

**New pure modules (no JSX, no server import, unit-tested without React):**

- `src/lib/palette-catalog.ts` - `CatalogEntry` type + `CATALOG` (10 seeded capabilities, each a plain-words pitch and a `run` target that is either a route or a client event, never a server call) + `filterCatalog(query)` (case-insensitive substring match, stable order).
- `src/lib/palette-sections.ts` - `JUMP_DESTINATIONS` (mirrors `nav-model.ts`'s `PRIMARY_NAV` five canonical routes verbatim, read-only) and `ACT_VERBS` (Challenge a belief, Connect a source, Answer the current Call, Ask about this screen).
- `src/lib/palette-recents.ts` - a client-only recents helper (`sessionStorage`, key `cadence:recents`, capped at 3, deduped by id). No recents source existed before this; per the spec's own risk note, shipping an empty/small recents slot is acceptable, adding a server fn for it is not.

**Behavior:** empty query shows the 5 JUMP destinations plus up to 3 recents; typing filters JUMP/ACT/ASK/CATALOG live against the same query. Selecting a JUMP or CATALOG row navigates and closes the palette; selecting ACT/ASK dispatches a `window` `CustomEvent` (e.g. `cadence:open-ask`) before closing. The ASK row and the "Ask about this screen" ACT verb both fall back to `navigate({ to: "/today" })` since OBS-12 (the Ask panel) has not shipped yet and has no listener - the row is never a dead end. `GotoShortcuts` (same file, unchanged export) needed no route-map fix: OBS-10 had already corrected `nav-model.ts`'s `PRIMARY_NAV`/`ENGINE_ROOM_DOOR` to the canonical five + `/engine-room`, and `GotoShortcuts` reads those directly.

**Restructuring:** deleted all 13 `lucide-react` icon imports and every `cmdk` `Command.*` usage from this file (the file now imports zero lucide). Confirmed `cmdk` the package is still genuinely used elsewhere (`src/components/ui/command.tsx`, consumed by `ProductBindingPicker.tsx`/`BindingPicker.tsx`), so only this file's usage was removed - the package itself was left untouched, per the spec's explicit scope boundary.

**How to verify (repeatable):**

1. `bun run dev` (primary checkout - this worktree hits the known node20/ESM `lovable-tagger` failure, confirmed again this session), press `⌘K`/`Ctrl+K` from any authenticated surface.
2. Empty query: JUMP shows Today/Discover/Plan/Build/Brain with hints 1-5; up to 3 recents follow once any exist.
3. Type a verb ("challenge", "connect", "ask") and confirm ACT/ASK rows appear; type a catalog word ("belief", "signals", "spend") and confirm a CATALOG row with a "Try it" action appears.
4. Arrow keys move the active row (wrapping both directions); the active row shows `#1A1A1E` background, an ember mono index, and the glacier focus outline. `Enter` runs it.
5. Type a nonsense string and confirm the exact instruction copy renders, never a blank panel.
6. Confirm `Esc`, scrim click, and running any row all close the palette, and that the rail's own "Jump to" trigger (`cadence:open-cmdk`) still opens it.

**Test-coverage note:** the component itself (Radix Dialog, keyboard wiring, DOM rendering) is not unit-tested - this repo has no jsdom/React-Testing-Library dependency, the same constraint every other Obsidian component doc in this file documents. All the pure logic it depends on (`filterCatalog`, the five-destination invariant, every catalog/JUMP route's validity, `ACT_VERBS` non-emptiness) is covered in `palette-catalog.test.ts`.

**Gates at ship:** `tsc --noEmit` 0 · `bun test` 2032/2032 pass (9 new) · humanized-output clean (zero em/en dashes, no banned words) · `cmdk`/lucide grep clean on the rewritten file.

---

## OBS-12 · Ask (⌘J) summonable AI panel (✅ 2026-07-02, lane1)

**What shipped:** Ask is now a 420px right-docked panel over any screen, not the full-page `/chat` destination. `src/lib/ask-context.tsx` (`AskProvider`/`useAsk`): open/closed state, the `⌘J`/`Ctrl+J` toggle (a modifier combo, so it fires even with focus in an input, unlike the bare `1`-`5`/`g` rail shortcuts), and `contextForPath` - a pure mapper from the current route to a plain-words label ("Today", "Discover", "a mission" when `?mission=` is open on `/build`, "the Engine Room" for both `/engine-room` and `/govern`). `src/lib/ask-sse.ts` (`parseSseLine`): the pure half of the `/api/chat` SSE reader, split out specifically so the status/meta/delta routing is unit-testable without a mounted tree. `src/components/obsidian/AskPanel.tsx`: header (`ASK` mono label + glacier context chip + Close), the thread (`AskUserTurn` right-aligned on `--surface-card-deep`, `AskAiMessage` with `ChatMarkdown` body + blossom-cited sources + time/cost mono footer + "How I got this" expandable trace with the model id), the three-word shimmer-while-thinking status (never a spinner), and the composer (auto-growing textarea, Enter sends, Shift+Enter newlines, Esc closes the panel).

**Data flow (strictly read-only, per spec):** `/api/chat`'s streaming protocol, the classifier, mission dispatch, and research pipeline are all consumed byte-identical - zero server changes. The panel mints one scratch `createConversation` per session (not surfaced in any threads list, since the panel has no threads rail - that was an explicit calm-front reduction, not an oversight).

**Mounted once** in `_authenticated.tsx`, wrapping the existing provider stack with `AskProvider` and floating `AskPanel` as a sibling of the shell (excluded from onboarding, matching the existing `CommandPalette`/`GotoShortcuts` pattern). `AppShell.tsx`'s rail shimmer working line now reads `useAsk().isOpen` and yields while Ask is open, honoring the one-shimmer-per-screen restraint budget.

**`/chat` retired:** `_authenticated.chat.tsx` (the 1558-line parchment page) converted to a `beforeLoad` redirect to `/today`; `/chat` moved from `legacy-redirects.ts`'s "deliberately not folded" list (where OBS-10 explicitly parked it, since this panel didn't exist yet) into the actual redirect map. `PRIMARY_NAV` already had no Ask entry - OBS-02/OBS-10 removed it ahead of this item, so no nav-model change was needed here.

**A real regression caught and fixed before commit:** the first cut of `parseSseLine` treated a `JSON.parse` failure the same as "not a data line" (returned `null`), which would silently drop an event whose JSON payload was split across two stream `read()` calls - a real bug the original `chat.tsx` reader had explicitly guarded against (re-buffer the line and wait for more data). Fixed by giving parse failures their own `{ kind: "parse-error" }` variant, distinct from `null`, so `AskPanel`'s loop re-buffers exactly like the retired reader did.

**Ember CTA:** stays dark in this port. `/api/chat` has no structured "the answer proposes action X" field, and inventing one would be server-side feature work outside this item's scope (flagged per OBS-12.md §13 as a future item). The one case that exists today - a dispatched mission - surfaces as a glacier "Track the mission →" link instead of an ember button, since the mission is already running and needs no further human gate.

**How to verify (repeatable):**

1. `bun run dev` (primary checkout - this worktree hits the known node20/ESM `lovable-tagger` failure, confirmed again this session), press `⌘J`/`Ctrl+J` from Today, Discover, Plan, Build, Brain, and the Engine Room.
2. Confirm the context chip reads "About: Today" / "About: Discover" / etc, and "About: a mission" when a mission slide-over (`?mission=`) is open on Build.
3. Ask a real question; confirm a live shimmer status appears while thinking, then the answer streams in with source chips, time, and cost.
4. Click "How I got this" and confirm the trace expands with the model id and sub-queries.
5. Confirm `/chat` redirects to `/today` and the rail's "N agents working" shimmer disappears while the panel is open.
6. Esc closes the panel and restores focus to whatever had it before.

**Test-coverage note (repo constraint, not a gap, same pattern every other Obsidian slide-over documents):** `AskPanel` itself uses `useServerFn`/`useAsk`/DOM streaming and this repo has no jsdom/React-Testing-Library dependency, so component-level behaviors (⌘J toggle, Esc close, focus trap/restore, shimmer render) are the manual-check tier. All the pure logic is unit-tested: `ask-sse.test.ts` (status/meta/delta/done/ignored/parse-error routing) and `ask-context.test.ts` (every `contextForPath` mapping, including the mission and fallback cases).

**Gates at ship:** `tsc --noEmit` 0 · `bun test` 2053/2053 pass (20 new) · humanized-output clean (zero em/en dashes, no banned words).

---

## OBS-13 · Settings four panes + role-gated Admin door (◐ shipped-partial, 2026-07-02, lane1)

**What shipped:** `src/lib/settings-sections.ts` rewritten from 5 groups + one recessed Advanced group to exactly four panes (`you` / `workspace` / `connections` / `plan`), per the Obsidian four-pane law (no recessed fold). Every original `SectionId` and the `?section=` deep-link contract, including the legacy `brief`/`calendar` aliases, are preserved byte-identical - `health` and `data` (formerly Advanced) now live in You; `ai` (AI & keys) moved into Workspace. `settings-sections.test.ts` rewritten for the four-pane invariants (18 tests).

`_authenticated.settings.tsx`'s outer chrome re-skinned: a quiet left index inside the content column (mono `01`-`04` + label, active row `#1A1A1E` + ember index) replaces the parchment `TabRow` + recessed pill, with zero lucide in this route's chrome. Two small deep-inline lucide usages (a `Trash2` delete-key button, a `Compass` brief-label icon) were swapped for mono text/no-icon, since removing them didn't require touching the surrounding tab bodies.

**New:** `src/hooks/use-density.ts` - the You-pane density toggle (Comfortable/Compact), writes `data-density` on the `[data-obsidian]` root and persists to `localStorage`, no server call. An `AdminDoor` component on the Workspace pane, gated by `useQuery(["am-i-admin"])`, rendering a quiet "Admin console →" link only when `amIAdmin` returns true.

**Connections pane** now renders both shelves the spec calls for: **Yours** (`AccountConnectionsSection`, unchanged) and **This workspace's** (`WorkspaceBindingsSection`, lifted directly in from `/sync` - the spec's own explicit fallback for when OBS-10 hasn't folded that route yet, which it hasn't). `ConnectionRow.tsx` had its lucide icon tile replaced with a mono monogram and its `Trash2`/`X` icon buttons replaced with plain mono text ("Remove" / "×").

`_authenticated.admin.tsx` re-skinned to the room pattern: a Newsreader question header ("Who runs this workspace, and what is it costing?"), mono sub-tabs with a glacier underline as the active signal (no lucide `Shield`, no parchment `SurfaceHeader`/`TabRow`), and 2 of 8 tab labels renamed to pass the Engine-Room Test (Observability → Health, AI Costs → Spend; Pricing/People/Workspaces/Platform/Proof already read as plain-words answers). The `amIAdmin` gate and the one-time bootstrap `NoAccessCard` are unchanged in logic, re-skinned to Obsidian tokens.

**Deliberately NOT done, `[~30%]` remaining - each explicitly permitted to defer by this spec's own §13 risk note ("deep per-room redraw can ride the same pass if time allows, else note the remainder"):**

- **The full §8 connection-card anatomy.** `ConnectionRow` still renders its prior parchment `StepDot` status indicator, not the Obsidian glowing `StatusDot` (moss/marigold/madder) plus the `SCOPE · OWNER · LAST SYNC · PERMISSIONS` mono metadata line the spec's card anatomy calls for. The row's data and every action (Connect/Verify/Disconnect/Remove, the calendar multi-account sub-rows) work exactly as before; only the visual anatomy is not yet a full match.
- **The 7 admin sub-page bodies** (`admin.pricing`, `.people`, `.workspaces`, `.platform`, `.observability`, `.ai-costs`, `.proof`) keep their existing parchment-styled content untouched - per the spec's own explicit boundary ("No new admin capabilities... only their chrome and labels change"), and this pass only reached the shared layout, not each sub-page's own body.
- **The Plan pane** (`BillingTab`/`CreditsTab`) is not re-skinned to Obsidian cards; it renders its existing content as-is inside the new pane layout.

**How to verify (repeatable):**

1. `bun run dev` (primary checkout - this worktree hits the known node20/ESM `lovable-tagger` failure, confirmed again this session), open `/settings`.
2. Confirm the left index shows exactly `01 You` / `02 Workspace` / `03 Connections` / `04 Plan`, and every legacy `?section=` value (including `brief`, `calendar`) still lands on its original content.
3. In You, toggle density and reload - confirm it persists and the `[data-obsidian]` root's `data-density` attribute changes.
4. In Workspace, confirm the "Admin console →" link is absent for a non-admin account and present (opening the re-skinned `/admin`) for an admin account.
5. In Connections, confirm both "Yours" and "This workspace's" shelves render with their real data.
6. Open `/admin` as an admin: confirm the question header, mono sub-tabs with the Health/Spend renamed labels, and that switching tabs still loads each sub-page's existing content.

**Test-coverage note:** the Admin-door visibility logic (`if (!q.data?.isAdmin) return null`) and the density toggle's DOM/localStorage writes are not render-tested - this repo has no jsdom/React-Testing-Library dependency, the same constraint every other Obsidian component here documents. The pure grouping model (`settings-sections.ts`) has full coverage.

**Gates at ship:** `tsc --noEmit` 0 · `bun test` 2056/2056 pass (18 rewritten cases in `settings-sections.test.ts`) · humanized-output clean on every new/touched line · lucide grep clean on `_authenticated.settings.tsx`, `_authenticated.admin.tsx`, and `ConnectionRow.tsx`.

---

## OBS-14 · Onboarding golden path (✅ shipped, 2026-07-03, lane1)

**What shipped:** the five-screen Obsidian onboarding flow, replacing the parchment four-step `OnboardingFlow`. New `src/components/onboarding/ObsidianOnboarding.tsx` implements, in order: an un-numbered name pre-gate (reuses `getProfile`/`updateProfile`, not counted as one of the five); **Arrival** (the idle butterfly, a Newsreader 34px "Judgment, with receipts.", one ember Start); **track pick** ("STEP 1 OF 4", exactly three cards - solo/founding/tech - seeding via the existing `seedWorkspaceForTrack` mutation); **one connection** ("STEP 2 OF 4", a Connect shelf over the real provider registry with a per-row mono time estimate, plus an equal-weight "Use demo data instead" action); **point the Critic** ("STEP 3 OF 4", one pre-filled input, one ember "Challenge this"). Finishing calls `runCriticReview` -> `completeOnboarding` -> `markOnboarded` -> a `sessionStorage` just-landed flag -> `navigate({ to: "/today" })`.

**New:** `src/components/onboarding/ArrivalButterfly.tsx` renders the idle butterfly asset (copied byte-for-byte into `public/assets/butterfly-idle.svg`, never redrawn or recolored) through a new one-shot `cadArrive` keyframe (`src/styles.css`), then hands off to the same `cadFlutter` idle rest every other butterfly mark in the app already uses. The global `@media (prefers-reduced-motion: reduce)` rule already in `styles.css` zeroes both animations' durations, so reduced-motion support needed no separate code path - it falls out of the existing rule for free.

`src/components/onboarding/TodayCoachMark.tsx` (new) is the one coach mark the whole product shows: a glass panel (backdrop blur, glacier hairline accent) that anchors to the Today nav badge. Its show/hide logic is a pure, tested `shouldShowCoachMark(justLanded, dismissedBefore)` function - the DOM-touching parts (finding the anchor, reading/writing localStorage) are the established manual-check tier this repo's other Obsidian components already document (no jsdom/RTL dependency). `AppShell.tsx`'s `NavRow` gained a `data-coach-anchor` hook (a `today-badge` anchor on the badge itself, falling back to `today-badge-row` on the row when the badge is not currently rendered - e.g. zero pending calls at the exact moment of landing, which the spec's own risk note anticipated needing a stable selector). `_authenticated.today.tsx` reads a `sessionStorage["cadence.onboarding.justLanded"]` flag on mount and renders the mark once; this is the only edit this item makes to Today.

**Deletions:** the superseded parchment `OnboardingFlow.tsx` and its now-orphaned helpers - `TrackSelector.tsx`, `BasicDetailsStep.tsx`, `ConciergeContextStep.tsx`, `GettingStartedChecklist.tsx` - are all deleted (none had any remaining importer once the route swapped to `ObsidianOnboarding`), not left dual-live.

**Two honest deviations from the literal spec, both necessary:**

1. **The Critic input drives a real opportunity, not free text.** `runCriticReview`'s actual signature is `{target_kind: "opportunity" | "prd", target_id: uuid}` against an existing row - it has no free-text belief parameter, unlike what the spec's step 6 assumed. Since track-seeding always inserts at least one real opportunity (confirmed via `getTrackSeed`'s shape, the same data `TrackSelector`'s own "first teardown" preview read from), the flow calls `listOpportunities` right after seeding or connecting and pre-fills the input from that row's real title, keeping its id as the actual Critic target. The constant fallback belief only surfaces if a workspace genuinely has zero opportunities yet, in which case Finish still completes and lands on Today (the Critic call is simply skipped for that one edge case) - never a trap.
2. **One minimal new server fn:** `isDemoSeedEnabled` (`src/lib/onboarding/onboarding.functions.ts`), a read-only check of the same `ONBOARDING_SEED_ENABLED` env gate `seedWorkspace`/`triggerWorkspaceSeed` already honor. The spec's own acceptance criteria require the demo action to show a seed-unavailable line when the flag is off rather than a silent no-op click - no client-visible flag existed to make that call, so this is the smallest possible read that satisfies a hard, spec-mandated acceptance criterion, not feature work riding along. The demo action itself calls the existing `triggerWorkspaceSeed` (WM-S1) - the "rich" WM-S5 demo seed the spec's own risk note names does not exist yet; WM-S1 is the best real seed available today and is what the spec's risk note anticipated using.

**Verify (repeatable):** `bun run dev` (primary checkout) -> `/onboarding` -> confirm the butterfly fly-in/flutter, the three track cards, the connect shelf's time estimates plus the demo action, the pre-filled belief, and landing on `/today` with the coach mark anchored to the rail badge and "Got it" making it never return (persists in `localStorage`). Repeat with the OS/browser's reduce-motion setting on: the butterfly should render fully visible with no fly-in. Repeat with `ONBOARDING_SEED_ENABLED` unset: the demo action should be disabled with the seed-unavailable line, and Connect + Finish should still complete the flow.

**Gates at ship:** `tsc --noEmit` 0 · `bun test` 2070/2070 pass (6 new: `timeEstimateFor`'s named + fallback estimates, `FALLBACK_BELIEF`'s shape, `shouldShowCoachMark`'s three states) · humanized-output clean · zero lucide across every new file · `bun run dev`/`build` hit the pre-existing node20-vs-ESM `lovable-tagger` failure in this worktree (confirmed again, same as every prior OBS item) - the manual walk above is deferred to the primary checkout before publish.

---

## OBS-15 · Chart grammar adoption (◐ shipped-partial, 2026-07-03, lane1)

**What shipped: the full grammar module.** New `src/components/obsidian/chart.tsx` - the precise machine-data grammar, the reciprocal half of the parchment `Sketch.tsx` law (which Obsidian reverses: the machine draws exact, only a human draws pencil). Exports `ChartFrame` (the bare `<svg>` canvas, no border or fill of its own), `Axes` (slate hairlines at 40% opacity, mono 8.5px ash tick labels), `SeriesLine` (one exact `<polyline>`, straight segments, teal by default, zero jitter), `Benchmark` (a dashed cornflower/cobalt reference line), `NeedsHumanPoint` (the one ember marker a chart may ever carry), `Sparkline` (the drop-in obsidian replacement for `SketchLine`, deliberately keeping its exact prop shape - `data`/`color`/`w`/`h`/`baseline` - so a future call site swaps only its import), and `ChartTooltip`.

New `src/components/obsidian/pencil-mark.tsx` - the pencil layer, rough SVG, human marks only. `PencilCircle`/`PencilArrow`/`PencilUnderline`/`PencilLabel` reuse the deterministic `mulberry32` jitter engine copied verbatim from `Sketch.tsx`'s `sketchPath`, reduced to a single rough pass (no second stroke, no fill - a pencil mark is one motion of a hand, not a machine's two-pass sketch). Every mark takes an optional `seed` so neighboring marks do not share a wobble, and renders only in the three pencil inks (`PencilInk` from `pencil.tsx`, reused rather than re-invented: `best-bet`/`pet-feature`/`scope-creep` → lime/blossom/apricot). `PencilLabel` carries `role="note"` (matching `PencilNote`'s convention) since a pencil mark is content, not decoration. Both new files are barrel-exported from `src/components/obsidian/index.ts`.

**What did NOT ship: converting the three named surfaces - because none of them currently has a chart to convert.** The spec named Build's mission cost, Brain's stat-trio sparklines, and Engine Room's spend/quality/drift trends as the three surfaces to rewire. Reading the real, current code (not the spec's assumption) found:

- **Build** (`MissionSlideOver.tsx`, and its "Open full view" drill-down `CostPanel.tsx`): renders a plain per-run cost list with a mono total. No sparkline, no chart, no drawn mark of any kind exists here to convert.
- **Brain** (`BrainStatTrio.tsx`): renders three plain Newsreader numeral cells (`CALLS MADE` / `VALIDATED` / `ICE MOVED`). No trend line, no sparkline.
- **Engine Room**: the components that actually draw chart data - `AgentSpendDetail.tsx` (`SketchLine` for daily spend), `DriftPanel`, `AnalyticsPanel`, etc. - all render inside `/govern`, not `/engine-room`. `/govern` is confirmed still fully parchment: its route file imports lucide `Shield` and the parchment `SurfaceHeader`/`TabRow` primitives, with zero `@/components/obsidian` imports anywhere. OBS-09 built the new `/engine-room` door and its room cards in Obsidian, but did not port `/govern`'s own tab content - it remains the "internal detail/drill layer" every room's `onOpen` navigates into, exactly as OBS-10's investigation documented, just not yet re-skinned itself. Converting `AgentSpendDetail.tsx` would be converting a parchment route, which this spec's own scope explicitly rules out ("No parchment route... OBS-15 only stops the OBSIDIAN surfaces from using it").

**One near-fit, deliberately left untouched:** the Brain belief-graph edges (`GraphExplorer.tsx`, rendered on `/knowledge`'s graph tab via `GraphPanel.tsx` → `GraphCanvasView.tsx`). This genuinely is an obsidian surface (it inherits the `[data-obsidian]` token scope), and its edges already resolve to the correct obsidian tokens via CSS custom-property cascade - the `var(--madder, #b0573f)`-style fallbacks in that file are parchment-safe defaults that are never actually used once nested under `[data-obsidian]`, not a live parchment hex. Two reasons this was left alone rather than forced into the chart grammar: (1) a relationship graph's edges are a fundamentally different visual grammar than a data/trend chart - it is closer to a status indicator (superseded/retired) than a measured series, and the existing role-color use there (madder for a superseded edge) is defensible under the same convention `StatusDot` already uses for status, not a chart-series violation; (2) this exact file is under active, concurrent development - lane3's BRN-01 just shipped a contradiction-hotspots overlay on this same graph - so touching it now risked a real collision for uncertain benefit.

**Verify (repeatable):** the new grammar has no live call site yet, so there is nothing to walk in the browser today. To verify the module itself: import `Sparkline`/`SeriesLine`/`Benchmark`/`PencilCircle` from `@/components/obsidian` in a scratch component, feed each a small data array, and confirm visually that the machine series renders as a crisp straight line while a `PencilCircle` around the same point reads as hand-drawn graphite - the reciprocal grammar the whole item exists to establish. The next surface that needs a trend line (a likely fit: whenever `/govern` is eventually ported to Obsidian) should import from `chart.tsx` rather than reaching for `Sketch.tsx` or reinventing an SVG line.

**Gates at ship:** `tsc --noEmit` 0 · `bun test` 2099/2099 pass (17 new: `chart.test.tsx` covers `SeriesLine`'s teal default + color override + sub-2-point null guard, `Benchmark`'s dashed cornflower + out-of-range null guard, `NeedsHumanPoint`'s ember fill, `Axes`'s slate-40%-opacity pair, `Sparkline`'s exact vertex count + `SketchLine`-compatible prop shape; `pencil-mark.test.tsx` covers `PencilCircle`'s rough multi-vertex path + same-seed determinism + ink-only stroke, `PencilArrow`'s shaft-plus-two-barbs structure, `PencilUnderline`'s rough horizontal path, `PencilLabel`'s `role="note"` + pencil font + default rotation) · humanized-output clean · `bun run dev`/`build` hit the pre-existing node20-vs-ESM `lovable-tagger` failure in this worktree (confirmed again, same as every prior OBS item).

---

_Sections are appended here as each ID ships, with the prototype-parity screenshots noted per the bible's 8-point checklist._
