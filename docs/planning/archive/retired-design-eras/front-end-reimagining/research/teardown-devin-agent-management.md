# Teardown: Devin (mid-2026) + the agent-management UX landscape

> _Created: 2026-08-03 · Last updated: 2026-08-03_

> Research stream for the front-end reimagining (Phase R). Written 2026-07-19.
> Scope: Devin's current state (sessions, plan visibility, intervention moments, Knowledge, Playbooks, MCP marketplace) plus how Claude Code / Claude.ai, ChatGPT, and Lovable let users configure agents: tool/MCP grants, editable skills, per-project instructions and knowledge. Feeds the Supaprod agent-management layer (charter requirement 9) and the gate/approval anatomy (requirements 4, 13).
> Sources: docs.devin.ai (knowledge, playbooks, interactive-planning, 2026 release notes), cognition.com blog, help.openai.com Projects article, docs.lovable.dev/features/knowledge, lovable.dev skills launch posts, Claude connectors directory coverage (claude.ai/directory unification, March 2026). All external-state claims verified by live web fetch/search on 2026-07-19.

## 1. Devin, current state (Cognition, mid-2026)

Devin is the closest existing product to "a roster of agents you manage like staff," which is exactly Supaprod's frame. Its 2026 shape:

### 1.1 Sessions list

- Left sidebar of sessions with **status labels as states of need**: "PR created", "Awaiting instructions", blocked, running. The list is a triage surface, not a history log.
- **Session folders** (collapsible groups, May 2026), pin/unpin, inline rename, and **child sessions rendered with tree connectors** under their parent (June 2026). Parallel work reads as a visible org chart, not a flat list.
- **"Devin manages Devins"** (March 2026): a main session orchestrates managed child Devins on isolated VMs; an Agents tab per parent shows each child's status, todos, and PRs in one view; a Sub-Devin filter isolates children; archiving cascades with undo restore.
- Past sessions are **fully searchable across shell, file, browser, git, and MCP activity**, and filterable by tag, playbook, origin, or time range. The audit trail is a queryable database, not a scrollback.
- Session message **permalinks** for sharing a specific moment; quoting text from files or the worklog directly into a reply (July 2026).

### 1.2 Plan visibility ("interactive planning")

This is Devin's most load-bearing UX pattern:

- Before touching files, Devin explores the codebase and emits a **detailed execution plan with code citations and inline snippets**; citations deep-link into the Devin IDE so the human can verify the agent's reading of the code before approving.
- **Default: 30-second soft gate.** Devin waits 30s for feedback, then proceeds. A "Wait for my approval" toggle turns it into a hard gate per task; the default window is configurable in Settings > Customization. This is a calibrated-friction dial, not a binary.
- During execution: **streaming thoughts**, an **active-todo header** (also mirrored into Slack), per-tool **timing** in "Watch Devin Work", and a **worklog that merges consecutive edits** to the same file into one original-to-final diff so the human reads outcomes, not keystrokes.

### 1.3 Human-intervention moments

- Interventions are typed, not generic chat: plan approval, **Pre-Approve Testing** ("always approve" standing consent, June 2026), PR **action-required flags posted to GitHub by default**, "Code Owner Review Block" showing exactly which merge blocker is unresolved, and "Awaiting instructions" as a first-class session state.
- Standing consents are remembered per category, so the same question is never asked twice. ACU hard caps per session act as a budget-shaped intervention: the agent stops at a spend ceiling instead of asking mid-flight.

### 1.4 Knowledge (per-org / per-repo memory the user can edit)

- A Settings & Library page: each Knowledge item = **Trigger Description + Content**. The trigger is an explicit, human-readable retrieval condition ("when deploying to staging..."), content is a few sentences. Retrieval logic is visible and editable, not a black-box embedding.
- **Macros**: `!deploy-checklist` style handles to force-inject an item into any prompt.
- **Folders with nested hierarchy**; toggling a folder enables/disables everything inside; drag between folders; auto-sort.
- **Scoping**: pinned to a repo (always active there), org-wide, or contextual-only; enterprise scope promotion via a Details tab with permissions. Limit ~300 items per org (June 2026).
- **The killer loop: post-session knowledge suggestions.** After a session (especially after a correction), Devin proposes new or updated Knowledge items as standalone worklog events; the user edits, saves, or dismisses. Corrections compound into configuration without the user authoring anything from scratch.

### 1.5 Playbooks (reusable procedures)

- "A custom system prompt for a repeated task." Canonical sections: Overview, Procedure (imperative steps), Specifications (postconditions = definition of done), Advice, **Forbidden Actions**, Required from User.
- Created in the web app or as `.devin.md` files dragged into a session; macro attach (`!data-tutorial`); a blue pill confirms attachment before the session starts; **version history with revert**.
- The playbooks index page shows **ROI per playbook: session count, unique users, merged PRs, weekly activity chart**. Configuration has analytics; teams can see which procedures actually earn their keep.
- Playbooks can pin an execution mode (Fast vs Normal) and a structured output schema (JSON returns for child sessions).

### 1.6 MCP marketplace and tool grants

- A first-party **MCP marketplace** (Datadog, PostHog, Miro, Mixpanel, Honeycomb, Postman, monday.com, 48+ added June 2026 alone) with **one-click OAuth install**, custom org OAuth credentials, token-expiry warnings, and surfaced (not swallowed) connection errors plus a disconnect action that revokes stored tokens.
- Governance is built in: a dedicated enterprise MCP management page with **per-server usage metrics**, allowlist (registry enforcement), and an **MCP Read-Only Mode** for secure profiles. Grants are auditable and revocable at the org level.
- Devin itself is exposed as an MCP server (sessions, playbooks, knowledge, scheduling programmable from any MCP client).

### 1.7 What Devin gets wrong (for our purposes)

- It is single-role: one kind of agent (software engineer), so it never had to solve "13 agents with different jobs." Its config surfaces (Knowledge, Playbooks, MCP) are three separate library pages with no unified "this is your team" view.
- Configuration lives entirely in Settings & Library, disconnected from the work surface; the only bridge is the suggestion loop and macros. Supaprod's Mission Control can do better by making the roster itself the config entry point.
- No journey concept: sessions are tasks, not stages of a product loop. Nothing tells you what to do next after a PR merges.

## 2. Claude Code / Claude.ai (Anthropic, mid-2026)

- **Skills = folders with a SKILL.md** (YAML frontmatter: name + a description that doubles as the trigger; body = instructions; optional scripts/templates). Custom slash commands merged into Skills in 2026: one mental model for "a named, invokable capability." Three scopes: personal (~/.claude), project (.claude/skills, checked into git), plugin.
- **The description IS the routing.** The agent reads skill descriptions and self-selects; users tune when a skill fires by editing one sentence. Same pattern as Devin's Trigger Description. This convergence is the strongest signal in this teardown: editable, human-readable trigger text is the 2026-standard mechanism for "when should the agent use this."
- **Permission model as progressive consent**: first use of a tool prompts allow-once / allow-always / deny; decisions persist into settings.json allowlists that are plain, editable config. Modes (default, plan-first, accept-edits, bypass) are a per-session autonomy dial. Plan mode = read-only exploration, then present a plan, then ask to proceed: the same interactive-planning gate as Devin, expressed as a mode.
- **Claude.ai unified Directory** (claude.ai/directory, March 2026): Skills, Connectors, and Plugins in ONE browsable catalog (~440 connectors, 30 categories) with one-click connect, OAuth with per-scope grants, per-conversation tool toggles. The lesson: users could not hold three extension taxonomies; Anthropic collapsed them into one storefront.
- **Projects** hold per-project instructions + a knowledge file store; **CLAUDE.md / AGENTS.md** is the per-repo standing-instructions pattern, git-versioned and agent-editable (the `/init` and memory features write it for you).
- Weakness: config sprawls across settings.json, CLAUDE.md, skills folders, MCP configs, and the web directory. Power-user heaven, newcomer maze. Supaprod must offer ONE agent-management home.

## 3. ChatGPT (OpenAI, mid-2026)

- **Projects** = workspace bundles: chats + files (5/25/40 by tier) + project instructions (several thousand chars). Instructions and files apply to every chat inside.
- **Project-only memory** is the notable primitive: at creation you choose whether the project draws on global memory or is sealed; sharing a project force-seals it, irreversibly. Memory scoping is a visible, user-facing choice made at container creation, with a privacy-preserving default on share.
- Custom instructions (global) vs project instructions (scoped) is the two-layer instruction pattern everyone now has: global voice + per-container context.
- Weakness for our purposes: no tool-grant granularity per project, no editable skill/procedure objects, no post-session learning loop. It shows the floor, not the ceiling.

## 4. Lovable (mid-2026)

- **Knowledge vs Skills is an explicitly taught distinction**: Workspace knowledge (rules across all projects: standards, brand, conventions) and Project knowledge (this app's purpose, schema, domain terms) are ALWAYS in context; **Skills are loaded on demand** for task-shaped work (release checklist, redesign pass, SEO review). One sentence of product doctrine: "Knowledge is always included. Skills are loaded on demand."
- Skills (launched ~May 2026) are Anthropic-format folders (SKILL.md + supporting files), personal or workspace-shared, invoked by slash command or auto-applied when relevant; prebuilt starter skills (Accessibility, Redesign, SEO review, Skill Creator) seed the library so it never starts empty.
- All of it is MCP-manageable (set_project_knowledge, workspace skill CRUD), so agents can maintain their own configuration.
- Relevant to charter requirement 5: Lovable also models cost quietness (credits language, no per-action price tags inline), already our pricing canon's reference.

## 5. Synthesis: the converged grammar of agent management, 2026

Four products, one emergent structure. Any 2026-literate user now expects:

1. **Standing context** (always-on): workspace knowledge / project knowledge / CLAUDE.md / project instructions. Two scopes: workspace-wide and per-product.
2. **Procedures** (on-demand): skills / playbooks. Folder + markdown + editable trigger description; versioned; shareable; with usage analytics at the high end (Devin).
3. **Tool grants** (consent): one catalog, one-click OAuth, scoped permissions, per-agent or per-session toggles, org allowlist + read-only mode + revoke at the high end.
4. **Autonomy dial** (per task or per tool): auto / soft gate with timeout / hard approval, plus standing consents ("always allow X") so no question is asked twice. Supaprod's `auto`/`confirm`/`review` tool approval modes already match this; they need a visible home.
5. **A learning loop**: the agent proposes updates to 1 and 2 from what just happened; the human edits/accepts/dismisses. Only Devin ships this today. It is the single highest-leverage pattern in this teardown because it is also Supaprod's positioning ("learns your product") made tangible in the UI.

## What Supaprod should steal

Concrete, implementable, in priority order:

1. **One Agents home, roster-first.** A single destination (inside Settings or the Brain area per the ≤4-destination invariant) listing all 13 agents as cards: what it does, its stage on the Spine, its tool grants, its approval mode, its skills, last activity. Click an agent to open its full config room. Do NOT copy Devin's three disconnected library pages; the roster is the index. Tabs or sections within: Knowledge, Skills, Tools, Autonomy.
2. **Editable trigger descriptions on every knowledge item and skill.** Devin's Trigger Description = Claude's skill description = the industry mechanism. Each Supaprod knowledge/instruction item is `when` (one editable sentence) + `content` (a few sentences) + `scope` (workspace / product / agent / stage). Retrieval stays legible and correctable forever; nothing encodes model limits (decade-proof).
3. **The post-run knowledge suggestion loop.** After any mission, gate rejection, or user correction, the responsible agent proposes a knowledge/skill update as a card (in the Thread or the agent's config room): editable, save or dismiss, with a diff when updating an existing item. This converts corrections into compounding configuration and is the visible face of "learns your product." Wire it to the existing Memory/Brain layer.
4. **The 30-second soft gate with a hard-gate toggle.** Adopt Devin's calibrated-friction dial for plan-shaped moments: agent presents plan with citations into real evidence (our receipts/traces), auto-proceeds after a visible countdown unless the user pauses or has set "wait for my approval" for that stage or mission type. Approvals tray remains the single pull point; the countdown lives on the gate card itself.
5. **Typed intervention states, not generic "needs attention."** Session/mission states name the need: "Awaiting your decision", "Plan ready", "Blocked on access", "Spec ready for review". The Spine and Approvals tray reuse the same state vocabulary. Steal Devin's status-label pattern wholesale.
6. **Standing consents.** Every approval prompt offers "always allow for this agent / this product"; recorded consents are listed and revocable in the agent's config room. Never ask the same question twice.
7. **One tool catalog with governance built in.** A single Connect surface (extends the existing connector registry in `src/lib/connectors/`) per Engine-Room doctrine: one-click OAuth, per-agent grant matrix (which agent may use which connection), read-only mode per grant, expiry warnings, surfaced connection errors, disconnect = revoke. Copy Claude's one-directory collapse: never split skills/connectors/integrations into parallel catalogs.
8. **Playbook anatomy for Supaprod procedures/templates**: Overview, Steps, Definition of Done (postconditions), Advice, **Forbidden Actions**, Required From You. Forbidden Actions and Required From You are the two sections users actually need and no one else surfaces prominently.
9. **Usage receipts on configuration.** Each skill/knowledge item shows times-used, last-used, and outcomes touched (Devin's playbook table). Dead config becomes visible and prunable; useful config earns trust.
10. **Two-layer instructions with visible scoping**: Workspace knowledge (always-on, all products) + Product knowledge (this product), stated in Lovable's exact doctrine ("knowledge is always included; skills load on demand"). Seed both at onboarding from Discover-stage findings so the library is never empty (Lovable's prebuilt-skills trick).
11. **Memory scope as a visible choice** (ChatGPT pattern): when a workspace or product is shared, show what knowledge crosses the boundary and default to sealed.
12. **Searchable machine activity.** Devin searches past sessions across shell/file/browser/git/MCP events. Supaprod's traces should be reachable through the one Composer ("what did the build agent change in the pricing page last week") rather than a filter-farm dashboard, per charter requirement 4.

## GAP lines

GAP: Supaprod has no post-run learning loop surface. The engine records memory/decisions, but nothing proposes editable knowledge/skill updates back to the user after a correction or gate rejection; "learns your product" is currently invisible in the UI.
GAP: Tool approval modes (`auto`/`confirm`/`review` in the agent loop registry) exist in code but have no user-facing management surface; users cannot see or change an agent's autonomy level anywhere.
GAP: No per-agent tool-grant matrix. Connections are workspace/user-level via the connector registry; there is no way to say "the Learn agent may read PostHog but the Build agent may not," and no read-only grant mode.
GAP: No standing-consent memory in approvals. Every gate asks fresh; there is no "always allow this action for this agent" with a revocable consent ledger.
GAP: No knowledge/skill objects with editable trigger descriptions. Brain/Memory stores facts, but users cannot author scoped instructions with legible retrieval conditions the way every 2026 competitor allows.
GAP: No usage analytics on configuration. Nothing shows whether a given instruction, template, or knowledge item has ever influenced a run.
GAP: No typed mission-state vocabulary shared across surfaces. "Waiting on you" is one undifferentiated bucket; Devin's named states (plan ready, blocked on access, awaiting decision) do not exist.

## Source list

- Devin docs: Knowledge (docs.devin.ai/product-guides/knowledge), Playbooks (docs.devin.ai/product-guides/creating-playbooks), Interactive Planning (docs.devin.ai/work-with-devin/interactive-planning), 2026 release notes (docs.devin.ai/release-notes/2026), Devin MCP (docs.devin.ai/work-with-devin/devin-mcp)
- Cognition blog: "Devin can now Manage Devins", "How Cognition Uses Devin to Build Devin"
- OpenAI Help Center: "Projects in ChatGPT" (help.openai.com/en/articles/10169521)
- Lovable: docs.lovable.dev/features/knowledge, lovable.dev/blog/introducing-skills, "9 ways to use Workspace Knowledge"
- Claude: claude.ai/directory unification coverage (March 2026), connectors directory counts (June-July 2026 directories), Claude Code skills/commands merge (2026 docs)
