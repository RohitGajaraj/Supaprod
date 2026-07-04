---
version: 4.0 "Loom" (design-system lineage: v1 tokens · v2 Ember Editorial parchment,
  landing-only · v3 Obsidian dark cockpit · v4 Loom, the lit instrument)
created: 2026-07-04
updated: 2026-07-04
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

## 1. What survives from v3 verbatim (the inherited law)

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
