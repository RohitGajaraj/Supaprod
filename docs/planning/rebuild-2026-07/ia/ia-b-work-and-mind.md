# IA Direction B: TWO HALVES (Work and Mind)

> _Created: 2026-07-28 · Last updated: 2026-08-03_

> Author: principal product architect · 2026-07-28 · Rebuild 2026-07, direction B
> Status: proposal, complete. Grounded against live code this session (route files, `nav-model.ts`, `legacy-redirects.ts`, `surface-registry.ts`, `_authenticated.tsx`, `MissionShellView.tsx`, `RoomChrome.tsx`, `journeys.ts`, `journey-wiring.ts`, `loop-state.functions.ts`, `approvals-queue.functions.ts`, `knowledge-graph-view.ts`, `lineage.functions.ts`, `settings-sections.ts`, `engine-room-glance.ts`, `agent-vocabulary.ts`).

---

## 0. The thesis in one paragraph

A PM's head holds exactly two questions. **What is happening, and does it need me?** That is WORK. **What do we know, and what has it taught us?** That is MIND. Every screen in Supaprod answers one of those two, or it is not a screen, it is an object on the chrome (a switch, a policy, an operator console). The current app has ten rail rows, four top-bar doors, seven loop pages, an engine room with four rooms, and two live shells, and none of that is an axis. It is a list. A list does not tell you where to start. Two halves do: you start in Work because work is where the loop already is, and you visit Mind when you want to know whether the machine has gotten smarter. The loop is not navigation. The loop is the **state of Work**, and it is drawn once, always, as a spine.

---

## 1. THE DESTINATIONS

### 1.1 The answer: two

| # | Destination | The user's words for it | Route | Key | What it owns (entities) |
| --- | --- | --- | --- | --- | --- |
| 1 | **Work** | "what's moving, and what needs me" | `/$ws/$product` | `W` | live loop state, gates, threads, missions, changesets, drafts in progress, the crew's live activity |
| 2 | **Mind** | "what we know, and what it keeps telling us" | `/$ws/mind` | `M` | beliefs, calls (decisions) and their aftermath, outcomes, the lineage map, receipts (runs, spend, checks, seal, incidents) |

That is the entire top-level navigation. There is no third.

### 1.2 The three non-destinations (chrome objects, not places)

These are on the frame of every screen. They are not nav peers because you do not go to them to think about your product; you touch them to change or verify how the product behaves.

| Object | Where | Route | Key | Why it is not a destination |
| --- | --- | --- | --- | --- |
| **The gate pill** (ember, counts what needs your judgment) | top bar, right of the halves | opens `?panel=queue` over the current screen | `Q` | Its good state is empty. A destination that is empty most days trains you to stop looking at it. It is a *state of Work*, so it renders as a tray over Work, never as a page you visit. |
| **The account chip** (you, workspace, plan, Settings, Admin console, sign out) | top bar, far right | `/$ws/settings?section=` · `/admin/*` | `,` | Settings is policy, not product thinking. Admin is a different tenancy (operator, not user). Promoting either to a half would be a third concept for a fraction of sessions. |
| **Ask** (the one input) | top bar button + docked composer in Work | `Cmd+J` overlay, no route | `Cmd+J` | An input is not a place. |
| **Search** | `Cmd+K` palette, spans both halves | no route | `Cmd+K` | Resurrects `CommandPalette.tsx` (454 lines, currently zero importers). See §7. |

### 1.3 The law that makes "exactly one home" decidable

Every capability in the codebase answers exactly one of these three questions. This is the test that resolves the current three-homes-for-Memory problem and every other one.

| Question | Home |
| --- | --- |
| **Is it happening?** (state, live, in flight, waiting on me) | **Work** |
| **Is it allowed?** (policy, instruction, limit, connection, key, roster permission) | **Settings** (account chip) |
| **Did it happen, and what did it teach us?** (record, receipt, outcome, belief, cost, score) | **Mind** |
| **Is the platform healthy?** (operator only: tenants, pricing, flags, funnels) | **Admin console** (account chip, role-gated) |

Worked example, the Crew. The 13 agents appear in three shapes and they are three different things, not three homes for one thing:
- Who is working *right now* → Work, the crew drawer and the working strip. (Is it happening?)
- What each agent may do without asking → Settings > Agents > Roster. (Is it allowed?)
- What each agent has cost and how well it has scored → Mind > Receipts. (Did it happen?)

Worked example, Memory (three homes today: `/memory` stub, `/brain?tab=memory`, Settings > Workspace > Memory). Under the law: the *belief* lives in Mind > Beliefs; the *retention policy and expiry* lives in Settings > Workspace > Memory; there is no third. The `/memory` route dies.

### 1.4 What I rejected, and why

| Rejected shape | Why it fails |
| --- | --- |
| **Today's 10 rows** (Today, 01..07, Brain, Pulse) | Seven of the ten are loop stages. A stage is not a place you go, it is where your work already is. Nav rows say "go here to do a thing"; a stage says "your thing is here". And three of them own nothing: `/decide` has zero queries of its own and renders the exact `OpportunityQueue` that `/discover?tab=queue` renders; `/learn` and `/ship` mount lazy panels that also render inside `/brain`, and their only own query is a presence chip. Those three exist to make the 01-07 story true on screen. That is the defect this proposal is named against. |
| **The 4 doors** (Mission Control, Approvals, Brain, Settings) | Closest to right, and it is what I build on. It fails on two counts: Approvals is a state of Work, not a place (see 1.2), and Settings is policy sitting as a peer of product thinking, which is why the current top bar has four items of three different kinds. Also it has no home for the record layer other than Brain, which is why traces, spend, drift, evals and the ledger are stranded inside `/engine-room`'s inner rail. |
| **Three halves: Work · Mind · Machine** | "Machine" is the Engine Room, and the Engine Room is exactly where the current mess lives, because it mixes record (traces, receipts, spend), live control (kill switch), and configuration (prompts, guardrail rules, budget caps) under one word. Split by the law in 1.3 and it disappears cleanly. A third half is where the mess re-forms. |
| **One destination (the room; Ask reaches everything)** | The compounding record has to be *browsable* to be believed. You cannot prove memory by chat alone, and the founder needs a surface he can point at and say "that got smarter". |
| **Five: Work · Mind · People · Money · Machine** | People is Settings > Workspace and Admin > People. Money is Settings > Plan (forward-looking) and Mind > Receipts (backward-looking). Machine, see above. All three are policy or operator. |
| **Naming Mind "Brain"** | Two reasons. (a) "Company brain" is YC's phrase, quoted and attributed per the 2026-07-22 repositioning memo, never our own product noun. (b) The current `/brain` reads as a filing cabinet: four tabs named Decisions, Learnings, Docs, Graph, each a list of stored rows. "Brain-as-storage" is the exact framing the investor canon bans. A mind has opinions. See §1.5. |
| **Naming Mind "Memory" / "Knowledge" / "Record"** | All three are containers. They name the shelf, not the thinking. |

### 1.5 Burden of proof A: Mind reads as compounding intelligence, not storage

The proof is structural, not copywriting. Mind's landing tab is not a list of things we stored. It is a list of **things it now believes**, and every row is a sentence with a stake in the future.

```
MIND · Beliefs
─────────────────────────────────────────────────────────────
Enterprise buyers do not care about speed claims.          ↑ strong
  Held across 4 calls. Last challenged 11 days ago and held.
  Changed: killed "2x faster" from the Q3 positioning spec.
  Evidence: 3 calls · 2 outcomes · 6 signals                    [see the chain]

Shipping without a rollout gate costs us ~2 days of firefighting.  ↑ strong
  Learned from 2 outcomes. Now proposed automatically at Ship.
  It stopped you once: 2026-07-09, "skip the canary" was sent back.

You approve Critic teardowns 9 times out of 10.             ~ forming
  It has started running them without asking on bets over $50k impact.
  Turn that off  ·  Keep it
─────────────────────────────────────────────────────────────
```

Three mechanics carry the claim, and all three are backed by code that already exists:

1. **Beliefs have confidence and a streak.** A row that says "held across 4 calls, last challenged 11 days ago" is a claim about the future, not a filed document. Backed by `decision-precedent.functions.ts`, `memory-compounding.ts`, `brain-insights.functions.ts`.
2. **Beliefs name what they changed.** Every belief row carries "Changed: ..." pointing at a real artifact it moved. Backed by `artifact_lineage` edges (`validates`, `supersedes`, `contradicts` are already in `GRAPH_RELATIONS`).
3. **Beliefs are learned from your judgment, and they say so.** `gate-signals.functions.ts` (`recordGateSignal` / `getGateSignals`) exists, is fully written, and is called from nowhere. Wire it: every approve, send-back and decline in the Work queue writes a gate signal, and Mind > Beliefs renders the aggregate as "what your approvals taught it", including the moment it graduates to acting alone. That is the single strongest available exhibit for compounding, and it is currently orphaned code. See §2 row M-14.

Storage-shaped views still exist. They are demoted to the **evidence drawer beneath a belief**, never the front: raw memory rows, docs, meeting notes, and the changelog are what you open when you click "see the chain", not what greets you.

### 1.6 Burden of proof B: the split never forces a half-crossing mid-journey

**THE HALF-CROSSING LAW.** A journey step may **read** from Mind. A journey step may never **navigate** to Mind. If a design needs the user to leave Work mid-journey to consult the record, that is a defect in the Work surface, not a reason to move the surface.

Mind is rendered *into* Work at the four points where a PM actually needs the record, as in-place components, not links:

| Where in the journey | What Mind renders inside Work | Backed by |
| --- | --- | --- |
| 02 Decide, on every bet in the queue | precedent card: "you have decided this shape 3 times; here is what happened" | `decision-precedent.functions.ts`, `PrecedentNudge.tsx` (currently unmounted) |
| 03 Plan, inside the spec editor | citation chips on every claim, hover to see the source signal or prior outcome | `CitationList.tsx` (currently unmounted, 53 lines), `lineage.functions.ts:getProvenance` |
| Composer, as you type | "we tried this before and it did not land" contradiction warning | `contradiction-auditor.functions.ts`, `SharedPremiseNudge.tsx` (unmounted) |
| 07 Learn, on the outcome form | the assumptions this ship was supposed to validate, pre-filled | `outcome.functions.ts`, `decisions.functions.ts:resolveAssumptionChallenge` |

Each of those has a quiet **[see the chain]** affordance. Clicking it is the *only* way a journey ever reaches Mind, it is always optional, it opens `/$ws/mind/map?focus=<kind>:<id>`, and the destination renders a persistent **"Back to Plan · spec: Rollout gate"** pill in the Mind top bar until you take it or dismiss it. You cannot get lost, and you were never required to go.

The reverse direction is legal but constrained: Mind rows link forward into Work **only at journey entry points** ("start a teardown from this precedent", "open the spec this changed"), never into the middle of a running journey. A Mind row cannot deposit you at step 4 of 6.

Verification of the law, journey by journey, is in §4: every one of the seven journeys is 100% inside Work, start to terminal state.

### 1.7 The one shell

There is exactly one authenticated shell, `AppFrame`, and every authenticated URL renders inside it, including every deep link, every detail page, every settings section, every admin page, and the first-run question. This is the direct answer to *"even if you click deep link subpages, everything should be in the same thing."*

```
┌──────────────────────────────────────────────────────────────────────┐
│ ◈ Supaprod   helio-labs / relay ▾   [Work] [Mind]      ●3  Ask ⌘J  ◐ │  AppFrame top bar, 52px
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                        half body                                     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

Work body:   Spine (7 stages) / Thread 380px / Canvas / WorkingStrip / Composer
Mind body:   tab row (5) / content
Settings:    group nav 200px / section content        (same top bar, halves shown, neither lit)
Admin:       admin rail 200px / page content          (same top bar, plus an "operator" marker)
```

`src/routes/_authenticated.tsx` currently picks between `AppShell` (236px rail, 10 rows, ~68 routes) and `RoomChrome` (52px bar, 4 doors, 7 paths) with a hardcoded pathname allowlist at lines 146-185. That allowlist is deleted. One frame, no branch.

**Shortcuts** (the "shortcut equals what you see" law from `nav-model.ts` survives, retargeted):

| Key | Does | Note |
| --- | --- | --- |
| `W` / `M` | Work / Mind | letters, because the digits belong to the loop |
| `1`..`7` | jump the Spine to stage 01..07 | matches the printed numbers. Pressed from Mind, jumps to Work at that stage (a legal cross: it is a journey *entry*) |
| `Q` | open/close the gate tray | |
| `Cmd+K` | search (both halves, all entities) | |
| `Cmd+J` | Ask | |
| `,` | Settings | |
| `?` | shortcut sheet | |

---

## 2. THE HOME TABLE

Every real surface, every partial surface, every buried capability, every unmounted component, and every orphaned server-function family. **Home** is the one place a thing is listed and owned. **Doors** are links from elsewhere to that same URL; a thing may have many doors and exactly one home. Click paths count from the first authenticated screen after login, which is Work (§3).

### 2.1 Work

| # | Capability (from ground truth) | Home in Work | URL | Clicks from login | Notes |
| --- | --- | --- | --- | --- | --- |
| W-01 | the room (`/:ws/:product`, `MissionShellView`) | **Work itself** | `/$ws/$product` | 0 | canonical landing |
| W-02 | `/discover` (signals, clustering, ranked bets) | Canvas face 01 | `?stage=discover` | 1 (Spine) | |
| W-03 | `/decide` + `OpportunityQueue` (the judgment queue) | Canvas face 02 | `?stage=decide` | 1 | `/decide` the route dies; the stage lives |
| W-04 | `/plan` (roadmap, specs, stakeholder pack) | Canvas face 03 | `?stage=plan` | 1 | `?view=roadmap\|specs\|stakeholders` becomes a segmented control on the face |
| W-05 | `/plan/spec/$id` (1084 lines, the full spec editor) | spec page | `/$ws/$product/spec/$id` | 2 (Spine 03 → row) | page, not modal: editable for >1 min, shareable, has tabs |
| W-06 | `/design` Prototypes half (322 lines) | Canvas face 04 | `?stage=design` | 1 | Brand Kit half goes to Settings, see S-06 |
| W-07 | `/build` (989 lines, mission cockpit, dispatch, fleet, lanes) | Canvas face 05 | `?stage=build` | 1 | `?view=agent\|lane` becomes a segmented control |
| W-08 | `/build/$missionId` (870 lines, run detail, diff, CI, replay) | mission page | `/$ws/$product/mission/$id` | 2 | |
| W-09 | `/ship` (ship history, announcements, changelog) | Canvas face 06 | `?stage=ship` | 1 | `/ship` the route dies. Changelog *authoring* stays here; the published changelog record is Mind, see M-11 |
| W-10 | `/learn` (outcomes, learnings, impact, support) | Canvas face 07 | `?stage=learn` | 1 | `/learn` the route dies. Recording an outcome is Work; the recorded outcome is Mind, see M-05 |
| W-11 | `/approvals` (270 lines) + the gate pill | **gate tray** | `?panel=queue` over any screen | 1 (pill or `Q`) | not a page. Deep link to one gate: `?panel=queue&gate=<kind>:<id>` |
| W-12 | `AttentionBell.tsx` (97 lines, real notifications query, zero importers) | gate tray, "Noticed" section | `?panel=queue#noticed` | 1 | merged into the one ember object. The pill counts gates only; notices carry a quiet secondary count. ONE COUNT ONE SOURCE survives |
| W-13 | `ExecutedCard.tsx` (547 lines, `getRecentExecutedUnattended`, zero importers) | gate tray, "Done without you" section | `?panel=queue#unattended` | 1 | the biggest orphan in the repo by line count and the single best trust artifact |
| W-14 | `PendingApprovalsBar.tsx` (271, unmounted) | **deleted** | - | - | the pill and the tray are the bar |
| W-15 | `CompositeReviewCard.tsx` (currently only imported by `/today`) | gate tray, composite gates | `?panel=queue` | 1 | |
| W-16 | `/threads` + `ThreadsSurface.tsx` (`?c=`) | Thread column history menu → archive page | `/$ws/$product/threads?c=<id>` | 2 | product-scoped, with an "all products" toggle on the page |
| W-17 | `/artifacts` + `ArtifactsSurface.tsx` | **dissolved** | - | - | see §7. Its rows already have homes on stage faces 03/04; the "everything in one list" job is `Cmd+K` search and Mind > Map |
| W-18 | crew (13 agents, live) + `CrewDrawer.tsx` + `AgentActivityTimeline.tsx` (unmounted) | crew drawer | `?panel=crew` | 1 | live state only. Permissions are S-08 |
| W-19 | `WorkingStrip.tsx` + `CookingBanner.tsx` (unmounted, `getLiveRunCounts`) + `MachineNow.tsx` (unmounted) + `AiWorking.tsx` | working strip, above the composer | always visible | 0 | |
| W-20 | Engine Room > Safety > "Emergency controls" (pause, kill switch) | working strip, "Stop everything" | inline confirm, no route | 0 | the only piece of `/engine-room` that stays in Work, because a kill switch you have to navigate to is not a kill switch |
| W-21 | `AudioTranscriptPanel.tsx` (386 lines, complete `audio.functions` backend, zero doors anywhere) | Canvas face 01, "Bring a recording" + composer mic verb | `?stage=discover&panel=audio` | 2 | |
| W-22 | `/today`'s `DeskRail` / meetings + `calendar.functions` / `meetings.functions` | Canvas face 01, "This week" rail | `?stage=discover` | 1 | fixes the `/calendar` and `/meetings/$id` redirects that currently drop `?meeting=` (see §6.5) |
| W-23 | `/today`'s greeting, daily brief, `TodayHeroCard`, `ColdStartOnramp` | Thread's Briefing card (top of the Thread, every morning) | `/$ws/$product` | 0 | `greeting.functions`, `copilot.functions:generateDailyBrief`, `briefs.functions` |
| W-24 | `/today`'s `WatchLane`, `JudgmentLane`, `today-lanes.functions` | split: watch → Spine stage state; judgment → gate tray | - | 0-1 | |
| W-25 | `FirstTeardownCard.tsx`, `gauntlet.functions:recordRitualSession` | composer chip "Tear this idea down" (J2) | `?journey=j2` | 1 | |
| W-26 | `design-parity.functions.ts` (`getDesignParity`, `checkDesignParity`) **orphan** | Canvas face 04, "Does the build match the design?" check | `?stage=design` | 1 | result also lands as a Mind > Receipts check row |
| W-27 | `fanout.functions` (`dispatchExploration`, `decideFanoutBatch`) | Canvas face 02, parallel exploration | `?stage=decide` | 1 | |
| W-28 | `new-build.functions` (`provisionRepoForSpec`, `canDispatchToRepo`), `CreateRepoModal.tsx` | Canvas face 05, first-run repo path | `?stage=build` | 1 | |
| W-29 | `/traces/$traceId` (861 lines) | run page | `/$ws/$product/run/$id` | 3 (Mind → Receipts → row) or 2 from a mission | **home is the Mind > Receipts list** (M-08); this is the URL both halves open |
| W-30 | `/tasks`, `/inbox`, `/chat`, `/cockpit`, `/missions`, `/studio`, `/fleet`, `/delegate` | all → Work | `/$ws/$product` | 0 | see §7 |
| W-31 | `CommandPalette.tsx` (454 lines, JUMP/SETTINGS/ACT/RECENT/ASK/CATALOG, zero importers) | `Cmd+K` search, global | overlay, no route | 0 | search is currently unreachable because `Cmd+K` opens the composer. `Cmd+K` = search, `Cmd+J` = Ask, permanently |

### 2.2 Mind

`/$ws/mind`, five tabs. `mind` is a reserved product slug (DB-enforced, same mechanism as `reserved_workspace_slugs`).

| # | Capability | Home in Mind | URL | Clicks | Notes |
| --- | --- | --- | --- | --- | --- |
| M-01 | the landing: what it now believes | **Beliefs** | `/$ws/mind` | 1 | `brain-insights.functions`, `memory-compounding.ts`, `decision-precedent.functions` |
| M-02 | `/brain?tab=memory` + `/memory` stub + agent memory | Beliefs, evidence drawer | `/$ws/mind?belief=<id>` | 2 | the raw memory rows sit *under* a belief, never as the front |
| M-03 | `memory-candidates.functions` (graduation gate) | written from Work's gate tray; **shown** in Beliefs as "just learned" | `/$ws/mind` | 1 | policy split: the *decision* to graduate is Work (a gate), the *result* is Mind |
| M-04 | `/brain?tab=decisions`, `decisions.functions`, `decision-judgment`, `decision-currency` | **Calls** | `/$ws/mind/calls` | 2 | every call on the record, and what happened after it |
| M-05 | `/learn`'s `OutcomesPanel`, `LearningsPanel`, `outcome.functions`, `ImpactLedgerPanel` | **Outcomes** | `/$ws/mind/outcomes` | 2 | closes `/impact`, `/outcome`, `/brain?tab=learnings` |
| M-06 | `/brain?tab=graph`, `knowledge-graph-view`, `knowledge-graph-explorer`, `artifact_lineage` | **Map** | `/$ws/mind/map?focus=<kind>:<id>` | 2 | the "see the chain" target from every Work citation |
| M-07 | `/brain?tab=docs`, `docs`, workspace pages, `ChangelogPanel`, `ShipHistoryPanel` | Map, "standing pages" lane + Calls evidence | `/$ws/mind/map?lane=pages` | 2 | docs are evidence, not a tab of their own |
| M-08 | `/traces` list, `TracesPanel.tsx` (189, `listTraces`, unmounted), `/engine-room?room=record&view=traces` | **Receipts**, filter `Runs` | `/$ws/mind/receipts?kind=run` | 2 | rows open `/$ws/$product/run/$id` (W-29) |
| M-09 | `/trust-ledger`, `trust-ledger.functions`, `trust-chain`, `audit-lineage`, the SHA-256 seal | Receipts, filter `Seal` + a seal strip in the header | `/$ws/mind/receipts?kind=seal` | 2 | |
| M-10 | `/engine-room?room=spend` (trend, by-agent, usage) + `/analytics` + `CostPerOutcomeChip.tsx` (unmounted) | Receipts, header cost strip; itemization one row deep | `/$ws/mind/receipts` → row | 2 to see, 3 to itemize | 3 is right: itemized token spend is a monthly question, not a daily one |
| M-11 | `/engine-room?room=quality` results (`score`, `calibration`, `drift`, `proof`) + `/evals`, `/eval-health`, `/drift` | Receipts, filter `Checks` | `/$ws/mind/receipts?kind=check` | 2 | *results* only. The suites/prompts that define them are policy, see S-09 |
| M-12 | `/engine-room?room=safety&view=incidents`, `incidents.functions` | Receipts, filter `Incidents` | `/$ws/mind/receipts?kind=incident` | 2 | a *live* incident also raises the working strip in Work |
| M-13 | `/engine-room?room=record&view=approvals` (approval log) | Receipts, filter `Decisions` | `/$ws/mind/receipts?kind=decision` | 2 | |
| M-14 | `gate-signals.functions.ts` (`recordGateSignal`, `getGateSignals`) **orphan** | Beliefs, "what your approvals taught it" | `/$ws/mind` | 1 | written by every decision in the Work gate tray. The compounding exhibit (§1.5) |
| M-15 | `MemoryExpiryBanner.tsx` (85, `getMemoryExpiry`, unmounted), `plg-memory-expiry` | Mind header strip: "3 beliefs expire in 6 days" | `/$ws/mind` | 1 | forgetting is a property of a mind; the *retention setting* is S-05 |
| M-16 | `/changelog`, `/brief`, `announcements.functions` (published record) | Outcomes, "what we told the world" | `/$ws/mind/outcomes?lane=announced` | 2 | authoring is W-09 |
| M-17 | `moat.functions`, `moat-vis`, `value-receipts.functions` | Beliefs, the compounding header ("this loop has closed 14 times") | `/$ws/mind` | 1 | |
| M-18 | `contradiction-auditor.functions`, `shared-premise.functions` | Beliefs, "these two beliefs disagree" row + inline warning in Work | `/$ws/mind` | 1 | |

**Mind is workspace-scoped, deliberately.** It spans every product in the workspace, because a mind that resets per product does not compound. The product switcher still applies as a *filter chip* on Mind, off by default.

### 2.3 Settings (account chip). Five groups preserved exactly from `settings-sections.ts`

Every `?section=` id in `SectionId` survives unchanged, so no deep link anywhere breaks. Route moves from `/settings` to `/$ws/settings` (workspace-scoped, which it already was in behavior); `/settings` stays alive forever as a resolver.

| # | Capability | Home | URL | Clicks |
| --- | --- | --- | --- | --- |
| S-01 | profile, appearance | You > Profile | `/$ws/settings?section=profile` | 2 |
| S-02 | notification preferences (`notifications.functions` write side) | You > Notifications | `?section=notifications` | 3 |
| S-03 | strategic brief, voice (`briefs.functions`) | Workspace > Brief & voice | `?section=workspace` | 3 |
| S-04 | products lifecycle (switch, archive, restore, export, delete) | Workspace > Products | `?section=products` | 3 |
| S-05 | memory retention, expiry policy | Workspace > Memory | `?section=memory` | 3 |
| S-06 | `/design`'s Brand Kit half, `design-memory.functions`, `DesignMemoryPanel` | Workspace > Brand | `?section=brand` | 3 |
| S-07 | `brandkit` assets | Workspace > Brand | `?section=brand` | 3 |
| S-08 | 13-agent roster permissions, autonomy, trust ladder (`agents`, `trust`, `governance`, `reactor`) + `/engine-room?room=safety&view=team` | Agents > Roster · Autonomy & approvals | `?section=staff` · `?section=autonomy` | 3 |
| S-09 | `/prompts`, `prompt-optimization`, eval **suite definitions**, `/guardrails`, house rules, `/budgets` caps, routines/cron switches | Agents > Instructions & limits (new section id `instructions`, added to `SectionId`) | `?section=instructions` | 3 |
| S-10 | `researcher.functions.ts` (`getResearcherTargets`, `updateResearcherTargets`) **orphan** | Agents > Roster > Research > "what to watch" | `?section=staff&agent=researcher` | 4 | its *output* lands on Work face 01 |
| S-11 | `/integrations`, connections, OAuth, `ProviderCard.tsx` (unmounted), `ApiKeyConnectDialog.tsx` (unmounted) | Connections & Data > Sources | `?section=connections` | 3 |
| S-12 | **`/sync` (842 lines)**, `ProductBindingPicker.tsx` (unmounted), bindings, conflicts, webhook ingest | Connections & Data > Sync & bindings (the whole page folds in as the section body) | `?section=sync` | 3 |
| S-13 | MCP server, agent access (`mcp.functions`) | Connections & Data > Agent access | `?section=interop` | 3 |
| S-14 | data export, deletion (`value-receipts` write side) | Connections & Data > Your data | `?section=data` | 3 |
| S-15 | plan, checkout, credits, BYO keys (`billing`, `payments`, `credits`, `byokeys`) | Plan & Usage | `?section=billing` · `credits` · `ai` | 3 |
| S-16 | `health`, `reliability`, `loop-health` diagnostics | Plan & Usage > Diagnostics | `?section=health` | 3 |

Three clicks for a specific settings section is correct and I am not softening it: settings are visited rarely and deliberately, the group nav is persistent so the second and third clicks are on one screen, and every section is directly deep-linkable, so any door in the product ("Connect GitHub", "Raise the cap") reaches its exact section in one.

### 2.4 Admin console (account chip, role-gated). Unchanged surfaces, one rail

| # | Surface | URL | Clicks |
| --- | --- | --- | --- |
| A-01 | overview (354) | `/admin` | 2 |
| A-02 | people, roles, invitations (854) | `/admin/people` | 3 |
| A-03 | workspaces / tenants (640) | `/admin/workspaces` | 3 |
| A-04 | pricing, vouchers (636) | `/admin/pricing` | 3 |
| A-05 | platform flags (840) | `/admin/platform` | 3 |
| A-06 | observability, incidents (427) + **`ActivationFunnelPanel.tsx`** (342, unmounted) | `/admin/observability` | 3 |
| A-07 | proof surface, moat, activation (318) | `/admin/proof` | 3 |
| A-08 | AI costs, platform-wide (249) | `/admin/ai-costs` | 3 |
| A-09 | model routing (122) | `/admin/routing` | 3 |

### 2.5 Deleted with nothing absorbing them

| Thing | Why nothing absorbs it |
| --- | --- |
| `AmbientChip.tsx` (213 lines, `ambient.functions:fetchWeather`) | Weather is not product work. It answers none of the three questions. Delete the component and the server function. |
| `delegate-poll.functions.ts` (`pollDelegateRun`) | Dead poller for the retired delegate desk. Nothing calls it. |
| `PendingApprovalsBar.tsx` | Duplicates the gate pill + tray. |
| `FieldStops.tsx`, `Spinner.tsx` | Public landing / shared primitives, out of the authenticated IA. Leave in place. |

**Nothing else in the ground truth is homeless.** Every one of the 20 real surfaces, the 5 partials, the ~12 fold targets behind the 41 redirect stubs, the 19 zero-importer components, and the 4 orphaned server-function families appears exactly once above.

---

## 3. THE LANDING DECISION

### 3.1 The current three-way disagreement, resolved

| Path today | What happens | Verdict |
| --- | --- | --- |
| login → `window.location.assign("/")` (`login.tsx:100`) → landing detects session → `window.location.replace("/m")` (`index.tsx:130`) → `/m/index` resolver → room | two full page loads and a public-page flash to get to the app | **fixed:** login navigates in-router straight to the resolved room |
| `ObsidianOnboarding.tsx:684,1132` → `/today` | a brand-new user's first authenticated screen is the retired 10-rail shell | **fixed:** `/today` dies |
| `MissionOnboarding.tsx:63,72` → `/today` | same | **fixed** |
| `nav-model.ts` home key → `/today` | same | **fixed** |

### 3.2 Returning user, first second

Lands on **Work**, `/$ws/$product`, resolved to last-active product (the existing `use-workspace` + `room-url.ts` resolution, unchanged). Zero clicks, zero redirects, no public-page flash.

What is on screen in the first second, in reading order:

1. **The Spine**, all seven stages, with real state from `getLoopState`. Two stages lit, one carrying an ember. This alone answers "where am I in the loop" before you read a word.
2. **The Thread's Briefing card**: three lines of what changed since you left, each with a receipt. (`greeting.functions`, `copilot.functions:generateDailyBrief`.)
3. **The gate pill**, ember, with a count, if anything needs you.
4. **The Canvas**, showing the stage that most recently moved (not a fixed default): the stage with an active run, else the stage with a gate, else the furthest-right done stage. Deterministic, and it means the screen is about *your* work, not about stage 01.
5. **The working strip**: what the crew is doing right now, or a quiet line if nothing is.
6. **The Composer**, collapsed to a strip with the seven journey chips visible.

### 3.3 Brand-new user, first second

**Same shell.** This is the constraint and I am meeting it literally.

`/start` renders `AppFrame` in **provisioning mode**: the top bar shows the mark and the account chip (halves present but not yet lit, because there is nothing to be in yet), the Spine is drawn in full and dimmed, the Thread holds exactly one question, the Composer is live and focused.

```
◈ Supaprod                                              ◐
──────────────────────────────────────────────────────────
 01 ──── 02 ──── 03 ──── 04 ──── 05 ──── 06 ──── 07     (all dim)
──────────────────────────────────────────────────────────
 │ What are you building?                    │
 │                                            │   (canvas: the loop, annotated,
 │ One line is enough. Everything else        │    quietly explaining what each
 │ can wait.                                  │    stage does. No form.)
 │                                            │
──────────────────────────────────────────────────────────
 [ a tool that turns support tickets into ... ]     ↵
```

On submit: create workspace + product, `navigate({ to: '/$ws/$product', replace: true })`. From that instant every screen is the room the user already learned the shape of.

Rationale for teaching the shell before the product exists: the founder's complaint starts with "I do not understand where to start". The first screen must *show* the loop and *ask* one question. It must not be a wizard in a different chrome, which is what `/onboarding` (`ObsidianOnboarding.tsx`, chromeless full-viewport) is today.

`/onboarding` and its multi-step flow die. `/start` (which today renders `MissionOnboarding` and is unreachable, nothing links to it) becomes the only first-run route and is what `_authenticated.tsx`'s `needsOnboarding` gate redirects to.

### 3.4 Returning user with no product, or an invited user

Same `/start` shell, different question: "helio-labs has 3 products. Which one are you here for?" plus "or start a new one". Never a blank room.

---

## 4. THE JOURNEYS

All seven map to `src/lib/journeys.ts` (J0-J7), whose `wiredVia` lists are already test-enforced against real exports. **Every screen in every journey is Work.** The Mind column names what Mind *renders into* Work at that step, which is the half-crossing proof from §1.6.

Entry is always one of three, and only three: a **composer chip**, a **Spine node**, or a **gate in the tray**. That triple is the answer to "if I want to do only certain journeys instead of the entire lifecycle, I do not know how".

### 4.1 "What should we build next?" (J1, stages 01-02)

| Step | Screen | Machine does | Human decides | Mind renders in place |
| --- | --- | --- | --- | --- |
| start | Work, composer chip `What should we build next?` | - | picks the chip | - |
| 1 | Canvas 01 | Watch + Listen pull sources; Research fetches market signal when sources are thin (`clusterSignals`) | nothing | "you have seen this signal shape before" chip on repeat clusters |
| 2 | Canvas 01 | clusters signals into themes, ranks bets | may re-rank by dragging | - |
| 3 | Canvas 02 | Challenge runs a Critic review on the top bets (`runCriticReview`) | nothing | **precedent card per bet**: "3 prior calls of this shape; 2 landed" |
| 4 | Canvas 02, gate | posts each bet as a gate | **keep or kill each bet** (`decideApprovalItem`) | contradiction warning if a bet fights a standing belief |
| end | Canvas 02 | writes `gate_signals`, `artifact_lineage` edges | - | the approved bet is now a Mind > Calls row |
| terminal state | "A ranked, Critic-reviewed bet list. The approved bet sits at the top of Decide with its evidence chain." | | | |
| **next move** | NextLine offers two doors: **Tear this idea down** (J2) and **Just write the PRD** (J3) | | | |

### 4.2 "Just write the PRD" (J3, stage 03)

| Step | Screen | Machine | Human | Mind in place |
| --- | --- | --- | --- | --- |
| start | composer chip, or Spine 03, or the J1 handoff door | - | picks | - |
| 1 | Canvas 03 | Draft generates a cited spec from the bet or from one typed line (`generatePrd`) | - | **citation chips on every claim** (`CitationList`), sourced from signals and prior outcomes |
| 2 | spec page `/$ws/$product/spec/$id` | `prdAssist` fills sections on demand; assumptions get put on watch | edits inline | "this assumption was wrong last time" flag |
| 3 | spec page | Plan generates the task graph (`generateTaskGraph`) | reorders, cuts | - |
| 4 | gate in the tray | posts the spec gate (`kind: "spec"`, lights stage 03 on the Spine per `GATE_STAGE`) | **approve / send back** | - |
| terminal | "An approved, cited spec with assumptions on watch and a task graph." | | | |
| **next move** | **Design this** (J5) if the workspace has the design stage on, else **Build this feature** (J4). Secondary door: **Share with stakeholders** (the stakeholder pack, on face 03) | | | |

### 4.3 "Tear this idea down" (J2, stage 02)

| Step | Screen | Machine | Human | Mind in place |
| --- | --- | --- | --- | --- |
| start | composer chip on an existing opportunity or spec, or `FirstTeardownCard` on a cold workspace | - | picks the target | - |
| 1 | Canvas 02 | Challenge runs the wedge teardown (`runWedgeTeardown`) | - | "the strongest case against this, last time" from prior teardowns |
| 2 | Canvas 02 | `dispatchExploration` fans out parallel angles | - | - |
| 3 | Canvas 02, gate | posts the verdict batch (`decideFanoutBatch`) | **accept / reject each angle** | - |
| terminal | "A teardown verdict on the record, attached to the idea for good." | | | |
| **next move** | **Just write the PRD** (J3) if it survived; **Kill it and say why** if it did not, which writes a Mind > Calls row with the reason and is *not* a dead end: it offers **What should we build next?** (J1) | | | |

Honesty edge held from `journeys.ts`: J2 attaches to an artifact, never to free text, because the one-step "paste a raw idea and tear it down" seam does not exist. The chip is disabled with a plain-words reason until a target is selected.

### 4.4 "Design this" (J5, stage 04)

| Step | Screen | Machine | Human | Mind in place |
| --- | --- | --- | --- | --- |
| start | composer chip or Spine 04 or the J3 handoff | - | - | - |
| 1 | Canvas 04 | Design generates the scaffold in your brand (`generateDesignScaffold`, reading `design_memory` from Settings > Workspace > Brand) | - | "your brand rules" chip, linking to the brand section |
| 2 | Canvas 04 | runs the design critic (`runScaffoldDesignCritic`) | - | - |
| 3 | gate | posts the design gate (`kind: "design_gate"`, lights stage 04) | **approve / send back** (`decideDesignGate`) | - |
| terminal | "An approved mockup bound to the spec. Build inherits it." | | | |
| **next move** | **Build this feature** (J4). Secondary: publish the prototype to a shareable `/p/$slug` | | | |

### 4.5 "Build this feature" (J4, stage 05)

| Step | Screen | Machine | Human | Mind in place |
| --- | --- | --- | --- | --- |
| start | composer chip, Spine 05, or the J5/J3 handoff | - | - | - |
| 0 | Canvas 05 | `canDispatchToRepo` checks for a reachable repo; if none, `provisionRepoForSpec` offers to create one | **confirm repo creation** | - |
| 1 | mission page `/$ws/$product/mission/$id` | Engineer dispatches the build (`dispatchStudioSession`); the working strip narrates | - | - |
| 2 | mission page | tool-call gates surface as they occur (`kind: "tool_call"`, lights stage 05) | **confirm consequential tool calls** | "you have approved this tool 12 times" → autonomy graduation offer |
| 3 | mission page | Review runs CI, produces the diff, opens the PR | **read the diff, approve or send back** | design-parity check result (W-26) |
| terminal | "Applied changeset, green CI, a preview URL, and a PR opened on your repo." | | | |
| **next move** | **Launch what we shipped** (J6). Secondary: **Open the run** (`/$ws/$product/run/$id`) for the full trace | | | |

### 4.6 "Launch what we shipped" (J6, stage 06)

| Step | Screen | Machine | Human | Mind in place |
| --- | --- | --- | --- | --- |
| start | composer chip, Spine 06, or the J4 handoff | - | - | - |
| 1 | Canvas 06 | promotes preview to production (`promoteToProduction`) | **approve the promotion** | "last time you skipped the canary" belief warning, if it applies |
| 2 | Canvas 06 | Announce writes release notes + launch kit (`generateReleaseNotes`, `generateLaunchKit`, `generateLaunchPlan`) | edits the copy | prior announcement voice from Settings > Workspace > Brief & voice |
| 3 | Canvas 06 | arms the outcome check with a date | **sets or confirms the date** | - |
| terminal | "Live in production, changelog written, launch copy in hand, outcome check armed with a date." | | | |
| **next move** | **How did it land?** (J7), which is scheduled rather than immediate; the card says when it will wake you | | | |

Honesty edge from `journeys.ts`: the launch kit is copy-out only. Nothing is published or scheduled from here, and the UI never implies it is.

### 4.7 "How did it land?" (J7, stage 07)

| Step | Screen | Machine | Human | Mind in place |
| --- | --- | --- | --- | --- |
| start | **a gate in the tray** (the outcome check firing on its date), or Spine 07 | `checkPrdShipped` fires the check | - | - |
| 1 | Canvas 07 | pulls what it can measure (`getOutcomeData`) and states plainly what it cannot | - | **the assumptions this ship was meant to validate**, pre-filled |
| 2 | Canvas 07 | - | **records the verdict** (`recordOutcome`), human-attested, the UI says "record how it landed" and never "we measured" | - |
| 3 | Canvas 07 | Measure + Archivist turn the verdict into a learning; challenged assumptions get flagged | - | - |
| terminal | "The outcome recorded. The learning is on the record; challenged assumptions flagged." | | | |
| **next move** | Two doors, and this is the loop closing: **What should we build next?** (J1, now re-ranked by what just landed) and **see what this changed in the Mind** (the only journey terminal that offers a Mind door, because the journey is over) | | | |

### 4.8 The full loop (J0)

`FULL_LOOP_CHAIN = j1 → j2 → j3 → j5 → j4 → j6 → j7`. It is the chain, not a separate machine. The Spine lights the whole width; each slice's terminal handoff auto-advances instead of waiting for a click, and the Thread records the handoff line at each seam so you can see where it is. You can drop out at any seam and the run stays resumable from the Spine.

### 4.9 Nothing dead-ends: the terminal-state register

| Terminal state | The next move offered |
| --- | --- |
| bet approved | write the PRD · tear it down first |
| bet killed | what should we build next |
| teardown survived | write the PRD |
| teardown fatal | what should we build next |
| spec approved | design it · build it · share with stakeholders |
| spec sent back | the spec, with the reviewer's note at the top |
| design approved | build it · publish the prototype |
| build green | launch it · open the run |
| build red | the failing check, with "send it back" and "take it over" |
| shipped | how did it land (dated) |
| outcome recorded | what should we build next · see what this changed |
| **empty workspace** | the one question (§3.3) |
| **empty stage** | a WarmSlot naming who acts next and the one chip that starts them |
| **error** | the in-shell error card, the real message, retry, and a door to Work |

---

## 5. THE INTERLINKS

The graph exists in `artifact_lineage`, written by `recordLineage`, with `GRAPH_RELATIONS = promoted | cites | derived-from | depends-on | validates | supersedes | contradicts`. It is read by `getLineage`, `getProvenance`, `getKnowledgeGraph`.

**Gap found in code, and it must be closed in phase 3.** `ARTIFACT_KINDS` (in `lineage.functions.ts`) currently ends at `capability_change` and does **not** contain `changeset`, `deployment`, `outcome`, `learning`, or `belief`. `GRAPH_NODE_KINDS` (in `knowledge-graph-view.ts`) is even shorter: it drops `house_rule`, `prototype`, `capability_change`. So the back half of the loop writes no lineage at all, which is exactly why the loop "does not connect" after Build. Extend both enums, and add the writes named in the table.

### 5.1 The entity graph

| Entity | Links FORWARD to | Links BACK to | Which links are clickable doors, and where they render |
| --- | --- | --- | --- |
| **signal** | theme (`promoted`), opportunity (`promoted`) | source connection, meeting, support ticket, audio transcript | **forward:** "this became a bet" chip on the signal row, Canvas 01. **back:** "from Slack #feedback, 3 days ago", opens the source in Settings > Connections when it is a binding question. |
| **bet** (opportunity) | decision (`promoted`), spec (`promoted`), teardown verdict (`validates`/`contradicts`) | signals (`derived-from`), theme, prior bet (`supersedes`) | **forward:** "the call" and "the spec" chips on the bet row, Canvas 02. **back:** "built on 6 signals" opens the evidence list inline; "supersedes the Q2 bet" opens Mind > Calls. |
| **decision** (call) | spec (`promoted`), outcome (`validates`), belief (`promoted`) | bet, prior decision (`supersedes`), precedent set (`cites`) | **forward:** "what it produced" on the Calls row. **back:** "3 precedents" renders as the precedent card **inside Work's Decide gate**, not as a link out. Its `/d/$slug` public share stays. |
| **spec** (prd) | prototype (`promoted`), task graph (`promoted`), mission (`promoted`), deployment (`derived-from`) | decision, bet, signals (`cites` per claim), design memory (`cites`) | **forward:** the spec page's header strip is the forward chain: `Design → Build → Ship`, each chip live or greyed. **back:** every claim's citation chip; "see the chain" opens Mind > Map focused on the spec. This is the single densest interlink surface in the product. |
| **prototype** | mission (`promoted`), deployment (`derived-from`) | spec, design memory / brand (`cites`) | **forward:** "the build that used this" on the prototype card. **back:** "from spec: Rollout gate" and "your brand rules". Public `/p/$slug` share kept. |
| **mission** (build run) | changeset (`promoted`), run/trace (`derived-from`), deployment (`promoted`) | spec, prototype, task (`depends-on`) | **forward:** "the changeset", "the PR", "the run". **back:** "building spec: Rollout gate" in the mission page header. |
| **changeset** *(new kind)* | deployment (`promoted`), PR (external) | mission, spec, task | **forward:** "shipped in release 2026-07-24" on the diff view. **back:** "opened by mission #182". |
| **deployment** | outcome (`validates`), changelog entry (`promoted`) | changeset, spec, prototype | **forward:** "the outcome check, armed for 2026-08-07". **back:** "what went out": the changeset list, expanded inline on face 06. |
| **outcome** *(new kind)* | learning (`promoted`), belief (`validates`/`contradicts`) | deployment, spec, the assumptions it tested | **forward:** "what we learned". **back:** "the spec said this would move activation 8%; it moved 3%" is rendered as one line, not two links. |
| **learning** *(new kind)* | belief (`promoted`), house rule (`promoted`), playbook (`promoted`) | outcome, decision (`contradicts` when it overturns one) | **forward:** "this became a standing belief". **back:** "from the Rollout gate outcome". |
| **belief** (memory) *(new kind)* | future decisions (`cites`, written every time it is surfaced at a gate), house rule (`promoted`) | learnings, outcomes, gate signals | **forward, and this is the whole product:** "it stopped you 2 times" and "it changed 4 specs", each a list of real artifacts. **back:** the evidence drawer. Rendered in Work as the precedent card and the contradiction warning; browsable in Mind > Beliefs. |
| **gate signal** | belief (`promoted`, on graduation) | the gate, the decision you made, the agent that asked | not a row of its own in the UI; it is the aggregate under "what your approvals taught it". |
| **house rule** | future gates (suppresses or auto-approves them) | learning, belief, a human authoring it in Settings | **forward:** "this rule has fired 9 times" opens the receipt list. **back:** "learned from the Rollout gate outcome". |
| **meeting** | signal (`promoted`), decision (`promoted`) | calendar connection, audio transcript | **forward:** "3 signals came out of this". **back:** the recording, on Canvas 01. |

### 5.2 The two rules the graph must obey in the UI

1. **A back-link renders as a sentence, not as a breadcrumb.** "Building spec: Rollout gate, approved by you 2 days ago" is one line, and the artifact names in it are the links. Breadcrumbs make a chain look like a hierarchy, and this is a graph.
2. **A forward-link is a state, not a promise.** The spec page's `Design → Build → Ship` strip shows each chip as live, done, or not started, with a receipt on the done ones. It never shows a chip for a thing that has not happened as if it were a place you can go.

### 5.3 Where the whole graph is visible at once

`/$ws/mind/map`. The focus param is `?focus=<kind>:<id>` (matching `nodeKey()` in `knowledge-graph-view.ts`). Every "see the chain" affordance in Work targets it. It is the only Mind surface a Work journey can open, and it opens with the return pill (§1.6).

---

## 6. DEEP LINKS AND SUB-PAGES

### 6.1 The URL scheme

```
/$ws/$product                              Work (the room)
  ?stage=discover|decide|plan|design|build|ship|learn     which canvas face
  ?journey=j0..j7                                          the lit spine slice
  ?panel=queue|crew|audio                                  a tray over the canvas
  ?gate=<kind>:<id>                                        with a specific gate open
  ?focus=<kind>:<id>                                       a row detail panel over the canvas
  ?view=<face-local>                                       a face's segmented control

/$ws/$product/spec/$id        ?tab=doc|assumptions|tasks|lineage
/$ws/$product/mission/$id     ?tab=timeline|diff|checks|preview
/$ws/$product/run/$id         ?step=<n>
/$ws/$product/threads         ?c=<threadId>&scope=product|workspace

/$ws/mind                     ?belief=<id>                 Beliefs (landing)
/$ws/mind/calls               ?call=<id>
/$ws/mind/outcomes            ?lane=recorded|announced&outcome=<id>
/$ws/mind/map                 ?focus=<kind>:<id>&depth=1|2|3
/$ws/mind/receipts            ?kind=run|spend|check|decision|incident|seal&from=&to=&receipt=<id>

/$ws/settings                 ?section=<SectionId>&connector=&checkout=
/admin                        /admin/{people,workspaces,pricing,platform,observability,proof,ai-costs,routing}
/start                                                     first run, provisioning mode
/m/$productId, /m                                          legacy resolvers, alive forever
```

`mind`, `settings`, `start` are reserved product slugs, DB-enforced alongside the existing `reserved_workspace_slugs` mechanism. TanStack scores a static second segment above `$productSlug`, same trick the root namespace already relies on.

### 6.2 Modal vs page: the rule

**It is a page if any of these is true:**
- you can work on it for more than a minute (spec, mission, run),
- it is shareable outside the workspace (spec, prototype, decision),
- it has tabs of its own.

**Otherwise it is a `?focus=` panel over the canvas**, which keeps the Spine, the Thread and the composer on screen so context is never lost.

**Every panel has "Open full view"** which promotes to the page at the same identity. **Every page has "Back to <parent>"** naming the parent in words. No `?focus=` panel ever opens another `?focus=` panel; the second one promotes to a page. Maximum depth from Work: `Work → page → tab → row panel`. Four levels, hard cap, same discipline `RoomDetail` already enforces for the engine room.

**Escape closes exactly one layer**, innermost first: an open menu, then a panel, then a tab, then the page. Already implemented in `RoomDetail.tsx:209-226`; lift it into `AppFrame`.

### 6.3 Every sub-page is addressable and shareable

Rules that hold everywhere, no exceptions:
- Tab state, filter state, and open-panel state are all in the URL, never in component state. Copying the address bar reproduces the screen.
- The gate tray is `?panel=queue`, so "here is the thing waiting on you" is a link.
- `?focus=` uses `<kind>:<id>` matching `nodeKey()`, so one focus grammar spans Work panels and the Mind map.
- Public share slugs stay exactly as they are: `/p/$slug` (prototype and opportunity), `/d/$slug` (decision), `/t/$slug`, `/proof`.
- Every page carries a copy-link affordance that copies the *canonical* URL, which is the slug form, never the uuid form. `roomLinkFor()` in `room-url.ts` already does this resolution.

### 6.4 Deep link into a surface whose parent state is missing

Resolution runs in this order, and it never bounces you to the landing.

| Case | What happens |
| --- | --- |
| **The entity exists and its parent is derivable** | Hydrate the shell *from the entity*. A `spec/$id` resolves its product, its workspace, and its stage; the frame sets the workspace context, lights Spine 03, and opens the spec. Never 404 a thing that exists just because the context was cold. This generalizes what `$workspaceSlug.$productSlug.tsx:48-52` already does for workspace context. |
| **The entity exists, you lack access** | The exact same answer as "does not exist": one line, no name oracle. The room route already holds this rule and it stays. |
| **The entity is gone** | The **gone card**, rendered in place inside `AppFrame`, not a redirect: "That spec was deleted on 12 Jul. Its decisions are still on the record." plus one door forward. |
| **The URL is retired** (any of the 41 stubs) | Redirect to the new URL **carrying every param**, and land with a one-line dismissible note in the frame: "Traces now live in Mind > Receipts." A silent redirect is how the founder learned not to trust his own links. Governed by `url-history.ts`, which replaces `legacy-redirects.ts` (see §7.4). |
| **A param is invalid** (`?stage=banana`) | Drop the param, keep the surface, no crash. Existing `validateSearch` behavior; keep it. |
| **A param is valid but its target is gone** (`?gate=spec:<deleted>`) | Open the tray, show the gone card in the detail slot, keep the rest of the queue usable. |
| **No product resolves at all** | `/start` in "which product" mode (§3.4), never a blank room and never the public landing. |

### 6.5 The four broken redirects, fixed by name

| Broken today | What actually happens | Fix |
| --- | --- | --- |
| `/briefing` → `/settings?section=brief` | `brief` is not a `SectionId`; it survives only because `LEGACY_SECTION_MAP` aliases it to `workspace`. One prune of that map and the link dies silently. | point it at the real id: `/$ws/settings?section=workspace` |
| `/calendar` → `/brain?tab=calendar&meeting=<id>` | `LEGACY_TABS.calendar = "decisions"`, and the Brain route parses `meeting` but never renders it ("meetings render on Today now", and Today is being deleted). The meeting id is silently dropped. | `/$ws/$product?stage=discover&focus=meeting:<id>` (W-22) |
| `/meetings/$id` | same drop | same fix, id preserved |
| `/impact` → `/brain?tab=insights` | `LEGACY_TABS.insights = "decisions"`, but `ImpactLedgerPanel` actually renders on `/learn`. The link lands on the wrong tab of the wrong surface. | `/$ws/mind/outcomes?lane=recorded` |

---

## 7. WHAT DIES

### 7.1 Routes deleted outright (the file is removed, the URL is served by `url-history.ts`)

| Route | Absorbed by |
| --- | --- |
| `_authenticated.today.tsx` (1543) | Work: Briefing card (W-23), Spine state (W-24), gate tray (W-11/12/13/15), face 01 desk rail (W-22) |
| `_authenticated.decide.tsx` | Work face 02 (`?stage=decide`). It had zero queries of its own |
| `_authenticated.ship.tsx` | Work face 06 |
| `_authenticated.learn.tsx` | Work face 07 + Mind > Outcomes |
| `_authenticated.design.tsx` | Work face 04 (prototypes) + Settings > Workspace > Brand (brand kit) |
| `_authenticated.engine-room.tsx` + `components/engine-room/**` (glance, RoomRail, RoomDetail, 4 rooms) | Mind > Receipts (spend, checks, runs, incidents, seal), Settings > Agents > Instructions & limits (prompts, guardrails, caps, suites, routines), Settings > Agents > Roster (team, trust), Work working strip (emergency controls) |
| `_authenticated.sync.tsx` (842) | Settings > Connections & Data > Sync & bindings, folded in whole |
| `_authenticated.approvals.tsx` (270) | the gate tray |
| `_authenticated.artifacts.tsx` + `ArtifactsSurface.tsx` | stage faces 03/04 own their artifacts; `Cmd+K` search owns "everything in one list"; Mind > Map owns "how they connect". A cross-stage index of things that already have homes is a second home |
| `_authenticated.onboarding.tsx` + `ObsidianOnboarding.tsx` (multi-step, chromeless) | `/start` in provisioning mode |
| `_authenticated.traces.tsx` (bare list) | Mind > Receipts, filter Runs |
| `_authenticated.brain.tsx` | Mind, restructured to 5 tabs |
| all 41 `throw redirect` stub files | one `url-history.ts` table + a single catch-all route |

### 7.2 Concepts deleted

| Concept | Why | Absorbed by |
| --- | --- | --- |
| **Two shells** (`AppShell` 1033 lines + `RoomChrome`) and the pathname allowlist at `_authenticated.tsx:146-185` | this is the disease, not a symptom | one `AppFrame` |
| **"Today" as a surface** | a dashboard of everything is a destination that owns nothing | the Briefing card, the Spine, the tray |
| **The loop as navigation** (7 rail rows, `PRIMARY_NAV` zone `loop`) | a stage is state, not a place | the Spine, which is state drawn once |
| **"Pulse"** as a nav label for `/engine-room` | one word covering spend, evals, guardrails and the ledger, which is why nobody can say what it is for | split by the three-way test (§1.3) |
| **"Brain" as a product noun** | YC's phrase, quoted not owned; and the current tabs read as storage | Mind |
| **Approvals as a destination** | its good state is empty | the gate pill and tray |
| **`surface-registry.ts` in its current shape** (72 of ~90 entries are `status: "planned"`, homes named for a Mission Control IA that half-shipped) | a registry that is two-thirds aspirational cannot enforce anything | rewritten against the table in §2, all entries `live` or deleted; the no-orphan CI test is kept and pointed at the new table |
| **`/decide`, `/ship`, `/learn` as evidence that the loop is real** | the loop is real because `getLoopState` returns real stage state, not because three routes exist | the Spine |

### 7.3 Components deleted

`AmbientChip.tsx` (and `ambient.functions.ts`) · `PendingApprovalsBar.tsx` · `AppShell.tsx` · `RoomChrome.tsx`'s duplicate `ProductSwitcher` (there are two identical copies, one in `RoomChrome.tsx` and one in `MissionShellView.tsx`; keep one) · `components/engine-room/**` · `components/obsidian/today/**` except `MachineNow` (W-19) · `ObsidianOnboarding.tsx` · `ArtifactsSurface.tsx` · `FocusDock.tsx` (the sliver that already had to be excluded from the room because it intercepted composer clicks; the working strip is the honest version) · `delegate-poll.functions.ts`.

### 7.4 `legacy-redirects.ts` → `url-history.ts`

Same idea, three changes: every entry gains a `note` (the one line shown on arrival), every entry is verified against the new home table by a test that fails when a target does not exist, and the 41 stub files collapse into one catch-all route that reads the table. `CANONICAL_PATHS` becomes the two halves plus the reserved statics.

---

## 8. THE MIGRATION

Eight phases. The rule at every phase boundary: **the app is shippable and no URL that worked yesterday 404s today.** Every phase ends with the old path still resolving.

### Phase 0 - Freeze the frame (1 session, no user-visible change)

- Build `AppFrame`: top bar (mark/home, scope switcher, `Work` / `Mind`, gate pill, Ask, account chip), and a body slot.
- `AppFrame` initially renders `Work` = today's `MissionShellView` and `Mind` = today's `/brain`, unchanged.
- Delete the allowlist in `_authenticated.tsx:146-185`. Every authenticated route now renders inside `AppFrame`; the old `AppShell` becomes a *body* component that the still-migrating routes render into, not a shell.
- Resurrect `Cmd+K` = `CommandPalette` (search), keep `Cmd+J` = composer.
- **Gate:** every one of the 75 route files renders inside one frame. Screenshot every route.

### Phase 1 - The landing (1 session)

- `login.tsx` navigates in-router to the resolved room. Kill the `/` → `/m` bounce.
- `/start` becomes the first-run route in provisioning mode; `needsOnboarding` points at it; `MissionOnboarding` and `ObsidianOnboarding` exits change from `/today` to the resolved room.
- `/today` still exists and still works. Nothing is deleted yet.
- **Gate:** a fresh signup reaches a working room in one question, in the same shell. A returning user reaches Work with zero redirects.

### Phase 2 - Work absorbs the loop (2-3 sessions)

- Move the five real stage surfaces into canvas faces: `/discover` → 01, `OpportunityQueue` → 02, `/plan` → 03, `/design` prototypes → 04, `/build` → 05. Faces 06 and 07 are composed from the panels `/ship` and `/learn` already mount.
- Promote the three detail pages to their new URLs with the old ones redirecting: `/plan/spec/$id` → `/$ws/$product/spec/$id`, `/build/$missionId` → `/$ws/$product/mission/$id`, `/traces/$traceId` → `/$ws/$product/run/$id`.
- Build the gate tray: `/approvals` content + `AttentionBell` + `ExecutedCard` + `CompositeReviewCard`, at `?panel=queue`.
- Mount `AudioTranscriptPanel`, `MachineNow`, `CookingBanner`, `AgentActivityTimeline`, `CitationList`.
- **Gate:** every journey in §4 completes end to end without leaving Work. This is the phase that must be verified by walking all seven, not by reading code.

### Phase 3 - The graph (1-2 sessions, backend)

- Extend `ARTIFACT_KINDS` and `GRAPH_NODE_KINDS` with `changeset`, `deployment`, `outcome`, `learning`, `belief`.
- Add the missing `recordLineage` calls on the back half of the loop (mission → changeset → deployment → outcome → learning → belief).
- Backfill lineage for existing rows where the parent is derivable.
- Wire `gate-signals.functions.ts`: every `decideApprovalItem` writes a gate signal.
- **Gate:** `getKnowledgeGraph` on a seeded workspace returns a connected graph from signal to belief. Today it stops at the spec.

### Phase 4 - Mind (2 sessions)

- Restructure `/brain` into `/$ws/mind` with the five tabs. Beliefs is new; Calls, Outcomes and Map are re-presented existing panels; Receipts is new-as-a-page but composed from `TracesPanel`, the trust ledger, the spend panels and the eval panels that all already exist.
- Mount `CostPerOutcomeChip`, `MemoryExpiryBanner`, `TracesPanel`.
- Wire the four in-place Mind renderings into Work (§1.6): precedent card, citations, contradiction warning, assumption pre-fill.
- **Gate:** the half-crossing law holds. Walk all seven journeys again with a stopwatch on any navigation that leaves `/$ws/$product`; the count must be zero.

### Phase 5 - Settings absorbs policy (1-2 sessions)

- Add `instructions` to `SectionId`; move prompts, guardrail rules, house rules, eval suite definitions, budget caps and routine switches into Agents > Instructions & limits.
- Fold `/sync` into `?section=sync` whole. Mount `ProductBindingPicker`, `ProviderCard`, `ApiKeyConnectDialog`.
- Move `/design`'s brand kit into `?section=brand`.
- Wire `researcher.functions` into Agents > Roster > Research.
- Move `/settings` to `/$ws/settings`, keeping `/settings` as a resolver forever.
- **Gate:** every `?section=` id that ever worked still lands. `settings-sections.test.ts` extended, not replaced.

### Phase 6 - Delete (1 session, the fun one)

- Delete everything in §7.1 and §7.3.
- Collapse the 41 stubs into `url-history.ts` plus one catch-all.
- Rewrite `surface-registry.ts` against §2; keep the CI no-orphan test.
- Delete `engine-room/**`, `AppShell.tsx`, `RoomChrome.tsx` duplication, `FocusDock.tsx`.
- **Gate:** the full old-URL list still resolves with a note. `bun run build` is clean. No route file over 900 lines except `/settings`, which is legitimately 16 sections.

### Phase 7 - Prove it (1 session)

- Walk the founder's six named journeys with a stopwatch and a click counter, cold, from login.
- Verify the home table: for every row in §2, click from login and count. Every Work and Mind row must be at or under its stated number.
- Verify the terminal-state register in §4.9: every terminal state offers a next move.
- Verify the deep-link matrix in §6.4 by pasting a cold URL for each case into a fresh session.
- **Gate:** the founder can answer, for any element on any screen, "if I click this, what will happen", without opening the code.

### Phase order rationale

Frame first, because the two-shell branch is what makes every other change ambiguous. Landing second, because it is one day of work and it is the founder's first-second experience. Work before Mind, because Work is where the journeys live and journeys are the acceptance test. Graph before Mind, because Mind without lineage is storage, and storage is the thing we are arguing against. Settings after Work and Mind, because policy is what is left over once state and record have taken what is theirs. Delete last, always, because a deletion before its absorber ships is an outage.

---

## Appendix A: the frame, drawn

```
WORK  /helio-labs/relay?stage=build
┌──────────────────────────────────────────────────────────────────────────────┐
│ ◈ Supaprod  helio-labs / relay ▾   [Work] Mind          ●3   Ask ⌘J    ◐     │
├──────────────────────────────────────────────────────────────────────────────┤
│ 01 Discover ─ 02 Decide ─ 03 Plan ─ 04 Design ─[05 Build]─ 06 Ship ─ 07 Learn │
│    done         done        done      done      working      ·        ·      │
├────────────────────────────┬─────────────────────────────────────────────────┤
│ THREAD                     │ CANVAS · 05 Build            working  Engineer  │
│                            │                                                 │
│ ▸ Briefing                 │  Rollout gate · mission #182                    │
│   3 things moved overnight │  ├ 14 files changed          [diff]             │
│                            │  ├ CI: 2 of 3 green                             │
│ ▸ Challenge, 09:14         │  └ preview: relay-pr-182.dev  [open]            │
│   Teardown held. 2 angles  │                                                 │
│   survived.   [the verdict]│  Building: spec "Rollout gate", you approved     │
│                            │  it 2 days ago.                        ← back-  │
│ ▸ NEEDS YOU                │                                          link   │
│   Engineer wants to run a  │  Design parity: matches the approved mockup.    │
│   migration.               │                                                 │
│   [Approve] [Send back]    │  Next: Launch what we shipped                   │
├────────────────────────────┴─────────────────────────────────────────────────┤
│ ● Engineer is writing tests · 2 agents working · Stop everything             │
├──────────────────────────────────────────────────────────────────────────────┤
│ [ Ask, or pick a journey ]  next?  tear down  PRD  design  build  launch  land│
└──────────────────────────────────────────────────────────────────────────────┘

MIND  /helio-labs/mind
┌──────────────────────────────────────────────────────────────────────────────┐
│ ◈ Supaprod  helio-labs ▾          Work [Mind]           ●3   Ask ⌘J    ◐     │
├──────────────────────────────────────────────────────────────────────────────┤
│  Beliefs   Calls   Outcomes   Map   Receipts          filter: all products ▾  │
├──────────────────────────────────────────────────────────────────────────────┤
│  This loop has closed 14 times. It has stopped you 6 times, and it was       │
│  right 5 of those.                          3 beliefs expire in 6 days →     │
│                                                                              │
│  Enterprise buyers do not care about speed claims.               strong ↑    │
│    Held across 4 calls · last challenged 11 days ago and held                │
│    Changed: killed "2x faster" from the Q3 positioning spec  [see the chain] │
│                                                                              │
│  You approve Critic teardowns 9 times out of 10.                forming ~    │
│    It has started running them without asking on bets over $50k.             │
│    [Turn that off]  [Keep it]                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Appendix B: the one-line answer to each founder sentence

| The founder said | The answer |
| --- | --- |
| "I do not understand where to start" | You land in Work. The Spine shows where your loop already is, and the Canvas opens on the stage that moved most recently. |
| "what to do" | The gate pill is the only red thing on screen. If it is empty, the composer's seven chips are what to do. |
| "why to do" | Every gate carries the precedent behind it and every claim in a spec carries its citation, rendered in place. |
| "how to end" | Every journey has a named terminal state (§4.9) and every terminal state offers the next move. |
| "if I want to do only certain journeys" | Seven chips, seven Spine nodes, and the gate tray. Three entry points, and each lights only its slice of the Spine while the rest stay visible and dim. |
| "everything is broken and not connecting" | §5. Extend the lineage enums, write the back-half edges, and the chain runs signal to belief. Today it stops at the spec, which is exactly where the app stops feeling connected. |
| "if I click this, what will happen" | Nothing navigates without saying where. Retired URLs land with a line naming where the thing moved. Deep links hydrate from the entity instead of bouncing you home. |
| "thought level should be to the ground level" | §2 homes 100% of the surfaces, 19 unmounted components and 4 orphaned server-function families. §6 puts every tab, filter and panel in the URL. |
```
