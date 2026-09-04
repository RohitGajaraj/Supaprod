# The lifecycle, signal to learning and back

> _Created: 2026-08-02 · Last updated: 2026-08-03_

> Status · Code-verified 2026-08-02 · Covers all seven stations · Supersedes `docs/design/*-station-audit.md` for canon

## What this document is

This is the account of Supaprod's seven-station lifecycle, written by opening the code and
citing it. Every structural claim below carries a `file:line` that was read directly. Where a
claim could not be verified, it says **not verified** instead of guessing.

**It supersedes the station audits.** [`design/README.md`](../design/README.md) carries a
standing provenance warning: the eight files in `docs/design/` were written by autonomous audit
subagents, were never reviewed line by line, and are explicitly marked *"do not cite these as
canon."* Two defects reached users from that session. Those files remain useful as leads. This
one is the canon: when it and a `*-station-audit.md` disagree, this one wins, and when this one
is wrong the fix is to open the code and correct it here.

**Naming.** The customer-facing station names and the internal ids differ, on purpose. The map
is in `src/lib/agent-vocabulary.ts:111-167`: `sense` displays as **Discover**
(`agent-vocabulary.ts:127`), `define` displays as **Plan** (`agent-vocabulary.ts:139`), and the
other five match. Route order is fixed at `agent-vocabulary.ts:169-177`.

---

## The loop at a glance

```
                 sources, connectors, Scout, MCP, webhook, manual
                                     |
                                     v
  +--------------------------------------------------------------------------+
  |  01 DISCOVER      signals -> themes            /discover                  |
  |     writeSignals -> clusterSignalsCore -> promoteClustersOnce -> a track   |
  +--------------------------------------------------------------------------+
                                     | theme clears the bar (freq 8, sev 4, conf .75)
                                     v
  +--------------------------------------------------------------------------+
  |  02 DECIDE        ranked bets -> a decision    /decide                     |
  |     ICE  >  Critic verdict  >  brief  >  OUTCOME SUPPORT  >  corroboration |
  +--------------------------------------------------------------------------+
                                     |
                                     v
  +--------------------------------------------------------------------------+
  |  03 PLAN          decision -> spec + tasks     /plan, /plan/spec/$id       |
  +--------------------------------------------------------------------------+
                                     |
                                     v
  +--------------------------------------------------------------------------+
  |  04 DESIGN        spec -> a drawing            /design                     |
  +--------------------------------------------------------------------------+
                                     |
                                     v
  +--------------------------------------------------------------------------+
  |  05 BUILD         spec + design -> changeset   /build, /runs/$missionId    |
  +--------------------------------------------------------------------------+
                                     |
                                     v
  +--------------------------------------------------------------------------+
  |  06 SHIP          changeset -> deployment      /ship   [THE ONE GATE]      |
  |     merged + green preview -> production, prds.shipped_at, launch_plan     |
  +--------------------------------------------------------------------------+
                                     |
                                     v
  +--------------------------------------------------------------------------+
  |  07 LEARN         deployment -> a verdict      /learn                      |
  |     learnings row  +  opportunities.confidence  +  agent_memory            |
  +--------------------------------------------------------------------------+
         |                          |                             |
         |  learnings.opportunity   |  confidence -> ice_score    |  agent_memory
         |  -> theme -> outcome     |  (rank key 1)               |  -> Critic
         |     support (rank key 4) |                             |     precedent
         +--------------------------+-----------------------------+
                                     |
                                     v
                          back into 02 DECIDE, next bet
```

The driver that walks a track from Discover to Learn with nobody watching is
`driveTrackOnce` (`src/lib/spine/driver.server.ts:423`), called once per open track by the
`track-tick` cron hook (`src/routes/api/public/hooks/track-tick.ts:74`), which runs every ten
minutes (`supabase/migrations/20260801150000_spine_track_drive_state.sql:69-82`) and takes at
most five tracks per sweep (`track-tick.ts:35`). One station per track per tick, deliberately
(`track-tick.ts:21-25`).

---

## 01 Discover

**Purpose.** Read the world, keep what changed, and group it into themes a person can act on.

**What arrives.** `SignalCandidate[]` from every source. There is exactly one write path into
`public.signals`: `writeSignals` in `src/lib/sources/sink.server.ts:27`. Connectors, the Scout,
MCP sources, the webhook and manual entry all funnel through it, so dedup by `external_id`
(`sink.server.ts:36-46`), the injection screen and the `source_kind` stamp
(`sink.server.ts:48-54`) are inherited by construction rather than re-implemented per source.

**What the human does.** `/discover` renders `DiscoverSurface`
(`src/routes/_authenticated.discover.tsx:36`). The wired writes are `createSignal`,
`clusterSignals`, `promoteThemeToOpportunity`, `generatePrd`, `setThemeStatus`,
`attachThemeToOpportunity` and `toggleAutoCluster`
(`src/components/discover/DiscoverSurface.tsx:218-233`). `?tab=queue` redirects to `/decide`
(`_authenticated.discover.tsx:34`), because the ranked queue left this surface on 2026-07-13.

**What the agents do with no human present.**

- `sense-tick` normalizes and auto-tags untagged signals for every workspace with
  `auto_sense_enabled` (`src/routes/api/public/hooks/sense-tick.ts:16-30`). Rule-based, no AI
  spend, at most 5 workspaces and 50 updates each (`sense-tick.ts:31-33`).
- `scout-tick` walks each workspace's due watch-list targets, diffs against the last snapshot,
  and emits a signal only on a real change, through `writeSignals`
  (`src/routes/api/public/hooks/scout-tick.ts:19-35`). Gated on `FIRECRAWL_API_KEY`.
- `cluster-tick` re-clusters unclustered signals every ten minutes for opted-in workspaces
  (`src/routes/api/public/hooks/cluster-tick.ts:87`, schedule
  `supabase/migrations/20260707202000_sw6_cron_truth.sql:52`), then, in the same tick, promotes
  qualifying clusters into work (`cluster-tick.ts:109`).
- The promotion bar is `frequency >= 8`, `severity >= 4`, `confidence >= 0.75`
  (`src/lib/spine/promote.ts:69-78`), never re-promotes a theme a person settled
  (`promote.ts:87`), and takes at most two per workspace per sweep
  (`promote.ts:158`). `promoteClustersOnce` (`src/lib/spine/promote.server.ts:98`) reports which
  kind of zero it returned (`promote.server.ts:62-75`), so "nothing qualified" can be told apart
  from "the column does not exist".

**Data flow.**

1. A source produces candidates. `writeSignals` fetches already-seen `external_id`s
   (`sink.server.ts:39-45`), runs `prepareSignalRows` (`sink.server.ts:48`), attaches embeddings
   (`sink.server.ts:63`), inserts (`sink.server.ts:66`).
2. Every inserted signal gets a `stage_events` row with `to: "sensed"`
   (`sink.server.ts:75-84`).
3. `clusterSignalsCore` reads at most 80 unclustered signals for one user, scoped by workspace
   and product (`src/lib/ai/cluster.server.ts:118-138`), asks the model for 3 to 7 themes
   (`cluster.server.ts:154-159`), and inserts each theme with a novelty score
   (`cluster.server.ts:206-234`).
4. Signals are claimed atomically: the update only matches rows still `theme_id is null`
   (`cluster.server.ts:251-256`), so a manual cluster racing the cron cannot move a signal
   between themes.
5. Remaining signals attach to existing themes by cosine similarity through the `match_themes`
   RPC (`cluster.server.ts:299-303`), above a 0.8 threshold (`cluster.server.ts:75-77`), with
   an explicit workspace and product re-check before the attach because the RPC itself is not
   scoped (`cluster.server.ts:324-337`).
6. A dismissed theme re-opens only when it has both doubled and grown by at least three since
   the decline (`cluster.server.ts:363-367`).
7. `promoteClustersOnce` turns a qualifying theme into a `spine_tracks` row via `startTrackCore`
   (`promote.server.ts:175-189`), entering at `shape: "new-capability"` so the work walks the
   whole route with nothing waived (`promote.server.ts:177-184`).

**Tables touched.** `signals`, `themes`, `artifact_lineage` (`cluster.server.ts:273`),
`stage_events`, `spine_tracks`, `workspaces` (the `last_auto_cluster_at` stamp,
`cluster-tick.ts:88-91`), `workspace_routine_prefs` (`cluster-tick.ts:54-59`).

**Agent tools.** `signals.log`, `signals.list`, `themes.list`, `cluster.trigger`,
`research.synthesize`, `sources.status`, `sources.connect`. The attach map records that
`signals.log` files a `signal` and that `cluster.trigger` and `research.synthesize` file a list
of `theme` ids (`src/lib/spine/attach.ts:142`, `:156-157`).

**What leaves.** A `themes` row, and when it clears the bar, a `spine_tracks` row that the
driver then walks. The station's declared artifact is a `signal`
(`src/lib/spine/attach.ts:201`).

---

## 02 Decide

**Purpose.** Put one ranked bet in front of the person, with the account's own record beside it,
and settle it.

**What arrives.** Opportunities (from promoted themes) plus every input the ranking reads.

**What the human does.** `/decide` renders `DecideSurface`
(`src/routes/_authenticated.decide.tsx:807`, component defined at `:143`). Wired writes:
`runCriticReview` (`decide.tsx:326`), `generatePrd` (`decide.tsx:338`, which navigates straight
to the spec it wrote at `:348-352`), `updateOpportunity` (`decide.tsx:358`), `deleteOpportunity`
(`decide.tsx:378`).

**What the agents do with no human present.** The driver dispatches the Decide crew,
`strategist` then `critic`, in that order (`src/lib/spine/driver.ts:106-113`). The strategist is
told to call `decision.record` with the alternatives it weighed; the critic is told to call
`critic.evaluate` and, if the call should not stand, `decision.revise`
(`driver.ts:108`, `:112`). The station brief is at `driver.ts:340`, the job text at
`driver.ts:358`.

**Data flow.**

1. `/decide` fetches opportunities, themes, learnings and brief alignment
   (`decide.tsx:166-178`).
2. Learnings are bucketed per theme, counting only `validated` and `missed`
   (`decide.tsx:229-239`).
3. Each theme's counts fold into one number by `outcomeSupportFromCounts`
   (`decide.tsx:242`, defined `src/components/discover/ranking.ts:68-72`), which is
   `min(validated,3) - min(missed,3)`.
4. `rankOpportunities` (`ranking.ts:283`) sorts on a fixed nine-key chain: ICE score, then the
   Critic's verdict rank, then brief alignment, then outcome support, then corroboration,
   confidence, impact, `created_at`, and finally the id as an absolute finalizer
   (`ranking.ts:319-331`, documented `ranking.ts:110-129`).
5. The rationale sentence names the outcome signal qualitatively, never as a raw count
   (`ranking.ts:203-204`).
6. Precedent citations are fetched only once there are at least three recorded outcomes
   (`decide.tsx:280-285`), through `getPrecedentCitations`
   (`src/lib/decision-judgment.functions.ts:193`), which runs a semantic walk over the
   workspace's outcome memories (`decision-judgment.functions.ts:221-225`).
7. The Critic itself reads the same precedent before red-teaming
   (`src/lib/ai/critic.server.ts:222-228`).

**Tables touched.** `opportunities`, `themes`, `learnings`, `decisions`, `agent_memory` (read),
`artifact_lineage` (`critic.server.ts:141`).

**Agent tools.** `decision.record` (files a `decision`, `attach.ts:161`), `decision.revise`,
`critic.evaluate`, `backlog.prioritize`. `decision.record` closed a real gap: until it existed,
the one station whose job is deciding had no tool that could record a decision
(`attach.ts:205-211`).

**What leaves.** A `decisions` row, and in practice a `prds` row when the person or the agent
draws the spec. The station's declared artifact is a `decision` (`attach.ts:202-212`).

---

## 03 Plan

**Purpose.** Turn the decision into a spec that states the outcome it moves and how anyone would
know it worked, plus the tasks that spec implies.

**What arrives.** A decision, and a track carrying its origin.

**What the human does.**

- `/plan` renders `PlanPage` (`src/routes/_authenticated.plan.index.tsx:158`, component `:188`).
  It reads `getRoadmap` (`:198`), `getAgentFleet` (`:218`) and `listSpecs` (`:219`).
- The declare-the-outcome ceremony writes through `commitRoadmapItem`
  (`plan.index.tsx:236-248`, gate button `:384-398`, confirm `:422-432`).
- `RoadmapColumns` carries five more writes: move, rewind, commit, edit outcome, bulk move
  (`src/components/plan/RoadmapColumns.tsx:86`, `:98`, `:107`, `:121`, `:134`).
- `TrackStart` is the human front door to the autonomous loop: `startTrack` and `advanceTrack`
  (`src/components/spine/TrackStart.tsx:100`, `:143`), mounted at `plan.index.tsx:442`.
- `/plan/spec/$id` renders `SpecEditorPage`
  (`src/routes/_authenticated.plan.spec.$id.tsx:263`, component `:289`) with
  `generateTaskGraph` (`:379`), `dispatchStudioSession` (`:397`), `createGithubIssueForPrd`
  (`:416`), `createDecision` (`:428`), `savePrd` (`:464`) and `prdAssist` (`:505`).
- `/roadmap` renders nothing. It is a ten-line redirect to `/plan?view=roadmap`
  (`src/routes/_authenticated.roadmap.tsx:8`).

**What the agents do with no human present.** The Plan crew is two seats, and the order matters:
`prd-writer` writes the spec and must call `prd.draft`, then `sprint-planner` breaks that spec
into work and must call `tasks.create` (`driver.ts:115-122`). Each seat is briefed with what the
previous seat filed (`driver.server.ts:509-512`, `:587-593`).

**Data flow.**

1. `driveTrackOnce` loads what earlier stations filed and builds the handoff
   (`driver.server.ts:448`, `describeUpstream` at `driver.ts:280`). The two most recent
   artifacts arrive whole, up to 6000 characters each (`driver.ts:254`, `:265`).
2. Each seat is dispatched through `runAgentLoop` (`driver.server.ts:556-566`), the same
   chokepoint a human-started run uses, so guardrails, trust arc and spend cap all apply.
3. `prd.draft` (`src/lib/ai/tools/registry.server.ts:2396`) reads the opportunity
   (`:2409`) and inserts a `prds` row (`:2480`), returning `prd_id`.
4. The driver re-reads the record rather than trusting the step, then files a
   `spine_track_members` row (`driver.server.ts:587`, mapping at `attach.ts:144`).
5. If the station ran cleanly and filed nothing, the track does **not** move. It records
   `produced-nothing`, counts an attempt, and tries again (`driver.server.ts:750-768`). This was
   added on 2026-08-01 after a live track walked Plan to Ship having produced one prototype and
   no spec at all (`driver.server.ts:734-740`).
6. Three attempts is the ceiling (`driver.ts:231`, checked `driver.ts:396`).

**Tables touched.** `prds` (`src/lib/discovery.functions.ts:968`, `:983`, `:1708`, `:2067`),
`opportunities` (`src/lib/roadmap.functions.ts:84`, `:143`, `:250`), `roadmap_audit`
(`roadmap.functions.ts:56`), `tasks` (`discovery.functions.ts:192-204`,
`src/lib/tasks.functions.ts:9`), `decisions`, `artifact_lineage`
(`src/lib/lineage.functions.ts:215`), `spine_tracks`, `spine_track_members`
(`src/lib/spine/track.functions.ts:185`, `:245`), `stage_events`
(`discovery.functions.ts:1305-1313`).

**Agent tools.** `prd.draft` (`registry.server.ts:2396`), `prd.revise` (`:2515`),
`prd.link_issue` (`:2228`), `tasks.create`, `roadmap.move` (`:2834`). Note that `generatePrd`
(`discovery.functions.ts:1893`), the AI spec drafter, is a server function on Discover and
Decide, not a Plan surface and not an agent tool: its only callers are
`DiscoverSurface.tsx:224` and `decide.tsx:158`.

**What leaves.** A `prds` row. Downstream it feeds the design gate
(`src/lib/build/design-gate.server.ts:20`), the Build dispatch as an ARD block
(`src/lib/build.functions.ts:408`), GitHub issues (`discovery.functions.ts:1844`), and Learn's
grading sweep (`src/routes/api/public/hooks/outcome-tick.ts:114-131`). The station's declared
artifact is a `prd` (`attach.ts:213`).

---

## 04 Design

**Purpose.** Draw the surface the spec describes, against the workspace's standing design
language, and say what the language does not cover.

**What arrives.** A `prds` row, plus the workspace's `design_memory` rules.

**What the human does.** `/design` renders `Design`
(`src/routes/_authenticated.design.tsx:1046`, component `:260`). Nine wired writes: settle a
brand rule (`:336`), draw at a fidelity (`:368`), approve or send back (`:388`), rate the taste
(`:427`), ask the Critic (`:455`), turn a finding into a standing rule (`:490`), publish a
prototype link (`:516`), open or close the share link (`:534`), and turn the design gate on or
off (`:554`, owner only, `:643`). A second Design surface, `DesignScaffoldPanel`, lives inside
the spec editor (`plan.spec.$id.tsx:982`).

**What the agents do with no human present.** The Design crew is `ux-architect` then
`design-critic` (`driver.ts:124-131`). Both are dispatched unattended by the same driver, and
both are told to call `design.draft`.

**Data flow.**

1. The driver dispatches `ux-architect` with the spec inlined in the brief
   (`driver.server.ts:556-566`, `driver.ts:126`).
2. `design.draft` (`registry.server.ts:2732`) inserts a row into `prototypes` (`:2745`) and
   returns `prototype_id`.
3. The driver files it as a member with kind `prototype` (`attach.ts:162`, `:214-220`).
4. `design-critic` is then briefed with the prototype the first seat filed and reads it back
   against the standing system (`driver.ts:128-131`).
5. Separately, on the human path, `generateDesignScaffold`
   (`src/lib/design-scaffold.functions.ts:388`) and `redrawDesignScaffold` (`:1190`) both write
   through one upsert into `prd_scaffolds` (`:366`).
6. `decideDesignGate` (`design-scaffold.functions.ts:663`) sets `prds.design_gate_status` and
   records the stage event with `actor: "human"` (`:705`).
7. On dispatch to Build, `loadDesignDispatchContext` (`design-gate.server.ts:41-56`) reads
   `design_memory`, `prd_flows` and `prd_scaffolds.html`, and `toArdDesignSection`
   (`src/lib/build/design-gate.ts:77`) folds the scaffold HTML into the ARD, capped at 20000
   characters (`design-gate.ts:65`).

**The split that matters.** The autonomous station writes `prototypes`. Everything downstream
reads `prd_scaffolds`. `loadDesignDispatchContext` never touches `prototypes`
(`design-gate.server.ts:45-49`), and `listDesignWork` builds the `/design` drawings map from
`prd_scaffolds` alone (`design-scaffold.functions.ts:877-905`, using `prototypes` at `:919-925`
only for a share count). So an unattended design run produces a real row that Build's context
never sees and `/design` never draws. This is recorded in the gap table below.

**Tables touched.** `prd_scaffolds` (write `design-scaffold.functions.ts:366`; reads `:427`,
`:490`, `:877`, `:1067`, plus `src/lib/prototypes.functions.ts:77` and
`src/lib/run-stages.functions.ts:446` and `design-gate.server.ts:23`, `:49`), `prds`
(`design-scaffold.functions.ts:631`, `:672`, `:684`), `prototypes`
(`registry.server.ts:2745`, `prototypes.functions.ts:44`), `prototype_files`
(`prototypes.functions.ts:111`), `design_memory` (`src/lib/design-memory.functions.ts:109`,
`:276`), `prd_flows` (`design-scaffold.functions.ts:286`), `artifact_lineage`, `workspaces`,
`stage_events`.

**Agent tools.** Exactly one: `design.draft` (`registry.server.ts:2732`). No agent tool writes
`prd_scaffolds`, sets `design_gate_status`, or writes `design_memory`. The tool's own docstring
concedes the split (`registry.server.ts:2726-2731`).

**What leaves.** A `prototypes` row on the agent path; a `prd_scaffolds` row on the human path.
Only the second reaches Build. The station's declared artifact is a `prototype`
(`attach.ts:214-222`).

---

## 05 Build

**Purpose.** Write the code to the spec and the design, staged into a changeset, stopping at any
boundary the agent may not cross alone.

**What arrives.** The spec, the design context, and a mission.

**Route topology.** Both `/studio/$missionId` and `/build/$missionId` are redirects.
`_authenticated.studio.$missionId.tsx:19` redirects to `/build/$missionId`, which at
`_authenticated.build.$missionId.tsx:15` redirects again to `/runs/$missionId`. The real run
surface is `BuildRun` (`src/routes/_authenticated.runs.$missionId.tsx:1201`, component `:1208`).
The `/build` index is its own page, `BuildEngine`
(`src/routes/_authenticated.build.index.tsx:474-475`).

**What the human does.** Dispatch a spec to Build from the spec editor
(`plan.spec.$id.tsx:397`); watch and intervene on `/runs/$missionId`; approve queued calls;
set the workspace spend ceiling from `/build` (`build.index.tsx:439-452`, server functions
`src/lib/governance.functions.ts:468`, `:513`); promote to production from `ChangesPanel`
(`src/components/studio/ChangesPanel.tsx:614-617`, mounted at `runs.$missionId.tsx:1181`).

**What the agents do with no human present.** The Build crew is `builder` then `qa`
(`driver.ts:133-140`). Build is the one station for which the driver opens a mission itself,
because `studio.stage` refuses without one (`driver.server.ts:533-534`, `missionForTrack` at
`:286-329`).

**Data flow.**

1. `runAgentLoop` (`src/lib/ai/loop.server.ts:464`) resolves the agent (`:489-495`), the
   workspace (`:505-509`), and the model (`:513-516`).
2. Concurrency backpressure: at most five running runs per workspace, the rest are queued
   (`loop.server.ts:45`, checked `:521-526`).
3. The tool list is the registry, not the database. `resolveToolAccess(Object.keys(TOOL_REGISTRY), overrideRows)`
   (`loop.server.ts:613`); a tool with no `agent_tools` row is live, and only `enabled = false`
   turns it off (`loop.server.ts:592-608`). This closed a real outage: eleven of sixteen
   accounts could not call `prd.draft` before it (`loop.server.ts:600-602`).
4. Step budget is adaptive, not a flat six. `adaptiveStepBudget` (`loop.server.ts:858`, defined
   `src/lib/ai/budget.ts:54`) gives the `builder` role a base of 24 (`budget.ts:37`), plus 2 at
   the `trusted` arc (`budget.ts:44`), under a hard ceiling of 40 (`budget.ts:23`). The loop
   bound is `loop.server.ts:961`.
5. Approval mode resolves through `resolveToolMode` (`loop.server.ts:155-212`), which calls
   `resolveApprovalMode` (`src/lib/ai/trust.server.ts:76-92`). The default arc is `trusted`
   (`trust.server.ts:265`), and at `trusted` a `confirm` tool executes inline
   (`trust.server.ts:81-83`). Risk floors sit above the arc:
   `HIGH_RISK_FORCE_REVIEW = {studio.pr.merge, studio.revert, delegate.openhands, release.publish}`
   (`src/lib/ai/trust-ramp.ts:41-51`) never graduates (`trust-ramp.ts:64`), and
   `BUILD_LANE_AUTONOMOUS = {studio.stage, studio.commit, studio.pr.open}`
   (`trust-ramp.ts:39`) is exempt from the generic high-risk demotion (`loop.server.ts:181`).
6. A `review` or `confirm` write tool queues an `agent_approvals` row and pauses the run
   (`loop.server.ts:1221-1250`, `:1258`).
7. `studio.stage` (`registry.server.ts:1413`) creates the changeset lazily, only when there is
   no active one (`:1471-1486`), inserting into `studio_changesets` (`:1474`) and upserting
   line-level rows into `studio_changes` (`:1543-1545`).
8. Persistence is three-way and there is **no `agent_steps` table**: the full conversation and
   step arrays are checkpointed into `agent_run_checkpoints`
   (`loop.server.ts:919-943`, `onConflict: "run_id,step_index"` at `:942`), each tool
   invocation writes a `tool_calls` row (`:1308`, failure at `:1336`), and `agent_runs` carries
   the cursor (`:944-950`).
9. A seat that puts a call in front of a person stops the whole crew, not just itself
   (`driver.server.ts:582`), because the seats after it are briefed on what it filed and it has
   not filed yet.

**Spend.** The track ceiling is checked before every seat, not once per tick
(`driver.server.ts:541`, rationale `:537-540`), defaulting to 5 USD
(`src/lib/spine/track-caps.server.ts:53`) and resolved per workspace (`:72-99`). The mission
ceiling is enforced fail-closed in `checkMissionCaps`
(`src/lib/ai/runtime.server.ts:216`, spend branch `:254`) against mission-wide totals via the
`mission_cap_state` RPC (`runtime.server.ts:228`). Every writer resolves through
`resolveMissionSpendCap` (`src/lib/ai/mission-caps.server.ts:46`), which defaults to 10 USD
(`mission-caps.server.ts:36`) and fails **closed** to that number on a read error (`:62`).
Writers: `loop.server.ts:539`, `loop.server.ts:576`, `src/lib/ai/handoff.server.ts:420`.

> **Correction to standing canon.** `CLAUDE.md` currently states that every writer passes
> `?? null` and therefore *"there is no spend cap."* That was true when written and is not true
> now. Migration `supabase/migrations/20260730010000_mission_spend_cap_default.sql:28-30` added
> `workspaces.default_mission_spend_cap_usd`, the three named writers were converted, and the
> ceiling is settable from `/build`. One narrow hole remains: `src/lib/ai/fanout.server.ts:66`
> passes `args.spend_cap_usd ?? null`, and an explicit `null` reads as "somebody said none"
> (`mission-caps.server.ts:51`), so the fan-out path can still bypass the workspace default.

**Tables touched.** `agent_runs`, `agent_run_checkpoints`, `agent_messages`, `agent_approvals`,
`agent_tools`, `agent_tool_modes`, `tool_calls`, `missions`, `mission_steps`,
`studio_changesets`, `studio_changes`, `studio_changeset_revisions`, `builder_file_claims`
(`loop.server.ts:522`, `:610`, `:850`, `:919`, `:971`, `:1089`, `:1223`, `:1308`;
`registry.server.ts:1474`, `:1495`, `:1602`, `:1737`).

**Agent tools.** 55 tools are registered (`registry.server.ts:3375-3432`; the four `mission.*`
tools are imported from `src/lib/ai/tools/orchestrator.server.ts:109`, `:341`, `:394`, `:447`).
The code-writing set: `repo.tree` (`:1284`), `repo.read` (`:1329`), `repo.search` (`:1376`),
`studio.stage` (`:1413`), `studio.commit` (`:1573`), `studio.fix.commit` (`:1807`),
`studio.pr.open` (`:1852`), `studio.pr.merge` (`:1927`), `studio.sync_branch` (`:2116`),
`studio.revert` (`:2184`), `ci.logs` (`:1764`).

**Changeset state.** `status` is one of `staged`, `committed`, `pr_open`, `merged`, `abandoned`
(`supabase/migrations/20260612100000_f_studio_engine.sql:23-24`). Transitions: default on insert
(`:23`), `committed` at `registry.server.ts:1553`, `pr_open` at `:1904-1912`, `merged` at
`:2079-2082` which also releases the file claims (`:2083-2091`).

**What leaves.** A `studio_changesets` row in `status = 'merged'`, with `repo`, `branch`,
`pr_url`, `pr_number` and `prd_id`, plus a successful preview `deployments` row. The station's
declared artifact is a `changeset` (`attach.ts:223-236`).

---

## 06 Ship

**Purpose.** Take the merged change to production, record where it went, and tell the world.

**What arrives.** A merged changeset with a green preview deploy.

**The one gate in the loop.** `release.publish` is pinned to `review` by default
(`src/lib/ai/tools/defaults.ts:120`) and sits in `HIGH_RISK_FORCE_REVIEW`
(`trust-ramp.ts:50`), which never graduates (`trust-ramp.ts:64`). `resolveToolMode` forces it to
`review` unconditionally (`loop.server.ts:163-169`; the one `AUTO_SHIP_ENABLED` carve-out at
`:167` applies to `studio.pr.merge` only). The loop then queues an approval and pauses
(`loop.server.ts:1221-1250`). Nothing auto-approves: `approvals-tick` only expires stale rows
(`src/routes/api/public/hooks/approvals-tick.ts:47-55`), and execution resumes only through
`decideApproval` behind `requireSupabaseAuth`
(`src/lib/agent_loop.functions.ts:74-124`, execute at `:120-122`). The pin is asserted by test,
not left to a default (`src/lib/ai/tools/defaults.test.ts:51-66`). The reasoning is in the code:
a production deploy is irreversible from inside the product and customers see it, and it being
the only gate is what makes the autonomy of the other six defensible
(`trust-ramp.ts:45-50`, `attach.ts:240-246`).

**What the human does.** `/ship` renders `Ship`
(`src/routes/_authenticated.ship.tsx:616`, component `:186`) and owns the announcement only:
draft (`ship.tsx:277-289`), then publish (`:291-305`). The promote-to-production button is not
on `/ship`; it is on the run surface (`ChangesPanel.tsx:612-618`).

**What the agents do with no human present.** The Ship crew is `release-verifier` then
`release` (`driver.ts:142-149`). The verifier records a readiness call with `decision.record`
and is told to stop rather than publish if it is not ready (`driver.ts:144`). The `release` seat
calls `release.publish`, which queues for a person.

**Data flow through `promoteChangesetToProductionCore`**
(`src/lib/deployments.functions.ts:162-166`).

1. Read the changeset (`deployments.functions.ts:168-174`).
2. Refuse anything not `merged` (`:175-177`).
3. Refuse unless a successful `preview` deployment already exists for it (`:179-192`).
4. Resolve GitHub credentials (`:194-199`) and collect the repo files at the preview's commit
   (`:200-204`), so production deploys the same commit rather than rebuilding.
5. Deploy with `production: true` (`:205-213`, provider is Deno Deploy,
   `src/lib/hosting/changeset-deploy.server.ts:175-182`).
6. Upsert the `deployments` row with `environment: "production"`, `triggered_by: "promote"`
   (`:216-239`).
7. Generate release notes if the changeset has none (`:245-251`, best effort).
8. Write the receipt: an `agent_approvals` row with `tool_name: "deploy.promote"`,
   `status: "approved"` (`:255-270`). There is no `deploy.promote` tool; that string exists only
   as this receipt's label.
9. If the changeset carries a `prd_id`, stamp `prds.status = "shipped"` and `shipped_at`, and
   record the stage event (`:273-294`).
10. Arm the outcome window: insert a `launch_plans` row with `check_by` if none exists
    (`:295-314`, `check_by: defaultCheckByDate(nowIso)` at `:311`). **This is the link into
    Learn.**

**Announcements.** Entirely human. `createAnnouncement`
(`src/lib/announcements.functions.ts:80-126`, insert at `:108`) with an egress secret scan
(`:95-96`) and a PII scan (`:99-100`); `submitForApproval` (`:167-197`); `approveAndPublish`
through a SECURITY DEFINER RPC that re-checks owner or admin at the database (`:199-213`). The
role matrix is at `src/lib/announcements.ts:23-26`. There is no agent tool and no cron that
writes an announcement, and the route says so in its own header
(`_authenticated.ship.tsx:46-48`). Published rows are read at `/p/$slug`
(`src/routes/p.$slug.tsx:70-73`).

**Tables touched.** `studio_changesets` (read), `deployments` (read and upsert),
`agent_approvals` (insert), `prds` (update), `launch_plans` (insert), `stage_events`,
`changelog_entries` (`src/lib/changelog.functions.ts:60`, `:111`), `announcements`,
`workspace_members`.

**Agent tools.** `release.publish` (`registry.server.ts:2808-2823`, calling the same core a
person does, at `:2816`), `studio.pr.merge` (`:1927`), `studio.revert` (`:2184`). All three are
force-review.

**What leaves.** A `deployments` row, a live production URL (`deployments.functions.ts:320`),
a shipped PRD, and an armed launch plan. The station's declared artifact is a `deployment`
(`attach.ts:237-247`), and it arrives via `agent_approvals.result` because the tool is gated
(`attach.ts:164-167`).

---

## 07 Learn

**Purpose.** Grade what shipped against what the spec said it was for, and put the verdict where
the next decision will meet it.

**What arrives.** A shipped PRD and a launch plan whose `check_by` window is closing.

**What the human does.** `/learn` renders `Learn`
(`src/routes/_authenticated.learn.tsx:124`, component `:148`) and mounts `SettlePanel`
(`:327`). `recordOutcome` has exactly two call sites in the whole repo, both human-clicked
mutations: `src/components/learn/SettlePanel.tsx:115` (fired from the button at `:388-391`) and
`src/components/product/OutcomeCard.tsx:63` (fired at `:274`). It is imported nowhere in
`src/lib/ai/` and nowhere in `src/routes/api/`.

**What the agents do with no human present.**

- The Learn crew is `data-analyst` then `insight-keeper` (`driver.ts:150-163`). The analyst
  calls `learning.record`; the keeper calls `memory.remember` with scope `global`. The keeper's
  brief carries its own bug history: it used to say "call memory.promote", the agent did exactly
  that with a learnings id rather than an `agent_memory` id, and every run failed
  (`driver.ts:157-162`).
- `outcome-tick` runs hourly (`supabase/migrations/20260707202000_sw6_cron_truth.sql:69`) and
  does four passes: stamp PRDs shipped when their GitHub issue closes
  (`src/routes/api/public/hooks/outcome-tick.ts:113-133`); draft outcome suggestions for shipped
  PRDs with no outcome yet, suppressed until the launch window closes (`:142-209`); run the
  outcome-review sweep on expired windows (`:218`); and run the learning-compounding pass
  (`:231`).
- `runOutcomeReviews` (`src/lib/ai/outcome-review.server.ts`) writes a `learnings` row **with**
  `opportunity_id` (`:207-220`, the field at `:211`). By design it never writes `prds.outcome`
  and never moves opportunity confidence (`outcome-review.server.ts:19-22`).

**Data flow of `recordOutcome`** (`src/lib/outcome.functions.ts:231-501`).

1. Read the PRD (`:248-252`) and, best effort, the merged changeset that shipped it, so the
   memory records how it shipped and not only the verdict (`:265-282`).
2. Write `prds.outcome` (`:283-296`).
3. If the PRD has an opportunity, move `opportunities.confidence` by the verdict delta and clamp
   it (`:304-321`). `ice_score` is a generated column, so this moves the ranking's primary key.
4. Insert the `learnings` row with `prd_id`, `opportunity_id`, verdict, summary, `prior_ice` and
   `new_ice` (`:329-345`).
5. Distil it into a global, embedded `agent_memory` row through `rememberOutcome`
   (`:352-373`, defined `src/lib/ai/memory.server.ts:214-303`). The write is idempotent per PRD
   (`memory.server.ts:252-257`) and is **skipped entirely** when no embedding can be produced,
   because `match_agent_memory` hard-filters on `embedding is not null` and there is no re-embed
   sweep (`memory.server.ts:237-248`).
6. Publish the changelog entry (`:379-390`), infer supersession edges (`:398-413`) and the
   direct validates or contradicts edge (`:419-428`).
7. Hold the deciding agent's trust arc when the verdict is `missed` (`:437-447`).
8. Report what the verdict did to the next bet, reading the theme's decisive outcomes the same
   way `/decide` reads them (`:461-481`).

**Tables touched.** `prds`, `opportunities`, `learnings`, `agent_memory`, `memory_recall_log`
(`memory.server.ts:193`), `changelog_entries`, `studio_changesets` (read), `decisions` (read),
`agents` and `agent_autonomy` (read), `launch_plans` (read), `artifact_lineage`.

**Agent tools.** `learning.record` (`registry.server.ts:2767-2800`), `memory.remember`
(`:403`), `memory.reflect` (`:464`), `memory.promote` (`:508`).

**What leaves.** A `learnings` row, a moved `opportunities.confidence`, and an `agent_memory`
row. All three feed back into Decide. The station's declared artifact is a `learning`
(`attach.ts:248-257`).

---

## How the loop actually closes

A recorded outcome reaches the next decision by three separate paths. Two of them are live and
verified; the third depends on which writer recorded it.

### Path A: the theme seam (rank key 4)

| Hop | What happens | Where |
| --- | --- | --- |
| 1 | A person settles a shipped spec | `src/components/learn/SettlePanel.tsx:388-391` calls `:115` |
| 2 | `recordOutcome` inserts a `learnings` row carrying `opportunity_id` | `src/lib/outcome.functions.ts:329-345`, field at `:335` |
| 3 | `listLearnings` reads it back and embeds `opportunities(title, theme_id)` | `src/lib/outcome.functions.ts:860-866` |
| 4 | The embed is flattened to `opportunity_theme_id` | `src/lib/outcome.functions.ts:896-906`, assignment `:904` |
| 5 | `/decide` queries it under the key `["learnings"]` | `src/routes/_authenticated.decide.tsx:171-173` |
| 6 | Rows are bucketed per theme; `mixed` and themeless rows are skipped | `decide.tsx:229-239`, guard `:232-234` |
| 7 | `outcomeSupportFromCounts(validated, missed)` folds them into one number in `[-3, +3]` | `decide.tsx:242`, defined `src/components/discover/ranking.ts:68-72` |
| 8 | It is passed as the `outcomeSupportOf` callback into `rankOpportunities` | `decide.tsx:249-255`, arg at `:252` |
| 9 | It becomes tie-break key 4 in the deterministic comparator | `ranking.ts:310`, `:323`; chain documented `ranking.ts:110-129` |
| 10 | The ranked queue and the single "call in front of you" render from it | `decide.tsx:261-270` |
| 11 | The reorder is named in words, not left silent | `ranking.ts:203-204` |

The same chain runs server-side for the Brain insight push:
`src/lib/brain/push-insights.server.ts:68-74` reads, `:135-152` counts and folds, `:156-160`
ranks; it is driven by the `derive-tick` cron
(`src/routes/api/public/hooks/derive-tick.ts:8`).

### Path B: the ICE seam (rank key 1)

`recordOutcome` moves `opportunities.confidence` (`outcome.functions.ts:314-321`). `ice_score`
is a generated column, so the change propagates to the comparator's **first** key
(`ranking.ts:320`). This is the stronger of the two ranking effects, and it fires only on the
human path: the outcome-review cron explicitly refuses to touch confidence
(`outcome-review.server.ts:19-20`), and `learning.record` does not attempt it.

### Path C: the memory seam (the Critic's precedent)

`rememberOutcome` writes an embedded, `scope: "global"` row into `agent_memory`
(`memory.server.ts:258-283`). `loadDecisionPrecedent`
(`src/lib/ai/decision-precedent.server.ts`, threshold `PRECEDENT_THRESHOLD = 0.3` at `:21`,
capped at 3 at `:23`) recalls it semantically over outcome-kind memories only (`:58-59`), and
the Critic reads that precedent before red-teaming the next bet
(`src/lib/ai/critic.server.ts:222-228`). `/decide` renders the same precedent as citations per
bet through `getPrecedentCitations`
(`src/lib/decision-judgment.functions.ts:193`, `:221-225`), gated on at least three recorded
outcomes so nothing is cited before there is anything honest to cite
(`decide.tsx:280-285`). The same memories are injected into every agent run's system prompt
(`recallMemoryRefs` at `memory.server.ts:67`, called `loop.server.ts:639` and `:1515`, injected
at `:687-688` and `:1555-1556`).

### Where the closure breaks

`learning.record`, the only Learn-station **agent** tool, inserts `user_id`, `workspace_id`,
`mission_id`, `prd_id`, `summary`, `verdict`, `metric_label`, `metric_value` and
`recorded_by_agent_slug` (`registry.server.ts:2784-2794`). `opportunity_id` is absent. So the
embed at `outcome.functions.ts:863` resolves to null, `opportunity_theme_id` is null
(`:904`), and `/decide` skips the row outright (`decide.tsx:233`, same skip server-side at
`push-insights.server.ts:143`). It also writes no `agent_memory` row and moves no confidence.
An agent-recorded learning is on the record and invisible to the ranking.

---

## The demo script

Roughly eight minutes. It ends on the loop closing, because that is the only part no competitor
can assert without the record to back it.

**Before you start.** Log in with a demo account
([`operations/demo-credentials.md`](../operations/demo-credentials.md)). Have a second
browser tab on `/boundary`. Confirm the workspace has clustering on, and that at least three
outcomes have been recorded, otherwise the precedent recess on `/decide` stays hidden by design
(`decide.tsx:280`).

1. **Open `/discover`.** Say: this is everything the product knows, from every source, on one
   desk. Point at the theme list. One sentence: every signal here came through one write path,
   so dedup and the injection screen are not per-source promises (`sink.server.ts:27`).
   *Audience should see:* raw signals grouped into named themes with severity and frequency.

2. **Show that it runs without you.** Point at the auto-cluster toggle. Say: this workspace
   re-clusters every ten minutes, and in the same tick any cluster past the bar becomes a piece
   of work. Name the bar out loud: eight signals, severity four, confidence 0.75, at most two
   started per sweep. *Audience should see:* the toggle, and a theme that has already become a
   track.

3. **Open `/decide`.** Do not scroll. Say: one call, in front of you, right now. Read the rank-1
   bet's rationale sentence aloud, including the outcome clause if it is present ("outcomes on
   this theme run proven"). *Audience should see:* one gate, one question, and the queue below
   it.

4. **Point at the record recess under the gate.** Say: this is the account's own history
   arriving unasked, at the only moment it can change an outcome. *Audience should see:* past
   outcomes cited against the bet being decided.

5. **Press "Draft the spec".** It navigates straight to `/plan/spec/$id`
   (`decide.tsx:348-352`). Say: the artifact is the receipt; we did not show you a toast, we
   showed you the spec.
   *Audience should see:* a real spec with an outcome and a measure.

6. **Open `/design`.** Show a drawing and the design gate switch. Say: Build cannot dispatch
   past a closed gate (`build.functions.ts:401`), and the drawing rides into the building
   agent's context as part of the ARD (`design-gate.ts:77`).
   *Audience should see:* the fidelity ladder and the gate.

7. **Open `/runs/$missionId` on a mission that has already run.** Scroll the steps. Say: every
   tool call is a row, every queued call is a boundary the agent respected.
   *Audience should see:* thought, action, result, and at least one approval.

8. **Switch to the `/boundary` tab.** Change the track spend ceiling and change it back. Say:
   this is the shape of the governance claim. Policy is set in advance and does not block;
   permission is asked in the moment and does. *Audience should see:* a number they control, not
   a queue they must clear.

9. **Show the one gate.** Back on the run, point at "Promote to production". Say: this is the
   single place a human is required, and it is required forever. It never graduates
   (`trust-ramp.ts:41-51`). Everything upstream of it is autonomous because this exists.
   *Audience should see:* one gate, named, with a reason.

10. **Open `/learn` and settle an outcome.** Pick a shipped spec, record a verdict with a
    sentence. *Audience should see:* the panel accept it and report what it changed.

11. **Go straight back to `/decide` and reload.** This is the closing beat. Show that the queue
    order changed and that the rationale on the affected bet now names the outcome history.
    Say: what actually happened just re-ranked what we do next. Nothing here was a report.
    *Audience should see:* a different order, with the reason written on the row.

12. **Close on the institutional-memory line.** Say: every decision, its alternatives, its
    evidence and its outcome are in the workspace record, readable by every member
    (`supabase/migrations/20260530120200_tenancy_c_tighten_policies.sql:36-44` swaps these
    tables to membership-keyed RLS). When the person who made the call leaves, the judgment
    stays. Be precise about the limit: the structured record is portable across people today;
    the semantic recall layer is not yet (see the gap table).

**If something fails live.** The honest recovery is the demo. Every hold reason is a written
sentence, not a status word (`driver.ts:414-425`), and a station that ran and filed nothing says
exactly that (`driver.ts:419-420`). Read the sentence out loud and move on.

---

## Verified gaps as of 2026-08-02

Every row was confirmed by reading the cited code on this date.

| # | Gap | Class | Evidence |
| --- | --- | --- | --- |
| 1 | `learning.record` omits `opportunity_id`, so an agent-recorded learning can never reach the ranking. The insert payload has no such field; `/decide` drops any learning with no theme. | MISSING CONSUMER | `src/lib/ai/tools/registry.server.ts:2784-2794` vs `src/lib/outcome.functions.ts:863`, `:904` and `src/routes/_authenticated.decide.tsx:233` |
| 2 | The autonomous Design station writes `prototypes`; every downstream reader reads `prd_scaffolds`. Build's dispatch context never loads a prototype, and `/design` never draws one. | MISSING CONSUMER | write `src/lib/ai/tools/registry.server.ts:2745`; readers `src/lib/build/design-gate.server.ts:41-56` and `src/lib/design-scaffold.functions.ts:877-905` |
| 3 | `agent_memory` recall is scoped to the user who wrote the row, so a departing person's compounded memory is not recallable by their successor. The structured record is workspace-scoped and does carry over. | ABSENT | RPC filter `supabase/migrations/20260703054813_3dd148e8-724d-494c-83d0-0273a01b8ad5.sql:17`; RLS `supabase/migrations/20260619220000_wm_f1b_agent_workspace_hardening.sql:86-89`; contrast `supabase/migrations/20260611161500_f_v5_loop_close_learnings.sql:41-47` |
| 4 | `learning.record` accepts `verdict: "uncertain"`, but the `learnings.verdict` CHECK constraint permits only `validated`, `missed`, `mixed`. On the migrations in this repo, an agent that follows the tool description gets a constraint violation. | ABSENT | tool enum `src/lib/ai/tools/registry.server.ts:2774`; constraint `supabase/migrations/20260611161500_f_v5_loop_close_learnings.sql:21` and `supabase/migrations/20260611175350_6611bfae-efd9-49bf-930f-9c97b9cd1d06.sql:12`; no later ALTER exists |
| 5 | Only `recordOutcome` re-scores `opportunities.confidence`, and it is reachable from two human buttons and nothing else. The strongest ranking input moves only on a click. | HUMAN-GATED-UNNECESSARILY | `src/lib/outcome.functions.ts:314-321`; sole call sites `src/components/learn/SettlePanel.tsx:115` and `src/components/product/OutcomeCard.tsx:63`; cron refuses at `src/lib/ai/outcome-review.server.ts:19-20` |
| 6 | The design gate verdict is human-only. `decideDesignGate` records `actor: "human"` and no agent tool or cron can call it, so an unattended track cannot open its own gate. | HUMAN-GATED-UNNECESSARILY | `src/lib/design-scaffold.functions.ts:663`, `:705`; callers only `src/routes/_authenticated.design.tsx:273` and `src/components/product/DesignScaffoldPanel.tsx:42` |
| 7 | Nothing agentic can write an announcement. There is no announce or changelog tool in the registry, and no cron path. Ship's public voice is entirely manual. | ABSENT | `src/lib/announcements.functions.ts:80-213`; the route states it at `src/routes/_authenticated.ship.tsx:46-48`; registry list `src/lib/ai/tools/registry.server.ts:3375-3432` |
| 8 | `checkDesignParity`, the writer that records whether the returned code honoured the design, has zero call sites. Its reader `getDesignParity` is mounted, so the surface reads a row nothing ever writes. | BUILT-BUT-UNMOUNTED | writer `src/lib/design-parity.functions.ts:172`, no callers; reader `src/routes/_authenticated.runs.$missionId.tsx:507` |
| 9 | `draftContractFromIntent` has no caller anywhere in `src/`, which strands the only autonomous `prd_scaffolds` writer, `prepareScaffoldSpeculative`. | BUILT-BUT-UNMOUNTED | `src/lib/discovery.functions.ts:1195` (definition) and `:2017` (a comment) are the only references; the stranded call is `:1320` into `src/lib/design-scaffold.functions.ts:553` |
| 10 | `importDesignMemory` and `exportDesignMemory` in the design-interchange module have no callers. (These are distinct from `importDesignMemoryFromText`, which is mounted.) | BUILT-BUT-UNMOUNTED | `src/lib/design-interchange.functions.ts:246`, `:269` |
| 11 | The fan-out path can still bypass the workspace mission spend default: it passes an explicit `null`, which `resolveMissionSpendCap` reads as a deliberate "no ceiling". | ABSENT | `src/lib/ai/fanout.server.ts:66` feeding `:88`; semantics at `src/lib/ai/mission-caps.server.ts:51` |
| 12 | Learn's autonomous review only fires for PRDs that have a `launch_plans` row with `check_by`, and the only writer of that row is the production promotion. A spec shipped any other way is never auto-graded. | MISSING CONSUMER | writer `src/lib/deployments.functions.ts:295-314`; consumer `src/routes/api/public/hooks/outcome-tick.ts:162-181` |

### Not verified

- The external scheduler that POSTs to the cron hooks. `wrangler.jsonc` carries no `triggers`
  block, and the `pg_cron` registrations in the migrations point at a hard-coded Lovable host
  (`supabase/migrations/20260801150000_spine_track_drive_state.sql:66`). Whether those jobs are
  currently live in the production database was not checked from the code.
- Which tables `getDecisionCurrency` and `getDecisionPrecedent` reach. Both delegate and carry
  no direct `.from(...)` call.
- The individual edge tables written by `inferSupersession` and `inferDirectEdge`. Their call
  sites are verified (`src/lib/outcome.functions.ts:399`, `:420`); their schemas were not
  re-read.

---

## Related

- [`spine-delivers.md`](./spine-delivers.md), the shipped feature page for the unattended loop.
- [`design/README.md`](../design/README.md), the provenance warning and the raw station
  audits this page supersedes.
- [`opportunity-ranking.md`](./opportunity-ranking.md), the ranking surface in detail.
- [`outcome-contract.md`](./outcome-contract.md), what a spec commits to being graded against.
