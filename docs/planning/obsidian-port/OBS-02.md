# OBS-02 · The app shell (236px mono-index rail · 52px top bar · surface container · keyboard map)

> _Created: 2026-07-02 · Self-contained build+implementation spec. Read the hub ([`README.md`](./README.md)) once for shared canon; everything you need to build this item is embedded below._

---

## 1. Snapshot

| Field | Value |
| --- | --- |
| ID | OBS-02 |
| Rank | #3 |
| Tier | 1 (foundation, strictly ordered) |
| Status | pending |
| Category | Cockpit |
| Depends on | OBS-01 (tokens + fonts + 8 keyframes + `[data-obsidian]`) |
| Blocks | OBS-03 (primitives), and transitively every surface (OBS-04..09) and the IA fold (OBS-10) |
| One-line what | The app shell: a 236px rail on `--rail` with a mono numeral nav 01-05 (NO icons, lucide removed from the rail), the Butterfly mark with flutter, the one Today badge, the shimmer working line, the Engine Room door, the user chip, a 52px top bar, the surface container with `cadRise`, and the keyboard map 1-5 / g / Esc. |
| Dashboard row | [`../feature-dashboard.md`](../feature-dashboard.md) group G14, row OBS-02 |
| Summary bible | [`../obsidian-port-plan.md`](../obsidian-port-plan.md) |

---

## 2. Why we are doing it

The shell is the frame every surface lives inside, so it flips first (hub §2 constraint 4): the moment the rail, top bar, and container are Obsidian, the whole app reads as one coherent instrument even while individual surfaces are still parchment. A mixed state is expected and acceptable mid-port; an incoherent frame is not.

This item serves all three Obsidian laws at the chrome level. Law 2 (one queue for attention) is why the rail carries exactly ONE badge, on Today, in ember, showing the count of unanswered Calls: attention has a single home and a single color. Law 3 (depth on demand) is why the Engine Room is a single recessed door in the footer, not five governance icons: the machinery is behind one door, revealed only when asked. The iconography law (DESIGN-OBSIDIAN §7, hub §5.8) is the shell's signature: there is no icon set, so the nav is a mono numeral index 01-05 and the only pictorial element is the Butterfly. This is why the port pulls `lucide-react` out of the rail.

The felt outcome: a calm, jet-black cockpit. Nothing in the frame pulses or glows except live state (the shimmer working line, the glacier presence dot) and the one ember Call badge. The frame itself never nags. That restraint is the v11 guiding star made physical (the decision-and-outcome layer; attention only where a human is genuinely needed) and the engine-room doctrine made structural (calm front, deep engine behind one door).

Architecturally OBS-02 also makes a foundation decision the whole port depends on: whether the shell is hoisted once into the authenticated layout or re-skinned per page. We hoist (see §5). One shell, one source of chrome, no drift.

---

## 3. What we are building

**Scope IN**
- A reskinned `AppShell` rendering the Obsidian rail: 236px, `--rail` background, right hairline; Butterfly header + wordmark + workspace name; the `Search … ⌘K` affordance; the five-item mono-index nav; the footer trio (shimmer working line, Engine Room door, user chip).
- The nav-model reshape in `src/lib/nav-model.ts`: drop the `lucide` import and the `icon` field, add a mono `index` field, rename the five destinations to Today · Discover · Plan · Build · Brain, and remove Ask from the rail. Update `nav-model.test.ts`.
- **Hoisting** the shell once into `src/routes/_authenticated.tsx` (wrap `<Outlet/>`), and unwrapping the per-page `<AppShell>` from the ~21 routes that currently wrap it.
- A reskinned `TopBar`: 52px, bottom hairline, surface title 13.5px/600 + optional subtitle, right-side date in mono caps + workspace pill; keep the `actions` slot; remove its two lucide imports.
- A shared Obsidian `Surface` container component (max-width 1060 / 1160, padding 36/32/64, `cadRise` entrance) that OBS-04..09 adopt per surface.
- The keyboard map: `1`-`5` switch the five surfaces, `g` opens the Engine Room, `Esc` closes overlays; guarded against inputs and modifiers.

**Scope OUT (no feature work rides along)**
- No server-function changes. The shell CONSUMES read-only, exactly as today: `getWorkspacePauseState`, `getNeedsYou` (drives the Today badge count), `getLiveRunCounts` (drives the shimmer working line), `amIAdmin`, plus the `useWorkspace` context. None are modified.
- No primitive components (Button, StatusDot, Toast, CallCard, MissionRow, SlideOver): that is OBS-03.
- No surface content (Today hero, Call queue, mission rows): those are OBS-04..09. OBS-02 restyles only the frame.
- No true route consolidation or redirects: renaming legacy routes to `/discover`, `/plan`, `/engine-room` and adding redirects is OBS-10. OBS-02 points the renamed nav labels at the nearest existing routes so the rail works end to end today.
- The auxiliary top-bar widgets (`AttentionBell`, `MachineViewToggle`, `ConstructionPill`, `CookingBanner`, `LoopThread`, `AmbientChip`) keep their current markup for now; their reskin rides with later items. OBS-02 restyles only the 52px bar shell around them.
- Ask does not become a panel here: removing it from the rail is in scope; building the `⌘J` panel is OBS-12.

---

## 4. Current state (real files, verified 2026-07-02)

- **`src/components/cadence/AppShell.tsx`** (743 lines). Parchment "Ember Editorial" shell. `<aside>` is `w-[232px]` on `bg-sidebar` with a right `hairline` border. Header is a workspace-switcher `DropdownMenu` with `<CadenceMark size={26}>` (the SVG butterfly from `Primitives.tsx`) + "Cadence" wordmark. A `Search / Jump to… / ⌘K` button dispatches `cadence:open-cmdk`. Nav renders `PRIMARY_NAV.map` through a local `NavRow` that draws a **lucide `<Icon>`** (`item.icon`) + label + optional coral badge. Footer holds the pause banner, a running-agents line (`dot-running`, links to `/missions`), the Engine Room `DropdownMenu` (door + `ENGINE_ROOM_LINKS`), `BudgetBar`, `FlowWidget`, a theme toggle (`Sun`/`Moon` lucide), and the user chip. Imports ~15 lucide glyphs (`Settings, LogOut, ShieldAlert, ChevronDown, PauseCircle, Sun, Moon, Search, Plus, Trash2, Pencil, LogOut as LeaveIcon`). `<main>` renders `{children}`.
- **`src/components/cadence/TopBar.tsx`** (92 lines). 54px header, sticky, `border-bottom var(--hairline)`, `background var(--canvas)`. Breadcrumbs via `crumbs.map` with lucide `ChevronRight` separators; right side `ConstructionPill`, the `actions` slot, `MachineViewToggle`, `AttentionBell`, a lucide `Calendar` + date, `AmbientChip`. Renders `<LoopThread/>` and `<CookingBanner/>` below the bar. Imports lucide `Calendar, ChevronRight`.
- **`src/lib/nav-model.ts`** (96 lines, pure, unit-tested). `NavItemDef = { to, label, icon: LucideIcon, search? }`. `PRIMARY_NAV` = Today(`/today`, `Home`) · **Ask**(`/chat`, `MessageCircle`) · **Product**(`/product`, `Telescope`) · Build(`/build`, `Hammer`) · Brain(`/knowledge`, `Brain`). `ENGINE_ROOM_DOOR` = Engine Room(`/govern`, `ShieldAlert`). `ENGINE_ROOM_LINKS` = Approvals/Spend/Engine Room/Trust Ledger/Connectors, each with a lucide icon. Pure helpers `navItemActive` and `engineRoomActive`. Imports 10 lucide glyphs + `LucideIcon`.
- **`src/lib/nav-model.test.ts`** (96 lines). Asserts `PRIMARY_NAV` labels equal `["Today","Ask","Product","Build","Brain"]`, that every item has an `icon`, that routes are unique and flat, and the engine-room invariants. These assertions change with the reshape.
- **`src/routes/_authenticated.tsx`** (50 lines). Layout route. Mounts `WorkspaceProvider`, `FlowModeProvider`, `BackendHealthBanner`, `BillingBanner`, `CommandPalette`, `GotoShortcuts`, `<Outlet/>`. **Does NOT render the rail** today. `data-obsidian` is not on this root yet (OBS-01 introduces it).
- **`src/routes/_authenticated.today.tsx`** and 20 sibling routes each import and wrap `<AppShell projects={…}>` + `<TopBar crumbs={…} actions={…}>`. Confirmed count: **21 routes wrap AppShell** (`build.index`, `chat`, `fleet`, `traces.$traceId`, `govern`, `eval-health`, `impact`, `today`, `changelog`, `sync`, `stakeholder`, `settings`, `trust-ledger`, `missions.index`, `missions.$missionId`, `build.$missionId`, `knowledge`, `prds.$id`, `admin`, `product`, and one more). The `projects` prop passed to `AppShell` is typed `projects?: unknown` and is UNUSED inside the component, so it is safe to drop.
- **`src/components/cadence/CommandPalette.tsx`** exports `GotoShortcuts` (line 174). Today it implements a `g`-prefix CHORD (press `g`, then `d`/`c`/`a`/`b`/`s`/`p`/`k`/`m`/`l`/`v` within 800ms) that navigates, plus `⌘K` opens the palette and `Esc` closes it. The Obsidian map differs (single-press `1`-`5`; `g` alone opens the Engine Room), so this handler is superseded (see §5 step 7).
- **`design-reference/obsidian-v3/design-reference/ui-kit-shell.html`** is the readable shell reference (the 1.4MB `cadence-app.html` is a compressed blob; the ui-kit shell renders the identical rail). Every value in §7 below is quoted from it.
- **Butterfly assets exist:** `design-reference/obsidian-v3/assets/butterfly-idle.svg` (ash `#8A8580`/`#6E6A64` wings, porcelain `#F2F0ED` body), `butterfly-working.svg` (violet `#C77DFF` wings), `butterfly-ember.svg` (the ember mark used in the rail header). Never redraw them.

---

## 5. How, step by step

Build top to bottom. Each step names the file and the exact change.

1. **Confirm OBS-01 landed.** Verify `[data-obsidian]` exists in `src/styles.css` with the surface/ink/role tokens, the five fonts (incl. Codystar, Caveat), and the eight keyframes (`cadPulse, cadGlow, cadShimmer, cadFlutter, cadDriftA, cadDriftB, cadRise, cadSlideIn`) plus `--shimmer-gradient`. If OBS-01 is still in flight, do not proceed. Confirm the `data-obsidian` attribute is on the authenticated root: if OBS-01 placed it on `_authenticated.tsx`'s wrapper, reuse it; if not, add it in step 6.

2. **Reshape `src/lib/nav-model.ts`.**
   - Delete the entire `lucide-react` import block (lines 18-30) and the `type LucideIcon` re-export usage.
   - Change `NavItemDef` to `{ to: string; label: string; index: string; search?: Record<string, string> }` (drop `icon`, add `index`).
   - Rewrite `PRIMARY_NAV`:
     ```ts
     export const PRIMARY_NAV: readonly NavItemDef[] = [
       { to: "/today", label: "Today", index: "01" },
       { to: "/product", label: "Discover", index: "02" }, // OBS-10 folds to /discover
       { to: "/product", label: "Plan", index: "03", search: { tab: "roadmap" } }, // OBS-07/OBS-10 finalize the Plan route
       { to: "/build", label: "Build", index: "04" },
       { to: "/knowledge", label: "Brain", index: "05" },
     ];
     ```
     Ask (`/chat`) is removed from the rail. Discover keeps `/product` and Plan uses `/product?tab=roadmap` as the nearest existing surface until OBS-10 renames them (see §13 open question). NOTE: do NOT point Plan at `/roadmap` - that route redirects to `/product?tab=opportunities` (Discover's tab), so the interim Plan entry must target `/product` with `search: { tab: "roadmap" }` (the roadmap tab exists on `/product`).
   - Remove `icon` from `ENGINE_ROOM_DOOR` and from every entry in `ENGINE_ROOM_LINKS` (Obsidian has no icon set; the door dropdown becomes text rows). Leave `to`/`label`/`search` untouched so no engine-room destination is orphaned. Keep `ENGINE_ROOM_PATHS`, `navItemActive`, `engineRoomActive` unchanged.

3. **Update `src/lib/nav-model.test.ts`.**
   - Change the labels assertion to `expect(labels).toEqual(["Today","Discover","Plan","Build","Brain"])`.
   - Replace the "has an icon" assertion with `expect(n.index).toMatch(/^0[1-5]$/)` and keep route/label checks.
   - Add: indices are `["01","02","03","04","05"]` in order, and unique.
   - The engine-room tests still pass (icon is no longer asserted); if any test reads `.icon`, drop that read.

4. **Rewrite the rail in `src/components/cadence/AppShell.tsx`.** Keep all data hooks and workspace/dropdown handlers (they are consumed read-only); replace the presentation:
   - Remove every `lucide-react` import from this file. The rail chrome uses NO lucide.
   - `<aside>`: `width: 236px`, `background: var(--rail)`, `border-right: 1px solid var(--hairline)`, full height, sticky.
   - Header (`padding: 16px 16px 12px; border-bottom: 1px solid var(--hairline-faint)`): render the Butterfly. Reuse `<CadenceMark size={24}>` OR an `<img src="/assets/butterfly-ember.svg" width={24} height={24}>` with `filter: drop-shadow(0 0 6px rgba(255,107,44,0.4))` and the `cadFlutter` flutter class (transform-origin 12px 12px). Wordmark "Cadence" 13.5px/700 `var(--text-primary)` letter-spacing -0.01em; below it the workspace name 10.5px `var(--text-subtle)`. Keep the workspace-switcher `DropdownMenu`, but its menu items become plain text rows (drop the lucide glyphs; use plain-word labels).
   - Search affordance (`padding: 10px 10px 4px`): border 1px hairline, `background: var(--card)`, radius 8, padding 7px 10px, 12px `var(--text-subtle)`, text "Search", a flex spacer, then "⌘K" in mono 9.5px. `onClick` keeps dispatching `cadence:open-cmdk`.
   - Nav (`padding: 8px 10px; display:flex; flex-direction:column; gap:2px; flex:1`): map `PRIMARY_NAV` through a new `NavRow` that renders `<span class="num">{item.index}</span>` (mono 9.5px `var(--text-faint)`) + label (flex 1, 13px) + the badge on Today only. See §7 for the exact `nav-item` states.
   - The badge: render only for the Today item when the Call count > 0, using `callCount` (already computed from `getNeedsYou`). Exact styling in §7.
   - Footer (`border-top: 1px solid var(--hairline-faint); padding: 12px 14px; gap:10px`): three rows.
     - Row 1, the shimmer working line: shown when `runningCount > 0`. A 5px glacier dot with `cadPulse 2s` + the text `{runningCount} agent{s} working` painted with `--shimmer-gradient` (background-size 280%, `cadShimmer 5s linear infinite`, clipped to text). Mono 9.5px, letter-spacing 0.1em, uppercase. When zero, the row is hidden (never a fake pulse). Keep the queued suffix behavior if present.
     - Row 2, the Engine Room door: keep the `DropdownMenu`. Trigger is a hairline button (border 1px hairline, radius 8, padding 7px 10px, 12px `var(--text-muted)`) with a mono "G" shortcut hint (9.5px `var(--text-faint)`), the label "Engine Room" (flex 1), and a right-aligned state in faint mono: "ALL CLEAR" when `callCount === 0`, otherwise the count. The dropdown lists `ENGINE_ROOM_LINKS` as text rows.
     - Row 3, the user chip: a 24px round avatar (`background: var(--hover)`, border 1px `rgba(255,107,44,0.45)`, initials 9.5px/700 `var(--text-primary)`), the name 12px `var(--text-muted)` (flex 1), and a 6px moss presence dot (`background: var(--moss); box-shadow: 0 0 7px rgba(127,191,142,0.6)`). Move the theme toggle and Settings link into the workspace dropdown or a quiet text control; do not reintroduce lucide.
   - `<main>` still renders `{children}` (which is now the `<Outlet/>` content, since the shell is hoisted).

5. **Reskin `src/components/cadence/TopBar.tsx`.**
   - Remove the lucide imports (`Calendar, ChevronRight`).
   - Bar: `height: 52px`, `padding: 0 28px`, `gap: 14px`, `border-bottom: 1px solid var(--hairline-faint)`, `background: var(--canvas)`, sticky.
   - Left: derive the surface title from the last `crumbs` entry (13.5px/600 `var(--text-primary)`); optionally a subtitle from the penultimate crumb (12px `var(--text-faint)`). No chevron separators.
   - Flex spacer, then the `actions` slot (kept), then the date in mono caps ("WED · JUL 2", built from `toLocaleDateString` with weekday short + a middot + month/day, uppercased), then the workspace pill ("LUMEN"-style: the active workspace name uppercased, mono 9px, letter-spacing 0.1em, `var(--text-muted)`, border 1px `var(--hairline-strong)`, radius 99, padding 3px 10px).
   - Leave `AttentionBell`, `MachineViewToggle`, `ConstructionPill`, `CookingBanner`, `LoopThread`, `AmbientChip` mounted for now (scope OUT); they reskin later.

6. **Hoist the shell in `src/routes/_authenticated.tsx`.**
   - Import `AppShell`. Wrap the layout body: `<AppShell><Outlet/></AppShell>` inside the existing provider tree.
   - Ensure the outermost rendered element carries `data-obsidian` (add it to a wrapping `<div data-obsidian>` if OBS-01 did not put it on this root). This scopes the Obsidian tokens to the whole authenticated app.
   - The keyboard hook (`GotoShortcuts`) stays mounted here; update it in step 7.

7. **Wire the Obsidian keyboard map** (edit `GotoShortcuts` in `src/components/cadence/CommandPalette.tsx`, or add a small `useShellKeyboard` hook used in `_authenticated.tsx`).
   - `1`-`5` (single press, no chord): navigate to `PRIMARY_NAV[n-1].to`.
   - `g` (single press): navigate to `ENGINE_ROOM_DOOR.to` (`/govern`). This supersedes the legacy `g`-prefix chord; remove the chord map (its discovery role moves to the `⌘K` palette, OBS-11).
   - `Esc`: close any open overlay (keep the existing palette-close behavior).
   - Guard exactly as today: ignore when `e.metaKey || e.ctrlKey || e.altKey`, or when focus is in `INPUT`/`TEXTAREA`/`isContentEditable`.
   - Keep `⌘K` opening the palette (OBS-11 replaces the palette itself). `⌘J` (Ask) is OBS-12.

8. **Create the `Surface` container** at `src/components/obsidian/Surface.tsx` (new folder for Obsidian chrome): a wrapper that renders `max-width: 1060px` (accept a `wide` prop for 1160 on Discover/Plan), `margin: 0 auto`, `padding: 36px 32px 64px`, `animation: cadRise 260ms var(--ease) both`. OBS-02 ships it; OBS-04..09 adopt it as they port their surface. Do NOT rewrite the 21 pages' inner containers here.

9. **Unwrap the 21 routes.** In each route that currently wraps `<AppShell projects={…}>…</AppShell>`, remove the `AppShell` wrapper and its import so the shell no longer double-mounts (it now comes from the layout). Keep each page's `<TopBar>` and content as the top-level fragment. Drop the now-unused `projects` prop and the `AppShell` import. This is mechanical; do it in one pass and let `tsc` catch stragglers.

10. **Test.**
    - `bun test src/lib/nav-model.test.ts` green with the reshaped assertions.
    - `bunx tsc --noEmit` clean (the 21 unwraps + the two component rewrites).
    - Manual: `bun run dev`, open `/today`. Walk the §11 parity checklist against `ui-kit-shell.html` at 1440px. Press `1`-`5` and `g`; confirm surface switches and the Engine Room opens. Type in the task input and confirm the number keys do NOT hijack typing.

---

## 6. Structure

**Component tree after OBS-02**

```
_authenticated.tsx  (layout, data-obsidian on root)
├─ WorkspaceProvider / FlowModeProvider
├─ BackendHealthBanner · BillingBanner · CommandPalette · GotoShortcuts(keyboard)
└─ AppShell                         ← hoisted once here
   ├─ aside (236px rail, --rail)
   │  ├─ Header: Butterfly (cadFlutter) + Cadence + workspace name  [workspace DropdownMenu]
   │  ├─ Search … ⌘K
   │  ├─ nav: NavRow × 5  (index 01-05, label, Today badge)
   │  └─ footer: shimmer working line · Engine Room door (DropdownMenu) · user chip
   └─ main
      └─ <Outlet/>                   ← each surface route renders here
         └─ (per page) TopBar + Surface(container, cadRise) + content
```

**New files**
- `src/components/obsidian/Surface.tsx` - the surface container (max-width 1060/1160, padding 36/32/64, `cadRise`).

**Modified files**
- `src/lib/nav-model.ts` (reshape), `src/lib/nav-model.test.ts` (assertions).
- `src/components/cadence/AppShell.tsx` (rail reskin, lucide removed, `NavRow` rewrite).
- `src/components/cadence/TopBar.tsx` (bar reskin, lucide removed).
- `src/routes/_authenticated.tsx` (hoist shell + `data-obsidian`).
- `src/components/cadence/CommandPalette.tsx` (`GotoShortcuts` keyboard map).
- 21 `_authenticated.*` routes (drop the `AppShell` wrapper + import).

**File moves / renames:** none. **Data flow:** the shell CONSUMES existing server fns read-only via `useServerFn` + `useQuery`: `getWorkspacePauseState` (`["governance","pause-state",id]`), `getNeedsYou` (`["needs-you"]` → the Today badge count), `getLiveRunCounts` (`["live-run-counts"]` → the shimmer line), `amIAdmin` (`["am-i-admin"]`). No server function is added or modified in OBS-02.

---

## 7. Design elements (exact values, all interaction states)

All hexes/durations below are quoted from `ui-kit-shell.html` and hub §5. Never invent a value.

**Tokens this surface uses:** `--canvas #0A0A0B` · `--rail #0D0D0F` · `--card #111113` · `--raised #17171A` · `--hover #1D1D21` · `--hairline rgba(255,255,255,0.07)` · `--hairline-strong rgba(255,255,255,0.09)` · `--hairline-faint rgba(255,255,255,0.05)` · `--text-primary #F2F0ED` · `--text-muted #9C978F` · `--text-subtle #7D786F` · `--text-faint #55524C` · `--ember #FF6B2C` · `--ember-deep #C2571F` · `--glacier #7FD1DC` · `--moss #7FBF8E` · `--font-ui "Schibsted Grotesk"` · `--font-mono "JetBrains Mono"` · `--shimmer-gradient linear-gradient(90deg,#7FD1DC,#5B7CFA,#8B5CF6,#C77DFF,#EAF6FF,#3B5BDB,#7FD1DC)` · `--ease cubic-bezier(0.23,1,0.32,1)` · `--dur-control 140ms` · `--dur-page 280ms` (surface uses 260ms `cadRise`).

**Rail** - width 236px, `background: var(--rail)`, `border-right: 1px solid var(--hairline)`.

**Butterfly header** - `img/butterfly-ember.svg` 24px, `filter: drop-shadow(0 0 6px rgba(255,107,44,0.4))`, `cadFlutter 3.4s` (transform-origin 12px 12px), gap 11px to the wordmark. Wordmark 13.5px/700 `var(--text-primary)` letter-spacing -0.01em; workspace name 10.5px `var(--text-subtle)`.

**`nav-item` anatomy + states** (mono index + label + optional badge):
- Base: `display:flex; align-items:center; gap:11px; width:100%; padding:8px 10px; border:none; border-radius:8px; font-size:13px; background:transparent; color:var(--text-muted); transition:background 140ms var(--ease)`. `.num` = mono 9.5px `var(--text-faint)`.
- **Hover** (tonal, not spatial - nothing translates): `background: var(--raised)` (`#17171A`), `color: var(--text-primary)`.
- **Active:** `background: #1A1A1E`, `color: var(--text-primary)`, `font-weight:600`, and the `.num` turns `var(--ember)`.
- **Focus:** `:focus-visible` 2px glacier outline, offset 2.
- **Disabled** (Plan/Brain in the prototype were dimmed; in production they are live routes, so no disabled state): if a destination is ever unavailable, `opacity:0.45; cursor:default`.

**The one Today badge** - `font-family: var(--font-mono); font-size:9.5px; font-weight:700; background: var(--ember); color:#0A0A0B; border-radius:99px; min-width:17px; height:16px; padding:0 5px; box-shadow: 0 0 10px rgba(255,107,44,0.4)`. Shows the unanswered-Call count; **hidden at zero**. It is the ONLY badge in the app.

**Shimmer working line** - mono 9.5px, letter-spacing 0.1em, uppercase. A 5px glacier dot: `background: var(--glacier); border-radius:99px; animation: cadPulse 2s ease-in-out infinite`. The text `background: var(--shimmer-gradient); background-size:280% 100%; background-clip:text; color:transparent; animation: cadShimmer 5s linear infinite`. Copy: "2 agents working" (live count). Hidden when count is zero.

**Engine Room door** - hairline button: `border:1px solid var(--hairline); border-radius:8px; padding:7px 10px; font-size:12px; color:var(--text-muted)`. Left: mono "G" 9.5px `var(--text-faint)`. Center: "Engine Room" (flex 1). Right: state in mono 8.5px, letter-spacing 0.08em, `var(--text-faint)` - "ALL CLEAR" when clear, else the count. Hover: `background: var(--raised)`.

**User chip** - avatar 24px round, `background: var(--hover); border:1px solid rgba(255,107,44,0.45); color:var(--text-primary); font-size:9.5px; font-weight:700`. Name 12px `var(--text-muted)` (flex 1). Presence dot 6px `background: var(--moss); box-shadow: 0 0 7px rgba(127,191,142,0.6)`.

**Top bar** - `height:52px; padding:0 28px; gap:14px; border-bottom:1px solid var(--hairline-faint); background:var(--canvas)`. Surface title 13.5px/600 `var(--text-primary)`; optional subtitle 12px `var(--text-faint)`. Date mono 9px, letter-spacing 0.1em, `var(--text-muted)`, uppercase. Workspace pill: mono 9px, letter-spacing 0.1em, `var(--text-muted)`, border 1px `var(--hairline-strong)`, radius 99, padding 3px 10px.

**Surface container** - `max-width:1060px` (1160 for Discover/Plan), `margin:0 auto`, `padding:36px 32px 64px`, `animation: cadRise 260ms var(--ease) both`.

**States that apply to the whole shell**
- **Empty / cold:** the rail is never empty (five fixed destinations). The Today badge and shimmer line simply do not render when their counts are zero; the Engine Room door reads "ALL CLEAR". No empty illustration.
- **Loading:** the badge/shimmer/door counts come from `useQuery`; while pending, render nothing (no skeleton in the rail) so the frame never flickers a spinner.
- **Error:** if a count query fails, treat as zero (badge hidden, "ALL CLEAR", shimmer hidden). The frame must never surface a fetch error - it is chrome.
- **Reduced motion:** `cadFlutter`, `cadPulse`, `cadShimmer`, `cadRise` are all gated by OBS-01's `prefers-reduced-motion` block; verify they freeze.

---

## 8. Restructuring / renaming / modification

- **nav-model.ts:** drop the `lucide-react` import block and `LucideIcon`; drop the `icon` field; add `index: string`. Rename PRIMARY_NAV entries: remove Ask, rename Product to Discover, add Plan. Drop `icon` from `ENGINE_ROOM_DOOR` and `ENGINE_ROOM_LINKS`.
- **nav-model.test.ts:** update the labels assertion and the per-item field assertion (icon to index); add an index-format test.
- **AppShell.tsx:** remove ALL lucide imports; rewrite `NavRow`; restyle aside/header/search/footer; keep data hooks and dropdown handlers.
- **TopBar.tsx:** remove `Calendar` + `ChevronRight` lucide imports; collapse breadcrumbs to a surface title + subtitle; restyle to 52px.
- **_authenticated.tsx:** wrap `<Outlet/>` in `<AppShell>`; ensure `data-obsidian` on the root.
- **21 routes:** remove the per-page `<AppShell>` wrapper + import + the `projects` prop.
- **CommandPalette.tsx `GotoShortcuts`:** replace the `g`-chord map with the Obsidian map (1-5 + single-press g + Esc).
- **Redirects:** none in OBS-02. Route renames to `/discover`, `/plan`, `/engine-room` and their redirects are OBS-10.
- **Deletions:** no files deleted. Lucide glyphs are removed from the two shell files only (not a repo-wide lucide purge; that is per-surface, per hub §7).

---

## 9. Copy / voice (humanized)

- Wordmark: `Cadence`. Workspace/product subline: the live name, e.g. `Lumen · Growth team` (middot separator).
- Search affordance: `Search` with the `⌘K` hint in mono. (No "Jump to…" ellipsis placeholder in the Obsidian rail.)
- Nav labels: `Today` · `Discover` · `Plan` · `Build` · `Brain` (mono indices `01`-`05`).
- Shimmer working line: `1 agent working` / `2 agents working` (pluralized, live count). Optional queued suffix: `· 3 queued`.
- Engine Room door: label `Engine Room`, shortcut hint `G`, state `ALL CLEAR` (mono caps) when there are no pending Calls, otherwise the count.
- Top bar date: mono caps with a middot, e.g. `WED · JUL 2`. Workspace pill: the workspace name in mono caps, e.g. `LUMEN`.
- User chip: the display name (e.g. `Rohit`), initials in the avatar.
- Empty-state note (rail): the rail has no blank state; when nothing is pending, the badge and shimmer line are absent and the door reads `ALL CLEAR`. There is no time-estimate empty box in the shell (those belong to the surfaces, OBS-04..09).
- Humanized law: no em or en dashes anywhere (use `·` or `-`), no exclamation marks, no emoji, no AI-cliche words. Mono-caps metadata uses middots.

---

## 10. Acceptance criteria

- [ ] The rail is 236px on `--rail` with a right `--hairline` border, at 1440px indistinguishable from `ui-kit-shell.html`.
- [ ] The Butterfly mark renders at 24px with the ember drop-shadow and `cadFlutter`; the wordmark and workspace name match the type spec.
- [ ] The nav shows five items with mono indices `01`-`05`, labels Today/Discover/Plan/Build/Brain, NO lucide icons anywhere in the rail.
- [ ] Active state is `#1A1A1E` + ember index + weight 600; hover lifts to `--raised`; focus draws the 2px glacier ring.
- [ ] The Today badge renders only on Today, only when the Call count > 0, with the exact ember fill + `0 0 10px` glow; it is the only badge in the app.
- [ ] The shimmer working line renders only when agents are running, with the glacier `cadPulse` dot and the `cadShimmer` gradient text; hidden at zero.
- [ ] The Engine Room door is a single hairline button with the `G` hint and the "ALL CLEAR"/count state; its dropdown lists the five engine-room destinations as text rows (no orphans).
- [ ] The user chip shows the avatar (ember hairline), name, and the moss presence dot with its glow.
- [ ] The top bar is 52px with a bottom hairline, surface title + date (mono caps) + workspace pill; no lucide chevrons.
- [ ] The shell is hoisted once in `_authenticated.tsx`; no route double-mounts `AppShell`; the rail does not remount on navigation.
- [ ] `data-obsidian` scopes the tokens to the authenticated app; the landing page is byte-untouched.
- [ ] Keyboard: `1`-`5` switch surfaces, `g` opens the Engine Room, `Esc` closes overlays; all ignored inside inputs and when a modifier is held.
- [ ] `nav-model.test.ts` passes with the reshaped assertions; `tsc --noEmit` is clean.
- [ ] Grayscale screenshot of the rail still reads; restraint budget holds (one ember element - the Today badge - one shimmer line, one machine voice in glacier).

---

## 11. Prototype-parity checklist (the last gate · from hub §5.9, tailored)

Open `ui-kit-shell.html` and the built shell side by side at 1440px:
1. **Rail:** 236px, mono index 01-05, active bg `#1A1A1E` + ember index, the ONE Today badge, the shimmer working line, the Engine Room door, the user chip - all present and positioned identically.
2. **Surface chrome:** 52px top bar, surface container max-width 1060 (1160 Discover/Plan), padding 36/32/64, `cadRise` entrance on the surface content.
3. **Type:** wordmark 13.5px/700, nav labels 13px, mono indices 9.5px, mono labels/date 9-9.5px caps with middots.
4. **Color:** zero hexes outside the tokens; ember only on the Today badge; glows match (badge `0 0 10px rgba(255,107,44,0.4)`, moss chip dot `0 0 7px`, glacier pulse dot).
5. **Motion:** nav hover 140ms one-step tonal lift; `cadFlutter` 3.4s on the mark; `cadPulse` 2s glacier dot; `cadShimmer` 5s working line; reduced-motion kills all four.
6. **Behavior:** keyboard map (1-5 switch, g opens Engine Room, Esc closes); the Today badge count tracks unanswered Calls; the shimmer line tracks running agents.
7. **Copy:** plain labels, mono-caps metadata with middots, no em dashes, no exclamation marks.
8. **Grayscale** screenshot still reads; restraint budget audited (one ember, one shimmer, one machine voice).

---

## 12. Verification + gates

- **tsc:** `bunx tsc --noEmit` = 0 (covers the 21 unwraps + the two rewrites + the nav-model type change).
- **tests:** `bun test src/lib/nav-model.test.ts` green with the new labels/index assertions. Add cases: indices are `01`-`05` in order; Ask is absent; every item is icon-free (no `icon` key).
- **build:** `bun run build` is RED in lane worktrees on the pre-existing `lovable-tagger` node20-vs-ESM error (hub §11). In the worktree treat `tsc` + `bun test` as the real gates; run the full build on the primary checkout before publish. Do not chase the lovable-tagger error.
- **grayscale:** screenshot the rail with color removed; it must still parse (indices, labels, the door, the chip). Meaning must not live in color alone.
- **restraint budget:** one ember element (Today badge), at most one shimmering element (working line), one machine voice (glacier). Audit.
- **impeccable / humanized:** `grep -nE "[--]|[!]" ` the new UI strings and the two shell files; grep the banned-word list (seamlessly, leverage, empower, robust, unlock, delve). Zero hits.
- **manual:** `bun run dev`; verify hoist (rail does not remount across `/today`->`/build`), keyboard map, badge/shimmer/door reactivity, focus rings, and that typing in an input does not trigger surface switches. Capture side-by-side prototype screenshots for the ship report.

---

## 13. Risks · gotchas · founder-gates

- **Hoist vs re-skin (decided: hoist).** Hoisting gives one source of chrome and matches `implementation-notes.md` §Routing ("one authenticated layout route carrying the rail + top bar"). The cost is unwrapping 21 routes; `tsc` makes that safe and mechanical. Re-skinning in place was rejected: it would leave chrome duplicated across 21 files and drift over time. If any full-height page (e.g. Chat) depended on the old `<main>` flex wrapper, verify it still pins correctly after the hoist.
- **Keyboard collision.** The legacy `g`-chord (g then a letter) conflicts with the Obsidian single-press `g` = Engine Room and `1`-`5` = surfaces. OBS-02 supersedes the chord; the palette (OBS-11) absorbs its discovery role. Ensure the number keys are fully suppressed inside inputs/textareas or they will hijack typing on Today's task box.
- **Route targets for Discover/Plan.** Discover points at `/product` and Plan at `/product?tab=roadmap` as the nearest existing surfaces (verified: `/product` defines a `roadmap` tab; the bare `/roadmap` route redirects to `/product?tab=opportunities`, i.e. Discover, so Plan must NOT point there). These are placeholders until OBS-10 renames the routes to `/discover` and `/plan` and adds redirects.
- **Founder gate:** OBS-02 introduces a NEW nav destination (Plan) and drops Ask from the rail. The URLs do not change yet (OBS-10 does that), but the founder should be told the rail now reads Today · Discover · Plan · Build · Brain and that Ask moved off the rail (it returns as `⌘J`, OBS-12). No other founder gate.
- **Butterfly source.** Prefer the shipped `butterfly-ember.svg` asset for exact parity; if using the existing `<CadenceMark>` component instead, confirm it renders the same silhouette at 24px with the ember glow, or the parity check will flag a delta.
- **Auxiliary top-bar widgets** stay parchment-styled for now (scope OUT). Note the mixed state in the ship report; their reskin rides with later items.

---

## 14. Interlinks

- **Hub / shared canon:** [`README.md`](./README.md) (§5 tokens/type/motion, §5.8 iconography law, §5.9 parity checklist, §5.11 keyboard map, §6 IA target, §7 codebase map).
- **Build-order neighbors:** [`OBS-01.md`](./OBS-01.md) (tokens + fonts + keyframes, this item's dependency) · [`OBS-03.md`](./OBS-03.md) (primitives, unblocked by this item) · [`OBS-10.md`](./OBS-10.md) (finishes the route to nav fold + redirects that OBS-02 stubs) · [`OBS-12.md`](./OBS-12.md) (Ask leaves the rail and returns as the `⌘J` panel).
- **Canon anchors:** `design-reference/obsidian-v3/components.md` § "Shell" (Rail · Top bar · Surface container) · `design-reference/obsidian-v3/implementation-notes.md` § "Core behaviors" (keyboard) + § "Routing" · `design-reference/obsidian-v3/DESIGN-OBSIDIAN.md` §7 (the mark / iconography) + §8 (information architecture) · the readable shell reference `design-reference/obsidian-v3/design-reference/ui-kit-shell.html`.
- **Doctrine:** [`../../conventions/engine-room-doctrine.md`](../../conventions/engine-room-doctrine.md) · [`../../conventions/humanized-output.md`](../../conventions/humanized-output.md) · strategy tie [`../../strategy/v11-guiding-star.md`](../../strategy/v11-guiding-star.md).
