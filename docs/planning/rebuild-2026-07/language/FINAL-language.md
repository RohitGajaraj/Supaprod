# FINAL: the Supaprod language contract

> _Created: 2026-07-28 · Last updated: 2026-08-03_

> _Rebuild 2026-07. Decided 2026-07-28 under the founder's full-rename mandate._
> _Merges lang-a-lexicon.md (nouns and renames), lang-b-microcopy.md (sentences, states, numbers),_
> _and lang-c-voice-moments.md (speaker, register, working states, receipts) into one binding file._
>
> **This file is the single authority on what things are called and how the app talks.**
> The three lane files are now historical inputs. Where they disagreed, section 1 records the
> ruling and the reason. Do not read them for a decision; read them only for evidence.

**Precedence.** This file wins over `docs/conventions/ui-voice.md`, `src/lib/agent-vocabulary.ts`,
`src/lib/nav-model.ts`, `src/lib/mission-vocabulary.ts`, and every older strategy or design doc on
naming and copy. It does not override `docs/conventions/humanized-output.md` (the formatting law,
ratified unchanged) or `docs/design/archive/tempo-v5.md` (the visual contract). Section 12 lists every override.

**Scope.** The authenticated app. Public landing and investor materials are governed by the
investor canon in `CLAUDE.md` and are out of scope, with one crossing noted in section 14.

**A note on the banned characters in this file.** Every ellipsis, em dash and en dash below appears
inside backticks, in exactly two places: quoting a bad string verbatim so an implementer can find
it, and stating the ban itself. There are no banned characters in this file's own prose and none in
any string marked "Ship this". A scan that flags this file is reading the evidence, not a
violation.

---

## The three laws everything else falls out of

1. **One concept, one word.** If two words can name the same thing, one of them is deleted from the
   product. Not deprecated. Deleted.
2. **Stages are verbs. Agents are nouns. Objects are a third class and may borrow neither.** This is
   what makes collisions structurally impossible rather than caught in review.
3. **Labels and identifiers may diverge, and the divergence is written down.** A DB column, a query
   key and a route slug are engineering facts. A label is a promise to a user. They may disagree,
   but only on the ledger in section 4, never by accident.

---

## 1. Every conflict between the three lanes, and the ruling

Twenty-two disagreements. Each is decided here with the reason, so nobody relitigates one by
opening the losing lane file.

### 1.1 The big four

| # | The disagreement | Ruling | Why this way |
| --- | --- | --- | --- |
| **R1** | **Pulse (A, C) vs engine room (B)** for the machinery surface | **Engine room.** Label `Engine room`, route `/engine-room`, prose "the engine room". `Pulse` is deleted product-wide, including `pulseSentence()`. | Verified in code: `nav-model.ts:145` ships `label: "Pulse"` on `to: "/engine-room"`, and the file comment at `:28` literally says "Pulse keeps the `/engine-room` route". That is the say-it-out-loud failure written into the source. Two ways to end it. Choosing Pulse renames a route, a component directory, a doctrine file, and the greppable `Engine-Room:` stamp. Choosing engine room renames one string. It also survives the stranger test better: in a nav of Today, Discover, Decide, Plan, Design, Build, Ship, Learn, Brain, Library, `Pulse` is the only word that does not tell a first-time reader what is inside. "Engine room" tells them: the machinery, under the hood, on purpose. It is the founder's own doctrine word (`engine-room-doctrine.md`), so this ruling restores canon rather than inventing one. **This is the one ruling that overrides two lanes out of three; see open question Q1.** |
| **R2** | **Run (A) vs build (B)** for the unit of work | **Run.** `Run 41 · Fix the checkout redirect`. `build` as a noun joins the banned list. | Law 2 decides it. Stage 05 is **Build**, a verb. If the object is also "a build", the word names two things, which is the exact defect that forced Planner and Designer. Second: `agent_runs`, `loop_runs`, `job_runs`, `prompt_runs`, `eval_runs`, `playbook_runs` already exist, so the schema was right and only the UI was wrong. Third, honesty: a run that fails is still a run, and calling a failure "a build" borrows a CI convention we do not otherwise use. Lang C's ban on `run` as plumbing is lifted, because it was written when five nouns competed; once four die, `run` is not plumbing, it is the word. |
| **R3** | **the Ledger (A) vs the record (B, C)** | **The record.** One noun in all app copy. `Ledger` is deleted from every user-facing string including the engine room. Where the seal itself is the object, the words are `sealed` and `tamper-evident`, never "ledger". `ledger_seals` freezes in the DB. | The one-word test does not exempt the engine room; it is still in the app. "On the record" is a sentence a person says; "in the ledger" is a sentence a person reads. See Q3 for the outward-facing tension. |
| **R4** | **Snooze (A) vs Later (B, C)** for deferral | **Snooze.** Button `Snooze`, toast `Snoozed. It comes back in 24 hours.` Not a peer of the three verdicts; a secondary control. Keyboard `z`. | All three lanes independently caught the same live bug: the button says one word and its toast says another (`today.tsx:812` `Later` vs `:647` `Set aside.`). "Later" is not a verb, so under toast grammar it cannot produce a past-tense receipt, which is exactly why the mismatch happened twice. `Snooze -> Snoozed` closes it. Demoted out of the button row because deferring is not judging, and four peers on the highest-stakes card is one too many. This overrides Lang C's do-not-touch entry for `today.tsx:647`. |

### 1.2 The rest

| # | The disagreement | Ruling | Why |
| --- | --- | --- | --- |
| R5 | Settings "Memory": delete (A) vs rename to Retention (B) | **Delete.** | Settled by reading the code, not by argument. `settings.tsx:468-500` shows the section renders one card whose heading is `Memory lives in Brain` and whose body is a link to `/brain`. It holds no setting. A nav section that exists to apologise for its own name is deleted, along with the second apology at `settings.tsx:197`. |
| R6 | `release` agent: **Publisher** (A) vs **Herald** (C) | **Publisher.** | Stranger test. No PM says "Herald". Lang C already named it as the trade it would make first. |
| R7 | Collective: **the crew** (A) vs **your crew** (C) | **Both, split by position.** `Crew` is the label (settings section, roster heading). `your crew` is the form inside every sentence. Never `the crew`, never `the agents`. | Label and sentence are different jobs. Possessive is warmer and is true: it is their crew. |
| R8 | Playfulness: allowed in zero states (B) vs allowed in exactly two places (C) | **C, with the words separated.** **Warmth** is the default register everywhere: plain, specific, unhurried. **Playfulness** is spent in exactly two places, the working-state deck and the cold-start headline. A zero state gets warmth, not a joke. | B's own zero-state examples ("All clear.", "Nothing needs you.") are warm and not playful, so the two lanes wanted the same thing and used one word for two ideas. |
| R9 | Button budget: 3 words (C, ui-voice) vs a 1-to-4 ladder (B) | **3 words for primary and secondary. Up to 5 for quiet/link tier.** | B's evidence (`Save · chat and agent runs use it`) was caused by cramming a consequence into a label, not by the word count; moving the consequence to helper text returns the label to one word. The only place the ladder genuinely needs room is the link tier, where the thing is a fragment, not a button. |
| R10 | Toast budget: 12 words (C, ui-voice) vs 10 split 6+4 (B) | **10, split 6 + 4.** | B argued the split; C only ratified the incumbent number. |
| R11 | Empty state: 2 sentences (C, ui-voice) vs a four-slot anatomy (B) | **B's anatomy, C's ceiling.** Four slots; the prose slot is capped at 2 sentences; the meta line and the action do not count against it. | Not a real conflict once the slots are named. |
| R12 | Archive toast: "stay in the Brain" (A, C) vs "stay on the record" (B) | **"stay in the Brain."** | Two different things survive an archive. Receipts stay on the record; decisions go to the Brain and change the next call. The Brain is what the user cares about, and it is the layer that must never read as storage. |
| R13 | Streaming label: `Drafting your brief` (B) vs `Chief of Staff is drafting your brief` (C) | **C.** Every working line names its actor. | A subjectless gerund is the nameless-machine failure this contract exists to end. |
| R14 | Slow-load copy: `Still fetching.` then `Still fetching. This is slower than usual.` (B) vs no text ever (C) | **One line at 6s: `Taking longer than usual.`** Then the timeout error at 15s. Nothing before 6s. | "Fetching" is plumbing and the two-stage escalation is repetitive. C's silence rule governs agent work; a stalled data load still owes the reader one honest line. |
| R15 | Receipt believability floor: per-object floors of 8m / 40s / 30s / 5s (B) vs step count under 60s (C) | **C's rule ships. B's floors are demoted to a pre-launch calibration task.** Under 60 seconds of real elapsed, a run-class receipt renders step count, not duration. | The founder's law is that numbers must be logically believable. An unmeasured 8-minute floor is itself an invented number, so shipping it would break the rule it was written to serve. Measure p10 first, then record real values here. |
| R16 | Date order: `Jul 21` (B) vs `14 Jul` (C) | **`Jul 21`.** All of C's receipt examples are rewritten. | B owns the format module and defines the whole ladder around `MMM d`. |
| R17 | Clock: 24-hour (B) vs `4:12pm` in C's receipt examples | **24-hour.** `14:20`, never `2:20pm`. | Unambiguous for a distributed team, fixed-width in tabular numerals, matches the console register. |
| R18 | Bet verbs: only the verdict triad (A) vs `Keep` / `Drop` for bets (C) | **Both, on different objects, and never crossed.** The triad `Approve / Send back / Decline` governs **calls**. `Keep / Drop` govern **bets** in Decide. | Different objects, different outcomes: approving unblocks an agent, keeping ranks a bet into Now. Banned: "Approve this bet", "Keep this call". |
| R19 | Pattern (A) vs theme (C's cold-start copy) | **Pattern.** C's `ColdStartOnramp` lines take the same edit. | `themes` freezes in the DB. |
| R20 | Lang B example names an agent `Historian` | **Not a crew name. Deleted.** The correct example is `Draft with Writer`. | Thirteen names, section 3, no fourteenth by accident. |
| R21 | `nav-model.ts` field named `tagline` (C) | **Rename to `subtitle`.** | Nothing in the app may have a field called tagline except the auth door, or the word creeps back onto surfaces. |
| R22 | In-app tagline: `You make the calls. Your crew runs the rest.` (C) | **Amended for honesty: `You make the calls. Your crew does the work between them.`** | "Runs the rest" fails the honesty test against our own ceiling copy: agents open the pull request and a human merges it; Publisher drafts the launch note and you post it. "The work between them" is exactly what is true, and it teaches the gate model in one read. |

---

## 2. THE LEXICON

One user-facing word per concept. The definition is what the tooltip, the empty state and the
onboarding line all derive from. **Banned beside it** means: never appears anywhere in the app as a
name for this thing, including in generated output.

### 2.1 Containers

| Concept | The one word | Definition | Banned beside it |
| --- | --- | --- | --- |
| The company account everyone shares | **Workspace** | The shared account your team, your connected sources and your billing live in. | org, organization, team, tenant, account (account survives in billing only) |
| The thing you are building | **Product** | One product inside the workspace, with its own loop, brief and repo. | project, app, initiative, workstream |
| The whole seven-stage cycle | **the loop** | Discover, Decide, Plan, Design, Build, Ship, Learn, entered and left at any point. | pipeline, workflow, journey, lifecycle, arc, funnel, process |
| One position in the loop | **Stage** | One of the seven named steps. A state work is in, not necessarily a page. | station, phase, step (taken, see 2.3), node, gate (taken, see 2.4) |

### 2.2 The seven stages (verbs, fixed)

| # | Word | Definition | Banned beside it |
| --- | --- | --- | --- |
| 01 | **Discover** | Connected sources are read and what changed becomes evidence you can act on. | Sense, Listen, Intake, Research, Signals as a stage name |
| 02 | **Decide** | Ranked bets are kept or dropped, and this is the one thing the product will never do for you. | Triage, Prioritize, Judge, Queue, Review as a stage name |
| 03 | **Plan** | A kept bet becomes a cited spec and a sequenced piece of work. | Define, Spec, Scope, Groom, Refine |
| 04 | **Design** | The spec gets your brand and a look you can see before anyone writes code. | UX, Prototype as a stage name, Mockup, Brand as a stage name |
| 05 | **Build** | Agents write the change in your repo, test it, and open the pull request. | Studio, Builder, Engineering, Code, Develop, Execute |
| 06 | **Ship** | The change goes from preview to production and the world is told what changed. | Release as a stage name, Deploy, Launch, Publish as a stage name |
| 07 | **Learn** | The outcome comes back, gets a verdict, and the Brain keeps it. | Measure, Reflect, Retro, Analyze, Impact |

Two stages have a second live name today and both die: `agent-vocabulary.ts:113` renders `Sense`
for stage 01 (Discover wins) and `:124` declares `define: { id: "define", name: "Plan" }`, an id and
a label that disagree inside one object literal (Plan wins, id included).

A stage word is legal as a **state label** on a surface that has no page of its own. The lexicon
does not require seven URLs.

### 2.3 Work objects, in the order a user meets them

| Concept | The one word | Definition | Banned beside it |
| --- | --- | --- | --- |
| One piece of evidence from a source | **Signal** | One thing a source said, captured with where it came from and when. | insight, mention, item, event, datapoint, feedback |
| Many signals saying the same thing | **Pattern** | A group of signals your crew found saying the same thing. | theme, cluster, topic, trend |
| Something worth doing, ranked | **Bet** | A thing worth building, with an argued case, a rank and a stated risk. | opportunity, idea, candidate, initiative, item, ticket |
| Something waiting for your judgment | **Call** | One thing your crew has stopped on and cannot pass without you. | approval, gate, request, task, ask, item, todo |
| The record of a judgment you made | **Decision** | What you decided, when, why, and what it cost or produced. | approval record, verdict (taken, 2.5), ruling, log entry |
| The written definition of a bet | **Spec** | The document that says what to build, what done means, and what evidence backs it. | PRD, doc, requirements, brief (taken, 2.6), ticket, story |
| A clickable rendering of a spec | **Prototype** | A working screen you can click before any production code exists. | mockup, wireframe, preview (taken), comp, design |
| One end-to-end job your crew runs | **Run** | One piece of work your crew took from goal to pull request, with a number, a title and a receipt for every step. | mission, changeset, session, job, build as a noun, swarm, arc, execution, lane |
| One action inside a run | **Step** | One thing one agent did inside a run. | task, action, node, turn, tool call |
| The code a run produced | **Change** | The diff the run wrote, and the pull request it opened. | changeset, patch, commit set, revision, PR in prose (PR is fine in a link label) |
| The staged version before production | **Preview** | The change running somewhere real that is not production yet. | staging, sandbox, draft deploy |
| A change that reached production | **Release** | A change that is live, with what shipped written down. | deployment, ship (that is stage 06), rollout, launch |
| What happened after the release | **Outcome** | What the release actually did to the number the bet promised to move. | impact, result, metric, KPI, effect |

Display form for a run: `Run 41 · Fix the checkout redirect`. The number gives it identity in a
list, the goal gives it meaning.

### 2.4 The judgment vocabulary

| Concept | The one word | Definition | Banned beside it |
| --- | --- | --- | --- |
| The thing waiting | **Call** | See 2.3. | approval, gate, decision (before you act) |
| Saying yes | **Approve** | You accept it and your crew continues. | accept, confirm, OK, ship it, sign off, LGTM |
| Saying not like this | **Send back** | You reject the attempt but keep the work, with a reason attached. | reject, request changes, decline, deny, needs work |
| Saying no, permanently | **Decline** | You kill the work. It goes to the Brain as a decision not to do it. | kill, drop (drop is for bets), dismiss, archive, cancel, no |
| Pushing it to later | **Snooze** | You defer the call without judging it. It comes back. | later, defer, remind me, set aside, not now |
| Ranking a bet into Now | **Keep** | You move a bet onto the roadmap. | approve (that is a call), accept, promote |
| Removing a bet from the backlog | **Drop** | You take a bet off the list, with the reason kept. | decline (that is a call), reject, kill, archive |
| The rule that made it stop | **House rule** | A standing rule you wrote that decides when your crew must stop and ask you. | guardrail, policy, gate, permission, constraint |

**A Call becomes a Decision the moment you act on it.** That one sentence is the whole model and it
is teachable in one line. It also removes "approval" and "gate" from user copy in one move.

### 2.5 The record layer

| Concept | The one word | Definition | Banned beside it |
| --- | --- | --- | --- |
| The record of one agent action | **Receipt** | What one agent did, what it read, what it produced and what it cost. | trace, log, audit entry, event, span, proof |
| The whole tamper-evident chain | **the record** | Everything every agent and every person did here, sealed so it cannot be quietly edited. | ledger, audit log, paper trail, chain, history |
| Your crew's judgment on something | **Verdict** | One agent's stated call on a thing, with its confidence and its reasoning. | assessment, score, rating, opinion, take |
| What the workspace learned | **Learning** | A thing that turned out to be true or false here, written so it changes the next call. | lesson, retro, insight, note, memo |

`/traces` ("Every run"), `/trust-ledger` ("Ledger"), the tab "Paper trail" and the tab "What just
happened" are four names for two things. Resolved: a **Receipt** is the unit, **the record** is the
whole, both live in the engine room.

### 2.6 The always-on layers

| Concept | The one word | Definition | Banned beside it |
| --- | --- | --- | --- |
| What the company knows | **Brain** | Every call your team made, what it became, and what it now tells you before you decide again. | memory, knowledge, knowledge base, recall, second brain, wiki, vault, storage |
| How the machine is running | **Engine room** | Spend, quality, safety and every receipt, in one place, for when you want to look under the hood. | Pulse, ops, observability, console, command center, cockpit, monitoring, vitals |
| Everything the loop made | **Library** | Every finished thing the loop produced, promoted here on purpose. | artifacts, assets, files, output, deliverables |
| The named agents, as a body | **your crew** (label: **Crew**) | The thirteen named agents that run the loop. | fleet, swarm, cast, roster, staff, team, squad, bots, the agents |
| One named agent | **Agent** (in the abstract) or its name | One named member of your crew with one job and one verb. | bot, assistant, copilot, worker, specialist, AI, model |
| A conversation with your crew | **Thread** | One conversation with your crew, kept, searchable and citable. | chat, conversation, session, DM, message thread |
| Asking your crew something | **Ask** | Putting a question to your crew from anywhere in the app. | chat, query, prompt, search |
| The daily landing | **Today** | What needs you now, and what happened while you were gone. | home, dashboard, inbox, briefing, start, cockpit, overview, feed |
| The morning summary | **Brief** | The one-screen read of what changed overnight and what it means. A thing on Today, never a destination. | digest, standup, summary, report, recap |

**The Brain is never storage.** Every Brain sentence carries a forward-looking clause. "Every call
your team made, and what it tells you before you decide again" is right. "Where your decisions
live" is wrong even though every word is on this list.

### 2.7 Setup and control

| Concept | The one word | Definition | Banned beside it |
| --- | --- | --- | --- |
| A place data comes from | **Source** | A tool you connected that your crew reads from. | integration, connector, provider, channel, feed, app |
| The act of connecting one | **Connect** | Giving your crew read access to a source. | integrate, link, authorize, install, sync |
| How much rope an agent has | **Autonomy** | How far an agent may go before it stops and asks you. | permissions, trust level, mode, access, freedom, blast radius |
| A repeatable saved sequence | **Playbook** | A sequence your crew ran before that worked, saved so it can run again. | template, recipe, macro, workflow, automation |
| Something on a schedule | **Routine** | Something your crew does on a schedule without being asked. | cron, job, automation, scheduled task, sweep |
| The unit of spend | **Credit** | What one unit of crew work costs you. | token, usage, quota, points, compute |

### 2.8 Words that exist only inside the engine room

Correct technical words for the audience that opens that door. **Banned everywhere else**,
including in generated output, tooltips and toasts.

`trace` · `eval` · `guardrail` · `drift` · `changeset` · `gate` · `orchestrator` · `fan-out` ·
`token` · `latency` · `p95` · `suite` · `span` · `checkpoint` · `queue depth`

`station`, `face`, `swarm`, `lane`, `arc` and `blast radius` are deleted everywhere, code included.
They are not engine-room words; they are dead words.

---

## 3. THE CREW

### 3.1 The rule

**A crew member is named for the person who does the job, never for the job.** An agent name may
never equal a stage name, a button verb, an object status or a nav label. Mechanically: take the
role and use the `-er` form or the plain professional noun.

This is what broke. Nine of thirteen are currently named with bare verbs (`Watch`, `Listen`,
`Prioritize`, `Challenge`, `Draft`, `Plan`, `Design`, `Review`, `Announce`, `Measure`), which
collide with two stage names, one spec status, one autonomy mode and the button vocabulary.
"Plan is planning." "Design approved" (the gate, or the agent?). "Review needs review."

Worse, and this is the single largest naming defect in the app: **two name sets are rendering to
users right now.** `AGENT_FACES` (Scout, Strategist, Critic, Scribe) was kept "for back-compat" at
`agent-vocabulary.ts:66` and never retired, while `SPECIALIST_CATALOG` renamed the same agents to
verbs. Critic appears in strings across twenty-plus files while the roster calls the same agent
"Challenge". A user reading Today sees Critic; the same user opening the roster sees Challenge.

**Personas were considered and rejected.** A persona layer ("Iris, the critic") adds a second name
per agent to learn, invites cuteness onto a surface whose whole claim is receipts and judgment, and
makes generated output read like a character is talking when the honest frame is that a system did
work and left a record. Role names used as proper names get the warmth without the cost.

### 3.2 The thirteen

Twelve seats across the seven stages, plus one conductor with no seat.

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

Four names survive unchanged: Critic, Strategist, Engineer, Chief of Staff. That is deliberate. The
2026-06-18 pass that renamed them to verbs was the mistake, not the thing to preserve.

`Reactor` and `Archivist` are **not agents and get no names.** They are machinery: an event router
and a memory consolidator. In the engine room they appear as lowercase mechanisms (`event routing`,
`memory consolidation`). The tier type becomes `CrewTier = "crew" | "machinery"`.

### 3.3 The grammar

| Rule | Right | Wrong |
| --- | --- | --- |
| No article. Agent names are proper names. | `Critic flagged this bet.` | `The Critic flagged this bet.` |
| Present continuous for live work. | `Engineer is writing the change.` | `Engineer writes the change.` |
| Past simple for a receipt. | `Reviewer checked the diff.` | `The diff has been checked.` |
| Never "agent" plus the name. | `Ask Critic.` | `Ask the Critic agent.` |
| Never a bare verb as the subject. | `Planner broke it into work.` | `Plan broke it into work.` |
| The collective is possessive. | `Your crew is working.` | `The agents are working.` |
| Two agents get both names. Three or more get the collective. | `Writer and Critic disagreed.` · `Your crew is working.` | `The agents disagreed.` |

Fixing the article alone repairs a live inconsistency: the app currently ships both
`"Run the Critic"` and `"Critic re-ran"` in the same product.

### 3.4 What makes thirteen a crew and not a list

1. **You never meet thirteen.** The roster is only ever sliced by stage, so you see one to three at
   a time. A "meet the crew" grid is banned.
2. **The seat is the memory hook.** In any list context an agent is written `05 Engineer`. The user
   already learned the number line from the loop.
3. **One verb each, owned exclusively.** The verb column above is a uniqueness constraint. You can
   identify who acted from the sentence alone.
4. **Introduced by receipt, never by bio.** First appearance is `Critic flagged this bet` with the
   receipt attached, never a card explaining what Critic does.
5. **Fixed glyph and hue, never re-skinned.** Recognition should be pre-verbal. Carry the existing
   values from `SPECIALIST_CATALOG` unchanged.
6. **The crew is thirteen.** A fourteenth requires deleting one. See open question Q2.

---

## 4. THE RENAME LEDGER

Scope column reads: **label** (string only) · **route** (label plus URL) · **code** (label, URL and
internal identifiers) · **freeze** (identifier stays, label diverges, mapping lives in one place).

### 4.1 Destinations

| From | To | Scope | Note |
| --- | --- | --- | --- |
| `/engine-room` labelled "Pulse" | `/engine-room` labelled **Engine room** | label | Route, component directory, `ENGINE_ROOM_PATHS`, `engineRoomActive()` and the doctrine file all stay. One string changes. |
| `/artifacts` "Artifacts" | **`/library`** "Library" | code | Migrate route, `ArtifactsSurface.tsx`, `artifacts.functions.ts` and all dialog copy. Freeze `artifact_versions`, `artifact_lineage`. One redirect for one release. |
| `/build/$missionId` | **`/build/$runId`** | code | Param rename. |
| `/traces`, `/traces/$traceId` | **inside `/engine-room?room=record`** | code | Receipt detail is an engine-room view, not a top-level route. |
| `/missions`, `/missions/$missionId` | **deleted** | code | No redirect. |
| `/studio`, `/studio/$missionId` | **deleted** | code | No redirect. |
| `/memory`, `/knowledge` | **deleted** | code | `/memory` is already a pure redirect stub. It has served its purpose. |
| `/prds`, `/prds/$id`, `/discovery` | **deleted** | code | Spec detail lives inside Plan. |
| `/govern`, `/trust-ledger` | **deleted** | code | Both already only redirect into the engine room. |
| `/fleet`, `/swarm`, `/delegate`, `/cockpit`, `/inbox`, `/briefing`, `/start`, `/observe` | **deleted** | code | Eight second names for surfaces that already exist. |
| `/decide`, `/learn`, `/ship` | **IA's call, not a language call** | n/a | The words Decide, Learn and Ship survive as state labels whether or not they keep URLs. `/decide` owns zero queries of its own, so collapsing it costs no vocabulary. |

### 4.2 Strings (verbatim current on the left)

| Current string | File:line | Ship this |
| --- | --- | --- |
| `"Mission running."` | `build.index.tsx:266` | `"Started. Engineer is reading the repo."` |
| `"Mission running · 1 approval waits for you."` | `build.index.tsx:268` | `"Started. One call already waits on you."` |
| `"Mission title (optional)"` | `build.index.tsx:372` | `"Name this run (optional)"` |
| `"Mission archived. Its decisions stay in Memory."` | `build.index.tsx:635` | `"Run archived. Its decisions stay in the Brain."` |
| `"Mission deleted. Its decisions stay in Memory."` | `build.index.tsx:645` | `"Run deleted. Its decisions stay in the Brain."` |
| `"Delete this mission?"` | `build.index.tsx:965` | `"Delete this run?"` + body `"The run and its steps are gone. Its decisions stay in the Brain."` |
| `"Delete mission"` | `build.index.tsx:982` | `"Delete run"` |
| `{ id: "missions", label: "Missions" }` | `build.index.tsx:736` | `{ id: "runs", label: "Runs" }` |
| `{ id: "agent", label: "By Agent" }` | `build.index.tsx:737` | `{ id: "agent", label: "By agent" }` |
| `"Give the agents a goal"` | `build.index.tsx:315` | `"Describe the goal"` |
| `"Plain language in. The agents plan the steps and run them."` | `build.index.tsx:316` | `"Plain words in. Your crew plans the steps and runs them."` |
| `"Agents pick up approved specs, write the code, run the tests, and open the pull request. You appear only at the gates."` | `build.index.tsx:693` | `"You appear only at the gates."` |
| `"Starting..."` / `"Deleting..."` | `build.index.tsx:571,982` | `"Starting"` / `"Deleting"` |
| `"Unknown error"` | `build.index.tsx:95` | `"Could not open this run."` + `"The run is still going. Its steps will be here when the page loads."` |
| `"Show fewer"` | `build.index.tsx:947` | `"Show less"` |
| `"Approved. The agent is unblocked."` | `today.tsx:615` | `"Approved. Engineer is running it now."` |
| `"Sent back. Nothing runs without you."` | `today.tsx:616` | `"Sent back. Writer has your note and is revising."` |
| `"Set aside. It returns in 24 hours."` | `today.tsx:647` | `"Snoozed. It comes back in 24 hours."` |
| `laterLabel: "Later"` | `today.tsx:812` | `snoozeLabel: "Snooze"`, demoted out of the button row |
| `"Drafting today's brief..."` | `today.tsx:301` | `"Chief of Staff is drafting your brief"` |
| `"Waiting on your call. No Critic review yet."` | `today.tsx:128` | `"Waiting on your call. Critic has not weighed in yet."` |
| `"The Critic flagged this bet. Your call moves it out of backlog."` | `today.tsx:695` | `"Critic flagged this bet. Your call moves it forward."` |
| `"Dropped. The Critic's concern stands."` | `today.tsx:695` | `"Dropped. Critic's concern stays on the record."` |
| `"Reopened for review. The decision is back in your queue."` | `today.tsx:712` | `"Reopened. It is back in your calls."` |
| `"Design approved. This spec can now dispatch to Build."` | `today.tsx:678` | `"Design approved. This spec can go to Build."` |
| `"New calls surface here first. Supaprod keeps sensing in the background."` | `today.tsx:1336` | `"Nothing needs you. The next call lands here."` + mono line `Scout reads again at 2am` |
| `"The activity lanes didn't load."` | `today.tsx:1445` | `"Last night's activity didn't load."` |
| `SlideOver title "At risk / watch"` | `today.tsx:1507` | `"At risk"` |
| `TOAST_REJECT = "Rejected. Noted for next time."` | `approvals.tsx:41` | `"Sent back. Writer has your reason on the record."` |
| `memory_candidate: "Saved to workspace memory."` | `approvals.tsx:32` | `"Saved to the Brain."` |
| `"Agents are working; we will bring you the next decision."` | `approvals.tsx:187` | `"Engineer is writing the change. The next call lands here."` |
| `aria-label="Filter approvals"` | `src/components/approvals/*` | `aria-label="Filter calls"` |
| `"Delete this opportunity?"` / `"Opportunity deleted"` / `"Loading opportunities"` | `OpportunityQueue.tsx` | `"Delete this bet?"` / `"Bet deleted"` / `"Loading bets"` |
| `"A dozen is enough for Scout to find the first themes."` | `ColdStartOnramp.tsx` | `"A dozen is enough for Scout to find the first patterns."` |
| `"Give your agents something to read."` | `ColdStartOnramp.tsx` | `"Give your crew something to read."` |
| `"Open the ingest door"` / `"Connect a source"` (step titles) | `ColdStartOnramp.tsx` | `"Point a source at it"` / `"Connect a tool you already use"` |
| `"Set up ingest"` | `ColdStartOnramp.tsx:97` | `"Get signals flowing"` |
| `tagline: "Agents build and open the PR."` | `nav-model.ts:118` | `"Your crew writes the change and opens the PR."` |
| `tagline: "The machine's vital signs: spend, quality, safety, record."` | `nav-model.ts:148` | `"Spend, quality, safety, and every receipt."` |
| `label: "Roster"` (id `staff`) | `settings-sections.ts:84` | `label: "Crew"` (id `crew`) |
| `label: "Memory"` (id `memory`) | `settings-sections.ts:76` | **deleted** (section holds only a redirect card) |
| `"Looking for Memory? It lives in..."` / `"Memory lives in Brain"` | `settings.tsx:197,482` | **deleted** with the section |
| `{ id: "plan", label: "Plan & Usage" }` | `settings-sections.ts:101` | `{ id: "billing", label: "Billing" }` |
| `{ id: "billing", label: "Plan" }` | `settings-sections.ts:105` | `{ id: "subscription", label: "Subscription" }` |
| `{ id: "connections", label: "Connections & Data" }` | `settings-sections.ts:91` | `{ id: "sources", label: "Sources & data" }` |
| `{ id: "interop", label: "Agent access" }` | `settings-sections.ts:96` | `{ id: "interop", label: "Outside access" }` |
| `"How Supaprod and your agents will greet you."` | `settings.tsx:3319` | `"What your crew calls you."` |
| `"Cap the blast radius of the tools this agent can call"` | `settings.tsx:2411` | `"Limit how far this agent's tools can reach"` |
| `"Blast radius"` | `CallDetailSheet.tsx:315` | `"Reach"` |
| `"Brief saved, next mission uses the new context"` | `settings.tsx:3016` | `"Brief saved. The next run uses it."` |
| `"Payment received. Your plan will reflect within a minute."` | `settings.tsx:561` | `"Payment received. Your plan updates within a minute."` |
| `"Save · chat and agent runs use it"` | `settings.tsx:1981` | `"Save"` + helper `"Chat and agent runs use this model."` |
| `"Add key · stored encrypted"` | `settings.tsx:2264` | `"Add key"` + helper `"Stored encrypted. Only this workspace can use it."` |
| `"Remove"` on an API key | `settings.tsx:2348` | `"Delete key"` (it is not reversible) |
| `"Key works (150ms)"` | `settings.tsx:2109` | `"Key works."` with `150ms` in the mono meta line |
| `"Fork new draft · copies this version"` | `PromptsPanel.tsx:416` | `"Start a new draft"` + helper `"Copies this version."` |
| `"Save draft · not yet live"` | `PromptsPanel.tsx:501` | `"Save draft"` + a `Not live` chip on the version row |
| `"Draft contract from this spec"` | `OutcomeContractPanel.tsx:303` | `"Draft the contract"` |
| `"Confirm rotate?"` / `"Confirm revoke?"` | `sync.tsx:761,777` | `"Rotate this token?"` / `"Revoke this token?"` |
| `"OK"` | `admin.observability.tsx:352` | the verb of the act it confirms |
| `"Balance now 1,234"` | `admin.people.tsx:362` | `"Credits granted. Balance is 1,234."` |
| `"no users match"` | `admin.people.tsx:142` | `"No match for \"raj\"."` + `"142 people in this workspace."` |
| `"Check your email for the reset link"` | `forgot-password.tsx:46` | `"Reset link sent. Check your email."` |
| `"Sign in · opens your workspace"` | `login.tsx:251` | `"Sign in"` |
| `title="Hold on, signing you in"` | `login.tsx:156` | `title="Signing in"` |
| `toast.success("Welcome back")` | `login.tsx:76` | **delete.** It fires as the page navigates away. |
| `"Sign in to your decision workspace. Your calls, the receipts, and the loop, in one place."` | `login.tsx:117` | `"Your crew kept working. Sign in to see what needs you."` |
| `you make the calls · Supaprod runs the rest` | `AuthScaffold.tsx` | `"You make the calls. Your crew does the work between them."` |
| `"All clear."` + `"The loop is running itself."` | `Hero.tsx:11` | branch on real state, section 7.3 |
| `"Nothing shipped yet. When a build is green, Ship stages the release and drafts the launch kit for your review."` | `faces.tsx:2227` | `"Nothing shipped yet. Publisher stages the release once a run goes green."` |
| `actionLabel: "Launch what we shipped"` | `faces.tsx:2228` | `"Announce the release"` |
| `"Nothing to read yet. Connect a source and Watch starts on the next sweep."` | `faces.tsx:268` | `"Nothing to read yet. Connect a source and Scout starts on the next sweep."` |
| `"Or tour a workspace we already filled"` | `MissionOnboarding.tsx:138` | `"Or look around a workspace with real work in it"` |
| `"Generating..."`, `"Drafting..."`, `"Generating note..."` | `ChangesPanel.tsx:580,632,784` | deck-drawn: `"Writer is drafting the note"` |
| `headline = "Loading"` | `HealthCard.tsx:45` | no visible headline; skeleton plus `aria-label` |
| `"repo: not connected"` | `build.index.tsx:524` | `"Build needs a repo first."` (full block, section 6.10) |
| `"Connect a source and give it ten minutes."` | `DiscoverSurface.tsx:337` | `"Discover needs a source first."` (full block, section 6.10) |
| `"No repo to build in"` (dialog title) | `RepoGateDialog.tsx:61` | title `"Connect a repo first"`, button `"Connect a repo"` |
| `"No response from this angle."` | `CompositeReviewCard.tsx:75` | `"2 of 3 angles reported."` (full block, section 6.8) |
| `"Forbidden"` | `proof-surface.functions.ts:65`, `routing-console.functions.ts:125`, `observability.functions.ts:83,177,240`, `onboarding.functions.ts:40` | map at the boundary. Never reaches the UI. |
| vendor name in copy | `ProductAnalyticsPanel.tsx:210` | `"No data yet. Refresh to pull the latest."` |

### 4.3 Internal identifiers: migrate

The rebuild rewrites these files anyway, so the rename is free.

| From | To | Kind |
| --- | --- | --- |
| `src/lib/agent-vocabulary.ts` | `src/lib/crew.ts` | module |
| `AGENT_FACES`, `AgentFace`, `AGENT_FACE_ORDER`, `agentFace()`, `agentVerb()` | **deleted** | the two-name-set fix |
| `AgentStation` | `LoopStage` | type |
| station id `sense` / `define` | `discover` / `plan` | enum value |
| `AGENT_STATIONS` | `LOOP_STAGES` | const |
| `castByStation()` | `crewAtStage()` | function |
| `castEntries()` / `crewEntries()` | `crew()` / `machinery()` | function |
| `AgentTier = "cast" \| "crew"` | `CrewTier = "crew" \| "machinery"` | type |
| `SPECIALIST_CATALOG` | `CREW` | const |
| `<AgentRelay variant="station" station=... />` | `<CrewRelay variant="stage" stage=... />` | component + props |
| `src/lib/agent-fleet.ts`, `agent-fleet.functions.ts` | `src/lib/crew.functions.ts` | module |
| `src/components/studio/` | `src/components/build/` | directory |
| `src/lib/studio.functions.ts` | `src/lib/run.functions.ts` | module |
| `StudioCi`, `StudioRunDetail`, `getStudioSession`, `studio_session` | `BuildChecks`, `RunDetail`, `getRun` | types + functions |
| `queryKey: ["studio-session"]`, `["studio-sessions"]` | `["run"]`, `["runs"]` | query key |
| `src/lib/mission-vocabulary.ts` | `src/lib/voice/decks.ts` | module |
| `MissionStateId`, `MissionStateKind` | `RunStateId`, `RunStateKind` | type |
| `src/components/mission/` | `src/components/run/` | directory |
| `$missionId` route param | `$runId` | route param |
| `ROOM_TAB_META` view id `traces` / `approvals` | `runs` / `decisions` | id |
| Engine room tab `"Paper trail"` | `"Receipts"` | label |
| settings section id `staff` | `crew` | id |
| settings section id `memory` | **deleted** | id |
| settings group id `plan` | `billing` | id |
| settings section id `billing` (label "Plan") | `subscription` | id |
| `queryKey: ["needs-you"]` and `["approvals"]` | `["calls"]` (one key, one cache) | query key |
| `NavItemDef.tagline` | `NavItemDef.subtitle` | field |
| `NavItemDef.group?: "workflow"` | **deleted** (`zone: "loop"` already carries it) | dead field |
| `pulseSentence()` (`today.tsx:94`) | `engineRoomSentence()` | function |

### 4.4 Internal identifiers: freeze

Acceptable debt. Never rendered, migration cost is real, no user can see it.

| Frozen identifier | Reads as | Why acceptable |
| --- | --- | --- |
| `projects` table | Product | Central to every server function and RLS policy, for zero user benefit. The confession already lives at `use-workspace.tsx:95`. Documented here so nobody "corrects" the UI back toward the schema. |
| `missions`, `mission_steps` | Run, Step | Header row and steps. No user surface. |
| `studio_changesets` and its three siblings | Change | The established convention froze these twice already. |
| `builder_file_claims` | (internal) | Never rendered. |
| `agents.slug` values | the thirteen names | The display mapping in `crew.ts` is the entire point of having a display mapping. |
| `prds`, `prd_scaffolds`, `prd_flows` | Spec | Column names only. |
| `opportunities`, `themes`, `insights` | Bet, Pattern | Three tables, one UI word each, no leak. |
| `agent_approvals`, `human_gate_events`, `approval_snoozes` | Call, Decision, Snooze | Never rendered raw. |
| `agent_memory`, `memory_candidates`, `bump_memory_importance` | Brain | The memory mechanism is real. Only the surface name was wrong. |
| `design_memory`, approval kind `design_gate` | Brand, Design approval | Never rendered raw. |
| `ledger_seals`, `admin_audit_log`, `workspace_audit_log` | the record, Receipt | Correct engineering names. |
| `conversations`, `copilot_messages`, `agent_messages` | Thread | `copilot` is a banned user word, but this column is invisible. |
| `daily_briefs`, `workspace_briefs` | Brief | Already correct. |
| `cadence` schedule-frequency column | (the English word) | **Explicitly protected. Not the brand. Never touch it.** |
| `CallSurface 'studio'` | (prompt cost bucket) | Predates both renames, unrelated to Build. |
| autonomy modes `auto` / `confirm` / `review` | see below | Enum change across `agent_tool_modes` for a label fix is not worth it. |

**The divergence template.** The autonomy mode value `review` collides with the agent Reviewer. The
value freezes and the label diverges, with the mapping in exactly one place:

| Stored value | Label the user reads |
| --- | --- |
| `auto` | Runs on its own |
| `confirm` | Asks me first |
| `review` | I check the output |

### 4.5 Freeze is NOT acceptable here

Four items. Each leaks a dead name onto a screen.

| Item | Why it must migrate | Fix |
| --- | --- | --- |
| `agents.name` seeded values in `seed_default_agents`, `seed_orchestrator_agent`, `seed_demo_workspace`, `seed_sample_workspace` | `agentDisplayName()` falls back to the DB `name` column for any slug not in the catalog. A stale seed renders directly to a user. | Re-seed all four with the section 3.2 names. |
| Free-text rows in `announcements`, `changelog_entries`, `learnings`, `decisions.rationale`, `daily_briefs` | These render verbatim. A row saying "Cadence", "mission", "Watch" or "Challenge" is a visible ghost. | One migration sweep. Historical narrative describing what happened before a rename stays accurate; product-name references get corrected. |
| `ACTION_LABEL` fallback | It falls through to the literal `"working"` for anything unmapped, which is a banned string. | Make the fallback total and silent: an unmapped tool renders no label, never the raw id and never "working". Add the test. |
| Demo workspace contents (`seed_demo_workspace`, `clone_demo_workspace`, `admin_reset_demo_workspace`) | This is what every demo and screen recording shows. The most visible dead nouns in the company. | Re-seed with this lexicon. |

---

## 5. BUTTON GRAMMAR

### 5.1 The eight laws

1. **The first word is a verb, imperative, base form.** `Approve`, `Connect a source`,
   `Draft the spec`. Never a gerund, never a bare noun, never a question.
2. **Sentence case. Always.** `Send back`, not `Send Back`. Stage and surface names keep their
   capital: `Go to Build`.
3. **No terminal punctuation.** No period, no ellipsis, no exclamation mark.
4. **The label names the outcome, not the mechanism.** Section 5.3.
5. **One primary per screen.** If two things feel equally primary, the screen has two jobs and that
   is an IA problem, not a copy problem.
6. **The label is stable across states.** Only the pending form differs, and it is the same verb.
7. **A disabled control always says why.** Section 5.6. A dim button with no explanation is a bug.
8. **Every primary button resolves an action id from the registry** (section 9), never a raw string.

### 5.2 The three tiers

| Tier | Use | Budget | Article | Examples |
| --- | --- | --- | --- | --- |
| **Primary** | The one act the screen exists for. Solid ember. One visible at a time. | 1 to 3 words | Yes when it reads as spoken English | `Start a run`, `Approve`, `Connect a repo` |
| **Secondary** | Real alternatives to the primary act. Outlined. | 1 to 3 words | Prefer none | `Send back`, `Snooze`, `Show archived`, `Manage billing` |
| **Quiet / link** | Reversible, low-stakes or navigational. Text only. | Up to 5 words | Yes | `Read the full brief`, `Try again`, `Open Decide` |

Icon-only buttons carry an `aria-label` that is the full label, never an abbreviation.

### 5.3 Outcome versus mechanism

**The rule.** The label names the state the user will be in one second after the click. It never
names the subsystem, the storage, the vendor, the format or the internal step.

**The one exception:** naming **our own agent** is naming the actor, not the mechanism, and it is
desirable, because the crew is the product. `Draft with Writer` is correct. `Draft with the LLM` is
not. `Draft with Historian` is not, because Historian is not one of the thirteen.

Every failing string in the repo and its replacement is in the ledger at 4.2. The shapes that fail:
a consequence clause glued on with a separator (`Save · chat and agent runs use it`), a status
wearing a button (`Save draft · not yet live`), pipeline vocabulary (`Set up ingest`), git jargon
(`Fork new draft`), the mechanism of confirming (`Confirm rotate?`), and a word that says nothing
(`OK`).

### 5.4 The verdict verbs, the highest-stakes labels in the product

| Verdict | Button | Toast | Meaning | Reversible | Key |
| --- | --- | --- | --- | --- | --- |
| Approve | `Approve` | `Approved. <who moves now>` | Yes, proceed. | No | `a` |
| Send back | `Send back` | `Sent back. <who has it now>` | Not as written. Return it for revision. The work survives. | Yes | `s` |
| Decline | `Decline` | `Declined. <what stands instead>` | No, and it does not come back. | No | `d` |
| Snooze | `Snooze` | `Snoozed. It comes back in 24 hours.` | Not now. Not a verdict. | Yes, automatically | `z` |

`Reject` and `Rejected` are banned everywhere, string and identifier. `Decline` and `Send back` are
not interchangeable: send back means revise, decline means never. Every call offers exactly
`Approve`, exactly one of `Send back` or `Decline`, and optionally `Snooze`. **Three visible
buttons maximum on a call card**, with Snooze rendered as a secondary control, not a peer.

Bets in Decide use `Keep` and `Drop`, never the verdict triad. `Kept. It moves to Now on the
roadmap.` `Dropped. Critic's concern stays on the record.`

### 5.5 Pending, in-flight, and the ellipsis ban

**Pending labels are the present participle of the same verb, with no punctuation.** `Saving`, not
`Saving...` and not `Saving...`. The button is visibly busy, so the punctuation is redundant, and the
codebase currently mixes the real ellipsis character (30-plus sites) with three ASCII periods
(`BillingBanner.tsx:131`, `checkout.return.tsx:36`). Both die.

| Idle | Pending | Toast |
| --- | --- | --- |
| `Save` | `Saving` | `Saved.` |
| `Start a run` | `Starting` | `Started. Engineer is reading the repo.` |
| `Delete run` | `Deleting` | `Run deleted. Its decisions stay in the Brain.` |
| `Connect a source` | `Connecting` | `<Source> connected. Scout reads it at 2am.` |
| `Approve` | `Approving` | `Approved. Engineer is running it now.` |

A pending button keeps its width, reserving the wider of the two labels, so the row does not reflow
mid-click.

**Never disable a control because a mutation is in flight.** Use the pending label plus
`aria-busy="true"` plus `pointer-events: none`. Disabling drops the accessible name in some screen
reader modes and loses the focus ring. `settings.tsx:834,846,854,1978` all do this today.

### 5.6 Destructive phrasing

| Verb | Means | Reversible | Confirm dialog | Never use for |
| --- | --- | --- | --- | --- |
| `Delete` | The object is gone. | No | Yes, always | Anything recoverable |
| `Archive` | Hidden from the default list. Restorable. | Yes | No, Undo toast | Anything that actually deletes |
| `Remove` | Detached from this place. Exists elsewhere. | Yes | No, Undo toast | A permanent delete |
| `Disconnect` | Auth revoked. Data already pulled stays. | Yes, by reconnecting | Yes, when data stops flowing | A delete of the data |
| `Revoke` | A credential stops working now, for everyone. | No | Yes, typed confirm | A soft disable |
| `Clear` | A list is emptied. | No | Yes, when count > 1 | Removing one item |
| `Dismiss` | This banner, this once. | n/a | No | Anything that changes stored state |
| `Decline` | A verdict, on the record. | No | Only when it closes a thread | A delete |
| `Drop` | A bet leaves the backlog, reason kept. | Yes, by re-ranking | No | A delete |

**The destructive label always names the object.** `Delete run`, not `Delete`. `Revoke token`, not
`Revoke`. The one exception is inside a confirm dialog whose title already names the object.

### 5.7 The disabled-control contract

**A disabled control always carries a sentence naming what the user must do to enable it.** Not
what is missing. What they do. `build.index.tsx:543` is the correct existing precedent.

| Control | Where the reason lives |
| --- | --- |
| Primary CTA | Visible helper line directly beneath the button. Never tooltip-only; touch has no hover. |
| Secondary / quiet | `title` plus `aria-describedby` pointing at a visually hidden span |
| A row of choices | On the disabled choice itself, as a short inline note |

| Reason | Template | Examples |
| --- | --- | --- |
| **Precondition unmet** | `<Do the thing> to <get the outcome>.` | `Describe the goal in a few words.` · `Approve a bet in Decide to draft a spec here.` |
| **Permission** | `Only <role> can <verb> <object>. Ask <who> in Settings.` | `Only an owner can change the plan. Ask your workspace owner.` |
| **Quota** | `<What is exhausted>. <The one move that fixes it>.` | `No credits left. Top up to run this.` · `This bundle exceeds your per-cycle top-up limit. Pick a smaller one.` |

Never disable when the reason is "we are loading" or "you have not scrolled to it". Loading uses
the loading state, not a dead button.

---

## 6. THE STATE COPY SYSTEM

### 6.1 One anatomy for every state

```
[1] STATE LINE     required.  What is true right now. Sentence case, ends in a period.
                              Max 6 words. Never a question. Never an apology.
[2] CAUSE + NEXT   optional.  Why, and who moves next. Max 2 sentences, 16 words each.
[3] ACTION         0 or 1.    The single control that changes this state. Never two.
[4] META           optional.  Mono, no period. A count, a receipt ref, or a timestamp.
```

**The component.** One primitive, `StateBlock`, with a `state` discriminant. It replaces the ad hoc
empty states in `faces.tsx`, the inline error divs in `approvals.tsx` and `today.tsx`, and absorbs
`WarmSlot`'s own-work / sample selection as a `sample` prop. `WarmSlot`'s core rule survives
verbatim and becomes law for all eleven states: **there is no empty render path.**

```ts
type StateKind =
  | "empty"        // never used
  | "zero"         // used, currently nothing
  | "upstream"     // waiting on an earlier stage
  | "filtered"     // a filter or search hid everything
  | "loading"      // first load
  | "refreshing"   // has data, fetching more
  | "partial"      // some arrived, some did not
  | "error"        // the request failed
  | "blocked"      // a connection is missing
  | "denied"       // permission
  | "quota"        // over limit
  | "ceiling";     // the honest capability gap
```

### 6.2 How to pick the state

```
1. Can this user see this at all?              no  -> denied
2. Is a required connection missing?           yes -> blocked
3. Is the account over a hard limit?           yes -> quota
4. Did the request fail?                       yes -> error
5. Did part of it fail or is part still in?    yes -> partial
6. Is this the first load?                     yes -> loading
7. Is a filter or query active?                yes -> filtered
8. Has this workspace ever had one of these?   no  -> empty
9. Does an earlier stage owe this one input?   yes -> upstream
10.                                                -> zero
```

`ceiling` is not in this order. It is not a state of a list; it is a permanent line beside a
control, in every state, forever.

### 6.3 Empty (never used yet)

```
[1] <Nothing of this type> yet.
[2] <What creates the first one, naming who acts.>
[3] <The verb that creates it>
```

The empty state is the product's first sentence to a stranger. It teaches the loop. Never playful,
never apologetic, never "no results".

| Surface | Now | Ship |
| --- | --- | --- |
| Build, first visit | `Nothing building. Approve a spec and Engineer writes the change on an isolated branch.` (`faces.tsx:2142`) | `No runs yet.` / `Approve a spec in Plan and Engineer writes the change on its own branch.` / `[Start a run]` |
| Brain, first visit | `No outcomes recorded yet` | `The Brain is empty.` / `It fills as you decide, ship, and record what happened. Nothing to set up.` / no action |

The state line ends in `yet.` only when more will genuinely arrive. Never seed a fake row; a sample
carries the `Sample` badge and a note naming its origin.

### 6.4 Zero (used before, currently nothing)

The steady state of a healthy loop, and the state the founder will look at most.

```
[1] <Nothing needs you> / <All clear>.
[2] <What the machine is doing meanwhile, or when the next one arrives.>
[4] <the receipt that proves the emptiness is earned>
```

| Surface | Ship |
| --- | --- |
| Calls queue, clear | `Nothing needs you.` / `Engineer is writing the change. The next call lands here.` / meta `LAST CALL ANSWERED 2H AGO` |
| Calls queue, nothing running | `Nothing needs you.` / `Nothing is running either.` / meta `LAST RUN FINISHED 6H AGO` |
| Today spotlight, all quiet | see 7.3, it branches on real state |

**The honesty rule that makes zero states trustworthy:** a zero state must never contradict a lane
below it that is showing items. `today.tsx:245` already handles this. Generalise it: `StateBlock`
in `zero` refuses to render if any sibling in the same region has content, and logs a dev warning.

Never say "You're all caught up!", "Nothing to see here", or "Enjoy your day".

### 6.5 Upstream (waiting on an earlier stage)

The most common empty in this app and the one unique to it. Seven stages feed each other, so most
emptiness is not absence, it is sequence.

```
[1] Nothing here yet.
[2] <Stage N> owes this stage <the object>. <What to do in Stage N>.
[3] <Open Stage N>   (link tier, never primary)
```

| Surface | Ship |
| --- | --- |
| Plan, no approved bets | `No specs yet.` / `Decide owes Plan an approved bet. Keep one and Writer drafts the spec.` / `[Open Decide]` plus quiet `[Just write the spec]` |
| Ship, nothing green | `Nothing shipped yet.` / `Publisher stages the release once a run goes green.` / `[Open Build]` |

The upstream state always names the stage by its exact nav label, capitalised, and never says
"earlier in the loop" or "upstream". A user should be able to click the word.

### 6.6 Filtered and search-no-match

```
[1] Nothing in this filter.        /  No match for "<query>".
[2] <The total that exists behind the filter>.
[3] Clear the filter               /  Clear search
```

The query is echoed in straight double quotes, truncated at 24 characters. Filtered-empty **never**
offers the create action; the user is looking, not making. It always shows the count behind the
filter, because that number is the whole reason the state is confusing.

### 6.7 Loading and refreshing

| State | What renders | Copy |
| --- | --- | --- |
| **loading** (first load) | Skeletons shaped like the real rows. Never a spinner, never a centered blob. | **None.** A skeleton that says "Loading" is a skeleton that failed. |
| **loading past 6s** | Skeletons stay, one mono line appears below | `Taking longer than usual.` |
| **loading past 15s** | Becomes the error state | `The server took too long to answer. Retry in a moment.` (the existing `withTimeout` string, now canonical) |
| **refreshing** (has data) | Data stays fully visible and interactive. A 2px indeterminate bar at the region's top edge. | None. Never dim the content, never swap to skeletons, never block the buttons. |
| **streaming** (an agent is writing) | The shimmer treatment already in `today.tsx:301` | Actor plus predicate, from the deck: `Chief of Staff is drafting your brief` |

`loading` sets `aria-busy` on the region; the 6-second line is `role="status"`, never `role="alert"`.
`Loading` is legal in `aria-label` because it is the assistive-technology idiom. It is never legal
on screen.

**A hung server function must reach the error state, never sit on a permanent skeleton.**

### 6.8 Partial

The state nobody writes and everybody needs.

```
[1] <What did arrive, as a number.>
[2] <What did not, named, and whether it is coming.>
[3] Retry the rest        (only when a retry is scoped to the failed part)
[4] <the failure ref>
```

| Surface | Ship |
| --- | --- |
| Today lanes, one failed | `3 of 4 lanes loaded.` / `Scout did not answer. Everything else is current.` / `[Retry Scout]` / meta `ERR 4F2A91` |
| Composite review, one angle silent | `2 of 3 angles reported.` / `Risks did not come back in time. The draft and eval paths below are complete.` / `[Retry risks]` |

Partial never hides what arrived, and always names the missing piece by its user-facing name, never
by an endpoint or a query key. **If the missing piece would change the reader's conclusion (a spend
total, a pass rate, a count), the number is suppressed entirely rather than shown incomplete**, and
slot 1 says so: `Spend is incomplete. One source did not report.`

### 6.9 Error

```
[1] <Could not | Nothing was> <verb the user attempted>.
[2] <What is still true. What to do.>
[3] Try again
[4] <error ref, mono>
```

**The four laws.**

1. **Say what did not happen, in the user's verb.** `Could not load the queue.` is right.
   `Unknown error` and `Forbidden` are raw server strings leaking to a human. Map every server error
   code to a UI sentence at the boundary.
2. **State what survived.** `Nothing was changed.` (`admin.pricing.tsx:210` already does this.)
3. **Never apologise, never blame.** No "Sorry", no "Oops", no "Something went wrong", no "Please".
4. **An error tied to a visible control renders inline next to that control, never as a toast.**

| Surface | Ship |
| --- | --- |
| Calls load failure | `Could not load the queue.` / `Your calls are safe. Nothing was answered.` / `Try again` / `ERR 7C31A0` |
| Run detail load failure | `Could not open this run.` / `The run is still going. Its steps will be here when the page loads.` / `Try again` / `ERR 2B9F04` |

**The error ref.** Every error state renders a six-character mono ref derived from the real
correlation id, via the existing `traceRef()` helper. It is the only machine string allowed in an
error block, and it exists so a user can quote it in support without us exposing a UUID.

### 6.10 Blocked by a missing connection

The highest-conversion state in the product, currently written five different ways.

```
[1] <Stage> needs <a source | a repo> first.
[2] <What flows once connected.> <How long it takes.>
[3] Connect <the thing>
```

| Surface | Ship |
| --- | --- |
| Build, no repo | `Build needs a repo first.` / `Connect one and your crew opens pull requests against it. One click, no keys to paste.` / `[Connect a repo]` |
| Discover, no sources | `Discover needs a source first.` / `Connect one and signals arrive on the next sweep, about ten minutes.` / `[Connect a source]` |

Never render `not connected` on its own; it is a status word, not a state. Never use `coming soon`
without naming the gate; if there is no gate, the honest string is `not built yet`. The connect
action is always the single primary here, because it is the only thing that helps.

### 6.11 Permission denied

```
[1] <Role> access only.
[2] <Who can grant it, and where.>
[3] <a request action, only if one really exists>
```

If the user can **never** get access in this workspace, hide the surface entirely. Render `denied`
only when access is obtainable. `Admin access only.` / `A workspace owner can make you an admin in
Settings, People.`

Never say "You don't have permission to perform this action", "Access denied", or "Contact your
administrator".

### 6.12 Over quota

```
[1] <What ran out>, exactly.
[2] <What still works.> <What resumes it.>
[3] <The one move that restores it>
```

| Threshold | Line | Placement |
| --- | --- | --- |
| Low (under 15% of the cycle) | `12 credits left.` / `Enough for about one more run. Top up when you want.` / `[Add credits]` | Dismissible strip, once per session |
| Out | `No credits left.` / `Reading and answering calls still work. Your crew resumes the moment you top up.` / `[Add credits]` | Persistent strip |
| Payment failed | `Your last renewal payment failed.` / `Your plan stays active for 7 days. Update your card to keep it.` / `[Update card]` | Persistent strip |

Never say "upgrade" as the only move when a top-up exists. Never quantify what a credit buys unless
it is measured; "about one more run" is honest only if the median run cost supports it, and if it
does not, the sentence is dropped rather than invented. One strip, one dismiss, and it does not
come back that session.

### 6.13 The honest capability gap (the ceiling)

Marketing may omit, never invent. Inside the app the bar is higher, because the user is about to
rely on it. **State the ceiling before the user reaches it, beside the control that would otherwise
imply the capability.**

```
<What it does>. <What it does not do, in the same breath, naming who does it.>
```

Two sentences, second one short, placed as helper text under the control. Never in a tooltip, never
in a skippable modal, never after the fact.

| Where | Ship |
| --- | --- |
| Launch note, after Ship stages a release | `Publisher drafts the launch note. You post it. Supaprod holds no publishing keys.` |
| Stakeholder update | `Drafted and ready to send. Nothing sends itself, ever.` |
| Build, on the PR | `Your crew opens the pull request. A human merges it.` |
| Any agent with a draft-to-you posture | `<Agent> drafts. You send.` |

Banned: `Coming soon` without a named gate. `Beta` as an excuse. `Not yet supported`.
`Currently unavailable`. `We're working on it`.

**The ceiling sentence is never an apology.** It is a boundary the user should want.
`Nothing sends itself, ever.` is a feature.

### 6.14 The matrix

| State | Line ends in | Action | Warmth | Meta | `aria-live` |
| --- | --- | --- | --- | --- | --- |
| empty | `yet.` or a period | Yes, the create verb | No | No | off |
| zero | period | No | Yes | Yes, a receipt | polite |
| upstream | `yet.` | Yes, link tier | No | No | off |
| filtered | period | Yes, clear | No | The count behind the filter | polite |
| loading | no copy | No | n/a | No | busy |
| partial | period | Yes, scoped retry | No | Error ref | polite |
| error | period | Yes, try again | No | Error ref | assertive |
| blocked | `first.` | Yes, connect | No | No | polite |
| denied | `only.` | Rarely | No | No | polite |
| quota | period | Yes, restore | No | Balance | assertive |
| ceiling | period | No, it is helper text | No | No | off |

---

## 7. NOTIFICATIONS, TOASTS, CONFIRMATIONS, AND THE FIVE MOMENTS

### 7.1 Which channel

| The message is | Channel | Persists |
| --- | --- | --- |
| The result of a click the screen does not already show | **Toast** | 4s |
| The result of a click the screen **does** show changing | **Nothing.** The change is the feedback. | n/a |
| A failure of a specific control | **Inline, beside that control** | Until resolved |
| A condition affecting the whole workspace | **Strip banner** under the top bar | Until resolved |
| Something needing a decision before proceeding | **Confirm dialog** | Modal |
| Something that happened while the user was away | **Today's brief and the receipts strip** | Until read |
| Something that needs them back in the app | **Out-of-app notification** | Per their settings |

**Ban:** info toasts carrying no action and no undo. If it is worth interrupting for, it is worth a
banner. The one legal exception is a toast naming a destination the user cannot see:
`Drafting the spec. It lands in Plan when ready.`

### 7.2 Toast grammar

**`<Object or actor> <past-tense verb>. <One consequence worth knowing.>`**

| Rule | Detail |
| --- | --- |
| Tense | Past. `Saved.` never `Saving complete`. |
| Length | 10 words total: 6 in the state sentence, 4 in the consequence. |
| Subject | The object or the named actor, never "we". `Run deleted.` not `We deleted the run.` |
| Consequence | Only when something non-obvious survives or unblocks. |
| Punctuation | Full stops. No exclamation. No ellipsis. |
| Count | One toast per user action. Batches toast once, with the count. |
| Dedupe | Same message inside 2s collapses; the toast shows `x2`. |
| Duration | 4s plain, 8s with an action, errors persist until dismissed. |
| Pairing | Every primary action has a paired toast, written at the same time as the button, never separately. |

**The success-toast-for-an-error bug.** `approvals.tsx:148` calls `toast.success(e.message)` inside
`onError`. A failed decision renders as a green success toast carrying a raw server message, in the
highest-stakes flow in the product. Fix with the copy:

```
onError: (e, vars, ctx) => {
  if (ctx?.prev) qc.setQueryData(queueKey, ctx.prev);
  toast.error("Could not record that call. It is still in your queue.");
}
```

The raw `e.message` never reaches a toast. Map it at the boundary or drop it into the error ref.

### 7.3 Undo instead of confirm

**If the action is reversible server-side within 10 seconds, do it and offer Undo. Do not ask
first.** Confirm dialogs are a tax; they exist for irreversible acts and wide blast radius only.

`Run archived.` / `Signal dismissed.` / `3 calls snoozed.` all get an 8s toast with `Undo`. Undo
restores exactly and silently. It never toasts back; the row reappearing is the feedback.

### 7.4 The confirm dialog

```
TITLE    A question. Names the verb, the object and the count. Max 8 words.
BODY     One sentence. What the act destroys, and what survives. Max 20 words.
CANCEL   Always the word "Cancel". Never "Nevermind", "Go back", "Keep it".
CONFIRM  The destructive verb plus the object. Never "Confirm", "Yes", "OK", or a bare "Delete".
```

| Ship |
| --- |
| `Delete this run?` · `The run and its steps are gone. Its decisions stay in the Brain.` · `Cancel` · `Delete run` |
| `Decline this playbook?` · `It will not be proposed again. The learnings behind it stay on the record.` · `Cancel` · `Decline playbook` |
| `Rotate this token?` · `The old token stops working immediately. Anything using it fails until you paste the new one.` · `Cancel` · `Rotate token` |
| `Revert to the previous version?` · `The current version stays on the record. You can roll forward again.` · `Cancel` · `Revert version` |

**Typed confirmation** is required, and only required, when the act deletes a workspace, revokes a
credential other people depend on, or destroys more than 10 objects at once. The user types the
**object's own name**, never the word `DELETE`.

**Never** put a checkbox ("I understand this cannot be undone") in a confirm dialog. If the body
sentence is not enough, the body sentence is wrong.

### 7.5 Out-of-app notifications

`<Who> <did what>. <What it needs from you.>`

| Kind | Subject | Body first line |
| --- | --- | --- |
| A call needs judgment | `Engineer needs your call on checkout retries.` | `Approve, send back, or snooze it.` |
| A run finished | `Run finished: guest checkout.` | `12 files changed. The pull request is open.` |
| A run stopped | `Run stopped: guest checkout.` | `Tests failed on the second step. Nothing merged.` |
| Digest | `3 calls waiting, 1 release shipped.` | `The rest ran itself.` |

No notification begins with the product name. None uses "Reminder:". None is sent for something the
user did themselves.

### 7.6 The five brand moments

Five places the product speaks with personality rather than labelling. Everything not listed here
is a label and gets the plain register.

**Moment 1, the door.** The authenticated app carries a tagline in exactly one place: sign-in,
sign-up, reset and invite accept.

| Slot | Ship |
| --- | --- |
| Tagline | `You make the calls. Your crew does the work between them.` |
| Title | `Welcome back` (keep, it is the one correct greeting in the app) |
| Value line, sign-in | `Your crew kept working. Sign in to see what needs you.` |
| Value line, sign-up | `Point it at your sources and your crew starts reading.` |
| Submit, idle / busy | `Sign in` / `Signing in` |
| Google, idle / busy | `Continue with Google` / `Opening Google` |
| Footer help | `Trouble signing in? Ask your workspace admin to check your invite.` (keep) |

`nav-model.ts`'s per-destination field is renamed `subtitle`. Nothing in the app has a field called
`tagline` except the auth door, or the word creeps back onto surfaces.

**Moment 2, first run.** `ColdStartOnramp` already self-gates on `getColdStart`. Headline (the one
Pixel moment): `Give your crew something to read.` New promise line: `Whatever lands here, Scout
reads it and brings you the first patterns. You decide what is worth building.` Step titles become
`Point a source at it` / `Or paste a few by hand` / `Connect a tool you already use`.

**First-approval moment**, spent exactly once ever, per user. After the first call a user answers,
one line under the hero, dismissable, never modal, no confetti:
`That was your first call. Engineer picked it up 4 seconds later.`
**The second number must be real elapsed or the line does not render.**

**Moment 3, home with nothing to do.** The moment the product is most likely to lie. `Hero.tsx:11`
currently ships `All clear. The loop is running itself.` on a workspace where nothing may be running
at all. **The all-clear line branches on whether a run is actually live.**

| Real state | Lead | Tail |
| --- | --- | --- |
| Nothing pending, at least one run live | `All clear.` | `Engineer is on the checkout change.` (newest live actor and object, same query as the ticker) |
| Nothing pending, nothing running, sources connected | `All clear.` | `Nothing is running. Scout reads your sources again at 2am.` (real next sweep time, or the clause is dropped) |
| Nothing pending, nothing running, nothing connected | `Quiet.` | `Nothing is connected yet. Give your crew something to read.` |

This needs one query answering "is anything actually running", which `getLiveActivity` already
provides. Whatever the home surface becomes, keep that read on it or the hero goes back to lying.

**Moment 4, while your crew is working.** Section 8.

**Moment 5, the receipt.** Section 9.

---

## 8. THE WORKING-STATE VERB DECK

### 8.1 Ratify what exists

`src/lib/mission-vocabulary.ts` already ships the right machine: seven stage decks of twelve
present-progressive predicates, thirteen sets of per-agent signature lines, five ambient bridge
lines, a session-seeded Fisher-Yates shuffle with no repeat until the deck is exhausted, an `avoid`
list so two surfaces cannot show the same line, and `drawWorkingLine(stage, slug, seed)`. **Carry
all of it into the rebuild unchanged** at `src/lib/voice/decks.ts`. It is the strongest voice asset
in the repo.

Four things defeat it in practice and all four are fixed here:

| Defect | Evidence | Fix |
| --- | --- | --- |
| The global ticker never uses it | `agents.functions.ts:114` sets `let action = "Working"`, `:131` `"Starting up"` | The ticker draws from the deck, always |
| `stepLabel` falls back to a single word | `agent-vocabulary.ts:773-777` returns `"working"` / `"thinking"` / `"starting up"` | No generic fallback ships (8.3) |
| `ACTION_LABEL` covers ten tool ids | `agent-vocabulary.ts:759-770` | An outcome label becomes a **required field on tool registration**, with a CI check |
| Faces hardcode the word | `faces.tsx:89` `{kind:"working", label:"Working"}` | Draw from the deck with the stage it already knows |

### 8.2 Where personality is allowed, and where it is a lie

A rotating verb deck is honest only when a named agent is genuinely doing multi-second cognitive
work. A CSV export is not thinking.

| Kind of wait | Deck | What shows |
| --- | --- | --- |
| An agent running a step in the loop | **Yes** | `{Actor} is {deck line}` |
| An agent between steps, no owner yet | Bridge deck only | `handing the work to the next agent` |
| The composer thinking about your message | Chief of Staff deck | `Chief of Staff is checking memory before starting` |
| A file export, settings save, search, billing call, sign-in, page fetch | **No** | Plain, fixed, one string (8.6) |
| A skeleton while data loads | **No** | No text at all. `aria-label` only. |

### 8.3 The fallback ladder

When a working line must render, resolve in this order and **never reach a generic word**:

1. **The real object, if the engine knows it.** `Engineer is fixing the failing test in checkout.ts`
2. **The tool's registered outcome label.** `Engineer is opening a pull request`
3. **The agent's signature deck.** `Engineer is reading before writing`
4. **The stage deck.** `Engineer is running the tests`
5. **The bridge deck** (stage unknown, agent known). `Engineer is picking up where it left off`
6. **No label at all.** The mark turns, alone. Never a word.

`"Working"`, `"working"`, `"Processing"`, `"Loading"`, `"Starting up"`, `"Generating"`,
`"Please wait"` never render. If step 6 is reached, silence is more honest than a placeholder.

### 8.4 The duration ladder

Rotating verbs forever imply progress that may not exist. The line escalates on real elapsed time
and stops rotating when the underlying step stops moving.

| Elapsed | What shows | Rotating |
| --- | --- | --- |
| 0 to 2.5s | The mark turning. No text. | n/a |
| 2.5s to 25s | `{Actor} is {line}` | Yes |
| 25s to 2min | plus elapsed, mono, dim: `1m 04s` | Yes |
| 2min to 10min | plus step position: `step 4` | Yes |
| Over 10min | plus one honest line: `This one is long. It keeps running if you leave.` and a `Stop` affordance | Yes |
| Step unchanged for 3 rotations | **Holds the last line.** | **No** |
| Step unchanged for 8min | Replaces the line: `Nothing has moved for 8 minutes.` plus `Stop` and `Try again` | No |

**Timing.** A line changes when the underlying step changes, or after 6s if it has not, whichever is
later. Minimum dwell 4s so it does not read as a slot machine. Never a countdown, never an ETA,
unless the run contract carries a real per-step estimate. It does not today, so: elapsed only.

### 8.5 Placement and yield

| Placement | Shows | Yields to |
| --- | --- | --- |
| Global ticker (top bar) | Newest live actor and predicate, no object title | Anything below it on the same object |
| Object strip | Actor, predicate, real object, elapsed | Nothing. It is the most specific. |
| Spine / stage marker | Actor initial plus a dot. No words. | Always |
| Card row in a list | Actor plus predicate, truncated, no elapsed | The object strip if open |
| Composer / thread | Full sentence with a terminal period | Nothing |

**One shimmer per screen.** If two placements are live on the same object, the more specific one
renders the words and the other renders the mark alone. The `avoid` parameter already prevents two
identical lines; the yield rule prevents two competing ones.

**No terminal punctuation** in the ticker, strips, spine or cards. A full sentence with a period
only in the composer and in toasts.

### 8.6 The plain waits, no personality ever

| Situation | Ship |
| --- | --- |
| Sign-in submit | `Signing in` |
| OAuth redirect | `Opening Google` |
| Export | `Preparing your export` |
| Agent bundle export | `Preparing your bundle` |
| Start a run | `Starting` |
| Delete | `Deleting` |
| Any settings save | `Saving` |
| Any data fetch behind a skeleton | No visible text. `aria-label="Loading your calls"` only. |

---

## 9. THE ACTION REGISTRY AND THE RECEIPT

### 9.1 One verb per act, product-wide

Every primary button resolves an id from this table. The button and its receipt are written
together, never separately.

| Act | Button | Helper (the consequence) | Toast (the receipt) |
| --- | --- | --- | --- |
| Approve a call | `Approve` | `{Actor} runs it the moment you approve.` | `Approved. Engineer is running it now.` |
| Send it back | `Send back` | `Returns it with your note. Nothing runs until it is revised.` | `Sent back. Writer has your note and is revising.` |
| Decline for good | `Decline` | `Closes this line of work. Your reason stays on the record.` | `Declined. Your reason is on the record.` |
| Defer a call | `Snooze` | `It comes back in 24 hours.` | `Snoozed. It comes back in 24 hours.` |
| Keep a bet | `Keep` | `Moves it to Now on the roadmap.` | `Kept. It moves to Now on the roadmap.` |
| Drop a bet | `Drop` | `Takes it off the backlog. Critic's concern stays on the record.` | `Dropped. Critic's concern stays on the record.` |
| Start work | `Start a run` | `Your crew plans the steps and runs them.` | `Started. Engineer is reading the repo.` |
| Stop a run | `Stop` | `Ends the run. Finished work is kept.` | `Stopped. What finished is saved.` |
| Retry | `Try again` | `Reruns the failed step with the same inputs.` | `Retrying. Same step, fresh attempt.` |
| Connect a source | `Connect` | `Scout reads it on the next sweep. Nothing is written back.` | `Connected. Scout reads it at 2am.` |
| Adopt a method | `Adopt` | `Adds it to the record with its source learnings.` | `Adopted. It is on the record with 4 learnings behind it.` |
| Correct memory | `Correct this` | `Future runs use your version.` | `Corrected. Your version is what the Brain believes now.` |

If two rows would want the same verb, they are the same act and they merge. If a new surface wants
`Confirm`, `Accept`, `OK`, `Submit` or `Go`, it takes the registry verb instead.

### 9.2 Receipt grammar

```
{Actor} {past-tense verb} {object}{, on {N} {evidence noun}}. {time}   [{trace}]
```

- **Actor first.** The sentence opens with who. This one rule turns provenance from metadata into a
  statement.
- **Exactly one evidence clause**, always a count, always a door. `on 9 signals`, not a list of
  nine. Clicking the count opens them.
- **Time last, in the prose.** Relative under 7 days, absolute after. Ship and spend events are
  always absolute.
- **Ids are never in the prose.** The trace ref lives in a dim mono tail with copy-on-click, which
  `today.tsx:761-772` and `CallDetailSheet.tsx:560` already do correctly. Keep that anatomy.
- **No adverbs of quality.** `successfully`, `cleanly`, `automatically` are banned. A receipt
  states; it does not grade.
- **Supersession is in the same line, never silent.** `Superseded by Writer's revision, 2 days ago`
  is part of the receipt or the record is not trustworthy.
- **Money appears only where a human authorised spend.** `$0.42 so far on this call` on the gate the
  human is about to answer is correct. Never on an activity row nobody authorised.

### 9.3 The believability floor

The founder's law: a 3-minute build makes no logical sense. Numbers are copy and must survive
scrutiny.

| Rule | Effect |
| --- | --- |
| A run-class receipt whose real elapsed is under 60 seconds shows **step count, not duration** | `Engineer wrote the change in 6 steps.` never `Engineer built it in 47 seconds.` |
| Durations are never rounded up to look substantial, nor down to look fast | Render real elapsed, or render nothing |
| A count of zero is stated, never hidden | `on 0 signals` renders as `with no signals behind it`, and that receipt is a warning, not a receipt |
| A timestamp implying impossible parallelism is not rendered | If two agents show the same second on the same object, collapse to one line with both actors |

**Withholding is allowed; inventing is not.** Before launch, measure p10 elapsed per object type and
record the measured floors here. Until they are measured, the single 60-second rule above is the
only floor, because an unmeasured floor is itself an invented number.

### 9.4 The three densities

**Line** (activity strips, Today, list rows). Actor, act, object, relative time. No id, no cost.
```
Engineer opened a pull request on checkout autofill.   12 minutes ago
Scout clustered 34 signals into 3 patterns.             6 hours ago
You approved the pricing spec.                          yesterday
```

**Card** (call detail, artifact header). Adds the evidence door, the model when a human is about to
authorise spend, and the absolute time on hover.
```
Writer drafted the checkout spec, on 9 signals.         14 minutes ago
  Evidence      9 signals, 2 customer quotes        >
  Model         (only on a call the human is answering)
  Spend so far  $0.42                              (only on a call)
```

**Record** (the engine room). Adds the trace id, the verification state and the full chain, in mono.
```
Writer   drafted   checkout-spec        Jul 14, 09:41   PRD·4c9a  [copy]
You      approved  checkout-spec        Jul 14, 10:02   APR·77e1  [copy]
Engineer opened    PR #418              Jul 14, 10:02   RUN·1b30  [copy]
                                        sealed and verified
```

### 9.5 The provenance footer

Anything exported or shared carries one line. No tagline, no logo lockup, no marketing:
```
Decided by you. Drafted by Writer on 9 signals. Shipped Jul 14, 16:12.
```
This is the one place the product's whole claim is stated, and it is stated entirely in facts.

### 9.6 Receipt anti-patterns

| Anti-pattern | Why it reads as noise | Instead |
| --- | --- | --- |
| Leading with the id or trace ref | The reader parses a hash before a fact | Actor first, id in the mono tail |
| Dumping every source inline | Nine sources is a wall, not evidence | One count, one door |
| Repeating the receipt three times on one screen | Fails the purpose test | One receipt per object per screen |
| `successfully completed` | Grading, and two words for zero information | The past-tense verb alone |
| A cost on a row the user never authorised | Reads as a meter running against them | Cost only on calls and in the engine room |
| A receipt with no actor (`Run archived`) | Provenance with the provenance removed | `You archived it.` or `Supaprod archived it after 90 days.` |

---

## 10. VOICE

### 10.1 The register in one paragraph

Supaprod talks like a sharp colleague who runs the machine and has nothing to hide. It states what
is true, then what happens next, then stops. It never sells inside the app. It never apologises. It
never hedges. When it cannot do something it says so before you ask, in the same breath as what it
can do. When it did something on your behalf it hands you the receipt without being asked.
Contractions on. Active voice. Sentence case. One idea per sentence.

**The speaker rule, which carries most of this section: every sentence in the product is spoken by
a named actor, and the actor is either a crew member or you.**

### 10.2 Person, by speaker

| Speaker | Person | Where it is legal | Example |
| --- | --- | --- | --- |
| A named crew member | Third person, named | Every working line, every receipt, every state that names who acts next | `Engineer is fixing the failing check.` |
| You | Second person | Everything addressed to the human | `Your call. Approving starts the rollout.` |
| Chief of Staff, in conversation only | **First person singular** | The composer and thread ONLY, where a human typed at it and expects a reply | `I read the last six weeks of tickets. Three patterns hold up.` |
| Supaprod, the whole system | Third person, named, **max once per screen** | Acts no crew member owns: sweeps, memory consolidation, billing, retention, security | `Supaprod keeps every call on the record for 12 months.` |
| The company | First person plural | **Illegal in the app.** Legal only on `/privacy`, `/terms`, `/security` and marketing routes | `We never read your source code.` |

The first-person-singular licence is deliberately narrow: a reply to something you typed is a
conversation, and a conversation without an `I` is a worse lie than the `I`. The Chief of Staff
never says `I` in a toast, a card, a header or a receipt.

### 10.3 Tense, by state

| State | Tense | Shape | Example |
| --- | --- | --- | --- |
| Running | Present progressive | `{Actor} is {predicate}` | `Writer is tightening the acceptance criteria` |
| Waiting on you | Simple present, second person | `{what waits}. {why yours}. {what approving starts}` | `Engineer wants to open a pull request. Approving pushes the branch and opens it on your repo.` |
| Finished | **Simple past** | `{Actor} {verb}ed {object}{, evidence}. {time}` | `Writer drafted the checkout spec on 9 signals. 14 minutes ago` |
| Blocked | Simple present, then imperative | `{plain reason}. {recovery verb}.` | `Your GitHub token expired. Reconnect to resume.` |
| Scheduled | Simple present with a real clock | `{Actor} {verb}s {object} at {time}` | `Scout reads your sources again at 2am` |
| Nothing happening | Simple present negative, then the trigger | `Nothing {verb}s yet. {Actor} starts when {condition}.` | `Nothing running yet. Engineer starts when you approve a spec.` |

**Banned tense moves.** No future without a real trigger or clock (`will soon`, `shortly`,
`in a moment`). No present perfect as a receipt (`has been approved`), because it hides who did it.
No passive voice anywhere a human or an agent did the thing.

### 10.4 How the machine refers to itself

| Situation | Say | Never say |
| --- | --- | --- |
| One agent doing the work | `Engineer` | `the agent`, `the AI`, `Supaprod` |
| Two agents on one object | `Writer and Critic` | `the agents`, `the swarm` |
| Three or more | `your crew` | `the agents`, `the team`, `the fleet` |
| The whole roster as a body | `your crew` (label: `Crew`) | `the agents`, `the mesh` |
| A whole-system act nobody owns | `Supaprod` | `we`, `the platform`, `the system` |
| Talking about itself in a reply you asked for | `I` (composer only) | `Supaprod thinks`, `As an AI` |
| The record of what happened | `the record` | `the ledger`, `the audit trail`, `logs` |

Crew names are proper nouns: always capitalised, never `the`. `your crew` is lowercase and always
takes `your`. `Supaprod` is never possessive on a user's object: `your workspace`, never
`Supaprod's workspace`.

### 10.5 The do / do-not table, with the live failure each rule was written against

| # | Do | Do not | The live string that failed |
| --- | --- | --- | --- |
| 1 | Name the actor first | Use a nameless machine | `Approved. The agent is unblocked.` (`today.tsx:616`) |
| 2 | Say `you` and `your` | Say `the user`, or the person's name outside the one greeting | `How Supaprod and your agents will greet you.` (`settings.tsx:3319`) |
| 3 | State what is true right now | Claim a standing property you cannot prove at that instant | `The loop is running itself.` (`Hero.tsx:11`) with zero runs live |
| 4 | Use the object the person came for | Use the container it renders in | `The activity lanes didn't load.` (`today.tsx:1445`) |
| 5 | One idea per sentence, two sentences max | Stack four clauses into a subtitle | `build.index.tsx:693` |
| 6 | Put the consequence in helper text beside the button | Put it inside the button label | `Sign in · opens your workspace` (`login.tsx:251`) |
| 7 | Verb plus object, sentence case, 3 words | Bare `Submit`, `OK`, `Go`, `Confirm`, or a sentence | `Launch what we shipped` (`faces.tsx:2228`) |
| 8 | Past tense with a named actor for anything finished | A status noun as a receipt | `Mission running.` (`build.index.tsx:266`) |
| 9 | Present progressive with a named actor for anything running | A subjectless gerund | `Generating...` (`ChangesPanel.tsx:580`) |
| 10 | Give a number when you have one | Give an intensity word (`several`, `many`, `significantly`) | none live; hold the line |
| 11 | Say the time you actually know | Invent a duration or a countdown | founder law, section 9.3 |
| 12 | Let a receipt state | Let a receipt grade (`successfully`, `cleanly`, `Success!`) | none live; hold the line |
| 13 | Say what broke and the one verb that fixes it | Apologise (`Oops`, `Sorry`, `Something went wrong`, `Hold on`) | `title="Hold on, signing you in"` (`login.tsx:156`) |
| 14 | Use the middot only between peer fragments in a mono meta line, two per line max | Use it inside a sentence as a dash substitute | `you make the calls · Supaprod runs the rest` |
| 15 | End working labels with no punctuation | End them with an ellipsis | `Drafting today's brief...` (`today.tsx:301`) |
| 16 | Name the crew member who is waiting on you | Say `agents` or `AI` as a bare category | `Give the agents a goal` (`build.index.tsx:315`) |
| 17 | Use the engine's word in the engine room | Use the engine's word on a PM surface | `Cap the blast radius of the tools this agent can call` (`settings.tsx:2411`) |
| 18 | Write the same verb for the same act everywhere | Ship synonyms per surface | `Send back` (`today.tsx:805`) vs `Rejected` (`approvals.tsx:41`) |
| 19 | Keep subtext to two lines and let the artifact carry the specifics | Repeat in subtext what the headline already said | `build.index.tsx:691-693` |
| 20 | Cut the sentence if you cannot name who moves next | Ship a line that leaves the reader with nothing to do | `New calls surface here first.` (`today.tsx:1336`) |

### 10.6 The three-question test, applied before any string ships

1. **Who is speaking?** If the answer is not a crew member, you, or Supaprod-as-a-whole-system,
   rewrite.
2. **Who moves next, and when?** If the sentence does not answer it and is not a pure label,
   rewrite.
3. **Would this still be true if I read it out loud to the founder with the screen behind me?**
   If any clause could be contradicted by what is on screen, rewrite.

### 10.7 Already right. Do not touch.

| File:line | String | Why it is the target |
| --- | --- | --- |
| `approvals.tsx:201` | `Everything that needs you. Nothing that doesn't.` | Two sentences, a promise and its limit, zero mechanism. The high-water mark. |
| `settings.tsx:2472-2474` | `needs review` / `asks first` / `runs alone` | Three postures in seven words, each unambiguous, none jargon |
| `today.tsx:1401` | `{n} answered · {m} open` | Two real numbers, no shifting denominator, correct middot use |
| `CommandPalette.tsx:280` | `Try a verb, like challenge or connect.` | Teaches by example in six words |
| `nav-model.ts:78` | `What needs you now.` | The best destination subtitle in the file |
| `login.tsx:145` | `Trouble signing in? Ask your workspace admin to check your invite.` | Names the real recovery path, not a support address |
| `admin.pricing.tsx:210` | `Nothing was changed.` | An error that states what survived |
| `today.tsx:1401`, `faces.tsx:2496` | count-with-verb-agreement from one call site | The only correct plural pattern in the repo |

---

## 11. NUMBERS, DATES, TIMES, DURATIONS, COUNTS

The founder treats timestamps as copy and checks them for plausibility. This is a correctness
surface, not a formatting preference.

### 11.1 One module, and the eleven implementations it kills

There is no shared formatter today. There are at least eleven independent implementations of "how
long ago", each with different thresholds, rounding and casing: `relTimeCaps`
(`discover/format.ts:17`), `shortTime` (`ink/ApprovalCard.tsx:34`), `expiryLabel` and `expiredAgo`
(`today/triage.ts:49,68`), `StageTimeline.tsx:32`, `MissionOrchestratorDetail.tsx:122`,
`build.$missionId.tsx:145`, `ask-blocks.tsx:64`, `MembersCard.tsx:52`, `SessionTimeline.tsx:32`,
`DecisionCard.tsx:393`, `MeetingsRow.tsx:22`, plus 14 bare `toLocaleDateString()` sites and two
local `const plural = (n) => (n === 1 ? "" : "s")` definitions.

**Ship `src/lib/format/` with exactly these exports. Nothing else formats a number or a date.**

```ts
relTime(iso, now?)        // "just now" | "12m ago" | "4h ago" | "3d ago" | "Jul 21"
until(iso, now?)          // "in a moment" | "in 12m" | "in 4h" | "in 3d" | "on Jul 21"
absDate(iso, opts?)       // "Jul 21" | "Jul 21, 2025" | "Jul 21, 14:20"
duration(ms, opts?)       // "48s" | "12m" | "1h 20m" | "2d 4h"
elapsed(startIso, now?)   // "running 12m"
count(n, one, many?)      // "1 spec" | "3 specs"
list(parts)               // "a, b, and c"
money(usd)                // "$0" | "<$0.01" | "$4.20" | "$1,240"
credits(n)                // "1,240 credits"
pct(num, den)             // "42%" | "3 of 4" when den < 5 | null when den === 0
ms(n)                     // "150ms" | "1.2s"
traceRef(id)              // existing, moves here unchanged
```

**The mono caps chip form is CSS, not a second function.** `relTimeCaps` is deleted; the chip
applies `text-transform: uppercase` to `relTime()`'s output. That single change removes the whole
class of "the chip says 12M AGO and the row says 11m ago" drift.

### 11.2 Relative time

| Delta from now | Output | Note |
| --- | --- | --- |
| Future by more than 2 minutes | the `until()` forms | A "created" field in the future is clock skew, not the future |
| Future by up to 2 minutes, on a past-event field | `just now` | Never render a negative |
| 0 to 44 seconds | `just now` | **Seconds are never shown in a relative time.** |
| 45s to 59m | `12m ago` | Floor, minimum 1. Never `0m ago`. |
| 1h to 23h | `4h ago` | Floor, not round. `1h 59m` reads `1h ago`. |
| 24h to 6d | `3d ago` | Floor |
| 7d and beyond, same year | `Jul 21` | Relative stops. Nobody counts 34 days. |
| 7d and beyond, prior year | `Jul 21, 2025` | Year appears only when it differs from now |
| Invalid, missing, unparseable | **render nothing and collapse the slot** | Never `Invalid Date`, never the raw ISO, never `-` |

`shortTime` currently **rounds**, so a 31-minute-old call reads `1h ago`; `relTimeCaps` **floors**.
**Floor wins everywhere:** overstating age makes a fresh call look stale, which is a judgment error,
not a cosmetic one.

Future forms: `in a moment` (under 60s) · `in 12m` · `in 4h` · `in 3d` · `on Jul 21`.

**Live updating.** Any relative time visible for more than 60 seconds re-renders on a shared
30-second tick. A frozen `12m ago` that is actually three hours old is a lie the founder will catch.
If a surface cannot tick, it uses `absDate` instead.

### 11.3 Absolute dates and clocks

| Case | Format | Example |
| --- | --- | --- |
| Date, current year | `MMM d` | `Jul 21` |
| Date, other year | `MMM d, yyyy` | `Jul 21, 2025` |
| Date with time | `MMM d, HH:mm` | `Jul 21, 14:20` |
| Time only, today | `HH:mm` | `14:20` |
| A day header in a schedule | `EEEE, MMM d` | `Tuesday, Jul 21` |

**24-hour clock everywhere.** The codebase currently mixes `hour12: false` with 12-hour formatting
in four files. 24 wins: unambiguous for a distributed team, fixed-width in tabular numerals, and it
matches the console register.

**Timezone.** Everything renders in the viewer's local zone. Any surface where the zone is
load-bearing appends the abbreviation once per region, not per row: `All times in IST`. Never render
an unlabelled UTC timestamp to a human.

**No weekday names** outside schedule day headers. Never mix `Today` / `Yesterday` words into a
column that also uses dates; pick one form per column.

### 11.4 Durations

| Length | Format | Example |
| --- | --- | --- |
| Under 60s | `<n>s` | `48s` |
| 1m to 59m | `<n>m` | `12m` |
| 1h to 23h | `<n>h <n>m`, second unit dropped when zero | `1h 20m`, `2h` |
| 24h and over | `<n>d <n>h`, second unit dropped when zero | `2d 4h`, `3d` |
| Still running | `running <duration>` | `running 12m` |

Never three units (`1h 20m 14s`). Never a decimal duration (`1.5h`). Never a bare number for a
running span; a span with a start and no end is `running`, or it is nothing. The believability floor
in section 9.3 governs what is withheld.

### 11.5 Counts, singular, plural, zero

**One helper: `count(n, one, many?)`.** Regular plurals derive by appending `s`; irregulars pass the
second form. The 25-plus inline ternaries and the two local `plural` consts all go.

| n | Output | Rule |
| --- | --- | --- |
| 0 | **A sentence, not a number.** | Zero is a state and the state block owns it. Never `0 specs`, never `No specs (0)`. |
| 1 | `1 spec` | Digit, not the word, in any string that also shows other counts |
| 1, alone in prose | `One call is waiting.` | The word, when it is the only number in a prose sentence |
| 2+ | `3 specs` | |
| 1,000+ | `1,240 specs` | Locale grouping. Tabular numerals in any column. |
| 10,000+, stat tile or chart axis only | `12.4K` | **Never compact form inside a sentence.** |

**Numeric zero is allowed in exactly two places:** a metric tile where the axis is the point (`$0`,
`0 failures`), and a filter chip count (`Gates 0`). Everywhere else zero is prose.

**Counts are exact or absent.** Never round a count, never approximate one, never "about 40
signals". Rounding is for measures (money, latency, percentages), never for things you could have
counted.

Truncated lists: `+3 more`. Never `and 3 others`.

**Verb agreement ships with the count, from the same call site**, because it is the same decision:
`count(n, "call waits", "calls wait")`.

### 11.6 Money, credits, percentages, latency

**Money.** `$0` at exactly zero · `<$0.01` below a cent · two decimals under $1,000 (`$4.20`) ·
whole dollars at $1,000 and above (`$1,240`, never `$1,240.00`).

**Credits are counts, not money.** `1,240 credits`. Never a `$` on a credit. Never a decimal credit.
The two live side by side in Settings and the distinction has to be visible at a glance.

**Estimates** carry a mono `est.` prefix in the meta line: `est. $0.40`. Never a tilde in prose. An
estimate never appears in a success sentence.

**Percentages.** Integer by default. One decimal only below 10% and only when the extra digit
changes a decision. **A percentage on a denominator under 5 is banned**; render the fraction:
`3 of 4`, not `75%`. `0%` and `100%` are written as prose in any human-facing sentence (`every
reviewed bet held up` beats `100.0% validated`); the digits survive only in a chart or stat tile.

**Latency and token counts are mono meta, never prose:** `150ms`, `1.2s`, `4.1K tokens`. They never
appear in a toast.

### 11.7 The plausibility checklist, run before shipping any surface with numbers

1. Does every relative time floor rather than round?
2. Does any timestamp render in the future for a past event?
3. Does any run-class receipt under 60 seconds show a duration instead of a step count?
4. Does any count render as `0`?
5. Does any percentage sit on a denominator under 5?
6. Does any number update on a tick, or is one frozen at first paint?
7. If a source failed, is any total still showing as if complete?
8. Do a mono chip and its adjacent prose ever disagree about the same instant?

---

## 12. BANS, OVERRIDES, AND LINT

### 12.1 Banned product-wide

**Dead names.** Any appearance is a bug: `Cadence` as the product name · `Pulse` as a destination ·
`Artifacts` · `Mission` · `Studio` · `Builder` · `Knowledge` · `Memory` as a surface ·
`Opportunity` · `PRD` · `Fleet` · `Swarm` · `Cast` · `Roster` · `Cockpit` · `Inbox` · `Briefing` ·
`Sense` · `Define` · `Station` · `Watch` · `Listen` · `Prioritize` · `Challenge` · `Draft` as a name ·
`Announce` · `Measure` · `Reactor` · `Archivist` · `Herald` · `Historian` · `Ledger` in copy.

**Vague category words** (founder law): `operating system` · `chatbot` · `copilot` · `assistant` ·
bare `AI` · bare `agents` · `agentic` · `autonomous` as an adjective on something the user can see ·
`platform` · `solution` · `AI-powered`. Fix by qualifying: not "agents", but "agents that ship real
code".

**Vendor and competitor names**: zero, anywhere in the authenticated app, including as analogies and
including in placeholder text. Provider names survive only as a connector's own row label and in
admin-only credential fields.

**Person violations**: `we`, `us`, `our` (the product never speaks as a company inside the app; the
only exceptions are `/privacy`, `/terms`, `/security`) · `the user` · `users` · `folks` · `let's`.

**Machine tells**: `...` and `...` in any position · trailing `!` · `Oops` · `Sorry` · `Success!` ·
`Something went wrong` · `Unknown error` · `Forbidden` · `Please wait` · `Hold on` · `Loading` as a
visible word · `Processing` · `Working` and `working` as a standalone label · `Are you sure` ·
`Note that` · `Simply` · `Just` · `We recommend` · `Please` · `Confirm` / `OK` / `Yes` as a button ·
`Coming soon` without a named gate · Title Case On Buttons.

**Plumbing nouns on PM surfaces**: `mission` · `changeset` · `session` · `build` as a noun · `lane` ·
`swarm` · `station` · `face` · `arc` · `blast radius` · `fan-out` · `queue depth` · `checkpoint` ·
`trace` as a noun (`trace id` on a copy affordance is fine) · `eval` · `guardrail` · `drift`.
Legal inside the engine room, illegal everywhere a PM reads.

**Formatting law, unchanged and non-negotiable** (`docs/conventions/humanized-output.md`): no em
dash, no en dash, no invisible Unicode, no AI-cliche phrasing, in both authored and generated text.
Extended here: the ellipsis character is also banned from UI strings. Semicolons are banned from UI
copy, because nobody speaks in semicolons; use two sentences or a middot.

**Protected, not the brand**: the generic English word `cadence` ("release cadence") and the DB
`cadence` schedule-frequency column stay untouched.

### 12.2 What this file overrides

| Document | What is overridden |
| --- | --- |
| `docs/conventions/ui-voice.md` | Button budget replaced by the three tiers (5.2); toast budget tightened from 12 to 10 words split 6+4; empty-state budget replaced by the four-slot anatomy with a 2-sentence prose cap; "lightly playful in safe places" replaced by the warmth-everywhere / playfulness-in-two-places split (R8). Length budgets for H1 and subhead, the buzzword denylist, sentence case and the confirm pattern all stand and are extended, never reversed. |
| `docs/conventions/humanized-output.md` | Nothing reversed. Extended with the ellipsis ban, the semicolon ban, and the narrowing that "our nouns" means the nouns on the surface the reader is standing on, not the nouns in the schema. The Tier 2 relaxation for internal docs stands for docs but is suspended for the rebuild's UI strings: every authored string is Tier 1 from the first keystroke. |
| `src/lib/agent-vocabulary.ts` header, "THE VOICE GRAMMAR (PC-28)" | The D-family claim (Discover, Decide, Define, Design): "Define" is deleted. The claim that the catalog "is the single source of truth and the one growable axis" is overridden by the crew cap of thirteen. |
| `src/lib/agent-vocabulary.ts:16` "DB slugs are NEVER renamed" | Upheld for slugs, narrowed: it never covered seeded `agents.name` values, which must migrate (4.5). |
| `src/lib/agent-vocabulary.ts:9,54` "CREW: engine-only mechanisms" | "Crew" now means the thirteen user-facing agents. The engine-only tier becomes "machinery" and loses its names. |
| `src/lib/nav-model.ts:24-29` | The comment stands: Pulse does keep the `/engine-room` route, because Pulse is deleted and the route is the survivor. The label changes, the route does not. |
| `docs/features/obsidian-port.md` and the 2026-06-18 AGENT-EXP pass | The verb-named agent roster is retired in full. |
| `docs/conventions/engine-room-doctrine.md` | Nothing. The doctrine, the filename and the greppable `Engine-Room:` stamp all survive, and R1 restores the surface name to match them. |
| lang-a, lang-b, lang-c | Superseded in full by this file. Section 1 records every ruling. |

### 12.3 Lint rules to wire (extends `scripts/check-humanized.sh`)

| Rule | Check | Blocks |
| --- | --- | --- |
| `no-ellipsis` | any `...` or `\.\.\.` in a UI string | yes |
| `no-dashes` | em dash, en dash, invisible Unicode | yes |
| `no-raw-date-format` | `toLocaleDateString` / `toLocaleTimeString` / `Intl.DateTimeFormat` outside `src/lib/format/` | yes |
| `no-inline-plural` | `=== 1 ? "" : "s"` outside `src/lib/format/` | yes |
| `no-banned-nouns` | the 12.1 dead names and plumbing nouns in JSX text and string literals under `src/components` and `src/routes`, excluding `engine-room/**` | yes |
| `no-agent-name-literal` | no string literal contains a crew display name except through `crew.ts`. Catches the Scout / Watch drift live today. | yes |
| `no-first-person-plural` | `\bwe\b`, `\bour\b`, `\bus\b` in UI strings outside `/privacy`, `/terms`, `/security` | yes |
| `no-title-case-button` | two or more capitalised words in a `<Button>` child, excluding known proper nouns | warn |
| `disabled-needs-reason` | `disabled={...}` on a `<Button>` with no `title` and no `aria-describedby` | warn |
| `no-toast-success-in-onerror` | `toast.success` inside an `onError` callback | yes |
| `no-vendor-in-copy` | the vendor list in JSX text, allowlisted per connector row | yes |
| `primary-button-has-action-id` | every `variant="primary"` button resolves an id from `actions.ts` | warn |
| `action-has-toast` | every `ActionSpec` has a non-empty `toast`, or `toast: null` with a one-line reason | warn |
| `no-middot-abuse` | more than two `·` per string literal, or one adjacent to a lowercase clause opener | warn |

---

## 13. WHAT SHIPS AS CODE

| Path | Contents |
| --- | --- |
| `src/lib/crew.ts` | The thirteen display names from 3.2, keyed by frozen slug, plus `LOOP_STAGES`, `crewAtStage()`, `machinery()`. The single source; nothing hardcodes an agent name in a string. |
| `src/lib/voice/decks.ts` | `mission-vocabulary.ts` carried over unchanged, plus the bridge deck as the level-5 fallback and a `drawWorkingLine` that **cannot return a generic word**. |
| `src/lib/voice/actions.ts` | The 9.1 table as `ActionSpec { id, button, helper, toast }`. Primary buttons take an `action` id, never a raw label. |
| `src/lib/voice/receipt.ts` | `formatReceipt(actor, verb, object, evidence?, time)` implementing 9.2 and the 9.3 floor. Nothing composes a receipt by hand. |
| `src/lib/voice/waits.ts` | The 8.6 plain-wait strings. Fixed, non-rotating, no personality. |
| `src/lib/copy/states.ts` | Per-surface state copy keyed by `(surface, StateKind)`, so a state's four slots live in one place and can be reviewed as a set. |
| `src/lib/format/index.ts` | The twelve exports in 11.1. Pure, no React, unit-tested against the tables in 11.2 to 11.6. |
| `src/components/state/StateBlock.tsx` | The one state primitive (6.1). Absorbs `WarmSlot` as a `sample` prop. |
| Tool registry | An outcome label becomes a **required** field on every registered tool, so `ACTION_LABEL`'s ten entries become full coverage by construction. |

**Deleted:** `relTimeCaps`, `shortTime`, `expiryLabel`, `expiredAgo`, the two local `plural` consts,
the 14 bare `toLocaleDateString()` sites, `WarmSlot`, `TOAST_APPROVE` / `TOAST_REJECT`,
`AGENT_FACES` and its whole family.

### 13.1 The six defects this sweep also fixes

1. `approvals.tsx:148` renders a failure as a success toast carrying a raw server message.
2. `Forbidden` reaches the UI from six server modules with no mapping.
3. The deferral button and its toast use different verbs, so the user cannot describe what they did.
4. `shortTime` rounds while `relTimeCaps` floors, so the same instant reads two ages on one screen.
5. `ProductAnalyticsPanel.tsx:210` names a vendor in user copy, against a standing founder rule.
6. Two agent name sets render simultaneously, so Today says "Critic" and the roster says "Challenge"
   about the same agent.

### 13.2 Definition of done for a rebuilt surface

- [ ] Every button label appears in section 9.1 or follows 5.2 and 5.3.
- [ ] Every primary button resolves an action id, and its toast was written with it.
- [ ] Every disabled control carries a reason from 5.7.
- [ ] All applicable states render through `StateBlock`, and each was viewed in the running app.
- [ ] The zero state and the empty state are different strings.
- [ ] The upstream state names its stage by the exact nav label.
- [ ] Every working line names its actor and none can resolve to a generic word.
- [ ] No date, time, duration, count, money or percentage is formatted outside `src/lib/format/`.
- [ ] The plausibility checklist (11.7) passes.
- [ ] `rg " - | - |...|\.\.\.|;"` over the changed files returns zero in UI strings.
- [ ] No noun from the 12.1 ban list survives.
- [ ] The three-question test (10.6) passes on every sentence.
- [ ] The stranger test passes on every label: a person who has never seen this product knows what
      happens when they click it and what they get afterwards.

---

## 14. OPEN QUESTIONS FOR THE FOUNDER

Four. Each has a default that ships if nothing is said, so no work is blocked.

**Q1. Engine room replaces Pulse.** This is the one ruling that overrides two of the three lanes.
Choosing `Pulse` would mean renaming the route, the component directory, `ENGINE_ROOM_PATHS`, the
doctrine file and the greppable `Engine-Room:` stamp; choosing `Engine room` changes one string and
makes label, URL, code and doctrine agree for the first time. It is also your own doctrine word.
_Default: ship `Engine room`, delete `Pulse`._

**Q2. The crew is capped at thirteen.** A fourteenth agent requires deleting one. This is what keeps
it a crew and not a directory, and it retires the current "adding a specialist is one entry" growth
story in `SPECIALIST_CATALOG`. It is a roadmap constraint, not a language one.
_Default: the cap holds._

**Q3. "Ledger" is retired from all app copy in favour of "the record".** Investor canon says
"tamper-evident ledger" outward-facing. This contract keeps that word out of the product and says
`sealed` and `tamper-evident` where the seal is the point. Confirm the app-versus-outward split is
acceptable, or say the word ships inside the app on enterprise surfaces.
_Default: `the record` inside the app, `ledger` only outward-facing._

**Q4. Chief of Staff is the only multi-word job title in a roster of twelve person-nouns.** It
breaks the pattern (Scout, Writer, Planner, Engineer, and then a three-word title). Both lanes kept
it because it is already in your convention file as one of "our nouns". The alternative that fits
the pattern is `Conductor`.
_Default: keep `Chief of Staff`._
