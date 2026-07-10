---
version: 4.0 "Loom" (design-system lineage: v1 tokens · v2 Ember Editorial parchment,
  landing-only · v3 Obsidian dark cockpit · v4 Loom, the lit instrument)
created: 2026-07-04
updated: 2026-07-07
name: cadence-loom
status: THE design contract for the product app. ADDITIVE over v3 Obsidian
  (DESIGN-OBSIDIAN.md): where this file speaks, it wins; where it is silent,
  v3's laws still apply. The public landing page stays on DESIGN.md (parchment).
origin: founder mission 2026-07-04 (docs/Readiness Audit & Consumer Production
  grade) + overnight rulings; quality baseline interfacecraft.dev +
  devouringdetails.com (the Puckett / Rauno Freiberg / Emil Kowalski school
  of design engineering); success bar Linear / Stripe / Vercel polish.
---

# Cadence Design v4 · "Loom" · Source of truth

> **Campaign addendum (2026-07-10, v13 Proof Campaign — additive, changes no law here):** during the launch sprint, every design decision also clears the **Love Gate with the founder's subtraction bar** ("most of the things are there, but it's too much overwhelming… partially cooked"): nothing on a fresh account's screen it doesn't understand, one receipted value moment in the first session, warm-or-honest on every panel (never empty). This operationalizes §0.1's doctrine for the 25-day ship; rulings + the gate: [`docs/strategy/v13-proof-campaign.md`](./docs/strategy/v13-proof-campaign.md) + [`docs/planning/v13-proof-campaign-plan.md`](./docs/planning/v13-proof-campaign-plan.md) §0. The landing page stays on `DESIGN.md` (its v13 content ruling is noted there).

v3 built the calm instrument: a jet-black cockpit where machine work glows and
only a needed human decision speaks ember. v4 keeps that soul and gives it
light, depth, and a living thread. The founder's complaints v4 exists to fix:
poor readability, harsh orange, weak typography, inconsistent interactions,
hidden UI, low hierarchy, lost premium feel. The founder's additions v4 exists
to deliver: every feature visible and logically bucketed; the memory moat made
visible as a living graph; enterprise-grade polish.

## 0. The idea

A dark instrument, lit by meaning. Three additions over v3:

1. Light: one ambient light source from above; surfaces catch it.
2. The thread: the loop and the memory graph share one connective line
   language; motion in the thread means the machine is alive, never decor.
3. Nothing hidden: the rail shows every home; depth stays on demand, but the
   doors are visible.

## 0.1 The Consumer Production Doctrine (v4.1, founder mission 2026-07-06) — READ FIRST, applies to EVERY surface

> This is the standing law behind the 2026-07-06 "make it consumer-shipping-ready"
> mission. It supersedes any earlier rule it contradicts. The quality bar is
> Linear / Stripe / Vercel: ultra-premium, calm, low-friction, never
> overwhelming. Every one of these applies to EVERY surface, not one screen.
> Run the whole product through each lens; when a surface fails a lens, fix it.

> **Two governing principles above all (founder ruling 2026-07-06):**
>
> **A. Authority to correct.** If a prior decision is wrong, fix it, even when
> it is enshrined in v3/v4, this contract, `AGENTS.md`, `CLAUDE.md`, or any
> design doc. Colors, shapes, positions, components, animations, type, tokens,
> naming, IA, all are changeable when a stronger solution exists. Do not
> preserve something merely because it is documented; documentation follows the
> better design, not the other way around. Update the docs in the same change.
>
> **B. Minimal never means fewer features.** Reducing overwhelm and clicks is
> NOT suppressing functionality. Every feature, every trace, every piece of
> information stays present and reachable. The craft is in the PRESENTATION:
> lead with what the user needs now, keep the depth one obvious disclosure away
> (collapse, tab, slide-over, "N more", Engine Room door), and let power reveal
> progressively. A surface that hides a real capability to look clean has
> failed; a surface that surfaces the essential and gracefully holds the rest
> has succeeded.
>
> **C. Rethink, do not just delete (founder ruling 2026-07-06, every surface).**
> Removing a slop tell (a side-stripe, a mono-caps wall) is necessary but NOT
> sufficient. After removing it, ask: what is the RIGHT way to present this
> information so it reads as a human analyst's insight, not machine output? Give
> it a genuine home, a hierarchy, and a felt voice: one clear spotlight for the
> hero read, calm supporting detail beneath it, real cards/components where they
> add clarity, and a human touch (pencil marks on charts, plain confident copy).
> The test is not "did the tell go away" but "does this now feel considered,
> insightful, and calm." Applies to EVERY surface, not the one being fixed.

**1. Affordance is decoupled from emphasis.** The restraint budget limits how
LOUD a thing is (emphasis), never whether it looks interactive (affordance).
Every interactive control carries structural affordance: a shape (padding +
radius) and either a fill or a border, so it can never be mistaken for a
label. The button hierarchy (primitive `Button` / CSS `.btn`):

- **Primary** (solid ember gradient, one per view): the main action.
- **Secondary** (`--surface-raised` + `--hairline-strong` border): the
  workhorse, unlimited per screen.
- **Tertiary** (transparent + border + hover fill): lowest-emphasis action,
  still unmistakably a button.
- **Link** (glacier text, underline on hover): genuine inline navigation only,
  never a primary action.
  All buttons use the UI voice in **sentence case, never uppercase mono**.
  Mono-caps is metadata (timestamps, counts, costs, status), never an action.
  **Banned: the borderless, transparent, mono-uppercase "text button."**

**2. Prominence & the spotlight.** Ask of every screen: "what deserves the
spotlight, and is it getting it?" A key insight, summary, takeaway, or brief
must NOT submerge into body text. It earns a `SpotlightCard` (lifted surface,
role-tinted glow field, gradient top-hairline). Prominence is decoupled from
restraint: a calm screen may still spotlight its one important message.
Prominence ladder: **Spotlight** (hero insight, aurora/glow, max 1-2 per
screen) → **Card** (structured content, raised surface + top-light) →
**Inline** (metadata, quiet).

**3. Aurora / gradient treatment (the flowing-light quality bar).** Score and
health moments use the `AuroraCard`: two large soft drifting orbs (110-130% of
the card, partly outside it, pill-radius, `closest-side` radial) + an outer
glow. This is the v3-prototype Loop Health quality bar. Gradients are
atmosphere and meaning, never decoration (the six legal homes in §2b).

**4. Reduce the mono-caps overwhelm (clean/premium, borrowed from v2's
cleanliness).** Obsidian's density of ALL-CAPS MONOSPACE reads as a control
room. Mono-caps is reserved for genuine metadata + short kickers. Section
headers, card titles, and content use the serif/UI voices. When in doubt,
fewer caps, more breathing room. The goal is a premium, editorial calm.

**5. Every feature has a home (discoverability).** No built feature sits
behind an unreachable route. Every capability is reachable from the rail, a
surface, the command palette (⌘K), or a clearly-labeled disclosure. Nothing
is url-only. If a feature has no home, give it one before shipping.

**6. Information architecture must make sense.** Group by user intent, not by
where there was space. Continuously ask: does this belong here? can it merge?
Settings holds what a user expects (account, workspace, connections, AI,
billing). Chrome names the thing a user thinks in (product/workspace context),
not internal nouns. Pricing lives on a marketing/plan surface, not buried.

**7. Naming & labels.** Buttons, messages, icons, and components are named for
the OUTCOME, not the mechanism (Engine-Room doctrine). Plain words a PM uses.
Consistent verbs across the platform (Approve / Send back, Keep / Drop, etc.).

**8. Zero AI-tells in everything displayed (hard, non-negotiable).** No em/en
dashes, no invisible Unicode, no AI-cliché phrasing in ANY string a user sees
OR anything the platform generates. This is already the humanized-output law
(`docs/conventions/humanized-output.md`); v4.1 restates it as a solid standing
instruction for every surface and every generated message.

**9. Impact-first PM language.** Lead with the outcome, put the metric in
support. Say "Ship this and checkout conversion should lift, (ICE 8.3)" not
"ICE 8.3 · revise." Numbers get a scope sentence (what it measures, over what
window). Never a bare raw score or a raw jargon code as the headline.

**10. Interaction smoothness & feedback (no waiting, no guessing).** Every
action answers instantly: press feedback (`loom-press` / active-scale), a
loading state on any async action (never a dead button), optimistic UI where
safe, a toast or inline confirmation on completion, and a designed skeleton
(never a blank frame) while data loads. Route transitions use the pending
skeleton. The user never wonders "did that work?" or "is it stuck?"

**11. Motion communicates meaning.** Subtle, purposeful, fast. Motion in the
thread/shimmer means the machine is genuinely alive; nothing animates for
decoration. Respect `prefers-reduced-motion`.

**12. The premium bar.** Consistent spacing on the 4px grid, aligned edges,
comfortable density, no vague or orphaned chrome. If a section (a rail footer,
a header, a control cluster) reads as hard, cramped, or floating, it fails the
bar. Fix alignment, spacing, and grouping until it reads intentional.

**Shared primitives that encode this doctrine** (use them, do not re-invent
inline): `Button` (affordance hierarchy) · `SpotlightCard` (prominence) ·
`AuroraCard` (score/health aurora) · `MonoLabel` (metadata only) · the `.btn`
CSS family. Building a bespoke inline button or a plain-text action is a
doctrine violation to be corrected on sight.

**13. Strategic screen positioning (anti-scroll).** Important content is not
buried under long vertical/horizontal scroll. What the user needs most sits
high and visible; secondary depth collapses (cards, collapsibles, tabs,
"N more" expanders, slide-overs). A surface should reveal its value in the
first viewport, not reward scrolling. When a section is long, restructure it
(group into cards, collapse the tail, promote the hero) rather than stacking.
No horizontal scroll on primary content; use the desktop width (§4b).

**14. Restore and use every designed element.** The v3 prototype carries
elements the live app dropped (e.g. the rail's gradient "N agents running ·
M queued" running-text; the machine-now presence line; aurora treatments).
Audit against the prototype HTML and restore what delivers value. Every built
feature is not just reachable (§5) but actively surfaced at the right place
and time, so the platform's power shows without a hunt.

**15. The knowledge graph is a living 3D universe.** The Brain / memory graph
is the flagship. It is not a flat 2D vector plane; it is a dark, smooth,
depth-lit constellation that reads as a universe of decisions and outcomes,
with gentle motion (drift, parallax, the supersession shimmer along threads).
Feed it enough data to feel alive. Role-color glows, thread edges, focus/story
on demand. This is a dedicated build tracked as its own initiative.

### The craft canon (the reference standards, installed as skills)

The founder's north-star references are vendored as usable skills and are the
craft bar for every surface: **`emil-design-eng` + `animation-vocabulary` +
`review-animations`** (Emil Kowalski / animations.dev — the motion standards),
**`design-taste-frontend` / `minimalist-ui` / `high-end-visual-design`** (the
Taste-Skill anti-slop set), and **`impeccable`** (the .kiro-native build, the
desloppification catalog). The interaction-feel north-star is **Rauno
Freiberg's craft gallery (rauno.me/craft** and its essays "Invisible Details of
Interaction Design", "Designing Depth", "Novelty"): the bar for how every
action should feel, responsive, physical, spatially consistent, elite. Invoke
the fitting skill before building a surface.
The load-bearing rules distilled from them, enforced everywhere:

- **Motion (Emil's standards).** Only animate `transform` + `opacity` (GPU;
  never `width`/`height`/`margin`/`top`). Strong custom curves (our tokens
  already match): `--ease` = `cubic-bezier(0.23,1,0.32,1)` (ease-out, entering/
  exiting), `--ease-in-out` = `cubic-bezier(0.77,0,0.175,1)` (on-screen move),
  `--ease-drawer` for drawers. **Never `ease-in` on UI. Never `scale(0)`** (start
  `0.95` + opacity). UI motion **under 300ms** (press 100-160, popover 125-200,
  dropdown 150-250, drawer 200-500). CSS **transitions, not keyframes**, for
  anything rapidly re-triggered (interruptible). **Never animate a
  keyboard/command action** seen 100+/day. Press feedback: `scale(0.97)` on
  `:active`. Popovers scale from their trigger; modals from center. Stagger
  30-80ms. `prefers-reduced-motion` is mandatory (keep opacity/color, drop
  movement).
- **Contrast (impeccable).** Body text ≥ 4.5:1, large ≥ 3:1, placeholders 4.5:1.
  Light-gray-body-on-tinted-near-white is the #1 AI-slop tell and the reason
  text reads "hard": push meaningful text toward the ink end (`--text-body`+),
  never `--text-faint` for anything that carries meaning.
- **Cards are not the reflex answer** (impeccable). Use a card only when it is
  genuinely the best affordance; **nested cards are always wrong.** Prefer the
  prominence ladder (§2): spotlight the hero, keep the rest quiet.
- **Absolute anti-slop bans** (impeccable, enforced on sight): NO colored
  **side-stripe borders** (`border-left`/`right` > 1px as an accent on cards,
  rows, callouts) — use a full hairline, a background tint, or a leading
  indicator instead; the one allowed exception is a single thin ember
  needs-a-human marker, used sparingly. NO decorative **gradient text**
  (`background-clip:text` on a gradient) except the one live-machine shimmer.
  NO em/en dashes anywhere (§8).
- **Type & layout** (impeccable): hero display ≤ 96px, display letter-spacing
  ≥ -0.04em, `text-wrap: balance` on h1-h3 + `pretty` on prose, body measure
  65-75ch, a semantic z-index scale (dropdown → sticky → modal → toast →
  tooltip), never arbitrary 9999.
- **Three dials** (Taste-Skill): tune VARIANCE / MOTION / DENSITY to the
  surface; the tell is the uniform reflex (one identical treatment on
  everything), not any single choice.

**16. Charts wear a human hand (founder ruling 2026-07-06).** Data viz must
not read as sterile machine output. Graphs, charts, sparklines, and their
annotations carry a light hand-drawn / pencil-sketch touch: abstract, clean,
minimal, with the human mark (a pencil circle around the point that matters, a
Caveat-font note, a slightly organic stroke), never a stock charting-library
look. The primitives already exist and are the standard: `PencilNote`,
`PencilCircle`/`PencilArrow`/`PencilUnderline`/`PencilLabel`
(`src/components/obsidian/pencil-mark.tsx`), the `--font-pencil` (Caveat) voice,
and the `--pencil-*` inks. Apply this wherever a chart or pattern renders. It
is what keeps the product feeling made by a person, not generated.

> **THE INFOGRAPHIC LAW (founder ruling 2026-07-06, STANDING, EVERY surface,
> EVERY screen, EVERY layer, apply without being asked).** Any data
> visualization anywhere in the product (bar chart, line/sparkline, trend,
> timeline, distribution, gauge, the Brain "Graph" tab, Engine Room room charts,
> Today, Discover, Plan, admin) MUST satisfy all five, by default, going
> forward. Do not wait to be pointed at each chart; when you build or touch a
> chart, bring it to this bar.
>
> 1. **Two shared interactive primitives, reused not bespoke (2026-07-07).**
>    Every app data chart is one of two shared primitives, never a bespoke or
>    stock-library look: a line, area, or values-over-time TREND uses the modern
>    exact `GraphSlider` (`src/components/obsidian/graph-slider.tsx`); a
>    multi-bar chart uses the hand-drawn pencil `SketchBarChart`
>    (`src/components/cadence/Sketch.tsx`). Trends render as exact vectors; BARS
>    are deliberately pencil (the warm, human look, never a machined rectangle,
>    founder ruling). Pencil marks (`pencil-mark.tsx`) also remain the PM's own
>    annotation layer; `SketchLine` is retired from app trends (use GraphSlider)
>    and kept for the marketing landing page.
> 2. **Readable, interactive data points, read AT the point.** A chart is never
>    an unlabelled spike. On hover AND focus, the value AND its x-axis label
>    (the date or category) appear AT the point the user is on: floating
>    directly above the active bar (or at the trend cursor), never parked at an
>    edge, and the active point is spotlighted with a soft glow so the eye lands
>    on the selection. Every chart is keyboard reachable.
> 3. **A scale the user can read.** Every chart shows the peak (top number), the
>    floor (bottom number), and, when the data has one, the baseline it is
>    measured against (a dashed reference line), so a shape is never ambiguous.
> 4. **Data-palette color, never a role color (AMENDED 2026-07-07).** A series
>    uses the data palette by meaning (spend `--tangerine`, machine
>    score/quality `--teal`, decisions/counts `--cornflower`, user behavior
>    `--flamingo`); the role colors (ember, glacier, moss, madder) are reserved
>    for state and voice, with at most one ember "needs a human" point per chart.
> 5. **Surface an insight, not just the data (2026-07-07).** A chart shows a
>    plain-language takeaway, not only the points: the bar chart
>    (`SketchBarChart`) renders an auto-derived read (direction, magnitude, and
>    where the peak sits) in the pencil hand, and carries it in the chart's
>    aria-label so an agent reading the accessible tree gets the read too. A
>    caller may pass a domain-specific `insight` to override the auto one. Real
>    numbers only, never a claim the data does not support.
>
> The reference implementations are `GraphSlider` (Spend "Over time", Quality
> "Right now") and `SketchBarChart` (Analytics runs, Brain timeline); copy that
> pattern and the long-form reference `docs/conventions/design-anatomy.md`
> section 7 for every new chart.

> **THE INTERACTION-FEEL LAW (founder ruling 2026-07-06, STANDING, every user
> action).** North-star: Rauno Freiberg's craft gallery (rauno.me/craft). Every
> meaningful user action should feel premium and elite through layered feedback,
> motion + optional sound + haptics, so the product feels like a natural
> extension of the person. BUT this is CALIBRATED, not blanket (Rauno's
> Frequency & Novelty rule): heavy feedback on a high-frequency action becomes
> cognitive burden and reads as slop. The calibration:
>
> - **High-frequency / low-novelty** (command menu, tab switch, keyboard nav,
>   typing, list add/remove): near-instant, minimal or NO animation, at most a
>   whisper of feedback. Snappy beats decorated. Never animate an action seen
>   100+ times a day.
> - **Medium** (press, toggle, select, open a panel): immediate response, a
>   crisp `scale(0.97)` press, a light haptic tick on touch devices, motion
>   under 200ms.
> - **Novel / rare / consequential** (commit a decision, ship, complete a
>   mission, first-run, a genuine win): earns an expressive flourish, sound +
>   haptic + motion, the moment of delight.
> - **Physicality (Rauno):** gestures are immediately responsive (apply the
>   delta live, animate past a threshold); motion retains momentum and is
>   interruptible; lightweight actions trigger during the gesture, destructive
>   ones require explicit intent (trigger on release); motion establishes
>   spatial relationships (where a thing came from). Fitts's law: big, close,
>   corner-anchored targets.
> - **Sound + haptics contract:** synthesized (no heavy audio files), subtle,
>   respect `prefers-reduced-motion` AND a user preference (a Settings toggle;
>   sound defaults OFF, haptics subtle-on where supported), and never fire on
>   high-frequency actions. Route through ONE shared feedback module so it is
>   consistent and mutable, never per-component ad hoc.
> - The minimap (rauno.me/craft/minimap) is the reference for a heads-up
>   navigation/orientation aid on long or spatial surfaces (the 3D graph, long
>   scrolls): a bird's-eye HUD to keep the user oriented.
>
> This is a build rule for every new interactive element and a retroactive one.

**17. Every object is traceable, timestamped, and opens on click (founder
ruling 2026-07-07, STANDING, every surface and object type).** Any object the
platform shows (a card, row, list item, or graph node) is a first-class,
auditable thing, never a dead tile. The Decide layer's opportunity cards are
the built exemplar; every surface adopts this by default, and existing surfaces
are brought into line as they are touched.

- **Click-to-open everywhere.** A single click on the object opens its own
  detail directly. The ⋯ / kebab menu is for SECONDARY actions only, never the
  only way to see an object. A double-click requirement or a dead card is a
  violation (this generalizes the frictionless rule; the opened view follows
  §13's depth-on-demand ladder: list → slide-over → full view).
- **Provenance (where it came from).** Every object shows its origin and links
  back up the loop (signal → theme → opportunity → spec → mission → outcome), so
  a user or agent can always answer "where did this come from" in one click.
  Reuse the lineage view; never leave an object orphaned from its source.
- **A system-generated trace ref.** Every object carries a visible, stable,
  human-readable reference derived from its id (`OPP·XXXXXX`, `THM·XXXXXX`,
  `SIG·XXXXXX`), shown on the object and copyable as the full id in the detail,
  so anything can be cited, searched, and audited. Use the shared `traceRef()`
  helper, never a bespoke inline formatter.
- **Visual weight: the id is subtle, the time is present.** The trace ref is
  rendered deliberately quiet (the faintest text tone, small mono, no heavy
  chrome or border): it is there for an agent or a curious human to read or
  copy, never a prominent badge that competes with the content. Timestamps
  carry a touch more presence than the id (a readable subtle tone), because
  recency is valuable to both the user and the agent. This weighting is the
  same on every surface, for every object type.
- **Timestamps + activity.** Every object and activity shows created and
  last-updated (relative AND absolute), and when it MOVED between stages; the
  detail carries an activity/time section. Time and recency are first-class,
  never hidden. (Honest floor today is `created_at` / `updated_at`; a full
  per-transition history needs a lightweight events table plus a write on each
  stage change, flagged as the deeper follow-up wherever per-move history is
  required.)
- **Status/stage visible on the object.** The object's current stage/status
  shows as a pill ON the object (mono-caps metadata per §1), never buried in a
  menu.
- **Scope.** Applies to EVERY surface and object type: Today, Discover, Decide,
  Plan/Define, Build, Brain, Trust Ledger, Engine Room, and any future surface.
  New objects adopt it by default (Discover signals already carry click-to-open
  - source/reference; Decide is the built exemplar).
- **Trace-ref prefix registry.** Every object type shares the same 6-char
  `traceRef()` code but carries its own type prefix, so an object traces
  cleanly across the whole loop: `SIG` signals, `THM` themes, `OPP`
  opportunities, `PRD` specs and drafts, `MIS` missions and build outcomes,
  `DEC` decisions, `LRN` learnings, `ASM` assumption challenges (the Today "worth re-examining?"
  calls). Engine-only object types carry a local code (the `kindTracePrefix`
  pattern): `ACT` a decided autonomous action (a Trust Ledger action receipt),
  `INC` an incident (the Engine Room "what went wrong" log). Render the prefix
  and code as one quiet mono ref (`OPP·A1B2C3`), and register a new type's
  prefix here before it ships.
- **Card anatomy (the standard for every object card).** Signal, theme,
  opportunity, spec, mission, outcome, and learning cards share one anatomy: a
  color-tiered strength or score anchor on the left (the numeral tinted by
  tier, moss strong, glacier mid, a quiet muted tone weak, with a small same-
  tone bar as the shape cue); the title as the primary read; organized, quiet
  meta laid out as spaced middle-dot items, never a cramped run-on; colored
  status and verdict chips for state; a faint trace-and-time tail (the ref
  fainter than the time, per the weighting above); and one clear primary
  action, with secondary actions kept in the ⋯ menu. The color is meaningful
  and semantic (score tier, status, verdict), never black-and-white monochrome;
  ember stays scarce, reserved for the single Capture CTA, so it is never a
  card accent. The Decide opportunity card is the built exemplar. On the Decide
  queue, the single best bet carries one system-driven lime pencil wink (the
  only pencil on the screen, per the one-wink law); the other ranks carry quiet
  system designations from a self-explanatory PM vocabulary ("needs validation",
  "quick win", "heavy lift", "watch this week") as small tags in their own ink,
  so a user or an agent reads what each bet IS and which to pick, and the card
  never shows two best-bet markers. (More PM terms, "sure thing", "long shot",
  "table stakes", are available spares if the set grows.) The rank itself is
  spotlighted as a small plain-language badge next to the expert ICE anchor (a
  filled glacier pill at #1, a lighter glacier tint at #2 to #3, a quiet outline
  deeper down, never ember), so a layman reads priority while the expert score
  stays secondary.
- **Detail-view anatomy (the standard for every object detail / side-panel,
  founder ruling 2026-07-07).** Every object detail view (the panel that opens
  on click) shares one premium skeleton, built from the shared DetailKit
  primitives so the structure and feel are identical across signals,
  opportunities, specs, missions, outcomes, and learnings, and only the content
  differs: a refined **DetailHeader** (the title, the colored state chips, the
  quiet copyable trace ref and the present-tone time) → a **priority / summary**
  band that leads with what the user needs first (for a bet: its rank, the
  single best bet, the recommended next action, and the rationale) → a
  **StatStrip** of token-tinted stat cells (each cell a subtle tint of its own
  tone token, the value in the tone color, strong moss / mid glacier / low
  muted) → a run of consistent **DetailSections** (each a hairline top divider
  plus a mono-caps heading, e.g. where it came from, the content, the Critic,
  the activity, the lineage) → an **actions** footer (one primary, then the
  secondary and destructive actions). The ordering is what-the-user-sees-first:
  the state and priority up top, the supporting detail below. The color stays
  calm and semantic (tone-tinted cells, status and verdict chips), never loud;
  ember stays reserved for the single Capture CTA and is never a detail accent.
  Three refinements are standing (founder feedback 2026-07-07): the priority /
  summary band uses a calm glacier tint, never an amber or brown one; the stat
  strip is compact single-row tinted cells (a small value over a mono caps
  label, four across in one tight row, no horizontal scroll); and every
  DetailSection heading carries a tiny quiet vertical-bar accent so sections
  read as their own markers while the bodies stay monotone (no rainbow of
  section colors). The Decide opportunity detail and the Discover signal detail
  are the built exemplars; every future object detail adopts this same skeleton.
  The full long-form reference (the anatomy, the DetailKit primitives, the
  trace-ref registry, the color palette, the ranking and designation logic, the
  naming conventions, and the WHY behind each) lives in
  [`docs/conventions/design-anatomy.md`](./docs/conventions/design-anatomy.md),
  the reference doc behind this binding contract.

### The anti-slop catalog (the 46 tells to keep OUT, forever)

The founder's standing law (2026-07-06): the interface must stay purely free of
the AI-slop tells catalogued at **impeccable.style/slop** (46 patterns). This is
BOTH a build rule (never introduce one) AND a retroactive one (fix any that
already shipped). **Runnable check: `bun run design:slop`** (wraps the vendored
`node .kiro/skills/impeccable/scripts/detect.mjs src/`) flags the deterministic
ones in place; run it before shipping a surface and treat a new finding as a
defect. The tells, by group, that matter most for our dark product cockpit:

- **Visual:** NO side-tab / side-stripe accent border (`border-left`/`right`
  thick colored stripe, the #1 tell); NO hairline-border + wide-soft-shadow on
  the same element (commit to an edge OR an elevation); NO glassmorphism as
  decoration; NO extreme radius (cards top out 12-16px; full-pill only for tags
  and buttons); NO amateur hand-drawn SVG mascots.
- **Typography:** clear size hierarchy (>=1.25 ratio between steps, never near-
  equal sizes); NO icon-tile stacked above a heading (the universal AI
  feature-card shape); NO repeated tiny uppercase tracked kicker/eyebrow labels
  as section scaffolding; NO numbered `01/02/03` section markers unless it is a
  real sequence; NO all-caps body text (labels/short headings only); pair a
  display + a body voice, never one font for everything.
- **Color:** NO purple/violet-gradient + cyan-on-dark "AI palette" (exactly why
  glacier moved off cyan); NO dark-mode glowing box-shadow accents as the "cool"
  default (lighting must be purposeful); NO gradient text except the one live-
  machine shimmer; NO gray text on a colored fill; NO reflexive cream/beige
  surface (not our problem on the jet-black canvas, but the principle holds).
- **Layout:** NO hero-metric template, NO identical card grids, NO nested cards,
  NO monotonous single-spacing-value rhythm; measure 65-75ch; nothing overflows
  its container; positioned children (menus/tooltips) escape clipping parents.
- **Motion:** NO bounce/elastic easing on UI (ease-out-quart/quint/expo);
  animate transform/opacity, never width/height/padding/margin; NO image
  scale/rotate-on-hover.
- **Copy:** NO em-dash overuse (zero, per §8); NO marketing buzzwords
  (streamline/empower/supercharge/world-class/enterprise-grade); NO aphoristic
  manufactured-contrast cadence ("Not a feature. A platform."); NO "theater"
  framing. Impact-first, plain PM words (§9).
- **General quality:** comfortable padding (>=12-16px inside bordered/colored
  containers), body text >= 14px, line-height 1.5-1.7, no justified body, no
  wide tracking on body, WCAG-AA contrast, no skipped heading levels.

Full living catalog + the browser overlay: impeccable.style/slop; the vendored
rules + the `critique`/`audit` passes live in `.kiro/skills/impeccable/`.

Role-color semantics (ember = needs-a-human ONLY; glacier = the machine voice;
moss/madder = outcomes; blossom = information; violet = shimmer-only). One
queue for attention. Depth on demand (list → slide-over → full view). The
restraint budget and the grayscale test. The five type voices (Newsreader /
Schibsted Grotesk / JetBrains Mono / Codystar / Caveat) and the one ember
italic word per hero. The Butterfly mark and its status choreography. The
humanized-output law. Plain-word buttons, mono-caps + middot metadata. The
working data palette (families never moonlight). Dark-only app surfaces.

## 2. Light and depth (NEW — fixes flat hierarchy)

One ambient light source above the canvas. Depth = surface tint + hairline +
light, never heavy borders:

- Card top-light: `inset 0 1px 0 rgba(255,255,255,0.05)` on card and above.
- Ambient shadow (raised+): `0 8px 24px -12px rgba(0,0,0,0.55)`.
- Overlay depth (slide-over, dialogs, palette): `0 24px 64px -16px
rgba(0,0,0,0.65)` + glass hairline (blur 20, 8% white).
- Hover still lifts one surface step AND brightens the top-light to 0.07 —
  the card catches the light.
- Canvas atmosphere: one fixed, pointer-events-none layer per app root:
  radial vignette (edges ~3% darker than center) + monochrome grain at 1.5%
  opacity. Kills the dead-flat void; never on scrolling containers.

## 2b. The gradient language (founder direction 2026-07-04: gradients and

patterns as a modern signature — adopted with restraint rules)

Gradients in Loom are atmosphere and meaning, never decoration. Six legal
homes, and only these:

1. The thread (§6): glacier → violet → blossom. Identity.
2. The CTA: the one solid button's top-lit ember gradient (§3).
3. Aurora score cards (v3 law): drifting radial washes on score moments.
4. Glow fields (NEW): one ultra-subtle radial wash anchored behind a
   surface's hero zone — 600-900px radius, role-colored at 3-4% alpha
   fading to transparent (ember-warm on Today where calls pend, glacier on
   machine surfaces, moss on healthy summaries). Maximum ONE per screen;
   fixed, never scrolling; aria-hidden; passes grayscale (it reads as
   light, not color).
5. Gradient hairlines (NEW): a featured card (the top call, the flagship
   graph, the active room) may replace its flat hairline with a fading one
   (white 10% → transparent, left to right) — the light catching an edge.
   At most two per screen.
6. The graph nebula (NEW, flagship only): the knowledge-graph canvas may
   carry a faint multi-hue radial field behind the constellation (the
   working-palette hues at ≤3%), making memory read as a living space.

Patterns: the constellation motif (nodes + threads, §6) is the ONE pattern,
reserved for empty states and the graph. The grain (§2 atmosphere) is
texture, not pattern. No other patterns; no gradient text except the v3
shimmer on live machine words; nothing animates unless the machine is live.

## 3. Ember, re-tuned (fixes harsh orange)

Law: saturation scales inversely with area. Ember keeps its single meaning
and loses its shout.

- Solid ember fill exists ONLY on the screen's one primary CTA, now a top-lit
  gradient: `linear-gradient(180deg, #FF7A3D, #F25E1F)`, ink #160903.
- New layered tokens: `--ember-text: #FF8A50` (text/index accents on dark;
  AA at 14px+), `--ember-tint: rgba(255,107,44,0.13)` (fills behind ember
  text), `--ember-line: rgba(255,107,44,0.45)` (borders), `--ember: #FF6B2C`
  (the raw signal, reserved for dots, the badge, the butterfly, large
  numerals).
- Badges: tint + ember-text + hairline, never solid fill. Glows cap at 0.25
  alpha and exist only on live "call waiting" states.
- Active nav = thread indicator + ember-text index; no glow, no fill.

## 4. Type recalibrated (fixes weak typography, readability)

- UI base 13px → 14px / 1.55 Schibsted. Scale with roles:
  11 mono-micro · 12 helper · 12.5 secondary · 14 base · 16 emphasis ·
  20 card title (Newsreader 460) · 25 h2 · 32 h1 · 40 hero (Newsreader 420,
  -0.015em, 1.12).
- Ink ramp lightened one step: `--text-body #C6C0B8` · `--text-muted #A39D94`
  · `--text-subtle #86817A`. `--text-faint #55524C` is DEMOTED to
  decorative/disabled; it may not set text that carries meaning.
- Mono metadata floor: 10.5px, tracking 0.08em; `tabular-nums` wherever a
  number lives. Prose measure caps at 68ch.
- Newsreader display gains confidence: heroes 40px, optical sizing on, the
  one italic emotional word stays.

## 4b. Desktop-first canvas (founder feedback 2026-07-04: v3 reads mobile-sized)

Cadence is a desktop browser instrument. v3's 1060/1160px caps with 13px type
float like a phone layout in a void; v4 uses the room it is given:

- Container tiers: prose 68ch · standard surface 1240px · work surface
  (Build, Engine Room, tables, Brain) fluid to 1520px · full-bleed where
  earned (the graph, large tables). Gutters 32 at 1280, 48 at 1536+.
- Two-column surfaces widen their columns before adding whitespace; data
  tables always take the working width.
- The rail (~248px) + container never leave more than ~15% dead margin at
  1440px on a work surface.
- Mobile stays responsive (min 375px, single column) but is not the design
  target; nothing is designed small-first and stretched.

## 5. Motion doctrine (fixes inconsistent interactions)

The Kowalski/Freiberg rules, tokenized. One rhythm everywhere:

- Easings: `--ease-out: cubic-bezier(0.23,1,0.32,1)` (enter, default) ·
  `--ease-in-out: cubic-bezier(0.77,0,0.175,1)` (on-screen movement) ·
  `--ease-drawer: cubic-bezier(0.32,0.72,0,1)` (slide-over/drawer).
- Durations: press 140 · pop 180 · panel 240 · drawer 300. Exit ≈ 70% of
  enter. Nothing in UI exceeds 320ms.
- Every pressable scales 0.98 on :active (140ms). Buttons answer the finger.
- Popovers/dropdowns/tooltips scale from their trigger
  (`transform-origin: var(--radix-*-transform-origin)`); modals stay center.
  Enter from scale(0.96)+opacity, never scale(0).
- Keyboard-initiated surface switches (1-5, g, ⌘K open) animate NOTHING —
  the frequency law. Palette appears instantly.
- List entrances: opacity + translateY(8px), stagger 40ms, cap 6 rows,
  transitions not keyframes (interruptible).
- Tooltips: delay the first, instant siblings.
- A 2px blur may mask an imperfect crossfade; never exceed it in chrome.
- Reduced motion kills movement and keeps opacity. The in-product toggle
  survives.

## 6. The thread (NEW — the identity element)

One 1px gradient line language (the shimmer family: glacier → violet →
blossom) carries the product's meaning of connection:

- Hero underline: 24px wide, 40% opacity, static — the maker's mark on every
  surface title.
- Rail active indicator: a 2px thread on the active item's left edge.
- The working line and the loop strip's active station animate the thread
  (slow 5s drift) — the ONLY places it moves outside the graph. Motion in
  the thread = the machine is alive. It never decorates.
- In the knowledge graph, edges ARE threads (see §7).
- Empty states carry a faint static constellation motif (nodes + threads,
  SVG): every empty state whispers the moat.

## 7. The living graph (NEW — the moat, visible; flagship)

Brain's Graph becomes the product's signature scene: the workspace's memory
as a living constellation.

- Physics: d3-force simulation (link/charge/collide/center), settles calm;
  drag a node and the web answers with momentum; simulation cools to rest
  (alphaDecay tuned so settle < 3s), reheats gently on interaction.
- Rendering: Canvas2D, DPR-aware, 60fps; glow via layered radial fills (not
  shadowBlur spam); labels virtualize (draw only above zoom threshold or on
  focus). SVG tree view remains the reduced-motion + screen-reader path.
- Node language: kind → role color (decision ember-soft · outcome moss/madder
  by verdict · learning glacier · signal blossom · theme violet-soft · spec
  pearl · mission cornflower · meeting rose · task slate). Size = influence.
  Focus ring = 2px glacier.
- Edge language: hairline threads at 25%; supersession edges run a slow
  directional shimmer (the thread in motion — memory revising itself);
  contradiction hotspots pulse madder once on arrival, then settle.
- Interaction: scroll-zoom to cursor · drag-pan · click focuses (neighbors
  lit, rest dim to 20%) · double-click opens the node story panel · Esc
  releases focus. Hover shows the node card (glass, origin-aware).
- The time scrubber (validFrom data already exists) replays memory growing —
  the compounding moat as theater. Playback respects reduced motion.
- Truth law unchanged: only real edges render; no fabricated nodes, ever.

## 8. Information architecture (NEW — nothing hidden)

The rail (~248px) shows every home, grouped, mono-caps group labels. The
hover-menu "door" is retired; depth stays on demand behind visible doors.

- (top) Workspace switcher ▾ · Search ⌘K
- THE LOOP: `01 Today` (call badge) · `02 Discover` · `03 Plan` · `04 Build`
  · `05 Brain`
- THE ENGINE: `Engine Room` (the glance; four rooms inside; /govern remains
  its drill layer) · `Trust Ledger` · `Connections`
- (footer) `Settings` · `Admin console` (role-gated) · user chip ▾ (Profile ·
  Plan & billing · Sign out) · the shimmer working line.
- Laws: features still never add rail items — new capability lands inside a
  destination, a room, a Call, or ⌘K. Approvals stay Calls on Today, never
  in the Engine group. Every route is reachable by clicking (the visibility
  law); the only exemption is the dev specimen. Legacy URLs redirect
  one-hop, forever.
- Renames (consumer-logical): `/knowledge` → Brain everywhere the user sees
  it (URL rename with permanent redirect, founder-flagged); `/sync` is
  labeled Connections; room names stay question-shaped (Spend · Quality ·
  Safety · Record).

## 8b. Today, the ritual — triage, not a wall (founder feedback 2026-07-04)

Today is the landing surface and it must never overwhelm. Eleven flat
approvals is a defect, not a queue. The laws:

- One decision above the fold: the hero (call count, rewrites as answered),
  the single highest-stakes Call rendered in full, and the compact machine
  pulse. Everything else is disclosure.
- The queue triages itself: Calls group by kind (Ship it? · Worth building?
  · Spend) with mono count chips; each group shows its top card, the rest
  collapse behind "N more" rows (one click, inline expand, no navigation).
  Expiring-soon floats to the top of its group. Answering from the group
  header's card advances to the next — the queue is a flow, not a scroll.
- My day (NEW, the PM's at-a-glance strip): a quiet one-row strip under the
  hero — today's meetings (calendar data), tasks due today (tasks data),
  and the one Focus-next suggestion (SF-FOCUS). Each item is a link into
  its home. Empty slots collapse; the strip never exceeds one row.
- Quick capture (NEW): one input, collapsed to a single affordance ("Capture
  a signal or note…"), reusing the Discover composer's write path. A PM's
  passing thought lands in the machine without leaving Today.
- What changed stays, with causes, capped at 5 with disclosure.
- The restraint budget governs: grouping and disclosure fix overwhelm; new
  panels do not. Scroll depth target: the whole ritual within ~1.5 screens
  at 1440px even with a full queue.

## 9. States, everywhere (fixes blank screens, incomplete feel)

- Every surface ships four designed states: loading (shimmer skeletons that
  match the real layout — never spinners for primary content, never a blank
  canvas), empty (an instruction + one action + the constellation motif),
  error (the cause + one retry), loaded.
- Route-level pending components are mandatory: navigation never flashes a
  dead black frame.
- Optimistic where reversible; Undo over confirm for reversible actions.
- An error may NEVER wear an empty state's clothes. "No results" when the
  query failed is lying; a mutation that failed may never toast success.

## 9b. Chrome quiet + honesty laws (audit-driven, 2026-07-04)

- ONE ambient status line in the chrome, maximum. Stacked banners are a
  defect; the checkout-preview banner appears on billing surfaces only.
- Numbers are real or absent. No prototype literals while loading, no
  hardcoded "connected", no fabricated trends — a skeleton is the only
  legal placeholder (claim never outruns wiring).
- Raw telemetry never reads as a broken product: an alarming figure ships
  with its meaning and its scope, or it stays in the Engine Room.
- Deep-link params are honored everywhere: every destination validates and
  applies its section/tab/view/focus params; redirects never send params
  their target drops.
- One home per object: connections, approvals, the integrity seal, the
  record each render fully in ONE place; every other appearance is a link.
- The ⌘K catalog indexes every destination, room, pane, and folded rare
  surface — "rare goes to the palette" is only true if the palette knows it.

## 10. Standing instructions (any builder, human or AI)

1. Run v3's placement algorithm before writing a line; features never add
   nav items.
2. Colors from the tokens only; the ember hierarchy of §3 is law: solid fill
   = one CTA; everything else is text/tint/line.
3. Type from the §4 scale only; no meaning-bearing text below 11px or in
   `--text-faint`.
4. Motion from the §5 tokens only; keyboard actions never animate; every
   pressable presses.
5. The thread moves only where the machine is genuinely alive.
6. Four states designed per surface; a blank frame during navigation is a
   defect.
7. The restraint budget and grayscale test still gate every screen; the
   light system does not add color, it adds light.
8. Every surface passes: readable at arm's length, scannable in grayscale,
   navigable by keyboard, honest in every state.
9. When this file is silent, DESIGN-OBSIDIAN.md (v3) applies. When both are
   silent, ask the specimen prototypes; when those are silent, the
   interfacecraft/devouringdetails school decides.
