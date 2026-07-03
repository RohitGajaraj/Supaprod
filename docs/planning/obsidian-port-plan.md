# Obsidian port · build bible (group G14)

> _Created: 2026-07-02 · Last updated: 2026-07-02_

**What this is.** The per-ID build specs for porting every authenticated app
surface to the v3 "Obsidian" design system, per the founder's 2026-07-02
doctrine ruling. The design definition is DONE; this is the execution plan.
Any lane can pick an unblocked ID cold.

> **Finest-grain layer (2026-07-02).** Each ID now has a **self-contained
> build+implementation spec** in [`obsidian-port/`](./obsidian-port/): open
> [`obsidian-port/OBS-0X.md`](./obsidian-port/README.md#8-the-per-item-index)
> for the complete package - what, why, how (step by step), the structure, the
> exact design elements, and every rename/restructure/modification - written so
> an agent picks it cold and needs no other file. The shared design DNA, the
> current-codebase map, the dependency graph, and the IA route-fold target live
> once in [`obsidian-port/README.md`](./obsidian-port/README.md) (the foundation
> hub). **This file stays the fast one-paragraph-per-ID index; the folder is the
> depth.** The dashboard G14 rows link straight to each spec.

**The doctrine chain (load before any ID):** invoke the `cadence-design`
skill, which loads [`/DESIGN-OBSIDIAN.md`](../../DESIGN-OBSIDIAN.md) (the law)
+ [`design-reference/obsidian-v3/`](../../design-reference/obsidian-v3/)
(tokens, `components.md`, `implementation-notes.md`, the runnable prototype)
+ [`design-reference/obsidian-extensions.md`](../../design-reference/obsidian-extensions.md)
(the stub specs: palette, Ask, Settings, onboarding, room details, charts,
micro-interactions, density, empty states).

**Standing constraints (every ID):**
- **THE PROTOTYPE IS THE FLOOR (founder ruling 2026-07-02, non-negotiable).**
  The shipped surface must be visually and behaviorally indistinguishable
  from `design-reference/obsidian-v3/design-reference/cadence-app.html` at
  1440px: layout, spacing, hierarchy, type sizes, colors, glows, motion
  timing, keyboard behavior, hover/press states, and the copy register.
  Anything we add goes ON TOP; additions never move, remove, restyle, or
  simplify what the prototype shows. "Close enough" or a reinterpretation is
  an automatic FAIL: a previous handoff round shipped something that
  diverged from the Claude Design reference and missed much of it; this rule
  exists so that never repeats. The LAST gate of every surface ID is the
  prototype opened side by side with the built surface, walking the parity
  checklist below, with screenshots in the ship report. Where the prototype
  and the contract text differ on a fine detail (a duration, a tint), the
  prototype's rendering is the founder-approved outcome for that surface;
  note the delta in the ship report so the contract can absorb it.
- Dark-only on app surfaces; the landing page (`/`, `p.$slug`) keeps parchment
  and is out of scope here.
- Surgical diffs; each ID gates on tsc 0 + build + tests + the grayscale test
  and restraint budget (contract §12.9) + `impeccable`; humanized-output law
  on every string.
- The port is surface-by-surface (founder-visible progress, revertible per
  surface), NOT a big-bang token flip. Mixed parchment/obsidian is expected
  mid-initiative and acceptable; the shell (OBS-02) flips first so the frame
  is coherent immediately.
- No feature work rides along. A port ID changes presentation and IA wiring,
  never server functions or data flow, except where an ID says otherwise.

## The prototype-parity checklist (run at the end of EVERY surface ID)

Open the prototype and the built surface side by side at 1440px and check:

1. Rail: 236px, mono index 01-05, active state bg #1A1A1E + ember index, the
   ONE Today badge, working shimmer line, Engine Room door, user chip.
2. Surface chrome: 52px top bar, container max-width (1060/1160), 36/32/64
   padding, `cadRise` entrance.
3. Type: hero Newsreader 34px with the one ember italic word; card titles
   20px/460; UI 13px/1.55; mono labels 9-9.5px caps with middots.
4. Color: zero hexes outside the tokens; ember only on needs-a-human moments;
   glows match (badge 0 0 10px, gate dot 0 0 10px 2px, moss/glacier dots).
5. Motion: hover 140ms one-step lift; slide-over `cadSlideIn` 240ms; screen
   entry 260ms; pulses/glows only on live status; reduced-motion kills all.
6. Behavior: keyboard map (1-5, g, Esc), call answering rewrites hero + badge
   + progress + linked mission, slide-over gate sync, toast 3.6s singleton.
7. Copy: the register matches (plain-words buttons, consequence helpers,
   mono-caps metadata, no em dashes, no exclamation marks).
8. Grayscale screenshot still reads; restraint budget audited.

## Sequencing

`OBS-01 → 02 → 03` are the foundation and strictly ordered. Surfaces
`04..09` parallelize after 03 (one lane per surface; claim in the dashboard).
`10` (IA consolidation) lands after the five surfaces exist. `11..14`
(palette, Ask, Settings, onboarding) follow 10. `15` (charts) rides with the
surfaces that draw data (05, 08, 09). Nothing here is founder-gated except
OBS-10's route renames (redirects make it safe, but the founder should know
the URLs change) and OBS-14's demo-seed dependency.

## The IDs

### OBS-01 · Tokens + fonts foundation
- **Context:** `src/styles.css` is parchment; Obsidian tokens live in
  `design-reference/obsidian-v3/tokens/*.css`.
- **Files:** `src/styles.css` (append an app-scoped token layer), font loading
  in the root route head.
- **Steps:** port the five token files verbatim as CSS custom properties
  scoped to the authenticated app root (for example `[data-obsidian]` on the
  `_authenticated` layout element, so the landing page is untouched); add the
  five Google-Font families (Newsreader, Schibsted Grotesk, JetBrains Mono,
  Codystar, Caveat; self-host later per implementation-notes); port the eight
  `cad*` keyframes + the reduced-motion gate; wire the density attribute
  (`data-density="comfortable|compact"`, extensions §8).
- **Acceptance:** every token resolvable under the app scope; zero visual
  change on the landing page; `prefers-reduced-motion` kills all animation.
- **Verify:** dev server; toggle reduced motion; grep no new hexes outside
  the token block.

### OBS-02 · The app shell (rail + top bar + keyboard) — ✅ shipped 2026-07-02 (lane1)
- **Context:** the current shell is parchment with lucide icons; the target is
  `components.md` § Shell + the prototype.
- **Files:** `src/components/cadence/AppShell.tsx` (or successor),
  `src/routes/_authenticated.tsx`.
- **Steps:** 236px rail on `--rail` with hairline; Butterfly mark (copy the
  three SVGs to `public/` or an assets module; ember state + `cadFlutter`);
  five nav items as mono index 01-05 + label (NO icons; remove lucide from the
  rail); the single Today badge (unanswered calls, hidden at zero); the ⌘K
  search affordance (stub until OBS-11); the shimmer working line; the Engine
  Room door button (mono `G` hint + state word); the user chip; the 52px top
  bar (surface title + date mono + workspace pill); the surface container
  (max-width 1060/1160, `cadRise` entrance); the keyboard map (1-5 surfaces,
  g Engine Room, Esc closes overlays; guarded per implementation-notes §4).
- **Acceptance:** shell matches the prototype at 1440px; keyboard map works;
  the ONLY ember in the chrome is the Today badge (+ active nav index).
- **Verify:** side-by-side with `obsidian-v3/design-reference/cadence-app.html`.

### OBS-03 · Core primitives — ✅ shipped 2026-07-02 (lane2, library + specimen route both done)
- **Files:** `src/components/obsidian/` (Button, StatusDot, VerdictChip,
  MonoLabel, Toast, SlideOver chassis, CallCard, MissionRow, AuroraCard,
  Citation chip, PencilNote) - a NEW folder, parallel to the parchment
  `src/components/cadence/Primitives.tsx` (which stays live until OBS-10
  folds the parchment routes; see OBS-03.md §6 for the reasoning).
- **Steps:** build each to the `components.md` anatomy exactly (values are in
  the file); the SlideOver carries the a11y contract (role=dialog, aria-modal,
  focus trap, restore-on-close, Esc, scrim click) delegated to
  `@radix-ui/react-dialog`, not hand-rolled; Toast singleton (replaces,
  never stacks); status dots always ship dot + mono word.
- **Acceptance:** a storybook-style demo route or test renders each primitive
  in every state (hover/focus/active/empty/loading/error where applicable).
  The 11 primitives + barrel shipped gate-green (tsc 0, 1889 tests, 5-lens
  adversarial review + verify pass, every confirmed finding fixed). The dev
  specimen route (`src/routes/_authenticated.obsidian-specimen.tsx`) shipped
  once OBS-02 released the `_authenticated.*.tsx` glob it had conflicted
  with; renders every primitive in every state (tsc 0, 1892 total tests).
  Full detail: [`../features/obsidian-port.md`](../features/obsidian-port.md)
  OBS-02 + OBS-03 sections.
- **Verify:** grayscale screenshot still reads; tsc + tests.

### OBS-04 · Today (the ritual)
- **Files:** `src/routes/_authenticated.index.tsx` (or the Today route) +
  Today components.
- **Steps:** hero (Newsreader 34px, count word in ember italic, rewrites as
  calls are answered); the Call queue (CallCard, cross-object sync with
  missions per implementation-notes §1); "What changed" with causes; the loop
  strip (SENSE→DECIDE→DEFINE→BUILD→LEARN pills with live counts; DECIDE goes
  ember only while calls pend); Loop Health aurora card (the screen's one
  aurora); "The machine right now" mini-list opening the mission slide-over.
- **Acceptance:** answering a call updates queue, badge, hero, progress bar,
  and the linked mission row without reload; all-clear state is the designed
  moss card; restraint budget audited.

### OBS-05 · Build (one cockpit) — ✅ shipped 2026-07-02 (lane3)
- **Steps:** mission list rows per anatomy (status dot · title · verdict chip
  when done · step label · cost); the mission slide-over (numbered steps,
  live pulses, inline gate as compressed CallCard, trace toggle with mono log
  lines + per-hop cost, footer strip); deep-link `?mission=` search param.
- **Acceptance:** gate answered in the slide-over syncs Today's queue; Esc and
  scrim close; trace lines show cost; slide-over is the app's ONE overlay depth.

### OBS-06 · Discover (the evidence desk)
- **Steps:** two-column 1160px; signal feed (source pill blossom + verbatim
  quote + theme line); ICE-ranked opportunity rows (Newsreader score, verdict
  chip, Challenge action, the single pencil annotation on the top bet);
  Critic verdict inline; column footers in the house voice.
- **Acceptance:** Challenge fires the Critic flow + toast; quotes verbatim
  with sources; max two pencil marks.

### OBS-07 · Plan (cited specs + outcome roadmap) — ✅ shipped 2026-07-02 (lane3)
- **Steps:** spec list (serif body in detail view, state chips, blossom cites
  count); NOW/NEXT/LATER columns (NOW ember-tinted, LATER dimmed), each bet
  carrying its mono measure line; commit-to-Now ceremony (a confirm with the
  promise + measure stated, per §8).
- **Acceptance:** every bet shows a measure; the ceremony copy passes the
  voice rules.

### OBS-08 · Brain (the record) — ✅ shipped 2026-07-02 (lane1)
- **Steps:** stat trio (Newsreader numerals + mono micro-labels) + "Export my
  record"; decisions with outcome verdicts; learnings with what-they-moved
  lines in glacier mono; belief-graph surface reuses the existing data flow.
- **Acceptance:** verdict chips only on outcomes; export works or is honestly
  absent (no dead control).

### OBS-09 · Engine Room (one door, four rooms)
- **Steps:** health summary + 2×2 room cards (name, state chip, question,
  verdict line); the room-detail pattern from extensions §5 (question header,
  verdict-first body, mono sub-tabs, four depth levels max); the connection
  strip with live pulse. Approvals never render here.
- **Acceptance:** every room card opens; nothing dead-ends; Engine-Room Test
  passes on every label.

### OBS-10 · IA consolidation (routes into five destinations) - ◐ shipped-partial 2026-07-02 (lane1, [~75%] - see feature-dashboard.md row + docs/features/obsidian-port.md for the full account of what folded and what was deliberately left live)
- **Context:** current routes (`/prds`, `/roadmap`, `/discovery`, `/agents`,
  `/traces`, `/evals`, `/guardrails`, `/drift`, …) must fold into Today /
  Discover / Plan / Build / Brain / Engine Room per contract §8.
- **Steps:** map every existing route to its destination (discovery→Discover;
  prds+roadmap→Plan; missions/build→Build; brain/knowledge→Brain; traces/
  evals/guardrails/drift/spend→Engine Room rooms); implement redirects from
  every legacy path; nav renders ONLY the five + door; orphaned surfaces get
  a placement-algorithm ruling (Call, Cmd+K, or a room), never a new nav item.
- **Acceptance:** no legacy URL 404s; the rail never exceeds five items;
  `routeTree.gen.ts` regenerated, not hand-edited.
- **Gate:** flag the URL renames to the founder in the ship report.

### OBS-11 · ⌘K palette + capability catalog (extensions §1) - ✅ shipped 2026-07-02 (lane1)
### OBS-12 · Ask (⌘J) panel (extensions §2) - ✅ shipped 2026-07-02 (lane1)
### OBS-13 · Settings four panes + Admin door (extensions §3) - ◐ shipped-partial 2026-07-02 (lane1, [~70%] - see feature-dashboard.md row + docs/features/obsidian-port.md for what remains)
### OBS-14 · Onboarding golden path (extensions §4; needs the demo seed live) - ✅ shipped 2026-07-03 (lane1 - see feature-dashboard.md row + docs/features/obsidian-port.md)
### OBS-15 · Chart grammar adoption (extensions §6; rides with 05/08/09) - ✅ closed 2026-07-03 (lane1 grammar module + lane3 closing pass - see feature-dashboard.md row + docs/features/obsidian-port.md)

For 11-15 the spec IS the extensions file section; each becomes a normal
feature-pair build (server fn reuse only; presentation new) with the same
gates as above.

## Done means

All five destinations + Engine Room render Obsidian; legacy routes redirect;
lucide is gone from app chrome; the landing page is untouched; every screen
passes the restraint budget + grayscale test; `docs/features/obsidian-port.md`
exists with the how-to-verify manual; the dashboard G14 rows and SSOT reflect
reality.
