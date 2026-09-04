# The Crew - identity, competence, and control

> _Created: 2026-07-28 · Last updated: 2026-08-03_

> Track A of the agent-presence rebuild, 2026-07-28. My angle: **who the agents ARE.**
> Every slug, function name, column, constant and line count below was read in code this session.
> Where the brief I was given was wrong about the code, this document carries the corrected fact
> and says so.
>
> Siblings: the choreography track (how a run narrates itself moment to moment) and the
> language track (`../language/`). My handoff to both is §11.

---

## 0. THE VERDICT, UP FRONT

Six rulings. Each is argued below; each names the code that makes it real.

1. **Roles, not characters.** The crew are job titles with a fixed professional register, not
   personalities with names and quips. The differentiator is not charm, it is a public track
   record. §3.
2. **The names are the bug.** Today eleven of thirteen agents are named with the *verb of their
   stage* - the Design stage is worked by an agent called "Design". An agent whose name is its
   stage has no identity; it IS the machinery. Rename to agent-nouns under one rule: **stages are
   verbs, agents are the -er noun of a job.** Display-only; DB slugs never move. §2.
3. **Identity is shape. Colour is state.** Kill the thirteen-hue palette (they sit 4-6° apart in
   one oklch band and are indistinguishable). The mark is monochrome; colour enters only to mean
   *running*, *waiting on you*, or *failed*. This is what lets thirteen scale without becoming a
   sticker collection. §4.
4. **The crew gets a permanent region of the shell, not a rail tile.** I keep ONE ROOM. I do not
   ask for a `/crew` destination. I ask for the WorkingStrip to become the **Crew Bar** (always
   present, all thirteen visible, never empty) and for one agent to promote to a **workbench
   child** at `/$ws/$product/crew/$agentSlug`, on the same width argument the IA already accepted
   for the Map. §5.
5. **Delete the `?config=agents` settings group.** Instructions, autonomy and tool permissions are
   read next to their results or they are not read at all. This is the IA's own argument for
   keeping prompts and guardrails in the Engine pane, applied consistently. §5.4.
6. **Two mechanisms answer the sceptic, and neither is a claim.** An **act** carries a receipt
   (`tool_calls` row: id, latency, args, result); a **claim** is prose with no receipt and is
   drawn differently and labelled `said`. And no rate is ever shown without its denominator; no
   trust score is shown under three samples. §8.

---

## 1. WHAT IS ACTUALLY THERE (verified, and three corrections to the brief)

The substance is real and largely complete. The surface is the whole gap.

| Asset | File | State |
| --- | --- | --- |
| The roster | `src/lib/agent-vocabulary.ts` `SPECIALIST_CATALOG` | 13 active cast + 2 crew + 21 deprecated aliases. Real, single source of truth. |
| Trust score | `src/lib/ai/trust.server.ts` `computeAllAgentTrust` | Real. `0.3·mission + 0.2·approval + 0.2·eval + 0.3·outcome`, Bayesian-shrunk (`PRIOR 0.5`, `PRIOR_WEIGHT 10`). |
| The arc | same, `Arc = observing\|proving\|trusted\|ambient` | Real. `suggestArc(score, samples)`; **default is `trusted`, not `observing`** (`loadAgentArc` line 254, founder ruling 2026-07-08 SW-7). |
| Graduation | `src/lib/ai/trust-ramp.ts`, `reflection.server.ts` `maybeProposeTrustGraduations` | Real. `TRUST_RAMP_CLEAN_N = 5`. Ladder `review→confirm→auto`. A `missed` outcome inside 30 days blocks all proposals. |
| Safety floors | `trust-ramp.ts` | Real and named: `HIGH_RISK_FORCE_REVIEW = {studio.pr.merge, studio.revert, delegate.openhands}` never graduates; `HIGH_RISK_MIN_CONFIRM = {calendar.create}`; `BUILD_LANE_AUTONOMOUS = {studio.stage, studio.commit, studio.pr.open}`. |
| Scorecard | `src/lib/agent-scorecard.ts` | Real. Approve record, outcome record, **revert count** (from `artifact.rewind` rows), per-task-type table with `MIN_TOOL_SAMPLES = 2`. |
| Fleet state | `src/lib/agent-fleet.ts` | Real, pure. `working\|queued\|attention\|idle`, per-agent tallies, `lastActiveAt`. |
| Step budget | `src/lib/ai/budget.ts` `adaptiveStepBudget` | Real. orchestrator 14 + 2/planned step; builder 24; every specialist 6. `+2` trusted, `+4` ambient. `STEP_CEILING = 40`. |
| Capabilities | `src/lib/capabilities.functions.ts` (794) | Real, and it already writes through: `updateAgentInstructions` writes `agents.system_prompt` (the column the loop reads); `toggleAgentSkill` writes `agent_disabled_skills` (the rows `mission.plan` reads). |
| Blast radius | `src/lib/agent-tool-cap.ts`, `agents.functions.setAgentToolCap` | Real. `agents.max_tool_risk` removes over-cap tools from the agent's prompt entirely. |
| Bench | `agents.enabled` column | **The runtime already enforces it.** `handoff.server.resolveAgent` filters `.eq("enabled", true)`; `agents.functions.runAgent:166` refuses a disabled agent. There is no write path and no UI. |
| Tool preview | `registry.server.ts` `ToolDef.preview(args) => string` | Real, and the single most under-used asset in the repo: a plain-language sentence for every one of the 50 tools, currently rendered only on approval cards. |

### Three corrections to the brief I was given

1. **"the runtime REJECTS an evidence-free handoff" is conditional.** `handoffEvidenceGateEnforced()`
   reads `process.env.HANDOFF_EVIDENCE_GATE` and is **OFF by default** (`handoff.server.ts:85`), with
   an explicit comment that no live handoff carries `evidence_ids` today. The validator is real and
   pure; the gate is not armed. I design for the honest state and make arming it a build gate (§8.3).
2. **The default arc is `trusted`, not `observing`.** Any UI that narrates "agents start out watched
   and earn their way up" would be lying about this product's actual posture. The narration has to be
   the true one: agents start trusted, the *tools* start gated, and what gets earned is the removal of
   individual gates.
3. **`agent_run_steps` / `agent_run_messages` do not exist.** `loop.server.ts:832` names them in a
   comment; nothing in `src/` or `supabase/migrations/` references them. The durable step record is
   `tool_calls` (joined to a trace by `trace_id`, per `traces.functions.ts:267`) plus
   `agent_run_checkpoints` (recovery state, latest step only). Every step-rendering design below is
   built on `tool_calls`, which is real.

### And the finding that explains everything

`AgentRosterPanel.tsx:112`, in the repo, today:

> "The full mesh lives here. **The user never sees this roster;** they meet these agents in motion,
> as the relay, named for what they do."

And `_authenticated.agents.tsx`:

> "The user meets agents in motion (the relay), **not as a managed roster.**"

The agents are not missing by accident or by neglect. They were **deliberately hidden**, by a
ruling (AGENT-EXP, 2026-06-18) that was coherent on its own terms: calm front, name the outcome not
the mechanism, agents as invisible plumbing. That ruling is the direct cause of the founder's pain
point, and this document overturns it. The Engine-Room doctrine still holds for *mechanism* - arcs, budgets, checkpoints. It does not hold for **staff**. A workforce is not a mechanism, and
hiding the workforce in the safety room is how "agentic-first" became a claim.

---

## 2. THE ROSTER

### 2.1 The thirteen, and why that division

Thirteen is not a target. It is the number of **distinct judgments** in the seven-stage loop. One
agent per judgment, because the trust machinery is keyed per agent (`computeAllAgentTrust` on
`agent_id`, `computeAgentScorecard` on `agent_slug × tool_name`) - collapse two judgments into one
agent and you lose the ability to say which one you can trust.

| # | Slug (never renamed) | Today's name | **New name** | Stage | The judgment it owns, in the user's words |
| --- | --- | --- | --- | --- | --- |
| 1 | `discovery-scout` | Watch | **Scout** | 01 Discover | Is anything different in the tools you connected? |
| 2 | `researcher` | Research | **Researcher** | 01 Discover | What does the outside world say about this question? |
| 3 | `customer-insights` | Listen | **Listener** | 01 Discover | What are your customers actually saying, grouped? |
| 4 | `strategist` | Prioritize | **Strategist** | 02 Decide | Of everything on the table, which bet is worth it? |
| 5 | `critic` | Challenge | **Critic** | 02 Decide | What is the strongest case that this is wrong? |
| 6 | `prd-writer` | Draft | **Writer** | 03 Plan | Turn the decision into a spec somebody could build. |
| 7 | `sprint-planner` | Plan | **Planner** | 03 Plan | Cut the spec into work with an order and a size. |
| 8 | `ux-architect` | Design | **Designer** | 04 Design | What does this look like, in your brand? |
| 9 | `builder` | Engineer | **Engineer** | 05 Build | Write the change in your codebase. |
| 10 | `qa` | Review | **Reviewer** | 05 Build | Is this diff safe to ship? |
| 11 | `release` | Announce | **Announcer** | 06 Ship | Say what changed, in your voice. |
| 12 | `data-analyst` | Measure | **Analyst** | 07 Learn | Did it land? Against what you said you wanted. |
| 13 | `orchestrator` | Chief of Staff | **Chief of Staff** | conductor | Which of the twelve, in what order, and when do I stop and ask you? |

**The machinery** (`tier: "crew"`, not staff - no judgment, therefore no trust record, therefore
no controls):

| Slug | Today | **New name** | What it does |
| --- | --- | --- | --- |
| `reactor` | Reactor | **Dispatcher** | Wakes the right agent when something happens in a connected source. |
| `archivist` | Archivist | **Archivist** | Consolidates what was learned into durable memory. |

I am overturning the "crew is never shown to users" rule as well. Hiding the two mechanisms that
make the system feel alive between sessions is the same mistake at smaller scale. They appear at
the bottom of the crew room under **"Runs itself"**, plainly labelled as machinery, with no dials.

### 2.2 Why the rename, and why it is not cosmetic

Look at what today's names collide with. Stage 04 is called **Design**. The agent that works stage
04 is called **Design**. Stage 03 is called **Plan**. The agent is called **Plan**. The Discover
stage is worked by **Watch**, **Research** and **Listen** - three verbs, none of which is a person.

That is not a naming quirk. It is the interface saying, correctly, that these are not
characters - they are stage functions wearing a glyph. You cannot ask for "Design" the way you
ask for a colleague, because "Design" is the room, not the person in it.

**The rule, and it is generative:** stages are verbs (`Discover, Decide, Plan, Design, Build, Ship,
Learn`); agents are the agent-noun of a job (`-er`, `-ist`, `-or`). A fourteenth agent names itself
under this rule. Two chips side by side are never ambiguous: `04 Design` is a stage marker in mono;
`Designer` is a person in prose.

Three names change more than a suffix, and each is a decision:

- `customer-insights` "Listen" → **Listener**, not "Voice" (the retired character name in the
  file's own comment). Listener is a job; Voice is a mascot.
- `release` "Announce" → **Announcer**, not "Herald" (also retired), and deliberately not
  "Publisher" or "Marketer" - both would imply distribution, and FINAL-ia §4.2 J6 records the honest
  edge that this product offers Copy and never Post. The name must not out-claim the wiring.
- `prd-writer` "Draft" → **Writer**, not "Scribe". Scribe is costume.

Cost of the rename: one file. `SPECIALIST_CATALOG[].name` is display-only by design
(`agent-vocabulary.ts:16-20`, the standing rename-disclaimer rule). `agentDisplayName()` is the one
resolver and every surface already routes through it. Deprecated aliases keep resolving, so
historical runs still render a name.

### 2.3 Why not fewer, and why not more

**Fewer.** The three Discover agents are the case people push on: why not one "research agent"? Because
the three have different failure modes and different track records, and merging them destroys the
one thing that makes the crew credible. A Scout that misses a Linear change fails differently from a
Researcher that cites a bad source. Merged, you get one number that means nothing. Split, you get
"the Listener's clusters have been approved 14 of 15 times; the Researcher's have been approved 6 of
11" - and the second number is *actionable*: you restrict the Researcher, not the whole discovery
function.

The Strategist/Critic and Engineer/Reviewer pairs are separation of duties. A model that reviews its
own diff is not a reviewer. The Critic exists because the wedge (`docs/strategy/v9`) is adversarial
teardown, and an advocate cannot red-team its own bet. These four are two pairs, not four roles.

**More.** Every additional agent is a new handoff seam, and `enqueueHandoff` requires a structured
payload with artifacts and evidence at each seam. Seams are where agentic systems lose fidelity.
`adaptiveStepBudget` gives a specialist six steps: an agent that needs a fourteenth colleague to
finish its job is an agent whose remit is wrong.

**No agent creation in v1.** The crew room does not show a dead "+ New agent" button. It says, in
one line, what the crew is and that it is fixed: "Thirteen agents, one per judgment in the loop. You
can bench any of them, and change what each is allowed to do." Custom agents are a real future
feature; a disabled button is a lie about today.

---

## 3. THE PERSONALITY QUESTION - VERDICT AND CONSEQUENCES

**Verdict: neutral professional roles, with a per-role voice *register* and zero character.**

### 3.1 Why not named characters

The case for characters is real: names are memorable, "ask Iris" is warmer than "ask the
Researcher", and a distinct voice makes an agent feel like a colleague rather than a function call.
I am rejecting it for four reasons, in order of weight.

1. **A character name carries no information, so it is a memory tax paid thirteen times.** "Iris" has
   to be learned; "Researcher" does not. At three agents, charm wins. At thirteen, the user is
   holding a cast list, and the moment they cannot remember whether Iris or Cass does teardowns, the
   crew stops being reachable and becomes a lookup.
2. **The buyer is a PM at a company with a procurement process.** The investor canon names the
   employer as "a leading BFSI technology OEM" and the market as 2.6M PMs. A screen where "Pip
   finished your PRD" goes into a Slack channel with a VP in it is a screen the PM will not paste.
   The single fastest way to lose an enterprise evaluation is to make the evaluator feel silly.
3. **A voice is a claim, and claims need wiring.** If the Critic is "blunt" and the Writer is
   "meticulous", then every generated string has to sustain thirteen registers through a runtime
   sanitizer that already enforces one house voice (`docs/conventions/humanized-output.md`). Thirteen
   personalities is thirteen prompt surfaces to drift, and drift here reads as the model losing the
   plot.
4. **The product already has its personality, and it is better than charm.** It is the record. An
   agent that can say "you have approved my teardowns nine times out of ten, and the one time you
   overrode me, the outcome went your way" is more interesting than any invented trait, and it is
   *true*.

### 3.2 Why this is not the anonymous-grey-worker failure either

The failure mode of "neutral roles" is that the agents become interchangeable grey rows and
"agentic-first" is a claim on the marketing site. Four things prevent it, and none of them is
colour or a name:

1. **A distinct glyph per agent**, permanent, monochrome-safe (§4).
2. **A charter in second person**, one sentence, addressed to you, on every agent everywhere:
   "Watches the tools you connected and tells you what changed."
3. **A visible, differentiated, honest track record.** The Critic and the Engineer will *not* have
   the same numbers, and the difference between them is the entire experience of having a team.
4. **Real controls.** You can bench an agent. You can rewrite its instructions and see the exact
   text it will be handed. You can take a tool away from it. A worker you can fire is not
   anonymous.

### 3.3 The voice system: four registers, one grammatical rule

Voice is assigned by **what kind of judgment the agent makes**, not by character. Four registers,
thirteen agents, no drift surface.

| Register | Agents | The rule | Example |
| --- | --- | --- | --- |
| **Reporting** | Scout, Researcher, Listener, Analyst | State findings with the source attached. Never an opinion without a citation. | "Four support threads this week name the same export bug. `SIG-204` `SIG-207` `SIG-211` `SIG-219`" |
| **Judging** | Strategist, Critic, Reviewer | State the verdict, the reason, **and what would change it**. The third part is mandatory. | "Revise. The success metric is not instrumented, so this cannot be measured after ship. It would pass with an event on the export action." |
| **Making** | Writer, Planner, Designer, Engineer, Announcer | State what was made and what was assumed. Assumptions are always listed, never buried. | "Draft spec, six sections. I assumed enterprise tier only; the bet did not say." |
| **Conducting** | Chief of Staff | Addresses you about the whole. | "Three agents worked on this. The Reviewer stopped at the migration and wants you." |

**One grammatical rule enforces the whole thing: only the Chief of Staff says "I".** The other
twelve speak in the third person about their output or use no pronoun at all. That single rule is
the anti-mascot gate - it makes it structurally awkward to write a quip - and it gives the Chief of
Staff a real, earned distinctiveness as the one voice that talks to you rather than at the work.

(The "Making" register example above breaks the rule and is corrected to: "Draft spec, six sections.
One assumption not in the bet: enterprise tier only." Register rules are enforced in copy review;
the language track owns the lint.)

---

## 4. THE IDENTITY SYSTEM - IDENTITY IS SHAPE, COLOUR IS STATE

### 4.1 What is wrong with `AgentMark.tsx` today

`AgentMark` (152 lines) renders a lucide glyph in a liquid-glass rounded square tinted with a
per-agent hue from the catalog. The hues are:

```
oklch(0.56 0.12 208)  Scout        oklch(0.54 0.115 189) Researcher
oklch(0.58 0.12 236)  Listener     oklch(0.55 0.13 227)  Strategist
oklch(0.53 0.13 245)  Critic       oklch(0.57 0.115 199) Writer
oklch(0.55 0.11 180)  Planner      oklch(0.585 0.12 213) Designer
oklch(0.525 0.12 194) Engineer     oklch(0.55 0.135 241) Reviewer
oklch(0.60 0.12 250)  Announcer    oklch(0.565 0.11 203) Analyst
oklch(0.55 0.12 196)  Chief of Staff
```

Thirteen hues inside `L 0.525-0.60`, `C 0.11-0.135`, `H 180-250`. That is one band of teal-to-blue
sliced thirteen ways, roughly 5° apart. Adjacent pairs (Writer 199 / Analyst 203, Chief of Staff 196
/ Engineer 194) are not distinguishable at 22px by anyone, and the file's own comment concedes it:
"The glyph, not color, distinguishes agents in monochrome and for color-blind users."

So the palette costs thirteen tokens, adds thirteen tinted squares to every screen, and carries no
information. That is the sticker collection, and it is already shipped.

Meanwhile a **second** identity system exists: `AgentChip` in
`src/components/mission/primitives/SurfaceHeader.tsx` renders the agent name as mono uppercase on a
`--voice-machine-faint` tint with **no hue and no glyph**. Two identity systems, one product.

### 4.2 The ruling

> **An agent's identity is its glyph and its name. Colour on an agent mark never means *who*; it
> means *what is happening*.**

| Mark state | Colour | Meaning | Source |
| --- | --- | --- | --- |
| idle | `--ink-muted` monochrome | this agent exists and is not working | default |
| running | glacier shimmer (`.agent-live`, already built) | working right now | `agent_runs.status` in (`running`, `dispatched`, ...) via `agent-fleet.RUN_STATE` |
| waiting on you | ember `--ember` | this agent is blocked on your decision | `agent_approvals` pending for this `agent_id` |
| failed | `--madder-bright` | last run failed and nobody has looked | `agent-fleet` state `attention` |
| benched | 40% opacity, hairline outline, no fill | you turned this agent off | `agents.enabled = false` |

Five states, three colours, and every one of those colours already means exactly that everywhere
else in the product. This satisfies DESIGN-TEMPO §2 restraint, the affordance-≠-emphasis law and
the grayscale test, and it scales to thirty agents without a palette conversation.

It also produces the single best frame in the product: **the Crew Bar with three shimmering marks
against ten quiet ones.** Under the old system that frame is thirteen coloured squares and you
cannot tell who is working. Under this one, you can tell from across the room. Colour earns its
place by being scarce.

### 4.3 `CrewMark` - one component, replacing two

Replace `AgentMark` + `AgentBadge` (`components/agents/`) and `AgentChip`
(`components/mission/primitives/`) with **one** `src/components/crew/CrewMark.tsx` exporting three
things, so a third identity system cannot be invented:

```
CrewMark   glyph only, in a state             sizes 14 / 18 / 24 / 40
CrewChip   glyph + name, inline in prose      the attribution atom
CrewRow    glyph + name + charter + state     roster and pane rows
```

| Size | Where | Anatomy |
| --- | --- | --- |
| 14 | inside a sentence, a receipt line, a lineage chip | glyph only, name follows in text |
| 18 | Crew Bar collapsed roster, Thread step lines | glyph + state dot |
| 24 | crew pane rows, gate cards | glyph + name + one live line |
| 40 | the agent page header | glyph + name + stage numeral + charter |

At 40 only, the mark carries its **stage numeral** (`01` - `07`) in mono beneath the glyph. That is
the tie between crew identity and the Spine: every agent visibly belongs to a stage you already
navigate, and the Chief of Staff is the only mark with no numeral, which is exactly right.

**The glyph set stays as-is** - thirteen distinct lucide marks already chosen and already
tree-shaken (`radar, search, messages-square, target, shield-alert, file-text, list-checks,
pen-tool, code, check-check, megaphone, activity, compass` + crew `zap, archive`). They were doing
all the work anyway. One change: `iconForGlyph` must not silently fall back to `Bot`; an unmapped
glyph is a catalog defect and should fail the build, not render a generic robot next to twelve
specific marks.

### 4.4 The four strings, and only four

Every agent has exactly four user-facing strings. The catalog has three; the fourth is new.

| Field | Status | Rule | Example (Listener) |
| --- | --- | --- | --- |
| `name` | exists, renamed | one word, agent-noun | `Listener` |
| `charter` | exists as `blurb`, rewritten | one sentence, **second person**, says what it does *for you* | "Groups what your customers are saying into themes you can act on." |
| `relayVerb` | exists | present participle, what it is doing now | "clustering customer signals" |
| `handoffLine` | **new** | one noun phrase: what it hands the next agent | "themes, with the raw messages under each one" |

`handoffLine` is the string that turns the relay from a row of glowing squares into a legible chain.
It is what makes `Listener → Strategist` mean something at a glance, and it is derivable from what
the agent actually writes into `HandoffPayload.artifacts`, so it can be checked against reality
rather than asserted.

Today's `blurb` is written about the agent ("Clusters what customers are saying into themes"). The
charter is written to the user. That one grammatical move is most of the difference between a
governance roster and a team.

---

## 5. WHERE THE CREW LIVES

### 5.1 Where I agree with FINAL-ia.md

Fully, and without hedging:

- **ONE ROOM is right, and my angle does not break it.** I do not want a `/crew` destination. The
  IA's test is correct: a destination is where you go to work, and you do not go to the crew to
  work, you work *with* them. An agent is not a place.
- **The depth rail is the right mechanism and its five properties (permanent, counted, keyed,
  addressable, non-destructive) are the right five.** Tile 5 "Who is working" (`c`, `?pane=crew`) is
  the correct URL and the correct key. I keep it exactly.
- **§5.5's cross-cutting Agent spine is the highest-leverage line in the whole IA document**: an
  `AgentChip` on every machine-authored thing, from `artifact_lineage.created_by_agent`, linking to
  the crew. That single wiring does more for agent presence than any dedicated surface, because it
  puts the crew on screens the user was already looking at.
- **§2.2's zero-count law** ("a tile whose count is zero renders its last-event age, not a silent
  grey glyph") is exactly right and I extend it to the crew (§6.4).
- Moving the roster out of `?room=safety&view=team` is right, and non-negotiable.

### 5.2 Where I disagree - three specific corrections

**(a) The crew is not a peer of "What we said".** The IA's rail puts Crew at tile 5 between
"What we made" and "How it is running", one of seven equal 48px tiles. On a product whose entire
positioning is "product managers who ship with agents", the workforce cannot be a sibling of the
conversation archive. The rail tile stays for addressability and keyboard access. But the *primary*
presence of the crew must be a permanent region, not a door.

**The graft: the WorkingStrip becomes the Crew Bar.** The IA already draws this region
(§1.3): `● Engineer is writing tests · 2 agents working · Stop everything`. I am claiming it and
giving it a fixed job.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ◉◉◉◉◉◉◉◉◉◉◉◉◉  ● Engineer  writing the change  src/lib/pricing.ts  ⟨4/9⟩  ■ │
└──────────────────────────────────────────────────────────────────────────────┘
  13 marks, 3 lit      the live locus                     step  stop everything
```

Five properties, deliberately mirroring the rail's five so the shell has one philosophy:

1. **Permanent.** Never conditionally rendered, never `hidden` at any breakpoint. Below `md` the
   thirteen marks collapse to a count chip plus the live locus; the marks never disappear entirely.
2. **Complete.** All thirteen are always present. Not "the agents that are running" - the *crew*,
   with the quiet ones quiet. This is the single pixel that answers "where are the agents".
3. **Honest at rest.** Zero running is not an empty bar. It is thirteen dim marks and one plain
   line: "Nobody is working. The Scout's next sweep is at 2am."
4. **The live locus.** One line, one agent, the verb and the object. Never "Thinking...". §7.
5. **The door.** Clicking any mark opens that agent; clicking the count opens the crew pane. Same
   URL as the rail (`?pane=crew`), same render. Two doors, one home - allowed by the IA's own §2
   law ("rendered in one place, linked from many").

**(b) One agent needs the canvas, so the crew gets a workbench child.** A 420px pane cannot hold a
scorecard with a per-task-type table, a run history, an instruction editor showing an assembled
multi-block prompt, and a tool permission matrix. The IA already made this exact call for the Map:
"A knowledge graph at 420px is a diagram you cannot read. It is the one Brain view that genuinely
needs the canvas." The agent page is the second one, and it passes the IA's own modal-vs-page law on
both limbs: it is worked on for more than a minute (rewriting instructions), and it is handed to
someone outside the loop (a security reviewer asking what the Engineer is allowed to touch).

```
/$ws/$product/crew/$agentSlug   ?tab=record|work|instructions|permissions
```

A sixth workbench child, wearing the full room chrome - TopBar, Spine (run mode when this agent has
a live run), depth rail - with the Thread column replaced by that agent's own step sequence, exactly
as the mission child does. **2 clicks** (`c` → agent), **1 click** from any `CrewChip` anywhere in
the product, which after §5.5 is nearly everywhere.

**(c) Delete the `?config=agents` settings group.** The IA's §2.4 puts `staff` (Roster), `autonomy`
(Autonomy & approvals) and `ai` (Models & keys) in the config overlay, *and* puts `capabilities`,
`agent-scorecard`, `agent-fleet` and `agent-runs` in the crew pane. That is one capability with two
homes, which §2's own law forbids, and it splits the dial from its result across a scrim.

The IA already argued this case and won it, for a different subject (§2.4): "a prompt, a guardrail
and a cap are *how the engine runs*, and their results are read next to them. Splitting definition
from result across two destinations is how `/engine-room` became unreadable." An agent's
instructions and its autonomy arc are the identical case. The result of editing the Engineer's
instructions is the Engineer's next run. The result of moving the Critic's arc is the next gate you
do or do not see. They belong on the agent page, one scroll from the record they change.

| Section today | Goes to |
| --- | --- |
| `agents / staff` (Roster) | The crew pane + agent pages. Deleted from Settings. |
| `agents / autonomy` (Autonomy & approvals) | Agent page → Permissions, per agent. The cross-agent view is the crew pane's Autonomy column. Deleted from Settings. |
| `agents / ai` (Models & keys) | Genuinely account-level. **Stays**, and the group is renamed `?config=models` since it is now the only member. |
| `researcher.functions` watch targets (IA puts these in Settings → Agents → Roster) | The **Researcher's own page**, tab Work, section "What I am watching", edited inline. Same argument: the setting and its output must sit together. The Discover face's "What the crew is watching" strip stays as the second, read-only rendering. |

This removes a group from the overlay, removes a duplicate home, and makes the agent page the one
answer to every question that starts "what is this agent allowed to".

### 5.3 The full home table for the crew

| Thing | Home | URL | Clicks |
| --- | --- | --- | --- |
| Is anyone working right now | **Crew Bar**, permanent | - | 0 |
| The thirteen, at a glance | Crew pane | `?pane=crew` | 1 (`c`, or click the Bar count) |
| One agent, everything about it | Crew child | `/crew/$agentSlug` | 2, or 1 from any `CrewChip` |
| Its record | `?tab=record` | default tab | 2 |
| Its runs and handoffs | `?tab=work` | | 3 |
| What it is told every run | `?tab=instructions` | | 3 |
| What it may do | `?tab=permissions` | | 3 |
| Bench / hire it | Permissions tab, and the crew pane row kebab | | 3 / 2 |
| "May I stop asking about X?" | Gate tray (`g`) **and** the agent's Record tab | `?gate=open` | 1 |
| Who made this artifact | `CrewChip` on the artifact | → the agent | 1 |
| Which agent produced this step | `CrewMark` on the step line | → the trace step | 1 |

Nothing about an agent is more than three clicks from the room, and the two things you do daily
(see who is working, decide a graduation) are zero and one.

---

## 6. THE CREW PANE AND THE AGENT PAGE

### 6.1 The crew pane (`?pane=crew`, 420px)

```
Who is working                                          3 working · 1 needs you
──────────────────────────────────────────────────────────────────────────────
◈ Chief of Staff                                                       running
  Running "Rollout gate for export" · 4 of 9 steps · 6m
──────────────────────────────────────────────────────────────────────────────
01 DISCOVER
◉ Scout        watched 6 sources, last swept 2h ago              approved 31/33
◉ Researcher   idle since Tuesday                                 approved 6/11
◉ Listener     clustering customer signals                       approved 14/15
02 DECIDE
◉ Strategist   idle                                              approved 19/22
◉ Critic       needs you: teardown on "Export v2"                approved 27/30
...
──────────────────────────────────────────────────────────────────────────────
RUNS ITSELF
· Dispatcher   wakes an agent when a source changes         41 events this week
· Archivist    consolidated 8 memories on Sunday
──────────────────────────────────────────────────────────────────────────────
Thirteen agents, one per judgment in the loop.        Instructions and limits →
```

Rules:

- **Grouped by stage, in Spine order, with the stage numerals.** The crew pane and the Spine are the
  same seven stages. Reading the pane teaches the loop a second time.
- **The conductor is above the stages, not inside one.** It is currently filed under `decide` in the
  catalog, which is a data artefact, not a truth. `isConductor()` already exists to special-case it.
- **The second line is either a live verb or an honest silence with an age.** Never blank, never
  "No activity". `agent-fleet.lastActiveAt` gives the age for free.
- **The third column is the record, or nothing.** Under three decided judgments the column is empty,
  not `0/0` and not a hollow trust score. `formatTrackRecord()` already returns `null` for an empty
  record and the UI must respect it.
- **The machinery is visually demoted** (mid-dot, no state colour, no record column) and labelled.
  It is present because a system that quietly does things while you sleep should say so.

### 6.2 The agent page - Record (default tab)

This is the tab that answers "can I trust this thing", and every number on it is computed today.

```
◉  CRITIC                                                          05 · DECIDE
   Red-teams the call before you commit.
   Trusted · it acts, and asks you before anything it cannot undo.
──────────────────────────────────────────────────────────────────────────────
YOUR JUDGMENTS                     OUTCOMES                      REVERTS
approved 27 of 30                  4 of 6 landed                 1
you said no 3 times                2 missed                      you undid its
                                   (2 mixed, not counted)        work once

TRUST 81 of 100, over 36 samples                     suggested: trusted ✓ set
  missions   14 of 15 completed              weighted 0.30
  approvals  27 of 30 approved               weighted 0.20
  evals      mean 0.78 over 9 judged         weighted 0.20
  outcomes   4 of 6 validated                weighted 0.30
  Small samples are pulled toward 50. With 36 samples the pull is small.
──────────────────────────────────────────────────────────────────────────────
BY TASK TYPE                                       (2 or more decided each)
  run a teardown        approved 18 of 19
  score a bet           approved  7 of  9
  write a memory        approved  2 of  2
──────────────────────────────────────────────────────────────────────────────
IT ASKED FOR MORE ROOM                                             2 pending
  "Stop asking before I run a teardown." 5 clean approvals in a row.
  [Let it]  [Keep asking]                                    decide · gate tray
  Approved 12 Jul · stop asking before scoring a bet
  You declined 3 Jul · post to Slack
──────────────────────────────────────────────────────────────────────────────
COST      $4.12 over 14 runs · $0.29 a run · $1.03 per validated outcome
```

Sources, all real: `computeAllAgentTrust` (score + full `TrustBreakdown` + `arc` + `suggested_arc`),
`computeAgentScorecard` (approve, outcome, reverts, `byTool`), `listTrustGraduationProposals` +
`decideTrustGraduation`, `CostPerOutcomeChip` (109 lines, zero importers, homed here and on the
mission child).

Four honesty rules, hard:

1. **Never a rate without its denominator.** "90% approval" is banned; "approved 27 of 30" is the
   only form.
2. **Never a trust score under three samples.** `suggestArc` already returns `observing` below
   three; the UI shows "not enough history yet - 1 judgment so far" and no number.
3. **The shrinkage is stated in plain words, not hidden.** A PM who discovers on their own that a
   fresh agent shows 50 will assume the number is fake. Saying "small samples are pulled toward 50"
   converts a suspicious artefact into evidence of statistical care.
4. **`mixed` verdicts are shown as excluded.** `computeAllAgentTrust` deliberately drops them
   (`trust.server.ts:29-31`). Silently dropping data is how a sceptic decides the numbers are
   curated.

### 6.3 The other three tabs

**Work.** Runs from `agent_runs` (status, mission, step count vs budget, duration, cost), each row
opening the trace child. Beneath it, **handoffs**: what this agent received and what it sent, each
with its evidence count and a peel to the cited rows - `HandoffPayload.artifacts`,
`evidence_ids`, `memory_refs`, all persisted whole in `agent_messages.payload`. A handoff that
asserted artifacts and cited nothing renders its "0 cited" in ember. For the Researcher, this tab
also carries "What I am watching" (`researcher.functions.getResearcherTargets` /
`updateResearcherTargets` - 2 exports, currently zero UI).

**Instructions.** The highest-trust screen in the product, and it is almost entirely built already.
`getCapabilities` returns `instructionsPreview`, assembled by calling the *same* render functions
`loop.server.ts` calls, in the same order (`capabilities.functions.ts:351-362`). Render it as a
stack of labelled, collapsed blocks:

```
What the Critic is told, every run                              4 blocks · 1 yours
┌ Its job ─────────────────────────────────────────── yours, edit ─┐
│ You are the Critic. Red-team the strongest version of the case... │
└──────────────────────────────────────────────────────────────────┘
┌ How we write ─────────────────── from Settings · Voice ─ read only ┐
┌ What we are building ────────── from your Brief ────── read only ┐
┌ House rules that apply to the Critic (2 of 7) ──────── read only ┐
  · Never propose a price change without a comparison
  · Cite at least one customer signal in a teardown        why only 2? →
```

Only the first block is editable; it writes `agents.system_prompt` via `updateAgentInstructions`,
which is the exact column the runtime reads. The other three are the assembled truth, and the "why
only 2?" affordance explains `filterRulesForAgent`. Under the stack, the receipts:
`capability_changes` rows with "you changed this on 12 Jul · 3 runs since".

Nothing else in this product answers "is it really doing what I told it" this directly. It exists
in `src/lib/` and renders nowhere.

**Permissions.** Four controls, all wired:

| Control | Writes | Real effect |
| --- | --- | --- |
| The arc (4 positions, `suggested` marked) | `setAgentArc` → `agent_autonomy.arc` | `resolveApprovalMode` composes it with each tool's own mode, every run |
| Blast radius (`low` / `medium` / `high` / none) | `setAgentToolCap` → `agents.max_tool_risk` | `capToolsByRisk` removes over-cap tools from the agent's prompt entirely - it cannot see them |
| Tool matrix (this agent's tools × auto/confirm/review) | `agent_tool_modes` | the mode the loop resolves at the gate |
| Playbooks | `toggleAgentSkill` → `agent_disabled_skills` | disabled playbooks are never picked at `mission.plan` time |
| **Bench / hire** | **new**: `setAgentEnabled` → `agents.enabled` | **already enforced**: `resolveAgent` filters `enabled=true`; `runAgent:166` refuses |

The matrix draws the safety floors as **locked rows with their reason on the row**, never as absent
rows:

```
  merge a pull request        ● always asks you        locked · never graduates
  revert shipped work         ● always asks you        locked · never graduates
  create a calendar event     ● asks you               locked at minimum
  commit to a branch          ○ runs on its own        build lane, reversible
  open a draft PR             ○ runs on its own        build lane, reversible
```

A locked control that explains itself builds more confidence than an unlocked one. And the three
constants behind those rows (`HIGH_RISK_FORCE_REVIEW`, `HIGH_RISK_MIN_CONFIRM`,
`BUILD_LANE_AUTONOMOUS`) are the strongest safety artefact in the codebase, currently invisible.

**Bench is one server function.** The column exists, the runtime honours it in two places, the HUD
already selects it. `setAgentEnabled` + a `capability_changes` enum value is the whole build. A
benched agent renders at 40% throughout the product with "you benched the Researcher on 12 Jul", and
the Chief of Staff routes around it. That is the cheapest large trust win available.

### 6.4 Empty and cold states

Per the IA's zero-count law, extended to people:

| State | What it says |
| --- | --- |
| Brand new workspace | Crew Bar: thirteen dim marks + "Thirteen agents, none working yet. Say what you are building and the Scout starts." |
| Agent with zero runs | "Has not run yet. It starts when you {the one action}." Never a `0/0`. |
| Agent with 1-2 judgments | "Not enough history yet - 1 judgment so far." No score. |
| Agent with no bound playbooks | Honest: 5 of 13 agents have no playbook station bound (`AGENT_TO_PLAYBOOK_STATION` covers sense/decide/define only - `capabilities.functions.ts:464`). The tab says "No playbooks bound to Build yet" rather than rendering an empty list. |
| Benched agent | Its page still works, everything read-only, with one line and one button: "Benched on 12 Jul. [Bring back]". |
| Nothing running, nothing waiting | "Nobody is working. The Scout's next sweep is at 2am." (`docs/conventions/ui-voice.md` already mandates this shape.) |

---

## 7. THE HARD PROBLEM: AN AGENT'S WORK IS INVISIBLE

A human collaborator can be seen thinking. An agent produces a result after a silence. The two
standard answers both fail:

- **The spinner** says only that something is happening, which is the one thing the user already
  assumes. It cannot distinguish working from stuck, and it discards everything on completion.
- **The streamed wall of text** optimises for *proof of activity* over *proof of progress*. Nobody
  reads it; it scrolls; and afterwards you cannot answer "what did it actually do" without
  re-reading four thousand tokens. It is also the format that makes a slow agent feel slowest,
  because you watch every token of it.

### 7.1 The answer: a declared plan with a moving cursor

Three properties, each from real code.

**(1) A run announces its shape before it starts.** The loop computes `adaptiveStepBudget` *before
the first model call*, and `mission.plan` builds a 1-6 step DAG before dispatch. So the very first
frame of a run can be a plan, not a spinner:

```
Engineer · building "Export v2"                              up to 24 steps
  1 read the repo                                                    ✓ 4s
  2 write the change                                            ● working
  3 run the tests
  4 open a pull request                                    will ask you first
  5 hand to Reviewer
```

That converts a silence into a countdown against a declared intent, and the numbers are real: 24 is
`roleBase("builder")`, the five rows are `mission_steps`, and "will ask you first" is
`resolveToolMode` computed ahead of time, not guessed. A user can see, before anything happens,
where the machine will stop for them.

**(2) A finished step collapses to one plain sentence, permanently, addressably.**
`ToolDef.preview(args)` already produces exactly this sentence for all fifty tools - "Search
workspace: 'export bug'" - and is currently rendered only on approval cards. Reuse it as the step
line everywhere. A nine-step run reads as nine sentences, not nine thousand tokens.

The model's `thought` text is never on by default. It is behind a peel on the step
(`▸ what it was thinking`). Rationale: the thought is the agent's private reasoning and a PM wants
"what did it do". Available for the sceptic; not the default surface for anybody else.

**(3) One live line, and it names agent, verb and object.**
`● Engineer · writing the change · src/lib/pricing.ts` - from `stepLabel()` + `ACTION_LABEL`
(both already in `agent-vocabulary.ts:759-778`) plus the tool args. **Never "Thinking..."**, which is
the word that makes an agent feel like a chatbot rather than a worker.

### 7.2 The detail that makes it honest, and that everyone skips

**A run must say how long it has been silent.** `agent_runs.last_checkpoint_at` is written at every
checkpoint (`loop.server.ts:862`) and already selected by the swarm HUD. So:

```
● Engineer · writing the change · no step for 1m 40s
```

A spinner cannot tell you whether an agent is thinking hard or dead. That number can, it costs
nothing, and it is the single highest-trust detail available in the run surface. Past a threshold it
changes register on its own: "no step for 4m - this one is running long. [Stop it]".

### 7.3 Why this beats the alternatives

The stream produces an unbounded, unreadable, unlinkable artefact that vanishes. This produces a
**bounded, countable, permanent, addressable** one:

- **Bounded** - the budget is known before the run starts and shown.
- **Countable** - "4 of 9" is a real fraction with a real denominator.
- **Permanent** - every step is a `tool_calls` row, so the run reads identically an hour later.
- **Addressable** - step 4 is `?pane=record&pview=traces&item=trc_9` and can be pasted to a
  colleague. A stream has no coordinates.
- **Leavable** - the entire point. You can close the tab. The Crew Bar carries the live locus, and
  the run is intact when you come back.

And the property that matters most for an agent workforce: **silence has a shape too.** Thirteen dim
marks and "the Scout's next sweep is at 2am" is a *presence* at rest. A product where the agents are
only visible while running is a product where the agents are absent 95% of the time, and that is the
founder's complaint restated.

---

## 8. THE SECOND HARD PROBLEM: LEGIBLE TO A SCEPTIC

The question is precise: **"did the agent actually do that, or did it just write about doing it?"**
It deserves a structural answer, not a reassuring one.

### 8.1 Acts and claims are drawn differently, everywhere

> **An act has a receipt. A claim does not, and says so.**

- An **act** is any line with a `tool_calls` row behind it. It renders with a mono receipt id and a
  latency, clickable through to the trace step. `tool_calls` carries
  `id, trace_id, agent_id, tool_name, args, result, ok, error, latency_ms, created_at` - everything
  needed, already joined by `traces.functions.ts:270`.
- A **claim** is model prose with no tool row behind it. It renders in the prose register with **no
  receipt chip**, and it is labelled with the verb `said`.

```
Engineer ran the tests · 42 passed, 0 failed · trc_9#6 · 3.4s
Engineer said the export path is now covered.
```

Two lines, two registers, and the difference between them is visible before it is read. No word of
marketing does this job; a join does. Applied everywhere machine output appears: the Thread, the
step list, the mission child, the artifact card.

The corollary is a rule for us: **never phrase a claim as an act.** "Analysed your codebase" when
the only tool call was `repo.tree` is the exact lie this mechanism exists to prevent, and it is the
lie every agentic demo tells.

### 8.2 Every artifact carries its authorship, with exactly three values

`artifact_lineage.created_by_agent` is already populated and already selected by `getLineage`. Three
stamps, no others:

```
by you
by the Writer
by the Writer, approved by you · 12 Jul
```

The third is the product's thesis in four words, and it belongs on artifacts rather than in a deck.
It answers the founder's "what part is done by agent" at the only place the question actually gets
asked: on the thing itself.

### 8.3 The handoff receipt, and an honest correction

Between agents, `enqueueHandoff` writes an `agent_messages` row whose payload carries `artifacts`,
`evidence_ids` and `memory_refs`. Render each hop as:

```
Listener → Strategist    4 themes    11 signals cited    ▸ see them
```

**But the evidence gate is not armed.** `handoffEvidenceGateEnforced()` reads
`HANDOFF_EVIDENCE_GATE` and returns false unless set (`handoff.server.ts:85`), with a comment
stating that no live handoff carries `evidence_ids` today. So an honest UI must render `0 cited` in
ember when it happens, and the crew room must count it. Claiming "the runtime rejects an
evidence-free handoff" while the flag is off is precisely the kind of statement this whole design
exists to make impossible.

**Build gate:** the `agent.handoff` tool prompts for evidence → live hops carry `evidence_ids` →
flip `HANDOFF_EVIDENCE_GATE=enforce` → the crew room's "cited 0" count goes to zero and stays there.
Only after that is the claim sayable out loud.

### 8.4 The record is the argument

The final answer to the sceptic is not a mechanism, it is the numbers in §6.2, under the four
honesty rules: denominators always, no score under three samples, shrinkage stated, `mixed` verdicts
shown as excluded. Plus the revert count, which is the number a vendor would never volunteer:
**"you undid its work once."** `computeAgentScorecard` computes it from real `artifact.rewind` rows
and deliberately keeps it out of the approve rate. Showing it is the cheapest credibility in the
product.

---

## 9. HOW THE AGENTS TAKE OVER - THE ARC, NARRATED ONCE

The founder asked how the takeover looks. It already exists in code, it is the best agentic story
any competitor could tell, and it renders nowhere.

### 9.1 The true story, not the flattering one

The flattering version is "agents start watched and earn their way to autonomy". That is **false
here**: `loadAgentArc` defaults to `trusted` (founder ruling 2026-07-08). The true version is better
anyway:

> **The agents are trusted from day one. The *tools* are gated. What gets earned, one tool at a
> time, is the removal of a gate - and the machine asks for it, in public, with its record
> attached.**

Four positions, named in the user's words, on the agent page and nowhere else:

| Arc | The words | What it means mechanically |
| --- | --- | --- |
| `observing` | **Shows you everything** | every action queues a review, even reads |
| `proving` | **Asks before it acts** | `auto` tools demote to `confirm` |
| `trusted` | **Acts, asks before anything it cannot undo** | `confirm` tools run inline; `review` tools hold |
| `ambient` | **Runs on its own** | `auto`, with the two floors still absolute |

The floors are named on the same screen, always: merging a PR, reverting shipped work and dispatching
an external builder are `review` forever, at every arc, and the dial says so.

### 9.2 The moment, and where it happens

`maybeProposeTrustGraduations` fires after a clean run: five consecutive `executed` approvals for one
(agent, tool), no `missed` outcome in 30 days, ceilings respected. It writes a
`trust_graduation_proposals` row. Today that row is decided on a surface nobody visits.

It belongs in the ember gate tray, as a gate, in the Thread:

```
◆ The Critic would like to stop asking.

  "Run a teardown" - you have approved it 5 times in a row, most recently
  2 days ago. Its teardowns have landed 4 of 6 times.

  If you let it, teardowns run without stopping for you. Everything it
  cannot undo still asks.

  [Let it]   [Keep asking]                                    see its record →
```

This is the most agentic moment available in any product in this category: the machine asks for more
responsibility, states the evidence, states the blast radius of saying yes, and accepts no without
sulking. `decideTrustGraduation` already exists. It needs a card and a place, and the place is the
tray the user already checks.

### 9.3 Where the crew appears in the seven journeys

I do not redesign FINAL-ia's journeys; I name where the crew is visible in each, so agent presence
is a property of the journey table rather than a bolted-on surface.

| Journey | The crew moment |
| --- | --- |
| J1 what should we build next | Three Discover marks light at once. Three agents working in parallel is the frame that sells the product, and it is real (`agent.spawn` fans out on a split budget). |
| J2 tear this idea down | The Critic, alone, named, with its own record on the card. The wedge has a face. |
| J3 just write the PRD | Writer → Planner handoff line with its `handoffLine` and evidence count. |
| J5 design this | Designer produces; the design critic's notes carry the Designer's chip. |
| J4 build this feature | The mission child's step list with the plan-and-cursor (§7); Engineer → Reviewer handoff; the mid-run tool gate. |
| J6 launch what we shipped | Announcer, in your voice, with the honest Copy-not-Post edge on the same card. |
| J7 how did it land | Analyst, and the graduation proposal often fires here because outcomes just resolved. |

And **first light** (FINAL-ia §3.2): the Crew Bar is on frame one with thirteen dim marks. That is
the ten-second answer to "where are the agents", and it costs one region that is already in the
IA's drawing.

---

## 10. WHAT TO BUILD, IN ORDER

Phased so each phase ships something a sceptic can check.

**P1 - identity (no new data).**
1. Rename `SPECIALIST_CATALOG[].name` for 11 agents + 2 crew; rewrite `blurb` → `charter` in second
   person; add `handoffLine`. One file.
2. `src/components/crew/CrewMark.tsx` replacing `AgentMark`/`AgentBadge`/`AgentChip`. Monochrome
   identity, colour-as-state. Delete the 13 `hue` fields from the catalog.
3. Fail the build on an unmapped glyph instead of falling back to `Bot`.

**P2 - presence.**
4. The Crew Bar: claim the WorkingStrip region, thirteen marks always, live locus, honest idle line,
   silence age from `last_checkpoint_at`.
5. `CrewChip` wired to `artifact_lineage.created_by_agent` on every machine-authored thing
   (the IA's §5.5 Agent spine).
6. The three authorship stamps on artifact cards.

**P3 - the crew room.**
7. Crew pane at `?pane=crew`, stage-grouped, conductor above, machinery below, honest empties.
8. Agent child route `/crew/$agentSlug` with the four tabs.
9. Record tab from `computeAllAgentTrust` + `computeAgentScorecard`, under the four honesty rules.
10. Instructions tab rendering the existing `instructionsPreview` block stack.
11. Permissions tab: arc, blast radius, tool matrix with locked floors, playbook toggles.
12. **New:** `setAgentEnabled` server fn + `capability_changes` enum value. Bench is otherwise done.
13. Delete `?config=agents`'s `staff` and `autonomy` sections; rename the group `?config=models`.
    Move researcher targets onto the Researcher's Work tab.

**P4 - legibility.**
14. Act-vs-claim rendering on every machine-output line; `ToolDef.preview` as the universal step
    sentence; thought behind a peel.
15. The declared-plan-with-cursor run view on the mission child and in the Thread.
16. Graduation proposals as gate cards in the tray and on the Record tab.
17. `CostPerOutcomeChip` mounted on the Record tab and the mission child.

**P5 - the honest gate.**
18. `agent.handoff` prompts for evidence; handoff rows render cited counts; when live hops carry
    evidence, flip `HANDOFF_EVIDENCE_GATE=enforce`. Only then is the runtime-rejection claim sayable.

**Tests that keep it true.**
- `crew.test.ts`: every active catalog entry has a distinct glyph, a distinct name, a charter in
  second person, a `handoffLine`, and a name that is not a stage name.
- `crew-identity.test.ts`: no agent-identity component sets a per-agent colour; the only colours on a
  `CrewMark` are the five state tokens.
- `honesty.test.ts`: no rendered rate string without a denominator; no trust score rendered when
  `breakdown.samples < 3`.
- The existing `agent-vocabulary.test.ts` extends to the rename.

---

## 11. HANDOFF TO THE OTHER TWO TRACKS

**To the choreography track (how a run narrates itself):** I own who they are, their record and
their controls. You own the moment-to-moment. Take from me and treat as fixed:

- the four strings (`name`, `charter`, `relayVerb`, `handoffLine`) - do not invent a fifth;
- the four voice registers and the **only-the-Chief-of-Staff-says-"I"** rule;
- act vs claim, and the ban on phrasing a claim as an act;
- the declared-plan-with-cursor pattern and the silence age;
- colour on an agent means state, never identity.

Open for you: what the Thread says between steps, the gate card anatomy, the parallel-agent frame in
J1, the interruption rule (FINAL-ia §5.7 gives the Brain exactly one licence to interrupt; I have not
claimed a second for the crew and would argue against one).

**To the language track:** three rules I am asking you to enforce in the lexicon:

- **stages are verbs, agents are agent-nouns** (`-er`/`-ist`/`-or`) - this is the collision fix and
  it must be a lint, not a convention;
- **`ran` vs `said`** as the receipt vocabulary;
- **no rate without a denominator**, product-wide, not only on agent surfaces.

Names I have already ruled out and why, so they are not re-proposed: Voice, Echo, Herald, Scribe
(costume); Publisher, Marketer (out-claim the wiring - this product copies, it does not post).

**To whoever reconciles with FINAL-ia.md:** three asks, one deletion, no new destination.

1. The WorkingStrip becomes the Crew Bar with the five properties in §5.2(a).
2. A sixth workbench child, `/crew/$agentSlug`, on the same width argument the Map already won.
3. Delete `?config=agents`'s `staff` and `autonomy`; rename the group `?config=models`; move
   researcher targets to the Researcher's page.

Everything else in FINAL-ia stands. ONE ROOM survives this document intact - the crew did not need a
destination, it needed a region, a face, a record, and four dials that already work.
