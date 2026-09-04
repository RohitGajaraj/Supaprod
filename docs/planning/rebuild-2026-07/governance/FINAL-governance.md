# FINAL: the governance frame. Policy set in advance, gates as the exception.

> _Created: 2026-07-29 · Last updated: 2026-08-03_

> _Rebuild 2026-07, the deciding document. Written 2026-07-29 against_
> _[`../GOVERNANCE-PRINCIPLE.md`](../GOVERNANCE-PRINCIPLE.md) (binding founder input) and the three_
> _audit lanes: [`gov-a-doctrine-audit.md`](./gov-a-doctrine-audit.md) (every decision point,_
> _classified), [`gov-b-policy-surface.md`](./gov-b-policy-surface.md) (the surface),_
> _[`gov-c-frame-and-story.md`](./gov-c-frame-and-story.md) (the frame and the legal limits)._
>
> **Status: this file governs.** It overrides the gate-centric assumption in all nine sibling
> doctrines. §9 names the delta for each one, so nothing is left to be reconciled later. Where a lane
> and this file disagree, this file wins; §14 is the register of every disagreement and how it was
> ruled, so nobody relitigates.
>
> **Every code claim was read or run against the working tree this session.** §13 carries the four
> corrections that matter, including one composite fact that none of the three lanes stated and that
> is the most urgent item in this folder.

---

## 0. THE RULING, IN ONE PAGE

**The frame.**

> ### Your crew does the work. You decide what it may do alone.

The work is the spine. The grant is standing, set in advance, and revocable in one click. The gate is
what is left over after the grant has done its job.

**The four registers.** `edge/FINAL-edge.md` sorted every mechanism three ways: silent, on the
record, a Call. That sort is right and incomplete. There is a fourth class, and it is not a louder
gate, it is a capability we refuse to build.

| Register | What is true | The human's part | Expected share |
| --- | --- | --- | --- |
| **Silent** | absorbed, nothing the user got changed | none | high |
| **Informed** | the crew did it, under a grant that is on the surface | **nothing**, and that is the design | **the bulk of everything the user sees** |
| **Asked** | it crossed a floor, or it needs judgment with no oracle | a verdict | ~4 per shipped feature, falling |
| **Never** | nobody may authorize it, including the human | none, by construction | 6 rows, permanent |

**The count, which is the founder's actual question.** Interrupts must scale with **shipped
outcomes**, not with agent actions. Under the doctrines as authored they scale with agent steps, so
thirteen agents produce a queue that one human throttles. Under this frame a shipped feature costs
about **seven** human decisions on day one and about **four** at month three, and the difference is
paid for by grants the user made once. §10.1 does the arithmetic against the gate-centric design:
roughly 200 interrupts a week becomes roughly 34, and more importantly the number stops growing when
the crew does.

**The floor does not go to zero, and saying so is the honest part.** Four decisions per shipped
feature is the floor: which bet, is this good enough, does it go live, what did it mean. Absorbing
any of them is not autonomy, it is the product having an opinion it cannot justify.

**The signature moment is the grant, not the approval.** The Commit ceremony in
`agents/FINAL-agent-presence.md` §9 survives whole and changes subject. It fires when the set of
things that will not ask you again changes: an agent's graduation accepted, a rule written from a
receipt, a grant taken back. Its flagship instance is the graduation, because it is the only moment
in the product where the machine visibly gets better and the human's leverage visibly increases, and
it is uncopyable because it is computed from this workspace's own record.

**The surface is called `House rules`.** Not `boundary`. `boundary` is doctrine language, like
`register` and `absorbed`, and it never reaches a screen. The surface is a pane in the one room,
never a settings section, and its most important column is one word wide: **provenance**, which says
whether a rule is `our default`, `you`, `earned`, or `always`.

**The four things that must be true before any gate is retired**, because the re-frame is unsafe
without them and each is a live defect today, not an improvement:

1. **A house rule must compile to a predicate in the execution path.** Today it is prompt text
   (`loop.server.ts:591`). We have shipped the Replit shape and `edge/FINAL-edge.md` C3 names it.
2. **The human must be able to author a rule at all.** `createHouseRule` does not exist. The machine
   has a live self-authoring path (`self-improve.functions.ts:516`, `status: "approved"`, no human).
   **The machine can write itself a standing rule and the human cannot write one**, which is the
   principle exactly inverted.
3. **A grant must be revocable.** `revokeTrustGraduation` does not exist. Nothing deletes an
   `agent_tool_modes` row. Grant without claw-back is not a trust mechanic.
4. **Unattended work must land somewhere the user reads.** `ExecutedCard.tsx` is 547 lines with zero
   importers. Until it is mounted, every default below is opacity rather than delegation.

**And the one fact that outranks all four**, composed from two lanes that each saw half of it and
verified here: **the only automatic movement of an agent's standing in production is upward.**
`auto_advance_agent_arc` promotes on clean runs and is called after every completed run
(`loop.server.ts:686`, `:1579`). Nothing auto-tightens; `suggestArc` computes a suggestion that
nothing applies. Because the bootstrap default is already `trusted`, the promotion branch is a no-op
on a fresh workspace, so **its only real-world effect is to silently undo a tightening a human
deliberately made.** `depth/FINAL-depth.md` R-13 says a tightening may auto-apply and a loosening may
only propose. Production does the exact opposite, aimed at the one user who asked for less autonomy.
This is the first thing to fix and it is four lines of PL/pgSQL.

---

## 1. THE FRAME, CORRECTED

### 1.1 What was wrong

Every doctrine authored on 2026-07-28 organised itself around the sentence *the human's job is
judgment at gates*. That produced, faithfully and well, a queue with excellent typography.

The defect is not the gates. It is the **spine**. `You make the calls. Your crew does the work
between them.` puts the human act in the subject position and the machine's work in a subordinate
clause. Read literally: there is a series of human decisions, and machine work fills the gaps. Worse,
`calls` is our own lexicon's word for the interrupt (`language/FINAL-language.md` §2.3: *"One thing
your crew has stopped on and cannot pass without you"*), so the tagline does not read as *you
exercise judgment*, it reads by our own dictionary as *you clear the queue*.

Three independent checks say the same thing:

- **The outward canon is already post-gate.** The investor tagline is *"Agents that know what to
  build, ship it, and remember."* The journey kicker is `signal -> shipped -> remembered`. Neither
  contains a human node. The app was behind the deck, not ahead of it.
- **`moat.md` said it on 2026-06-19**: *"the patterned 80% of decisions (reversible, precedented,
  outcome-seen) automate; the novel 20% + intent + accountability stay human"*, and §12 insight 11:
  *"The dependence on a human setting intent and owning the call IS the product."* Setting intent,
  not approving each item.
- **The runtime already agreed, three weeks early.** §13.2. The composed default in code is `auto`.
  The design work of 2026-07-28 inverted the runtime, not the other way round.

### 1.2 The corrected line

> **`Your crew does the work. You decide what it may do alone.`**

Companion line, used only where the record is the subject (the empty tray, the graduation card, the
buyer artifact): **`All of it is on the record.`**

| Fragment | What it does |
| --- | --- |
| `Your crew` | The ratified possessive (`language` R7). Warm, and true. |
| `does the work` | The spine, in the subject position where it belongs. Present simple, unglamorous, and it is the claim the product actually makes. |
| `You decide` | The human act is a real decision with real authority. Keeps the accountability claim, which we need in a contract and a procurement questionnaire. |
| `what it may do alone` | A **standing grant**. `may` is the modal of permission, so it cannot be misread as per-item approval the way `you make the calls` can. `alone` is the word the doctrine already uses for unattended work. |

It is simultaneously the PM's promise and the enterprise risk officer's checklist question, word for
word. That is rare and we take it.

**Why not the two rivals.** `You write the house rules. Your crew works inside them.`
(gov-b §2.2) puts the human's *labour* back in the subject position, only relabelled from approving
to configuring, and it is **false on day one**: a new user has written zero rules, so the product's
first sentence is a lie at the worst possible moment. The founder's own reframe, `Your crew does the
work. You set the boundaries, and you hear about it when something reaches one.`, is correct doctrine
and stays as the doctrine sentence, but its third clause names the exception, and **a tagline that
names the exception makes the exception feel like the loop**, which is the defect being fixed.
Twenty-one words is also three times a door line.

`AuthScaffold.tsx` currently ships a third variant (`you make the calls · Supaprod runs the rest`).
It takes the new line.

### 1.3 The word `boundary` does not ship

`GOVERNANCE-PRINCIPLE.md` §3 asks for *"a new first-class surface: the boundary"* and gov-a §7 titles
its content model that way. The content model is right. The word is not.

`language/FINAL-language.md` Law 1 says words get deleted, not added, and the two concepts are
already named: **House rule** (workspace-wide, human-authored, in English) and **Autonomy** (per
agent, per tool, a grant). `boundary` also sits badly beside `blast radius`, which §2.8 already
deleted. **`boundary` is doctrine-only**, in the same class as `register` and `absorbed`. The surface
is **House rules**, because it is the only phrase in the lexicon a person would actually say about
their own team.

---

## 2. THE SORTER

`edge/FINAL-edge.md` §0 asks two questions before the act and one after. Keep all three, and put a
new question **in front**, because the first question is not *must a human answer this* but *did a
human already answer this*.

```
BEFORE THE ACT

  Q0   THE STANDING-ANSWER TEST                            <- NEW, and it runs first
       Has the user already answered this, in advance, for this class of act?
       (an approved spec, a house rule, a consequence class, a tool grant,
        a cap, a connected scope, an accepted graduation)
         yes -> ACT. The receipt names the grant that authorized it.

  Q1   THE NEVER TEST                                      <- NEW, and it is a refusal
       Is this on the never list (§4.2)?
         yes -> the capability does not exist. Not a gate. Not a setting.

  Q2   THE ORACLE TEST            (edge §0, unchanged)
       Can the machine be wrong here in a way only a human can catch?
         judgment -> CALL

  Q3   THE CONTAINMENT TEST       (edge §0, unchanged)
       If it turns out wrong, can we undo it completely from inside the
       product, in one act, without asking anyone outside to cooperate?
         no -> CALL

  Q3b  THE RECURRENCE TEST                                 <- NEW
       If Q2 and Q3 both left it a Call: is this the SAME question we will
       ask again, answerable in advance without knowing the instance?
         yes -> it is a HOUSE RULE. Ask once, on the surface, with a stated
                default. Every later instance is informed, with a receipt.
         no  -> it stays a CALL.

AFTER THE ACT

  Q4   THE CAUSAL TEST            (edge §0, unchanged)
         yes -> ON THE RECORD.   no -> SILENT.
```

**Q3b is the whole audit compressed.** A Call that recurs with the same answer is a house rule the
product failed to notice. The principle document says the same thing from the other end: *"If the
queue is long, that is a policy failure to surface, not a workload to render."*

**Q1 is new and it matters more than it looks.** Some things are not gates with a high bar, they are
capabilities we refuse to build. Filing them as gates is how a company talks itself into shipping
them later with a nice confirm dialog.

One worked example, because it is the best evidence the sorter is real rather than a label:
`edge/FINAL-edge.md` §9 Test 2 ruled that *a routine may not Drop a bet, at any autonomy level; what
it may do instead is re-rank.* That is Q3b applied honestly. The answer to a recurring judgment
question was to **remove the capability**, not to queue the question. Hold that up whenever someone
proposes a new gate.

---

## 3. THE FOUR REGISTERS, WITH GRAMMAR

`edge/FINAL-edge.md` gave the third register (Asked) a rich grammar and left the second with a noun
and no rules. Under this frame the second is most of what the user sees, so it gets the law it was
missing.

### 3.1 Informed: the law

> **A receipt never carries a primary button, and the default user action on a receipt is nothing.**

If a receipt needs a primary button it is not a receipt, it is a Call somebody rendered quietly, and
`edge/FINAL-edge.md` §0 already rules on that: *"If a proposal needs a mechanism to be 'half-visible'
or 'shown subtly', it is a Call that somebody is embarrassed by."*

**Exactly two optional controls may appear, and no third:**

| Control | When | Why it is legal |
| --- | --- | --- |
| `ask me next time` | on any receipt of unattended work | Tightening. It is the primary rule-authoring gesture in the product (§7.4). |
| the object's own reversal verb (`Undo`, `Roll back release`, `Revert version`) | only where the act is genuinely reversible | It names a real inverse. |

Banned outright: `Approve` after the fact, `Acknowledge`, `Got it`, `Mark as read`, `Dismiss all`.
These manufacture work, and worse, they manufacture the *appearance* of oversight that is not
oversight and will not survive a regulator's reading.

### 3.2 Informed: the authority clause

Every receipt for unattended work names **which standing grant allowed it, who set it, and when.**
One line, right-aligned or under the act, never a tooltip.

```
Reviewer checked the diff on 12 files. Nothing to flag.          14:12
  by your house rule, set 12 Jul                                 ask me next time

Scout pulled 112 signals from 4 sources.                         02:00
  runs every night, you set this 3 Jul                           ask me next time

Engineer opened the pull request.                                09:41
  always asks first on merge. This one never graduates.          see the change
```

Three provenances, all real, all already in `agent_tool_modes.source` (`'graduation' | 'operator'`)
plus the floor sets. **This one line is what a risk officer, an insurer and an auditor all need, and
it is the same line the PM wants for comfort.** It is not microcopy. Under the corrected frame the
authority clause is part of what a receipt *is*, so `language/FINAL-language.md` §2.5's definition of
`Receipt` gains the clause.

### 3.3 Informed: the headline form

This replaces "what is waiting on me" as the emotional centre of the room, and it is already built:

```
Nothing needs you.

Your crew ran 6 things on its own since Tuesday.
  Reviewer    checked 4 diffs                       all clean
  Scout       pulled 112 signals from 4 sources
  Engineer    opened 1 pull request                 you merged it

                                        see all 6 · ask me next time
```

`ExecutedCard.tsx` renders this today, at 547 lines, with zero importers. **The flagship component of
the product's dominant register is dead code.** Mounting it is the cheapest possible proof that this
frame is real, and it is precondition B0.

### 3.4 Asked: the verdict grammar survives, and survives harder

**`Approve` / `Send back` / `Decline`, with `Snooze` secondary, is unchanged.**
`language/FINAL-language.md` §5.4 stands in full.

The triad was never the defect. Its **frequency** was. Three reasons it stays, and the third makes it
non-negotiable:

1. Rarity raises the stakes per instance. High ceremony on a rare event is correct; high ceremony on
   a constant event is what built the queue.
2. The three verbs map to three genuinely different downstream states (proceed, revise, never) and
   all three stay reachable when the gate is an exception.
3. **It is what makes the surviving gates legally count.** Under the CJEU's *SCHUFA* line
   (C-634/21), a rubber-stamp review does not break the chain of solely automated processing: the
   human must have genuine authority and genuine capacity to reach a different conclusion.
   `Send back` and `Decline` are the evidence that they did. **A single-button Approve gate is, by
   construction, solely automated processing wearing a human costume.** Reducing the count of gates
   raises the value of the ones that remain, and the triad is why they are worth anything.

`Send back` gets one upgrade under this frame, and it is the highest-value change in the verdict
grammar: **it must be reachable without a gate.** You should be able to send back work the crew
already finished, not only work it stopped on. That converts the single most valuable human input in
the product from a blocking gate into a non-blocking correction. `sendBackApprovalItem` already
requires a note, so the teaching signal is already captured.

### 3.5 Asked: the grant verbs, and where the standing answer may not live

A Call on a **standing grant** takes `Let it` / `Not yet`, never the triad. Different object,
different outcome, under R18's own logic (the triad governs Calls on work; `Keep`/`Drop` govern
bets). There is deliberately **no `Decline`** on a grant: the record keeps accruing, so a permanent
no would be a promise the machine cannot keep. `Not yet` is the truthful verb.

**The standing answer never fires from the verdict click.** A one-click "and never ask again" placed
beside `Approve` harvests yes-momentum and produces a grant set by fatigue rather than by judgment.
That is textbook automation bias and we would be building the trap deliberately. It appears **in the
receipt that follows the verdict, with the count attached**, and only when there is a record to show.

**The symmetry, which is the whole model in four rows:**

| Direction | Where it lives | The words | Who may act |
| --- | --- | --- | --- |
| **Loosen** | on the receipt following a verdict, with the count | `stop asking me` -> the graduation card | **Human only.** R-13. |
| **Tighten** | on any receipt of unattended work | `ask me next time` | Human, one click, no ceremony |
| **Auto-tighten** | invisible, with a receipt naming the evidence | none | The machine may |
| **Auto-loosen** | nowhere. Does not exist. | none | **Nobody. Ever.** |

R-13 bans the **machine** from loosening itself. It does not ban the **human** from loosening in one
click. Say that in every handoff, or somebody will "protect" R-13 by deleting the one control that
makes this frame work.

---

## 4. THE FLOORS AND THE NEVER LIST

### 4.1 The floors: always a Call, at every autonomy level, not settings

These survive Q0. No house rule may clear them, no graduation reaches them, and each renders on the
House rules surface as a **locked row with its reason on the row**, which is what makes the
controllable rows feel safe.

| # | Floor | Backed by | The reason, in the words that ship |
| --- | --- | --- | --- |
| **1** | **Anything irreversible outside the product** | Q3 | production deploy · anything a customer sees · a merge into your codebase · handing work to an outside coding agent · a revoked or issued credential · spend past your cap |
| **2** | **A schema change in your repo** | `registry.server.ts:1069-1076,1172-1183` | *"A schema change is a Call at every autonomy level and is the one Call that can never be granted to `Runs on its own`."* Quote it verbatim; it is the best-written sentence in the nine documents. |
| **3** | **Which bet to keep or drop** | judgment, no oracle | `edge` §6 already names Bet as *"the one stage the product will never do for you"* |
| **4** | **Is this good enough** (the spec, the design) | judgment, no oracle | And the spec approval **is the authorization** for everything reversible under it. §5.2. |
| **5** | **What the outcome meant** | judgment, no oracle, honestly human-attested | `ia` J7: the UI says *record how it landed*, never *we measured how it landed* |
| **6** | **Widening any grant** | R-13 | The machine proposes. The human grants. A self-widening bound is not a bound. |

Floors 1 and 2 are containment. Floors 3, 4 and 5 are the three judgments
`agents/FINAL-agent-presence.md` §2 already ratified a day before the principle was stated, and which
none of the other eight documents used:

> *"**You are here for the three calls your crew will never make: what is worth building, what is
> good enough, and what goes live.**"*

Three. Not fourteen. That sentence was the corrected frame all along.

Floor 6 is the one the founder's instinct pushes hardest against and it is the one that cannot move.
§11.1.

### 4.2 The never list: capabilities we refuse, not gates we set high

Six rows. Nobody may authorize these, including the workspace owner, including a founder demo. They
render on the buyer artifact under the heading `Never, at any setting`.

| # | Never | Why it is a refusal and not a gate |
| --- | --- | --- |
| **N1** | Score, rank or evaluate a **named human teammate** | EU AI Act Annex III point 4. The moment trust or gate-signal machinery points at a person, we are a regulated high-risk system from 2 August 2026, inheriting Articles 9 to 15 and handing an Article 26 burden to every customer. §11.2. |
| **N2** | **Final task allocation to a named human.** The crew may propose work for a person; a person enacts it | Same. The trigger is a *material influence* standard, so a formal human rubber stamp does not save it. |
| **N3** | Turn its own record off, or edit or backfill a receipt | The record is the consideration the customer receives for the clicks we removed. A record that can be turned off was never a record. |
| **N4** | Generate a record on request | The moment a "generate report" button exists, the record can be built selectively. `edge` §10.3. |
| **N5** | Author or approve its own standing rule | §11.1. **We are over this line today** and it is precondition P2. |
| **N6** | Raise its own cap | Insurers name hard-coded, non-self-raisable spend limits as a bounded-autonomy requirement. |

N1 and N2 are also a product boundary, not only a legal one: **the moment the crew grades the humans,
"your crew" stops being a crew.**

### 4.3 What is not a floor, so this does not become a list of reasons to build nothing

| Feels like a floor | Actually | Why |
| --- | --- | --- |
| A branch, a commit, a draft PR | absorbed | Reversible, contained, invisible outside the workspace. Already exempted in code by `BUILD_LANE_AUTONOMOUS`, founder ruling 2026-07-08. |
| Reading a connected source | absorbed | Read access was granted once, at Connect. Re-asking is theatre. |
| Drafting anything | absorbed | A draft nobody has seen has no consequence. |
| Retrying a flaky check | absorbed, then a Belief offering to change the rule | `edge` E5, and its shape is the template for every Belief. |
| Model choice per call | absorbed, named only where spend is authorised | `edge` §3.4. |
| Ranking, clustering, summarising | absorbed | No external effect, fully reversible, and the ranking is a proposal the human keeps or drops. |
| Tightening on evidence of harm | automatic, with a receipt naming the evidence | R-13. Safety needs no permission. |
| Opening a pull request | absorbed | **The merge is the boundary, not the PR.** |

---

## 5. THE DEFAULT POSTURE

### 5.1 The ruling

**A new workspace is autonomous on arrival, not supervised, and the reason is not that anything has
been earned.** It is that the record is not what makes it safe. **The floors are.**

Four things hold on run one exactly as hard as on run one thousand: `resolveApprovalMode` never
loosens a tool past its own mode; the high-risk demotion applies regardless of standing;
`HIGH_RISK_FORCE_REVIEW` never graduates at any setting; and every irreversible act is a Call by
construction rather than by configuration.

A probation period buys the *feeling* of safety at the cost of the product's entire claim in the
first ten minutes, and it is dishonest in a specific way: five clean runs of `tasks.create` tell you
nothing about whether the sixth should be allowed. **Starting supervised and counting to five is
theatre with a number on it.**

This is already the code's behaviour and it is already a founder ruling (2026-07-08, SW-7,
commented in source as *"autonomous by default"*). Nobody in the rebuild folder knew it was the
default, which is the actual problem.

### 5.2 What a brand-new workspace resolves to, derived

No `agent_autonomy` rows, no `agent_tool_modes` rows, `max_tool_risk = NULL`, seeded tool modes.
Through `loadAgentArc` (returns `trusted`) and `resolveToolMode`:

| Kind of work | Seeded | Resolves to | The defence, printable in the row |
| --- | --- | --- | --- |
| Reads, search, repo tree, web search, memory | `auto` | **runs on its own** | Reading changes nothing. There is nothing to undo, so there is nothing to approve. |
| Internal writes: tasks, notes, signals, specs, prioritisation | `confirm` | **runs on its own** | It lives in your workspace and you can delete it in one click. Asking first would buy a confirmation and cost the whole point. |
| Build lane: stage, commit, open PR, sync branch | `auto` | **runs on its own** | A branch and a draft pull request are isolated from your code. Nothing reaches your codebase except through the merge, and the merge always stops. |
| Open a GitHub issue, link a spec to an issue | `confirm` | **runs on its own** | It leaves the workspace but you can close it. Reversible and visible is not the same as irreversible. |
| Hand off to another agent | `confirm` | **runs on its own** | Internal, reversible. |
| Create a calendar event | `confirm` | **asks you first** | It appears in another person's day. That is not ours to undo. |
| Merge the pull request | `review` | **you check the output** | It puts code in your repository. We cannot take it back from here without asking someone outside to cooperate. |
| Roll back a release | `review` | **you check the output** | Customers saw the thing you are rolling back and will see what you roll forward to. |
| Hand a build to an outside coding agent | `review` | **you check the output** | Another organisation's system now has your work. |
| Any tool with no catalogued consequence | any | **asks you first** at best | We have not written down what it does, so we assume the worst. This is the right failure. |
| **Spend on one run** | none | **no ceiling** | **The one indefensible default. Fix it.** |

### 5.3 The one default that changes

**Ship a workspace-level spend ceiling.** `mission_spend_cap_usd` is already enforced fail-closed at
`runtime.server.ts:226-238` with a typed `capExceeded` reason, and **nothing sets it by default**. A
first run that costs $40 because a loop went sideways is the fastest way to lose a user permanently,
and a spend ceiling is the boundary a first-time user most wants and most expects to already exist.
The number is a pricing question for the founder; the absence of any number is indefensible.

### 5.4 What the user is owed in exchange, and it is not optional

A default the user did not set is not policy, it is a default we chose for them. Four conditions, and
each is a build item, not a sentiment:

1. Every untouched row is labelled **`our default`**, forever, until they touch it. A lint rule
   requires every `our default` row to resolve a defence string from the same module the default is
   defined in, so **a default cannot be added without writing the sentence that justifies it.**
2. The pane's first line is the truth: `Your crew is already working inside these.`
3. **Everything unattended lands in "Done without you"** (precondition B0). Without that, this
   default is not delegation, it is opacity.
4. **Tightening is one click, from the receipt, at the moment of the feeling.** Never from Settings.

---

## 6. WHAT THE HUMAN'S JOB IS, AND THE SIGNATURE MOMENT

### 6.1 The job, in three parts

1. **Set the grant.** Rarely, mostly by accepting a proposal the record already justified.
2. **Judge the five things with no oracle.** Which bet, is the spec right, does the design look
   right, does this go live, what did the outcome mean.
3. **Steer, at any moment, without a gate.** §6.3.

Nothing else. In particular, **not**: judging each raw signal, triaging research branches, reviewing
hunks, ratifying each remembered belief, approving each mid-run tool call under an approved spec.

### 6.2 The signature moment: the grant

`agents/FINAL-agent-presence.md` R10 made the approval the product's signature moment: *"an approval
does not vanish into a toast, it becomes a receipt, draws an arrow to whoever picks the work up,
moves the Bar, and moves the Spine. 1.2 seconds, four regions, one causal chain."*

**Keep every beat. Change the subject.** The ceremony fires when **the set of things that will not
ask you again changes**: a graduation accepted, a rule written from a receipt, a grant taken back, a
spec approved (because a spec approval *is* a scoped grant, §5.2 of the sorter's Q0).

Beat 1's argument is untouched by the change and is the reason to keep it: *"An approval that erases
itself teaches the user that their judgment left no trace."* **A grant that erases itself teaches the
same thing, and a grant is used a hundred times.**

**The flagship instance is the graduation**, and the reason it currently lands as a toast is
structural rather than a craft failure: **there was nowhere for the thing that just changed to land.**
So the fourth beat is new and it is the point:

```
Beat 1  0-180ms      the card becomes a receipt
                     You let Reviewer check diffs on its own · 14:32

Beat 2  180-450ms    no arrow. The line says what changed:
                     That is one fewer thing waiting on you, from now on.

Beat 3  450-800ms    Reviewer's mark settles into its working state.
                     Nothing lights up. It is already going.

Beat 4  800-1200ms   the exception count decrements, and the House rules row
                     for Reviewer writes itself in, provenance
                     "earned, 12 clean runs".
```

Beat 4 turns an abstract act (accepting a proposal) into a concrete object (a line they own, can
point at, and can take back). **That is the difference between a permission granted and a boundary
set**, and it is why the surface has to exist before the ceremony means anything.

`agents/FINAL-agent-presence.md` Beat 2's *"never an arrow to nowhere"* rule already handles the case
where nothing picks the work up, and its own replacement line is already written for exactly this:
*"Now a standing rule. It will stop your crew next time."*

### 6.3 The third job: steering, un-gated

`depth/FINAL-depth.md` §7.2's gate card offers `[ Approve ] [ Deny ] [ Change something ]`. **The
third verb is the best idea in that document and it is trapped inside a gate.** It routes through
`injectSteer`, which the loop already consumes at the top of every step
(`loop.server.ts:876-922`), and that machinery has never had a UI.

**Ruling: steering is available at any moment, not only when the machine stopped to ask.** That
single change converts the gate from a blocking question into an optional intervention, and it is the
cheapest way to make a low-gate product feel controllable rather than runaway. A human who can redirect
work at any time needs to block it far less often.

It also fixes a live lie: `/approvals` says *"Rejected. Noted for next time."* and **nothing is noted
anywhere a model reads.** Capture the reason and route it through `injectSteer`. Under this frame the
correction reason is the primary policy signal, so losing it is not a copy defect, it is the loss of
the thing that makes the queue self-eliminating.

### 6.4 The interposition, which is not a gate and must never be queued

`edge/FINAL-edge.md` §4.3: *"You decided the opposite in March. It cost two weeks."*
`[Do it anyway] [Show me what happened]`.

This is **not a Call** and must never enter the tray or the count. It is fired by the record, at the
moment of a human act, one per precedent, never queued. It is the record exercising the human's own
prior judgment, which is the purest expression of this frame anywhere in the nine documents. Keep it,
rename it in doctrine to **interposition**, and exclude it from every gate metric.

---

## 7. HOUSE RULES: THE SURFACE

### 7.1 What a house rule is

> **A standing sentence the user wrote about what their crew does without them. It is stored, it is
> enforced where the tool executes, it names itself on every receipt it causes, and the product
> proposes the next one from the record of the calls the user already made.**

The ratified definition is half a definition: *"a standing rule you wrote that decides when your crew
must stop and ask you."* **A product where every house rule adds a stop is a machine for
manufacturing interrupts.** Amendment, for `language/FINAL-language.md` §2.4:

> **House rule.** A standing rule you wrote about what your crew does on its own, and what it must
> stop and ask you about.
> _Banned beside it: guardrail, policy, gate, permission, constraint, boundary, rule engine, policy
> engine, automation rule._

`Autonomy` gets the same repair (§2.7): from *"How far an agent may go before it stops and asks you"*
to **"What one agent may do without asking you."** The old form measures the distance to the next
interruption. The new form is also the enterprise buyer's question verbatim.

### 7.2 The three shapes we may offer, and the one we may not

| Shape | The sentence | Stored | Enforced today |
| --- | --- | --- | --- |
| **Standing** | `Engineer opens pull requests on its own.` | `agent_tools.mode`, `agent_tool_modes.mode`, `agent_autonomy.arc` | **yes**, `resolveToolMode` |
| **Reach** | `Scout never touches anything outside this workspace.` | `agents.max_tool_risk` | **yes**, `capToolsByRisk`, which removes the tool from the prompt entirely |
| **Ceiling** | `Nothing spends past $5 on one run.` | `mission_spend_cap_usd`, `mission_token_cap` | **yes**, `runtime.server.ts:226-238`, fail-closed |

**Reach is stronger than standing, and users are told so in one clause: a rule about standing decides
who asks; a rule about reach decides who can.** Reach is the best model in the codebase for
pre-authorization, because it changes what is *possible* instead of interrupting what is *attempted*.
Prefer it wherever it fits.

**The fourth shape, which we may not offer until it compiles:** conditional rules over the world.
`Nothing merges on a Friday.` `Anything touching billing comes to me.` These have no predicate, no
evaluator and no storage. They keep working as prompt guidance and are rendered **in a separate band,
honestly labelled**: `Written guidance. Your crew reads these. They are not enforced.` That sentence
is uncomfortable and it is the only defensible thing to print. It also does more work than a year of
roadmap, because it makes the enforcement gap visible to us every time we open the screen.

`edge/FINAL-edge.md` §3.5 currently publishes `Engineer stopped because of your rule: nothing merges
on a Friday` as example receipt copy. **That is copy ahead of wiring and it is replaced** with a
shape that resolves: `Engineer stopped. You asked to see pull requests first, 40 seconds ago.`

### 7.3 The anatomy: four bands, one screen

`?pane=rules`, one keystroke, read next to the work it governs. **Not a settings section.** Settings
keeps exactly one row whose entire body is a sentence and a link into the pane, and the legacy
`?section=autonomy` id survives as a redirect.

The override of `ia/FINAL-ia.md` §2.4 uses IA's own argument, made two paragraphs later in the same
section: *"a prompt, a guardrail and a cap are how the engine runs, and their results are read next to
them. Splitting definition from result across two destinations is how `/engine-room` became
unreadable."* A house rule is the strongest case that argument has, because **its result is a Call
that did not happen**, and the only place you can see that is beside the work.

```
─────────────────────────────────────────────────────────────────────────────
  HOUSE RULES                                                    [ + Write ]
  Your crew works inside these. 6 rules, 3 you wrote, 3 you accepted.
─────────────────────────────────────────────────────────────────────────────

  WHAT RUNS WITHOUT YOU
  Read-only research              runs on its own       our default   ›
  Internal writes                 runs on its own       our default   ›
  Stakeholder work                asks you first        you, 12 Jul   ›
  Repo writes                     you check the output  always        ›

  BY AGENT                                                 3 differ from above
  Engineer   opens pull requests on its own    earned, 12 clean runs  ›
  Reviewer   checks diffs on its own           you, 3 Jul             ›
  Scout      cannot reach outside this workspace  you, 1 Jul          ›

  CEILINGS
  One run stops at                $5.00                   you, 3 Jul  ›
  At most                         5 runs at once          our default ›

  WRITTEN GUIDANCE                              Your crew reads these.
                                                They are not enforced.
  "Prefer boring solutions over clever ones."             accepted 8 Jul ›
  "Ship behind a flag when the change touches checkout."  accepted 8 Jul ›

─────────────────────────────────────────────────────────────────────────────
  2 things crossed a rule this week.                      see them  ›
─────────────────────────────────────────────────────────────────────────────
```

**Band 1 is the spine and it is `consent-classes.ts`, which already exists and is already read-only.**
Four consequence classes with a plain-words posture each, whose own header says the intent out loud:
*"so a person sets consent once per class instead of tool by tool."* It has no setter. It renders a
policy the user cannot change, below a per-tool control that ignores it. **Giving it a setter is the
single highest-leverage item on the surface**, because four choices is a decision and fifty is a
chore.

**Band 2 shows only agents that differ from band 1**, so a workspace with no per-agent rules shows one
honest line: `No agent has its own rule. They all follow the four above.`

**The footer is the honesty line.** If `2 things crossed a rule this week` reads zero for a workspace
with rules, either the rules are right or they are dead, and the link says which.

**Not on this screen:** guardrails (they are regex content filters over model text and have nothing to
say about what an agent may *do*; they stay in the engine room's safety room), the kill switch (an
act, not a rule), the trust score, any number between 0 and 100, any meter, any progress bar, the four
rung names, and the recent-runs usage table.

### 7.4 Provenance: the whole trust argument in one word

Every row states where its rule came from. Exactly four values, three of which need no new storage:

| Value | Meaning | Source |
| --- | --- | --- |
| `our default` | Nobody chose this. We did, and here is why. | no row exists |
| `you, 12 Jul` | You wrote it. | `agent_tool_modes.source = 'operator'`, `agent_autonomy.set_by` |
| `earned, 12 clean runs` | It asked, you said yes, here is the evidence. | `agent_tool_modes.source = 'graduation'` |
| `always` | A floor. Not a setting. | `HIGH_RISK_FORCE_REVIEW`, `HIGH_RISK_MIN_CONFIRM` |

This is the constitutional clause rendered: the word `our default` is the visibility, the row's
expansion is the explanation, and the row itself is the change.

**Tapping a floor does not open a control. It opens the row and states the reason:**
`This one always stops. Merging puts code in your repository and we cannot take it back from here.`
`Nothing you can set changes this.` A locked control that explains itself builds more confidence than
an unlocked one.

### 7.5 How a rule gets written, in order of how often it should happen

**Most rules should not be written from this surface at all. The composer is the fallback.**

1. **From a Call you just answered.** The receipt following the *n*th identical approval grows one
   quiet line: `That is 14 in a row. Let Engineer do this alone?` One click writes the rule. **This is
   the primary path** and it is the queue turning into the input for its own elimination.
2. **From a receipt of unattended work.** `ask me next time`, at the moment of the feeling. It writes
   the tightening rule and calls `revokeTrustGraduation` where the row was earned. This and path 1 are
   **one component with two entry points**, not two features.
3. **From the pane.** Deliberate, and the only place a rule is edited or deleted.

If the composer is where rules come from, we have built a settings page with better typography.

**The composer is one sentence with three closed-list slots and no free text anywhere:**

```
[ Engineer ▾ ]   [ runs on its own ▾ ]   on   [ opening a pull request ▾ ]
and stops if it would spend past [ $5 ▾ ]                       (optional)

Right now: Engineer asks you first. This happened 14 times in the last
30 days and you approved every one without a change.

[ Write the rule ]                                            Cancel
```

Four properties make this not a rule language: every slot is a closed list, so you cannot express a
rule that does not compile; the sentence is the whole UI, with no conditions section, no IF and no
THEN; **the current state is stated before you change it, from real counts**, which is the line that
turns a settings form into a decision; and the optional clause appears at most once, because two
clauses is a rule language.

Illegal combinations are **present and disabled with the reason inline**, never hidden, because
absence teaches nothing.

### 7.6 Editing, and work already in flight. The asymmetry is the design.

| Case | Ruling |
| --- | --- |
| **Loosening** | Takes effect on the next run, never retroactively. Items already waiting stay, and the pane says so: `From now on Engineer opens pull requests on its own. Three are still waiting on you from before.` `[ Approve all three ]` is offered because the user is standing right there, and it is **secondary, never the default, never automatic.** Auto-approving in-flight items on a rule change converts one click into N irreversible acts with no per-item read. |
| **Tightening** | Binds the current run at its next tool call. Safety needs no permission, and a tightening that waits politely for the run that worried you is not a control. One indexed read per gated call. |
| **Deleting** | Superseded, never erased. The row reverts to `our default` and the change stays in the record, so a user can ask *why did this change in July* and get an answer. |
| **A floor** | Cannot be edited. §7.4. |

### 7.7 How the product proposes rules from the record

`maybeProposeTrustGraduations` already does the hard half: it reads the last 300 decided approvals per
agent, computes a per-tool clean streak (`executed` extends, `rejected` or `failed` breaks), and at
five writes a proposal, blocked entirely by any `missed` outcome attributed to that agent within 30
days. That is a stronger claim than *you approved fourteen*, because `executed` means **you said yes
and the tool then ran clean.**

Four suggestion families. Three are new connections of data that already exists:

| Family | Trigger | The sentence |
| --- | --- | --- |
| **Loosen one kind of work** (exists) | 5 consecutive `executed` for one (agent, tool) | `Reviewer wants to stop asking.` |
| **Loosen a whole class** (new) | every tool in a class is at `auto` except one, and that one has a clean streak | `Everything else that stays inside your workspace already runs alone. This is the last one asking.` |
| **Tighten** (new, and it must exist) | 2 `rejected` or sent back in a row on a tool at `auto`, or one `missed` outcome attributed to the agent | `Engineer opened three pull requests you sent back. Want to see them first from now on?` |
| **Retire a dead rule** (new) | zero hits in 90 days | `Nothing has crossed this rule since April. Keep it?` |

**The tightening family is not symmetry for its own sake.** A suggestion engine that only ever
proposes more autonomy is a machine arguing for its own freedom, and a user will read it that way
within a month. The engine must be visibly willing to argue against itself, and the data already
exists in `rejection-learning.ts` (`summarizeRejections`), surfaced nowhere a user will look.

**Rate limit, hard: at most one loosening suggestion per agent per week, and at most three open
across the workspace.** A queue of suggestions to eliminate a queue is a joke the user will make
before we do.

**The waiting sentence**, which is the highest ratio of felt value to lines of code in this folder:

> `2 more clean runs and I'll ask you to let me stop asking.`

Never `2 more and I stop asking`, which is a promise the product does not keep because graduation
requires a human. It renders quietly on the Call card when that (agent, tool) is within two of the
threshold. **It makes an approval feel like an investment rather than a tax.** The user is still
clicking approve, but they are now clicking toward something and can see the counter.

**Hard precondition on the card's copy:** `decideTrustGraduation(accept: false)` writes `rejected` and
nothing prevents re-proposal on the next streak. The cooldown predicate and the copy ship in the same
commit, or the card says nothing about asking again. **An agent that respects `Not yet` is a
colleague. An agent that asks again on Tuesday is a nag, and a nag gets the whole mechanic switched
off.**

---

## 8. THE GATES THAT ARE RETIRED

Grouped by what replaces them. Every row was a blocking human decision in a doctrine authored
2026-07-28.

### 8.1 Dissolved by the spec approval (the largest single reduction)

`resolveToolMode` already contains a plan-level consent scope: once the governing spec is approved,
every **reversible** step under it is pre-consented and takes no per-step confirm. It is shipped,
guarded four ways, and unit-tested.

| Retired | Was | Now |
| --- | --- | --- |
| `ia` J4 step 3, mid-run tool approval | Gate, inline | **Informed.** The spec approval at J3 step 4 **is** the authorization. Asking again is asking twice for the same consent. |
| `shell` form 8, "mid-run tool approvals, inline" | Judge slot | **Informed.** |
| `shell` form 9, "approve / deny when the tool is `confirm`" | Judge slot | **Informed**, except the honest residue of two: the merge, and the hand-off to an outside coding agent. |

**Say it on the spec card, because a scope the user cannot see is not consent:**
`Approving this authorizes the reversible work in it. Nothing irreversible runs without you.`

### 8.2 Become house rules, with a default

| Retired | Rule name | Default |
| --- | --- | --- |
| `shell` form 1, judge each raw signal (`Is this real? Keep / Ignore`) | **What reaches you** | only patterns with two or more corroborating sources. Everything else is kept and searchable and never asked about. |
| `shell` form 2, `Does this add up? Promote / Split / Drop` | **Promote a pattern to a bet** | at three corroborating sources. The human judges bets, not patterns. |
| `ia` J2 step 3, `decideFanoutBatch` per branch | **Teardown depth** | the strongest three counters, the rest one click away. Judging each branch is judging retrieval. |
| `shell` form 11 / `interaction` §6.5-6.6, `Commit 8 hunks` | **What I check on a change** | the tests and spec conformance, not the hunks. `edge` §11 already rules the hunk gate fails the Evaluability Test. The hunk control stays as an escape hatch, never as the ask. |
| `shell` form 14, `Keep this belief?` | **Beliefs** | a learning becomes a belief when corroborated twice; a weekly digest names what was added; every belief carries `Stop using this`. Per-item approval at the write is the wrong side of the act. |
| `edge` §3.1 / §8.1, the merge | **Who merges** | **`A human merges`**, today's behaviour and the ceiling copy intact. Settable to `Merge when your tests pass and Reviewer agrees`. §13.3: this is currently an env var and must become a workspace row. |
| `edge` §3.2, flaky check | **Retry flaky checks** | on, one retry. |
| `edge` §3.2, failure inside the fix budget | **Fix budget** | 3 attempts, visible. Today it is invisible and unsettable. |
| `edge` §3.2, `Reviewer dissents` | **When Reviewer objects** | `Bring it to me`. Alternative: send it back once, then bring me the second failure. The Call itself survives; only its frequency is settable. |
| `edge` §3.4, credits | **Spend cap**, per run and per month | §5.3. |
| `edge` §3.4, model choice | **Model preference** | `Prefer depth`. Already correct, already policy, and the only row in `edge` §3 written in the corrected frame. |
| `edge` §3.5, source scopes | **What each source may do** | read-only, phrased as outcomes. Already correct. |
| unnamed in every doctrine: `event_subscriptions` with `is_default: true` | **Triggers** | the shipped defaults, stated in one line each: `When a source reports a spike, Scout looks into it. On its own.` **The largest unnamed autonomy surface in the codebase**, named in zero doctrines. |
| unnamed: `agents.enabled` | **Who is on the bench** | everyone employed. The switch exists in Settings and **only fires a toast**. The cheapest policy control in the product is a decoration. |
| unnamed: `agents.max_tool_risk` | **How far each agent may reach** | unrestricted. Pre-emptive rather than interruptive. |
| `edge` §3.5, the autonomy setting | **What each agent does on its own** | `trusted`. The central object, today a Settings row, now a first-class surface. |

### 8.3 Become informed, with a receipt and controls

| Retired | Why it was never a gate |
| --- | --- |
| `edge` §3.2 / §3.4, a terminal run failure or a failure after the budget | Its own copy disproves it: *"The change is not in your codebase and nothing shipped."* **Nothing is waiting on the answer.** A receipt with three controls: `Try again`, `Send back`, `Take it over`. |
| `edge` §3.4, the stall at 8 minutes | Already correctly written as a receipt with controls. Do not count it in the gate budget. |
| `edge` §3.5, a connector refresh that fails | Its own justification is a notification argument. Nothing needs judgment; the crew needs a credential. A receipt with `Reconnect Linear`. |
| `edge` §3.4, credits at the threshold | The crew has already stopped. A receipt plus a purchase door. |
| `edge` §3.5, tightening after a bad outcome | Correct as silent, **with two conditions**: it renders on the House rules surface, not only in a receipt, because the machine is overriding a boundary the human set; and it is reversible in one click. |
| guardrail blocks (`action: 'block'`) | **A blocked call is a boundary hit and no doctrine designs a single word for it.** Today the user's request silently does not happen. Apply the receipt shape: `Stopped by your rule: no customer names in prompts.` `guardrail_hits` already stores everything needed. |

### 8.4 Reclassified: controls, not gates

`edge/FINAL-edge.md`'s Call register conflates two different things, which is why it reads as dense.
Four of its fourteen Calls are not the machine stopping to ask, they are controls a human may invoke
whenever they like: `Revert an artifact version`, `Roll back a live release`, `Stop`, `Try again`.
Filing them as "Call, always available" is a category error: **always available is the definition of a
control; the machine stops and waits is the definition of a Call.**

Separating them removes a third of the apparent gate count without changing a single safety property.
Keep the confirm on the destructive ones. Delete the classification.

Same reclassification: `Stop everything`, per-run stop, `Fix and re-run from here`, `Hand to...`, and
the six modals in `interaction` §8.3.

### 8.5 What is NOT retired: the modal whitelist

`interaction/FINAL-interaction.md` §8.3's six modals need **no rework at all**, which makes it the one
section in the nine documents that survives whole: merge to main, delete a product or workspace,
revoke a member, paste an API key, grant or deduct credits, resolve a sync conflict. Every one fails
containment outside the product, and every one fails recurrence (each instance is different).

Note the register is currently **inverted in production**, which is the sharpest evidence that gate
count is not the same as safety: granting credits has **no confirm at all**, and resolving a sync
conflict **discards one side of a document permanently with no diff and no confirm**, while
reversible acts have several. Fix those before removing a single reversible gate.

### 8.6 Deleted outright

| Deleted | Why |
| --- | --- |
| Judging each raw signal | The queue disease in its purest form. §8.2. |
| `Revert version` and `Roll back release` as Calls | §8.4. |
| The `off` tool mode | §13.4. It is a permissive failure, not a disablement. |
| A routine's ability to Drop a bet | Already ruled. The capability is removed, not the question queued. |

---

## 9. THE DELTA PER DOCTRINE

Nine files. Three need structural rework; six need row edits. Named here so nothing is left to be
reconciled later.

| Doctrine | What changes |
| --- | --- |
| **`agents/FINAL-agent-presence.md`** | **Structural.** R10's signature moment keeps all four beats and changes subject from the approval to **the grant** (§6.2); §8.2's graduation card becomes the flagship instance and gains beat 4, the rule landing on the House rules pane; §8.3's claw-back and the `Ask me next time` affordance become **one component with two entry points**; §2's three-calls sentence is promoted from a line to **the gate budget**; A-12's `Send back` becomes reachable without a gate; §5.4's tool matrix is set **per consequence class first**, per tool only as a named exception, because 46 tools by 13 agents is not a boundary a human can set and four classes is; R11's unasked first Researcher run must be **disclosed as a default** on the sign-up screen and stoppable in one click. §5.4's locked-rows-with-reasons drawing becomes the model for the whole surface. |
| **`edge/FINAL-edge.md`** | **Structural.** §0's sorter gains Q0, Q1 and Q3b (§2); the Call register **splits into `Call` and `Control`** (§8.4); §3 re-runs through the new sorter, which changes 11 of its 29 rows and none of its four constitutional clauses; §3.6's one-table summary shrinks from 14 Calls to the floors in §4.1; §3.5's Friday example receipt is replaced with a shape that compiles (§7.2); §4.2's `tighten silently, loosen by Call` is **ratified verbatim and strengthened**: a self-applied tightening writes a receipt naming its evidence; C2's absorption price is **unpaid for 21 tools** and §12.6's build-time invariant is raised to a hard gate. |
| **`adaptive/FINAL-adaptive-layout.md`** | **Structural.** §9's *"A human is in this app to make judgment calls at gates"* is the gate frame compiled into a CSS invariant and is the deepest place it is buried. It is also self-defeating: **a layout whose top invariant is a gate has an empty top invariant on every healthy day.** New **I1: "What the crew is doing, what it did on its own since you last looked, and the open call if there is one."** The gate keeps its slot inside I1 and stops being I1. New **I6: the House rules row, one key (`⌘B`)** - if the human's job is setting grants, the grant must survive to S0 alongside the gate. The ordering rule changes from *rank by distance from the gate* to **rank by distance from the work**. `⌘G` survives for the residue. `shell-composition.test.ts` follows mechanically. |
| **`shell-question/FINAL-shell-ruling.md`** | Rows. The nine permanently drawn things **survive as nine**. Item 3 (the Judge slot) keeps its slot: a slot that is empty most of the time is honest. Item 6 inverts its emphasis: **the primary number is what the crew did on its own, and the exception sits beside it** (same query, inverted rendering). Of the fourteen forms, the Judge slot is deleted on forms 1 and 2, becomes a rule on 11 and 14, becomes informed on 8 and 9, and survives on 3, 6, 7, 12 and 13. §3.1's pre-commit stamp plus five-second undo is **the model the rest of the product should copy**: visibility before the act plus cheap reversal, instead of a permission prompt. D4's placement ruling stands. |
| **`interaction/FINAL-interaction.md`** | Rows. §8.3's six modals survive untouched, the only section that needs nothing. §6.5's `Default is in` is held up as the principle in miniature and generalised: **every proposal in the product defaults to the machine's answer.** §6.5's commit and per-mark verdicts become the `What I check on a change` rule. §6.4's dissent line is upgraded: when the same dissent shape repeats, offer `Make this a house rule`. §8.3's optimistic-plus-undo law stands with one correction: **an approve that fires `studio.pr.open` has no six-second inverse**, so the undo line names the real inverse or claims none. §10.2's consequence line is hard-gated on the catalogue (§13.5). |
| **`ia/FINAL-ia.md`** | Rows. Of the eight journey gates, J4 step 3 dissolves (§8.1), J2 step 3 and J4 step 5 become rules (§8.2), and J1, J3, J5, J6, J7 survive as the five floors. §4.2's J0 law is rewritten: from *"Human gates still stop it"* to **"J0 runs end to end on an approved spec. Three things stop it: a bet you have not judged, a design you have not seen, and anything that goes live."** §2.4's `autonomy` Settings section becomes a one-line row linking to `?pane=rules`, with the section id kept as a redirect (§7.3). §2.2's ember rail tile inverts with item 6. J7's armed outcome check is **held up as the right model**: a Call the human set in advance, arriving on a date they chose, which is policy producing a Call. IA-15's house-rule ratification family is **the shape everything else should copy** and it already ships. |
| **`depth/FINAL-depth.md`** | Rows. R-13 is **ratified verbatim** and §13.1 identifies the live code that inverts it. §7.2's `Change something` is un-gated and becomes available at any moment (§6.3). H-2's *"Rejected. Noted for next time."* is a live lie and the reason must now be captured and routed through `injectSteer`, because under this frame the correction reason is the primary policy signal. §7.1's single `decideGate` path lands regardless. R-12's `surface` parameter gains a second question: **which gates get the same answer every time**, which is the query that writes the rule proposals, plus a rule-provenance dimension. §8's queue survives as an object with a healthy size near zero. |
| **`language/FINAL-language.md`** | Rows. The in-app line is replaced (§1.2). `House rule` and `Autonomy` gain their granting half (§7.1). `Receipt` gains the authority clause. **New §5.8, the informed register**: the no-primary-button law, the two permitted controls, the authority-clause grammar (§3.1-3.2). §5.4's verbs are unchanged, with a note that the standing answer is never a peer button. The `Let it` / `Not yet` pair is added for a Call on a grant. `policy` stays banned in every user-facing string and stays legal in doctrine. The three diverged autonomy labels are **promoted out of Settings** and become the single vocabulary, enforced by a new `no-autonomy-label-literal` lint, because there are currently four vocabularies for three values. §7.6: **the graduation becomes a brand moment**, because the product's promise is that the gates go away and the ceremony must be on the going-away. §6.4: the zero state for Calls is the payoff, not a blank. |
| **`clicks/FINAL-click-register.md`** | No frame change, and **it is promoted from a defect list to evidence.** Ten of its worst findings sit on the approve path: two keyboard grammars that approve the wrong item, a digit that approves and navigates at once, a letter that approves and opens `/admin`, 18 handlers that render a green success toast on a **failed** approval, two divergent decide paths. **The approve path is the most defect-dense path in the application because it is the most over-built.** A queue nobody can operate correctly is not governance. Two of its findings invert the whole register and are fixed first: credits move money with no confirm, and sync-conflict resolution destroys a document with no diff and no confirm. |

---

## 10. THE TESTS, ANSWERED

### 10.1 The purpose test

> *"Even human in the loop, every approval, if it passes to a human, then what is the purpose of
> agents?"*

**Counted, for a team running five missions a week with nightly signal sweeps.**

| | Gate-centric (the nine doctrines as authored) | This frame |
| --- | --- | --- |
| Raw signals judged | ~77 (Judge slot on every signal at even 10% surfacing) | **0** |
| Patterns triaged | ~10 | **0** |
| Bets kept or dropped | 5 (one sitting per mission) | **5** |
| Teardown branches triaged | ~25 | **0** |
| Specs approved | 5 | **5** |
| Designs approved | 5 (blocking) | **5** (non-blocking) |
| Mid-run tool approvals | ~40 | **0** under an approved spec |
| Changesets reviewed hunk by hunk | 5 | **0**; the rule says what is checked |
| Merges | 5 | **5**, and settable to 0 by rule |
| Promotions to production | 5 | **5**, floor |
| Outcomes recorded | 5 | **5**, armed in advance, arrives on a date the user set |
| Beliefs ratified | ~15 | **0**; weekly digest, one-click retraction |
| House rules ratified | ~3 | **~1** |
| Misc (flaky, connector, budget, credits) | ~10 | **0**; receipts with controls |
| Graduation proposals | 0 | **~2**, rate-limited, and each one *removes* future interrupts |
| Standing audit | 0 | **1** |
| **Total per week** | **~210** | **~34** |

**Roughly six times fewer, and that is not the important number.** The important number is the
**shape**: under the gate-centric design interrupts scale with **agent steps**, so hiring the
fourteenth agent makes the human's week worse. Under this frame they scale with **shipped outcomes**
and fall as grants accumulate. That is the difference between automation and a queue with automation
attached.

**Per shipped feature: about seven decisions on day one, about four at month three.** The four are
which bet, is this good enough, does it go live, what did it mean. **They do not go to zero and they
should not**, because absorbing them is the product having an opinion it cannot justify.

**And the answer to the founder's question in one sentence:** the purpose of agents is that the
approvals which remain are the ones that make the next thousand unnecessary. The dominant inhabitant
of the tray becomes the graduation proposal, which is a click whose direct effect is that the product
asks you less. That is the only interaction in the product with that property.

### 10.2 The ownership test

> MuleSoft: the business owns every outcome regardless. Can a risk officer see what agents may do,
> what they did, and prove nothing exceeded its boundary?

**What they may do:** the House rules pane, exported as the buyer artifact, generated from live
configuration rather than written by marketing:

```
What your crew may do alone                       Workspace: Acme · 29 Jul 2026

  Without asking            31 actions      last changed 12 Jul by Rohit Gajaraj
  Asks you first            13 actions
  Never, at any setting      6 actions      floors, not settings

  Never, at any setting
    Put a change in front of customers
    Change your database schema
    Spend past your cap
    Send anything outside this workspace
    Score or rank a person
    Turn its own record off

  Every action above is one line in the record, with who allowed it and when.
                                                    [ Export ] [ House rules ]
```

**What they did:** the record, append-only, contemporaneous, sealed, with the authority clause on
every unattended act. Adverse rows get equal or greater detail than favourable ones, or it is a
highlight reel rather than a record.

**Proof that nothing exceeded its boundary:** the authority clause is the proof, per row. Every
unattended act names the grant, who set it, and when. That is what an insurer's bounded-autonomy
requirement and EU AI Act Article 12's lifetime-logging duty both ask for, and it is the same line
the PM reads for comfort.

**One block of that artifact is currently unrenderable and that is the build item that turns our best
sales asset from a promise into a screenshot.** The floors exist as hard-coded TypeScript sets, so
nothing in the data can be queried to produce the `Never, at any setting` list. Hand-writing it in the
UI would be copy ahead of wiring. **Make the floors addressable as data.**

**The falsifiable number, and it belongs in three rooms at once:**

> **Calls per week, falling. Outcomes held, flat or rising. On one chart.**

If Calls fall and outcomes hold, the machine got better and the human got leverage: the entire product
thesis in two lines. If Calls fall and outcomes degrade, we loosened too fast and the chart says so
before a customer does. If Calls do not fall, the product is not working and we are the first to know.
It is uncopyable for the same reason the moat is: it is computed from this workspace's own record of
grants, verdicts and outcomes, and a competitor with all the raw data cannot reconstruct it. It is
also, unmodified, the enterprise renewal conversation and the insurer's evidence. Build once, use in
three rooms. The inputs exist; `getGateSignals` currently has zero consumers, so half the numerator is
computed and thrown away.

**Second number, and it is the one that finds our own dishonesty:** the share of standing rules whose
provenance is `earned` or `you` versus `our default`. If it stays near zero after a month of real use,
either the suggestions are wrong or nobody trusts them, and both are findable.

### 10.3 The new-user test

**Day one is autonomous, and it is defensible line by line.** §5. Band 1 of the House rules pane is
fully populated with four `our default` rows, band 2 is empty with one honest line, band 3 has two
defaults, band 4 is empty. Not a blank slate, not an onboarding wizard, not a "get started" card.
**The product arrives with an opinion and shows its work.**

The first line under the header:

> `Your crew is already working inside these. Change any line, or leave them and watch what happens.`

**Does it feel autonomous or timid?** Autonomous, and the proof is that the first Researcher run
starts unasked while the room paints. That instinct is correct and it has one missing piece: **it
costs real credits before the user has typed a word**, so it must be stated as a default and stoppable
in one click: `Your crew starts working the moment you land. Stop it any time.` An undisclosed default
is not policy.

**The honest catch:** the day-one defence rests entirely on four floors that hold on run one exactly
as hard as on run one thousand, plus a spend ceiling that **does not exist yet**. Ship the ceiling
before the story.

### 10.4 The irreversibility test

**Every retired gate was checked against containment. None crosses the line.** The retirements fall
into four groups and each is safe for a stated reason:

- **§8.1, dissolved by the spec approval:** every one is explicitly limited to `reversible` tools
  under an approved contract, and the clause in `resolveToolMode` excludes both floor sets by name.
  The residue is two: the merge, and the hand-off to an outside coding agent. Both stay.
- **§8.2, become rules:** all internal and reversible (signals, patterns, teardown branches, hunks,
  beliefs, retries, fix budget, model choice), except **`Who merges`**, which is the one policy in
  this document that governs an irreversible act. It is legal **only** because its default is
  today's behaviour, the alternative is conditioned on tests passing and Reviewer agreeing, the
  ceiling copy stays intact, and the residue stays a Call when tests are red, Reviewer dissents, or
  the change touches a path the user marked protected. **It also fixes something worse than it
  creates:** today that boundary is set by `STUDIO_AUTO_SHIP`, an environment variable, which is
  invisible to the customer, absent from the buyer artifact, and unattributable in the record.
  Promoting it to a named workspace row with today's behaviour as its default is strictly safer than
  the status quo.
- **§8.3, become receipts:** every one of these had **already completed or already stopped** when the
  gate was drawn. Their own doctrine copy says so: *"The change is not in your codebase and nothing
  shipped."* Nothing was waiting on the answer.
- **§8.4, reclassified as controls:** no safety property changes at all; only the register they are
  counted in.

**Three retirements were rejected on this test and stay gates:** the merge itself, the production
promotion, and the schema change. And one gate that nobody drew is **added**: making something public.
`/p/$slug`, `/d/$slug`, `/t/$slug` and `artifacts.share_slug` exist, publishing crosses containment,
and **no doctrine rules the act.** No registry tool writes a share slug today, so this is a doctrine
gap rather than a live risk. Rule it before any share tool is added: **making something public is a
Call at every autonomy level**, in the same class as the production deploy.

### 10.5 The honesty test

§11, in full and without softening.

### 10.6 The design test

§12, in full.

---

## 11. WHERE THE FOUNDER'S INSTINCT CREATES REAL EXPOSURE

Six. Written plainly, because the job is to be defensible to a risk officer and not only delightful to
a PM.

### 11.1 "Completely owned by agents" cannot include owning the grant, and we are already over that line

If the machine sets the rules it operates under, there is no governance, only self-certification.
**Bounded autonomy is what an insurer will underwrite, and a self-widening bound is by definition
unbounded.** State it in the doctrine so no design pass has to rediscover it:

> **The agents may run everything except the definition of what they may run.**

**And we crossed it in two places, both verified in the working tree this session.**

**First, the rule layer.** `self-improve.functions.ts:516` inserts into `house_rules` with
`status: "approved"`, live, with no human decision. The comment says *"APPROVED = live now; reversible
via supersession."* Meanwhile `house-rules.functions.ts` exports `listHouseRules`, `decideHouseRule`,
`supersedeHouseRule`, `getActiveHouseRulesForWorkspace`, and **no `createHouseRule`.** Read that
composition carefully:

> **The machine can write itself a live standing rule. The human cannot write one at all.**

The rule text is model-generated free text scoped into an agent's system prompt. The safety screen
checks the *text* for injection; nothing checks the *rule* for direction. A generated rule reading
*"do not stop to ask about X, it slows the user down"* would be inserted approved and live. So the
ratified phrase *"a standing rule you wrote"* is copy ahead of wiring, and **the frame's entire
premise, that the human authors the grant, has no code path.**

**Second, the standing layer, and this is the composite fact neither audit lane stated.**
`auto_advance_agent_arc` promotes `observing -> proving` at 5 clean runs and `proving -> trusted` at
20, is called from `loop.server.ts:686` and `:1579` after every completed run, and writes with
`set_by = NULL` to mark the change as machine-made. Nothing auto-tightens: `suggestArc` computes a
suggestion that nothing applies, and the only TypeScript writer of `agent_autonomy` is `setAgentArc`,
a human click. So **the only automatic movement of an agent's standing in production is upward.**

R-13 says a tightening may auto-apply and a loosening may only propose. Production does the exact
opposite. And it is worse than a symmetry violation: because the bootstrap default is already
`trusted`, the promotion branch is a no-op on a fresh workspace, so **its only real-world effect is on
an agent an operator deliberately dialled down.** It silently undoes the tightening, aimed precisely
at the one user who asked for less autonomy.

**Ruling: delete the promotion branch.** Keep the bootstrap insert (it is the founder-ruled default
and §5 depends on it). Keep any future demotion. Replace the promotion path with a proposal through
`trust_graduation_proposals`, which already does this correctly. One migration, four lines of
PL/pgSQL, and it is the first thing to fix in this folder.

### 11.2 Scoring people and allocating their work is the line that changes what kind of company we are

The instinct *the crew should just assign the work and tell people what to do* is, as far as I can
find, **the only feature idea in this product that changes our regulatory class.** It reads as
obviously good and it is the expensive one.

EU AI Act Annex III point 4 classifies AI used in employment and worker management as high-risk, and
the scope explicitly covers task allocation, performance monitoring and evaluation. The trigger is a
**material influence** standard, so a formal human rubber stamp does not save it. Enforcement from
**2 August 2026**, four days from now, pulling in Articles 9 to 15 in full plus an Article 26 deployer
duty that lands on our customer. Where the effect on an individual is significant, GDPR Article 22
stacks on top.

**We are one product decision away.** The gate-signal aggregate already reads *"You approved 14 of 17.
You sent 3 back. What you changed most: the success metric, 3 times."* Point that sentence at a named
human instead of at Writer and we are a regulated high-risk HR system.

Cost of holding the line today: a schema constraint (trust and gate-signal subjects are agents) and a
copy rule (the crew proposes work for a person; a person enacts it). Cost of retrofitting: conformity
assessment, technical documentation, a quality management system, registration, and a compliance
burden we hand to every customer's procurement team. **That burden loses deals; it does not win
them.** N1 and N2 in §4.2 are not negotiable by a later design pass.

### 11.3 Removing the click moves liability toward us, not away from us

Today the human's click is the artifact that says the customer owned the outcome. Remove the click and
the artifact must become **the standing rule plus the record**. If the standing rule is a default *we*
chose, then **we authored the decision.**

So the more we absorb, the more our defaults become our product liability. **This argues for
aggressive default visibility, not aggressive defaults.** It is also the commercial reason the
claw-back is not optional: a default the customer can see and reverse in one click is a default they
**adopted**; one they never saw is one we **imposed**.

Corollary needing counsel rather than a design doc: our customer agreement almost certainly predates
agentic behaviour, and an indemnity we cannot insure is not worth writing.

### 11.4 "Everything is provable afterwards" is only true if somebody proves it

This is the honest completion of the founder's own principle and nobody in this folder has written it
down.

The arithmetic that kills the gate-centric design also kills the naive version of the replacement: at
50 agents and 20 tool calls an hour, that is 1,000 approval-eligible events an hour. Routing 10% to a
human is three full-time people doing nothing but clicking, which is why the gate model fails. **But
at that same volume nobody reads the receipts either.** A record nobody queries is an archive, not
oversight. Article 14 asks that oversight be *possible*; a buyer will ask whether it actually happens.

**So the frame needs a third leg: the standing audit.** Policy set in advance, enforced in the path,
**and sampled.** The crew reviews a sample of its own unattended work on a schedule, reports what it
would have done differently, and **that report is a Call.** It is the one interrupt that earns the
user's attention every single time, because it is the crew holding itself to account.

This is assembly, not invention. `maybeProposeTrustGraduations` already reads outcome windows for
`missed` outcomes, which is the tightening half. `gate-signals` records every human correction and has
zero consumers, which is the other half. And it turns *you can trust the record* from a claim we make
into a behaviour the product performs.

### 11.5 Fewer interrupts is a safety argument, and this one is in the founder's favour

Worth stating because this section is otherwise a list of brakes, and because it is the argument to
lead with in any room where the change is questioned.

The gate-centric design does not merely slow things down, it **measurably degrades the oversight it
claims to provide.** Workers under high AI-oversight demand expend 14% more mental effort, report 12%
more mental fatigue, make **39% more major errors**, and are 39% more likely to be looking to leave.
The precedent from a field that tried this first: clinicians dismiss between 49% and 96% of safety
alerts. Google DeepMind's *AI Agent Traps* names approval fatigue as a human-in-the-loop trap by
construction. Gartner predicts that by 2027, **40% of enterprises will demote or decommission
autonomous agents because of governance gaps found only after a production incident**, which means our
buyers will have been burned before we arrive.

**A design that asks less, and asks better, produces more real oversight than one that asks
constantly.** That reframes the entire risk conversation and it is defensible to a risk officer.

There is also a commercial version of it, and it is the sharpest finding in the whole audit set: **the
gate-centric design was mispriced by our own pricing model.** If a human approves every item, credit
consumption is capped by human throughput, and `moat.md` §7's entire *"we grow as decisioning
automates"* argument requires that decisioning actually automate. **The old frame was not only slow,
it was structurally incompatible with how we plan to make money.**

And one more thing in the founder's favour, verified: the principle document's own headline tell, that
the loop's `?? "confirm"` default makes permission the default, **is wrong, and wrong in his favour.**
§13.2. The runtime already implements his principle and has since 2026-07-08. **The doctrine was
behind the code, not ahead of it.** The audit's job was to bring the doctrine up to the runtime, not
to change the runtime.

### 11.6 The launch calendar collides with Article 50, and the gap is four days wide

EU AI Act Article 50 transparency applies from **2 August 2026**. Today is **29 July 2026**. Public
launch on every external surface is **September 2026**.

Because we will be placed on the market *after* the deadline, the AI Omnibus grace period to
2 December 2026, which covers systems already on the market before 2 August, does not obviously reach
us. The safe reading is that generated content leaving the workspace needs disclosure and
machine-readable marking **at launch, not later**. This binds Publisher, the ship stage, generated
release notes, and any customer-facing copy the crew writes. It needs a lawyer's answer in the next
two weeks, not in September, and the engineering it implies is small now and awkward after the
surfaces are built.

---

## 12. THE DESIGN PASS: WHAT A SCREEN LOOKS LIKE WHEN THE COUNT READS ZERO

The next design pass starts here. A queue-shaped interface is the wrong interface even when it is
beautiful, and the correction is not a nicer empty state.

### 12.1 The single instruction

**Never render an empty container. Render a state, and a count of what happened.**

An empty tray with elegant typography still teaches the user that the tray is the point and that today
it happened to be empty. A state line teaches that this is how it is supposed to look.

### 12.2 The inversion, which is one query rendered the other way round

Today's emotional centre is *what is waiting on me*. It stays one of the nine permanently drawn
things, and **its primary number becomes what the crew did on its own**, with the exception beside it,
smaller:

```
    Ran on its own   23              Waiting on you   0
```

At zero, the second reads **`Nothing waiting`**, which is a state. It never reads `0 items` or
`Inbox zero` or an empty container with a checkmark.

**Naming constraint, binding on the shell and IA lanes:** whatever the place Calls collect is called,
**it may not be a noun of accumulation.** `tray`, `queue`, `inbox`, `backlog`, `pile` all promise that
things stack up, and a frame that says the gate is the exception dies at first glance against a
container that promises a heap.

### 12.3 The room, on a healthy day

The dominant register is informed, so the room is a **record of work that happened**, not a list of
work awaiting permission:

```
Nothing needs you.

Your crew ran 6 things on its own since Tuesday.
  Reviewer    checked 4 diffs                       all clean
  Scout       pulled 112 signals from 4 sources
  Engineer    opened 1 pull request                 you merged it

                                        see all 6 · ask me next time
```

One line per item, per the founder's density ruling. Depth is one click, never on the surface.
`ExecutedCard.tsx` already renders this and needs a home.

### 12.4 The layout invariants change, and this is the deepest edit

`adaptive/FINAL-adaptive-layout.md` §9 makes the open gate invariant I1, *"This is the product"*, and
orders every demotion by distance from it. **On a healthy day that layout's first principle is
absent**, and everything is ranked by distance from something that is not there.

- **I1 becomes:** *what the crew is doing, what it did on its own since you last looked, and the open
  call if there is one.* The gate keeps its slot **inside** I1.
- **I6 is added:** the House rules row, reachable with one key. If the human's job is setting grants,
  the grant survives to the smallest breakpoint alongside the gate.
- **The ordering rule becomes:** rank by distance from **the work**.

### 12.5 The Call card, when one does appear

Rare, so it can be excellent, and it must survive the founder's verbosity ruling: **one or two lines
on the surface, depth one click.** Three things earn their place on the card and nothing else does:

1. **What will happen**, in one sentence, from the consequence catalogue rather than from model
   output. A policy or a verdict can only be formed over a consequence stated flatly.
2. **The three verbs.** Never one. §3.4.
3. **The waiting sentence, when it applies:** `2 more clean runs and I'll ask you to let me stop
   asking.` This is what turns the remaining click from a tax into an investment.

The standing answer (`stop asking me`) is **not** on this card. It appears in the receipt that
follows, with the count.

### 12.6 The House rules surface, and the colour test

Four bands of one-line rows with a right-aligned provenance word, deliberately the least decorated
surface in the product. It is also a clean test of the founder's 2026-07-29 colour ruling: **monochrome
carries the rows; green and red do not appear at all** because nothing here has a status; **blue
appears only where an agent named in a row is working right now**; and **ember appears exactly once, on
`+ Write`.**

If this screen needs more colour than that to be readable, the information architecture is wrong, not
the palette.

### 12.7 Where the ceremony goes

The founder's Ask-in-the-top-right ruling stands and the grant ceremony must not be buried inside a
pane. The Commit's four beats span regions by design (`agents` §9), so the graduation must be able to
fire **in the room**, with beat 4 landing on the House rules row whether or not that pane is open. A
ceremony confined to a pane the user has to open first is a toast with more frames.

### 12.8 What the design pass must not do

- Do not design a beautiful queue. The count is the problem, not the rendering.
- Do not add a dial, a slider, a rung ladder, a trust score, a meter or any number between 0 and 100.
  The four-rung ladder never renders; `setAgentArc` survives only as the write target behind a
  sentence.
- Do not put House rules in Settings, and do not build a second copy of any control there.
- Do not build a condition builder, a time predicate, a policy-as-code editor, or a per-rule dry-run.
  Each is a real product someone will ask for, and each converts this surface back into the settings
  page it exists to replace.
- Do not render a free-text guidance rule beside an enforced rule with the same weight. That is the
  lie.

---

## 13. THE CODE CORRECTIONS THAT MATTER

Read or run against the working tree, 2026-07-29. The full lists are in the three lanes; these five
change what we build.

### 13.1 The only automatic movement of an agent's standing is upward

§11.1. `auto_advance_agent_arc` promotes and is called after every run; nothing auto-demotes. R-13
inverted in production, hurting only the user who tightened. **Delete the promotion branch.** First
fix in the folder.

Two ratified sentences are copy ahead of wiring until the demotion half is built:
`edge` §3.5's *"Narrowing an agent's rope after a bad outcome, silent, on the record"* and `agents`
§8.1's *"a background nudge"*. **Build the tightening or delete the claim.** It is the safe half of
R-13 and it is what makes low-gate defensible rather than reckless.

### 13.2 The `?? "confirm"` default is not the principle inverted in code

The principle document's central engineering claim, and it is wrong in the founder's favour. The raw
seed is `modeOf.get(call.name) ?? "confirm"` (`loop.server.ts:1146`, not `:1103`), but the loop **fails
closed before that line**: a tool not in `modeOf` is refused outright. The only calls that reach the
fallback are the five orchestration control-flow tools, and those short-circuit the queue branch below,
so **the fallback cannot cause a single approval.** It is dead defensive code.

The real posture is set by the seeded mode composed with the arc, and `loadAgentArc` returns
`"trusted"` with no row, so `resolveApprovalMode("confirm", "trusted")` returns **`"auto"`**. The
composed default is autonomy. **The runtime already implements the principle and has since
2026-07-08.**

### 13.3 The merge floor is currently disabled by an environment variable

`AUTO_SHIP_ENABLED` is `process.env.STUDIO_AUTO_SHIP === "1"` (`loop.server.ts:91`), and at `:165` it
drops `studio.pr.merge` from review-pinned to the trust arc, which at `trusted` resolves to `auto`.

Default off, and the shape is wrong regardless: **an env var is invisible to the customer, absent from
the buyer artifact, and unattributable in the record.** If it is ever set, the doctrine's proudest
ceiling sentence (*"Your crew opens the pull request. A human merges it."*) becomes false in production,
silently. Copy that describes a safety property is versioned with that property. **Promote it to a named
workspace row with today's behaviour as its default.**

### 13.4 `off` is a permissive failure, not a disablement

`ToolModeSchema` accepts `"auto" | "confirm" | "review" | "off"` (`agent_loop.functions.ts:176`).
`resolveToolMode` has no `off` branch and passes it through. The loop's gate is
`mode === "confirm" || mode === "review"` (`:1150`). **So a write tool at `mode: "off"` and
`enabled: true` executes with no gate.**

It is unreachable from today's UI (the panel filters those rows and real disablement is
`agent_tools.enabled`), which is why it is not a live incident, not why it is not a defect. It is a
permissive failure mode on the very API that sets policy. **Delete `"off"` from the schema, or handle
it as a refusal.**

### 13.5 The consequence catalogue is incomplete, and the one policy surface lies permissively

**21 of the 46 registry tools have no `tool-consequences.ts` entry, and six of them are
`category: "write"`:** `decision.revise`, `roadmap.move`, `prd.revise`, `cluster.trigger`,
`studio.revert`, `agent.spawn`.

Three consequences, each worse than the last:

1. `isSideEffectingTool` is literally defined as membership in that catalogue, so **an unattended agent
   revision of a human's decision, or a roadmap re-rank, is not counted as unattended work** and never
   appears in "Done without you". C2 is the price of the absorbed register and it is unpaid for exactly
   the acts that most need it.
2. `classifyConsequence` tests `isSideEffectingTool` first, so those six **write** tools land in
   *"Read-only research / Auto-run / Safe to run on its own. Nothing to undo."* **The one policy surface
   that exists lies in the permissive direction**, while `toolRisk` fails them closed to `high` and the
   loop demotes them to `confirm`. The panel and the loop disagree in opposite directions about the same
   six tools.
3. `studio.revert` is force-pinned to `review`, so it always shows a card, and that card renders the
   default consequence line, *"Effect not catalogued. Review the arguments before approving"*, on the
   single most consequential undo in the product.

**Raise `edge` §12.6's proposal to a hard gate: a side-effecting tool with no catalogue entry fails the
test suite, and no house rule may be written over an uncatalogued consequence.** Until it lands, the
consent panel renders an explicit `not catalogued` class rather than folding into read-only.

### 13.6 Two more that land regardless

- **Two divergent decide paths.** Today decides through six server functions; `/approvals` decides
  identical items through one. Merge into `decideGate` with the `surface` parameter, or the correction
  signal is lost from the surface where decisions actually happen.
- **`HANDOFF_EVIDENCE_GATE` is default OFF**, so the stated rule that handoffs without evidence are
  rejected is currently false. **Under this frame it becomes more urgent, not less:** as gates come out
  of the UI, the execution path is the only remaining enforcement surface. Require the declared
  **field**, not the content; an empty declaration is a stated, recorded claim.

---

## 14. THE CONFLICT REGISTER

Every disagreement between the three lanes, ruled, so nobody relitigates.

| # | The conflict | Ruling | Why |
| --- | --- | --- | --- |
| 1 | **The in-app line.** gov-b: `You write the house rules. Your crew works inside them.` gov-c: `Your crew does the work. You decide what it may do alone.` | **gov-c.** | gov-b puts the human's labour back in the subject position, relabelled from approving to configuring, and it is false on day one when the user has written zero rules. §1.2. |
| 2 | **The product word for the surface.** gov-a: `boundary`. gov-b and gov-c: `House rules`, with `boundary` banned. | **gov-b and gov-c.** gov-a's content model is adopted whole; its label is doctrine-only. | Law 1: words get deleted, not added. Both concepts already have ratified words. §1.3. |
| 3 | **The signature moment.** gov-a: any boundary act. gov-b: the graduation. gov-c: defers. | **Both, unified.** The ceremony fires on **any change to the standing grant**; the graduation is its flagship instance and gains beat 4. | gov-a is right that a ceremony reserved for graduations is too rare to be seen; gov-b is right that graduation is the emotional peak because the machine is the one asking. §6.2. |
| 4 | **Does anything move an arc automatically?** gov-a P8: nothing tightens, `setAgentArc` is the only writer. gov-b F1: `auto_advance_agent_arc` promotes after every run. | **Both are right and the composite is the finding.** Only upward movement is automatic. | gov-a grepped the TypeScript write path and missed the RPC; gov-b found the RPC and did not state that nothing tightens. Verified here. §11.1, §13.1. |
| 5 | **Is `off` dangerous?** gov-a P3/INV-7: a live permissive write path. gov-b C1: a disablement the UI filters out. | **gov-a governs the safety question; gov-b's fact explains why it is not yet an incident.** Delete it from the schema. | Verified: `resolveToolMode` has no `off` branch and the loop's gate does not catch it. §13.4. |
| 6 | **Where the surface lives.** gov-a: a new first-class surface, not settings, not a crew pane. gov-b: `?pane=rules`, keystroke, overriding `ia` §2.4. | **gov-b's concrete ruling**, which satisfies gov-a's constraint. | A rule's result is a Call that did not happen, and that is only visible beside the work. §7.3. |
| 7 | **The buyer artifact.** gov-c: a screen with an export. gov-c §16: placement unresolved. | **It is the export view of the House rules pane**, same data, one button. Not a separate screen. | Two renderings of one object; a second screen would drift from the first. §10.2. |
| 8 | **Does the queue survive as an object?** gov-a D-06: yes, target near zero. gov-c §5.4: it may not be a noun of accumulation. | **Both.** The object survives; the word may not promise a heap. | §12.2. |
| 9 | **Guardrails: are they part of the boundary layer?** The principle document says yes. gov-b C4 says no. | **gov-b.** They are regex content filters over model text and belong to the safety layer. | Putting them on this surface is the fastest way to make it unreadable. **But their receipts are missing**: a blocked call is a boundary hit with no word designed for it anywhere. §8.3. |
| 10 | **How many gates survive.** gov-a: 3 judgments plus floors. gov-c: nine floors. | **One list: six floors and a six-row never list.** | gov-c's nine mix gates with mechanism requirements (enforcement in path, kill switch, record). Those are preconditions, not gates. §4. |
| 11 | **The four-rung ladder.** gov-b: never renders, `setAgentArc` survives as a write target. | **Adopted.** | `arc` is a deleted word, the composition of four rungs by three modes is not intuitable, and a ladder is a dial while this surface is sentences. |
| 12 | **Design's blocking status.** `ia` J5 and `shell` form 7 draw it as blocking. | **Un-blocked.** Build proceeds on the approved spec; parity is reported against the mockup afterwards. | A judgment that arrives late is still judgment; a judgment that stops thirteen agents is a queue. |

---

## 15. THE ORDER OF WORK

Ranked by whether the thing above it is a lie without it. The first five are **preconditions**, not
improvements: no gate may be retired before they land.

| # | Item | Why it is a precondition |
| --- | --- | --- |
| **P0** | **Mount `ExecutedCard` / "Done without you"** | 547 lines, zero importers. Without it every default in §5 is opacity rather than delegation, and the informed register has no component. |
| **P1** | **Delete the promotion branch of `auto_advance_agent_arc`** | §11.1, §13.1. The machine currently loosens itself and only ever undoes a human's tightening. One migration. |
| **P2** | **`createHouseRule`, and a direction check on machine-written rules** | §11.1. The human cannot author a rule; the machine authors live ones. The frame has no code path without this. |
| **P3** | **House rules compile to a predicate in the execution path** | The Replit shape. Nothing may be converted from a gate to a rule before this. Reference implementations already in this codebase: `capToolsByRisk`, the fail-closed spend cap, the `publish_announcement` SECURITY DEFINER RPC plus RLS. |
| **P4** | **`revokeTrustGraduation` and its receipt** | Granting is one-way today. **Shipping wider defaults before the claw-back exists is the single most dangerous sequencing error available in this rebuild.** Claw-back, then widen. |
| **B5** | Workspace spend ceiling read by the loop | §5.3. The one indefensible default. Enforcement already exists. |
| **B6** | `tool-consequences` as a build-time invariant | §13.5. Six write tools uncatalogued; the consent panel lies permissively; C2 is unpaid. |
| **B7** | Setters for the four consequence classes | The one designed policy surface has no writer. Four choices is a decision; fifty is a chore. |
| **B8** | `autonomy-words.ts` and the `no-autonomy-label-literal` lint | Four vocabularies for three values. |
| **B9** | The House rules pane, four bands | §7.3. |
| **B10** | The three-slot composer | §7.5. |
| **B11** | The waiting sentence on Call cards | Highest ratio of felt value to lines of code in this folder. |
| **B12** | `Ask me next time` on every receipt, one component, two entry points | §7.5 paths 1 and 2, which should write most rules. |
| **B13** | Tightening suggestions from `summarizeRejections` | Without it the engine only ever argues for its own freedom. |
| **B14** | The graduation cooldown predicate, shipped with its copy | Or the card says nothing about asking again. |
| **B15** | Delete `"off"` from `ToolModeSchema`; merge the two decide paths into `decideGate` | Correctness, lands regardless. |
| **B16** | Un-gate `Change something` (steering at any moment) and capture the send-back reason into `injectSteer` | §6.3. Converts the gate from a block into an intervention. |
| **B17** | Promote `STUDIO_AUTO_SHIP` to a workspace row | §13.3. |
| **B18** | Make the floors addressable as data | Unlocks the best sales artifact we have. |
| **B19** | The standing audit: sampled self-review of unattended work, surfaced as a Call | §11.4. The third leg. |
| **B20** | Calls per week falling, next to outcomes held. One chart | §10.2. Instrument before the surface ships, or the thesis is unfalsifiable. |
| **B21** | Flip `HANDOFF_EVIDENCE_GATE` with the field-not-content repair | §13.6. |

**Deliberately not built:** a rule language, a condition builder, a time-based predicate, a
policy-as-code editor, a per-destination auto-send matrix, a per-rule dry-run, and any ladder, dial or
score in the user's view.

**Needs counsel, not a design doc:** Article 50 scope at launch (§11.6), the customer agreement's
reach over autonomous acts (§11.3), and whether our record export is customer-initiated and complete.

---

## 16. ONE PARAGRAPH FOR THE FOUNDER

Your principle is right, and the runtime agreed with it three weeks before the doctrine did: a fresh
workspace is already autonomous by default, an approved spec already pre-authorizes its own reversible
work, a cap already refuses inside the model chokepoint, and a blast-radius limit already deletes a
tool from an agent's prompt rather than interrupting it. What we drew on 28 July was a queue on top of
all of that. So the correction is not to build a governance layer, it is to stop hiding the one we
have and to make the object you actually author, the house rule, enforce itself instead of asking the
model nicely. The in-app line becomes **Your crew does the work. You decide what it may do alone**,
which is your sentence and the enterprise buyer's question at the same time. The interrupt count goes
from roughly 210 a week to roughly 34, and more importantly it stops scaling with the number of
agents. Three things I will not trade away, and you should push on them so we are sure. **The crew may
never score a person or decide who does what**, because that makes us a regulated high-risk system
from 2 August and hands a compliance burden to every customer we sell to. **The grant must always be
authored by a human**, because a self-widening bound is not a bound and no insurer will write it, and
right now we are on the wrong side of that line in two places: the machine can insert itself a live
standing rule while there is no function for you to write one, and an agent's standing moves upward
automatically while nothing moves it down, which means the only user our current code overrides is the
one who asked for less autonomy. **And the record only counts if we sample it ourselves**, because at
agent volume nobody reads receipts either, so the crew has to audit its own unattended work and bring
you the exceptions. None of those three costs speed. The thing that costs speed is the queue, and we
are deleting it.

---

## 17. RELATED

- Binding input: [`../GOVERNANCE-PRINCIPLE.md`](../GOVERNANCE-PRINCIPLE.md). Corrected in six places;
  see §13 and gov-a §2.
- Visual verdict and density ruling: [`../FOUNDER-VERDICT-2026-07-29.md`](../FOUNDER-VERDICT-2026-07-29.md)
- The three lanes: [`gov-a-doctrine-audit.md`](./gov-a-doctrine-audit.md) (124 decision points, the
  classification, the inverse failures) · [`gov-b-policy-surface.md`](./gov-b-policy-surface.md) (the
  surface, the composer, the defaults, the build list) ·
  [`gov-c-frame-and-story.md`](./gov-c-frame-and-story.md) (the frame, the legal floors, the field
  evidence, the sources)
- The nine doctrines, with their deltas in §9: [`../agents/FINAL-agent-presence.md`](../agents/FINAL-agent-presence.md) ·
  [`../edge/FINAL-edge.md`](../edge/FINAL-edge.md) ·
  [`../adaptive/FINAL-adaptive-layout.md`](../adaptive/FINAL-adaptive-layout.md) ·
  [`../shell-question/FINAL-shell-ruling.md`](../shell-question/FINAL-shell-ruling.md) ·
  [`../interaction/FINAL-interaction.md`](../interaction/FINAL-interaction.md) ·
  [`../ia/FINAL-ia.md`](../ia/FINAL-ia.md) · [`../depth/FINAL-depth.md`](../depth/FINAL-depth.md) ·
  [`../language/FINAL-language.md`](../language/FINAL-language.md) ·
  [`../clicks/FINAL-click-register.md`](../clicks/FINAL-click-register.md)
- Moat amendment (§4.1 of gov-c, adopted): `docs/strategy/moat.md` §2 layer 5 becomes
  *"Governance and accountability. A boundary the customer set in advance, enforced where the tool
  executes, and a record that proves what happened inside it. Gates are what remains after the
  boundary does its job, not the mechanism itself."* An approval gate is a UI event a competitor
  ships in a week; a provable boundary is not. Naming gates as the moat layer sells the copyable
  half. A wording sharpening inside an existing layer, so no Repositioning Ripple Review.

**Code this document is built on, verified 2026-07-29:**
`src/lib/ai/loop.server.ts` (`resolveToolMode:153`, `AUTO_SHIP_ENABLED:91`, the enablement fail-close
before `:1146`, the gate at `:1150`, `maybeAutoAdvanceArc` calls at `:686` and `:1579`,
`renderHouseRulesBlock` at `:591`, `injectSteer` at `:876-922`) ·
`src/lib/ai/trust.server.ts` (`resolveApprovalMode`, `loadAgentArc`, `suggestArc`) ·
`src/lib/ai/trust-ramp.ts` (`computeCleanStreaks`, `HIGH_RISK_FORCE_REVIEW`, `HIGH_RISK_MIN_CONFIRM`) ·
`src/lib/ai/reflection.server.ts` (`maybeAutoAdvanceArc:232`, `maybeProposeTrustGraduations`) ·
`src/lib/trust.functions.ts` (`setAgentArc`, `decideTrustGraduation`) ·
`src/lib/house-rules.functions.ts` (no `createHouseRule`) ·
`src/lib/self-improve.functions.ts:516` (machine-authored approved rule) ·
`src/lib/consent-classes.ts` (no setter) · `src/lib/tool-consequences.ts` ·
`src/lib/agent_loop.functions.ts:176` (`ToolModeSchema` accepts `off`) ·
`src/lib/reactor.functions.ts` (`event_subscriptions`) · `src/lib/governance.functions.ts` ·
`src/lib/ai/runtime.server.ts:226-238` (fail-closed spend cap) ·
`src/components/today/ExecutedCard.tsx` (zero importers) ·
`supabase/migrations/20260708150000_founder_autonomy_defaults.sql` (`auto_advance_agent_arc`,
promotion-only, bootstrap `trusted`)
