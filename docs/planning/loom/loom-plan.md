# Loom · the production-readiness build bible (group G16)

> _Created: 2026-07-04 · Last updated: 2026-07-04_

**What this is.** The execution plan for the founder's 2026-07-04 mission
(`docs/Readiness Audit & Consumer Production grade`): the final
consumer-grade transformation. The design law is
[`/DESIGN-LOOM.md`](../../design/archive/loom-v4.md) (v4, additive over Obsidian v3).
The evidence base is in this folder:
[`audit-master-inventory.md`](./audit-master-inventory.md) (81 routes, 96
features, defect register, copy issues, design principles) and
[`audit-quality-register.md`](./audit-quality-register.md) (security, a11y,
performance, architecture, language — 12 blockers, 28 majors). Every wave item
below cites them; an agent picking an item reads its register rows first.

**Founder rulings folded in (2026-07-04 overnight):** never mimic v1/v2/v3,
additive only; everything visible and logically bucketed, zero url-only
features; renames where logical; Today must not overwhelm (triage grouping +
My-day strip + productivity via the existing tasks object); the memory moat
becomes a living knowledge graph (flagship); desktop-first canvas; enterprise
B2B polish bar (Linear/Stripe/Vercel); full autonomy, park founder-only items
with recommended closures.

**Gates per wave:** tsc 0 · build green · tests 0 regressions · visual verify
on the dev server (Playwright) · restraint budget + grayscale on changed
surfaces · humanized-output law on every new string. Commit + push per wave
(Lovable auto-deploys; goal doc §5 mandates continuous publish).

## Shipped already (W0, 2026-07-04)

- `3549fc2e` prettier sweep, code only (~7,800 findings cleared; md excluded).
- `24fccc59` dormant-payments crash chain (stripe.ts probe + BillingBanner +
  checkout.return) + audio.functions.ts cross-tenant workspace write blocked.
- `41d4b3b1` portal theme fix: `data-obsidian` rides `<html>` under the
  authenticated layout; every Radix/sonner/cmdk portal now inherits the dark
  theme (live-verified on the dev server).

## W1 · Shell + foundation (single lane; touches nav-model, AppShell, TopBar, styles.css, router, palette-catalog)

1. **v4 token layer**: append a `LOOM v4` block inside the `[data-obsidian]`
   scope in `src/styles.css` implementing DESIGN-LOOM §2 (light/depth), §3
   (ember layered tokens), §4 (type scale + lightened ink ramp), §5 (easing
   tokens), §6 (thread gradient token), §4b (container tiers as vars).
   Overrides v3 values in place (later-in-sheet wins); no component may keep
   a hex.
2. **Router foundation**: `defaultPendingComponent` (canvas-colored shimmer
   skeleton) + `defaultPendingMs` tuning in `src/router.tsx`; QueryClient
   defaults (staleTime 30s, sensible refetchOnWindowFocus). Kills the blank
   black frames (quality register PERF blockers 7-8).
3. **AppShell v2** (`src/components/cadence/AppShell.tsx` + `nav-model.ts` +
   tests): grouped rail per DESIGN-LOOM §8 — THE LOOP (01-05) · THE ENGINE
   (Engine Room, Trust Ledger, Connections) · footer (Settings · Admin
   role-gated · user chip menu: Profile / Plan & billing / Sign out). The
   door hover-menu retired; thread active indicator; remove the theme toggle
   (dark-only law) and the machine-view toggle from chrome (the `?view=machine`
   param stays); kill the weather/geo widget (CORS-dead in prod, wrong data).
4. **Chrome quiet**: ONE ambient status line (DESIGN-LOOM §9b); the
   checkout-preview banner renders on billing surfaces only;
   `PaymentTestModeBanner` restyled to tokens.
5. **⌘K catalog completeness** (`src/lib/palette-catalog.ts`): every
   destination, Engine Room room, Settings pane, Trust Ledger, Calendar tab,
   Prompt Studio, Admin.
6. **URL rename**: `/knowledge` → `/brain` (route file rename, permanent
   redirect, internal link repoint, tests). Founder-flagged in the report.

## W2 · Surfaces (parallel lanes; disjoint files; each lane also fixes its surface's register rows: states, copy, a11y, params)

- **W2-TODAY** (`_authenticated.today.tsx` + `components/today/`):
  DESIGN-LOOM §8b — triage-grouped calls (kind groups, top card featured,
  "N more" inline expanders, expiring-first), My-day strip (meetings today ·
  tasks due · Focus-next via re-homed `FocusNext.tsx`), quick capture
  (Discover composer write path), tasks resurrection (quick add/complete on
  the strip; `tasks.functions.ts` CRUD has zero UI today), "Later" defer verb
  on calls IF the approvals schema supports it cheaply (else document), the
  1.5-screen budget, remove the top-bar "Attention" duplicate.
- **W2-ENGINE** (`_authenticated.engine-room.tsx`, `components/engine-room/`,
  `_authenticated.govern.tsx`, room components): fold `/govern`'s live tabs
  into the four rooms' detail pattern (extensions §5); `/govern` becomes
  redirects; kill prototype-literal numbers (honesty law); fix
  `/observe`/`/prompts` mis-mappings; Prompt Studio reachable (Quality or
  Record room tab); repoint `/traces` drills; honest telemetry copy.
- **W2-BUILD** (`_authenticated.build.*`, `components/missions/`,
  `components/studio/`): port `/build/$missionId` detail to v4 tokens (it is
  parchment on the golden path); honest telemetry ("Loop stalled", "7.07%")
  reframed with meaning; spend figures reconciled to one source.
- **W2-PLAN** (`_authenticated.plan.tsx`, `_authenticated.prds.$id.tsx`,
  `components/plan/`): re-home the spec editor at `/plan/spec/$id`
  (redirect from `/prds/$id`), port it to v4 (it is the feature-densest
  parchment island), unify PRD→Spec vocabulary on every user-facing string.
- **W2-BRAIN** (`_authenticated.knowledge.tsx`→brain + `components/knowledge/`):
  tab merges (Insights+Impact, Changelog+Docs), lazy-load tab panels (the
  527KB chunk, PERF blocker 9), workspace-scoped counts; hosts W3.
- **W2-DISCOVER**: param validation (honor tab/focus), copy fixes, verify
  the garbled Critic string's write path (`runCriticReview` + insight
  templates) and guard template interpolation.
- **W2-SETTINGS** (`_authenticated.settings.tsx`, `components/settings/`,
  `components/connections/`): section param fixed (accept `?section=` AND
  legacy `?tab=`, deep links work), Plan & billing bridge (user chip →
  `?section=plan` renders plan + upgrade honestly), fake Connect button
  fixed to real state or honest "not wired" (honesty law), Connections
  one-home rule with `/sync` (bindings home) cross-linked not duplicated,
  Products management with progressive disclosure (single-product invisible
  default; auto-create default product on workspace creation; auto-assign
  product_id on capture paths — founder ruling).
- **W2-ADMIN** (`_authenticated.admin.*`): the error-as-empty-state epidemic
  (destructive mutations must surface failures; pricing pane gets
  loading/error states); v4 tokens.
- **W2-AUTH** (`login/signup/forgot/reset`): labels + ids + autocomplete
  (a11y blockers), contrast fixes, pricing→signup param threading
  (plan/credits/billing honored through signup), checkout.return logged-out
  handling.

## W3 · The living graph (flagship; rides W2-BRAIN)

DESIGN-LOOM §7. `d3-force` (new dep, BBI: commodity physics lib) + Canvas2D
renderer replacing `GraphExplorer`'s static SVG as the primary view (SVG tree
stays as the reduced-motion/a11y path). Node kinds → v4 role colors; edges as
threads; supersession shimmer; focus dim; hover cards; the time scrubber over
`validFrom`. 60fps at 500+ nodes (label virtualization). Truth law: only real
edges, ever.

## W4 · Cross-cutting sweeps (after W2 lands)

- Language: the ~45 copy issues + the 4 terminology splits from the master
  inventory; humanization violations from the quality register.
- A11y: remaining contrast tokens, headings per surface, keyboard-map guard
  when dialogs are open (CommandPalette major), MonoLabel tone floor.
- Performance: polling consolidation (AppShell x3), context memoization
  (use-workspace), font self-hosting decision.
- Identity/SEO: strip Lovable fingerprints (og:image, twitter handle,
  hardcoded lovable.app URLs, default description); landing prerender check.
- Architecture: route-level error boundaries (root default + layout), the
  eval-tick chokepoint bypass (route through runtime.server.ts — CHOKEPOINT
  claim is pinned; coordinate or document), silent plan-tier fallbacks, the
  top-up cap fallthrough, RLS prd-consistency checks on the three 20260703
  migrations.

## W5 · Production validation loop + seed (LAST)

Publish → Playwright E2E golden paths on `cadence-flow-beta.lovable.app`
(login → Today triage → Discover challenge → Plan spec → Build mission →
Brain graph → Engine Room → Settings) → fix → repeat until stable. Clean the
live-DB test debris ("This is an Test Message - By RG") via Lovable MCP once
authorized (or the UI as the demo user). THEN the rich demo seed (goal §6).

**Round 1 DONE (2026-07-04, `7174acbc` pushed):** full live tour of every
surface; 8 fixes shipped (headline: the main-wide `tnum` punctuation bug that
broke every sentence's readability; the visible Ask door in the rail —
founder ruling). The ranked remaining catalog (18 rows + the data-sweep
list, each re-verified against the post-publish bundle) lives in
[`live-qa-round-1.md`](./live-qa-round-1.md) — **round 2 starts at the top of
that table and must not re-tour what its verification notes already clear.**

## Parked for the founder (each with the recommended closure)

1. Lovable MCP OAuth — URL issued 2026-07-04 ~04:15 IST; click to enable
   live-DB/log verification. Recommended: authorize once, morning.
2. Light theme — recommend LATER; one flagship dark done world-class.
3. Stripe go-live keys — unchanged; engine stays dormant by design.
4. `/knowledge`→`/brain` + `/prds/$id`→`/plan/spec/$id` renames — done with
   permanent redirects; flag per OBS-10 §13 rename gate.
5. Deeper standalone task-manager — recommend NO; the Today strip + existing
   tasks object covers the PM need without a second tool.
