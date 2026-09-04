# Settings + Auxiliary-Surface Reclustering Proposal

> _Created: 2026-08-03 · Last updated: 2026-08-03_

> Research stream for the front-end reimagining charter (requirement 6: every capability accessible, sensibly placed; requirement 8: brand config as a one-time feed; requirement 9: agents are manageable). Created 2026-07-19. Source of truth read: `src/lib/settings-sections.ts`, `src/routes/_authenticated.settings.tsx`, `src/routes/_authenticated.admin.tsx` (+ 9 children), `src/routes/_authenticated.sync.tsx`, `src/lib/ai/loop.server.ts`, `src/lib/ai/trust.server.ts`, `src/lib/ai/tools/registry.server.ts`, `src/lib/design-memory.functions.ts`, `src/components/settings/*`, `src/components/governance/*`.

---

## 1. Current inventory (what exists today, verbatim from code)

### 1a. Settings: 13 canonical sections in 4 panes (OBS-13 model) plus 4 embedded sub-surfaces = 17 units

The pure grouping model lives in `settings-sections.ts`: four panes (You, Workspace, Connections, Billing), every `SectionId` in exactly one pane, `?section=` is the routing key, legacy aliases (`brief`, `calendar`, `plan`, `you`) still resolve.

| # | Pane | Section (`SectionId`) | One-line contents |
| --- | --- | --- | --- |
| 1 | You | Profile (`profile`) | Name, account identity; renders with two embedded extras (below) |
| 2 | You | Notifications (`notifications`) | Preference matrix for 4 alert rows: Approvals Needed, Loop Health & Stalls, Spend & Budgets, Output Quality & Trends; plus interaction-feedback prefs |
| 3 | You | Data (`data`) | Five stacked cards: DataSubstrateCard (what Supaprod stores), ValueReceiptsCard (what the data earned you), DataExportCard (raw JSON export), SkillsFileExportCard (AGENTS.md-style lessons bundle for external coding agents), SubprocessorsCard (who touches the data) |
| 4 | You | Diagnostics (`health`) | HealthCard: reliability SLO (7/30 day windows) + runaway-mission detector, reusing the cockpit drill-in |
| 5 | Workspace | Brief & voice (`workspace`) | WorkspaceBriefSection (5 fields: mission, target user/ICP, current focus, anti-goals, notes), voice anchor (tone injected into every mission system prompt), MembersCard, TeamCard, AdminDoor |
| 6 | Workspace | AI staff (`staff`) | The 13 catalog-active agents as cards: enable toggle (display-only, "gated in Govern"), per-agent Tool reach cap (`max_tool_risk` low/medium/high via `setAgentToolCap`) |
| 7 | Workspace | Products (`products`) | Portfolio board ported from the retired /product page: switch, archive, restore, export JSON, delete, create |
| 8 | Workspace | AI & keys (`ai`) | Default model (chat + agent runs), agentic model (automatic background runs), Auto routing option, BYO keys section (enterprise-gated, provider + base URL + model id, test before save) |
| 9 | Workspace | Memory (`memory`) | MemoryView, the workspace memory ledger: decisions (read-only), learned lessons (read-only), agent reflections (deletable via forgetMemory), pending conventions (house rules + memory candidates, decided from Approvals) |
| 10 | Connections | Sources (`connections`) | ConnectionsTab: account-level connector catalog + per-provider detail (`?connector=`), WorkspaceBindingsSummary linking out to /sync |
| 11 | Connections | Agent access (`interop`) | IntegrationsTab: issue/revoke per-workspace MCP tokens so EXTERNAL agents can call Supaprod's read-only MCP server (8 methods: search signals/opportunities/decisions/prds, get prd/ard/roadmap, export skill-pack); curl + bearer contract |
| 12 | Billing | Plan (`billing`) | Current tier, three-tier PlanTable, Stripe checkout upgrade, honest "billing not connected yet" degrade |
| 13 | Billing | Credits (`credits`) | Credit balance, bundle grid, top-up flow |

Embedded sub-surfaces (not `SectionId`s but real, findable-or-lost units):

| # | Lives inside | Unit | Contents |
| --- | --- | --- | --- |
| 14 | Profile | AppearanceSection | Theme choice |
| 15 | Profile | DensityToggle | UI density |
| 16 | Brief & voice | AdminDoor | Role-gated link to /admin, plus the one-time "claim admin" bootstrap card when zero admins exist |
| 17 | Sources | Workspace bindings summary | The bridge card that deep-links to /sync |

### 1b. Admin console (/admin, role-gated, reached only through the AdminDoor)

Nine tabs, header question "Who runs this workspace, and what is it costing?":

| Tab | Route | Contents |
| --- | --- | --- |
| Overview | /admin | Landing summary |
| Pricing | /admin/pricing | Tier and price administration |
| People | /admin/people | Members, roles, audit |
| Workspaces | /admin/workspaces | Workspace administration |
| Platform | /admin/platform | Platform-level switches |
| Routing | /admin/routing | Model routing console |
| Health | /admin/observability | Platform observability |
| Spend | /admin/ai-costs | AI cost roll-up |
| Proof | /admin/proof | Proof/receipts surface |

### 1c. /sync (Sync & bindings, off the nav rail, reached from Settings > Sources)

One job: workspace + product bindings (what this workspace reads and writes), sync conflicts with resolve, pull/push per mapping (read-only shown honestly), recently-synced items, and the "Send anything in" ingest webhook card (token issue/rotate/revoke). Deep-link `?conflict=<id>`.

### 1d. Agent configuration reality across the codebase (for section 4 below)

- `agent_tools` (per user): which of the ~45 registry tools are enabled, each with a stored mode `auto` / `confirm` / `review` (loop.server.ts pulls these per run). UI: ControlsPanel (governance) via `updateToolMode`, NOT in Settings.
- `agent_autonomy` (per agent): trust arc `observing` / `proving` / `trusted` / `ambient`; the dial only ever loosens confirm toward auto, `review` is sticky, high-risk tools stay pinned. UI: TrustDial + TrustGraduations in the governance/cockpit surfaces.
- `agents.max_tool_risk` (per agent): blast-radius cap, set in Settings > AI staff.
- Kill switch, mission concurrency cap, auto-pipeline (reactor) subscriptions: ControlsPanel (governance).
- Workspace-level knowledge: the brief (5 fields) + voice anchor, injected into missions. Memory ledger in Settings > Memory.
- Design language: `design_memory` table (DSN-01) with import-from-URL, import-from-text, seed-defaults, house-rules-style approve/reject and supersession; surfaced today on the /design route via DesignMemoryPanel.
- Skills: EXPORT only (SkillsFileExportCard + the MCP `export_skillpack` method).

---

## 2. The reclustered proposal

The charter's tentative grouping (You / Workspace / Connections & Data / Plan & Usage / Advanced) is close but has two weaknesses: (a) it leaves the charter's own requirement 9 (a deliberate agent home) smeared across Workspace, and (b) "Advanced" is exactly the recessed fold OBS-13 already killed for good reason (things placed there die). Proposal: **five named groups, no Advanced**, with Agents promoted to its own group. Admin stays a role-gated door, not a group.

### Group 1: You
Personal, follows the person across workspaces.
- **Profile** (profile): name, identity.
- **Appearance** (promoted from embedded to a named item): theme + density together. Nothing should exist only as an unlabeled scroll-past.
- **Notifications** (notifications): the 4-row alert matrix.

### Group 2: Workspace
What this workspace is and who is in it.
- **Company brief** (workspace brief fields): mission, ICP, focus, anti-goals, notes.
- **Voice** (voice anchor): split from the brief card into its own labeled item; same backend.
- **Brand** (NEW named item, see section 3): the one-time design-language feed.
- **Products** (products): the portfolio board.
- **People** (MembersCard + TeamCard, folded together): members and roles. The AdminDoor renders at the bottom of People (roles are where an admin looks for admin), not under the brief.
- **Memory**: MOVE OUT of Settings. The memory ledger is content, not configuration; the nav already has Brain as a destination. Settings keeps a one-line pointer. This shortens Settings and gives Brain real weight.

### Group 3: Agents (new group; the charter-mandated deliberate home)
Standing policy for the 13-agent roster. Per-mission, in-the-moment state stays in the Mission Control crew drawer (section 4).
- **Roster**: the 13 agent cards (enable state, tool reach cap). Absorbs Settings > AI staff.
- **Autonomy & approvals**: the trust dial per agent (arcs), per-tool approval modes (auto/confirm/review), the kill switch, mission cap, auto-pipeline subscriptions. Absorbs the governance ControlsPanel + TrustDial + TrustGraduations, which today live on a surface no new user would find.
- **Models & keys**: default model, agentic model, BYO keys. Absorbs Settings > AI & keys. Model choice is agent behavior, not workspace identity.
- **Skills**: what the agents have learned, exportable as a skill-pack; the import half is a gap (section 4).

### Group 4: Connections & Data
Everything that crosses the boundary of Supaprod.
- **Sources** (connections): connect your tools.
- **Sync & bindings**: fold /sync in as a named item here (it is already reached only from this pane; give it a real home and keep the deep room for conflict resolution). The ingest webhook ("Send anything in") stays inside it.
- **Agent access** (interop): let external agents use Supaprod (MCP tokens). Rename below.
- **Your data** (data): the five data cards. The SkillsFileExportCard cross-links to Agents > Skills but stays here as the data-export instance.

### Group 5: Plan & Usage
Money and system health, quiet by charter requirement 5 (costs one click deep).
- **Plan** (billing): tier + upgrade.
- **Credits** (credits): balance + top-up.
- **Usage**: the quiet home for spend detail (per-surface AI spend, budgets). Today spend visibility is split between admin Spend and inline figures; this is where cost curiosity gets answered without leaking into missions.
- **Diagnostics** (health): SLO + runaway missions. It sits here (not You) because "is the system healthy and what is it costing" is one mental neighborhood.

### Admin
Unchanged shape: a role-gated door (now from Workspace > People), nine tabs intact. Not a Settings group; not on the nav. The bootstrap "claim admin" card keeps its current behavior.

### Full mapping check (nothing orphaned)

| Current unit | New home |
| --- | --- |
| profile | You > Profile |
| AppearanceSection + DensityToggle | You > Appearance |
| notifications | You > Notifications |
| workspace (brief) | Workspace > Company brief |
| voice anchor | Workspace > Voice |
| MembersCard + TeamCard | Workspace > People |
| AdminDoor | Workspace > People (bottom) |
| products | Workspace > Products |
| staff | Agents > Roster |
| ai (models + BYO keys) | Agents > Models & keys |
| governance ControlsPanel / TrustDial / TrustGraduations | Agents > Autonomy & approvals |
| SkillsFileExportCard (agent-facing half) | Agents > Skills |
| memory | Brain (nav destination); pointer from Settings |
| connections | Connections & Data > Sources |
| /sync + ingest webhook | Connections & Data > Sync & bindings |
| interop | Connections & Data > Agent access |
| data (5 cards) | Connections & Data > Your data |
| billing | Plan & Usage > Plan |
| credits | Plan & Usage > Credits |
| admin Spend / spend detail | Plan & Usage > Usage (workspace view) + /admin Spend (platform view) |
| health | Plan & Usage > Diagnostics |
| /admin 9 tabs | Unchanged behind the door |
| Legacy `?section=` aliases | Extend LEGACY_SECTION_MAP; every old deep link still lands |

Deep-link contract: keep `?section=` ids stable and additive (new ids: `appearance`, `voice`, `brand`, `people`, `autonomy`, `skills`, `sync`, `usage`), so the reimagined shell costs zero broken links.

---

## 3. Brand and design-system config as a one-time feed (charter requirement 8)

The backend already exists and is better than the charter assumes: `design-memory.functions.ts` (DSN-01) stores the workspace's design language (tokens, type, spacing, principles, voice, patterns) as first-class approved/pending entries with provenance and supersession, seeded three ways: import from a public URL (LLM extracts the design language from raw markup), paste a design constitution as text, or accept a generic starter set. Every design scaffold generation (DEF-04) already binds the active design memory into the prompt, and scaffold approve/reject writes feedback back.

Proposal:
- **Settings > Workspace > Brand is the one-time feed door.** Three affordances on one card: "Point at your site" (importDesignMemoryFromUrl), "Paste your guidelines" (importDesignMemoryFromText), "Start with defaults" (seedDefaultDesignMemory). After first feed the card flips to a summary state: N approved entries, last updated, one "Review entries" link.
- **The Design stage consumes, never configures.** DesignMemoryPanel moves out of the /design flow; the Design canvas face shows prototypes and mockups only, with a one-line "styled from your brand · change in Settings" attribution. This is exactly the charter's "Design stage does design" split.
- **Entry curation stays approval-shaped**: pending design-memory entries flow through the same Approvals pull point as house rules, so Brand never grows its own review queue.

GAP: no structured brand asset intake exists. Design memory is text extraction only; there is no logo upload, no font file intake, no explicit hex-token editor, and no way to hand Supaprod a Figma variables export. A minimal structured layer (logo + 3 named colors + font names as typed fields feeding the same design_memory table) needs new backend.

---

## 4. Agent-management IA: Settings vs the crew drawer

Rule of thumb: **Settings holds standing policy (survives every mission); the crew drawer holds live state and context (this product, this mission, right now).**

### Lives in Settings > Agents (durable policy)

| Concern | Exists in code today | Status |
| --- | --- | --- |
| Roster on/off + tool reach cap | `agents.enabled` (change gated), `max_tool_risk` via setAgentToolCap | EXISTS, relocate from AI staff |
| Per-tool approval modes (auto/confirm/review) | `agent_tools.mode`, updateToolMode, composed at runtime by `resolveGate` in loop.server.ts with the trust arc; review sticky, high-risk pinned, plan-approval loosens reversible confirms | EXISTS, relocate from governance ControlsPanel |
| Trust dial / graduation | `agent_autonomy.arc`, suggestArc, TrustDial, TrustGraduations | EXISTS, relocate |
| Kill switch, mission cap, auto-pipelines | setWorkspacePause, reactor subscriptions in ControlsPanel | EXISTS, relocate |
| Model choice (default + agentic) and BYO keys | profile.default_model / agentic_model, api-keys CRUD | EXISTS, relocate from AI & keys |
| MCP/tool grants outbound (Supaprod calling YOUR MCP servers/tools) | Does not exist; the tool registry is a fixed native set and `interop` is inbound only | GAP |
| Skills import/attach | Export only (exportSkillsFile, export_skillpack) | GAP |
| Per-agent instructions | Only the workspace-wide voice anchor exists | GAP |
| Per-agent model override | Models are per-user profile-wide | GAP |

### Lives in the crew drawer (in-context, inside Mission Control)

- Who is active on this product right now, current mission, current arc chip (read-only mirror of the Settings dial, one click to the policy page).
- Per-product knowledge and instructions: what this agent should know about THIS product (the workspace brief is workspace-wide today).
- A "what can this agent touch" glance: the resolved tool list with modes, rendered from `describeToolsForPrompt` data, read-only in the drawer.
- Handoff/spawn visibility (agent.handoff, agent.spawn already exist as tools with approval cards).

GAP: per-product knowledge/instructions have no backend. The brief and voice anchor are workspace-level; `projects.functions.ts` has no brief/instructions/knowledge field on a product. The crew drawer's per-product instruction panel needs a new `product_briefs` (or projects.instructions) column plus prompt injection in the mission composer.

GAP: outbound MCP does not exist. Settings > Agent access is Supaprod-as-server (external agents calling in). There is no surface or backend for granting Supaprod's own agents access to a user's external MCP servers or custom tools; the registry is a closed native set. If the rebuild promises "MCP/tool access grants" this is new backend (server registry table, credential storage via the existing vault, per-agent grant rows).

GAP: skills are export-only. A user can download the skill-pack but cannot attach a skill or lesson pack TO an agent; there is no import path or per-agent skill binding.

GAP: per-agent custom instructions do not exist; only one workspace-wide voice anchor. A per-agent instructions field (agents table or agent_autonomy sibling) plus injection alongside the voice anchor is new backend.

---

## 5. Renaming proposals (plain words, one line each)

### Groups

| Name | One-liner under the label |
| --- | --- |
| You | Your profile, look, and alerts. |
| Workspace | What you are building, your brand, and your team. |
| Agents | Your AI staff: what they may do, and on whose approval. |
| Connections & Data | What flows in, what syncs out, and what we store. |
| Plan & Usage | Your plan, credits, and what the system spent. |

### Items

| Item (group) | One-liner |
| --- | --- |
| Profile (You) | Your name and account. |
| Appearance (You) | Theme and density. |
| Notifications (You) | What we interrupt you for. |
| Company brief (Workspace) | What you are building and for whom. Agents anchor on this. |
| Voice (Workspace) | How your agents should sound. |
| Brand (Workspace) | Feed your design language once. Every mockup uses it. |
| Products (Workspace) | The products this workspace runs. |
| People (Workspace) | Members, roles, and the admin console. |
| Roster (Agents) | The 13 specialists and what each may touch. |
| Autonomy & approvals (Agents) | What runs alone, what asks first, and the emergency stop. |
| Models & keys (Agents) | Which AI models do the work. Bring your own keys if you like. |
| Skills (Agents) | What your agents have learned, ready to take anywhere. |
| Sources (Connections & Data) | Connect the tools you already use. |
| Sync & bindings (Connections & Data) | What each product reads and writes, and any conflicts. |
| Agent access (Connections & Data) | Let your other AI tools read this workspace. |
| Your data (Connections & Data) | What we store, what it earned you, and how to take it out. |
| Plan (Plan & Usage) | Your tier and what it includes. |
| Credits (Plan & Usage) | Your balance and top-ups. |
| Usage (Plan & Usage) | Where the credits went. |
| Diagnostics (Plan & Usage) | Are the agents healthy? The numbers on demand. |

Admin console header keeps its question form ("Who runs this workspace, and what is it costing?"); tab renames Health and Spend already pass the Engine-Room Test and stay.

---

## What Supaprod should steal (from its own codebase and the reclustering)

1. **Promote Agents to a Settings group.** The single highest-leverage move: Roster + Autonomy & approvals + Models & keys + Skills in one place answers charter requirement 9 with almost zero new backend; it is 80 percent relocation of ControlsPanel, TrustDial, StaffTab, and ModelsTab.
2. **Make Settings > Workspace > Brand the one-time design feed** on top of the already-shipped DSN-01 design memory (URL import, paste, defaults), and strip configuration out of the Design stage.
3. **Move the Memory ledger to Brain** and keep Settings pure configuration; every section left in Settings should answer "a preference or a policy", nothing else.
4. **Fold /sync into Connections & Data as a named item** so bindings stop being a page reachable only through one summary card.
5. **Keep the `?section=` additive deep-link contract** (extend LEGACY_SECTION_MAP) so the reimagined shell breaks zero existing links, emails, or muscle memory.
6. **Render approval modes in plain rows** ("runs alone" / "asks first" / "needs review") reusing resolveApprovalMode semantics verbatim; the runtime already composes dial + risk + plan-consent correctly, the UI just never explained it.

GAP: no structured brand asset intake (logo, fonts, explicit color tokens, Figma export); design memory is text extraction only.
GAP: per-product knowledge/instructions have no backend; the brief and voice anchor are workspace-wide only.
GAP: outbound MCP/custom-tool grants do not exist; the tool registry is a closed native set and interop is inbound only.
GAP: skills are export-only; no import or per-agent skill attachment path.
GAP: per-agent custom instructions do not exist; one workspace-wide voice anchor serves all 13 agents.
GAP: no per-agent model override; model choice is per-user profile-wide.
