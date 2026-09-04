# Supaprod Agent Roster Audit — Ground Truth Report

> _Created: 2026-08-03 · Last updated: 2026-08-03_

## Executive summary

There is no single roster. There are **four parallel, disagreeing definitions** of "the agents," plus a live production regression that is actively re-creating the duplicates the founder is looking at right now:

1. **`src/lib/agent-vocabulary.ts`** (`SPECIALIST_CATALOG`) — the intended display/identity layer. 36 entries total: **15 `status:"active"`** (13 cast + 2 crew) and **21 `status:"deprecated"`** map-only aliases.
2. **`public.seed_default_agents()`** — the live Postgres function (queried directly from the production DB, not from a migration file) that actually creates rows in `agents` at signup. **It is currently the OLD, BROKEN version** — it does not match the fix that is sitting committed in the repo.
3. **The live `agents` table** — 8 accounts, 62 rows, **19 distinct slugs ever created**, wildly inconsistent per-account (founder's own account alone carries 19 rows from 10 rulings of history; fresh test accounts get 13).
4. **`agent_runs`** — the actual execution ledger. Only **14 of the 19 live slugs have ever produced a run**; the rest are namesakes.

**The "19+" and "15+" the founder is remembering are both real numbers that exist in code — just not where he'd expect:**
- **19** = literal count of distinct `agent_slug` values that exist in the live `agents` table today (`docs/features/agent-experience.md`, `README.md` line 114 "full mesh: 19 agents", and `docs/strategy/*` all cite this same number as the aspirational/backend catalog size — it is not shown anywhere in the app UI as text).
- **15** = `SPECIALIST_CATALOG.filter(e => e.status === "active").length` in `agent-vocabulary.ts` (13 cast + 2 crew). Not rendered as a number anywhere either — it's a code fact, not a UI string.
- **Neither number is printed literally in Settings.** What the founder is actually looking at in Settings → Staff is the raw `agents` table (`listAgents()` in `src/lib/agents.functions.ts`, rendered by `StaffTab` in `src/routes/_authenticated.settings.tsx:2453`), which shows **every row regardless of `enabled`**, using the **raw DB `name` field**, not the friendly catalog names. For the founder's own account that's **19 cards**; only **10 have their toggle on** — which is almost certainly the "~9-10" he's counting, because he's mentally filtering to the ones switched on.

---

## Part 1 — The four disagreeing definitions

### 1. `agent-vocabulary.ts` SPECIALIST_CATALOG (intended canon, `src/lib/agent-vocabulary.ts`)
The comments in this file are unusually candid about the mess: it says explicitly (line 15-24) that DB slugs are never renamed and several "cast" entries reuse an old slug for display purposes only. 13 active cast + 2 active crew (Reactor, Archivist) + 21 deprecated aliases kept only so historical `agent_runs` rows still render a name instead of a raw slug.

### 2. `public.seed_default_agents()` — LIVE, queried directly from production Postgres
```sql
-- what's actually running today (2026-07-18), NOT what the repo's newest migration says:
'discovery-scout','strategist','prd-writer','builder','engineer','researcher',
'qa','release','critic','stakeholder','sprint-planner','copilot'
-- + orchestrator via seed_orchestrator_agent()
```
This is the **2026-07-09** version (`20260709070000_orchestrator_in_default_roster.sql`). The repo also contains a **2026-07-11** fix (`20260711010000_pc29_agent_roster_collision_fix.sql`, "PC-29 layer 1") that:
- drops `engineer`/`stakeholder`/`copilot` from the insert list (they collide in display name with `builder`/`release`/`orchestrator`),
- adds the 3 slugs the 07-09 version silently dropped: `customer-insights` (Listen), `ux-architect` (Design), `data-analyst` (Measure),
- retags every historical row from the colliding slugs to their canonical replacement across 11 tables,
- deactivates (never deletes) leftover duplicate rows.

**I queried `pg_get_functiondef()` on the live database and confirmed the PC-29 version is NOT deployed.** The function currently live is byte-for-byte the 07-09 (broken) body. This is a **repo/production drift**, not a code bug waiting to be written — the fix already exists in git and simply never reached the database, almost certainly the exact "Lovable sync regenerates handle_new_user from the schema model" recurrence the migration's own comments warn about twice (2026-06-17, 2026-07-08 notes).

### 3. Live `agents` table (queried directly, 8 accounts / 62 rows / 19 distinct slugs)

| slug | display `name` in DB | accounts w/ row (enabled/disabled) | in current SPECIALIST_CATALOG as |
| --- | --- | --- | --- |
| discovery-scout | Discovery Scout | 4 on | active cast → "Watch" |
| researcher | Researcher | 3 on / 1 off | active cast → "Research" |
| customer-insights | Customer Insights | 0 on / **1 off** | active cast → "Listen" — **never enabled anywhere live** |
| strategist | Strategist | 4 on | active cast → "Prioritize" |
| critic | Critic | 4 on | active cast → "Challenge" |
| prd-writer | PRD Writer | 4 on | active cast → "Draft" |
| sprint-planner | Sprint Planner | 3 on / 1 off | active cast → "Plan" |
| ux-architect | UX Architect | **1 on** (founder only) | active cast → "Design" |
| builder | Studio | 4 on | active cast → "Engineer" |
| qa | QA Reviewer | 3 on / 1 off | active cast → "Review" |
| release | Release Coordinator | 3 on / 1 off | active cast → "Announce" |
| data-analyst | Data Analyst | **1 on** (founder only) | active cast → "Measure" |
| orchestrator | Orchestrator | 8 on (all accounts) | active cast, conductor → "Chief of Staff" |
| **engineer** | Engineer | 3 on / 1 off | **deprecated alias of `builder`** — still being live-seeded |
| **stakeholder** | Stakeholder Comms | 3 on / 1 off | **deprecated alias of `release`** — still being live-seeded |
| **copilot** | Copilot | 3 on / 1 off | **deprecated alias of `orchestrator`** — still being live-seeded |
| operations | Operations Orchestrator | **1 on** (founder) | deprecated alias of `orchestrator`, pre-dates even 07-09 |
| growth-strategist | Growth Strategist | **1 on** (founder) | deprecated alias of `strategist` |
| competitor-watcher | Competitor Watcher | 1 off | deprecated alias of `discovery-scout` |

Founder's own account (`ROHIT G`, oldest, created 2026-06-02): **19 total rows, 10 enabled** — `builder, critic, data-analyst, discovery-scout, growth-strategist, operations, orchestrator, prd-writer, strategist, ux-architect`. Two of his ten enabled rows (`growth-strategist`, `operations`) are literal live duplicates of two others in that same enabled set (`strategist`, `orchestrator`) — this is probably the exact visual confusion he described.

### 4. `agent_runs` — actual execution ground truth (queried directly)
Slugs that have **ever produced a run**: `builder` (42 runs across statuses), `discovery-scout` (30), `orchestrator` (16), `prd-writer` (10), `researcher` (8), `sprint-planner` (6), `strategist` (6), `engineer` (6), `critic` (1), `customer-insights` (1), `data-analyst` (1), `qa` (2), `release` (1), `competitor-watcher` (1).

Slugs **seeded/enabled somewhere but with zero runs ever**: `copilot`, `stakeholder`, `ux-architect`, `operations`, `growth-strategist`. These are pure namesakes — live, toggled on, never actually dispatched.

`reactor` and `archivist` (the two "crew" entries) **never appear in `agent_runs` or `agent_memory` at all** — they are not really agents that execute under their own identity; they're plain internal functions (event routing / memory consolidation) given a persona name purely for Engine Room flavor text. They are not wired into the run ledger the same way the cast is.

---

## Part 2 — Full roster (consolidated, one row per real identity)

| Slug (canonical) | Display name (catalog) | Station | Declared purpose | Invoked by (call site) | Tools | Instructions | Runs (DB) | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `discovery-scout` | Watch | Sense | Mines connected sources, frames opportunities | `runAgentLoop` via reactor/tick crons, discovery flows | `workspace.search`, `signals.log`, `memory.remember` | System prompt baked into `seed_default_agents` SQL (`agent-vocabulary.ts` mirrors as display only) | 30 | **Real, active** |
| `researcher` | Research | Sense | Answers one question across web + workspace | `agent_loop.functions.ts`, chat | `workspace.search`, `web.search/fetch/map/crawl` | Same pattern | 8 | **Real, active** |
| `customer-insights` | Listen | Sense | Clusters feedback into named themes | never dispatched live | `workspace.search`, `signals.log` | Full prompt exists (20260618200000) | 1 | **Real but dormant** — 0 accounts have it enabled |
| `strategist` | Prioritize | Decide | ICE-scores and ranks opportunities | orchestrator handoff, `discovery.functions.ts` | `workspace.search`, `workspace.list_tasks` | Full prompt | 6 | **Real, active** |
| `critic` | Challenge | Decide | Red-teams a decision/spec, ship/revise/kill verdict | `runCritic` inline call (`discovery.functions.ts`), handoff from strategist | `workspace.search` (read-only) | Full prompt | 1 | **Real, active** |
| `prd-writer` | Draft | Define | Turns decision into a cited PRD | handoff from critic/strategist | `workspace.search`, `notes.create` | Full prompt | 10 | **Real, active** |
| `sprint-planner` | Plan | Define | Decomposes PRD into dependency-ordered tasks | handoff from prd-writer | `workspace.list_tasks`, `tasks.create` | Full prompt | 6 | **Real, active** |
| `ux-architect` | Design | Design | Maps flows/screen states before build | handoff from sprint-planner | `workspace.search`, `notes.create` | Full prompt | 0 | **Real but dormant** — enabled for exactly 1 account (founder), never run |
| `builder` | Engineer | Build | Writes the change, opens the PR | `build.functions.ts`, `studio.functions.ts` | `studio.stage/commit/pr.open`, `repo.*` | Full prompt | 42 | **Real, the workhorse** |
| `qa` | Review | Build | Reviews the diff, ship/block verdict | handoff from builder | `repo.read/search`, `github.ci.read` (read-only) | Full prompt | 2 | **Real, active (light use)** |
| `release` | Announce | Ship | Release notes / changelog / announcement | handoff from qa | `notes.create` | Full prompt | 1 | **Real, active (light use)** |
| `data-analyst` | Measure | Learn | Predicted-vs-actual outcome learning | `outcome.functions.ts` "Historian" assist button | `memory.remember/promote` | Full prompt | 1 | **Real but dormant** — enabled for 1 account |
| `orchestrator` | Chief of Staff | conductor | Plans + dispatches the mission DAG, never does specialist work | `orchestrator.functions.ts`, `resume-runs.ts` re-plan sweep | `mission.plan/dispatch/observe/finalize`, `agent.handoff` | Full prompt | 16 | **Real, load-bearing — every account has it** |
| `reactor` | Reactor (crew) | Sense (engine) | Wakes the right agent on an event | `reactor.functions.ts` directly, not via `agent_slug` | n/a — plain function | Comment-only | 0 (never appears as agent_slug) | **Display-only persona over a plain function, not a runnable agent** |
| `archivist` | Archivist (crew) | Learn (engine) | Consolidates learnings into durable memory | memory consolidation cron | n/a | Comment-only | 0 | **Display-only persona, not a runnable agent** |
| `engineer` | (raw) "Engineer" | — | **Live duplicate of `builder`** | still inserted by the live (unpatched) `seed_default_agents` | same tool class as builder | none of its own; same prompt-shape as builder in the 07-09 seed | 6 | **Duplicate-of-builder, actively regressing** |
| `stakeholder` | (raw) "Stakeholder Comms" | — | **Live duplicate of `release`** | still inserted by the live (unpatched) seed | none | — | 0 | **Duplicate-of-release, namesake** |
| `copilot` | (raw) "Copilot" | — | **Live duplicate of `orchestrator`** | still inserted by the live (unpatched) seed | none | — | 0 | **Duplicate-of-orchestrator, namesake** |
| `operations` | Operations Orchestrator | — | Legacy pre-AGENT-EXP orchestrator alias | none (legacy row only, founder's account) | — | — | 0 | **Duplicate-of-orchestrator, dead legacy** |
| `growth-strategist` | Growth Strategist | — | Legacy pre-AGENT-EXP strategist alias | none | — | — | 0 | **Duplicate-of-strategist, dead legacy** |
| `quant`, `pricer`, `discovery`, `scout`, `listener`, `research`, `historian`, `planner`, `designer`, `scribe`, `studio`, `inspector`, `releaser`, `marketer`, `support`, `competitor-watcher` | (deprecated map entries) | — | Map-only aliases so old `agent_runs` rows render a name | none — no live seeded rows for most; `competitor-watcher` has 1 dead row + 1 old run | — | — | 0-1 | **Historical only, harmless as long as nothing re-seeds them** |
| `contract-analyst`, `spec-drafter` | — | — | **Not agents at all** — labels used only in `recordGateSignalCore` (`discovery.functions.ts:1025,1397`) to attribute a human's edit of an AI-drafted contract clause / spec body for correction-rate metrics | gate-signal writer | n/a | n/a | n/a | **Metric-attribution labels masquerading as agent identities** — a naming collision with the real roster, worth renaming to avoid a 21st and 22nd "agent" showing up in analytics |

---

## Part 3 — Where "19+" / "15+" actually live (exact locations)

- `README.md:114` — **"full mesh: 19 agents, sub-agents, handoff contract, HITL gates"** (public-facing, top of repo).
- `docs/features/agent-experience.md:9,17` — the canonical resolution doc itself: **"19+ (growable) = the engine's specialist catalog... never a menu the user picks from... it is moat capacity, not UI."**
- `docs/strategy/session-decisions.md:773` and `docs/strategy/strategic-inputs-log.md:207-209` — the original founder brainstorm and its resolution, same "19+ backend / 6 stations / 5 faces" framing.
- `docs/strategy/v12-self-improving-os.md:89` — **already flags this as aspirational**: *"Mesh: 13 seeded agents (12 specialists + orchestrator)... The '19-agent mesh' phrase in older docs is aspirational; stop using it unqualified."*
- `docs/strategy/v10-master-blueprint.md:247`, `v9-decision-wedge-and-build-next.md:17,46,180` — all defer/downgrade the 19-agent mesh explicitly.
- **Nowhere in `src/` is "19+" or "15+" rendered as literal UI text or a computed badge.** The 15 is purely `SPECIALIST_CATALOG.filter(e => e.status === "active").length`, never surfaced. The 19 the founder is likely half-remembering from these docs and half-encountering live: his own account genuinely has **19 rows** in Settings right now — that's not a copy bug, that's real data.

---

## Part 4 — Consolidation recommendation

**The honest final set is 13: 12 specialists + 1 conductor, one per station, matching what `agent-vocabulary.ts` already declares as canon.** Everything else should collapse into it. Concretely, by lifecycle stage:

**Stage 0 — Stop the bleeding (data/infra, not code):**
Redeploy the already-written PC-29 fix (`20260711010000_pc29_agent_roster_collision_fix.sql`) to the live Supabase project — it is sitting unused in the repo and does exactly what's needed. Confirm afterward with `pg_get_functiondef` (as done in this audit) that it stuck, and add it to whatever pre-flight check guards against a Lovable schema resync silently reverting `handle_new_user`/`seed_default_agents` again — this has now happened at least three times (2026-06-17, 2026-07-08, and again now) by the migration comments' own account.

**Stage 1 — Keep, one per station (the real 13):**
`discovery-scout` (Watch/Sense), `researcher` (Research/Sense), `customer-insights` (Listen/Sense), `strategist` (Prioritize/Decide), `critic` (Challenge/Decide), `prd-writer` (Draft/Define), `sprint-planner` (Plan/Define), `ux-architect` (Design/Design), `builder` (Engineer/Build), `qa` (Review/Build), `release` (Announce/Ship), `data-analyst` (Measure/Learn), `orchestrator` (Chief of Staff, conductor). This is already what `agent-vocabulary.ts` says the product is. Ship the Settings UI (`StaffTab`) rendering through `agentDisplayName()`/`agentBlurb()` from that file instead of the raw DB `name`/`role` fields, so what the founder sees in Settings finally matches what the AgentRelay shows elsewhere — right now they are two different naming systems for the same rows.

**Stage 2 — Retire outright (never seed again, slug stays only as a historical map entry):** `engineer`, `stakeholder`, `copilot`, `operations`, `growth-strategist`, `quant`, `pricer`, `discovery`, `scout`, `listener`, `research` (dup of `researcher`), `historian`, `planner`, `designer`, `scribe`, `studio`, `inspector`, `releaser`, `marketer`, `support`, `competitor-watcher`. Never delete the rows (referential integrity for historical runs/decisions), never delete the map entries in `agent-vocabulary.ts` (needed to render old history), but the seed function must never insert them again — which is precisely what the unshipped PC-29 fix already does.

**Stage 3 — Decide what "crew" means, then either wire or relabel:** `reactor` and `archivist` currently have zero footprint in `agent_runs`/`agent_memory` — they're persona wrapping over plain functions. Either instrument them to actually log a run under their slug (so "crew" is a real, auditable tier) or stop presenting them as agents at all in Engine Room copy, since right now they're indistinguishable from vaporware to anyone checking the data.

**Stage 4 — Fix the metric-label collision:** rename `contract-analyst` and `spec-drafter` in `recordGateSignalCore` calls (`discovery.functions.ts:1025,1397`) to something that can't be mistaken for a 14th/15th agent slug in analytics (e.g. prefix with `metric:` or reuse the real `prd-writer` slug they're actually attributing to), since they currently read exactly like two more undocumented agents in any query against gate-signal tables.

Net effect: the roster the founder should be told about is **13**, matching the code's own stated intent; the "19" he's seeing is signup-seeding entropy across three unreconciled migrations plus a live production/repo drift, not a deliberately larger backend catalog.