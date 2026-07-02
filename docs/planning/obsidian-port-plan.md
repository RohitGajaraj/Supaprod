# Obsidian port · build bible (group G14)

> _Created: 2026-07-02 · Last updated: 2026-07-02_

**What this is.** The per-ID build specs for porting every authenticated app
surface to the v3 "Obsidian" design system, per the founder's 2026-07-02
doctrine ruling. The design definition is DONE; this is the execution plan.
Any lane can pick an unblocked ID cold.

**The doctrine chain (load before any ID):** invoke the `cadence-design`
skill, which loads [`/DESIGN-OBSIDIAN.md`](../../DESIGN-OBSIDIAN.md) (the law)
+ [`design-reference/obsidian-v3/`](../../design-reference/obsidian-v3/)
(tokens, `components.md`, `implementation-notes.md`, the runnable prototype)
+ [`design-reference/obsidian-extensions.md`](../../design-reference/obsidian-extensions.md)
(the stub specs: palette, Ask, Settings, onboarding, room details, charts,
micro-interactions, density, empty states).

**Standing constraints (every ID):**
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

### OBS-02 · The app shell (rail + top bar + keyboard)
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

### OBS-03 · Core primitives
- **Files:** `src/components/cadence/` (Button, StatusDot, VerdictChip,
  MonoLabel, Toast, SlideOver chassis, CallCard, MissionRow, AuroraCard,
  Citation chip, PencilNote).
- **Steps:** build each to the `components.md` anatomy exactly (values are in
  the file); the SlideOver carries the a11y contract (role=dialog, aria-modal,
  focus trap, restore-on-close, Esc, scrim click); Toast singleton (replaces,
  never stacks); status dots always ship dot + mono word.
- **Acceptance:** a storybook-style demo route or test renders each primitive
  in every state (hover/focus/active/empty/loading/error where applicable).
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

### OBS-05 · Build (one cockpit)
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

### OBS-07 · Plan (cited specs + outcome roadmap)
- **Steps:** spec list (serif body in detail view, state chips, blossom cites
  count); NOW/NEXT/LATER columns (NOW ember-tinted, LATER dimmed), each bet
  carrying its mono measure line; commit-to-Now ceremony (a confirm with the
  promise + measure stated, per §8).
- **Acceptance:** every bet shows a measure; the ceremony copy passes the
  voice rules.

### OBS-08 · Brain (the record)
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

### OBS-10 · IA consolidation (routes into five destinations)
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

### OBS-11 · ⌘K palette + capability catalog (extensions §1)
### OBS-12 · Ask (⌘J) panel (extensions §2)
### OBS-13 · Settings four panes + Admin door (extensions §3)
### OBS-14 · Onboarding golden path (extensions §4; needs the demo seed live)
### OBS-15 · Chart grammar adoption (extensions §6; rides with 05/08/09)

For 11-15 the spec IS the extensions file section; each becomes a normal
feature-pair build (server fn reuse only; presentation new) with the same
gates as above.

## Done means

All five destinations + Engine Room render Obsidian; legacy routes redirect;
lucide is gone from app chrome; the landing page is untouched; every screen
passes the restraint budget + grayscale test; `docs/features/obsidian-port.md`
exists with the how-to-verify manual; the dashboard G14 rows and SSOT reflect
reality.
