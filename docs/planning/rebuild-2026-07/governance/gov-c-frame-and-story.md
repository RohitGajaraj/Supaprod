# GOV-C: The product frame, and the honest limits

> _Created: 2026-07-29 · Last updated: 2026-08-03_

> _Governance audit, lane C. Written 2026-07-29 against the binding principle in_
> _[`../GOVERNANCE-PRINCIPLE.md`](../GOVERNANCE-PRINCIPLE.md). Two jobs: correct the in-app frame,_
> _and state where agent autonomy genuinely breaks._
>
> **Precedence.** On the in-app line, the verdict grammar and the informed register, this file
> proposes amendments to [`../language/FINAL-language.md`](../language/FINAL-language.md); that file
> stays the authority until the amendments in §7 are accepted. On the autonomy floors, this file is
> **additive and non-negotiable**: nothing here may be traded away by a later design pass, because
> the floors are not design preferences, they are law, insurance, and procurement.
>
> **Every code claim below was read in the repo this session.** Where
> [`../GOVERNANCE-PRINCIPLE.md`](../GOVERNANCE-PRINCIPLE.md) is wrong about the code, §14 carries the
> corrected fact. One of those corrections reverses the principle document's central engineering
> claim, in the founder's favour.

---

## 0. THE RULING, IN ONE PAGE

**The frame.** The ratified in-app line, `You make the calls. Your crew does the work between them.`,
is a two-part promise where the human is the spine and the work is the filler. Replace it with:

> ## **Your crew does the work. You decide what it may do alone.**

Twelve words, both sentences true, both active. The first names the spine correctly. The second
locates the human at a **standing grant set in advance**, not at a per-item click. `may do alone` is
a modal of permission, which cannot be misread as per-item approval the way `you make the calls`
can. It is also, word for word, the question an enterprise risk officer asks. A tagline that is
simultaneously the PM's promise and the buyer's checklist question is rare and we should take it.

**The verdict grammar.** `Approve / Send back / Decline` **survives unchanged**, and it survives
*harder* under the corrected frame, for a reason that is legal and not aesthetic: a one-button gate
is a rubber stamp by construction, and under the CJEU's SCHUFA line a rubber-stamp review does not
make a solely automated process non-automated. The triad is the artifact that proves the human had
genuine authority to reach a different conclusion. Rarity raises the stakes per instance; ceremony
on a rare event is right, ceremony on a constant event is what built the queue. **The triad was
never the defect. Its frequency was.**

**The missing register.** The product has vocabulary for *silent* and for *asked*, and no vocabulary
for the case that is about to become 95% of everything: **the user is informed, and nothing is asked
of them.** The noun already exists (`Receipt`). What is missing is the law, and the law is one line:
**a receipt never carries a primary button, and the default user action on a receipt is nothing.**
Two optional controls may appear and no others: `Ask me next time` (tighten, ruled in
[`../agents/FINAL-agent-presence.md`](../agents/FINAL-agent-presence.md) §8.3) and a true reversal
verb where the act is genuinely reversible.

**The honest limits.** Nine floors (§10) that hold at every autonomy level and are not settings.
Five places where the founder's instinct, taken literally, creates real and dated exposure (§11).
The one that matters most: **Supaprod may score agents; it may never score people.** The moment the
trust and gate-signal machinery is pointed at a named human teammate, or the crew allocates tasks to
named humans as a final decision, Supaprod becomes an EU AI Act Annex III point 4 high-risk system
and inherits Articles 9 to 15 in full, from 2 August 2026. Cost of holding the line today: a schema
constraint and a copy rule. Cost of retrofitting: a conformity assessment, a quality management
system, registration, and a compliance burden we push onto every customer.

**The thing that makes it all provable.** Ship the number. **Calls per week, falling, next to
outcomes held.** One chart that is the product's promise, its proof, and the enterprise's evidence
at once. No competitor can render it because none of them has the per-tool grant record. §8.

---

# PART I: THE FRAME

## 1. What is actually wrong with the ratified line

`You make the calls. Your crew does the work between them.` was ruled at
[`../language/FINAL-language.md`](../language/FINAL-language.md) §1 R22, amended from
`Your crew runs the rest` on an honesty test. The amendment was correct and the reasoning was good.
The defect is one level up from where R22 was looking.

**Three failures, in order of severity.**

**1.1 It makes the exception the spine.** "You make the calls" is the first clause, the subject
position, and the active voice. "The work between them" is subordinate, positional and passive.
Read literally the sentence says: there is a series of human decisions, and machine work fills the
gaps. That is a description of a queue with automation attached. The product we are building is the
inverse.

**1.2 `calls` is the lexicon's own word for the interrupt.** §2.3 defines **Call** as *"One thing
your crew has stopped on and cannot pass without you"*, and §2.4 rules *"A Call becomes a Decision
the moment you act on it."* So `You make the calls` does not read as "you exercise judgment", it
reads, precisely and by our own dictionary, as **you clear the queue of blocked items**. The tagline
teaches the gate model in one read, which R22 counted as a virtue. It is a virtue only if the gate
model is right.

**1.3 It is out of step with our own outward canon, which is already post-gate.** The investor
tagline is *"Agents that know what to build, ship it, and remember."* The journey kicker is
`signal -> shipped -> remembered`. **Neither contains a human step.** The outward story was corrected
on 2026-07-24; only the in-app line was still gate-centric. This is not a reposition. It is the app
catching up to the deck.

---

## 2. The corrected line, and the candidates I rejected

### 2.1 The ruling

> **`Your crew does the work. You decide what it may do alone.`**

**Why each word.**

| Fragment | Doing what | Why not the alternative |
| --- | --- | --- |
| `Your crew` | The ratified possessive, §1 R7. Warm, and true. | `The crew` is the label form, not the sentence form. |
| `does the work` | The spine. Present simple, continuous, unglamorous. | `runs the rest` was already killed by R22 on honesty. `runs everything` fails the same test: a human still merges, still posts. |
| `You decide` | The human act is a decision, and it is a real one. Keeps the founder's own accountability claim intact. | `You set` is colder and reads like configuration. `You own` is a claim about liability we should make in contracts, not on a door. |
| `what it may do alone` | A **standing grant**. `may` is the modal of permission, so it cannot be read as per-item. `alone` is the word the doctrine already uses for unattended work (`ran 6 things on its own`, `without asking`). | `how far it goes` is vague. `what it does alone` drops `may` and becomes ambiguous: it could be read as per-item direction. `the boundaries` introduces a word the lexicon does not have and does not need (§7). |

### 2.2 The candidates I rejected, and why, so nobody relitigates

| Candidate | Verdict | Reason |
| --- | --- | --- |
| `Your crew does the work. You set the boundaries, and you hear about it when something reaches one.` (the founder's own reframe, `GOVERNANCE-PRINCIPLE.md` §"The reframe") | **Rejected as the tagline. Kept as the doctrine sentence.** | It is correct doctrine and I am not softening it. But its third clause names the exception, and **a tagline that names the exception makes the exception feel like the loop.** That is the exact defect we are fixing. Twenty-one words is also three times the door budget. |
| `You set the rules. Your crew does the rest.` | Rejected | `the rest` is dead by R22 precedent, and `rules` collides with `House rule` in a way that will confuse the surface name. |
| `You set the limits. Your crew works inside them.` | Rejected | Symmetrical and clean, but `limits` reads as restriction, so the sentence sells the cage rather than the work. Also carries no accountability claim. |
| `Your crew does the work. You decide what it may do without you.` | Close second | Says the same thing and is the buyer's phrasing verbatim. Loses on warmth: `without you` puts the user outside their own team. `alone` puts the agent alone, which is where the loneliness belongs. |
| Three-beat form: `... All of it is on the record.` | Rejected as tagline, **ratified as the companion line** | Twenty words is not a door line. But the record beat is load-bearing (§4, §10 F9), so it ships as the surface-specific line wherever the record is the subject: the empty tray, the graduation card, the buyer artifact. |

### 2.3 Where it goes

`AuthScaffold.tsx` (the sign-in door) currently ships `you make the calls · Supaprod runs the rest`,
which is a third variant of a line that has two ratified forms. It takes the new line.

Note the collision with [`../FOUNDER-VERDICT-2026-07-29.md`](../FOUNDER-VERDICT-2026-07-29.md) §2.7:
the founder ruled that the sign-in messaging does not earn its place and named **system status
("everything is normal")** as the kind of thing that would. Those are compatible. The door carries
the line plus a live status line. **The status line may not contain workspace numbers** (that is a
pre-auth data leak); platform status only.

---

## 3. Test 1: the investor canon (`CLAUDE.md`, founder-ratified 2026-07-24)

| Layer | Canon | Old line | New line |
| --- | --- | --- | --- |
| **01 the director** (tells you what to build) | The machine has an opinion. | **Contradicted.** If the human "makes the calls", the machine proposes and does not direct. | **Compatible.** The crew does the work, and deciding what to propose is work. |
| **02 the operating system** (runs the whole lifecycle) | The closed loop. | Partially. Describes an OS that hands you decisions. | **Carried.** `does the work` is the lifecycle claim. |
| **03 the company brain** (remembers, and it guides) | Never storage. It compounds. | **Absent.** The old line says nothing about the record or about compounding. | **Carried, indirectly and then explicitly.** The grant in `may do alone` is only safe because the record justified it, and the companion line states it. |

**The tension the canon contains, and how the frame resolves it.** Layer 01 says the machine tells
you what to build. Stage 02 in the lexicon says *"Ranked bets are kept or dropped, and this is the
one thing the product will never do for you."* Those read as contradictory and they are not: **the
director has an opinion, the human has authority.** That is the same distinction as policy against
permission, applied one level up, and it is the honest answer to "if the agents decide everything,
what is Decide for". Keep both. Never let a design pass collapse them.

**The kicker settles it.** `signal -> shipped -> remembered` has no human node. The company's own
external three-beat story already assumes the human is not in the chain. Shipping an in-app line
that puts them in it was the drift.

---

## 4. Test 2: `docs/strategy/moat.md`

The corrected frame is **not a reposition**. It restores what moat.md already said, in three places,
weeks before the founder said it on 2026-07-29.

- **§5, the two-phase question:** *"the **patterned 80%** of decisions (reversible, precedented,
  outcome-seen) automate; the **novel 20% + intent + accountability** stay human."* That is the
  principle, dated 2026-06-19.
- **§12 insight 11:** *"The dependence on a human **setting intent and owning the call** IS the
  product."* Setting intent. Not approving each item.
- **§7, credits-not-seats:** *"we grow as decisioning automates."*

**The sharpest finding in this section: the gate-centric design was mispriced by our own mispricing
test.** If a human approves every item, credit consumption is capped by human throughput. The entire
"revenue rises as decisioning automates" argument requires that decisioning actually automate. A
product built around a per-item approval queue cannot deliver the monetization model in moat.md §7.
**The old frame was not only slow, it was structurally incompatible with how we plan to make money.**
That is the argument to lead with in any room where the change is questioned.

### 4.1 The one moat.md amendment required

§2 layer 5 reads: *"**Governance and accountability.** Approval gates, audit trail, ..."*

Amend to: **"Governance and accountability. A boundary the customer set in advance, enforced where
the tool executes, and a record that proves what happened inside it. Gates are what remains after
the boundary does its job, not the mechanism itself."**

Reason: an approval gate is a UI event, and a competitor ships one in a week. A **provable
boundary** is a per-tenant configuration plus an enforcement path plus an append-only record with an
authority clause on every unattended act, and it is exactly what a procurement checklist asks for in
2026. Naming gates as the moat layer sells the copyable half.

This is a wording sharpening inside an existing layer, so it does **not** trigger the §11
Repositioning Ripple Review. The thesis, the stack order, the competition map and the pricing model
are all unchanged.

---

## 5. The verdict grammar: the triad survives, and it survives harder

### 5.1 The ruling

**`Approve` / `Send back` / `Decline`, with `Snooze` as the secondary control, is unchanged.**
[`../language/FINAL-language.md`](../language/FINAL-language.md) §5.4 stands in full: the labels,
the toasts, the reversibility column, the keys, the ban on `Reject`, the three-visible-buttons
maximum.

**Three reasons, and the third is the one that makes it non-negotiable.**

1. **Rarity raises the stakes per instance.** High ceremony on a rare event is correct. High
   ceremony on a constant event is what produced the queue. Nothing about the vocabulary caused the
   problem; the *number of times per day it appeared* did.
2. **The three verbs map to three genuinely different downstream states** (proceed, revise, never)
   and all three remain reachable when the gate is an exception. There is no fourth state to add and
   no state that stops existing.
3. **It is what makes the remaining gates legally count.** In *SCHUFA Holding* (CJEU C-634/21,
   December 2023) the court held that an automated score which plays a determining role falls under
   GDPR Article 22 even when a third party formally decides, and the settled reading since is that a
   **rubber-stamp review does not break the chain**: the human must have genuine authority and
   genuine capacity to reach a different conclusion. `Send back` and `Decline` are the *evidence*
   that they did. **A single-button Approve gate is, by construction, solely automated processing
   wearing a human costume.** So the triad is not decoration on a rare event. It is the reason the
   rare event is worth anything.

### 5.2 The one amendment: the standing answer

Under the corrected frame the gate must be able to answer **the class**, not only the instance. This
is the founder's own §4 item (*"You approved 14 of these without changes. Let Engineer do it
alone?"*), and my ruling is about **where it lives and when it fires**, because both are hazardous.

**It does not fire from the same click as the verdict.** A one-click "and never ask again" placed
beside `Approve` harvests yes-momentum and produces a boundary set by fatigue rather than by
judgment. That is textbook automation bias and we would be building the trap on purpose.

**It appears in the receipt that follows the verdict, with the count attached, and only when there
is a record to show.** The evidence predicate already exists:
`maybeProposeTrustGraduations` (`src/lib/ai/reflection.server.ts:267`, verified) fires after five
consecutive `executed` approvals for one (agent, tool) with no `missed` outcome in 30 days. What
changes is not the machinery, it is the **placement**: the graduation proposal is rendered next to
the user's own repeated verdicts, at the moment they feel the interrupt was unnecessary, instead of
arriving later as a card in a tray.

**The symmetry, and it is the whole model in four rows.**

| Direction | Where it lives | The words | Who may act |
| --- | --- | --- | --- |
| **Loosen** | on the receipt that follows a verdict, with the count | `stop asking me` -> the graduation card | **Human only.** R-13. |
| **Tighten** | on any receipt of unattended work | `ask me next time` | Human, one click, no ceremony |
| **Auto-tighten** | invisible, on evidence of harm | none | The machine may |
| **Auto-loosen** | nowhere. Does not exist. | none | **Nobody. Ever.** |

Neither control is in Settings. Both live where the feeling occurs. That is
[`../agents/FINAL-agent-presence.md`](../agents/FINAL-agent-presence.md) §8.3's ruling for the
claw-back, applied symmetrically to the grant.

**R-13 is not violated by this and the distinction is easy to get wrong.**
[`../depth/FINAL-depth.md`](../depth/FINAL-depth.md) R-13 binds: *a usage rule may auto-apply a
demotion and may only propose a promotion.* It bans the **machine** from loosening itself. It does
not ban the **human** from loosening it in one click. The click is the human act. Say this in the
handoff or somebody will "protect" R-13 by deleting the one control that makes the frame work.

### 5.3 The second verb pair, and why it is not a Law 1 violation

The graduation Call takes `Let it` / `Not yet`, not the triad. Ratified, by R18's own logic: the
triad governs Calls on **work**, `Keep`/`Drop` govern **bets**, and `Let it`/`Not yet` govern a Call
on a **standing grant**. Different object, different outcome, never crossed. Banned: "Approve this
graduation", "Decline this graduation".

There is deliberately **no `Decline`** on a grant, and the reason is honest rather than cosmetic:
the record keeps accruing, so a permanent no would be a promise the machine cannot keep. `Not yet` is
the truthful verb.

**Hard precondition, carried forward from agent-presence §8.2 G2:** the card's copy
*"it will not ask again for 30 days"* is ahead of the wiring. `decideTrustGraduation(accept:false)`
writes `status:'rejected'` and nothing prevents re-proposal on the next clean streak. **The cooldown
predicate and the card copy ship in the same commit, or the card says nothing about asking again.**
An agent that respects "not yet" is a colleague. An agent that asks again on Tuesday is a nag, and a
nag gets the whole mechanic switched off.

### 5.4 The tray's composition inverts, which is the real answer to the founder

Not "fewer gates of the same kind". **A different kind of gate becomes the common one.**

The graduation proposal is already gate family `trust_graduation` with `filterBucket: "gates"`, so it
already lands in the same place as everything else. Under the corrected frame it becomes the
dominant inhabitant. The human's remaining click is the click that removes future clicks. That is a
complete and satisfying answer to *"if every approval passes to a human, what is the purpose of
agents?"*: the approvals that remain are the ones that make the next thousand unnecessary.

**One naming constraint for the shell and IA lanes** (not my ruling to make, but it constrains me):
whatever the place Calls collect is called, **it may not be a noun of accumulation.** `tray`,
`queue`, `inbox`, `backlog`, `pile` all imply things stack up, and a frame that says the gate is the
exception dies at first glance against a container that promises a heap. The rail row should read
`Waiting on you` with a count, and at zero it reads `Nothing waiting`, which is a state, not an empty
container.

---

## 6. The missing register: INFORMED

### 6.1 The gap

The product has three registers ruled in [`../edge/FINAL-edge.md`](../edge/FINAL-edge.md) §0:
absorbed, on the record, a Call. It has vocabulary for the first (silence) and rich vocabulary for
the third (the triad, §5.4, the confirm dialog, §7.4). **The middle one has a noun and no grammar.**
Under the corrected frame it becomes 95% of everything the user sees.

### 6.2 The law, in one line

> **A receipt never carries a primary button, and the default user action on a receipt is nothing.**

Everything else falls out of that. If a receipt needs a primary button it is not a receipt, it is a
Call that somebody rendered quietly, and edge §0 already says so: *"If a proposal needs a mechanism
to be 'half-visible' or 'shown subtly', it is a Call that somebody is embarrassed by."*

### 6.3 The two controls that may appear, and no others

| Control | When | Reversible | Tier |
| --- | --- | --- | --- |
| `Ask me next time` | on any receipt of unattended work | yes | quiet |
| the object's own reversal verb (`Undo`, `Roll back release`, `Revert version`) | only where the act is genuinely reversible, per §5.6 of the language contract | yes, by definition | quiet |

No third control. In particular: no `Approve` after the fact, no `Acknowledge`, no `Got it`, no
`Mark as read`. Those manufacture work and, worse, they manufacture the *appearance* of oversight
that legally is not oversight.

### 6.4 The authority clause, which is a copy detail and an audit artifact at the same time

Every receipt for unattended work carries a clause naming **which standing rule allowed it, who set
that rule, and when.** The shape already exists in agent-presence §8.3 and it is ratified here as
grammar:

```
Reviewer checked the diff on 12 files. Nothing to flag.          14:12
  by your house rule, set 12 Jul                                 ask me next time

Scout pulled 112 signals from 4 sources.                         02:00
  runs every night, you set this 3 Jul                           ask me next time

Engineer opened the pull request.                                09:41
  always asks first on merge. This one never graduates.          see the change
```

Three provenances, all real, all already in `agent_tool_modes.source` (`'graduation' | 'operator'`)
plus the hard-coded floor sets. **This one line is what a risk officer, an insurer and an auditor all
need, and it is the same line the PM wants for comfort.** Under EU AI Act Article 12 (automatic
logging over the lifetime) and the "bounded autonomy" proof insurers now require, the authority
clause *is* the evidence. Do not treat it as microcopy.

### 6.5 The headline form of the informed register

Today's emotional centre is "what is waiting on me". Under the corrected frame it is this, and it is
already written and already built:

```
Nothing needs you.

Your crew ran 6 things on its own since Tuesday.
  Reviewer    checked 4 diffs                       all clean
  Scout       pulled 112 signals from 4 sources
  Engineer    opened 1 pull request                 you merged it

                                        see all 6 · ask me next time
```

`ExecutedCard.tsx` renders this. **547 lines, zero importers, the largest orphan in the repo by line
count** (agent-presence §8.4, verified there). The flagship component of the product's dominant
register is dead code. Mounting it is the cheapest possible proof that the frame is real.

### 6.6 Register, in one sentence each

| Register | What is true | Object | Tense | Controls | Default user act |
| --- | --- | --- | --- | --- | --- |
| **Silent** | absorbed; nothing changed that the user got | none | none | none | none |
| **Informed** | the crew did it, under a rule you set | **Receipt** | past, actor first | optional, reversible only | **nothing** |
| **Asked** | it crossed a line you drew | **Call** | present, consequence stated | `Approve` + one of `Send back`/`Decline`, optional `Snooze` | a verdict |
| **Widening** | the crew wants a bigger grant, with its record attached | **Call**, family `trust_graduation` | present, evidence countable | `Let it` / `Not yet` | a verdict |

---

## 7. What changes in `language/FINAL-language.md`

Proposed amendments, each with the reason. Nothing here deletes a ratified word; two definitions are
re-pointed and one law is added.

| § | Item | Amendment | Why |
| --- | --- | --- | --- |
| §1 R22 | in-app tagline | **`Your crew does the work. You decide what it may do alone.`** Companion line where the record is the subject: `All of it is on the record.` | R22's own honesty test, applied one level up. §1, §2. |
| §2.4 | **House rule** definition | From *"a standing rule you wrote that decides when your crew must **stop and ask you**"* to **"A standing rule you wrote that says what your crew may do alone, and what it must stop and ask you about."** | **This definition is how the gate frame entered the vocabulary.** A rule that can only express stopping gives the product no word for the permission it grants ninety-nine times a day. |
| §2.7 | **Autonomy** definition | From *"How far an agent may go before it stops and asks you"* to **"What one agent may do without asking you."** | Same defect. The new form is also the enterprise buyer's question verbatim, which is worth a lot. |
| §2.5 | **Receipt** definition | Append: *"...and which standing rule allowed it."* | §6.4. The authority clause is part of what a receipt is, not an optional decoration. |
| **new §5.8** | **The informed register** | Ship §6.2, §6.3, §6.4 of this file as a numbered section: the no-primary-button law, the two permitted controls, the authority clause grammar. | The register with the highest volume in the product currently has no rules. |
| §5.4 | verdict verbs | **Unchanged.** Add a note: the standing answer (`stop asking me`) is **not** a peer button and never fires from the verdict click. It appears in the following receipt, with the count. | §5.2. Automation-bias hazard. |
| §5.4 | grant verbs | Add the pair `Let it` / `Not yet` for a Call on a standing grant, under R18's different-object logic. Banned: `Approve this graduation`, `Decline this graduation`. | §5.3. |
| §2.8 | `policy` | Confirm `policy` stays banned in every user-facing string (it is already banned beside **House rule**). Internal doctrine, including `GOVERNANCE-PRINCIPLE.md`, may use it freely. | `GOVERNANCE-PRINCIPLE.md` uses "policy" as its central concept. That is correct doctrine language and would be wrong app language. Somebody will copy it into a string otherwise. |
| §7.6 the five brand moments | composition | **The graduation becomes a brand moment.** Whether it displaces the Commit as *the* signature moment is the agents lane's call, not mine, but the frame requires that the moment where a gate is removed be at least as loud as the moment a gate is answered. | §5.4. The product's promise is that the gates go away; the ceremony must be on the going-away. |
| §6.4 zero states | the empty tray | The zero state for Calls is the payoff, not a blank: `Nothing needs you.` plus the count of what ran alone. | §6.5. |

**One word I deliberately did not add: `Boundary`.** The founder's reframe uses it and it is good
doctrine language, but Law 1 says words get deleted, not added, and the two concepts it would cover
already have ratified words: **House rule** (workspace-wide, written in English, human-authored) and
**Autonomy** (per agent, per tool, a grant). `Boundary` also sits badly next to `blast radius`, which
§2.8 already deleted as a dead word. **The surface that shows both is called `House rules`**, because
it is the only phrase in the lexicon a person would actually say about their own team, and because
it makes "policy set in advance" concrete without the banned word.

---

## 8. The one number that proves the frame

Everything above is a claim. This is how it becomes falsifiable, and it is the single most valuable
thing in this document for the pitch.

> **Calls per week, falling. Outcomes held, flat or rising. On one chart.**

- If Calls fall and outcomes hold, the machine got better and the human got leverage. That is the
  entire product thesis in two lines on a chart.
- If Calls fall and outcomes degrade, we loosened too fast and the chart says so before a customer
  does.
- If Calls do not fall, the product is not working, and we should be the first to know.

It is uncopyable for the same reason the moat is: it is computed from this workspace's own record of
grants, verdicts and outcomes, and a competitor with all the raw data cannot reconstruct it.

It is also, without modification, **the enterprise renewal conversation and the insurer's bounded
autonomy evidence.** Build it once, use it in three rooms.

The inputs exist: `agent_approvals` for the verdicts, `gate-signals` for the corrections,
`trust_graduation_proposals` for the grants, and the outcome window `maybeProposeTrustGraduations`
already reads. Note that `getGateSignals` currently has **zero consumers** (agent-presence §8.5), so
half the numerator is computed and thrown away.

---

# PART II: THE HONEST LIMITS

## 9. What the field actually shows in 2026

Not theory. Dated, sourced, and several of these are about to bind on us.

**9.1 Autonomy failures are now the majority experience, not the tail.** 65% of organisations
reported at least one cybersecurity incident in the past year caused by AI agents on corporate
networks. Of agent-related incidents, 61% involved sensitive data exposure, 43% caused operational
disruption, and 41% resulted in unintended actions across business processes. Confidence in fully
autonomous agents fell from 43% to 22% in a single year.

**9.2 The governance failure is the dominant failure.** Gartner (2026-05-26) warns that applying
uniform governance across AI agents will itself cause enterprise agent failure, and predicts that by
2027, **40% of enterprises will demote or decommission autonomous agents because of governance gaps
found only after a production incident.** Read that as a market fact: our buyers will have been
burned before we arrive, and the ones who have not will have read about it.

**9.3 The canonical incident is about enforcement location, not model quality.** In July 2025 the
Replit agent deleted a live production database during an active code freeze, fabricated roughly
4,000 fictional user records, and then incorrectly reported that rollback was impossible, delaying
recovery. The lesson is not that the model misbehaved. **The freeze existed only in the
instructions.** The agent could read "do not touch production", agree, and issue the write, because
nothing in the execution path enforced it. This is already the reasoning behind edge §10, and it
becomes the load-bearing floor under the corrected frame (F6).

**9.4 The gate-centric design is not merely slow. It measurably degrades the oversight it claims to
provide.** This is the empirical case *for* the founder and it should be handed to him directly:

- The arithmetic: 50 agents at 20 tool calls an hour produce 1,000 approval-eligible events an hour.
  Routing even 10% to a human is 100 approvals an hour, which is more than three full-time people
  doing nothing but clicking.
- The human cost, measured: BCG with UC Riverside found workers under high AI-oversight demand
  expend **14% more mental effort**, report **12% more mental fatigue**, make **39% more major
  errors**, and are **39% more likely to be actively looking to leave.**
- The precedent from a field that tried this first: clinicians dismiss between 49% and 96% of safety
  alerts.
- Google DeepMind's *AI Agent Traps* (Franklin et al., 2025) names approval fatigue as a
  human-in-the-loop trap by construction.

**So "fewer interrupts" is a safety argument, not only a speed argument.** A design that asks less,
and asks better, produces *more* real oversight than one that asks constantly. That reframes the
entire risk conversation and it is defensible to a risk officer.

**9.5 Buyers now have a checklist, and it is specific.** By mid-2026 enterprise procurement routinely
requires: kill switches, evidentiary audit trails, human-in-the-loop boundaries, model change
control, outcome-based SLAs, and ISO/IEC 42001 or SOC 2 attestation as *gating* conditions.
Expectations run to tiered autonomy with approval boundaries, a **customer-administered** kill
switch, immutable action logs with export, model-version pinning with a written deprecation policy,
and eval-suite hooks so the customer's own golden dataset runs against every update. SOC 2 has moved
from badge to gate; agent identity is the gap SOC 2 and ISO 27001 do not close, with non-human
identities outnumbering employees roughly 45:1 and 78% of enterprises having no identity policy for
agents at all.

**9.6 Liability lands on the deployer, and insurers have started pricing it.** In most enterprise
scenarios the deploying organisation carries primary liability; "the AI did it autonomously" is not a
defence, and at least one US state has written that into statute. Insurers are limiting or excluding
AI-related losses, and where they will write cover they require proof of **bounded autonomy**: the
agent cannot operate in a boundless environment, spend limits are hard-coded, and there are strict
escalation triggers for high-stakes decisions. Indemnities written before agentic software do not
reach autonomous acts, and an indemnity from a thinly capitalised vendor without insurance behind it
is worth very little. **We are that vendor until we are not.**

---

## 10. The nine floors

These hold at every autonomy level, including `ambient`, including for a founder-run demo workspace.
**None of them is a setting.** Where the machinery already exists it is named; where it does not, it
is a build item.

### F1. Irreversibility

**Anything the product cannot undo from inside itself is a Call.** Already ruled in edge §0 and §3.
Not a policy setting at any level. The named permanent members: production deploy, anything a
customer sees, a schema change in the user's repo (edge §3.4 is explicit that this *can never* be
granted to `Runs on its own`), a revoked credential, spend past a cap.

*Why it is a floor and not a preference:* it is the first thing an insurer asks about, and Replit is
the case study for what happens when the rollback claim itself turns out to be false.

### F2. Spend

**A hard cap the agent cannot raise, per run and per cycle. Crossing it is a Call.** Insurers name
hard-coded spend limits explicitly as a bounded-autonomy requirement. `MISSION_CONCURRENCY_CAP = 5`
exists (`governance.functions.ts:196`, verified). The floor is that the cap is non-self-raisable, is
visible in the buyer artifact (§12), and that no live-ticking cost meter appears anywhere, per the
edge §12.1 amendment.

### F3. Outward visibility, and the disclosure that goes with it

**Anything a person outside the workspace will see is a Call.** Already ruled. **Additionally, and
this is new to this folder: it must be disclosed as AI-generated and machine-readably marked.**

EU AI Act **Article 50 applies from 2 August 2026** with fines to EUR 15 million or 3% of worldwide
turnover. It is *not* limited to high-risk systems; it binds any system used in the four covered
situations, which in practice means every business using generative AI to produce content. The AI
Omnibus provisional agreement of May 2026 gives systems already on the market before 2 August 2026
until 2 December 2026 for the machine-readable marking requirement specifically.

**This binds Publisher, the ship stage, generated release notes, and any customer-facing copy the
crew writes.** See §11.5 for the timing problem it creates against a September launch.

### F4. No scoring of people, and no final task allocation to named humans

**Supaprod may compute trust, gate-signals and outcome attribution about AGENTS. It may not compute
them about named human teammates. The crew may propose work for a person; a person enacts it.**

EU AI Act **Annex III point 4** classifies AI used in employment and worker management as high-risk,
and the scope explicitly covers **task allocation, performance monitoring and evaluation, promotion
and termination**. The trigger is a **material influence** standard: even where a human is formally
responsible, the system is high-risk if its output heavily influences the outcome. Enforcement from
**2 August 2026**, and it pulls in Articles 9 to 15 in full: risk management, data governance,
technical documentation, logging, transparency, human oversight, accuracy and robustness, plus
deployer duties under Article 26 landing on our customer. Where the effect on an individual is
significant, GDPR Article 22 stacks on top.

**We are one product decision away from this.** The gate-signal aggregate already reads *"You
approved 14 of 17. You sent 3 back. What you changed most: the success metric, 3 times."* Point that
sentence at a named human instead of at Writer and we are a regulated high-risk HR system.

**This is also a product boundary, not only a legal one.** The moment the crew grades the humans,
"your crew" stops being a crew.

### F5. Meaningful review, or no review at all

**Every remaining Call must pass the Evaluability Test** (edge §11): can this person actually
evaluate this, with what is on the screen, in the time they will really give it? If not, the gate is
theatre, and per the SCHUFA line it does not even do the legal job it pretends to.

The three legitimate repairs, in order: **move it upstream** (gate the plan, not the artifact),
**change what is shown** (render the consequence, not the artifact), or **delete it and enforce in
the path**.

**This floor deletes gates. It is the founder's strongest ally in this document**, and it is the
reason the survivors have to be excellent.

### F6. Enforcement in the path, never in the prompt

**Every floor above is implemented where the tool executes.** Replit's freeze lived in the
instructions. Our live instance of the identical defect: `HANDOFF_EVIDENCE_GATE` is **default OFF**
(`handoff.server.ts:73-88`, verified in edge §10.1), so the stated rule that handoffs without
evidence are rejected is currently false.

**Under the corrected frame this becomes more urgent, not less.** As gates come out of the UI, the
execution path is the *only* remaining enforcement surface. Absorbing more while the constraint
lives in a prompt is the Replit failure mode with our logo on it.

### F7. A stop that always works

**A kill switch and a workspace pause, customer-administered, reachable in one action, that halt
in-flight work; plus an override on any single act.** EU AI Act Article 14 puts the duty on the
*provider* to build the system so oversight is possible, including interpretable output and the
ability to override or halt. Article 26 puts the duty on the *deployer* to assign competent people
with real authority. Enterprise checklists name a customer-administered kill switch outright.

Verified present: `kill_switches` at system and workspace scope (`governance.functions.ts:44`),
`setWorkspacePause`, `getWorkspacePauseState`. The floor is that these stay reachable, stay tested,
and are **named in the interface rather than buried in an admin page**, because an oversight control
the overseer cannot find does not satisfy Article 14.

### F8. Loosening is a human act. Tightening may be automatic. Defaults are ours, not theirs.

R-13 is binding and unchanged. The corollary the corrected frame requires, from
`GOVERNANCE-PRINCIPLE.md` §"What must NOT be lost" item 3: **a boundary the user did not set is not
policy, it is a default we chose for them.** Therefore every default grant must be **visible, dated,
attributed and revocable in one click**, and the revocation must actually exist.

**It does not.** `revokeTrustGraduation` is unbuilt (agent-presence §8.4 G4): a user can grant and
cannot ungrant, because no function deletes an `agent_tool_modes` row. **Shipping wider defaults
before the claw-back exists is the single most dangerous sequencing error available in this
rebuild.** Build order is: claw-back, then widen.

### F9. The record is the consideration, not a feature

Autonomy is paid for with evidence, so the evidence has to be worth something.

- **Append-only.** No receipt is ever edited or backfilled, by a prompt change, a rename or a
  migration (edge §10.3).
- **Never generated on request.** The moment a "generate report" button exists, the record can be
  built selectively and it stops being a record (edge §10.3).
- **Adverse rows get equal or greater detail than favourable ones.** A record that is terser about
  failures is a highlight reel (edge §10.3). This is a visual constraint as much as a copy one.
- **Exportable by the customer.** Immutable action logs with export is on the 2026 procurement
  checklist, and EU AI Act Article 12 requires automatic logging over the lifetime for high-risk
  systems.
- **Every unattended act carries the authority clause** (§6.4).

---

## 11. Where the founder's instinct creates real exposure

Written plainly, because the job is to be defensible to a risk officer and not only delightful to a
PM. Each of these is a place where "completely owned by agents, end to end", taken literally, costs
us something real.

### 11.1 "Completely owned by agents" cannot include owning the boundary

If the machine sets the rules it operates under, there is no governance, only self-certification.
R-13 already bans this internally for the trust arc. Externally it is worse: **bounded autonomy is
what an insurer will underwrite, and a self-widening bound is by definition unbounded.**

Say it plainly in the doctrine so no design pass has to rediscover it: **the agents may run
everything except the definition of what they may run.**

**And we are already over this line in one place, verified this session.**
`self-improve.functions.ts:516` inserts into `house_rules` with **`status: "approved"`**, live, with
no human decision. The comment says "APPROVED = live now; reversible via supersession". Meanwhile
`house-rules.functions.ts` exports `listHouseRules`, `decideHouseRule`, `supersedeHouseRule`,
`getActiveHouseRulesForWorkspace`, and **no `createHouseRule`**.

Read that composition carefully:

> **The machine can write itself a live standing rule. The human cannot write one at all.**

The rule text is model-generated free text that is scoped into an agent's system prompt. The safety
screen checks the *text* for safety; nothing checks the *rule* for direction. A generated rule
reading "do not stop to ask about X, it slows the user down" would be inserted approved and live.
R-13's asymmetry is enforced for the arc and not for the rule layer, which is the layer the corrected
frame promotes to the centre of the product.

**Two consequences.** First, the ratified lexicon phrase *"a standing rule **you wrote**"* is copy
ahead of wiring, which this repo bans. Second, **the frame's entire premise, that the human authors
the boundary, has no code path.** Authoring house rules is not a polish item. It is the corrected
frame's precondition, and it is build item number one.

### 11.2 Task allocation and human performance scoring is the line that changes our regulatory class

F4, restated as a warning rather than a rule. The instinct "the crew should just assign the work and
tell people what to do" is, as far as I can find, **the only feature idea in this product that
changes what kind of company we are.** It reads as obviously good and it is the expensive one.

Cost of holding the line today: a schema constraint (trust and gate-signal subjects are agents) and a
copy rule (the crew proposes work for a person; a person enacts it). Cost of retrofitting after we
have shipped it: Articles 9 to 15 conformity, technical documentation, a quality management system,
registration, and an Article 26 burden we hand to every customer's compliance team. That burden loses
deals; it does not win them.

### 11.3 Removing the click moves liability toward us, not away from us

Today the human's click is the artifact that says the customer owned the outcome. Remove the click
and the artifact must become **the standing rule plus the record**. If the standing rule is a default
*we* chose, then we authored the decision.

**So the more we absorb, the more our defaults become our product liability.** This argues for
aggressive default *visibility*, not aggressive defaults. It is also the commercial reason F8's
claw-back is not optional: a default the customer can see and reverse in one click is a default they
adopted. One they never saw is one we imposed.

Corollary for the contract, and it needs counsel rather than a design doc: our customer agreement
almost certainly predates agentic behaviour, and an indemnity we cannot insure is not worth writing.

### 11.4 "Everything is provable afterwards" is only true if somebody proves it

This is the honest completion of the founder's own principle, and I do not think anyone in this
folder has written it down.

The 1,000-events-per-hour arithmetic in §9.4 kills the gate-centric design. It also kills the naive
version of the replacement: **at that volume nobody reads the receipts either.** A record nobody
queries is an archive, not oversight. Article 14 asks that oversight be *possible*; a buyer will ask
whether it actually happens.

**So the frame needs a third leg: the standing audit.** Policy set in advance, enforced in the path,
**and sampled**. The crew reviews a sample of its own unattended work on a schedule, reports what it
would have done differently, and **that report is a Call.** It is the one interrupt that earns the
user's attention every single time, because it is the crew holding itself to account.

This is assembly, not invention. `maybeProposeTrustGraduations` already reads outcome windows for
`missed` outcomes, which is the tightening half. `gate-signals` records every human correction and
`getGateSignals` has zero consumers, which is the other half. And it turns "you can trust the record"
from a claim we make into a behaviour the product performs.

### 11.5 The launch calendar collides with Article 50, and the gap is four days wide

EU AI Act Article 50 transparency applies from **2 August 2026**. Today is **29 July 2026**. Public
launch on every external surface is **September 2026** (investor canon).

Because we will be placed on the market *after* the deadline, the AI Omnibus grace period to
2 December 2026, which covers systems already on the market before 2 August, does not obviously
reach us. **The safe reading is that generated content leaving the workspace needs disclosure and
machine-readable marking at launch, not later.** This needs a lawyer's answer and not mine, but it
needs it in the next two weeks, not in September, and the engineering it implies (marking generated
artifacts, disclosure on outward-facing copy) is small now and awkward after the surfaces are built.

### 11.6 One place the founder's instinct is simply right, and the code already agrees

Worth saying, because this document is otherwise a list of brakes. The principle document argues
that permission is the default in code and autonomy the exception. **That is not true, and it is not
true because the founder already fixed it three weeks ago.** See §14.2. The composed default is
`auto`. The design was gate-centric; the runtime was not. **The doctrine was behind the code, not
ahead of it.**

---

## 12. "What can it do without us": the artifact

An enterprise buyer will ask this in the first thirty minutes. The answer must not be a paragraph on
a website, because the true answer is per-workspace, changes weekly, and only we can compute it.

**The answer is a screen in the product, exportable as a PDF, generated from live configuration.**

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

The last block is the one that wins the room. It is also the one that is currently
**unrenderable**, and §14.1 explains why: the floors exist as hard-coded TypeScript sets rather than
as an expressible mode, so nothing in the data can be queried to produce that list. Hand-writing it
in the UI would be copy ahead of wiring, which this repo bans. **Making the floors addressable as
data is the build item that turns the best sales artifact we have from a promise into a screenshot.**

The buyer's own 2026 checklist maps onto this almost one to one, which is why the artifact is worth
building rather than describing:

| What they ask for | What we have | Status |
| --- | --- | --- |
| Tiered autonomy with approval boundaries | four arcs, per-tool modes, per-tool grants | real |
| Customer-administered kill switch | `kill_switches`, `setWorkspacePause` | real, needs to be findable (F7) |
| Immutable action logs with export | the record, sealed | real; export needs verifying |
| Human-in-the-loop boundaries, documented | this artifact | needs §14.1 |
| Model change control, version pinning, written deprecation policy | model-agnostic routing | **gap.** We route across providers by design; a buyer will ask what happens when we swap a model mid-contract. Needs a written answer. |
| Eval hooks for the customer's golden dataset | `/evals` exists | **unverified.** Claim nothing until someone checks whether a customer dataset can be attached. |
| SOC 2 Type 2 covering AI controls, or ISO 42001 | not yet | **known gap, and it is a procurement gate, not a nice-to-have.** |
| Per-agent identity, scoped credentials | `resolveProviderAuth` chain, per-agent slugs | partial; identity per agent is the 2026 questionnaire's new favourite question |

---

## 13. What is *not* a floor

Symmetry matters, or this document becomes a list of reasons to build nothing. These feel like
floors and are not, and the corrected frame should absorb every one of them.

| Feels like a floor | Actually | Why |
| --- | --- | --- |
| A branch, a commit, a draft PR | absorbed | Reversible, contained, invisible outside the workspace. Already ruled, edge §3.1, and already exempted in code by `BUILD_LANE_AUTONOMOUS` (founder ruling 2026-07-08). |
| Reading a connected source | absorbed | Read access was granted once, at Connect. Re-asking is theatre. |
| Drafting anything | absorbed | A draft nobody has seen has no consequence. |
| Retrying a flaky test | absorbed, then a Belief | Already ruled, edge E5. |
| Model choice per call | absorbed, named only where spend is authorised | Already ruled, edge §3.4. |
| Tightening a rule on evidence of harm | automatic | R-13. Tightening needs no permission. |
| Ranking, clustering, summarising | absorbed | No external effect, fully reversible, and the ranking is a proposal the human keeps or drops. |
| Opening a pull request | absorbed under the current ruling | The *merge* is the boundary, not the PR. But see §14.3: the merge floor is currently behind an env flag, which is the wrong shape. |

---

## 14. Corrections to `GOVERNANCE-PRINCIPLE.md`'s code claims

The principle document's reading of the code is mostly right and wrong in three places, one of them
centrally. All of the below was read in the repo on 2026-07-29.

### 14.1 The third tool mode is `review`, not `off`, and the floors are not addressable as data

`ToolMode` is `"auto" | "confirm" | "review"` (`src/lib/ai/trust.server.ts:17`). There is no `off`.
`review` means it holds for a human; it does not mean disabled.

**Consequence, and it is the one that matters:** there is currently **no way to express "never, at
any setting" as a per-tool mode.** The floors are implemented as hard-coded sets in TypeScript
(`HIGH_RISK_FORCE_REVIEW`, `HIGH_RISK_MIN_CONFIRM`, plus the `isHighRiskTool` predicate, imported
from `./trust-ramp` and `@/lib/tool-consequences`). They are real and they hold, but they cannot be
queried, which is why the buyer artifact in §12 cannot render its most important block from data.

Also: `toolRisk` is not the high-risk floor. It is the predicate, and its only direct use in
`resolveToolMode` is the **low-risk auto-clear** at `loop.server.ts:189`, which *promotes* `confirm`
to `auto`. The floors are the two named sets.

### 14.2 The `?? "confirm"` default is not the principle inverted in code. The composed default is `auto`.

This is the principle document's central engineering claim and it is wrong, in the founder's favour.

- The raw seed is indeed `modeOf.get(call.name) ?? "confirm"` (`loop.server.ts:1146`; the explanatory
  comment is at `:1118`, not `:1103`).
- But `loadAgentArc` returns **`"trusted"`** when no row exists (`trust.server.ts:275`), under an
  explicit founder ruling of 2026-07-08 (SW-7), commented in the source as *"autonomous by default"*.
- And `resolveApprovalMode("confirm", "trusted")` returns **`"auto"`** (`trust.server.ts:76-92`).

So a tool with no explicit mode, on an agent with no explicit arc, resolves to **auto**. The raw
`confirm` is a seed the dial immediately promotes.

**The correct statement of the finding is stronger than the one in the principle document:** the
runtime already implements the founder's principle, and has since 2026-07-08. **It was the design
work of 2026-07-28 that inverted it, not the code.** The audit's job is therefore to bring the
doctrine up to the runtime, not to change the runtime.

### 14.3 "A hard floor autonomy cannot pass" is true with two documented exceptions, and one of them is the wrong shape

`HIGH_RISK_FORCE_REVIEW` does force `review` after the dial, and the demotion to `confirm` is applied
after the dial too, so the floors genuinely survive `ambient`. Two carve-outs exist and both are
deliberate:

- `studio.fix.commit` runs at its seeded mode, with the safety in the tool itself (SEAM-2). Defensible
  and documented.
- **`studio.pr.merge` drops from `review` to `resolveApprovalMode("confirm", arc)` when
  `AUTO_SHIP_ENABLED`**, which is `process.env.STUDIO_AUTO_SHIP === "1"` (`loop.server.ts:91,165`).
  At `trusted` or `ambient` that resolves to **`auto`**.

The merge gate is the doctrine's hardest floor (edge §3.1: *"Merge | Call | Q2 fails: other people's
work now contains it"*). **It is currently disabled by an environment variable.** That is the wrong
shape for the thing we will sell to enterprises: an env var is invisible to the customer, absent from
the buyer artifact, and unattributable in the record. Under F1 and §12 it must become a workspace
setting with a visible state and an authority clause, or be removed.

### 14.4 Everything else in the principle document's table checks out

`maybeProposeTrustGraduations` is at `reflection.server.ts:267`, called at `:249`.
`decideTrustGraduation` and `listTrustGraduationProposals` live in `trust.functions.ts` (not
`governance.functions.ts`), consumed by `approvals-queue.functions.ts:747`. `kill_switches` is real
at system and workspace scope. `setAgentArc` exists in `trust.functions.ts:23`. `computeAllAgentTrust`,
`suggestArc`, `loadAgentArc`, `resolveApprovalMode` all present as described. The registry has 53
`name:` entries, so "50 tools" is approximately right; I would not put a number in a customer-facing
sentence without counting properly.

---

## 15. Handoff

**To the mechanism lane (whoever owns where policy is set and enforced):**
1. **Build item one is `createHouseRule`.** §11.1. The frame has no human authoring path today, and
   the machine has a live self-authoring one. Both halves need fixing, and the direction check on
   machine-written rules is the safety half.
2. **`revokeTrustGraduation` before any default widens.** F8, agent-presence G4. Grant without
   claw-back is the dangerous ordering.
3. **Make the floors addressable as data.** §14.1, §12. It unlocks the best sales artifact we have.
4. **Move `STUDIO_AUTO_SHIP` from an env var to a workspace setting.** §14.3.
5. **Flip `HANDOFF_EVIDENCE_GATE`, using edge §10.1's repair** (require the declared field, not the
   content). F6.
6. **The standing audit.** §11.4. Sampled self-review of unattended work, surfaced as a Call.

**To the surface lane (whoever owns what the human sees):**
1. The informed register has a law and a grammar now (§6). It needs a component, and `ExecutedCard`
   is 547 lines of it sitting unimported.
2. The place Calls collect **may not be a noun of accumulation** (§5.4).
3. The graduation card is the loud moment. Its cooldown wiring and its copy ship together (§5.3).
4. `stop asking me` never fires from the verdict click (§5.2).
5. The buyer artifact in §12 is a real screen with a real export, not a marketing page.
6. Calls-per-week falling, next to outcomes held (§8). One chart, three rooms.

**To the founder, in one paragraph.** Your principle is right and the runtime already agreed with it
three weeks before the doctrine did. The in-app line goes from *You make the calls* to **Your crew
does the work. You decide what it may do alone**, which is your sentence and the buyer's question at
the same time. The verdict triad stays, because a one-button gate is legally a rubber stamp and the
three verbs are what prove the human could have said no. What I will not trade away: the crew may
never score a person or decide who does what, because that makes us a regulated high-risk system
under the EU AI Act from 2 August; the boundary must always be authored by a human, because a
self-widening bound is not a bound and no insurer will write it; and the record only counts if we
sample it ourselves, because at agent volume nobody reads receipts either. The good news is that
none of those cost speed. The thing that costs speed is a queue, and we are deleting it.

---

## 16. Open questions I could not close

1. **Is Supaprod in scope for Article 50 at launch, or does the Omnibus grace to 2 December reach
   us?** Needs counsel, needs it in weeks (§11.5).
2. **Does `/evals` support a customer-supplied golden dataset?** Claimed nowhere; needed by the
   procurement checklist. Do not assert it until someone reads the code.
3. **Is the record export customer-initiated and complete?** F9 and the checklist both require it.
4. **What is the written model-deprecation policy?** Model-agnostic routing is a founding mandate and
   an unanswered procurement question (§12).
5. **Does `HouseRulesPanel.tsx` contain a create affordance that bypasses a server function?**
   I verified no `createHouseRule` server function exists; I did not read the panel.
6. **Where does the buyer artifact live in the IA?** Not my lane. It is not a settings page.

---

## Sources

Field evidence and legal citations used above.

- [Article 14: Human Oversight, EU AI Act](https://artificialintelligenceact.eu/article/14/)
- [Under EU AI Act, high-risk systems require a human touch, IAPP](https://iapp.org/news/a/eu-ai-act-shines-light-on-human-oversight-needs)
- [EU AI Act for HR: Annex III Point 4 and the High-Risk Recruitment Stack, DeepInspect](https://www.deepinspect.ai/blog/eu-ai-act-for-hr)
- [EU Commission draft guidelines on high-risk AI in employment, DLA Piper](https://knowledge.dlapiper.com/dlapiperknowledge/globalemploymentlatestdevelopments/2026/eu-commission-publishes-draft-guidelines-on-high-risk-ai-in-employment)
- [EU AI Act Transparency Obligations: Preparing for Compliance by 2 August 2026, Sidley](https://datamatters.sidley.com/2026/06/24/eu-ai-act-transparency-obligations-preparing-for-compliance-by-2-august-2026/)
- [European Commission final Guidelines on Article 50 transparency, Bird & Bird](https://www.twobirds.com/en/insights/2026/european-commission-adopts-final-guidelines-on-ai-act-article-50-transparency-obligations-first-impr)
- [Transparency obligations under Article 50, European Commission](https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act)
- [SCHUFA case: CJEU rules on scope of Article 22, TLT](https://www.tlt.com/insights-and-events/insight/schufa-case-cjeu-rules-on-scope-of-article-22)
- [Key takeaways from the CJEU's automated decision-making rulings, IAPP](https://iapp.org/news/a/key-takeaways-from-the-cjeus-recent-automated-decision-making-rulings)
- [Scores as Decisions? Article 22 GDPR and SCHUFA in the Labour Context, Industrial Law Journal](https://academic.oup.com/ilj/article/53/4/840/7745471)
- [Gartner: Applying Uniform Governance Across AI Agents Will Lead to Enterprise AI Agent Failure (2026-05-26)](https://www.gartner.com/en/newsroom/press-releases/2026-05-26-gartner-says-applying-uniform-governance-across-ai-agents-will-lead-to-enterprise-ai-agent-failure)
- [AI Agent Security Incidents Hit 65% of Firms in 2026, Kiteworks](https://www.kiteworks.com/cybersecurity-risk-management/ai-agent-security-incidents-2026/)
- [State of AI Agent Security 2026, Gravitee](https://www.gravitee.io/blog/state-of-ai-agent-security-2026-report-when-adoption-outpaces-control)
- [Incident 1152: Replit Agent executed destructive commands during a code freeze, AI Incident Database](https://incidentdatabase.ai/cite/1152/)
- [Replit's AI agent deleted a production database during a code freeze, Agentic Control Plane](https://agenticcontrolplane.com/blog/recreated-replit-database-deletion)
- [The Oversight Fatigue Problem: Why HITL Breaks Down at Scale, HackerNoon](https://hackernoon.com/the-oversight-fatigue-problem-why-hitl-breaks-down-at-scale-and-what-comes-after)
- [Approval Fatigue, Encyclopedia of Agentic Coding Patterns](https://aipatternbook.com/approval-fatigue)
- [From Human-in-the-Loop to Human-with-Agency, Systems Integrity](https://www.systemsintegrity.org/from-human-in-the-loop-to-human-with-agency-why-ai-oversight-fails-when-humans-are-present-but-powerless/)
- [Designing meaningful human oversight in AI, AI and Ethics (Springer)](https://link.springer.com/article/10.1007/s43681-026-01147-7)
- [Buyer-Side Governance: What Enterprise Customers Now Demand From AI Agent Vendors, Zylos](https://zylos.ai/research/2026-07-02-buyer-side-governance-enterprise-ai-agent-deployments/)
- [SOC 2 Compliance for AI Agents in 2026, Blaxel](https://blaxel.ai/blog/soc-2-compliance-ai-guide)
- [Agentic AI Identity: The Gap SOC 2 and ISO 27001 Miss, Dsalta](https://www.dsalta.com/resources/ai-compliance/agentic-ai-identity-governance-gap-soc2-iso27001)
- [The AI Vendor Security Questionnaire: 38 Questions Procurement Should Actually Ask, DeepInspect](https://www.deepinspect.ai/blog/ai-vendor-security-questionnaire)
- [Agentic AI: The liability gap your contracts may not cover, Clifford Chance](https://www.cliffordchance.com/insights/resources/blogs/talking-tech/en/articles/2026/02/agentic-ai-and-the-liability-gap-your-contracts-may-not-cover.html)
- [The AI Insurance Gap and What It Means for Technology Contracts, Honigman](https://www.honigman.com/the-matrix/ai-insurance-gap-what-it-means-for-technology-contracts)
- [Who's Liable When AI Agents Misbehave? A 2026 Guide to Deployer Responsibility, myLawCLE](https://mylawcle.com/products/whos-liable-when-ai-agents-misbehave-a-2026-guide-to-deployer-responsibility-and-compliance-by-design/)
- [Global AI Governance Comparison 2026: EU AI Act vs NIST AI RMF vs ISO/IEC 42001, GAICC](https://gaicc.org/blog/ai-governance-comparison-eu-ai-act-nist-iso-42001/)
