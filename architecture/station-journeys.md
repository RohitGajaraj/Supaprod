# Station journeys

> _Created: 2026-08-22 · Last updated: 2026-08-22_

**The invariant: at every station the person and the external caller are walking two different journeys, and at five of the nine the second journey does not exist.** This file walks both columns side by side and names the asymmetry in one line per station. The asymmetry is the deliverable; the walk is how it is arrived at.

**Read [`../docs/planning/initiatives/agent-first-platform.md`](../docs/planning/initiatives/agent-first-platform.md) §5 first.** It traces all seven stations plus Brain, Guardrails, Runs and Settings as Purpose → Intent → Inputs → Agent → Backend → Writes → Handoff → Next → Learning, with a `file:line` throughout. Nothing here restates it. What §5 does not do is split the walk in two, and that is the whole job of this file.

**Read [`agent-to-agent.md`](./agent-to-agent.md) second.** It holds the protocol layer: the three machine doors, the tool contract on Question → Bet → Run → Verdict, and governance parity. This file sits on top of it and does not repeat it. Where the two touch, this one cites rather than re-derives.

---

## 0. What the evidence is

- **Every claim carries a `file:line` or a query.** Code claims are against local `HEAD` `0f5c1bc26`.
- **`HEAD` moved four commits while this was being written**, and two of those commits changed findings in it. Everything below is re-verified against the final one; §14 records what moved and why it matters, because a reader comparing this file to [`agent-to-agent.md`](./agent-to-agent.md) will otherwise find two accurate documents disagreeing.
- **Demo and real are split on `workspaces.is_sample`.** Production holds 21 workspaces, 11 of them samples (`Helio Labs` ×7, `Sample workspace` ×2, `Demo workspace`, `Sample sandbox`, `Explore workspace`). A number measured across both says nothing about either.
- Production queries ran through the Lovable MCP against project `371dd588-1b70-4629-9bb5-9f003f3af373` on 2026-08-22, and each is reproduced so it can be re-checked.

---

## 1. The two facts that govern every right-hand column

### 1.1 There is no live credential, so no external agent can reach any door today

```sql
SELECT (SELECT count(*) FROM mcp_tokens WHERE revoked_at IS NULL) AS live_tokens,
       (SELECT count(*) FROM mcp_tokens)                          AS all_tokens,
       (SELECT count(*) FROM ingest_tokens)                       AS ingest_tokens,
       (SELECT count(*) FROM api_calls)                           AS api_calls,
       public.interop_write_enabled()                             AS gate;
-- live_tokens 0 | all_tokens 3 | ingest_tokens 0 | api_calls 7 | gate true
```

All three `mcp_tokens` rows were minted and revoked on 2026-08-10 inside two minutes each, and `ingest_tokens` has never held a row. **So every "the external agent can…" below describes a door that is built, governed, audited, and currently has nobody holding a key.** That is a different finding from "the door is missing", and the two are worth keeping apart: the read half of this surface is good and the write half is genuinely governed ([`agent-to-agent.md`](./agent-to-agent.md) §2). The gap is distribution, not construction. Full token forensics in [`agent-to-agent.md`](./agent-to-agent.md) §6.

### 1.2 The middle of the loop is unreachable from outside, at every station

No tool on any door names a mission, a track, a run or a step. An external agent can state a bet and grade a bet and cannot do one thing between them. That is established at [`agent-to-agent.md`](./agent-to-agent.md) §3 and is not re-argued here; it is the reason the right-hand column at Design, Build and Ship is empty rather than thin.

---

## 2. What the loop actually did, on real data, today

Real means `is_sample = false`. The split is stark enough that it is the frame for everything below.

```sql
SELECT count(*) FILTER (WHERE w.is_sample=false) AS real, count(*) FILTER (WHERE w.is_sample) AS demo
FROM <table> x JOIN workspaces w ON w.id = x.workspace_id;
```

| Table | Real | Demo |
| --- | --- | --- |
| `signals` | 48 | 1,341 |
| `spine_tracks` | **4** | 54 |
| `agent_runs` | 88 | 2,025 |
| `prds` | 5 | 92 |
| `prd_scaffolds` | **0** | 7 |
| `deployments` | **0** | 42 |
| `learnings` | **0** | 117 |

**No real workspace has ever produced a design artifact, a deployment or an outcome.** All 5 real specs are `status: 'draft'`, all created in June, none with a `shipped_at`. So Design, Ship and Learn have never run on a real tenant, and the right-hand column at those three stations is untested as well as unbuilt.

**Everything that moved today moved in one workspace**, `0b792d52-82e2-43e2-adc5-8a26e5c800b4` (`My workspace`, `is_sample = false`). It holds all four real tracks and 16 of the day's agent runs.

```sql
SELECT title, station, status, last_hold, spend_used_usd, created_at
FROM spine_tracks WHERE workspace_id='0b792d52-82e2-43e2-adc5-8a26e5c800b4' ORDER BY created_at DESC;
```

| Track | Station | `last_hold` | Spent |
| --- | --- | --- | --- |
| EU Timezone Tier-1 Support Latency | `sense` | — | $0 |
| EU Timezone Support Coverage Gap | `sense` | `out-of-time` | $0 |
| **EU Timezone Support Latency** | **`decide`** | — | $0.0218 |
| Slow Tier-1 Support Response for Off-Hours Users | `sense` | `out-of-time` | $0.0539 |

**One track has crossed a station boundary on real data.** `out-of-time` is a benign hold: the Worker driving the tick has a duration limit, the work is fine, the money is fine, and it deliberately does not count as an attempt (`src/lib/spine/driver.server.ts:1322-1338`; operator sentence at `src/lib/spine/driver.ts:679`).

**Why now and not before.** Fourteen hooks were filtering on `workspaces.is_sample`, and `researcher-tick` chose its work from `workspace_briefs` instead, so the filter never applied to it. `src/lib/ticks/real-workspaces.server.ts` (header, 2026-08-21) records that 89% of a day's spend was agents working demo fixtures while real workspaces drew zero agent calls. Three hooks now exclude by workspace id: `researcher-tick`, `approvals-tick`, `track-tick`.

**And the loop is currently feeding itself.** Every signal written today came from the crew's own tool:

```sql
SELECT source, source_kind, count(*) FROM signals
WHERE workspace_id='0b792d52-82e2-43e2-adc5-8a26e5c800b4' AND created_at::date='2026-08-22'
GROUP BY 1,2;  -- agent | manual | 16
```

`source: "agent"` with `source_kind: "manual"` is the fingerprint of `signals.log` (`src/lib/ai/tools/registry.server.ts:298`, writing through the sink at `:375`). Two Slack connections are bound to this workspace and `connected`, and the last `pull_connector` signal it received was on 2026-07-09. So the walk below is real, and the evidence at its head is the product's own, not a customer's.

---

## 3. 01 Discover

The deepest trace, because it is the only station where both columns are genuinely occupied and the only one an external agent can write into at all.

### The hops, named

| # | Hop | Where | What it guarantees |
| --- | --- | --- | --- |
| 1 | Connected tool | ~20 pull adapters, e.g. `src/lib/connectors/providers/zendesk-ingest.server.ts:92` | Each hands the sink a `SignalCandidate[]`, never a row |
| 2 | **Ingestion** | `writeSignals`, `src/lib/sources/sink.server.ts:61` | The one place five guarantees live |
| 3 | **Normalization** | `prepareSignalRows`, `src/lib/sources/prepare.ts:37` | Injection screen, dedup on `external_id`, the `source_kind` stamp (`:87`), tags and sentiment when the producer omitted them |
| 4 | Embedding | `attachEmbeddings`, inline before the insert (`sink.server.ts:97`) | Clusterable on the tick it lands, not at the next backfill |
| 5 | The trail row | `recordStageEvent` → `stage_events` `to_stage='sensed'` (`sink.server.ts:110`) | The first link of the chain the loop-state surface reads |
| 6 | **Interpretation and clustering** | `clusterSignalsCore`, `src/lib/ai/cluster.server.ts:103` | ≤80 unclustered signals per pass, a model names the themes, novelty scored, signals claimed atomically via `.is("theme_id", null)` (`:124`, `:279`, `:369`), leftovers attached through the `match_themes` RPC above 0.8 similarity (`:323`) |
| 7 | **Opportunity** | `promoteClustersOnce`, `src/lib/spine/promote.server.ts:235`, applying `qualifies`, `src/lib/spine/promote.ts:131` | Frequency, severity, confidence, plus the outcome-support veto |
| 8 | **Into Decide** | `startTrackCore`, `src/lib/spine/track.functions.ts:238`, then `driveTrackOnce`, `src/lib/spine/driver.server.ts:990` | A `spine_tracks` row entering at `sense` on the full seven-station path |

Cadence, read live from `cron.job`: `sense-tick` `*/5 * * * *`, `cluster-tick` `*/10 * * * *`, `track-tick` `*/10 * * * *`, `outcome-tick` `0 * * * *`, `calibrate-tick` `0 */6 * * *`, all `active`.

### The bar that let this workspace through, which §5 predates

`DEFAULT_PROMOTION_BAR` is frequency ≥8, severity ≥4, confidence ≥0.75 (`promote.ts:79-87`). The four promoted themes carry frequencies of 3, 4, 4 and 6. They are not exceptions.

Two things sit between the default and the sweep. The bar is the **workspace's** policy, resolved by the caller (`loadAutonomyPolicy` then `promotionBarFor`, `src/routes/api/public/hooks/cluster-tick.ts:137-138`, passed at `:164`). And below `COLD_START_MATURE_AT = 40` signals, frequency alone scales with the size of the corpus it came from: `coldStartBarFor` (`src/lib/autonomy-policy.ts:248-256`) never raises the configured bar and never falls below `COLD_START_FLOOR = 3`. Severity and confidence deliberately do not scale, because they measure the quality of a cluster rather than its weight of evidence.

It is off by default and gated per workspace, and exactly one workspace has it on:

```sql
SELECT id, name, is_sample FROM workspaces WHERE cold_start_promotion_enabled = true;
-- 0b792d52-82e2-43e2-adc5-8a26e5c800b4 | My workspace | false
```

Today, at 23 signals: `ceil(8 × 23 / 40) = 5`, floored at 3, capped at 8, so the live bar is **frequency ≥5**. The freq-6 theme promoted at 14:50; the freq-1 theme beside it did not. **This is the one rule in the product that spends money with nobody watching, and the reason a real workspace has finally cleared it is that the bar learned to read how much the workspace has actually said.**

### The two columns

| | **The person** | **The external agent** |
| --- | --- | --- |
| **What I want** | To know what is going wrong and what is new, without reading every ticket | To hand a system of record something it saw, and to read what has already been noticed |
| **Where I stand** | `/discover` → `DiscoverSurface` (`src/routes/_authenticated.discover.tsx`, `src/components/discover/DiscoverSurface.tsx`). `?tab=queue` redirects to `/decide` (`discover.tsx:96`) | No surface. `POST /api/mcp`, or `/api/public/a2a/*` for the same skills |
| **What I can read** | Signals, themes, source coverage, the crew's live marks (`listSignals` `discovery.functions.ts:229`, `listThemes` `:468`, `getSenseCoverage` `:1085`) | `search_signals` (`mcp-protocol.ts:55`); via A2A, `discovery.search_signals` (`a2a-protocol.ts:82`). **It cannot read a theme.** No tool on any door selects from `themes` |
| **What I can write** | Capture one (`createSignal` `:308`), paste many (`bulkImportSignals` `:370`), force a clustering pass (`clusterSignals` `:493`), turn auto-clustering on (`toggleAutoCluster` `:531`), set or un-set a theme's status (`setThemeStatus` `:656`), promote a theme by hand (`promoteThemeToOpportunity` `:1377`) | `ingest_signal`, scope `write:signal` (`WRITE_SCOPE_BY_TOOL`, `mcp-protocol.ts:225`). One row. Nothing else |
| **What I must clear with a human** | Nothing here. Discover is read-and-capture | Nothing at the call. The token's scope and the global `interop_write_enabled()` gate decide, both re-checked at call time |
| **What comes back** | Three counts the sink reports, each meaning something different: inserted, skipped, quarantined | `{inserted, skipped}`. **A quarantined write returns `success` with no id** (`mcp.functions.ts:906`), so the audit row cannot say whether the write happened ([`agent-to-agent.md`](./agent-to-agent.md) §4.3) |
| **What happens next without me** | `cluster-tick` clusters and promotes within 10 minutes; `track-tick` walks the track | The same, plus the `signals_reactor_fanout` trigger firing `discovery-scout` at `approval_mode: 'auto'` with no human at the trigger step |
| **What I learn** | Which of my sources is producing, and which theme grew | Nothing comes back. No push, no callback, no webhook out: `capabilities.push_notifications: false` (`a2a-card.ts:117`) |

**The asymmetry: a person sees and steers the interpretation; an agent can only add to the raw input.** A person reads themes, forces a clustering pass, dismisses a cluster and promotes one by hand. An external agent can write a signal and then cannot see what was made of it. **The one write it does have is also the only write on the whole surface that causes autonomous work**, which is the wrong way round and is named as such at [`agent-to-agent.md`](./agent-to-agent.md) §3.

### The bypasses, counted today

§5 records eleven write paths around the sink; the sink's own header (`sink.server.ts:1-8`, written 2026-08-15) says seventeen paths insert into `public.signals` and seven reach the function. **Counted at `HEAD` today there are eleven `.insert` sites on `signals` and one of them is the sink, so ten bypasses remain:**

`analytics-ingest.server.ts:157` · `meetings.functions.ts:215` · `audio.functions.ts:387` · `onboarding.functions.ts:261` · `onboarding.functions.ts:622` · `pulse.functions.ts:33` · `mcp.functions.ts:728` (`ingest_signal`) · `steward-tick.ts:183` · `ingest-signals.ts:138` (the public webhook) · `sense-tick.ts:462`.

Each skips dedup, `source_kind`, the injection screen, the inline embedding **and the `stage_events` row**, so those signals are invisible to the surface that reports where the loop stands. Two qualifications the count alone hides. `sense-tick.ts:462` is the demo feed and is gated on `isDemoWorkspaceOwner` (`:441`), so it cannot touch a real tenant. And `signals.log`, which was the worst of them because it made the autonomous crew's own evidence not register as Discover having happened, now files through the sink (`registry.server.ts:375`). **Both remaining machine doors are still bypasses**: `ingest_signal` and the public webhook screen their own input and insert directly.

---

## 4. 02 Decide

| | **The person** | **The external agent** |
| --- | --- | --- |
| **What I want** | To know what to build next and why that | To commit a bet against evidence somebody else gathered, and to check it has not been made and overturned before |
| **Where I stand** | `/decide` (`_authenticated.decide.tsx`), with `/opportunities` redirecting here (`_authenticated.opportunities.tsx:21`) | `POST /api/mcp` |
| **What I can read** | The ranked queue, the Critic's verdict, brief alignment, precedent citations, past learnings (`listLearnings`, `outcome.functions.ts`) | `search_opportunities`, `search_decisions` with standing and superseded outcomes applied (`applyDecisionOutcomes`, `mcp.functions.ts:273`), `get_governing_decision`, `get_contradiction_history`, `get_roadmap`. **This is the strongest part of the machine surface** |
| **What I can write here** | Re-rank by moving a roadmap bucket (`updateRoadmapItem`, `roadmap.functions.ts`), promote, dismiss | `record_decision` (`write:decision`) → `status: 'pending'`, `source_kind: 'mcp'` (`mcp.functions.ts:936`, `:942`) |
| **Where the decision is actually recorded** | **Not here.** `createDecision` (`decisions.functions.ts:233`) has three callers and none is `/decide`: `DecisionsPanel` on `/brain` (`:170`), `MissionOrchestratorDetail:192`, and the Ask composer (`use-ask-stream.ts:244`) | The tool writes `decisions` directly |
| **The forecast** | Captured on the same insert, all-three-or-none, refused if the horizon has passed (`decisions.functions.ts:267-277`), and **optional** | Captured on the same insert, under `write:decision` alone (`mcp.functions.ts:932-934`), and **required** |
| **What I must clear** | Nothing. A person's decision lands at whatever status the form sets | Nothing at the call. The status floor is the guardrail: an agent never lands a decision already approved |
| **What comes back** | The row, plus a `stage_events` entry (`decisions.functions.ts:301`) and the origin edge | The id, or `{status: "quarantined", id: null}` audited as a success |
| **What I learn** | ICE is a generated column driven by `confidence`, which outcomes move | Nothing pushed |

**The asymmetry, and it now runs the other way:** **an external agent is held to a stricter standard at this station than the person is.** Measured at `HEAD` across the three doors onto one table:

| Door | Requires |
| --- | --- |
| Internal agent, `decision.record` (`registry.server.ts:3711`, schema `:3718-3776`) | `rationale` min 1, **≥1 rejected alternative**, **all three forecast parts**, each refusal carrying `FORECAST_REQUIRED` (`:3700`) |
| External agent, `record_decision` (advertised `mcp-protocol.ts:313-320`, enforced `mcp.functions.ts:828-857`) | The same six: title, rationale, ≥1 alternative, all three forecast parts |
| **Person, `createDecision`** (`decisions.functions.ts:236-278`) | **`title`.** Rationale optional, alternatives optional, forecast optional (all-three-or-none when given) |

**The loosest door onto `decisions` is the one a person walks through.** Both agent doors refuse a decision with no forecast on the argument that a decision with no forecast is an opinion rather than a bet; the human form accepts one. That inversion is the finding, and it is worth stating plainly because the moat argument does not distinguish who made the call — a bet with no belief attached is unrebuildable whoever recorded it.

**The second asymmetry is about the queue, not the call.** An external agent cannot score, re-rank or move an opportunity between now/next/later, cannot read or write a theme, an insight or an assumption, and cannot close a Question. It can propose a bet and cannot touch the queue the bet came from.

---

## 5. 03 Plan

The spine calls this station `define`; the surface calls it Plan (`STATION_NEEDS.define`, `src/lib/spine/correction.ts:124-129`).

| | **The person** | **The external agent** |
| --- | --- | --- |
| **What I want** | A spec somebody could build from, with its citations attached | To hand over a draft and let a person carry it |
| **Where I stand** | `/plan` (`_authenticated.plan.index.tsx`), spec detail at `/plan/spec/$id`; `/roadmap` and `/stakeholder` redirect here | `POST /api/mcp` |
| **What I can read** | The roadmap (`getRoadmap`, `roadmap.functions.ts`), specs (`listSpecs`, `discovery.functions.ts`), design work (`listDesignWork`, `design-scaffold.functions.ts`) | `search_prds`, `get_prd`, `get_ard`, `get_roadmap`. `GET /api/public/ard/schema` is unauthenticated by design, so an outside tool can generate a valid Outcome Contract without our internal types |
| **What I can write** | Commit a roadmap item (`commitRoadmapItem`), generate the spec (`generatePrd`), save it, build the task graph (`generateTaskGraph`, `discovery.functions.ts:127`), open the GitHub issue, dispatch the studio session, choose the design route | `draft_spec` (`write:spec`) → `prds` at `status: 'draft'` (`mcp.functions.ts:988`) |
| **What I must clear** | The commitment gate where one applies (`isCommitmentGoverned`, `roadmap-governance.ts`) | Nothing, and nothing happens either. The reactor that turns a spec into work fires only on `approved` (`reactor_fanout_prd_approved`, migration `20260606150319…sql:128-130`) |
| **What comes back** | The spec, its tasks, its issue | The spec id |
| **What I learn** | The spec is what a learning is later written back against, via `prd_id` | Nothing pushed. It must poll `search_prds` and diff |

**The asymmetry: a person can approve their own spec and an external agent cannot, which is correct, and the status floor is the only thing enforcing it.** The approval policy engine (`resolveToolMode`) never runs on the machine path ([`agent-to-agent.md`](./agent-to-agent.md) §4). What bounds the damage is that `draft_spec` cannot write any status but `draft`.

**Second asymmetry:** the person's path builds a task graph and an issue; the agent's writes a document and stops. No tool on any door reaches `tasks`.

**One inherited defect, carried from §5 without restating it.** `prd.draft` writes `opportunity_id: opp?.id ?? null` (`registry.server.ts:3284`), and the severed edge is visible on both sides of the sample line: **2 of 5 real specs and 53 of 92 demo specs carry a null `opportunity_id`.** The external `draft_spec` accepts an `opportunity_id` and does not require it (`mcp-protocol.ts:334`), so the machine door inherits the same gap rather than repairing it.

```sql
SELECT w.is_sample, count(*), count(*) FILTER (WHERE p.opportunity_id IS NULL)
FROM prds p JOIN workspaces w ON w.id = p.workspace_id GROUP BY 1;  -- f|5|2 · t|92|53
```

---

## 6. 04 Design

| | **The person** | **The external agent** |
| --- | --- | --- |
| **What I want** | To see the surface before code is written | — |
| **Where I stand** | `/design` (`_authenticated.design.tsx`) | **Nowhere.** |
| **What I can read** | Drawings, design memory rules, flows, the gate's live answer (`listDesignWork`, `design-scaffold.functions.ts`; `design-memory.functions.ts`; `prototypes.functions.ts`) | **Nothing.** No tool on any door selects from `prd_scaffolds`, `prototypes`, `prototype_files`, `design_memory` or `prd_flows` |
| **What I can write** | The gate verdict, `decideDesignGate` (`design-scaffold.functions.ts:1381`) | **Nothing.** |
| **What comes back** | `blocksDispatch`, recomputed from the verdict (`designGateBlocksDispatch`, `:2114`, `:2306`, `:2359`) | — |

**The asymmetry is total: this station has no external-agent path of any kind, and it is human-only on the inside too.** `decideDesignGate` hardcodes `actor: "human"` (`design-scaffold.functions.ts:1425`). There is no agent tool behind it and no cron. And `prd_scaffolds` holds **0 rows across every real workspace**, so on real data this station has never run at all.

---

## 7. 05 Build

| | **The person** | **The external agent** |
| --- | --- | --- |
| **What I want** | The change written, the checks run, the pull request open | — |
| **Where I stand** | `/build` (`_authenticated.build.index.tsx`, a real surface since 2026-07-30, previously a redirect to `/runs`) and `/studio/$missionId`; `/missions`, `/delegate` and `/cockpit` redirect to `/build` | **Nowhere.** |
| **What I can read** | Changesets, live crew marks, the run tree | **Nothing.** No run, step, trace or changeset read tool exists. `api_calls` records only the caller's own calls |
| **What I can write** | Stage, commit, review, open and merge a pull request, through the studio tool family (`registry.server.ts:1678`–`:3006`) | **Nothing.** |
| **Start / watch / steer / stop** | All four. `stopRun` (`agent-runs.functions.ts:137`), `steerStudioSession` (`studio.functions.ts:1140`), `steerTrack` (`spine/track.functions.ts:1008`) | **None.** All four are server functions behind auth, and no tool promotes any of them |
| **What I must clear** | The merge. A merged changeset does not become production by itself | — |

**The asymmetry is total, and it is the one the product is about.** The steering mechanism itself now works for all seven stations, because a steer falls back to the track when there is no mission (`steerTarget`, `src/lib/ai/loop.server.ts:1168-1178`). **The mechanism is fine; the door is missing.** That makes `steer_run` and `stop_run` the two cheapest tools left to build, which is [`agent-to-agent.md`](./agent-to-agent.md) §3's recommendation, repeated here only because this is the station it lands on.

---

## 8. 06 Ship

| | **The person** | **The external agent** |
| --- | --- | --- |
| **What I want** | It in front of customers, and to hold the one call that cannot be undone | — |
| **Where I stand** | `/ship` (`_authenticated.ship.tsx`); `/changelog` redirects here | **Nowhere.** |
| **What I can read** | Deployments (`listDeployments`, `deployments.functions.ts`), the changelog, what shipped | **Nothing.** No deployment read tool |
| **What I can write** | `promoteToProduction` (`deployments.functions.ts:1257`) → `promoteChangesetToProductionCore` (`:788`), which refuses a non-merged changeset, requires a successful preview, closes out every spec the release carries (`closeOutSpecOnPromote`, `:643`, called at `:1177`) and arms the `check_by` date; `rollbackRelease`; `generateLaunchKit` | **Nothing.** |
| **What I must clear** | The promotion itself. `release.publish` is pinned to `review` (`src/lib/ai/tools/defaults.ts:165`) and is on the trust-ramp exclusion list (`src/lib/ai/trust-ramp.ts:74`), so it never graduates. **That is correct and should stay** | — |

**The asymmetry is total.** And the honest addition: `deployments` holds **0 rows across every real workspace**, so nothing has ever been shipped through this station on real data by anyone, person or agent.

---

## 9. 07 Learn

| | **The person** | **The external agent** |
| --- | --- | --- |
| **What I want** | To settle what actually happened, and change what gets surfaced next | To grade a bet and have the grading count the same as a person's |
| **Where I stand** | `/learn` (`_authenticated.learn.tsx`) → `SettlePanel` and `ForecastDeskPanel`; `/impact` redirects here | `POST /api/mcp` |
| **What I can read** | The outcome data, the impact figures, due forecasts (`listDueForecasts`, `forecast.functions.ts:399`) | `outcome_history`, `list_due_forecasts` — deliberately unscoped, because knowing which of your own calls are overdue is not a privileged act |
| **What I can write** | `recordOutcome` (`outcome.functions.ts:1146`), `settleForecast` (`forecast.functions.ts:405`), `deferForecastCheck` (`:424`), `reopenForecast` (`:438`) | `settle_outcome` (`write:outcome`) and `settle_forecast` (`write:forecast_resolution`) |
| **Do the two paths agree** | **Yes, and this is the best parity on the surface.** Both reach the same `applyOutcome` core (`outcome.functions.ts:620`), which has five callers and three of them are not human. A verdict written by an agent re-ranks exactly as a person's does | Same core, with two documented differences: it refuses to overwrite a settled verdict when the caller is an agent, and the evidence and stakes scores are written as zero on purpose because no classifier ran |
| **What I must clear** | Nothing. The person owns the final word, and an overturn takes the byline off the agent (`outcome.functions.ts:759`) | The overwrite refusal, and for forecasts it sits in the `WHERE` clause so it cannot be raced |
| **What I learn** | `match_agent_memory` re-ranks retrieval on the verdict | It can read the outcome back, and only by asking |

**The asymmetry is the smallest here, and what remains is deferral.** A person can press "too early to tell", which writes `prds.outcome_check_by`, and can defer a forecast check (`forecast.functions.ts:424`). **An external agent has neither.** `settle_forecast` grades or it does nothing, and the internal `learning.record` description is explicit that a deferral is the absence of an outcome rather than a kind of one. So an outside caller facing an undecided forecast has exactly two moves: guess, or stay silent and be invisible.

**Two things §5 records at this station have since changed, and both are improvements.** The `verdict: "uncertain"` crash is fixed: `learning.record` (`registry.server.ts:4096`) now reads `z.enum(["validated", "missed", "mixed"])` (`:4128`) and tells the agent not to call the tool at all when the evidence is not in. And **the verdict-to-bet edge now has a writer**: `applyOutcome` resolves `learnings.decision_id` through `resolveSettledDecision` (`outcome.functions.ts:486`) on a uniqueness rule rather than a join on `prd_id`, and fills it without overwriting on an overturn. Production still reads `0 of 133`, because no learning has been written since it shipped and the last one was 2026-08-11.

---

## 10. Brain

| | **The person** | **The external agent** |
| --- | --- | --- |
| **What I want** | To know what we already know about this | To load a workspace's judgment as context before acting on its behalf |
| **Where I stand** | `/brain` (`_authenticated.brain.tsx`); `/memory`, `/docs`, `/artifacts` and `/meetings` all redirect here | `POST /api/mcp`, or A2A `knowledge.export_skillpack` (`a2a-protocol.ts:84`) |
| **What I can read** | Memory, the standing record, the knowledge graph, the decision list (`brain.functions.ts`, `brain-standing.functions.ts`, `knowledge-graph-view.functions.ts`) | `export_skillpack` — a versioned, content-hashed bundle of decision lessons (`mcp-protocol.ts:137`, `exportSkillpack` `mcp.functions.ts:548`) |
| **What I can write** | A decision, from `DecisionsPanel` (`createDecision`, `:170`). Approve a house rule | **Nothing.** No tool writes `agent_memory`, `house_rules`, `rag_chunks` or `insights`. `memory.remember`, `memory.reflect` and `memory.promote` (`registry.server.ts:629`, `:690`, `:734`) are internal-only |
| **What comes back** | The graph, the standing rules | A bundle, and nothing that says the bundle changed |

**The asymmetry: an external agent can read what was learned and cannot contribute to it.** Settling an outcome reaches `rememberOutcome` and so moves memory indirectly, but no outside caller can write a memory, propose a rule, or mark a recall useful. **The edge that matters here runs the other way and is genuinely wired**: memory reaches every internal agent's system prompt, and it is being read rather than merely written.

```sql
SELECT count(*) FILTER (WHERE w.is_sample=false) AS real, count(*) FILTER (WHERE w.is_sample) AS demo
FROM memory_recall_log l JOIN workspaces w ON w.id = l.workspace_id;   -- real 127 | demo 8,927
-- same shape over agent_memory:                                        -- real  67 | demo 1,420
```

**127 recalls against 67 memories on real tenants**, so on real data a memory is read about twice on average rather than sitting unread. (`memory_recall_log` carries no `agent_slug`, so who read whose memory cannot be answered from this table; §5 measures that separately.)

**The honest state of the compounding claim on real data.** `learnings` holds 133 rows, all in sample workspaces, and none carries a `decision_id`. The loop is wired and proven, and on a real tenant it begins accruing on the first settled outcome, which has not happened yet.

---

## 11. Guardrails

| | **The person** | **The external agent** |
| --- | --- | --- |
| **What I want** | To know what they are allowed to do and what it has cost | — |
| **Where I stand** | `/engine-room`, four rooms: `spend`, `quality`, `safety`, `record` (`_authenticated.engine-room.tsx:149`). `/guardrails` redirects to `?room=safety` (`_authenticated.guardrails.tsx:6`), and `/budgets`, `/analytics`, `/evals`, `/prompts` and `/swarm` all redirect here | **Nowhere.** |
| **What I can read** | Guardrail hits, budgets, credits, evals, drift, job runs, error events | **Nothing.** No tool reads any of them |
| **What I can write** | Autonomy policy, tool modes, budgets, the promotion bar, the kill switch | **Nothing.** By design: this is where a person sets policy |
| **What governs me** | `resolveToolMode` — stored per-agent mode, then risk floors, then trust-ramp ceilings | The token's scopes **and** `interop_write_enabled()`, re-checked at call time, plus the status floors |

**The asymmetry is total and half of it is correct.** An external agent should not set its own boundaries. What is not correct is that **it cannot read them either**: it cannot discover the workspace's spend cap, its own autonomy ceiling, or whether the kill switch is down. It learns the boundary by hitting it.

**And the switch governing every outward write is a single global row.** `interop_write_enabled()` reads one `app_settings` row (migration `20260625140000_interop_write_scopes_gate.sql:64-75`) while six tool descriptions call it "the workspace's outward-write gate". It has been `true` since 2026-08-10 with `updated_by` NULL, which the admin function cannot produce. Full account at [`agent-to-agent.md`](./agent-to-agent.md) §4.2 and §6.

---

## 12. The asymmetries, in one line each

| Station | The gap between the two columns |
| --- | --- |
| **01 Discover** | A person reads and steers the interpretation — themes, clustering, promotion; an agent can only add raw input and never sees what was made of it. Its one write is also the only write on the surface that starts autonomous work. |
| **02 Decide** | Inverted: both agent doors require rationale, a rejected alternative and all three forecast parts; the human form accepts a bare title. The loosest door onto `decisions` is the person's. |
| **03 Plan** | A person's path produces a spec, a task graph and an issue and can approve it; an agent's produces a document at `draft` that causes nothing until a person approves. |
| **04 Design** | **No external-agent path at all.** Human-only on the inside too: `decideDesignGate` hardcodes `actor: "human"`. 0 rows on real data. |
| **05 Build** | **No external-agent path at all.** Start, watch, steer and stop are all server functions; the steering mechanism works for all seven stations and no tool reaches it. |
| **06 Ship** | **No external-agent path at all.** 0 deployments on real data, so the station is untested by anyone. |
| **07 Learn** | The best parity on the surface: same `applyOutcome` core, same re-ranking. What is left is deferral — an agent can grade or stay silent, and cannot say "too early". |
| **Brain** | An agent can read what was learned and cannot contribute to it; no tool writes a memory, a rule or an insight. |
| **Guardrails** | Correctly unwritable from outside, and wrongly unreadable: an agent cannot discover the boundary it is being held to. |

**Five of the nine have no external-agent path at all**: Design, Build, Ship, Guardrails, and Brain's write half. Three of the empty ones are consecutive — Design, Build, Ship — which is the same finding [`agent-to-agent.md`](./agent-to-agent.md) §5 reaches from the protocol side, arrived at here from the station side.

---

## 13. Two things §5 records that no longer hold

Named rather than edited, because [`../docs/planning/initiatives/agent-first-platform.md`](../docs/planning/initiatives/agent-first-platform.md) is owned elsewhere.

| §5 says | What is true at `HEAD` `0f5c1bc26` |
| --- | --- |
| 07 Learn: *"`learning.record` accepts `verdict: "uncertain"` … An obedient agent following the tool's own instruction gets a 23514 and the tool call fails."* | Fixed. The schema is `z.enum(["validated", "missed", "mixed"])` (`registry.server.ts:4128`), and the description now tells the agent not to call the tool when the evidence is not in. |
| 01 Discover: the bar is *"frequency ≥8, severity ≥4, confidence ≥0.75"* | Still the platform default (`promote.ts:79-87`), but it is now the workspace's policy, resolved by the caller (`cluster-tick.ts:137-138`), and below 40 signals frequency scales with the corpus (`coldStartBarFor`, `autonomy-policy.ts:248`). One workspace has cold start on, and it is why four real tracks exist. |

Two line references in §5 have also drifted with the registry: `prd.draft` is at `registry.server.ts:3284` (§5 says 3254) and `design.draft` at `:3996` (§5 says 3838). The claims themselves are unchanged.

---

## 14. What moved under this file while it was being written

`HEAD` advanced from `6de6cb057` to `0f5c1bc26` during the session, and one commit — `f840048cf`, *"A verdict now names the decision it settles"* — changed two findings above. Both are recorded here because [`agent-to-agent.md`](./agent-to-agent.md) was written earlier the same day against the pre-commit state and is correct as of when it was written.

| Claim in [`agent-to-agent.md`](./agent-to-agent.md) | State at `0f5c1bc26` |
| --- | --- |
| §4.1, §5 step 6-7: *"The MCP tool's schema … requires `title` only … The forecast can still be attached, but in a **second** call, under a **different** scope"* | Closed. `record_decision` requires all six fields, advertised (`mcp-protocol.ts:313-320`) and enforced (`mcp.functions.ts:828-857`), and writes the three forecast columns on the same insert under `write:decision` alone (`:932-934`). There is now one moment on this path, not two. |
| §2, §7: *"`learnings.decision_id` exists … `applyOutcome` does not set it … 0 of 133 learnings rows carry one"* | The writer exists: `resolveSettledDecision` (`outcome.functions.ts:486`), consumed by `applyOutcome`, plus migration `20260822210000_…`. The measurement is still `0 of 133` and will stay there until the next outcome is settled. |

There is a third state worth naming because it is the sort that survives a fix. Before `f840048cf`, the enforced schema and the advertised one disagreed: `recordDecisionSchema` already required the full bet while `mcp-protocol.ts` still published `required: ["title"]`. An agent planning from `tools/list` would have called with a title and been refused. **A discovery document that understates a tool's requirements fails in the one place a machine cannot recover from**, and the commit shipped `mcp-record-decision-drift.test.ts` to hold the two together.

---

## 15. Related

- [`../docs/planning/initiatives/agent-first-platform.md`](../docs/planning/initiatives/agent-first-platform.md) §5 — the single walk this file splits in two, with the Purpose → … → Learning shape for every station.
- [`agent-to-agent.md`](./agent-to-agent.md) — the protocol layer beneath the right-hand column: three doors, the tool contract, governance parity, and what production says.
- [`../docs/features/lifecycle-signal-to-learning.md`](../docs/features/lifecycle-signal-to-learning.md) — the station-by-station account of what the loop genuinely does.
- [`orchestration.md`](./orchestration.md) — the invariant every autonomous path here inherits.
- [`security.md`](./security.md) — the workspace boundary both columns are scoped by.
