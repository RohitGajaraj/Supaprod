# Design anatomy: cards, detail views, trace refs, ranking, color & naming

> **STALE, 2026-08-22.** Written 2026-07-07 against Loom v4. Its card and detail anatomy predates Meridian. The design system is **Meridian** and there is no other one — contract [`DESIGN-SYSTEM.md`](../design/DESIGN-SYSTEM.md), system `src/styles/meridian.css`, components `src/components/meridian/`. v1 Ember, v3 Obsidian, v4 Loom, v5 Tempo and Cadence/ink were all retired 2026-08-14 and the retirement is enforced by `src/__tests__/meridian-ratchet.test.ts`.


> _Created: 2026-07-07 · Last updated: 2026-07-07_

> **The comprehensive reference for how every object looks, reads, and behaves in the Supaprod app.** This is the "how to build a surface" companion to the design law. [`design/archive/loom-v4.md`](../design/archive/loom-v4.md) §0.1 dimension 17 is the short, binding CONTRACT (the rule any change is gated on); this doc is the LONG-FORM reference behind it: the full anatomy, the shared primitives, the color/token palette, the naming conventions, the ranking and designation logic, and the reasoning (the WHY) behind each decision. When the two agree they are the same rule stated at two lengths; if this doc ever drifts from the contract, the contract wins and this doc is corrected in the same change.
>
> Read this before building or retrofitting any object card, list row, graph node, or detail side panel. The Discover and Decide surfaces are the built exemplars; every other surface (Today, Plan/Define, Build, Brain, Trust Ledger, Engine Room, Settings) adopts this by default and is brought into line as it is touched.

---

## 0. The one idea

**Every object the platform shows is a first-class, auditable thing, never a dead tile.** A card, a row, a list item, or a graph node can always answer, in one click and without a menu: what am I, how important am I, what state am I in, where did I come from, when did I change, and what should happen next. This is the felt expression of the product thesis (the decision-and-outcome layer that keeps the receipts): if the whole moat is an auditable record of what was decided and whether it was right, then every object on screen has to carry its own receipts. It is built for a human AND for an agent reading the same surface, so the provenance, the trace ref, the timestamps, and the recommended next action are all first-class, not decoration.

Founder ruling 2026-07-07, standing, every surface and object type. The binding form is [`design/archive/loom-v4.md`](../design/archive/loom-v4.md) dimension 17.

---

## 1. Color & token conventions

**Semantic tokens only. Hex literals in components are banned** (enforced by convention and review). A component names a role (`var(--moss)`), never a color value, so the whole app re-themes from one place and no surface drifts. Tints are built with `color-mix(in srgb, var(--token) N%, transparent)` on a token, never a new hex.

### The palette and what each token MEANS

Color is meaningful and semantic (it encodes score tier, status, verdict, or designation), never decoration and never black-and-white monochrome. The role is what matters; the value is an implementation detail defined once in [`src/styles.css`](../../src/styles.css).

| Token | Value (dark theme) | Role / meaning |
| --- | --- | --- |
| `--ember` | `#ff6b2c` | **RESERVED, globally, for the single Capture CTA.** The one primary action that starts the loop (capture a signal). It is deliberately scarce: it appears at most once on a screen, so it always means "the primary action." Never a card accent, never a rank color, never a chart series. This scarcity is the rule that makes ember legible; spending it elsewhere dilutes every other ember on the platform. |
| `--glacier` | `#84b3ec` | The machine / intelligence voice: active lanes (Now / Next status), the rank spotlight badge, focus outlines, the priority/summary band tint. "The system is telling you something." |
| `--moss` | `#7fbf8e` | Strong / positive / done: a strong score tier (>= 7), Shipped status, an endorsed (SHIP) verdict, the "quick win" designation. |
| `--madder` | `#e06557` | Destructive / negative: Dropped status, a KILL verdict, delete actions. |
| `--amber` (`--saffron`) | saffron | Caution / attention, used sparingly. |
| `--text-primary` | `#f2f0ed` | The primary read (titles, values). |
| `--text-muted` | `#9c978f` | Secondary text, a weak score tier, the "watch this week" designation. |
| `--text-subtle` | `#7d786f` | Quiet meta, mono-caps labels, timestamps (recency is worth a touch more presence than the trace id). |
| `--text-faint` | `#55524c` | The faintest tone: the trace ref, the Backlog status, the section-heading accent bar. Present for an agent or a curious human to read, never prominent. |
| `--canvas` | `#0a0a0b` | Page background; also the dark text ON a filled glacier badge for contrast. |
| `--card` | `#111113` | The default card surface. |
| `--raised` | `#17171a` | A raised surface (hover, table header, secondary button). |
| `--hairline` | `rgba(255,255,255,0.07)` | The 1px divider / chip border on every card, cell, chip, and section. |
| `--pencil-lime` | `#cde07a` | The best bet's pencil ink (the one lime pencil wink). |
| `--pencil-blossom` | `#e5bddf` | The "needs validation" designation ink. |
| `--pencil-apricot` | `#ffb27a` | The "heavy lift" designation ink. |

### Fonts and radii

| Token | Value | Use |
| --- | --- | --- |
| `--font-serif` | Newsreader | Numerals and hero reads (the ICE score, stat-cell values). The one editorial voice. |
| `--font-ui` | Schibsted Grotesk | Body and titles. |
| `--font-mono` | JetBrains Mono | All metadata: mono-caps labels, trace refs, timestamps, status/verdict/designation chips, rank badge. |
| `--radius-card` | (card radius) | Cards. |
| `--radius-control` | `8px` | Controls, stat cells. |

### The color-restraint judgment (founder input 2026-07-07)

Coloring every section body turns a surface fancy and noisy; a monotone body with meaningful accents reads premium. So: **color the meaning (score tier, status, verdict, designation, the one summary band), keep the bodies monotone.** A detail section gets a small quiet accent on its heading, not a colored panel. When in doubt, add less color, not more.

---

## 2. Card anatomy (the standard for every object card)

Signal, theme, opportunity, spec, mission, outcome, and learning cards share ONE anatomy so the whole app reads as one system. The built exemplar is the Decide opportunity card ([`src/components/discover/OpportunityRow.tsx`](../../src/components/discover/OpportunityRow.tsx)); copy its structure, change only the content.

Left to right, the card carries:

1. **A color-tiered strength / score anchor (left).** The numeral (Newsreader, tabular-nums) tinted by tier: moss strong (>= 7), glacier mid (4 to 6.9), a quiet muted tone weak (< 4), with a small same-tone bar beneath as the shape cue for a glance or for a color-blind read. This is the at-a-glance priority.
2. **The title as the primary read.** `--text-primary`, 600 weight.
3. **Organized, quiet meta**, laid out as spaced middle-dot (`·`) items, never a cramped run-on. The caller joins provenance with `·` and the card splits it back so each fact is its own spaced item.
4. **Colored state chips**: a status pill (the lane) and a verdict chip, so the state reads without opening a menu.
5. **A faint trace-and-time tail**: the trace ref (`OPP·A1B2C3`, `--text-faint`) and the timestamp (`updated 3H AGO`, `--text-subtle`, a touch more present than the id).
6. **One clear primary action** (e.g. "Draft spec"), with secondary actions (lineage, move-to, delete) kept in the `⋯` menu, never as the only way to see the object.
7. **The whole card body is a single-click affordance** that opens the detail (`role="button"`, Enter/Space, a focus ring). Every action control calls `stopPropagation` so it never also fires the open.

### The Decide-specific layer (best bet, designations, rank spotlight)

The opportunity card adds the priority read on top of the shared anatomy:

- **The single best bet carries one system-driven lime pencil wink** (`PencilNote ink="best-bet"`, the only pencil on the screen, per the one-wink law). It is driven by the ranking's `isBestBet` (rank 1), NOT hardcoded to a row index, so there is exactly one and it is always the real top pick. There is never a second competing best-bet marker.
- **Every other qualifying rank carries a quiet designation tag** (`DesignationTag`) in its own pencil ink, naming what the bet IS from a self-explanatory PM vocabulary, so a user or an agent reads which to pick. See §5.
- **The rank is spotlighted as a small plain-language badge** (`RankBadge`) next to the expert ICE anchor: a filled glacier pill at #1 (dark canvas text, bold), a lighter glacier tint at #2 to #3, a quiet hairline outline deeper down, carrying a `Priority rank N of the queue` title and aria-label. This exists because ICE is an expert metric a layman may not read; the rank number is the everyman priority cue, so it gets the spotlight while the score stays secondary. It is never ember (ember is the Capture CTA).

---

## 3. Detail-view anatomy (the standard for every object detail / side panel)

Every object detail (the panel that opens on click) is assembled from the shared **DetailKit** primitives ([`src/components/discover/DetailKit.tsx`](../../src/components/discover/DetailKit.tsx)) in the SAME order every time, so a signal, an opportunity, a spec, a mission, an outcome, and a learning all read as one premium, auditable thing and only the content differs. The ordering is what-the-user-sees-first: state and priority up top, supporting detail below.

The skeleton, top to bottom:

1. **`DetailHeader`** ({ title, chips, traceRef, time }): the object title on the first line, then a quiet meta row (the colored state chips on the left; the time and the faint copyable trace ref on the right).
2. **A priority / summary band** that leads with what the user needs first. For a bet: its rank, whether it is the single best bet, the recommended next action, and the rationale. **The band uses a calm glacier tint** (`color-mix(in srgb, var(--glacier) 8%, transparent)` fill, a `22%` glacier hairline), NEVER amber/brown (an early amber tint read as muddy brown; glacier is the correct "system recommendation" voice). A non-best bet shows its designation tag plus the one-line meaning.
3. **`StatStrip`** of **`StatCell`s**: the glanceable summary row. Each cell is a small, COMPACT rounded cell (a `color-mix` 8% tint of its own tone token, a hairline, the value in the tone color via `toneForScore`: strong moss / mid glacier / low muted). Kept tight (value 15px, padding 6px 8px, gap 6px) so four cells sit in ONE row without forcing horizontal or vertical scroll. `StatStrip` auto-columns to the child count so a conditional cell never leaves an empty column.
4. **A run of consistent `DetailSection`s**: each a hairline top divider plus a mono-caps heading marked by a tiny quiet vertical bar (a `--text-faint` 2px accent), so each section reads as its own marker without loud color. Bodies stay monotone. Typical sections: where it came from (provenance), the content, the Critic, the activity/time, the lineage.
5. **An actions footer**: one primary action, then the secondary and destructive actions.

`toneForScore(n)` is the shared rule for every scored cell (>= 7 moss, >= 4 glacier, else muted), so a strength anchor reads the same on every object. The `StatTone` set is `moss | glacier | madder | amber | muted | neutral`; **ember is deliberately excluded** from the tone set (it stays reserved for Capture).

---

## 4. Trace-ref registry (provenance, ids, timestamps)

### Provenance

Every object shows its origin and links back up the loop: `signal -> theme -> opportunity -> spec -> mission -> outcome`. A user or an agent can always answer "where did this come from" in one click. Reuse the lineage view; never leave an object orphaned from its source.

### The trace ref and its prefixes

Every object carries a visible, stable, human-readable reference derived from its id, via the ONE shared helper `traceRef(id)` ([`src/components/discover/format.ts`](../../src/components/discover/format.ts)): the first 6 alphanumerics of the uuid, upper-cased. Never a bespoke inline formatter. Each object type carries its own prefix, rendered as one quiet mono ref (`OPP·A1B2C3`):

| Prefix | Object type |
| --- | --- |
| `SIG` | signals |
| `THM` | themes |
| `OPP` | opportunities |
| `PRD` | specs and drafts |
| `MIS` | missions and build outcomes |
| `DEC` | decisions |
| `LRN` | learnings |
| `ASM` | assumption challenges (the Today "worth re-examining?" calls) |
| `ACT` | decided autonomous actions (Trust Ledger action receipts, engine-only local code) |
| `INC` | incidents (the Engine Room "what went wrong" log, engine-only local code) |

**Register a new type's prefix here (and in the DESIGN-LOOM dim 17 registry) before it ships.** The full uuid is copyable in the detail; the card shows only the short ref.

### Visual weight: the id is subtle, the time is present

The trace ref is rendered deliberately quiet (`--text-faint`, small mono, no border or heavy chrome): it is there for an agent or a curious human to read or copy, never a badge that competes with the content. **Timestamps carry a touch more presence** (`--text-subtle`), because recency is valuable to both the user and the agent. This weighting is identical on every surface.

### Timestamps and activity

Every object shows created and last-updated (relative via `relTimeCaps()`, e.g. `3H AGO`, and absolute in the detail), and, where available, when it moved between stages. `relTimeCaps` floors to zero for a future or malformed timestamp rather than showing a negative. The honest floor today is `created_at` / `updated_at`; a full per-transition history needs a lightweight events table plus a write on each stage change, flagged as the deeper follow-up wherever per-move history is required (do not fabricate a history that the schema does not carry).

---

## 5. Ranking, best bet & designation logic

The Decide queue is ordered by a deterministic, testable, pure-function ranker ([`src/components/discover/ranking.ts`](../../src/components/discover/ranking.ts)), because an agent (and a human) needs a single stable total order and one unambiguous top pick, never a tie or a coin flip. Full feature doc: [`../features/opportunity-ranking.md`](../features/opportunity-ranking.md).

### The tie-break chain (`compareOpportunities`)

In strict order, each a tie-breaker for the one above:

1. `ice_score` desc (the primary priority signal)
2. Critic verdict rank desc (SHIP 4 > WATCH 3 > PENDING 2 > REVISE 1 > KILL 0)
3. corroboration desc (backing signal count, via `corroborationOf`, typically the theme's frequency)
4. confidence desc
5. impact desc
6. `created_at` asc (the older, proven bet first)
7. `id` asc (the absolute stable finalizer, so the order is never random)

`rankOpportunities()` returns, per bet: `{ opp, rank, isBestBet, designation, rationale, nextAction }`. Rank 1 is the single `isBestBet`. The rationale is built from the true discriminators (e.g. `Ranked #1: top ICE score, Critic endorsed, backed by 7 signals`); the next action is derived from state (a PENDING bet's next action is "Challenge with the Critic first").

### The designation vocabulary (`deriveDesignation`)

Beyond the #1 best bet, every ranked bet gets a system-derived **designation** from a self-explanatory PM vocabulary, so a human or an agent reads what each bet IS (not just its number) and knows which to pick, WITHOUT a model call. Evaluated in strict order, first match wins, so rank 1 is always the single best bet even if a lower rule would also match:

| Order | Rule | Designation | Ink | Meaning shown in the detail |
| --- | --- | --- | --- | --- |
| 1 | `rank === 1` | **best bet** | `--pencil-lime` (the pencil wink, not a tag) | the top pick + rationale + next action |
| 2 | NOT endorsed (verdict rank below SHIP) AND `impact >= 6` | **needs validation** | `--pencil-blossom` | "High appeal, thin evidence. Let the Critic weigh in before you commit." |
| 3 | `ease >= 7` AND `impact >= 5` | **quick win** | `--moss` | "Low effort for real impact. A fast, safe ship." |
| 4 | `ease <= 3` | **heavy lift** | `--pencil-apricot` | "Large effort for the expected return. Consider slicing it smaller." |
| 5 | `corroboration >= 3` | **watch this week** | `--text-muted` | "Gaining signals, not yet the top bet. Keep it in view." |
| 6 | otherwise | `null` (a plain ranked bet) | none | none |

**Why these:** "needs validation" is the Critic-teardown target (high appeal, weak evidence) and maps straight onto the product's wedge; the others cover the classic effort-vs-impact reads a PM makes. More PM terms ("sure thing", "long shot", "table stakes") are documented spares if the set grows.

### The one-wink law

Only the best bet renders the loud lime pencil wink; every other designation is a quiet tag in its own ink. Exactly one pencil per screen. This keeps the "wink" scarce and meaningful, the same way ember is scarce for Capture.

---

## 6. Naming conventions

- **Tokens** name a role, not a value (`--moss`, not `--green-400`). Component code references the token only.
- **Labels / metadata** are mono-caps (JetBrains Mono, uppercase, letter-spaced) for machine-metadata reads (status, verdict, trace ref, section headings); sentence-case for human prose.
- **Trace-ref prefixes** are the 3-letter registry in §4; a new object type registers its prefix before it ships.
- **Files:** kebab-case, no dates in filenames (the date lives in the header line). Feature docs are named for the feature (`opportunity-ranking.md`); the design reference is this file.
- **Outcome-first product language:** name the outcome, not the mechanism (per DESIGN-LOOM and the Engine-Room doctrine). A user-facing label says what happened, not how the machine did it.
- **Zero AI-tells:** no em/en dashes and no invisible Unicode in anything authored (code, docs, UI copy) or generated. Use commas, colons, parentheses, the middle dot `·`, or a hyphen. Full rule: [`humanized-output.md`](./humanized-output.md).

### The plain-outcome + technical-trace pattern (founder ruling 2026-07-07)

**Name the outcome on the surface; keep the technical term underneath, subtly, so both a PM and an engineer are served.** Outcome-first naming (above) makes a label say what the user gets, not how the machine works. But a purely plain label strands the technical reader: an engineer who knows the system word ("drift", "evals", "prompts") loses the thread. The rule reconciles both: the plain outcome label is the exposed layer; the technical term is a quiet trace, never at the front.

- **Exposed layer:** the plain outcome label (the tab, the section title, the button). Sentence-case, human. "Is it slipping?", not "Drift".
- **Trace beneath:** the technical term rendered subtly at the foot of the view (a hairline-topped, mono-caps, `--text-faint` line: `{plain label} · the engine calls this {technical}`), or an equivalent quiet caption. Discoverable both ways: a PM reads the outcome and learns the system word; an engineer recognizes the system word and maps it to the outcome.
- **Descriptor:** one plain sentence under the label that says what the view answers, so a click never lands on a bare table with no context.
- **The single source is a metadata map**, not scattered strings: for the Engine Room it is `ROOM_TAB_META` in `src/lib/engine-room-glance.ts` (`{ id, label, technical, descriptor }`), where `id` is the routing contract, `label` is exposed, `technical` is the trace, `descriptor` is the plain line.

The Engine Room naming map (the built exemplar):

| Room (question) | id | Plain label (exposed) | Technical (trace beneath) |
| --- | --- | --- | --- |
| **Spend** (What is this costing me?) | trend | Over time | Cost trend |
| | by-agent | By agent | Agent spend breakdown |
| | caps | Limits | Budget caps |
| | usage | Full usage | Analytics rollup |
| **Quality** (Is the machine still good?) | score | Right now | Eval pass rate |
| | suites | What we test | Eval suites |
| | drift | Is it slipping? | Drift |
| | prompts | Its instructions | Prompts |
| | proof | Stress tests | Gauntlet |
| **Safety** (What is it allowed to do?) | rules | What is allowed | Guardrails |
| | controls | Emergency controls | Pause and kill switch |
| | team | Who can act | Agent roster and trust |
| | house-rules | Your policies | House rules |
| | incidents | What went wrong | Incidents |
| **Record** (What exactly happened?) | traces | Every run | Traces |
| | approvals | Your decisions | Approval log |
| | ledger | Tamper check | Ledger seal |
| | support | From your users | Support signals |

Alongside the naming, each room leads with an **interpretive layer**: the honest verdict line (from the glance) plus, only when the room is on watch, one plain **recommended action** (`glance.action`, derived from the same real state, pointing at a plain tab label), so a click answers "what does this mean and what do I do", not "here is a table".

**Native `<select>` are dark-scoped, not white.** Native option popups are OS-drawn and ignore component theming; under `[data-obsidian]` they are forced dark (`select { color-scheme: dark }` + `option/optgroup { background: var(--raised); color: var(--text-primary) }` in `styles.css`). Designed surfaces still prefer the themed shadcn `Select`; this is the floor so no native dropdown flashes the light-theme white.

---

## 7. Charts and data visualization

**Two interactive chart primitives, split by kind (founder ruling 2026-07-07): TRENDS are modern and exact; BARS are hand-drawn pencil.** Both are interactive and state their scale, so a data point is never mute. The split is deliberate: the founder wants trend lines to read as precise machine telemetry, and bar charts to keep the warm, human, hand-drawn look (never a machined rectangle).

- **A line, area, or values-over-time trend (it goes up and down) uses `GraphSlider`** (`src/components/obsidian/graph-slider.tsx`). A grayscale base line with a colored layer revealed to a scrub cursor, a dot plus a tracking value readout, always-on peak and low markers, and an optional dashed `baseline` (what it is measured against). Pointer scrub plus keyboard (arrows, Home, End); `role="slider"` with `aria-valuetext`. Reference: rauno.me/craft/graph-slider.
- **A multi-bar chart (bars comparing days or categories) uses `SketchBarChart`** (`src/components/supaprod/Sketch.tsx`). The hand-drawn pencil SketchBar aesthetic, kept and made interpretable: on hover/focus the active bar's value AND its x-axis label (the date or category) float directly above that bar (never parked at an edge, so the read is where the eye is), the active bar spotlighted with a soft glow, an always-visible peak (top number) and floor (bottom number), and an optional dashed baseline; non-active bars dim. This is the pencil exception to "the machine draws exact": bars stay pencil, deliberately.
- **A single value (a progress meter, gauge, or one fill) is not a chart** and stays a plain bar or number; it does not get the chart treatment.

**Pencil scope:** `SketchBarChart` (all app bar charts), the PM's annotation layer (`pencil-mark.tsx`: designations, the best-bet wink), and the marketing landing page. `SketchLine` is retired from app trends (use `GraphSlider`) and kept for the landing page only.

**Chart colors come from the DATA palette, never the role colors.** Role colors (ember, glacier, moss, madder) are reserved for state and voice. Series map by meaning: spend or cost `var(--tangerine)`; machine score, quality, drift, or eval `var(--teal)`; decisions, counts, or benchmarks `var(--cornflower)`; user behavior or engagement `var(--flamingo)`. A chart may carry at most one ember "needs a human" marker, nothing else ember.

Every chart takes a `formatValue` (so a number reads as `$4.20`, `72`, or `18%`, never a bare float), an `ariaLabel`, and a `baseline` (plus `baselineLabel`) when the data has a gate, target, or prior. Real data only: a sparse or absent series renders an honest empty state, never an invented curve.

**Every chart surfaces an insight, not just the data (founder ruling 2026-07-07).** A chart is a read, not a wall of bars. The bar chart (`SketchBarChart`) auto-derives a plain-language takeaway via `barInsight` (direction, magnitude, and where the peak sits) and renders it in the pencil hand above the bars, and it rides the chart's `aria-label` so an agent reading the accessible tree gets the same read, not just the raw bars. A caller may pass an `insight` prop to override with a domain-specific takeaway. Honest numbers only, never a claim the data does not support. Trends (`GraphSlider`) convey their read through the trend shape, the peak/low markers, and the scrub readout.

---

## 8. Applying this to a new (or retrofitted) surface

A checklist for any object card, row, node, or detail:

1. **Card:** color-tiered score anchor (left) · title primary · quiet spaced `·` meta · status + verdict chips · faint trace-and-time tail · one primary action, `⋯` for secondary · the whole body opens the detail on a single click (with Enter/Space + focus ring).
2. **Detail:** assemble from DetailKit in order (DetailHeader -> summary/priority band -> StatStrip -> DetailSections -> actions footer). Never hand-roll a bespoke detail layout.
3. **Trace ref:** use `traceRef(id)` with the type's registered prefix; render it quiet; make the full id copyable in the detail.
4. **Timestamps:** show created + updated (relative on the card, absolute in the detail); time is a touch more present than the id.
5. **Provenance:** link back up the loop; reuse the lineage view.
6. **Status:** a mono-caps pill on the object, never buried in a menu.
7. **Color:** semantic only; ember reserved for Capture; monotone bodies with meaningful accents; no hex.
8. **Gate:** `tsc --noEmit` + `bun run build` + the surface's tests green; no em/en dashes in additions.

---

## Related

- [`design/archive/loom-v4.md`](../design/archive/loom-v4.md), the design contract (§0.1 dimension 17 is the binding short form of this reference; dimensions 1 to 16 are the wider Consumer Production Doctrine)
- [`design/archive/obsidian-v3.md`](../design/archive/obsidian-v3.md), the v3 base design system (tokens, role colors, restraint budget) that Loom is additive over
- [`../features/opportunity-ranking.md`](../features/opportunity-ranking.md), the DEC-RANK feature doc (ranking + best bet + designations, the built exemplar)
- [`features/archive/obsidian-v3-port.md`](../features/archive/obsidian-v3-port.md), the surface-by-surface port to the v3/Loom system
- [`ui-voice.md`](./ui-voice.md), UI copy length budgets + the AI-tell denylist
- [`humanized-output.md`](./humanized-output.md), the zero-AI-fingerprint rule
- [`engine-room-doctrine.md`](./engine-room-doctrine.md), outcome-first naming (complexity lives in the engine, never the experience)
- [`planning/archive/build-log.md`](../planning/archive/build-log.md) §4, the dated build log (the Discover/Decide redesign chain)
