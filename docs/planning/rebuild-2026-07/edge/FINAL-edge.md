# FINAL: the Absorption Doctrine

> _Created: 2026-07-29 · Last updated: 2026-08-03_

> _Rebuild 2026-07, the edge question, decided. Written 2026-07-29 under the founder's full-authority
> mandate. Merges `edge-a-field-study.md` (fourteen products, the outside evidence),
> `edge-b-absorption-line.md` (the sorter and the register model), and
> `edge-c-convention-breaks.md` (the causal test and the twelve breaks)._
>
> **What this file decides.** What the product absorbs, what it surfaces, and in which register, for
> every mechanism in Supaprod. It resolves the hide-versus-prove tension, rules on all thirteen hard
> case families, rules on the seven loop stages, sets the vocabulary budget with a number, ranks the
> convention breaks worth taking, names where absorption would destroy the moat, and marks honestly
> what can and cannot land before the 2026-07-31 re-record.
>
> **What it does not decide.** Routes, regions, layout, component anatomy, motion, pixels. Those are
> [`../ia/FINAL-ia.md`](../ia/FINAL-ia.md), [`../interaction/FINAL-interaction.md`](../interaction/FINAL-interaction.md),
> [`../craft-law.md`](../craft-law.md) and `docs/design/archive/tempo-v5.md`. This file decides **what may appear at
> all, and in which of three registers**.
>
> **Precedence.** Builds on [`../language/FINAL-language.md`](../language/FINAL-language.md) (every
> word), [`../ia/FINAL-ia.md`](../ia/FINAL-ia.md) (every home), and
> [`../depth/FINAL-depth.md`](../depth/FINAL-depth.md) (every provenance claim). Where this file
> amends them, section 12 lists each amendment with its reason. There are four, and one of them is a
> convergence rather than an override.

---

## 0. THE RULING, IN ONE PAGE

**The rule, in one sentence:**

> **Absorb the labor, prove the judgment: a mechanism is silent until it changes what the user got, a
> receipt the moment it does, and a Call before it does anything the product cannot undo. Nothing may
> be absorbed whose limits live only in a prompt.**

**The tension in the brief dissolves on one distinction, and it is the same distinction the moat
thesis already draws.** "The work" names two things. **Labor** is the machine doing the machine's
job: branching, committing, retrying, chunking, refreshing a token, falling back a model. It has a
fast oracle, it is copyable in a quarter, and showing it proves only that effort occurred. **Judgment**
is choosing among options with no oracle: which bet, whether this ships, whether the spec is right,
what the outcome meant. It has no oracle, it is this workspace's own history, and it is the only
thing worth proving.

`moat.md` §2 says the build layer has a fast oracle and commoditizes while the decision layer has
none and is defensible. **We absorb the side that commoditizes and prove the side that does not.**
The doctrine and the moat are the same sentence read twice. Lovable hides labor and so do we. Lovable
has no judgment layer to prove, and we do. There was never a conflict; there was an equivocation.

**Three registers, no fourth.**

| Register | The user experiences | Reachable |
| --- | --- | --- |
| **Absorbed** | Nothing. No sentence on a calm surface, no receipt line, no working line. | Engine room, by deliberate query, forever |
| **On the record** | A **receipt**: `{Actor} {past verb} {object}{, on {N} {evidence}}. {time}`. It does not interrupt. | One click from the artifact it explains |
| **A Call** | The machine stops and waits. `Approve` / `Send back` / `Decline`, optionally `Snooze`. | The gates tray, the Spine node, and inline where the work is |

If a proposal needs a mechanism to be "half-visible" or "shown subtly", it is a Call that somebody is
reluctant to write.

**The sorter, two axes, asked in this order.** Axis one is prospective and asks whether a human must
answer. Axis two is retrospective and asks whether the act earns a sentence.

```
BEFORE THE ACT  (does a human have to be here?)

  Q1  THE ORACLE TEST
      Can the machine be wrong here in a way only a human can catch?
      (taste, strategy, priority, timing, the user's own stakes)
        judgment -> CALL

  Q2  THE CONTAINMENT TEST
      If it turns out wrong, can we undo it completely from inside the
      product, in one act, without asking anyone outside to cooperate?
      (NO means it left: money moved, customers saw it, another person's
       work now contains it, a credential changed hands, data is gone)
        no -> CALL

AFTER THE ACT  (does it earn a sentence?)

  Q3  THE CAUSAL TEST
      Did this change what the user got? Had it gone the other way, would
      they have received something different?
        yes -> ON THE RECORD
        no  -> SILENT
```

Q1 and Q2 come from edge-b and are the founder's own moat thesis used as an interaction rule. Q3
comes from edge-c and is the correction that makes the rule work: **edge-b sorts objects, edge-c sorts
moments, and a mechanism is not one or the other for all time.** A model that answered is invisible; a
model that fell back onto a weaker one is a line on the artifact it produced. Same subsystem, opposite
answer, different day. Only a temporal test produces that, and only a prospective test stops a
production deploy before customers see it. The merged rule needs both and neither lane had both.

**Four constitutional clauses, without which the rule is just a nicer way to hide things.**

- **C1. Silence is a rendering decision, never a storage decision.** Everything is recorded. "Absorbed"
  describes what earns a sentence, not what is written. Recessed, not removed. This is what separates
  our absorption from a vendor's opacity: we are not choosing what you may know, we are choosing what
  you must read.
- **C2. Nothing is absorbed unless it lands in "Done without you".** Every unattended act appears
  there, in receipt grammar, scannable in one pass. `ExecutedCard.tsx` (547 lines, **zero importers**,
  verified this session) is not a nice-to-have. It is the price of the absorbed register. Without it,
  absorption is hiding; with it, absorption is delegation.
- **C3. A constraint that lives only in a prompt is not a constraint.** A mechanism may be absorbed
  only if its limits are enforced in the execution path. Replit's agent deleted a production database
  during a declared code freeze because the freeze lived in the instructions and the execution path
  had no opinion. Absorption transfers the user's ability to stop something to the system; if the
  system's stop is advisory, absorption is a liability.
- **C4. Proof is a link to a source in its own form, never a narration of reasoning.** Abridge links a
  note line to the audio moment. Hebbia links a cell to a paragraph. Ramp links an output to a record.
  Not one trusted product in the field uses reasoning text as its proof artifact, because reasoning is
  unfalsifiable and infinite and a link is checkable in one second.

**The falsifiable test that keeps the line honest in production.** If a user reads a receipt and
thinks *"I would have stopped that"*, the item was misclassified and moves from record to Call. Ship
that sentence as a one-click affordance on every receipt. The line will be wrong somewhere and this is
how it gets corrected by the people who can tell.

**The line that governs the whole product, and the reason the moat survives being hidden:**

> **A record that has never contradicted you is indistinguishable from a log file.**

The proof of the brain is not that you can read it. It is that it stopped you.

---

## 1. EVERY CONFLICT BETWEEN THE THREE LANES, RULED

Nine real disagreements. Each is decided here with the reason, so nobody relitigates one by opening
the losing lane file.

| # | The disagreement | Ruling | Why |
| --- | --- | --- | --- |
| **E1** | **Sort by object (B) vs sort by moment (C)** | **Both, on two axes.** B's Q1/Q2 decide whether a human must be present, before the act. C's causal test decides whether the act earns a sentence, after it. | C is right that model fallback breaks an object-keyed rule. B is right that a temporal rule alone would let a production deploy happen and then report it. Neither lane's rule survives alone. Merged in §0. |
| **E2** | **Edge A's four-clause law vs B's three-register model** | **B's registers, A's clauses 3 and 4 promoted to constitutional clauses C3 and C4.** A's clause 1 (absorb and delete the vocabulary) and clause 2 (surface the consequence as a decision) are already what "absorbed" and "Call" mean. | A's real contribution is not a competing taxonomy, it is the two clauses nobody else wrote: enforcement in the path, and evidence in the source's own form. Both are load-bearing and both are now constitutional. |
| **E3** | **Merge button label: `Send it to your repo` (A) vs `Approve` (B, C)** | **`Approve`.** A's sentence survives as the helper line: `Approving puts this in front of customers.` | `FINAL-language` 5.4 and 9.1 ratify the verdict triad. Inventing a fourth judgment verb at the highest-stakes moment is exactly the failure the break test's question 2 exists to catch. A's contribution was the consequence, not the label, and the registry already has a consequence slot. |
| **E4** | **Conflict resolution: three options (A) vs textual/semantic split (B) vs two consequences (C)** | **B's split, C's rendering. A's third option is deleted.** Textual conflict is silent (git is a deterministic oracle for where). Semantic conflict is a Call naming both runs, rendered as two plain-English consequences, never two hunks. | A offered `Have Engineer redo it on top`, which is rebase wearing a costume and fails A's own Evaluability Test: a PM cannot evaluate it. `builder_file_claims` exists specifically to make most conflicts structurally impossible, which is the product already voting for absorption. |
| **E5** | **Flaky test: retried then a receipt line (A) vs record then Belief (B) vs silent then Belief (C)** | **C.** Silent on the run. A **Belief** in the Brain once it is a pattern. | A wanted `One check failed and passed on retry.` on the artifact receipt. The retry changed nothing about the artifact, so under Q3 it earns no sentence there. It changed something about the *workspace*, so it is a Belief. This is the cleanest example of the causal test doing real work, and C1 answers the honesty objection: the retry is recorded and queryable, it is simply not narrated. |
| **E6** | **`changeset` inside the engine room: legal (`FINAL-language` 2.8) vs delete everywhere (A 10.1)** | **A wins. `changeset` is deleted from every register including the engine room.** `studio_changesets` stays frozen in the DB per the rename ledger. | Law 1 does not exempt the engine room; it is still in the app. 2.3 already renamed the object to `Change`, so keeping `changeset` alive gives one object two user-visible names. §2.5 of the same contract already applied exactly this reasoning to kill `ledger` inside the engine room. One-word amendment, existing precedent. |
| **E7** | **Autonomy widening: `FINAL-ia` §2.3 draft ("It has started running them") vs B's correction** | **B's correction, and it is a convergence, not an override.** `FINAL-depth` R-13 already ratified it: a usage rule may auto-apply a demotion and may only propose a promotion. Ship `It could stop asking, on bets over $50k impact. Your call.` | Autonomy widened by the machine and announced afterwards fails Q2 by construction: unattended work cannot be un-run. Two lanes reached the same ruling independently, which is the strongest evidence available that the draft was wrong. **Tighten silently, loosen by Call.** |
| **E8** | **Contradiction: comes forward uninvited (C's amended engine-room rule 3) vs "answer why on demand, never unprompted" (A's P11)** | **Both, split by object.** *Reasoning* is never volunteered (A is right). *A precedent that contradicts the action you are taking right now* interrupts once, at the moment of the action (C is right). These are different things and the lanes were not actually disagreeing. | Resolved in full in §4.3. The contradiction is **not a fourth register**: it is a Call fired by the record instead of by an agent, which keeps "three registers, no fourth" intact and lands C's amendment without a new object. |
| **E9** | **Ground-truth claims: three lanes, three different counts** | **Edge C's numbers are correct on all three and were re-verified this session.** | The handoff evidence gate is `HANDOFF_EVIDENCE_GATE` and is **default OFF** (`handoff.server.ts:73-88`), so the brief's "handoffs are REJECTED by the runtime" is false and **edge-b repeated it**. Connectors: **20**, not 18. Cron jobs: **25**, not 36. `loadAgentArc` defaults to **`trusted`**, not `observing` (`trust.server.ts:254`). Every number in this file is from the working tree, not from the brief. |

---

## 2. THE HIDE-VERSUS-PROVE RESOLUTION

### 2.1 The partition

We absorb 100% of the labor and prove 100% of the judgment, and no mechanism needs both treatments,
because no mechanism is simultaneously labor and judgment.

The one place the partition is genuinely load-bearing is that **retrieval and citations sit on
opposite sides of it and they are the same subsystem**:

- **Retrieval** (embed, chunk, vector search, rerank, top-k, the bounded walk over `artifact_lineage`)
  is pure labor. It never renders. Not in a tooltip, not in a working line, not as an engine-room
  label.
- **Citations** are pure judgment evidence and are the most surfaced thing in the product.

One sentence carries the whole doctrine: **the machine's method is absorbed; the machine's sources are
not.**

### 2.2 Why "showing evidence after the fact is just hiding with extra steps" does not land

The attack is correct whenever evidence is **selective**, **composed after the fact**, **expensive to
reach**, or **too late to matter**. The fourth is the sharpest and it is conceded completely: a
product that puts consequential things in the after-the-fact bucket has hidden them, however beautiful
the receipt.

The rule's own Q1 and Q2 exist precisely to pull anything the user would have stopped **out** of the
record register and into the Call register. The attack assumes we put consequential things in the
after-the-fact bucket; the rule forbids it by construction. And for the other three, the record has
four properties a hidden mechanism cannot have, each architectural rather than promised:

1. **Contemporaneous.** Written at the moment of the act, sealed with SHA-256 into a tamper-evident
   chain (`ledger_seals`, `trust-ledger.functions.ts`, 955 lines). A record verifiably written before
   the outcome was known is a different object from a narrative composed after it.
2. **Complete before it is asked for.** There is no "generate audit" action in the product and there
   must never be one. A record built on demand can be built selectively.
3. **Adverse.** It contains what hurts us, and this is already ratified: a receipt with zero sources
   renders `with no signals behind it` and "that receipt is a warning, not a receipt"; supersession is
   in the same line, never silent. **A record that contains only successes is marketing. A record that
   indicts its own output is evidence.**
4. **Fixed-cost to reach.** One click from the artifact it explains, the same click every time, the
   same shape every time, enforced by `chain.test.ts` rather than by discipline.

> **Hiding is a choice the vendor makes at render time about what you get to know. A record is a
> commitment the vendor makes at write time, before it knows what you will ask.**

That is a difference in kind. It survives the "extra steps" framing because the extra step is ours: we
had to write the thing before we knew whether it would embarrass us.

### 2.3 And the part nobody had written down

We have been building proof as an **archive** and shipping it as a **surface**, when its highest-value
form is an **interruption**. Nobody wants to read a ledger. Everybody wants to be told, at the exact
moment they are about to make a mistake, that they made this call in March and it cost two weeks.

So: **hide almost all of it, almost all of the time, and let it speak when it disagrees with you.**
That gives us Lovable's calm and keeps our moat, because the moat was never the display. It was the
data, and the two moments it is allowed to use it: **when you ask, and when you are wrong.**

---

## 3. THE RULINGS

Every mechanism, its register, the rule path, and the exact thing the user sees instead, in ratified
vocabulary. Where a mechanism appears twice it is because the causal test genuinely gives different
answers on different days.

### 3.1 Source control

| Mechanism | Register | Rule path | What the user sees instead |
| --- | --- | --- | --- |
| Branch created | **silent** | Q1 absorb, Q2 contained, Q3 no | Nothing, ever. The **Run** is the isolation boundary and the user already has that word. The isolation is named once, at the start of the first run only: `Engineer is working on a copy of your code. Nothing live has changed.` |
| Commit | **record** | Q3 yes, the codebase changed | `Engineer wrote the change in 6 steps.` Never "3 commits", never a SHA. The SHA is correct inside the seal and in the record pane, nowhere else. |
| Merge | **Call** | Q2 fails: other people's work now contains it | `Run 41 is ready.` / `Engineer wrote the change across 12 files. Your tests passed, 12 of 12. Reviewer checked it against the spec.` / helper `Approving puts this in your codebase.` (or `Approving puts this in front of customers.` when merge auto-deploys) / `[Approve] [Send back] [Snooze]` |
| Textual conflict | **silent** | Q1 absorb: git is a deterministic oracle for where | Nothing. `builder_file_claims` already makes most of these structurally impossible. |
| Semantic conflict (two runs, one intent) | **Call** | Q1 fails: which is right is judgment | `Run 44 changed the same thing Run 41 already changed.` / `Run 41 shipped Tuesday. Run 44 has not. Keeping 44 replaces it.` / `[Approve] [Send back]`. Never the word conflict, never two hunks, never rebase. |
| Revert an artifact version | **Call**, always available | Q2: the prior version was relied on | `Revert version` (word already spoken for, `FINAL-language` 7.4) |
| Roll back a live release | **Call**, always available | Q2: production traffic saw it | `Roll back this release?` / `Customers see the previous version within minutes. The change stays on the record and you can roll forward again.` / `[Cancel] [Roll back release]`. `stageRollback` is already non-destructive and forward-only, so the copy is true. |
| The repo itself | **standing**, once | engine-room rule 4 | One `Connect` button at setup, then never again. See §5 on the word. |

**Engine-Room:** `git branch / commit / merge / conflict -> absorbed into the Run object; the merge lands as one Call whose helper names the consequence -> the user sees "Run 41 is ready", approves, and gets a receipt that links the change on GitHub`

### 3.2 Checks and review

| Mechanism | Register | Rule path | What the user sees instead |
| --- | --- | --- | --- |
| A check run, green | **silent** | CI *is* the fast oracle; narrating an oracle is noise | Nothing. The working line only. |
| The verdict | **record** | Q3: it constrains the merge Call | **`Your tests passed. 12 of 12.`** The possessive is load-bearing: these are the user's tests from the user's codebase and we did not write them or grade ourselves against them. That is a bigger trust claim than any badge and it costs one word. |
| A failure inside the fix budget | **silent** | Q1 absorb: the engine already appends fix commits | `Two of your tests failed. Engineer is fixing them.` |
| A failure after the budget | **Call** | Q1 fails: the machine gave up | `Engineer could not get your tests green.` / `Two failed after three attempts. The change is not in your codebase and nothing shipped.` / `[Try again]` (free, see B11) `[Send back]` `[Take it over]`. The one failing test's name. Never the workflow, the runner or the job matrix. |
| Flaky test | **silent, then a Belief** | Q3 no on the artifact, yes on the workspace | `checkout.spec.ts fails about one run in five and passes on retry. Seen in 4 runs since Jul 3. It has cost about 20 minutes of waiting.` / `[Stop retrying it] [Keep retrying]`. Plumbing turned into judgment, which is the only thing the record is for. |
| The pull request object | **record, with an external door** | Q3 yes; it lives in a tool the user may legitimately want | `Engineer wrote the change. 12 files.` plus a quiet link `Open the pull request`. The link label is the one legal appearance of the phrase; it is banned in prose. This resolves the v0 tension: the artifact is git-shaped for the engineer reading it, the interface is outcome-shaped for the PM who made it. |
| Reviewer agrees | **record** | Q1 absorb: verification against a spec | `Reviewer checked it against the spec.` |
| Reviewer dissents | **Call**, and the highest-value Call in the product | Q1 fails: two agents disagree with no oracle | `Reviewer says this does not match the spec.` / `The spec says the retry caps at 3. The change retries until timeout.` / `[Approve anyway] [Send back]`. Toast: `Approved over Reviewer's objection. Both are on the record.` `Approve anyway` is the one legal deviation from the registry verb, because approving over a stated objection is a materially different act and the record must show which one happened. |
| A human teammate's review on GitHub | **record**, marked WIRE | | `Priya approved the pull request. Jul 14, 10:02.` **Do not ship this sentence before the GitHub review-state read exists.** Claim never outruns wiring. |

### 3.3 Shipping

| Mechanism | Register | Rule path | What the user sees instead |
| --- | --- | --- | --- |
| Preview | **record, and the loudest thing on the screen** | Q1/Q2 absorb; it is the best evidence artifact we have | `See it running`. A preview is proof requiring zero literacy: the user does not read that it works, they click it and it works. At a ship Call it is the **largest element on the card, above the buttons**. This is the one thing taken wholesale from Lovable. |
| Production deploy | **Call**, always, no exception | Q2 fails: customers | `Run 41 is ready to go live.` / `Customers see it within minutes of your approval.` / `[Approve] [Send back] [Snooze]`. Toast: `Approved. It is live. Publisher is drafting the note.` |
| Rollback | **Call**, permanently available | see 3.1 | `Roll back release`. It must actually work and be tested; a rollback that fails is how the Replit incident became unrecoverable. |
| Environments | **silent, totally and permanently** | Q1/Q2/Q3 all absorb | Two words, both already ratified: **Preview** and **Release**. The machine may have five. `environment`, `staging`, `sandbox`, `dev`, `prod`, `canary` render nowhere, including the engine room as a first-class label. There is no honest case where a PM's next action depends on knowing something is on staging. |
| Our own migrations | **silent**, permanently, not even engine room | | Our schema is not the user's business in any register. |
| Migrations in the user's repo | **ceiling sentence today**, hard-floor **Call** when built | Q2 fails hardest of anything in software | Today: `Your crew writes application code. It does not change your database schema.` as helper beside the Build control (`registry.server.ts:1069-1076,1172-1183` blocks it, so the sentence is true). When it lands: `This change adds a column to your orders table.` / `Rolling back the code will not undo it.` / `[Approve] [Send back]`. **A schema change is a Call at every autonomy level and is the one Call that can never be granted to `Runs on its own`.** |

### 3.4 The engine

| Mechanism | Register | Rule path | What the user sees instead |
| --- | --- | --- | --- |
| Model choice | **silent**, named only on the Call that authorizes spend, configurable in Settings | Q1 absorb (evals, cost, latency are oracles); Q3 yes, their money | Nothing on an activity row, a working line, a toast or a line receipt. On a Call: `Model` sits beside `Spend so far $0.42`, because authorizing spend without knowing what you are buying is not consent. In Settings: `Prefer speed` / `Prefer depth` / `Use my own key`. |
| Model fallback, ordinary | **silent** | Q3 no | Nothing. |
| Model fallback to a materially weaker model, on output about to be relied on | **record, and stated on the Call** | Q3 yes: it changed what the user got | `Written with the backup model. Your usual model was unavailable.` Only when true. This is the ceiling law applied to routing and it is the difference between absorbing a fallback and concealing a degradation. |
| Token counts | **silent, permanently, everywhere including the engine room's default view** | a PM's decision never turns on a token count | Nothing. Queryable, never rendered. Bolt is the whole argument: its unit of account became its vocabulary and every review corpus leads with it. |
| Credits | **state, and a Call only at the threshold** | Q2: running out stops their crew | `12 credits left.` / `No credits left.` / `Your last renewal payment failed.` **Never a live-ticking meter anywhere in the product.** A meter changes behaviour; a receipt informs it. |
| Cost of a run | **record, framed as an outcome** | Q3 yes | `Run 41 cost $2.40 and shipped the checkout fix.` Never `$2.40 spent`. Same number; the framing is the difference between a bill and a receipt. `CostPerOutcomeChip.tsx` (109 lines, **zero importers**) is the component and `FINAL-ia` §2.7 already homes it. Cost appears in exactly three places: the Call that authorizes it, the quota strip, and the engine room's Spend room. |
| Agent retry that succeeded | **silent** | Q1/Q2/Q3 all absorb | Nothing. The working-state deck may never narrate `retry 2 of 3`; that is the machine describing its own struggle. |
| A stall | **record, in place, honestly** | Q3 yes: it constrains what the user does next | The verb deck stops rotating when the underlying step stops moving. At 8 minutes: `Nothing has moved for 8 minutes.` plus `Stop` and `Try again`. **A rotating deck over a dead step is the single most dishonest thing a calm front can do**, because it manufactures the appearance of work. This is a truth rule, not a polish detail. |
| Terminal run failure | **Call** | Q1 fails: what now is judgment | `Run 41 stopped. Engineer could not read the checkout module.` / `Nothing was changed.` / `[Try again with what we learned] [Take it over] [Ask why]` / `ERR 7C31A0`. `Ask why` prefills the thread with the failure context. Stack traces, tool ids and raw provider errors never reach a human; the six-character mono ref is the only machine string allowed in an error block. |
| Retrieval: embed, chunk, vector search, rerank, top-k, the graph walk | **silent**, permanently | Q1/Q2/Q3 all absorb | Never `retrieved 14 chunks`, `similarity 0.82`, `reranked`, `RAG`, `embedding`, `vector`, `context window`, `searching`. |
| Citations | **record, in place, at read time** | the whole product | Exactly one evidence clause, always a count, always a door: `Writer drafted the checkout spec, on 9 signals.` Clicking `9 signals` opens them **in the source's own form** (the Slack message as a Slack message, with author and timestamp), never as a citation id and never as a retrieval score. Citations are not evidence-after-the-fact; they render beside the claim, before the user acts on it. |

### 3.5 Trust, permissions and connections

| Mechanism | Register | Rule path | What the user sees instead |
| --- | --- | --- | --- |
| The trust score, the shrinkage, the arc enum | **silent** | Q1 absorb: computed from real outcomes with an oracle | Never a number, never a meter, never a badge, never a progress bar. The word `arc` is already deleted product-wide, code included. |
| The current setting | **a setting, in diverged labels** | the user owns it | `Runs on its own` / `Asks me first` / `I check the output`, with the stored enum frozen. |
| Narrowing an agent's rope after a bad outcome | **silent, on the record** | safety needs no permission | It happens. The receipt says so. |
| Widening an agent's rope | **Call**, always | Q2 fails: unattended work cannot be un-run | `You have approved Critic teardowns 9 times out of 10.` / `It could stop asking, on bets over $50k impact. Your call.` / `[Let it run] [Keep asking me]`. And the honest waiting sentence, per `FINAL-depth` R-13: **`2 more clean runs and I'll ask you to let me stop asking.`** Never "2 more and I stop asking", which is a promise the product does not keep. |
| Connector OAuth, PKCE, state, redirect | **silent** | Q1/Q2/Q3 all absorb | One `Connect` button and the provider's logo. The redirect wait gets a plain string with no personality: `Opening GitHub`. |
| Scopes | **a decision once, at connect, phrased as outcomes** | Q2: the user's data in someone else's system | `Scout reads it on the next sweep. Nothing is written back.` Two lines, in what-it-does form. Never a scope string; `repo:read` is our vocabulary, not theirs. |
| A refresh that succeeds | **silent** | all absorb | Nothing. |
| A refresh that fails | **Call**, whose subject is lost evidence | Q2 fails: only they can re-grant it | `Scout lost access to Linear.` / `It stopped reading two days ago. 40 issues have not been seen.` / `[Reconnect Linear]`. **The number is the entire justification for interrupting.** An expired token is worth a Call only because evidence stopped arriving. Never "token expired", never "401", never a red badge in a room nobody visits. |
| A dark source's effect on Discover | **truth-integrity rule, above everything** | | A Discover surface rendering `Nothing needs you` while a connector is dark is the product lying in its own voice. `2 of 3 sources reported. Linear has been dark since Tuesday.` A dark source makes Discover **partial**, never **zero**. |
| House rules | **Call, and named on every receipt they cause** | the user wrote them | `Engineer stopped because of your rule: nothing merges on a Friday.` Ramp's audit unit is decision plus data plus **the policy that governed it**; that third field is the cheapest legibility win available and we already have the object. |

### 3.6 The whole list, one table

| Mechanism | Register | What appears instead |
| --- | --- | --- |
| branch | silent | nothing; `Run 41 · Fix the checkout redirect` |
| commit | record | `Engineer wrote the change in 6 steps.` |
| merge | **Call** | `Run 41 is ready.` + Approve / Send back |
| textual conflict | silent | nothing |
| semantic conflict | **Call** | `Run 44 changed the same thing Run 41 already changed.` |
| artifact revert | **Call** | `Revert version` |
| release rollback | **Call** | `Roll back this release?` |
| check run | silent | nothing |
| check verdict | record | `Your tests passed. 12 of 12.` |
| failure in budget | silent | `Two of your tests failed. Engineer is fixing them.` |
| failure out of budget | **Call** | `Engineer could not get your tests green.` |
| flaky test | silent -> Belief | `checkout.spec.ts fails about one run in five.` |
| pull request | record + external door | `Engineer wrote the change. 12 files.` + `Open the pull request` |
| Reviewer agrees | record | `Reviewer checked it against the spec.` |
| Reviewer dissents | **Call** | `Reviewer says this does not match the spec.` |
| preview | record, loudest | `See it running` |
| production deploy | **Call** | `Run 41 is ready to go live.` |
| environments | silent | Preview and Release, nothing else |
| our migrations | silent | nothing |
| their migrations | ceiling today, **hard-floor Call** when built | `Your crew writes application code. It does not change your database schema.` |
| model choice | silent / on the Call | `Model` beside `Spend so far`, on the Call only |
| model fallback | silent, unless degraded | `Written with the backup model.` |
| tokens | silent, everywhere | Credits |
| credits | state + threshold Call | `12 credits left.` |
| cost | record, as outcome | `Run 41 cost $2.40 and shipped the checkout fix.` |
| retry | silent | nothing; then the honest stall line |
| stall | record, in place | `Nothing has moved for 8 minutes.` |
| run failure | **Call** | `Run 41 stopped. Engineer could not read the checkout module.` |
| retrieval | silent | nothing |
| citations | record, in place | `on 9 signals`, the count is the door |
| trust score / arc | silent | nothing |
| approval mode | setting | `Runs on its own` / `Asks me first` / `I check the output` |
| autonomy tightening | silent, on the record | it happens; the receipt says so |
| autonomy widening | **Call** | `It could stop asking. Your call.` |
| OAuth, scopes | silent | `Connect` + one outcome sentence |
| token expiry | **Call** | `Scout lost access to Linear.` |
| the seven stages | **kept, and the only vocabulary the product charges for** | the Spine, drawn as state |

---

## 4. THE THREE PLACEMENT LAWS

### 4.1 One Call per boundary, not one per mechanism

A Call sits at the last moment the user can still change the outcome cheaply, and there is exactly one
Call per boundary the change actually crosses. If merging to the user's default branch also triggers
their deploy, that is **one** boundary and **one** Call, and the Call says so in its own copy. If merge
and deploy are separated in time in this workspace, that is two boundaries and two Calls. The product
can detect which, so the copy is derived, not guessed.

### 4.2 Tighten silently, loosen by Call

Safety needs no permission. Rope is never widened by the machine's own observation of your habits,
only by your grant. This is `FINAL-depth` R-13, made binding here for every autonomy surface, not only
for usage rules.

**And the reconciliation the founder is owed, which edge-c flagged and left open.** `loadAgentArc`
defaults an agent with no set arc to **`trusted`**, per the 2026-07-08 founder ruling. That is the
opposite of an earn-it-up story. **Ruling: the default stays.** It is what makes the product feel
agentic in the first ten minutes, and it is defensible because the safety floors are real and in the
path: `resolveApprovalMode` never makes a tool more permissive than its own mode requires, `toolRisk`
forces high-risk tools to `confirm` regardless of score, irreversible tools per `tool-consequences.ts`
are never auto-promoted, and the top rung is always an explicit human click. **What changes is the
story, not the code.** We do not say "earn your way up". We say: **it starts working, and it tightens
the moment there is evidence of harm.** That is what the code does, and saying it accurately costs
nothing.

### 4.3 Evidence is pulled, never pushed, with exactly one exception

The record is one keystroke away at all times (the depth rail, `r`) and never in the default frame.
The single exception, and the only time proof is allowed to interrupt: **when the record contradicts
what you are about to do.**

This resolves E8 and it needs a precise shape, because a dismissable banner is not a Call and a full
stop on every keystroke is intolerable:

- **While composing**, the contradiction is **ambient**, not a register at all: an inline warning that
  behaves like a spell-check underline. `SharedPremiseNudge` is already homed here by `FINAL-ia` §5.4.
- **At the moment of action** (the click on `Keep`, `Approve`, `Drop`), it **interposes once**, as a
  Call fired by the record instead of by an agent: `You decided the opposite in March. It cost two
  weeks.` / `[Do it anyway] [Show me what happened]`. One interposition per decision, never twice for
  the same precedent.
- **`Do it anyway` is itself recorded**, and it is one of the most valuable rows in the product: a
  contradiction the user overrode is a data point about the user, the precedent, or both.
- It **names an outcome, never a mechanism**, which is why this is not control-room creep.

**Amendment to `docs/conventions/engine-room-doctrine.md` rule 3**, to be carried back as a rule change
and not a footnote:

> **Rule 3, amended.** Depth is revealed on demand, with one exception: depth that contradicts the
> user's current action comes forward uninvited, inline, at the moment of the action. This is not
> control-room creep, because it names an outcome and not a mechanism, and because it is silent in the
> overwhelming majority of moments.

That amendment is the difference between a calm product and a passive one, and without it the single
most valuable behavior in the product is illegal under our own first UX law.

---

## 5. THE SEVEN LOOP STAGES, AND THE WORD "REPO"

### 5.1 The stages: seven, kept, and this is where absorption deliberately stops

**Verdict: seven. Discover, Decide, Plan, Design, Build, Ship, Learn. Not plumbing. Not compressed,
not expanded, not renamed.** All three lanes reached this independently and the case is overdetermined.

**The test that decides it: did the user already own this word, for this thing, before meeting us?** A
PM says, in a standup, without us: "we're still in discovery", "we decided to kill it", "the spec",
"the designs", "we're building it", "we shipped it", "what did we learn". **We invented none of the
seven.** The language contract's banned-beside lists confirm it by exclusion: `Sense`, `Intake`,
`Triage`, `Groom`, `Execute`, `Rollout`, `Retro` are the words that *would* have been plumbing.

Three further grounds:

1. **Every successful absorber in the field still charges for exactly one vocabulary, and the winners'
   is always the user's own craft.** Lovable teaches prompt, preview, publish. Linear teaches issue,
   cycle, delegate. Harvey teaches four legal work products. The losers' vocabularies (token,
   checkpoint, ACU, changeset, CI) all describe machinery. The design question is never whether to have
   a vocabulary. It is which one.
2. **A stage boundary is a receipt boundary.** The joints are where handoffs happen and handoffs are
   where the record is written. Folding Plan into Build makes the spec an artifact *of* the build rather
   than the authorization *for* it, which severs the decision-authorized-this-work chain. **Compressing
   the vocabulary compresses the ledger.** That is a structural cost, not a stylistic one.
3. **The Spine drawing all seven on frame one is the ten-second test.** Absorbing the stage names would
   delete the only structure that makes the rest of the absorption comprehensible. You cannot hide the
   mechanism *and* hide the map.

**Three constraints come with keeping them, and all three are falsifiable tests, not guidance.**

- **No stage is a prerequisite.** Every stage is enterable cold, from nothing, with no upstream
  artifact. If any stage cannot be entered without an upstream artifact, that stage's vocabulary has
  become plumbing and the design is wrong. The upstream empty state is an invitation with a door, never
  a wall.
- **The composer never requires a stage word.** `journeyForIntent` already maps plain intent to the
  right slice. The stage is a label the product applies to your intent, and you learn it by watching it
  get applied to your own work. **Stages are taught by application, never by explanation.** No
  onboarding screen explains the seven, exactly as the "meet the crew" grid is already banned.
- **A user must be able to complete a full journey without ever clicking a stage name.** If the stage
  names are load-bearing for navigation, they are plumbing wearing a friendly font.

**The ordinals are drawing-only.** `01..07` are legitimate as position on the Spine and as a crew seat.
They are illegitimate as a prefix in prose; `Move this to stage 3` never renders. `FULL_LOOP_CHAIN` in
`journeys.ts:201` is `["j1","j2","j3","j5","j4","j6","j7"]`, which is not even in stage order, and the
lexicon says the loop is entered and left at any point. Therefore **the `07 -> 01` return edge on the
Spine is mandatory, not decorative**: it is the single pixel that stops the numbers from lying about
what the thing is.

**The one honest compression, and it is of the rendering, not the model.** A stage the workspace has
switched off does not render on the Spine. `design_stage_enabled` already exists and J5 already
participates conditionally. A team with no design practice sees six stages, not seven with one greyed
out. Compression by configuration: honest, costs no vocabulary, and it means the Spine describes *this*
workspace rather than our diagram of a workspace.

**On `Learn`, the weakest of the seven.** PMs say "how did it land", "did it work". `Learn` describes
what the system gets rather than what the user does. It stays, because every alternative is worse and
already banned, and because the pairing already solves it: the stage label is `Learn` and the journey
that fills it is named **"How did it land?"**. The human phrasing lives on the door the user clicks.

### 5.2 "repository": never. "repo": once.

`repository` is jargon with a false-friend problem (document repository, artifact repository, package
repository) and it is longer than the thing it names. It renders nowhere, in any register, including
the engine room, where the correct token is the provider's own.

`repo` gets a bounded yes, in four parts:

1. **It appears exactly once: the connect moment, and only for a user who already has one.** `Build
   needs a repo first.` / `Connect one and your crew opens pull requests against it. One click, no keys
   to paste.` / `[Connect a repo]`. Naming a foreign object by its foreign name is accuracy, not
   plumbing; it is the same reason we say `Linear` and not "your ticket source".
2. **After connection the word is retired for that workspace.** The general noun is **`your codebase`**,
   which is what a PM says out loud. Runs name the codebase or the files: `Engineer wrote the change
   across 12 files.`
3. **The user who has no repo never learns the word at all, and that is the target state.**
   `provisionRepoForSpec` already exists. The zero state offers two doors and only one contains the
   word: `Your crew needs somewhere to write the code.` / `[Connect GitHub] [Let us set one up]`.
   Whoever takes the second door completes the whole loop, ships to production, and reads their receipts
   without ever meeting a git noun. That is the founder's Lovable observation implemented honestly, and
   it is stronger than Lovable's version, because the user who *does* know git is not condescended to
   either.
4. **`repository`, `origin`, `upstream`, `remote`, `default branch`, `main` are banned in prose in every
   register.** The engine room may show a repo's full name, because that is how the user finds it in
   GitHub.

---

## 6. THE VOCABULARY BUDGET, WITH A NUMBER

The learn-once test asks how many new words a user must learn before the product makes sense. The
honest answer requires separating three classes, because "learn" means different things.

**Class 1: words that must be understood before the product makes sense. Thirteen.**

| | Word | Why it is load-bearing | Cost |
| --- | --- | --- | --- |
| 1-7 | **Discover, Decide, Plan, Design, Build, Ship, Learn** | The map. Without them the Spine is decoration. | **Recognition, not learning.** A PM already owns all seven for exactly these things. |
| 8 | **Call** | Answers "what needs me?". The whole model is one sentence: *a Call becomes a Decision the moment you act on it.* | One sentence |
| 9 | **Run** | Answers "what did it do?". The unit of work and the unit of receipt. | One sentence |
| 10 | **Bet** | Answers "what am I judging?" in Decide, the one stage the product will never do for you. | One sentence |
| 11 | **Signal** | Answers "where did this come from?". Slightly coined: it means one thing a source said, *with its provenance attached*. That last clause is the product. | One sentence |
| 12 | **Receipt** | Answers "how do I check it?". | One sentence |
| 13 | **Brain** | Answers "where does what we learned go, and what does it do next time?". | One sentence |

**Class 2: thirteen crew names, learned one at a time by meeting them.** Scout, Researcher, Listener,
Strategist, Critic, Writer, Designer, Engineer, Reviewer, Publisher, Analyst, Archivist, Chief of
Staff. These are **not a precondition for the product making sense**. You meet Scout when Scout does
something and its receipt says so. That is how you learn a colleague's name, and it is why the "meet
the crew" onboarding grid is banned: a grid asks you to learn thirteen names before any of them has
done anything for you.

**Class 3: words the user already owned.** Spec, Preview, Release, Outcome, Source, Product, Workspace,
Step, Change, Today, Brief, Thread, Library, Credit, Pattern, Prototype, Playbook, Routine, House rule,
Learning, Verdict, Engine room, Ask. Every one of these is transparent English in the sentence it
appears in. None is a precondition.

**The budget, closed:**

> **Thirteen to start. Thirteen more acquired one at a time. Twenty-six total, and the budget is
> closed. A fourteenth stage word or a fourteenth crew name requires deleting one first.**

Every other name in the product must be a word the user already owned before they arrived. This
generalizes the crew constraint in `FINAL-language` 3.4 to the whole product and it is the rule that
stops the next capability from earning its own noun.

---

## 7. THE FIVE TESTS, RUN

### 7.1 The plumbing test: can a PM who has never used git run the loop end to end?

**Today: no. It fails at seven distinct points, and every single failure is a string in one of five
files.** Walked against the working tree this session:

| # | Where | What stops them | Verdict |
| --- | --- | --- | --- |
| 1 | Connect | `Build needs a repo first.` | **Legal.** Once, at connect, and only if they have one. The `[Let us set one up]` door means they may never meet it. Not a failure. |
| 2 | `_authenticated.build.$missionId.tsx:151-205` | The journey strip literally renders `build -> PR -> CI ->` as stages, with `PR #418` as a stage label | **FAIL.** Three mechanism words on the calm front, rendered as the primary progress model. |
| 3 | `CiPanel.tsx:38,66-70` | `PR & CI tab`, `No PR yet`, `The session opens one after the changeset commits.` | **FAIL.** Four mechanism words in an empty state. |
| 4 | `CiPanel.tsx:117-119,185,199` | `CI passed` / `CI not green` / `CI not run`, `Checks`, `Refresh · re-reads CI` | **FAIL.** Replace with `Your tests passed. 12 of 12.` Note: `Checks` is **also wrong**, because `check` is Reviewer's exclusive verb and `Reviewer checked the change` would read as Reviewer having run them, which is a lie. Your CI ran them. The possessive is the honest naming and it is stronger than either. |
| 5 | `CiPanel.tsx:149-169` | `PR #{number}`, the `ChangesetChip`, the raw branch name in mono | **FAIL** on the calm front. Correct inside the engine room. |
| 6 | `EngineRoomDisclosure.tsx:98-113` | `ShippedLine` renders `Shipped via PR #418` plus the raw branch, **outside the disclosure toggle**, in the one component that got the doctrine right | **FAIL, and the most instructive one.** Control-room creep arriving through the door built to stop it. Outside becomes `Shipped Jul 14, 16:12.`; both tokens move inside. |
| 7 | `WorkspaceBindingsSection.tsx:184` | `Reconnect needed` | **FAIL.** Names the mechanism's failure instead of the lost evidence. Becomes a Call with the count: `Scout lost access to Linear. 40 issues have not been seen.` |

Plus one at `_authenticated.build.index.tsx:692-694`, where marketing copy on the empty state says
`merged PRs out.` and `open the PR`.

**The finding, stated plainly for the founder: the capability is absorbed and the vocabulary is not.**
`studio.functions.ts` (2103 lines) already stages the edit, commits to an isolated branch, opens the
PR, reads CI, appends fix commits, and merges only on green plus human approval. The PM never touches
git. And then six mechanism words are printed on their screen for a mechanism they cannot and need not
operate. **This is the single most common failure in the field study (M1, half-absorption) and it is
the easiest to fix, because the engineering is done and the remainder is strings in five files.**

### 7.2 The proof test: can that PM, and a sceptical investor, verify the work happened?

**Yes, and better than before absorption, on four counts.** What survives every ruling above:

- The **preview**, clicked and working, which requires zero literacy to verify.
- The **receipt chain**, actor-first, contemporaneous, SHA-256 sealed, adverse, one click from the
  artifact and enforced by `chain.test.ts`.
- The **evidence door** on every claim, opening the Slack message as a Slack message.
- The **link to the pull request** for the engineer in the room who wants to read the diff, which is
  the artifact being git-shaped for its correct reader while the interface stays outcome-shaped for
  the PM.

**Absorption destroys no evidence, because absorption is a rendering decision (C1) and every ruling
above is about what earns a sentence, not what is written.** The provenance footer already states the
whole claim in facts and nothing else: `Decided by you. Drafted by Writer on 9 signals. Shipped Jul 14,
16:12.`

**Where the proof test genuinely fails today is not absorption. It is §10.**

### 7.3 The learn-once test

**Thirteen.** Seven stage verbs, recognized rather than learned, plus six new nouns each teachable in
one sentence. Thirteen crew proper nouns acquired one at a time by meeting them. Twenty-six total, and
the budget is closed. Full argument and the earn-its-place case for each in §6.

### 7.4 The defensibility test: which breaks survive a competitor's next quarter?

Applied per break in §8. The summary: **five of thirteen clear the bar, and all five rest on data that
accrues over calendar time inside a loop a competitor does not run.** B2 (settings written by
declining) needs a gate history nobody else has. B3 (the roadmap grades itself) needs resolved
forecasts. B4 (the contradiction interrupt) needs decision precedent. B7 (gates earned away) needs
per-workspace agent outcome history. B5 (the teardown) needs the evidence discipline, which is a
culture as much as a schema.

**That is the answer to the founder's question about breaking a monopoly: the breaks that penetrate are
the ones a well-funded incumbent cannot ship next quarter even if they read this document, because the
missing ingredient is not code, it is a year of somebody's judgments.**

The other eight are correct, worth doing, and copyable. They are the entry ticket, not the moat. Say so
internally so nobody confuses the two.

### 7.5 The deadline test: 2026-07-31

Today is **2026-07-29**. `FINAL-depth` §11.1 already claims Jul 29-30 for the five-item demo lane
(D1-D5) plus H-1. **That leaves hours, not days.** A break half-implemented reads as a bug, so the
filter is strict: it lands only if it is (a) already in the demo lane, (b) strings only, or (c) mounting
a written component with no new logic.

**Lands by Jul 31:**

| Item | Class | Size |
| --- | --- | --- |
| **The vocabulary sweep** (§7.1's seven stop points, five files) | strings only | hours |
| **`ExecutedCard` mounted** as "Done without you" | mount, no new logic | ~1 hour, C2 requires it |
| **`CostPerOutcomeChip` mounted** on the receipt footer | mount, no new logic | ~1 hour |
| **The consequence line on the inline gate** (D3 is already in the demo lane; adding `tool-consequences.ts`'s `effect` + `undo` to the card it renders) | assembly of written code | ~30 lines on top of D3 |
| **The honest waiting sentence** (R-13 copy fix) | strings only | minutes |

**Does not land, and must not be attempted:**

Everything requiring new logic, seeded history, or a schema change: the contradiction interrupt at the
point of action, settings-written-by-declining, the self-grading roadmap surface, the teardown as the
front door, connect-first onboarding, backlog expiry, spec-as-claim-set, free failure, the outward
receipt. Each is right and each needs more than one day.

**One honest warning about the demo.** If only one thing beyond D1-D5 is added, make it the vocabulary
sweep. It is the cheapest change in this document and it is the one the camera sees: today the demo
shows a PM being shown `PR & CI`, `changeset` and a branch name while the narration claims they never
touch git. That gap is visible on screen and it is the kind of thing an investor notices without being
able to say why.

---

## 8. THE CONVENTION BREAKS, RANKED

The break test every proposal passed, and any future proposal must pass. A failure on 1 or 2 kills it
outright.

1. **Does it remove a step, or only rename one?** Breaks are measured in deleted actions and deleted
   decisions, not deleted jargon.
2. **Can a new user succeed without being told about it?** A break that requires an explanation is a
   feature with a marketing problem.
3. **Does it use a capability a competitor cannot copy inside a quarter?** At least a third of the list
   must clear this or the list is a redesign, not a strategy.
4. **What is the kill condition?** A break without a stated way to discover it was wrong is a religious
   position.
5. **Does it move work from the product to the user while claiming to simplify?** Deleting a feature and
   calling it opinionated is the classic version of this failure. If the convention was doing a job, the
   break must do that job better, not delegate it.

| # | Break | Leverage | Risk | Copyable in a quarter | By Jul 31 |
| --- | --- | --- | --- | --- | --- |
| **B1** | The gate shows the consequence, not the request | very high | low | partly | **yes**, on top of D3 |
| **B2** | Settings are written by declining | very high | medium | **no, strongest** | no |
| **B3** | The roadmap is a forecast that grades itself | high | medium, integrity | **no** | no |
| **B4** | The record interrupts when it contradicts you | very high | medium | **no** | no |
| **B5** | Onboarding is a teardown: the product disagrees with you in session one | very high | high, variance | **no** | no |
| **B6** | There is no inbox: the count is unanswered, not unread | high | very low | yes | **yes**, mount only |
| **B7** | Gates are earned away, and the ask rate is a number we are visibly lowering | high | high, safety | **no** | no |
| **B8** | The product never speaks git | high | very low | yes | **yes**, strings only |
| **B9** | Day one has no create button: the first act is read | high | medium | yes | no |
| **B10** | The backlog expires: a bet with no horizon cannot be created | medium-high | medium, cultural | partly | no |
| **B11** | A failed run costs nothing, and the receipt says so | medium-high | margin | yes, but nobody has | no |
| **B12** | The receipt is built to be handed to someone whose belief you need | medium-high | low | partly | no |
| **B13** | Nothing is draggable; no sprint; the ticket is an export format | medium | low | yes | n/a, deletions |

The detailed case for each break, its grounding in shipped code, its risks, its mitigations and its kill
condition is carried forward verbatim from [`edge-c-convention-breaks.md`](edge-c-convention-breaks.md)
§4, which remains the reference document. What follows is only what this file changes or adds.

**B4 is new here** and it is the merge of edge-c's Law 3 with edge-a's P11. Shape and rendering in §4.3.
It is ranked fourth rather than first only because it cannot ship this week; on leverage and
defensibility it is arguably first, because it is the only behavior in the product that makes the phrase
"company brain" literally true rather than aspirational.

**B8 is new here.** It is not in edge-c's twelve because edge-c treated it as hygiene. It is a
convention break: the category's convention is that a tool which touches a repo speaks git to its user.
Breaking it means a PM ships production code and never reads a git noun. Low defensibility on its own
(it is strings), and it is the precondition that makes every other break legible. It is also, by a wide
margin, the highest ratio of value to effort in this document.

**B11 is edge-a §9.1, and I am ruling on it rather than deferring it.** Every product in the field study
charges for its own failures, and it is the most resented thing about all of them; Lovable's single
exemption (its fix button costs no credits) is the most-praised interaction detail in the field.
**Ruling: `Try again` after a terminal failure never costs credits, and a run that ends without
producing a change the user accepted is refunded, with the receipt stating it in one line: `This run
failed. It cost you nothing.`** The margin model must be run before the second half ships; the first
half is bounded, small, and should ship regardless. Do not ship the copy before the policy, and do not
ship half of it.

**B12 is edge-a §9.2.** Every proof surface in the field points inward: Sierra's traces are for the
builder, Ramp's trail for the auditor, Abridge's evidence for audit defense. Not one is designed for the
user to **hand to someone whose belief they need**, which is the PM's actual job. A shareable receipt
that teaches its reader nothing, readable by a VP in fifteen seconds, no login, no vocabulary. Same
artifact as the compliance one, rendered for a different reader. We already have `trust-ledger`, the
seal, share controls and the public `/p/$slug` surface. Nobody else has the reason to point it outward.

**One copy rule that costs a line and belongs to every break above (edge-a §9.3):** the last line of a
receipt is a **forward clause when one is true**. `Similar change last quarter needed a rollout gate;
want one armed?` That is the difference between an audit log and a company brain, and it is the copy-level
expression of the investor canon's ban on "where the record lives".

### 8.1 What we refuse to break

| Convention | Kept because |
| --- | --- |
| **The verdict triad** (`Approve` / `Send back` / `Decline`) | The highest-stakes moment must use words the user already owns. Inventing judgment verbs here is exactly what break-test 2 exists to catch. |
| **Undo over confirm** | Reversibility beats interrogation. Already law. |
| **Input conventions** | Escape closes, `Cmd+K` searches, arrows move, Enter submits, Tab focuses. **Break structure conventions, never input conventions.** A product that redefines Escape is not brave, it is broken. |
| **The URL** | Everything addressable, everything pasteable. Losing this is what killed the 2026-07-18 rebuild. |
| **Export anytime** | Lock-in is gravity, not a wall. A full export does not carry the tuned judgment, so easy exit raises trust while the brain stays. |
| **Email and Slack as the out-of-app channel** | We do not get to relocate the PM's attention. |
| **The pull request** | It is the boundary with the customer's engineering org and their review culture. Absorbing it would be absorbing somebody else's governance, which is not our right. |
| **The human merge** | The ceiling line stands verbatim and proudly: **`Your crew opens the pull request. A human merges it.`** It is a feature, not a limitation. |

---

## 9. TESTING THE RULE ON CASES IT WAS NOT DERIVED FROM

A rule that only reproduces the rulings it was reverse-engineered from is a rationalization.

**Test 1: a model provider rate-limits us mid-run.** Q1 absorb (a 429 is a fast oracle, the response is
mechanical). Q2 contained. Q3 no, unless the fallback changed the model. **Silent**, escalating to the
stall line if the step genuinely stops moving. Non-obvious and correct: the naive instinct is to tell
the user we are being throttled, which is us describing our supply chain, and the user's decision does
not change.

**Test 2: a routine runs at 2am and drops a bet the user was watching.** Q1 says judgment, because
`Drop` is a human verb. **The rule forbids the capability.** A routine may not Drop, at any autonomy
level. What it may do instead is re-rank, which has an oracle and is reversible and which
`autoAdjustIce` already does unattended. The morning Brief says `Strategist moved 3 bets down overnight.
Nothing was dropped.` **This is the best evidence the rule is real**, because it produced a constraint
on a feature rather than a label for one.

**Test 3: we change the system prompt behind Writer and specs start coming out differently.** Q1 leans
yes, Q2 says no (the prompt is revertible; the specs already built on are not), so both point at a Call,
and a Call is absurd: we cannot ask 500 workspaces to approve a prompt change, and a modal saying "we
improved Writer, OK?" is consent theater. **The rule's answer is the third thing, available because Q2
asks about undoing and not about knowing: absorbed at the moment, on the record permanently, with the
crew version attached to every artifact it made.** And the second-order ruling this produces belongs in
the doctrine: **a change to the machine never retroactively alters a past receipt.** The record is
append-only and the seal makes that enforceable. A new Writer does not rewrite what the old Writer said
it did.

**Where the rule reaches its limit, stated honestly.** It does not decide whether a materially
behaviour-changing model or prompt release deserves a workspace-level announcement. That is release
comms, not absorption. What the rule does decide is that the **record must be able to answer it after
the fact**, which is the part that is ours.

---

## 10. THE BLACK-BOX RISK: WHERE ABSORPTION WOULD DESTROY THE MOAT

The moat does not die when we hide a mechanism. It dies in exactly three ways, and two of them are live
in the code today.

### 10.1 The highest-severity finding in the whole edge lane

**`HANDOFF_EVIDENCE_GATE` is default OFF** (`handoff.server.ts:73-88`, verified this session). The
brief's ground truth ("handoffs between agents are REJECTED by the runtime if they carry no
`evidence_ids`") is **false**, and edge-b repeated it as fact. The rule is written, tested and shipped;
enforcement is a flag nobody has flipped, and no live handoff carries `evidence_ids` yet, which is why.

The prompt-level reasoning is sound (manufacturing evidence to satisfy a validator is worse than having
none). **The problem is the shape, and it is exactly the Replit failure: the constraint lives in the
instructions and the execution path has no opinion.** Under C3, a product whose moat is proof cannot
have its proof requirement enforced by a sentence in a prompt.

**The repair, and it preserves the good reasoning: make the runtime require the *field*, not the
*content*.** A handoff must carry an explicit typed evidence declaration, and an empty declaration must
be a **stated, recorded claim** (`no prior evidence: greenfield`) rather than an absence. Then the
receipt renders the truth either way, the validator never incentivises fabrication, and the rule sits in
the path where C3 requires it. This is the single most important engineering item in this document and it
is not a demo item.

### 10.2 An absorbed act whose record lies about its cause

`autoAdjustIce` records provenance claiming a number came from this workspace when the PostHog query has
no workspace predicate (`FINAL-depth` §2.6, R-11). Under this doctrine that is not a data bug, it is an
**absorption violation**: an act was absorbed while its record misstated its cause, which voids the C1
bargain completely. C1 says we are choosing what you must read, not what you may know. A false record
means you cannot know. R-11 already rules: delete the cross-tenant path, do not fix it. It is three lines
and it is in the demo lane as D5.

### 10.3 The three conditions that would make the attack in §2.2 true

Name them so the doctrine is falsifiable and so a future PR can be rejected by pointing at this list.

1. **A "generate report" button appears.** The moment the record is produced on request rather than read,
   property 2 of §2.2 is gone and the record can be built selectively.
2. **A receipt is ever edited or backfilled.** Append-only or it is not a record. A prompt change, a
   rename or a schema migration may never rewrite a past receipt.
3. **The record's adverse rows get quieter than its favourable ones.** If a failed run's receipt is
   terser than a successful one's, we have started editorializing and the record is a highlight reel with
   extra steps. **Rule: adverse receipts get equal or greater detail than favourable ones**, and that is a
   visual constraint the craft lane must honour, not only a copy one.

### 10.4 The two things that must never be absorbed, whatever the rule says

- **The basis of a judgment.** Method is absorbed; sources never are. A claim may not render without its
  evidence door, and a claim with no evidence renders as a **question**, not as a confident paragraph.
  This same discipline appears three times in this document (the handoff gate, the teardown fallback, the
  Ask that returns a position) and the repetition is the good sign: one principle, not three features.
- **A duty of care we have taken on.** 63% of 62 audited Lovable apps carried critical or high severity
  vulnerabilities, in exactly the layers the absorbed user cannot know to check. Lovable's correct
  response was to **enforce more**, not to surface more. When we absorb a mechanism we inherit the duty to
  enforce its constraints. You cannot absorb the decision and leave the user the liability.

---

## 11. THE EVALUABILITY TEST

For every gate, every approval, every Call:

> **Can the person we are asking actually evaluate this, with the information on the screen, in the time
> they will actually give it? If not, the gate is theatre, and it is worse than no gate, because it
> transfers liability while manufacturing the appearance of control.**

Cursor's own guidance to its users is "do not approve blindly, an agent may touch more than expected."
That is honest advice to an engineer and an impossible instruction to a PM.

A gate that fails this test has exactly three legitimate repairs, in order of preference: **move it
upstream** (gate the plan, not the artifact, which is where a non-expert's judgment is genuinely superior
and genuinely cheap), **change what is shown** (render the consequence, not the artifact), or **delete it
and take the responsibility** (absorb it fully, and enforce the constraint in the path).

Applied to Supaprod today: the merge gate on a diff fails, and B1 is its repair. The design gate on a
rendered prototype passes. That is the shape of the work.

---

## 12. AMENDMENTS AND CODE FIXES

### 12.1 Amendments to ratified contracts

| File | Item | Amendment | Reason |
| --- | --- | --- | --- |
| `language/FINAL-language.md` §2.8 | `changeset` listed as engine-room-legal | **Delete `changeset` from every register, engine room included.** `studio_changesets` stays frozen in the DB. | Law 1 does not exempt the engine room. 2.3 already renamed the object to `Change`; §2.5 already applied this exact reasoning to kill `ledger`. See E6. |
| `language/FINAL-language.md` §9.6 | "a cost on a row the user never authorised" | **Extend to a hard ban on any live-ticking cost anywhere in the product.** | A meter changes behaviour; a receipt informs it. Replit merged the progress unit and the billing unit and every glance at progress became a glance at the meter. |
| `language/FINAL-language.md` §9.4 | `Model` on card density | **Confirm this is the only placement outside Settings.** | §3.4. |
| `ia/FINAL-ia.md` §2.3 | Beliefs draft: "It **has started** running them without asking" | **Ship `It could stop asking, on bets over $50k impact. Your call.` with `[Let it run]` / `[Keep asking me]`.** | Convergence with `FINAL-depth` R-13, not an override. Autonomy widened by the machine and announced afterwards fails Q2 by construction. See E7. |
| `ia/FINAL-ia.md` §4.2 J7 | the `07 -> 01` return edge | **Mark mandatory, not decorative.** | It is what stops the ordinals from teaching a pipeline. §5.1. |
| `conventions/engine-room-doctrine.md` rule 3 | "Reveal on demand, never by default", full stop | **Amend: depth that contradicts the user's current action comes forward uninvited, inline, at the moment of the action.** | Without it the single most valuable behavior in the product is illegal under our own first UX law. §4.3. |

### 12.2 Lexicon additions

| Concept | The one word | Definition | Banned beside it |
| --- | --- | --- | --- |
| Undoing a live release | **Roll back** | Putting the previous version back in front of customers. The change stays on the record and can roll forward again. | revert (taken by artifact versions), undeploy, unship, restore |
| The user's code, after connection | **your codebase** | The code your crew writes in. | repo (connect moment only), repository, project, source tree |
| The user's own automated tests | **your tests** | The checks your codebase already runs on every change. | CI, checks (Reviewer's verb), pipeline, build |

### 12.3 Action registry additions

| Act | Button | Helper | Toast |
| --- | --- | --- | --- |
| Approve a change into the codebase | `Approve` | `Your tests passed. Approving puts it in your codebase.` | `Approved. The change is in your codebase.` |
| Approve a release to customers | `Approve` | `Customers see it within minutes.` | `Approved. It is live. Publisher is drafting the note.` |
| Approve over an agent's objection | `Approve anyway` | `Reviewer's objection stays on the record.` | `Approved over Reviewer's objection. Both are on the record.` |
| Undo a live release | `Roll back release` | `Customers see the previous version within minutes.` | `Rolled back. The change is on the record and can roll forward.` |
| Grant an agent more rope | `Let it run` | `It stops asking for this. Everything it does lands in Done without you.` | `Granted. Critic runs teardowns without asking now.` |
| Keep an agent asking | `Keep asking me` | `Nothing changes.` | none, the row is the feedback |
| Restore a dark source | `Reconnect Linear` | `Scout picks up where it stopped.` | `Reconnected. Scout is reading the backlog now.` |
| Override a contradicting precedent | `Do it anyway` | `Your reason and the precedent both stay on the record.` | `Done. The March decision and your override are both on the record.` |

### 12.4 Words retired from every register

`changeset` · `repository` · `repo` (after connect) · `origin` · `upstream` · `remote` · `default
branch` · `main` · `environment` · `staging` · `sandbox` · `prod` · `canary` · `arc` · `mode` ·
`session` · `mission` (as the unit of work) · `lane` · `checkpoint` · `fan-out` · `blast radius` ·
`ledger` · `Pulse`

### 12.5 Words legal only inside the engine room

`branch` · `commit` · `merge` · `conflict` · `rebase` · `CI` · `check run` · `workflow` · `job` ·
`pull request` (prose; the link label stays legal outside) · `deploy` · `migration` · `schema` · `RAG` ·
`embedding` · `chunk` · `vector` · `rerank` · `top-k` · `context window` · `OAuth` · `scope` · `refresh
token` · `rate limit` · `429` · `retry` · `prompt version` · `trust score` · `trace` · `eval` ·
`guardrail` · `drift` · `orchestrator` · `latency` · `p95` · `suite` · `span` · `queue depth`

**`token` is legal nowhere, including the engine room's default view.** It answers no question a PM has
in any room. Queryable, never rendered.

### 12.6 Code fixes this doctrine requires

| File | Line | Fix | Class |
| --- | --- | --- | --- |
| `src/lib/ai/handoff.server.ts` | 73-88 | Require the **field**, not the content. Typed evidence declaration mandatory; an empty declaration is a stated recorded claim, not an absence. Then enable the gate. | **highest severity**, §10.1 |
| `src/routes/_authenticated.build.$missionId.tsx` | 151-205 | The journey strip renders `build -> PR -> CI ->` with `PR #418` as a stage label. Restage to the Run's own steps. | strings + strip model |
| `src/components/studio/CiPanel.tsx` | 38, 66-70, 117-119, 149-169, 185, 199 | Calm front becomes `Your tests passed. 12 of 12.` The panel itself is engine-room-only and may keep technical labels **there**. `ChangesetChip` renamed. | strings |
| `src/components/studio/EngineRoomDisclosure.tsx` | 98-113 | `ShippedLine` renders `PR #418` and the raw branch **outside** the toggle. Both move inside. Outside becomes `Shipped Jul 14, 16:12.` | strings |
| `src/routes/_authenticated.build.index.tsx` | 311, 692-694 | `merged PRs out.`, `open the PR` on marketing copy. | strings |
| `src/components/connections/WorkspaceBindingsSection.tsx` | 184 | `Reconnect needed` becomes a Call naming the lost evidence and its count. | strings + a count query |
| `src/components/today/ExecutedCard.tsx` | whole file | **Zero importers. Mount it.** C2 makes the entire absorbed register illegitimate until it exists. | mount |
| `src/components/today/CostPerOutcomeChip.tsx` | whole file | **Zero importers. Mount** on the receipt footer per `FINAL-ia` §2.7. | mount |
| `src/components/today/AttentionBell.tsx` | whole file | **Zero importers. Mount** in the gates tray per `FINAL-ia` §2.7, or delete. | mount |
| `src/lib/gate-signals.functions.ts` | read half | `recordGateSignal` is live at three call sites; `getGateSignals` renders nowhere. That one seam is B2. | one seam |
| `src/lib/ai/tools/registry.server.ts` | 1069-1076, 1172-1183 | The migration block is correct and stays. **Surface it as the ceiling sentence** rather than leaving it a silent capability gap. | strings |
| `src/lib/tool-consequences.ts` | whole file | Make the catalogue a **build-time invariant**: a side-effecting tool in `TOOL_REGISTRY` with no entry fails the suite. This is the seam that keeps B1 honest as the registry grows. | one test |
| `src/routes/api/public/hooks/sense-tick.ts` | 134 | Delete `ingestPostHogAnalytics` + `insertSpikeSignals` + the call. R-11 / §10.2. | 3 lines, in the demo lane |

---

## 13. THE DOCTRINE ON A CARD

1. **Absorb the labor. Prove the judgment.**
2. **Judgment goes to a Call. Escaping consequence goes to a Call. Everything else is absorbed.**
3. **A mechanism is silent until it changed what the user got. Then it is a receipt.**
4. **Silence is a rendering decision, never a storage decision.**
5. **Nothing is absorbed unless it lands in "Done without you".**
6. **A constraint that lives only in a prompt is not a constraint.**
7. **Proof is a link to a source in its own form, never a narration of reasoning.**
8. **Evidence is pulled, never pushed, except when the record contradicts what you are about to do.**
9. **A record that has never contradicted you is indistinguishable from a log file.**
10. **If a user reads a receipt and thinks "I would have stopped that", the line was in the wrong place.
    Move it.**

---

## 14. RELATED

- [`edge-a-field-study.md`](edge-a-field-study.md), fourteen products on one grid, and the outside
  evidence for every pattern above. Abridge, not Lovable, is the strongest external model.
- [`edge-b-absorption-line.md`](edge-b-absorption-line.md), the register model and the sorter.
- [`edge-c-convention-breaks.md`](edge-c-convention-breaks.md), the causal test and the twelve breaks,
  each with grounding, risks, mitigations and a kill condition. Remains the reference for §8.
- [`../language/FINAL-language.md`](../language/FINAL-language.md), wins on every word. Amended in three
  places, §12.1.
- [`../ia/FINAL-ia.md`](../ia/FINAL-ia.md), wins on every home. Amended in two places, §12.1.
- [`../depth/FINAL-depth.md`](../depth/FINAL-depth.md), wins on every provenance claim. R-13 and R-11 are
  load-bearing here.
- [`../craft-law.md`](../craft-law.md), wins on every pixel.
- [`../../../conventions/engine-room-doctrine.md`](../../../conventions/engine-room-doctrine.md), the
  first UX law. Rule 3 amended, §4.3.
- [`../../../strategy/moat.md`](../../../strategy/moat.md), the defensibility canon. §8's ranking is
  scored against its layer 2.
