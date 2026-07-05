# Cadence · Obsidian Design System (v3)

The compiled design system for **Cadence**, the operating system for product
judgment: a swarm of governed agents runs the product loop (sense, decide,
define, build, ship, learn) and the human makes only the calls that matter.

**The design idea:** a calm instrument. A jet-black cockpit where the machine's
work glows softly in glacier, and the only thing that ever asks for attention,
in ember orange, is a decision that genuinely needs a human. _Warm asks, cool
works._

## Sources

- `handoff/DESIGN-OBSIDIAN.md` — THE design contract (v3 "Obsidian"). When in
  doubt, this file is the law.
- `Cadence Design Strategy.dc.html` — the founder-approved visual specimen the
  contract was distilled from (open it to see how anything should look).
- `Cadence App.dc.html` — the full interactive prototype (six surfaces).
- `src/` — legacy v2 "Ember Editorial" parchment code (superseded for all
  authenticated surfaces; kept for reference only; its `src/styles.css` is
  NOT part of this system).

## Index

- `styles.css` — the single global entry point; consumers link this one file.
- `tokens/` — `colors.css` (surfaces, ink, role colors, working palette),
  `typography.css` (three voices + two special inks), `geometry.css`
  (4px grid, radii), `motion.css` (one easing, three durations, keyframes),
  `fonts.css` (Google Fonts).
- `assets/` — the Butterfly mark in its three status states
  (`butterfly-ember.svg` call-waiting/brand, `butterfly-idle.svg`,
  `butterfly-working.svg`).
- `guidelines/` — foundation specimen cards (colors, type, geometry, motion,
  aurora, brand, voice).
- `components/core/` — Button, StatusDot, VerdictChip, Cite, Pencil, Toast.
- `components/objects/` — CallCard, MissionRow, AuroraCard, AIMessage.
- `ui_kits/cadence-app/` — interactive Obsidian shell (Today, Discover, Build).
- `SKILL.md` — agent-skill entry point.

## The three laws

1. **One object, one anatomy.** Everything is one of seven objects: Signal,
   Opportunity, Spec, Mission, Call, Outcome, Learning. One card, one detail
   view, one status language, identical everywhere.
2. **One queue for attention.** Every gate and approval is a Call in one queue
   with one badge. Ember is reserved exclusively for it.
3. **Depth on demand.** Quiet list → slide-over panel → full view. Layer one
   never shows more than one decision's worth of information.

## CONTENT FUNDAMENTALS

- Voice: a sharp PM, not software. Calm, declarative, contractions welcome,
  one wink per screen at most. PM vocabulary: backlog, scope, ship, bet,
  roadmap. Trust moments (calls, failures, money) are always plain and calm.
- Examples of the register: "Zero calls. Enjoy the quiet roadmap." · "Good
  call. The PR is open." · "Your pet feature has three problems. Receipts
  attached." · "Scout is reading 48 hours of tickets so you don't have to."
- Buttons: one or two plain human words a PM would say out loud (Approve,
  Send back, Build this, Start, Challenge). The consequence goes in quiet
  helper text beside the action. Mechanism names are banned on controls.
- Titles: two to four words. The one emotional word per screen is set in
  Newsreader italic (often ember).
- Mono-caps metadata everywhere: counts, costs, timestamps, statuses
  ("SCOUT · STEP 2/5", "$0.84", "EXPIRES IN 6H") — always with the middot.
- **The humanized-output law (hard rule):** no em or en dashes (use the
  middot, a comma, or a new sentence), no invisible Unicode, no AI-cliche
  words (seamlessly, leverage, empower, robust, unlock, delve), no
  exclamation marks, no emoji. Applies to every UI string and everything
  agents generate.
- Empty states are instructions with a time estimate ("Nothing sensed yet.
  Plug in Intercom and give it ten minutes."), never blank boxes.

## VISUAL FOUNDATIONS

- **Canvas:** near-black obsidian ramp (#0A0A0B canvas · #0D0D0F rail ·
  #111113 card · #17171A raised · #1D1D21 hover). Depth comes from surface
  tint; hairlines at 7% white replace shadows entirely.
- **Role colors, one job each:** ember #FF6B2C = needs a human (never
  decoration); glacier #7FD1DC = the machine's voice; blossom #E5BDDF =
  information (links, focus, citations); moss #7FBF8E / madder #E06557 =
  outcomes only; marigold #E8B44C = in-review. Royal violet #C77DFF exists
  only inside the shimmer gradient and the working butterfly.
- **Working palette:** named data families, each with exactly one home
  (tangerine/marigold/melon = spend; mauve/amethyst = agent identity;
  cornflower/cobalt = benchmarks; teal = machine series; pearl/ash/slate =
  axes and disabled). Max three families per chart; role colors never plot
  data; never invent a hex.
- **The restraint budget (per screen):** at least 90% neutral; one ember CTA;
  at most one aurora card; at most one shimmering element; at most two pencil
  annotations; status color only on actual status. Grayscale test before
  shipping.
- **Type, three voices:** Newsreader serif for display/heroes/spec bodies
  (400-470, -0.015em, one italic emotional word); Schibsted Grotesk for all
  UI (13px base, 1.55, 600 headings); JetBrains Mono for metadata (9.5-10px
  caps, 0.10-0.12em tracking). Codystar only for aurora numerals; Caveat only
  for pencil annotations. Never Inter, Roboto, or Fraunces.
- **Geometry:** 4px grid, rhythm 8/12/16/24/40. Radii 8 controls / 12 cards /
  14 panels / 99 pills (16 for aurora cards).
- **Motion:** one easing cubic-bezier(0.23,1,0.32,1); 140/200/280ms. Only
  three things move on their own: live pulses, step progress, arrivals.
  Entrances transform-first, staggered 30ms/row, max six rows. Everything
  gates on prefers-reduced-motion.
- **The AI shimmer:** the 7-stop glacier→cobalt→violet→orchid→ice gradient at
  280% size, 5s drift; only on text/marks representing the machine actively
  working; max one per screen. Static labels never shimmer.
- **Aurora cards:** the only sanctioned gradient — drifting radial blobs +
  Codystar numeral, glow bleeding past the edge; score moments only; hue
  encodes state (moss healthy, ember attention, madder failing).
- **Glass:** slide-overs and hover cards use blur 20 + 8% white hairline.
- **Hover states:** background lifts one surface step (#141416 / #1D1D21 →
  #242429), hairline brightens, role-color glow on live elements. Press:
  ember darkens to #C2571F. Focus: 2px glacier outline.
- **Backgrounds:** flat obsidian, no imagery, no patterns. The only washes
  are aurora cards and the faint radial glows behind the masthead.

## ICONOGRAPHY

- There is NO icon set. The nav uses a mono-numeral index (01-05) instead of
  icons — this is a deliberate signature ("mono index, not icon soup").
- The only pictorial element is the Butterfly mark (`assets/`), used as brand
  and as a status instrument (idle ash / working violet flutter / call-waiting
  ember glow). Never redraw it; use the SVGs.
- Arrows and affordances are unicode characters in mono: `→`, `⌘K`, `·`
  (middot as separator everywhere). No emoji, ever.
- Status is communicated by 6px glowing dots + mono-caps words, never icons.

## Consuming this system

Link `styles.css`, build on the tokens (`var(--ember)`, `var(--font-serif)`,
`var(--radius-card)`...), compose the components in `components/`, and obey
`handoff/DESIGN-OBSIDIAN.md` section 12 (standing instructions): placement
algorithm first, colors only from roles and ramps, plain-words buttons, every
state designed, restraint budget on every screen.

## Intentional additions

- `AuroraCard`, `Toast` — not in the contract's component list by name, but
  both are specified in the strategy document (sanctioned-gradient section,
  approval toasts) and used across the prototype.

## Caveats

- Fonts load from Google Fonts CDN (`tokens/fonts.css`); no font binaries
  were provided. Offline consumers need the TTFs added.
- The system is dark-only by design; there is no light theme in v3 Obsidian.
