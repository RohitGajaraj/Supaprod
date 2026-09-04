# EDGE B: The Absorption Line

> _Created: 2026-07-29 · Last updated: 2026-08-03_

> _Rebuild 2026-07. Written 2026-07-28 under the founder's full-authority mandate ("if we need to
> break some monopoly or some design principle, you can think about it")._
>
> **What this file decides.** Where the line sits between what Supaprod absorbs and what it shows,
> for every mechanism in the product. It rules on twelve hard cases, derives the general rule that
> produced the rulings, tests that rule on three cases it was not derived from, resolves the
> hide-versus-prove tension and defends the resolution against its sharpest attack, rules on whether
> the seven loop stages are themselves plumbing, and rules on the word "repository".
>
> **What it does not decide.** Layout, component anatomy, motion, and where a pane lives. That is
> `ia/FINAL-ia.md` and the interaction lane. This file decides *what may appear at all*, and *in
> which of three registers*. Section 11 is the handoff.
>
> **Precedence.** Builds on `language/FINAL-language.md` (vocabulary, ratified tonight) and
> `ia/FINAL-ia.md` (structure, ratified tonight). Where this file adds words, section 10 lists every
> addition so the language contract can absorb them. Where it corrects a ratified draft, it says so
> and gives the reason (there is exactly one: section 4.9).

---

## 0. The ruling, in one page

**The tension in the brief is false, and it dissolves on one distinction.** Lovable's
differentiation is hiding *labor*. Supaprod's differentiation is proving *judgment*. Those are
different objects. A branch name is evidence that work happened; it is evidence of nothing about
whether the work was right. A citation count, a named actor, a timestamp, and a seal are evidence
of judgment. So:

> **Absorb the labor. Prove the judgment.**

This is sharper than "hide the mechanism, show the evidence" because it says *which* evidence, and
it is the same line the company's own moat thesis already draws: `moat.md` §2 layer 1 says the build
layer has a fast oracle and commoditizes, and the decision layer has none and is defensible. We
absorb the side that commoditizes. We prove the side that does not. The doctrine and the moat are
the same sentence read twice.

**The general rule, three questions asked in order** (full form and defense in section 3):

```
Q1  Can the machine be wrong here in a way only a human can catch?
    (no fast oracle: taste, strategy, priority, timing, the user's own stakes)
      YES -> a CALL

Q2  If it turns out wrong, can we undo it completely from inside the product?
    (NO means it left: money moved, the world was told, customers saw it,
     a credential changed hands, another person's work now contains it)
      NO  -> a CALL

Q3  Otherwise it is ABSORBED. Then, one more question:
    does it change a durable artifact, spend the user's money, or constrain
    a future decision?
      YES -> absorbed, ON THE RECORD (it earns a receipt sentence)
      NO  -> absorbed, SILENT (it earns no sentence anywhere)
```

Plus two constitutional clauses without which the rule is just a nicer way to hide things:

- **C1. Silence is a rendering decision, never a storage decision.** Everything is recorded.
  "Absorbed silently" means it never earns a sentence on a calm surface and never appears in a
  receipt; it remains queryable in the engine room forever. The doctrine's own words: recessed, not
  removed.
- **C2. Nothing may be absorbed unless it appears in "Done without you".** Unattended acts are
  listed, in one place, in one scan, in plain words. `ExecutedCard.tsx` (547 lines, currently zero
  importers, homed by `FINAL-ia.md` §2.7 in the gates tray) is not a nice-to-have. It is what makes
  the absorbed category legitimate rather than a black box. Without it, absorption is hiding. With
  it, absorption is delegation.

**The falsifiable test that keeps the line honest in production.** If a user reads a receipt and
thinks *"I would have stopped that"*, the item was misclassified and moves from record to Call. That
sentence is a bug report shape. Ship it as a one-click affordance on every receipt, because the line
will be wrong somewhere and this is how it gets corrected by the people who can tell.

**On the seven stages (section 5): not plumbing, and they stay at seven.** We did not invent a
single one of the seven words. A PM says "we're still in discovery", "we decided to kill it", "the
spec", "we shipped it" before meeting us. The stage boundary is also the receipt boundary, so
compressing the vocabulary compresses the ledger. What *is* plumbing, and what this file bans, is
requiring the words: no stage may be a prerequisite for another, the Composer may never require a
stage word, and no onboarding screen may explain the seven. Stages are taught by application, never
by explanation, exactly as the crew already is.

**On "repository" (section 6): never.** A PM sees `repo` at most once, at connect time, only if they
already have one, and never again. After connection the word is **your codebase**. A user who lets
us provision one never learns the word at all, and that is the target state.

---

## 1. Verification log, including two corrections to the brief

I did not take the brief on trust. Load-bearing claims, checked this session:

| Claim | Verdict | Evidence |
| --- | --- | --- |
| The build engine absorbs git end to end | **CONFIRMED** | `studio.functions.ts` stages into `studio_changesets`, commits to a `studio/*` branch, opens a PR, reads CI, appends fix commits (`studio.fix.commit`), merges on green plus approval |
| Only four tools actually pause the run | **CONFIRMED** | `loop.server.ts:74-79`: `studio.commit`, `studio.pr.open`, `studio.pr.merge`, `delegate.openhands` |
| Merge is CI-green gated, not just approval gated | **CONFIRMED** | `registry.server.ts:1928` "J2 - CI-green merge gate. `studio.pr.merge` is review-gated, but we also..." |
| Risk floors exist and override trust | **CONFIRMED** | `trust.server.ts` header: the combiner "is a SAFETY FLOOR, it never makes a tool more permissive than its own mode requires"; `toolRisk` forces high-risk tools to `confirm` |
| The build engine is forbidden from touching migrations | **CONFIRMED, and this changes ruling 4.11** | `registry.server.ts:707,1069,1172` block `supabase/migrations/`, CI config, env, lockfiles |
| Revert is already non-destructive and forward-only | **CONFIRMED** | `studio.functions.ts:1229-1310`, `studio-revert.server.ts`, `stageRollback` creates a rollback mission plus revert changeset |
| Connector refresh and expiry are already modelled | **CONFIRMED** | `resolve.server.ts:208,236` (`token_expires_at`), `ConnectionRow.tsx:234` renders `Reconnect` when failing |
| Model fallback chain exists and cost is basis-corrected to the model actually used | **CONFIRMED** | `runtime.server.ts:1293,1738-1744`, `resolveFallbackChain` |

**Correction 1 to the brief: the Engine-Room doctrine was not "written and never applied".** It was
applied 29 times across 28 source files (`grep -rn "Engine-Room:" src/`), including a genuinely
correct implementation at `studio/EngineRoomDisclosure.tsx` that puts PR numbers, per-check rows and
merge controls behind one toggle and leaves a single "Quality checks passed" verdict outside. The
brief's own sharper sentence is the true one: **the capability is absorbed; the vocabulary is not.**
The doctrine was applied as a *placement* rule and never as a *naming* rule. That is the actual gap
and it is what this file closes.

**Correction 2, a live violation inside the best existing implementation.** `EngineRoomDisclosure`
declares in its own header that the shipped line is "Outside (always visible)", and then
`ShippedLine` at `:98-113` renders `Shipped via PR #418` plus the raw branch name in mono, outside
the toggle. The one component that got the doctrine right leaks two mechanism tokens on its calm
face. This is not a nitpick; it is the exact failure mode ("control-room creep") arriving through
the door built to stop it, which tells you the doctrine needs a naming rule and not just a placement
rule. Fix in section 4.1.

---

## 2. The tension, resolved

### 2.1 Why the tension looked real

The brief states it well: Lovable's differentiation is hiding the work, Supaprod's is proving it.
Hide too much and the product is a black box, which destroys defensibility. Show too much and the PM
is reading branch names, which is the friction we are removing.

### 2.2 Why it is not real

**"The work" names two different things and the tension lives entirely in the equivocation.**

| | Labor | Judgment |
| --- | --- | --- |
| What it is | The machine doing the machine's job | Someone choosing among options with no oracle |
| Examples | branching, committing, retrying, embedding, chunking, refreshing a token, falling back a model | which bet to keep, whether this ships to customers, whether the spec is right, what the outcome means |
| Has a fast oracle | Yes: it compiled, it passed, it returned 200 | No: the answer arrives in weeks, confounded |
| Copyable by a competitor | Yes, in a quarter | No, it is this workspace's own history |
| Proves what, when shown | That effort occurred | That the reasoning was sound and the record is honest |
| Our posture | **Absorb** | **Prove** |

Showing labor is not proof. It is *theater of proof*. A branch name on a PM's screen demonstrates
nothing except that we have a branch, and it costs the exact friction the founder wants gone. The
things that actually carry the moat are all on the right column: who decided, on what evidence,
when, what it cost, what happened after, and whether the record can be quietly edited (it cannot;
`ledger_seals` and the SHA-256 chain).

So the resolution is not a compromise between hiding and proving. It is a partition. **We absorb
100% of the labor and prove 100% of the judgment**, and there is no case that needs both treatments,
because no mechanism is simultaneously labor and judgment. Section 4 tests that claim against every
hard case in the brief.

### 2.3 The one place the partition is genuinely load-bearing

Citations and retrieval sit on opposite sides of it and they are the same subsystem.

- **Retrieval** (embed, chunk, vector search, rerank, top-k, the bounded breadth-first walk over
  `artifact_lineage`) is pure labor. It never renders. Not in a tooltip, not in a working line, not
  as a first-class engine-room label.
- **Citations** are pure judgment evidence, and they are the most surfaced thing in the product. The
  runtime already *rejects* an agent handoff carrying no `evidence_ids`. `FINAL-ia.md` §5.6 puts
  `CitationList` on every claim in the spec editor.

One sentence carries the whole doctrine: **the machine's method is absorbed; the machine's sources
are not.**

---

## 3. THE ABSORPTION LINE

### 3.1 The three registers

Every mechanism in the product lands in exactly one of three, and the names below are the ratified
vocabulary, not new words.

| Register | What the user experiences | Ratified vocabulary |
| --- | --- | --- |
| **Absorbed** | Nothing. It never earns a sentence on a calm surface, never appears in a receipt, never enters a working line. It is reachable in the **engine room** by deliberate query, forever. | engine room (`FINAL-language` 2.6, 2.8) |
| **On the record** | A **receipt**: `{Actor} {past-tense verb} {object}{, on {N} {evidence}}. {time}`. It does not interrupt. The user meets it when they look at the thing it produced, or when they audit. | Receipt, the record (2.5), receipt grammar (9.2) |
| **A Call** | The machine stops and waits. `Approve` / `Send back` or `Decline` / optionally `Snooze`. A Call becomes a **Decision** the moment you act. | Call, Decision (2.4), verdict verbs (5.4) |

Note what the three-way split conceals until you name it: **a Call is a superset of the record.**
Every Decision is on the record by construction. So the taxonomy is really a two-step test, and that
is why the rule below has a decision test *then* a record test, rather than one three-way sort.

### 3.2 The rule

```
Q1  THE ORACLE TEST
    Can the machine be wrong here in a way only a human can catch?
    Equivalently: is the answer verification, or is it judgment?
      judgment -> CALL

Q2  THE CONTAINMENT TEST
    If it turns out wrong, can we undo it completely from inside the product,
    with one act, without asking anyone outside to cooperate?
      no -> CALL

Q3  THE CONSEQUENCE TEST   (only reached if Q1 and Q2 both say absorb)
    Does it change a durable artifact, spend the user's money, or constrain a
    future decision?
      yes -> ON THE RECORD
      no  -> SILENT
```

**Q1 is the founder's own moat thesis used as an interaction rule.** `moat.md` §2 layer 1: code has
a fast oracle (compiles or not, tests pass or fail, seconds, near-zero cost); "what to build" has
none (weeks to quarters, confounded, a quarter of a team wasted if wrong). Anything with a fast
oracle, the machine answers, because asking a human to answer a question the machine can verify is
pure friction with no trust benefit. Anything without one, the human answers, because that is the
thing they are actually for and the thing the record is actually about.

**Q2 catches what Q1 misses: consequence, not correctness.** Deploying to production has a fast
oracle in one sense (it deployed or it did not), so Q1 would absorb it. Q2 refuses, because customers
saw it, and no act of ours un-sees it. Q2 is the reason merges, releases, rollbacks, spend above a
threshold, and anything that leaves the product to reach a person or a payment rail are Calls even
when the machine is confident.

**Q3 is what stops the absorbed register from becoming a landfill.** Most machine steps are neither
judgment nor escaping consequence, and most of them are also not worth a sentence. A retry that
succeeded, a cache hit, a token refresh, a rerank: none change an artifact, none cost the user
anything they would notice, none constrain a future call. They go silent. A commit does change a
durable artifact, so it earns its place in the record even though nobody is ever asked about it.

### 3.3 The two constitutional clauses

**C1. Silence is a rendering decision, never a storage decision.** The record is complete by
architecture. "Silent" describes what earns a sentence, not what is written. This clause is what
separates our absorption from a vendor's opacity: we are not choosing what you may know, we are
choosing what you must read.

**C2. Nothing is absorbed unless it lands in "Done without you".** Every unattended act appears
there, in receipt grammar, scannable in one pass, with the same click to open the thing it touched.
This is the price of the absorbed register and it is not optional. It is also, not incidentally, the
best trust artifact in the repo and currently has zero importers.

### 3.4 The two placement corollaries

**P1. A Call sits at the last moment the user can still change the outcome cheaply, and there is
exactly one Call per boundary the change actually crosses.** Not one per mechanism. If merging to
the user's default branch also triggers their deploy, that is *one* boundary and *one* Call, and the
Call must say so in its own copy: `Approving puts this in front of customers.` If merge and deploy
are genuinely separated in time in this workspace, that is two boundaries and two Calls. The product
can detect which, so the copy is derived, not guessed.

**P2. Autonomy tightens silently and widens only by a Call.** A bad outcome may narrow an agent's
rope without asking, because safety needs no permission. Rope is never widened by the machine's own
observation of your habits, only by your grant. Section 4.9 applies this and corrects one ratified
draft.

---

## 4. THE RULINGS

Format: the mechanism, the register, the reasoning by rule, and the exact thing the user sees
instead, in ratified vocabulary.

### 4.1 Git branches, commits, merges, conflicts, reverts

| Mechanism | Register | Rule path |
| --- | --- | --- |
| Branch | **Silent** | Q1 absorb, Q2 contained, Q3 no durable artifact of its own |
| Commit | **On the record** | Q1 absorb, Q2 contained, Q3 yes, it changed the codebase |
| Merge | **Call** | Q2 fails: other people's work now contains it |
| Conflict, textual | **Silent** | Q1 absorb, git is a deterministic oracle for where |
| Conflict, semantic (two runs, same intent) | **Call** | Q1 fails: which one is right is judgment |
| Revert / rollback | **Call**, and a first-class user verb | Q2: production traffic already saw the thing being undone |

**What the user sees instead.**

- **Branch: nothing, ever.** The unit of identity is already ratified: `Run 41 · Fix the checkout
  redirect`. Fix `EngineRoomDisclosure.tsx:98-113` today: the outside line becomes
  `Shipped Jul 14, 16:12.` with no PR number and no branch. Both tokens move inside the toggle,
  where `CiPanel` already renders them correctly.
- **Commit: the change and the step count.** `Engineer wrote the change in 6 steps.` Never "3
  commits". The step count is already the ratified believability floor (`FINAL-language` 9.3): under
  60 seconds real elapsed, render steps, never duration.
- **Merge: a Call on a Change.**
  ```
  Run 41 is ready.
  Engineer wrote the change across 12 files. Your tests passed, 12 of 12.
  Reviewer checked it against the spec.
  Approving puts this in front of customers.        <- only when merge auto-deploys
  [Approve]  [Send back]  [Snooze]
  ```
  Toast: `Approved. The change is in your codebase.` Or, when the boundary is customer-facing:
  `Approved. It is live. Publisher is drafting the note.`
- **Semantic conflict: a Call naming both runs, never the file.**
  `Run 44 changed the same thing Run 41 already changed.` / `Run 41 shipped Tuesday. Run 44 has not.
  Keeping 44 replaces it.` / `[Approve]` `[Send back]`. The word "conflict" does not appear; the
  word "rebase" certainly does not.
- **Revert: `Roll back`, with the ratified confirm anatomy.**
  `Roll back this release?` / `Customers see the previous version within minutes. The change stays on
  the record and you can roll forward again.` / `Cancel` / `Roll back release`.
  The code already makes that copy true: `stageRollback` is non-destructive and forward-only.

**Lexicon note.** `Revert` is already spoken for by artifact versions (`Revert version`, ratified in
7.4). One concept one word, so releases get `Roll back`. Both go in the lexicon in section 10.

### 4.2 CI runs, failures, flaky tests

| Mechanism | Register | Rule path |
| --- | --- | --- |
| A CI run | **Silent while green** | CI *is* the fast oracle; narrating an oracle is noise |
| The verdict | **On the record** | Q3: it constrains the next Call (merge is gated on it) |
| A failure inside the fix budget | **Silent** | Q1 absorb: the engine already appends fix commits |
| A failure after the budget | **Call** | Q1 fails: the machine gave up, only the human decides what now |
| A flaky test | **On the record, then a Belief** | Q3: it constrains every future run and costs real time |

**What the user sees instead. This is the ruling I am most confident is a genuine improvement on the
current design.**

The current UI says `CI passed`, `CI not green`, `CI not run`, `Refresh · re-reads CI`
(`CiPanel.tsx:117-199`). All four are mechanism names and all four die on the calm front.

The obvious replacement, "Checks", is **wrong**, and catching that is the point of having Law 2 in
the language contract: `check` is Reviewer's exclusive verb (`Reviewer · checks · Checks the diff
against the spec before it ships`). `Reviewer checked the change. 12 checks passed.` reads as
Reviewer having run them, which is a lie: your CI ran them.

The honest naming is stronger than either:

> **`Your tests passed. 12 of 12.`**
> **`Two of your tests failed. Engineer is fixing them.`**

The possessive is doing real work. These are the *user's* tests, from the user's codebase, and we
did not write them or grade ourselves against them. That is a bigger trust claim than any badge we
could design, and it costs one word.

- **After the fix budget, a Call:** `Engineer could not get your tests green.` /
  `Two failed after three attempts. The change is not in your codebase and nothing shipped.` /
  `[Send back]` `[Take it over]`. This matches the terminal register already in
  `FINAL-ia.md` §4.3 ("build red -> the failing check, with 'send it back' and 'take it over'").
- **The flaky test is the sharpest case in this family and the best available proof that absorption
  is not hiding.** A flake is exactly a pattern the record can see and a human cannot. It becomes a
  **Learning**, then a **Belief** in the Brain:
  ```
  checkout.spec.ts fails about one run in five and passes on retry.      forming ~
    Seen in 4 runs since Jul 3 - it has cost you about 20 minutes of waiting
    [Stop retrying it]   [Keep retrying]
  ```
  That is plumbing turned into judgment, which is the only thing the record is for.
- `CI`, `check run`, `workflow`, `job`, `conclusion` join the engine-room-only list (section 10).

### 4.3 Pull requests and code review

| Mechanism | Register | Rule path |
| --- | --- | --- |
| The PR object | **On the record, with an external door** | Q3 yes; and it lives in a tool the user may legitimately want to open |
| Reviewer agreeing with Engineer | **On the record** | Q1 absorb: it is verification against a spec |
| Reviewer dissenting | **Call** | Q1 fails: two agents disagree, and there is no oracle for who is right |
| A human teammate's review on GitHub | **Absorbed on the way out, on the record on the way back** | it happens in their tool; the verdict is evidence |

**What the user sees instead.**

- Never `PR` in prose (already ratified: banned in prose, legal in a link label). The run's outcome
  card carries `Engineer wrote the change. 12 files.` plus a quiet link `Open the pull request` for
  the engineer who wants GitHub. The link label is the one legal appearance.
- The ceiling sentence stays verbatim as ratified in 6.13: **`Your crew opens the pull request. A
  human merges it.`** It is a boundary the user should want, and it is stated before they reach it.
- **Reviewer dissent is the highest-value Call in the product** and deserves its own anatomy,
  because it is the Critic wedge from `moat.md` applied to code:
  ```
  Reviewer says this does not match the spec.
  The spec says the retry caps at 3. The change retries until timeout.
  [Approve anyway]  [Send back]
  ```
  `Approve anyway` is the one legal deviation from the registry verb, because approving over a
  stated objection is a materially different act from approving, and the record must show which one
  happened. Toast: `Approved over Reviewer's objection. Both are on the record.`
- A teammate's GitHub review returns as a receipt: `Priya approved the pull request. Jul 14, 10:02.`
  **Marked WIRE, not PROVEN**: this requires reading review state through the GitHub connector, which
  is not verified wired today. Do not ship the sentence before the read exists.

### 4.4 Deploys, previews, rollbacks, environments

| Mechanism | Register | Rule path |
| --- | --- | --- |
| Preview | **On the record, and loud** | Q1/Q2 absorb; it is the single best evidence artifact we have |
| Deploy to production | **Call** | Q2 fails: customers |
| Rollback | **Call** | see 4.1 |
| Environments (staging, sandbox, dev, prod, branch deploys) | **Silent, totally and permanently** | Q1/Q2/Q3 all absorb: the word names our topology, not their outcome |

**What the user sees instead.**

- **Preview deserves a note, because it is the ideal shape of evidence and the whole reason
  Lovable's approach works.** A preview is proof that requires zero literacy: the user does not read
  that it works, they click it and it works. The lexicon already has the word
  (`Preview` = "the change running somewhere real that is not production yet"). The door is
  `See it running`, and it belongs on the run's outcome card, on the merge Call, and in the
  out-of-app notification. If we could convert one more class of evidence into this shape, we
  should; nothing else in the product is this cheap to verify.
- **Deploy: a Call whose card states what is true and whose buttons are verbs** (button labels may
  never be questions, ratified 5.1):
  `Run 41 is ready to go live.` / `Customers see it within minutes of your approval.` /
  `[Approve]` `[Send back]` `[Snooze]`. Toast: `Approved. It is live. Publisher is drafting the
  note.`
- **Environments are the purest plumbing in the entire list** and I want the ruling stated as
  strongly as it deserves: the PM's mental model has exactly two slots, **Preview** and **Release**,
  both already in the ratified lexicon. The machine may have five. The word `environment` renders
  nowhere, ever, including in the engine room as a first-class label. There is no honest case where
  a PM's next action depends on knowing whether something is on staging.

### 4.5 Model choice and model fallback

| Mechanism | Register | Rule path |
| --- | --- | --- |
| Which model runs a step | **Silent by default; named on the Call that authorizes the spend; configurable in Settings** | Q1 absorb (evals, cost and latency are oracles); Q3 yes, it is their money |
| A fallback firing | **Silent** | Q1/Q2 absorb; Q3 only via cost, which the record already carries |
| A fallback to a materially worse model, on output the user is about to rely on | **On the record, and stated on the Call** | 6.13 ceiling law: state the gap before the user relies on it |

**What the user sees instead.**

- **Nothing, almost everywhere.** No model name on an activity row, in a working line, in a toast, or
  on a receipt line. This is already half-ratified: the receipt density table (9.4) puts `Model` on
  the card density with the note "only on a call the human is answering". Ratified and extended:
  that is the *only* place, plus Settings.
- On a Call: `Model` and `Spend so far $0.42` sit together, because authorizing spend without knowing
  what you are buying is not consent.
- **The one honest exception, which is new here:** when the primary model was unavailable and the
  output the user is about to approve came from a materially weaker fallback, the Call says so in one
  line: `Written with the backup model. Your usual model was unavailable.` Only when true. This is
  the ceiling law (state the gap in the same breath, beside the control, never after the fact)
  applied to routing, and it is the difference between absorbing a fallback and concealing a
  degradation.

### 4.6 Token counts, credits, cost

| Mechanism | Register | Rule path |
| --- | --- | --- |
| Token counts | **Silent, permanently, everywhere** | already engine-room-only in 2.8; a PM's decisions never turn on a token count |
| Credit balance | **State, and a Call only at the threshold** | Q2: running out stops their crew |
| Cost of a run | **On the record, as an outcome, not as a spend** | Q3: their money |

**What the user sees instead.**

- The unit is **Credit**. The three quota strips are already ratified (6.12) and I ratify them
  unchanged: `12 credits left.` / `No credits left.` / `Your last renewal payment failed.`
- **Credits are a remaining budget, never a running meter.** The receipt anti-pattern table already
  bans a cost on a row the user never authorised, with exactly the right reason ("reads as a meter
  running against them"). Extend it to a hard rule: **no live-ticking cost anywhere in the product.**
  A meter changes behaviour; a receipt informs it.
- Cost appears in exactly three places and nowhere else: the Call card that authorizes it, the quota
  strip, and the engine room's Spend room.
- **Cost is framed as an outcome, not a spend.** `Run 41 cost $2.40 and shipped the checkout fix.`
  Never `$2.40 spent`. `CostPerOutcomeChip.tsx` (109 lines, zero importers) is the component for
  this and `FINAL-ia.md` §2.7 already homes it on the receipt footer. Same number, and the framing is
  the difference between a bill and a receipt.

### 4.7 Agent retries and failures

| Mechanism | Register | Rule path |
| --- | --- | --- |
| A retry that succeeds | **Silent** | Q1/Q2/Q3 all absorb |
| A retry that changes the model or the cost | **On the record** | Q3: money |
| A stall | **On the record, in place, honestly** | Q3: it constrains what the user does next |
| A run that fails | **Call** | Q1 fails: what to do now is judgment |

**What the user sees instead.**

- **The working-state deck may never narrate a retry.** `retry 2 of 3` is the machine describing its
  own struggle, which is both plumbing and slightly pitiful. The ratified duration ladder (8.4)
  already has the honest version and I ratify it unchanged: hold the last line after 3 rotations, and
  at 8 minutes replace it with `Nothing has moved for 8 minutes.` plus `Stop` and `Try again`.
- **A stall is not a failure and must not be dressed as progress.** A rotating verb deck over a dead
  step is the single most dishonest thing a calm front can do, because it manufactures the appearance
  of work. The ladder's "stops rotating when the underlying step stops moving" rule is therefore not
  a polish detail; it is a truth rule.
- A failed run: `Run 41 stopped. Engineer could not read the checkout module.` / `Nothing was
  changed.` / `[Try again]` `[Ask why]` / `ERR 7C31A0`. `Ask why` prefills the thread with the
  failure context, matching the composer prefill pattern already ratified for declined gates.
- Stack traces, tool ids, and raw provider errors never reach a human. Map at the boundary; the
  six-character mono ref is the only machine string allowed in an error block.

### 4.8 RAG retrieval and citations

| Mechanism | Register | Rule path |
| --- | --- | --- |
| Embedding, chunking, vector search, reranking, top-k, the graph walk | **Silent, permanently** | Q1/Q2/Q3 all absorb; no judgment, no escape, no artifact |
| Which sources the claim rests on | **On the record, in place, at the moment of reading the claim** | the whole product |

**What the user sees instead.**

- Never: `retrieved 14 chunks from 3 documents`, `similarity 0.82`, `reranked`, `RAG`, `embedding`,
  `vector`, `context window`.
- Always: the ratified receipt clause. **Exactly one evidence clause, always a count, always a
  door.** `Writer drafted the checkout spec, on 9 signals.` Clicking `9 signals` opens them.
- **Citations are not evidence-after-the-fact; they are evidence-in-place.** They render beside the
  claim, at read time, before the user acts on it. `FINAL-ia.md` §5.6 already places `CitationList`
  on every claim in the spec editor and the contradiction warning in the composer as you type. That
  distinction matters for section 7's defense: the most consequential evidence in the product is not
  in the after-the-fact bucket at all.
- **And the adverse case, already ratified and worth quoting because it is the strongest single
  sentence in the language contract:** a receipt with zero sources renders as `with no signals behind
  it`, "and that receipt is a warning, not a receipt". A record that indicts its own output is not a
  black box.

### 4.9 Approval modes and trust arcs

| Mechanism | Register | Rule path |
| --- | --- | --- |
| The trust score, the Bayesian shrinkage, the arc enum | **Silent** | Q1 absorb: computed from real outcomes with an oracle |
| The current setting | **A setting, in diverged labels** | the user owns it |
| Narrowing an agent's rope after a bad outcome | **Silent, on the record** | safety needs no permission; P2 |
| Widening an agent's rope | **Call, always** | Q2 fails: unattended work cannot be un-run; P2 |

**What the user sees instead.**

- The score never renders as a number. The word `arc` is already deleted product-wide, code included.
- The three diverged labels are ratified unchanged (4.4): `Runs on its own` / `Asks me first` /
  `I check the output`.
- **The graduation moment is the best Call in the product, and the ratified draft has it backwards.**
  `FINAL-ia.md` §2.3 currently drafts:
  > `You approve Critic teardowns 9 times out of 10.`
  > `It has started running them without asking on bets over $50k impact`
  > `[Turn that off] [Keep it]`

  **Correction.** "It has started" means the machine widened its own autonomy and then informed the
  user. That fails Q2 (work already ran unattended and cannot be un-run) and it fails the
  "I would have stopped that" test by construction. Ship instead:
  ```
  You have approved Critic teardowns 9 times out of 10.
  It could stop asking, on bets over $50k impact. Your call.
  [Let it run]   [Keep asking me]
  ```
  Same insight, same evidence, same compounding story, and the machine proposes rather than
  announces. **Asymmetry, stated as law: tighten silently, loosen by Call.** This is the only place
  in this file where I overrule a document ratified tonight, and the reason is that the draft
  violates the containment test that the rest of the ratified contract depends on.
- **"Done without you" is the constitutional partner to all of this** (C2). Everything the widened
  rope then does appears there, in one scan, in receipt grammar.

### 4.10 Connector OAuth, scopes, token expiry

| Mechanism | Register | Rule path |
| --- | --- | --- |
| The OAuth dance, PKCE, state, redirect | **Silent** | Q1/Q2/Q3 all absorb |
| What the crew will do with the access | **A decision, once, at connect time, phrased as outcomes** | Q2: it is the user's data in someone else's system |
| The literal scope strings | **Silent** | `repo:read` is our vocabulary, not theirs |
| A refresh that succeeds | **Silent** | Q1/Q2/Q3 all absorb |
| A refresh that fails | **Call** | Q2 fails: only they can re-grant it |

**What the user sees instead.**

- One `Connect` button. Doctrine rule 4 is already ratified as OAuth-only, no key paste. The redirect
  wait gets a plain wait string with no personality: `Opening GitHub`.
- The pre-flight card states outcomes, not scopes, and the ratified strings already do this:
  helper `Scout reads it on the next sweep. Nothing is written back.`, toast
  `Connected. Scout reads it at 2am.`
- **Expiry becomes a Call whose subject is lost evidence, not a lost token.** The current
  `Reconnect needed` (`WorkspaceBindingsSection.tsx:184`) names the mechanism's failure. Ship:
  ```
  Scout lost access to Linear.
  It stopped reading two days ago. 40 issues have not been seen.
  [Reconnect Linear]
  ```
  The number is the entire justification for interrupting. An expired token is worth a Call only
  because evidence stopped arriving.
- **And the ruling that matters more than the Call: a dark source makes Discover `partial`, never
  `zero`.** The ratified partial-state rule (6.8) says it exactly: "if the missing piece would change
  the reader's conclusion, the number is suppressed entirely rather than shown incomplete". A
  Discover surface rendering `Nothing needs you` while a connector is dark is the product lying in
  its own voice, and it is a truth-integrity failure rather than a plumbing failure. `2 of 3 sources
  reported. Linear has been dark since Tuesday.`

### 4.11 Database migrations

Two different things, and conflating them is how this gets answered wrongly.

**(a) Supaprod's own migrations.** Silent. Permanently. Not even engine room. Our schema is not the
user's business in any register.

**(b) Migrations in the user's repo.** The honest ruling today is **a ceiling sentence, not an
absorption ruling**, because the capability does not exist: `registry.server.ts:1069-1076,1172-1183`
explicitly blocks the build engine from touching `supabase/migrations/`, CI config, env and
lockfiles. Under the standing "claim never outruns wiring" rule, ship:

> `Your crew writes application code. It does not change your database schema.`

Placed as helper text beside the Build control, per the 6.13 ceiling anatomy: before the user reaches
it, never in a tooltip, never after the fact.

**(c) When it lands, the ruling is already determined by the rule, and it is a hard floor.** A schema
change is the one thing in software that Q2 answers most strongly: rolling back code restores the
prior behaviour, rolling back a dropped column does not restore the data. Therefore:

> **A schema change is always a Call, at every autonomy level, and it is the one Call that can never
> be granted to `Runs on its own`.**

This matches an invariant the codebase already understands: `trust.server.ts` describes the mode
combiner as a safety floor that can never make a tool more permissive than its own mode requires, and
`toolRisk` already forces high-risk tools to `confirm` regardless of trust. Schema changes get the
top floor. The user sees:
`This change adds a column to your orders table.` / `Rolling back the code will not undo it.` /
`[Approve]` `[Send back]`.

### 4.12 Summary table

| Mechanism | Register | What appears instead |
| --- | --- | --- |
| branch | silent | nothing; `Run 41 · Fix the checkout redirect` |
| commit | record | `Engineer wrote the change in 6 steps.` |
| merge | **Call** | `Run 41 is ready.` + Approve / Send back |
| textual conflict | silent | nothing |
| semantic conflict | **Call** | `Run 44 changed the same thing Run 41 already changed.` |
| revert | **Call** | `Roll back this release?` |
| CI run | silent | nothing |
| CI verdict | record | `Your tests passed. 12 of 12.` |
| CI failure, in budget | silent | the working line, unchanged |
| CI failure, out of budget | **Call** | `Engineer could not get your tests green.` |
| flaky test | record -> Belief | `checkout.spec.ts fails about one run in five.` |
| pull request | record + external door | `Engineer wrote the change. 12 files.` + `Open the pull request` |
| Reviewer agrees | record | `Reviewer checked it against the spec.` |
| Reviewer dissents | **Call** | `Reviewer says this does not match the spec.` |
| preview | record, loud | `See it running` |
| deploy | **Call** | `Run 41 is ready to go live.` |
| environments | silent | Preview and Release, nothing else |
| model choice | silent / on the Call | `Model` beside `Spend so far` on the Call only |
| model fallback | silent | nothing, unless degraded: `Written with the backup model.` |
| tokens | silent | Credits |
| credits | state + threshold Call | `12 credits left.` |
| cost | record, as outcome | `Run 41 cost $2.40 and shipped the checkout fix.` |
| retry | silent | nothing; then the honest stall line |
| stall | record, in place | `Nothing has moved for 8 minutes.` |
| run failure | **Call** | `Run 41 stopped. Engineer could not read the checkout module.` |
| retrieval | silent | nothing |
| citations | record, in place | `on 9 signals`, count is the door |
| trust score / arc | silent | nothing |
| approval mode | setting | `Runs on its own` / `Asks me first` / `I check the output` |
| autonomy widening | **Call** | `It could stop asking. Your call.` |
| OAuth, scopes | silent | `Connect` + outcome sentence |
| token expiry | **Call** | `Scout lost access to Linear.` |
| our migrations | silent | nothing |
| their migrations | ceiling today, **Call** when built | `Your crew writes application code. It does not change your database schema.` |

---

## 5. Are the seven loop stages themselves plumbing?

The founder put the loop's shape in scope and said it can be compressed or expanded. This is the
sharpest case in the brief because the rule in section 3 does not obviously apply: a stage name is
not a mechanism.

### 5.1 The prior question: plumbing versus model

**Plumbing is how the machine does the work. A model is how the user thinks about the work.** Git is
plumbing because the user's goal ("ship the fix") does not contain the concept of a branch anywhere.
A word is only plumbing if the user had to acquire it *from us* in order to state their own goal.

So the test is: **did the user already own this word, for this thing, before meeting us?**

Run it on all seven. A PM says, in a standup, without us: "we're still in discovery", "we decided to
kill it", "the spec", "the designs", "we're building it", "we shipped it", "what did we learn".
**We invented none of the seven words.** Every one is the trade's own vocabulary, and the language
contract's banned-beside lists confirm it by exclusion: the banned alternatives (`Sense`, `Intake`,
`Triage`, `Groom`, `Execute`, `Rollout`, `Retro`) are the ones that *would* have been plumbing.

**Ruling: the seven stages are not plumbing. They are the domain, named in the domain's own words.**

### 5.2 But three real failure modes turn them into plumbing, and the founder's instinct is picking up on all three

**Failure A: the ordinals assert a sequence the product itself denies.** The lexicon says the loop is
"entered and left at any point". J2, J3 and J5 explicitly start mid-loop. And `FULL_LOOP_CHAIN` in
`journeys.ts:201` is `["j1","j2","j3","j5","j4","j6","j7"]`, which is not even in stage order.
`01..07` teaches a pipeline; the product is a cycle with side doors.

> **Ruling A.** The ordinals are legitimate as **position on a drawing** (the Spine, and `05 Engineer`
> as a crew seat, both already ratified) and illegitimate as **a prefix in prose**. "Move this to
> stage 3" never renders. And the `07 -> 01` return edge on the Spine, which `FINAL-ia.md` §4.2
> already specifies for J7, is **mandatory rather than decorative**: it is the single pixel that
> stops the numbers from lying about what the thing is.

**Failure B: a stage becomes a prerequisite.** This is the real plumbing risk. If you must pass
through Discover to reach Plan, the vocabulary stops being a description and becomes a gate you must
learn to get past.

> **Ruling B, and this is the falsifiable one.** Every stage is enterable cold, from nothing, with no
> upstream artifact. **If any stage cannot be entered without an upstream artifact, that stage's
> vocabulary has become plumbing and the design is wrong.** The IA already satisfies this (J3 "Just
> write the PRD" starts from "a bare idea typed with no upstream at all"; the upstream empty state is
> an invitation with a door, never a wall). Keep it satisfied and test it.

**Failure C: the user has to name the stage to get work done.** If the Composer requires stage
vocabulary, we have shipped a command language wearing a product.

> **Ruling C.** The Composer never requires a stage word. `journeyForIntent` already maps plain
> intent to the right slice. The stage is **a label the product applies to your intent**, and you
> learn the vocabulary by watching it get applied to your own work. **Stages are taught by
> application, never by explanation.** No onboarding screen explains the seven, exactly as the "meet
> the crew" grid is already banned for the same reason.

### 5.3 Compress? No, and the reason is the ledger, not tradition

The tempting compression is four: Decide, Build, Ship, Learn, with Discover folded into Decide and
Plan plus Design folded into Build. It reads cleaner on a landing page. It costs the following:

- **Plan is where the spec is written, and the spec is the citation anchor.** `FINAL-ia.md` §5.4
  calls it "the densest interlink surface in the product". Folding Plan into Build makes the spec an
  artifact *of* the build rather than the authorization *for* it, which severs the
  decision-authorized-this-work chain. That chain is the moat.
- **Discover folded into Decide loses the signal -> pattern -> bet chain**, which is the only reason
  a bet has evidence behind it rather than an opinion.

The general form: **a stage boundary is a receipt boundary.** The joints are where handoffs happen,
and handoffs are where the record is written (the runtime rejects a handoff with no `evidence_ids`).
**Compressing the vocabulary compresses the ledger.** That is a structural cost, not a stylistic one,
and it is why the seven survive a founder who is right to ask.

### 5.4 Expand? No, and for a different reason

Candidates would be an Operate/Support stage or a GTM stage. Both are already covered (Learn absorbs
the outcome; Publisher announces), and there is a hard constraint the shape has to respect: **the
loop must read left to right in one glance on the Spine, at the narrowest supported width.** Seven is
already at that ceiling. An eighth stage buys a word and costs the "single most important pixel in
the product" claim that `FINAL-ia.md` §3.2 rests on.

### 5.5 The compression that IS available and honest

Not of the model. Of the rendering.

> **A stage the workspace has switched off does not render on the Spine.**

`design_stage_enabled` already exists in code and J5 already participates conditionally. A team with
no design practice sees six stages, not seven with one greyed out. This is compression by
configuration, it is honest, it costs no vocabulary, and it means the Spine describes *this*
workspace rather than our diagram of a workspace.

### 5.6 The one stage word I would change if forced, and why I am not

`Learn` is the weakest of the seven by the section 5.1 test. PMs say "how did it land", "did it
work", "we're measuring it". `Learn` describes what the *system* gets rather than what the *user*
does, and it carries a faint self-help register the other six do not.

I keep it anyway, because the alternatives are all worse and already banned (`Measure`, `Reflect`,
`Retro`, `Analyze`, `Impact`), and because the pairing already solves it: the stage label is `Learn`
and the journey that fills it is named **"How did it land?"**. The human phrasing lives on the door
the user actually clicks, and the stage word is learned by watching it get applied. That pairing is
Ruling C working exactly as intended, which is the best evidence that the ruling is right.

---

## 6. Should a PM ever see the word "repository"?

**No. Not once.**

`repository` is jargon with a false-friend problem (document repository, artifact repository, package
repository), and it is longer than the thing it names. It renders nowhere, in any register, including
the engine room, where the correct token is the provider's own (`GitHub repo`).

**`repo` is a different question and gets a bounded yes.**

The lexicon already has the general noun: **Source** is "a tool you connected that your crew reads
from", and a repo is a source. But at the connect moment we are naming a foreign object that lives in
someone else's product under that product's own name, and naming a foreign object by its foreign name
is accuracy, not plumbing. It is the same reason we say `Linear` and not "your ticket source".

**The ruling, in four parts:**

1. **`repo` appears exactly once: the connect moment, and only for a user who already has one.** The
   ratified strings already do this correctly and I ratify them unchanged: `Build needs a repo
   first.` / `Connect one and your crew opens pull requests against it. One click, no keys to paste.`
   / `[Connect a repo]`.
2. **After connection, the word is retired for that workspace.** Runs never say "in the repo". They
   name the codebase or the files: `Engineer wrote the change across 12 files.` **The general noun
   after connection is `your codebase`**, which is what a PM says out loud.
3. **The user who has no repo never learns the word at all, and that is the target state.**
   `provisionRepoForSpec` already exists and creates a private starter repo. So the zero state
   offers two doors and only one of them contains the word:
   ```
   Your crew needs somewhere to write the code.
   [Connect GitHub]        [Let us set one up]
   ```
   Whoever takes the second door completes the whole loop, ships to production, and reads their
   receipts without ever encountering a git noun. That is the founder's Lovable observation
   implemented honestly, and it is a strictly stronger version of it, because the user who *does*
   know git is not condescended to either.
4. **`repository`, `origin`, `upstream`, `remote`, `default branch`, `main` are banned in prose in
   every register.** The engine room may show a repo's full name because that is how the user finds
   it in GitHub.

---

## 7. The attack: "showing evidence after the fact is just hiding with extra steps"

This is the strongest objection available and it deserves a real answer rather than a slogan. I will
concede the half of it that is true first, because the concession is what makes the rest defensible.

### 7.1 Where the attack lands, and it lands hard

The attack is **correct** whenever the evidence is any of:

- **(a) Selective.** If the vendor chooses at read time what to show, the record is a press release.
- **(b) Composed after the fact.** A narrative assembled when you ask is a story, not a record.
- **(c) Expensive to reach.** Evidence behind archaeology is evidence nobody has.
- **(d) Too late to matter.** If knowing earlier would have changed the user's action, after-the-fact
  is not evidence, it is an alibi.

Point (d) is the sharpest and I accept it completely. A product that puts consequential things in the
after-the-fact bucket has hidden them, no matter how beautiful the receipt is.

### 7.2 Why it does not land here

**The rule's own decision test is the answer to (d).** Q1 and Q2 exist precisely to pull anything the
user would have stopped *out* of the record register and into the Call register. The attack assumes
we are putting consequential things in the after-the-fact bucket. The rule forbids it, by
construction: judgment goes to a Call, escaping consequence goes to a Call, and only verified,
contained, low-stakes machine labor is left over. If we ever find a receipt a user would have
stopped, that is not a defense of the attack; it is a misclassification the "I would have stopped
that" test converts into a fix.

**For (a), (b) and (c), the record has four properties that a hidden mechanism cannot have, and each
one is architectural rather than a promise:**

1. **Contemporaneous.** Written at the moment of the act, sealed with SHA-256 into a tamper-evident
   chain (`ledger_seals`, `trust-ledger.functions.ts`). A record you can verify was written before
   the outcome was known is a categorically different object from a narrative composed after it.
2. **Complete before it is asked for.** There is no "generate audit" action anywhere in the product,
   and there must never be one. If the record had to be built on demand, it could be built
   selectively. It cannot be, because it already exists.
3. **Adverse.** It contains what hurts us. This is not aspirational; it is already ratified in the
   language contract: a receipt with no sources renders `with no signals behind it` and "that receipt
   is a warning, not a receipt"; "supersession is in the same line, never silent"; failed runs, spend
   that produced nothing, and beliefs that turned out wrong all get rows. **A record that contains
   only successes is marketing. A record that indicts its own output is evidence.** This property
   alone distinguishes us from every vendor dashboard.
4. **Fixed-cost to reach.** One click from the artifact it explains, the same click every time, the
   same shape every time. `FINAL-ia.md` §5.5 makes the `ReceiptLine` a cross-cutting spine on every
   artifact card and `chain.test.ts` fails the build when an entity view ships without its chain.
   The reach is enforced by test, not by discipline.

### 7.3 The structural difference, stated once

> **Hiding is a choice the vendor makes at render time about what you get to know. A record is a
> commitment the vendor makes at write time, before it knows what you will ask.**

The first is revocable and selective. The second is neither. That is a difference in kind, not in
degree, and it survives the "extra steps" framing because the extra step is *ours*: we had to write
the thing before we knew whether it would embarrass us.

### 7.4 The three things that would make the attack true, so we can watch for them

Name the failure conditions so the doctrine is falsifiable:

1. **A "generate report" button appears.** The moment the record is produced on request rather than
   read, property 2 is gone and the attack is correct.
2. **A receipt is ever edited or backfilled.** Append-only or it is not a record. A prompt change, a
   rename, or a schema migration may never rewrite a past receipt (see the section 8 test 3).
3. **The record's adverse rows get quieter than its favourable ones.** If a failed run's receipt is
   terser than a successful one's, we have started editorializing, and the record becomes a
   highlight reel with extra steps. **Rule: adverse receipts get equal or greater detail than
   favourable ones**, and that is a design constraint the visual lane must honour.

---

## 8. Testing the rule on three cases it was not derived from

A rule that only reproduces the rulings it was reverse-engineered from is a rationalization. Three
cases from outside the brief's list, chosen to stress it in different directions. One of them makes
the rule forbid a capability, which is the strongest evidence it is load-bearing.

### Test 1: a model provider rate-limits us in the middle of a run

- **Q1:** judgment? No. A 429 is a fast oracle and the response is mechanical: back off, retry, fall
  back. **Absorb.**
- **Q2:** contained? Yes. Nothing left the product.
- **Q3:** durable artifact, money, or future constraint? Only elapsed time, unless the fallback
  changed the model.
- **Verdict: silent**, escalating to the ratified stall line if the step genuinely stops moving, and
  a record row only if the model actually changed.
- **Non-obvious and correct.** The naive instinct is to tell the user "the provider is throttling
  us", which is us describing our supply chain. The user's decision does not change. The rule refuses
  it and lands exactly on the ratified duration ladder without having been shown it. ✓

### Test 2: a routine runs at 2am and drops a bet the user was watching

- **Q1:** judgment? **Yes.** `Drop` is a human verb in the ratified vocabulary ("Removing a bet from
  the backlog. You take a bet off the list, with the reason kept").
- **Verdict: the rule forbids the capability.** A routine may not Drop. Ever, at any autonomy level.
- **What it may do instead:** re-rank. Ranking has an oracle (the scoring model), is fully reversible,
  and `autoAdjustIce` already does it unattended today. The morning **Brief** says
  `Strategist moved 3 bets down overnight. Nothing was dropped.` and the moves appear in **Done
  without you** with the reason attached.
- **This is the best evidence the rule is real**, because it produced a constraint on a feature
  rather than a label for one, and it did so from a case I had not considered when writing Q1.
- **And it exposes a live defect.** An unattended re-rank is only legitimate if the record honestly
  says what moved it. `FINAL-depth.md` §2.6 verified that `autoAdjustIce` currently records
  provenance claiming a number came from this workspace when the PostHog query has no workspace
  predicate. Under this rule that is not a data bug, it is an **absorption violation**: an act was
  absorbed while its record lied about its cause, which voids the C1 bargain. It ranks with the
  depth lane's R-11 and must be fixed before any unattended re-ranking is defensible. ✓

### Test 3: we change the system prompt behind Writer, and specs start coming out differently

The uncomfortable one, and the rule's answer is neither of the two obvious ones.

- **Q1:** judgment only a human can catch? The change is our engineering call, but its *effect* on
  the user's output is a change in a thing they rely on with no oracle. Leaning yes.
- **Q2:** contained? **No.** The prompt is revertible; the specs already drafted, approved and built
  on are not.
- So Q1 and Q2 both point at a Call, and a Call is **absurd**: we cannot ask 500 workspaces to approve
  a prompt change, and a modal that says "we improved Writer, OK?" is consent theater, which is worse
  than absorbing it.
- **The rule's honest answer is the third thing, and it is available because Q2 asks about
  *undoing*, not about *knowing*:** absorbed at the moment, **on the record permanently, with the
  crew version attached to every artifact it made.** A user asking "why did Writer get worse in
  August" gets an answer from the record rather than from support. `PromptsPanel` and prompt
  versioning already exist in code.
- **And the second-order ruling this test produces, which belongs in the doctrine:** **a change to
  the machine never retroactively alters a past receipt.** The record is append-only and the seal
  makes that enforceable. A new Writer does not rewrite what the old Writer said it did.
- **Where the rule reaches its limit, stated honestly:** it does not decide whether a *materially*
  behaviour-changing prompt release deserves a workspace-level announcement. That is a release-comms
  question, not an absorption question, and I am not going to pretend the rule answers it. What the
  rule does decide is that the *record* must be able to answer it after the fact, which is the part
  that is ours. ✓

---

## 9. The five sentences, if this file is reduced to a card on a wall

1. **Absorb the labor. Prove the judgment.**
2. **Judgment goes to a Call. Escaping consequence goes to a Call. Everything else is absorbed.**
3. **Silence is a rendering decision, never a storage decision.**
4. **Nothing is absorbed unless it lands in "Done without you".**
5. **If a user reads a receipt and thinks "I would have stopped that", the line was in the wrong
   place. Move it.**

---

## 10. Deltas the ratified contracts should absorb

Everything below is an addition or correction to a document ratified tonight. Nothing here
contradicts them except the one item marked CORRECTION.

### 10.1 Additions to the engine-room-only word list (`FINAL-language` §2.8)

Correct technical words for the audience that opens that door, banned everywhere else:

`branch` · `commit` · `merge` · `conflict` · `rebase` · `CI` · `check run` · `workflow` ·
`pull request` (in prose; the link label stays legal) · `deploy` · `environment` · `staging` ·
`migration` · `schema` · `RAG` · `embedding` · `chunk` · `vector` · `rerank` · `top-k` ·
`context window` · `OAuth` · `scope` · `refresh token` · `rate limit` · `429` · `retry` ·
`prompt version` · `trust score`

### 10.2 Words deleted everywhere, code included

`repository` · `origin` · `upstream` · `remote` · `default branch` · `arc` (already ruled) ·
`environment` as a user-facing concept

### 10.3 Lexicon additions

| Concept | The one word | Definition | Banned beside it |
| --- | --- | --- | --- |
| Undoing a live release | **Roll back** | Putting the previous version back in front of customers. The change stays on the record and can roll forward again. | revert (taken, artifact versions), undeploy, unship, restore |
| The user's code, after connection | **your codebase** | The code your crew writes in. | repo (connect moment only), repository, project, source tree |
| The user's own automated tests | **your tests** | The checks your codebase already runs on every change. | CI, checks (Reviewer's verb), pipeline, build |

### 10.4 Action registry additions (`FINAL-language` §9.1)

| Act | Button | Helper | Toast |
| --- | --- | --- | --- |
| Approve a change into the codebase | `Approve` | `Your tests passed. Approving puts it in your codebase.` | `Approved. The change is in your codebase.` |
| Approve a release to customers | `Approve` | `Customers see it within minutes.` | `Approved. It is live. Publisher is drafting the note.` |
| Approve over an agent's objection | `Approve anyway` | `Reviewer's objection stays on the record.` | `Approved over Reviewer's objection. Both are on the record.` |
| Undo a live release | `Roll back release` | `Customers see the previous version within minutes.` | `Rolled back. The change is on the record and can roll forward.` |
| Grant an agent more rope | `Let it run` | `It stops asking for this. Everything it does lands in Done without you.` | `Granted. Critic runs teardowns without asking now.` |
| Keep an agent asking | `Keep asking me` | `Nothing changes.` | none, the row is the feedback |
| Restore a dark source | `Reconnect Linear` | `Scout picks up where it stopped.` | `Reconnected. Scout is reading the backlog now.` |

### 10.5 Corrections to files ratified tonight

| File | Item | Correction | Reason |
| --- | --- | --- | --- |
| `ia/FINAL-ia.md` §2.3 | Beliefs draft: "It **has started** running them without asking" | **CORRECTION.** Ship `It could stop asking, on bets over $50k impact. Your call.` with `[Let it run]` / `[Keep asking me]` | Autonomy widened by the machine and announced afterwards fails the containment test the rest of the contract depends on. Tighten silently, loosen by Call (§3.3 P2, §4.9) |
| `ia/FINAL-ia.md` §4.2 J7 | the `07 -> 01` return edge | Mark **mandatory, not decorative** | It is what stops the ordinals from teaching a pipeline (§5.2 Ruling A) |
| `language/FINAL-language.md` §9.4 | `Model` on card density | Confirm this is the **only** placement outside Settings | §4.5 |
| `language/FINAL-language.md` §9.6 | "a cost on a row the user never authorised" | Extend to a hard ban on any **live-ticking** cost anywhere | §4.6 |

### 10.6 Code fixes this file requires

| File | Line | Fix |
| --- | --- | --- |
| `src/components/studio/EngineRoomDisclosure.tsx` | 98-113 | `ShippedLine` renders `PR #418` and the raw branch outside the disclosure toggle. Both move inside. Outside becomes `Shipped Jul 14, 16:12.` |
| `src/components/studio/CiPanel.tsx` | 117-119, 199 | `CI passed` / `CI not green` / `CI not run` / `Refresh · re-reads CI` are calm-front mechanism strings. Front becomes `Your tests passed. 12 of 12.`; the panel itself is engine-room-only and may keep its technical labels there |
| `src/components/today/ExecutedCard.tsx` | whole file | Zero importers. Mount it. C2 makes the entire absorbed register illegitimate until it exists |
| `src/components/today/CostPerOutcomeChip.tsx` | whole file | Zero importers. Mount on the receipt footer per `FINAL-ia` §2.7; it is what makes cost read as an outcome rather than a bill |
| `src/components/connections/WorkspaceBindingsSection.tsx` | 184 | `Reconnect needed` names the mechanism's failure. Becomes a Call naming the lost evidence and its count |
| `src/lib/ai/tools/registry.server.ts` | 1069-1076, 1172-1183 | The migration block is correct and stays. Surface it as the ratified ceiling sentence rather than leaving it as a silent capability gap |

---

## 11. Handoff

### 11.1 What this file binds for the other two edges

- **Three registers, one rule, no fourth option.** If a proposal needs a mechanism to be
  "half-visible" or "shown subtly", it is a Call that someone is reluctant to write.
- **A Call is a full stop.** It is not a badge, not a toast, not a banner, not a dot. The machine
  waits. If a design wants a notification instead of a stop, the item was record-register all along.
- **The evidence door is a fixed shape and a fixed cost.** One click from the artifact, the same
  click everywhere, the count is the door (`on 9 signals`), never the list inline.
- **Adverse receipts get equal or greater detail than favourable ones.** This is a visual constraint,
  not just a copy one.
- **No live-ticking cost anywhere.**
- **Seven stages stay, ordinals are drawing-only, the return edge is mandatory, a disabled stage does
  not render.**
- **`repo` once, `your codebase` thereafter, `repository` never.**

### 11.2 What I deliberately did not decide

- Where "Done without you" lives, what it looks like, and how it is ordered. `FINAL-ia` §2.7 homes it
  in the gates tray; the anatomy is the interaction lane's.
- The visual treatment of a Call versus a receipt. I have specified that a Call stops and a receipt
  does not, and nothing else.
- Whether a materially behaviour-changing model or prompt release deserves a workspace announcement
  (§8 test 3). That is release comms, not absorption.
- The measured believability floors. `FINAL-language` §9.3 correctly demotes them to a pre-launch
  calibration task, and inventing them here would break the rule they serve.

### 11.3 The one thing I would fight for if only one survives

**"Done without you", mounted.** Every other ruling in this file is a naming decision that can be
argued. That component is the load-bearing beam under the entire absorbed register: it is the
difference between a product that does work on your behalf and a product that does work you cannot
see. It is 547 lines, it is written, it is the best trust artifact in the repo, and today it has zero
importers.
