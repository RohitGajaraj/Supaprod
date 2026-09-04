# Agents, angle B: WORK MADE VISIBLE

> _Created: 2026-07-28 · Last updated: 2026-08-03_

> The moment an agent is DOING something. From the instant work starts to the instant it lands,
> designed for the honest case where that is minutes or hours, not seconds.
>
> Every file, line, enum, constant and default below was read in code this session. Where the brief
> I was given was wrong about the codebase, this document carries the corrected fact and says so.
> Nothing here is designed on top of a capability that does not exist; where a capability is
> dormant, the design renders the dormant state honestly and says what would light it up.

---

## 0. Corrections to the brief, before anything is designed on top of it

Five claims in my brief do not survive contact with the code. Three of them would have produced a
UI that lies, which is the one failure this rebuild cannot afford.

| Claim | Verified reality | Consequence for the design |
| --- | --- | --- |
| "`enqueueHandoff` **requires** `evidence_ids`; the runtime REJECTS an evidence-free handoff" | `handoffEvidenceGateEnforced()` reads `process.env.HANDOFF_EVIDENCE_GATE` and is **OFF by default** (`handoff.server.ts:85-88`). The source comment states plainly: *"no handoff in the live loop carries `evidence_ids` today"*. The gate computes a verdict and proceeds. | The seam must render `Evidence: none cited` as today's normal case, in a neutral register. Designing the celebration first would be exactly the slop the craft law bans. §8 turns the surface into the instrument that earns the flag. |
| "`agent.spawn` fans out parallel sub-agents" (present tense) | Gated OFF by `AGENT_FANOUT=1` (`registry.server.ts:3009-3010`). `FANOUT_MAX_CHILDREN = 8`, `FANOUT_MAX_DEPTH = 1` - exactly one level, a spawned worker can never itself spawn (`fanout.ts:34,42`). | The parallel design (§6) must work from `mission_steps` waves, which are live today, and treat brood rows as the additive case. |
| "50 tools, approval mode `auto` / `confirm` / `off`" | **46** tool defs (`grep -c "def({"` = 46; `TOOL_REGISTRY` composes 46 entries). Modes are `auto` / `confirm` / **`review`** (`ToolMode` in `trust.server.ts:17`). There is no `off`. | `review` is a real third state that means *queue and show me*, not *disabled*. The Floor's autonomy sentence (§10) has to say it correctly. |
| "`mission.plan` builds a 1-6 step DAG" | Up to **8**. `orchestrator.server.ts:204` throws `"mission.plan: too many steps (>8). Re-plan smaller."` | The Floor's row budget is 8 plus brood, not 6. |
| "Agents have a TRUST ARC and can EARN autonomy" (implying they start low) | `loadAgentArc` returns **`"trusted"`** when nothing is set - founder ruling 2026-07-08, SW-7, "autonomous by default" (`trust.server.ts:250-254`). The dial is for **tightening**. The earned thing is the per-(agent, tool) `trust_graduation_proposals` row, not the arc. | §10 corrects the story. Any UI reading "earn my trust" is a lie about this codebase. |

Two more facts that change the shape of the design:

- **There is no run-level SSE.** `src/routes/api/chat.ts` streams a *conversation* (OpenAI-delta frames,
  `{meta}`, `{persisted}`, `[DONE]`). Agent runs are polled: `AgentRelay` at 2-6s, `getSwarmHud` at
  4-6s. Everything in §5-§7 is designed for polling and stays honest between ticks.
- **`tool_calls` has no `run_id` and no `mission_id`.** Columns are `id, user_id, event_id, trace_id,
  agent_id, tool_name, args, result, ok, error, latency_ms, created_at`. The only join from a run to
  its tool calls today runs through `agent_run_checkpoints.state->>'traceId'`
  (`missions.functions.ts:380-388`) - a jsonb-dependent path that breaks silently. This blocks the
  single strongest idea in this document. It is backend item **B1** and it is a hard gate.

---

## 1. Where I stand on `FINAL-ia.md`

I read the ONE ROOM verdict in full. **I do not propose a new destination, and I do not propose
`/agents` come back.** The founder's mandate would justify it and I am declining it on purpose:
filing the crew behind its own URL recreates exactly the disease the founder is complaining about,
one level up. Agents were made invisible by being turned into a *noun you visit*. A second noun,
better placed, is still a noun. **Presence is not a page.** The fix is that you cannot look at the
room while agents are working and fail to see them working.

So: A wins, the room stands, six regions stand, the depth rail stands, the link grammar stands.

Three places where I override it, each because it breaks the moment work is genuinely in motion.

### 1.1 Override one: the WorkingStrip is a region with two heights, not a line

FINAL-ia §1.3 draws it as one line:

```
● Engineer is writing tests · 2 agents working · Stop everything
```

That line is correct and it is not enough. It has exactly one slot for a name and there are up to
8 planned steps plus a brood of up to 8 spawned children. With three runs live, a single line either
picks one and hides two (the founder's complaint, at 28px) or it marquees (worse). Both failures are
the reason the last rebuild lost depth: **hidden is a function of silence**, and a line that can only
ever say one thing while five things happen is silent about four of them.

**The override:** the strip stays exactly as drawn at rest, and it **expands in place, downward into
the canvas, into the Floor** (§6). Not a pane. Not an overlay. A push. Because an overlay says "this
is a detour," and watching the crew work is not a detour from the product, it is the product.

This costs FINAL-ia nothing structurally: same region, same URL grammar (`?floor=open`), the Canvas
gets shorter rather than covered, the Composer stays the lowest region always.

### 1.2 Override two: rail tile 5 is renamed, and it is split in two

FINAL-ia gives tile 5 as **"Who is working"**, key `c`, `?pane=crew`, owning `CrewDrawer`,
`AgentActivityTimeline`, `agent-fleet`, `agent-runs`, `agent-scorecard`, `capabilities`, `swarm`,
`fanout`, `orchestrator`, `ambient`, `product-context`.

Two problems. First, a tile that carries the number `3` tells you *how many*; the founder's complaint
is that you never see *who* and *what*. Second, the tile bundles two different questions that want
different treatments:

| Question | When you ask it | Right shape |
| --- | --- | --- |
| "who is working right now, on what" | constantly, peripherally, while doing something else | **ambient and permanent** - the Strip and the Floor |
| "who is on my team, what have they earned, what are they allowed to do" | occasionally, deliberately | **a pane** |

**The override:** tile 5 is renamed **"Your crew"** (key `c`, `?pane=crew`) and owns only the second
question: the roster, per-agent trust, the scorecard, capability history, graduation history, and
the A2A door. The first question moves out of the pane entirely and becomes the Strip and the Floor.
The tile's count remains agents-working-now, and pressing the count opens the **Floor**, not the pane;
pressing the tile's icon opens the pane. Two targets, one tile, both live, no hidden state.

This is the load-bearing disagreement in this document. If the crew's only home is a 420px pane
behind a letter key, we have moved the agents from the Safety room to the Crew pane and shipped the
same complaint with better copy.

### 1.3 Override three: the Spine's RUN mode is singular, and runs are not

FINAL-ia §1.4 grafts C's per-run Trace as Spine mode 2, labelled `RUN · mission #182`. Correct fix,
incomplete: it silently assumes one run. `advanceMissionCore` dispatches every ready step in a wave,
`MISSION_BATCH` defaults to 50 missions advanced per cron tick, and a workspace can trivially have
three missions live.

**The override:** the mode label carries the census and becomes a stepper.

```
RUN · MSN-182   ‹ 1 of 3 live ›            (click the label to return to PRODUCT)
```

Product mode remains the default and the Floor remains the multi-run answer. The Spine never tries
to draw three runs at once; it draws one and admits there are three. That is honest, costs one
component, and closes R10 in FINAL-ia's own risk table.

### 1.4 What I explicitly agree with and build on

- One shell, one destination, six regions. No new frame anywhere in this document.
- The peel/move/deep link grammar (§5.2). Every drill-down here is a peel; every next-step is a move.
- The zero-count law (§2.2). Applied verbatim to the Strip: emptiness renders a last-event age, never
  a silent glyph.
- The one-count law. There is exactly one approvals number in this design and it lives on the ember
  tile. The Strip says `1 waiting` as a *census word*, never a second badge.
- "A queue is not an agenda" (§3.4). The Floor never hijacks, never steals focus, never auto-opens
  except once, for 3 seconds, when a plan first lands (§11).
- The enforcement-battery philosophy. §15 adds seven tests in the same shape.

---

## 2. The thesis

**An agent's work is invisible because the industry renders the wrong unit.**

Every agentic product streams tokens, because tokens are what a model emits continuously. The
resulting UI is a spinner plus a wall of prose. It fails four ways at once:

1. **A streamed thought is narration, not work.** It is unfalsifiable by construction. "I will now
   check the tests" costs nothing to emit and proves nothing. The sceptic's question - *did it
   actually do that, or did it write about doing it* - is not merely unanswered by streamed
   reasoning; streamed reasoning is the exact form the answer must not take.
2. **It demands continuous attention for a process that takes minutes to hours.** Nobody watches.
3. **It leaves no artifact.** Come back in an hour and there is a scroll buffer, not a record.
4. **It cannot be glanced at.** There is no version of a text wall that answers "three agents, what
   is each on" in one second.

**The unit this product should render is the landed step.**

`executeLoop` already writes a checkpoint per step, before the provider call, keyed
`(run_id, step_index)`, and stamps `agent_runs.last_checkpoint_at`
(`loop.server.ts:827-868, 909`). That is an irregular but completely honest heartbeat: one beat per
model turn, and the gap between beats is real work time. A checkpoint is a fact. A token is a claim.

Three consequences, and they are the spine of everything below:

- **The heartbeat is the animation.** Not a spinner (constant rate regardless of progress - a lie by
  construction), not a progress bar (requires a known end), not streaming text. A pulse on the machine
  ramp, plus a step counter reading `step 6 of up to 24`. That ceiling is real:
  `adaptiveStepBudget({agentSlug, arc, plannedStepCount})` returns `roleBase` (6 specialist / 14
  orchestrator / 24 builder) `+ arcBonus` (0/0/2/4) `+ sizeBonus` (orchestrator only, 2 per planned
  step), capped at `STEP_CEILING = 40` (`budget.ts`). *"of up to"* is the honest preposition, and
  it is a counter, never a bar, because steps are not equal work.
- **Facts lead, claims follow.** `LoopStep` is a three-member union: `thought` | `tool_call` | `final`.
  Tool calls get checkmarks, timestamps, latencies and ids. Thoughts get a collapsed `⋯ thought` row
  and no checkmark. This is the exact inversion of every competitor, and it is the whole argument.
- **The clock is the reassurance.** Six minutes of silence with a live clock and an advancing step
  counter reads as concentration. Six minutes of silence with a spinner reads as a hang.

---

## 3. Three registers, chosen by attention

Not by data volume. Not by page. By how much attention the user is currently spending.

| Register | Attention | Region | Question | Source | Refresh |
| --- | --- | --- | --- | --- | --- |
| **Ambient** | zero, peripheral | the **Strip**, 28px, permanent, every surface | "is anything happening, and should I care" | `getFloorState` (B2) | 6s |
| **Glance** | one second | the **Floor**, the Strip expanded, pushes the Canvas | "three agents, what is each one on" | same query, same key | 4s |
| **Deep** | sustained | the **Ledger**, the mission child's Thread column | "show me the plan, the step, the tools, the files, the terminal" | `getMission` / `getStudioSession` | 2s while running |

**The transitions are expansion in place, never navigation.** Strip → Floor is a push. Floor row →
Ledger is the one move link in the whole system (per FINAL-ia's grammar: forward moves, and this is
the only forward). Nothing is behind a door.

**One URL each**, orthogonal to everything in FINAL-ia §6.1:

```
?floor=open                                     the Floor
?floor=open&run=<runId>                         the Floor with one row expanded
/$ws/$product/mission/$missionId?tab=timeline   the Ledger
                              ?step=<idx>       one step, anchored
```

---

## 4. The vocabulary, drawn from the real enums

Three status vocabularies exist and they do not match each other. `relay.ts:26-50` already maps them
into one calm set. That mapping is correct and this design uses it as the single vocabulary.

| Real status | Table | Relay state | Glyph | Colour | The word |
| --- | --- | --- | --- | --- | --- |
| `queued`, `dispatched` | `agent_runs`, `mission_steps` | running | `◌` | `--ink-faint` | queued |
| `running` | both | running | `●` | `--voice-machine` | working |
| `waiting_approval`, `awaiting_review` | `agent_runs`, `agent_approvals` | gate | `▲` | `--voice-human` | needs you |
| `planned`, `ready` | `mission_steps` | planned | `·` | `--ink-faint` | not started |
| `done`, `completed` | both | done | `✓` | `--verdict-pass` | done |
| `failed`, `error`, `cancelled` | both | failed | `✕` | `--verdict-fail` | hit a problem |
| `halted` | `agent_runs`, `missions` | failed → **corrected to its own state** | `⏸` | `--ink-subtle` | stopped on purpose |
| `skipped` | `mission_steps` | (unmapped today) → **new** | `⊘` | `--ink-faint` | never got its turn |

**Two corrections to `mapRelayStatus` this design requires:**

1. `halted` currently maps to `failed`. It is not a failure - it is a deliberate stop (budget cap,
   governance halt, the 20-minute `ABANDON_MS` starvation guard). Rendering it red teaches users the
   product breaks when it is actually being careful. Give it its own state.
2. `skipped` has no mapping and falls through to `idle`. It is the poison-cascade terminal
   (`cascadeSkipFailedDependents`) and it is a *different* thing from both failed and idle. Give it
   its own state (§9).

Mission-level statuses that must never be laundered: `completed_with_failures` is a real value set
deliberately by `maybeCompleteMission` (`handoff.server.ts:566`) and renders as **"Finished, with 2
steps skipped"**, never "Completed".

---

## 5. Register 1: the Strip

Permanent. 28px. Present on every room surface and every workbench child, at every breakpoint, never
`hidden`. Directly above the Composer, which stays the lowest region always. Exactly one `PulseLine`
(`components/mission/primitives/PulseLine.tsx`, which already bans fake countdowns and percentage
bars in its own header comment).

**At rest, one live run:**

```
● ◈ Engineer  writing the change · checkout autofill        4m 20s · step 6 of 24
                                                     3 working  1 waiting     ⌄
```

Anatomy, left to right: the pulse dot · the `AgentMark` glyph gem · the display name · the verb
phrase · the object · elapsed · the step counter · the census · the chevron.

**Where every token comes from:**

| Token | Source |
| --- | --- |
| pulse dot | `.ink-working`, 2.4s, `--voice-machine`. Only on the live locus. |
| glyph gem | `AgentMark(slug, 16)`. Per-agent hue lives here and nowhere else (founder ruling C, 2026-07-11). |
| display name | `agentDisplayName(slug)` - never the DB slug. |
| verb phrase | `ACTION_LABEL[tool_name]` while a tool is mid-flight, else `agentRelayVerb(slug)`. `stepLabel()` already implements exactly this fallback chain. Never the raw tool id. |
| object | `mission_steps.sub_goal`, truncated. Falls back to `agent_runs.input`. |
| elapsed | `now − agent_runs.created_at`. Client-computed so it advances between polls. |
| step counter | `agent_runs.step_index` / `adaptiveStepBudget(...)`. |
| census | counts over live runs. |

**Rules, each of them a decision:**

1. **The line never scrolls, never marquees, never types.** It crossfades on change, 150ms,
   `--ink-ease`. That is the only motion in the region besides the dot.
2. **The live locus is the run with the most recent `last_checkpoint_at`.** Deterministic, so the
   Strip does not flicker between two agents on every poll. It changes when the data changes, not
   when the poll fires.
3. **A gate never turns the Strip ember.** The gate's one count is the ember rail tile
   (FINAL-ia's one-count law). The Strip says `1 waiting` as a census word in `--ink-body`. Two
   ember counts is the disease.
4. **The clock advances client-side between polls; the step counter never does.** Elapsed is
   computable from a timestamp, so a stale poll still shows a moving surface. A step advance is a
   fact and may only come from data. This is the whole trick for making a 4s poll feel live without
   inventing anything.
5. **At zero, the last event, always:**
   ```
   ◌  Nothing is running.  Last: Engineer opened PR #204, 14 minutes ago.        ⌄
   ```
   Not "All quiet" alone (`relay.ts:174` today). Emptiness plus a last event is presence. Emptiness
   alone is absence, and absence is the founder's entire complaint. This is FINAL-ia's zero-count law
   applied to the region where it matters most.
6. **A workspace that has never run an agent** gets the invitation, once: `Nobody has worked here
   yet. Tell Supaprod what you are building and the crew starts.`

**Keys:** `w` toggles the Floor. Digits belong to the Spine, letters to the rail (FINAL-ia §2.2);
`w` is unclaimed by both and is the verb, not a noun.

---

## 6. Register 2: the Floor - the parallel case

Press the chevron, the census, or `w`. The Strip grows upward. The Canvas shortens by the Floor's
height (250ms push, `--ink-ease`). Nothing is covered. `?floor=open` in the URL, so it survives
reload and is linkable. Escape closes it (innermost-first, per FINAL-ia §6.3).

Max 6 rows visible, then scroll inside the region. **One row per live run**, not per mission.

```
┌────────────────────────────────────────────────────────────────────────── ⌃ ─┐
│  MSN-182 · Checkout autofill                                Chief of Staff   │
│  wave 1 ─────────────────────────────────────────────────────────────────── │
│  ● ◈ Engineer   writing the change · autofill.tsx        4m 20s   6/24    ⌄ │
│  wave 2 ─────────────────────────────────────────────────────────────────── │
│  ● ◈ Review     checking the diff                        1m 02s   2/6     ⌄ │
│  · ◈ Announce   not started · waiting on Review -  - │
│                                                                              │
│  MSN-179 · Q3 positioning teardown                          Chief of Staff   │
│  ▲ ◈ Challenge  needs your sign-off · kill the speed claim  12m     4/6   ⌄ │
│  ✕ ◈ Research   hit a problem · the source returned 403 - 3/6   ⌄ │
│  ⊘ ◈ Draft      never got its turn · Research failed -  - │
├──────────────────────────────────────────────────────────────────────────────┤
│  3 working · 1 waiting on you · 1 failed · 1 skipped   2 runs   Stop everything│
└──────────────────────────────────────────────────────────────────────────────┘
```

### 6.1 The five rules that make five agents read as calm competence

This is the section the founder's mandate turns on, so each rule names the chaos it prevents.

1. **Fixed row height, fixed column grid, no reflow ever.** 32px per row. A row changing state changes
   its glyph and its middle text; it never changes size, never wraps, never grows. *Rows that grow are
   the single biggest source of "chaos" in agentic UIs.* The middle column truncates with an ellipsis
   and the full text lives in the expand.
2. **Deterministic, stable sort, and it does not re-sort while you are looking.** Missions by
   `updated_at` desc; within a mission by `mission_steps.idx`. When a row changes state it **stays
   where it is** and is marked. The re-sort happens on close, or on an explicit `Tidy` action in the
   footer. Watching rows leapfrog each other is what makes parallelism read as noise.
3. **One clock column, one meaning.** Every time is elapsed-since-`created_at`, right-aligned, mono,
   tabular-nums. Never mix "started 4m ago" with "about 3m left". There are no estimates in this
   product because the engine does not have any.
4. **One pulse.** Only the live locus carries `.ink-working`. Every other running row carries a solid
   `--voice-machine` dot with no animation. Five pulsing dots is a Christmas tree. One pulsing dot and
   four solid ones reads as a crew with a foreman, which is what it is: the orchestrator is real and
   named on every mission header.
5. **Ember appears exactly once.** The `▲` needs-you glyph is the only `--voice-human` on the Floor.
   Everything else is the machine ramp, the verdict pair, and the ink ramp. If two things on the
   Floor are shouting, one of them is wrong.

### 6.2 Waves: how parallelism reads as a plan, not as noise

`mission_steps.depends_on integer[]` plus `next_ready_mission_steps` already define waves precisely:
a wave is the set of steps whose dependencies are all `done`. The Floor draws a hairline between
waves and labels the left gutter `wave 1`, `wave 2`.

This is the difference between an orchestra and a room full of noise. Three agents working
simultaneously inside `wave 1` reads as *the plan executing in parallel*, which is impressive.
Three agents working with no visible structure reads as *three things happening*, which is alarming.
Same data, one hairline and one gutter label apart.

**The plan is visible before the work starts.** When `mission.plan` lands, the Floor already has its
rows, all at `·` not started, all in their waves, with their dependency arrows. You watch a drawn
plan fill in. That is why the sceptic can tell the difference between execution and improvisation.

### 6.3 The brood row: `agent.spawn` children

Spawned children are `agent_runs` rows with a `mission_id` and **no `mission_steps` row** - verified
in `handoff.server.ts:534-548`, which exists precisely because that invisibility once let a sibling
close a mission out from under a live child. They cannot be placed in a wave, and a fan-out of 8
would blow the Floor's row budget.

Collapse them into one row under the parent:

```
● ◈ Research     digging into the question                    2m 10s   3/6   ⌄
  └ 8 sub-agents · 5 done, 3 working · split budget                          ⌄
```

Expanding shows the eight as a compact sub-list at 24px, no glyph gems (they are the same specialist),
each with its own sub-goal and clock. Honest, because that is exactly what `enqueueFanout` does: N
bounded workers of one specialist under a split budget, one level deep, capped at 8.

**This is dormant today** (`AGENT_FANOUT` unset). The Floor renders it correctly the day the flag
flips and shows nothing before then. It also needs **B6**: a `parent_run_id` on `agent_runs`, because
discovering brood children today requires the negative join "runs on this mission that no step
references", which is fragile.

### 6.4 The footer

`3 working · 1 waiting on you · 1 failed · 1 skipped   2 runs   Tidy   Stop everything`

**Stop everything** is destructive, so it wears `--voice-human` on hover only and takes a dry confirm
that names the count and the consequence: *"Stop 3 running agents. Work already committed stays; a
half-written changeset is discarded."* Per-run stop lives on the row's overflow, one gesture deeper.
Never a bare `X` on every row - a row of destructive affordances is how people stop work by accident.

---

## 7. Register 3: the Ledger - deep, and the sceptic's home

The mission workbench child (`/$ws/$product/mission/$missionId`), Thread column replaced by the run's
own sequence, per FINAL-ia §2.6. My contribution is what goes into that column.

**It is a ledger, not a transcript.**

```
MSN-182 · Checkout autofill                       Engineer, Review · 6m 40s · $0.42
────────────────────────────────────────────────────────────────────────────────
THE PLAN                                           Chief of Staff · 14:01:12  ⌄
  1  Engineer   write the change                                  done  2m 10s
  2  Review     check the diff                    ← 1          running
  3  Announce   write the release note            ← 2          not started
────────────────────────────────────────────────────────────────────────────────
STEP 1 · Engineer                                                 done · 2m 10s
  ✓  read 3 files                        repo.read        ok    240ms   14:01:20
  ✓  searched for "autofill"             repo.search      ok    180ms   14:01:24
  ⋯  thought                                                                 ⌄
  ✓  staged 6 changes                    studio.stage     ok    1.2s    14:02:05
        src/checkout/autofill.tsx   +84 −12
        src/checkout/form.tsx       +12 −3
        4 more                                                             ⌄
  ✓  opened PR #204                      studio.pr.open   ok    2.1s    14:03:30
                                                     → github.com/.../pull/204
  ▸  finished: "Autofill lands behind the flag. Tests pass locally."
────────────────────────────────────────────────────────────────────────────────
HANDOFF · Engineer ⇢ Review                          14:03:31 → picked up 14:03:44
  Task         Check the diff before it ships
  Artifacts    changeset cs_9f2 · spec SPEC-52
  Evidence     none cited                                    [why this matters]
────────────────────────────────────────────────────────────────────────────────
STEP 2 · Review                                            running · step 2 of 6
  ✓  read the diff                       repo.read        ok    310ms   14:03:50
  ●  checking the tests                  github.ci.read          ...      14:04:02
```

### 7.1 The seven rules that make it a ledger

1. **Every row bearing a checkmark is a `tool_calls` row**, and it carries four columns of
   verifiable metadata: the plain-language line (`ToolDef.preview(args)`, which every one of the 46
   tools already implements), the tool name in mono, `ok`, `latency_ms`, `created_at`. A sceptic can
   audit an entire run by reading one column.
2. **Thoughts are collapsed by default, marked `⋯ thought`, and never carry a checkmark.** Expanding
   shows the raw text. This is the inversion: every competitor leads with the thought and hides the
   tool call. A thought is a claim; a tool call is a fact; facts lead.
3. **Step duration comes from consecutive `agent_run_checkpoints.created_at` deltas.** Real time
   between beats, never estimated (**B3** exposes it).
4. **Three indents, three data sources.** `mission_steps` gives the DAG (level 1), checkpoints give
   the beat (level 2), `LoopStep` gives the shape (level 3). The indentation is the schema, so it can
   never drift from it.
5. **The plan block is pinned at the top and stays there.** The sceptic's first question is not "what
   did it do", it is "what was it supposed to do." Pinning the plan means every subsequent row is read
   against an intent that was stated first.
6. **Sticky-bottom, never yanking.** New rows append at the bottom and the column follows only if you
   are already at the bottom. Scroll up to read step 1 and the ledger leaves you there. The terminal
   convention, and it is right.
7. **The raw model I/O is a tab, not the default.** `?tab=timeline&raw=1` renders `agent_run_messages`
   verbatim, prompt and completion. Available to anyone who asks, never the front. That is the
   Engine-Room doctrine applied at the deepest level: the machinery is one door away, not zero, and
   not hidden.

### 7.2 What the terminal is

The brief asked for "the terminal." There are three honest candidates and they are different things:

| "Terminal" | What it actually is | Where |
| --- | --- | --- |
| the run's step log | `LoopStep[]` + `tool_calls`, above | the Ledger, default |
| the raw model exchange | `agent_run_messages` | `?tab=timeline&raw=1` |
| **the build's real output** | CI check runs and log tails via `ci.logs`, `StudioCi.checks[].summary` | `?tab=checks` |

The third is the one a PM actually means when a build is red, and it already exists: `StudioCi`
returns per-check `name`, `status`, `conclusion`, `html_url`, `summary`, plus a derived `gate`
(`ExecGate`) that is the same verdict `studio.pr.merge` enforces. Render the failing check's log tail
inline, in mono, with the failing line highlighted. **Never render a shell prompt we do not own.** A
fake terminal is slop; a real check log is proof.

---

## 8. The sceptic: the Receipt Ladder and the Evidence Underline

> *"Did the agent actually do that, or did it just write about doing it?"*

### 8.1 The Receipt Ladder - three descents, each one click, each one URL

| Descent | What you see | Source | Address |
| --- | --- | --- | --- |
| **1. The sentence** | "Engineer changed 6 files across 2 commits and opened PR #204." | `ReceiptLine` on any artifact card, anywhere in the room | wherever you are |
| **2. The step** | which tool, the args preview, `ok`, `latency_ms`, the timestamp | `tool_calls` joined to the run | the Ledger, or `?pane=record&pview=traces&item=trc_9` |
| **3. The artifact** | the diff, the PR, the CI check, the file | `getChangesetDiff`, `StudioCi`, `StudioPreview`, the PR url | `/mission/$id?tab=diff` |

Descent 1 → 2 is a **peel** (backward always peels). 2 → 3 is a peel too. Nothing here loses your
place, which is why one click for everything is safe.

### 8.2 The Evidence Underline

This is the strongest idea in this document, and it is a pure render-time join.

**Any noun phrase in a machine-authored sentence that resolves to a real row gets a 1px dotted
underline in `--ink-hairline`. Hovering or focusing peels the row inline. Nouns that do not resolve
get nothing.**

```
Engineer changed 6 files across 2 commits and opened PR #204.
                 ‾‾‾‾‾‾‾          ‾‾‾‾‾‾‾‾‾              ‾‾‾‾
```

versus a sentence the model asserted with nothing behind it:

```
Engineer reviewed the accessibility implications and found no issues.
```

**Why this is better than every alternative I considered:**

- It does not ask the model to be honest, and it does not add a fact-checking pass (cost, latency,
  and a new thing to be wrong).
- An unbacked claim renders *automatically weaker* than a backed one. The interface does the
  discrimination, mechanically, on every machine-authored string in the product.
- **The absence of the underline is the tell**, and it is legible without reading a word. A sceptic
  learns the grammar in ten seconds and then audits the entire product by scanning for underlines.
- It scales to every surface for free: one component, one join, no per-surface implementation.

**It cannot be gamed by the model.** The resolver joins against rows *this run actually wrote*, keyed
by `run_id` (B1) - not by string-matching ids across the workspace. A sentence naming a real row the
run never touched gets no underline.

**It requires B1.** Without `tool_calls.run_id`, the join runs through
`agent_run_checkpoints.state->>'traceId'`, a jsonb path that returns nothing the moment a checkpoint
row is missing. Same argument FINAL-ia makes for its own §5.1 gate: empty is honest, fake is not, and
a silently-empty underline resolver would make every claim look unbacked. **B1 is a hard gate for
this feature.**

**Enforcement:** `evidence-underline.test.ts` fails the build when a machine-authored string renders
without passing through the `<Evidenced>` resolver.

### 8.3 The three things a sceptic checks in the first minute, and where each lives

| The check | The answer, and it is one click |
| --- | --- |
| "Show me it ran the tests, not that it said so." | Ledger → the `github.ci.read` row: `ok`, `310ms`, `14:03:50`, and `?tab=checks` has the check names and conclusions from GitHub. |
| "Show me the code it wrote." | Ledger → the `studio.stage` row expands to the file list with line counts; `?tab=diff` is `getChangesetDiff`. |
| "Show me it did not just make that up." | The handoff seam's evidence list, and the Evidence Underline on the sentence itself. Where evidence is absent, it says `none cited` (§8.4). |

### 8.4 The honest empty case, and why it is a feature

`evidence_ids` is empty on every live hop today. The seam renders it plainly:

```
Evidence     none cited                                    [why this matters]
```

`--ink-subtle`, not red, not a warning. It is a fact about this hop.

The aggregate lives on the Crew pane: **"Evidence cited on 14 of 61 handoffs this month."** That
number, going up, is what earns `HANDOFF_EVIDENCE_GATE=enforce`.

**The interface becomes the instrument that lets the founder flip the flag.** That is a better
outcome than a UI that flatters a capability nobody is using, and it is the only version of this
that survives the craft law.

---

## 9. Failure: four classes, four shapes

Trust is won or lost here, so each class gets its own treatment. Collapsing them into one red state
is the mistake.

| Class | Data | What it means | Treatment |
| --- | --- | --- | --- |
| **Failed** | `mission_steps.status='failed'` + `.error`; `agent_runs.status='failed'` | it tried and could not | `✕` `--verdict-fail`. The real `error` in plain words. Two doors: **Try again with what we learned** (re-dispatch same `sub_goal`, failure context attached) and **Take it over** (opens the artifact). Never "Something went wrong." |
| **Poisoned** | `status='skipped'`, `error='Skipped: upstream step #N failed'`, written by `cascadeSkipFailedDependents` | it never got its turn | `⊘` `--ink-faint`. **Never N independent failures.** See §9.1. |
| **Recovered** | checkpoint gap > `STALE_MS` (2 min), run resumed by the sweeper | the worker was evicted and the run was picked back up | **Not a failure.** See §9.2. |
| **Halted** | `agent_runs.status='halted'`; `LoopResult.halted={kind,reason}`; budget/governance stop; the 20-minute `REPLAN_ABANDON_MS` guard | it stopped on purpose | `⏸` `--ink-subtle`, neutral. The reason plainly: *"Stopped: the mission's spend cap was reached."* One door: raise the cap (`?pane=engine&pview=spend`) or resume. |

### 9.1 The Poison Trail

`computePoisonedSteps` returns a `Map<idx, culpritIdx>` - every skipped step already knows exactly
which failed step killed it, transitively, to a fixpoint. Render that relationship, do not throw it
away.

```
✕ ◈ Research   hit a problem · the source returned 403                3/6    ⌄
  ⊘ ◈ Draft      never got its turn                    ← Research
  ⊘ ◈ Review     never got its turn                    ← Draft
  ⊘ ◈ Announce   never got its turn                    ← Review
```

One sentence at the head of the group, in the machine voice:

**"Research failed, so 3 steps after it never ran."**

Only the culprit is red. The skipped rows are faint and connected by a hairline back to it. Three
independent red rows would read as *the product is broken*; one red row with a visible consequence
chain reads as *one thing failed and the system handled it*. Same data, opposite conclusion.

The recovery door sits on the culprit, not on the skipped rows: **Fix and re-run from here.**

### 9.2 Recovery is a trust asset, not something to hide

The loop checkpoints *before* the provider call specifically so a worker eviction never double-bills
on resume, and `consumeInboundHandoff` claims messages with a compare-and-swap so a checkpoint can
never be double-spent. This is genuinely good engineering and it is currently invisible.

In the Ledger, a resume renders as a hairline gap and one mono line:

```
  ✓  staged 6 changes                   studio.stage     ok    1.2s    14:02:05
  ─────────────────  resumed from step 4, 14:09:02  ─────────────────
  ✓  opened PR #204                     studio.pr.open   ok    2.1s    14:09:30
```

Hiding a seven-minute gap is what makes users think a product is lying when they later see the
timestamps. Naming it is what makes them believe the rest of the ledger.

**Cap:** more than two recoveries in one run collapse to one line, `recovered 3 times ⌄`, with the
detail on expand and the aggregate flowing to the Engine pane's Quality room. Honest at every scale,
noisy at none.

### 9.3 Two more states that must never be laundered

- **`completed_with_failures`** renders **"Finished, with 2 steps skipped"**. `maybeCompleteMission`
  sets this deliberately when any step failed; a UI that says "Completed" throws away the one signal
  the engine went out of its way to compute.
- **A mission with zero steps and a terminal orchestrator run** is a planning failure - the case
  `maybeCompleteMission` resolves at `handoff.server.ts:588-598` after the 2026-07-01 live-DB
  incident. It reads: **"Chief of Staff could not turn that into a plan."** Door: the composer,
  prefilled with the original goal.
- **Retries are visible.** `mission_steps.attempts` / `max_attempts` (default 2). A step on its second
  attempt carries `attempt 2 of 2` in mono beside its title. A silent retry is a small lie that costs
  a lot the moment the user sees double the spend.

---

## 10. The Arc Ribbon: earned autonomy, made visible

The most compelling thing this product can show, currently rendered by `TrustDial` inside
`AgentRosterPanel` inside `components/governance/` inside the Safety room.

### 10.1 Correct the story first

`loadAgentArc` returns **`"trusted"`** when nothing is set (founder ruling 2026-07-08, SW-7). Agents
do not start at zero and climb. The arc is a **standing setting used to tighten**; the **earned**
thing is the per-(agent, tool) `trust_graduation_proposals` row that
`maybeProposeTrustGraduations` writes after a clean streak, guarded by a real "no missed outcome in
the window" check.

Any UI reading *"earn my trust"* is a lie about this codebase. The honest framing:

> **It already works on its own. What it earns is the right to stop asking about specific things.**

### 10.2 Three renderings

**1. On the Floor row, on expand - the autonomy sentence.**

```
● ◈ Engineer   writing the change · autofill.tsx           4m 20s   6/24   ⌃
    observing ─ proving ─[ trusted ]─ ambient
    writes commits without asking · asks before merging · 78, 14 runs
```

That sentence is `resolveToolMode(toolName, rawMode, arc, contractApproved)` made legible, and it is
the first thing any PM asks about a thing touching their repo. It must be generated by one shared
formatter, `describeAutonomy(agentSlug)`, so it can never disagree with the settings screen (§14).

**2. As a gate card in the ember tray - the moment it earns something.**

```
Engineer wants to stop asking about staging changes.
It has staged 11 changesets and you approved every one.
                                            [ Let it ]   [ Keep asking ]
what it still asks about: opening a PR, merging
```

This belongs in the tray with the approvals because it is a decision, and it is the single most
compelling card the product will ever show a prospect. It is fully wired today - `listTrustGraduationProposals` / `decideTrustGraduation`, already plumbed through
`approvals-queue.functions.ts:206,747` - and it renders in a governance panel nobody opens.

**3. In the Crew pane - the record.** `computeAgentScorecard`: approve rate, outcome rate, reverts,
and per task type (min 2 samples, so no single-datapoint tiers). Plus graduation history from
`capabilities.functions`. This is the "what have they earned" question, and it is correctly a pane.

### 10.3 The one rule

**Never render a trust score as a bare number.** `78` is meaningless. Render the sentence the
breakdown supports, with the number beside it in mono:

> **14 runs, 12 clean. You approved 9 of 10 of its calls. Two outcomes recorded, both landed.** `78`

`TrustBreakdown` carries every field required (`missions_total`, `missions_completed`,
`approvals_total`, `approvals_approved`, `evals_total`, `eval_mean_score`, `outcomes_total`,
`outcomes_validated`, `samples`). And when `samples < 3`, say so: *"Too new to have a record."*
Bayesian shrinkage toward 0.5 is already in the maths; the copy must not out-claim it.

---

## 11. The messaging, moment by moment

The founder asked explicitly for the journey, the messaging, how agents take over, and what part is
done by the agent. This is that table.

**The rule that generates all of it: every sentence says who did what, and the product never uses the
word "AI".** Attribution is the message. `AgentChip` is the mechanism.

| Moment | What the user sees | Who acted | Source |
| --- | --- | --- | --- |
| You ask | the Composer, your words, `--voice-human` | you | - |
| It is understood | Thread, machine voice, one line: `Chief of Staff is planning this.` | Chief of Staff | `mission.plan` in flight |
| The plan lands | `3 steps: Engineer writes it, Review checks it, Announce writes the note.` **The Floor opens once, for 3 seconds, then settles to the Strip.** | Chief of Staff | `mission_steps` rows |
| Work starts | Strip: `● Engineer writing the change · checkout autofill` | Engineer | `agent_runs` + `ACTION_LABEL` |
| Six minutes of nothing | Strip unchanged, clock advancing, step counter advancing. **The clock is the reassurance.** | Engineer | `last_checkpoint_at` |
| A hop | Floor seam, 2.5s: `Engineer ⇢ Review, carrying 2 artifacts` | both | `agent_messages` |
| It needs you | ember tile count +1; Strip census reads `1 waiting`. **The Composer keeps focus. The room does not hijack.** | you, next | `agent_approvals` |
| It lands | Thread receipt: `Engineer opened PR #204 · 6 files, 2 commits, tests green.` With underlines. | Engineer | `ReceiptLine` + `tool_calls` |
| It failed | `Review could not read the CI logs: the GitHub token expired.` Two doors. | Review | `mission_steps.error` |
| It earned something | the graduation gate card (§10.2) | Engineer, proposing | `trust_graduation_proposals` |

**The one deliberate interruption in this whole design** is the 3-second Floor open when a plan first
lands. It is the moment the user learns the product is a crew, it happens once per mission, and it
costs 3 seconds. Everything else is peripheral. (FINAL-ia's "a queue is not an agenda" holds
everywhere else, including gates.)

**Banned copy, all greppable, all failing `no-slop.test.ts`:**

- "AI is thinking", "Generating...", "Processing your request", "Our AI", "Powered by AI"
- any percentage that is not counting real things
- any ETA the engine does not have
- "Success!" - use `ReceiptLine`
- "Something went wrong" - name the thing
- a spinner with no name attached to it
- the raw tool id in user-facing text (`ACTION_LABEL` and `ToolDef.preview` exist for this)
- the DB slug in user-facing text (`agentDisplayName` exists for this)

**Long runs.** Nothing here makes a four-hour build pleasant, and I will not pretend otherwise. What
it gets: the clock, the step counter, an honest last event, and - **at 15 minutes elapsed, the Strip
offers one link: `Tell me when it lands.`** That arms a browser notification and an ember tray entry.
It does not build a progress bar for a thing with no known end.

---

## 12. Agent-friendly: one substrate, two renderers

The founder asked for this too, and it has a precise design answer.

> **Law: the human's screen and the receiving agent's prompt are two renderers over one substrate.
> They may never disagree.**

`renderHandoffBlock(inbound)` produces the receiver's version of the seam card: task, structured
context, artifacts, constraints, open questions, memory refs, evidence. The seam card in §8 renders
the same payload for a human. If a human reads "3 pieces of evidence" and the receiver's prompt block
lists two, that is a bug of the same severity as a wrong number in a receipt.

Three concrete consequences:

1. **One id space.** Every entity on the Floor and in the Ledger carries a stable mono id that is
   also the id an agent reads with its own tools: `MSN-182`, `cs_9f2`, `trc_9`, `SPEC-52`,
   `SIG-204`. Not two id systems, one for display and one for machines.
2. **One formatter.** The seam card and `renderHandoffBlock` are generated from one shared function.
   `seam-parity.test.ts` fails when the two renderings disagree on artifacts, constraints, open
   questions or evidence for the same payload.
3. **The machine door is a visible row, not a secret.** `/api/public/a2a.agents.supaprod.card.ts` and
   the `a2a.message.send` / `a2a.message.stream` routes already exist. The Crew pane carries one row:
   **"Other agents can talk to this crew"**, the card URL, one copy button. That is the agent-native
   claim made concrete in a single line, and it costs nothing because the endpoints ship.

---

## 13. Motion and material law

Per `craft-law.md` and `src/styles/ink.css`. Every rule is a decision and every one is greppable.

- **One pulse in the room.** `.ink-working`, `--voice-machine`, 2.4s, on the live locus only. Not on
  every running row. Not on the Strip and the Floor at once.
- **No spinner anywhere.** A spinner rotates at a constant rate regardless of progress; it is a lie
  by construction. The heartbeat dot plus the advancing step counter replace it everywhere.
- **No progress bar unless the denominator is real work.** `step 6 of up to 24` is honest because
  `adaptiveStepBudget` returns a real ceiling. A filled bar is not, because steps are not equal work.
  Counter, never bar.
- **No streaming text as a primary surface.** Streamed tokens appear in exactly one place in the
  product: the Ask composer's own reply (`chat.ts`'s SSE), which is a conversation, not a run.
- **State changes crossfade, 150ms, `--ink-ease`.** Nothing slides. Nothing bounces. The Floor's push
  is 250ms.
- **The handoff seam is the only celebratory motion**, 2.5s, once per hop, never on re-render, never
  two at once (queued).
- **Rows never reorder while a human is looking.** Re-sort on close or on `Tidy`.
- **No per-agent hue outside the `AgentMark` glyph gem.** Founder ruling C, 2026-07-11. Twelve agent
  hues loose on the Floor would be the loudest slop tell in this design. The glyph differentiates;
  the hue lives in a 16-22px gem and nowhere else.
- **Reduced motion:** the pulse resolves to a static ring (already handled in `ink.css:186`), the seam
  becomes an instant swap, the Floor push becomes an instant resize.
- **No emoji, no sparkle glyph, no "AI" badge, no glassmorphism on a content row.**

---

## 14. What the backend must do

Honest, ordered, each with the reason it is not optional.

| # | Work | Why | Gate |
| --- | --- | --- | --- |
| **B1** | Add `run_id uuid` and `mission_id uuid` to `tool_calls`; backfill from the existing `trace_id` join | the Receipt Ladder and the Evidence Underline both need a run → tool_calls join. Today it goes through `agent_run_checkpoints.state->>'traceId'` (`missions.functions.ts:380-388`), a jsonb path that fails silently when a checkpoint row is absent. A silently-empty resolver makes every honest claim look unbacked. | **hard gate** for §8 |
| **B2** | `getFloorState` - one batched server fn: all live runs + their mission/step context + brood counts + the census | the Floor must not be five polling queries. `getSwarmHud` is close but returns *latest run per agent*, not *all live runs*, and cannot see brood children. Same mitigation FINAL-ia R1 names for the rail counts. | before the Floor ships |
| **B3** | Return per-step durations (consecutive `agent_run_checkpoints.created_at` deltas) through the mission read | the honest clock. Derivable today, not returned. | with the Ledger |
| **B4** | Populate `evidence_ids` and `memory_refs` in the live loop from the run's recalled-memory context | the seam's evidence row is empty on every real hop. `HandoffPayload.memory_refs`' own doc comment says it "stays optional until the loop fills it." | before `HANDOFF_EVIDENCE_GATE=enforce` |
| **B5** | Decide `agent_runs.completed_at`: add the column, or label every finish time as approximate | completion is inferred from `last_checkpoint_at` today, so every "finished at" in the Ledger is approximate. Either is fine; silence is not. | with the Ledger |
| **B6** | `parent_run_id` on `agent_runs` (or a `mission_steps` row for spawned children) | brood rows are otherwise discoverable only by the negative join "runs on this mission no step references." | before `AGENT_FANOUT=1` |
| **B7** | `mapRelayStatus`: give `halted` and `skipped` their own states | `halted` currently maps to `failed` (teaches users the product breaks when it is being careful); `skipped` falls through to `idle` (erases the poison cascade entirely). | with the Floor |
| **B8** | `describeAutonomy(agentSlug)` - one shared formatter over `resolveToolMode` | the Floor's ambient autonomy sentence and the settings screen must be generated from one place or they will drift. | with the Arc Ribbon |

---

## 15. Enforcement

Same shape as FINAL-ia §9. A document that rots is a document; a test is a contract.

| Test | Fails when |
| --- | --- |
| `presence.test.ts` | the room renders with a live run and no agent name is on screen at any breakpoint |
| `evidence-underline.test.ts` | a machine-authored string renders without passing through the `<Evidenced>` resolver |
| `no-spinner.test.ts` | any component outside the composer imports a generic spinner or renders an indeterminate progress element |
| `one-pulse.test.ts` | more than one `.ink-working` element is mounted at once |
| `seam-parity.test.ts` | the seam card and `renderHandoffBlock` disagree on artifacts, constraints, open questions or evidence for one payload |
| `honest-status.test.ts` | `completed_with_failures` renders as "Completed" · `skipped` renders as "Failed" · `halted` renders in the fail ramp · a retry renders without its attempt count |
| `floor-stability.test.ts` | the Floor's row order changes on a refetch that neither added nor removed a run |
| `no-slop.test.ts` | any banned string from §11 appears in a user-facing surface, or a raw tool id or DB slug leaks into rendered copy |

---

## 16. Build order, folded into FINAL-ia's phases

No new phases. Everything here rides an existing one.

| Phase | What this angle adds |
| --- | --- |
| **P1** one shell | The Strip becomes a real permanent region with the census and the zero-state last event. `PulseLine` mounts there. `CookingBanner`, `AmbientChip`, `MachineNow`, `FocusDock` die as FINAL-ia already rules. |
| **P2** depth becomes visible | Tile 5 renamed **Your crew**. **The Floor ships here, with the tile**, because a count with no place to expand into is the exact failure P2 exists to fix. B2 and B7 land. |
| **P4** the graph | **B1 rides this phase.** Same argument FINAL-ia makes for its own §5.1: the Evidence Underline is unbuildable without it, and a stubbed version would be worse than none. |
| **P5** the seven faces | The Build face's live lens reads `getFloorState`, not its own query. `AgentRelay`'s `station` variant retargets onto the stage faces (it already does exactly this job). |
| **P6** workbench children | **The Ledger** ships as the mission child's Thread column: plan block, step groups, tool rows, thought collapse, poison trail, recovery gaps, retry counts. B3, B5. |
| **P8** doors and journeys | **The Relay Seam** in all three renderings. **The Arc Ribbon** and the graduation gate card. **The Evidence Underline** everywhere. B4, B8. |
| **P9** delete and proof | `_authenticated.agents.tsx` and `_authenticated.swarm.tsx` collapse into the legacy resolver. `AgentRosterPanel` moves from `components/governance/` to `components/crew/` - the folder name was the founder's complaint in miniature. Enforcement battery on. |

---

## 17. Handoff to the other two angles

**To the identity angle.** I own the agent *in motion*; you own the agent *at rest* - who they are,
the twelve names, the mark, the introduction, the roster's front door. Two seams:

1. `AgentMark` / `AgentBadge` / `AgentChip` are yours. I consume them and I need `AgentMark` legible
   at **16px** (Strip) and **20px** (Floor row). The current glass-gem treatment holds at 22 and
   should be checked at 16.
2. **A real collision you must rule on.** The catalog's display names include `Plan` (slug
   `sprint-planner`), `Design` (slug `ux-architect`) and `Review` (slug `qa`) - and the Spine's stage
   names are `Plan`, `Design`, and the product's core verb is *review*. On the Floor, a row reading
   `Design · mapping the experience` beside a Spine reading `04 Design` is genuinely ambiguous, and
   `Plan` is worse. **My recommendation: rename the agents, not the stages.** A stage is where the
   product is; an agent is a colleague. Colleagues get names that are not also places.

**To the control angle.** I own showing what an agent is *allowed* to do at the moment it matters - the autonomy sentence on the Floor row, the graduation gate card. You own where it is *changed*:
`?config=agents&section=autonomy`, per-tool modes (`agent_tool_modes`), `toggleAgentSkill`, roster
enable/disable, `agent_autonomy.arc`. One seam, and it is strict:

> **`describeAutonomy(agentSlug)` (B8) is one formatter over `resolveToolMode`, and both of us render
> from it.** The ambient claim on my Floor row and your settings screen cannot be allowed to drift,
> because the moment they do, neither is believable.

Also yours: `resolveApprovalMode`'s safety floors are subtle and important (`review` is sticky, the
dial only ever loosens `auto`/`confirm`, `mission.*` control flow is exempt entirely). I render the
result; you have to make the rule comprehensible.

**To both.** The tile 5 rename and split (§1.2) is a shared decision. I am proposing it. If either of
you needs the pane to be the primary crew surface, say so before P2 and we reconcile, because the
rail counts have to know their job before they ship.

---

## 18. The real risks, and the honest gaps

| # | Risk | Why it is real | Mitigation |
| --- | --- | --- | --- |
| R1 | **The Floor is a poll, not a stream.** There is no run-level SSE. At 4s, a 20-second step looks static. | this is the single largest gap between the design and the runtime | the clock advances **client-side** between polls (elapsed is computable from `created_at`); the step counter never does. The surface is never frozen even when the data is stale, and it never invents a fact. |
| R2 | **Five polling consumers** - Strip, Floor, Ledger, rail counts, Spine | Cloudflare Workers have a subrequest budget; this is FINAL-ia R1 again with more clients | one `getFloorState` (B2), one query key, 4s stale time, shared by all five. Optimistic decrement on a gate decision. |
| R3 | **The Floor competes with the Composer for the bottom.** `_authenticated.tsx:210-216` already documents the FocusDock/composer collision. | the exact bug that killed `FocusDock` | the Floor **pushes the Canvas** and never overlaps the Composer. The Composer is the lowest region, always, no exception, no breakpoint. |
| R4 | **The seam animation becomes noise at high hop rates.** A J0 full-loop run hops 7+ times. | celebratory motion that repeats stops being celebratory and becomes a tic | the seam animates only when the Floor is open, only for focused missions, one at a time, queued. Otherwise it lands as a static row. |
| R5 | **Showing recovery gaps could read as instability.** | "resumed from step 4" five times looks broken | it *is* the honest signal and burying it is worse. Cap at 2, then collapse to `recovered 3 times ⌄` with the aggregate flowing to the Engine pane. |
| R6 | **The Evidence Underline arrives before B1 and silently resolves nothing** | every honest claim would render as unbacked, which is worse than no feature | hard gate. It does not ship in the same release as anything else. |
| R7 | **Renaming tile 5 relitigates a settled IA decision.** | FINAL-ia is the build contract and I am amending it in week one | it is one label and one split, it does not touch the rail's mechanism, its counts, its keys or its URLs, and the argument is in §1.2 in full. If it is rejected, the Floor still works from the Strip; only the tile's second target is lost. |

**Gaps I do not solve:**

- **Multi-product.** FINAL-ia H1's scope toggle applies here: three products' runs on one Floor need a
  scope. I default to product-scoped with an `all products` toggle in the footer. **Decide before P2**,
  because `getFloorState` has to know its scope.
- **Genuinely long runs.** A four-hour build is not made pleasant by anything in this document. The
  best available honest answer is the clock, the counter, and `Tell me when it lands` at 15 minutes.
  I would rather ship that than a progress bar for a process with no known end.
- **The mid-run steer.** `steerStudioSession` and the `kind='steer'` message path let an operator
  redirect a run in flight, consumed at the next step boundary. It is real, it is wired, and it
  deserves a first-class affordance on the Floor row that I have not designed here. It probably
  belongs to the control angle. Flagging it rather than leaving it silent.

---

## 19. One paragraph for the founder

You sign in and above the box where you type there is one line, always, that says which of your
people is working and on what: *Engineer, writing the change, checkout autofill, four minutes twenty,
step six.* Press the chevron and that line becomes the floor: every agent working right now, one row
each, grouped into the waves of the plan they are executing, one clock, one heartbeat, one ember if
something needs you. Nothing jumps, nothing reorders, nothing spins. When one agent finishes and hands
to the next, you see the pass: who to whom, carrying which artifacts and which evidence. When a step
fails, you see one red row and the three grey rows behind it that never got their turn, and the
sentence that says so. When you want the whole story, you open the run and get a ledger, not a
transcript: what it was supposed to do at the top, then every real thing it did, each with the tool
it used, whether it worked, how long it took, and the timestamp, with the model's own musings folded
away underneath because a thought is a claim and a tool call is a fact. Anything it wrote about doing
that it can prove it did carries a faint underline you can pull on; anything it merely asserted does
not, and that difference is visible before you read a word. And the day an agent has done the same
thing right eleven times, it comes to you and asks to stop asking, and you can see exactly what it
would still bring you. The agents are not a page you visit. They are the thing that is on screen
while you work.
