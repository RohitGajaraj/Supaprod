> _Build spec, MAIN LANE 2026-08-25, produced against the real source. Every claim carries a
> file:line or says UNVERIFIED. **`the-first-run/RULINGS.md` remains the tiebreaker.**_

## WORKBENCH LAYOUT SPEC — `/track/$trackId`

MAIN LANE, 2026‑08‑25. Binding on LANE 0 and LANE 1. Every existing thing cited `file:line`. Anything I could not verify is marked **UNVERIFIED** and is a question for MAIN, not a decision for a lane.

---

### 0. Ownership, and the one conflict in the existing docs

`DESIGN-DIRECTION.md` §4 gives LANE 1 "the two-pane layout"; `BUILD-QUEUE.md` L0-3 gives LANE 0 "Recompose `TrackRun`". Both are right about half. **Ruling:**

| Thing | Path | Lane |
|---|---|---|
| The frame: split, header, responsive collapse, the finished-run inversion | `src/components/shell/Workbench.tsx` + `src/styles/workbench.css` | **LANE 1** |
| The route that composes it | `src/routes/_authenticated.track.$trackId.tsx` | **LANE 1** |
| Left-pane contents (steps, transcript, tool cards, inline ask) | `src/components/track/**`, `src/components/spine/**` | **LANE 0** |
| Right-pane contents (artifact, tabs, version chip, inline action) | `src/components/track/**` | **LANE 0** |
| Every missing Meridian primitive in §6 | `src/components/meridian/**` | **MAIN** |

`TrackRun.tsx` (`src/components/track/TrackRun.tsx:65`) is **not** the frame. LANE 0 reduces it to the **left pane body only**. The drive control at `TrackRun.tsx:93` moves into the header (LANE 1). The `result.steps.map` block at `TrackRun.tsx:112-122` is **deleted** — the step list is read from queries, never from a mutation's return value.

**Importing across lanes is allowed. Writing is not.** LANE 0's components are passed into LANE 1's `Workbench` as slots by the route.

---

## 1. THE SPLIT

### The container, measured, not guessed

The shell height chain is real and definite: `.sp-frame { height: 100dvh }` (`src/styles/shell.css:193-196`) → `.sp-app { flex:1; min-height:0 }` (`shell.css:200-203`) → `.sp-work { flex:1; overflow-y:auto; container-type: inline-size }` (`shell.css:1958-1964`). `.sp-work` carries **no horizontal padding**; only `padding-bottom: 68px` (`shell.css:2537-2539`).

Rail width is `--shell-rail-w: 236px`, narrowing to `--shell-rail-narrow: 64px` at ≤900px viewport (`shell.css:85-86`, `shell.css:2046`).

So: **container width = viewport − rail**. Workbench content width `W = container − 48` (24px padding each side, `--mrd-s6`).

### The workbench does NOT use `Surface`

`Surface` (`src/components/meridian/Surface.tsx:43`) gives a prose column capped at `--sp-main-max: 74ch` (`src/styles/ink.css:202`) plus a 316px context rail (`--shell-ctx-w`, `shell.css:91`). That is a document with a metadata sidebar. It is the wrong geometry and its own header admits the measure is contested. **Do not pass `wide`; do not use `Surface` here at all.** The current route's `<Surface>` wrapper (`src/routes/_authenticated.track.$trackId.tsx:46`) and its generic `PageHeading` ("This piece of work", line 49) both go.

### The grid

```css
.mrd-workbench {
  height: 100%;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);   /* header, then panes */
  gap: var(--mrd-s5);
  padding: var(--mrd-s6);
  min-height: 0;
}
.mrd-workbench-panes {
  display: grid;
  grid-template-columns: minmax(0, 1fr);      /* stacked is the base */
  gap: var(--mrd-s6);
  min-height: 0;
}
/* 760px is the split threshold. A @container condition cannot read a custom
   property, so the number is literal here — the same pattern shell.css:2005
   already uses for --sp-ctx-split. */
@container (min-width: 760px) {
  .mrd-workbench-panes {
    grid-template-columns: clamp(300px, 38%, 440px) minmax(0, 1fr);
  }
}
```

**Do not put `container-type` on `.mrd-workbench`.** The query must resolve against `.sp-work`, which already declares it (`shell.css:1963`). Declaring it locally would make the workbench its own container and the threshold would measure the wrong box.

### The ratios

| Viewport | Container | W | Left | Gap | Right | Left : Right |
|---|---|---|---|---|---|---|
| **1440px** | 1204 | 1156 | 439 (38%) | 24 | 693 | **38 : 60** |
| **1024px** | 788 | 740 | 300 (floor) | 24 | 416 | **40.5 : 56** |
| 1920px | 1684 | 1636 | 440 (ceiling) | 24 | 1172 | 27 : 72 |

**The right pane wins space, and it absorbs every additional pixel.** The left pane is a rail between 300px and 440px; it never grows past 440. This is the Framer/Fabric ratio (`framer-canvas-agent.webp`: canvas dominant, agent column fixed at the edge) and it is what `DESIGN-DIRECTION.md` §2 rules ("preview gets the larger share of the screen, not the chat").

**Do not use `minmax(300px, 440px)`** — a non-flexible minmax track resolves to its growth limit before the `1fr` sibling is expanded, so at 1024px the left would take 440 and the right 276, and the preview would lose. `clamp()` is proportional and clamps correctly at both ends. This is the trap; it is written down because it looks right and is wrong.

### Where it stacks

**Container < 760px.** That is viewport ≈ 996px with the wide rail, ≈ 824px with the narrow rail. Because it is a container query, the split survives the rail collapsing — a media query would fight it.

Stacked order is **DOM order**: header → left pane (steps, then transcript) → right pane (artifact). No `order` property, ever: visual order and tab order must not diverge. The inline ask lives inside the left pane at the step that raised it, so it is above the fold at stacked widths for free — which is the whole reason the ask is not a separate top-of-page block.

### Scrolling

At two-column widths: **each pane scrolls independently; the page does not scroll.** Each pane gets `overflow-y: auto; min-height: 0`. Stacked: the page scrolls and the panes do not.

The route root sets `data-page-composer`. `shell.css:1951-1956` already hides the dock and zeroes `.sp-work`'s 68px bottom padding on that attribute — no new CSS, and it is correct here: the ruling is **one composer**, and on this surface the composer is the run's own steer box (`steerTrack`, `src/lib/spine/track.functions.ts:1009`), not the global dock.

Wide content inside either pane (`ToolStream` arguments, a diff, a table) scrolls inside its own `overflow-x: auto` container. `mrd-fade-scroll` (`src/styles/meridian.css:2368`) is the house treatment.

---

## 2. THE HEADER

One row, spanning both panes, `grid-row: 1`. Ground `--mrd-sheet`, `rounded-mrd-pane`, `border border-mrd-line`. Reads left→right.

### What identifies the run

**`track.title`** — `Track.title` (`src/lib/spine/track.functions.ts:73`), column `spine_tracks.title`, read via `getTrack` (`track.functions.ts:335`). Set in `mrd-title` (`meridian.css:1840`: 20px / medium / `--mrd-ink`).

Under it, **one line, two verbs**, per `REIMAGINING.md` §3:

> `Now: {AGENT_STATIONS[track.station].name}. Next: {AGENT_STATIONS[nextOnRoute].name}.`

Names come from `AGENT_STATIONS` (`src/lib/agent-vocabulary.ts:113-169`) — `sense` renders as **Discover**, `define` renders as **Plan**. **The internal ids never reach a screen.** `nextOnRoute` is the first station after `track.station` in `track.route.path` that is not in `track.route.waived` (`Track.route`, `track.functions.ts:78`).

Set in `mrd-meta` (`meridian.css:1864`). No station map, no seven-name strip in the header — the step list in the left pane is the only place the seven appear.

`track.origin` (`track.functions.ts:75`) renders as a third quiet line only when non-null.

### The controls, right end, in this order

| Position | Control | Component | Notes |
|---|---|---|---|
| leftmost of the group | the status chip (below) | `StatusChip` `src/components/meridian/StatusChip.tsx:71` | |
| middle | **Copy link** | **`CopyLink` — MERIDIAN GAP, see §6** | quiet. Copies `window.location.href`. |
| rightmost | **the drive control** | `Action variant="primary"` `src/components/meridian/surface-parts.tsx:548` | |

Drive control labels, driven by the last `DriveNowResult.stopped` (`track.functions.ts:1115-1125`):

| State | Label |
|---|---|
| idle, never driven (`track.drivenAt === null`) | `Run it now` |
| in flight (`mutation.isPending`) | `Walking the route` + `busy` |
| returned `more: true` (any `stopped`) | `Continue the run` |
| `stopped: "finished"` or `track.status === "done"` | **the control is removed, not disabled.** In its place, one line: `It reached the end of its route.` |

**There is NO Stop control in v1.** `REIMAGINING.md` §4 asks for one ("Stop is always the same pixel") and it cannot be honestly drawn: `driveTrackNow` is a single blocking server call bounded at `FOREGROUND_WINDOW_MS = 50_000` (`track.functions.ts:1137`) with no cancellation path. A Stop button that does nothing is exactly the affordance failure `RunMap`'s own header records and fixed (`RunMap.tsx:206-215`). **MAIN gap G8.** Until it exists, the honest control is the primary going `busy`.

The drive mutation lives in the header (LANE 1) and invalidates both query keys on success, exactly as `TrackRun.tsx:79-82` does today: `["track-activity", trackId]` and `["spine-track-chain", trackId]`. Add `["spine-track", trackId]` for `getTrack`. The panes read their own queries; nothing is prop-drilled.

### What the status reads

**Derive the tone from `holdTone(track.holdReason)`** (`src/lib/spine/driver.ts:777`), which returns `"you" | "hold" | null`. It is already the single answer to "who releases this", it is a set and not a reading of prose, and `TrackStart` was found painting every hold amber by testing the sentence (`driver.ts:724-733`). **No lane re-derives this.**

| Condition | Chip | Word | Second line |
|---|---|---|---|
| **walking** — `mutation.isPending`, or `track.status === "open"` and `holdReason === null` | `StatusChip status="agent" pulse` | `Running` | `{stationName} · {elapsed}` — elapsed from `useElapsed` (`src/components/meridian/use-elapsed.ts:39`), in `RunTook` treatment (`run-rows.tsx:391`) |
| **held, on a person** — `holdTone === "you"` (`waiting-on-a-person`, `station-cannot-finish`, `corrections-spent`, `given-up`) | `StatusChip status="you" pulse` | `Waiting on you` | `holdLine(track.holdReason, { station: track.station })` verbatim (`driver.ts:713-720`) |
| **held, on a condition** — `holdTone === "hold"` (every other `HoldReason`) | `StatusChip status="hold"` no pulse | `On hold` | same `holdLine` sentence |
| **finished** — `track.status === "done"` | `StatusChip status="pass"` | `Finished` | `It reached the end of its route.` |
| **abandoned** — `track.status === "abandoned"` | `StatusChip status="hold"` | `Abandoned` | — |

Never re-word `holdLine`'s sentences. `HOLD_LINE` (`driver.ts:660-691`) is the one copy and `holdLine` substitutes the station's display name into two of them.

Note on `Finished`: `StatusChip`'s default word for `pass` is `"Passed"` (`StatusChip.tsx:63-69`) and the contract permits overriding "to be MORE specific about the same state, never different". A route reaching `learn` is a completion, not a graded outcome — `Finished` is the honest override. **Do not write `Passed` here**; the product has never graded a forecast and the word would claim one.

---

## 3. THE LEFT PANE

Ground `--mrd-sheet`, `rounded-mrd-pane`, `border border-mrd-line`, `overflow-y: auto`, `min-height: 0`, `mrd-fade-scroll`. Two stacked sections in one scroll container.

### 3a. The step list — Emergent, drawn correctly

`RunMap mode="live"` (`src/components/meridian/RunMap.tsx:341`), **seven stops, always all seven**, built from `AGENT_STATION_ORDER` (`agent-vocabulary.ts:171-179`), never from rows that happen to exist.

**`RunMap` cannot render this today and this is the largest gap in the spec.** It draws stations horizontally: `<ol className="flex ... overflow-x-auto">` (`RunMap.tsx:398-401`) with `style={{ width: 168 }}` per `<li>` (`RunMap.tsx:226`). Seven × 168 + gaps = ~1176px inside a 300–440px pane. `emergent-live-steps.webp` is **vertical**, one row per step. **MAIN gap G3.**

**The state mapping. Build this from two reads, not one.** `getTrackChain` (`track.functions.ts:819`) → `ChainStop` (`src/lib/spine/chain.ts:190`), and `getTrack` → `Track`.

| `ChainStop.state` | + condition on `track` | `PlanStepState` | Chip | Row |
|---|---|---|---|---|
| `not-reached` | — | `pending` | none | glyph `--mrd-faint`, name `--mrd-mute` |
| `passed` | — | `done` | none | glyph `--mrd-ink` |
| `here` | `holdReason === null` | `active` | `agent` / `Running`, `pulse` | **the clock, trailing** |
| `here` | `holdTone(holdReason) === "you"` | `needs-approval` | `you` / `Needs you`, `pulse` | the inline ask opens here (§3c) |
| `here` | `holdTone(holdReason) === "hold"` | **`held` ← GAP G1** | `hold` / `On hold` | `holdLine(...)` under the name |
| `waived` | — | `skipped` | none | name struck through; `stop.waivedReason` under it, or `RunMap`'s own honest fallback (`RunMap.tsx:334`) |

`PlanStepState` (`src/components/meridian/PlanCard.tsx:93`) is `pending | active | done | skipped | failed | needs-approval`. **There is no `held`.** `RunMap`'s `CHIP` map (`RunMap.tsx:118-122`) has no hold entry either. The tokens exist (`--mrd-hold` `meridian.css:461`, `--mrd-hold-chip` `:506`) and `StatusChip` already accepts `status="hold"`. The *state vocabulary* is the gap. **MAIN gap G1.**

`failed` is reserved for a genuine station failure. Do not map any `HoldReason` to `failed` — `stalled` reads "it is being sent for a fix" (`driver.ts:676`), which is amber, not red.

Every station keeps its glyph from `GLYPH_FOR_STATION` (`src/components/meridian/station-glyphs.tsx:73`). **No per-station hue, ever** — `RunMap.tsx:50-56` states why and it is law: colour carries status, seven categorical hues would spend the whole palette on category.

### 3b. The clock on the active step

Trailing edge of the `active` row only. `useElapsed(startedAt, true)` (`use-elapsed.ts:39`) rendered through `RunTook` (`run-rows.tsx:391`: `font-mrd-mono text-mrd-data text-mrd-faint tabular-nums`). Format comes from `formatElapsed` (`run-rows.tsx:479`) — `4m 29s`, not Emergent's `04:29`. **One formatter; do not add a second.**

`startedAt` source: `track.drivenAt` (`Track.drivenAt`, `track.functions.ts:105`, column `spine_tracks.driven_at`) parsed to ms.

**UNVERIFIED — MAIN gap G10.** Every write I can find sets `driven_at: new Date().toISOString()` at the moment the row is written *after* a seat resolves (`driver.server.ts:937, 988, 1105, 1367, 1387, 1425, 1458, 1500, 1560, 1587, 1594`). That reads as *end*-of-seat, which would make the clock measure the wrong interval. **LANE 0 must not draw this clock until MAIN answers.** If `driven_at` is end-of-seat, the honest v1 is a clock that starts when `mutation.isPending` goes true and reports the age of *this walk*, and nothing else. `useElapsed`'s own header (`use-elapsed.ts:18-27`) is explicit that a timer reporting the age of the component rather than the age of the work is "actively misleading" — do not commit that defect.

### 3c. The inline ask — the single most important card on the page

**Trigger:** `holdTone(track.holdReason) === "you"`. It renders **inside the left pane, replacing the body of the step that raised it**, not above the panes, not in a modal, not in `/approvals`. 90 gates went to a queue and zero were ever answered (`EVIDENCE`/`BUILD-QUEUE` L0-1). A question that has to be found does not get answered.

Built on `Gate` (`src/components/meridian/Gate.tsx:52`), which already carries the orchid eyebrow, the 20px question, and evidence recessed on `--mrd-sink`.

- **Question**: `gateHeadline(toolName)` (`src/lib/tool-consequences.ts:753`). Never a literal, never the tool name — `tool-consequences.ts:747-752` states the ruling.
- **`lines`**: `toolConsequence(toolName).effect`, `.undo`, and `REVERSIBILITY_LABEL[.reversible]` (`tool-consequences.ts:13-19`, `:758`).
- **Three controls**, from `cofounder-inline-question.webp`:

| Control | Component | Server fn |
|---|---|---|
| `Decide this one` | `Approve` (`surface-parts.tsx:626`) — it UNBLOCKS | `decideApprovalItem` (`src/lib/approvals-queue.functions.ts:1247`), `{ id, kind: "tool_call", verdict: "approve" }` |
| `Decide all like this` | `Action variant="default"` | `decideApprovalItems` (`approvals-queue.functions.ts:1316`), max 50 (`MAX_BULK_DECISIONS`, `:1265`) |
| `Not yet` | `Action variant="quiet"` → opens `ReasonField` (`src/components/meridian/forms.tsx`) | see gap |

Gate ids come from `spine_tracks.pending_gates`, typed `PendingGate = { id: string; station: AgentStation }` (`src/lib/spine/attach.ts:376`), read at `driver.server.ts:257`. **UNVERIFIED:** no server fn currently returns `pending_gates` to a client — `getTrack`'s `SELECT` does not include it. **MAIN owes a reader.**

**MAIN gap G7:** `DecideSchema` is `{ id, kind, verdict }` (`approvals-queue.functions.ts:1182-1197`). There is **no reason field**, so `BUILD-QUEUE` L0-1 acceptance (3) — "declining records a reason" — cannot be met. LANE 0 builds the `ReasonField` and files a request; it does not invent a write path.

Copy rule: `Approve` only on the control that unblocks. The `Not yet` control is `Action`, never `Approve`, never `destructive` (`--mrd-stop` may only paint something a person can press that *stops or removes*, `surface-parts.tsx:496-509`).

### 3d. The transcript

`TrackActivity` (`src/components/spine/TrackActivity.tsx:83`), unchanged in its data model, newest-first as it already is (`:127`), polling every 10s (`:91`).

### 3e. A tool call as an actionable card

`ToolStream` (`src/components/meridian/ToolStream.tsx:232`). **The prop already exists**: `onSelectRow?: (row: ToolStreamRow, index: number) => void` (`ToolStream.tsx:250`). Wire it. Clicking a row that filed something selects that artifact in the right pane — this is L0-4 and it needs no new component.

Row shape is `ToolStreamRow` (`ToolStream.tsx:160-200`): `{ id, tool, at, state: "running"|"done"|"failed", label?, argument?, durationMs?, error? }`. `at` is `tool_calls.created_at`; `durationMs` is `tool_calls.latency_ms`. Do not client-stamp `at` on a settled run — `ToolStream.tsx:172-181` explains why.

A row is only clickable when it produced an artifact. `STATION_ARTIFACT` (`src/lib/spine/attach.ts:222-281`) maps each station to its `createdBy` tool: `sense → signals.log`, `decide → decision.record`, `define → prd.draft`, `design → design.draft`, `build → studio.stage`, `ship → release.publish`, `learn → learning.record`. A row whose `tool` is not one of those seven is a plain fact with no pointer and no tab stop — that is `ToolStream`'s own contract for omitting `onSelectRow`.

### 3f. The handoff between two stations

`TrackActivity.tsx:135-136` already computes `handedOver` and buries it as a sub-clause: `", picked up from {previous.stationName}"` (`:147-149`).

**Promote it to its own row.** A break in the rail using `RunRailBreak` (`src/components/meridian/run-rows.tsx:459`), the shape `RunTimeline`'s `Silence` already uses (`RunTimeline.tsx:196-210`): empty clock column, rail break, one quiet line.

> `{Plan} handed it to {Design}`

Both names from `AGENT_STATIONS[...].name`. This is the product's entire claim and it used to happen silently inside a cron (`TrackActivity.tsx:16-19`).

---

## 4. THE RIGHT PANE

Body ground `--mrd-bg` — **the artifact is the canvas**. Its own chrome bar is `--mrd-sheet`; evidence blocks inside it are `--mrd-sink`. That reading (preview is the page, transcript is chrome) is the ruling, told in the ground ladder.

Do not use `--mrd-map` (`meridian.css:207`). Its definition is "a canvas whose positions are the reader's" — nothing here is reader-positioned.

### 4a. Tabs: yes, but derived, never fixed

Use `Tabs` + `TabPanel` (`src/components/meridian/Tabs.tsx:88`, `:197`), which already carry the full keyboard contract, roving tab stop, and manual activation. `group="workbench-artifact"`.

Lindy's `Browser | Terminal` is the **mechanism** it takes; the nouns are theirs. Ours are named by what they hold:

| Tab | Rendered when | Contents |
|---|---|---|
| **Preview** | always | the current station's artifact as itself |
| **Changes** | only when a `changeset` member exists on the track | `Diffstat` (`surface-parts.tsx:1254`) + `CodeBlock` |
| **Record** | always | `TrackChain` (`src/components/spine/TrackChain.tsx:107`), demoted here per L0-3 |

**Never render a tab whose panel would be empty.** With one tab, draw no tab row at all — a tablist of one is chrome for a choice that does not exist.

### 4b. What Preview renders, per station

Read `STATION_ARTIFACT[track.station]` (`attach.ts:222`) for the kind and table, and the member list from `getTrackChain().chain.stops[n].members` (`ChainMember`, `chain.ts:168-179`: `{ kind, word, artifactId, station, createdAt, title, missing }`).

| Station | `kind` / `table` | Inline action | Control |
|---|---|---|---|
| `sense` | `signal` / `signals` | keep / discard a signal | `Action` |
| `decide` | `decision` / `decisions` | edit claim, observable, date; accept | `Action variant="primary"` |
| `define` | `prd` / `prds` | edit a section; ask for one to be redone | `Action` |
| `design` | `prototype` / `prototypes` | same | `Action` |
| `build` | `changeset` / `studio_changesets` | approve the PR | **`Approve`** — it unblocks |
| `ship` | `deployment` / `deployments` | hold; roll back | `Action` + `Action variant="destructive"` |
| `learn` | `learning` / `learnings` | agree / disagree with the grade | `Action` |

**The pane renders a row the run actually wrote, never an optimistic guess.** A station that has produced nothing says so plainly: `NothingYet` (`surface-parts.tsx:994`). A member with `missing: true` gets `Value tone="fail"` — the lookup ran and came back empty, which is a settled negative (`TrackChain.tsx:89-96`).

Prose artifacts render through `Prose` (`src/components/meridian/Prose.tsx:129`).

**The forecast at `decide` and the verdict at `learn`** read the real columns: `forecast_claim`, `forecast_how_we_will_know`, `forecast_horizon_date`, `forecast_resolution` (`src/lib/decisions.functions.ts:89-90`, selected at `approvals-queue.functions.ts:776`). **14 forecasts exist, 0 graded, 0 rows ever in `forecast_resolution_log`, and the earliest horizon is 2026‑09‑05.** So the verdict card's honest state is **`Nothing is due yet.`** — not "no data", not an empty chart, and never a fabricated grade. Do not write a present-tense learning claim anywhere in this pane.

### 4c. The version chip

Top-left of the pane's chrome bar, left of the tabs. From `stackai-version-history.webp`.

Reads: `v{n} · {stamp}`, where the stamp is one of `Live` / `Draft` / a time. **MERIDIAN GAP G4** — nothing in `src/components/meridian/` stamps a version. `Value` (`surface-parts.tsx:1405`) is a toned span over a closed 5-word tone set; `StatusChip` is a status from a closed 5-word set. Neither can carry `v3 · Live` without lying about what its tone means.

**UNVERIFIED — MAIN gap G9.** I found no revision/version column on `decisions` and I have no database. **LANE 0 must not draw a version number until MAIN confirms the column.** Until then the chip shows only what is real: `{relativeTime(member.createdAt, now)}` via `relativeTime` (`src/lib/memory-view.ts`), the same clock `TrackChain.tsx:87` already uses.

### 4d. The inline action

Pinned to the **bottom of the right pane, inside it**, not floating and not in the page header. One primary per station from the table above, in an `Actions` row (`surface-parts.tsx:674`).

Vocabulary: **`Approve` only where the click UNBLOCKS**; `Action` where it saves or navigates; `Action variant="destructive"` only where it stops or removes (`build`'s rollback, `ship`'s hold). That is `surface-parts.tsx:665-668`'s own test, not a preference.

---

## 5. THE FINISHED-RUN INVERSION

### The trigger — a state, never prose

> `track.status === "done"` **OR** the last `DriveNowResult.stopped === "finished"`.

`DriveNowResult.stopped` is `"finished" | "held" | "stalled" | "out-of-window" | "not-found"` (`track.functions.ts:1121`). **`"finished"` is the only one that means the journey is complete** — the type's own comment says so. `held`, `stalled` and `out-of-window` are all still-live or stuck, and the transcript must keep the page in every one of them.

Never trigger on a sentence. `driveTrackNow`'s header records a draft that decided when to stop with `outcome.line.includes("gate")` and why that is a bug (`track.functions.ts:1085-1088`).

`track.status === "abandoned"` does **not** invert. Nothing was made; the transcript is the only thing worth reading.

### What moves

```css
.mrd-workbench-panes[data-settled="true"] {
  grid-template-columns: clamp(240px, 24%, 300px) minmax(0, 1fr);
  transition: grid-template-columns var(--mrd-d-move) var(--mrd-ease);
}
```

At 1440px that is **24 : 74** — the artifact takes the page, the transcript becomes a rail.

**The panes do not swap sides.** Fabric puts the artifact left and the agent rail right (`fabric-artifact-primary.webp`). I am deviating and naming it: in Fabric the agent was never primary, so nothing crosses the page. Here the person watched the run in the left pane for minutes; moving both panes across the screen at the instant of completion destroys the continuity that is the entire reason to watch. **The proportion inverts; the sides do not.** MAIN can overrule this; a lane cannot.

Changed, item by item:

1. **Grid columns** — as above, `--mrd-d-move` (140ms, `meridian.css:1070`), `--mrd-ease`. Not `--mrd-d-enter`: nothing is arriving, things are changing size, and that is the token's own definition.
2. **The step list collapses** to one settled line, and the seven-row `RunMap` is replaced by it: `Seven stations · {n} ran · {n} waived · {formatElapsed(total)}`. Clicking it re-expands. `RunMap mode` flips `"live" → "replay"` (`RunMap.tsx:83`), which removes every control and stops rendering hold sentences (`RunMap.tsx:222`).
3. **The transcript stays** and stays scrollable under the collapsed line. It is the rail's whole content.
4. **The drive control is removed from the header**, not disabled. In its place: `It reached the end of its route.` A finished run has nothing to drive, and a greyed-out primary is a control that looks pressable and does nothing.
5. **The status chip** becomes `pass` / `Finished`, no pulse.
6. **The right pane's chrome bar gains quick-action chips** (Fabric's `Summarize · List points · Explain like I'm five` becomes ours, and only these three):
   - `Grade the forecast` — enabled **only** when `forecast_horizon_date` is in the past. Today that is never true for any of the 14 rows. Disabled state carries the reason: `Nothing is due yet.`
   - `Copy link` (the same `CopyLink`)
   - `Open the changes` — only when a `changeset` member exists.
7. **The inline ask cannot render.** `holdTone` returns `null` for `done` (`driver.ts:775`), and it does so deliberately — `done` is a member of `HoldReason` and is not a hold (`driver.ts:763-767`).

Motion rule from `DESIGN-DIRECTION.md` §3: enter instantly, exit gently, and **a raw duration is a bug**. Every transition on this surface uses `--mrd-d-press` (120ms, a control acknowledging a press), `--mrd-d-move` (140ms, something changing position or size), or `--mrd-d-enter` (420ms, content arriving unasked). There is no `--mrd-d-exit`; a dismissal spends `--mrd-d-move` (`meridian.css:1158-1180`).

---

## 6. TOKENS

All read from `src/styles/meridian.css`. `every-token-used-is-defined.test.ts` fails the build on a `var(--mrd-*)` that resolves to nothing, so **do not invent a name**. `meridian-ratchet.test.ts` fails on any retired token or raw colour in a **new** file, with no allowlist.

### Grounds — `bg-mrd-*`
`--mrd-bg` `:143` (right-pane body, page) · `--mrd-sink` `:144` (evidence blocks, the `Gate` lines box) · `--mrd-sheet` `:208` (left pane, header bar, right-pane chrome bar) · `--mrd-lift` `:209` / `--mrd-lift-hover` `:234` (secondary control) · `--mrd-float` `:235` (the version-chip menu, if it opens one) · `--mrd-solid` `:236` / `--mrd-solid-hover` `:250` (primary button face)

### Ink — `text-mrd-*`
`--mrd-ink` `:290` · `--mrd-body` `:323` · `--mrd-mute` `:324` · `--mrd-faint` `:325` (pending steps, clocks) · `--mrd-on-solid` `:347`

### Edges
`--mrd-line` `:350` (pane borders) · `--mrd-line-soft` `:351` (rule between transcript rows) · `--mrd-edge` `:352` (chip, ring) · `--mrd-field` `:377` / `--mrd-field-focus` `:395` / `--mrd-edge-focus` `:400` (the steer box, the `ReasonField`) · `--mrd-focus` `:418` (via `mrd-focus-inset`, `meridian.css:2299`) · `--mrd-hover` `:419` · `--mrd-select` `:448` (**the selected tab — never `--mrd-hover`**, `Tabs.tsx:40-45`) · `--mrd-sheen` `:447` (inset highlight on `Approve`/primary) · `--mrd-scrim` `:452`

### Status — the whole point of the surface
`--mrd-agent` `:457` / `--mrd-agent-dim` `:458` — a machine is working · `--mrd-you` `:455` / `--mrd-you-dim` `:456` — a person is required · `--mrd-hold` `:461` / `--mrd-hold-dim` `:462` — stopped, not on you · `--mrd-pass` `:459` · `--mrd-fail` `:460`
Chips: `--mrd-agent-chip`/`-on-chip` `:500`/`:501` · `--mrd-you-chip`/`-on-chip` `:498`/`:499` · `--mrd-hold-chip`/`-on-chip` `:506`/`:507` · `--mrd-pass-chip`/`-on-chip` `:502`/`:503` · `--mrd-fail-chip`/`-on-chip` `:504`/`:505`
Fills: `--color-mrd-on-you` / `--color-mrd-on-agent` / `--color-mrd-on-hold` (`:1545`, `:1546`, `:1583`)

### Control colour
`--mrd-stop` `:573` — **only ever paints something a person can press that halts or removes** (`meridian.css:512-517`, `surface-parts.tsx:496-509`). Never on a chip, never on a status. Reached via `Action variant="destructive"` (`surface-parts.tsx:514-515`).

### Restraint
`DESIGN-DIRECTION.md` §3: one colour for the fact the person came for — what is live now. Everything settled is quiet. **The brand ember is retired from every interaction state**; `--ember` is aliased to `--mrd-you` in three grounds (`styles.css:197`, `:271`, `:1929`) and belongs to the logo only.

### Type — `text-mrd-*` (size) + `leading-mrd-*`
`--mrd-t-nano` `:863` (uppercase micro-label, weight 650 only) · `--mrd-t-tiny` `:865` · `--mrd-t-data` `:866` (**the clock, the duration, the version stamp — all mono**) · `--mrd-t-small` `:867` · `--mrd-t-label` `:868` (step name) · `--mrd-t-base` `:869` · `--mrd-t-prose` `:893` · `--mrd-t-lead` `:894` · `--mrd-t-h3` `:895` (the run title, via `mrd-title`) · `--mrd-t-h2` `:896`
Weights `--mrd-w-regular|medium|semi|micro` `:929-932` · Leading `--mrd-lh-tight|snug|prose|mono` `:934-937` · `--mrd-track` `:838` · `--mrd-track-label` `:861` · `--mrd-measure` `:938` (prose only, never a row or a table)
Faces: `--mrd-font` `:763` (`font-mrd`) · `--mrd-mono` `:764` (`font-mrd-mono`) · `--mrd-face-display` `:835` (`font-mrd-display`). **`--mrd-face-brand` `:795` does not appear on this surface** — brand moments only.

### Space, radius, shadow, motion
`--mrd-s1..s8` `:947-954` (`gap-mrd-*`, `p-mrd-*`) · roles `gap-mrd-inline|pair|stack|section`, `p-mrd-inset` (`:1912-1936`) · `--mrd-fade-rail` `:974` · `--mrd-mark-rule` `:1014`
`--mrd-r-xs|chip|ctl|card|pane` `:1017-1021` (`rounded-mrd-*`)
`--mrd-shadow-card|float|pane` `:1237-1239` (`shadow-mrd-*`)
`--mrd-ease` `:1024` · `--mrd-ease-soft` `:1025` · `--mrd-d-press` `:1068` · `--mrd-d-move` `:1070` · `--mrd-d-enter` `:1072` · `--mrd-d-alive` `:1106`

### Utility classes (not tokens) that this layout uses
`mrd-title` `:1840` · `mrd-subtitle` `:1850` · `mrd-copy` `:1857` · `mrd-meta` `:1864` · `mrd-eyebrow` `:1831` · `mrd-fade-scroll` `:2368` · `mrd-focus-inset` `:2299`

### Layout constants read from the shell, not from Meridian
`--shell-rail-w: 236px` / `--shell-rail-narrow: 64px` (`shell.css:85-86`) · `--shell-work-max: 1400px` `:90` · `--shell-ctx-w: 316px` `:91` · `--sp-main-max: 74ch` (`ink.css:202`) — **the last two are cited only to say the workbench does not use them.**

---

### MERIDIAN GAPS — MAIN builds these in `src/components/meridian/`

| # | Gap | Where the hole is | Why nothing existing serves |
|---|---|---|---|
| **G1** | `PlanStepState` needs `"held"`; `RunMap`'s `CHIP` needs `held: { status: "hold", word: "On hold" }` | `PlanCard.tsx:93`, `RunMap.tsx:118-122` | The ruled states are pending/running/done/**held**/failed. Tokens exist; the state vocabulary does not. `RunMap` renders holds as a sentence only (`RunMap.tsx:222`), so a held station wears no chip and is invisible in a scan. |
| **G2** | `RunMapStation.startedAt?: number`, rendered as a live clock on the `active` stop | `RunMap.tsx:85-109`, `StopFace` `:271` | `useElapsed` and `formatElapsed` exist; nothing carries a start instant into the map. Emergent's `04:29` is unbuildable without it. |
| **G3** | `RunMap` needs `orientation?: "spine" \| "list"`, default `"spine"` | `RunMap.tsx:226` (`width: 168`), `:398-401` (`flex ... overflow-x-auto`) | 7 × 168px cannot render in a 300–440px pane. The ruled Emergent step list is vertical. Default preserves every existing caller. |
| **G4** | `VersionChip` — `v{n} · Live \| Draft \| {time}` | nothing in `src/components/meridian/` | `Value` (`surface-parts.tsx:1405`) and `StatusChip` (`StatusChip.tsx:36`) both draw from closed 5-word semantic sets; a version is neither a tone nor a status. |
| **G5** | `CopyLink` — copies the current URL, confirms in place | nothing in `src/components/meridian/` | The only clipboard write in the system is private to `CodeBlock.tsx:242-243` and is bound to a code body. |
| **G7** | A decline must record a reason | `DecideSchema`, `approvals-queue.functions.ts:1182-1197` | `{ id, kind, verdict }` — no reason field. `BUILD-QUEUE` L0-1 acceptance (3) is unmeetable. **MAIN, `src/lib/`.** |
| **G8** | A stop/abort path for a foreground drive | `driveTrackNow`, `track.functions.ts:1139` | One blocking call, `FOREGROUND_WINDOW_MS = 50_000`, no cancellation. Drawing a Stop now is the exact affordance failure `RunMap.tsx:206-215` records. **MAIN, `src/lib/`.** |
| **G9** | **UNVERIFIED** — does `decisions` carry a revision/version column? | I found `forecast_*` only (`decisions.functions.ts:89-90`, `approvals-queue.functions.ts:776`) | No database access. LANE 0 must not draw a version number at `decide` until MAIN answers. |
| **G10** | **UNVERIFIED** — is `spine_tracks.driven_at` stamped at seat start or seat end? | 11 writes, all `new Date().toISOString()` at row-write time (`driver.server.ts:937, 988, 1105, 1367, 1387, 1425, 1458, 1500, 1560, 1587, 1594`) | Reads as end-of-seat. If so it is the wrong clock source and G2's timer would report a false interval. |
| **G11** | **UNVERIFIED** — no server fn returns `spine_tracks.pending_gates` to a client | `getTrack`'s `SELECT` (`track.functions.ts:335`) omits it; the only read is server-side at `driver.server.ts:257` | The inline ask (§3c) cannot find its gate ids without one. **MAIN, `src/lib/`.** |

**G6 is not a Meridian gap.** The two-pane frame is LANE 1's build in `src/components/shell/Workbench.tsx` + `src/styles/workbench.css`, for the reason given in §1: `Surface`'s 74ch measure and 316px context rail are a document with a sidebar, not a workbench.

---

### COPY RULES BINDING ON EVERY STRING ON THIS SURFACE

- **The seven station names never appear as navigation or as a customer-facing noun.** They appear as the run's own step list, inside one run, and nowhere else. Display names only (`Discover`, not `sense`; `Plan`, not `define`) — `agent-vocabulary.ts:116-131` records the leak that made this a ruling.
- Banned everywhere: *receipts · ledger · company brain · decision layer · unattended · first run · provenance*. **"Audit trail" and "shared brain" stay.**
- *remembers · stores · logs* as verbs of the brain: banned everywhere.
- **Never claim accumulated learning in the present tense.** 0 grades exist. The verdict card's empty state is `Nothing is due yet.`
- *crew · bet · mission · station · guardrail · drift* stay out of every string this surface renders. `REIMAGINING.md` §7 found them still live at `AppFrame.tsx:665`, `_authenticated.decide.tsx:685`/`:745`, `_authenticated.brain.tsx:732`.
- **Approve** only where the click unblocks. **Review** where it only shows.
- No dramatic phrasing. Every sentence must be one a person would say out loud in a meeting.

### GATES BEFORE EVERY PUSH

`bunx tsc --noEmit`, `bun test`, `bun run lint`. **Never pipe a gate into `tail`** — it reads tail's exit code and main has shipped red that way. 12 test failures on main are pre-existing: do not claim them, do not fix them silently. A mount is not a render: prove the layout with a Playwright screenshot at 1440 and at 1024, not with "it's in the tree".