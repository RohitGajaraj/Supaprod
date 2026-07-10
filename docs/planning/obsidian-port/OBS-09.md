# OBS-09 · Engine Room ported (one door, four rooms)

> _Created: 2026-07-02 · Last updated: 2026-07-02_

> Self-contained build + implementation spec. Pick this cold and build it. The shared design DNA, codebase map, and sequencing live in [`README.md`](./README.md) (the hub); everything you need to build THIS surface is embedded below. When this spec and the contract disagree, the contract wins; when a fine visual detail differs between the contract text and the runnable prototype, the prototype's rendering is the founder-approved outcome.

## 1. Snapshot

| Field         | Value                                                                                                                                                                                                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID            | OBS-09                                                                                                                                                                                                                                                                                                        |
| Rank          | #10                                                                                                                                                                                                                                                                                                           |
| Tier          | 1                                                                                                                                                                                                                                                                                                             |
| Status        | pending                                                                                                                                                                                                                                                                                                       |
| Category      | Governance                                                                                                                                                                                                                                                                                                    |
| Depends on    | OBS-03 (primitives), transitively OBS-01 (tokens/fonts) + OBS-02 (shell)                                                                                                                                                                                                                                      |
| Blocks        | nothing downstream (OBS-10 folds the legacy governance routes into this surface; OBS-13 reuses the room pattern; OBS-15 draws the score-room charts)                                                                                                                                                          |
| One-line what | The Engine Room: one door opens on a health glance (2x2 room cards, each with name · state chip · question · verdict line), plus the room-detail pattern (question header, verdict-first body, mono sub-tabs, four depth levels max) and the connection strip with a live pulse. Approvals NEVER render here. |
| Dashboard row | [`../feature-dashboard.md`](../feature-dashboard.md) group G14, row OBS-09                                                                                                                                                                                                                                    |
| Summary bible | [`../obsidian-port-plan.md`](../obsidian-port-plan.md)                                                                                                                                                                                                                                                        |

## 2. Why we are doing it

The Engine Room is the physical form of the **engine-room doctrine**: calm front, deep engine behind one door. Today Cadence exposes its machinery as a thirteen-tab governance console (`/govern`), which is exactly the kind of instrument panel the doctrine exists to hide. The port collapses that into **one door → a health glance → four rooms named for the user's question**: Spend ("What is this costing me?"), Quality ("Is the machine still good?"), Safety ("What is it allowed to do?"), Record ("What exactly happened?"). Every label passes the Engine-Room Test: it names the outcome, never the mechanism.

This serves **Law 3, depth on demand.** The glance never shows more than one verdict per room. A room opens to its own detail with mono sub-tabs, and each row drills one level deeper (a table or a trace), never a modal. The depth budget is fixed at four levels and never exceeded: glance → room → sub-tab → row detail. Nothing dead-ends.

It also holds **Law 2, one queue for attention.** The founder ruling is absolute: **approvals never live here.** Anything that needs a human is a Call on Today, in ember, in one queue. The Engine Room only explains and proves; it is a cool, glacier-voiced surface with zero ember. This is the felt expression of the v11 guiding star (trust at the point of decision): the operator can open the door, satisfy themselves that spend is in budget, quality has not drifted, safety is intact, and the record is whole, then close it, without ever being nagged from inside.

The felt outcome: a recessed door in the rail that, when opened, answers four honest questions at a glance and lets you go as deep as you want on any one, then get out of the way.

## 3. What we are building

**Scope IN**

- The **glance**: the serif hero, the 2x2 room-card grid, and the GitHub connection strip with a live moss pulse, indistinguishable from the prototype at 1440px.
- The four **RoomCard**s (Spend · Quality · Safety · Record): name + state chip (HEALTHY moss / WATCH marigold) + question + mono verdict line, each a real `<button>` that opens the room.
- The **room-detail pattern** (from extensions §5): a room header (question in Newsreader 20px, verdict line in mono under it, state chip right), a verdict-first body (one aurora score card ONLY on a score-moment room, otherwise a plain-words verdict sentence), mono-caps sub-tabs with an underline active signal, and rows that drill into a sub-tab detail (table or trace).
- The four room bodies wired to their sub-tabs: Spend (TREND · BY AGENT · CAPS), Quality (SCORE · DRIFT · SUITES), Safety (RULES · INCIDENTS), Record (TRACES · LEDGER).
- The **all-clear empty state** (extensions §9) and every interaction state (hover, focus, active sub-tab, loading, error, empty).
- A pure, unit-tested glance view-model helper that derives each room's state chip + verdict line from existing read queries.

**Scope OUT**

- **No approvals surface, ever.** The current `ApprovalsPanel`, `NotificationsPanel` (attention), and `ControlsPanel` (kill switch / caps) are NOT ported here; approvals are Calls on Today (OBS-04). If any actionable item surfaces in a room, it raises a Call, it is not actioned in place.
- No new server functions, no schema changes, no data-flow changes. Every number is read-only from an existing query.
- No route consolidation or redirect of the legacy `/govern` (that is OBS-10). OBS-09 adds a new Obsidian surface at `/engine-room` alongside the untouched parchment `/govern`.
- No chart internals beyond wiring the score cards; the full chart grammar (axes, series, pencil layer) is OBS-15, which rides on top of the two score rooms here.
- The rail, the door button, and the keyboard `g` shortcut are OBS-02; OBS-09 only builds the destination.

**No-feature-work boundary.** OBS-09 CONSUMES these read-only server fns via `useServerFn` + `useQuery` and modifies none of them: `getBudgetOverview`, `getAnalyticsOverview`, `getUnitEconomics`, `getAgentSpendBreakdown` (Spend); `listEvalSuites`, `getEvalScoreTrends`, `getEvalHealth`, `getDriftOverview` (Quality); `getGuardrailOverview`, `getGuardrailStats`, `getIncidents` (Safety); `listTraces`, `listTrustReceipts`, `getLedgerSeal`, `verifyLedgerSeal` (Record). It writes nothing. It does not touch `ApprovalsPanel`, `ControlsPanel`, `NotificationsPanel`, or any mutation fn.

## 4. Current state (real files, verified 2026-07-02)

- **`src/routes/_authenticated.govern.tsx`** (234 lines) is the live Engine Room today, parchment "Ember Editorial". It renders `AppShell` + `TopBar` + a `SurfaceHeader` with a **lucide `Shield`** icon, mono kicker "Operator tools", serif title "Engine Room", then a two-tier tab UI: `SubTabs` over the three bands from `@/lib/engine-room-bands` (Needs you / Trust & safety / Quality & insight) and a `TabRow` over **thirteen tabs** (controls · attention · team · approvals · guardrails[Safety] · budgets[Spend] · prompts · evals[Quality checks] · analytics · gauntlet[Quality] · traces[Activity] · drift[Trends] · incidents · support). Each tab body mounts a panel component (`ControlsPanel`, `NotificationsPanel`, `AgentRosterPanel`, `ApprovalsPanel`, `GuardrailsPanel`, `BudgetsPanel`, `PromptsPanel`, `EvalsPanel`/`EvalSuiteDetail`, `AnalyticsPanel`/`AgentSpendDetail`, `GauntletMetricsPanel`, `TracesPanel`, `DriftPanel`/`DriftSurfaceDetail`, `IncidentsPanel`, `SupportSignalsPanel`). Drill state rides `?tab=` + `?suite=`/`?agent=`/`?surface=`. This surface is untouched by OBS-09 (it stays until OBS-10 folds it).
- **`src/routes/_authenticated.governance.tsx`** (16 lines) redirects `/governance` → `/govern?tab=`. **`_authenticated.traces.tsx`** is a layout route that redirects the bare `/traces` → `/govern?tab=traces` but keeps `/traces/$traceId` as the one trace-detail surface. **`_authenticated.evals.tsx`, `.guardrails.tsx`, `.drift.tsx`, `.budgets.tsx`, `.analytics.tsx`** (7 lines each) are thin `beforeLoad` redirects into `/govern?tab=`. All of these stay; OBS-10 will repoint them at `/engine-room`.
- **`src/routes/_authenticated.eval-health.tsx`** (175 lines) is a separate parchment eval-health surface; its data (`getEvalHealth`) feeds the Quality room. Untouched here (read-only consumer).
- **The four rooms map from the current tabs like this** (nothing is deleted, only re-presented additively at `/engine-room`):
  - **Spend** ← the `budgets` + `analytics` tabs (`BudgetsPanel`, `AnalyticsPanel`, `AgentSpendDetail`).
  - **Quality** ← the `evals` + `gauntlet` + `drift` tabs + the `eval-health` route (`EvalsPanel`/`EvalSuiteDetail`, `GauntletMetricsPanel`, `DriftPanel`).
  - **Safety** ← the `guardrails` + `incidents` tabs (`GuardrailsPanel`, `IncidentsPanel`).
  - **Record** ← the `traces` tab + the trust ledger (`TracesPanel`, `/traces/$traceId`, `listTrustReceipts`/`getLedgerSeal`).
  - The `controls`, `attention`, `team`, `approvals`, `prompts`, `support` tabs do NOT become rooms. Approvals/attention/controls move to Today (OBS-04); team/prompts/support are folded elsewhere by OBS-10 or reached via ⌘K catalog (OBS-11). OBS-09 does not host them.
- **`[data-obsidian]` token layer + the five fonts + eight keyframes** are OBS-01 (appended under `[data-obsidian]` in `src/styles.css`; Codystar + Caveat in the `<link>` in `src/routes/__root.tsx`). **Before starting, grep `src/styles.css` for `data-obsidian` and `--canvas`**; if absent, the surface renders unstyled.
- **The Obsidian primitive set** is OBS-03 at `src/components/obsidian/` (barrel `index.ts`): `MonoLabel`, `Button`, `StatusDot`, `VerdictChip`, `AuroraCard`, `Citation`, `PencilNote`, `Toast`, `SlideOver`, `CallCard`, `MissionRow`. OBS-09 consumes `MonoLabel`, `VerdictChip`, `AuroraCard`, and `Button` (quiet variant); it does not rebuild primitives. If a primitive name differs at build time, adapt the import; the anatomy below is the contract.
- **The runnable prototype** `design-reference/obsidian-v3/design-reference/cadence-app.html` renders the glance verbatim (the `rooms` array + the GitHub strip). The prototype does NOT render the room-detail (opening a room is stubbed there); the room-detail pattern is the extensions §5 spec, built additively on top of the parity floor.
- **The Engine Room door + `g` shortcut** are wired by OBS-02 to `/govern` (parchment) until OBS-10 repoints them to `/engine-room`. During OBS-09, reach the new surface directly at `/engine-room`.

## 5. How, step by step

Build top to bottom. Assumes OBS-01 (tokens/fonts), OBS-02 (shell), OBS-03 (primitives) have landed.

1. **Create `src/lib/engine-room-glance.ts`** (pure, no React, no server calls). Export `type RoomState = "healthy" | "watch"`, `type RoomKey = "spend" | "quality" | "safety" | "record"`, and `type RoomGlance = { key: RoomKey; name: string; question: string; verdict: string; state: RoomState }`. Export `buildGlance(inputs)` that maps existing query outputs into four `RoomGlance`s: Spend state = `watch` when spend ≥ 80% of cap, else `healthy`, verdict `"$482 of $600 · trending +12%"` shape (`$<used> of $<cap> · trending <sign><pct>%`); Quality state = `watch` when any eval score below its baseline or drift open, else `healthy`, verdict `"Evals 94 / 88 / 91 · no drift"` shape; Safety state = `watch` when any open incident, else `healthy`, verdict `"3 guardrails on · 0 incidents"` shape; Record always `healthy` when the ledger verifies, verdict `"1,284 traces · ledger intact"` shape. Every verdict falls back to the prototype's exact literal when its input query is loading or absent (so a cold render matches the floor). The question strings are constants (see §9).
2. **Create `src/components/engine-room/RoomCard.tsx`.** Props `{ glance: RoomGlance; onOpen: () => void }`. Render a real `<button>` to the anatomy in §7. The state chip is a `VerdictChip` with tone `moss` for HEALTHY and `marigold` for WATCH; label is the uppercase state word.
3. **Create `src/components/engine-room/ConnectionStrip.tsx`.** Static-shaped strip (GitHub name · repo/owner mono · live moss pulse · helper). It may consume the workspace's primary GitHub connection read-only if one is wired; otherwise render the prototype literal (`ACME/LUMEN-APP · CONNECTED BY ROHIT`, `LIVE · SYNCED 4 MIN AGO`). No mutation, no Connect action here (connections live in Settings, OBS-13).
4. **Create `src/components/engine-room/EngineRoomSurface.tsx`** (the glance orchestrator). It reads the room queries with `useServerFn` + `useQuery` (keys in §6), feeds `buildGlance`, renders the hero, the 2x2 `RoomCard` grid, and the `ConnectionStrip`. When all four rooms are `healthy` and the queries are empty, render the all-clear empty state (§9) in place of the grid. Opening a room calls `navigate({ search: { room: key } })`.
5. **Create `src/components/engine-room/RoomDetail.tsx`** (the room-detail chassis, shared by all four). Props `{ room: RoomKey; view: string; onSetView, onBack }`. Renders: a back affordance (`quiet` Button, mono `← ALL ROOMS`), the room header (question Newsreader 20px + verdict mono line + state `VerdictChip` right), the mono-caps sub-tab row (underline active), and the active sub-tab body via a config map. The aurora score card renders ONLY for Spend/TREND and Quality/SCORE; every other view leads with a plain-words verdict sentence.
6. **Create the four room bodies** under `src/components/engine-room/rooms/`: `SpendRoom.tsx`, `QualityRoom.tsx`, `SafetyRoom.tsx`, `RecordRoom.tsx`. Each exports a `{ view }`-keyed set of sub-tab bodies that consume the mapped read queries and render rows (subject + mono value + status word), each row a `<button>` that drills to the row detail (Spend/BY AGENT → an inline agent table; Quality/SUITES → link `/traces/$traceId` is Record's; Quality suite → the existing eval suite deep view; Record/TRACES row → navigate to `/traces/$traceId`). Reuse the existing detail routes rather than rebuilding them.
7. **Create `src/routes/_authenticated.engine-room.tsx`.** A TanStack route at `/_authenticated/engine-room` with `validateSearch` for `{ room?: RoomKey; view?: string }`. When `room` is absent, render `<EngineRoomSurface />`; when present, render `<RoomDetail room=... view=... />`. If OBS-02 hoisted the shell into `_authenticated.tsx`, render bare; otherwise wrap in the Obsidian shell. `head: () => ({ meta: [{ title: "Engine Room · Cadence" }] })`. Add an `errorComponent` in the house voice. Let the router plugin regenerate `routeTree.gen.ts` (never hand-edit).
8. **Wire keyboard + focus.** Sub-tabs are arrow-navigable within the tab row (`role="tablist"`); `Esc` from a room returns to the glance (equivalent to Back). The rail `g` (OBS-02) lands on this surface once OBS-10 repoints the door.
9. **Tests.** Write `src/lib/__tests__/engine-room-glance.test.ts`: `buildGlance` maps thresholds to the right state (spend ≥ 80% → watch; open incident → Safety watch; ledger verifies → Record healthy), and falls back to the prototype literals on empty input. Write `src/components/engine-room/__tests__/room-card.test.tsx`: `RoomCard` renders a real `<button>`, shows the state word (grayscale-safe), and calls `onOpen`.
10. **Parity pass.** Open the prototype and `/engine-room` side by side at 1440px; walk §11.

## 6. Structure

```
src/routes/
└─ _authenticated.engine-room.tsx        (NEW · route; glance vs room-detail by ?room=)

src/components/engine-room/               (NEW folder)
├─ EngineRoomSurface.tsx                  (glance: hero + 2x2 grid + connection strip)
├─ RoomCard.tsx                           (one 2x2 card · real <button>)
├─ ConnectionStrip.tsx                    (GitHub live-pulse strip)
├─ RoomDetail.tsx                         (room-detail chassis: header + sub-tabs + body slot)
├─ rooms/
│  ├─ SpendRoom.tsx                       (TREND[aurora] · BY AGENT · CAPS)
│  ├─ QualityRoom.tsx                     (SCORE[aurora] · DRIFT · SUITES)
│  ├─ SafetyRoom.tsx                      (RULES · INCIDENTS)
│  └─ RecordRoom.tsx                      (TRACES · LEDGER)
└─ __tests__/room-card.test.tsx           (NEW)

src/lib/
├─ engine-room-glance.ts                  (NEW · pure view-model: buildGlance)
└─ __tests__/engine-room-glance.test.ts   (NEW)
```

**Component tree (glance)**

```
EngineRoomSurface
├─ h1  "The engine, at a glance."          (glance italic glacier)
├─ subline
├─ grid 2x2
│  ├─ RoomCard(spend)   → VerdictChip(WATCH/marigold)
│  ├─ RoomCard(quality) → VerdictChip(HEALTHY/moss)
│  ├─ RoomCard(safety)  → VerdictChip(HEALTHY/moss)
│  └─ RoomCard(record)  → VerdictChip(HEALTHY/moss)
└─ ConnectionStrip (GitHub · live moss pulse · helper)
```

**Component tree (room-detail)**

```
RoomDetail
├─ quiet Button "← ALL ROOMS"
├─ header: question (Newsreader 20px) · verdict mono · VerdictChip(state) right
├─ sub-tab row (role=tablist, mono caps, underline active)
└─ body slot → rooms/<Room>[view]
   ├─ (score rooms) AuroraCard  ·  else plain verdict sentence
   └─ rows: subject + mono value + status word → drill to detail route
```

**Data flow (all read-only; server fns CONSUMED, never modified).** Query keys, reuse existing ones where they exist: Spend `["budget-overview"]` (`getBudgetOverview`), `["analytics-overview"]` (`getAnalyticsOverview`), `["unit-economics"]` (`getUnitEconomics`), `["agent-spend"]` (`getAgentSpendBreakdown`); Quality `["eval-suites"]` (`listEvalSuites`), `["eval-score-trends"]` (`getEvalScoreTrends`), `["eval-health"]` (`getEvalHealth`), `["drift_overview"]` (`getDriftOverview`); Safety `["guardrail-overview"]` (`getGuardrailOverview`), `["guardrail-stats"]` (`getGuardrailStats`), `["incidents"]` (`getIncidents`); Record `["govern-trace-count"]`/`["traces"]` (`listTraces`), `["trust-receipts"]` (`listTrustReceipts`), `["ledger-seal"]` (`getLedgerSeal`/`verifyLedgerSeal`). No mutation, no new fn. Match the exact key a panel already uses so the cache is shared.

## 7. Design elements (embedded · do not invent a hex)

All values resolved from hub §5 / the prototype. Port as `[data-obsidian]`-scoped custom properties (OBS-01); the literal hexes below are the resolved values.

**Surface container.** `max-width:1060px; margin:0 auto; padding:36px 32px 64px; animation:cadRise 260ms cubic-bezier(0.23,1,0.32,1) both;` `data-screen-label="Engine Room"`.

**Hero.** `h1` Newsreader `font-weight:430; font-size:28px; letter-spacing:-0.015em; color:#F2F0ED; margin:0 0 6px;` text `The engine, at a ` + `<em style="font-style:italic;color:#7FD1DC">glance</em>` + `.` (the ONE italic emotional word, glacier `#7FD1DC`). Subline: `font-size:13px; color:#7D786F; margin-bottom:24px;`.

**Room grid.** `display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:20px;`.

**RoomCard (anatomy, top to bottom).** Container `<button>`: `display:grid; gap:7px; text-align:left; background:#111113; border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:18px 20px; cursor:pointer; transition:background 140ms;`.

- Title row: `display:flex; align-items:center; gap:10px;` → name `font-size:14px; font-weight:700; color:#F2F0ED; flex:1;` · state chip (`VerdictChip`) mono `font-size:8px; letter-spacing:0.1em; font-weight:600;` tinted pill `radius:99px; padding:1px 8px;` HEALTHY text `#8FD9A0` / border `rgba(127,191,142,0.45)` / bg `rgba(127,191,142,0.12)`; WATCH text `#E8B44C` / border `rgba(232,180,76,0.45)` / bg `rgba(232,180,76,0.12)`.
- Question: `font-size:12px; color:#55524C;`.
- Verdict line: `font-family:'JetBrains Mono'; font-size:10px; letter-spacing:0.04em; color:#9C978F;`.

**Connection strip.** `display:flex; align-items:center; gap:14px; background:#0E0E10; border:1px solid rgba(255,255,255,0.07); border-radius:10px; padding:12px 16px; flex-wrap:wrap;`. Children: `GitHub` `font-size:13px; font-weight:600; color:#F2F0ED;` · repo/owner mono `font-size:9px; color:#7D786F;` (`ACME/LUMEN-APP · CONNECTED BY ROHIT`) · live pulse `display:inline-flex; align-items:center; gap:6px; font-family:mono; font-size:9px; letter-spacing:0.08em; color:#8FD9A0;` with a `6px` dot `background:#7FBF8E; box-shadow:0 0 8px 1px rgba(127,191,142,0.6); animation:cadPulse 2.4s ease-in-out infinite;` then `LIVE · SYNCED 4 MIN AGO` · a `flex:1` spacer · helper `font-size:11.5px; color:#55524C;` (`Connections live in Settings · one home, no duplicates`).

**Room-detail header.** Question Newsreader `font-size:20px; font-weight:450; line-height:1.3; color:#F2F0ED;` · verdict line mono `10px; letter-spacing:0.04em; color:#9C978F;` under it · state `VerdictChip` right-aligned (same tones as the glance).

**Sub-tabs.** Mono-caps text tabs, `font-family:mono; font-size:9.5px; letter-spacing:0.1em; text-transform:uppercase;` inactive `color:#7D786F;` active `color:#F2F0ED;` with a `2px` glacier underline (`#7FD1DC`); `role="tablist"`, each tab a `role="tab"` `<button>`; hover raises inactive text to `#B5AFA6`. The underline is the only active signal (no fill).

**Aurora score card (score rooms only).** `radius:16px; background:#0F1B12` (healthy) / ember-forward (attention) / madder-forward (failing); two `aria-hidden` drifting radial blobs (marigold `0.34` alpha `cadDriftA 9s`, moss `0.4` alpha `cadDriftB 12s`); outer glow `0 0 55px rgba(127,191,142,0.09)`. Numeral in `--font-dotted "Codystar"` at `52px`; mono-caps label above, mono-caps note below. **Max one per screen** (each room detail is its own screen; Spend/TREND and Quality/SCORE each carry exactly one).

**Row (in a sub-tab body).** Full-width `<button>`, `padding:14px 18px;` bottom `1px solid rgba(255,255,255,0.07);` hover `background:#141416;`. Cells: subject `13.5px/600 #F2F0ED` (ellipsis) · mono value right-aligned `9.5px #9C978F` · status word via `MonoLabel` in its tone color. Rows drill to a detail route on click.

**Motion.** Screen entry `cadRise 260ms`. Card + row hover: tonal one-step lift only (`#111113 → #141416`), `140ms`, nothing translates. Live moss pulse on the connection dot only. Aurora drift only inside a score card. All gated by `prefers-reduced-motion` (zeroed) and the in-product motion toggle.

**Interaction states**

- **Hover** (card, row, sub-tab, door): background lifts one surface step; hairline brightens; no translate.
- **Focus** (`:focus-visible`): `2px` glacier `#7FD1DC` outline, offset `2`. All cards, rows, sub-tabs, and the back button are real `<button>`s.
- **Active** (sub-tab): `#F2F0ED` text + the `2px` glacier underline.
- **Loading**: each room's verdict line shows the prototype literal until its query resolves (no spinner in the glance, so the frame never flickers); a room-detail body shows four placeholder rows on `#111113` while pending.
- **Empty (all clear)**: replace the grid area with the instruction card (§9), moss hairline (`rgba(127,191,142,0.45)`), on `#0E0E10`.
- **Error**: the `errorComponent` renders a calm card ("Could not open the Engine Room.") with a `quiet` retry Button; a single room-body error renders inline in that body, not the whole surface.

## 8. Restructuring / renaming / modification

- **New files only** (see §6). No existing file is edited by OBS-09, and no route is renamed or deleted here.
- **`/govern`, `/governance`, `/traces`, `/evals`, `/guardrails`, `/drift`, `/budgets`, `/analytics` stay exactly as they are.** The new `/engine-room` surface is additive and lives alongside them until OBS-10 folds the legacy routes and their redirects into it and repoints the rail door + `g`.
- **No lucide import in any new file.** The glance and rooms use the mono numeral / word / dot vocabulary and the OBS-03 primitives; there is no icon (the current `/govern` `Shield` icon is not carried over).
- **No nav-model edit** (OBS-02 owns the rail; OBS-10 owns the door repoint). If you need to test the door, temporarily point it at `/engine-room` locally but do not commit that change under OBS-09.
- **No mutation, no server fn, no migration.** All new server-fn usages are read-only consumers of existing fns.

## 9. Copy / voice (humanized · no em/en dashes · no exclamation marks)

**Hero.** `The engine, at a glance.` (glance italic glacier.)
**Subline.** `Four rooms, one verdict each. Your calls never live here · they find you on Today.`
(The prototype renders this with an em dash before "they"; the humanized-output law forbids em dashes, so the shipped string uses the middot `·`. Note the delta in the ship report; it is a sanctioned correction, not a divergence.)

**Room names + questions + verdict shapes (from the prototype):**

- `Spend` · `What is this costing me?` · `$482 of $600 · trending +12%` · state `WATCH`
- `Quality` · `Is the machine still good?` · `Evals 94 / 88 / 91 · no drift` · state `HEALTHY`
- `Safety` · `What is it allowed to do?` · `3 guardrails on · 0 incidents` · state `HEALTHY`
- `Record` · `What exactly happened?` · `1,284 traces · ledger intact` · state `HEALTHY`

**Connection strip.** `GitHub` · `ACME/LUMEN-APP · CONNECTED BY ROHIT` · `LIVE · SYNCED 4 MIN AGO` · `Connections live in Settings · one home, no duplicates`.

**Sub-tab labels (mono caps).** Spend: `TREND · BY AGENT · CAPS`. Quality: `SCORE · DRIFT · SUITES`. Safety: `RULES · INCIDENTS`. Record: `TRACES · LEDGER`.

**Back affordance.** `← ALL ROOMS` (mono caps, quiet).

**Verdict-first sentences (non-score rooms, plain words, lead the body):**

- Safety/RULES: `Three guardrails are on. Nothing has tripped them this week.`
- Safety/INCIDENTS: `Zero incidents. The last block was a redaction, not a breach.`
- Record/TRACES: `Every run is on the record. Open any one to replay it step by step.`
- Record/LEDGER: `The ledger verifies. 1,284 traces, one intact chain.`

**Empty state (all clear, extensions §9).** `Four rooms, nothing burning. Come back when a chip turns marigold.`
**Per-room empty rows (instruction + time estimate):**

- Spend, no runs: `No spend yet. The first mission draws this line in about a minute.`
- Quality, no evals: `No eval yet. Point a suite at a prompt and the score lands in about five minutes.`
- Safety, no rules: `No guardrails yet. Turn one on in Settings and it applies to every AI call.`
- Record, no traces: `No runs on the record yet. Send something worth building from Discover.`

**Error card.** `Could not open the Engine Room. Retry.` (`quiet` retry Button underneath.)

All strings: no em/en dashes, no exclamation marks, no emoji, no AI-cliche words; mono-caps metadata with middots.

## 10. Acceptance criteria

- [ ] `/engine-room` renders the glance: serif hero with the one glacier italic "glance", the 2x2 room grid, and the GitHub connection strip, visually indistinguishable from the prototype at 1440px.
- [ ] Each of the four `RoomCard`s shows name (14px/700) + a state chip (HEALTHY moss / WATCH marigold) + question (12px `#55524C`) + verdict line (mono 10px `#9C978F`), and is a real `<button>`.
- [ ] The connection strip shows GitHub + repo/owner mono + the live moss pulse (`cadPulse 2.4s`, glow `0 0 8px 1px`) + `LIVE · SYNCED 4 MIN AGO` + the Settings helper.
- [ ] Clicking a room opens its detail (`?room=`) with the room-detail pattern: question header (Newsreader 20px) + verdict mono line + state chip right + mono sub-tabs (underline active) + a verdict-first body.
- [ ] Spend/TREND and Quality/SCORE each render exactly one aurora score card; every other sub-tab leads with a plain-words verdict sentence and rows (subject + mono value + status word).
- [ ] Depth never exceeds four levels (glance → room → sub-tab → row detail). Row drills reuse existing detail routes; nothing opens a modal.
- [ ] **No approvals, no kill switch, no attention queue, no controls appear anywhere in the Engine Room.** Nothing in a room is actionable; anything that would need a human is a Call on Today.
- [ ] Zero ember on the surface. Zero lucide imports in the new files. Zero hexes outside the token set.
- [ ] All-clear empty state renders the instruction (`Four rooms, nothing burning...`) when every room is healthy and empty; per-room empty rows render their instruction + time estimate.
- [ ] Every card, row, sub-tab, and the back control answers the cursor (one-step tonal lift, glacier focus ring) and is keyboard reachable; status reads without color (every chip ships its word).
- [ ] `Esc` from a room returns to the glance; switching rail surface leaves the Engine Room.
- [ ] `reduced-motion` zeroes the pulse and aurora drift.

## 11. Prototype-parity checklist (tailored · the last gate)

1. **Rail:** the Engine Room door and `g` land on this surface (via OBS-02/OBS-10; test directly at `/engine-room` if the door is not yet repointed). No new nav item is added.
2. **Surface chrome:** 1060px container, `36px 32px 64px` padding, `cadRise 260ms` entrance.
3. **Type:** hero Newsreader 430/28px with the one glacier italic "glance"; room names 14px/700; questions 12px `#55524C`; verdict lines mono 10px/0.04em `#9C978F`; sub-tabs mono 9.5px caps.
4. **Color:** the four state chips exactly (WATCH marigold `#E8B44C` on Spend, HEALTHY moss `#8FD9A0` on the other three); the connection dot glow `0 0 8px 1px rgba(127,191,142,0.6)`; zero ember anywhere.
5. **Motion:** card/row hover one-step tonal lift `140ms` (no translate); connection dot `cadPulse 2.4s`; aurora drift only inside the two score cards; reduced-motion kills all.
6. **Behavior:** opening a room swaps the glance for the room-detail in place (no modal); sub-tab underline tracks the active view; `Esc`/Back returns to the glance; four-level depth cap holds.
7. **Copy:** the register matches (questions verbatim, verdict shapes, mono-caps metadata with middots, the subline corrected to a middot, no em dashes, no exclamation marks).
8. **Grayscale** screenshot still reads (every state word present); restraint budget audited (≥ 90% neutral, one aurora max per room screen, status color only on status, one machine voice glacier, zero ember).

## 12. Verification + gates

- **tsc:** `bunx tsc --noEmit` = 0.
- **bun test:** `bun test src/lib/__tests__/engine-room-glance.test.ts src/components/engine-room/__tests__/room-card.test.tsx` green, plus the existing suite unbroken.
- **build:** `bun run build` on the primary checkout / before publish. In a lane worktree, `bun run build` is RED on the pre-existing node20-vs-ESM `lovable-tagger` `require()` error, unrelated to this work; treat `tsc --noEmit` + `bun test` as the real gates there and do not chase the lovable-tagger error (hub §11).
- **grayscale test:** screenshot `/engine-room` and each room with color removed; meaning must survive (state words, verdict lines).
- **restraint budget:** audit ≥ 90% neutral; one aurora per room screen; no ember; one glacier machine voice; status color only on status.
- **impeccable / humanized scan:** grep every new UI string for `-`, `-`, `!`, and the banned-word list (seamlessly, leverage, empower, robust, unlock, delve); confirm the subline uses a middot.
- **manual + screenshots:** open the prototype and `/engine-room` side by side at 1440px, walk §11, capture both glance and one room-detail (a score room) for the ship report; capture the grayscale glance.
- **on completion:** flip the OBS-09 dashboard row + all four dashboard sections; remove the Active-claims line; update this folder + `../obsidian-port-plan.md` + `docs/features/obsidian-port.md` + `plan.md` §4, in the same unit of work.

## 13. Risks · gotchas · founder-gates

- **Approvals leaking in.** The single biggest risk is re-introducing the approvals/controls/attention tabs as rooms. They are deliberately excluded; if a reviewer asks "where are approvals", the answer is Today. Do not add them.
- **Live data vs the prototype literals.** The glance verdict shapes must match the prototype, but the numbers should be honest from live queries. `buildGlance` falls back to the exact prototype literal on empty/loading input so a cold or seeded demo render still matches the floor; verify both a live workspace and the demo seed render sensibly.
- **Depth creep.** The four-level cap is a hard law. A row must drill to an existing detail route (eval suite, trace, agent spend), not spawn a fifth level or a modal. Reuse `/traces/$traceId` and the existing suite/agent detail views.
- **Aurora over-use.** Only the two score rooms (Spend/TREND, Quality/SCORE) get an aurora, one each. Safety and Record lead with a plain sentence. Do not aurora a non-score room.
- **Route collision with OBS-10.** OBS-09 creates `/engine-room` additively; OBS-10 repoints the door and redirects `/govern`. Do not touch `/govern` or the redirects here, or OBS-10's fold gets messy.
- **Founder-gate:** none unique to OBS-09. The URL rename + door repoint is OBS-10's founder-gated moment, not this one. If the founder wants the glance verdicts wired to live data before OBS-15 draws the charts, that is a scope confirmation worth a one-line check, but the read-only wiring here does not need a gate.

## 14. Interlinks

- **Hub (shared canon):** [`README.md`](./README.md) · restraint budget §4, tokens §5, IA target §6 (the door + four rooms), codebase map §7, parity checklist §5.9, empty-state law §5.7.
- **Build-order neighbors:** [`OBS-03.md`](./OBS-03.md) (primitives this surface consumes: `MonoLabel`, `VerdictChip`, `AuroraCard`, `Button`) · [`OBS-15.md`](./OBS-15.md) (chart grammar + the pencil layer, rides on the Spend/Quality score rooms) · OBS-10 (IA consolidation folds `/govern` + the legacy governance routes into this surface and repoints the door) · OBS-13 (Settings + Admin reuse this room-detail pattern).
- **Canon anchors:** `design-reference/obsidian-v3/components.md` § "Room cards (Engine Room)" (the 2x2 anatomy + the GitHub strip) · `design-reference/obsidian-extensions.md` §5 "Engine Room · the room-detail pattern" (read fully) + §9 "Empty-state catalog" (all-clear) · `/DESIGN-OBSIDIAN.md` §8 "Information architecture" (Engine Room: Spend/Quality/Safety/Record, approvals never here) + §9 (verdict chips, status dots) + §10 (voice) · the runnable prototype `design-reference/obsidian-v3/design-reference/cadence-app.html` (the `rooms` array + the Engine Room render block are the pixel floor).
- **Doctrine + strategy:** [`../../conventions/engine-room-doctrine.md`](../../conventions/engine-room-doctrine.md) (calm front, one door, name the outcome, the Engine-Room Test) · [`../../strategy/v11-guiding-star.md`](../../strategy/v11-guiding-star.md) (trust at the point of decision) · [`../../conventions/humanized-output.md`](../../conventions/humanized-output.md).
