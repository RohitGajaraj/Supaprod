# Lane A: The Lexicon and the Rename Ledger

> _Created: 2026-07-28 · Last updated: 2026-08-03_

> Rebuild sweep, 2026-07-28. Founder mandate: full rename authority, nothing protected.
> Scope: the authenticated app. Every ruling here was written against strings read in the
> repo this session; every quoted string is verbatim from the file and line named beside it.

**Precedence.** On any disagreement about WHAT A THING IS CALLED, this file wins over
`docs/conventions/ui-voice.md`, `src/lib/agent-vocabulary.ts`, `src/lib/nav-model.ts`, and every
older strategy or design doc. It does not override `docs/conventions/humanized-output.md`
(formatting law) or `docs/design/archive/tempo-v5.md` (visual contract). Where it overrides something, section 9
says so explicitly.

**Two hard laws that make everything else fall out.**

1. **One concept, one word.** If two words can name the same thing, one of them is deleted from
   the product. Not deprecated. Deleted.
2. **Labels and identifiers may diverge, and the divergence is written down.** A DB column, a
   query key, and a route slug are engineering facts. A label is a promise to a user. They are
   allowed to disagree, but only on the ledger in section 7, never by accident.

---

## 0. What is actually wrong right now (measured, not asserted)

The brief listed six collisions. Reading the code found fourteen more. The count that matters:
**twenty concepts have more than one live name, and four words each carry three different
meanings.** That is why the app reads as half-finished. It is not a polish problem.

The worst one is not in the brief. It is this:

| Live in the UI today | Live in the catalog today | File |
| --- | --- | --- |
| `"The Critic flagged this bet. Your call moves it out of backlog."` | agent `critic` is displayed as **"Challenge"** | `src/routes/_authenticated.today.tsx:695` vs `src/lib/agent-vocabulary.ts:251` |
| `"No Critic review yet."` | same | `_authenticated.today.tsx:128` |
| `"A dozen is enough for Scout to find the first themes."` | agent `discovery-scout` is displayed as **"Watch"** | today onboarding copy vs `agent-vocabulary.ts:202` |
| `"Get the Critic's take"`, `"Run the Critic"`, `"Critic verdict"`, `"Critic confidence"`, `"Open Critic review"` (20+ strings) | same | across `src/components/**` |

`AGENT_FACES` (Scout, Strategist, Critic, Scribe, Chief of Staff) was kept "for back-compat" at
`agent-vocabulary.ts:66` and never actually retired, while `SPECIALIST_CATALOG` renamed the same
agents to verbs. **Both name sets are rendering to users right now.** A user reading Today sees
"Critic"; the same user opening the roster sees "Challenge". They are the same agent.

That single defect is worth more than the six listed collisions combined, and it is fixed in
section 6.

---

## 1. THE LEXICON

One user-facing word per concept. The definition is what the tooltip, the empty state, and the
onboarding line all derive from. **Banned beside it** means: these words must not appear anywhere
in the app as a name for this thing, including in generated output.

### 1.1 The container words

| Concept | The one word | Definition (one sentence) | Banned beside it |
| --- | --- | --- | --- |
| The company account everyone shares | **Workspace** | The shared account your team, your connected sources, and your billing live in. | org, organization, team, tenant, account (account survives in billing only) |
| The thing you are building | **Product** | One product inside the workspace, with its own loop, brief, and repo. | project, app, initiative, workstream |
| The whole seven-stage cycle | **The loop** | Discover, Decide, Plan, Design, Build, Ship, Learn, entered and left at any point. | pipeline, workflow, journey, lifecycle, arc, funnel, process |
| One position in the loop | **Stage** | One of the seven named steps, which is a state a piece of work is in, not necessarily a page. | station, phase, step (step is taken, see 1.3), node, gate (gate is taken, see 1.4) |

`station` is a mechanism word that currently leaks to users through
`<AgentRelay variant="station" station="decide" />` (`_authenticated.decide.tsx:43`). It is deleted
from the vocabulary entirely, code included.

### 1.2 The seven stages

The seven words are fixed. Each is a **verb** (see the naming grammar in section 6.2: stages are
verbs, agents are nouns, which is what makes them structurally uncollidable).

| # | Word | Definition (one sentence) | Banned beside it |
| --- | --- | --- | --- |
| 01 | **Discover** | Connected sources are read and what changed becomes evidence you can act on. | Sense, Listen, Intake, Research, Signals (as a stage name) |
| 02 | **Decide** | Ranked bets are kept or killed, and this is the one thing the product will never do for you. | Triage, Prioritize, Judge, Queue, Review (as a stage name) |
| 03 | **Plan** | A kept bet becomes a cited spec and a sequenced piece of work. | Define, Spec, Scope, Groom, Refine |
| 04 | **Design** | The spec gets your brand and a look you can see before anyone writes code. | UX, Prototype (as a stage name), Mockup, Brand (as a stage name) |
| 05 | **Build** | Agents write the change in your repo, test it, and open the pull request. | Studio, Builder, Engineering, Code, Develop, Execute |
| 06 | **Ship** | The change goes from preview to production and the world is told what changed. | Release (as a stage name), Deploy, Launch, Publish (as a stage name) |
| 07 | **Learn** | The outcome comes back, gets a verdict, and the brain keeps it. | Measure, Reflect, Retro, Analyze, Impact |

**Stage 01 has two live names today.** `nav-model.ts:82` says `label: "Discover"`.
`agent-vocabulary.ts:113` says `name: "Sense"` for the same position, and that string renders in
the agent relay. **Discover wins. "Sense" is deleted.**

**Stage 03 has two live names today.** `agent-vocabulary.ts:124` declares
`define: { id: "define", name: "Plan" }`, an id and a label that disagree.
**Plan wins. "Define" is deleted, id included.**

### 1.3 The work objects, in the order a user meets them

| Concept | The one word | Definition (one sentence) | Banned beside it |
| --- | --- | --- | --- |
| One piece of evidence from a connected source | **Signal** | One thing a source said, captured with where it came from and when. | insight, mention, item, event, datapoint, feedback |
| Many signals that say the same thing | **Pattern** | A group of signals the crew found saying the same thing. | theme, cluster, topic, trend |
| Something worth doing, ranked | **Bet** | A thing worth building, with an argued case, a rank, and a stated risk. | opportunity, idea, candidate, initiative, item, ticket |
| Something waiting for your judgment | **Call** | One thing the crew has stopped on and cannot pass without you. | approval, gate, request, task, ask, item, todo |
| The record of a judgment you made | **Decision** | What you decided, when, why, and what it cost or produced. | approval record, verdict (verdict is taken, see 1.5), ruling, log entry |
| The written definition of a bet | **Spec** | The document that says what to build, what done means, and what evidence backs it. | PRD, doc, requirements, brief (brief is taken, see 1.6), ticket, story |
| A clickable rendering of a spec | **Prototype** | A working screen you can click before any production code exists. | mockup, wireframe, preview (preview is taken, see 1.3), comp, design (that is stage 04) |
| One end-to-end job the crew runs | **Run** | One piece of work the crew took from goal to pull request, with a number, a title, and a receipt for every step. | mission, changeset, session, job, build (as a noun), swarm, arc, execution |
| One action inside a run | **Step** | One thing one agent did inside a run. | task (task is taken), action, node, turn, tool call |
| The code a run produced | **Change** | The diff the run wrote, and the pull request it opened. | changeset, patch, commit set, revision, PR (in copy; PR is fine in a link label) |
| The staged version before production | **Preview** | The change running somewhere real that is not production yet. | staging, sandbox, draft deploy |
| A change that reached production | **Release** | A change that is live, with what shipped written down. | deployment, ship (that is stage 06), rollout, launch |
| What happened after the release | **Outcome** | What the release actually did to the number the bet promised to move. | impact, result, metric, KPI, effect |

**"Run" replaces five live nouns.** Today the same object is called a mission
(`_authenticated.build.index.tsx:266` `"Mission running."`, `:645` `"Mission deleted."`), a
changeset (`studio_changesets`), a studio session (`queryKey: ["studio-session"]`), an agent run
(`agent_runs`), and a build. **The DB already has the right word**: `agent_runs`, `loop_runs`,
`job_runs`, `prompt_runs`, `eval_runs`, `playbook_runs`. This is the one case where the schema was
right and the UI was wrong.

Display form: `Run 41 · Fix the checkout redirect`. The number gives it identity in a list, the
goal gives it meaning. A run that fails is still a run, which is why "change" and "build" both
over-promise and lose.

### 1.4 The judgment vocabulary (the product's whole thesis, so it gets its own table)

| Concept | The one word | Definition | Banned beside it |
| --- | --- | --- | --- |
| The thing waiting | **Call** | See 1.3. | approval, gate, decision (before you act) |
| Saying yes | **Approve** | You accept it and the crew continues. | accept, confirm, OK, ship it, sign off, LGTM |
| Saying not like this | **Send back** | You reject the attempt but keep the work, with a reason attached. | reject, request changes, decline (that is the third verb), deny, needs work |
| Saying no, permanently | **Decline** | You kill the work; it goes to the brain as a decision not to do it. | kill, drop, dismiss, archive, cancel, no |
| Pushing it to later | **Snooze** | You defer the call without judging it; it comes back. | later, defer, remind me, set aside, not now |
| The rule that made it stop | **House rule** | A standing rule you wrote that decides when the crew must stop and ask you. | guardrail, policy, gate, permission, constraint |

**Three judgment verbs, one escape hatch.** Today there are four peers on the card:
`okLabel: "Approve"`, `noLabel: "Send back"`, `laterLabel: "Later"` (`_authenticated.today.tsx:804-812`)
and a separate `TOAST_REJECT = "Rejected. Noted for next time."` (`_authenticated.approvals.tsx:41`).
Four verbs on one card is one too many, and "Rejected" and "Send back" are two words for the same
act. Ruling: **Approve / Send back / Decline** are the three judgment verbs, rendered as peers.
**Snooze** is not a peer; it is a secondary control, because deferring is not judging.
"Rejected" is deleted; the send-back toast reads `"Sent back. Nothing runs without you."`, which
is already the better string that exists at `_authenticated.today.tsx:616`.

**A Call becomes a Decision the moment you act on it.** That single sentence is the whole model
and it is teachable in one line. It also kills "approval" and "gate" from user copy in one move.

### 1.5 The record layer

| Concept | The one word | Definition | Banned beside it |
| --- | --- | --- | --- |
| The record of one agent action | **Receipt** | What one agent did, what it read, what it produced, and what it cost. | trace, log, audit entry, event, span, proof |
| The chain every receipt is written to | **The Ledger** | The tamper-evident chain every receipt is written to, always singular, always "the Ledger". | audit log, trust ledger, paper trail, chain, history |
| The crew's judgment on something | **Verdict** | One agent's stated call on a thing, with its confidence and its reasoning. | assessment, score, rating, opinion, take |
| What the workspace learned | **Learning** | A thing that turned out to be true or false here, written so it changes the next call. | lesson, retro, insight, note, memo |

`/traces` (`Every run`), `/trust-ledger` (`meta title: "Ledger · Supaprod"`), the Pulse tab labelled
`"Paper trail"` and the tab labelled `"What just happened"` (`src/lib/engine-room-glance.ts:190-210`)
are four names for two things. Resolved: a **Receipt** is the unit, **the Ledger** is the chain,
and both live inside Pulse. "Trace" survives as an engineer word inside Pulse only.

### 1.6 The always-on layers

| Concept | The one word | Definition | Banned beside it |
| --- | --- | --- | --- |
| What the company knows | **Brain** | Every call the team made, what it became, and what it now tells you before you decide again. | memory, knowledge, knowledge base, recall, second brain, wiki, vault, storage |
| How the machine is running | **Pulse** | Spend, quality, safety, and the Ledger, in one place, for when you want to look under the hood. | Engine Room, ops, observability, console, command center, admin (admin is a different thing), monitoring |
| Everything the loop made | **Library** | Every finished thing the loop produced, promoted here on purpose. | artifacts, assets, files, output, deliverables, docs (docs is a tab inside Brain) |
| The named agents | **Crew** | The thirteen named agents that run the loop. | fleet, swarm, cast, roster, staff, team, squad, bots |
| One named agent | **Agent** | One named member of the crew with one job and one verb. | bot, assistant, copilot, worker, specialist, AI, model |
| A conversation with the crew | **Thread** | One conversation with the crew, kept, searchable, and citable. | chat, conversation, session, DM, message thread |
| Asking the crew something | **Ask** | Putting a question to the crew from anywhere in the app. | chat, query, prompt, search (search is a different thing) |
| The daily landing | **Today** | What needs you now, and what happened while you were gone. | home, dashboard, inbox, briefing, start, cockpit, overview, feed |
| The morning summary | **Brief** | The one-screen read of what changed overnight and what it means. | digest, standup, summary, report, recap |

**"The brain is never storage"** is founder canon and it constrains the definition above: the Brain
sentence must always contain a forward-looking clause ("tells you before you decide again"). Any
Brain copy that reads like a filing cabinet is wrong, even if every word is on this list.

### 1.7 Setup and control words

| Concept | The one word | Definition | Banned beside it |
| --- | --- | --- | --- |
| A place data comes from | **Source** | A tool you connected that the crew reads from. | integration, connector, provider, channel, feed, app |
| The act of connecting one | **Connect** | Giving the crew read access to a source. | integrate, link, authorize, install, sync (sync is a different thing) |
| How much rope an agent has | **Autonomy** | How far an agent may go before it has to stop and ask you. | permissions, trust level, mode, access, freedom |
| A repeatable saved sequence | **Playbook** | A sequence the crew ran before that worked, saved so it can run again. | template, recipe, macro, workflow, automation |
| Something that runs on a schedule | **Routine** | Something the crew does on a schedule without being asked. | cron, job, automation, scheduled task, sweep |
| The unit of spend | **Credit** | What one unit of crew work costs you. | token, usage, quota, points, compute |

### 1.8 Words that exist only inside Pulse

These are correct technical words for the audience that opens Pulse. They are **banned everywhere
else in the app**, including in generated output, tooltips, and toasts.

`trace` · `eval` · `guardrail` · `drift` · `changeset` · `gate` · `station` (deleted entirely, see 1.1)
· `orchestrator` · `fan-out` · `token` · `latency` · `p95` · `suite` · `span` · `checkpoint`

---

## 2. Every collision, and the ruling

The six from the brief, then the fourteen found by reading code.

### From the brief

| # | The collision | Ruling | Why |
| --- | --- | --- | --- |
| C1 | Nav label **"Pulse"** · route **`/engine-room`** · code and docs **"Engine Room"** | **Pulse.** Route becomes `/pulse`. "Engine Room" is deleted as a surface name in code, copy, and route. `docs/conventions/engine-room-doctrine.md` keeps its filename because it names a doctrine (calm front, deep engine), not a screen. | A user cannot talk about a thing whose URL and label disagree. Pulse is one word, already the label, and names the outcome (the vital signs) not the machine. |
| C2 | Route **`/artifacts`** · prior ruling **"Library"** | **Library.** Route `/library`. "Artifacts" is deleted from user copy; `artifact_versions` and `artifact_lineage` stay in the DB. | "Artifacts" is engineer register on a PM surface. The objection to "Library" was that it implies accumulation, but accumulation is a behavior you fix with an entry gate, not with a word. Nothing lands in the Library automatically; a thing is promoted into it. |
| C3 | **Studio** vs **Build** vs **Builder** | **Build** for the stage (verb), **Run** for the object (noun). Every TypeScript-level `studio*` identifier migrates because the rebuild rewrites those files anyway. Every DB-level one freezes. Split in section 7. | The rebuild makes TS renames free and DB renames still expensive. That asymmetry, not sentiment, decides which frozen identifiers are acceptable. |
| C4 | **`/brain`** · **`/memory`** · **`/knowledge`** · Settings **"Memory"** | **Brain.** `/memory` and `/knowledge` are deleted, not redirected. The Settings section `{ id: "memory", label: "Memory" }` (`src/lib/settings-sections.ts:76`) is **deleted**, not renamed. | Settings already contains the confession: `"Memory lives in Brain"` renders at `_authenticated.settings.tsx:482` while a section literally labelled "Memory" sits four lines above it in the same nav. A footnote apologizing for a duplicate is not a fix. Delete the duplicate. |
| C5 | **Missions / Builds / Runs / Changesets / Sessions** | **Run.** One noun. See 1.3. | Five nouns, one object. The DB already agrees with the winner. |
| C6 | Stage-shaped destinations that own nothing (`/decide`, `/learn`, `/ship`) | **The seven stage words survive; the seven destinations are not this lane's call.** A stage word is a state, and it is legal for a stage word to label a state that has no page of its own. `/decide` is 70 lines of header wrapped around the component `/discover?tab=queue` already renders, so it owns no vocabulary either way. | Naming cannot fix a structural problem. What naming CAN do is stop pretending: the loop is seven words, not seven URLs, and the lexicon does not require it to be seven URLs. Handed to Lane B/C, section 8. |

### Found by reading the code

| # | The collision | Evidence | Ruling |
| --- | --- | --- | --- |
| C7 | **Two live name sets for the same agents.** `AGENT_FACES` names (Scout, Strategist, Critic, Scribe) render in 20+ strings while `SPECIALIST_CATALOG` renames the same agents to verbs (Watch, Prioritize, Challenge, Draft). | `agent-vocabulary.ts:66-84` vs `:197-362`; live strings at `_authenticated.today.tsx:128,695` and across `src/components/**` | **Delete `AGENT_FACES` and the `AgentFace` type entirely.** The thirteen names in section 6 are the only agent names. This is the single largest naming defect in the app. |
| C8 | **"Sense" vs "Discover"** for stage 01 | `agent-vocabulary.ts:113` vs `nav-model.ts:82` | Discover. Delete "Sense" including the station id. |
| C9 | **"Define" vs "Plan"** for stage 03, id and label disagree in the same object literal | `agent-vocabulary.ts:124` | Plan. Delete "Define" including the id. |
| C10 | **"Plan" means three things**: loop stage 03, the Settings group `"Plan & Usage"`, and its subsection `{ id: "billing", label: "Plan" }`, plus the agent named "Plan" | `nav-model.ts:98`, `settings-sections.ts:101-105`, `agent-vocabulary.ts:277` | Stage 03 keeps **Plan**. Settings group becomes **Billing**, subsection becomes **Subscription**. The agent becomes **Planner** (noun, section 6). |
| C11 | **"Design" means four things**: loop stage 04, the agent displayed "Design", the Settings section "Brand" backed by `design_memory`, and the approval kind `design_gate` | `nav-model.ts:106`, `agent-vocabulary.ts:290`, `settings-sections.ts:74`, `_authenticated.approvals.tsx:38` | Stage 04 keeps **Design**. Agent becomes **Designer**. Settings keeps **Brand**. `design_gate` frozen (never rendered raw). |
| C12 | **"Review" means three things**: the agent displayed "Review", the tool autonomy mode `review`, and `"Reopened for review."` | `agent-vocabulary.ts:315`, `loop.server.ts` approval modes, `_authenticated.approvals.tsx:37` | Agent becomes **Reviewer**. The autonomy mode is relabelled (not renamed in code, see 7.3). "Reopened for review" becomes `"Reopened. It is back in your calls."` |
| C13 | **"Call" vs "approval" vs "gate" vs "decision"** | `queryKey: ["needs-you"]` and `aria-label="Loading your calls"` (`today.tsx:1291`) vs route `/approvals` vs `aria-label="Filter approvals"` vs Pulse tab `"Your decisions"` vs Brain tab `"Decisions"` vs tables `agent_approvals` + `human_gate_events` | Resolved in 1.4. **Call** before you act, **Decision** after. |
| C14 | **Signal / Insight / Opportunity / Theme / Bet**, five nouns for two things | tables `signals`, `insights`, `opportunities`, `themes`; `nav-model.ts:86` `"Signals become ranked bets."`; `_authenticated.decide.tsx:36` `"Every ranked bet"`; `OpportunityQueue.tsx` `"Delete this opportunity?"` | **Signal**, **Pattern**, **Bet**. "Opportunity", "Insight" and "Theme" deleted from copy; the three tables freeze. |
| C15 | **Spec vs PRD** | route `/prds`, tables `prds`/`prd_scaffolds`/`prd_flows`, agent slug `prd-writer`; UI already says spec: `"Pick an approved spec"`, `"No spec"`, `"Spec approved. The decision is logged."` (`build.index.tsx:421,441`, `today.tsx:661`) | **Spec.** "PRD" is deleted from every user-facing string. Route `/prds` deleted. Tables freeze. The UI already won this argument; only the route and the schema lagged. |
| C16 | **Six words for the group of agents**: fleet, swarm, cast, crew, roster, staff | `/fleet`, `/swarm`, `agent-fleet.ts`, `agent-vocabulary.ts:54` `AgentTier = "cast" \| "crew"`, `settings-sections.ts:84` `{ id: "staff", label: "Roster" }` | **Crew.** All five others deleted. `"cast"` and the engine-only `"crew"` tier are re-cut as `"crew"` and `"machinery"` (section 6.4). |
| C17 | **Six landing surfaces**: `/today`, `/inbox`, `/briefing`, `/start`, `/cockpit`, plus `/notifications` | route files under `src/routes/` | **Today** is the one word and the one landing. The others are deleted as names. The morning summary is a **Brief**, a thing ON Today, never a destination. |
| C18 | **Thread vs chat vs conversation vs copilot** | `/chat`, `/threads`, tables `conversations`, `copilot_messages`, `agent_messages`, plus `AskPanel` | Object is a **Thread**, action is **Ask**. "Chat", "conversation", "copilot", "assistant" deleted from copy. Tables freeze. |
| C19 | **Product vs Project.** The DB table is `projects` and it means products. | `src/hooks/use-workspace.tsx:95` carries the confession in a comment: `.from("projects") // the physical table name is projects (represents products)` | **Product** in every label. `projects` frozen forever. Documented here so nobody "corrects" the UI back toward the schema. |
| C20 | **"Memory" appears in Settings and in Brain and in run toasts.** `"Mission archived. Its decisions stay in Memory."` | `build.index.tsx:635-645` | Toast becomes `"Run archived. Its decisions stay in the Brain."` Settings section deleted (C4). |

---

## 3. Words banned product-wide

Beyond the per-concept bans in section 1. These never appear in a label, a tooltip, a toast, an
empty state, or anything the platform generates.

**Vague category words** (founder taste, binding): `operating system` · `chatbot` · `copilot` ·
bare `AI` · bare `agents` · `platform` · `solution` · `workspace intelligence` · `AI-powered`.
Fix by qualifying: not "agents", but "agents that ship real code".

**Mechanism words outside Pulse**: the list in 1.8.

**Deleted names** (any appearance is a bug): `Cadence` as the product name · `Engine Room` ·
`Artifacts` · `Mission` · `Studio` · `Builder` · `Knowledge` · `Memory` (as a surface) ·
`Opportunity` · `PRD` · `Fleet` · `Swarm` · `Cast` · `Roster` · `Cockpit` · `Inbox` · `Briefing` ·
`Sense` · `Define` · `Station` · `Watch` · `Listen` · `Prioritize` · `Challenge` · `Draft` ·
`Announce` · `Measure` · `Reactor` · `Archivist`.

**Protected, not the brand**: the generic English word `cadence` ("release cadence") and the DB
`cadence` schedule-frequency column stay untouched.

**Formatting law, unchanged and non-negotiable** (`docs/conventions/humanized-output.md`): no em
dash, no en dash, no invisible Unicode, no AI-cliche phrasing, in both authored and generated
text. This lane changes no part of that.

---

## 4. THE RENAME LEDGER: destinations

| Current | New | Where it appears | Identifier |
| --- | --- | --- | --- |
| `/engine-room` label "Pulse" | **`/pulse`** label "Pulse" | `nav-model.ts:144-149`, `_authenticated.engine-room.tsx`, `ENGINE_ROOM_PATHS`, `engineRoomActive()`, `src/components/engine-room/*`, `src/lib/engine-room-glance.ts` | **Migrate.** Route, file names, component dir `src/components/pulse/`, `PULSE_PATHS`, `pulseActive()`. One redirect `/engine-room` to `/pulse` for one release. |
| `/artifacts` label "Artifacts" | **`/library`** label "Library" | `_authenticated.artifacts.tsx`, `ArtifactsSurface.tsx`, `artifacts.functions.ts`, `"Rename artifact"` / `"Delete this artifact?"` dialog copy | **Migrate** the route, the component, and all copy. **Freeze** `artifact_versions`, `artifact_lineage`. One redirect for one release. |
| `/missions`, `/missions/$missionId` | **deleted** | `_authenticated.missions.index.tsx`, `_authenticated.missions.$missionId.tsx` | **Delete.** No redirect. |
| `/studio`, `/studio/$missionId` | **deleted** | `_authenticated.studio.index.tsx`, `_authenticated.studio.$missionId.tsx` | **Delete.** No redirect. |
| `/memory`, `/knowledge` | **deleted** | `_authenticated.memory.tsx` (a pure redirect stub), `_authenticated.knowledge.tsx` | **Delete.** The redirect stub has served its purpose. |
| `/prds`, `/prds/$id`, `/discovery` | **deleted** | three route files | **Delete.** Spec detail lives inside the Plan surface. |
| `/govern`, `/trust-ledger` | **deleted** | redirect stubs listed in `ENGINE_ROOM_PATHS` | **Delete.** Both already only redirect into Pulse. |
| `/fleet`, `/swarm`, `/delegate`, `/cockpit`, `/inbox`, `/briefing`, `/start`, `/observe` | **deleted** | eight route files | **Delete.** Every one is a second name for a surface that already exists. |
| `/traces`, `/traces/$traceId` | **inside `/pulse?room=record`** | two route files | **Migrate.** Receipt detail is a Pulse view, not a top-level route. |
| `/build`, `/build/$missionId` | **`/build`, `/build/$runId`** | `_authenticated.build.$missionId.tsx` | **Migrate** the param name. |
| `/decide`, `/learn`, `/ship` | **Lane B/C call** | see C6 | Vocabulary is settled either way. |

---

## 5. THE RENAME LEDGER: strings in the app

Verbatim current string on the left. Every one was read this session.

| Current string | File:line | New string |
| --- | --- | --- |
| `"Mission running."` | `build.index.tsx:266` | `"Run in progress."` |
| `"Mission running · 1 approval waits for you."` | `build.index.tsx:268` | `"Run in progress. One call needs you."` |
| `"Mission title (optional)"` | `build.index.tsx:372` | `"Name this run (optional)"` |
| `"Mission archived. Its decisions stay in Memory."` | `build.index.tsx:635` | `"Run archived. Its decisions stay in the Brain."` |
| `"Mission deleted. Its decisions stay in Memory."` | `build.index.tsx:645` | `"Run deleted. Its decisions stay in the Brain."` |
| `"Delete mission"` | `build.index.tsx:982` | `"Delete run"` |
| `{ id: "missions", label: "Missions" }` | `build.index.tsx:736` | `{ id: "runs", label: "Runs" }` |
| `{ id: "agent", label: "By Agent" }` | `build.index.tsx:737` | `{ id: "agent", label: "By agent" }` (sentence case, ui-voice) |
| `"Give the agents a goal"` | `build.index.tsx:315` | `"Give the crew a goal"` |
| `"Plain language in. The agents plan the steps and run them."` | `build.index.tsx:316` | `"Plain language in. The crew plans the steps and runs them."` |
| `"Pick an approved spec"` | `build.index.tsx:421` | unchanged (already correct) |
| `"Approved. The agent is unblocked."` | `today.tsx:615` | `"Approved. The crew is moving again."` |
| `"Waiting on your call. No Critic review yet."` | `today.tsx:128` | `"Waiting on your call. Critic has not weighed in yet."` |
| `"The Critic flagged this bet. Your call moves it out of backlog."` | `today.tsx:695` | `"Critic flagged this bet. Your call moves it forward."` |
| `"Dropped. The Critic's concern stands."` | `today.tsx:695` | `"Declined. Critic's concern stands."` |
| `"Reopened for review. The decision is back in your queue."` | `today.tsx:712` | `"Reopened. It is back in your calls."` |
| `"Design approved. This spec can now dispatch to Build."` | `today.tsx:678`, `approvals.tsx:38` | `"Design approved. This spec can go to Build."` |
| `"Kept. It moves to Now on the roadmap."` | `today.tsx:695` | unchanged (already correct) |
| `"Sent back. Nothing runs without you."` | `today.tsx:616` | unchanged (this is the model string) |
| `"Set aside. It returns in 24 hours."` | `today.tsx:647` | `"Snoozed. It comes back in 24 hours."` |
| `laterLabel: "Later"` | `today.tsx:812` | `snoozeLabel: "Snooze"`, demoted out of the button row |
| `TOAST_REJECT = "Rejected. Noted for next time."` | `approvals.tsx:41` | `"Sent back. Noted for next time."` |
| `memory_candidate: "Saved to workspace memory."` | `approvals.tsx:32` | `"Saved to the Brain."` |
| `"Agents are working; we will bring you the next decision."` | `approvals.tsx:187` | `"The crew is working. Your next call will land here."` |
| `aria-label="Filter approvals"` | `src/components/approvals/*` | `aria-label="Filter calls"` |
| `"Delete this opportunity?"` / `"Opportunity deleted"` / `"Delete opportunity"` | `OpportunityQueue.tsx` | `"Delete this bet?"` / `"Bet deleted"` / `"Delete bet"` |
| `"Loading opportunities"` | `OpportunityQueue.tsx` | `"Loading bets"` |
| `"A dozen is enough for Scout to find the first themes."` | today onboarding | `"A dozen is enough for Scout to find the first patterns."` |
| `"Signals to import, one per line"` | discover import | unchanged (already correct) |
| `tagline: "Signals become ranked bets."` | `nav-model.ts:86` | unchanged (already correct) |
| `tagline: "Agents build and open the PR."` | `nav-model.ts:118` | `"The crew writes the change and opens the PR."` |
| `tagline: "The machine's vital signs: spend, quality, safety, record."` | `nav-model.ts:148` | `"Spend, quality, safety, and every receipt."` |
| `label: "Roster"` (id `staff`) | `settings-sections.ts:84` | `label: "Crew"` (id `crew`) |
| `label: "Memory"` (id `memory`) | `settings-sections.ts:76` | **deleted** |
| `"Looking for Memory? It lives in ..."` / `"Memory lives in Brain"` | `settings.tsx:197,482` | **deleted** (the section it apologizes for is gone) |
| `{ id: "plan", label: "Plan & Usage" }` | `settings-sections.ts:101` | `{ id: "billing", label: "Billing" }` |
| `{ id: "billing", label: "Plan" }` | `settings-sections.ts:105` | `{ id: "subscription", label: "Subscription" }` |
| `{ id: "connections", label: "Connections & Data" }` | `settings-sections.ts:91` | `{ id: "sources", label: "Sources & data" }` |
| `{ id: "interop", label: "Agent access" }` | `settings-sections.ts:96` | `{ id: "interop", label: "Outside access" }` (this is access FOR outside agents, not access BY ours) |
| `head title "Pulse · Supaprod"` on `/engine-room` | `engine-room.tsx:38` | unchanged label, new route |
| `"Could not open Pulse."` | `engine-room.tsx:57` | unchanged (already correct) |
| Brain tab `"Docs"` desc mentions `"ship history"` | `brain.tsx:151` | keep tab, drop "ship history" (releases live in the Library) |
| Pulse tab `"Paper trail"` | `engine-room-glance.ts:203` | `"Receipts"` |
| Pulse tab `"Every run"` (id `traces`) | `engine-room-glance.ts:210` | `"Every run"` unchanged, id migrates to `runs` |
| Pulse tab `"Your decisions"` (id `approvals`) | `engine-room-glance.ts:216` | `"Your decisions"` unchanged, id migrates to `decisions` |
| `"Its instructions"` (prompts) / `"Stress tests"` (proof) | `engine-room-glance.ts:135,141` | unchanged (both are good, Pulse register) |

---

## 6. THE CREW

### 6.1 The naming decision: role, not persona, and never both

**Agents are named by role. There are no personas, no mascots, no invented names.**

The mechanism that makes it work is a grammar rule, not a style preference:

> **Stages are verbs. Agents are nouns. Never the same word class.**

That is why the current system broke. Nine of the thirteen agents are currently named with bare
verbs (`Watch`, `Listen`, `Prioritize`, `Challenge`, `Draft`, `Plan`, `Design`, `Review`,
`Announce`, `Measure`), which puts them in direct collision with two stage names and with the app's
own button vocabulary. "Plan is planning." "Design approved" (the gate, or the agent?). "Review
flagged the diff" reads as an instruction. A tenth, `Chief of Staff`, is a job title, so the
register is not even internally consistent.

Under the noun rule the collisions are structurally impossible: `Plan` the stage and `Planner` the
agent can never be confused, and neither can `Design` and `Designer`.

**Personas were considered and rejected.** A persona layer ("Iris, the critic") buys warmth and
costs three things this product cannot pay: it adds a second name per agent to learn, it invites
cuteness into a surface whose whole claim is receipts and judgment, and it makes generated output
read like a character is talking to you when the honest frame is that a system did work and left a
record. The founder's own convention file already lists "Chief of Staff" among "our nouns" and bans
mascot register by implication. Role names, used as proper names, get the warmth without the cost.

### 6.2 The grammar

| Rule | Right | Wrong |
| --- | --- | --- |
| No article, ever. Agent names are proper names. | `Critic flagged this bet.` | `The Critic flagged this bet.` |
| Present continuous for live work. | `Engineer is writing the change.` | `Engineer writes the change.` |
| Past simple for a receipt. | `Reviewer checked the diff.` | `The diff has been checked.` |
| Never "agent" plus the name. | `Ask Critic.` | `Ask the Critic agent.` |
| Never a bare verb as the subject. | `Planner broke it into work.` | `Plan broke it into work.` |
| The crew acts, not "the agents". | `The crew is working.` | `Agents are working.` |

Fixing the article alone repairs a live inconsistency: the app currently ships both
`"Run the Critic"` and `"Critic re-ran"` in the same product.

### 6.3 The thirteen

Twelve seats across the seven stages, plus one conductor who has no seat.

| Seat | Name | Owns this verb, exclusively | One line | DB slug (frozen) | Was called |
| --- | --- | --- | --- | --- | --- |
| 01 | **Scout** | watches | Watches your connected sources and surfaces what changed. | `discovery-scout` | Watch |
| 01 | **Researcher** | digs | Digs into one question across the web and your workspace. | `researcher` | Research |
| 01 | **Listener** | clusters | Clusters what customers are saying into patterns. | `customer-insights` | Listen |
| 02 | **Strategist** | ranks | Ranks the bets by what they are worth against what they cost. | `strategist` | Prioritize |
| 02 | **Critic** | challenges | Red-teams the call before you commit to it. | `critic` | Challenge |
| 03 | **Writer** | drafts | Turns the decision into a spec with its evidence cited. | `prd-writer` | Draft |
| 03 | **Planner** | breaks down | Breaks the spec into work you could actually sequence. | `sprint-planner` | Plan |
| 04 | **Designer** | maps | Maps the experience and renders it through your brand. | `ux-architect` | Design |
| 05 | **Engineer** | writes | Writes the change in your codebase. | `builder` | Engineer |
| 05 | **Reviewer** | checks | Checks the diff against the spec before it ships. | `qa` | Review |
| 06 | **Publisher** | announces | Announces what shipped: notes, changelog, the post. | `release` | Announce |
| 07 | **Analyst** | measures | Reads the outcome against the bet and hands it to the Brain. | `data-analyst` | Measure |
| n/a | **Chief of Staff** | routes | Runs the loop and brings you the calls that need you. | `orchestrator` | Chief of Staff |

Four names survive unchanged: **Critic**, **Strategist**, **Engineer**, **Chief of Staff**. That is
deliberate. Critic and Strategist are already the most established agent names in the product
(Critic alone appears in 20+ live strings), and the 2026-06-18 pass that renamed them to verbs was
the mistake, not the thing to preserve.

### 6.4 What is no longer a crew member

`Reactor` and `Archivist` (`agent-vocabulary.ts:365-388`, tier `crew`) are **not agents and get no
names**. They are machinery: an event router and a memory consolidator. In Pulse they appear as
mechanisms in lowercase (`event routing`, `memory consolidation`). Two names removed from the world
for free.

The tier type changes accordingly:

```
AgentTier = "cast" | "crew"      ->   CrewTier = "crew" | "machinery"
```

### 6.5 What makes thirteen a crew and not a list

Five mechanisms. Each is a build rule, not a sentiment.

1. **You never meet thirteen.** The roster is only ever sliced by stage, so you see one to three at
   a time. Thirteen is a fact about the system, never a screen. **A "meet the crew" grid is banned.**
2. **The seat is the memory hook, not the name.** In any list context an agent is written
   `05 Engineer`. The user already learned the number line from the loop; the name attaches to a
   number they know rather than to nothing.
3. **One verb each, owned exclusively.** The verb column in 6.3 is a uniqueness constraint. No two
   agents may share a verb, in a working line, a receipt, or generated copy. The verb is the
   agent's fingerprint: you can identify who acted from the sentence alone.
4. **Introduced by receipt, never by bio.** An agent's first appearance to any user is
   `Critic flagged this bet` with the receipt attached, never a card explaining what Critic does.
   You learn who someone is from what they just did for you.
5. **Fixed glyph and hue, never re-skinned.** Recognition should be pre-verbal. The hue and glyph
   pair is part of the name and may not be changed for visual reasons. Carry the existing values
   from `SPECIALIST_CATALOG` unchanged.

**And the cap: the crew is thirteen.** Adding a fourteenth requires deleting one. That constraint is
what keeps it a crew and not a directory, and it is the reason `SPECIALIST_CATALOG`'s current
"adding a specialist is one entry" growth story is retired.

---

## 7. THE RENAME LEDGER: internal identifiers

### 7.1 Migrate. The rebuild rewrites these files anyway, so the rename is free.

| Current | New | Kind |
| --- | --- | --- |
| `src/lib/agent-vocabulary.ts` | `src/lib/crew.ts` | module |
| `AGENT_FACES`, `AgentFace`, `AGENT_FACE_ORDER`, `agentFace()`, `agentVerb()` | **deleted** | the C7 fix |
| `AgentStation` | `LoopStage` | type |
| station id `sense` | `discover` | enum value |
| station id `define` | `plan` | enum value |
| `AGENT_STATIONS` | `LOOP_STAGES` | const |
| `castByStation()` | `crewAtStage()` | function |
| `castEntries()` / `crewEntries()` | `crew()` / `machinery()` | function |
| `AgentTier = "cast" \| "crew"` | `CrewTier = "crew" \| "machinery"` | type |
| `SPECIALIST_CATALOG` | `CREW` | const |
| `<AgentRelay variant="station" station=... />` | `<CrewRelay variant="stage" stage=... />` | component + props |
| `src/lib/agent-fleet.ts`, `agent-fleet.functions.ts` | `src/lib/crew.functions.ts` | module |
| `src/components/studio/` | `src/components/build/` | directory |
| `src/lib/studio.functions.ts` | `src/lib/run.functions.ts` | module |
| `StudioCi`, `StudioRunDetail`, `getStudioSession`, `studio_session` | `BuildChecks`, `RunDetail`, `getRun` | exported types + functions |
| `queryKey: ["studio-session"]`, `["studio-sessions"]` | `["run"]`, `["runs"]` | query key |
| `src/lib/mission-vocabulary.ts` | `src/lib/run-vocabulary.ts` | module |
| `MissionStateId`, `MissionStateKind` | `RunStateId`, `RunStateKind` | type |
| `src/components/mission/` | `src/components/run/` | directory |
| `$missionId` route param | `$runId` | route param |
| `src/lib/engine-room-glance.ts`, `src/components/engine-room/` | `src/lib/pulse.ts`, `src/components/pulse/` | module + directory |
| `ENGINE_ROOM_PATHS`, `engineRoomActive()` | `PULSE_PATHS`, `pulseActive()` | const + function |
| `ROOM_TAB_META` view id `traces` | `runs` | id |
| `ROOM_TAB_META` view id `approvals` | `decisions` | id |
| settings section id `staff` | `crew` | id |
| settings section id `memory` | **deleted** | id |
| settings group id `plan` | `billing` | id |
| settings section id `billing` (label "Plan") | `subscription` | id |
| `queryKey: ["needs-you"]` | `["calls"]` | query key |
| `queryKey: ["approvals"]` | `["calls"]` (same cache, one key) | query key |
| `queryKey: ["learnings"]` | unchanged (already correct) | query key |
| `NavItemDef.group?: "workflow"` | **deleted** (`zone: "loop"` already carries it) | dead field |

### 7.2 Freeze. Acceptable debt. Never rendered, migration cost is real, no user can see it.

| Frozen identifier | Reads as | Why acceptable |
| --- | --- | --- |
| `projects` table | Product | Renaming a table this central touches every server function and every RLS policy for zero user benefit. Documented in `use-workspace.tsx:95` and now here. |
| `missions`, `mission_steps` | Run, Step | The run header row and its steps. Column-level rename with no user surface. |
| `studio_changesets`, `studio_changes`, `studio_changeset_revisions`, `studio_changeset_constraints` | Change | The established rename convention from Builder to Studio to Build already froze these twice. |
| `builder_file_claims` | (internal) | Never rendered. |
| `agents.slug` values (`discovery-scout`, `customer-insights`, `prd-writer`, `sprint-planner`, `ux-architect`, `builder`, `qa`, `release`, `data-analyst`, `orchestrator`) | the thirteen names | The display mapping in `crew.ts` is the entire point of having a display mapping. |
| `prds`, `prd_scaffolds`, `prd_flows` | Spec | Column names only. |
| `opportunities`, `themes`, `insights` | Bet, Pattern | Three tables, one UI word each, no leak. |
| `agent_approvals`, `human_gate_events`, `approval_snoozes` | Call, Decision, Snooze | Never rendered raw. |
| `agent_memory`, `memory_candidates`, `bump_memory_importance` | Brain | The memory mechanism is real; only the surface name was wrong. |
| `design_memory`, approval kind `design_gate` | Brand, Design approval | Never rendered raw. |
| `ledger_seals`, `admin_audit_log`, `workspace_audit_log` | Ledger, Receipt | Correct engineering names. |
| `conversations`, `copilot_messages`, `agent_messages` | Thread | `copilot` is a banned user word, but this column is invisible. |
| `daily_briefs`, `workspace_briefs` | Brief | Already correct. |
| `cadence` schedule-frequency column | (the English word) | **Explicitly protected.** Not the brand. Never touch it. |
| `CallSurface 'studio'` | (Prompt Studio cost bucket) | Predates both renames and is unrelated to the Build surface. |
| tool autonomy mode values `auto` / `confirm` / `review` | see 7.3 | Enum change across `agent_tool_modes` for a label fix is not worth it. |

### 7.3 Freeze the value, change the label. The clearest case of legitimate divergence.

The tool autonomy modes are stored as `auto` / `confirm` / `review` and enforced in
`src/lib/ai/loop.server.ts`. The value `review` collides with the agent name **Reviewer** and with
the verb "review" used elsewhere. The DB value freezes; the label diverges:

| Stored value | Label the user reads |
| --- | --- |
| `auto` | Runs on its own |
| `confirm` | Asks me first |
| `review` | I check the output |

This is the template for every divergence: the identifier is an engineering fact, the label is a
promise, and the mapping lives in exactly one place.

### 7.4 Freeze is NOT acceptable here. These must actually migrate before any user sees the rebuild.

Four items. Each one leaks a dead name onto a screen.

| Item | Why it must migrate | Fix |
| --- | --- | --- |
| **`agents.name` seeded values** in `seed_default_agents`, `seed_orchestrator_agent`, `seed_demo_workspace`, `seed_sample_workspace` | `agentDisplayName()` falls back to the DB `name` column for any slug not in the catalog (`agent-vocabulary.ts:691`). A stale seed value renders directly to a user. | Re-seed all four functions with the section 6.3 names. |
| **Free-text rows containing dead names**: `announcements`, `changelog_entries`, `learnings`, `decisions.rationale`, `daily_briefs` | These render verbatim. Any row saying "Cadence", "mission", "Engine Room", "Watch", "Challenge" is a visible ghost. | One migration sweep over the five tables. Historical narrative describing what happened before a rename stays accurate; product-name references get corrected. |
| **`agent_tools` / `TOOL_REGISTRY` ids surfaced through `ACTION_LABEL`** | `ACTION_LABEL` (`agent-vocabulary.ts:759`) maps tool ids to captions and falls through to the literal `"working"` for anything unmapped. Four `studio.*` ids are mapped; a fifth would leak. | Keep the id frozen, but make the fallback total: an unmapped tool renders `"working"`, never the raw id. Already true; add the test. |
| **Demo workspace contents** (`seed_demo_workspace`, `clone_demo_workspace`, `admin_reset_demo_workspace`) | This is what every demo and screen recording shows. Dead nouns here are the most visible ones in the company. | Re-seed with the section 1 lexicon. |

---

## 8. Handoff

**To the lane that owns structure and IA (destinations, layers, what has a URL).**
The lexicon is deliberately agnostic about destination count. Two things it does fix for you:
a stage word is legal as a **state** even where it has no page, and `/decide` currently has zero
queries of its own, so collapsing it costs no vocabulary. If you collapse `/decide`, `/ship` and
`/learn`, the words Decide, Ship and Learn survive as state labels on the loop and lose nothing.
The nine nav rows in `nav-model.ts` and the two-shell split at `_authenticated.tsx:157-180` are
yours; the words in them are settled here.

**To the lane that owns voice, tone, and display copy.**
Section 1 gives you the noun for everything; section 5 gives you the exact strings to replace.
What is NOT settled here and is yours: the in-app tagline per surface, the empty-state sentences,
the onboarding sequence copy, the button microcopy beyond the judgment triad, and the loading and
error register. Two constraints from this lane you cannot override: the agent grammar in 6.2 (no
article, verb ownership) and the ban list in section 3.

**Shared and unowned.** The three-layer positioning nouns are fixed here as **director**
(Chief of Staff plus the crew that tells you what to build), **the loop** (the lifecycle), and
**Brain** (what compounds). Nobody should invent a fourth. The outward-facing tagline is investor
canon and is not this sweep's to change.

---

## 9. What this file overrides

| Document | What is overridden |
| --- | --- |
| `src/lib/agent-vocabulary.ts` header comment, "THE VOICE GRAMMAR (PC-28)" | The claim that surfaces are the D-family (Discover, Decide, Define, Design). "Define" is deleted. The claim that the catalog "is the single source of truth and the one growable axis" is overridden by the crew cap of thirteen in 6.5. |
| `src/lib/agent-vocabulary.ts:16` "Hard rule: DB slugs are NEVER renamed" | Upheld for slugs, but narrowed: the rule never covered seeded `agents.name` values, which must migrate (7.4). |
| `src/lib/agent-vocabulary.ts:9` and `:54` "CREW: engine-only mechanisms" | "Crew" now means the thirteen user-facing agents. The engine-only tier is renamed "machinery" and loses its names. |
| `src/lib/nav-model.ts:24-29` | The comment that "Pulse keeps the `/engine-room` route" is reversed. The route migrates to `/pulse`. |
| `docs/conventions/ui-voice.md` | Additive only, no reversal. The length budgets, the buzzword denylist and the confirm pattern all stand. This file adds the noun dictionary that file never had, and adds three bans it does not carry: mechanism words outside Pulse, the dead-name list, and vague category words. |
| `docs/conventions/humanized-output.md` | Nothing. The formatting law is unchanged and non-negotiable. |
| `docs/features/obsidian-port.md` and the 2026-06-18 AGENT-EXP pass | The verb-named agent roster (Watch, Listen, Prioritize, Challenge, Draft, Announce, Measure) is retired in full. |

---

## 10. The one-page card

Pin this. It is the whole lexicon compressed.

```
CONTAINERS   Workspace > Product > the loop > stage
THE LOOP     Discover  Decide  Plan  Design  Build  Ship  Learn        (verbs)
THE CREW     Scout Researcher Listener | Strategist Critic | Writer
             Planner | Designer | Engineer Reviewer | Publisher |
             Analyst | Chief of Staff                                  (nouns)
OBJECTS      Signal -> Pattern -> Bet -> Call -> Decision -> Spec ->
             Prototype -> Run -> Step -> Change -> Preview -> Release
             -> Outcome
JUDGMENT     Approve · Send back · Decline          (Snooze is not a peer)
RECORD       Receipt -> the Ledger.  Verdict.  Learning.
LAYERS       Today · Brain · Pulse · Library · Thread (Ask)
DEAD         Cadence(brand) Engine Room Artifacts Mission Studio Builder
             Knowledge Memory(surface) Opportunity PRD Fleet Swarm Cast
             Roster Cockpit Inbox Briefing Sense Define Station
             Watch Listen Prioritize Challenge Draft Announce Measure
             Reactor Archivist
```
