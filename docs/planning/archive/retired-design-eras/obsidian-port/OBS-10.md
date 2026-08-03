# OBS-10 · IA consolidation - every route folds into five destinations + one door

> _Created: 2026-07-02 · Last updated: 2026-07-02_

## 1. Snapshot

| Field | Value |
| --- | --- |
| ID | OBS-10 |
| Rank | #11 (dashboard) |
| Tier | 1 |
| Status | pending |
| Category | Cockpit (IA / routing) |
| Depends on | OBS-04 · OBS-05 · OBS-06 · OBS-07 · OBS-08 · OBS-09 (the five destinations + the door must render Obsidian first) |
| Blocks | OBS-11 · OBS-12 · OBS-13 · OBS-14 (the palette, Ask, Settings, and onboarding all assume the five-destination IA is final) |
| One-line what | Map every legacy `_authenticated.*` route into Today / Discover / Plan / Build / Brain / Engine Room, redirect every legacy path (no 404s), reshape `nav-model.ts` so the rail renders only the five + one door, and rule on every orphaned surface with the placement algorithm (Call · ⌘K · a room) instead of a new nav item. |
| Dashboard row | [`../feature-dashboard.md`](../../../feature-dashboard.md) group G14, row OBS-10 |
| Summary bible | [`../obsidian-port-plan.md`](../obsidian-port-plan.md) · section "OBS-10 · IA consolidation" |
| Hub | [`./README.md`](./README.md) §6 (IA target) · §7 (route inventory) |

## 2. Why we are doing it

OBS-04 through OBS-09 each ported one surface, but the app still carries roughly 60 `_authenticated.*` routes, many of them parchment leftovers from earlier IA passes (`F-IA-V4`, the Studio/Build rename, the mothball rounds). Until they collapse, a user can still land on a stray parchment page, the rail can drift back to competing metaphors, and a "just add a nav item" reflex can reappear. OBS-10 is the wiring pass that makes the five-destination promise structurally true, not just visually true.

**Which of the three Obsidian laws it serves.** Law 2 (one queue for attention) and the meta-law behind the whole system: **one home per concept**. The IA target is five outcome-named destinations plus a summonable Ask panel plus one recessed Engine Room door (contract §8). Features never add nav items, badges, or banners (contract §12.1). OBS-10 enforces that at the route layer: after it lands, there are exactly five primary entries and one door, and every other path is a redirect into one of them.

**The felt user outcome.** The user never sees a dead page, never hits a 404 on a bookmarked URL, and never has to relearn where a thing lives. Old links keep working; they just arrive at the calm new home. The rail stops being a junk drawer and becomes a fixed, memorizable index of 01 to 05.

**The v11 / engine-room tie.** v11 says name the outcome, not the mechanism; the engine-room doctrine says all machinery lives behind one door, revealed on demand. OBS-10 is where that doctrine becomes routing: `agents`, `evals`, `guardrails`, `drift`, `budgets`, `traces`, `observe` stop being top-level surfaces and become drills inside the one Engine Room door. Rare capabilities move to ⌘K. Nothing gets a permanent seat it did not earn.

## 3. What we are building

**Scope IN**

- A single **legacy-redirect map** (`src/lib/legacy-redirects.ts`, new) that names every legacy path and the canonical destination it folds into, so the mapping is one greppable, unit-testable source of truth.
- **Redirect-only route stubs** for every legacy path: convert the parchment routes that still render (`/product`, `/knowledge`, `/prds`, `/prds/$id`, `/traces`, `/traces/$traceId`, `/missions`, `/missions/$missionId`, `/stakeholder`, `/impact`, `/changelog`, `/fleet`, `/delegate`) into `beforeLoad` redirects, and **re-point** the routes that already redirect (`/discovery`, `/opportunities`, `/roadmap`, `/memory`, `/docs`, `/learn`, `/outcome`, `/agents`, `/evals`, `/guardrails`, `/drift`, `/budgets`, `/analytics`, `/observe`, `/swarm`, `/prompts`, `/cockpit`, `/inbox`, `/tasks`, `/calendar`, `/meetings`, `/meetings/$id`, `/prds.index`, `/governance`, `/studio*`) so they land on the **new canonical destination paths**, not the old ones (no redirect chains).
- The **`nav-model.ts` reshape**: PRIMARY_NAV `to` targets point at the five canonical destinations; Ask is removed from the rail; the Engine Room door and its revealed links point at live rooms.
- The **placement-algorithm ruling** for every orphaned surface (contract §12.1): each becomes a redirect into the nearest destination or door, with a note on its true home (a Call, ⌘K, or a room). No orphan earns a new nav item.
- **Regenerate** `src/routes/routeTree.gen.ts` via the router plugin (never hand-edit) and update `nav-model.test.ts` + a new `legacy-redirects.test.ts`.

**Scope OUT (no feature work rides along)**

- No server function is added, changed, or deleted. OBS-10 consumes nothing at the data layer; it only moves URLs. The parchment surfaces being converted to stubs read `listStudioSessions`, `fetchNeedsYou`, `getStudioSession`, the discovery/roadmap/spec queries, etc. Those server fns are **not touched** - the render that called them moved to the OBS-06/07/08 destinations, which already call the same fns.
- OBS-10 **creates zero new destination surfaces.** Today (`/today`, OBS-04), Discover (`/discover`, OBS-06), Plan (`/plan`, OBS-07), Build (`/build`, OBS-05), Brain (`/brain`, OBS-08), and Engine Room (`/govern`, OBS-09) already render. OBS-10 assumes they exist and only wires legacy paths to them.
- The ⌘K palette body and the Ask panel are **not built here** (OBS-11 / OBS-12). OBS-10 only ensures nothing 404s; the palette's internal navigate targets are re-pointed opportunistically, but its glass rebuild is OBS-11.
- Settings, Admin, and Onboarding routes **stay live and untouched** (OBS-13 / OBS-14 own them).
- No parchment-to-Obsidian visual work: OBS-10 deletes parchment renders that have already been re-homed; it does not re-skin anything.

## 4. Current state (real files read 2026-07-02)

- **`src/routes/_authenticated.tsx`** - the gated shell. Mounts `WorkspaceProvider`, `FlowModeProvider`, `BackendHealthBanner`, `BillingBanner`, `<CommandPalette />`, `<GotoShortcuts />`, `<Outlet />`. `beforeLoad` does the auth + onboarding gate. It does **not** render the rail (the shell is per-page today; OBS-02 hoists it). OBS-10 does not change this file.
- **`src/lib/nav-model.ts`** - pure, unit-tested. Today `PRIMARY_NAV` = `Today (/today) · Ask (/chat) · Product (/product) · Build (/build) · Brain (/knowledge)`, each with a lucide icon. `ENGINE_ROOM_DOOR` = `/govern`. `ENGINE_ROOM_LINKS` = Approvals `/govern?tab=approvals` · Spend `/govern?tab=budgets` · Engine Room `/govern` · Trust Ledger `/trust-ledger` · Connectors `/sync`. `ENGINE_ROOM_PATHS` = `["/govern","/trust-ledger","/sync"]`. Pure helpers `navItemActive` + `engineRoomActive`. **This is the file OBS-10 reshapes** (targets + Ask removal), coordinated with OBS-02 which owns the render and label/icon changes.
- **The route inventory** (60 `_authenticated.*` files). Already redirect-only stubs (from prior passes): `agents→/govern`, `analytics→/govern`, `briefing→/settings`, `budgets→/govern`, `cockpit→/missions`, `discovery→/product`, `docs→/knowledge`, `drift→/govern`, `evals→/govern`, `governance→/govern`, `guardrails→/govern`, `inbox→/govern`, `integrations→/settings`, `learn→/knowledge`, `meetings→/calendar`, `meetings.$id→/calendar`, `memory→/knowledge`, `notifications→/settings`, `observe→/govern`, `opportunities→/product`, `outcome→/learn`, `prds.index→/product`, `prompts→/govern`, `roadmap→/product`, `studio.index→/build`, `studio.$missionId→/build`, `swarm→/govern`, `tasks→/`. **Note the chains** (`meetings→/calendar→/knowledge`, `outcome→/learn→/knowledge`) - OBS-10 flattens these to one hop.
- **Still-rendering parchment routes that must become stubs:** `product`, `knowledge`, `prds` (+ `prds.$id`), `traces` (+ `traces.$traceId`), `missions.index` (+ `missions.$missionId`), `stakeholder`, `impact`, `changelog`, `fleet`, `delegate`. (Each has a `component:` today.)
- **Stays live, no fold:** `today`, `build.index`, `build.$missionId` (Build depth-3 full view), `govern`, `settings`, `onboarding`, `trust-ledger` and `sync` (Engine Room door links), all `admin.*` (role-gated Admin door). The OBS-06/07/08 destination routes (`discover`, `plan`, `brain` per §6 below) are created by their own items, not here.
- **`src/components/supaprod/CommandPalette.tsx`** - the current ⌘K. Indexes Navigate entries with hardcoded targets (`/`, `/chat`, `/govern?tab=team`, `/knowledge?tab=calendar`, `/product`, `/build`, `/knowledge`, `/missions`, `/govern`, `/settings`) + a `GotoShortcuts` g-prefix map (`d→/`, `c→/chat`, `a→/missions`, `b→/build`, `p→/product`, `k/m/l→/knowledge`, `v→/govern`, `s→/settings`). These still work through redirects; OBS-10 re-points them to canonical paths to avoid double hops. The glass rebuild is OBS-11.

## 5. How - step by step

> Do these top to bottom. This is a wiring-only change: TanStack redirects + one pure map module + the nav-model reshape. In a lane worktree the real gates are `tsc --noEmit` + `bun test` (hub §11 build-gate caveat).

1. **Confirm the canonical destination paths first.** Read the Structure section of OBS-04/05/06/07/08/09 and record the exact path each destination surface renders at. This spec's default ruling is `/today · /discover · /plan · /build · /brain · /govern` (see §6). If OBS-08 reskinned `/knowledge` in place rather than creating `/brain`, then Brain canonical = `/knowledge` and you invert that one row. **Do not proceed until the six canonical paths are confirmed against the real destination routes.**

2. **Create `src/lib/legacy-redirects.ts`** (new, pure). Export `type RedirectTarget = { to: string; search?: Record<string, string> }` and `export const LEGACY_REDIRECTS: Record<string, RedirectTarget>` - one entry per legacy path, using the §6 mapping table verbatim. Also export the canonical set `export const CANONICAL_PATHS = ["/today","/discover","/plan","/build","/brain","/govern"] as const` and the door-internal live paths `["/trust-ledger","/sync","/settings","/onboarding"]` plus `/admin`. This module is the single source the stubs and the test both read.

3. **Reshape `src/lib/nav-model.ts`.** Set `PRIMARY_NAV` to the five outcome destinations with the canonical `to` targets: `Today /today` · `Discover /discover` · `Plan /plan` · `Build /build` · `Brain /brain`. **Remove the Ask entry** (it becomes ⌘J, OBS-12). Keep `ENGINE_ROOM_DOOR` at `/govern`. In `ENGINE_ROOM_LINKS`, drop the standalone `Approvals` link (approvals are Calls on Today, never in the door - contract §8) and keep Spend / Engine Room / Trust Ledger / Connectors pointing at live rooms; leave `ENGINE_ROOM_PATHS` covering `/govern`, `/trust-ledger`, `/sync`. Do not touch `navItemActive` / `engineRoomActive` logic. If OBS-02 already re-labelled/re-icon'd this file, only re-point `to` and remove Ask; do not fight OBS-02's icon-removal.

4. **Convert the still-rendering parchment routes to redirect stubs.** For each of `product`, `knowledge`, `prds.index`, `prds.$id`, `traces`, `traces.$traceId`, `missions.index`, `missions.$missionId`, `stakeholder`, `impact`, `changelog`, `fleet`, `delegate`: replace the whole file body with the stub pattern (imports `createFileRoute`, `redirect`, and `LEGACY_REDIRECTS`), reading the target from the map. Preserve `validateSearch` where a param must survive the hop (e.g. `prds.$id` → `/plan` with `?spec=$id`; `traces.$traceId` → `/govern` with `?trace=$traceId`; `missions.$missionId` → `/build/$missionId`). Delete the parchment render, the lucide imports, and the dead queries. Follow the exact shape of `_authenticated.governance.tsx` (already a clean `validateSearch` + `throw redirect` stub).

5. **Re-point the existing redirect stubs** so they land on the new canonical paths in one hop (§6): `discovery`, `opportunities`, `roadmap` off `/product`; `memory`, `docs`, `learn`, `outcome`, `calendar`, `meetings`, `meetings.$id` off `/knowledge`/`/calendar`; `cockpit`, cockpit→`/missions` becomes `→/build`; `inbox`→`/today`; `tasks`→`/today`. Update each file's inline comment to name the new home. Flatten every chain to a single hop.

6. **Re-point the ⌘K + GotoShortcuts targets** in `src/components/supaprod/CommandPalette.tsx` to canonical paths (`/product`→`/discover`, `/knowledge`→`/brain`, `/missions`→`/build`, `/`→`/today`, `/chat`→`/today`). This is a courtesy pass so no palette click double-redirects; the full glass rebuild is OBS-11. If OBS-11 is already in flight on another lane, coordinate and skip this step (note it in the ship report).

7. **Regenerate the route tree.** Run the dev server (or `bun run build` on the primary checkout) so the TanStack router plugin regenerates `src/routes/routeTree.gen.ts`. Never hand-edit it. Confirm the generated tree has no orphaned or duplicate route ids.

8. **Update `src/lib/nav-model.test.ts`**: assert `PRIMARY_NAV.length === 5`, the five `to` values equal the canonical set, no entry is `/chat`, and the door + links resolve to live paths. **Create `src/lib/legacy-redirects.test.ts`**: for every key in `LEGACY_REDIRECTS`, assert its `to` is a canonical or door-internal path (never another legacy key) - this proves no 404s and no redirect chains in one pure test.

9. **Manual crawl.** With the dev server up, hit every legacy URL from §6 (paste each into the address bar) and confirm it lands on the correct destination with the right tab/param, no flash of parchment, no 404. Confirm the rail shows exactly five entries + the door, and Ask is gone from the rail.

## 6. Structure

**The full mapping table (every `_authenticated.*` route → destination + redirect).** Canonical destinations are bold; every other row is a redirect. `[stub]` = already a redirect, re-point only; `[render→stub]` = convert parchment render to a redirect; `[stays]` = live, not folded.

| Legacy path | Destination | Redirect `to` (+ search) | Placement rule / note |
| --- | --- | --- | --- |
| `/today` | **Today** | - canonical | OBS-04 |
| `/build`, `/build/$missionId` | **Build** | - canonical (detail stays as depth-3) | OBS-05 |
| `/discover` | **Discover** | - canonical | OBS-06 |
| `/plan` | **Plan** | - canonical (assumed; confirm OBS-07) | OBS-07 |
| `/brain` | **Brain** | - canonical (assumed; confirm OBS-08) | OBS-08 |
| `/govern` | **Engine Room** (door) | - canonical | OBS-09 |
| `/product` | Discover | `/discover` (keep `?tab`,`?signal`,`?opp`) | `[render→stub]` |
| `/discovery` | Discover | `/discover?tab=signals` | `[stub]` re-point off `/product` |
| `/opportunities` | Discover | `/discover?tab=opportunities` | `[stub]` re-point |
| `/prds` (layout), `/prds.index` | Plan | `/plan` | `[render→stub]` / `[stub]` |
| `/prds/$id` | Plan | `/plan?spec=$id` | `[render→stub]`, preserve id |
| `/roadmap` | Plan | `/plan?view=roadmap` | `[stub]` re-point |
| `/stakeholder` | Plan | `/plan?view=roadmap` | `[render→stub]`, stakeholder view of the outcome roadmap |
| `/knowledge` | Brain | `/brain` (keep `?tab`) | `[render→stub]` (invert if OBS-08 kept `/knowledge`) |
| `/memory` | Brain | `/brain?tab=memory` | `[stub]` re-point |
| `/docs` | Brain | `/brain?tab=docs` | `[stub]` re-point |
| `/learn` | Brain | `/brain?tab=learnings` | `[stub]` re-point |
| `/outcome` | Brain | `/brain?tab=learnings` | `[stub]` flatten chain |
| `/impact` | Brain | `/brain?tab=learnings` | `[render→stub]`, outcomes / what-they-moved |
| `/changelog` | Brain | `/brain?tab=record` | `[render→stub]`, shipped record |
| `/calendar` | Brain | `/brain?tab=calendar` | `[stub]` re-point (Brain hosts calendar) |
| `/meetings`, `/meetings/$id` | Brain | `/brain?tab=calendar` | `[stub]` flatten chain |
| `/missions`, `/cockpit`, `/delegate`, `/fleet`, `/swarm` | Build | `/build` | live agents / runs are the Build cockpit; `swarm`/`fleet` rare → ⌘K |
| `/missions/$missionId` | Build | `/build/$missionId` | `[render→stub]`, preserve id |
| `/chat` | Ask panel | `/today` (Ask via ⌘J) | Ask is a panel, not a destination (OBS-12 may add `?ask=`) |
| `/inbox`, `/tasks` | Today | `/today` | approvals + task capture live on Today (Call queue) |
| `/agents` | Engine Room | `/govern` | agent roster = machine oversight; rare → ⌘K |
| `/evals`, `/eval-health`, `/drift` | Engine Room | `/govern` (Quality room) | `[stub]`/`[render→stub]` |
| `/guardrails` | Engine Room | `/govern` (Safety room) | `[stub]` |
| `/budgets`, `/analytics` | Engine Room | `/govern` (Spend room) | `[stub]` |
| `/traces`, `/traces/$traceId` | Engine Room | `/govern` (Record; `?trace=$traceId`) | `[render→stub]` |
| `/observe`, `/prompts` | Engine Room | `/govern` | `[stub]`, machine internals; rare → ⌘K |
| `/governance` | Engine Room | `/govern` (keep `?tab`) | `[stub]` already correct |
| `/studio`, `/studio/$missionId` | Build | `/build`, `/build/$missionId` | `[stub]` already correct |
| `/notifications`, `/briefing` | Settings | `/settings` | `[stub]`, notification + briefing prefs |
| `/integrations` | Settings | `/settings` | `[stub]`, Connections is the one integrations home |
| `/sync` | Settings (Connections) | `[stays]` for now; OBS-13 folds to `/settings` | door link + workspace bindings; flag |
| `/trust-ledger` | Engine Room (Record) | `[stays]` (door link) | OBS-09 may fold into the Record room |
| `/settings`, `/onboarding`, `/admin/*` | - | `[stays]` | OBS-13 / OBS-14 own these |

**New files**

- `src/lib/legacy-redirects.ts` - the pure `LEGACY_REDIRECTS` map + `CANONICAL_PATHS`.
- `src/lib/legacy-redirects.test.ts` - asserts every target is canonical/door-internal, never another legacy key (no chains, no 404s).

**Files modified**

- `src/lib/nav-model.ts` (five `to` targets, drop Ask, prune the door links).
- `src/lib/nav-model.test.ts` (assert 5 + door, no `/chat`).
- The `[render→stub]` and `[stub]` route files above (redirect bodies).
- `src/components/supaprod/CommandPalette.tsx` (re-point navigate targets - optional / coordinate with OBS-11).
- `src/routes/routeTree.gen.ts` (regenerated, not hand-edited).

**Data flow.** OBS-10 consumes no server functions and no query keys. The redirect stubs are pure `beforeLoad` throws; the destination surfaces (OBS-04..09) already own every `useQuery`. `nav-model.ts` stays pure (data + active-state math, no JSX). The shell renders the model; OBS-02 owns that render.

**Component tree (routing view, not JSX):**

```
_authenticated (shell: rail = PRIMARY_NAV[5] + ENGINE_ROOM_DOOR, Ask removed)
├── /today            Today        (OBS-04)
├── /discover         Discover     (OBS-06)   ← product, discovery, opportunities
├── /plan             Plan         (OBS-07)   ← prds(+$id), roadmap, stakeholder
├── /build (+$id)     Build        (OBS-05)   ← missions(+$id), cockpit, delegate, fleet, swarm, studio(+$id)
├── /brain            Brain        (OBS-08)   ← knowledge, memory, docs, learn, outcome, impact, changelog, calendar, meetings(+$id)
├── /govern (door)    Engine Room  (OBS-09)   ← agents, evals, eval-health, drift, guardrails, budgets, analytics, traces(+$id), observe, prompts, governance
├── /today            (also ← chat, inbox, tasks)
├── /settings         (← notifications, briefing, integrations)   [stays]
├── /onboarding · /admin/* · /sync · /trust-ledger                 [stays]
└── routeTree.gen.ts  (regenerated)
```

## 7. Design elements

OBS-10 renders no new surface, so it carries no new visual anatomy. The only visible artifact is the **rail** (rendered by OBS-02, fed by the reshaped `nav-model.ts`) and the **redirect experience** (invisible when correct). The relevant tokens and states, embedded so the implementer does not open another file:

- **Rail spec (must match the prototype, OBS-02 render):** 236px wide, background `--rail #0D0D0F`. Five entries indexed by the mono numeral index 01 to 05 (`--font-mono` "JetBrains Mono", 9.5px caps, tracking 0.10 to 0.12em) - no lucide, no icon set (iconography law, contract §7 / hub §5.8). Active entry background `#1A1A1E` with the mono index in ember `--ember #FF6B2C`. Exactly one Today badge (the Call count, glow `0 0 10px`), hidden at zero. The recessed Engine Room door sits below the five, visually quieter. User chip at the foot.
- **Redirect must be seamless:** a `beforeLoad` `throw redirect` resolves before any component mounts, so there is **no flash of parchment** and no `cadRise` entrance on the stub. The destination plays its own `cadRise` (260ms, `--ease cubic-bezier(0.23,1,0.32,1)`) once. Verify no double-entrance and no intermediate white/parchment frame.
- **Interaction states for the rail entries** (unchanged from OBS-02, restated as the acceptance surface): hover lifts the background one surface step to `--hover #1D1D21` and brightens the hairline (tonal, not spatial - nothing translates); press has no separate state (navigation); focus is the 2px glacier outline offset 2 (`--focus-ring` = `--glacier #7FD1DC`, `:focus-visible`); the active entry holds `#1A1A1E` + ember index.
- **No empty / loading / error state** belongs to OBS-10 itself - a redirect has no UI. Each destination owns its own empty/loading/error copy. The one error path OBS-10 must not create: a redirect that targets a non-existent route (that yields the router's 404). The `legacy-redirects.test.ts` gate prevents it.

## 8. Restructuring / renaming / modification (explicit list)

- **Rename (nav targets, `nav-model.ts`):** `Product /product` → `Discover /discover`; `Brain /knowledge` → `Brain /brain`; add `Plan /plan`; `Today` and `Build` targets unchanged.
- **Deletion (from the rail):** the `Ask (/chat)` PRIMARY_NAV entry is removed (moves to ⌘J, OBS-12). The `Approvals` entry inside `ENGINE_ROOM_LINKS` is removed (approvals are Calls on Today, never in the door).
- **Deletion (parchment renders):** the `component` bodies + lucide imports + dead queries in `product`, `knowledge`, `prds(+$id)`, `traces(+$traceId)`, `missions(+$missionId)`, `stakeholder`, `impact`, `changelog`, `fleet`, `delegate` are deleted and replaced by redirect stubs.
- **Redirects added / re-pointed:** every row in the §6 table marked `[stub]` or `[render→stub]` (roughly 40 legacy paths). Existing chains (`meetings→/calendar→/knowledge`, `outcome→/learn→/knowledge`, `cockpit→/missions`) are flattened to a single hop.
- **lucide-react removal:** every route converted to a stub loses its lucide imports (redirect stubs import nothing pictorial). This advances the "lucide gone from app chrome" done-condition for those files. The destination surfaces removed their own lucide in OBS-04..09.
- **Route fold / regeneration:** `routeTree.gen.ts` is regenerated by the plugin.
- **New files:** `legacy-redirects.ts` + `legacy-redirects.test.ts`.
- **No nav-model logic change:** `navItemActive` / `engineRoomActive` stay byte-identical.

## 9. Copy / voice

OBS-10 authors almost no user-visible copy (redirects are silent). The strings it does touch:

- **Rail labels** (`nav-model.ts`, plain single words): `Today` · `Discover` · `Plan` · `Build` · `Brain` · door `Engine Room`. No mechanism words, no icons implied.
- **Route stub comments** (developer-facing, not UI, but keep the house register): each stub carries one line naming the new home and the reason, matching the existing pattern, for example: `// /product folded into Discover per OBS-10 (IA consolidation). Signals + opportunities live at /discover.` No em or en dashes, use the middot `·` or a plain hyphen.
- **404 / not-found copy** (the router's catch-all, if the app defines one) is **not** OBS-10's to author, but confirm it exists in the house voice as a safety net. If it reads like a stock framework 404, note it for a later item; do not build it here. Suggested register if one is trivially in reach: heading `Nothing lives here` · body `That page moved into one of the five. Try Today, or press ⌘K to jump.` (no exclamation, plain words, an instruction).

There is no empty state to author (no OBS-10 surface renders a list). The destinations own their empty states with time estimates.

## 10. Acceptance criteria

- [ ] `PRIMARY_NAV` has exactly five entries with `to` = `/today`, `/discover`, `/plan`, `/build`, `/brain`; no `/chat` entry remains.
- [ ] The rail renders exactly five destinations + one Engine Room door; no sixth item, no badge except the one Today Call count.
- [ ] Every legacy path in the §6 table resolves in **one** redirect hop to a canonical destination or a door-internal live path; **no path 404s**; no redirect chain (A→B→C).
- [ ] Search params survive the hop where specified (`prds/$id`→`?spec`, `traces/$traceId`→`?trace`, `missions/$missionId`→`/build/$missionId`, `product`→`?tab/?signal/?opp`).
- [ ] Approvals do not appear anywhere in the Engine Room door links; Ask does not appear in the rail.
- [ ] `routeTree.gen.ts` is regenerated (not hand-edited); the build/dev server produces no duplicate/orphan route id.
- [ ] No orphaned surface gained a new nav item, badge, or banner (contract §12.1); each orphan has a placement ruling recorded in §6.
- [ ] `nav-model.test.ts` + `legacy-redirects.test.ts` pass and encode the invariants above.
- [ ] Settings, Admin, Onboarding, `/sync`, `/trust-ledger` still render (not folded).
- [ ] The URL renames are flagged to the founder in the ship report (see §13).

## 11. Prototype-parity checklist (tailored, run last)

Open `design-reference/obsidian-v3/design-reference/cadence-app.html` beside the running app at 1440px and verify (hub §5.9):

1. **Rail:** 236px, mono index 01 to 05, active bg `#1A1A1E` + ember index, the ONE Today badge, the Engine Room door recessed below, user chip. Exactly five + door - no Ask, no extra rows.
2. **Surface chrome:** landing on each of the five via a legacy URL shows the destination's own 52px top bar and container width, with a single `cadRise` entrance and no parchment flash.
3. **Type:** the destination heros/labels are unchanged by OBS-10 (it only routes); confirm the rail labels are the plain outcome words in the UI font.
4. **Color:** zero hexes introduced; the only color OBS-10 touches is the ember active index (via nav-model targets rendering correctly).
5. **Motion:** the redirect adds no animation; the destination's `cadRise` plays once; reduced-motion still honored by the destination.
6. **Behavior:** keyboard 1 to 5 reach the five canonical paths; `g` reaches the door; a legacy bookmark resolves silently.
7. **Copy:** rail labels are plain single words; stub comments use middots, no em/en dashes, no exclamation marks.
8. **Grayscale + restraint:** with color removed the rail still reads (index numerals + words); the restraint budget is unaffected (OBS-10 adds no color).

## 12. Verification + gates

- **tsc:** `bun run tsc --noEmit` = 0.
- **Tests:** `bun test src/lib/nav-model.test.ts src/lib/legacy-redirects.test.ts` green. The redirect test iterates `LEGACY_REDIRECTS` and asserts each `to` is in `CANONICAL_PATHS` or the door-internal allow-list, never a legacy key (proves no 404, no chain). The nav test asserts the 5 + door shape and the absence of `/chat`.
- **Build:** `bun run build` on the **primary checkout** before publish (regenerates `routeTree.gen.ts`). In a lane worktree, `bun run build` is RED on the pre-existing node20/ESM `lovable-tagger` error (hub §11) - treat tsc + bun test as the real gates there and do not chase it.
- **Grayscale + restraint budget:** unaffected (no new color); state so in the ship report.
- **impeccable / humanized-output scan:** grep the changed files for `-`, `-`, `!`, and the banned-word list; the only new strings are rail labels and stub comments.
- **Manual crawl:** paste every legacy URL from §6 into the address bar; confirm one-hop resolution, correct tab/param, no parchment flash, no 404. Confirm the rail is five + door and Ask is gone.
- **Side-by-side screenshots** of the rail (prototype vs built) in the ship report, plus a short redirect-crawl log (each legacy URL → landed URL).

## 13. Risks · gotchas · founder-gates

- **FOUNDER-GATE (URL renames).** OBS-10 changes user-facing URLs: `/product`→`/discover`, `/knowledge`→`/brain`, `/prds`→`/plan`, `/roadmap`→`/plan`, `/chat` loses its page (Ask is ⌘J), and the whole engine cluster folds under `/govern`. **Redirects make every old link safe (no 404s), but the canonical URL a user sees changes.** This must be called out explicitly in the ship report so the founder can veto any specific rename. Nothing else here is founder-gated.
- **Canonical-path assumption for Plan and Brain.** OBS-07 and OBS-08 specs are not yet written; this spec assumes `/plan` and `/brain`. If OBS-08 reskinned `/knowledge` in place, invert that row (Brain canonical = `/knowledge`, `/brain` unused, and `/knowledge` is NOT a stub). **Confirm against the real destination routes before writing redirects (step 1).**
- **Redirect chains.** The current tree already chains (`meetings→/calendar→/knowledge`). If you only re-point the first hop you leave a 2-hop redirect. The `legacy-redirects.test.ts` invariant (target must be canonical, never another legacy key) is the guard - keep it green.
- **`routeTree.gen.ts` merge risk.** It is generated; if another lane touches routes concurrently you will get spurious conflicts. Regenerate rather than hand-merge, and coordinate lane timing with OBS-11/12/13 (they add routes/panels).
- **`/sync` and `/trust-ledger` are door-internal, not folded.** Do not redirect them into a destination; they are reached from the Engine Room door (and `/sync` from Settings once OBS-13 lands). Folding them prematurely would orphan the Connections + Record detail.
- **CommandPalette coupling.** If OBS-11 is mid-flight, do not both edit `CommandPalette.tsx`. Skip step 6 and let OBS-11's rebuild pick up the canonical targets; note the skip.
- **Deep-linked params.** Users bookmark `/prds/$id`, `/traces/$traceId`, `/missions/$missionId`, `/build/$missionId`. Preserve the id on the hop or the redirect silently drops context.

## 14. Interlinks

- **Hub / foundation:** [`./README.md`](./README.md) - §2 constraints, §6 the IA target table, §7 the route inventory, §5.9 the parity checklist, §10 shared gates, §11 the build-gate caveat.
- **Summary bible:** [`../obsidian-port-plan.md`](../obsidian-port-plan.md) - "OBS-10 · IA consolidation."
- **Board:** [`../feature-dashboard.md`](../../../feature-dashboard.md) group G14, row OBS-10.
- **Canon:** [`design/archive/obsidian-v3.md`](../../../../design/archive/obsidian-v3.md) §8 (information architecture - five destinations + door) and §12.1 (the placement algorithm: which object · which intent · which layer · needs attention → Call · rare → ⌘K; new features never get nav items). Doctrine: [`../../conventions/engine-room-doctrine.md`](../../../../conventions/engine-room-doctrine.md) (calm front, one door). Strategy tie: [`../../strategy/v11-guiding-star.md`](../../../../strategy/v11-guiding-star.md).
- **Sibling OBS items (build-order neighbors):**
  - [`./OBS-02.md`](./OBS-02.md) - the shell renders the rail; OBS-10 feeds it the reshaped `nav-model.ts`. Coordinate the icon-removal / label ownership.
  - [`./OBS-04.md`](./OBS-04.md) · [`./OBS-05.md`](./OBS-05.md) · [`./OBS-06.md`](./OBS-06.md) · `./OBS-07.md` · `./OBS-08.md` · `./OBS-09.md` - the six destinations that must render before OBS-10 folds legacy paths into them. Read each item's Structure section (step 1) to confirm the canonical paths.
  - [`./OBS-11.md`](./OBS-11.md) - the ⌘K glass palette + catalog; it catches the rare surfaces (agents roster, swarm, fleet, prompts, observe) that OBS-10 redirects into the door but that truly belong in ⌘K. Coordinate `CommandPalette.tsx` edits.
- **Code touched:** `src/lib/nav-model.ts`, `src/lib/nav-model.test.ts`, `src/lib/legacy-redirects.ts` (new), `src/lib/legacy-redirects.test.ts` (new), the `_authenticated.*` stub routes in §6, `src/components/supaprod/CommandPalette.tsx`, `src/routes/routeTree.gen.ts` (regenerated).
