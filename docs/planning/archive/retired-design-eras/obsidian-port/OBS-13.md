# OBS-13 · Settings four panes + role-gated Admin door

> _Created: 2026-07-02 · Self-contained build+implementation spec. Embeds the exact token values, component anatomies, copy, and file paths it needs. It links back to the hub only for the shared canon and to sibling items for build-order._

This is the complete build package for OBS-13. It ports the Settings surface to Obsidian as **four panes** (You · Workspace · Connections · Plan), makes **Connections the only integrations home** (two shelves), and demotes Admin to a **role-gated door on the Workspace pane** using the room pattern. Where it quotes a hex, a duration, a radius, or an easing, that value is copied verbatim from the hub (`README.md` §5) and from `design-reference/obsidian-v3/tokens/*.css`. Do not reinterpret a value.

---

## 1. Snapshot

| Field         | Value                                                                                                                                                                                                                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID            | OBS-13                                                                                                                                                                                                                                                                                             |
| Rank          | #14                                                                                                                                                                                                                                                                                                |
| Tier          | 2                                                                                                                                                                                                                                                                                                  |
| Status        | ⬜ pending                                                                                                                                                                                                                                                                                         |
| Category      | Governance                                                                                                                                                                                                                                                                                         |
| Depends on    | OBS-10 (IA/route fold must land first so `/settings`, `/admin`, `/sync`, `/integrations` destinations are settled) · OBS-03 (primitives) · OBS-02 (shell) · OBS-01 (tokens + density attr)                                                                                                         |
| Blocks        | nothing downstream                                                                                                                                                                                                                                                                                 |
| One-line what | Settings as four panes (You · Workspace · Connections · Plan); Connections is the only integrations home with two shelves (Yours · This workspace's) rendering the §8 connection card verbatim; Admin becomes a role-gated door on Workspace using the Engine Room room pattern, never a nav item. |
| Dashboard row | [`../feature-dashboard.md`](../../../feature-dashboard.md) group G14, row OBS-13                                                                                                                                                                                                                         |
| Summary bible | [`../obsidian-port-plan.md`](../obsidian-port-plan.md)                                                                                                                                                                                                                                             |

---

## 2. Why we are doing it

Settings is where trust is either earned or leaked. Today it is a parchment surface with an 11-section flat model presented as 5 groups plus a recessed Advanced group (`src/lib/settings-sections.ts`), lucide icons in the header, and three historical places to "connect" (Accounts, Integrations, `/sync`). That is exactly the babysitting-tax clutter Obsidian exists to remove.

**Which of the three laws (hub §1):** primarily **Law 3 · Depth on demand**. Settings is a quiet list; each pane is one card stack; Admin is a door, not a permanent surface. It also serves **Law 2 · One queue for attention** by ruling that a failing connection raises a **Call** on Today and **never badges Settings** · Settings stays calm even when a connection breaks. Ember appears nowhere in Settings unless a single action is genuinely required now (Plan · "Add headroom").

**The felt outcome:** a smart non-technical admin opens Settings, sees four plain-words panes, and never has to ask "where do I connect a tool" (one home) or "why is there a red badge here" (there never is · the break shows up as a decision on Today). Admin power is present for those who have the role and invisible to everyone else. This is the engine-room doctrine applied to governance · the machinery (roles, audit, billing internals, MCP tokens) lives behind one door, revealed on demand, named for the user's question. It is the v11 guiding star at the configuration layer · trust at the point of decision, no nagging chrome.

**No feature work rides along.** This is presentation + IA wiring only. It re-homes existing sections into four panes and re-skins the Admin console; it consumes existing server functions read-only and changes none of them.

---

## 3. What we are building

**Scope IN**

- Rewrite the pure grouping model `src/lib/settings-sections.ts` from 5 groups + Advanced to **four panes** (You · Workspace · Connections · Plan), preserving every `SectionId` and the `?section=` deep-link contract (legacy ids still land). Update `settings-sections.test.ts`.
- Re-skin `src/routes/_authenticated.settings.tsx` to Obsidian · quiet left index (mono 01..04 + label, the nav anatomy), one card stack per pane, max-width 720px, no lucide.
- **Connections pane = the only integrations home**, two shelves: **Yours** (account connections, `AccountConnectionsSection`) and **This workspace's** (workspace-level bindings/MCP). Each connection renders the §8 card anatomy verbatim (provider · scope · owner · glowing status word · last sync in mono · permissions · ONE action).
- **Density toggle in You** · writes `data-density="comfortable"|"compact"` on the `[data-obsidian]` root and persists it (localStorage), consuming the tokens OBS-01 shipped.
- **Admin as a role-gated door on Workspace** · a quiet mono link "Admin console →" visible only when `amIAdmin` is true, opening the `/admin` console re-skinned to the room pattern (rooms named for questions, verdict-first, mono sub-tabs, Engine-Room Test on every label, lucide removed from the admin layout chrome).
- Empty states as instructions with a time estimate (extensions §9).

**Scope OUT (explicit boundary)**

- **No server-function changes.** Consumed read-only: `getProfile`/`updateProfile`, `listConnections`, `listWorkspaceBindings`, `verifyConnection`/`disconnectConnection`/`deleteConnection`, `startGithubAppConnect`/`startGatewayConnect`, `getBillingState`, `getMySubscription`, `getMyCreditsView`, `amIAdmin`/`bootstrapSelfAdmin`, `listApiKeys`/`saveApiKey`, `getActiveBrief`/`upsertBrief`, `listAgents`. None of these `*.functions.ts` files are edited.
- **No route folding.** `/sync`, `/integrations`, `/admin/*` route redirects and the `routeTree.gen.ts` regeneration are **OBS-10** territory · OBS-13 assumes OBS-10 landed. If OBS-10 has not folded `/sync` into the Connections shelf yet, OBS-13 renders both shelves inside Settings and leaves `/sync` reachable; note the delta.
- **No billing/credits logic changes** · the Plan pane re-skins the existing `BillingTab`/`CreditsTab` bodies, it does not touch Stripe wiring.
- **No new admin capabilities.** The 7 admin sub-pages keep their data and logic; only their chrome and labels change.

---

## 4. Current state (real files read 2026-07-02)

- **`src/routes/_authenticated.settings.tsx`** (2189 lines) · parchment. Renders `AppShell` + `TopBar` + `SurfaceHeader kicker="Workspace" icon={SlidersHorizontal}` (lucide), then a two-tier nav driven by `settings-sections.ts` · tier-1 `TabRow` over `PRIMARY_GROUPS` + a recessed pill for `RECESSED_GROUPS` (Advanced), tier-2 `SubTabs` over the active group's members. Sections switch on `active` (line ~223): `connections` → `ConnectionsTab`, `ai` → `ModelsTab`, `staff` → `StaffTab`, `workspace` → `WorkspaceTab`, `billing` → `BillingTab`, `credits` → `CreditsTab`, `interop` → `IntegrationsTab`, `profile` → `ProfileTab`, `notifications` → `NotificationsTab`, `health` → `HealthCard`, `data` → `DataExportCard` + `SubprocessorsCard`. Deep-link contract: `?section=` + legacy `brief→workspace`, `calendar→connections` (`normalizeSection`), plus `?connector=` drill for a per-provider detail. Imports `Compass, SlidersHorizontal, Trash2` from lucide.
- **`src/lib/settings-sections.ts`** (165 lines, pure, unit-tested) · the SETTINGS-SEGREGATE model. `SectionId` union (11 ids), `GroupId` union (`account · workspace · connections · ai · billing · advanced`), `SETTINGS_GROUPS`, `ALL_SECTION_IDS`, `DEFAULT_SECTION="connections"`, `LEGACY_SECTION_MAP`, `normalizeSection`, `groupForSection`, `findGroup`, `primarySection`, `sectionLabel`, `PRIMARY_GROUPS`, `RECESSED_GROUPS`. Test: `src/lib/settings-sections.test.ts`.
- **`src/components/connections/AccountConnectionsSection.tsx`** · the "Connected accounts" list (Yours). One `ConnectionRow` per `CONNECTOR_REGISTRY` provider; OAuth-only; drives `listConnections`/`verifyConnection`/`disconnect…`. Exports `ConnectorDetail` (the `?connector=` drill). `ConnectionRow.tsx` renders a lucide icon tile + `StepDot` (parchment) + Connect/Verify/Disconnect. **This is the current connection card and it does NOT match the §8 anatomy** · it lacks scope, owner, glowing status word, last-sync mono, permissions.
- **`src/routes/_authenticated.sync.tsx`** (23KB) · the workspace-level bindings surface (`WorkspaceBindingsSection`, `ProductBindingsSection`, MCP ingest token issuance). Lucide-heavy. This is the "This workspace's" shelf content, currently a separate route.
- **`src/routes/_authenticated.integrations.tsx`** · already a redirect stub → `/settings?section=interop`. No UI.
- **`src/routes/_authenticated.admin.tsx`** (+ `.index`, `.pricing`, `.people`, `.workspaces`, `.platform`, `.observability`, `.ai-costs`) · a full console. Layout renders `AppShell` + `TopBar crumbs={["Admin"]}` + `SurfaceHeader kicker="Operator" icon={Shield}` (lucide) + a 7-tab `TabRow`, gated by `amIAdmin` with a `NoAccessCard` bootstrap path. Parchment `bento`/`btn-primary` classes throughout.

**What stays:** every `SectionId` and the `?section=`/`?connector=` deep-link contract · all server functions · the `amIAdmin` gate + bootstrap path · the admin sub-page data/logic.
**What changes:** the `GroupId` model (5+Advanced → 4 panes), the Settings route chrome (Obsidian, mono index, no lucide), the connection card (→ §8 anatomy), the Admin entry (nav/console door → role-gated Workspace link + room-pattern re-skin).

---

## 5. How · step by step

1. **`src/lib/settings-sections.ts`** · rewrite `GroupId` to `"you" | "workspace" | "connections" | "plan"`. Rebuild `SETTINGS_GROUPS` as four panes, keeping every `SectionId` in exactly one pane (mapping in §8). Drop the `recessed` group (Advanced folds into You/Workspace). Set `DEFAULT_SECTION` per §8. Keep `LEGACY_SECTION_MAP`, `normalizeSection`, `groupForSection`, `findGroup`, `primarySection`, `sectionLabel`. `PRIMARY_GROUPS` = all four; `RECESSED_GROUPS` = `[]`. Update the module docblock to the four-pane model.
2. **`src/lib/settings-sections.test.ts`** · update expectations: four panes, every section in exactly one pane, `you` is primary and lands on `profile`, round-trip `groupForSection(primarySection(g)) === g` for all four, legacy ids still resolve.
3. **`src/routes/_authenticated.settings.tsx`** · swap `AppShell`/`TopBar`/`SurfaceHeader` for the OBS-02 shell (the shell is hoisted; the route body renders inside the Obsidian frame with `data-obsidian` already on the layout root). Remove the lucide imports (`Compass, SlidersHorizontal, Trash2`).
4. Replace the tier-1 `TabRow` + recessed pill with the **quiet left index** · a `SettingsIndex` column (mono `01`..`04` + plain label, nav anatomy from OBS-02, active row `#1A1A1E` + ember index) inside the content column, NOT a second rail. Content column right of it, max-width 720px.
5. Keep tier-2 as a sub-area **inside a pane** (not a global sub-row) where a pane holds more than one section (Workspace: Brief & voice · Staff · AI & keys; Plan: Plan · Credits). Render each pane's card stack in the §7 card anatomy.
6. **Connections pane** · render two labelled shelves. **Yours** = `<AccountConnectionsSection>` restyled so each `ConnectionRow` renders the §8 anatomy (see step 7). **This workspace's** = the `WorkspaceBindingsSection` + MCP token content lifted from `/sync` (import the existing components; do not fork logic). If OBS-10 has not folded `/sync`, keep `/sync` reachable and note it.
7. **`src/components/connections/ConnectionRow.tsx`** · re-skin to the §8 connection card: soft `--raised` tile (no lucide icon · use the provider wordmark text or a mono monogram), the row shows **provider · scope · owner · glowing status word · last sync (mono) · permissions · ONE action**. Status word uses `StatusDot` from `@/components/obsidian` (live moss / stale marigold / failing madder) with its 6px glowing dot + mono-caps word. Remove `Trash2, X, LucideIcon` lucide imports.
8. **You pane** · Profile + Notifications rows + Data export row + the **density toggle** · a two-option segmented control (Comfortable · Compact). On change, `document.querySelector('[data-obsidian]')?.setAttribute('data-density', value)` and persist `localStorage.setItem('cad-density', value)`; read it on mount (a small `useDensity` hook in the route or a shared `src/hooks/use-density.ts`). No server call.
9. **Workspace pane** · Brief & voice + Staff + AI & keys (rehomed), then the **Admin door** · a query `useQuery(["am-i-admin"], amIAdmin)`; render the quiet mono link `Admin console →` ONLY when `me.data?.isAdmin`. The link navigates to `/admin`.
10. **`src/routes/_authenticated.admin.tsx`** · re-skin to the room pattern (extensions §5). Remove `Shield` lucide + parchment `SurfaceHeader`. Room header in Newsreader 20px stating the question; mono sub-tabs (Members · Roles · Audit · Billing mapped over the existing 7 tabs) with the underline as the active signal; verdict-first bodies. Keep the `amIAdmin` gate + `NoAccessCard` bootstrap unchanged (re-skinned to Obsidian). Apply the Engine-Room Test to each label (rename "Observability"→"Health", "AI Costs"→"Spend", "Platform"→"Platform", keep "Pricing"/"People"/"Workspaces" if they pass, else rename). Do NOT change the sub-page data/logic.
11. **Plan pane** · re-skin `BillingTab` + `CreditsTab` bodies to Obsidian cards. Spend-to-date in mono, the cap, ONE primary action ("Add headroom") · ember only if action is genuinely required now, else a quiet ghost.
12. **Empty states** · Connections with no sources: the extensions §9 instruction (see §9 copy). Never a blank box.
13. **Tests** · `bun test settings-sections` (updated), and a new render test that the Admin door is absent when `amIAdmin` returns `{isAdmin:false}` and present when true.

---

## 6. Structure

```
src/routes/
  _authenticated.settings.tsx     (EDIT · Obsidian re-skin, quiet left index, 4 panes)
  _authenticated.admin.tsx        (EDIT · room-pattern re-skin, lucide out, gate kept)
  _authenticated.admin.*.tsx      (light EDIT · Obsidian chrome, labels pass Engine-Room Test)
  _authenticated.sync.tsx         (READ-ONLY reuse · its shelf components import into Connections)
src/lib/
  settings-sections.ts            (EDIT · GroupId → 4 panes, deep-links preserved)
  settings-sections.test.ts       (EDIT · four-pane expectations)
src/components/connections/
  ConnectionRow.tsx               (EDIT · §8 card anatomy, lucide out, obsidian StatusDot)
  AccountConnectionsSection.tsx   (EDIT · "Yours" shelf wrapper, obsidian chrome)
  WorkspaceBindingsSection.tsx    (READ-ONLY reuse as the "This workspace's" shelf)
src/hooks/
  use-density.ts                  (NEW · read/write data-density + localStorage)

Settings (route)
├── SettingsIndex (mono 01..04 · You · Workspace · Connections · Plan)   [new inline]
└── content column (max-w 720)
    ├── YouPane        → Profile · Notifications · Data export · DensityToggle
    ├── WorkspacePane  → Brief & voice · Staff · AI & keys · [Admin door →]
    ├── ConnectionsPane→ ShelfYours(AccountConnectionsSection) · ShelfWorkspace(WorkspaceBindingsSection)
    └── PlanPane       → BillingTab · CreditsTab
```

**Data flow (all consumed, none modified):** `getProfile`/`updateProfile` (You) · `getActiveBrief`/`upsertBrief`, `listAgents` (Workspace) · `listConnections`/`verifyConnection`/`disconnectConnection`/`deleteConnection`/`startGithubAppConnect`/`startGatewayConnect`, `listWorkspaceBindings`/`upsertBinding`/`removeBinding` (Connections) · `getBillingState`/`getMySubscription`/`getMyCreditsView` (Plan) · `amIAdmin`/`bootstrapSelfAdmin` (Admin door + console). Query keys reused as-is (`["am-i-admin"]`, `["billing"]`, `["projects"]`, etc.). **Server fns are consumed, not modified.** The only new persistence is the density value in `localStorage` (client-only, no server).

---

## 7. Design elements (exact values · embed, do not invent)

**Surfaces** · page `--canvas #0A0A0B` · card `--card #111113` · alternating/base `--surface-card-deep #0E0E10` · raised tile / secondary button `--raised #17171A` · hover fill `--hover #1D1D21` · hairline `rgba(255,255,255,0.07)` · hairline-strong `rgba(255,255,255,0.09)`. Depth is tint, never shadow.

**Ink** · primary `#F2F0ED` · body `#B5AFA6` · muted `#9C978F` · subtle `#7D786F` · faint `#55524C` (non-essential metadata only).

**Role color** · ember `--ember #FF6B2C` (`--ember-deep #C2571F` pressed) appears ONLY on a single genuinely-required action (Plan · "Add headroom"). glacier `--glacier #7FD1DC` is the machine voice + the focus ring + the mono-caps label accent. Status words: live `--moss #7FBF8E` · stale `--marigold #E8B44C` · failing `--madder #E06557`. No other color in the chrome.

**Type** · pane index + row labels: Schibsted Grotesk 13px, 1.55, headings 600. Room-header questions + pane titles: Newsreader `--text-card-title 20px`, 450-460, 1.3. Mono metadata (scope · owner · last sync · shortcut): JetBrains Mono 9.5px caps, 0.10-0.12em tracking, middot `·` separators, color `--text-faint`. One italic Newsreader word max per pane (do not force one).

**Geometry** · 4px grid · radii `--radius-control 8` (buttons, toggle) · `--radius-card 12` (cards, shelves) · `--radius-pill 99` (status pill). Content column max-width **720px**. Pane row = label 13px + value muted + one action, right-aligned.

**Motion** · one easing `--ease cubic-bezier(0.23,1,0.32,1)` · `--dur-control 140ms` · `--dur-panel 200ms`. Hover lifts the background one surface step (`--card`→`--hover`) and brightens the hairline · tonal, nothing translates. Press: transform `scale(0.985)` 140ms, ember→`--ember-deep`. Focus: **2px glacier outline, offset 2** (`:focus-visible`). All motion gates on `prefers-reduced-motion`.

**Glow** · status dot glow `0 0 10px` in the dot's role color (moss/marigold/madder). No glow on rows, cards, or the pane index · Settings is calm.

**Connection card anatomy (§8 verbatim), per row:**

- Left · `--raised` monogram tile, radius `--radius-control 8`, provider wordmark in Schibsted 13px primary. No lucide icon.
- Line 2 (mono 9.5px caps, faint, middots) · `SCOPE · WORKSPACE  ·  OWNER · YOU  ·  LAST SYNC · 2H AGO  ·  READ ISSUES · READ PRS`.
- Status · `StatusDot` 6px + mono-caps word · `LIVE` (moss glow), `STALE` (marigold glow), `FAILING` (madder glow).
- Right · exactly ONE action button (quiet ghost `--raised`): `Connect` when unconnected, `Reconnect` when failing, `Disconnect` when live. Never two primaries.

**Interaction states**

- **Hover** (pane index row, connection card, action button) · bg one step up + hairline brighten, 140ms, tonal.
- **Focus** · 2px glacier outline offset 2 on every focusable (rows and actions are real `<button>`s).
- **Active** (selected pane) · index row bg `#1A1A1E`, index numeral turns ember.
- **Press** · scale(0.985) 140ms; ember buttons darken to `--ember-deep`.
- **Empty** (Connections, no sources) · one card, the §9 instruction + time estimate + a single quiet Connect button.
- **Loading** · a quiet mono "reading…" line in `--text-faint`, never a spinner or skeleton block. Density toggle and pane index remain interactive.
- **Error** (a connection fails) · the card shows `FAILING` (madder) status word · **Settings does not badge**; the failure surfaces as a Call on Today. The card's ONE action becomes `Reconnect`.

---

## 8. Restructuring / renaming / modification

- **`settings-sections.ts` GroupId rewrite** · `account · workspace · connections · ai · billing · advanced` → **`you · workspace · connections · plan`**. Section → pane mapping (every `SectionId` preserved, deep-links intact):
  - **you** ← `profile`, `notifications`, `data`, `health` (health as a quiet diagnostics row inside You)
  - **workspace** ← `workspace` (Brief & voice), `staff`, `ai` (AI & keys)
  - **connections** ← `connections` (Yours), `interop` (This workspace's)
  - **plan** ← `billing`, `credits`
  - `DEFAULT_SECTION` → `profile` (You is the first pane). `LEGACY_SECTION_MAP` unchanged.
- **Recessed Advanced group removed** · its members (`health`, `data`) fold into You; the `recessed` field and `RECESSED_GROUPS` filter are dropped (or return `[]`).
- **lucide removals** · `Compass, SlidersHorizontal, Trash2` from the settings route · `Shield` from the admin route · `Trash2, X, type LucideIcon` (and the provider icon imports `Calendar, Github, Figma, …`) from `ConnectionRow.tsx` / `AccountConnectionsSection.tsx`, replaced by mono monograms/wordmarks. "Done" requires lucide gone from Settings + Admin chrome.
- **Admin console → role-gated door** · Admin leaves any nav position (it was never a rail item, but the `/admin` entry is now reached ONLY via the role-gated Workspace-pane link). The `/admin` layout is re-skinned to the room pattern; its 7 tabs become mono sub-tabs with Engine-Room-Test labels.
- **No route redirects added here** · `/sync`, `/integrations`, `/admin/*` redirects are OBS-10. `routeTree.gen.ts` is regenerated by the router plugin, never hand-edited.

---

## 9. Copy / voice (humanized · no em/en dashes, no exclamation marks)

- **Pane index:** `01 You` · `02 Workspace` · `03 Connections` · `04 Plan`.
- **You · density toggle label + helper:** `Density` · helper: `Compact drops one row of breathing room · type stays the same`.
- **You · data export action:** `Export your data` · helper: `Downloads everything we hold for you · a few seconds`.
- **Workspace · Admin door (admins only):** `Admin console →` · helper: `Members, roles, audit, and billing for the whole workspace`.
- **Connections · shelf labels (mono caps):** `YOURS` · `THIS WORKSPACE'S`.
- **Connections · connection card actions:** `Connect` · `Reconnect` · `Disconnect`. Consequence helper on Disconnect: `Stops the sync · nothing is deleted`.
- **Connections · empty state (no sources):** `Nothing sensed yet. Plug in Intercom and give it ten minutes.` with one `Connect` button.
- **Plan · primary action + helper:** `Add headroom` · helper: `Raises your monthly cap · takes effect right away`. (ember only when the cap is actually near.)
- **Admin · room header questions (Newsreader 20px):** e.g. `Who is in this workspace?` (Members) · `What can each role do?` (Roles) · `What changed, and who did it?` (Audit) · `What is the workspace paying?` (Billing).
- **Admin · no-access card:** `Admin access required` · body: `The admin console manages members, roles, audit, and workspace billing. Ask a current admin to grant you access.` Bootstrap: `Claim admin · one-time setup` with helper `No admin exists yet. Whoever claims first becomes the first admin.`
- All mono metadata uses middots: `SCOPE · WORKSPACE · LAST SYNC · 2H AGO`.

---

## 10. Acceptance criteria

- [ ] Settings renders exactly four panes (You · Workspace · Connections · Plan) as a quiet mono `01..04` left index inside the content column, not a second rail; content column max-width 720px.
- [ ] Every legacy `?section=` id (all 11 `SectionId`s + `brief`, `calendar`) still lands on its content; `settings-sections.test.ts` is green with four-pane expectations.
- [ ] Connections is the only integrations home · two shelves (Yours · This workspace's); each connection renders the §8 anatomy (provider · scope · owner · glowing status word · last sync mono · permissions · ONE action).
- [ ] A failing connection shows `FAILING` (madder) status and a `Reconnect` action; Settings shows **no badge**; the failure is a Call on Today.
- [ ] The density toggle in You sets `data-density` on the `[data-obsidian]` root, persists to localStorage, restores on reload, and visibly changes row/card spacing (type unchanged).
- [ ] The Admin door on Workspace is present only when `amIAdmin` is true and absent otherwise; it opens the `/admin` console re-skinned to the room pattern (verdict-first rooms, mono sub-tabs, Engine-Room-Test labels).
- [ ] Zero lucide icons in the Settings route, the Admin layout chrome, or `ConnectionRow`; status is a 6px glowing dot + mono word.
- [ ] Ember appears in Settings only on a single genuinely-required action (Plan · Add headroom when the cap is near), nowhere else.
- [ ] Every acting row/card/action is a real `<button>` with the 2px glacier focus ring; overlays trap and restore focus (the Admin console body).
- [ ] Grayscale screenshot of each pane still reads; restraint budget audited (≥90% neutral, ≤1 ember CTA, no aurora unless a real score moment).

---

## 11. Prototype-parity checklist (the last gate · tailored, hub §5.9)

1. **Rail:** the OBS-02 rail is unchanged · Settings is reached from the user chip, not a rail index; verify Settings does NOT add a rail item.
2. **Surface chrome:** 52px top bar, content max-width 720px, the pane index reads as the nav anatomy (mono index, active `#1A1A1E` + ember numeral), `cadRise` entrance.
3. **Type:** pane titles Newsreader 20px/460; row labels 13px/1.55; mono metadata 9.5px caps with middots; at most one italic word.
4. **Color:** zero hexes outside the tokens; ember only on the one required action; status glows match (dot `0 0 10px` in moss/marigold/madder).
5. **Motion:** hover 140ms one-step tonal lift; press scale(0.985); focus ring glacier; density change animates spacing at `--dur-panel 200ms`; reduced-motion kills all.
6. **Behavior:** deep-links land (`?section=`, `?connector=`); Admin door visibility tracks `amIAdmin`; density persists across reload; a failing connection does not badge Settings.
7. **Copy:** plain-words actions (Connect · Reconnect · Add headroom), consequence helpers, mono-caps metadata, no em dashes, no exclamation marks.
8. **Grayscale** screenshot of each pane still reads; restraint budget audited.

---

## 12. Verification + gates

- **`tsc --noEmit` = 0.**
- **`bun test`** green, including updated `src/lib/settings-sections.test.ts` (four-pane model) and a new Admin-door visibility test (`amIAdmin` false → link absent, true → present).
- **`bun run build`** on the primary checkout / before publish. In a lane worktree it is RED on the pre-existing node20-vs-ESM `lovable-tagger` error (hub §11) · treat `tsc` + `bun test` as the real gates there; do not chase lovable-tagger.
- **Grayscale test** on all four panes + the Admin console.
- **Restraint budget** audit (§4 hub): ≥90% neutral · ≤1 ember CTA · no aurora card (Settings has no score moment) · status color only on actual status.
- **`impeccable` / humanized-output scan** · grep every new string for `-`, `-`, `!`, emoji, and the banned words (seamlessly, leverage, empower, robust, unlock, delve).
- **lucide grep** · `grep -n "lucide-react" src/routes/_authenticated.settings.tsx src/routes/_authenticated.admin.tsx src/components/connections/ConnectionRow.tsx` returns nothing.
- **Manual checks** · toggle density and reload (persists); disconnect a live connection (status word flips, Settings does not badge); load `/settings` as a non-admin (no Admin door) and as an admin (door present, console opens). Side-by-side screenshots of each pane vs. the prototype at 1440px in the ship report.

---

## 13. Risks · gotchas · founder-gates

- **Four-pane mapping is a founder-visible IA decision.** The canon fixes exactly four panes but the current build has AI-keys, health, and data sections with no obvious home. This spec rules: AI & keys → Workspace, health → You (quiet diagnostics row), data → You, credits → Plan. **Founder-gate:** confirm this mapping, especially AI & keys under Workspace (an alternative is a fifth "Studio/Advanced" fold, which the four-pane law forbids).
- **`/sync` fold timing.** The "This workspace's" shelf content lives on `/sync` today. If OBS-10 has not yet folded `/sync` into Connections, OBS-13 imports the shelf components into the Connections pane and leaves `/sync` reachable; the clean redirect is OBS-10's. Do not fork the binding logic.
- **Admin console depth.** OBS-13 re-skins the `/admin` layout + labels to the room pattern; the 7 sub-page bodies get Obsidian chrome but a full verdict-first redraw of each is large. Priority order: door + gate + layout + labels pass the Engine-Room Test first; deep per-room redraw can ride the same pass if time allows, else note the remainder (founder-surfaced per the touched-means-fully-close rule).
- **Deep-link regression risk.** Changing `GroupId` without breaking `?section=` is the sharp edge · the test must assert every legacy id resolves. Do not rename any `SectionId`.
- **Density write target.** The toggle must target the actual `[data-obsidian]` root element (mounted by OBS-02 on `_authenticated.tsx`), not a nested node · verify the selector resolves before writing.

---

## 14. Interlinks

- **Hub:** [`./README.md`](./README.md) · shared tokens §5, restraint budget §4, IA target §6 (Settings row), parity checklist §5.9, codebase map §7.
- **Sibling OBS items (build-order neighbors):** [`./OBS-10.md`](./OBS-10.md) (dependency · route fold settles `/settings`, `/admin`, `/sync`, `/integrations`) · OBS-09 (Engine Room · shares the room pattern Admin reuses; spec pending, pattern in extensions §5) · [`./OBS-14.md`](./OBS-14.md) (onboarding · also sets density in Settings → You; spec pending) · [`./OBS-03.md`](./OBS-03.md) (`StatusDot`, `Button`, `MonoLabel`, `SlideOver` from `@/components/obsidian`).
- **Canon anchors:** [`../../../design-reference/obsidian-extensions.md`](../../../../../design-reference/obsidian-extensions.md) §3 (Settings four panes + Admin posture), §5 (room-detail pattern), §8 (density modes), §9 (empty-state catalog) · [`design/archive/obsidian-v3.md`](../../../../design/archive/obsidian-v3.md) §8 (IA · Settings + Admin role-gated), §9 (component anatomies · status dots, buttons), §10 (voice) · doctrine [`../../conventions/engine-room-doctrine.md`](../../../../conventions/engine-room-doctrine.md) (the Engine-Room Test on every Admin label) · [`../../conventions/humanized-output.md`](../../../../conventions/humanized-output.md).
