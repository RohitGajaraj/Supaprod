# Lane C: The Human-Agent Contract

> _Created: 2026-07-28 · Last updated: 2026-08-03_

> Rebuild sweep, 2026-07-28. Angle: the division of labour and how it is communicated.
> Every file, line, column, enum and function named below was read or queried against this repo
> this session. Where the brief or an earlier rebuild document was wrong, the corrected fact is
> carried, not the claim.
>
> **Founder mandate this document answers (verbatim):** *"We are saying Supaprod is built for
> product managers who ship with agents... And where is that agents part coming into picture for
> us? Nowhere."* And: *"Don't just go by my words. You make the right decisions, take the right
> call."*
>
> **Scope discipline.** This lane owns: attribution, the gate moment, the trust arc, delegation,
> the first ten seconds, and the contract language. It does not own the shell geometry (that is
> the IA lane), the lexicon (Lane A of `language/`), or the visual system (`craft-law.md`,
> `docs/design/archive/tempo-v5.md`). Where it touches those, it says so and defers.

---

## 0. THE RULING, IN ONE PAGE

**The interface currently models the crew as a liability to audit rather than as the workforce the
customer came for. That inversion is not an oversight. It is a doctrine, written down, and it is
still enforced by a comment in the code.**

`src/components/governance/AgentRosterPanel.tsx:1-8`:

> *"This is where WE (and the power user) manage agents; **the end user never sees this roster,
> only the relay**."*

And at line 113:

> *"The full mesh lives here. **The user never sees this roster**; they meet these agents in
> motion, as the relay, named for what they do."*

That doctrine is the Engine-Room doctrine (`docs/conventions/engine-room-doctrine.md`: "calm
front, deep engine, all machinery behind one door") applied to the wrong noun. It was right about
`mission.dispatch`, `fanout depth`, `p95`, `checkpoint`. It was wrong about the crew.

**The override, and it is the whole of this document in one line:**

> **Mechanism is machinery and stays behind the door. Labour is not machinery. Who did the work
> is chrome.**

Three consequences follow, and everything in sections 3 to 11 is their detail:

1. **Attribution becomes a permanent property of every object, not a place you visit.** A
   `Byline` on every artifact header and every row leading edge, same position, same size, always
   rendered, never a hover. Section 4.
2. **The crew becomes a region of the shell, not a tile.** The bottom strip stops being a status
   line and becomes the crew line, permanently occupied, honest when quiet. Section 6.
3. **The trust arc becomes visible on the agent mark itself,** so an agent's earned standing is
   readable everywhere its byline appears, with no new surface at all. Section 8.

None of the three needs a new destination. That is deliberate: a `/crew` page would be empty most
days, and Lane A of `language/` correctly bans a "meet the crew" grid outright
(`lang-a-lexicon.md` section 6.5, rule 1). Agents do not become visible by getting a room. They
become visible by being **on everything they touched**.

---

## 1. GROUND TRUTH, VERIFIED THIS SESSION

### 1.1 The surface, as it exists

| Fact | Verified at |
| --- | --- |
| `/agents` is a pure redirect stub to `/engine-room?room=safety&view=team` | `src/routes/_authenticated.agents.tsx` (9 lines, `beforeLoad` throws a redirect) |
| `/swarm` is the same redirect, to the same place | `src/routes/_authenticated.swarm.tsx` |
| The roster component lives under `governance/` | `src/components/governance/AgentRosterPanel.tsx` (149 lines) |
| `src/components/agents/` contains exactly two files | `AgentMark.tsx` (152 lines), `AgentRelay.tsx` (279 lines) |
| `AgentChip` / `AgentAvatar` / `AgentIdentity` appear in 5 files, all under `components/mission/` | `CrewDrawer.tsx`, `primitives/GateChip.tsx`, `primitives/PulseLine.tsx`, `primitives/SurfaceHeader.tsx`, `primitives/index.ts` |
| `AgentMark` is imported by 6 non-catalog files | `AgentRelay`, `AgentScorecardPanel`, `AgentRosterPanel`, `PresenceChip`, `JudgmentLane`, `ReceiptsStrip` |
| The `agent-fleet` query appears in 11 files, and in 6 of them it is a presence chip | `DiscoverSurface`, `PlanSurface`, `brain`, `build.index`, `design`, `learn`, `ship`, `FleetView`, `PresenceChip` |

So the crew is filed under governance, reachable only through a room named Safety, and rendered on
the working surfaces as a chip that says how many agents exist.

### 1.2 The substance, as it exists

The engine is not the problem. Every mechanic below is real, populated, and shipping today.

| Mechanic | Where | What it gives this design |
| --- | --- | --- |
| The catalog: 12 seats + 1 conductor + 2 machinery entries + 20 deprecated aliases | `src/lib/agent-vocabulary.ts`, `SPECIALIST_CATALOG` | Stable slugs, per-agent hue and glyph, present-tense relay verb, one-line blurb |
| The loop: adaptive step budget, per-step checkpoint, pause on approval, clean resume | `src/lib/ai/loop.server.ts` (1698 lines), `budget.ts`, `agent_run_checkpoints` | A **known step bound before the run starts** and a resumable pause. Section 6. |
| The plan: a 1 to 6 step DAG built before work begins | `mission.plan` in `tools/orchestrator.server.ts`, table `mission_steps` (`idx`, `depends_on`, `agent_slug`, `sub_goal`, `status`) | **The single most valuable asset in this document.** Section 6.2. |
| The typed handoff, evidence required | `src/lib/ai/handoff.server.ts` (714 lines), `enqueueHandoff`, `validateHandoff`, `HandoffRejectedError` | A real seam between agents, and a runtime that can reject an unsupported claim |
| The trust score, from four real signals with Bayesian shrinkage | `src/lib/ai/trust.server.ts`, `computeAllAgentTrust` | Mission success 30%, approval acceptance 20%, eval mean 20%, **validated outcome rate 30%** |
| The four-rung arc, with human names already chosen | `agent_autonomy.arc`; `src/lib/trust-ladder.ts` | Supervised, Reviewed, Trusted, Autonomous |
| Per-(agent, tool) graduation, human-accepted only | `trust_graduation_proposals` + `agent_tool_modes` (migration `20260707230000_sw4_trust_ramp.sql`) | An agent can **earn** the right to stop asking, and the earning is recorded separately from a grant |
| The graduation generator, with a real downside guard | `maybeProposeTrustGraduations` in `reflection.server.ts`; `trust-ramp.ts` (`TRUST_RAMP_CLEAN_N = 5`, `TRUST_RAMP_OUTCOME_WINDOW_MS = 30d`) | A `missed` outcome in the last 30 days blocks every proposal for that agent |
| Safety floors that the dial can never loosen | `resolveToolMode` in `loop.server.ts:153`; `HIGH_RISK_FORCE_REVIEW = {studio.pr.merge, studio.revert, delegate.openhands}` | The claim "trust never buys a dangerous shortcut" is provable |
| Static blast radius and reversibility per tool | `src/lib/tool-consequences.ts`, `toolConsequence()`, `REVERSIBILITY_LABEL` | Consequence copy that is **not model output**, so it can be stated flatly |
| Outcome-named action labels | `ACTION_LABEL` in `agent-vocabulary.ts` (`studio.stage` renders as "drafting changes") | A tool name never leaks to a user |
| The scorecard, including revert rate | `src/lib/agent-scorecard.ts`, `REVERT_TOOL = "artifact.rewind"` | We can show how often a human undid an agent's shipped work |
| Ten gate families federated into one queue and one decide entry point | `src/lib/approvals-queue.functions.ts`, `decideApprovalItem`, `sendBackApprovalItem`, `snoozeApprovalItem` | `trust_graduation` is **already** a gate kind. Section 8. |
| Unattended work, already queryable | `getRecentExecutedUnattended` in `today.functions.ts:883`; `ExecutedCard.tsx` (547 lines, **zero importers**) | The payoff exhibit of the trust arc, currently dead |
| The human-at-gate flywheel | `src/lib/gate-signals.functions.ts`, `recordGateSignal` / `getGateSignals` | Written, and **called from nowhere**. Section 8.5. |

**Everything needed to make the crew feel alive and competent is already computed. Almost none of
it is rendered.** That is the gap this lane closes.

### 1.3 The finding the brief did not have, and it is the important one

**Artifact rows carry no author.** Checked every artifact table in
`src/integrations/supabase/types.ts`:

```
prds            : no created_by_agent, no authored_by
opportunities   : no created_by_agent (has roadmap_last_agent_slug, a different thing)
signals         : no created_by_agent
themes          : no created_by_agent
studio_changesets: no created_by_agent
deployments     : triggered_by only, and it is not an agent slug
```

The only agent attribution that exists today:

| Column | Table | Written by |
| --- | --- | --- |
| `created_by_agent` | `artifact_lineage` (the **edge**, not the row) | `recordLineage`, called from 8 non-test modules only |
| `decided_by_agent_slug` | `decisions` | the decide paths |
| `recorded_by_agent_slug` | `learnings` | outcome recording |
| `agent_slug` | `agent_runs`, `agent_approvals`, `mission_steps`, `agent_memory`, `agent_messages` | the loop |
| `agent_id` | `tool_calls`, `ai_events` | the runtime chokepoint |

So attribution today is a property of the **edge and the run**, not of the thing. `SpecDetail.tsx`
already proves the workaround and its fragility: it reaches for
`lineageQuery.data?.ancestors[0]?.created_by_agent` to find who drafted a spec. If no lineage edge
was written, the spec has no author at all.

**A persistent, unmissable attribution grammar therefore requires a schema change. It is small,
and it rides a migration the IA already schedules. Section 4.4 specifies it exactly.** Any design
that claims attribution without this is claiming a thing the database cannot answer.

---

## 2. WHERE I AGREE AND DISAGREE WITH `ia/FINAL-ia.md`

I read it in full. It is a good document and it is right about the thing it was asked to be right
about. It is wrong about one thing, and the thing it is wrong about is the founder's complaint.

### 2.1 Agreed, and adopted without change

- **ONE ROOM.** Correct. A crew destination would be the dashboard failure in new clothes, and it
  would be empty on a quiet day, which trains you to stop looking (the document's own argument at
  section 1.5, "Approvals as a destination"). I am not asking for `/crew`.
- **Hidden is a function of silence, not depth** (section 10). This is the sharpest sentence in
  the rebuild and it is the reason my answer is "put the crew on everything" rather than "give the
  crew a page".
- **The gate object renders three ways from one query** (section 2.7). Correct, and section 7 of
  this document builds the ceremony on top of exactly that contract.
- **`trust_graduation` is already one of the ten gate families.** So the graduation ceremony has a
  home the moment the tray exists. I add the card, not the plumbing.
- **P4 (the lineage back half) is a hard gate.** Agreed, and my authorship columns ride the same
  migration so there is one schema pass, not two.
- **The `ChainStrip` carries the `AgentChip` for `artifact_lineage.created_by_agent`** (section
  5.3). Right instinct. Section 4 of this document makes it a law rather than one component's
  behaviour, and fixes the fact that the underlying column is often null.

### 2.2 Disagreed, with the correction

**Disagreement 1: "Who is working" must not be a tile among seven.**

`FINAL-ia.md` section 2.2 puts the crew at depth rail tile 5, key `c`, `?pane=crew`, sitting
between "What we said" (threads) and "How it is running" (engine). That is a large improvement on
the Safety room. It is still wrong in kind.

A tile is a **place you go to see a thing**. The claim being made is that the crew is doing the
work, everywhere, continuously. The correct rendering of a continuous fact is not a door. Putting
the crew behind key `c` says: the work is over here, and the workers are over there. That is the
same split as `governance/`, moved 48 pixels.

**Correction, and it is narrow:**

| | `FINAL-ia.md` | This lane |
| --- | --- | --- |
| Tile 5 label | "Who is working" | **"The crew's record"** |
| Tile 5 job | live presence + roster + scorecards + capabilities + autonomy | scorecards, autonomy, capabilities, graduation history, per-agent run history. **The record, not the presence.** |
| Tile 5 count | agents working right now | **open graduation proposals, plus agents whose standing changed this week.** A count of things that changed, which is what a rail count is for |
| Live presence | tile 5's count | **the WorkingStrip, promoted to a first-class region.** Section 6 |
| Who did this | `ChainStrip` on entity views | **`Byline` on every object, every row, every header, enforced by test.** Section 4 |

Net: the rail keeps seven tiles, the shell keeps six regions, no destination is added. What
changes is that presence moves to the region that is already looking at the user, and identity
moves onto the objects.

**Disagreement 2: the Spine should carry the crew.**

`FINAL-ia.md` section 3.2 calls the Spine "the single most important pixel in the product: on
frame one you can see the whole thing you bought". Correct. And then the Spine is drawn as seven
stage names with seven state words underneath, and there is no agent anywhere in it.

If the first frame is the argument, and the argument is "agents ship here", then the first frame
must contain agents.

**Correction:** each Spine node carries the mark of the agent that owns that stage, at 14px, under
the stage name. It is real data (`castByStation()` returns the seat for a stage; the live occupant
is `SwarmAgent.latest_run`). It costs one row of 14px glyphs. It converts the most important pixel
in the product from a diagram of a process into a diagram of a **team running a process**, which
is the entire difference the founder is asking for.

Grayscale-safe (glyph shape, not hue, is the differentiator, per the 2026-07-11 accent restraint
ruling already encoded in `AgentMark.tsx:1-11`). Quiet by default: idle marks render at 45%
opacity, the live one at full with the existing `.agent-live` shimmer.

**Disagreement 3: first light contains no crew at all.**

`FINAL-ia.md` section 3.2 describes a brand new user's first frame as: Spine present and quiet,
Thread card asking "What are you building?", canvas showing seven journey cards, WorkingStrip
saying "Nobody is working yet."

**"Nobody is working yet" is the founder's complaint, printed on the first screen of the new
design.** A product whose thesis is that agents do the work should not open by saying that no
agent is doing any work.

Corrected in section 10. The short version: the crew starts one real run at first light, before
the user types anything, and the first frame shows it working.

### 2.3 One thing `FINAL-ia.md` says that I want to strengthen rather than change

Section 5.5 lists four cross-cutting spines, one of which is **Agent**: "an `AgentChip` on every
machine-authored thing, from `created_by_agent`". That is exactly right and it is one sentence in
a table. Section 4 of this document is that sentence, promoted to a law, given a component, given
a schema that can actually answer it, and given a test that fails the build.

---

## 3. THE CONTRACT, IN THREE SENTENCES

Everything else derives from these. They are written to be said out loud, to survive being read by
a sceptic, and to contain no banned category word (`craft-law.md` section 2: no bare "AI", no bare
"agents", no "copilot", no "operating system").

> **1. The crew does the work. You make the calls.**
>
> **2. An agent is a named worker with one job, a track record you can read, and a limit on what
> it may do without asking you.**
>
> **3. You are here for the three calls the crew will never make: what is worth building, what is
> good enough, and what goes live.**

Sentence 1 is the tagline of the division of labour and appears on the sign-in screen and nowhere
else in that exact form (repetition kills it).

Sentence 2 is the definition of "agent" and is the tooltip, the empty state, and the first line of
the crew record. It is provable from the schema, clause by clause: *named worker* is
`SPECIALIST_CATALOG`, *one job* is the exclusive verb (Lane A section 6.3), *track record you can
read* is `computeAgentScorecard`, *limit on what it may do* is `resolveToolMode`.

Sentence 3 names the human's job as three specific decisions, not as "oversight". This matters:
"you stay in control" is what every vendor says and it means nothing. "What is worth building,
what is good enough, and what goes live" maps exactly to the three irreducible gates: the bet
gate (stage 02), the spec and design gates (stages 03 and 04), and `studio.pr.merge` plus
`promoteToProduction` (stages 05 and 06). Those three are the gates the safety floor never lets
an agent take. So the sentence is not a promise, it is a description of `HIGH_RISK_FORCE_REVIEW`.

**The rule that keeps it honest:** if a floor is ever removed, the sentence changes the same day.
Copy that describes a safety property is versioned with that property.

---

## 4. (a) THE ATTRIBUTION GRAMMAR

> **The law: every object a person can look at states who made it, in the same place, at the same
> size, always. Top-left of its own header. Leading edge of its own row. Never a hover, never a
> tooltip, never an information icon.**

### 4.1 Three states, not two, and the third one is the one that matters

Every product that attempts this ships two states, human and machine, and is wrong about the most
common case. The most common case is an agent drafted something and a human changed it. If that
renders as "human", the crew's contribution is erased. If it renders as "agent", the human is
misquoted. Both are lies, and a PM notices within a day.

| State | Rendering | Backed by |
| --- | --- | --- |
| **By an agent** | agent mark (rounded square, 16px) + name | `authored_by_agent` (section 4.4) |
| **By you** | your avatar (circle, 16px) + "You" | `authored_by_agent is null` |
| **Agent drafted, you changed it** | both marks, mark then avatar, joined by a hairline, and the word **edited** as a link | `authored_by_agent` set **and** `human_edited_at` set |
| **Unattributed** | mono grey `unattributed`, honest, no glyph | both null on a legacy row |

**Square versus circle is the differentiator, not colour.** This is the load-bearing craft
decision in the whole grammar. `AgentMark.tsx` already draws a rounded square
(`borderRadius: size * 0.32`); a human avatar is a circle. The distinction survives the grayscale
test (`craft-law.md` section 4), survives colour blindness, and is pre-verbal at 16px. Per-agent
hue stays where the 2026-07-11 ruling put it, inside the small glyph only, so no artifact card is
ever tinted by its author and the restraint budget is untouched.

**The mixed state is a link, and the link is real.** `edited` peels the diff between the agent's
draft and the current text. This is not aspirational: `prds.snapshot_before`,
`opportunities.roadmap_snapshot_before` and `decisions.snapshot_before` are live jsonb columns
holding exactly that. Three of the four densest artifact kinds can already answer "what did you
change". For kinds that cannot, the word `edited` renders as plain text with no link, and the
peel is not offered. Never a dead affordance.

**The unattributed state is deliberately ugly.** It is grey, it is mono, and it is the only place
in the product where an object admits it does not know something about itself. That ugliness is a
feature: it makes the migration debt visible, and it converts to a single number in Pulse
(`unattributed artifacts: 412`) that a build lane can drive to zero. Silence is the enemy; an
honest blank is not silence.

### 4.2 The component

```
Byline  ·  src/components/agents/Byline.tsx  (new; the third file in a directory that has two)

props: {
  agentSlug: string | null
  humanEditedAt: string | null
  runId: string | null              // the receipt door
  size: 'row' | 'header'            // 16px | 22px
  verb?: string                     // past simple, from the catalog. "drafted", "flagged"
}
```

Two sizes, no third. `row` renders `[mark] Writer`. `header` renders
`[mark] Writer drafted this  ·  14:32  ·  see the run`.

**The verb is the agent's fingerprint.** Lane A section 6.3 makes each agent's verb exclusive by
constraint, so `Reviewer checked the diff` identifies the actor from the sentence alone even when
the mark is not visible, for example in an email, an export, or a screen reader. Past simple for
a receipt, present continuous for live work (Lane A section 6.2). This lane adopts that grammar
unchanged and does not restate it.

### 4.3 Where the Byline mounts, exhaustively

Not a sample. If a surface renders one of these objects and does not render its Byline, the build
fails.

| Object | Surface | Byline position |
| --- | --- | --- |
| Spec | spec workbench child header; every row in the Plan face list | header; row leading edge |
| Bet | Decide face queue row; the bet's own focus panel | row leading edge; header |
| Pattern | Discover face cluster card | card header |
| Signal | Discover face signal row | row leading edge, **and it is often "You" or a source, not an agent**, which is the point |
| Decision | the gate card at the moment it is made; the Brain pane Calls row | header, showing **both**: `Critic recommended · you decided` |
| Prototype | prototype workbench header | header |
| Run | the run child header; every row in the Build face | header shows the owning agent; each step row shows its own step owner |
| Change | the changeset card | header |
| Release | Ship face row | header |
| Outcome | Learn face | header, and it is usually `Analyst measured · you recorded` |
| Learning | Brain pane row | row leading edge |
| Belief | Brain pane Beliefs row | row leading edge, showing the agent whose run promoted it |
| Memory row | Brain pane Memory tab | row leading edge |
| Receipt | Pulse ledger row | row leading edge |
| Thread message | every message in a Thread | row leading edge |
| Generated copy inside a spec | the citation chip strip | the chip carries the mark |

**The Decision row is the most important line in the table.** A decision is the one object that is
always jointly authored: an agent proposed, a human ruled. Rendering `Critic recommended · you
decided` on every decision is the clearest statement of the contract anywhere in the product, it
requires no new copy, and both halves are already stored (`decisions.decided_by_agent_slug` plus
the deciding user).

### 4.4 The schema this requires, stated exactly

Rides P4 in `FINAL-ia.md` section 8, the same migration that extends `ARTIFACT_KINDS`. One pass,
not two.

```sql
-- Attribution becomes a property of the thing, not only of the edge that made it.
-- null authored_by_agent = a human made it. Never defaulted, never backfilled to a guess.
alter table public.prds
  add column if not exists authored_by_agent text,
  add column if not exists authored_by_run   uuid references public.agent_runs(id),
  add column if not exists human_edited_at   timestamptz;

-- identical three columns on:
--   opportunities, themes, signals, studio_changesets, deployments, prototypes
-- decisions and learnings already carry decided_by_agent_slug / recorded_by_agent_slug;
-- they gain authored_by_run and human_edited_at only.
```

Three rules that make it stay true:

1. **No default.** A `default 'human'` on a nullable author column would silently mislabel every
   agent write that forgets to set it. Null means unknown, and unknown renders as `unattributed`.
   Fail loud, not wrong.
2. **One write helper.** `setAuthorship({kind, id, agentSlug, runId})` called from the tool
   registry's write path and from `recordLineage`'s callers, so the row and the edge cannot
   disagree. A test asserts that every insert into an artifact table inside
   `tools/registry.server.ts` passes through it.
3. **`human_edited_at` is set by the save path, not by the agent.** Any human save on an object
   with a non-null `authored_by_agent` stamps it. That is one line in each save function and it is
   the thing that makes the mixed state honest.

Backfill: derivable for every row that has an `artifact_lineage` edge with a non-null
`created_by_agent`. Everything else stays `unattributed` and shows in the count. **Do not guess.**

### 4.5 Enforcement

```
byline.test.ts   fails when an entity renderer named in the 4.3 table does not mount <Byline/>
                 fails when <Byline/> is rendered inside a hover, popover, tooltip or details element
authorship.test.ts
                 fails when an artifact insert in tools/registry.server.ts bypasses setAuthorship
```

Same mechanic as `FINAL-ia.md`'s `chain.test.ts`, deliberately, so there is one enforcement idiom
in the rebuild and not two.

### 4.6 Attribution has to survive leaving the app

A sceptic's second test, after "is this real", is "does this hold up outside your product".

- **Copy out.** Copying a spec appends one line: `Drafted by Writer on 12 Jul, edited by Rohit
  Gajaraj on 13 Jul. Receipt: run 41.` Plain text, no markup, no branding.
- **Public share pages** (`/d/$slug`, `/p/$slug`, `/t/$slug`) carry the Byline in the header. A
  decision shared with a stakeholder shows that Critic argued against it and you shipped it
  anyway. That is the most credible thing this product can put in front of an executive.
- **Generated text never claims authorship in first person.** No "I drafted this". Section 11.

---

## 5. THE TWO REGISTERS: WHAT THE CREW DID VERSUS WHAT IT SAID

This is the answer to the sceptic, and it is a typographic law before it is a feature.

> **A product manager evaluating this will ask: did the agent actually do that, or did it just
> write about doing it?**

Almost every agentic product fails this question because it renders both answers in the same
typeface. A model saying "I have reviewed the codebase" and a tool call that actually read 41
files look identical in a chat transcript. Once a user catches one instance of the first
masquerading as the second, they stop believing all of it, permanently.

**The law:**

> **Two registers, never mixed. What the crew DID renders as a receipt. What the crew SAID renders
> as a quotation. They never share a typographic treatment, and no line is ever both.**

| | DID | SAID |
| --- | --- | --- |
| Source of truth | `tool_calls` (`ok`, `latency_ms`, `result`, `error`), plus the artifact row it wrote | `agent_messages`, `ai_events.output_preview`, the model's `thought` steps |
| Typeface | mono for the id and the count, sans for the label | sans, quoted, indented |
| Anatomy | `[mark] Scout read 41 pages · 12 signals · 14:31 · tc_8813` | `[mark] Scout: "Two of these look like the same complaint."` |
| Has a door | always, to the step and then to the external artifact | to the run step only |
| Can be wrong | it can have failed, and it says so | it is an opinion and is labelled as one |
| Appears in a receipt export | yes | no |

A sceptic scanning a run sees, without being taught, which lines are evidence and which are
narration. That distinction is worth more than any amount of streamed text, and I have not seen a
competitor draw it.

**The corollary rule, and it is strict:** a UI string may never assert an action unless a
`tool_calls` row backs it. If the model said it opened a pull request and no `studio.pr.open` row
exists, the UI says the model claimed it and no call was recorded. That is an ugly sentence and it
should be, because the alternative is the product lying on the model's behalf.

### 5.1 The receipt ladder: four rungs, one click each

Every claim of agent work must be inspectable down to something that is not ours.

| Rung | What | Backed by |
| --- | --- | --- |
| 1 | **Who.** The Byline. | `authored_by_agent` |
| 2 | **What, when, and an id.** The receipt line. | `tool_calls` row: `tool_name`, `latency_ms`, `ok`, `created_at` |
| 3 | **The step.** Args in, result out, error if any, the model call that chose it. | the trace child, `?step=n`; `agent_run_checkpoints.step_index`; `ai_events` |
| 4 | **Someone else's server.** The pull request on GitHub. The deployment URL. The source page. | `studio_changesets.pr_url`, `deployments.deploy_url`, `signals.url` |

**Rung 4 is what closes the argument.** The chain ends on a system we do not control. A PM who
clicks through from a Supaprod receipt to a real pull request on their own GitHub org is finished
doubting, and it takes four clicks from anywhere in the product.

Every one of those columns is live today. This rung costs a link, not a feature.

### 5.2 The crew must report what it could not do

A product that only reports success is a brochure.

- `agent_runs.failure_kind`, `halted_at`, `halted_reason` exist. `anyToolStepFailed` already
  prevents a run where every tool errored from being written as `completed` (the fix noted at
  `loop.server.ts:236`). Surface that: a failed run reads **`Run 41 gave up. Engineer could not
  read the repo: token expired.`** with the reconnect door.
- `outcome.functions` states plainly what it cannot measure. Keep that wording verbatim and do not
  soften it.
- The Learn face says `record how it landed`, never `we measured how it landed`. Already the
  IA's ruling (section 4.2 J7); restated here because it is the same law.

### 5.3 The negative receipt, which is the strongest exhibit available

`src/lib/gate-signals.functions.ts` is fully written and called from nowhere. It records every
time a human corrected the crew at a gate. `FINAL-ia.md` P4 already requires wiring it.

Render the aggregate **next to the agent's trust score**, not hidden in an analytics view:

```
Writer            trust 78
  You approved 14 of 17.  You sent 3 back.
  What you changed most: the success metric, 3 times.
```

No vendor volunteers "here is how often our thing was wrong". That is exactly why it converts.
`agent-scorecard.ts` already computes the sibling number, the revert count, from the real
`artifact.rewind` signal, and its own header comment is explicit that it refuses to claim zero
rollbacks without a signal. That posture is correct and this design extends it.

---

## 6. THE INVISIBILITY PROBLEM: RENDERING WORK THAT CANNOT BE SEEN

> **A human collaborator can be seen thinking. An agent produces a result after a silence.**

### 6.1 Why the two common answers fail

**The spinner** says something is happening. It carries one bit of information and it carries that
bit for as long as the work takes, which on a real build is minutes. A spinner running for four
minutes reads as a hang.

**The streamed wall of text** says a great deal is happening and nobody reads it. It fails for a
specific reason worth naming: it renders **effort**, and effort is not what a colleague reports. A
colleague does not narrate their thinking. They say what step they are on, against a plan you both
already agreed to.

Both fail because the product does not know the plan, so it shows the process instead.

### 6.2 The answer: we render the plan, not the process

**We know the plan.** `mission.plan` builds a 1 to 6 step DAG **before any work starts**, and
persists it to `mission_steps` with `idx`, `depends_on`, `agent_slug`, `sub_goal` and `status`.
That is not a log. It is a small, fixed, named set of steps with named owners, available before
the first token is generated.

This is the single most valuable unrendered asset in the codebase and it is the reason this
product can answer the invisibility problem better than a chat-shaped competitor can. A chat
product cannot draw the plan first because it does not have one until the work is over.

So a run renders as five lines that were written before it started, filling in:

```
Run 41 · Fix the checkout redirect                              step 3 of 5

  ✓  Writer      read the spec and the two prior redirect bugs      8s
  ✓  Planner     broke it into 3 changes                            6s
  ●  Engineer    writing the change · 4 files so far               1m 12s
  ·  Reviewer    checks the diff against the spec
  ·  Engineer    opens the pull request                      needs your call
```

Six honest properties, all from real columns:

1. **The last two lines exist before they happen.** From `mission_steps`, so the user knows the
   shape of the work and where it ends. This is the difference between waiting and watching.
2. **`needs your call` is drawn on the future step**, resolved from `resolveToolMode` for that
   agent and tool. **The user can see the gate coming before they reach it.** No product does
   this, and it costs one pure function call.
3. **Each finished line ends in a noun**, never a verb phrase: `3 changes`, `4 files`, `41 pages`.
   From the tool result, not from prose.
4. **Elapsed time per step**, from `tool_calls.latency_ms`. Slow is legible instead of frightening.
5. **The owner is the agent, with its mark.** The crew is visible as a sequence of named people
   handing work along, which is exactly the founder's "how the agents take over".
6. **No percentage.** Percentages are the fake part of every progress UI. `step 3 of 5` is true.

### 6.3 When there is no DAG, say so and degrade honestly

A single-agent run with no mission has no `mission_steps`. Do not draw a fake plan.

Degraded rendering, which is still better than a spinner because both numbers are real:

```
  ●  Scout   reading your sources · step 4 of up to 24 · 38s
```

`up to 24` is `adaptiveStepBudget({agentSlug, arc, plannedStepCount})`, computed before the run
starts (`budget.ts`: role base 6, builder 24, orchestrator 14 plus 2 per planned step, arc bonus
0 to 4, ceiling 40). `step 4` is `agent_run_checkpoints.step_index`, written before every provider
call. Both are facts. The phrase `up to` is doing honest work: the budget is a ceiling, not an
estimate, and the copy must never imply otherwise.

### 6.4 The crew line: promoting the WorkingStrip

`FINAL-ia.md` gives the WorkingStrip one line of its drawing:
`● Engineer is writing tests · 2 agents working · Stop everything`. Right idea, undersized. It is
the only region of the shell whose entire job is the crew, and it is currently a footnote.

**Promote it to the crew line: a permanent 44px region, always occupied, never a placeholder.**

| State | What it renders | Source |
| --- | --- | --- |
| One run | `[mark] Engineer is writing the change · step 3 of 5 · Run 41` and, on the right, `stop` | `getSwarmHud` (`SwarmAgent.latest_run`), `mission_steps` |
| Two or more | the marks of every working agent, then the most recent verb, then `and 2 more` which expands the strip to 3 rows | `SwarmHud.agents` |
| A handoff in the last 30s | the two marks with the arrow between them, held for 6 seconds, then settling to the receiver | `agent_messages` (`from_agent_slug`, `to_agent_slug`) |
| Waiting on you | ember: `[mark] Reviewer is waiting on your call` and the call opens from here | `agent_approvals` pending, `PAUSE_ON_APPROVAL_TOOLS` |
| **Quiet** | **`Nobody is running. Scout checks your 4 sources at 2am, and Research is watching 3 competitors.`** | `researcher.functions.getResearcherTargets`, routines |

**The quiet state is the one that decides whether this design works.** A crew line that says
"idle" teaches the user the crew is a feature they turn on. A crew line that names what is being
watched and when it next wakes teaches them the crew is always employed. Both halves are real
data. `getResearcherTargets` currently has no rendered home at all (`FINAL-ia.md` section 2.7
lists it as an orphaned server-function domain); this is a second, better home for its output, and
it does not conflict with the Discover face home the IA assigns, because that one is the editable
setting and this one is the ambient statement.

`AgentRelay.tsx` already implements two thirds of this (`variant="mini"`, the station line, the
handoff arrow, the ember gate treatment, the shared query key so mounting it twice costs nothing).
It is rebuilt into the crew line, not written from scratch. `variant="station"` is deleted, because
Lane A deletes the word `station` from the product entirely.

**`stop` must be real.** `cancelMission` exists in `missions.functions.ts:504` with a terminal
guard. A stop on a non-mission run has no server function today. Either add `haltRun` or do not
render `stop` for that case. **Do not render a control that cannot act.** Flagged in section 12.

### 6.5 The three motion rules for the crew line

Against `craft-law.md` section 2 (motion that confirms, never performs):

1. **The shimmer is the only continuous motion in the product.** `.agent-live` already exists and
   is applied only while an agent is genuinely running. Nothing else in the shell may loop.
2. **A handoff animates once, for 6 seconds, then settles.** It is information (work changed
   hands), and once you have it, repeating it is noise.
3. **Transform and opacity only. No `linear`, no `ease-in-out`.** A new mark entering the strip
   slides 4px and settles, because a real thing settles.

---

## 7. (b) THE GATE: THE SIGNATURE MOMENT

> **Approving something must visibly set the crew in motion. This is the emotional core of
> shipping with agents, and today it is a toast that says "Approved."**

Verified: `src/routes/_authenticated.approvals.tsx:34` maps `trust_graduation: "Approved."`
`decideApprovalItem` routes to nine resolvers and returns `{ok: true}`. That is the entire
ceremony for the most important act in the product.

### 7.1 The Commit: four beats, about 1.2 seconds, every beat information-bearing

The design is not the click. The design is the 1.2 seconds after it.

**Beat 1, 0 to 180ms. The card does not vanish. It becomes a receipt.**

It collapses in place to one line and rewrites itself:

```
You approved · Engineer opens the pull request · 14:32 · run 41
```

**This is the most important single detail in this document.** An approval that erases itself
teaches the user that their judgment left no trace. Judgment is the product. It must leave a mark
on the screen at the moment it is made, and that mark is a receipt with the same anatomy as every
other receipt in the product (section 5), so the user learns one shape.

**Beat 2, 180 to 450ms. The handoff draws.**

The receipt line grows a short arrow to the mark of whoever picks the work up:
`You approved → [mark] Engineer`. Real data, three sources depending on the gate family:

- A paused tool gate: the run that resumes. `PAUSE_ON_APPROVAL_TOOLS` plus `resumeAgentLoop`.
- A queued handoff: `agent_messages.to_agent_slug` from `enqueueHandoff`.
- A spec or design gate: the next `mission_steps` row whose `depends_on` is now satisfied.

**If nothing picks it up, no arrow, and the line says what changed instead.** A house rule
approved reads `Now a standing rule. It will stop the crew next time.` A memory candidate reads
`The crew will recall this.` Never an arrow to nowhere.

**Beat 3, 450 to 800ms. The crew line takes it.**

The bottom region updates to carry the new verb and the receiving mark slides in. The user's eye
follows the arrow down. This is the "crew in motion" feeling, and it costs zero new surface
because the crew line is already there.

**Beat 4, 800 to 1200ms. The Spine acknowledges.**

The stage node that owns this work moves from ember to working, and the ember count on the rail
decrements. `getLoopState` already computes stage state; the IA's batched `getRailCounts`
decrements optimistically.

Total: 1.2 seconds, four regions, one causal chain the eye can follow from the card, to the
receipt, to the arrow, to the strip, to the Spine. Nothing decorative. Remove any beat and
information is lost, which is the `craft-law.md` test for whether motion earns its place.

### 7.2 Why this is better than a toast

A toast confirms **that your click registered**. The Commit renders **what your click caused**.
That difference is the entire product thesis expressed as an interaction. It is also the cheapest
possible demo moment: it is one click, it is on the main screen, and it is real.

### 7.3 The failure path is rehearsed, because a fake success is worse than a failure

If the write succeeds but the resume fails, or the run was already terminal, or the PR could not
open, beat 1 still writes the receipt and the receipt goes honest immediately:

```
You approved · the run had already stopped · nothing ran · why
```

No arrow, no beat 3, no beat 4. **Never a success animation over a failed write.** This is the
sceptic test (section 5) applied to our own ceremony, and it is the one thing that makes the
successful animation trustworthy.

### 7.4 Send back: the counter-ceremony, and the proof that judgment steers

`sendBackApprovalItem` requires a note (`z.string().min(1)`, verified). Send-back is only offered
on `REVISABLE_KINDS` (`spec`, `design_gate`); every other family is binary. So the ceremony is
scoped honestly and the button is absent, not disabled-with-a-shrug, elsewhere.

Same four beats, different content:

```
You sent it back · "the success metric is wrong, it should be activation not signups"
                 → [mark] Writer is rewriting with your note
```

And the crew line quotes the note while the rework runs:

```
[mark] Writer is rewriting · "the success metric is wrong"
```

**Seeing your own words drive the machine is the single most convincing demonstration of the
contract in the product.** It is also nearly free: the note is already persisted to
`approval_feedback` and already fed to the agent.

### 7.5 Decline, and the third verb

Lane A section 1.4 fixes three judgment verbs: **Approve**, **Send back**, **Decline**, with
**Snooze** as a secondary control, not a peer. This lane adopts that unchanged. The contract
addition is only the consequence line under each, which comes from `tool-consequences.ts` and is
therefore **static, not model output**, and can be stated flatly:

```
Approve      Opens a draft pull request on the repo. Nothing merges.
Send back    Writer rewrites with your note. The draft is kept.
Decline      Killed, and the reason goes to the Brain as a decision not to do it.
```

`REVERSIBILITY_LABEL` is already computed per tool. Use it verbatim. Do not paraphrase a safety
property.

### 7.6 The empty queue is the payoff, not a blank

When the tray empties, it must not say "You are all caught up". That is a stock line and it wastes
the best moment in the trust arc.

```
Nothing needs you.

The crew ran 6 things on its own since Tuesday.
  Reviewer   checked 4 diffs                    all clean
  Scout      pulled 112 signals from 4 sources
  Engineer   opened 1 pull request              you merged it

                                              see all 6 · ask me next time
```

Every row from `getRecentExecutedUnattended` (`today.functions.ts:883`), rendered by
`ExecutedCard.tsx` (547 lines, currently zero importers, the largest orphan in the repo by line
count). `ask me next time` is the claw-back, placed at the exact moment doubt occurs. Section 8.4.

---

## 8. (c) THE TRUST ARC AS A FIRST-CLASS PRODUCT MECHANIC

This is the strongest available demonstration that this is an agent-native product and not an
interface over a model. Almost all of it is already built. None of it is legible.

### 8.1 What exists, precisely, so the design does not overclaim

Two independent axes, and conflating them is the easiest mistake to make here:

| Axis | Stored | Set by | Scope |
| --- | --- | --- | --- |
| **The rung** | `agent_autonomy.arc` | `setAgentArc`, a human click; plus a background nudge that only ever promotes observing to proving to trusted, never to ambient | per agent |
| **The graduated mode** | `agent_tool_modes` (`source: 'graduation' \| 'operator'`) | **only** `decideTrustGraduation` on human acceptance | per (agent, tool) |

Composed at run start by `resolveToolMode` (`loop.server.ts:153`), in strict order: seeded mode,
then the arc dial, then `HIGH_RISK_FORCE_REVIEW`, then `HIGH_RISK_MIN_CONFIRM`, then the low-risk
auto-clear, then the contract-consent clear. `review` is sticky. `studio.pr.merge`,
`studio.revert` and `delegate.openhands` never graduate.

Default arc for an agent with no row is **`trusted`**, not `observing` (founder ruling 2026-07-08,
`trust.server.ts:250-254`). The copy must match that. An agent does not start out supervised, it
starts out trusted and can be tightened. Any onboarding line that says "your agents start on a
short leash" is false.

The four rungs already have human names in `trust-ladder.ts`: **Supervised, Reviewed, Trusted,
Autonomous.**

### 8.2 Making the arc visible everywhere, at zero surface cost

> **The agent's rung is drawn into its mark, as a hairline ring of filled quarters. Zero to four.**

Because section 4 puts the mark on every object in the product, this makes an agent's earned
standing readable **everywhere its byline appears**, without one new surface, one new page, or one
new click.

Constraints honoured:

- **Shape, not colour.** Passes the grayscale test. Passes for colour-blind users. Consistent with
  the 2026-07-11 accent-restraint ruling that keeps hue inside the glyph only.
- **Static, always. It never animates.** A ring that moves reads as a progress spinner, which is
  the exact wrong meaning. One idiosyncratic detail per surface (`craft-law.md` section 3), and
  this is it.
- **Legibility floor, stated honestly.** Four quarter-arcs at 1px are not readable below 16px. The
  ring renders at 16px and above only. Below that, the mark is bare and the rung is available in
  the crew record. Do not pretend a 12px ring communicates.

### 8.3 The graduation, which is the moment the product earns its category

It is already a gate family (`trust_graduation`, `filterBucket: "gates"`), so it arrives in the
ember tray with everything else. Only the card changes.

Today's card title, verbatim from `approvals-queue.functions.ts:474`:
`Let the agent run drafting changes without asking`, with evidence `12 clean approvals in a row.`

That is honest and it undersells by a mile. Rewrite as a plain, third-person statement with the
receipts inline:

```
────────────────────────────────────────────────────────────────
 [mark]  Reviewer wants to stop asking.

 Checking the diff        12 times in a row, you approved with no changes
 Last 30 days             no outcome came back missed
 If you say yes           Reviewer checks diffs without stopping.
                          Nothing else changes.
 If you say no            nothing changes, and it will not ask again
                          for 30 days.

 [ Let it ]   [ Not yet ]                          see all 12 →
────────────────────────────────────────────────────────────────
```

Four things make this card work and each is backed:

1. **The evidence is countable and clickable.** `see all 12` opens twelve `agent_approvals` rows
   with their tool name and decided_at. A sceptic can audit the claim in one click.
2. **The downside guard is stated as a fact, not a reassurance.** "no outcome came back missed" is
   `TRUST_RAMP_OUTCOME_WINDOW_MS` doing real work: a `missed` learning attributed to this agent in
   the last 30 days blocks every proposal for that agent
   (`maybeProposeTrustGraduations`, step 2). Say what the machine actually checked.
3. **"Nothing else changes" is true and provable.** Graduation is per (agent, tool). It does not
   move the arc and it cannot touch a `HIGH_RISK_FORCE_REVIEW` tool. Users need this sentence
   because their fear is that saying yes once opens everything.
4. **"Not yet" is a real state, not a rejection.** See the required change below.

**Required change, and it is small: a cooldown.** Today `decideTrustGraduation(accept: false)`
writes `status: 'rejected'` and nothing stops `maybeProposeTrustGraduations` from proposing the
same pair again as soon as another clean streak accrues. So the words "it will not ask again for
30 days" would be a claim ahead of the wiring, which this repo bans. Add to
`shouldProposeGraduation` in `trust-ramp.ts`: no proposal for an (agent, tool) pair with a
`rejected` proposal inside `TRUST_RAMP_COOLDOWN_MS = 30d`. One predicate, one test.

The reason to build it rather than reword the card: **an agent that respects "not yet" is a
colleague, and an agent that asks again next Tuesday is a nag.** That distinction is the whole
emotional difference between this mechanic working and this mechanic being turned off.

### 8.4 Granting, revoking, and the distinction nobody else can draw

**Earned versus granted is stored and must be shown.** `agent_tool_modes.source` is either
`'graduation'` or `'operator'`. So the crew record can say, truthfully:

```
Reviewer
  checks the diff            without asking        earned 12 Jul, after 12 clean runs
  reads the repo             without asking        you granted 3 Jul
  opens the pull request     asks you first        always. This one never graduates.
```

Three rows, three different provenances, all real. The third row is the safety floor rendered as
a promise, and it is the row that makes the first two feel safe to have.

**The claw-back is a real gap in the code and it is a safety problem.** Verified: `setAgentArc`
moves the rung, but a graduated per-(agent, tool) mode lives in `agent_tool_modes`, which the loop
overlays at run start. There is no server function that deletes such a row. **A user can grant and
cannot ungrant.** That is not acceptable for a mechanic whose entire premise is reversible trust.

Required:

```ts
revokeTrustGraduation({ agentSlug, toolName })
  // deletes the agent_tool_modes row
  // writes a capability_changes receipt so the reversal is on the record
  // does NOT delete the approved proposal: the history stays
```

**Where the claw-back lives, and this is the design decision that matters:** not in settings. On
**any receipt of unattended work**, as a quiet `ask me next time`. You see a thing the crew did
alone, you did not like it, you revoke it right there. That is where the feeling occurs, so that
is where the control belongs. Placing it in a settings page means it is used by people who are
already angry, and by then they have decided.

Its ceremony is deliberately gentle:

```
Reviewer will ask you again before checking a diff.
Its 12 clean runs stay on its record.
```

**Revoking must not read as punishment.** The record survives, and saying so is what makes people
willing to grant in the first place. A trust system where withdrawal is expensive is a trust
system nobody enters.

### 8.5 The number to lead with, and it is not the completion count

`computeAllAgentTrust` weights **`outcome_validated_rate` at 30%**, joined from `learnings.verdict`
through `decisions.decided_by_agent_slug`. That is: did the work this agent decided on actually
turn out well, once real signal came back.

Every agent product on the market can show "142 tasks completed". Almost none can show:

```
Strategist
  Of the 9 bets it ranked that shipped, 6 landed.
  You approved 14 of 17.  You sent 3 back.
  You undid its work twice.
```

Line 1 is `outcome_validated_rate`. Line 2 is `approve` from `computeAgentScorecard`. Line 3 is
`reverts`, from the `artifact.rewind` signal that `agent-scorecard.ts` was built to count.

**Lead with line 1, and never bury line 3.** A product that volunteers how often you undid its work
is the only kind a sceptic believes, and `agent-scorecard.ts` already refuses to claim zero
rollbacks without a signal, which is the right posture to extend.

The 0 to 100 trust score itself is shown small and second, with its four inputs on hover, because a
composite number is an argument and the three sentences above are evidence. Evidence first.

### 8.6 The trust arc is introduced by receipt, never by tutorial

Lane A section 6.5 rule 4: an agent's first appearance is what it just did, never a card
explaining what it does. The arc obeys the same rule. There is no "meet your agents' trust levels"
onboarding. The first time a user hears about the arc is the first graduation card, which arrives
only after five clean approvals of the same tool, which means it arrives at the exact moment they
have earned the right to find it interesting.

---

## 9. (d) THE DELEGATION GESTURE

One input, three grammars, and the routing is shown before it runs.

### 9.1 Type plainly: the Chief of Staff routes, and shows its work

The composer (`⌘J` in the IA's split) takes plain language. `journeyForIntent` in `journeys.ts`
already matches "what should we build next", "tear it down", "prd", "launch", "how did it land".

**As you type, a routing preview appears above the composer**, showing the marks of the agents
that will run, in order. This is the single cheapest way to make the crew visible during the most
common interaction in the product.

**And it must be labelled as a guess until it is not.** The preview from `journeyForIntent` is a
prediction. The real plan is the DAG from `mission.plan`. So:

```
before dispatch    likely  [mark] Writer → [mark] Planner
after mission.plan running [mark] Writer → [mark] Planner → [mark] Engineer → you
```

The word `likely` is deleted the moment `mission_steps` rows exist, and the preview is replaced by
the real plan. **Never present a guess in the same typography as a plan.** This is section 5's law
applied to our own UI, and if we break it here we have no standing to enforce it anywhere.

### 9.2 Type `@`: name the agent

`@` opens a picker of the twelve seats plus the Chief of Staff, each with mark, name, and its
exclusive verb. `@Critic tear this down` runs Critic directly and skips routing.

**This is the one place in the product where the whole crew is enumerable**, and it satisfies Lane
A's ban on a "meet the crew" grid because it is a picker in context at the moment of use, not a
roster page you visit. You learn the crew by reaching for one.

The picker is ordered by loop stage, so the number line the user already learned from the Spine is
the memory hook (`05 Engineer`), per Lane A section 6.5 rule 2.

### 9.3 The gesture that matters and nobody has: hand an object to an agent

From any object's Byline kebab, or any row's overflow: **`Hand to...`**

Because the natural motion is not "type a task". It is **this thing, that person**. A PM does not
open a chat box to ask a colleague to review a spec. They send the spec.

This is `agent.handoff` given a human front door, and there is a happy accident in the runtime
that makes it easier rather than harder: `enqueueHandoff` requires `evidence_ids`, and a
human-initiated handoff **is** anchored on a concrete artifact, so the payload passes the evidence
gate by construction (`{kind, id}` of the object being handed). A runtime invariant that usually
constrains a design is, here, the reason the design is trivially correct. Say so in the build
ticket so nobody weakens the gate to make the gesture work.

Consequence line before it runs, from `tool-consequences.ts` where the target tool is known:
`Critic will red-team this spec and post a verdict. Nothing changes until you act on it.`

### 9.4 Refusing is a gesture too, and it is scoped to what is wired

Honest boundary: today the only per-agent capability control is playbook-level
(`agent_disabled_skills` via `toggleAgentSkill`, and it genuinely affects the next
`mission.plan` through `pickPlaybookForAgentStation`), plus the arc dial and the graduated modes.
There is no "never use Researcher for this product" switch.

So the offered gestures are exactly three, and no more:

1. **Tighten an agent's rung** (`setAgentArc`), from the crew record.
2. **Revoke one graduated permission** (`revokeTrustGraduation`, section 8.4), from the receipt.
3. **Turn off one playbook for one agent** (`toggleAgentSkill`), from the crew record.

Do not offer a fourth until it exists.

### 9.5 Stop

`cancelMission` is real. A stop on a bare run is not. Section 12 lists it. The rule stands: **do
not render a control that cannot act.** A `stop` that does nothing is worse than no `stop`,
because it is the fastest way to teach a user that the visible controls are decorative.

---

## 10. (e) THE FIRST TEN SECONDS

> The test: what does a brand new user see that makes "agents ship here" **undeniable** rather
> than asserted?

### 10.1 The sign-in screen states the contract, because right now it says nothing

Verified: `src/routes/login.tsx:106` reads `title="Welcome back"`. `signup.tsx:184` reads
`title="Create your workspace"`. Neither screen contains one word about what this product does.
The first surface a user ever sees is silent about the entire thesis.

```
Sign in
  The crew builds. You decide.

Sign up
  Thirteen named agents run your product loop, from a customer complaint
  to a pull request. Every one of them stops at your call.
  Every one of them leaves a receipt.
```

Checks: no bare "AI", no bare "agents" (qualified both times), no "copilot", no "operating
system", no "platform", no "seamlessly". Two concrete nouns a PM recognises, "a customer
complaint" and "a pull request", which together name the span of the loop without listing seven
stages. "Leaves a receipt" is the sceptic's hook and it is redeemable in the first minute.

The number thirteen is safe to state because Lane A section 6.5 makes it a hard cap: a fourteenth
requires deleting one.

### 10.2 First light: the crew starts before the user types

**`FINAL-ia.md` section 3.2 has the new user's WorkingStrip read "Nobody is working yet. Pick a
journey or just say what you want."**

That sentence is the founder's complaint printed on the first screen of the new design, and I am
overriding it.

**The mechanic: sign-up completes, the room paints, and the Chief of Staff starts one real run
immediately, without being asked.**

Not a demo. Not a canned animation. A real `researcher` run against the product name or URL given
at sign-up, or against nothing at all if there is nothing (the IA's own J1 already establishes
that with no sources the Researcher fetches market signal first). It costs credits, it produces
real `signals` rows, and it takes roughly twenty seconds, which is precisely the window in which
a new user is reading the screen anyway.

So the first frame is not a quiet skeleton. It is:

| Region | First light, corrected |
| --- | --- |
| Spine | seven stages, each with its owning agent's mark beneath it. **01 Discover is already working**, its mark shimmering |
| **Crew line** | `[mark] Scout is reading the web for what people say about Relay · 18s` |
| Thread | one card, below |
| Canvas | the seven journey cards, per the IA, unchanged |
| Depth rail | counts at zero with their one-line invitations, per the IA, unchanged |

And the Thread's first card is not an abstract question, it is an aiming question for work already
in flight:

```
Scout is already working.

It is reading the web for what people say about Relay.
About twenty seconds.

Tell it what you are building and it will aim better.
[ ................................................ ]
```

**The difference between asserting and demonstrating is one server call at first light.** The user
does not read that agents work here. They watch one work while they type.

`MissionOnboarding.tsx` (6.4KB, currently stranded at `/start`, which nothing links to) is the
component: it already asks one question and calls `saveBrief` then `finish()`. It mounts here, per
the IA's own ruling, with its copy rewritten to the above.

### 10.3 Second 20 to 60: the receipt that ends the argument

The run finishes and the Thread card is replaced by the first receipt:

```
[mark] Scout read 41 pages and found 12 signals. Two of them say the same thing.

  "checkout keeps logging me out"     reddit.com/r/...      3 days ago
  "session expires mid-purchase"      g2.com/...            1 week ago

                                                    see all 12 · what next?
```

Two things are happening. Every URL is real and leaves the app (receipt ladder rung 4, section
5.1). And the sentence "two of them say the same thing" is the first evidence of judgment rather
than retrieval, which is the difference between this and a search box.

**A sceptic who clicks one real URL in the first minute is converted.** That is the whole
onboarding strategy and it needs no tour, no checklist, and no modal.

### 10.4 What first light must never do

- **No roster grid.** Banned by Lane A section 6.5 rule 1, and rightly: thirteen faces on frame
  one is a cast list for a play nobody has watched.
- **No tour, no coach marks, no "here is your AI team" modal.** The crew is introduced by receipt
  (Lane A rule 4). A product that has to explain its own workforce does not have one.
- **No progress checklist.** "3 of 7 steps to get started" is the dashboard failure wearing a
  costume.
- **No fake activity.** If the first run fails (no network, no credits, a bad key), the crew line
  says so plainly and offers the fix. A simulated agent on the first screen would poison every
  claim in section 5, permanently, for one user's first twenty seconds.

---

## 11. (f) THE WORDS

Lane A of `language/` owns the lexicon and the crew names, and this lane does not relitigate them.
Adopted unchanged: the thirteen names (Scout, Researcher, Listener, Strategist, Critic, Writer,
Planner, Designer, Engineer, Reviewer, Publisher, Analyst, Chief of Staff), the grammar (stages are
verbs, agents are nouns, no article, present continuous for live, past simple for a receipt,
"the crew acts" not "agents are working"), and the judgment verbs (Approve, Send back, Decline,
with Snooze secondary).

What follows is only the contract vocabulary, which Lane A does not cover.

### 11.1 The three sentences, and where each one lives

| Sentence | Lives |
| --- | --- |
| **The crew does the work. You make the calls.** | sign-in screen, and the crew record header. Nowhere else. |
| **An agent is a named worker with one job, a track record you can read, and a limit on what it may do without asking you.** | the definition, wherever "agent" is first explained: the crew record, the `@` picker footer, the empty state of the crew tile |
| **You are here for the three calls the crew will never make: what is worth building, what is good enough, and what goes live.** | the gates tray header, and the autonomy section of the crew record |

### 11.2 The contract vocabulary

| Concept | The words | Never |
| --- | --- | --- |
| An agent doing work with no gate | **without asking** | autonomously, unsupervised, hands-free, on autopilot |
| An agent that has to stop | **asks you first** | requires approval, is gated, needs permission, is restricted |
| Work done while you were away | **on its own** | automatically, autonomously, in the background |
| Permission the agent won | **earned**, with the date and the streak | unlocked, upgraded, levelled up, promoted |
| Permission you gave | **you granted**, with the date | enabled, allowed, configured |
| Taking it back | **ask me next time** | revoke, disable, restrict, downgrade, demote |
| The thing that will never graduate | **always asks. This one never graduates.** | hard-locked, protected, admin-only |
| A run that failed | **gave up**, with the reason | encountered an error, failed to complete, something went wrong |
| A run that was stopped by policy | **stopped by your rule**, naming the rule | blocked by guardrail, policy violation, halted |
| Model text | **said** | thinks, believes, feels, reckons |
| Tool output | **did**, with the count | performed, executed, completed successfully |

### 11.3 Banned in anything the crew says or that we say about the crew

On top of `craft-law.md` section 2 and Lane A section 3.

**Anthropomorphic feeling.** `Critic thinks`, `Engineer is excited`, `happy to help`, `I'd love
to`, `great question`. The rule: **agents state what they did and what they need. They never state
how they feel.**

**First person, at all.** No `I`, no `we` from an agent. Third person with a name, always:
`Writer drafted the spec`, never `I drafted the spec`. Two reasons and both matter. It keeps the
frame honest (a system did work and left a record, it is not a character talking to you), and it
makes attribution survive being copied out of the product, because the actor is in the sentence
rather than in the chrome.

The one deliberate exception: `the crew` may take a plural verb in shell copy that is genuinely
about all of them (`the crew is working`). Never `we`.

**Effort as achievement.** `worked hard on`, `spent 4 minutes analysing`, `carefully reviewed`.
Elapsed time is a fact and appears as a number in a receipt. It is never an argument for quality.

**The word "just".** `just a moment`, `just wanted to check`, `it just needs your approval`. It
apologises for the product's central act.

**"Autonomous" as an adjective.** Use it only where a mode is literally `auto`. `Autonomous` is
the name of the top rung and nothing else. Never "autonomous product management".

**Vendor comfort language.** `you are always in control`, `human in the loop`, `AI-assisted`,
`with full transparency`. Each of these is a claim every competitor makes. Replace each with the
specific mechanism: not "you are always in control" but "opening the pull request always asks you
first".

### 11.4 Three model sentences, for calibration

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

## 12. WHAT IS MISSING IN CODE, AND WHAT IS NOT

The honest build list. Everything in the left column is real today. Everything in the right column
is not, and no copy in this document depends on an unbuilt thing without saying so.

### 12.1 Already built, only unrendered (the cheap half)

| Capability | Where |
| --- | --- |
| Per-agent identity: name, hue, glyph, verb, blurb, stage | `agent-vocabulary.ts` |
| Live presence, per-agent latest run, handoffs, pending approvals, throughput | `getSwarmHud` |
| Trust score from four signals with shrinkage, plus suggested rung | `computeAllAgentTrust`, `suggestArc` |
| Four-rung ladder with human names | `trust-ladder.ts` |
| Graduation proposals and the human-only acceptance path | `trust_graduation_proposals`, `decideTrustGraduation` |
| Graduation generator with the missed-outcome guard | `maybeProposeTrustGraduations`, `trust-ramp.ts` |
| Safety floors that no dial can loosen | `resolveToolMode`, `HIGH_RISK_FORCE_REVIEW` |
| Per (agent, task type) approve rate, outcome rate, revert count | `computeAgentScorecard` |
| The pre-computed plan: 1 to 6 named steps with owners | `mission.plan`, `mission_steps` |
| The step bound, known before the run | `adaptiveStepBudget` |
| Per-step checkpoint index | `agent_run_checkpoints.step_index` |
| Static blast radius, reversibility, and undo path per tool | `tool-consequences.ts` |
| Outcome-named action labels | `ACTION_LABEL` |
| Unattended-work list | `getRecentExecutedUnattended`, `ExecutedCard.tsx` (0 importers) |
| Typed handoff with a runtime evidence gate | `enqueueHandoff`, `validateHandoff` |
| The joint author of a decision | `decisions.decided_by_agent_slug` |
| Draft-versus-current diffs on the three densest kinds | `prds.snapshot_before` and siblings |
| Cancel a mission | `cancelMission` |

### 12.2 Must be built (the honest half)

| # | What | Size | Why it is load-bearing |
| --- | --- | --- | --- |
| **B1** | `authored_by_agent`, `authored_by_run`, `human_edited_at` on 7 artifact tables, plus `setAuthorship` and the backfill | migration + one helper + write-path edits | Section 4 is impossible without it. Rides P4. |
| **B2** | `Byline` component, three states, two sizes, plus `byline.test.ts` | one component, one test | The attribution grammar itself |
| **B3** | `revokeTrustGraduation({agentSlug, toolName})` | one server fn + a `capability_changes` receipt | **Today a user can grant and cannot ungrant. This is a safety gap, not a polish item.** |
| **B4** | Graduation cooldown: no re-proposal for 30 days after a rejection | one predicate in `trust-ramp.ts` + a test | Without it, "Not yet" is a lie and the mechanic becomes a nag |
| **B5** | Wire `gate-signals`: every `decideApprovalItem` and `sendBackApprovalItem` writes a signal | 2 call sites | Section 5.3, and `FINAL-ia.md` P4 already requires it |
| **B6** | The crew line: rebuild `AgentRelay` as a permanent shell region with the quiet state | one component | Section 6.4. The quiet state is the part that must not be skipped |
| **B7** | The Commit: four-beat gate resolution, including the failure path | interaction work on the tray plus optimistic rail decrement | Section 7, the signature moment |
| **B8** | Run rendering from `mission_steps` with `needs your call` resolved by `resolveToolMode` | one component | Section 6.2, the invisibility answer |
| **B9** | First-light auto-run: dispatch one real `researcher` run at first paint | one call at first light + the failure copy | Section 10.2 |
| **B10** | Agent marks on Spine nodes | 14px row on an existing component | Section 2.2, the first frame |
| **B11** | Trust ring on `AgentMark`, 16px and above only | one prop | Section 8.2 |
| **B12** | `haltRun` for a non-mission run, **or** do not render `stop` in that case | one server fn, or zero | Section 9.5. Either is acceptable. Rendering a dead control is not. |
| **B13** | Routing preview above the composer, with the `likely` to real-plan swap | one component | Section 9.1 |
| **B14** | `Hand to...` on the Byline kebab, building a `HandoffPayload` with the object as `evidence_ids` | one dialog | Section 9.3 |

B1 through B5 are the ones without which the rest is decoration. B3 and B4 are the two that are
also correctness issues, not just design gaps.

---

## 13. HANDOFF TO THE OTHER TWO LANES

**What I own and have decided.** The attribution grammar and its schema (section 4). The two
registers, did versus said (section 5). The gate ceremony (section 7). The trust arc as an
experience, including the two code gaps it exposes (section 8). The delegation gestures (section
9). First light (section 10). The contract vocabulary (section 11).

**What I take from others and do not touch.** Crew names, the exclusive verb per agent, the
grammar of agent sentences, and the judgment verbs: all from `language/lang-a-lexicon.md` section
6. The shell's six regions, the depth rail, the URL scheme, the workbench children, and the
migration phases: all from `ia/FINAL-ia.md`. The visual laws: `craft-law.md` and
`docs/design/archive/tempo-v5.md`.

**What I hand over, marked, so it is not decided twice.**

| To | Item | My position, stated once |
| --- | --- | --- |
| The lane owning presence and the run surface | The crew line is a permanent 44px region, not a status string. Its quiet state names what is being watched and when it wakes. | Section 6.4. The quiet state is non-negotiable; a crew line that ever reads "idle" defeats the whole design |
| The lane owning the run surface | Runs render as the pre-computed DAG, with future steps and their gates drawn before they happen. No DAG means the degraded two-number rendering, never a fake plan. | Section 6.2 and 6.3 |
| The IA lane | Three narrow overrides to `FINAL-ia.md`: tile 5 becomes the crew's record not its presence; the Spine carries agent marks; first light starts a real run instead of saying "Nobody is working yet". | Section 2.2. Everything else in the IA is adopted intact |
| Whoever owns the tray | The gate card does not disappear on decide. It becomes a receipt, in place, permanently. | Section 7.1, beat 1. This is the detail I would defend hardest |
| Whoever owns Pulse | `unattributed artifacts` is a real count with a target of zero, and it belongs in Pulse | Section 4.1 |
| Whoever owns the build queue | B3 (revoke) and B4 (cooldown) are correctness, not polish, and should not sit behind design work | Section 12.2 |

---

## 14. THE RISKS I AM TAKING, NAMED

| # | Risk | Why it is real | What I would do about it |
| --- | --- | --- | --- |
| R1 | **The Byline is on everything, and everything gets noisier.** Sixteen surfaces gain a 16px mark and a name. | The restraint budget is a real law here, and I am spending a lot of it in one place | It buys the founder's central complaint, so it is the right place to spend it. Mitigation: the mark is the only coloured element, the name is grey at 12.5px, the verb appears only at header size. If it still reads busy, drop the name in row context and keep the mark alone; the glyph is the recognisable part |
| R2 | **The trust ring is illegible at small sizes and may read as a spinner.** | Four quarter-arcs at 1px on a 16px square is genuinely marginal | 16px floor, stated. Static, never animated, stated. Test it against the crew record's own 22px rendering before shipping the 16px one. If it fails, the ring is dropped entirely and the rung stays in the record only; nothing else in the design depends on it |
| R3 | **The first-light auto-run costs credits on a user who may never return**, and it can fail in front of a brand-new user | Real money and a real first impression | Cap it: one run, researcher only, hard credit ceiling, no repeats. And rehearse the failure copy as carefully as the success copy. A brand-new user seeing "Scout could not reach the web. Connect a source and it will try again." is still better than "Nobody is working yet" |
| R4 | **The Commit is 1.2 seconds of animation on the product's most repeated action.** By the fiftieth approval it could feel slow | This is the classic delight-becomes-friction failure | The four beats are staggered, not blocking: the tray is interactive again at 180ms, when the receipt line lands. Beats 2 to 4 play behind an already-usable screen. And a repeat approval within 10 seconds skips straight to the settled state |
| R5 | **Attribution on a legacy row is often unknown, so the first release ships a lot of `unattributed`.** | Only 8 modules call `recordLineage` today, so the backfill will not cover much | This is the honest cost of not guessing, and the ugly grey label is deliberate. It becomes a countdown, publicly, in Pulse. Deciding to guess instead would make every byline in the product untrustworthy, which costs more than the ugliness |
| R6 | **Section 8's card promises "it will not ask again for 30 days" and that requires B4 to ship.** | Copy ahead of wiring is the exact failure this repo bans | The card copy and B4 ship in the same commit, or the card says nothing about asking again |
| R7 | **The `@` picker is the only enumeration of the crew, so a user who never types `@` never learns the roster exists.** | Lane A's ban on a roster grid is right, but it leaves this hole | Accepted, because nothing is uniquely reachable through the picker. Mitigated by the Spine marks (section 2.2), which show the crew on frame one whether or not anyone types anything |
| R8 | **Making the crew visible everywhere invites the founder's own Engine-Room doctrine to be over-corrected**, and mechanism words leak back onto the calm front | `station`, `mission`, `swarm`, `arc` are all one careless commit away from the front | The override in section 0 is narrow and greppable: labour is chrome, mechanism is not. Lane A's section 1.8 list stays enforced, and `station` is deleted from the codebase, not just from copy |
| R9 | **A user could grant graduations broadly, hit a bad outcome, and blame the product for a permission they gave.** | The mechanic's whole premise is that trust is safe to extend | Three defences, all already in code or in B3: the missed-outcome guard blocks proposals, the safety floors mean the decisive merge gate never graduates, and B3 makes revoking one gesture from the receipt. The card's "Nothing else changes" line is the one that has to be true, and it is |

---

## 15. ONE PARAGRAPH FOR THE FOUNDER

You sign in and it says the crew builds and you decide, which is the whole deal in five words. The
first screen already has someone working on it: Scout is reading the web about your product before
you have typed anything, and you can watch it while you answer the one question. Twenty seconds
later it hands you twelve things people actually said, with links you can click that leave our
product entirely, which is when you stop wondering whether any of this is real. From then on,
every single thing in the app has a face on it: who made it, whether you changed it after, and one
click to the receipt. When the crew needs you, one ember lights, and when you approve, the card
does not vanish, it turns into a receipt that says what you just caused, an arrow draws to whoever
picks the work up, the strip at the bottom starts carrying their verb, and the stage on the spine
moves. That is the moment the product is about. Down at the bottom there is always a line saying
who is working, and when nobody is, it says what the crew is watching and when it wakes up next,
so it never once reads as idle. And over time the agents earn things: after five clean runs of the
same job, one of them asks, in plain words, whether it can stop stopping you, showing you the
twelve receipts that back the request, and if you say not yet it does not ask again for a month.
The ones that earned it wear a small ring you can read at a glance, everywhere they appear. If you
ever regret it, you take it back from the receipt itself, in one click, and its clean record stays.
There is no roster page, no tour, and no screen that explains the crew, because you meet each of
them the same way you meet a good colleague: by seeing what they just did for you, with the
receipt attached.
