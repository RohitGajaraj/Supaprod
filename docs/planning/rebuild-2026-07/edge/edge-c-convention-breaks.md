# EDGE C: Where to break convention to win

> _Created: 2026-07-29 · Last updated: 2026-08-03_

> Rebuild 2026-07, edge lane C. Written 2026-07-28 against the founder's direct question:
> how do we break a monopoly or a design principle to penetrate the market, attract users,
> delight customers, and still do the job.
>
> **Scope.** This lane owns the category conventions that are accidents rather than necessities,
> and the specific breaks worth taking. It does not own the IA (settled in
> [`../ia/FINAL-ia.md`](../ia/FINAL-ia.md)), the lexicon (settled in
> [`../language/FINAL-language.md`](../language/FINAL-language.md)), or the visual system
> (settled in [`../craft-law.md`](../craft-law.md) and `docs/design/archive/tempo-v5.md`). Where this document
> and those disagree on a word, a route or a pixel, they win. Where they are silent on whether
> a convention should exist at all, this document answers.
>
> **Every code claim below was read this session.** Line numbers, file paths, export names and
> counts are verified, not remembered. Section 9 is the evidence appendix. Where a fact in the
> brief was wrong, the corrected fact is stated and the correction is flagged.

---

## 0. THE ONE-PARAGRAPH ANSWER

Lovable's differentiation is hiding the work. Supaprod's differentiation is proving it. The brief
proposes resolving that with "hide the mechanism, show the evidence." That is directionally right
and operationally useless, because it gives no test for which is which. The resolution that
survives every hard case is sharper:

> **Machinery is hidden until it becomes causal. The instant a piece of plumbing changed what the
> user got, it stops being plumbing and becomes evidence, and it surfaces as a past-tense sentence
> attached to the thing it changed, never as a live dial the user has to watch.**

And the moat survives that hiding, because the moat was never the visibility of the record. It is
the record's three jobs: it can be verified on demand, it is cited when the crew acts, and it
contradicts you when you are about to repeat a mistake. Only the third is a front-surface behavior.
Which produces the line that should govern this whole product:

> **A record that has never contradicted you is indistinguishable from a log file.**

The proof of the brain is not that you can read it. It is that it stopped you. Everything in
section 4 falls out of those two sentences.

---

## 1. RESOLVING THE TENSION

### 1.1 Why "hide the mechanism, show the evidence" is not yet a doctrine

Test it on three cases and it breaks in three different ways.

**Case one, the git branch.** Mechanism, obviously. Hide it. But the branch is precisely why the
user is safe: their live code was never touched. Hide the branch and you have hidden the safety
story along with the jargon. The doctrine as written tells you to delete the most reassuring fact
in the flow.

**Case two, the failing CI check.** Is a red build mechanism or evidence? Both, at different
granularities. The verdict ("two tests fail") is the single most decision-relevant fact on the
screen. The runner name, the workflow file, the job matrix and the retry count are plumbing. The
doctrine has no granularity axis, so it cannot split them.

**Case three, model fallback.** The model router is mechanism on every ordinary day. On the day the
primary provider was down and the draft came from a weaker model, it is the single most important
thing about that draft. Same subsystem, different day, opposite answer. A doctrine keyed on the
*kind* of thing cannot produce that.

The common failure: the brief's doctrine classifies **objects**. The correct doctrine classifies
**moments**.

### 1.2 The three laws

**Law 1, the causal test.** Machinery is hidden by default. It surfaces at the exact moment it
became causal, meaning: had it gone the other way, the user would have received something
different. A branch that behaved is invisible. A branch that collided is a call. A model that
answered is invisible. A model that fell back is a line on the artifact it produced.

The test is one question, applied to every mechanism, every time: **did this change what the user
got?** No means silence. Yes means a receipt. Yes and it needs a human to unblock means a call.

This law is what makes the doctrine cheap to apply, because it collapses to three states, and the
language contract already has words for all three: **silent**, **receipt**, **call**.

**Law 2, the grammar law.** The difference between plumbing and a receipt is grammar, not content.
`merged PR #412 into main` is plumbing. `Reviewer checked the diff at 11:52. You approved it. It
went live.` is a receipt. Same underlying event, same underlying row, and one of them a PM will
read. This is already law in
[`../language/FINAL-language.md`](../language/FINAL-language.md) section 3.3 (agents are proper
nouns, receipts are past simple, no bare-verb subjects). Edge C ratifies it and adds the
consequence: **we do not need a second data model to make the record human. We need one rendering
layer over the one we have.** Any proposal that says "we should log this in a friendlier way" is
proposing a sentence template, not a schema.

**Law 3, evidence is pulled, never pushed, with exactly one exception.** The record is one keystroke
away at all times (the depth rail, `r`, verified as the IA's ruling) and never in the default frame.
The single exception, and the only time proof is allowed to interrupt: **when the record contradicts
what you are about to do.** A precedent that fights your current call is not decoration; it is the
product doing its job. Everything else waits to be asked.

This is the law that keeps the moat from becoming a control room. It says the ledger is allowed to
be almost entirely invisible, provided it is verifiable on demand and audible when it disagrees.

### 1.3 Why this does not cost us the moat

The moat argument in [`../../../strategy/moat.md`](../../../strategy/moat.md) is layer 2:
outcome-labeled judgment, accrued over calendar time, inside a loop the competitor does not run. It
is a **data** moat, not a **display** moat. Nothing about it requires the user to look at it daily.
What it requires:

1. **Verifiability on demand.** The SHA-256 seal in `src/lib/trust-verify.ts`, consumed by
   `src/lib/trust-ledger.functions.ts` (955 lines), exists so a receipt can be proven unedited when
   somebody asks. A seal nobody checks is still a seal that would catch an edit. Its value is
   contingent, not continuous.
2. **Citation at the moment of action.** `HandoffPayload.evidence_ids` in
   `src/lib/ai/handoff.server.ts` makes the crew's internal claims checkable by the receiving agent.
   That is machine-to-machine. The user does not need to watch it happen.
3. **Contradiction at the moment of judgment.** This is the only one that must be on the front
   surface, and it is the one that is currently least wired.

So the honest read of the tension is not "hide versus prove". It is: **we have been building proof
as an archive and shipping it as a surface, when its highest-value form is an interruption.** The
archive stays. It stops being the pitch.

### 1.4 What the engine-room doctrine got right and where it stops

[`../../../conventions/engine-room-doctrine.md`](../../../conventions/engine-room-doctrine.md) is
correct and was never applied. Its four rules survive contact with the hard cases. Its gap: it has
no theory of **when depth must come forward uninvited**. Rule 3 says "reveal on demand, never by
default", full stop. Under that rule, the contradiction case in Law 3 is illegal, and the single
most valuable behavior in the product is forbidden by our own first UX law.

Edge C amends it, and this is a real amendment that should be carried back into the convention file:

> **Rule 3, amended.** Depth is revealed on demand, with one exception: depth that contradicts the
> user's current action comes forward uninvited, inline, at the moment of the action. This is not
> control-room creep, because it names an outcome ("you decided the opposite in March and it cost
> two weeks"), not a mechanism, and because it is silent in the overwhelming majority of moments.

That amendment is the difference between a calm product and a passive one.

---

## 2. THE HARD CASES, DECIDED

Three verdicts: **silent** (absorbed, never rendered), **receipt** (past tense, attached to the
artifact it changed, pull-to-open), **call** (a Call in the language contract's sense: it stops and
waits for judgment).

Where a mechanism appears twice, it is because the causal test genuinely gives different answers on
different days, which is the whole point of Law 1.

| Mechanism | Verdict | What the user sees instead | Why |
| --- | --- | --- | --- |
| **Branch, created** | silent | `Engineer is working on a copy of your code. Nothing live has changed.` The isolation is named once, at the start of the first run only. | Absorbed by `dispatchStudioSession` today. The branch name is jargon; the isolation is the reassurance. Name the second, delete the first. |
| **Commits** | silent, then receipt | Inside the run's step list: `Wrote 4 files.` A SHA appears only in the record pane and inside the seal, where it is the correct word. | A commit that behaved changed nothing about what the user got. |
| **Merge** | **call** | The merge gate is a Call: `Approve` / `Send back`. Toast: `Approved. It is going live now.` The word "merge" appears nowhere in prose; `Open the pull request` survives as a link label. | This is the one git act the human performs, and the ceiling line in the language contract already commits to it: "Your crew opens the pull request. A human merges it." |
| **Conflict** | silent, then **call** | The crew resolves what it can. What it cannot: `Two runs changed the same file. Which should win?` rendered as two plain-English consequences, never two hunks. | `builder_file_claims` exists specifically to make most conflicts structurally impossible, which is the product already voting for absorption. |
| **Revert / rollback** | **first-class user action** | `Put it back.` Never "revert", never "rollback" in a button. | `rollbackRelease`, `revertToRevision` and `generateRollbackNote` all exist in `studio.functions.ts`. The capability is absorbed; only the word is wrong. |
| **CI run** | silent | Nothing while green. | A passing build changed nothing. |
| **CI failure the crew fixed** | receipt | In the run's steps: `Tests failed. Engineer fixed them and they pass now.` | It became causal (it added work and time), so it earns a receipt, but not a call: nothing needs the human. |
| **CI failure the crew could not fix** | **call** | `Reviewer stopped. The checkout test fails and Engineer could not fix it in two tries.` Plus the one failing test's name. Not the workflow, not the runner, not the job matrix. | The verdict is decision-relevant; the harness is not. This is the granularity split section 1.1 said the brief's doctrine could not make. |
| **Flaky test** | silent, then **belief** | Never a failure. It becomes a row in the Brain: `The checkout test flakes. It has cost four reruns this month.` | Retry-and-pass changed nothing about the artifact, so it is not a receipt on the artifact. It changed something about the *workspace*, so it is a belief. This is the cleanest example of the causal test doing real work. |
| **Pull request** | receipt, with a link | `The change is ready on your repo. [Open the pull request]` | The PR is the boundary between us and the customer's engineering org, so it must stay reachable. As prose it is jargon; as a link label it is the correct name of the destination. |
| **Code review** | receipt | `Reviewer checked the diff against the spec. Two things do not match.` The diff is one click, never the default. | The verdict is the outcome; the diff is the mechanism. |
| **Deploy** | receipt | `It is live.` | |
| **Preview** | **the loudest thing on the screen** | The preview is not machinery. It is the answer. At the ship gate it is the largest element, above the buttons. | This is the one thing to take wholesale from Lovable, and section 4 break B1 turns it into a general law rather than a build-only feature. |
| **Environments** | silent, collapsed to two words | `preview` and `live`. Never staging, prod, dev, canary as user words. | Already in the lexicon (2.3). |
| **Model choice** | silent | Never a dropdown on a work surface. Lives in the config overlay only. | It changed nothing on the ordinary day. |
| **Model fallback** | receipt, on the artifact | `This draft came from the backup model. The main one was down for six minutes.` | The purest instance of Law 1: same subsystem, silent on Tuesday, load-bearing on Wednesday. |
| **Token counts** | **silent, permanently** | Never rendered anywhere, including the engine room's default view. | Already banned outside the engine room by the lexicon (2.8). Edge C goes further: a token count answers no question a PM has, in any room. It stays queryable, never rendered. |
| **Credits and cost** | receipt, attached to an outcome | `That run cost 34 credits.` Never a live draining meter. | `CostPerOutcomeChip.tsx` (109 lines, **zero importers**, verified) is exactly the right component and is unmounted. `moat.md` insight 13 already ruled that the meter must be calm. |
| **Agent retry that succeeded** | silent | | Changed nothing. |
| **Agent failure** | **call**, with a named next move | `Run stopped on step 3. Try again with what we learned` / `Ask why`. Never a bare error toast. | The no-dead-end law in the IA (4.3) already specifies the doors. |
| **RAG retrieval** | silent | The retrieval mechanism is invisible. | |
| **Citations** | receipt, inline, always | Chips on the claim itself, never a bibliography at the bottom. `CitationList.tsx` (53 lines, importers: one test file only, verified) mounts on the spec workbench. | The citation is the evidence; the retriever is the mechanism. Splitting them is the whole doctrine in one row. |
| **Approval modes** | silent, label diverges | `Runs on its own` / `Asks me first` / `I check the output`. The word "mode" dies. | Already ruled in the language contract's divergence template (4.4). |
| **Trust arc / ladder** | **silent except at two moments** | Shown only when (a) the crew offers a promotion, and (b) as the byline on work done unattended. Never a progress bar, never a meter, never a badge. | A visible trust score turns a safety mechanism into a number to game, and the craft law bans motion and ornament that performs rather than confirms. The rungs are named (`Supervised / Reviewed / Trusted / Autonomous`, verified in `src/lib/trust-ladder.ts`); the names are for those two moments, not for a dashboard. |
| **Connector OAuth** | silent | One Connect button. | Already doctrine (engine-room rule 4). |
| **Scopes** | receipt, once, at connect | `Supaprod will read your issues. It will not write to them.` Never a scope string. | Consequence, not permission grammar. |
| **Token expiry** | silent, then **call attached to the breakage** | `Scout could not read Linear since Tuesday. Reconnect it.` Not a red badge in settings. | A badge in a room nobody visits is not a notification; it is a hiding place. The call attaches to the work that stopped. |
| **Database migrations, ours** | silent, permanently | | Ours are not the user's business at any time. |
| **Database migrations, in the customer's repo** | **call, with the reversibility line** | `This change alters your database. Reverting the code will not undo it.` | `src/lib/tool-consequences.ts` already models exactly this: `effect`, `reversible`, `undo`, static per tool, never model-generated. |
| **The seven loop stages** | **not plumbing, and the only vocabulary the user must learn** | The Spine renders them as state. | Argued below; this is the hardest row in the table. |

### 2.1 The seven stages: the one row that needs an argument

The brief asks whether the lifecycle vocabulary is itself plumbing the user must learn. It is a fair
question and the answer is no, but only because of a constraint we must accept alongside it.

Why they are legible rather than plumbing:

1. They are seven ordinary English verbs a PM already uses in conversation. Discover, Decide, Plan,
   Design, Build, Ship, Learn. Not one of them is a term of art. Compare `epic`, `story point`,
   `swimlane`, `capacity`, `velocity`, `refinement`, all of which are terms of art the category
   forces on people.
2. They are the product's shape. The SupaprodMark's seven petals are the seven stages drawn as one
   unbroken curve (`craft-law.md` section 1). The vocabulary and the brand are the same object.
3. They are taught by state, not by explanation. The IA's ruling that the Spine is state and never
   navigation means a user learns the seven by watching them light up, which is how people learn a
   dashboard in a car, not by reading a glossary.

The constraint we must accept in exchange, and it should be tested:

> **A user must be able to complete a full journey without ever clicking a stage name.** If the
> stage names are load-bearing for navigation, they are plumbing wearing a friendly font. If they
> are labels on state that the composer and the journey cards can drive past, they are legible.

The IA already enforces the mechanism (Spine is state; journeys are the primary interaction; three
doors into every journey, one of which is typing in plain words). Edge C makes it a **test**, so a
future surface cannot quietly make the stage names the only way through.

**Budget rule.** The seven stages plus the thirteen crew names are the entire vocabulary budget of
the product. Every other name must be a word the user already owned before they arrived. Any
proposal that adds a fourteenth learnable noun must delete one first. This is the same constraint
the language contract puts on the crew (3.4, item 6), generalized.

---

## 3. THE BREAK TEST

A break that makes the product harder to learn for no gain is worse than the convention. This is the
gate every proposal in section 4 passed, and the gate any future proposal must pass. Four questions,
in order, and a failure on 1 or 2 kills the proposal outright.

1. **Does it remove a step, or only rename one?** Renaming a step is copy work, not a break. If the
   user still does the same number of things, we have redecorated. Breaks are measured in deleted
   actions and deleted decisions, not in deleted jargon.
2. **Can a new user succeed without being told about it?** A break that requires an explanation is a
   feature with a marketing problem. The good breaks are invisible: the user never notices the
   convention is missing because they never wanted it.
3. **Does it use a capability a competitor cannot copy inside a quarter?** Breaks grounded in taste
   get copied. Breaks grounded in a data asset that accrues over calendar time do not. At least half
   the ranked list must clear this bar or the list is a redesign, not a strategy.
4. **What is the kill condition?** A break without a stated way to discover it was wrong is a
   religious position. Every break below carries one.

**One more, added after writing the list.** A break must not move work from the product to the user
while claiming to simplify. The classic version of this failure: deleting a feature and calling it
opinionated. If the convention was doing a job, the break must do that job better, not delegate it.

---

## 4. THE TWELVE BREAKS, RANKED

Ranked by leverage against risk. Grounding is stated per break: **[shipped]** means the capability
exists in code today and was verified this session, **[partial]** means the substrate exists and one
seam is missing, **[new]** means it must be built.

---

### B1. The gate shows the consequence, not the request

**Rank 1.** Highest leverage, lowest risk, and it is the direct answer to the founder's Lovable
example.

**The convention.** An approval shows you what the system wants permission to do. "Agent wants to
run `studio.pr.merge`. Approve / Deny." Every agent product ships this, because it is what a
permission dialog looks like, and permission dialogs are what the industry had lying around when
agents arrived.

**Why it exists.** It is inherited from OS permission prompts and from expense-report workflow. Both
were designed for a reviewer who already knows what the action means and only needs to authorize
identity. Neither was designed for someone deciding whether an outcome is desirable.

**Why it fails a PM with a crew.** The PM does not know, and should never need to know, what
`studio.pr.merge` does. Worse, the request framing asks the wrong question. "May the agent do X" is
a question about the agent. "Do I want my product to be in state Y one minute from now" is a
question about the product, and it is the only question the PM is qualified to answer and the only
one they actually care about. At twenty gates a day the request framing produces reflexive approval,
which destroys the gate's value while keeping its cost.

**What replaces it.** Every call renders three things and no fourth: **what your product looks like
after**, **what it costs to undo**, and **what the record says about the last time**. Concretely:

```
Ship the guest checkout change.

[  the preview, large, interactive  ]

Live in about a minute. Reverting takes one click and about two minutes.
Your last three ships of this size went clean.

[Approve]  [Send back]                                    Snooze
```

The verb, the picture, the reversibility, the precedent. Nothing about tools, agents, branches or
modes. The preview is the largest element because it is the answer.

**Grounding. [shipped, unmounted]** `src/lib/tool-consequences.ts` already carries, per tool, a
plain-language `effect`, a `reversible` value of `reversible | irreversible | partial`, and an
`undo` string, all **static, never model-generated**, with a conservative default for unknown tools.
That is the reversibility line, written and honest, sitting in the repo. `getStudioPreview` exists in
`studio.functions.ts`. The precedent line comes from `decision-precedent.functions.ts` and
`PrecedentNudge.tsx`, the latter already mounted on the spec route (verified: four importers, one a
real mount). Nothing here is new capability. It is an assembly.

**The risk.** The consequence line is only as honest as the catalogue. A tool added without a
consequence entry falls back to a conservative default, which is safe but vague, and vagueness on a
high-stakes gate reads as evasion. Second risk: the preview does not exist for non-build calls (a
spec approval, a bet), so the pattern must degrade without looking broken.

**Mitigations.** Make the consequence catalogue a build-time invariant: a side-effecting tool in
`TOOL_REGISTRY` with no entry in `tool-consequences.ts` fails the test suite. For non-build calls,
the "preview" slot is filled by the artifact itself (the spec's diff against its previous version,
the bet's evidence chain), which is the same idea at a different fidelity.

**Kill condition.** If gate answer time drops below roughly five seconds median across a cohort, the
consequence framing has become wallpaper and we are back to reflexive approval by another route.
Measure it; do not assume.

---

### B2. Onboarding is a teardown. The product disagrees with you in the first session

**Rank 2.** Highest emotional leverage, near-zero build cost, and it is already the wedge in the moat
canon.

**The convention.** Onboarding is a tour: a checklist, some coach marks, a sample project, and a
celebration when you finish setting up. Every B2B SaaS ships it.

**Why it exists.** Complex UI plus zero data equals nothing to show, so vendors narrate the interface
instead. It also makes an activation metric easy to define, which is why it survives quarterly
reviews.

**Why it fails a PM with a crew.** A tour teaches vocabulary before it has earned the right to. And
the PM's actual first question is not "how does this work", it is **"is this thing smarter than me
about my product?"** A tour cannot answer that. Worse, every competitor's onboarding ends with the
product **agreeing** with the user: you asked for a PRD, here is a PRD. That is pleasant and
forgettable. Agreement is not evidence of judgment.

**What replaces it.** The first session ends with the product **disagreeing** with the user, with
receipts. You name one thing you already believe you should build. The Critic red-teams it: the
strongest available case against, sourced from your connected tools plus public evidence, with every
claim carrying its citation. Then it says what would change its mind.

This is the only onboarding in the category that risks being wrong on purpose, which is exactly why
it is the only one that can prove judgment.

**Grounding. [shipped, stranded]** `runWedgeTeardown` exists. `FirstTeardownCard.tsx` is **689
lines** and its only importer is `_authenticated.today.tsx`, the route the IA deletes (verified this
session). `gauntlet.functions.recordRitualSession` exists to record the session. The moat doc already
names the teardown as the wedge and the first ten minutes (section 10, "What is the wedge"). The IA
already homes it on the Decide face's cold-start slot. Nothing is missing but the decision to make it
the front door instead of a card on a dying route.

**The risk.** This is the highest-variance break in the list. A shallow teardown on session one is
fatal in a way a boring tour never is: a tour that teaches nothing costs you nothing, a critique that
is wrong costs you the account. With thin context (no connected sources yet, no history), the model
is being asked to argue against a stranger's idea with almost nothing to argue from.

**Mitigations, and this is the part that makes it defensible rather than reckless.** Apply the
`evidence_ids` discipline to the first impression. If the Critic cannot source a claim, it does not
manufacture one. The honest fallback is not a weaker critique, it is a **question**:

> `I cannot argue this well yet. I know nothing about who this is for. Tell me that, or connect one
> source and give me ten minutes.`

A product that admits the limit of its own evidence in the first sixty seconds has demonstrated
exactly the judgment it is selling. That fallback is not a consolation path. It may be the stronger
demo.

**Kill condition.** If the fallback question fires more than roughly a third of the time in real
first sessions, the teardown is not ready to be the front door and reverts to the second act, behind
one connect step.

---

### B3. Settings are written by declining. The rule wall is an output, not an input

**Rank 3.** The highest-ceiling break in the list, and the one no competitor can copy, because it
requires a gate history they do not have.

**The convention.** Configuration is a wall of toggles. The category's canonical settings page asks
you to predict, in advance and in the abstract, how a system you have never operated should behave
in situations you have not encountered.

**Why it exists.** Every capability that had an internal debate got a flag, and every flag needed a
home. Nobody designed the settings page. It accreted. `_authenticated.settings.tsx` is 3433 lines,
which is the accretion made visible.

**Why it fails a PM with a crew.** "Should Engineer be allowed to merge without asking?" is
genuinely unanswerable in the abstract and completely trivial in the moment. In the abstract you have
no basis; in the moment you have the diff, the tests, the precedent and a feeling. Asking the
abstract question up front guarantees one of two failures: the user picks the safe answer and drowns
in gates, or picks the permissive answer and gets a surprise they did not consent to. Both are the
settings page's fault, not the user's.

**What replaces it.** **Rules are written by judging.** Every time you send back or decline, the
product offers to turn that judgment into a standing rule, in your words, with the receipt that
created it attached:

> `You have sent back a launch note three times, each for the same reason. Make it a house rule?`
> `"Launch notes never name a customer without written permission."`
> `[Make it a rule]  [Not a rule]`

The wall of toggles still exists in the config overlay, because sometimes you genuinely want to go
change a thing. It is simply no longer how rules come to exist.

**Grounding. [shipped, and stronger than expected]** This is the finding of this lane. The substrate
is not hypothetical; it is running.

- `src/lib/house-rules.functions.ts` implements `house_rules` with statuses
  `pending | approved | rejected`, plus supersession via `artifact_lineage` edges rather than a
  status flag, so rules version rather than overwrite.
- A weekly steward pass (`src/routes/api/public/hooks/house-rules-tick.ts`) already clusters a
  workspace's **validated learnings** into short, versioned operating rules and inserts them as
  approval-gated drafts.
- Approved, non-superseded rules are injected into **every agent's system prompt at the chokepoint**
  via `renderHouseRulesBlock` in `loop.server.ts`, modeled on the brief block. So an approved rule
  actually changes the crew's behavior. This is not a display feature.
- `gate-signals.functions.ts` exports `recordGateSignal` and `getGateSignals`. The **write half is
  live** (called from `discovery.functions.ts` at two sites and `agent_loop.functions.ts`, verified).
  The **read half renders nowhere**. That is the missing seam, and it is one seam.

So the correction to the brief: settings-that-write-themselves is not a new idea we are proposing. It
is a shipped mechanism fed from the slow source (outcomes, weekly) and not yet fed from the fast
source (your own judgments, immediately). **[partial]** on exactly one edge.

**The risk.** Two real ones. First, rules accumulate silently and the system becomes unpredictable:
"why did it stop asking me about X?" A system whose behavior is governed by rules the user half
remembers agreeing to is worse than a wall of toggles, because at least the wall is enumerable.
Second, a rule distilled from three send-backs may generalize a coincidence into a law.

**Mitigations.** Every rule renders with the receipt that created it and a count of every time it
fired, so "why did it do that" is always one click and always answerable. A rule that has not fired
in sixty days proposes its own deletion. A rule is never created without an explicit human click:
`decideHouseRule` already gates this, and that gate must never be automated away. And rules
supersede rather than overwrite, which is already how the code works, so the history of why the
workspace behaves the way it does is itself on the record.

**Kill condition.** If the count of active rules a workspace cannot explain when asked exceeds
roughly a fifth of the total, the distillation is over-generalizing and the sample threshold goes up.

---

### B4. There is no inbox. The lead count is unanswered, and zero is reachable

**Rank 4.** High leverage, near-zero risk, and the product has already voted for it with its feet.

**The convention.** A notification inbox with an unread badge. Everything that happens goes in;
you triage.

**Why it exists.** Async work across many tools needs a catch-all, and vendors have a commercial
interest in a re-engagement surface. The unread badge is the most reliable retention primitive ever
invented, which is why it is everywhere and why nobody questions it.

**Why it fails a PM with a crew.** A crew generates events at a rate no human team ever did. Twenty-five
distinct cron jobs run unattended in this product today (verified count across the migrations). An
inbox fed by that becomes noise inside a week, and the badge becomes a number you learn to ignore,
which is worse than no badge because it trains the user that our signals do not matter. And the PM's
real question was never "what happened". It is **"what needs me"**, which is a different query with
a different answer set and a different, much smaller, cardinality.

**What replaces it.** Two surfaces, neither of them an inbox.

- **What needs you.** The call queue. The count is **unanswered**, not unread. Unanswered zero is
  achievable most days; unread zero never is. A count you can actually clear is a count you keep
  trusting.
- **What happened without you.** A past-tense list, read when you want it, never badged. This is
  where the record earns its keep at ambient cost: the crew shipped four things overnight and you
  find out by choosing to look.

**Grounding. [shipped, unmounted, which is the evidence]** `AttentionBell.tsx` is 97 lines with
**zero importers** (verified). `ExecutedCard.tsx`, the "done without you" surface, is **547 lines
with zero importers** (verified) and is the largest orphan in the repo by line count. Both were built
and neither was ever mounted. The product tried the inbox, and then, without anyone writing it down,
declined to ship it. Edge C is ratifying a decision the codebase already made and giving it a reason.
The IA already homes both inside the gates tray.

Note the honest detail in `ExecutedCard`'s own header comment: it deliberately ships **no undo
button**, because no compensating-call flow exists and a fake undo on a completed side effect would
be dishonest, so it shows the real reverse path per tool instead. That is the correct instinct and it
should be the general rule for this surface.

**The risk.** Things that never rose to a call and never got read get missed. Specifically: a slow
degradation nobody was notified about, because no single event crossed the call threshold.

**Mitigations.** The brief covers the aggregate ("three calls waiting, one release shipped, the rest
ran itself"). And the token-expiry pattern from section 2 generalizes: **a mechanism that has stopped
producing value becomes a call attached to the work that stopped**, not a badge in a room nobody
visits.

**Kill condition.** If users report surprise at things that happened, at a rate that does not fall
over their first month, the call threshold is set too high and the fix is the threshold, not an
inbox.

---

### B5. Day one has no create button. The first act is read

**Rank 5.** Strong penetration leverage, moderate build cost, mostly already wired.

**The convention.** Every product tool opens on "Create your first project / board / doc / workspace"
with an empty template. Blank canvas, cursor blinking.

**Why it exists.** The tool has no data and no way to get any, so the only honest first move is to
ask the user to make some. It is also the cheapest possible onboarding to build.

**Why it fails a PM with a crew.** It puts the entire burden of the first ten minutes on the person
you are trying to impress, and it inverts the pitch. We claim the crew reads your sources and tells
you what to build. Then our first screen asks you to type. The user's correct reaction is: I already
have all this written down in four other tools, why am I retyping it here.

**What replaces it.** The first act is **read, not create**. One connect, ten minutes, then the crew
says something about your product that you did not already know, sourced. If the user will not
connect anything, the fallback is paste: a dozen lines of raw customer feedback is enough for Scout
to find the first patterns (this is already the `ColdStartOnramp` copy). But the default path never
asks for creation.

Combined with B2 this gives a first session with a shape no competitor has: **connect one thing,
then be told you are wrong about something, with citations.**

**Grounding. [shipped]** Twenty connector providers in `CONNECTOR_REGISTRY` (verified: github,
linear, notion, google_docs, google_calendar, gmail, google_tasks, microsoft_outlook, microsoft_mail,
figma, jira, firecrawl, intercom, stripe, slack, zendesk, hubspot, salesforce, canny, productboard).
Correction to the brief, which said 18. `ColdStartOnramp` self-gates on `getColdStart`.
`clusterSignals` turns raw signal into patterns. The cron fabric already sweeps. The
`ProviderCard.tsx` / `ApiKeyConnectDialog.tsx` / `ProductBindingPicker.tsx` trio all have **zero
importers** (verified), meaning the connect UI is built and unmounted, which is the same pattern as
B4.

**The risk.** Ten minutes is a long silence for a first-time user, and a user who connects a source
with nothing useful in it gets a worse first result than one who typed something. Also, connecting a
work tool to an unknown vendor in minute one is a real trust ask, and some users will refuse.

**Mitigations.** The paste path is always visible and never framed as the lesser option. During the
wait, the crew narrates what it is reading, with an honest actor on every line (the language
contract's law 13). And the connect consequence line from section 2 does the trust work: `Supaprod
will read your issues. It will not write to them.` A read-only ask is a small ask, and saying so
plainly is worth more than any security page.

**Kill condition.** If first-session connect rate stays low while paste rate stays high, the market
is telling us read-first is right but connect-first is not, and the paste path becomes the default
with connect as the upgrade.

---

### B6. The roadmap is a forecast that grades itself

**Rank 6.** The most defensible break in the list, and the one that produces a screenshot nobody
else in the category can produce.

**The convention.** A roadmap is a gantt: named things on a time axis, communicated as commitment,
revised quietly, never scored.

**Why it exists.** Stakeholders demand dates and the gantt is the only artifact that communicates
sequence and commitment in one picture. It survives because it is a political instrument first and a
planning instrument second.

**Why it fails a PM with a crew.** A roadmap is a set of **predictions** ("this will move that
number by then") rendered as **facts**. Nobody ever goes back and checks. The result is that the
single richest source of judgment data in the product function, the PM's own forecasting record,
evaporates every quarter. And with a crew doing the execution, the PM's remaining value is
concentrated entirely in forecasting quality, so the one thing worth measuring is the one thing
nobody measures.

**What replaces it.** Every roadmap item carries a **claim**, a **confidence** and a **date**. When
the date arrives, the product scores it and tells you. Over time the product can say a sentence no
other tool in the category can say:

> `Supaprod called seven of the last nine.`

And, more valuable and more uncomfortable:

> `You are consistently overconfident on integration work and well calibrated on pricing.`

**Grounding. [shipped, and this surprised me]** This is not aspirational. `computeBrierScore` is
implemented in `src/lib/brain/calibrate-insights.server.ts`. `calibrateExpiredInsights` sweeps
insights whose `horizon_date` has passed, judges each against what is now known, writes
`resolution`, `brier_score` and `resolved_at`. `summarizeResolutions` produces the literal string
`Supaprod called ${hits} of the last ${resolved}`. `shouldThrottle` **turns the calibration off** on
a generator kind that keeps missing (`THROTTLE_HIT_RATE_FLOOR = 0.34`, `MIN_SAMPLES_FOR_THROTTLE = 3`,
72-hour throttle written to `workspaces.prediction_throttle_until`). The migration
`20260702220000_fs01_prediction_calibration.sql` carries the schema. **The product already grades
its own forecasts and silences itself when it is bad at a kind of forecast.** That behavior does not
exist anywhere else in this category and it is currently invisible.

The break is to extend the same mechanism from insights to **roadmap bets**, and to put the number on
a surface.

**The risk, and it is a real integrity hole that must be named.** The grader is a model
(`judgeOutcome` calls `google/gemini-2.5-flash`). A self-graded forecast where the grader is the same
class of system that made the forecast is not, strictly, evidence. If we ever market the number
without disclosing that, we have manufactured exactly the kind of invented metric the humanized-output
convention exists to prevent.

Second risk: an early, honest, bad calibration number is discouraging in a way a fake one is not, and
early workspaces will have terrible calibration because everyone does.

**Mitigations.** The code already has the right instincts and they must be preserved and made
explicit. `inconclusive` is a first-class verdict and the system prompt instructs the judge to prefer
it over guessing (verified in `CALIBRATE_SYSTEM`). The sample floor and the rolling window already
exist. Add three things: the grader's identity is disclosed on the surface (`Graded from the linked
theme's current state`), a human can overturn a grade and the overturn is itself on the record, and
the number is private to the workspace by default and never a marketing claim about a specific
customer.

**Kill condition.** If the human overturn rate on grades exceeds roughly one in five, the automated
grade is not trustworthy and the surface reverts to "here is what you predicted, here is what
happened, you decide", which is still better than every competitor and requires no model judgment at
all. That fallback is the honest floor and it should be built first.

---

### B7. Gates are earned away. The ask rate is a number the product is visibly trying to lower

**Rank 7.** High leverage, high risk, and the risk is safety rather than product.

**The convention.** Permissions are a static grant. You configure them once and they stay until you
change them. Approvals are binary and unpriced: yes or no, forever, at the same cost.

**Why it exists.** Inherited from access control, where a static grant is correct because identity
does not improve with practice. Then it was inherited again by workflow tools from expense approval,
where the approver's job is authorization, not judgment.

**Why it fails a PM with a crew.** With a crew, the number of gates scales with the amount of work,
which is exactly backwards: the more the crew does, the more you are interrupted, so success feels
like punishment. And a static grant throws away the only thing that should govern autonomy, which is
**demonstrated reliability at this specific job in this specific workspace**.

**What replaces it.** Autonomy is earned, per agent, per tool, from that agent's actual record here,
and **the ask rate is a number the product is openly trying to reduce**. The crew should be visibly
working to stop bothering you:

> `You have approved this tool twelve times and sent it back none. Let Engineer run it without
> asking?  [Yes]  [Keep asking]`

And the promotion offer is one of only two moments the trust ladder is ever visible (section 2).

**Grounding. [shipped]** `src/lib/ai/trust.server.ts` computes a per-agent score on read from real
signals with Bayesian shrinkage toward 0.5 at low sample counts, weighting run success 0.3, approval
acceptance 0.2, eval mean 0.2 and **validated outcome rate 0.3**. That last term is the important
one: it asks whether the agent's decided-on work actually turned out well, not just whether it ran
clean or the human said yes. `resolveApprovalMode` composes the agent's arc with each tool's own mode
as a **safety floor** that never loosens a `review` tool. `resolveToolMode` in `loop.server.ts:153`
wraps it (correction to the brief, which named `resolveToolMode` as the gate: it is the wrapper,
`resolveApprovalMode` is the floor). `auto_advance_agent_arc` promotes on clean streaks but is
guarded so it can **never** reach the top rung; `ambient` is always an explicit human click
(verified in `trust-ladder.ts` and the founder-autonomy-defaults migration). `getRecentExecutedUnattended`
already lists what ran without you.

One live fact worth flagging to the founder, because it is load-bearing for this break and easy to
lose: `loadAgentArc` defaults an agent with no set arc to **`trusted`**, not `observing`, per the
2026-07-08 founder ruling (autonomous by default). So the product does not currently start
conservative and earn up. It starts permissive and tightens down. That is a defensible choice but it
is the opposite of the story this break tells, and the two must be reconciled before either ships.
Named here, not decided here.

**The risk.** The obvious one: automating away a gate that mattered, once, expensively. The subtler
one: a trust score computed partly from **approval acceptance** rewards an agent for being agreeable
to a user who approves reflexively, which is a feedback loop that manufactures its own justification.
B1 (consequence-first gates) is the antidote and is ranked above this one for that reason.

**Mitigations.** The safety floor already in the code is the primary defense and must never be
relaxed: `review` is sticky, hard-locked tools stay `confirm`, and the top rung is human-only.
Irreversible tools (`reversible: "irreversible"` in `tool-consequences.ts`) should never be
auto-promoted regardless of score. And a promotion should be reversible in one click from any receipt
of work it produced: `Ask me about this again.`

**Kill condition.** Any single unattended action a user says they would not have approved. One is
enough to pause promotion for that tool class workspace-wide, and the product should say so.

---

### B8. The backlog expires. A bet with no horizon date cannot be created

**Rank 8.** Strong leverage, real cultural risk.

**The convention.** The backlog is an infinite, append-only list. Nothing leaves it except by being
built or by a guilty quarterly cull.

**Why it exists.** Engineering capacity was less than demand, so the list was a rationing queue.
Keeping everything was free and throwing things away felt like losing information.

**Why it fails a PM with a crew.** Capacity is no longer the constraint; judgment is. The backlog's
rationing function is obsolete, but its costs are not: staleness, guilt, zombie items, and the
particular kind of dishonesty where an idea sits at rank 40 for two years and nobody will say it is
dead. A crew that can draft, prototype and build several things in parallel makes the queue framing
actively misleading.

**What replaces it.** A **standing question list with expiry**. Every bet carries a horizon date and
a claim it is making about the world. When the date passes, the bet resolves: promoted, dropped, or
re-dated with a stated reason. Nothing sits.

The bet is not deleted. It goes to the Brain with its reason, and it comes back on its own if the
signal that justified it returns. That is the difference between throwing something away and
recording that you decided against it, and it is the whole reason the Brain exists.

**Grounding. [partial]** The mechanism is running on a sibling object. `insights` already carry
`claim`, `confidence`, `horizon_date`, `resolution`, `brier_score`, `resolved_at`, and
`calibrateExpiredInsights` already sweeps and resolves them on a cron. Extending horizon dates to
`opportunities` (the bet table, frozen name per the rename ledger) is the same pattern on a second
table. `Keep` and `Drop` already exist as the bet verbs with a kept reason (language contract 5.4).

**The risk.** This is the break most likely to feel like the product taking something away. PMs are
attached to their backlogs, and a list that shrinks without permission is alarming. There is also a
real failure mode where a good idea expires during a quarter when nobody had time to defend it.

**Mitigations.** Expiry is never deletion; it is a resolution with a reason on the record, and the
Brain resurfaces it when matching signal returns. The expiry event is a call, not a silent sweep, so
nothing leaves without a human seeing it go. And the default horizon should be generous, not clever.

**Kill condition.** If users routinely re-date rather than resolve, the horizon is doing no work and
we have added a chore. In that case keep the date and delete the ceremony: sort by staleness and say
nothing.

---

### B9. The spec is a live claim set. The document is a projection you export

**Rank 9.** High leverage, high political risk.

**The convention.** The spec is a document. You write it, review it, approve it, and then it goes
stale the moment the build starts and nobody reads it again.

**Why it exists.** The document is the durable contract across a lossy human handoff, and writing
prose is genuinely how people think. Both are real. This convention has more legitimacy than most on
this list.

**Why it fails a PM with a crew.** The handoff it was built for is no longer lossy in the same way:
`HandoffPayload` carries typed context, artifacts, constraints, open questions, memory refs and
evidence ids, and the runtime can reject a handoff whose claims carry no backing. The document's job
of carrying context across the seam is done better by the payload. What is left of the document's
value is the thinking and the stakeholder artifact, and both survive without the document being the
canonical object.

Meanwhile the document's costs are real: it goes stale invisibly, its assumptions are never checked,
and its status is asserted rather than derived.

**What replaces it.** A spec is a set of **claims** with owners, confidence and watch dates. Its
status is **derived** from whether its claims still hold, not set by a human clicking Approved. When
an assumption fails its watch date, the spec says so, in place, before anyone builds on it further.

The prose document still exists. It is a **view**, rendered on demand, exportable, sendable. It is
just not the thing of record.

**Grounding. [partial]** The claim substrate exists (`insights` with claim, confidence, horizon,
resolution). The IA's J3 flow already commits to "assumptions go on watch with dates" and to
`CitationList` chips on every claim in the spec workbench. `PrecedentNudge` is already mounted on the
spec route. The missing piece is deriving spec status from claim status, which is new logic over
existing tables.

**The risk.** The highest political risk in the list. A PM's spec is a document they show to
executives, and telling them their document is now a projection of a claim graph is a hard sentence
to hear. There is also a genuine loss: prose has connective tissue that a claim list does not, and
some of the best product thinking lives in the connective tissue.

**Mitigations.** Never take the document away. The export must be excellent, not a courtesy: it
should look like the best PRD the person has ever written, because it is generated from claims that
each carry their evidence. And the claim extraction happens **from** the prose the user writes, not
instead of it. They write; the product marks the claims and asks for a date on the load-bearing ones.

**Kill condition.** If users write around the claim system (writing prose in a single field to avoid
the structure), the structure is a tax and should be inferred silently rather than requested.

---

### B10. Nothing is draggable. State is read, never set

**Rank 10.** Correct and already ruled by the IA; restated here as a break because the reason matters
and will be re-litigated.

**The convention.** The kanban board. Columns are statuses, cards are work, and you drag to change
state.

**Why it exists.** It makes invisible work visible when the work is in humans' heads, and dragging is
a genuinely satisfying physical metaphor for a status change that is otherwise a dropdown.

**Why it fails a PM with a crew.** The crew's work is already visible: live steps, a working strip, a
receipt per action. A board is a **manual model of state that must be maintained to stay true**,
which means it lies whenever someone forgets, which is always. With agents moving work continuously,
the drift is not occasional, it is constant.

**What replaces it.** The Spine, which is read from the system (`getLoopState`) and never set by a
human. And the affordance the drag was providing is replaced by something better: the drag was a
**status** gesture; what the PM actually wants is a **judgment** gesture. `Keep` and `Drop` on a bet
are more powerful than dragging it between columns, and equally physical.

**Grounding. [shipped]** `getLoopState` exists and the IA has already ruled the Spine is state, never
navigation.

**The risk.** PMs love dragging, and losing it reads as losing control. There is also a genuine
capability loss: a board lets you express an ordering that the system cannot infer.

**Mitigations.** Ranking a bet is exactly that ordering expression and it stays manual, because
Decide is explicitly the one thing the product will never do for you (lexicon 2.2). Ordering survives.
Status-dragging dies.

**Kill condition.** If users are asking where to move things, the Spine is not communicating state
clearly enough, and the fix is the Spine's legibility, never a board.

---

### B11. There is no sprint. The only date object is the day the machine tells you whether you were right

**Rank 11.** Correct, low risk, low differentiation on its own; it matters because it is the
consequence of B6 and B8.

**The convention.** Work is batched into time boxes: sprints, cycles, iterations, with a ceremony at
each boundary.

**Why it exists.** Human estimation is bad, so you batch and re-plan on a fixed rhythm. The ceremony
is also a social technology for commitment, which is most of why it survives.

**Why it fails a PM with a crew.** A crew works continuously. Twenty-five cron jobs already run
unattended in this product. A two-week batch imposed on a continuous machine is fiction, and the
ceremony has no one to convene.

**What replaces it.** The only calendar object in the product is **the date the machine comes back
and tells you whether you were right.** Not a planning boundary. An accountability appointment.

**Grounding. [shipped]** J7's primary entry is the gate finding you: the armed outcome check fires
into the tray on its date (`checkPrdShipped`). The IA already ruled this and it is the only journey
whose entry point is the gate rather than the user.

**The risk.** Enterprise buyers will ask for sprint reporting, because their own governance runs on
it, and "we don't do sprints" is a lost deal in a procurement conversation.

**Mitigations.** Export a sprint view. Never make it the internal clock. This is the same posture as
B9's document: give them the artifact, keep our object model.

**Kill condition.** None needed; if a customer wants a sprint view, we render one.

---

### B12. The ticket is an export format. Search returns a position, not a list

**Rank 12.** Two smaller breaks, grouped because they share a shape: both are about refusing to let
another tool's object model become ours.

**The convention, part one.** The ticket is the atomic unit of work: a container with an assignee, a
status, an estimate and a comment thread.

**Why it exists.** A human handoff is lossy and asynchronous, so the work needs a durable addressable
container that carries its own context and accountability.

**Why it fails a PM with a crew.** The typed handoff does the container's job better, with evidence
the runtime can check. A ticket for an agent is ceremony: no assignee is needed because the crew
self-routes, no estimate is needed because the cost is metered directly, and no comment thread is
needed because the receipt is the thread.

**What replaces it.** The **Run** (already ruled). And the specific consequence Edge C adds: a ticket
is an **export format**, never an internal object. Supaprod writes a Linear issue when work leaves
the crew for a human; it never reads one as its own spine. The moment we let Linear's object model be
our spine, we are a Linear plugin, and the moat argument in `moat.md` section 4 (be the neutral brain
across tools, do not fight for the surface) collapses into being one tool's feature.

**The convention, part two.** Search is a box that returns documents.

**Why it exists.** Nobody knew where to put things, so: a box.

**Why it fails a PM with a crew.** The PM's real query is almost never "find me a document". It is
"what do we know about X and what did we decide". That is a claim question. A list of ten documents
is an invitation to do the synthesis yourself, which is the work we claim to absorb.

**What replaces it.** The ask returns a **position**: a claim, its confidence, the receipts under it,
and a control to challenge it. If there is no evidence, it returns a **question**, not a confident
paragraph.

**Grounding. [partial]** The Brain pane's Beliefs landing (IA 2.3) is exactly this shape.
`decision-precedent.functions.ts` and `brain-insights.functions.ts` exist. The rule that a claim
without evidence renders as a question is new and is the same discipline as B2's fallback and the
`validateHandoff` gate, applied to a third surface. That repetition is a good sign: it means we have
one principle, not three features.

**The risk.** A synthesized answer that is wrong is worse than a list, because the user cannot see
what was omitted. And search-as-a-box is a deeply grooved habit; some users will type a filename and
want the file.

**Mitigations.** No claim renders without its receipts visible. The literal-match path always exists
(the palette answers "take me to a thing I can name", per the IA, and is explicitly never
load-bearing).

**Kill condition.** If users consistently skip the position and click straight through to sources,
the synthesis is not earning its place and the position becomes a header over a list.

---

## 5. THE RANKING

| # | Break | Leverage | Risk | Grounded in shipped code | Clears break-test 3 (hard to copy) | Phase |
| --- | --- | --- | --- | --- | --- | --- |
| **B1** | Gate shows the consequence, not the request | very high | low | yes, `tool-consequences.ts` written and unused | partly (the catalogue is taste; the precedent line is not) | 1 |
| **B2** | Onboarding is a teardown | very high | high, variance | yes, `FirstTeardownCard` 689 lines, stranded | yes, needs the Critic and the evidence discipline | 1 |
| **B3** | Settings written by declining | very high | medium | yes, `house_rules` + prompt injection live; `getGateSignals` unrendered | **yes, strongest**, needs a gate history nobody else has | 2 |
| **B4** | No inbox; unanswered, not unread | high | very low | yes, both components built and unmounted | no, copyable, but nobody will | 1 |
| **B5** | No create button on day one | high | medium | yes, 20 providers, connect UI unmounted | no | 1 |
| **B6** | The roadmap grades itself | high | medium, integrity | yes, Brier scoring live on a cron | **yes**, needs calendar-time outcome data | 2 |
| **B7** | Gates are earned away | high | high, safety | yes, trust score + safety floor + ladder | **yes**, needs per-workspace agent history | 3 |
| **B8** | The backlog expires | medium-high | medium, cultural | partial, same pattern one table over | no | 2 |
| **B9** | Spec is a live claim set | medium-high | high, political | partial | partly | 3 |
| **B10** | Nothing draggable | medium | low | yes, `getLoopState` | no | 1 |
| **B11** | No sprint; the only date is the outcome date | medium | low | yes, J7 armed check | no | 2 |
| **B12** | Ticket is an export; search returns a position | medium | medium | partial | partly | 3 |

**Read of the table.** Four breaks clear the hard-to-copy bar: B3, B6, B7, and partially B2 and B12.
All four rest on data that accrues over calendar time inside a loop a competitor does not run, which
is precisely the moat argument in `moat.md` layer 2. That is the answer to the founder's question
about breaking a monopoly: **the breaks that penetrate are the ones a well-funded incumbent cannot
ship next quarter even if they read this document**, because the missing ingredient is not code, it
is a year of somebody's judgments.

**Read of the phasing.** Phase 1 is six breaks and every one of them is an assembly of code that
already exists and is not mounted. That is unusual and worth saying plainly to the founder: the
highest-leverage half of this list is not a build, it is a decision to wire what is already written.

---

## 6. WHAT WE REFUSE TO BREAK

A list of breaks without a list of refusals is a manifesto, not a plan. These are conventions that
exist for good reasons and that we keep on purpose.

| Convention | Kept because |
| --- | --- |
| **The verdict triad** (`Approve` / `Send back` / `Decline`) | The highest-stakes moment in the product must use words the user already owns. Inventing judgment verbs here would be the exact failure the break test question 2 exists to catch. |
| **Undo over confirm** | Reversibility beats interrogation. Already law (language contract 7.3). It is a convention and it is correct. |
| **Input conventions** | Escape closes, `Cmd+K` searches, arrows move, Enter submits, Tab focuses. **Break structure conventions, never input conventions.** A product that redefines Escape is not brave, it is broken. |
| **The URL** | Everything addressable, everything pasteable. The IA is explicit that losing this is what killed the 2026-07-18 rebuild. |
| **Export anytime** | `moat.md`: lock-in is gravity, not a wall. A full export does not carry the tuned judgment, so easy exit raises trust while the brain stays. |
| **Email as the out-of-app channel** | The PM lives in email and Slack. We do not get to relocate their attention. |
| **The pull request** | It is the boundary with the customer's engineering org and their review culture. Absorbing it would be absorbing somebody else's governance, which is not our right. |
| **The human merge** | Already the ceiling line. It is a feature, not a limitation, and the language contract is right that `Nothing sends itself, ever.` should be said proudly. |

---

## 7. WHAT THIS LANE CLAIMS, AND THE HANDOFF

### 7.1 Decisions made here that constrain the other lanes

These are rulings, not suggestions. If a sibling lane needs to overturn one, it should say so
explicitly rather than route around it.

1. **The causal test replaces "hide the mechanism, show the evidence"** as the operative doctrine.
   Machinery is silent until it changed what the user got, then it is a receipt or a call. Three
   states, no fourth.
2. **Engine-room rule 3 is amended.** Depth that contradicts the user's current action comes forward
   uninvited. This should be carried back into
   [`../../../conventions/engine-room-doctrine.md`](../../../conventions/engine-room-doctrine.md)
   as a rule change, not a footnote.
3. **The vocabulary budget is closed.** Seven stages plus thirteen crew names. Every other word must
   be one the user already owned. A fourteenth learnable noun requires deleting one.
4. **The stage-name test.** A user must be able to complete a full journey without ever clicking a
   stage name. If they cannot, the stages have become navigation and therefore plumbing.
5. **Token counts render nowhere**, including the engine room's default view. Queryable, never
   rendered.
6. **The trust ladder is visible at exactly two moments**: the promotion offer, and the byline on
   unattended work. Never a meter, never a badge, never a progress bar.
7. **The consequence catalogue is a build-time invariant.** A side-effecting tool with no entry in
   `tool-consequences.ts` fails the suite. This is the seam that keeps B1 honest as the tool registry
   grows.
8. **A ticket is an export format, never an internal object.** No surface reads a Linear issue as
   its own spine.

### 7.2 What I deliberately left open

- **Which surface hosts the calibration number** (B6). It is a Brain belief, an engine-room quality
  view, or a line on the roadmap face, and that is an IA call, not an edge call. My only constraint:
  it must not be a tile in a grid.
- **The autonomy default contradiction** (B7). `loadAgentArc` currently defaults to `trusted` per the
  2026-07-08 founder ruling, which is the opposite direction from the earn-it-up story. That is a
  founder call about product posture and risk appetite, not a design call. Flagged, not decided.
- **How much of B9 ships at all.** The spec-as-claim-set is the break I am least confident in, and I
  have ranked it accordingly. It may be right and a year early.
- **Whether B2's fallback question is actually the better demo.** I suspect it is. That is testable
  and should be tested rather than argued.

### 7.3 What I need from the other two lanes

- **From the lane owning depth and proof:** the exact rendering of the contradiction moment. Law 3
  makes it the only push in the product, which makes it the single most designed moment we have, and
  I have specified when it fires but not what it looks like. Constraint from here: it is inline at
  the point of action, it names an outcome and never a mechanism, and it is dismissable without
  ceremony, because a contradiction the user overrides is itself a data point worth recording.
- **From the lane owning the agent and human contract:** whether the promotion offer in B7 is a Call
  in the language contract's sense (and therefore lives in the tray with the verdict triad) or a
  distinct object with its own verbs. I lean toward a Call, because it keeps the vocabulary budget
  closed, but it is genuinely a different kind of judgment (a policy change, not a work approval) and
  I may be wrong.
- **From both:** a challenge to B1's claim that the preview is the largest element at a gate. It is
  the load-bearing borrowed idea from Lovable and it deserves an adversarial read, because if it is
  wrong, the top of my ranking is wrong.

---

## 8. THE ARGUMENT IN ONE PAGE, FOR THE FOUNDER

You asked whether we should follow Lovable's ideology. The answer is that Lovable's ideology and ours
are the same principle applied to different work, and the apparent conflict is an artifact of
comparing the wrong things.

Lovable absorbs git because git never changes what the user got. It is pure bookkeeping. Absorbing it
costs nothing and buys everything.

We must not absorb the record, because the record is the only thing we sell. But we have been making
a category error: we have been treating "prove it" as a **surface** when its highest-value form is an
**interruption**. Nobody wants to read a ledger. Everybody wants to be told, at the exact moment they
are about to make a mistake, that they made this call in March and it cost two weeks.

So the answer to "should we hide or should we prove" is: **hide almost all of it, all of the time, and
let it speak only when it disagrees with you.** That gives us Lovable's calm and keeps our moat,
because the moat was never the display. It was the data and the two moments it is allowed to use it:
when you ask, and when you are wrong.

And the practical finding of this lane, which I did not expect going in: **the highest-leverage half
of this list is already written.** The consequence catalogue, the teardown card, the house-rules
distiller, the Brier scorer, the unattended-work list, the connect UI, the trust ladder. Seven
capabilities, built, tested, commented with care, and mounted nowhere. The rebuild's first phase is
not a build. It is a decision about what to put on the screen.

---

## 9. EVIDENCE APPENDIX

Every code claim in this document, with the file it came from. Read this session.

| Claim | Source |
| --- | --- |
| Static per-tool effect, reversibility and undo, never model-generated | `src/lib/tool-consequences.ts`, header comment plus the `CONSEQUENCES` map |
| Trust score: shrinkage, four weighted terms, validated-outcome rate at 0.3 | `src/lib/ai/trust.server.ts:45-51, 203-209` |
| `resolveApprovalMode` is the safety floor; `review` sticky; `ambient` grants auto | `src/lib/ai/trust.server.ts:76-92` |
| `resolveToolMode` is the loop's wrapper over that floor (brief named the wrapper) | `src/lib/ai/loop.server.ts:153-166` |
| Agents default to `trusted`, not `observing` (2026-07-08 founder ruling) | `src/lib/ai/trust.server.ts:239-255` |
| Top rung is never auto-granted; always an explicit human click | `src/lib/trust-ladder.ts:7-16`, `supabase/migrations/20260708150000_founder_autonomy_defaults.sql` |
| Ladder names: Supervised, Reviewed, Trusted, Autonomous | `src/lib/trust-ladder.ts:30-35` |
| Handoff evidence gate: `validateHandoff`, artifacts without evidence fail | `src/lib/ai/handoff.server.ts:132-155` |
| The gate is **default OFF** (`HANDOFF_EVIDENCE_GATE`), because no live handoff carries `evidence_ids` yet | `src/lib/ai/handoff.server.ts:73-88`. Correction to the brief, which said handoffs are rejected by the runtime today. The rule is written, tested and shipped; enforcement is a flag the founder has not flipped. |
| Brier scoring implemented; inconclusive is first class | `src/lib/brain/calibrate-insights.server.ts:26-37, 18-24` |
| `Supaprod called N of the last M` exists as a literal string | `src/lib/brain/calibrate-insights.server.ts:101-113` |
| The product throttles a forecast kind that keeps missing (72h, floor 0.34, min 3 samples) | `src/lib/brain/calibrate-insights.server.ts:10-13, 116-158` |
| Calibration schema | `supabase/migrations/20260702220000_fs01_prediction_calibration.sql` |
| House rules: pending/approved/rejected, weekly distillation from validated learnings, supersession via lineage edges, injected into every agent's system prompt | `src/lib/house-rules.functions.ts:1-27`, `renderHouseRulesBlock` in `loop.server.ts` |
| `recordGateSignal` write half is live; `getGateSignals` read half renders nowhere | `src/lib/gate-signals.functions.ts:19,45,58`; callers `discovery.functions.ts:1021,1393`, `agent_loop.functions.ts:111` |
| Trust ledger: seal constraint, presentation-only fields excluded from the canonical tuple | `src/lib/trust-ledger.functions.ts:1-20` and the seal-constraint comment block |
| `ExecutedCard.tsx` 547 lines, zero importers, deliberately ships no fake undo | verified by grep; header comment states the reasoning |
| `AttentionBell.tsx` 97 lines, zero importers | verified by grep |
| `CostPerOutcomeChip.tsx` 109 lines, zero importers | verified by grep |
| `MemoryExpiryBanner.tsx`, `ProviderCard.tsx`, `ProductBindingPicker.tsx`, `ApiKeyConnectDialog.tsx`: zero importers | verified by grep |
| `FirstTeardownCard.tsx` 689 lines, sole importer is `_authenticated.today.tsx` (the route the IA deletes) | verified by grep |
| `CitationList.tsx` 53 lines, sole importer is a test file | verified by grep |
| 20 connector providers, not 18 | `src/lib/connectors/registry.ts:14-35`. Correction to the brief. |
| 25 distinct cron jobs, not 36 | distinct `cron.schedule` names across `supabase/migrations/`. Correction to the brief. |
| Build engine absorbs git: DB changeset, isolated branch, PR, CI read, fix commits, merge on green plus human approval | `src/lib/studio.functions.ts` (2103 lines), `dispatchStudioSession`, `refreshStudioCi`, `getStudioPreview`, `rollbackRelease`, `revertToRevision`, `abandonChangeset` |
| The UI still says changeset, branch, PR, CI | `src/components/studio/CiPanel.tsx:38,117-119,185`, `_authenticated.build.$missionId.tsx:56,206`, `_authenticated.build.index.tsx:311,693` |

---

## 10. RELATED

- [`../ia/FINAL-ia.md`](../ia/FINAL-ia.md), the build contract for structure. Wins on routes,
  regions and homes.
- [`../language/FINAL-language.md`](../language/FINAL-language.md), the language contract. Wins on
  every word.
- [`../craft-law.md`](../craft-law.md), the no-slop ruling. Wins on every pixel.
- [`../../../conventions/engine-room-doctrine.md`](../../../conventions/engine-room-doctrine.md),
  the first UX law. Section 7.1 item 2 proposes an amendment to its rule 3.
- [`../../../strategy/moat.md`](../../../strategy/moat.md), the defensibility canon. Section 5's
  ranking is scored against its layer 2.
