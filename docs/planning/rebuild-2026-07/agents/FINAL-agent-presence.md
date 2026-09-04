# FINAL AGENT PRESENCE - The Crew Doctrine

> _Created: 2026-07-29 · Last updated: 2026-08-03_

> The deciding designer's ruling, 2026-07-28. Merges `agents-a-crew-identity.md` (identity),
> `agents-b-work-in-motion.md` (choreography) and `agents-c-human-agent-contract.md` (contract).
> Those three stay as the reasoning record. **This one is the build contract.**
>
> **This doctrine is top priority in the 2026-07 rebuild.** Where it and `ia/FINAL-ia.md` disagree,
> this document wins, and every override is named in §4.1 with its justification. Where it and
> `language/FINAL-language.md` disagree, the language contract wins on words and this document
> wins on structure; the four places that collided are resolved in §0.3.
>
> Every file, line, column, enum, constant and count below was read or run against this repo this
> session. Where any of the three proposals - or the brief that produced them - was wrong about the
> code, the corrected fact is carried, not the claim. §1.3 lists eleven such corrections.

---

## 0. THE RULING

### 0.1 The founder's complaint, restated as a structural fact

> *"We are saying Supaprod is built for product managers who ship with agents. And where is that
> agents part coming into picture for us? Nowhere."*

He is right, and it is not neglect. It is a doctrine, written down, still enforced by a comment in
the shipping code. `src/components/governance/AgentRosterPanel.tsx:1-8`:

> *"This is where WE (and the power user) manage agents; **the end user never sees this roster,
> only the relay**."*

That is the Engine-Room doctrine (`docs/conventions/engine-room-doctrine.md`) applied to the wrong
noun. It was right about `mission.dispatch`, fan-out depth, p95 and checkpoints. It was wrong about
the workforce. The result is an interface that files thirteen workers under `governance/`, routes
`/agents` and `/swarm` into `?room=safety&view=team`, and renders the crew on working surfaces as a
chip counting how many of them exist.

**The override, and it is the whole document in one line:**

> **Mechanism is machinery and stays behind the door. Labour is not machinery. Who did the work is
> chrome.**

### 0.2 The twelve rulings

Each is argued below and names the code that makes it real.

| # | Ruling | Where |
| --- | --- | --- |
| **R1** | **Roles, not characters.** The crew are professional names with one exclusive verb each and a public track record. No personas, no quips, no first person - not even for the Chief of Staff. The differentiator is the record, not charm. | §3.1, §11 |
| **R2** | **The names in `language/FINAL-language.md` are final and are adopted verbatim,** including **Publisher** over A's Announcer. Display-only; DB slugs never move. | §3.2 |
| **R3** | **Identity is shape. Colour is state.** The glyph is the identity. The thirteen hues are frozen at their current values (language R-freeze honoured) and **may render only at 24px and above**. Below 24px a mark is monochrome ink and any colour on it means *running*, *needs you*, *failed* or *benched*. | §3.3 |
| **R4** | **The crew gets a permanent region of the shell - the Crew Bar - carrying all thirteen marks, always, including when nobody is working.** This is the single pixel that answers "where are the agents". A's completeness rule wins over B's and C's live-only strip. | §5.1 |
| **R5** | **The Bar expands in place into the Floor**, which pushes the Canvas and never covers it. This is B's answer to the calm test and it is adopted whole: waves, one pulse, fixed rows, no re-sort while you look. | §5.2 |
| **R6** | **Presence is never a page. The record is.** One new workbench child, `/crew/$agentSlug`, holds the four dials and the scorecard. It is where you *change* an agent, never where you *watch* one. | §5.4 |
| **R7** | **Attribution is a property of the object, not of the edge.** C's finding is decisive: artifact rows carry no author today. Seven tables gain three columns; a `Byline` mounts on sixteen surfaces; four states, including a deliberately ugly `unattributed`. | §6 |
| **R8** | **What the crew DID and what the crew SAID never share a typographic treatment.** An act carries a `tool_calls` receipt; a claim does not and says so. B's Evidence Underline is the automatic enforcement, gated on a real join. | §7 |
| **R9** | **The true autonomy story is told, not the flattering one.** Agents default to `trusted`; the *tools* are gated; what is earned, one tool at a time, is the removal of a gate - and the machine asks in public with its receipts attached. | §8 |
| **R10** | **The signature moment is the Commit:** an approval does not vanish into a toast, it becomes a receipt, draws an arrow to whoever picks the work up, moves the Bar, and moves the Spine. 1.2 seconds, four regions, one causal chain. | §9 |
| **R11** | **First light starts one real run before the user types.** "Nobody is working yet" is the founder's complaint printed on the first screen of the new design, and it is deleted. | §10 |
| **R12** | **Nothing may imply capability the wiring lacks.** Eight places across the three proposals would have overclaimed. Each is rendered as an honest state instead, and three of them become build gates. | §12 |

### 0.3 The four collisions with `language/FINAL-language.md`, resolved

| Collision | Ruling |
| --- | --- |
| A names `release` **Announcer** because "Publisher out-claims the wiring - we Copy, never Post". Language R6 rules **Publisher** on the stranger test. | **Publisher.** Language wins the word. A's honesty concern is real and is met the way language R22 already meets it: the ceiling copy says *"Publisher drafts the launch note and you post it."* The name is a job title, not a claim about distribution; the Ship face still offers Copy and never Post (IA §4.2 J6). |
| A kills the thirteen-hue palette. B confines hue to the glyph gem (founder ruling C, 2026-07-11). Language §3.4 rule 5 says *"Fixed glyph and hue, never re-skinned. Carry the existing values unchanged."* | **All three are satisfied by separating value from placement.** No hue value changes (language honoured literally - we do not re-skin). Hue renders at **24px and above only** (founder ruling honoured - hue lives inside the mark and nowhere else). Below 24px the mark is monochrome (A honoured - the Crew Bar reads as three lit against ten quiet). |
| A gives the Chief of Staff the exclusive right to say "I". C bans first person entirely. | **C wins.** Attribution must survive being copied out of the app; the actor belongs in the sentence, not in the chrome. The Chief of Staff is distinguished by *what it addresses* (the whole run, and you), not by a pronoun. |
| A says an agent has exactly four strings and forbids a fifth. Language assigns each agent an **exclusive verb** as a uniqueness constraint. | **Five strings.** The verb is ratified data, not an invention. §3.4 lists all five and the test that keeps them distinct. |

---

## 1. GROUND TRUTH

### 1.1 The surface, as it exists

| Fact | Verified at |
| --- | --- |
| `/agents` is a 9-line redirect stub to `/engine-room?room=safety&view=team` | `src/routes/_authenticated.agents.tsx` |
| `/swarm` is the same redirect to the same place | `src/routes/_authenticated.swarm.tsx` |
| The roster lives under `governance/` | `src/components/governance/AgentRosterPanel.tsx` (149 lines) |
| `src/components/agents/` contains exactly two files | `AgentMark.tsx` (152), `AgentRelay.tsx` (279) |
| Agent identity components appear in 5 non-test files, all under `components/mission/` | `CrewDrawer`, `GateChip`, `PulseLine`, `SurfaceHeader`, `primitives/index.ts` |

### 1.2 The substance, as it exists - every one of these is real and unrendered

| Mechanic | Where | What it gives this design |
| --- | --- | --- |
| The catalog: 12 seats + 1 conductor + 2 machinery + 21 deprecated aliases | `agent-vocabulary.ts` `SPECIALIST_CATALOG` | stable slugs, glyph, hue, relay verb, blurb, stage |
| Adaptive step budget, computed **before the first model call** | `budget.ts` `adaptiveStepBudget` | orchestrator 14 + 2/planned step · builder 24 · specialist 6 · arc bonus 0/0/2/4 · `STEP_CEILING = 40` |
| Per-step checkpoint written **before** the provider call; compare-and-swap resume | `loop.server.ts:827-868,909`; `agent_run_checkpoints` | an honest heartbeat, and a resume that can never double-spend |
| The plan, built before work starts, up to **8** steps with `depends_on` | `orchestrator.server.ts:204`; `mission_steps` | **the single most valuable unrendered asset in the repo** |
| 46 tools, each with a risk level, a mode, and a plain-language `preview(args)` | `registry.server.ts` (3243 lines) | a sentence for every step, already written 46 times |
| Trust from four signals with Bayesian shrinkage | `trust.server.ts` `computeAllAgentTrust` | mission 0.30 · approval 0.20 · eval 0.20 · **outcome 0.30**; `PRIOR 0.5`, `PRIOR_WEIGHT 10` |
| Four-rung arc with human names | `agent_autonomy.arc`; `trust-ladder.ts` | Supervised · Reviewed · Trusted · Autonomous |
| Per-(agent, tool) graduation, human-accepted only | `trust_graduation_proposals`, `agent_tool_modes.source` | an agent can **earn** the right to stop asking, and earned is stored distinctly from granted |
| The graduation generator with a real downside guard | `reflection.server.ts` `maybeProposeTrustGraduations`; `trust-ramp.ts` | `TRUST_RAMP_CLEAN_N = 5`; a `missed` outcome inside 30 days blocks every proposal for that agent |
| Safety floors no dial can loosen | `resolveToolMode`; `HIGH_RISK_FORCE_REVIEW = {studio.pr.merge, studio.revert, delegate.openhands}`, `HIGH_RISK_MIN_CONFIRM = {calendar.create}`, `BUILD_LANE_AUTONOMOUS = {studio.stage, studio.commit, studio.pr.open}` | "trust never buys a dangerous shortcut" is provable, not asserted |
| Scorecard incl. **revert count** from real `artifact.rewind` rows | `agent-scorecard.ts`, `MIN_TOOL_SAMPLES = 2` | the number no vendor volunteers |
| Static blast radius and reversibility per tool | `tool-consequences.ts`, `REVERSIBILITY_LABEL` | consequence copy that is **not model output** and can be stated flatly |
| Fleet state, pure | `agent-fleet.ts` | `working \| queued \| attention \| idle`, per-agent tallies, `lastActiveAt` |
| Capabilities that write through to the runtime | `capabilities.functions.ts` (794) | `updateAgentInstructions` → `agents.system_prompt` (the column the loop reads); `toggleAgentSkill` → `agent_disabled_skills` (the rows `mission.plan` reads); `instructionsPreview` assembled by calling the **same** render functions the loop calls |
| Blast-radius cap | `agent-tool-cap.ts`, `setAgentToolCap` | `agents.max_tool_risk` removes over-cap tools from the prompt entirely |
| Bench, already enforced by the runtime | `agents.enabled` | `handoff.server.resolveAgent` filters `.eq("enabled", true)`; `agents.functions.runAgent:166` refuses. **No write path, no UI.** |
| Unattended work, queryable | `today.functions.ts:883` `getRecentExecutedUnattended`; `ExecutedCard.tsx` (547 lines, **zero importers**) | the payoff exhibit of the trust arc, currently dead |

### 1.3 Eleven corrections. Three of the proposals would have shipped a lying UI.

| # | The claim | The verified fact | Consequence |
| --- | --- | --- | --- |
| C1 | "the runtime REJECTS an evidence-free handoff" (brief, and C §9.3 builds on it) | `handoffEvidenceGateEnforced()` reads `process.env.HANDOFF_EVIDENCE_GATE` and is **OFF by default** (`handoff.server.ts:85-88`). The validator computes a verdict and proceeds. The source comment states no live handoff carries `evidence_ids` today. | The seam renders `Evidence: none cited` as today's normal case, neutral register. Arming the flag is build gate **G3**. C's "the gesture passes the gate by construction" is rewritten as "the gesture is the first path that will populate it." |
| C2 | "50 tools, modes `auto`/`confirm`/`off`" | **46** tool defs. Modes are `auto` / `confirm` / **`review`**. There is no `off`. `review` means *queue and show me*, not *disabled*. | Every autonomy sentence in the product says `review` correctly. |
| C3 | "`mission.plan` builds a 1-6 step DAG" (brief, A, C) | Up to **8**. `orchestrator.server.ts:204` throws `"mission.plan: too many steps (>8)."` | The Floor's row budget is 8 plus brood. |
| C4 | "Agents have a trust arc and can EARN autonomy" (implying they start low) | `loadAgentArc` returns **`"trusted"`** when nothing is set - founder ruling 2026-07-08, SW-7. The dial exists to **tighten**. | §8.1 tells the true story. Any copy reading "earn my trust" or "your agents start on a short leash" is a lie about this codebase. |
| C5 | "`agent.spawn` fans out parallel sub-agents" (present tense) | Gated OFF by `AGENT_FANOUT` (`registry.server.ts:3010` throws). `FANOUT_MAX_CHILDREN = 8`, `FANOUT_MAX_DEPTH = 1`. | Parallelism is designed from `mission_steps` waves, which are live. Brood rows are the additive case and render nothing until the flag flips. |
| C6 | B designs a raw-model-IO tab over `agent_run_messages` | **`agent_run_messages` and `agent_run_steps` do not exist.** They are named in one comment (`loop.server.ts:832`) and in no migration and no query. | The raw tab is **cut**. The durable step record is `tool_calls` (joined by `trace_id`) plus `agent_run_checkpoints`. Every step rendering in this document is built on `tool_calls`. |
| C7 | C: "`gate-signals` is written and called from nowhere" | Half right. `recordGateSignalCore` **is** called, from `discovery.functions.ts:1021,1393` and `agent_loop.functions.ts:111`. It is **not** called from `decideApprovalItem` / `sendBackApprovalItem`, and **`getGateSignals` has zero consumers.** | Build item: two call sites, not a from-scratch wiring. The read half is genuinely dead. |
| C8 | `tool_calls` can be joined to a run | `tool_calls` columns are `id, user_id, workspace_id, event_id, trace_id, agent_id, tool_name, args, result, ok, error, latency_ms, created_at`. **No `run_id`, no `mission_id`.** The only path today is `agent_run_checkpoints.state->>'traceId'` (`missions.functions.ts:380-388`), a jsonb path that returns nothing when a checkpoint row is missing. | Hard gate **G1** for the Evidence Underline and the Receipt Ladder's second rung. A silently-empty resolver would make every honest claim look unbacked, which is worse than no feature. |
| C9 | A: attribution can be read from `artifact_lineage.created_by_agent` | True of the **edge**, not the **row**. `prds`, `opportunities`, `signals`, `themes`, `studio_changesets`, `deployments` carry no author column. `recordLineage` is called from 8 non-test modules, none on the back half of the loop. `SpecDetail.tsx` already reaches for `ancestors[0].created_by_agent` and gets nothing when no edge was written. | C's schema change is mandatory. Build item **B1**, rides IA P4. |
| C10 | Graduation respects a "not yet" | `decideTrustGraduation(accept:false)` writes `status:'rejected'` and **nothing stops a re-proposal** on the next clean streak. `trust-ramp.ts` has `CLEAN_N` and `OUTCOME_WINDOW_MS` and no cooldown. | The card may not say "it will not ask again for 30 days" until **B4** ships. Copy and predicate ship in the same commit. |
| C11 | Trust can be withdrawn | `setAgentArc` moves the rung. **There is no function that deletes an `agent_tool_modes` row.** A user can grant and cannot ungrant. | **B3 `revokeTrustGraduation` is a correctness item, not polish.** A trust mechanic whose withdrawal path does not exist is not a trust mechanic. |

Also verified missing and named in the build list: `agent_runs.parent_run_id` (brood discovery), `agent_runs.completed_at` (every "finished at" is inferred from `last_checkpoint_at`), `haltRun` for a non-mission run (`cancelMission` exists; a bare run has no stop).

---

## 2. THE DOCTRINE, IN THREE SENTENCES

Written to be said out loud, to survive a sceptic, and to contain no banned category word.

> **1. Your crew does the work. You make the calls.**
>
> **2. An agent is a named worker with one job, a track record you can read, and a limit on what it
> may do without asking you.**
>
> **3. You are here for the three calls your crew will never make: what is worth building, what is
> good enough, and what goes live.**

Sentence 1 is the ratified in-app tagline in its ratified form (`language` R22 amends it to
**"You make the calls. Your crew does the work between them."** on the auth scaffold; the shorter
form above is the sign-in title only). It appears in exactly two places. Repetition kills it.

Sentence 2 is provable clause by clause: *named worker* is `SPECIALIST_CATALOG`; *one job* is the
exclusive verb, a uniqueness constraint; *track record you can read* is `computeAgentScorecard`;
*limit on what it may do* is `resolveToolMode`.

Sentence 3 is not a promise, it is a description of `HIGH_RISK_FORCE_REVIEW` plus the bet, spec and
design gates. **If a floor is ever removed, the sentence changes the same day.** Copy that describes
a safety property is versioned with that property.

---

## 3. THE CREW

### 3.1 Roles, not characters - and why that is not the grey-worker failure

Personas were considered by all three lanes and rejected by all three, for the same four reasons:
a character name is a memory tax paid thirteen times and carries no information; the buyer is a PM
who has to paste this into a channel with a VP in it; thirteen voice registers is thirteen prompt
surfaces to drift through a sanitizer that already enforces one house voice; and the product already
has a better personality than charm, which is the record.

Four things stop neutral roles from becoming interchangeable grey rows, and **none of them is a
colour or a name**:

1. **A distinct glyph per agent**, permanent, monochrome-safe.
2. **A charter in second person**, one sentence, addressed to you, everywhere the agent appears.
3. **A visible, differentiated, honest track record.** Critic and Engineer will not have the same
   numbers, and the difference between them is the entire experience of having a team.
4. **Real controls.** You can bench an agent, rewrite the exact text it is handed, and take a tool
   away from it. A worker you can fire is not anonymous.

### 3.2 The thirteen (adopted verbatim from `language/FINAL-language.md` §3.2)

| Seat | Name | Exclusive verb | Charter (second person, new) | DB slug (frozen) | Was |
| --- | --- | --- | --- | --- | --- |
| 01 | **Scout** | watches | Watches the sources you connected and tells you what changed. | `discovery-scout` | Watch |
| 01 | **Researcher** | digs | Digs into one question across the web and your workspace. | `researcher` | Research |
| 01 | **Listener** | clusters | Groups what your customers are saying into patterns you can act on. | `customer-insights` | Listen |
| 02 | **Strategist** | ranks | Ranks your bets by what they are worth against what they cost. | `strategist` | Prioritize |
| 02 | **Critic** | challenges | Red-teams the call before you commit to it. | `critic` | Challenge |
| 03 | **Writer** | drafts | Turns your decision into a spec with its evidence cited. | `prd-writer` | Draft |
| 03 | **Planner** | breaks down | Breaks the spec into work you could actually sequence. | `sprint-planner` | Plan |
| 04 | **Designer** | maps | Maps the experience and renders it in your brand. | `ux-architect` | Design |
| 05 | **Engineer** | writes | Writes the change in your codebase. | `builder` | Engineer |
| 05 | **Reviewer** | checks | Checks the diff against the spec before it ships. | `qa` | Review |
| 06 | **Publisher** | announces | Drafts what you say about the release. You post it. | `release` | Announce |
| 07 | **Analyst** | measures | Reads the outcome against the bet and hands it to the Brain. | `data-analyst` | Measure |
| - | **Chief of Staff** | routes | Runs the loop and brings you the calls that need you. | `orchestrator` | Chief of Staff |

Nine of thirteen are currently named with the **verb of their own stage**. Stage 04 is `Design` and
the agent working it is called `Design`. That is not a naming quirk; it is the interface stating
correctly that these are stage functions wearing a glyph. The generative rule: **stages are verbs,
agents are agent-nouns.**

**Publisher's charter carries the honest edge in its own sentence** - *"You post it."* That is the
resolution of the Announcer/Publisher fight: the name is a job title, the charter states the wiring.

**Reactor and Archivist are not agents and get no names** (language §3.2). They render in the crew
pane under **Runs itself** as lowercase mechanisms - `event routing`, `memory consolidation` - each
with a last-event age and no dials. They are never among the Bar's thirteen marks. A system that
does things while you sleep should say so; it should not pretend the plumbing is staff.

**No agent creation in v1.** The crew pane does not show a dead `+ New agent`. It says, in one line,
what the crew is and that it is fixed. A disabled button is a lie about today.

### 3.3 The identity system - shape is identity, colour is state

`AgentMark` today renders a lucide glyph in a glass square tinted with a per-agent hue. The thirteen
hues sit inside `L 0.525-0.60`, `C 0.11-0.135`, `H 180-250` - one teal-to-blue band sliced thirteen
ways, roughly 5° apart. `Writer 199` and `Analyst 203`; `Chief of Staff 196` and `Engineer 194`. The
file's own comment concedes it: *"The glyph, not color, distinguishes agents."* Meanwhile a second
identity system exists: `AgentChip` renders mono uppercase on a machine tint with no hue and no
glyph. Two identity systems, one product.

**The ruling:**

> **An agent's identity is its glyph and its name. Colour on a mark below 24px never means *who*.
> It means *what is happening*.**

| State | Colour | Meaning | Source |
| --- | --- | --- | --- |
| idle | `--ink-muted`, monochrome | this agent exists and is not working | default |
| running | `.ink-working` pulse, `--voice-machine` | working right now | `agent_runs.status`, via `agent-fleet.RUN_STATE` |
| needs you | `--ember` | blocked on your decision | pending `agent_approvals` for this agent |
| failed | `--verdict-fail` | last run failed and nobody has looked | `agent-fleet` state `attention` |
| benched | 40% opacity, hairline outline, no fill | you turned this agent off | `agents.enabled = false` |
| halted | `--ink-subtle`, `⏸` | stopped on purpose | `agent_runs.status='halted'` |

Five active colours, every one of which already means exactly that everywhere else in the product.
This passes the grayscale test, passes for colour-blind users, and scales to thirty agents without a
palette conversation. It also produces the frame that sells the product: **the Crew Bar with three
shimmering marks against ten quiet ones.** Under the old system that frame is thirteen tinted
squares and you cannot tell who is working. Colour earns its place by being scarce.

**The hue is not deleted.** Every value in the catalog stays exactly as it is (`language` §3.4
rule 5, honoured literally: nothing is re-skinned). It renders at **24px and above only** - the
agent page header, the `@` picker row, the crew pane row. `crew-identity.test.ts` fails when a mark
under 24px sets a per-agent hue.

**One component replaces three, so a fourth identity system cannot be invented:**

```
src/components/crew/CrewMark.tsx
  CrewMark   glyph in a state                    14 / 18 / 24 / 40
  CrewChip   glyph + name, inline in prose       the attribution atom
  CrewRow    glyph + name + charter + state      roster and pane rows
```

| Size | Where | Anatomy |
| --- | --- | --- |
| 14 | inside a sentence, a receipt line, a lineage chip | glyph only, monochrome; name follows in text |
| 18 | Crew Bar, Floor rows, Thread step lines | glyph + state; monochrome |
| 24 | crew pane rows, gate cards, `@` picker | glyph + name; hue permitted |
| 40 | the agent page header | glyph + name + stage numeral + charter; hue permitted |

At 40 only, the mark carries its **stage numeral** (`01`-`07`) in mono beneath the glyph. That is
the tie between the crew and the Spine: every agent visibly belongs to a stage you already navigate,
and the Chief of Staff is the only mark with no numeral, which is exactly right.

The thirteen glyphs stay as chosen (`radar, search, messages-square, target, shield-alert, file-text,
list-checks, pen-tool, code, check-check, megaphone, activity, compass`). One change: `iconForGlyph`
must **not** silently fall back to `Bot`. An unmapped glyph is a catalog defect and fails the build
rather than rendering a generic robot beside twelve specific marks.

**C's trust ring is rejected.** Four quarter-arcs at 1px on a 16px mark is marginal by C's own
admission (its R2), it reads as a progress spinner, and - decisively - **with `trusted` as the
default arc, thirteen agents would render thirteen identical three-quarter rings.** A glyph that is
the same on every agent carries no information and spends the restraint budget for nothing. Earned
standing is legible in words where it matters: the gate card, the agent's Record and Permissions
tabs, and the byline peel. C's own exit clause applies: nothing else in the design depends on it.

### 3.4 The five strings, and only five

| Field | Status | Rule | Example (Listener) |
| --- | --- | --- | --- |
| `name` | renamed | one word, agent-noun, never a stage name | `Listener` |
| `verb` | ratified by language | exclusive across the crew, a uniqueness constraint | `clusters` |
| `charter` | `blurb`, rewritten | one sentence, **second person**, what it does *for you* | "Groups what your customers are saying into patterns you can act on." |
| `relayVerb` | exists | present participle, what it is doing now | "clustering customer signals" |
| `handoffLine` | **new** | one noun phrase: what it hands the next agent | "patterns, with the raw messages under each one" |

`handoffLine` turns the relay from a row of glowing squares into a legible chain: it is what makes
`Listener → Strategist` mean something at a glance, and it is derivable from what the agent actually
writes into `HandoffPayload.artifacts`, so it can be **checked against reality** rather than
asserted.

Today's `blurb` is written *about* the agent. The charter is written *to the user*. That one
grammatical move is most of the difference between a governance roster and a team.

Cost: one file. `SPECIALIST_CATALOG[].name` is display-only by design; `agentDisplayName()` is the
one resolver and every surface routes through it; deprecated aliases keep resolving so historical
runs still render a name. Per `language` §4, the module becomes `src/lib/crew.ts` and
`AgentTier = "cast" | "crew"` becomes `CrewTier = "crew" | "machinery"`.

---

## 4. WHERE THIS OVERRIDES THE IA

### 4.1 The seven overrides to `ia/FINAL-ia.md`, stated plainly

ONE ROOM survives this document intact. **No new destination is created.** The crew did not need a
destination; it needed a region, a face on every object, a record, and four dials that already work.

| # | `FINAL-ia.md` says | This doctrine rules | Why |
| --- | --- | --- | --- |
| **O1** | §1.3: the WorkingStrip is one line - `● Engineer is writing tests · 2 agents working · Stop everything` | **The WorkingStrip becomes the Crew Bar: a permanent 32px region carrying all thirteen marks, the live locus, the census and the stop.** §5.1 | A line with one name slot is silent about the other four things happening, and on a quiet day it is silent about the entire workforce. Hidden is a function of silence - the IA's own thesis, applied to the region whose whole job is the crew. |
| **O2** | (no such region) | **The Bar expands in place into the Floor,** `?floor=open`, key `w`, pushing the Canvas, never covering it. §5.2 | A count with no place to expand into is the exact failure the depth rail exists to fix. An overlay would say "this is a detour"; watching the crew work is not a detour from the product, it is the product. |
| **O3** | §2.2 tile 5: **"Who is working"**, count = agents working now, owning presence *and* record | **Tile 5 becomes "Your crew", and it owns the record only. Its count is open graduation proposals plus agents whose standing changed this week.** §5.3 | The Bar already carries the working census permanently at zero clicks. A second working count on the rail is the two-counts disease the IA bans in its own §7.5. A rail count should count *what changed*. |
| **O4** | §2.6: five workbench children | **Six. `/$ws/$product/crew/$agentSlug` with tabs `record \| work \| instructions \| permissions`.** §5.4 | Passes the IA's own modal-vs-page law on both limbs: worked on for more than a minute (rewriting instructions), and handed to someone outside the loop (a reviewer asking what Engineer may touch). And it wins the same width argument the IA already accepted for the Map: a scorecard, a per-task table, an assembled multi-block prompt and a tool matrix at 420px is a screen you cannot read. |
| **O5** | §2.4: config group **Agents** = `staff` + `autonomy` + `ai` | **Delete `staff` and `autonomy`. Rename the group `?config=models` (its only remaining member is `ai`).** Researcher watch targets move to Researcher's own Work tab. §5.5 | The IA's own argument, applied consistently: *"a prompt, a guardrail and a cap are how the engine runs, and their results are read next to them. Splitting definition from result across two destinations is how `/engine-room` became unreadable."* An agent's instructions and its arc are the identical case, and today they are homed twice - in the overlay and in the crew pane - which §2's no-second-homes law forbids. |
| **O6** | §1.4: Spine run mode is `RUN · mission #182`, singular; §3.2 first light Spine is "present and quiet" | **The Spine's run label carries the census (`RUN · MSN-182 ‹1 of 3 live›`), and each Spine node carries the 14px mark of the agent *currently working* that stage.** §5.6 | `advanceMissionCore` dispatches a whole wave and `MISSION_BATCH` advances 50 missions a tick; a label that assumes one run is wrong the first time two are live. And if the first frame is the argument, the first frame must contain agents - but as live occupancy, never as static ownership, because stage 01 has three agents and a static drawing would be a lie. |
| **O7** | §3.2: first light WorkingStrip reads **"Nobody is working yet."** | **First light starts one real Researcher run before the user types.** §10 | This is the founder's complaint printed on the first screen of the new design. The difference between asserting and demonstrating is one server call. |

Everything else in `FINAL-ia.md` is adopted unchanged, and three of its rules are load-bearing here
and are extended rather than amended: the zero-count law (§2.2), the one-count law, and
"a queue is not an agenda" (§3.4).

### 4.2 The full home table for the crew

| Thing | Home | URL | Clicks |
| --- | --- | --- | --- |
| Is anyone working right now | **Crew Bar**, permanent | - | 0 |
| Who is working, on what, in what order | **The Floor** | `?floor=open` | 1 (`w`, chevron, or the census) |
| Who made this object | the **Byline**, on the object | - | 0 |
| The thirteen at a glance, with their records | Crew pane | `?pane=crew` | 1 (`c`) |
| One agent, everything about it | Crew child | `/crew/$agentSlug` | 2, or 1 from any `CrewChip` |
| Its record | `?tab=record` (default) | | 2 |
| Its runs and handoffs | `?tab=work` | | 3 |
| The exact text it is handed every run | `?tab=instructions` | | 3 |
| What it may do, and what it never may | `?tab=permissions` | | 3 |
| Bench / bring back | Permissions tab, and the crew pane row kebab | | 3 / 2 |
| "May I stop asking about X?" | Gate tray, **and** the agent's Record tab | `?gate=open` | 1 (`g`) |
| Take a permission back | **the receipt of the unattended work itself** | - | 1 |
| The whole run, as a ledger | Mission child, Thread column | `/mission/$id?tab=timeline` | 2 |
| One step | `?step=<idx>` on the ledger, or `?pane=record&pview=traces&item=trc_9` | | 3 |
| The machine door (A2A) | Crew pane footer, one row, one copy button | | 1 |

Nothing about an agent is more than three clicks from the room, and the three things you do daily - see who is working, see who made this, decide a graduation - are zero, zero and one.

---

## 5. PRESENCE: WHERE THE CREW LIVES

### 5.1 The Crew Bar - permanent, complete, honest at rest

32px. Directly above the Composer, which stays the lowest region always, at every breakpoint, never
`hidden`. Present on every room surface and every workbench child.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ◉◉◉◉◉◉◉◉◉◉◉◉◉   ● Engineer  writing the change · autofill.tsx   4m20s  6/24  ⌄ ■ │
└──────────────────────────────────────────────────────────────────────────────────┘
  13 marks, 3 lit   the live locus                                census  floor stop
```

**Five properties, deliberately mirroring the depth rail's five so the shell has one philosophy:**

1. **Permanent.** Never conditionally rendered. Below `md` the thirteen marks collapse to a count
   chip plus the live locus; **the marks never disappear entirely on desktop.**
2. **Complete.** All thirteen are always present - not "the agents that are running", the *crew*,
   with the quiet ones quiet. This is the single pixel that answers "where are the agents".
3. **Honest at rest.** Zero running is not an empty bar:
   `◌ Nobody is running. Scout reads your 4 sources at 2am, and Researcher is watching 3 competitors.`
   Both halves are real (`researcher.functions.getResearcherTargets`, routines). A bar that ever
   reads "idle" teaches the user the crew is a feature they turn on. A bar that names what is being
   watched and when it wakes teaches them the crew is always employed. **This state is
   non-negotiable and is the part most likely to be skipped under deadline.**
4. **The live locus.** One line: agent, verb, object. Sources: `.ink-working` dot ·
   `CrewMark(slug, 18)` · `agentDisplayName(slug)` · `ACTION_LABEL[tool_name]` while a tool is
   mid-flight, else `agentRelayVerb(slug)` (`stepLabel()` already implements this fallback chain) ·
   `mission_steps.sub_goal` truncated · elapsed from `agent_runs.created_at` · `step_index` over
   `adaptiveStepBudget`. **Never "Thinking..."**, which is the word that turns a worker into a chatbot.
5. **The doors.** Clicking a mark opens that agent. Clicking the chevron, the census or pressing `w`
   opens the Floor. Same URL every time.

**Six rules, each preventing a specific failure:**

- **The line never scrolls, marquees or types.** It crossfades on change, 150ms, `--ink-ease`.
- **The live locus is the run with the most recent `last_checkpoint_at`** - deterministic, so the
  Bar does not flicker between two agents on every poll.
- **A gate never turns the Bar ember-as-a-badge.** The agent's own mark goes ember (that is the
  mark's state system), and the census reads `1 waiting` as a word in `--ink-body`. **The one
  numeric approvals count lives on the ember rail tile and nowhere else.**
- **The clock advances client-side between polls; the step counter never does.** Elapsed is
  computable from a timestamp, so a stale poll still shows a moving surface. A step advance is a
  fact and may only come from data. This is the whole trick for making a 4s poll feel live without
  inventing anything.
- **The silence age is shown.** `● Engineer · writing the change · no step for 1m 40s`, from
  `agent_runs.last_checkpoint_at`. Past a threshold it changes register on its own: *"no step for
  4m - this one is running long. [Stop it]"*. A spinner cannot tell you whether an agent is thinking
  hard or dead. That number can, it costs nothing, and it is the highest-trust detail in the whole
  run surface.
- **`Stop everything` is only rendered when every live run can actually be stopped.** `cancelMission`
  is real; a bare non-mission run has no stop path today. Until **B12** (`haltRun`) ships, the
  control is absent for that case rather than dead. **Do not render a control that cannot act** - it
  is the fastest way to teach a user that the visible controls are decorative.

### 5.2 The Floor - five agents reading as competence, not chaos

Press `w`, the chevron or the census. The Bar grows upward; the Canvas **shortens** by the Floor's
height (250ms push). Nothing is covered. `?floor=open` survives reload and is linkable. Escape
closes it, innermost-first. Max 6 rows visible, then scroll inside the region. **One row per live
run, not per mission.**

```
┌──────────────────────────────────────────────────────────────────────────── ⌃ ─┐
│  MSN-182 · Checkout autofill                                  Chief of Staff   │
│  wave 1 ───────────────────────────────────────────────────────────────────── │
│  ● ◈ Engineer   writing the change · autofill.tsx          4m 20s   6/24    ⌄ │
│  wave 2 ───────────────────────────────────────────────────────────────────── │
│  ● ◈ Reviewer   checking the diff                          1m 02s   2/6     ⌄ │
│  · ◈ Publisher  not started · waiting on Reviewer -  - │
│                                                                                │
│  MSN-179 · Q3 positioning teardown                            Chief of Staff   │
│  ▲ ◈ Critic     needs your call · kill the speed claim      12m     4/6     ⌄ │
│  ✕ ◈ Researcher hit a problem · the source returned 403 - 3/6     ⌄ │
│  ⊘ ◈ Writer     never got its turn · Researcher failed -  - │
├────────────────────────────────────────────────────────────────────────────────┤
│  3 working · 1 waiting on you · 1 failed · 1 skipped   2 runs   Tidy   Stop all │
└────────────────────────────────────────────────────────────────────────────────┘
```

**The five rules that make parallelism read as calm.** Each names the chaos it prevents.

1. **Fixed row height, fixed column grid, no reflow ever.** 32px per row. A row changing state
   changes its glyph and its middle text; it never changes size, never wraps, never grows. *Rows
   that grow are the single largest source of chaos in agentic UIs.* Truncate with an ellipsis; the
   full text lives in the expand.
2. **Deterministic, stable sort that does not re-sort while you are looking.** Missions by
   `updated_at` desc; within a mission by `mission_steps.idx`. A row that changes state **stays where
   it is** and is marked. Re-sort happens on close or on explicit `Tidy`. Watching rows leapfrog is
   what makes parallelism read as noise.
3. **One clock column, one meaning.** Every time is elapsed-since-`created_at`, right-aligned, mono,
   tabular-nums. Never mix "started 4m ago" with "about 3m left". **There are no estimates in this
   product because the engine does not have any.**
4. **One pulse.** Only the live locus carries `.ink-working`. Every other running row carries a solid
   dot with no animation. Five pulsing dots is a Christmas tree; one pulsing dot and four solid ones
   reads as a crew with a foreman, which is exactly what it is.
5. **Ember appears exactly once.** The `▲` needs-you glyph is the only `--voice-human` on the Floor.
   If two things on the Floor are shouting, one of them is wrong.

**Waves are the difference between an orchestra and a room full of noise.** `mission_steps.depends_on`
plus `next_ready_mission_steps` already define a wave precisely: the set of steps whose dependencies
are all done. The Floor draws a hairline between waves and labels the gutter. Three agents working
simultaneously *inside wave 1* reads as **the plan executing in parallel**. Three agents working with
no visible structure reads as **three things happening**. Same data, one hairline apart.

**The plan is on the Floor before the work starts.** When `mission.plan` lands, the rows are already
there at `·` not started, in their waves, with their dependency arrows. You watch a drawn plan fill
in. That is how a sceptic tells execution from improvisation.

**The status vocabulary is corrected in two places** (`relay.ts` `mapRelayStatus`, build item B7):

| Status | Today | Ruling | Glyph / colour | The word |
| --- | --- | --- | --- | --- |
| `halted` | maps to `failed` | **its own state** | `⏸` `--ink-subtle` | stopped on purpose |
| `skipped` | falls through to `idle` | **its own state** | `⊘` `--ink-faint` | never got its turn |

Rendering `halted` red teaches users the product breaks when it is being careful. Letting `skipped`
fall to idle erases the poison cascade entirely. And `completed_with_failures`, which
`maybeCompleteMission` sets deliberately, renders **"Finished, with 2 steps skipped"**, never
"Completed".

**The Poison Trail.** `computePoisonedSteps` already returns `Map<idx, culpritIdx>` - every skipped
step knows exactly which failed step killed it, transitively. Render the relationship. One sentence
at the head of the group, in the machine voice: **"Researcher failed, so 3 steps after it never
ran."** Only the culprit is red; the skipped rows are faint and connected by a hairline back to it.
Three independent red rows read as *the product is broken*. One red row with a visible consequence
chain reads as *one thing failed and the system handled it.* Same data, opposite conclusion. The
recovery door sits on the culprit: **Fix and re-run from here.**

**Brood rows** (`agent.spawn` children) collapse to one line under the parent - `└ 8 sub-agents · 5 done, 3 working · split budget` - expanding to a 24px sub-list. This is **dormant
today** (`AGENT_FANOUT` unset) and renders nothing until the flag flips. It needs `parent_run_id`
(B6), because discovering brood children today requires the negative join "runs on this mission that
no step references", which is fragile.

**The footer's `Stop everything`** wears `--voice-human` on hover only and takes a dry confirm that
names the count and the consequence: *"Stop 3 running agents. Work already committed stays; a
half-written changeset is discarded."* Per-run stop lives on the row's overflow, one gesture deeper.
Never a bare `✕` on every row - a row of destructive affordances is how people stop work by accident.

### 5.3 The crew pane (`?pane=crew`, 420px) - the record, not the presence

```
Your crew                                      2 want more room · 1 standing change
──────────────────────────────────────────────────────────────────────────────────
◈ Chief of Staff                                                          running
  Running "Rollout gate for export" · 4 of 9 steps · 6m
──────────────────────────────────────────────────────────────────────────────────
01 DISCOVER
◉ Scout        watched 6 sources, last swept 2h ago                 approved 31/33
◉ Researcher   idle since Tuesday                                    approved 6/11
◉ Listener     clustering customer signals                          approved 14/15
02 DECIDE
◉ Strategist   idle                                                 approved 19/22
◉ Critic       needs you: teardown on "Export v2"                   approved 27/30
...
──────────────────────────────────────────────────────────────────────────────────
RUNS ITSELF
· event routing         wakes an agent when a source changes    41 events this week
· memory consolidation  ran Sunday                                     8 memories
──────────────────────────────────────────────────────────────────────────────────
Other agents can talk to your crew.        card URL  [copy]
Thirteen agents, one per judgment in the loop.       Instructions and limits →
```

- **Grouped by stage, in Spine order, with the numerals.** Reading the pane teaches the loop a second
  time. The conductor sits above the stages, not inside one (`isConductor()` already special-cases
  it; its catalog `decide` filing is a data artefact, not a truth).
- **The second line is a live verb or an honest silence with an age.** Never blank, never "No
  activity". `agent-fleet.lastActiveAt` gives the age for free.
- **The third column is the record, or nothing.** Under three decided judgments the column is empty - not `0/0`, not a hollow score. `formatTrackRecord()` already returns `null` for an empty record and
  the UI must respect it.
- **The machinery is visually demoted and unnamed**, per §3.2.
- **The A2A row is one line, and it is the agent-native claim made concrete.**
  `/api/public/a2a.agents.supaprod.card.ts` and the `a2a.message.send` / `a2a.message.stream` routes
  already ship. It costs a row and a copy button.

**Scope.** The pane carries the IA's H1 scope toggle (this product / all products), defaulting to
product, and this must be decided before the rail counts ship.

### 5.4 The agent page - `/$ws/$product/crew/$agentSlug`

A sixth workbench child wearing the full room chrome - TopBar, Spine (run mode when this agent has a
live run), Crew Bar, depth rail - with the Thread column replaced by that agent's own step sequence,
exactly as the mission child does.

**Record (default tab).** Every number on it is computed today.

```
◉  CRITIC                                                             02 · DECIDE
   Red-teams the call before you commit to it.
   Trusted · it acts, and asks you before anything it cannot undo.
──────────────────────────────────────────────────────────────────────────────────
Of the 9 bets it ranked that shipped, 6 landed.
You approved 27 of 30.  You sent 3 back.  You undid its work once.
What you changed most: the success metric, 3 times.
──────────────────────────────────────────────────────────────────────────────────
TRUST 81 of 100, over 36 samples                       suggested: trusted   ✓ set
  missions   14 of 15 completed                weighted 0.30
  approvals  27 of 30 approved                 weighted 0.20
  evals      mean 0.78 over 9 judged           weighted 0.20
  outcomes   4 of 6 validated                  weighted 0.30
  Small samples are pulled toward 50. With 36 samples the pull is small.
  2 mixed verdicts are not counted.
──────────────────────────────────────────────────────────────────────────────────
BY TASK TYPE                                            (2 or more decided each)
  run a teardown         approved 18 of 19
  score a bet            approved  7 of  9
──────────────────────────────────────────────────────────────────────────────────
IT ASKED FOR MORE ROOM                                                  2 pending
  "Stop asking before I run a teardown."  5 clean approvals in a row.
  [ Let it ]  [ Not yet ]                                    decide · gate tray
  Earned 12 Jul · stop asking before scoring a bet
  You said not yet, 3 Jul · post to Slack       it will not ask again until 2 Aug
──────────────────────────────────────────────────────────────────────────────────
COST   $4.12 over 14 runs · $0.29 a run · $1.03 per validated outcome
```

**Lead with the outcome sentence, never the score.** `computeAllAgentTrust` weights
`outcome_validated_rate` at 30% - did the work this agent decided on actually turn out well once
real signal came back. Every agent product on the market can show "142 tasks completed". Almost none
can show *"of the 9 bets it ranked that shipped, 6 landed."* The 0-100 score is shown small and
second, with its four inputs beneath, because a composite number is an argument and the three
sentences above it are evidence.

**Never bury the revert count.** *"You undid its work once."* `computeAgentScorecard` computes it
from real `artifact.rewind` rows and deliberately keeps it out of the approve rate. A product that
volunteers how often you undid its work is the only kind a sceptic believes.

**Four honesty rules, hard:**

1. **Never a rate without its denominator.** "90% approval" is banned; "approved 27 of 30" is the
   only legal form, product-wide.
2. **Never a trust score under three samples.** `suggestArc` already returns `observing` below three;
   the UI shows *"Too new to have a record - 1 judgment so far"* and no number.
3. **The shrinkage is stated in plain words.** A PM who discovers on their own that a fresh agent
   shows 50 will assume the number is fake. Saying "small samples are pulled toward 50" converts a
   suspicious artefact into evidence of statistical care.
4. **`mixed` verdicts are shown as excluded.** `computeAllAgentTrust` drops them
   (`trust.server.ts:29-31`). Silently dropping data is how a sceptic decides the numbers are curated.

**Work.** Runs from `agent_runs` (status, mission, steps vs budget, duration, cost), each opening the
trace child. Beneath: **handoffs** - what this agent received and sent, each with its evidence count
and a peel to the cited rows (`HandoffPayload.artifacts`, `evidence_ids`, `memory_refs`, persisted
whole in `agent_messages.payload`). A handoff that asserted artifacts and cited nothing renders
`0 cited` in `--ink-subtle` with `[why this matters]`, not in red - that is today's normal case
(§12, G3). For Researcher, this tab also carries **"What I am watching"**
(`getResearcherTargets` / `updateResearcherTargets`, two exports with zero UI today).

**Instructions - the highest-trust screen in the product, and it is almost entirely built.**
`getCapabilities` returns `instructionsPreview`, assembled by calling the *same* render functions
`loop.server.ts` calls, in the same order (`capabilities.functions.ts:351-362`).

```
What Critic is told, every run                              4 blocks · 1 is yours
┌ Its job ──────────────────────────────────────────── yours, edit ─┐
│ You are Critic. Red-team the strongest version of the case...       │
└───────────────────────────────────────────────────────────────────┘
┌ How we write ──────────────── from Settings · Voice ──── read only ┐
┌ What we are building ─────── from your Brief ─────────── read only ┐
┌ House rules that apply to Critic (2 of 7) ────────────── read only ┐
  · Never propose a price change without a comparison
  · Cite at least one customer signal in a teardown          why only 2? →
```

Only the first block is editable; it writes `agents.system_prompt` via `updateAgentInstructions`,
which is the exact column the runtime reads. The rest is the assembled truth. Under the stack, the
receipts: `capability_changes` rows - *"you changed this on 12 Jul · 3 runs since"*. Nothing else in
this product answers *"is it really doing what I told it"* this directly, and today it renders
nowhere.

**Permissions.** Five controls, all wired except the last:

| Control | Writes | Real effect |
| --- | --- | --- |
| The arc, 4 positions, `suggested` marked | `setAgentArc` → `agent_autonomy.arc` | `resolveToolMode` composes it with each tool's own mode, every run |
| Blast radius (`low`/`medium`/`high`/none) | `setAgentToolCap` → `agents.max_tool_risk` | `capToolsByRisk` removes over-cap tools from the prompt entirely - the agent cannot see them |
| Tool matrix (this agent's tools × auto/confirm/review) | `agent_tool_modes` | the mode the loop resolves at the gate |
| Playbooks | `toggleAgentSkill` → `agent_disabled_skills` | disabled playbooks are never picked at `mission.plan` time |
| **Bench / bring back** | **new B10**: `setAgentEnabled` → `agents.enabled` | **already enforced by the runtime in two places**: `resolveAgent` filters `enabled=true`; `runAgent:166` refuses |

The matrix draws safety floors as **locked rows with their reason on the row**, never as absent rows:

```
  merge a pull request         ● always asks you       locked · never graduates
  revert shipped work          ● always asks you       locked · never graduates
  create a calendar event      ● asks you              locked at minimum
  commit to a branch           ○ runs without asking   build lane, reversible
  open a draft pull request    ○ runs without asking   build lane, reversible
```

A locked control that explains itself builds more confidence than an unlocked one. The three
constants behind those rows are the strongest safety artefact in the codebase and are currently
invisible.

**Bench is the cheapest large trust win available.** The column exists, the runtime honours it twice,
the HUD already selects it. `setAgentEnabled` plus a `capability_changes` enum value is the entire
build. A benched agent renders at 40% throughout the product with *"you benched Researcher on
12 Jul"*, and the Chief of Staff routes around it.

### 5.5 What leaves Settings

| Section today | Goes to |
| --- | --- |
| `agents / staff` (Roster) | The crew pane + agent pages. **Deleted from Settings.** |
| `agents / autonomy` | Agent page → Permissions, per agent. Cross-agent view is the crew pane. **Deleted.** |
| `agents / ai` (Models & keys) | Genuinely account-level. **Stays**, and the group is renamed `?config=models`. |
| researcher watch targets | Researcher's own Work tab, edited inline. The Discover face's "What your crew is watching" strip stays as the second, read-only rendering. |

### 5.6 The Spine

- The run-mode label carries the census and becomes a stepper: `RUN · MSN-182 ‹1 of 3 live›`. Product
  mode remains the default; the Floor remains the multi-run answer. The Spine draws one run and
  **admits there are three**, which is honest and closes the IA's own R10.
- Each node carries, at 14px beneath the stage name, the mark of the agent **currently working that
  stage**, with the `.ink-working` shimmer. Nothing when nobody is working it. Live occupancy, never
  static ownership - stage 01 has three agents and a fixed drawing would be a lie.

---

## 6. THE ATTRIBUTION GRAMMAR

> **The law: every object a person can look at states who made it, in the same place, at the same
> size, always. Top-left of its own header. Leading edge of its own row. Never a hover, never a
> tooltip, never an information icon.**

### 6.1 Four states, and the third is the one every product gets wrong

The most common case is *an agent drafted it and a human changed it*. Rendered as "human", the
crew's contribution is erased. Rendered as "agent", the human is misquoted. Both are lies and a PM
notices within a day.

| State | Rendering | Backed by |
| --- | --- | --- |
| **By an agent** | `CrewMark` (rounded square, 16px) + name | `authored_by_agent` |
| **By you** | your avatar (circle, 16px) + "You" | `authored_by_agent is null` |
| **Agent drafted, you changed it** | both marks, square then circle, joined by a hairline, and the word **edited** as a link | `authored_by_agent` set **and** `human_edited_at` set |
| **Unattributed** | mono grey `unattributed`, no glyph | both null on a legacy row |

**Square versus circle is the differentiator, not colour.** `AgentMark` already draws a rounded
square (`borderRadius: size * 0.32`); a human avatar is a circle. It survives grayscale, survives
colour blindness, and is pre-verbal at 16px.

**The mixed state's link is real.** `edited` peels the diff between the agent's draft and the current
text. `prds.snapshot_before`, `opportunities.roadmap_snapshot_before` and `decisions.snapshot_before`
are live jsonb columns holding exactly that. For kinds that cannot answer, `edited` renders as plain
text with no link. **Never a dead affordance.**

**The unattributed state is deliberately ugly.** It is the only place in the product where an object
admits it does not know something about itself. That ugliness is a feature: it makes migration debt
visible, and it converts to one number on the Pulse/Record surface (`unattributed artifacts: 412`)
that a build lane can drive to zero. Guessing instead would make every byline in the product
untrustworthy, which costs far more than the ugliness.

### 6.2 The component

```
src/components/crew/Byline.tsx
  agentSlug: string | null
  humanEditedAt: string | null
  runId: string | null            // the receipt door
  size: 'row' | 'header'          // 16px | 22px
  verb?: string                   // past simple, exclusive per agent, from crew.ts
```

`row` renders `[mark] Writer`. `header` renders `[mark] Writer drafted this · 14:32 · see the run`.

**The verb is the agent's fingerprint.** Because the verb is exclusive by constraint,
`Reviewer checked the diff` identifies the actor from the sentence alone - in an email, an export, a
screen reader, or a paste into Slack.

### 6.3 Where the Byline mounts, exhaustively

If a surface renders one of these and does not mount `<Byline/>`, the build fails.

Spec (header + Plan-face row) · Bet (Decide row + focus panel) · Pattern (Discover cluster card) ·
Signal (row leading edge - **often "You" or a source, which is the point**) · **Decision (header,
showing both)** · Prototype · Run (header = owning agent; each step row = its own step owner) ·
Changeset · Release · Outcome · Learning · Belief · Memory row · Receipt · Thread message ·
Citation chip.

**The Decision row is the most important line in the table.** A decision is the one object that is
always jointly authored:

```
Critic recommended · you decided
```

Both halves are already stored (`decisions.decided_by_agent_slug` plus the deciding user). It is the
clearest statement of the contract anywhere in the product and it requires no new copy.

### 6.4 The schema (build item B1, rides IA P4)

```sql
-- Attribution becomes a property of the thing, not only of the edge that made it.
-- null authored_by_agent = a human made it. Never defaulted, never backfilled to a guess.
alter table public.prds
  add column if not exists authored_by_agent text,
  add column if not exists authored_by_run   uuid references public.agent_runs(id),
  add column if not exists human_edited_at   timestamptz;
-- identical three columns on: opportunities, themes, signals, studio_changesets,
--   deployments, prototypes
-- decisions and learnings already carry decided_by_agent_slug / recorded_by_agent_slug;
--   they gain authored_by_run and human_edited_at only.
```

Three rules that keep it true:

1. **No default.** A `default 'human'` would silently mislabel every agent write that forgets to set
   it. Null means unknown and renders as `unattributed`. Fail loud, not wrong.
2. **One write helper.** `setAuthorship({kind, id, agentSlug, runId})`, called from the tool
   registry's write path and from `recordLineage`'s callers, so the row and the edge cannot disagree.
3. **`human_edited_at` is set by the save path, not by the agent.** One line in each save function,
   and it is what makes the mixed state honest.

Backfill only where an `artifact_lineage` edge carries a non-null `created_by_agent`. Everything else
stays `unattributed`. **Do not guess.**

### 6.5 Attribution must survive leaving the app

A sceptic's second test, after *is this real*, is *does this hold up outside your product*.

- **Copy out** appends one plain-text line: `Drafted by Writer on 12 Jul, edited by Rohit Gajaraj on
  13 Jul. Receipt: run 41.` No markup, no branding.
- **Public share pages** (`/d/$slug`, `/p/$slug`, `/t/$slug`) carry the Byline in the header. A
  decision shared with a stakeholder shows that Critic argued against it and you shipped it anyway.
  That is the most credible thing this product can put in front of an executive.
- **Generated text never claims authorship in first person.** §11.

---

## 7. THE SCEPTIC: DID versus SAID

> *"Did the agent actually do that, or did it just write about doing it?"*

Almost every agentic product fails this because it renders both answers in the same typeface. Once a
user catches one instance of narration masquerading as evidence, they stop believing all of it,
permanently.

### 7.1 The law

> **Two registers, never mixed. What the crew DID renders as a receipt. What the crew SAID renders as
> a quotation. No line is ever both.**

| | DID | SAID |
| --- | --- | --- |
| Source | `tool_calls` (`ok`, `latency_ms`, `result`, `error`) plus the row it wrote | the model's `thought` steps, `ai_events.output_preview` |
| Typeface | mono for the id and the count, sans for the label | sans, quoted, indented |
| Anatomy | `Scout read 41 pages · 12 signals · 14:31 · tc_8813` | `Scout: "Two of these look like the same complaint."` |
| Has a door | always, to the step and then to the external artifact | to the run step only |
| In a receipt export | yes | no |

```
Engineer ran the tests · 42 passed, 0 failed · trc_9#6 · 3.4s
Engineer said the export path is now covered.
```

Two lines, two registers, and the difference is visible before it is read. **The corollary is a rule
for us: never phrase a claim as an act.** "Analysed your codebase" when the only tool call was
`repo.tree` is the exact lie this mechanism exists to prevent, and it is the lie every agentic demo
tells. If the model said it opened a pull request and no `studio.pr.open` row exists, the UI says so.
That is an ugly sentence and it should be; the alternative is the product lying on the model's
behalf.

**Thoughts are collapsed by default, marked `⋯ thought`, and never carry a checkmark.** This is the
inversion: every competitor leads with the thought and hides the tool call. A thought is a claim; a
tool call is a fact; facts lead.

### 7.2 The Receipt Ladder - four rungs, one click each

| Rung | What | Backed by |
| --- | --- | --- |
| 1 | **Who.** The Byline. | `authored_by_agent` |
| 2 | **What, when, and an id.** The receipt line. | `tool_calls`: `tool_name`, `ok`, `latency_ms`, `created_at` |
| 3 | **The step.** Args in, result out, error if any. | the trace child, `?step=n`; `agent_run_checkpoints.step_index` |
| 4 | **Someone else's server.** The pull request on GitHub. The deployment URL. The source page. | `studio_changesets.pr_url`, `deployments.deploy_url`, `signals.url` |

**Rung 4 is what closes the argument.** The chain ends on a system we do not control. A PM who clicks
from a Supaprod receipt through to a real pull request in their own GitHub org is finished doubting.
Every column is live today; this rung costs a link, not a feature. Rungs 1→2 and 2→3 are **peels**
(backward always peels, per the IA's link grammar), so nothing loses your place.

### 7.3 The Evidence Underline

The strongest single idea across the three proposals, and it is a pure render-time join.

> **Any noun phrase in a machine-authored sentence that resolves to a row *this run actually wrote*
> gets a 1px dotted underline. Hover or focus peels the row inline. Nouns that do not resolve get
> nothing.**

```
Engineer changed 6 files across 2 commits and opened PR #204.
                 ‾‾‾‾‾‾‾          ‾‾‾‾‾‾‾‾‾              ‾‾‾‾

Engineer reviewed the accessibility implications and found no issues.
```

Why this beats every alternative: it does not ask the model to be honest and adds no fact-checking
pass; an unbacked claim renders *automatically weaker* than a backed one; **the absence of the
underline is the tell**, legible without reading a word; and it scales to every surface for free - one component, one join.

**It cannot be gamed**, because the resolver joins against rows keyed to this run, not by
string-matching ids across the workspace.

**It is hard-gated on G1** (`tool_calls.run_id`). Without the join it silently resolves nothing and
every honest claim renders as unbacked - worse than not shipping it. It does not ship in the same
release as anything else.

---

## 8. EARNED AUTONOMY - THE STRONGEST PROOF, AND IT IS ALREADY BUILT

### 8.1 Tell the true story, not the flattering one

The flattering version is *"agents start watched and earn their way up."* It is **false here**:
`loadAgentArc` defaults to `trusted` (founder ruling 2026-07-08, SW-7). The true version is better:

> **Your agents are trusted from day one. The *tools* are gated. What gets earned, one tool at a
> time, is the removal of a gate - and the machine asks for it, in public, with its record attached.**

Two independent axes, and conflating them is the easiest mistake here:

| Axis | Stored | Set by | Scope |
| --- | --- | --- | --- |
| **The rung** | `agent_autonomy.arc` | `setAgentArc`, a human click; a background nudge that only ever moves observing → proving → trusted, never to ambient | per agent |
| **The graduated mode** | `agent_tool_modes` (`source: 'graduation' \| 'operator'`) | **only** `decideTrustGraduation` on human acceptance | per (agent, tool) |

Composed at run start by `resolveToolMode`, in strict order: seeded mode → arc dial →
`HIGH_RISK_FORCE_REVIEW` → `HIGH_RISK_MIN_CONFIRM` → low-risk auto-clear → contract consent.
`review` is sticky. The dial only ever loosens `auto`/`confirm`.

The four rungs, in the user's words, with the mechanics beside them, on the agent page and nowhere
else:

| Arc | The words | Mechanically |
| --- | --- | --- |
| `observing` | **Shows you everything** | every action queues a review, even reads |
| `proving` | **Asks before it acts** | `auto` tools demote to `confirm` |
| `trusted` | **Acts, and asks before anything it cannot undo** | `confirm` runs inline; `review` holds |
| `ambient` | **Runs without asking** | `auto`, with the floors still absolute |

The floors are named on the same screen, always.

### 8.2 The graduation card - the moment the product earns its category

`maybeProposeTrustGraduations` fires after a clean run: five consecutive `executed` approvals for one
(agent, tool), no `missed` outcome inside 30 days, ceilings respected. It writes a
`trust_graduation_proposals` row. It is already gate family `trust_graduation` with
`filterBucket: "gates"`, so it arrives in the ember tray with everything else. Only the card changes.
Today's entire ceremony for accepting it is a toast reading `"Approved."`

```
──────────────────────────────────────────────────────────────────
 [mark]  Reviewer wants to stop asking.

 Checking the diff       12 times in a row, you approved with no changes
 Last 30 days            no outcome came back missed
 If you say yes          Reviewer checks diffs without stopping.
                         Nothing else changes.
 If you say no           nothing changes, and it will not ask again
                         for 30 days.

 [ Let it ]   [ Not yet ]                              see all 12 →
──────────────────────────────────────────────────────────────────
```

Four things make it work, and each is backed:

1. **The evidence is countable and clickable.** `see all 12` opens twelve `agent_approvals` rows with
   their tool and `decided_at`. A sceptic audits the claim in one click.
2. **The downside guard is stated as a fact, not a reassurance.** *"no outcome came back missed"* is
   `TRUST_RAMP_OUTCOME_WINDOW_MS` doing real work. Say what the machine actually checked.
3. **"Nothing else changes" is true and provable.** Graduation is per (agent, tool); it does not move
   the arc and cannot touch a `HIGH_RISK_FORCE_REVIEW` tool. Users need this sentence because their
   fear is that saying yes once opens everything.
4. **"Not yet" is a real state.** - **and it is not, today.** See G2.

**G2, a hard gate: the cooldown.** `decideTrustGraduation(accept:false)` writes `status:'rejected'`
and nothing prevents a re-proposal on the next clean streak. So *"it will not ask again for 30 days"*
is copy ahead of wiring, which this repo bans. Add `TRUST_RAMP_COOLDOWN_MS = 30d` and one predicate
in `shouldProposeGraduation`. **The card copy and the predicate ship in the same commit, or the card
says nothing about asking again.** The reason to build it rather than reword: an agent that respects
"not yet" is a colleague; an agent that asks again next Tuesday is a nag, and that distinction is the
entire emotional difference between this mechanic working and being switched off.

### 8.3 Earned versus granted, and the claw-back

`agent_tool_modes.source` is either `'graduation'` or `'operator'`, so the record can say truthfully:

```
Reviewer
  checks the diff             without asking      earned 12 Jul, after 12 clean runs
  reads the repo              without asking      you granted 3 Jul
  opens the pull request      asks you first      always. This one never graduates.
```

Three rows, three provenances, all real. The third is the safety floor rendered as a promise, and it
is what makes the first two feel safe to have.

**G4, and it is a safety gap, not polish: a user can grant and cannot ungrant.** No function deletes
an `agent_tool_modes` row. Required:

```ts
revokeTrustGraduation({ agentSlug, toolName })
  // deletes the agent_tool_modes row
  // writes a capability_changes receipt so the reversal is on the record
  // does NOT delete the approved proposal: the history stays
```

**Where the claw-back lives is the design decision that matters: not in settings. On any receipt of
unattended work, as a quiet `ask me next time`.** You see a thing the crew did alone, you did not
like it, you take it back right there. That is where the feeling occurs, so that is where the control
belongs. In a settings page it is only ever used by people who are already angry, and by then they
have decided.

Its ceremony is deliberately gentle: *"Reviewer will ask you again before checking a diff. Its 12
clean runs stay on its record."* **Revoking must not read as punishment.** A trust system where
withdrawal is expensive is a trust system nobody enters.

### 8.4 The empty gate tray is the payoff, not a blank

```
Nothing needs you.

Your crew ran 6 things on its own since Tuesday.
  Reviewer    checked 4 diffs                       all clean
  Scout       pulled 112 signals from 4 sources
  Engineer    opened 1 pull request                 you merged it

                                        see all 6 · ask me next time
```

Every row from `getRecentExecutedUnattended`, rendered by `ExecutedCard.tsx` - 547 lines, **zero
importers, the largest orphan in the repo by line count and the best available trust artifact.**
`ask me next time` is the claw-back, placed at the exact moment doubt occurs.

### 8.5 The negative receipt

`gate-signals` records every time a human corrected the crew at a gate. The write half fires from
`discovery.functions` and `agent_loop.functions`; it does **not** fire from `decideApprovalItem` /
`sendBackApprovalItem` (two call sites, build item B5), and `getGateSignals` has zero consumers.

Render the aggregate **next to the trust score**, not in an analytics view:

```
Writer            trust 78
  You approved 14 of 17.  You sent 3 back.
  What you changed most: the success metric, 3 times.
```

No vendor volunteers "here is how often our thing was wrong". That is exactly why it converts.

---

## 9. THE SIGNATURE MOMENT: THE COMMIT

> **Approving something must visibly set the crew in motion. Today it is a toast that says
> "Approved."** (`_authenticated.approvals.tsx:34`, verified.)

The design is not the click. It is the 1.2 seconds after it.

**Beat 1 · 0-180ms · the card does not vanish; it becomes a receipt.** It collapses in place and
rewrites itself:

```
You approved · Engineer opens the pull request · 14:32 · run 41
```

**This is the most important single detail in this document.** An approval that erases itself teaches
the user that their judgment left no trace. Judgment is the product. It must leave a mark at the
moment it is made, and that mark has the same anatomy as every other receipt in the product, so the
user learns one shape.

**Beat 2 · 180-450ms · the handoff draws.** The receipt grows a short arrow to the mark of whoever
picks the work up: `You approved → [mark] Engineer`. Real data from one of three sources depending on
the gate family: the paused run that resumes (`PAUSE_ON_APPROVAL_TOOLS` + `resumeAgentLoop`), the
queued handoff (`agent_messages.to_agent_slug`), or the next `mission_steps` row whose `depends_on`
is now satisfied. **If nothing picks it up, no arrow, and the line says what changed instead** - *"Now
a standing rule. It will stop your crew next time."* **Never an arrow to nowhere.**

**Beat 3 · 450-800ms · the Crew Bar takes it.** The live locus becomes the new verb and the receiving
mark lights. The eye follows the arrow down. This costs zero new surface because the Bar is already
there.

**Beat 4 · 800-1200ms · the Spine acknowledges.** The stage node moves from ember to working and the
ember rail count decrements optimistically.

Four regions, one causal chain the eye can follow from the card to the receipt to the arrow to the
bar to the Spine. Remove any beat and information is lost, which is the craft-law test for whether
motion earns its place. **A toast confirms that your click registered; the Commit renders what your
click caused,** and that difference is the product thesis expressed as an interaction.

**The failure path is rehearsed, because a fake success is worse than a failure.** If the write
succeeds but the resume fails, or the run was already terminal, beat 1 still writes the receipt and
the receipt goes honest immediately:

```
You approved · the run had already stopped · nothing ran · why
```

No arrow, no beat 3, no beat 4. **Never a success animation over a failed write.** This is §7 applied
to our own ceremony, and it is the one thing that makes the successful animation trustworthy.

**Send back is the counter-ceremony, and the proof that judgment steers.** `sendBackApprovalItem`
requires a note (`z.string().min(1)`), and is only offered on `REVISABLE_KINDS` (`spec`,
`design_gate`); elsewhere the button is **absent**, not disabled with a shrug.

```
You sent it back · "the success metric is wrong, it should be activation not signups"
                 → [mark] Writer is rewriting with your note
```

And the Crew Bar quotes the note while the rework runs. **Seeing your own words drive the machine is
the single most convincing demonstration of the contract in the product,** and it is nearly free: the
note is already persisted to `approval_feedback` and already fed to the agent.

**The consequence line under each verb is static, from `tool-consequences.ts` - not model output - so
it can be stated flatly**, and `REVERSIBILITY_LABEL` is used verbatim. Never paraphrase a safety
property.

```
Approve      Opens a draft pull request on the repo. Nothing merges.
Send back    Writer rewrites with your note. The draft is kept.
Decline      Killed, and the reason goes to the Brain as a decision not to do it.
```

**Cost control (C's R4):** the beats are staggered, not blocking. The tray is interactive again at
180ms; beats 2-4 play behind an already-usable screen; a repeat approval within 10 seconds skips
straight to the settled state.

---

## 10. THE FIRST TEN SECONDS

### 10.1 The sign-in screen states the contract

Verified: `login.tsx:106` reads `title="Welcome back"`; `signup.tsx:184` reads
`title="Create your workspace"`. **The first surface a user ever sees is silent about the entire
thesis.**

```
Sign in    Your crew kept working. Sign in to see what needs you.
           You make the calls. Your crew does the work between them.

Sign up    Thirteen named agents run your product loop, from a customer complaint
           to a pull request. Every one of them stops at your call.
           Every one of them leaves a receipt.
```

No bare "AI", no bare "agents", no "copilot", no "platform". Two concrete nouns a PM recognises - *a customer complaint*, *a pull request* - which name the span of the loop without listing seven
stages. *"Leaves a receipt"* is the sceptic's hook and it is redeemable in the first minute.

### 10.2 First light: the crew starts before the user types

**Sign-up completes, the room paints, and one real Researcher run starts immediately, unasked.**

Not a demo. Not a canned animation. A real `researcher` run against the product name or URL given at
sign-up, or against nothing at all (IA J1 already establishes that with no sources the Researcher
fetches market signal first). It costs credits, it writes real `signals` rows, and it takes roughly
twenty seconds, which is exactly the window in which a new user is reading the screen anyway.

**Correction to C: it is Researcher, not Scout.** Scout watches connected sources and a brand-new
workspace has none. Researcher digs into one question across the web, which is the only honest job at
first light.

| Region | First light |
| --- | --- |
| Spine | seven stages; **01 Discover is already working**, its node carrying Researcher's shimmering mark |
| **Crew Bar** | thirteen marks, one lit: `● Researcher · reading the web for what people say about Relay · 18s` |
| Thread | the aiming card, below |
| Canvas | the seven journey cards, per the IA, unchanged |
| Depth rail | counts at zero with their one-line invitations, unchanged |

The Thread's first card is not an abstract question. It is an aiming question for work already in
flight:

```
Researcher is already working.

It is reading the web for what people say about Relay.
About twenty seconds.

Tell it what you are building and it will aim better.
[ ................................................ ]
```

`MissionOnboarding.tsx` (6.4KB, stranded at `/start`, which nothing links to) is the component; it
already asks one question and calls `saveBrief` then `finish()`. It mounts here with this copy.

**The difference between asserting and demonstrating is one server call at first light.**

### 10.3 Seconds 20-60: the receipt that ends the argument

```
[mark] Researcher read 41 pages and found 12 signals. Two of them say the same thing.

  "checkout keeps logging me out"      reddit.com/r/...      3 days ago
  "session expires mid-purchase"       g2.com/...            1 week ago

                                                 see all 12 · what next?
```

Every URL is real and leaves the app (rung 4). And *"two of them say the same thing"* is the first
evidence of **judgment** rather than retrieval, which is the whole difference between this and a
search box. **A sceptic who clicks one real external URL in the first minute is converted.** That is
the entire onboarding strategy: no tour, no checklist, no modal.

### 10.4 What first light must never do

- **No roster grid.** Thirteen faces on frame one is a cast list for a play nobody has watched.
  Banned by `language` §3.4 rule 1.
- **No tour, no coach marks, no "here is your AI team" modal.** The crew is introduced by receipt.
  A product that has to explain its own workforce does not have one.
- **No progress checklist.** "3 of 7 steps to get started" is the dashboard failure in costume.
- **No fake activity, ever.** If the first run fails (no network, no credits, a bad key), the Crew Bar
  says so plainly and offers the fix: *"Researcher could not reach the web. Connect a source and it
  will try again."* A simulated agent on the first screen would poison every claim in §7,
  permanently, for one user's first twenty seconds.

**Bound the cost (C's R3):** one run, Researcher only, hard credit ceiling, no repeats, and the
failure copy is rehearsed as carefully as the success copy.

---

## 11. THE WORDS

`language/FINAL-language.md` owns the lexicon and this document does not relitigate it. Adopted
unchanged: the thirteen names, the exclusive verbs, no article, present continuous for live work,
past simple for a receipt, `your crew` in sentences and `Crew` as a label, and the judgment verbs
(**Approve · Send back · Decline**, with Snooze secondary). What follows is only the contract
vocabulary.

| Concept | The words | Never |
| --- | --- | --- |
| An agent working with no gate | **without asking** | autonomously, unsupervised, hands-free, on autopilot |
| An agent that has to stop | **asks you first** | requires approval, is gated, needs permission |
| Work done while you were away | **on its own** | automatically, in the background |
| A permission the agent won | **earned**, with the date and the streak | unlocked, upgraded, levelled up |
| A permission you gave | **you granted**, with the date | enabled, allowed, configured |
| Taking it back | **ask me next time** | revoke, disable, restrict, demote |
| A thing that never graduates | **always asks. This one never graduates.** | hard-locked, protected, admin-only |
| A run that failed | **gave up**, with the reason | encountered an error, something went wrong |
| A run stopped by policy | **stopped by your rule**, naming the rule | blocked by guardrail, policy violation |
| Model text | **said** | thinks, believes, feels |
| Tool output | **did**, with the count | performed, executed, completed successfully |
| A run that was resumed | **resumed from step 4** | (never hidden) |
| A step that never ran | **never got its turn** | failed, skipped silently |

**Banned outright, all greppable, all failing `no-slop.test.ts`:**

- **First person, at all.** No `I`, no `we` from an agent, **including the Chief of Staff**. Third
  person with a name, always. Two reasons and both matter: it keeps the frame honest (a system did
  work and left a record; it is not a character talking to you), and it makes attribution survive
  being copied out of the product, because the actor is in the sentence rather than in the chrome.
  The one exception: `your crew` may take a verb in shell copy genuinely about all of them.
- **Anthropomorphic feeling.** `Critic thinks`, `happy to help`, `great question`. Agents state what
  they did and what they need. They never state how they feel.
- **Effort as achievement.** `worked hard on`, `spent 4 minutes analysing`, `carefully reviewed`.
  Elapsed time is a fact in a receipt, never an argument for quality.
- **The word "just".** It apologises for the product's central act.
- **"Autonomous" as an adjective**, except as the name of the top rung.
- **Vendor comfort language.** `you are always in control`, `human in the loop`, `AI-assisted`,
  `with full transparency`. Replace each with the specific mechanism: not "you are always in control"
  but "opening the pull request always asks you first".
- `AI is thinking`, `Generating...`, `Processing your request`, `Our AI`, `Powered by AI`, `Success!`,
  `Something went wrong`, a spinner with no name attached, any percentage not counting real things,
  any ETA the engine does not have, a raw tool id in user-facing text (`ACTION_LABEL` and
  `ToolDef.preview` exist for this), a DB slug in user-facing text (`agentDisplayName` exists).

**Three model sentences, for calibration:**

```
GOOD   Reviewer checked the diff against the spec. 2 issues, both fixed. 41s.
BAD    Our AI has carefully reviewed your code changes and is happy to report
       everything looks great!

GOOD   Engineer could not read the repo: the GitHub token expired. Reconnect.
BAD    Something went wrong. Please try again later.

GOOD   Reviewer wants to stop asking. 12 times in a row you approved with no changes.
BAD    Unlock autonomous mode for enhanced productivity.
```

---

## 12. THE HONESTY REGISTER

Every place the three proposals risk claiming capability the wiring lacks, with the honest state that
ships instead. **Four are hard gates: the feature does not ship at all until the wiring does.**

| # | The overclaim | The honest state that ships | Status |
| --- | --- | --- | --- |
| **G1** | The Evidence Underline and Receipt Ladder rung 2, joined through `agent_run_checkpoints.state->>'traceId'` | **Do not ship.** Without `tool_calls.run_id` the resolver silently returns nothing and every honest claim renders unbacked, which is worse than the feature's absence. | **hard gate** (B1a) |
| **G2** | The graduation card saying *"it will not ask again for 30 days"* | **Do not say it** until `TRUST_RAMP_COOLDOWN_MS` and the predicate ship. Copy and predicate in one commit. | **hard gate** (B4) |
| **G3** | "The runtime rejects an evidence-free handoff" | The seam renders `Evidence: none cited` in `--ink-subtle` with `[why this matters]` - **that is today's normal case**, and the aggregate on the crew pane reads *"Evidence cited on 14 of 61 handoffs this month."* That number going up is what earns `HANDOFF_EVIDENCE_GATE=enforce`. **The interface becomes the instrument that lets us arm the flag.** | **honest state now, gate later** (B4-evidence) |
| **G4** | A trust mechanic presented as reversible | `revokeTrustGraduation` ships **with** the first graduation card, or the card does not ship. Granting without ungranting is a safety gap. | **hard gate** (B3) |
| G5 | B's raw-model-IO tab over `agent_run_messages` | **Cut.** The table does not exist. The deepest honest rendering is the `tool_calls` ledger plus `agent_run_checkpoints`. | cut |
| G6 | "`agent.spawn` fans out parallel sub-agents" in any copy or demo | Brood rows render nothing while `AGENT_FANOUT` is unset. Parallelism is demonstrated from `mission_steps` waves, which are live. **Never demo fan-out.** | render-nothing |
| G7 | `Stop everything` on a run with no stop path | The control is **absent** for non-mission runs until `haltRun` ships. Never a dead control. | absent (B12) |
| G8 | "Your agents earn your trust" / "start on a short leash" | *"They already work on their own. What they earn is the right to stop asking about specific things."* The arc defaults to `trusted`. | copy rule |
| G9 | Any finish time presented as exact | `agent_runs` has no `completed_at`; completion is inferred from `last_checkpoint_at`. Either add the column or label every finish time as approximate. **Silence is not an option.** | B5 |
| G10 | A trust score on a fresh agent | *"Too new to have a record - 1 judgment so far."* No number under three samples. | copy rule |
| G11 | Publisher implying distribution | Its charter says *"You post it."* The Ship face offers Copy, never Post. | copy rule |
| G12 | An empty `unattributed` byline backfilled to a guess | Renders `unattributed`, deliberately ugly, and becomes a countdown to zero on the Record surface. | copy rule |
| G13 | Any rate without its denominator, anywhere in the product | `approved 27 of 30`, never `90%`. Lint, not convention. | test |

---

## 13. WHAT TO BUILD, IN ORDER

Folded into `FINAL-ia.md`'s phases. No new phases.

**Backend, and the four that are gates are marked.**

| # | Work | Why it is not optional |
| --- | --- | --- |
| **B1** | `authored_by_agent`, `authored_by_run`, `human_edited_at` on 7 artifact tables + `setAuthorship` + backfill from lineage edges | §6 is impossible without it. Rides IA P4. |
| **B1a** | `tool_calls.run_id` and `mission_id`, backfilled from `trace_id` | **G1.** Rides IA P4. |
| **B2** | `getFloorState` - one batched server fn: live runs + mission/step context + brood counts + census | The Floor must not be five polling queries. `getSwarmHud` returns *latest run per agent*, not all live runs. |
| **B3** | `revokeTrustGraduation({agentSlug, toolName})` + `capability_changes` receipt | **G4.** A safety gap today. |
| **B4** | `TRUST_RAMP_COOLDOWN_MS = 30d` + predicate in `shouldProposeGraduation` | **G2.** |
| **B5** | Wire `recordGateSignalCore` into `decideApprovalItem` and `sendBackApprovalItem`; render `getGateSignals` | Two call sites; the read half is dead. IA P4 already requires it. |
| **B6** | `agent_runs.parent_run_id` | Brood rows are otherwise a fragile negative join. Before `AGENT_FANOUT=1`. |
| **B7** | `mapRelayStatus`: `halted` and `skipped` get their own states | Red for a careful stop teaches the wrong thing; skipped falling to idle erases the cascade. |
| **B8** | `describeAutonomy(agentSlug)` - one shared formatter over `resolveToolMode` | The Floor's autonomy sentence and the Permissions tab must be generated from one place or they drift, and the moment they drift neither is believable. |
| **B9** | Per-step durations from consecutive `agent_run_checkpoints.created_at` deltas | Derivable today, not returned. |
| **B10** | `setAgentEnabled` → `agents.enabled` + `capability_changes` enum value | The runtime already honours it in two places. Cheapest large trust win. |
| **B11** | `agent_runs.completed_at`, or label every finish time approximate | **G9.** |
| **B12** | `haltRun` for a non-mission run, **or** do not render stop for that case | **G7.** Either is acceptable; a dead control is not. |

**Front end, by IA phase.**

| Phase | What lands |
| --- | --- |
| **P1** one shell | The Crew Bar becomes a real permanent region: thirteen marks, live locus, census, the honest-idle line with the watch statement, silence age. `CookingBanner`, `AmbientChip`, `MachineNow`, `FocusDock` die as the IA already rules. |
| **P1.5** identity | `crew.ts` rename; the thirteen names, charters in second person, `handoffLine`; `CrewMark`/`CrewChip`/`CrewRow` replacing `AgentMark`/`AgentBadge`/`AgentChip`; hue confined to 24px+; build fails on an unmapped glyph. |
| **P2** depth visible | Rail tile 5 → **Your crew**, count = graduations + standing changes. **The Floor ships here** with B2 and B7 - a count with no place to expand into is the failure P2 exists to fix. |
| **P3** one landing | **First light auto-run** (B9-first-light), the aiming Thread card, the sign-in contract copy. |
| **P4** the graph | **B1 and B1a ride this phase.** Byline on all sixteen surfaces; `byline.test.ts`; `authorship.test.ts`; the three-state stamps; the `unattributed` counter. B5. |
| **P5** the faces | Spine node marks (live occupancy); Spine run-mode census label; `AgentRelay`'s `station` variant retargets onto the stage faces. |
| **P6** workbench children | **The Ledger** as the mission child's Thread column: pinned plan block, step groups from `tool_calls`, `ToolDef.preview` as the universal step sentence, thoughts collapsed, poison trail, recovery gaps, retry counts (`attempts`/`max_attempts`), `needs your call` drawn on future steps. B9, B11. **The agent child `/crew/$agentSlug`** with its four tabs. Delete `?config=agents`'s `staff` and `autonomy`; rename the group `?config=models`. |
| **P8** doors and journeys | **The Commit**, all four beats plus the failure path. The graduation card with B3 and B4. The claw-back on the unattended receipt. `ExecutedCard` mounted in the empty tray. **The Evidence Underline** (G1 satisfied). `CostPerOutcomeChip` on the Record tab and the mission child. B8. |
| **P9** delete and proof | `AgentRosterPanel` moves from `components/governance/` to `components/crew/` - **the folder name was the founder's complaint in miniature.** `_authenticated.agents.tsx` and `.swarm.tsx` collapse into the legacy resolver. Enforcement battery on. |

---

## 14. ENFORCEMENT

A document that rots is a document; a test is a contract. Same idiom as `FINAL-ia.md` §9.

| Test | Fails when |
| --- | --- |
| `crew.test.ts` | an active catalog entry lacks a distinct glyph, a distinct name, a distinct exclusive verb, a second-person charter, or a `handoffLine` · a name equals a stage name, a button verb, an object status or an autonomy mode |
| `crew-identity.test.ts` | any agent-identity component renders a per-agent hue below 24px · a `CrewMark` uses a colour outside the six state tokens · a fourth identity component exists |
| `presence.test.ts` | the room renders with a live run and no agent name is on screen, at any breakpoint · the Crew Bar renders fewer than thirteen marks on desktop · the Bar's zero state renders without a last-event or next-wake line |
| `byline.test.ts` | an entity renderer in the §6.3 list does not mount `<Byline/>` · a `<Byline/>` is rendered inside a hover, popover, tooltip or `details` |
| `authorship.test.ts` | an artifact insert in `tools/registry.server.ts` bypasses `setAuthorship` |
| `evidence-underline.test.ts` | a machine-authored string renders without passing through the `<Evidenced>` resolver |
| `honesty.test.ts` | a rendered rate string has no denominator · a trust score renders with `breakdown.samples < 3` · a graduation card renders cooldown copy while `TRUST_RAMP_COOLDOWN_MS` is absent |
| `honest-status.test.ts` | `completed_with_failures` renders as "Completed" · `skipped` renders as "Failed" · `halted` renders in the fail ramp · a retry renders without its attempt count |
| `no-spinner.test.ts` | any component outside the composer imports a generic spinner or renders an indeterminate progress element |
| `one-pulse.test.ts` | more than one `.ink-working` element is mounted at once |
| `floor-stability.test.ts` | the Floor's row order changes on a refetch that neither added nor removed a run |
| `seam-parity.test.ts` | the human seam card and `renderHandoffBlock` disagree on artifacts, constraints, open questions or evidence for one payload |
| `dead-control.test.ts` | a stop, revoke, bench or send-back control renders where its server function does not exist |
| `no-slop.test.ts` | any banned string from §11 appears in a user-facing surface · a raw tool id or DB slug leaks into rendered copy · first person appears in agent-authored copy |

---

## 15. AGENT-FRIENDLY: ONE SUBSTRATE, TWO RENDERERS

The founder asked for this explicitly and it has a precise answer.

> **Law: the human's screen and the receiving agent's prompt are two renderers over one substrate.
> They may never disagree.**

`renderHandoffBlock(inbound)` produces the receiver's version of the seam: task, structured context,
artifacts, constraints, open questions, memory refs, evidence. The seam card renders the same payload
for a human. If a human reads "3 pieces of evidence" and the receiver's prompt lists two, that is a
bug of the same severity as a wrong number in a receipt (`seam-parity.test.ts`).

Three consequences:

1. **One id space.** Every entity on the Floor and in the Ledger carries a stable mono id that is
   also the id an agent reads with its own tools: `MSN-182`, `cs_9f2`, `trc_9`, `SPEC-52`, `SIG-204`.
   Not two id systems, one for display and one for machines.
2. **One formatter.** The seam card and `renderHandoffBlock` are generated from one shared function.
3. **The machine door is a visible row, not a secret.** The A2A card and the `a2a.message.send` /
   `a2a.message.stream` routes already ship. One row in the crew pane, one copy button. That is the
   agent-native claim made concrete at the cost of a row.

**The delegation gesture that nobody else has: `Hand to...`** on any object's Byline kebab. The natural
motion is not "type a task", it is **this thing, that person**. A PM does not open a chat box to ask
a colleague to review a spec; they send the spec. This is `agent.handoff` given a human front door,
and it is also **the first path in the product that will actually populate `evidence_ids`** - a
human-initiated handoff is anchored on a concrete artifact by construction. Say so in the build
ticket so nobody weakens the gate to make the gesture work.

**A routing preview above the composer** shows the marks of the agents that will run, in order, as
you type - the cheapest way to make the crew visible during the most common interaction in the
product. **And it is labelled as a guess until it is not:**

```
before dispatch    likely   [mark] Writer → [mark] Planner
after mission.plan running  [mark] Writer → [mark] Planner → [mark] Engineer → you
```

The word `likely` is deleted the moment `mission_steps` rows exist. **Never present a guess in the
same typography as a plan.** That is §7's law applied to our own UI, and if we break it here we have
no standing to enforce it anywhere.

---

## 16. THE RISKS I AM TAKING

| # | Risk | Mitigation |
| --- | --- | --- |
| R1 | **The Byline is on sixteen surfaces and everything gets noisier.** A lot of restraint budget spent in one place. | It buys the founder's central complaint, so it is the right place to spend it. The mark is the only non-grey element; the name is grey at 12.5px; the verb appears only at header size. If it still reads busy, drop the name in row context and keep the mark - the glyph is the recognisable part. |
| R2 | **The Floor is a poll, not a stream.** There is no run-level SSE; runs are polled at 2-6s. At 4s a 20-second step looks static. | The clock advances client-side; the step counter never does. The surface is never frozen even when the data is stale, and it never invents a fact. |
| R3 | **Five polling consumers** (Bar, Floor, Ledger, rail counts, Spine) against a Workers subrequest budget. | One `getFloorState` (B2), one query key, 4s stale time, shared by all five. Optimistic decrement on a gate decision. |
| R4 | **The Floor competes with the Composer for the bottom** - the exact collision that killed `FocusDock` (`_authenticated.tsx:210-216`). | The Floor **pushes** the Canvas and never overlaps the Composer. The Composer is the lowest region, always, no exception, no breakpoint. |
| R5 | **Showing recovery gaps could read as instability.** *"resumed from step 4"* five times looks broken. | It *is* the honest signal and hiding a seven-minute gap is what makes users think the product lied when they later see the timestamps. Cap at 2, then collapse to `recovered 3 times ⌄` with the aggregate flowing to the Engine pane. |
| R6 | **The first-light auto-run costs credits on a user who may never return, and can fail in front of a brand-new user.** | One run, Researcher only, hard ceiling, no repeats, and the failure copy rehearsed as carefully as the success copy. *"Researcher could not reach the web. Connect a source and it will try again."* is still infinitely better than "Nobody is working yet." |
| R7 | **Overturning the AGENT-EXP hiding ruling invites the Engine-Room doctrine to be over-corrected**, and mechanism words leak back onto the calm front. | The override is narrow and greppable: **labour is chrome, mechanism is not.** `station`, `swarm`, `arc`, `fanout` stay behind the door and stay deleted from copy. |
| R8 | **Thirteen marks in a 32px bar is a lot of pixels for a quiet day.** | They are 18px, monochrome, and at 40% at rest. The frame that sells the product is three lit against ten quiet, and that frame does not exist if the ten are absent. |
| R9 | **Six workbench children instead of five relitigates a settled IA decision in week one.** | It touches no mechanism, no counts, no keys and no URLs; it adds one route under the room's chrome, on the width argument the Map already won. If rejected, the record degrades to the 420px pane and the Instructions tab is the first casualty - which would be the wrong casualty. |

---

## 17. ONE PARAGRAPH FOR THE FOUNDER

You sign in and it says your crew does the work between your calls, which is the whole deal in a
line. Someone is already working on the first screen: Researcher is reading the web about your
product before you have typed anything, and you watch it while you answer the one question, and
twenty seconds later it hands you twelve things real people actually said with links that leave our
product entirely, which is the moment you stop wondering whether any of this is real. Along the
bottom, always, are your thirteen people - three of them lit, ten of them quiet - and one line saying
which one is working, on what file, on which step out of how many, and how long it has been since it
last moved. Press one key and that bar becomes the floor: every agent working right now, one row
each, grouped into the waves of the plan they are executing, one clock, one heartbeat, one ember if
something needs you, and nothing jumps or reorders while you are looking. Every object in the app has
a face on it - who made it, whether you changed it after, one click to the receipt, and on a decision
it says both: Critic recommended, you decided. When you approve something the card does not vanish
into a toast; it turns into a receipt of what you just caused, an arrow draws to whoever picks the
work up, the bar starts carrying their verb, and the stage on the spine moves, and that is the
product in one and a fifth seconds. Anything an agent claims it did that it can prove carries a faint
underline you can pull on, and anything it merely asserted does not, and that difference is visible
before you read a word. And after five clean runs of the same job one of them comes to you and asks,
in plain words, whether it can stop stopping you, showing you the twelve receipts that back the
request and telling you exactly what it would still bring you; if you say not yet it does not ask
again for a month, and if you ever regret saying yes you take it back from the receipt itself, in one
click, and its clean record stays. There is no roster page, no tour, and no screen that explains the
crew, because you meet each of them the way you meet a good colleague: by seeing what they just did
for you, with the receipt attached.
