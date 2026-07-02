# OBS-15 · Chart grammar adoption (incl. the pencil layer)

> _Created: 2026-07-02 · The finest-grain, self-contained build+implementation spec for OBS-15. Pick this cold and build it without opening another file. Shared canon: [`README.md`](./README.md) (the hub). When this disagrees with the contract, the contract wins._

## 1. Snapshot

| Field | Value |
| --- | --- |
| ID | OBS-15 |
| Rank | #16 (dashboard) |
| Tier | 2 |
| Status | pending |
| Category | Cockpit (cross-cutting rule set) |
| Depends on | rides OBS-05 (Build), OBS-08 (Brain), OBS-09 (Engine Room); transitively OBS-01 tokens, OBS-03 primitives |
| Blocks | nothing downstream |
| One-line what | Apply extensions §6 chart grammar wherever data draws: slate axes, teal machine series, dashed cobalt benchmarks, max 3 families, obsidian sparklines, the pencil layer (machine draws exact, human draws pencil), aurora only on score moments. |
| Dashboard row | [`../feature-dashboard.md`](../feature-dashboard.md) group G14, row OBS-15 |
| Summary bible | [`../obsidian-port-plan.md`](../obsidian-port-plan.md) |

## 2. Why we are doing it

Obsidian's third law is **depth on demand**, and every data drawing is a depth affordance: a chart is where the machine shows its receipts. Today the app draws data in the parchment idiom, where a 2026-06-12 founder ruling made every mark hand-sketched (jittered double-stroke lines, hatched bars) so charts read like pencil on paper. Obsidian **reverses that ruling for the machine's own work**: the machine draws exact precise vectors, and only the human draws pencil. This is not a style tweak. It is the felt statement of the product thesis. When the machine's line is crisp and only the PM's own annotation is rough graphite, the interface says plainly which marks are the instrument's measurement and which are a person's judgment on top of it.

The felt user outcome: a PM glances at a spend trend and instantly trusts it, because the teal line is a clean measurement, not a decorative wobble; then their own pencil circle around the one week that mattered reads unmistakably as their hand, not the system's. Cool works (teal, slate, cornflower) carry the machine's data; warm ember never plots a series and appears in a chart only as a single needs-a-human point marker. That is law two (one queue for attention, ember reserved) enforced down at the pixel of a data point.

The v11 tie is trust at the point of decision: charts are where a decision gets its evidence, so their restraint is load bearing. The engine-room-doctrine tie is calm front, deep engine: charts live behind the surfaces (Build cost, Brain stats, Engine Room trends), never nagging, never decorative, every family earning its place under the max-three law.

This item exists because OBS-05/08/09 each port a surface that draws data, and without one shared grammar those three lanes would each reinvent axis colors, series colors, and sparkline weights, and the coherence the port is buying would leak exactly where trust is highest. OBS-15 is the single rule set plus the shared component so all three draw identically.

## 3. What we are building

**Scope IN**

- A shared Obsidian chart-grammar module (`src/components/obsidian/chart.tsx`) that renders precise machine data: `ChartFrame`, `SeriesLine` (exact teal vector), `Benchmark` (dashed cornflower/cobalt), `Axes` (slate 40% 1px + ash mono labels), `Sparkline` (obsidian single-series), `ChartTooltip`, and `NeedsHumanPoint` (the one ember marker).
- The pencil layer (`src/components/obsidian/pencil-mark.tsx`): rough-SVG human annotations only: `PencilLabel` (Caveat), `PencilCircle`, `PencilArrow`, `PencilUnderline`, in pencil inks only, one pass, no fill, deterministic jitter, inside the two-per-screen budget, never touching axes or series.
- Rewiring every data drawing on the three obsidian data surfaces to this grammar: Build mission cost (OBS-05 slide-over), Brain stat-trio sparklines + belief-graph edges (OBS-08), Engine Room daily spend + quality/eval/drift trends (OBS-09).
- The obsidian barrel export (`src/components/obsidian/index.ts`) gains the chart + pencil exports.
- Aurora stays the ONLY sanctioned abstract wash on a chart, and only when the chart IS a score moment (loop health, teardown confidence, outcome score). Ordinary data charts stay flat obsidian.
- Empty-chart instruction states with a time estimate (extensions §6, §9).

**Scope OUT (no feature work rides along)**

- No server function, no query, no data shape changes. Charts consume existing server-fn output **read-only**: `getAgentAnalyticsDetail` / `analytics.functions`, `getProductAnalytics` / `product-analytics.functions`, and whatever OBS-05/08/09 already read for cost, stats, and trends. This item must not touch any `*.functions.ts`.
- No new metric, no new data series that does not already exist.
- No parchment route. `src/components/cadence/Sketch.tsx` stays byte-untouched (the ~50 parchment routes still use it until OBS-10 folds them). OBS-15 only stops the OBSIDIAN surfaces from using it.
- The recharts shadcn wrapper `src/components/ui/chart.tsx` is not migrated (it is effectively unused shell chrome, only the wrapper file imports recharts). Do not delete it here; note it for OBS-10 cleanup.
- Landing page and any parchment surface: out of scope, byte-untouched.

## 4. Current state

Real files as of 2026-07-02, verified by read:

- **`src/components/cadence/Sketch.tsx`** (214 lines): the parchment data-mark law. `SketchLine` (jittered double-stroke sparkline, deterministic `mulberry32` seed, `sketchPath` wobble, hand dot on last point) and `SketchBar` (jittered outline + diagonal hatch). Colors are parchment tokens: `var(--action-blue)`, `var(--ember)`, `var(--rose)`, `var(--emerald)`. **This conflates machine data with hand jitter, which Obsidian reverses.** Keep the deterministic-jitter maths (`mulberry32`, `seedOf`, the segment-subdivision walk); it is the right engine for the pencil layer. Do not reuse it for machine series.
- **`src/routes/_authenticated.today.tsx`** (imports `SketchLine, SketchBar` at line 50; uses at ~720 and ~808): parchment. Today is OBS-04, not an OBS-15 surface, but if OBS-04 left any sketch mark on an obsidian Today it must convert (verify at build time). The 7-day series feeds the sketched sparkline.
- **`src/components/observe/AgentSpendDetail.tsx`** (289 lines): Engine Room drill-down (`?agent=` on `/govern?tab=analytics`). Uses `SketchLine` for "Daily spend · last 8 days" with `color="var(--ember)"` (line 152). Reads `getAgentAnalyticsDetail` (real ledger data). This is a prime OBS-15 convert: the machine's spend series must become an exact teal line, not a jittered ember one.
- **`src/components/product/ProductAnalyticsPanel.tsx`** (250 lines): a div-based `Sparkline` (line 24, `bg-indigo-400` bars, Tailwind slate chrome, `lucide-react` icons `BarChart2/Link2/RefreshCw/Loader2/CheckCircle/X`). Parchment/tailwind idiom. If OBS-06/OBS-08 render this panel on an obsidian surface, its sparkline + chrome + lucide convert.
- **`src/components/knowledge/GraphExplorer.tsx`** (193 lines) and **`src/components/cadence/MissionGraph.tsx`** (212 lines): SVG node/edge graphs (the belief graph territory for Brain / OBS-08). Edges and nodes are drawn marks; under OBS-15 edges are machine structure (slate/teal family, exact), never role-color.
- **`src/components/ui/chart.tsx`** (331 lines): the shadcn recharts `ChartContainer`. recharts is imported in exactly two files (this wrapper + the grep-adjacent consumer); the real chart surface in the app is hand-rolled SVG and div marks, not recharts. So OBS-15 is an SVG-grammar port, not a recharts migration.
- **`src/styles.css`**: already ships `.sketch-draw` / `.sketch-dot` keyframes (line ~1222) and the `data-motion="off"` kill switch. The obsidian token layer (`[data-obsidian]`, `--teal`, `--slate`, `--cornflower`, `--cobalt`, `--ash`, `--pencil-lime/-blossom/-apricot`, `--font-pencil`, `--font-mono`) is introduced by OBS-01. Verify OBS-01 has landed (`grep data-obsidian src/styles.css`) before starting.
- **`src/components/obsidian/`** (created by OBS-03): the obsidian primitive barrel (`index.ts`, `primitives.tsx`, `pencil.tsx` = the `PencilNote` label, `aurora.tsx`, etc.). OBS-15 adds two files to this folder and reuses `aurora.tsx` for score moments and `pencil.tsx` inks.

What stays: `Sketch.tsx`, all parchment routes, the recharts wrapper, every server fn. What changes: the data drawings on OBS-05/08/09 surfaces point at the new grammar.

## 5. How, step by step

Build top to bottom. Each step names the file and the change.

1. **Confirm foundation.** `grep -n "data-obsidian\|--teal\|--slate\|--pencil-lime\|--font-pencil" src/styles.css`. If absent, stop; OBS-01 has not landed. Confirm `src/components/obsidian/index.ts` exists (OBS-03). Confirm OBS-05/08/09 have shipped their surfaces (this rides them).

2. **Create `src/components/obsidian/chart.tsx`.** The precise machine-data grammar. No jitter anywhere in this file. Export:
   - `ChartFrame({ w, h, children, pad })` - an `<svg>` with no border, no fill (the card is the frame). Renders `aria-hidden="true"` on pure-decoration layers; the data itself gets an accessible label via the caller.
   - `Axes({ w, h, xTicks, yTicks })` - grid + axis lines `stroke="var(--slate)"` `stroke-opacity="0.4"` `stroke-width="1"`; axis tick labels in `--font-mono` 8.5px caps, `fill="var(--ash)"`, 0.10em tracking.
   - `SeriesLine({ points, color })` - a single exact `<polyline>`/`<path>` (straight segments, no `sketchPath`), `stroke` default `var(--teal)`, 1.5px, round joins, no jitter. This is the machine's series.
   - `Benchmark({ points })` - dashed baseline, `stroke="var(--cornflower)"` (or `--cobalt` for a second baseline), `stroke-dasharray="4 3"`, 1px.
   - `NeedsHumanPoint({ x, y })` - the ONE ember dot allowed in a chart: `r=3`, `fill="var(--ember)"`, glow `0 0 10px 2px` ember, only where a data point needs a human. Max one per chart.
   - `Sparkline({ data, color, w=210, h=42, baseline })` - obsidian sparkline: single exact series 1.5px `var(--teal)` (or the caller's family), no axes, no dots except the last value (`r=3`, family color). Optional dashed `--slate` baseline. This is the obsidian replacement for `SketchLine` on machine data. Keep the same prop shape as `SketchLine` (`data`, `color`, `w`, `h`, `baseline`) so surface call sites swap the import, not the props.
   - `ChartTooltip({ x, y, rows })` - `--raised` card, radius 8, `--hairline`, mono values, series name in its family color, no glow.

3. **Create `src/components/obsidian/pencil-mark.tsx`.** The pencil layer: rough SVG, human marks only. Reuse the deterministic jitter engine copied verbatim from `Sketch.tsx` (`mulberry32`, `seedOf`, a one-pass `roughPath` derived from `sketchPath` but a SINGLE stroke, no second pass, no fill). Export:
   - `PencilCircle({ cx, cy, r, ink })` - a rough near-circle (jittered arc that slightly overshoots its start, one pass), `stroke` = pencil ink, ~1.5px, no fill.
   - `PencilArrow({ from, to, ink })` - a hand arrow: one rough shaft + two short rough barbs at the head.
   - `PencilUnderline({ x1, x2, y, ink })` - a wavy underline (jittered horizontal path).
   - `PencilLabel({ x, y, children, ink, rotate=-2 })` - Caveat (`--font-pencil`) ~17px text in a pencil ink, rotated ~-2deg, `role="note"`.
   - Ink prop is one of `--pencil-lime` (strongest bet), `--pencil-blossom` (pet feature), `--pencil-apricot` (scope creep). Default `--pencil-lime`.
   - Every export takes an optional `seed` so neighbouring marks do not share a wobble; default seed derives from position.
   - These are NOT `aria-hidden`; a pencil mark is the PM's voice (`role="note"`), matching `PencilNote` in OBS-03.

4. **Export both from the barrel.** `src/components/obsidian/index.ts`: add `export * from "./chart"` and `export * from "./pencil-mark"`.

5. **Convert Engine Room daily spend** (`src/components/observe/AgentSpendDetail.tsx`, only if this component renders inside the obsidian Engine Room per OBS-09; if OBS-09 replaced it, apply the same edit in the replacement). Swap `import { SketchLine } from "@/components/cadence/Sketch"` for `import { Sparkline } from "@/components/obsidian"`; render `<Sparkline data={d.dailySpend.map(x => x.cost)} w={300} h={48} color="var(--teal)" />` (machine spend is the machine's series; teal, exact). Ember stays reserved. Convert the parchment tokens (`var(--ember)`, `var(--ink-*)`, `var(--action-blue)`, `var(--rose)`, `var(--emerald)`) to obsidian tokens per OBS-09's surface conventions; drop any `lucide` chrome per the port. The spend value stat and table stay; only the drawn mark changes to the grammar.

6. **Convert Engine Room quality / eval / drift trends** (whatever OBS-09 renders for the Quality room). Trend line = `SeriesLine`/`Sparkline` teal; the eval gate / drift-zero reference line = `Benchmark` dashed cornflower (an instrument, not an observation). Max three families per chart.

7. **Convert Brain stat-trio sparklines** (OBS-08). Each stat card's trend = obsidian `Sparkline`, single series, family color (teal for machine-measured stats; the stat trio anatomy stays contract §9: Newsreader numeral + mono micro-label). No jitter.

8. **Convert Brain belief-graph edges** (`GraphExplorer.tsx` / `MissionGraph.tsx` if they are the obsidian belief graph per OBS-08). Edges are machine structure: slate/teal family, exact vectors, never a role color. Nodes follow the object anatomy. Do not add pencil to the graph unless a single PM annotation points at one node, inside the two-per-screen budget.

9. **Convert Build mission cost** (OBS-05 slide-over). Mission cost drawn as an obsidian `Sparkline`/`SeriesLine` (spend family tangerine `#F97316` is allowed here since spend is the subject, or teal if it is the machine's own cost series; pick one per the surface and stay under three families). Cost value stays mono.

10. **Add the pencil layer where the surface calls for it** (call-site decision, max two per screen). Example: in the Engine Room spend room, a `PencilCircle` + `PencilLabel` ("watch this week", `--pencil-apricot`) around the one spike that matters. Never on axes or series. Count it against the restraint budget with any existing `PencilNote`.

11. **Empty-chart states.** Every chart that can be empty renders the instruction, not a ghost: see §9 copy. No zero-height ghost line, no illustration.

12. **Write tests** `src/components/obsidian/__tests__/chart.test.tsx`: (a) `Sparkline` with a known series produces a `<polyline>`/`<path>` with the exact expected point count and NO jittered interior points (assert the path has `data.length` vertices, straight); (b) `SeriesLine` default stroke is `var(--teal)`; (c) `Benchmark` renders `stroke-dasharray="4 3"` and `var(--cornflower)`; (d) `NeedsHumanPoint` is the only ember and there is at most one; (e) `Axes` uses `var(--slate)` at 0.4 opacity. And `pencil-mark.test.tsx`: (f) `PencilCircle` renders a rough path (more than 4 vertices) that is deterministic across two renders with the same seed (snapshot equality); (g) pencil marks only use pencil inks (assert stroke is one of the three); (h) `PencilLabel` renders `role="note"` in `--font-pencil`.

13. **Manual verification** (`bun run dev`): open each converted surface at 1440px against the prototype; confirm axes are slate hairlines, the machine series is a crisp teal line (not wobbly), benchmarks are dashed cornflower, at most one ember point, at most two pencil marks, and the pencil marks read as hand-drawn while the series reads as exact. Toggle OS reduced-motion and confirm no chart animates on mount (progress only animates on change).

## 6. Structure

Component tree (new + reused):

```
src/components/obsidian/
├── index.ts                (barrel - ADD chart + pencil-mark exports)
├── chart.tsx               (NEW - the precise machine-data grammar)
│   ├── ChartFrame
│   ├── Axes
│   ├── SeriesLine          (exact teal vector)
│   ├── Benchmark           (dashed cornflower/cobalt)
│   ├── NeedsHumanPoint     (the one ember marker)
│   ├── Sparkline           (obsidian single-series; SketchLine's prop shape)
│   └── ChartTooltip
├── pencil-mark.tsx         (NEW - the pencil layer, rough SVG, human only)
│   ├── PencilCircle
│   ├── PencilArrow
│   ├── PencilUnderline
│   └── PencilLabel         (Caveat, role="note")
├── pencil.tsx              (REUSED - PencilNote label from OBS-03)
├── aurora.tsx              (REUSED - score-moment washes from OBS-03)
└── __tests__/
    ├── chart.test.tsx      (NEW)
    └── pencil-mark.test.tsx(NEW)
```

Surfaces edited (import swap + token swap only; no logic change):

```
Engine Room (OBS-09):  src/components/observe/AgentSpendDetail.tsx  (or its OBS-09 replacement)
                       + the Quality/eval/drift trend component
Brain (OBS-08):        stat-trio sparklines + belief graph
                       (GraphExplorer.tsx / MissionGraph.tsx if obsidian)
Build (OBS-05):        mission cost drawing in the slide-over
```

**Data flow.** Every new component is pure props in, SVG out. **Server fns are consumed read-only, never modified.** The surfaces already own their queries: `getAgentAnalyticsDetail` (`analytics.functions`, query key `["agent-spend-detail", id, DAYS]`), `getProductAnalytics` (`product-analytics.functions`, key `["product-analytics", opportunityId]`), and the OBS-05/08/09 cost/stat/trend queries. OBS-15 changes only the mark that renders those numbers. **This item is explicitly not allowed to touch any `*.functions.ts` or add a query.**

## 7. Design elements

Exact token values this surface uses (quoted from hub §5, DESIGN-OBSIDIAN §3/§6, extensions §6). Never invent a hex.

**Working palette (data only; role colors never plot data):**

- Machine series: `--teal #2E9E8F` (loop health, uptime, the machine's own trend).
- Spend/cost: `--tangerine #F97316` · `--marigold-data #E8A33D` · `--melon #FF9466`.
- Benchmarks/baselines: `--cornflower #6B8AFD` · `--cobalt #3B5BDB` (dashed).
- User behavior: `--flamingo #F26B8A` · `--magenta #C2337E` · `--rose #E89AB0`.
- Agent identity: `--mauve #B78BC7` · `--amethyst #7E5AA6` (one fixed shade per face).
- Safety severity ONLY: `--scarlet #E23D33` · `--poppy #F0533F`.
- Annotations/density: `--lemon #F2E27A` · `--daffodil #F5D94E`.
- Axes/grids/disabled: `--pearl #EDEAE4` · `--ash #A8A29A` · `--slate #6E6A64`.
- Pencil inks (human marks only): `--pencil-lime #CDE07A` (strongest bet) · `--pencil-blossom #E5BDDF` (pet feature) · `--pencil-apricot #FFB27A` (scope creep).
- **Laws: max three families per chart · caramel/brown banned · role colors (ember, glacier, blossom, moss, madder, marigold) NEVER plot a data series.**

**Role color that may enter a chart:** `--ember #FF6B2C` only as a single `NeedsHumanPoint` marker, `r=3`, glow `0 0 10px 2px` ember, max one per chart. Nothing else warm.

**Geometry / weights:**

- Axes and grid: `--slate` at 40% opacity, 1px.
- Axis tick labels: `--font-mono "JetBrains Mono"` 8.5px caps, 0.10em tracking, `--ash`.
- Machine series line: exact vector, 1.5px, round joins, `--teal`.
- Benchmark: `--cornflower`/`--cobalt`, 1px, `stroke-dasharray="4 3"`.
- Sparkline: single series 1.5px, no axes, no dots except the last value at `r=3` in the family color.
- Pencil marks: pencil ink, ~1.5px stroke, one pass, no fill; `PencilLabel` `--font-pencil` ~17px rotated -2deg.
- Tooltip: `--raised #17171A` card, radius `--radius-control 8`, `--hairline rgba(255,255,255,0.07)`, mono values, series name in family color, no glow.
- Card frame (the chart's container): `--card #111113`, radius `--radius-card 12`, `--hairline` edge. The chart draws NO border of its own.

**Aurora (score moments only):** the drifting radial wash + Codystar numeral (`--font-dotted "Codystar"`, `--text-score 52px`) from `aurora.tsx`, keyframes `cadDriftA` (9s) / `cadDriftB` (12s). Hue encodes state: moss-forward healthy, ember-forward needs attention, madder-forward failing. Only when the chart IS a score (loop health, teardown confidence, outcome score). Ordinary data charts stay flat obsidian. Max one aurora card per screen. Aurora blob layers `aria-hidden="true"`.

**Motion:** one easing `--ease cubic-bezier(0.23,1,0.32,1)`. A sparkline pen-in (if opted) uses `--dur-page 280ms`; progress widths transition 280ms **only on change, never from zero on mount** (decoration never animates). All motion gates on `prefers-reduced-motion` and `data-motion="off"`.

**Interaction states (design every one):**

- **Hover (a data point / tooltip trigger):** background lifts one surface step (`--card` -> `--raised`) and the hairline brightens; the `ChartTooltip` appears at the point; nothing translates. 140ms.
- **Focus (keyboard on an interactive chart control):** 2px glacier outline offset 2 (`:focus-visible`).
- **Active/press (a chart that is a button-row, e.g. a stat card that drills in):** scale(0.985) for 140ms.
- **Empty:** the instruction card (see §9), no ghost line, no illustration.
- **Loading:** the surface's existing quiet mono "Loading…" label; the chart area stays blank neutral, no skeleton shimmer bar (shimmer is reserved for the machine actively working, max one per screen).
- **Error:** the surface's existing error card (mono-caps label + retry). The chart simply does not render; it never draws a broken axis.

## 8. Restructuring / renaming / modification

- **NEW:** `src/components/obsidian/chart.tsx`, `src/components/obsidian/pencil-mark.tsx`, `src/components/obsidian/__tests__/chart.test.tsx`, `src/components/obsidian/__tests__/pencil-mark.test.tsx`.
- **MODIFY:** `src/components/obsidian/index.ts` (add two exports).
- **MODIFY (import + token swap only):** the OBS-05/08/09 data-drawing components (e.g. `src/components/observe/AgentSpendDetail.tsx` or its OBS-09 replacement, Brain stat-trio + belief graph, Build mission cost). Swap `Sketch`/parchment sparkline imports for `@/components/obsidian`; convert parchment color tokens to obsidian.
- **lucide removal:** any converted component that imported `lucide-react` (e.g. `ProductAnalyticsPanel.tsx` if it is rendered on an obsidian surface) drops the icons per §5.8; status is a 6px glowing dot + mono word, affordances are unicode in mono. Only remove lucide from the components OBS-15 actually converts; not a big-bang delete.
- **NO deletion:** `src/components/cadence/Sketch.tsx` stays (parchment routes still use it until OBS-10). `src/components/ui/chart.tsx` (recharts wrapper) stays; note it for OBS-10 cleanup.
- **No route fold, no redirect, no nav-model edit** (those are OBS-10). OBS-15 touches no routes, so `routeTree.gen.ts` does not regenerate.

## 9. Copy / voice

Humanized: no em/en dashes, no exclamation marks, plain words, mono-caps metadata with middots.

- **Axis / stat labels (mono-caps):** `SPEND · 30D` · `DAILY · LAST 8 DAYS` · `LOOP HEALTH` · `p50 LATENCY`.
- **Tooltip rows (mono):** `MAR 14 · $0.84` · `BENCHMARK · $1.20`.
- **Pencil labels (Caveat, PM voice, one wink max per screen):** `watch this week` · `our best bet` · `scope creep here`.
- **Empty states (instruction with a time estimate, per extensions §6/§9):**
  - Spend chart: `No spend yet. The first mission draws this line.`
  - Build cost: `The cockpit is idle. Send something worth building from Discover.`
  - Brain record: `Your track record starts with the first call. Answer one on Today.`
  - Engine Room all clear: `Four rooms, nothing burning. Come back when a chip turns marigold.`
- **NeedsHumanPoint helper (if a label is shown):** plain, consequence-first, e.g. `Spend crossed the cap here. Add headroom or it pauses.`

Never a blank box, never an illustration, never an exclamation mark, never a mechanism name on a control.

## 10. Acceptance criteria

- [ ] Every data drawing on Build / Brain / Engine Room obsidian surfaces uses the OBS-15 grammar; none imports `src/components/cadence/Sketch.tsx`.
- [ ] Axes and grids are `--slate` at 40% opacity, 1px; axis labels are `--font-mono` 8.5px caps in `--ash`.
- [ ] The machine's data series is an EXACT `--teal` vector (no jitter). Benchmarks are `--cornflower`/`--cobalt` dashed 4/3.
- [ ] No chart draws its own border or fill; the card is the frame.
- [ ] No role color (ember, glacier, blossom, moss, madder, marigold) plots a data series. Ember appears in a chart only as at most one `NeedsHumanPoint`.
- [ ] No chart exceeds three families.
- [ ] Sparklines are single-series 1.5px with a dot only on the last value.
- [ ] Every human mark on a chart is a rough-SVG pencil mark in a pencil ink, one pass, no fill, `role="note"`, never touching axes or series; at most two pencil marks per screen.
- [ ] Aurora appears on a chart only when the chart IS a score moment; ordinary data charts are flat obsidian; at most one aurora card per screen.
- [ ] Every empty chart renders an instruction with a time estimate, not a ghost line.
- [ ] Tests in §5 step 12 pass.
- [ ] tsc 0, `bun test` green, grayscale test passes, restraint budget audited, `impeccable` clean on every new string.

## 11. Prototype-parity checklist (the last gate, tailored)

Open the prototype (`design-reference/obsidian-v3/design-reference/cadence-app.html`) and each converted surface side by side at 1440px:

1. **Frame:** chart sits in a `--card` (`#111113`) radius-12 with a `--hairline` edge; the chart itself draws no border or fill.
2. **Axes / labels:** slate 40% 1px grid; mono 8.5px caps `--ash` tick labels; matches the prototype's chart chrome.
3. **Series:** machine series exact teal, benchmarks dashed cornflower; zero hexes outside the working palette; no role color on any series.
4. **Ember:** at most one `NeedsHumanPoint`, glow `0 0 10px 2px`; ember nowhere else in the chart.
5. **Pencil:** human marks read as hand-drawn graphite (rough, one pass) while the series reads as exact; at most two pencil marks; pencil inks only; never on axes/series.
6. **Aurora:** present only on genuine score moments; ordinary charts flat; at most one per screen.
7. **Motion:** no chart animates on mount; progress animates only on change; reduced-motion and `data-motion="off"` kill all chart motion.
8. **Grayscale + restraint:** the chart still reads with color removed (every status has its word), and the restraint budget (one ember, one aurora, two pencils, three families) holds. Screenshots in the ship report.

## 12. Verification + gates

- **tsc:** `bun run tsc --noEmit` (or the repo's `tsc` script) = 0.
- **Tests:** `bun test src/components/obsidian/__tests__/chart.test.tsx src/components/obsidian/__tests__/pencil-mark.test.tsx` green; plus the existing obsidian primitive tests still green.
- **Build:** `bun run build` is RED in lane worktrees on the pre-existing node20-vs-ESM `lovable-tagger` `require()` error (hub §11) - in a worktree treat `tsc --noEmit` + `bun test` as the real gates; run full `bun run build` on the primary checkout before publish. Do not chase the lovable-tagger error.
- **Grayscale test:** screenshot each chart, desaturate; meaning must survive (every status has its mono word; the machine series is legible by weight, not just color).
- **Restraint budget:** audit each screen: one ember, at most one aurora, at most two pencils, at most three families, status color only on status.
- **impeccable / humanized scan:** grep every new string for `-`, `-`, `!`, and the banned words (seamlessly, leverage, empower, robust, unlock, delve); zero hits.
- **Manual:** the §5 step 13 walk on Build / Brain / Engine Room at 1440px, side by side with the prototype, plus reduced-motion toggle. Screenshots (including a grayscale one) in the ship report.
- **On completion:** flip the OBS-15 dashboard row + all four dashboard sections (row, header, by-status table, by-category table) in the same commit; remove the Active-claims line; update this folder + `../obsidian-port-plan.md` + `docs/features/obsidian-port.md` + `plan.md` §4.

## 13. Risks · gotchas · founder-gates

- **The reversal risk (highest).** The 2026-06-12 parchment ruling made machine data hand-sketched; OBS-15 reverses it for obsidian (machine exact, human pencil). Do NOT reuse `SketchLine`/`SketchBar` jitter for a machine series; that would re-import the parchment law and blur the exact/pencil distinction that is the whole point. The jitter engine is only for the pencil layer.
- **Family-count creep.** A busy Engine Room trend can quietly acquire a fourth family (spend + benchmark + severity + user). Hold the max-three law; if a chart needs four, it is two charts.
- **Pencil budget bleed.** Pencil marks count against the two-per-screen annotation budget shared with `PencilNote`. A chart pencil plus a surface `PencilNote` is already the whole budget. Audit per screen, not per chart.
- **Belief-graph edges.** It is tempting to color graph edges by relationship type with role colors; do not. Edges are machine structure (slate/teal family), exact vectors.
- **Deterministic jitter.** Pencil marks must be seeded (like `Sketch.tsx`) so they never wobble between renders. Snapshot-test this.
- **Aurora overreach.** Aurora is not a chart decoration. A spend chart is not a score. Reserve it for loop health / teardown confidence / outcome scores only.
- **Founder-gates:** none. The pencil layer and the machine-exact reversal are already founder rulings (2026-07-02, folded into extensions §6). No new founder decision is required. If a surface reveals a data series that has no home family, surface it rather than inventing a color.

## 14. Interlinks

- **Hub (shared canon):** [`README.md`](./README.md) - §4 restraint budget, §5.4 working palette, §5.6 aurora + motion, §5.9 parity checklist, §11 build-gate note.
- **Build-order neighbors (the surfaces this rides):** [`OBS-05.md`](./OBS-05.md) (Build cost), [`OBS-08.md`](./OBS-08.md) (Brain stat trio sparklines + belief graph), [`OBS-09.md`](./OBS-09.md) (Engine Room spend + quality/eval/drift trends). Primitive source: [`OBS-03.md`](./OBS-03.md) (`aurora.tsx`, `pencil.tsx`, the obsidian barrel this item extends). Later cleanup: [`OBS-10.md`](./OBS-10.md) (folds parchment routes; retires `Sketch.tsx` and the recharts wrapper once no obsidian surface needs them).
- **Canon anchors:** [`../../../design-reference/obsidian-extensions.md`](../../../design-reference/obsidian-extensions.md) §6 (chart grammar + the pencil layer, read fully) and §9 (empty-state catalog). [`/DESIGN-OBSIDIAN.md`](../../../DESIGN-OBSIDIAN.md) §3 (working palette + the three-family / no-role-color laws), §4 (restraint budget), §6 (geometry, motion, aurora). [`../../../design-reference/obsidian-v3/components.md`](../../../design-reference/obsidian-v3/components.md) (Aurora score card, Pencil annotations, Sparkline anatomies). [`../../../design-reference/obsidian-v3/tokens/colors.css`](../../../design-reference/obsidian-v3/tokens/colors.css) (the frozen `--teal` / `--slate` / `--cornflower` / `--pencil-*` values). Skill entry point: `cadence-design`.
- **Strategy / doctrine tie:** [`../../strategy/v11-guiding-star.md`](../../strategy/v11-guiding-star.md) (trust at the point of decision) · [`../../conventions/engine-room-doctrine.md`](../../conventions/engine-room-doctrine.md) (calm front, deep engine) · [`../../conventions/humanized-output.md`](../../conventions/humanized-output.md).
