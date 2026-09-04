# Shell C - The Reference Preconditions

> _Created: 2026-07-29 · Last updated: 2026-08-03_

**Stream C of the shell question.** What is actually true of the products the founder named, what
preconditions make a conversational shell work, and whether Supaprod meets them.

> Written 2026-07-28. Every repo claim below was read or run against live code this session and is
> cited by file and line. Every external claim was checked against the web this session, because the
> named products all changed shape between January and July 2026 and my training knowledge of them
> was stale in ways that turned out to be decisive. Sources at the end.
>
> Position: I was assigned to establish the preconditions rigorously and test Supaprod against them
> honestly. I have not softened a failure to protect the proposal, and I have not manufactured one
> to defeat it.

---

## 0. THE FINDING, IN ONE PARAGRAPH

The founder's premise is that Lovable, v0, Bolt, Replit, Cursor, Claude and ChatGPT have collapsed
into one simple screen. That was true of most of them in 2025. **It is not true of any of them in
July 2026.** Every single one of the seven, in the last nine months, added a second navigable
structure over the chat: Cursor 3's Agents Window (2026-04-02), Claude Code desktop's parallel
session sidebar (2026-04-14), ChatGPT's Scheduled sidebar (2026-06-17) and Agents sidebar
(2026-07-09), Lovable's Workspace Insights, Claude's artifacts library sidebar, Replit's Tools dock.
Not inside the chat. Over it. They added it at the exact moment their work became parallel and
long-running. **The conversational shell is the interior of one unit of work; it has never been the
architecture of a product.** Supaprod begins with thirteen agents, hour-scale runs paused on human
judgment, up to five products per account, and a human whose job is deciding - which is to say it
begins *past* the point where all seven references abandoned the single screen. Adopting Lovable's
2024 shape in 2026 means adopting the shape Lovable itself has outgrown. Twelve preconditions are
extracted below; Supaprod passes zero outright, can buy four with a design decision, and fails five
*on purpose* - and the five it fails on purpose are the ones that make it a product OS rather than a
code generator.

---

## 1. WHAT I READ

**In this repo, this session:**

| Fact | Where |
| --- | --- |
| 726 server functions across 147 domain modules | `grep -rn createServerFn src/lib` = 726; `ls src/lib/*.functions.ts` = 147 |
| Chat is 1186 lines with real SSE, intent classification, mission dispatch, `@slug` direct dispatch | `src/routes/api/chat.ts`, classifier at `:378`, direct dispatch at `:367` |
| **Chat contains zero references to approvals** | `grep -n "approval\|agent_approvals\|waiting_approval" src/routes/api/chat.ts` → no matches |
| A gated tool queues an approval and the run **pauses** | `src/lib/ai/loop.server.ts:69-71`, `:1137` (insert into `agent_approvals`), `:1155`, `:1178` "Paused - waiting on operator" |
| Paused runs are resumed by pg_cron every minute; 2-minute staleness window; 20-minute in-flight cap | `src/routes/api/public/hooks/resume-runs.ts:34`, `:38`, `:50` |
| A mission may take up to 16 hops | `src/lib/ai/governing-decision.ts:24` `MAX_HOPS = 16` |
| Thirteen agents (12 specialists + orchestrator as Chief of Staff); 18 slugs seeded | `docs/planning/rebuild-2026-07/agents/agents-a-crew-identity.md:99-120`; `supabase/migrations/*agent*` |
| Tool registry assembled from ~46 declared tools | `src/lib/ai/tools/registry.server.ts:3177` |
| Multi-product is **monetized**: free 2, pro 3, max 5, team/enterprise unlimited | `src/lib/entitlements.ts:194` |
| The product cap is account-wide **across workspaces** | `src/lib/limits.functions.ts:162-210` |
| Conversations expose exactly five functions: list (50), get, create, delete, rename | `src/lib/conversations.functions.ts:5,17,63,90,99` - **no search, no pin, no archive, no filter** |
| The 454-line `CommandPalette` has **zero importers**; only `GotoShortcuts` survives | `src/components/supaprod/CommandPalette.tsx:83` vs `:419`; sole import at `src/routes/_authenticated.tsx:4` |
| The palette was retired **deliberately** and its search was not carried forward | `src/routes/_authenticated.tsx:204`: "The retired CommandPalette and AskPanel components stay in the tree source but are unmounted (Addendum 1.1 rule 8)" |
| Generated mockups are real HTML rendered in an iframe via `srcDoc` | `design-scaffold.functions.ts:245`/`:268`; rendered `faces.tsx:1283`, `PreviewPanel.tsx:171`, `DesignScaffoldPanel.tsx:272`, `p.$slug.tsx:141` |
| Hunk-level accept and reject already works, with optimistic concurrency | `src/lib/studio.functions.ts:1816` `applyStagedHunkSelection`, `:1872` `rejectStagedFile`, `:974` `steerStudioSession` |
| Settings is 3433 lines, 23 declared sections | `src/routes/_authenticated.settings.tsx`; `src/lib/settings-sections.ts` |
| The room is already one destination per product, two URL shapes | `src/lib/room-url.ts:1-25` |
| A `PortfolioProduct` type and query already exist | `src/lib/projects.functions.ts:82` |

**Prior repo research I built on rather than repeated:**
`docs/planning/front-end-reimagining/research/teardown-lovable-v0.md` (verified 2026-07-19),
`.../threads-and-artifacts.md` (the threads/artifacts gap register),
`docs/planning/rebuild-2026-07/ia/FINAL-ia.md` (the ONE ROOM ruling),
`.../interaction/ix-a-direct-manipulation.md` (§1.2's verified code inventory),
`.../agents/agents-a-crew-identity.md`, `.../language/FINAL-language.md`,
`docs/planning/front-end-reimagining/problem-statement.md` (both rejections).

**What I could not verify:** live row counts. The Supabase MCP returned `Unauthorized` this session,
so every quantitative claim below comes from code and migrations, not from production data.

---

## 2. THE SEVEN REFERENCES, AS THEY ACTUALLY ARE IN JULY 2026

Each answered against the seven assigned questions. Where my prior knowledge was wrong, the
correction is marked **[CORRECTED]**.

### 2.1 Lovable

| Question | Answer |
| --- | --- |
| **Persistent artifact** | One app per project. One. The project is durable; chats are its history. |
| **One or many** | Many projects per workspace, many workspaces per account. **[CORRECTED]** Enterprise workspaces reach *thousands* of projects. |
| **What the preview shows** | The running app, re-rendering as the agent works. Plus a code editor, a diff view, and a Details view stepping through the run. |
| **State that is not the artifact** | Cloud backend (DB, auth, storage, region), connectors and agent permissions, workspace + project Knowledge (10k chars each), version history with screenshots, deploy/domain, credits and billing, Security Center. |
| **How history is resumed** | From the **dashboard**, not the chat. Projects list, recent work, version history grouped by date with named/bookmarked stable points and one-click restore. |
| **Where configuration goes** | Settings → Knowledge, Settings → Plans & credit usage, Connectors → Cloud → "Manage my agent's permissions". Never the chat. |
| **Parallel / long-running work** | Explicitly **serialized**. The prompt queue stacks new prompts above the input; you can pause/resume the queue, reorder, edit, remove, repeat up to 50×. Lovable's answer to concurrency is to refuse it inside the room. |
| **Many projects** | A **dashboard** ("your project hub"), a workspace switcher in the top-left, and **Workspace Insights** - a stat-card governance surface showing every project, published apps, and high-review-priority flags. |

**The correction that matters.** Lovable is not "everything through one chat window". Lovable is
*a dashboard of projects → enter one project → chat beside preview*. The chat+preview shell is the
**interior of a single project**, and every cross-project, cross-time and configuration question
lives outside it in a conventional, navigable surface. The founder's own sentence already concedes
half of this ("you still have a Settings page"); the evidence says the concession is much larger
than a settings page.

### 2.2 v0 by Vercel

| Question | Answer |
| --- | --- |
| **Persistent artifact** | One app per **project**. Many chats contribute to one project; the project owns deployment, hosting, domains, env vars. Chats are cheap and disposable. |
| **What the preview shows** | The running app, with a code/preview toggle and (since Feb 2026) a VS Code-style editor, Git integration, and a database panel. |
| **State that is not the artifact** | Project settings, env vars, domains, Git branches/PRs, saved Instructions, the usage page. |
| **How history is resumed** | Chats under a project; Git branch-per-chat; deploy/preview URLs. A list, again. |
| **Where configuration goes** | Instructions are created from the **plus button in the prompt bar** and saved to the account, applied as toggleable checked chips. This is the one genuine case of configuration living *at* the input - and note it is a chip row, not a sentence you type. |
| **Parallel / long-running work** | Not in v0. Vercel's answer to long-running agent work is elsewhere entirely: **Vercel Agent lives in the dashboard sidebar**, and durable long-running execution is Vercel Workflows. |
| **Many projects** | Projects list in the dashboard. |

### 2.3 Bolt (bolt.new / StackBlitz)

| Question | Answer |
| --- | --- |
| **Persistent artifact** | One WebContainer project. |
| **What the preview shows** | **[CORRECTED]** Not chat+preview. **File tree, terminal, live preview and diff view all visible simultaneously.** Bolt is an IDE with a chat in it, not a chat with a preview. |
| **State that is not the artifact** | Package installs, DB provisioning, deploy targets, tokens/billing. |
| **How history is resumed** | Project list; the file tree is the durable state. |
| **Parallel / long-running work** | Not represented. Work is seconds-to-minutes, in-browser, synchronous. |
| **Many projects** | A dashboard. |

Bolt is the clearest disproof of the "one simple screen" reading. It is the most artifact-pure
product in the set, and it chose to show *four* structures at once.

### 2.4 Replit

| Question | Answer |
| --- | --- |
| **Persistent artifact** | A Repl: a filesystem, a running app, and a shell. **Three durable things, not one.** |
| **What the preview shows** | The running app. With App Testing on, the preview shows the **agent's own cursor** clicking through the app to verify it. |
| **State that is not the artifact** | Secrets, Deployments, the database, package state, the Tools dock, billing/checkpoints. |
| **How history is resumed** | The Repl list, plus Agent checkpoints. |
| **Parallel / long-running work** | **Multiple shell instances for parallel tasks**, opened from the Tools dock. Agent 3 runs autonomously for extended periods and reports back. |
| **Many projects** | A dashboard of Repls. |

Replit is the closest structural analog to Supaprod in one respect: the durable state is plural
(files + process + shell), and its answer was a **dock of tools**, i.e. exactly the "depth rail"
mechanism `FINAL-ia.md` §2.2 already specifies.

### 2.5 Cursor

| Question | Answer |
| --- | --- |
| **Persistent artifact** | Many files in one repo - and since Cursor 3, **multiple repos in one session** (multi-root workspaces, May 2026). |
| **What the preview shows** | There is no preview. There is an **editor** and a **unified diff view**. The artifact is text you read, not a thing that runs. |
| **State that is not the artifact** | Rules, models, project configuration, worktrees, plans. |
| **How history is resumed** | **[CORRECTED, decisively]** The **Agents Window** (Cursor 3, 2026-04-02): a standalone, agent-first, full-screen interface where "all your agents appear in one sidebar - local agents, cloud agents, and the ones you kicked off from mobile, web, the desktop app, Slack, GitHub, and Linear." |
| **Parallel / long-running work** | Up to 8 simultaneous agents, each in its own **git worktree**; `/multitask` spawns async subagents; long-running work moves to **cloud agents which produce demos and screenshots for verification**. |
| **Many projects** | The Agents Window is **multi-workspace by default**. |

**Cursor is the counter-example the founder's proposal must survive, and it does not.** Cursor is the
product in the set whose problem most resembles Supaprod's - many artifacts, many concurrent agents,
long-running work, a human whose job is judging diffs. Its answer, shipped four months ago, was to
*leave the single screen entirely* and build an agent-first window whose primary structure is a
sidebar of running work.

### 2.6 Claude - artifacts, and Claude Code

**Artifacts:**

| Question | Answer |
| --- | --- |
| **Persistent artifact** | One artifact per preview pane; many artifacts per account. |
| **What the preview shows** | The rendered artifact (HTML/React/document). Live Artifacts refresh with current data on reopen; up to 20MB persistent storage per artifact. |
| **State that is not the artifact** | Project instructions and knowledge, memory, published/share state, view counts. |
| **How history is resumed** | **[CORRECTED]** From a dedicated **artifacts library in the sidebar** - a grid of cards with name, last-edited date, view count and Published tag. Explicitly: artifacts "persist, and are findable **without scrolling through conversation history**". |
| **Many projects** | Projects group chats, files and instructions; "Add to project" from the artifact's kebab menu. |

**Claude Code:**

| Question | Answer |
| --- | --- |
| **Persistent artifact** | The repo. Not previewed - edited. |
| **What the preview shows** | Since the April 2026 desktop redesign: draggable panes for terminal, file editor, diff viewer, and an HTML/PDF/local-server preview. Again: *panes*, plural, arrangeable. |
| **State that is not the artifact** | `CLAUDE.md` at three scopes, `settings.json`, `.claude/` (skills, agents, hooks, commands), MCP config, permissions. **Layered files on disk, never conversation.** |
| **How history is resumed** | `claude --resume` opens **an interactive picker** listing sessions with summaries, message counts, git branch and timestamps, searchable. Sessions never expire. Transcripts are JSONL per project directory under `~/.claude/projects/`, with a global `history.jsonl` index. |
| **Parallel / long-running work** | **[CORRECTED, decisively]** The 2026-04-14 desktop redesign shifted "the unit of work from single sessions to **workspaces containing multiple parallel sessions**". A sidebar shows "all active and recent sessions **grouped by project, filterable by status or environment**", `Cmd/Ctrl+1-9` switches between them, and sessions **auto-archive when their PR merges or closes**. Web sessions run on isolated cloud VMs, launched in parallel. |
| **Many projects** | The sidebar groups by project; sessions from different repos are visually distinct. |

The founder named "Claude Code web" as an exemplar of simplicity. Claude Code's actual 2026 answer to
its own success is a project-grouped, status-filterable, numerically-keyed **session manager**, plus a
side-chat mechanism so a lateral question does not pollute the main thread.

### 2.7 ChatGPT

| Question | Answer |
| --- | --- |
| **Persistent artifact** | **None.** This is the one product in the set with no durable artifact and no preview. Canvas is transient; the durable units are Projects and memory. |
| **What the preview shows** | Nothing, by default. |
| **State that is not the artifact** | Project instructions, uploaded files, Project Memory, account memory, the Plugins directory, connectors, workspace-agent definitions (tools, skills, memory, schedules, governance). |
| **How history is resumed** | The sidebar list. Known failure mode, documented in this repo's own prior research: "a flat recency list is the known failure mode (ChatGPT); important threads scroll away" (`threads-and-artifacts.md:20`). |
| **Parallel / long-running work** | **[CORRECTED]** ChatGPT Work (2026-07-09) "stays with a multi-step project **for hours**". Its representation is not the chat: a **Scheduled sidebar** (relaunched 2026-06-17) and an **Agents sidebar** for named, persistent workspace agents with defined tools, skills, memory, schedules and governance. |
| **Many projects** | Projects, flat, no nesting, no drag-between, no bulk operations. |

ChatGPT is the purest conversational shell in the set, and it is *also* the product whose history
navigation this repo already recorded as the known-bad reference. That is not a coincidence: with no
artifact and no manager, the thread is the only structure, and it does not scale.

---

## 3. THE 2026 CORRECTION, STATED PLAINLY

| Product | The manager it added | When |
| --- | --- | --- |
| Cursor 2.0 | Multi-agent sidebar, 8 parallel agents, git-worktree isolation | late 2025 → 2026 |
| **Cursor 3** | **The Agents Window** - standalone agent-first interface, all agents across all repos in one sidebar, multi-workspace by default | **2026-04-02** |
| **Claude Code desktop** | **Parallel sessions in one window**; sidebar grouped by project, filterable by status/environment; `Cmd+1-9`; auto-archive on PR merge; draggable code/terminal/preview/diff panes | **2026-04-14** |
| Claude.ai | Artifacts library sidebar (findable without scrolling chat history) | 2026 |
| **ChatGPT** | **Scheduled sidebar**; **Agents sidebar** for persistent workspace agents | **2026-06-17 / 2026-07-09** |
| Lovable | Workspace Insights (govern thousands of projects); dashboard + workspace switcher | 2026 |
| Vercel | Agent in the **dashboard sidebar**, not in v0's chat | 2026 |
| Replit | Tools dock; multiple parallel shells | 2026 |

Seven for seven. All within nine months. The trigger in every case is the same pair of conditions:
**work became parallel, and work stopped finishing while you watched.**

The generalization, which is the load-bearing claim of this document:

> **A conversational shell is the interior of one unit of work. It is not, and in 2026 nowhere is, the
> architecture of a product. The moment a product holds more than one unit of work in flight, the
> industry's unanimous answer is a manager over the shells.**

Supaprod does not approach that threshold over time. It **starts** past it.

---

## 4. THE PRECONDITIONS, AS A CHECKLIST

Twelve, extracted from what is common to all seven and from what each one did when a precondition
broke. Grouped by what they are about.

### Group A - the artifact

- **P1. One artifact per room.** The shell is scoped to exactly one durable object. Lovable: one app.
  v0: one project. Bolt: one container. Replit: one Repl. Claude Code: one repo per session.
- **P2. The artifact runs, and the preview shows it running.** The preview is a progress bar because
  execution is visible. Where the artifact does not run (Cursor), there is no preview at all - there
  is an editor and a diff. Nobody in the set previews a *document*.
- **P3. The cost of being wrong is low and reversible.** Version history with restore (Lovable),
  git worktrees (Cursor), checkpoints (Replit), new-version-per-edit (v0). Thinness is affordable
  because undo is cheap.

### Group B - the work

- **P4. One unit of work in flight inside the room.** Lovable enforces this with the prompt queue.
  Every product that abandoned it left the single screen to do so.
- **P5. Work completes inside one sitting.** Seconds to minutes. When it stopped fitting, each shipped
  an out-of-band representation: cloud agents with demos and screenshots (Cursor), a Scheduled sidebar
  (ChatGPT), auto-archiving sessions (Claude Code).
- **P6. One actor, or one addressable actor.** You talk to "it". Subagents exist but the user
  addresses one agent per session. Where agents became many and named (ChatGPT workspace agents), they
  got a sidebar, not a chat.
- **P7. The human's job is making, not deciding.** The loop is: I ask → it makes → I look → I ask
  again. Approval is optional and is a *cost gate* (Plan Mode, "require approval before code is
  written"), not the product's purpose.

### Group C - the boundary of the shell

- **P8. Everything that is not the artifact has a named home outside the chat.** Seven for seven.
  Nobody put configuration in the conversation.
- **P9. History is resumed from a list, not from the chat.** `claude --resume` opens a picker. Claude
  has an artifacts library. Lovable has a dashboard and versioned history. Cursor has the Agents
  Window. **"Continue where you left off" is a list feature. It has never been a chat feature.**
- **P10. Many projects are handled by a different surface than the room.** Dashboards, project hubs,
  workspace switchers, multi-workspace agent windows. No product in the set answers "many projects"
  with a chat.
- **P11. The state has one consumer.** The build state of a Lovable app has one reader. Nothing in the
  shell needs to be read by a second human on a different day for a different reason.
- **P12. The first sentence has an obvious shape.** "A todo app with add, edit and delete." Every
  product ships one-line, outcome-shaped example prompts because its domain has exactly one verb:
  *build me a thing*.

---

## 5. SUPAPROD TESTED, PRECONDITION BY PRECONDITION

Verdict key: **PASS** · **PARTIAL** · **MAKEABLE** (fails today, a design decision fixes it) ·
**FAIL-BY-DESIGN** (fails, and should keep failing).

### P1 - One artifact per room → **MAKEABLE, half-made**

Supaprod produces thirteen artifact kinds across seven stages. There is no single thing to preview,
and this is the structural asymmetry the shell question exists to resolve.

But the room is *already* per-product (`src/lib/room-url.ts:1-25`), and `FINAL-ia.md` §2.1 already
specifies one Canvas with seven faces on one `CanvasFace` contract. The weaker, satisfiable form of
P1 is: **one artifact in focus at a time, with a visible, named answer to "what is in focus?"**

The cost the founder must accept: a bare chat box has no place to put that answer. `FINAL-ia.md` §1.4
already had to invent one - the Spine's `PRODUCT` / `RUN · mission #182` mode label - precisely
because "where the product is" and "where this piece of work is" collide the moment two runs are in
flight. That label is structure the pure conversational shell does not have and cannot express.

### P2 - The artifact runs, and the preview shows it running → **PARTIAL: 2 of 7 stages**

This is the precondition worth quantifying rather than asserting.

| Stage | Runnable artifact? | Evidence |
| --- | --- | --- |
| 04 Design | **Yes** | Generated mockup HTML is real, persisted, rendered in an iframe via `srcDoc` - `design-scaffold.functions.ts:245`/`:268`, `faces.tsx:1283`, `PreviewPanel.tsx:171`, `p.$slug.tsx:141` |
| 05 Build | **Yes** | Staged changesets with hunk-level accept/reject and optimistic concurrency - `studio.functions.ts:1816`, `:1872`; mid-run steering `:974` |
| 01 Discover | No | Signals, recordings, watch lanes - evidence lists |
| 02 Decide | No | A queue of opportunities and teardown verdicts |
| 03 Plan | No | Specs, goals, roadmaps - documents |
| 06 Ship | No | Deployments, changelogs, announcements - a state and a ledger |
| 07 Learn | No | Outcomes, learnings, impact - a report |

Two stages meet Lovable's bar genuinely, at real code, today. Five do not, and a document rendered in
a pane is not a progress bar - it is a document in a pane. **The preview pane is a truthful mechanism
for 28% of this product's lifecycle.** Any proposal that presents it as the shell's organizing idea
is proposing a shell that is honest two-sevenths of the time.

### P3 - Cheap, reversible → **PARTIAL, and correctly so**

Reversibility is genuinely strong on build artifacts: `applyStagedHunkSelection` with
`expectedUpdatedAt` optimistic concurrency (`studio.functions.ts:1816`), `rejectStagedFile` (`:1872`),
`setChangesetConstraints` / `enforceTouchList` (`:1904`/`:1967`).

It is absent on everything else. This repo's own prior audit is blunt about it: "**no version history
anywhere.** `publishPrototypeFromPrd` inserts a NEW `prototypes` row per publish (re-publishing
duplicates rather than versioning); docs have only `updated_at`. No versions table, no restore, no
named stable points" (`threads-and-artifacts.md:61`).

And on the artifacts that matter most - a Bet, a Call, a Decision - cheapness is *wrong*. A Decision
is meant to bind. The precondition that lets Lovable's shell be so thin does not hold here, and
should not.

### P4 - One unit of work in flight → **FAIL-BY-DESIGN**

Missions run up to 16 hops (`governing-decision.ts:24`). Fan-out parallel exploration is a named
capability absorbed into the Decide face (`FINAL-ia.md` §2.1). Multiple missions run concurrently per
product, and the crew doctrine's entire premise is thirteen agents working.

Lovable's answer to this precondition is the prompt queue: **serialize, and show the queue.** That
answer is unavailable to Supaprod, because parallelism is not an implementation detail here - it is
the value proposition. A serialized Supaprod is a slower Supaprod with no compensating clarity.

### P5 - Completes in one sitting → **FAIL-BY-DESIGN, structurally**

The mechanism is explicit in code. A gated tool call queues an approval and **the run pauses**:
`loop.server.ts:69-71` - "the run PAUSES (status `waiting_approval`); the resume-runs sweeper
re-enters" - and `:1178` posts "Paused - waiting on operator". Resumption is a pg_cron sweep every
minute (`resume-runs.ts:34`) with a 2-minute staleness window (`:38`) and a 20-minute in-flight cap
(`:50`).

Read that carefully: **the latency is the human.** A run does not take hours because the model is
slow; it takes hours because it is waiting for a person who is in a meeting. That is a different
species of long-running work than Cursor's cloud agent or ChatGPT Work's multi-hour task, and it is
strictly harder to represent, because the thing to display is not progress - it is *a debt owed by
the user*.

No amount of shell design makes this precondition true. The only available move is to represent
waiting well, which is a manager's job, not a thread's.

### P6 - One actor → **FAIL-BY-DESIGN**

Thirteen: twelve specialists plus the orchestrator as Chief of Staff
(`agents-a-crew-identity.md:99-120`), eighteen slugs seeded in migrations. `chat.ts:367` already
implements `@slug` direct specialist dispatch - a routing affordance none of the seven references
needs, because none of them has anyone to route to.

The agent-presence doctrine in flight argues the crew must be the visible centre. A bare chat box
hides thirteen agents behind one anonymous "it", which is not simplification - it is the deletion of
the thing the language contract sells: *"You make the calls. Your crew does the work between them."*
(`FINAL-language.md`). A shell with no crew in it makes the second half of the ratified sentence
unrenderable.

### P7 - The human makes, not decides → **FAIL-BY-DESIGN, and this is the identity**

Inverted here on purpose. Ten gate kinds. One approvals count from one source, already shared by four
consumers (`FINAL-ia.md` §1.5: `["approvals","queue",workspaceId]` shared by `RoomChrome.tsx:238`,
`MissionShellView`'s NeedsYouPill, the Spine's ember nodes, and `/approvals`).

In the references, approval is an optional cost gate you can turn off. Here it is the product. This
is the precondition whose failure is the positioning, and any shell that treats deciding as an
interruption to conversation has mis-modelled the user's job.

### P8 - Non-artifact state has a home outside the chat → **PASS in intent, unshipped in fact**

726 server functions across 147 domain modules; Settings at 3433 lines and 23 sections. The homes
exist as code. `FINAL-ia.md` §2.2's home table and config overlay are exactly the document that
assigns them.

Worth naming: **this precondition is not in dispute.** The founder's own proposal concedes it in his
own sentence - *"you still have a Settings page."* The evidence says the concession has to be much
larger than a settings page: seven for seven, the references put a dashboard, a library, a session
manager, a tools dock, a knowledge surface, a connectors surface and a billing surface outside the
chat. The argument is not whether there is structure outside the conversation. It is how much.

### P9 - History resumed from a list → **FAIL TODAY, HARD. MAKEABLE, and highest value.**

`src/lib/conversations.functions.ts` exports exactly five functions: `listConversations` (limit 50),
`getConversation`, `createConversation`, `deleteConversation`, `renameConversation`. **No search. No
pin. No archive. No folder. No product filter. No unified list with mission threads.** The prior gap
register says the same (`threads-and-artifacts.md:44-50`).

And the finder that existed has been unmounted. `CommandPalette.tsx:83` - 454 lines of JUMP /
SETTINGS / ACT / RECENT / ASK / CATALOG - has **zero importers**; only `GotoShortcuts` at `:419`
survives, imported once at `_authenticated.tsx:4`. The retirement was deliberate:
`_authenticated.tsx:204` records "The retired CommandPalette and AskPanel components stay in the tree
source but are unmounted (Addendum 1.1 rule 8)". The replacement was a composer overlay. **Search was
not carried forward.** Search is, right now, unreachable in this product.

This is the sharpest finding in the document, and it cuts directly against the proposal:

> The founder's stated goal is that the user "would just be asking, typing, and continuing wherever
> they left off." **Continuing where you left off is precondition P9, and P9 is satisfied by a list in
> every one of the seven references - by a picker, a library, a dashboard, an agents window, a
> sidebar. Never by a chat.** Supaprod fails P9 worse than any other precondition, and it fails it
> *because* the last change of this kind replaced a finder with an input. Doing it again, harder,
> makes the founder's own goal less achievable, not more.

### P10 - Many projects handled elsewhere → **FAIL TODAY. MAKEABLE. And it is sold.**

`src/lib/entitlements.ts:194`:

```ts
const productLimit = tier === "free" ? 2 : tier === "pro" ? 3 : tier === "max" ? 5 : null;
```

Multi-product is a **monetized axis**, and the cap is account-wide across workspaces
(`limits.functions.ts:162-210`). A Max customer has five products. A team customer has unlimited. The
pricing page sells "Up to 3 products, pooled workspaces" (`entitlements.ts:320`).

`FINAL-ia.md` §1.1 declares exactly one destination, `/$workspaceSlug/$productSlug`, and names no
portfolio surface - though `projects.functions.ts:82` already returns a `PortfolioProduct` list, so
the query exists and the surface does not.

Lovable's answer at this scale was a dashboard, a workspace switcher, and then Workspace Insights. The
portfolio door **cannot** live inside the room, because the room *is* one product. It is definitionally
a second surface. This is the second-largest hole, and unlike P9 it is not even controversial: you
cannot ask a chat scoped to Relay what is happening in Halo.

### P11 - One consumer of state → **FAIL-BY-DESIGN**

Approvals, decisions, the receipts ledger, the Brain, share slugs and public viewers are all
workspace-scoped and multi-reader by construction. A linear private thread is the wrong container for
state that a second person reads on a different day for a different reason. That is what the ledger
and the Brain are for, and it is why `FINAL-ia.md` insists the Brain be present *at the moment of
judgment* rather than at an address.

### P12 - The first sentence has an obvious shape → **MAKEABLE, already designed**

Supaprod's domain has seven verbs, not one, which is why "type what you want" is a harder first frame
here than at Lovable. The counter is already specified: journey chips as example prompts, in v0's
exact grammar - `next? · tear down · PRD · build · land` (`FINAL-ia.md` §1.3), argued at
`teardown-lovable-v0.md:103`. This precondition is buyable and cheap.

### 5.1 Scorecard

| # | Precondition | Verdict |
| --- | --- | --- |
| P1 | One artifact per room | MAKEABLE (half-made: the CanvasFace contract + a focus label) |
| P2 | Artifact runs, preview shows it | **PARTIAL - 2 of 7 stages** |
| P3 | Cheap and reversible | PARTIAL (strong on build, absent elsewhere, wrong for decisions) |
| P4 | One unit of work in flight | **FAIL-BY-DESIGN** |
| P5 | Completes in one sitting | **FAIL-BY-DESIGN** (the human is the latency) |
| P6 | One actor | **FAIL-BY-DESIGN** (thirteen) |
| P7 | Human makes, not decides | **FAIL-BY-DESIGN** (this is the positioning) |
| P8 | Non-artifact state homed outside chat | PASS in intent; unshipped; **not in dispute** |
| P9 | History resumed from a list | **FAIL TODAY, HARD** - MAKEABLE, highest value |
| P10 | Many projects handled elsewhere | **FAIL TODAY** - MAKEABLE, and monetized |
| P11 | One consumer of state | **FAIL-BY-DESIGN** |
| P12 | Obvious first sentence | MAKEABLE, already designed |

**Zero outright passes. Four buyable. Five failed on purpose.**

---

## 6. THE FOUR THAT HURT

### 6.1 Multiple concurrent products

**What the references did:** Lovable → dashboard + workspace switcher + Workspace Insights. v0 →
projects. Cursor 3 → multi-workspace Agents Window. Claude Code → sessions grouped by project.
Every one answered with a surface that is *not* the room.

**What it costs us:** a chat scoped to one product cannot answer "what is happening across my
products", and a chat scoped to none cannot answer anything specifically. There is no third option.
`entitlements.ts:194` means this is not an edge case for a future enterprise buyer - it is the Pro
tier. The portfolio door is mandatory, it is a second surface, and pretending otherwise means a
paying customer's second product is reachable only by a URL they have to remember.

**Honest counter:** it can be small. Lovable's is a grid of cards. It does not have to be a dashboard
in the pejorative sense - but it does have to exist, and it has to be *findable*, which returns us to
P9.

### 6.2 Work that runs for hours

**What the references did:** cloud agents that produce demos and screenshots for verification
(Cursor); sessions that auto-archive when their PR merges (Claude Code); a Scheduled sidebar
(ChatGPT). All three moved the representation *out* of the conversation, because a paused thread you
are not looking at is indistinguishable from a dead one.

**What it costs us:** worse than any of them, because our long-running case is *waiting on a human*
(`loop.server.ts:69-71`). Three specific failures follow:

1. **The pause is invisible where it happens.** `chat.ts` - 1186 lines - contains **zero** references
   to approvals. A mission dispatched from the conversation that hits a gate goes silent in the
   conversation and reappears in `/approvals`. The founder's proposal would make the conversation the
   whole product while the conversation cannot narrate its own most important event.
2. **A thread cannot show state it is not looking at.** Three products, two paused runs each, and the
   only structure is a linear scrollback: the user must remember what is owed.
3. **The debt compounds silently.** Unlike a build that fails loudly, an unapproved gate simply does
   not happen. The absence of an event is the failure, and threads are bad at absences.

**This is fixable and should be fixed regardless of which shell wins:** inline approval cards in the
thread (Lovable renders its gate inline; we render ours in a different route). But note what fixing it
proves - the fix is to make the *thread* carry more structure, not less.

### 6.3 Thirteen agents rather than one

**What the references did:** ChatGPT's answer to named, persistent, differently-configured agents was
an **Agents sidebar**, not a better chat. Cursor's answer to eight agents was the **Agents Window**.

**What it costs us:** a bare chat box collapses thirteen distinguishable workers into one anonymous
"it". Three consequences:

1. The ratified in-app line - "You make the calls. **Your crew does the work between them.**" - has no
   renderer. You cannot see a crew in a text box.
2. `chat.ts:367`'s `@slug` direct dispatch is the tell: we already needed a routing syntax. A product
   that needs `@` has more than one actor, and typing `@` is a power-user affordance, not a
   ten-second-comprehension one.
3. Attribution of judgment is lost. "The Reviewer stopped at the migration and wants you"
   (`agents-a-crew-identity.md:242`) is a sentence that needs a *who*, and the who needs a face.

### 6.4 A human whose job is deciding

**What the references did:** nothing, because none of them has this problem. Approval in Lovable and
v0 is Plan Mode - an optional, cost-motivated checkpoint you can switch off. In Supaprod it is the
product.

**What it costs us:** the conversational loop is *ask → it makes → look → ask*. The deciding loop is
*it proposes → you judge → it proceeds → the judgment compounds*. These are different loops with
different needs. The deciding loop needs: a queue that persists across sessions, a count you can trust,
the evidence beside the ask, a record of what you decided and why, and the compounding of your past
judgments into future behaviour (`gate-signals.functions.ts`, currently dead code called from
nowhere).

A linear conversation gives you none of those five. It gives you one: the ask, once, in the moment you
happened to be looking.

**The sharpest way to put it:** in the references the artifact is the product and the conversation is
the interface. Here **the decision is the product**, and a conversation is a poor container for a
decision because a conversation is ordered by time and a decision queue is ordered by consequence.

---

## 7. WHY THIS IS NOT A THIRD TRIP ROUND THE LOOP

Both poles have failed in this repo:

- **Everything visible** (the 10-destination rail): "overwhelming, real learning curve, never states
  what the platform is for" (`problem-statement.md:10`).
- **Everything hidden** (the 2026-07-18 Ink shell): "felt generic (any-AI-chat-app) ... **hid the
  features (depth behind the palette read as empty)**" (`problem-statement.md:11`).

The preconditions analysis explains why both failed and why the axis is wrong. **Neither failure was
about quantity of visible surface. Both were about silence.** `FINAL-ia.md` §2.2 already names it - "hidden is not a function of depth, it is a function of silence" - and the receipts agree: the original
rail's ten rows never changed; the Ink shell's palette had no count, no key and no URL.

The proposal on the table is "hide it behind the chat, plus a Settings page." That is pole 2 with a
different door. And this repo holds the strongest possible evidence for what happens next, because it
already ran the experiment: the palette was retired in favour of an input
(`_authenticated.tsx:204`), the input shipped, **and the finding did not**. `CommandPalette.tsx:83`
has zero importers today, and search is unreachable. Depth behind a palette decayed to depth behind
nothing in under two weeks. Depth behind a chat box is the same bet with worse odds, because a chat
box has no rows at all to decay from.

---

## 8. WHAT A DESIGN DECISION CAN BUY

Ranked by value. Every one of these is worth doing whichever shell wins.

1. **P9 - give history a list.** `?pane=threads` from `FINAL-ia.md` §2.2, plus the five schema gaps
   already registered (`threads-and-artifacts.md:95-99`): `conversation_folders` + `folder_id`,
   `pinned_at` / `archived_at`, a `searchConversations` function with a messages FTS index, a unified
   listing across ask conversations and mission threads, and `source_ref` on `memory_candidates`.
   **This is literally the founder's stated goal**, it is currently the worst-served precondition, and
   it is satisfied by a list in all seven references.
2. **P10 - give the portfolio a door.** `projects.functions.ts:82` already returns
   `PortfolioProduct`. It must be outside the room and it must be reachable without typing a URL.
   Small is fine; absent is not, at 3 to 5 products on paid tiers.
3. **Make the thread carry its own gates.** Inline approval cards where the work is narrated, so
   `chat.ts` stops losing the thread of its own work. Lovable does this; we route to `/approvals`.
4. **P2 - widen the runnable set.** Two of seven stages render a real artifact today. Every stage that
   can be made *renderable rather than readable* moves the preview pane from decoration toward
   progress bar. The `srcDoc` iframe treatment already proven at `faces.tsx:1283` is the pattern.
5. **P12 - ship the journey chips.** Cheap, already designed, and it is the entire onboarding of v0.
6. **P1 - name the focus.** Whatever the shell, it must always answer "what is in hand?" The Spine's
   `PRODUCT` / `RUN · mission #182` label already does this; a bare chat box does not.

And the five that **cannot** be bought - P4, P5, P6, P7, P11 - are failures of the reference model, not
of Supaprod. Serializing work, finishing inside a sitting, having one agent, making rather than
deciding, and having one reader are the things Supaprod exists *not* to do.

---

## 9. THE CENTRAL QUESTION, ANSWERED FROM THE EVIDENCE

*What is Supaprod's preview pane a preview of?*

Not the product: there is no single thing. Not the artifact: there are thirteen kinds and five of the
seven stages produce documents, not runnable things.

The one object that is singular, always current, always relevant to the human's job, and present at
every one of the seven stages is: **the thing that is waiting on you.**

The evidence that this is the right object is not aesthetic:

- It is already the single count from a single source, shared by four consumers (`FINAL-ia.md` §1.5).
- It is already the thing that halts the machine (`loop.server.ts:69-71`).
- It exists at every stage: a signal set to accept, a bet to fund, a spec to sign, a mockup to approve,
  a diff to merge, a release to authorize, a learning to keep. Ten gate kinds cover the seven stages.
- It is the only reading of the preview pane that satisfies P1 (one thing in focus), works *with* P7
  rather than against it, and cannot be built by any competitor whose human is a maker.
- It is the only reading that makes the shell non-generic. "Chat plus a preview of your app" is
  literally the any-AI-chat-app the founder rejected. "Chat plus the thing waiting on you" is not a
  shape any of the seven has, because none of them has this user.

That reframing rescues the preview pane. It does not rescue the *pure* conversational shell, because
the four hard cases still each demand a manager: a portfolio door for many products, a waiting
representation for hour-scale work, a crew face for thirteen agents, and a persistent queue for a human
whose job is judgment. Those four are exactly what every one of the seven references built between
April and July 2026 - after they outgrew the shape the founder is proposing we adopt.

**Stream C's finding, for the deciding architect:** the founder's instinct about the *feel* is right
and the mechanism he named is one version behind. The felt simplicity of Lovable comes from scoping a
thin shell to **one unit of work** and putting a **legible manager** around it. Supaprod can have that
feel. It gets there by making the room thinner *and* making the manager honest - not by deleting the
manager. The room is already ruled (`FINAL-ia.md`); the manager is the part that is missing, and the
proof that it is missing is that search does not work, threads cannot be found, and a second product
has no door.

---

## Sources

**External, checked 2026-07-28:**

- [Cursor 3: Agents Window, Cloud Agents, and What Changed](https://www.digitalapplied.com/blog/cursor-3-agents-window-complete-guide) - Agents Window, multi-workspace, `/multitask`, worktrees, cloud agents with demos/screenshots
- [Cursor 2.0 Arrives with Multi-Agent Interface](https://www.thurrott.com/a-i/328997/cursor-2-0-arrives-with-multi-agent-interface) and [Parallel AI Agents in Cursor 2.0](https://medium.com/towards-data-engineering/parallel-ai-agents-in-cursor-2-0-a-practical-guide-e808f89cffb9) - 8 parallel agents, git-worktree isolation, sidebar
- [Claude Code Desktop Redesign: Parallel Sessions in a Single Window](https://pasqualepillitteri.it/en/news/866/claude-code-desktop-redesign-parallel-sessions) - 2026-04-14 redesign, session sidebar grouped by project, `Cmd+1-9`, draggable panes, auto-archive on PR merge, side chats
- [Claude Code Desktop Redesign guide](https://miraflow.ai/blog/claude-code-desktop-redesign-parallel-sessions-routines-workspace-guide) and [AI.cc](https://www.ai.cc/blogs/claude-code-desktop-redesign-2026-multi-session-routines-automation/) - multi-session workspace, routines
- [Manage sessions - Claude Code Docs](https://code.claude.com/docs/en/sessions) and [Claude Code History: Search and Resume](https://www.codeagentswarm.com/en/guides/claude-code-history) - `--resume` picker, JSONL transcripts per project, global `history.jsonl`, sessions never expire
- [Claude Code on the Web: Parallel Cloud Sessions](https://wmedia.es/en/tips/claude-code-cloud-sessions-from-browser) - isolated VM per session, parallel launches
- [Claude Live Artifacts: Persistent AI Workspace Guide (2026)](https://www.eigent.ai/blog/claude-live-artifacts-guide) and [What Are Claude Artifacts (2026)](https://albato.com/blog/publications/how-to-use-claude-artifacts-guide) - artifacts library sidebar, 20MB persistent storage, "findable without scrolling through conversation history", Add to project
- [Lovable Agent Mode docs](https://docs.lovable.dev/features/agent-mode) - visible tasks, Details view, prompt queue (pause/resume/reorder/repeat ×50), file diffs
- [Introducing Workspace Insights](https://lovable.dev/blog/workspace-insights-govern-your-workspace) - thousands of projects per enterprise workspace, stat-card governance surface
- [Lovable workspace docs](https://docs.lovable.dev/features/workspace) and [Lovable dashboard FAQ](https://lovable.dev/faq/guides/lovable-dashboard) - dashboard as project hub, workspace switcher top-left
- [Lovable Cloud](https://docs.lovable.dev/integrations/cloud) - backend, connectors, agent permissions, region
- [Bolt.new Review 2026](https://www.buildfastwithai.com/ai-tools/bolt-new) and [What Is Bolt.new? Complete Guide 2026](https://capacity.so/blog/what-is-bolt-new) - file tree + terminal + live preview + diff simultaneously, WebContainers
- [Replit: Introducing Agent 3](https://replit.com/blog/introducing-agent-3-our-most-autonomous-agent-yet) and [Replit terminal tutorial](https://www.rapidevelopers.com/replit-tutorial/how-to-use-replit-s-terminal-for-executing-command-line-tasks-in-a-project) - Agent pane + admin/test pane, App Testing preview with the agent's cursor, Tools dock, multiple parallel shells
- [Introducing workspace agents in ChatGPT](https://openai.com/index/introducing-workspace-agents-in-chatgpt/) and [ChatGPT Work, Explained (July 2026)](https://aitoolsreview.co.uk/insights/chatgpt-work) - Agents sidebar, persistent named agents, multi-hour tasks, plugins directory
- [ChatGPT Scheduled Tasks in 2026](https://www.usecarly.com/blog/chatgpt-scheduled-tasks/) and [ChatGPT Features 2026](https://suprmind.ai/hub/chatgpt/features/) - Scheduled sidebar relaunch 2026-06-17, Projects and Project Memory
- [Vercel Agent](https://vercel.com/blog/vercel-agent) and [Vercel Ship 2026 recap](https://vercel.com/blog/vercel-ship-2026-recap) - Agent in the dashboard sidebar; Workflows for durable long-running execution
- [v0 by Vercel: Complete Guide 2026](https://www.nxcode.io/resources/news/v0-by-vercel-complete-guide-2026) - Feb 2026 Git integration, VS Code-style editor, database, agentic workflows

**Internal, read this session:** `docs/planning/front-end-reimagining/problem-statement.md`,
`.../research/teardown-lovable-v0.md`, `.../research/threads-and-artifacts.md`,
`docs/planning/rebuild-2026-07/ia/FINAL-ia.md`, `.../interaction/ix-a-direct-manipulation.md`,
`.../agents/agents-a-crew-identity.md`, `.../language/FINAL-language.md`.

**Code read or run this session:** `src/routes/api/chat.ts`, `src/lib/ai/loop.server.ts`,
`src/routes/api/public/hooks/resume-runs.ts`, `src/lib/ai/governing-decision.ts`,
`src/lib/conversations.functions.ts`, `src/components/supaprod/CommandPalette.tsx`,
`src/routes/_authenticated.tsx`, `src/lib/studio.functions.ts`, `src/lib/entitlements.ts`,
`src/lib/limits.functions.ts`, `src/lib/room-url.ts`, `src/lib/projects.functions.ts`,
`src/lib/ai/tools/registry.server.ts`, `src/lib/settings-sections.ts`,
`src/routes/_authenticated.settings.tsx`, `src/components/mission/faces.tsx`.

**Not verified:** live production row counts. The Supabase MCP returned `Unauthorized` this session;
no claim above rests on production data.
