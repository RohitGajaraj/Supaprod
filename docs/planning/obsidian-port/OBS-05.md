# OBS-05 · Build ported (the one cockpit)

> _Created: 2026-07-02 · Obsidian port · group G14 · self-contained build+implementation spec._
>
> Pick this cold and build it. Every token value, anatomy, state, string, file path, and gate you need is embedded below. Open another file only for the shared substrate ([`README.md`](./README.md), the hub) or a sibling item's build-order note.

---

## 1. Snapshot

| Field | Value |
| --- | --- |
| ID | OBS-05 |
| Rank | #6 (dashboard) |
| Tier | 1 |
| Status | pending (build after OBS-03 lands primitives) |
| Category | Build |
| Depends on | OBS-03 (core primitives: `MissionRow`, `SlideOver`, `CallCard`, `StatusDot`, `VerdictChip`, `MonoLabel`, `Toast`, `Button`) |
| Blocks | nothing downstream |
| One-line what | Port the Build surface to Obsidian: mission rows (status dot · title · verdict chip when done · step label · cost) plus the mission slide-over (numbered steps, live pulses, inline gate as a compressed CallCard, raw-trace toggle with per-hop cost, `?mission=` deep link). The slide-over is the app's one overlay depth. |
| Dashboard row | [`../feature-dashboard.md`](../feature-dashboard.md) group G14 · row OBS-05 |
| Summary bible | [`../obsidian-port-plan.md`](../obsidian-port-plan.md) |

---

## 2. Why we are doing it

Build is the cockpit where the machine does the work the user approved. Today it is a parchment "Ember Editorial" surface (`SurfaceHeader`, `bento` cards, lucide icons, a full-page `/build/$missionId` detail route with `Changes / PR / Preview / Cost` tabs). It works, but it reads like scaffolding and it breaks the depth model: a mission opens a whole new page instead of a slide-over. The port makes the working machine legible and calm.

This serves all three Obsidian laws (hub §1). **Law 1 (one object, one anatomy):** a Mission is one object with one row and one detail view (the slide-over); a build session IS a mission. **Law 2 (one queue for attention):** a gate is a Call, ember-only, and it is the same Call whether the user meets it on Today or inside the mission slide-over. **Law 3 (depth on demand):** quiet mission list -> slide-over -> full view. The list never shows more than one mission's worth of state; the machinery (numbered steps, live pulses, raw trace) is one toggle deeper.

The felt outcome: the user glances at Build, sees which missions are moving in cool glacier, sees the one that needs them flare ember, opens it, answers in place, and the answer ripples back to Today. That ripple is the product's point (v11: trust at the point of decision; the decision-and-outcome layer). It ties to the engine-room doctrine: calm front, deep engine. The raw trace with per-hop cost is the deep engine, revealed on demand, never nagging.

---

## 3. What we are building

**Scope IN**
- Re-skin `/build` (`src/routes/_authenticated.build.index.tsx`) to the Obsidian idiom: canvas surface, mono-index chrome via the OBS-02 shell, Newsreader hero, and the OBS-03 `MissionRow` anatomy for each session row (status dot · title · verdict chip when done · step label · cost).
- Build the **mission slide-over** driven by `?mission=<missionId>` search param: header (MISSION label + status word + cost + Close), numbered step list with live status dots, the inline **gate** rendered as a compressed CallCard, the **raw-trace toggle** (per-hop cost in mono), and the footer strip.
- Wire **cross-object sync**: answering the gate inside the slide-over invalidates the Today Call-queue query (`["needs-you"]`) plus the build queries, so Today and the mission row both reflect the decision immediately. This is the one explicit behavior beyond pure presentation (item note + hub §5.10).
- `?mission=` deep link: opening a row sets the search param; a direct URL with `?mission=m2` opens that slide-over on load; Esc / scrim / Close clears it. Switching surface (nav) always closes it.
- Keep the composer (dispatch textarea + PRD picker + ModelSwitcher + Start) exactly functional; only re-skin it into the Obsidian control idiom.
- Remove `lucide-react` from this surface's chrome (per hub §8/§9 iconography law).

**Scope OUT (no feature work rides along)**
- No changes to any server function. This item **consumes read-only**: `listStudioSessions` (query key `["studio-sessions", showArchived]`), `getStudioSession` (new query key `["studio-session", missionId]` for the slide-over), `listProjects`, `listPrds`, `dispatchStudioSession` (composer, unchanged), `setStudioSessionArchived`, `deleteStudioSession`. The **one mutation the slide-over gate uses is the already-existing `decideApproval`** (the same fn `ApprovalCard.tsx` calls today); we do not author a new approval path, we only relocate the gate UI into the slide-over and add cache invalidation.
- No change to the full-page `/build/$missionId` detail route's data contract, tabs, polling, or `steerStudioSession`. That route becomes the depth-3 "full view" reached from the slide-over; OBS-05 does not rebuild its internals (its own Obsidian re-skin can be a follow-on; the slide-over is the depth-2 win this item ships).
- No roadmap/spec/discover data. No new charts (chart grammar is OBS-15).

---

## 4. Current state (real files, verified 2026-07-02)

- **`src/routes/_authenticated.build.index.tsx`** (566 lines). Parchment. Imports 10 lucide icons (`Archive`, `ArchiveRestore`, `ChevronDown`, `ExternalLink`, `FileText`, `GitPullRequest`, `Hammer`, `MoreVertical`, `Send`, `Trash2`). Wraps `<AppShell>` + `<TopBar>` per page. Renders `SurfaceHeader` (kicker "Loop · Ship", `Hammer` icon), a `Composer` (dispatch), then session rows via `SessionRow`. `SessionRow` is a `<Link to="/build/$missionId">` using `.bento.lift` with `StatusIcon` + `StatusChip` + `ChangesetChip` + `fmtCost` from `src/components/studio/`. Data: `listStudioSessions` on `queryKey ["studio-sessions", showArchived]`, `refetchInterval: 5000`. Delete via `AlertDialog`.
- **`src/routes/_authenticated.build.$missionId.tsx`** (534 lines). Parchment full-page detail. Tabs `changes / pr / preview / cost` (`validateSearch` for `?tab=`). Panels: `SessionTimeline`, `ChangesPanel`, `EngineRoomDisclosure`, `PreviewPanel`, `CostPanel`. Data: `getStudioSession` (4s polling), `steerStudioSession`, gate cleared by the existing `decideApproval` via `ApprovalCard.tsx`. **This is the "full view" (depth 3). It stays; OBS-05 does not port its internals.**
- **`src/components/studio/*`**: `studio-ui.tsx` (`StatusChip`, `StatusIcon`, `ChangesetChip`), `studio-format.ts` (`fmtCost`), `ApprovalCard.tsx` (uses `decideApproval` server fn, `mutationFn: (decision: "approve" | "reject")`). Legacy `studio.*` identifiers = Build (CLAUDE.md rename disclaimer). Keep the internal names.
- **`src/lib/studio.functions.ts`**: `StudioSessionListItem = { mission_id, title, status, goal, created_at, updated_at, run_status, prd, changeset, pending_approvals, cost_usd, archived }`. `getStudioSession` returns `{ ...run detail..., approvals: StudioApproval[] }`. `decideApproval({ approvalId, decision })` exists. These are the read-only sources; do not modify.
- **`src/routes/_authenticated.today.tsx`**: the Call queue is the `["needs-you"]` query (`fetchNeedsYou`); dashboard is `["dashboard"]`. These are the sync targets to invalidate.
- **Shell**: OBS-02 delivers the 236px mono-index rail + 52px top bar into `_authenticated.tsx` (or per-page). **This spec assumes the OBS-02 shell is mounted and `[data-obsidian]` is present.** If OBS-02 has not landed, coordinate; do not re-skin the shell here.
- **Primitives**: OBS-03 delivers `MissionRow`, `SlideOver`, `CallCard`, `StatusDot`, `VerdictChip`, `MonoLabel`, `Toast`, `Button` under `src/components/obsidian/` (path per OBS-03). **This spec consumes them; it does not rebuild them.** If a primitive is missing, that is an OBS-03 gap, not new work here.

---

## 5. How · step by step

Build top to bottom. Each step names the file and the change.

1. **Confirm dependencies.** Verify OBS-02 shell mounted (`[data-obsidian]` on the authenticated layout root) and OBS-03 exports exist (`grep -r "export.*MissionRow\|export.*SlideOver\|export.*CallCard" src/components/obsidian`). If either is missing, stop and coordinate; OBS-05 cannot land without them.
2. **New file `src/components/obsidian/BuildMissionRow.tsx`.** Thin wrapper that maps a `StudioSessionListItem` onto the OBS-03 `MissionRow` anatomy: derive `status` from `run_status ?? status` -> one of `working | gate | done | queued`; `stepLabel` from the session's step field (fallback to the status word in mono, e.g. `WAITING ON YOU` when `pending_approvals > 0` -> ember gate); `verdict` chip only when `status === "done"`; `cost` via `fmtCost(cost_usd)`. The row is a real `<button>` that sets `?mission=<mission_id>` (does NOT navigate to the full page). Keep the archived/delete overflow menu as a quiet mono affordance (no lucide `MoreVertical`; use the `⋯` unicode glyph in mono).
3. **New file `src/components/obsidian/MissionSlideOver.tsx`.** Consumes OBS-03 `SlideOver`. Props: `missionId`. Inside: `useQuery({ queryKey: ["studio-session", missionId], queryFn: () => getStudioSession({ data: { missionId } }), refetchInterval: 4000 })`. Render header, step list, gate block (compressed CallCard when an unresolved approval exists), trace toggle, footer. Local state `traceOpen` (reset to `false` on each `missionId` change via `useEffect` keyed on `missionId`).
4. **Gate block.** When `getStudioSession` returns an unresolved `StudioApproval`, render it as the compressed CallCard (see §7 anatomy): "YOUR CALL" ember chip, 17px title, evidence, plain-words primary + secondary + consequence helper. The primary calls the existing `decideApproval({ approvalId, decision: "approve" })`, secondary `decision: "reject"`. **On success:** show the voice-correct Toast (3.6s), then invalidate `["needs-you"]`, `["dashboard"]`, `["studio-sessions"]`, and `["studio-session", missionId]` so Today, the mission row, and the slide-over all reflect the decision. This is the cross-object sync.
5. **Trace toggle.** Below the step list, a quiet glacier mono link "SHOW THE RAW TRACE →" toggles a `#0B0B0D` card with mono 10.5px log lines; each line shows the hop + per-hop cost in mono (e.g. `02:14 scout.pull intercom · 312 tickets · $0.22`). Source the lines from the session's trace field if present; if the current data contract has no trace array, render the step-derived hops with their per-step cost and note the gap in the ship report (do not fabricate content; show what the data has).
6. **Footer strip.** 11px faint: "Every hop cites the memory it drew on · Esc closes".
7. **Rewrite `_authenticated.build.index.tsx` render.** Replace `AppShell`/`TopBar`/`SurfaceHeader` parchment chrome with the Obsidian surface container (assumes OBS-02 shell provides the rail/top bar). Hero: Newsreader 34px "Build" with the surface intro. Keep `Composer` but re-skin its controls (textarea, PRD dropdown, ModelSwitcher, Start button) to the Obsidian idiom. Replace `SessionRow` usage with `BuildMissionRow`. Read `?mission=` from search; when set, render `<MissionSlideOver missionId={...} />`.
8. **`validateSearch`.** Add `mission?: string` to the route's `validateSearch` so `?mission=m2` is a typed search param and deep-links cleanly. Setting/clearing it uses `navigate({ search: (prev) => ({ ...prev, mission }) })`.
9. **Surface-switch closes slide-over.** The OBS-02 shell nav must clear `?mission=` on navigation (or rely on the param being route-scoped so leaving `/build` drops it). Verify Esc and scrim click both clear it (OBS-03 `SlideOver` handles Esc/scrim; wire its `onClose` to `navigate({ search: (prev) => ({ ...prev, mission: undefined }) })`).
10. **Remove lucide from this surface.** Delete all `lucide-react` imports from `build.index.tsx`. Replace `Send` on the Start button with a plain label (mechanism-free); replace `FileText`/`ChevronDown` in the PRD picker with mono glyphs; replace `MoreVertical` with `⋯`; drop `Hammer` (the hero has no icon). `GitPullRequest`/`ExternalLink` on the PR chip become a mono "PR #123 →" link.
11. **Reduced motion.** All pulses/glows come from OBS-03 primitives which already gate on `prefers-reduced-motion`; verify no new raw animation is added here.
12. **Tests.** Add `src/components/obsidian/MissionSlideOver.test.tsx` (see §12) and extend a build-route test for the `?mission=` open/close + verdict-chip-only-when-done mapping.

---

## 6. Structure

Component tree (Build surface):

```
_authenticated.build.index.tsx (route)
├── [OBS-02 shell provides rail + top bar]
├── BuildHero            (Newsreader 34px "Build" + intro)
├── Composer             (re-skinned: textarea · PRD picker · ModelSwitcher · Start)
├── MissionList
│   └── BuildMissionRow[]        → OBS-03 <MissionRow>
│         (statusDot · title · verdictChip(done) · stepLabel · cost · ⋯ menu)
└── MissionSlideOver (rendered when ?mission= set)   → OBS-03 <SlideOver>
      ├── SlideOverHeader   (MISSION · statusWord · cost · Close)
      ├── StepList          (01-NN · StatusDot · description · agent mono)
      ├── GateBlock         → OBS-03 <CallCard> compressed ("YOUR CALL", 17px)
      │     └── decideApproval(approve|reject) → Toast + invalidate sync
      ├── TraceToggle       ("SHOW THE RAW TRACE →" → #0B0B0D log card, per-hop cost)
      └── FooterStrip       ("Every hop cites the memory it drew on · Esc closes")
```

**New files**
- `src/components/obsidian/BuildMissionRow.tsx`
- `src/components/obsidian/MissionSlideOver.tsx`
- `src/components/obsidian/MissionSlideOver.test.tsx`

**Files modified**
- `src/routes/_authenticated.build.index.tsx` (re-skin, add `?mission=` search, swap row + slide-over, drop lucide).

**File moves/renames**: none. The `/build/$missionId` full route stays; internal `studio.*` identifiers stay (rename disclaimer).

**Data flow (all read-only unless noted)**: `listStudioSessions` (`["studio-sessions", showArchived]`, 5s poll) -> rows. `getStudioSession` (`["studio-session", missionId]`, 4s poll) -> slide-over. `decideApproval` (the ONE mutation, pre-existing) -> gate answer, then invalidate `["needs-you"]` + `["dashboard"]` + `["studio-sessions"]` + `["studio-session", missionId]`. Composer keeps `dispatchStudioSession` unchanged. **Server functions are consumed, not modified.**

---

## 7. Design elements (exact values, every state)

All tokens are the `[data-obsidian]` scope from `tokens/*.css` (hub §5). Do not invent a hex.

**Surfaces**: canvas `#0A0A0B` · card `#111113` · card-deep `#0E0E10` (CallCard base, trace card is `#0B0B0D`) · raised `#17171A` (secondary button, toast) · hover `#1D1D21` (row hover is `#141416`) · hairline `rgba(255,255,255,0.07)` · hairline-strong `rgba(255,255,255,0.09)` (slide-over left edge). Slide-over bg `#101013`.

**Ink**: primary `#F2F0ED` · body `#B5AFA6` · muted `#9C978F` · subtle `#7D786F` · faint `#55524C` (queued dot, footer, non-essential mono).

**Role colors (one job each)**: ember `#FF6B2C` (`--ember-deep #C2571F` pressed) · gate dot, "WAITING ON YOU" step label, the gate's one primary CTA, ember row-accent. Glacier `#7FD1DC` · working pulse, live step labels, trace link, focus ring. Moss `#7FBF8E` (`--moss-bright #8FD9A0` chip text) · done dot + SHIP/SHIPPED verdict. Madder `#E06557` (`--madder-bright #EE7A6C`) · KILL/failed verdict. Marigold `#E8B44C` · in-review verdict. Blossom `#E5BDDF` · evidence source pills / citations. `--cta-ink #0A0A0B` on ember fill.

**Type**: hero Newsreader 34px, weight 420-440, -0.015em, lh 1.15 (the one ember italic word allowed on this screen goes in the hero, e.g. "Build"). Mission-row title 13.5px/600 UI (Schibsted Grotesk), ellipsis. Slide-over title Newsreader 21px/460. Gate title (compressed) Newsreader 17px/460. Body 13px/1.55. Step description 13px. Mono labels JetBrains Mono 9-9.5px caps, 0.10-0.12em tracking, middot `·` separators (step label 9px, cost 9px, agent name 8px, trace lines 10.5px).

**Geometry**: grid 4px. Radii: control 8, card 12 (CallCard), panel 14, pill 99. Mission row padding 14/18. Slide-over 480px (max 92vw), fixed right. CallCard padding 20/22 (compressed gate: 16/18).

**Motion**: one easing `cubic-bezier(0.23,1,0.32,1)`. Slide-over `cadSlideIn` 240ms from right. Screen entry `cadRise` 260ms. Toast `cadRise` 200ms. Hover 140ms one-step tonal lift (no translate). Press: ember -> `--ember-deep`, scale(0.985) 140ms. Working dot `cadPulse` 2s + glow; gate dot `cadGlow` 1.8s + glow; done dot static moss glow; queued flat `#55524C`. All gated on `prefers-reduced-motion` (handled by OBS-03 primitives).

**Glows**: gate dot `0 0 10px 2px` ember. Working/done dots `0 0 10px` role color. Slide-over drop `−30px 0 60px rgba(0,0,0,0.5)`. Scrim `rgba(4,4,5,0.6)` + `blur(3px)`. Toast: moss 40% border + moss glow.

**Component anatomies + states**

- **Mission row** (full-width `<button>`, 14/18 padding, bottom hairline). Cells left-to-right: 6px status dot (own color + motion + mono word) · title 13.5px/600 primary, ellipsis · verdict chip (done only) · step label mono 9px, right-aligned, ~96px column · cost mono 9px faint, ~44px right · `⋯` overflow menu (mono, quiet).
  - _hover_: bg -> `#141416`, hairline brightens; no translate.
  - _focus-visible_: 2px glacier outline, offset 2.
  - _active/press_: scale(0.985) 140ms.
  - _loading_ (initial list): the surface shows a quiet mono line "Loading missions…" faint ink, no spinner chrome.
  - _empty_: instruction card (see §9), never a blank box.
  - _error_: card-deep panel, madder mono label, message, a "Retry · reloads missions" quiet button.
- **Slide-over** (`role="dialog" aria-modal`, focus trap, restore focus on close). 480px, bg `#101013`, left hairline-strong, drop shadow, `cadSlideIn` 240ms. Header row: "MISSION" mono label + status word (role-colored) + cost mono + Close (mono `×` / "Close"). Title Newsreader 21px/460.
  - _Step list_: each step = mono index `01`-`NN` + 6px status dot + description 13px (ink follows state: working/gate = primary, done = muted, queued = subtle) + agent name mono 8px right-aligned. Live step pulses glacier; the gate step flares ember "WAITING ON YOU".
  - _Gate block (compressed CallCard)_: container card-deep `#0E0E10`, 1px `rgba(255,107,44,0.25)` border, radius 12, padding 16/18. Top: "YOUR CALL" ember mono 9px caps pill + expiry faint mono. Title Newsreader 17px/460. Body 13px/1.65 muted. Evidence rows: blossom source pill (mono 8.5px) + verbatim quote 12.5px body. Actions: ember primary + secondary + consequence helper 11.5px subtle. Only shows when an unresolved approval exists.
    - _answering_: primary shows "Deciding…" while `decideApproval` runs; on success the gate collapses, the step flips (gate -> done "SHIPPED"/"MERGING" on approve; -> working "REVISING" on reject), Toast fires, queries invalidate.
    - _error_: inline madder mono line under the actions ("Couldn't record that · try again"); the call stays open.
  - _Trace toggle_: "SHOW THE RAW TRACE →" glacier mono. Expanded: `#0B0B0D` card, mono 10.5px lines, each line ends with per-hop cost mono (`… · $0.22`). Collapsed by default; resets per open.
  - _Footer strip_: 11px faint "Every hop cites the memory it drew on · Esc closes".
- **Toast**: fixed bottom-center, `#17171A` pill, moss 40% border + moss glow, 13px primary text, `cadRise` 200ms, auto-dismiss 3.6s, singleton.

---

## 8. Restructuring / renaming / modification

- **Lucide removal (chrome)**: delete every `lucide-react` import from `_authenticated.build.index.tsx` (`Archive`, `ArchiveRestore`, `ChevronDown`, `ExternalLink`, `FileText`, `GitPullRequest`, `Hammer`, `MoreVertical`, `Send`, `Trash2`). Replace with mono glyphs (`⋯`, `→`, `×`) or plain text. `StatusIcon` from `studio-ui.tsx` (which may itself use lucide) is replaced by the OBS-03 `StatusDot`; if `studio-ui.tsx` is used only here, leave it in place (do not touch the full-page route's usage).
- **Row target change**: `SessionRow` was a `<Link to="/build/$missionId">` (navigates to full page). `BuildMissionRow` instead sets `?mission=<id>` (opens the slide-over). The full-page route stays reachable via an "Open full view →" link inside the slide-over.
- **Search param add**: `_authenticated.build.index.tsx` `validateSearch` gains `mission?: string`.
- **No renames/moves/deletions of files or routes.** `studio.*` internal identifiers stay (rename disclaimer). No route fold here (that is OBS-10). No redirects. No nav-model edit (that is OBS-02/OBS-10).
- **Deletion**: none of the studio server functions or the `/build/$missionId` route.

---

## 9. Copy / voice (humanized: no em/en dashes, no exclamation marks)

- Hero: **Build** (the one ember italic word is the surface name in the hero). Intro line: "Validated work becomes shipped code. Approved specs come in · merged work moves on."
- Composer placeholder: "Describe what to ship. Build plans against the connected repo." · helper mono: "⌘Enter to start · gates come back to you" · button: **Start** (no mechanism name; helper carries consequence).
- Mission row step labels (mono caps, role-colored): `SCOUT · STEP 2/5` (glacier working), `WAITING ON YOU` (ember gate), `SHIPPED` / `MERGING` (moss done), `REVISING` (glacier working after send-back), `QUEUED` (faint).
- Slide-over header: `MISSION` mono label · status word colored · cost mono (`$0.84`).
- Gate (compressed CallCard): chip `YOUR CALL` · consequence helper: "Opens the pull request · nothing ships without you." · primary button **Approve** · secondary **Send back**.
- Gate success toasts (voice-correct, 3.6s): approve -> "Good call. The PR is open." · send back -> "Sent back. It is revising now."
- Trace toggle: "SHOW THE RAW TRACE →" (glacier mono). Trace line format: `02:14 scout.pull intercom · 312 tickets · $0.22`.
- Footer strip: "Every hop cites the memory it drew on · Esc closes".
- **Empty state** (instruction + time estimate, never blank): title "Nothing building yet" · body "Agents dispatch builds from approved specs, or describe the work above in plain language. A first build usually starts within a minute." · CTA "Describe the work · Build takes it from there" (focuses the composer).
- Error (list): label "Couldn't load missions" · button "Retry · reloads missions".
- Delete dialog (unchanged intent, humanized): "Delete this build session?" · "This removes the build's working log and any staged files. What was decided and learned stays in your Brain. To just tidy the list, Archive instead." · actions "Cancel" / "Delete session".

---

## 10. Acceptance criteria

- [ ] `/build` renders inside the OBS-02 mono-index shell on `[data-obsidian]`, canvas `#0A0A0B`, Newsreader 34px hero, `cadRise` entry. No parchment `bento`/`SurfaceHeader` remains on this surface.
- [ ] Each session renders as a `MissionRow` (OBS-03): status dot + mono word · title 13.5px/600 ellipsis · verdict chip **only when done** · step label mono 9px · cost mono 9px. Hover -> `#141416`, no translate.
- [ ] A mission row is a real `<button>`; clicking it sets `?mission=<id>` and opens the slide-over. It does not navigate to the full page.
- [ ] `?mission=m2` in the URL opens that slide-over on load (deep link). Esc, scrim click, and Close all clear the param and close the slide-over. Switching surface closes it.
- [ ] Slide-over is 480px, bg `#101013`, `cadSlideIn` 240ms, `role="dialog" aria-modal`, focus trap, focus restored on close.
- [ ] Step list shows mono index + status dot + description (ink by state) + agent mono; the working step pulses glacier, the gate step flares ember "WAITING ON YOU".
- [ ] When a mission waits on an approval, the inline gate renders as the compressed CallCard ("YOUR CALL", 17px title, evidence, Approve / Send back, consequence helper). Answering calls the existing `decideApproval`.
- [ ] Answering the gate: fires the voice-correct Toast (3.6s), invalidates `["needs-you"]` + `["dashboard"]` + `["studio-sessions"]` + `["studio-session", missionId]`; Today's Call badge/queue and the mission row both update without a manual refresh.
- [ ] Trace toggle collapsed by default, resets per open; expanded shows `#0B0B0D` mono lines each ending in per-hop cost.
- [ ] Footer strip present. Composer still dispatches (⌘Enter + Start). No lucide import remains in `build.index.tsx`.
- [ ] Empty / loading / error states match §9; grayscale still reads; restraint budget holds (one ember CTA = the gate primary; status color only on status).

---

## 11. Prototype-parity checklist (last gate · §5.9, tailored)

Open `design-reference/obsidian-v3/design-reference/cadence-app.html` at 1440px, click Build, and compare:
1. **Rail**: 236px mono index 01-05, Build (04) active bg `#1A1A1E` + ember index, working shimmer line if a mission is live. (OBS-02 owns the rail; verify it renders around Build.)
2. **Surface chrome**: 52px top bar, container max-width and padding match, `cadRise` entrance.
3. **Type**: hero Newsreader 34px with the one ember italic word; row titles 13.5px/600; slide-over title 21px/460; gate title 17px; mono labels 9-9.5px caps with middots.
4. **Color**: zero hexes outside tokens; ember only on the gate (needs-a-human); glows match (gate dot `0 0 10px 2px`, working/done dots `0 0 10px`).
5. **Motion**: row hover 140ms one-step lift; slide-over `cadSlideIn` 240ms; working/gate pulses only on live status; reduced-motion kills all.
6. **Behavior**: mission row opens slide-over via `?mission=`; Esc closes; answering the gate rewrites the step label + syncs Today; toast 3.6s singleton; switching surface closes the slide-over.
7. **Copy**: plain-words buttons (Approve, Send back, Start), consequence helpers, mono-caps metadata, no em/en dashes, no exclamation marks.
8. **Grayscale** screenshot still reads; restraint budget audited (one ember CTA, status color only on status).

Put both side-by-side screenshots (list + slide-over open with a gate) in the ship report.

---

## 12. Verification + gates

- `tsc --noEmit` = 0.
- `bun test` green. New tests:
  - `src/components/obsidian/MissionSlideOver.test.tsx`: (a) renders the gate as a CallCard when an unresolved approval is present and hides it otherwise; (b) verdict chip appears only when status is done; (c) trace toggle starts collapsed and resets on `missionId` change; (d) answering invokes `decideApproval` and triggers the four query invalidations (mock the query client, assert `invalidateQueries` called with each key).
  - Extend a build-route test: `?mission=m2` opens the slide-over; Esc/close clears the param.
- `bun run build`: **worktree build-gate caveat (hub §11)**: `bun run build` is RED in lane worktrees on the pre-existing `lovable-tagger` node20/ESM `require()` error, unrelated to this work. In a lane treat `tsc + bun test` as the real gates; run the full build on the primary checkout before publish. Do not chase lovable-tagger.
- **Grayscale test**: screenshot the list + slide-over, desaturate; meaning must survive (every dot ships its mono word; the gate reads without ember).
- **Restraint budget** (hub §4): one ember CTA (the gate primary), no aurora on this surface, status color only on status, one machine voice (glacier).
- **impeccable / humanized scan**: grep every new string for the em dash, the en dash, and the exclamation mark; run the banned-word list (seamlessly, leverage, empower, robust, unlock, delve). Zero hits.
- **Manual checks**: dispatch a build (composer), open its row (slide-over via `?mission=`), reload the URL (deep-link opens), answer a gate, confirm Today's Call badge drops and the row step flips, toggle the trace, Esc closes and focus returns to the row.

---

## 13. Risks · gotchas · founder-gates

- **OBS-03 primitive shape**: this spec assumes `MissionRow`, `SlideOver`, `CallCard` prop shapes from OBS-03. If OBS-03 shipped different prop names, adapt the wrappers, do not fork the primitives. Confirm before building.
- **Trace data**: the current `getStudioSession` contract may not carry a discrete `trace: [line]` array with per-hop cost like the prototype's static sample. Do not fabricate lines. Render from real step/cost data; if the per-hop cost is not in the contract, show what exists and note the gap in the ship report (a data-contract follow-on, not a fabrication).
- **Cross-object sync keys**: Today uses `["needs-you"]` and `["dashboard"]` today; if OBS-04 renames them, align on the new keys. The sync is the product's point (item note) · verify it live, not just in a unit test.
- **decideApproval reuse**: reuse the existing fn exactly (same one `ApprovalCard.tsx` calls). Do not add a new approval server fn (would be feature work, out of scope).
- **Full-page route coexistence**: `/build/$missionId` stays as depth-3. The slide-over is depth-2. Make sure the "Open full view →" link and the direct route both work; do not orphan the detail page.
- **Founder-gate**: none specific to OBS-05. Route renames (OBS-10) and demo seed (OBS-14) are the only gated port points; this item does not touch them.

---

## 14. Interlinks

- **Hub / substrate**: [`README.md`](./README.md) (tokens hub §5, restraint budget §4, parity checklist §5.9, state model §5.10, keyboard §5.11, a11y §5.12, codebase map §7).
- **Depends on**: [`OBS-03.md`](./OBS-03.md) (primitives: `MissionRow`, `SlideOver`, `CallCard`, `StatusDot`, `VerdictChip`, `MonoLabel`, `Toast`, `Button`) · shell [`OBS-02.md`](./OBS-02.md).
- **Siblings (build-order neighbors)**: [`OBS-04.md`](./OBS-04.md) · the gate answered here must sync Today's Call queue (`["needs-you"]`); [`OBS-06.md`](./OBS-06.md) / [`OBS-07.md`](./OBS-07.md) parallel surfaces; [`OBS-09.md`](./OBS-09.md) Engine Room; [`OBS-15.md`](./OBS-15.md) chart grammar (rides Build/Brain/Engine Room).
- **Canon anchors**: `components.md` · "Mission row (Build)", "Mission slide-over", "CallCard (the atomic unit)" (compressed gate variant), "Toast", "Status dots", "Verdict chips" (`/design-reference/obsidian-v3/components.md`). `implementation-notes.md` · "Core behaviors" (answering a call, mission slide-over, cross-object sync), "Routing" (`?mission=` search param). `DESIGN-OBSIDIAN.md` §8 "Information architecture" (Build: ONE cockpit) + §9 "Components" (Mission row / Status dots / Verdict chips).
- **Board**: [`../feature-dashboard.md`](../feature-dashboard.md) group G14 · **bible**: [`../obsidian-port-plan.md`](../obsidian-port-plan.md) · **strategy**: [`../../strategy/v11-guiding-star.md`](../../strategy/v11-guiding-star.md) · **doctrine**: [`../../conventions/engine-room-doctrine.md`](../../conventions/engine-room-doctrine.md).
