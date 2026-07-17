# OBS-08 · Brain ported (the record)

> _Created: 2026-07-02 · The finest-grain, self-contained build+implementation spec for the Brain surface port. Read the hub first ([`README.md`](./README.md)); this file embeds everything else it needs._

## 1. Snapshot

| Field         | Value                                                                                                                                                                                                                                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID            | OBS-08                                                                                                                                                                                                                                                                                                               |
| Rank          | #9                                                                                                                                                                                                                                                                                                                   |
| Tier          | 1                                                                                                                                                                                                                                                                                                                    |
| Status        | pending                                                                                                                                                                                                                                                                                                              |
| Category      | Knowledge                                                                                                                                                                                                                                                                                                            |
| Depends on    | OBS-03 (Obsidian primitives) · transitively OBS-01, OBS-02                                                                                                                                                                                                                                                           |
| Blocks        | nothing downstream (OBS-10 folds routes after all five surfaces exist, but does not block on this presentation port)                                                                                                                                                                                                 |
| One-line what | Brain ported: a stat trio (Newsreader numerals + mono micro-labels) with "Export my record", decision rows with outcome verdict chips, learning rows with what-they-moved lines in glacier mono, and the belief graph surface reusing the existing F-IA-BRAIN-GRAPH data flow (presentation ported, data untouched). |
| Dashboard row | [`../feature-dashboard.md`](../feature-dashboard.md) group G14, row OBS-08                                                                                                                                                                                                                                           |
| Summary bible | [`../obsidian-port-plan.md`](../obsidian-port-plan.md)                                                                                                                                                                                                                                                               |

## 2. Why we are doing it

Brain is destination **05** in the fixed five-destination rail: the user's record of what the loop decided, what those decisions became, and how belief moved. Today it is the parchment `Knowledge` surface, imported per-page, wearing lucide icons and the Ember Editorial palette. It reads like scaffolding. This port makes the record legible as a calm instrument: the machine's accrued judgment glows cool, and the only thing the surface ever asks a human is nothing at all (Brain has no gates; approvals are Calls on Today).

This serves Obsidian **law one, one object one anatomy**: an Outcome verdict and a Learning render identically here and everywhere else. The verdict chip is the single status language for a rendered judgment. It serves **law three, depth on demand**: the surface is a quiet list of decisions and learnings; the belief graph is the deeper layer, reached by tab, never dumped on the glance. It respects **law two, one queue for attention**: ember appears nowhere on Brain, because nothing here needs a human right now. That absence of ember is the point.

The felt user outcome: a PM opens Brain and sees, in three Newsreader numerals, the shape of their track record (calls made, share validated, net ICE moved), and can export it as a portable, cited record in one click. Below, every decision carries its outcome verdict; every learning states what it moved, in the machine's glacier voice. This is the v11 guiding star made visible: the decision-and-outcome layer, trust earned by keeping receipts. It is the engine-room doctrine's calm front: the belief graph (deep machinery) sits behind a tab, revealed on demand, never crowding the record.

This is **presentation and IA wiring only**. No server function changes. The belief graph's data flow (F-IA-BRAIN-GRAPH, the `artifact_lineage` traversal) is reused as-is; only its rendering is ported.

## 3. What we are building

**Scope IN**

- The Brain surface re-skinned to Obsidian, wrapped in `[data-obsidian]`, using the OBS-03 primitive set.
- A **stat trio** at the top: three Newsreader 24px numerals, each with a mono micro-label, sourced from real data only (no placeholder numbers). The trio reuses the existing `getImpactLedger` server fn (read-only).
- An **"Export my record"** secondary button that produces the portable record. It reuses the existing markdown export already backing `/impact` (`getImpactLedger` returns `markdown`). The control is present only when a record exists; otherwise it is honestly absent (no dead control).
- **Decision rows**: title · date (mono) · outcome `VerdictChip` · note. Verdict chip appears ONLY where there is a real outcome verdict (a rendered judgment), never as decoration.
- **Learning rows**: `VerdictChip` · text · a "what it moved" line in glacier mono (for example `RE-RANKED USAGE-BASED ALERTS +1.1 ICE`).
- The **belief graph** tab: the existing `GraphPanel` (canvas + tree views over `artifact_lineage`) ported to the Obsidian idiom (chrome, palette, mono view-toggle). Data flow untouched.
- The **empty-record** state as an instruction with a time estimate.
- Optional sparklines inside the stat trio per obsidian-extensions §6 (single series, 1.5px, last-value dot only), IF the ledger already exposes a series; otherwise deferred to OBS-15 (chart grammar). Do not fabricate a series.

**Scope OUT**

- No server-function edits. `getImpactLedger`, `getBrainStatus`, `getCompanyBrainStats`, `listDecisions`, the brain-insights functions, and the `artifact_lineage` graph queries are all consumed read-only.
- No route consolidation. OBS-08 keeps the surface at its current route (`/knowledge`); the fold of `/knowledge`, `/memory`, `/impact` into one Brain destination is **OBS-10**. OBS-08 ports presentation; OBS-10 wires the IA.
- No new belief-graph capability. Presentation port only (founder ruling: reuse F-IA-BRAIN-GRAPH data flow, port presentation only).
- No chart-grammar buildout beyond the sparkline note above; the full chart grammar is OBS-15.
- No shell/rail work (OBS-02); no primitive authoring (OBS-03). This surface consumes both.

**The no-feature-work boundary for THIS item:** OBS-08 reads `getImpactLedger` (stat trio + export markdown), `getBrainStatus` / `getCompanyBrainStats` (counts), `listDecisions` (decision rows), the brain-insights / learnings summaries (learning rows), and the `artifact_lineage` graph queries (belief graph) as pure data sources. It must not touch their signatures, their SQL, or their return shapes. If a needed value is not already returned (for example a dollars-saved-by-kills metric), the stat is honestly absent, not invented.

## 4. Current state

Real files as of 2026-07-02 (verify against the tree before editing):

- **Route:** `src/routes/_authenticated.knowledge.tsx` (210 lines). Titled "Brain · Supaprod". Imports `AppShell` + `TopBar` (parchment shell, per-page), `MonoLabel` / `SurfaceHeader` / `TabRow` from the parchment `Primitives.tsx`, and lucide (`Brain`, `Sparkles`). Renders a `SurfaceHeader` (kicker "Loop · Brain", lucide `Brain` icon), a "Product brain" count strip (`band-stone` class, real counts from `getBrainStatus` + `getCompanyBrainStats`, no-filler law already honored), a `MemoryUpgradeNudge`, and a `TabRow` with seven tabs: Insights · Calendar · Memory · Learnings · Decisions · Graph · Docs. Tab state rides `?tab=`; detail drills ride `?decision=` / `?learning=` / `?meeting=` / `?focusKind=&focusId=`.
- **Panels:** `src/components/knowledge/InsightsPanel.tsx` (human-lens + AI analyst, lucide-heavy, parchment vars `--emerald` / `--coral` / `--ember`), `DecisionsPanel.tsx` (bento table, already renders the parchment `VerdictChip`; drills to `?decision=`), `CompoundingPanel.tsx` (learnings), `DecisionDetail.tsx`, `LearningDetail.tsx`, `DocsPanel.tsx`, `CalendarPanel.tsx`, `GraphPanel.tsx`, plus `MemoryList.tsx` (the memory tab).
- **Belief graph (REUSE):** `src/components/knowledge/GraphPanel.tsx` is a view-toggle (lucide `Share2` / `ListTree`) over `GraphCanvasView.tsx` (the DBR-1 v1 visual canvas) and `GraphTreeView.tsx` (indented downstream lineage). Both read the same `artifact_lineage` and honor `focusKind` / `focusId` from the route. This is the F-IA-BRAIN-GRAPH data flow. **Port the chrome and palette; do not rebuild the traversal.**
- **Stat-trio + export source (REUSE):** the stat trio and export do not exist on `/knowledge` today. They exist on **`src/routes/_authenticated.impact.tsx`** (245 lines): a PM impact ledger with `Stat` tiles (22px numerals, parchment), a name field, and Copy / Download `.md` controls, all backed by `getImpactLedger` from `src/lib/pm-impact.functions.ts`. The pure aggregator is `src/lib/pm-impact.ts`, returning `{ decisions, outcomes: { total, validated, missed, hitRate }, iceShiftTotal, iceShiftAvg, wins, markdown }`. OBS-08 brings this trio + export onto Brain (presentation), reusing the same server fn.
- **What is parchment / lucide today:** the whole surface. Shell (`AppShell` / `TopBar`), `SurfaceHeader`, `TabRow`, `band-stone` strip, `MemoryUpgradeNudge`, every panel's lucide icons and parchment CSS vars (`--ink`, `--ink-subtle`, `--hairline`, `--surface`, `--emerald`, `--coral`).
- **What stays:** all server functions and the route's search-param contract (`?tab=`, `?decision=`, `?learning=`, `?meeting=`, `?focusKind=&focusId=`). The seven-tab information model stays (OBS-10 may later re-scope tabs; OBS-08 does not).
- **What changes:** the visual layer only. Shell reference (once OBS-02 hoists one shell into `_authenticated.tsx`, per its spec), palette, type, the stat trio + export brought onto the surface, verdict chips swapped to the Obsidian `VerdictChip`, lucide removed from Brain chrome, glacier "moved" lines on learnings.

## 5. How, step by step

Surgical, file by file, top to bottom. Assumes OBS-01 (`[data-obsidian]` + fonts + keyframes), OBS-02 (shell + rail), and OBS-03 (`src/components/obsidian/` primitives) have landed. Verify first: `grep data-obsidian src/styles.css` and `grep -c . src/components/obsidian/index.ts`.

1. **Confirm the shell contract.** Read OBS-02's decision on shell hoisting. If OBS-02 hoisted one shell into `src/routes/_authenticated.tsx`, remove the per-page `<AppShell>` / `<TopBar>` wrap from `_authenticated.knowledge.tsx` and render only the surface body. If OBS-02 kept per-page shells, swap this route's parchment `AppShell` for the Obsidian shell component OBS-02 exports. Do not invent a third path.

2. **Wrap the surface in Obsidian scope.** Ensure the surface body renders under the `[data-obsidian]` root established by OBS-01/02. Do not add a second `[data-obsidian]` if the shell already sets it.

3. **Port the surface header.** Replace the parchment `SurfaceHeader` (kicker + lucide `Brain` icon) with the Obsidian header pattern: a Newsreader 34px hero (`--text-hero`), one ember italic word allowed (see §9 copy), a mono-caps kicker line if the prototype shows one. Remove the lucide `Brain` and `Sparkles` imports. No icon (iconography law).

4. **Build the stat trio.** Create `src/components/knowledge/BrainStatTrio.tsx`. Consume `getImpactLedger` via `useServerFn` + `useQuery` (query key `["impact-ledger", ""]`, matching the existing key shape). Render three stat cells:
   - `128 CALLS MADE` -> `ledger.decisions` (or `outcomes.total`; pick the field that matches the prototype's "calls made" meaning: decisions logged).
   - `71% VALIDATED` -> `Math.round(outcomes.hitRate * 100) + "%"` when `hitRate !== null`, else omit the cell (honestly absent, no dash-filler beyond the ledger's own convention).
   - Third cell: net ICE moved -> `${iceShiftTotal >= 0 ? "+" : ""}${iceShiftTotal} ICE MOVED`. The prototype's example `$214k SAVED BY KILLS` is illustrative; the current ledger has NO dollars-saved metric, so render the real `iceShiftTotal` label instead. Do NOT fabricate a dollar figure.
     Each cell: Newsreader 24px numeral (`--font-serif`, 450, `--text-primary`, tabular-nums) + `MonoLabel` micro-label below (8.5px, `--text-mono-micro`, `--text-subtle`, middot-separated where it reads as metadata). Nothing renders until the query resolves (no-filler law).

5. **Add "Export my record".** In `BrainStatTrio.tsx`, render an OBS-03 `Button` variant `secondary` labeled `Export my record`, right-aligned in the trio row. On click, take `query.data.markdown` and download it (Blob `text/markdown`, `a.download = "decision-record.md"`, revoke the object URL) exactly as `_authenticated.impact.tsx` already does. **The button renders only when `markdown` is non-empty** (a record exists). When the record is empty, render the empty-record instruction (§9) instead of a dead control.

6. **Port the decision rows.** In `DecisionsPanel.tsx` (or a thin Obsidian wrapper if you must keep the parchment consumer intact for OBS-10's fold), render each row as a real `<button>` in the Obsidian idiom: title 13.5px/600 `--text-primary` · date in mono (`MonoLabel`, `--text-faint`) · the Obsidian `VerdictChip` for the outcome (approved -> `KEPT`/moss, rejected -> `KILL`/madder, pending -> `PENDING` neutral) · note in `--text-body`. Swap the parchment `VerdictChip` import for the OBS-03 one. Keep the drill to `?decision=`. **Verdict chip only where a real verdict exists**; a pending decision gets the neutral `PENDING` chip, not a colored one.

7. **Port the learning rows.** In `CompoundingPanel.tsx` (learnings), render each row: Obsidian `VerdictChip` (VALIDATED moss / MISSED madder / REVISE ember) · learning text 13px `--text-body` · a **moved-line** below in glacier mono (`--font-mono`, 10px caps, `--glacier #7FD1DC`, e.g. `RE-RANKED USAGE-BASED ALERTS +1.1 ICE`). The moved-line is the machine voice stating what the learning changed. Source the moved value from the existing learning summary (the ICE-shift field already computed by `pm-impact.ts` / brain-insights); do not compute a new one.

8. **Port the belief-graph tab.** In `GraphPanel.tsx`, replace the lucide view-toggle (`Share2` / `ListTree`) with a mono-caps toggle (`GRAPH` / `LIST`, `MonoLabel`, active state bg `--raised`, ember index color only if the prototype shows it; otherwise glacier active accent). Re-skin the toggle container to Obsidian tokens (`--hairline` border, `--radius-control 8`). **Do not touch `GraphCanvasView` / `GraphTreeView` data logic**; only their surrounding chrome and palette (canvas bg `--canvas`, node/edge colors to the working palette per OBS-15's forthcoming grammar, but for OBS-08 keep the existing node rendering and only re-skin the frame; deeper chart-grammar adoption is OBS-15).

9. **Port the count strip and remaining panels' chrome.** Re-skin the "Product brain" `band-stone` strip to an Obsidian raised strip (`--surface-card-deep`, mono-caps counts, glacier accent on live connector count). Re-skin `InsightsPanel` / `DecisionDetail` / `LearningDetail` / `CalendarPanel` / `DocsPanel` / `MemoryList` chrome to Obsidian tokens and remove lucide from their headers. (Deep panels may be re-skinned incrementally; the record surface, stat trio, decisions, and learnings are the parity-critical set for OBS-08.)

10. **Remove lucide from Brain chrome.** Delete `import { Brain, Sparkles } from "lucide-react"` in the route and the lucide imports in the ported panels' chrome. Replace any remaining pictorial affordance with mono unicode (`->`, `·`) or the `StatusDot`. Grep the route + touched panels for `lucide-react` and confirm zero in chrome.

11. **Empty-record state.** When `getImpactLedger` returns an empty record (no decisions, no outcomes), render the empty-record instruction (§9) in place of the trio + export. Never a blank box.

12. **Tests.** Add `src/components/knowledge/__tests__/brain-stat-trio.test.tsx`: (a) the trio renders three numerals from a mock ledger; (b) the `% VALIDATED` cell is omitted when `hitRate === null`; (c) the third cell shows `+N ICE MOVED` and never a fabricated dollar figure; (d) `Export my record` renders only when `markdown` is non-empty and is absent (no dead control) when empty; (e) the empty-record instruction renders on an empty ledger. Add a decisions/learnings render test asserting the Obsidian `VerdictChip` tone mapping and that a pending decision gets `PENDING` neutral. Reuse existing `pm-impact.ts` unit coverage; do not duplicate aggregation tests.

13. **Manual verify.** `bun run dev`, open `/knowledge` with `[data-obsidian]` active, walk the parity checklist (§11) against the prototype at 1440px. Capture side-by-side screenshots for the ship report.

## 6. Structure

Component tree (Brain surface, after port):

```
_authenticated.knowledge.tsx  (route; shell provided by OBS-02)
└── BrainSurface (body under [data-obsidian])
    ├── SurfaceHeader (Obsidian: Newsreader hero + mono kicker, no icon)
    ├── BrainStatTrio                       ← NEW
    │   ├── StatCell ×3 (Newsreader 24px numeral + MonoLabel micro-label)
    │   └── Button "Export my record" (secondary, present only if markdown)
    ├── ProductBrainStrip (re-skinned count strip)
    ├── TabRow (Obsidian mono tabs: Insights·Calendar·Memory·Learnings·Decisions·Graph·Docs)
    └── {active tab body}
        ├── InsightsPanel      (re-skinned)
        ├── CalendarPanel      (re-skinned)
        ├── MemoryList         (re-skinned)
        ├── CompoundingPanel   (learnings: VerdictChip + text + glacier moved-line)
        ├── DecisionsPanel     (rows: title·date·VerdictChip·note; drills ?decision=)
        ├── GraphPanel         (mono GRAPH/LIST toggle)
        │   ├── GraphCanvasView (F-IA-BRAIN-GRAPH data flow - UNCHANGED)
        │   └── GraphTreeView   (artifact_lineage tree - UNCHANGED)
        └── DocsPanel          (re-skinned)
```

**New files**

- `src/components/knowledge/BrainStatTrio.tsx` - the stat trio + export button.
- `src/components/knowledge/__tests__/brain-stat-trio.test.tsx` - the trio + export + empty tests.

**File moves / renames:** none. The route stays `_authenticated.knowledge.tsx` (OBS-10 owns any route rename to `/brain`). No component is deleted (parchment consumers of `DecisionsPanel` etc. may still exist until OBS-10; if you fork an Obsidian variant, keep the parchment original until the fold).

**Data flow (all consumed read-only):**

- `getImpactLedger` (`src/lib/pm-impact.functions.ts`) - query key `["impact-ledger", name]` -> stat trio numerals + `markdown` for export. Pure aggregator `src/lib/pm-impact.ts`.
- `getBrainStatus` + `getCompanyBrainStats` (`src/lib/brain.functions.ts`) - query keys `["brain-status"]`, `["company-brain-stats"]` -> the Product brain count strip.
- `listDecisions` (`src/lib/decisions.functions.ts`) -> decision rows.
- brain-insights / learnings summaries (`src/lib/brain-insights.functions.ts`, `src/lib/pm-impact.ts`) -> learning rows + moved-lines.
- `artifact_lineage` traversal behind `GraphCanvasView` / `GraphTreeView` (F-IA-BRAIN-GRAPH) -> belief graph. **Reused, not rebuilt.**

Server functions are consumed, never modified. OBS-08 is not permitted to change any of them.

## 7. Design elements

Exact values, quoted from the hub §5 (never invent a hex, duration, or easing).

**Surfaces:** `--canvas #0A0A0B` (page) · `--card #111113` (stat cells, panels) · `--surface-card-deep #0E0E10` (count strip, alternating rows) · `--raised #17171A` (active tab, secondary button) · `--hover #1D1D21` / row hover `#141416` · `--hairline rgba(255,255,255,0.07)` · `--hairline-strong rgba(255,255,255,0.09)` · `--hairline-faint rgba(255,255,255,0.05)`.

**Ink:** `--text-primary #F2F0ED` (titles, numerals) · `--text-body #B5AFA6` (notes, learning text) · `--text-muted #9C978F` · `--text-subtle #7D786F` (mono micro-labels) · `--text-faint #55524C` (dates, non-essential metadata). Body ink on canvas ~7:1.

**Role colors (each one job):** ember `#FF6B2C` - **appears nowhere on Brain except a REVISE verdict chip's text tint `#FF8B52`**; Brain has no CTA and no gate, so no ember `Button`. Glacier `#7FD1DC` - the machine voice: the learning moved-lines, live connector pulse in the count strip, focus ring. Moss `#7FBF8E` (chip text `--moss-bright #8FD9A0`) - positive outcomes (VALIDATED / KEPT). Madder `#E06557` (chip text `--madder-bright #EE7A6C`) - negative outcomes (MISSED / KILL). Marigold `#E8B44C` - in-review only (CRITIC REVIEW / WATCH). Blossom `#E5BDDF` - citation chips (superscript) if the record shows sources.

**Type:** `--font-serif "Newsreader"` for the hero (34px, 420-440, -0.015em, 1.15) and the stat numerals (24px, 450, tabular-nums, `--text-primary`). `--font-ui "Schibsted Grotesk"` for all UI (13px base, 1.55, 600 headings; decision title 13.5px/600; learning text 13px). `--font-mono "JetBrains Mono"` for metadata: mono micro-labels 8.5px (`--text-mono-micro`) caps 0.11em tracking with middots; decision dates and the glacier moved-line 10px caps. One Newsreader italic emotional word on the hero, max one per screen.

**Geometry / density:** 4px grid; padding rhythm `--space-1..10` = 4/8/12/16/24/40. Radii `--radius-control 8` (buttons, tab toggle), `--radius-card 12` (stat cells, panels), `--radius-pill 99` (verdict chips). Row padding 14/18 with a bottom `--hairline`.

**Motion:** one easing `--ease cubic-bezier(0.23,1,0.32,1)`; `--dur-control 140ms` (hover, press), `--dur-page 280ms` (surface entry `cadRise`, translateY 10px->0, 260ms). Row / cell entrances transform-first, staggered 30ms, capped at six rows. **Decoration never animates.** The only motion on Brain: the live connector pulse in the count strip (`cadPulse` 2s glacier, on the one live-connector dot) and screen entry. No shimmer (nothing is actively working on this record surface); no aurora card (score moments live on Today / Engine Room, not here).

**Glows:** live glacier dot `0 0 10px rgba(127,209,220,~)`. Verdict chips carry a soft glow of their own hue at low alpha (per OBS-03: 12% tinted fill, 45%-alpha border of the same hue).

**Interaction states (design every one):**

- **Stat cell - default:** `--card` bg, radius 12, 14/16 padding, Newsreader numeral + mono micro-label. **Hover:** none (a stat is not a control; it does not answer the cursor). No lift.
- **Export button - default:** secondary variant, `--raised` bg, `--hairline-strong` border, radius 8, UI 13px. **Hover:** background lifts one step to `--hover`, hairline brightens (tonal, not spatial; nothing translates). **Focus:** 2px glacier outline, offset 2 (`:focus-visible`). **Press:** scale(0.985) 140ms. **Absent state:** when no record exists, the button is not rendered at all (no disabled dead control).
- **Decision / learning row - default:** real `<button>`, `--card` (or alternating `--surface-card-deep`), bottom `--hairline`. **Hover:** fill `#141416`, hairline brightens. **Focus:** glacier outline offset 2. **Active/press:** scale(0.985) 140ms. Drills to `?decision=` / opens detail.
- **Tab toggle (GRAPH/LIST and TabRow) - active:** bg `--raised`, text `--text-primary`; **inactive:** transparent, `--text-subtle`; hover inactive -> `--hover`.
- **Loading:** the trio and rows render nothing until their query resolves (no placeholder numbers, no skeleton flash of fake data). A single mono `LOADING` micro-label is acceptable in the strip only, matching the existing `loading…` convention re-cased to mono caps without the ellipsis-cliche (use `LOADING`).
- **Empty:** the empty-record instruction (§9), moss-hairline card, no illustration.
- **Error:** the route's `errorComponent` already renders a mono `knowledge · failed to load` card with a Retry button; re-skin its copy and tokens to Obsidian (`--card`, mono label, `Retry` plain button with a consequence helper).

**Verdict chip anatomy (from OBS-03 / components.md):** mono 8.5-9px caps 600, pill radius 99, 12% tinted fill, 45%-alpha border of the same hue. VALIDATED / KEPT / SHIP -> moss text `#8FD9A0`. MISSED / KILL -> madder text `#EE7A6C`. REVISE -> ember text `#FF8B52`. CRITIC REVIEW / WATCH -> marigold `#E8B44C`. DRAFTING -> glacier `#7FD1DC`. PENDING -> neutral (transparent fill, `--text-faint` text, faint hairline). No dot, no icon; the tone color is the meaning.

**Stat trio anatomy (components.md "Stats + record"):** Newsreader 24px numeral + mono micro-label; example set `128 CALLS MADE · 71% VALIDATED · $214k SAVED BY KILLS` - we render the real fields (`decisions`, `hitRate`, `iceShiftTotal`) and never a fabricated dollar figure. Optional sparkline per obsidian-extensions §6: single series, 1.5px, no axes, no dots except the last value (3px, family color) - only if the ledger already exposes a series; otherwise deferred to OBS-15.

## 8. Restructuring / renaming / modification

- **New:** `src/components/knowledge/BrainStatTrio.tsx` + its test. No other new component.
- **Route rename:** none in OBS-08. `/knowledge` -> `/brain` and the fold of `/memory`, `/impact` into Brain are **OBS-10**. Do not add a redirect here.
- **lucide removals (Brain chrome):** `import { Brain, Sparkles } from "lucide-react"` in `_authenticated.knowledge.tsx`; the `Share2` / `ListTree` toggle icons in `GraphPanel.tsx`; the header lucide in the ported panels (`InsightsPanel`, `DecisionsPanel`, `CompoundingPanel`, `CalendarPanel`, `DocsPanel`) as each is re-skinned. "Done means lucide gone from Brain chrome" (per-surface, not a global delete).
- **Import swap:** parchment `VerdictChip` / `MonoLabel` / `EmptyState` from `@/components/supaprod/Primitives` -> the OBS-03 Obsidian set from `@/components/obsidian`.
- **nav-model edit:** none here (OBS-02 / OBS-10 own the rail's mono-index reshape).
- **Deletions:** none. Parchment components stay until OBS-10 completes the fold; if you fork an Obsidian variant of a shared panel, keep the parchment original.
- **Search-param contract:** unchanged (`?tab=`, `?decision=`, `?learning=`, `?meeting=`, `?focusKind=&focusId=`).

## 9. Copy / voice

Humanized: no em/en dashes (middot `·` only), no exclamation marks, plain-words buttons, consequence in helper text, mono-caps metadata with middots.

- **Hero (one ember italic word allowed):** `Your record.` with `record` set in Newsreader italic ember. Sub in `--text-body`: `Every call you made, what it became, and how belief moved.`
- **Stat micro-labels (mono caps, middots):** `CALLS MADE` · `VALIDATED` · `ICE MOVED`. (The numeral carries the value; the label carries the meaning.)
- **Export button:** `Export my record` (secondary). Helper text under it: `Downloads a cited markdown record · nothing leaves your workspace`.
- **Decision row note:** the existing note text, plain. Date as mono caps: `MAR 14` style, middot-joined with source if shown (`MAR 14 · FROM MISSION`).
- **Learning moved-line (glacier mono caps):** `RE-RANKED USAGE-BASED ALERTS +1.1 ICE` (real value from the ledger; the pattern is `WHAT-IT-MOVED +/-N ICE`).
- **Graph toggle:** `GRAPH` · `LIST` (mono caps).
- **Empty-record state (instruction + time estimate):** `Your track record starts with the first call. Answer one on Today.` Render on a moss-hairline card, `--text-body`, with a quiet link `Go to Today ->`. Time framing lives in the golden-path copy (a first call is answerable in about a minute); keep this line to the instruction. No illustration, no blank box, no exclamation mark.
- **Loading:** mono `LOADING` (no ellipsis).
- **Error card:** `Brain · failed to load` (mono caps) + `Retry · reloads this surface`.

Voice check: calm, PM vocabulary (call, bet, ICE, ship), one wink at most, plain at trust moments (the export helper states the consequence honestly: nothing leaves the workspace).

## 10. Acceptance criteria

- [ ] The Brain surface renders under `[data-obsidian]` with the Obsidian shell (OBS-02), zero parchment tokens on the ported surface.
- [ ] A stat trio renders three Newsreader 24px numerals with mono micro-labels, sourced from `getImpactLedger` real data; no placeholder numbers ever paint.
- [ ] The `% VALIDATED` cell is omitted when `hitRate` is null; the third cell shows real `+/-N ICE MOVED` and never a fabricated dollar figure.
- [ ] "Export my record" downloads a `decision-record.md` from the ledger `markdown`, and is entirely absent (not disabled) when no record exists.
- [ ] Decision rows show title · mono date · Obsidian `VerdictChip` · note; a pending decision shows the neutral `PENDING` chip; verdict chips appear only on real outcomes.
- [ ] Learning rows show a `VerdictChip` + text + a glacier-mono moved-line stating what moved and the ICE delta.
- [ ] The belief-graph tab renders the existing `GraphCanvasView` / `GraphTreeView` over the same `artifact_lineage` data (F-IA-BRAIN-GRAPH), with only chrome / palette / mono toggle ported; no data-flow change.
- [ ] The empty-record state renders the instruction with a next step (no blank box, no illustration).
- [ ] lucide is gone from Brain chrome (route + graph toggle + ported panel headers); grep confirms zero `lucide-react` in touched chrome.
- [ ] No server function signature, SQL, or return shape changed.
- [ ] The search-param contract (`?tab=`, `?decision=`, `?learning=`, `?meeting=`, `?focusKind=&focusId=`) still works.
- [ ] Ember appears nowhere on Brain except a REVISE verdict chip's text tint; the restraint budget holds.

## 11. Prototype-parity checklist (the last gate)

Open `design-reference/obsidian-v3/design-reference/cadence-app.html` (Brain view) side by side with `/knowledge` at 1440px:

1. **Rail:** 236px mono index 01-05, Brain (05) active state bg `#1A1A1E` + ember index, one Today badge elsewhere, Engine Room door, user chip. (Provided by OBS-02; verify Brain is the active row.)
2. **Surface chrome:** 52px top bar, container max-width matches the prototype's Brain width, `cadRise` entrance, correct padding rhythm.
3. **Type:** hero Newsreader 34px with the one ember italic word (`record`); stat numerals Newsreader 24px tabular; mono micro-labels 8.5-9px caps with middots; learning moved-line glacier mono 10px.
4. **Color:** zero hexes outside the tokens; ember only on the REVISE chip tint; moss / madder / marigold only on real verdicts; glacier on the machine moved-lines and the live connector dot; verdict-chip glows match (12% fill, 45% border).
5. **Motion:** hover 140ms one-step tonal lift (no translate); screen entry 260ms; the only self-motion is the live connector pulse; reduced-motion zeroes all.
6. **Behavior:** tab switch via `?tab=`; decision drill via `?decision=`; graph GRAPH/LIST toggle; export downloads the markdown; keyboard map (5 selects Brain, Esc closes any overlay).
7. **Copy:** plain-words button (`Export my record`), consequence helper, mono-caps metadata, no em dashes, no exclamation marks.
8. **Grayscale:** the screenshot still reads (verdict meaning survives because each chip carries its word); restraint budget audited (no stray ember, one machine voice = glacier).

## 12. Verification + gates

- **tsc:** `bunx tsc --noEmit` = 0.
- **tests:** `bun test src/components/knowledge/__tests__/brain-stat-trio.test.tsx` green, plus the decisions/learnings verdict-tone render test. Existing `src/lib/pm-impact.test.ts` stays green (do not touch the aggregator).
- **build:** `bun run build` on the primary checkout / before publish. In a lane worktree, `bun run build` is RED on the pre-existing node20-vs-ESM `lovable-tagger` `require()` error, unrelated to this port; treat `tsc --noEmit` + `bun test` as the real gates there and do not chase it (hub §11).
- **grayscale test:** screenshot with color removed still communicates every verdict and status.
- **restraint budget (§4):** >= 90% neutral; zero ember CTA (Brain has none); zero aurora card; zero shimmer; status color only on real status; one machine voice (glacier).
- **impeccable / humanized-output:** grep every new string for `-`, `-`, `!`, emoji, and the banned words (seamlessly, leverage, empower, robust, unlock, delve). All clean.
- **manual:** walk §11 side by side with the prototype; confirm export downloads a valid `.md`; confirm the empty-record state renders on an empty ledger (test with a seeded-empty workspace or a mocked query); confirm the belief graph still traverses `artifact_lineage`. Attach side-by-side screenshots (default + empty-record + graph tab) to the ship report.
- **on completion:** flip the OBS-08 dashboard row and all four dashboard sections (row + header + by-status + by-category), remove the Active-claims line, update this folder + `../obsidian-port-plan.md` + `docs/features/obsidian-port.md` + `plan.md` §4, same unit of work.

## 13. Risks · gotchas · founder-gates

- **Stat-trio field mapping.** The components.md example `$214k SAVED BY KILLS` implies a dollars-saved metric the current ledger does not compute. Honestly render `+/-N ICE MOVED` from `iceShiftTotal` instead. If the founder wants the dollar metric, that is a new server-fn feature (out of OBS-08 scope) - surface it, do not build it inline.
- **Shared parchment panels.** `DecisionsPanel` / `CompoundingPanel` may still be imported by parchment consumers until OBS-10. Re-skinning them in place risks touching a parchment surface; prefer an Obsidian-scoped render path guarded by `[data-obsidian]`, or a thin forked variant, so no parchment surface regresses before its own port. Confirm no other route imports them before editing in place.
- **Belief graph is reuse-only (founder ruling).** Do not rebuild the traversal or the DBR-1 canvas. If the ported chrome fights the existing canvas rendering, keep the canvas as-is and re-skin only the frame; deeper graph-palette adoption is OBS-15.
- **Export honesty (founder ruling).** The export control must work or be absent. Never render a disabled or dead "Export" button. Gate its render on `markdown` being non-empty.
- **Sparklines.** Only add them if the ledger already exposes a series; otherwise defer to OBS-15. Do not fabricate a series to fill the stat trio.
- **Founder-gates:** none block OBS-08. The route rename (`/knowledge` -> `/brain`) and cross-route fold are OBS-10 and are founder-noticed there, not here.

## 14. Interlinks

- **Hub / foundation:** [`README.md`](./README.md) (§4 restraint budget, §5 tokens/type/motion, §5.9 parity checklist, §6 IA target - Brain is destination 05, §7 codebase map).
- **Sibling OBS items:** [`OBS-03.md`](./OBS-03.md) (the primitives this surface consumes - `VerdictChip`, `MonoLabel`, `Button`, `StatusDot`), [`OBS-02.md`](./OBS-02.md) (shell + rail), [`OBS-10.md`](./OBS-10.md) (IA consolidation, the `/knowledge`+`/memory`+`/impact` -> Brain fold and route rename), [`OBS-15.md`](./OBS-15.md) (chart grammar for the belief graph + stat-trio sparklines).
- **Canon anchors:** design law [`/DESIGN-OBSIDIAN.md`](../../../DESIGN-OBSIDIAN.md) §8 (IA, Brain) + §9 (Verdict chips) + §10 (voice); component anatomies [`/design-reference/obsidian-v3/components.md`](../../../design-reference/obsidian-v3/components.md) "Stats + record (Brain)" · "Verdict chips" · "Status dots"; stub-surface specs [`/design-reference/obsidian-extensions.md`](../../../design-reference/obsidian-extensions.md) §6 (chart grammar / sparklines in stat trios) + §9 (empty-record state).
- **Board:** [`../feature-dashboard.md`](../feature-dashboard.md) group G14, row OBS-08 · **summary bible:** [`../obsidian-port-plan.md`](../obsidian-port-plan.md).
- **Strategy / doctrine:** [`../../strategy/v11-guiding-star.md`](../../strategy/v11-guiding-star.md) (decision-and-outcome layer) · [`../../conventions/engine-room-doctrine.md`](../../conventions/engine-room-doctrine.md) · [`../../conventions/humanized-output.md`](../../conventions/humanized-output.md).
