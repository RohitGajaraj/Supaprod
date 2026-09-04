# GOV-A: the doctrine audit. Every place we ask a human, classified.

> _Created: 2026-07-29 · Last updated: 2026-08-03_

> Lane A of the governance re-examination, 2026-07-29. Reads all nine FINAL documents in
> `docs/planning/rebuild-2026-07/` plus `FOUNDER-VERDICT-2026-07-29.md`, against
> [`../GOVERNANCE-PRINCIPLE.md`](../GOVERNANCE-PRINCIPLE.md) and against the working tree.
>
> **What this file decides.** For every decision point in the nine doctrines: whether it stays a
> **Call**, becomes **Policy** (named, with its default), becomes **Silent with a receipt**, or
> **should not exist**. Then the rarer and more dangerous inverse: where a doctrine assumed autonomy
> and a human genuinely should be asked.
>
> **What it does not decide.** Layout, routes, copy, pixels, build order. Lanes B and C own the
> replacement surface and the sequencing. §10 is the handoff.
>
> **Method.** Every code claim below was read or run against the working tree this session. Where the
> principle document or a doctrine is wrong about the code, the corrected fact is carried, not the
> claim. §2 lists eleven corrections, six of which are against `GOVERNANCE-PRINCIPLE.md` itself.

---

## 0. THE FINDING, IN ONE PAGE

**124 decision points across the nine doctrines and the founder verdict, row by row in §5.
Deduplicated across documents, they are 48 distinct decisions:**

| | Count | Examples |
| --- | --- | --- |
| **(a) stays a Call** | **14 families** | keep or drop a bet · approve the spec · approve the design · go live · what the outcome meant · a schema change · Reviewer dissents · widen an agent's rope · the six modals |
| **(b) becomes policy** | **21 policies**, 9 of them backed by a column that already exists | autonomy per agent · blast radius · consequence classes · house rules · triggers · spend caps · who merges · source scopes · bench · fix budget · what I check on a change |
| **(c) silent with a receipt** | **9** | every mid-run tool call under an approved contract · a run that failed and changed nothing · a stall · a lost connector token · autonomy tightening |
| **(d) should not exist** | **4** | judging each raw signal · `Revert version` and `Roll back release` as Calls · the `off` tool mode |

Three findings outrank the table.

**Finding 1. The doctrines re-inserted a gate the code had already dissolved.** `resolveToolMode`
(`src/lib/ai/loop.server.ts:153-211`) contains AGT-02, a plan-level consent scope: once the mission's
governing Outcome Contract is approved (`prds.status === "approved"`), every **reversible** step
under it is pre-consented and no longer takes a per-step confirm. That is the founder's principle,
shipped, guarded four ways, and unit-tested. `ia/FINAL-ia.md` §4.2 J4 then draws step 3 as a gate:

> *"| 3 | **Gate** (inline, mid-run) | **H** | Approve a tool call the agent needs. Resume."*

The spec approval at J3 step 4 **is** the authorization. Asking again at J4 step 3 is asking twice
for the same consent. The correct model is already in the file: **one approval authorizes a scope of
reversible work; the floors keep the irreversible boundary.** Everything else in this audit is
downstream of that sentence.

**Finding 2. `edge/FINAL-edge.md`'s Call register conflates two different things, which is why it
reads as dense.** Its 14 Calls include four rows that are not the machine stopping to ask, they are
controls a human may invoke whenever they like: `Revert an artifact version`, `Roll back a live
release`, `Stop`, `Try again`. The doctrine files them as "Call, always available", which is a
category error: *always available* is the definition of a control, and *the machine stops and waits*
is the definition of a Call. Separating them removes a third of the apparent gate count without
changing a single safety property.

**Finding 3. The house rule, the one object the ratified lexicon already calls policy, is enforced
only by a sentence in a prompt.** `getActiveHouseRulesForWorkspace` -> `renderHouseRulesBlock`
(`loop.server.ts:387-388`) injects approved rules as text into the system prompt. There is no
predicate, no pre-tool check, no execution-path opinion. `edge/FINAL-edge.md` C3 names this exact
failure and attributes it to Replit:

> *"**C3. A constraint that lives only in a prompt is not a constraint.** ... Replit's agent deleted
> a production database during a declared code freeze because the freeze lived in the instructions
> and the execution path had no opinion."*

We are the Replit example. The product's own policy object is advisory. **No gate may be converted
to a house rule until house rules compile to a predicate in the path.** This is the hard gate on the
whole re-frame and it is engineering, not design.

### The replacement sorter

`edge/FINAL-edge.md` §0 asks two questions before the act. Keep both, and put a third **in front** of
them, because the first question is not "must a human answer" but "did a human already answer".

```
BEFORE THE ACT

  Q0  THE STANDING-ANSWER TEST                              <- NEW, and it runs first
      Has the user already answered this, in advance, for this class of act?
      (an approved contract, a house rule, a consent class, a tool mode,
       a cap, a connected scope, a granted graduation)
        yes -> ACT. The receipt names the policy that authorized it.

  Q1  THE ORACLE TEST      (unchanged, edge §0)
      Can the machine be wrong here in a way only a human can catch?
        judgment -> CALL

  Q2  THE CONTAINMENT TEST (unchanged, edge §0)
      If it turns out wrong, can we undo it completely from inside the
      product, in one act, without asking anyone outside to cooperate?
        no -> CALL

  Q2b THE POLICY-ELIGIBILITY TEST                           <- NEW
      If Q1 and Q2 both cleared it to a Call: is this the SAME question we
      will ask again? Is it answerable in advance without knowing the
      instance?
        yes -> it is a POLICY. Ask it once, in the boundary surface, with a
               stated default. Every later instance is silent with a receipt.
        no  -> it is a CALL. It stays.

AFTER THE ACT

  Q3  THE CAUSAL TEST      (unchanged, edge §0)
        yes -> ON THE RECORD.   no -> SILENT.
```

Q2b is the whole audit compressed. A Call that recurs with the same answer is a policy the product
failed to notice. `GOVERNANCE-PRINCIPLE.md` says the same thing from the other end:

> *"If the queue is long, that is a **policy failure to surface**, not a workload to render."*

### The three floors that Q0 may never clear

Stated once so nothing below relitigates them, and stated as the founder stated them:

1. **Irreversible outside the product.** Production traffic sees it, money moves, a credential
   changes hands, another organisation's work now contains it, data is gone.
2. **Judgment with no oracle.** Which bet, whether this is good enough, what the outcome meant.
3. **A boundary the user did not set is not policy.** Every default in §7 renders in words, is
   explained, and is changeable in one click, or it is our permission model in a costume.

`agents/FINAL-agent-presence.md` §2 already wrote the entire legal gate list, a day before the
principle was stated, and nobody in the other eight documents used it:

> *"**3. You are here for the three calls your crew will never make: what is worth building, what is
> good enough, and what goes live.**"*

Three. Not fourteen, not ten families, not one per step. That sentence is the corrected frame and it
is already ratified, already in the crew doctrine, already provable against
`HIGH_RISK_FORCE_REVIEW`.

---

## 1. WHAT THE DOCTRINES ACTUALLY CONTAIN

Counted, per document, before classification.

| Doctrine | Decision points | Blocking gates | Policy-shaped | Controls miscounted as gates |
| --- | --- | --- | --- | --- |
| `edge/FINAL-edge.md` | 29 | **14 Calls** | 6 | 4 |
| `agents/FINAL-agent-presence.md` | 18 | 6 | 8 | 4 |
| `shell-question/FINAL-shell-ruling.md` | 16 | 12 (the Judge slot on all 14 forms) | 1 | 0 |
| `interaction/FINAL-interaction.md` | 12 | 6 modals + 3 verdicts | 2 | 1 |
| `ia/FINAL-ia.md` | 16 | 8 journey gates + 10 queue families | 2 | 0 |
| `depth/FINAL-depth.md` | 7 | 3 | 2 | 0 |
| `language/FINAL-language.md` | 8 | vocabulary only | 3 | 0 |
| `adaptive/FINAL-adaptive-layout.md` | 5 | the gate as layout invariant I1 | 0 | 0 |
| `clicks/FINAL-click-register.md` | 10 | audit findings, all on the approve path | 0 | 0 |
| `FOUNDER-VERDICT-2026-07-29.md` | 3 | 0 | 1 | 0 |

**The click register is evidence for the principle and nobody read it that way.** Ten of its
worst findings sit on the approve path: two keyboard grammars that approve the wrong item
(`L-24`, `L-25`), a digit that approves and navigates at once (`D-06`), a letter that approves and
opens `/admin` (`D-08`), 18 failure handlers that render a green success toast on a failed approval
(`L-02`), two divergent decide paths (`L-29`), a "turns on with the next release" string on a
shipped send-back (`L-05`). The approve path is the most defect-dense path in the application
**because it is the most over-built**. A queue nobody can operate correctly is not governance.

---

## 2. CORRECTIONS. SIX ARE AGAINST THE PRINCIPLE DOCUMENT ITSELF

The brief said to verify every claim and carry the corrected fact. Eleven.

| # | The claim | The verified fact | Consequence for the re-frame |
| --- | --- | --- | --- |
| **P1** | `GOVERNANCE-PRINCIPLE.md`: *"classifies every one of 50 tools"* | **46** tool definitions in `registry.server.ts` (counted this session; `agents/FINAL-agent-presence.md` §1.3 C2 already corrected this and the principle repeated the stale number) | Cosmetic, but the principle is being quoted as ground truth and must be right |
| **P2** | `GOVERNANCE-PRINCIPLE.md`: modes are `auto` / `confirm` / **`off`** | Modes are `auto` / `confirm` / **`review`** (`trust.server.ts:17`). `review` means *queue and show me*, not *disabled*. `"off"` exists in exactly one place, `ToolModeSchema` in `agent_loop.functions.ts:176`, is filtered out of the only UI that lists tools (`ControlsPanel.tsx:317`), and is **unhandled by `resolveToolMode`** | See P3. Every policy sentence in the product must say `review` correctly, per the agents doctrine |
| **P3** | implied: `off` disables a tool | **`off` is a permissive failure.** `resolveToolMode` passes it through unchanged, and the loop's gate is `if (isWrite && (mode === "confirm" \|\| mode === "review"))` (`loop.server.ts:1150`). A tool at `mode:"off"` and `enabled:true` **executes with no gate**. Unreachable from today's UI, reachable from the server function | A live permissive write path. Delete `"off"` from `ToolModeSchema` or handle it as a refusal. Correctness, not design |
| **P4** | `GOVERNANCE-PRINCIPLE.md`: *"`toolRisk` forces high-risk tools to confirm regardless of arc, so autonomy can never be granted past a hard floor"* | True with **two exemptions the principle must carry**: `BUILD_LANE_AUTONOMOUS` = {`studio.stage`, `studio.commit`, `studio.pr.open`} skips the demotion entirely (founder ruling 2026-07-08), and `studio.fix.commit` skips it and runs at its seeded mode (`loop.server.ts:170-177`) | The build lane is already autonomous by ruling. The doctrines never say so, and `edge/FINAL-edge.md` §3.1 renders `commit` as a receipt without noting it is unattended by design |
| **P5** | `GOVERNANCE-PRINCIPLE.md`: *"**Agents earn autonomy from their record.**"* | `loadAgentArc` returns **`"trusted"`** when nothing is set (`trust.server.ts:249-262`, founder ruling 2026-07-08 SW-7). The dial exists to **tighten**. What is earned per (agent, tool) is the removal of a gate | The flattering story is banned by `agents/FINAL-agent-presence.md` G8. The principle repeats it. The true story is stronger and is already written in agents §8.1 |
| **P6** | `GOVERNANCE-PRINCIPLE.md`: *"the loop's fallback is `confirm` (`loop.server.ts:1103` notes the default `?? "confirm"`), which quietly makes permission the default"* | **The line is 1146, and the reading is wrong in the founder's favour.** RF-08 (comment at `:1118-1132`) made absence mean *"not enabled for this agent"*, and the loop **refuses the call outright** at `:1125-1139` before the fallback is ever reached. `?? "confirm"` is unreachable for every non-control-flow tool | **The tell the principle names is not the tell.** The real posture is set by seeded `agent_tools.mode` plus `resolveToolMode`'s low-risk auto-clear and AGT-02 clause. The code is already policy-first. The doctrines are not. This strengthens the founder's case rather than weakening it |
| **P7** | `GOVERNANCE-PRINCIPLE.md` lists **house rules** as an existing policy layer | They exist as rows, as a queue family, and as a lexicon entry. They are enforced **only by prompt injection** (`loop.server.ts:387-388`). No predicate, no path check | Finding 3 in §0. Hard gate on the whole re-frame |
| **P8** | `edge/FINAL-edge.md` §3.5: *"Narrowing an agent's rope after a bad outcome \| **silent, on the record** \| safety needs no permission \| It happens."* and `agents` §8.1: *"a background nudge that only ever moves observing -> proving -> trusted"* | **Nothing tightens automatically today.** The only writer of `agent_autonomy` is `setAgentArc` (`trust.functions.ts:46`), a human click. `suggestArc` computes a suggestion that nothing applies | Both sentences are copy ahead of wiring. Either build the auto-demotion (it is the safe half of R-13 and it is what makes autonomy defensible) or delete the claim |
| **P9** | `agents/FINAL-agent-presence.md` §1.3 C11: *"there is no function that deletes an `agent_tool_modes` row"* | **Confirmed.** `trust.functions.ts:115` upserts. No delete anywhere in `src/` | Granting is one-way. A policy layer with no withdrawal is not a policy layer. G4/B3 is load-bearing, not polish |
| **P10** | `edge/FINAL-edge.md` §3.1 / §8.1: merge is a Call *"always"*, and the ceiling copy *"Your crew opens the pull request. A human merges it."* | `AUTO_SHIP_ENABLED` (`STUDIO_AUTO_SHIP=1`, `loop.server.ts:91`) makes `studio.pr.merge` follow the agent's trust arc instead of being review-pinned. Default off, but it is a **wrangler secret**, not a user setting | A boundary set by an environment variable is not a boundary the user set. Principle clause 3. Promote it to a named workspace policy with the current behaviour as its default |
| **P11** | `GOVERNANCE-PRINCIPLE.md`'s inventory of the existing policy layer | **Six live policy layers are missing from it**, listed in §3 | The machinery is larger than the principle claims, which makes the argument easier, not harder |

---

## 3. THE POLICY LAYER THE PRINCIPLE DID NOT COUNT

Six more, all shipped, none named in any of the nine doctrines.

| Layer | Where | What it already does | State |
| --- | --- | --- | --- |
| **Consequence classes** | `src/lib/consent-classes.ts` (RPT-36) | Partitions the tool set into four classes with a **default posture each**: read-only -> `auto`, internal write -> `confirm`, stakeholder-facing -> `confirm` ("draft to you"), repo write / irreversible -> `review`. Its own headline is **`"Supaprod drafts. You release. Nothing stakeholder-facing sends itself."`** | **Rendered read-only** in the Engine Room (`ControlsPanel.tsx:751-781`). **There is no writer.** The user can see the classes and cannot set them. This is the boundary surface, already designed, three quarters built, and absent from every doctrine |
| **Blast-radius cap** | `agents.max_tool_risk`, `setAgentToolCap`, `capToolsByRisk` (`loop.server.ts:541-546`) | Removes over-cap tools **from the prompt entirely**. The agent cannot see them, so there is nothing to gate | **Strictly better than a gate** and the best existing model for pre-authorization: it changes what is possible instead of interrupting what is attempted |
| **Event subscriptions** | `event_subscriptions`, `reactor.functions.ts:46-120` | Per (event type, target agent) with `approval_mode: "auto" \| "confirm"`, a `filter`, and an `is_default` flag. This is a trigger-scoped policy row and it is the most policy-shaped object in the codebase | Live, CRUD-able in the Engine Room, **named in zero doctrines** |
| **Spend and token caps** | `mission_spend_cap_usd`, `mission_token_cap`, enforced at `runtime.server.ts:226-238` | Fail-closed refusal in the model chokepoint, with a typed `capExceeded` reason | The reference implementation of a policy enforced in the path |
| **Governed publish** | `announcements.functions.ts`, the `publish_announcement` SECURITY DEFINER RPC | Owner/admin only, enforced in the server function **and again at the DB layer via RLS** | The second reference implementation, and the answer to "what does an enforced house rule look like" |
| **Bench** | `agents.enabled`, honoured twice by the runtime (`handoff.server.resolveAgent`, `agents.functions.runAgent:166`) | Turns an agent off at the runtime | **No write path, no UI.** The switch that exists in Settings (`settings.tsx:2689-2721`) is `role="switch"` and only fires a toast (`clicks` X-19). The cheapest policy control in the product is a decoration |

---

## 4. THE CLASSIFICATION KEY

| Class | Meaning | Test it must pass |
| --- | --- | --- |
| **(a) CALL** | Stays a blocking human decision | Fails Q2 (irreversible outside the product) **or** fails Q1 (judgment with no oracle) **and** fails Q2b (not the same question twice) |
| **(b) POLICY** | The user answers once, in advance, in the boundary surface. Named, with a stated default | Passes Q2b: the same question, answerable without the instance |
| **(c) SILENT + RECEIPT** | It happens. It lands in "Done without you". The receipt carries the policy that authorized it and a one-click `Ask me next time` | Passes Q0 or clears Q1 and Q2 |
| **(d) DELETE** | Should not be asked at all, by anyone | The human's answer changes nothing, or the product should not have the capability |

`b -> a` means the policy governs the common case and a named residue stays a Call.
Rows marked **KEEP** are correct as written and are listed so nobody relitigates them.

---

## 5. THE TABLE. EVERY DECISION POINT, CLASSIFIED

### 5.1 `edge/FINAL-edge.md` (29)

| ID | Decision point, quoted | Now | Verdict | Policy name and default, or why it stays |
| --- | --- | --- | --- | --- |
| E-01 | §3.1 *"Merge \| **Call** \| Q2 fails: other people's work now contains it"*; §8.1 *"**The human merge.** The ceiling line stands verbatim and proudly: `Your crew opens the pull request. A human merges it.`"* | Call | **b -> a** | **`Who merges`**, per product. Default **`A human merges`** (today's behaviour, ceiling copy intact). Settable to `Merge when your tests pass and Reviewer agrees`. The machinery exists as `AUTO_SHIP_ENABLED`; promote the env secret to a policy row (P10). Residue (a): tests red, Reviewer dissenting, or the change touches a path the user marked protected. §8.1's real argument is not irreversibility, it is *"absorbing somebody else's governance, which is not our right"* - and the answer to that is that the customer sets the rule, not that we ask them every time |
| E-02 | §3.1 *"Semantic conflict (two runs, one intent) \| **Call** \| Q1 fails: which is right is judgment"* | Call | **a KEEP** | No oracle. Note the residue is already tiny: `builder_file_claims` makes most of these structurally impossible, *"which is the product already voting for absorption"* |
| E-03 | §3.1 *"Revert an artifact version \| **Call**, always available"* | Call | **d as a Call** | Category error. *Always available* is a control, not a Call. It never blocks anything, no machine waits on it. Remove from the Call register; keep as an affordance with a consequence line |
| E-04 | §3.1 / §3.3 *"Roll back a live release \| **Call**, permanently available"* | Call | **d as a Call** | Same. `stageRollback` is non-destructive and forward-only, so this is a control with a confirm, not a gate. Keep the confirm, delete the classification |
| E-05 | §3.1 *"The repo itself \| **standing**, once"*; §5.2 *"`Build needs a repo first.`"* | once | **b KEEP** | **`Codebase`**. Default: none set. The `[Let us set one up]` door means a user may never meet the question |
| E-06 | §3.2 *"A failure after the budget \| **Call** \| Q1 fails: the machine gave up"* ... *"The change is not in your codebase and nothing shipped."* | Call | **c** | Its own copy disproves it: **nothing shipped, so nothing waits on the answer.** It is a receipt with controls (`Try again`, `Send back`, `Take it over`). Policy behind it: **`Fix budget`**, default **3 attempts**, already real as the changeset fix budget |
| E-07 | §3.2 *"Reviewer dissents \| **Call**, and the highest-value Call in the product \| Q1 fails: two agents disagree with no oracle"* | Call | **a KEEP**, with a frequency policy | Survives untouched. Optional policy **`When Reviewer objects`**, default **`Bring it to me`**, alternative `Send it back to Engineer once, then bring me the second failure` |
| E-08 | §3.2 flaky test *"`[Stop retrying it] [Keep retrying]`"* | Belief + 2 buttons | **b** | **`Retry flaky checks`**, default **on, one retry**. The Belief is the receipt that offers to change the policy, which is exactly the right shape and should be the template for every other Belief |
| E-09 | §3.3 *"Production deploy \| **Call**, always, no exception \| Q2 fails: customers"* | Call | **a KEEP, hard floor** | Floor 1. The only legal policy here is a **narrowing** one the user writes with a named scope (an incident hotfix path), never a global switch. Note the shape it already has in code and copy it everywhere: `deployments.functions.ts:229` writes an `agent_approvals` row **as a receipt for a human-initiated act**, not as a queued question. *"The promote receipt: a decided approval on the ledger."* A Call the human reaches for beats a Call that reaches for the human |
| E-10 | §3.3 *"Migrations in the user's repo ... **A schema change is a Call at every autonomy level and is the one Call that can never be granted to `Runs on its own`.**"* | Call | **a KEEP, hard floor** | Best-written floor in the set. Keep verbatim, including the ceiling sentence for today (`registry.server.ts:1069-1076,1172-1183` blocks it, so the sentence is true) |
| E-11 | §3.4 *"Model choice \| **silent**, named only on the Call that authorizes spend, configurable in Settings ... `Prefer speed` / `Prefer depth` / `Use my own key`"* | setting | **b KEEP** | **`Model preference`**, default `Prefer depth`. Already correct, already policy, and it is the only row in the whole edge table that was written in the corrected frame |
| E-12 | §3.4 *"Credits \| **state, and a Call only at the threshold** \| Q2: running out stops their crew"* | Call at threshold | **c + control** | Not a Call: nothing is waiting on a judgment, the crew has stopped. It is a receipt plus a purchase door. Policy behind it: **`Spend cap`**, per run and per month, already enforced fail-closed at `runtime.server.ts:226-238` |
| E-13 | §3.4 stall *"At 8 minutes: `Nothing has moved for 8 minutes.` plus `Stop` and `Try again`"* | 2 buttons | **c KEEP** | A receipt with controls. Correctly written. Do not count it in the gate budget |
| E-14 | §3.4 *"Terminal run failure \| **Call** \| Q1 fails: what now is judgment"* ... *"`Nothing was changed.`"* | Call | **c** | Same as E-06. Nothing crossed a boundary, so nothing blocks. Three controls on a receipt |
| E-15 | §3.5 *"The current setting \| **a setting, in diverged labels** \| `Runs on its own` / `Asks me first` / `I check the output`"* | setting | **b KEEP, and promote** | **`Autonomy`** per agent, backed by `agent_autonomy.arc`. Default **`trusted`** = *"Acts, and asks before anything it cannot undo"* (P5). This is the central policy object and today it is a Settings row. It becomes a first-class surface |
| E-16 | §3.5 *"Narrowing an agent's rope after a bad outcome \| **silent, on the record** \| safety needs no permission"* | silent | **c KEEP, with two conditions** | Correct, and it is the safe half of R-13. Conditions: (i) it must render on the boundary surface, not only in a receipt, because the machine is overriding a boundary the human set; (ii) it must be reversible in one click. **And it does not exist yet** (P8) |
| E-17 | §3.5 *"Widening an agent's rope \| **Call**, always \| Q2 fails: unattended work cannot be un-run"* ... *"`It could stop asking, on bets over $50k impact. Your call.`"* | Call | **a KEEP, and promote to the signature moment** | This is the human doing the job the principle assigns them: setting the boundary. It is the one Call in the entire set that gets **more** important under the re-frame |
| E-18 | §3.5 *"Scopes \| **a decision once, at connect, phrased as outcomes** \| Q2: the user's data in someone else's system"* | once | **b KEEP** | **`What each source may do`**, default read-only, phrased as outcomes (`Scout reads it on the next sweep. Nothing is written back.`). Correct as written |
| E-19 | §3.5 *"A refresh that fails \| **Call**, whose subject is lost evidence"* ... *"`[Reconnect Linear]`"* | Call | **c + control** | Its own justification is a notification argument: *"The number is the entire justification for interrupting."* Nothing is waiting on a judgment; the crew needs a credential. A receipt with a repair button, escalating to the Discover truth rule (§3.5's dark-source clause, which is correct and stays) |
| E-20 | §3.5 *"House rules \| **Call, and named on every receipt they cause** \| the user wrote them"* ... *"`Engineer stopped because of your rule: nothing merges on a Friday.`"* | Call | **b, and this is THE policy object** | **`House rules`**. Default: none. The receipt naming the rule that fired is the single best idea in the edge doctrine and it is what makes policy legible. **Blocked on Finding 3**: today the rule is prompt text (P7). It must compile to a predicate before any gate is converted into one |
| E-21 | §4.3 the contradiction interrupt *"`You decided the opposite in March. It cost two weeks.` / `[Do it anyway] [Show me what happened]`"* | Call | **a KEEP, renamed** | It is not a Call and it must never enter the tray. It is an **interposition**: fired by the record, at the moment of a human act, one per precedent, never queued, never counted. It is the record exercising the human's own prior policy, which is the purest expression of the principle in the set |
| E-22 | §4.2 *"**Tighten silently, loosen by Call.** Safety needs no permission."* | law | **KEEP verbatim** | The asymmetry is the principle's own. It is `depth/FINAL-depth.md` R-13 and it survives the re-frame unchanged |
| E-23 | §0 *"If a user reads a receipt and thinks *'I would have stopped that'*, the item was misclassified and moves from record to Call. Ship that sentence as a one-click affordance on every receipt." | affordance | **b, upgraded** | Under the re-frame this is the **primary policy-authoring gesture**, not a bug report. The button is `Ask me next time` and it writes a scoped house rule, not a register reclassification. It is the same object as `agents` §8.3's claw-back and they should be one component |
| E-24 | §8 B11 *"`Try again` after a terminal failure never costs credits"* | pricing | **b** | **`Failed runs`**, default **refunded**. Billing policy, not a decision point. Ship the policy before the copy, as the doctrine already says |
| E-25 | §9 Test 2 *"A routine may not Drop, at any autonomy level. What it may do instead is re-rank"* | capability constraint | **KEEP, and hold it up** | The best evidence in the whole set that the rule is real, *"because it produced a constraint on a feature rather than a label for one."* This is what Q2b looks like when it is applied honestly: the answer to a recurring judgment question is to remove the capability, not to queue the question |
| E-26 | §12.3 *"Approve over an agent's objection \| `Approve anyway`"* | verb | **a KEEP** | Part of E-07. The one legal deviation from the verdict triad, correctly argued |
| E-27 | §11 the Evaluability Test | test | **KEEP, and widen** | *"Can the person we are asking actually evaluate this ... If not, the gate is theatre."* It now also becomes the **policy test**: can the person we are asking set this boundary once, with the information a settings screen can carry? |
| E-28 | §10.1 `HANDOFF_EVIDENCE_GATE` default OFF | gap | **enforcement, not a decision** | edge already rules it correctly. Carried here because it is the same class as Finding 3: a rule that lives in a prompt |
| E-29 | §2.2 / C1 *"Silence is a rendering decision, never a storage decision"* | law | **KEEP** | The clause that makes the whole re-frame survivable. Autonomy is paid for with evidence |

### 5.2 `agents/FINAL-agent-presence.md` (18). The signature moment is the rework.

| ID | Decision point, quoted | Now | Verdict | Policy name and default, or why it stays |
| --- | --- | --- | --- | --- |
| A-01 | R10 *"**The signature moment is the Commit:** an approval does not vanish into a toast, it becomes a receipt, draws an arrow to whoever picks the work up, moves the Bar, and moves the Spine. 1.2 seconds, four regions, one causal chain."* §9: *"**Approving something must visibly set the crew in motion.**"* | signature moment | **STRUCTURAL REWORK** | The craft survives and the subject changes. Under the principle the ceremony must fire on **any human act that changes what the crew may do**: granting rope, writing a house rule, taking rope back, approving a contract. Not on approving a step. Beat 1's argument is untouched by the change and is the reason to keep it: *"An approval that erases itself teaches the user that their judgment left no trace."* A **boundary** that erases itself teaches the same thing, and a boundary is used a hundred times |
| A-02 | §8.2 the graduation card, *"`Reviewer wants to stop asking.`"* ... *"`[ Let it ] [ Not yet ]`"* | gate family | **a, PROMOTED to the signature moment** | Exactly as `GOVERNANCE-PRINCIPLE.md` rules: *"The signature moment becomes **an agent earning autonomy** ... It is also uncopyable, because it is computed from this workspace's own record."* Ship the card verbatim. It is the only moment in the product where the human's leverage visibly increases |
| A-03 | §8.3 *"Where the claw-back lives is the design decision that matters: not in settings. On any receipt of unattended work, as a quiet `ask me next time`."* | control | **b, and it is E-23** | One component, two entry points. Requires `revokeTrustGraduation` (G4/B3), which does not exist (P9). **Policy without withdrawal is not policy**, so this is a correctness item |
| A-04 | §5.4 Permissions: the arc, 4 positions | setting | **b** | = E-15 |
| A-05 | §5.4 *"Blast radius (`low`/`medium`/`high`/none) \| `setAgentToolCap` -> `agents.max_tool_risk` \| `capToolsByRisk` removes over-cap tools from the prompt entirely - the agent cannot see them"* | setting | **b, and the best model in the product** | **`How far each agent may reach`**, default **unrestricted** for the crew's own stage tools. Pre-emptive, not interruptive. A policy that changes what is possible beats a gate that interrupts what is attempted, every time |
| A-06 | §5.4 tool matrix, this agent's tools x auto/confirm/review | setting | **b, restructured** | Set it **per consequence class first** (`consent-classes.ts` already models four with defaults, §3), per tool only as a named exception. 46 tools x 13 agents is not a boundary a human can set; four classes is |
| A-07 | §5.4 Playbooks, `toggleAgentSkill` -> `agent_disabled_skills` | setting | **b KEEP** | Already correct |
| A-08 | §5.4 *"**Bench / bring back** \| **new B10**: `setAgentEnabled` -> `agents.enabled` \| **already enforced by the runtime in two places**"* | setting | **b KEEP** | *"Bench is the cheapest large trust win available."* Correct, and it is more true under the re-frame: turning an agent off is policy, and today the switch is a decoration (`clicks` X-19) |
| A-09 | §5.4 *"The matrix draws safety floors as **locked rows with their reason on the row** ... `merge a pull request \| always asks you \| locked - never graduates`"* | display | **KEEP, and it is the boundary surface's core** | *"A locked control that explains itself builds more confidence than an unlocked one."* This is what the boundary surface looks like: the floors visible, explained, and provably unmovable |
| A-10 | §5.1 *"`Stop everything` is only rendered when every live run can actually be stopped."* | control | **KEEP** | A control, not a gate. The dead-control rule is right and G7/B12 stays a hard gate |
| A-11 | §5.2 the Floor's `Stop all`, per-run stop, `Fix and re-run from here` | controls | **KEEP** | Controls |
| A-12 | §9 *"**Send back is the counter-ceremony, and the proof that judgment steers.** `sendBackApprovalItem` requires a note"* | verdict | **a KEEP, and un-gate it** | The highest-value human input in the product because it is the only one that teaches. **Under the re-frame it must be reachable without a gate**: you should be able to send back work the crew already finished, not only work it stopped on. That converts a blocking gate into a non-blocking correction, which is the principle applied to the single most valuable interaction |
| A-13 | §9 *"`Decline \| Killed, and the reason goes to the Brain as a decision not to do it.`"* | verdict | **a KEEP** | Judgment |
| A-14 | R11 / §10.2 *"**Sign-up completes, the room paints, and one real Researcher run starts immediately, unasked.** ... It costs credits, it writes real `signals` rows"* | autonomy | **INVERSE FAILURE, see §6 INV-1** | Right instinct, missing disclosure. A boundary the user did not set |
| A-15 | §2 *"**You are here for the three calls your crew will never make: what is worth building, what is good enough, and what goes live.**"* | doctrine | **KEEP, and make it the gate budget** | Three. This sentence is the corrected frame, ratified a day early, and it is the number every other document should have been held to |
| A-16 | §12 G2 the graduation cooldown, `TRUST_RAMP_COOLDOWN_MS = 30d` | hard gate | **KEEP** | *"an agent that respects 'not yet' is a colleague; an agent that asks again next Tuesday is a nag."* Under the re-frame this is load-bearing: **`Not yet` is itself a policy** and it must persist |
| A-17 | §12 G4 `revokeTrustGraduation` ships with the first graduation card or the card does not ship | hard gate | **KEEP, upgraded** | = A-03 |
| A-18 | §15 *"**The delegation gesture that nobody else has: `Hand to...`**"* | control | **KEEP** | A control, and the first path that will populate `evidence_ids` |

### 5.3 `shell-question/FINAL-shell-ruling.md` (16). The Judge slot on all fourteen forms.

| ID | Decision point, quoted (§2.4 "Judge slot asks") | Now | Verdict | Policy name and default, or why it stays |
| --- | --- | --- | --- | --- |
| S-01 | §3.2 #3 *"What is being asked of me about this thing \| the Judge slot, a permanent frame slot, empty not absent"* | permanent region | **KEEP the slot, reframe the region** | A slot that is empty most of the time is honest. The problem is #6, not #3 |
| S-02 | §3.2 #6 *"What is waiting on me anywhere ... five labelled rail rows with live counts"* | permanent count | **b, reframed** | `GOVERNANCE-PRINCIPLE.md`: *"it should usually read **zero**, and a healthy product is one where it does."* The primary number on that rail becomes **what the crew did on its own**, and `Your call` is the exception number beside it. Same query, inverted emphasis |
| S-03 | Signal: *"Is this real? Keep / Ignore"* | Judge slot | **d** | Asking a human to judge each raw signal is the queue disease in its purest form. Policy: **`What reaches you`**, default **only patterns with two or more corroborating sources**. Everything else is kept, searchable, never asked about |
| S-04 | Pattern: *"Does this add up? Promote / Split / Drop"* | Judge slot | **b -> a** | Policy: **`Promote a pattern to a bet`**, default **at three corroborating sources**. The human judges bets, not patterns. Residue (a): a pattern that contradicts a standing belief, which is E-21 |
| S-05 | Bet: *"Keep or drop?"* | Judge slot | **a KEEP** | Floor 2. *"what is worth building"*, the first of the three legal Calls. `edge` §6 already names `Bet` as *"the one stage the product will never do for you"* |
| S-06 | Call: *"Approve / Send back / Decline / Snooze"* | Judge slot | **KEEP the verbs, shrink the population** | The verdict triad is ratified and survives. The re-frame is about how many rows wear it |
| S-07 | Spec: *"Ship this? Approve / Send back"* | Judge slot | **a KEEP, and it is the authorization** | Floor 2, *"what is good enough"*. **And it is the policy act for everything downstream**: AGT-02 already pre-consents the reversible work under an approved contract (`loop.server.ts:136-152`, `:198-207`). One approval, one scope. Say so on the card: *"Approving this authorizes the reversible work in it. Nothing irreversible runs without you."* |
| S-08 | Prototype: *"Does this look right?"* | Judge slot | **a KEEP, un-blocked** | Taste, no oracle. But it must not block Build: Build proceeds on the approved spec and `checkDesignParity` reports against the mockup afterwards. A judgment that arrives late is still judgment; a judgment that stops thirteen agents is a queue |
| S-09 | Run: *"mid-run tool approvals, inline"* | Judge slot | **c** | Finding 1. Dissolved by S-07 for reversible work. The residue is the four `PAUSE_ON_APPROVAL_TOOLS` |
| S-10 | Step: *"approve / deny when the tool is `confirm`"* | Judge slot | **c for reversible under contract; a for the four pause tools** | `PAUSE_ON_APPROVAL_TOOLS` = {`studio.commit`, `studio.pr.open`, `studio.pr.merge`, `delegate.openhands`} (`loop.server.ts:74-79`) is the real list, and two of the four (`commit`, `pr.open`) are already `BUILD_LANE_AUTONOMOUS` by founder ruling. The honest residue is **two**: merge and the external hand-off |
| S-11 | Change: *"Commit 8 hunks / Send back with a note"* | Judge slot | **b -> a** | `edge` §11 already rules this gate a failure: *"the merge gate on a diff fails"* the Evaluability Test. Policy: **`What I check on a change`**, default **the tests and the spec conformance, not the hunks**. Default all hunks in. The hunk control stays as an escape hatch for an engineer, never as the ask |
| S-12 | Preview: *"Ship it?"* | Judge slot | **a KEEP, hard floor** | = E-09 |
| S-13 | Outcome: *"Did it work?"* | Judge slot | **a KEEP** | Judgment with no oracle, and honestly human-attested (`ia` J7: *"the UI says 'record how it landed', never 'we measured how it landed'"*) |
| S-14 | Learning: *"Keep this belief?"* | Judge slot | **b** | Policy: **`Beliefs`**, default **a learning becomes a belief when it is corroborated twice**, every belief carries `Stop using this`, and a weekly digest names what was added. Today `memory_candidates` is *"a gate AT THE WRITE"* (`memory-candidates.functions.ts:7`), which is the wrong side of the act |
| S-15 | §3.1 *"the classification renders as a one-line stamp under the composer ... Plus a one-key undo for the first five seconds of a fresh run."* | pre-commit | **c, and it is the model** | **Pre-commit visibility plus cheap reversal, instead of a permission prompt.** This is the single best-designed governance interaction in the nine documents and it is the general pattern the rest of the product should adopt |
| S-16 | D4 *"**A call renders as the Judge slot on the thing it is a call about.** ... **The tray survives** as the `g` pane"* | placement | **KEEP** | The right home for the residue, and it fixes a live defect (`chat.ts` has zero occurrences of `approval`) |

### 5.4 `interaction/FINAL-interaction.md` (12). The modal whitelist needs no rework.

| ID | Decision point, quoted | Now | Verdict | Policy name and default, or why it stays |
| --- | --- | --- | --- | --- |
| I-01 | §6.5 *"Each carries `in` or `out`. **Default is `in`**, because the machine already argued for it and a wall of undecided checkboxes taxes the common case."* | default | **KEEP, and hold it up** | The principle in miniature, written a day early. Every proposal in the product should default to the machine's answer |
| I-02 | §6.5 *"**4. The commit** \| One button naming its blast radius: `Approve 8 changes`, never `Apply`."* | verdict | **b -> a** | = S-11 |
| I-03 | §6.5 *"**5. The send back** \| ... `Send back` returns it to the crew with your reason, and the work is kept."* | verdict | **a KEEP** | = A-12 |
| I-04 | §6.5 *"**The dissent rule.** Dropping a unit always asks for one optional line ('why not?'), inline, never a modal, never blocking. ... **Every dissent teaches the Brain.**"* | non-blocking input | **b, upgraded** | Policy authoring disguised as a text box, and the cheapest one in the set. Upgrade: when the same dissent shape repeats, offer *"Make this a house rule"*. That is the queue turning into the input for its own elimination, which is what `GOVERNANCE-PRINCIPLE.md` §4 asks for |
| I-05 | §8.3 the six modals: *"Merge to main \| Delete a product or workspace \| Revoke a member \| Paste an API key \| Grant or deduct credits (admin) \| Resolve a sync conflict"* | 6 modals | **a KEEP, all six** | **The one section in the nine documents that needs no rework.** Every one fails Q2 outside the product and every one fails Q2b (each instance is different). Merge is governed by E-01's policy but the modal, when policy says a human merges, is correct. Note two are live defects today: credits has **no confirm at all** (`clicks` S-17) and sync conflict discards one side with **no diff and no confirm** (`clicks` L-36) |
| I-06 | §8.3 *"**Everything else that is a modal or a confirm today becomes optimistic plus undo.** Approve, send back, snooze, archive, rename ... all land immediately with a 6-second undo line"* | law | **KEEP, with one correction** | Load-bearing and correct: *"A confirm dialog protects the product from the user; an undo protects the user."* Correction: an approve that fires `studio.pr.open` has **no six-second inverse**; the PR is open and closing it is a different act. The undo line must name the real inverse or claim none (§8.3's own corollary) |
| I-07 | §8.2 *"**Inline** \| editing a value where it reads \| ... the default; **never asks permission**"* | shape law | **KEEP** | Correct |
| I-08 | §8.2 *"**a popover may never contain a decision.** If a user can get it wrong, it needs the room's attention"* | shape law | **KEEP** | Correct |
| I-09 | §10.2 the consequence line, *"one sentence, from real data, on hover of any irreversible button"* | mechanism | **KEEP, and hard-gate it** | This is the mechanism that lets a gate become a policy, because a policy can only be written over a consequence that is stated flatly. **21 of the 46 registry tools have no `tool-consequences.ts` entry, and six of those are `category: "write"`** (§6 INV-5): `studio.revert`, `decision.revise`, `roadmap.move`, `prd.revise`, `cluster.trigger`, `agent.spawn`. For those the line renders the DEFAULT, *"Effect not catalogued. Review the arguments before approving,"* including on `studio.revert`, which is force-pinned to `review` and therefore always shows a card. `edge` §12.6 already asks for the build-time invariant; raise it: **no policy may be written over an uncatalogued consequence** |
| I-10 | §8.3 *"**The whole mark model contains exactly one dialog: `Drop all 5 marks?`**"* | modal | **KEEP** | Destructive, correct |
| I-11 | §6.6 per-mark verdicts, `hold b for before`, `Approve 3 changes` / `Send back` | verdicts | **b -> a** | = S-11. The judgment is "does this look right", which is S-08 and stays |
| I-12 | §13.1 the four primaries: `Approve the spec` · `Approve the design` · `Approve the changeset` · `Promote to production` | 4 gates | **a, a, b->a, a** | Spec = S-07 (and it is the authorization). Design = S-08 (un-blocked). Changeset = S-11 (policy governs what is checked). Promote = E-09 (hard floor) |

### 5.5 `ia/FINAL-ia.md` (16). The journey gates.

| ID | Decision point, quoted (§4.2, "**H** = the human decides") | Now | Verdict | Policy name and default, or why it stays |
| --- | --- | --- | --- | --- |
| IA-01 | J1 step 4 *"**Gate** (ember Spine node 02 + tray card + inline in Thread) \| **H** \| Keep or kill each bet"* | gate | **a KEEP** | = S-05. Floor 2 |
| IA-02 | J2 step 3 *"**Gate** \| **H** \| `decideFanoutBatch` - accept, reject, or send back each branch"* | gate | **c** | Counter-evidence from a teardown fan-out is research output. Judging each branch is judging retrieval. Policy: **`Teardown depth`**, default **the strongest three counters, with the rest one click away**. The verdict on the teardown (J2 End) stays; the per-branch triage goes |
| IA-03 | J3 step 4 *"**Gate** \| **H** \| Approve the spec. Assumptions go on watch with dates."* | gate | **a KEEP, and it is the authorization** | = S-07 |
| IA-04 | J5 step 3 *"**Gate** \| **H** \| `decideDesignGate`. Approve, or send back with a note."* | gate | **a KEEP, un-blocked** | = S-08 |
| IA-05 | J4 step 3 *"**Gate** (inline, mid-run) \| **H** \| Approve a tool call the agent needs. Resume."* | gate | **c** | **Finding 1.** Already dissolved by AGT-02 under an approved contract for reversible tools. What remains is the merge and the external hand-off |
| IA-06 | J4 step 5 *"**Gate** \| **H** \| Review the changeset. Approve -> PR opens on your repo."* | gate | **b -> a** | = S-11 for what is checked; = E-01 for the merge. Opening a **draft** PR is `reversible` (`tool-consequences.ts`) and is already `BUILD_LANE_AUTONOMOUS`, so the gate as drawn is stricter than the code |
| IA-07 | J6 step 1 *"**Gate** \| **H** \| `promoteToProduction` - preview to production is a human call, always."* | gate | **a KEEP, hard floor** | = E-09 |
| IA-08 | J6 step 3 *"Copy out. **Honest edge: nothing is published or scheduled from here; the UI offers Copy, never Post or Send.**"* | ceiling | **KEEP** | Verified: there is no outbound post tool in the 46. The only externally visible non-git tool is `calendar.create`, which is `HIGH_RISK_MIN_CONFIRM`. The ceiling copy is true |
| IA-09 | J7 step 2 *"`recordOutcome`. **Honest edge: human-attested.**"* | human act | **a KEEP** | = S-13 |
| IA-10 | J7 Start *"**The gate finds you.** The only journey whose primary entry is `gate`: the armed outcome check fires into the tray on its date."* | scheduled gate | **a KEEP, and it is the right model** | A Call the human **armed in advance**, arriving on a date they set. That is policy producing a Call, which is exactly the shape the principle wants. Keep it and use it as the template for scheduled judgment |
| IA-11 | §2.2 the ember rail tile, **Your call** | count | **b, reframed** | = S-02 |
| IA-12 | §2.3 Beliefs draft *"It **has started** running them without asking"*, amended by `edge` E7 to *"`It could stop asking, on bets over $50k impact. Your call.`"* | Call | **a KEEP** | = E-17. Two lanes reached this independently, which is the strongest available evidence the draft was wrong |
| IA-13 | §2.4 config group **Agents** = `staff` + `autonomy` + `ai`; `agents` O5 deletes `staff` and `autonomy` | settings | **b, and it becomes the boundary surface** | Both documents are half right. `agents` O5 is correct that per-agent autonomy belongs next to the agent. But the **cross-agent boundary view** is not a settings section and not a crew pane, it is the surface `GOVERNANCE-PRINCIPLE.md` §3 asks for. §7 below |
| IA-14 | §2.2 the gates tray federates ten families, including `memory_candidate` | queue family | **b** | = S-14 |
| IA-15 | §2.2 gate family `house_rule` (pending / approved / rejected, `house-rules.functions.ts:34`) | queue family | **a KEEP, and it is the right shape** | An agent proposes a standing rule, the human ratifies it once, and it governs from then on. **This is the model everything else should copy** and it already ships |
| IA-16 | §4.2 J0 *"each DONE flowing into the next START automatically instead of waiting for a click. **Human gates still stop it.**"* | law | **REWRITE** | Under the re-frame: *"J0 runs end to end on an approved spec. Three things stop it: a bet you have not judged, a design you have not seen, and anything that goes live."* Same sentence, three floors instead of eight gates |

### 5.6 `depth/FINAL-depth.md` (7)

| ID | Decision point, quoted | Now | Verdict | Policy name and default, or why it stays |
| --- | --- | --- | --- | --- |
| D-01 | §7.2 the gate card, *"`[ Approve ] [ Deny ] [ Change something ]` / `runs it now  I stand down  tell me what to do instead`"* | 3 verbs | **a for the residue, and un-gate the third verb** | **`Change something` is the best idea in the depth doctrine and it is trapped inside a gate.** It routes through `injectSteer`, which the loop already consumes at the top of every step (`loop.server.ts:876-922`), *"and that machinery is correct and has never had a UI."* Under the re-frame, **steering must be available at any moment, not only when the machine stopped to ask.** That single change converts the gate from a blocking question into an optional intervention |
| D-02 | R-13 *"a usage rule may auto-apply a demotion (tightening on evidence of harm) and may only propose a promotion (loosening on evidence of comfort)"* | law | **KEEP verbatim** | = E-22. And it does not exist yet (P8) |
| D-03 | H-2 *"`/approvals`: 'Rejected. Noted for next time.' \| Nothing is noted anywhere a model reads"* | live lie | **fix** | Either capture the reason and route it through `injectSteer`, or cut the sentence. Under the re-frame it must be the first: the reason is the policy signal |
| D-04 | §7.1 one decide path, `decideGate` | correctness | **KEEP** | Two divergent decide functions today; the correction signal is lost from the surface where decisions actually happen. Lands regardless of everything else |
| D-05 | R-12 `human_gate_events.surface` as a required parameter of `decideGate` | correctness | **KEEP, and it becomes the policy instrument** | *"do people decide inline or bounce to the queue"* is now a second question: **which gates get the same answer every time.** That is the query that writes the policy proposals |
| D-06 | §8 one queue, two surfaces | structure | **KEEP, target near zero** | The queue is correct as an object. Its healthy size is small |
| D-07 | §7.2 *"**Legible arguments are the difference between an approval and a rubber stamp.**"* `tool-args-legible.ts`, static, never model output | mechanism | **KEEP** | Same class as I-09. A policy can only be written over a consequence that is stated flatly |

### 5.7 `language/FINAL-language.md` (8)

| ID | Decision point, quoted | Now | Verdict | Policy name and default, or why it stays |
| --- | --- | --- | --- | --- |
| L-01 | §2.3 *"Something waiting for your judgment \| **Call** \| One thing your crew has stopped on and cannot pass without you."* | lexicon | **KEEP the word, shrink the population** | The definition survives and becomes accurate for a small set |
| L-02 | §5.4 the verdict verbs, `Approve` / `Send back` / `Decline` / `Snooze` with `a` / `s` / `d` / `z` | lexicon | **KEEP** | Ratified, and the keys are currently unsafe in three surfaces (`clicks` L-24, L-25, L-26). Fix the bindings, keep the words |
| L-03 | R18 *"The triad `Approve / Send back / Decline` governs **calls**. `Keep / Drop` govern **bets**"* | lexicon | **KEEP** | Correct |
| L-04 | R22 the in-app tagline, *"**You make the calls. Your crew does the work between them.**"* | tagline | **CHANGE** | `GOVERNANCE-PRINCIPLE.md`: *"it currently reads as per-item approval and should not."* Proposed, keeping R22's honesty test intact: **`Your crew does the work. You set the boundaries, and you hear about it when something reaches one.`** Lane B owns the final wording |
| L-05 | §2.5 *"The rule that made it stop \| **House rule** \| A standing rule you wrote that decides **when your crew must stop and ask you**."* | lexicon | **WIDEN** | The definition only permits a rule that adds a gate. Proposed: **"A standing rule you wrote that decides what your crew does on its own, and what it brings you."** One clause, and it makes the object bidirectional, which is the entire re-frame in a definition |
| L-06 | §4 the diverged autonomy labels, `auto` -> `Runs on its own`, `confirm` -> `Asks me first`, `review` -> `I check the output` | lexicon | **KEEP** | This is the policy vocabulary and it is already written. Promote it out of Settings |
| L-07 | §9.x *"A call needs judgment \| `Engineer needs your call on checkout retries.` \| `Approve, send back, or snooze it.`"* | copy | **KEEP** | Correct for the residue |
| L-08 | §2.4 *"How much rope an agent has \| **Autonomy** \| How far an agent may go before it stops and asks you."* | lexicon | **WIDEN, same as L-05** | Define it forward: *"How far an agent goes on its own."* The current definition measures the distance to the next interruption |

### 5.8 `adaptive/FINAL-adaptive-layout.md` (5). The frame buried as a layout invariant.

| ID | Decision point, quoted | Now | Verdict | Policy name and default, or why it stays |
| --- | --- | --- | --- | --- |
| AD-01 | §9 *"**A human is in this app to make judgment calls at gates.** Everything else - the loop rail, the ... - the gate is the last thing to give way, and it never gives way."* | layout law | **STRUCTURAL REWORK** | This is the gate-centric frame compiled into a CSS invariant, and it is the deepest place it is buried. It is also self-defeating: a layout whose top invariant is a gate has an **empty top invariant on a healthy day**, which is every day the product is working |
| AD-02 | §9 invariant *"**I1** \| **The open gate** - its claim, its evidence line, and both buttons \| This is the product."* | invariant 1 | **REWRITE** | Proposed I1: **"What the crew is doing, what it did on its own since you last looked, and the open call if there is one."** The gate keeps its slot inside I1 and stops being I1 |
| AD-03 | §9 invariant list I1..I5 | invariants | **ADD ONE** | There is **no invariant for the boundary**. If the human's job is setting boundaries, the boundary must survive to S0 alongside the gate. Add I6: one key (`⌘B`) and one row that reaches what the crew may do alone |
| AD-04 | §9 *"Ordering rule, stated once: **rank by distance from the gate.**"* | demotion rule | **REWRITE** | Rank by distance from **the work**, not from the gate. Under the current rule a healthy screen ranks everything by distance from something that is not there |
| AD-05 | §9 *"`⌘G` jumps to the oldest open gate"* | key | **KEEP, add `⌘B`** | Correct for the residue |

### 5.9 `clicks/FINAL-click-register.md` (10). Every one is on the approve path.

| ID | Finding, quoted | Class | What it proves |
| --- | --- | --- | --- |
| C-01 | L-24 *"`onMouseEnter={() => onFocusChange(item.id)}` on every card - focus follows the mouse. Move the pointer across the list, press `1`, approve whatever the cursor last crossed. No confirm, no undo; `decideApprovalItem` is a real write"* | LIES | A queue we cannot operate safely is not governance |
| C-02 | L-25 *"A single bare `a` **approves** the focused approval; `r` rejects. No confirmation, no undo, no on-screen hint"* | LIES | Same |
| C-03 | L-26 *"Three keyboard grammars for one action ... A demo touching both surfaces teaches two contradictory things"* | LIES | Same |
| C-04 | D-06 / D-08 *"`1` on a gate card labelled `Approve and run [1]` jumps the Canvas to Discover"*; *"`a` on Today approves **and** navigates to `/admin`"* | LIES | Same |
| C-05 | L-02 *"`onError: (e: Error) => toast.success(e.message)`. Failures render as **green success toasts** ... 18 sites"* | LIES | A failed approval reports success. In Flow mode it produces **no output at all** |
| C-06 | L-29 *"Today decides through six server fns ... `/approvals` decides identical items through one"* | LIES | = depth D-04 |
| C-07 | L-34 *"'Tool reach' select per agent \| Immediate write, **no confirm, no undo**, reported with a neutral `toast(...)`. A mis-scroll over the select changes agent permissions"* | LIES | **The one real policy control in the product is the one with no confirm.** Under the re-frame this becomes a first-class act and needs the ceremony A-01 is being re-pointed at |
| C-08 | X-19 *"Per-agent on/off switch, `role='switch'` with `aria-checked` \| `onClick` calls **only** `toast(...)`: '...stays on. Disabling agents is gated in Autonomy & approvals.' A switch that cannot switch, once per agent"* | DEAD | = A-08. The cheapest policy control is a decoration |
| C-09 | L-36 *"`Keep Supaprod version` / `Keep <provider> version` \| Resolving **discards one side of a document permanently**; no confirm, no diff, no undo"* | LIES | An irreversible act with no gate, while reversible acts have several. The register is inverted |
| C-10 | S-17 *"`GrantCreditsForm` submit \| **No confirm** ... The one money-moving control on the page is the one without a gate"* | SILENT | Same inversion |

### 5.10 `FOUNDER-VERDICT-2026-07-29.md` (3)

| ID | Quoted | Verdict |
| --- | --- | --- |
| F-01 | §2.5 *"You see the verbatim across approvals and all those things. It has to be just one line, two line ... If a user wants to know, he will click deeper"* | **Consistent with the re-frame and reinforced by it.** A one-line approval card is only possible when the population is small and the reader already set the boundary. Verbosity is what a card needs when the reader is being asked cold |
| F-02 | §3 *"On top right I'll give something, an Ask button. If the user clicks on that it opens up a panel"* | Lane B. Note the boundary surface has the same shape and the same problem: it is a pane, not a destination |
| F-03 | §2.8 *"Do we really need that standard toolbar where we showcase all our seven surfaces ... Is there any other way we can only showcase the section that is actually being worked on?"* | Lane B. Under the re-frame the Spine's honest job changes: it stops being a map of gates and becomes a map of where the crew is |

---

## 6. THE INVERSE: WHERE THE DOCTRINES ASSUME AUTONOMY AND A HUMAN SHOULD BE ASKED

Rarer, and each one is worse than an unnecessary gate, because an unnecessary gate is annoying and
this is a boundary nobody set. Fifteen, ordered by severity.

| # | Where | The assumed autonomy | Why a human is owed something | The fix |
| --- | --- | --- | --- | --- |
| **INV-1** | `agents` R11 / §10.2 | *"**Sign-up completes, the room paints, and one real Researcher run starts immediately, unasked.** ... **It costs credits**, it writes real `signals` rows"* | Real money, on the first screen, before the user has typed a word or seen a boundary. The doctrine's own mitigation (R6) bounds the cost and **not the consent** | Legal, and it must be **stated as a default** on the sign-up screen and stoppable from the Crew Bar in one click: *"Your crew starts working the moment you land. Stop it any time."* That converts an undisclosed default into a policy the user can see. Principle clause 3 |
| **INV-2** | `edge` §3.2 *"A failure inside the fix budget \| **silent** \| Q1 absorb: the engine already appends fix commits"* | `studio.fix.commit` is exempt from the high-risk demotion entirely and runs at its **seeded mode** (`loop.server.ts:170-177`), appending commits to a human-opened PR branch unattended | Correct as a design, and **no policy governs the budget**, no doctrine names one, and the user cannot see or change it | Name it: **`Fix budget`**, default **3 attempts**, visible on the boundary surface. E-06's receipt names it when it runs out |
| **INV-3** | `edge` §3.1 and §8.1 | Merge is a Call *"always, no exception"*, and the ceiling copy says *"A human merges it."* | `AUTO_SHIP_ENABLED` (`STUDIO_AUTO_SHIP=1`) makes `studio.pr.merge` follow the trust arc. If it is ever set, the doctrine's proudest ceiling sentence becomes a lie in production, silently | E-01. Promote the env secret to a named workspace policy with the current behaviour as its default. Copy that describes a safety property is versioned with that property (`agents` §2) |
| **INV-4** | every doctrine | `event_subscriptions` with `approval_mode: 'auto'` and `is_default: true` (`reactor.functions.ts:62,92`) dispatches an agent on an event with no human | **A default subscription is a boundary we chose and shipped.** The object is named in zero doctrines, appears on no surface a PM visits, and is the largest unnamed autonomy surface in the codebase | It belongs on the boundary surface as the **triggers** section, in one line per row: *"When a source reports a spike, Scout looks into it. On its own."* Defaults visible, explained, changeable |
| **INV-5** | `edge` C2 *"Nothing is absorbed unless it lands in 'Done without you'."* | **21 of the 46 registry tools have no `tool-consequences.ts` entry. Six of the 21 are `category: "write"`**: `decision.revise`, `roadmap.move`, `prd.revise`, `cluster.trigger`, `studio.revert`, `agent.spawn` (the other 14 are genuine reads, plus `critic.evaluate`, planning). `isSideEffectingTool` is literally defined as membership in that catalogue, so an unattended **agent revision of a human's decision**, or a roadmap re-rank, is **not counted as unattended work** and does not appear in "Done without you" | C2 is the price of the absorbed register. It is unpaid for exactly the acts that most need it: revising a decision, moving the roadmap, revising a spec. `studio.revert` is worse: it is `HIGH_RISK_FORCE_REVIEW`, so its gate card renders the DEFAULT consequence line, *"Effect not catalogued. Review the arguments before approving,"* on the single most consequential undo in the product | `edge` §12.6 already proposes the build-time invariant. **Raise it to a hard gate on the whole re-frame**: a side-effecting tool with no catalogue entry fails the suite, and no policy may be written over an uncatalogued consequence |
| **INV-6** | none (undiscovered) | `consent-classes.classifyConsequence` tests `isSideEffectingTool` **first**, so those six uncatalogued **write** tools land in **"Read-only research / Auto-run / Safe to run on its own. Nothing to undo."** The panel's own comment claims *"the posture shown is the posture that actually holds"* | The one policy surface that exists **lies in the permissive direction** about `decision.revise`, `roadmap.move` and `prd.revise`. Meanwhile `toolRisk` fails them closed to `high` and the loop demotes them to `confirm`, so the panel and the loop disagree in opposite directions about the same six tools | Fixed by INV-5. Until then the panel must render an explicit `not catalogued` class rather than folding into read-only |
| **INV-7** | none (undiscovered) | `updateToolMode` accepts `mode: "off"` (`agent_loop.functions.ts:176`). `resolveToolMode` passes it through and the loop's gate is `mode === "confirm" \|\| mode === "review"`, so an `off` tool that is `enabled` **executes with no gate** | A write path whose failure mode is permissive, on the API that sets policy. Unreachable from today's UI, reachable from the server function | Delete `"off"` from the schema, or handle it as a refusal in the loop. Correctness |
| **INV-8** | `edge` §3.5, `language` §2.5, `GOVERNANCE-PRINCIPLE.md` §"machinery" | House rules are treated as an enforcement layer | They are prompt text (`loop.server.ts:387-388`). `edge` C3 names this exact pattern as the Replit failure | Finding 3. A house rule must compile to a predicate in the path. The reference implementations already exist in this codebase: `capToolsByRisk` (removes the capability), `runtime.server.ts:226-238` (fail-closed cap), `publish_announcement` (SECURITY DEFINER RPC + RLS) |
| **INV-9** | every doctrine | Guardrails `action: 'block'` fire on the user's own text at `runtime.server.ts:1610` and `:1794`, `guardrails.server.ts:75-76` | A blocked call is a **boundary hit** and no doctrine designs a single word for it. The user's request silently does not happen | Apply `edge` §3.5's house-rule receipt shape to guardrails: *"Stopped by your rule: no customer names in prompts."* One sentence, naming the rule. `guardrail_hits` already stores everything needed |
| **INV-10** | every doctrine | `MISSION_CONCURRENCY_CAP = 5` (`governance.functions.ts:196`), `STEP_CEILING = 40`, `adaptiveStepBudget`'s per-role budgets | Real boundaries the product chose. Invisible, unsettable, and they shape what the crew can do more than any gate does | Principle clause 3. They belong on the boundary surface as stated defaults, even if they stay read-only in v1. A default that is visible and explained is policy; a constant is not |
| **INV-11** | `edge` §8 B12, `agents` §6.5 | Public share surfaces `/p/$slug`, `/d/$slug`, `/t/$slug`, and `artifacts.share_slug` | Publishing crosses Q2 (*"anything customers see"*), and **no doctrine rules the act**. Verified mitigation: no registry tool writes a share slug today, so this is a doctrine gap rather than a live risk | Rule it before any share tool is added: **making something public is a Call at every autonomy level**, in the same class as the production deploy |
| **INV-12** | every doctrine | `ORCHESTRATION_CONTROL_FLOW_TOOLS` = {`mission.plan`, `mission.dispatch`, `mission.observe`, `mission.finalize`, `critic.evaluate`} **bypass approval creation entirely** (`loop.server.ts:115-125`, `:1114`), exempt from arc-gating and from any seeded mode | The reasoning is sound (gating the orchestrator's own bookkeeping strands the mission), and **`mission.dispatch` enqueues child `agent_runs`.** It is the mechanism by which one human sentence fans out to N agents spending real credits, and the only thing bounding it is the spend cap and `MISSION_CONCURRENCY_CAP` | Correct as designed, and it must be **stated** on the boundary surface rather than left implicit: *"Your Chief of Staff plans and dispatches on its own. What each specialist may then do is set below."* One sentence, and it makes the fan-out a boundary the user can see |
| **INV-13** | `ia` §2.3, `shell` §2.4 form 14 | Memory writes (`memory.remember`, `memory.promote`) are internal reversible writes and run at low risk | Memory shapes every future agent decision. Reversible in the mechanical sense, **not in the influence sense**: a belief that quietly steers ten runs cannot be un-steered by deleting the row | S-14's policy is the answer, and its second half is the load-bearing half: **a weekly digest naming what was added, and `Stop using this` on every belief.** Per-item approval at the write is the wrong side; visibility after the fact plus one-click retraction is the right one |
| **INV-14** | `agents` §15, `edge` §10.1 | `agent.handoff` is `partial` reversible and carries **no enforced evidence** (`HANDOFF_EVIDENCE_GATE` default OFF) | Under the re-frame, fewer interrupts is only safe because everything is provable afterwards. An unenforced evidence field is the weakest link in that bargain | `edge` §10.1's repair is right and becomes a precondition rather than an improvement: require the **field**, not the content; an empty declaration is a stated recorded claim |
| **INV-15** | `interaction` §8.3 | *"Approve ... land immediately with a 6-second undo line"* | An approve that fires `studio.pr.open` has no six-second inverse. The PR is open on someone else's server | The undo line must name the real inverse or claim none. §8.3's own corollary already says this: *"an optimistic action must show its own reversal"* |

---

## 7. THE BOUNDARY: THE OBJECT MODEL, NAMED, WITH DEFAULTS

`GOVERNANCE-PRINCIPLE.md` §3 asks for *"a new first-class surface: the boundary."* Lane B owns what
it looks like. This lane owns what is on it, because a surface is only as honest as the defaults it
renders. **Nine policies. Every one is backed by a column that already exists.**

| # | Policy | Default | Stored | Enforced by | Today |
| --- | --- | --- | --- | --- | --- |
| 1 | **What each agent does on its own** | `trusted`: *acts, and asks before anything it cannot undo* | `agent_autonomy.arc` | `resolveApprovalMode` | Settings row |
| 2 | **How far each agent may reach** | unrestricted | `agents.max_tool_risk` | `capToolsByRisk`, removes the tool from the prompt | Settings row |
| 3 | **What kind of act needs you** (four consequence classes) | read-only `auto` · internal write `confirm` · stakeholder-facing `confirm` · repo write `review` | none. **Needs one column** | `resolveToolMode` | `consent-classes.ts`, rendered read-only, **no writer** |
| 4 | **House rules** | none | `house_rules` | **nothing.** Prompt text only (INV-8) | Queue family + Engine Room list |
| 5 | **Triggers**: what wakes an agent, and whether it asks | the shipped `is_default` rows | `event_subscriptions.approval_mode` | the reactor | Engine Room, named in no doctrine (INV-4) |
| 6 | **Spend** per run and per month | the plan's cap | `mission_spend_cap_usd`, `mission_token_cap` | `runtime.server.ts:226-238`, fail-closed | Engine Room |
| 7 | **Who merges** | `A human merges` | needs a row; `AUTO_SHIP_ENABLED` is the env-var prototype | `resolveToolMode` | wrangler secret (INV-3) |
| 8 | **What each source may do** | read-only | connector scopes | `resolveProviderAuth` | connect flow |
| 9 | **Who is on the bench** | everyone employed | `agents.enabled` | runtime, twice | **no write path** (A-08) |

The other twelve policies in §0's count are **derived from these nine, not new storage**: `Fix budget`
and `Retry flaky checks` are numbers inside 3; `What reaches you`, `Promote a pattern to a bet`,
`Teardown depth`, `Beliefs` and `What I check on a change` are thresholds on 4 (house rules) once
house rules take a predicate; `When Reviewer objects` and `Model preference` are rows on 3;
`Codebase` is 8; `Failed runs are refunded` is billing. **Only two need a column that does not
exist: the consequence-class posture (3) and `Who merges` (7).** Everything else on the boundary
surface is a rendering of something already stored, which is the whole argument for the re-frame:
this is a promotion, not a build.

**Three floors sit above all nine and render as locked rows with their reason**, exactly as
`agents` §5.4 already draws them:

```
  merge a pull request        always asks you    locked - never graduates
  revert shipped work         always asks you    locked - never graduates
  hand work to an outside     always asks you    locked - never graduates
    coding agent
  change your database        always asks you    locked at every autonomy level
    schema
```

Backed by `HIGH_RISK_FORCE_REVIEW` = {`studio.pr.merge`, `studio.revert`, `delegate.openhands`}
(`ai/trust-ramp.ts:41-45`) plus the migration block at `registry.server.ts:1069-1076`. These are the
strongest safety artefacts in the codebase and they are currently invisible.

**And the boundary surface's most important row is not a control, it is a proposal.** The graduation
card (A-02) and the house-rule proposal (IA-15) both already arrive as queue items. Under the
re-frame they are the queue's whole purpose: **the only thing a healthy tray contains is agents
asking to need you less, and rules asking to be made standing.**

---

## 8. THE FIVE THINGS THAT MUST NOT MOVE

Stated so the design pass cannot over-correct.

1. **The three floors.** Production, irreversible-outside, schema. `edge` §3.3's migration clause is
   the best-written sentence in the nine documents and it is quoted verbatim into the boundary
   surface: *"A schema change is a Call at every autonomy level and is the one Call that can never be
   granted to `Runs on its own`."*
2. **The three judgments.** What is worth building, what is good enough, what goes live
   (`agents` §2). Absorbing any of them is *"the product having an opinion it cannot justify"*.
3. **Evidence pays for autonomy.** Every silent act lands in "Done without you" (`edge` C2), every
   claim carries its source in the source's own form (C4), the record is contemporaneous and sealed.
   INV-5 says C2 is unpaid for 21 tools; that is the first bill.
4. **Tighten silently, loosen by Call** (`edge` §4.2, `depth` R-13). The asymmetry is what makes a
   low-gate product defensible rather than reckless. Build the tightening half; it does not exist
   (P8).
5. **A default the user did not set is not policy.** Every one of the nine in §7 renders in words
   with its reason, or we have shipped our permission model in a costume.

---

## 9. THE THREE DOCUMENTS THAT NEED STRUCTURAL REWORK

Everything else is row-level edits. These three have a load-bearing structure built on the old frame.

| Document | What breaks | The rework |
| --- | --- | --- |
| **`agents/FINAL-agent-presence.md`** | R10 makes the approval the product's signature moment (§9, four beats, 1.2 seconds). §13 P8 schedules it | **Re-point the ceremony, keep every beat.** The Commit fires on a **boundary act**: granting rope, writing a rule, taking rope back, approving a contract. §8.2's graduation card becomes the moment the camera is on. Beat 2's *"never an arrow to nowhere"* rule already handles the case where nothing picks the work up, which is what a boundary act looks like: *"Now a standing rule. It will stop your crew next time."* That sentence is already in the document |
| **`edge/FINAL-edge.md`** | §3's ruling tables are keyed on three registers, and the Call register carries both gates and controls (Finding 2). §0's sorter has no Q0 | **Add Q0 and Q2b to §0's sorter. Split the Call register into `Call` and `Control`. Re-run §3 through the new sorter**, which changes 11 of its 29 rows and none of its four constitutional clauses. §3.6's one-table summary is the deliverable and it shrinks from 14 Calls to 8 |
| **`adaptive/FINAL-adaptive-layout.md`** | §9's invariant I1 is the open gate, and the demotion order is *"rank by distance from the gate"*. On a healthy day the layout's first principle is absent | **Rewrite I1 and the ordering rule (AD-02, AD-04). Add I6, the boundary.** Gate 0's composition table and the I1..I5 assertions in `shell-composition.test.ts` are the enforcement, so the rewrite is mechanical: change the invariant, the test follows |

`shell-question`, `interaction`, `ia`, `depth`, `language` and `clicks` need row edits only. The
modal whitelist (I-05) needs nothing at all.

---

## 10. HANDOFF

**To lane B (the replacement surface).** §7 is your content model: nine policies, their defaults,
their storage, their enforcement, plus the three locked floors. Three constraints from this lane:
the boundary is not a settings section (IA-13); the graduation card is the signature moment and it
must be designed as one (A-02, A-01); and the rail's primary number is what the crew did on its own,
with `Your call` as the exception beside it (S-02).

**To lane C (sequencing).** Four items are **hard preconditions**, not improvements, because the
re-frame is unsafe without them:

1. **House rules compile to a predicate** in the execution path (Finding 3, INV-8). Nothing may be
   converted from a gate to a rule before this.
2. **`tool-consequences.ts` becomes a build-time invariant** (INV-5, INV-6, I-09). Six `write` tools
   are uncatalogued, which voids `edge` C2 for them and makes the consent panel lie permissively.
3. **`revokeTrustGraduation`** (A-03, A-17, P9). Granting is one-way today.
4. **The auto-tightening half of R-13** (E-16, P8). It is claimed in two doctrines and exists in
   neither the code nor a plan.

Two more are correctness fixes that should land regardless: delete `"off"` from `ToolModeSchema`
(P3, INV-7), and merge the two decide paths into `decideGate` (D-04, C-06).

**One sentence for the founder.** The product already works the way you described it: an approved
spec pre-authorizes its own reversible work, a cap refuses in the model chokepoint, a blast-radius
limit deletes a tool from an agent's prompt rather than interrupting it, and an agent already comes
to you after five clean runs and asks to stop asking. What we drew yesterday was a queue on top of
all of that. The correction is not to build a governance layer, it is to stop hiding the one we
have, and to make the one object you actually author, the house rule, enforce itself instead of
asking the model nicely.

---

## 11. RELATED

- [`../GOVERNANCE-PRINCIPLE.md`](../GOVERNANCE-PRINCIPLE.md), the binding input. Corrected in six
  places, §2.
- [`../FOUNDER-VERDICT-2026-07-29.md`](../FOUNDER-VERDICT-2026-07-29.md), the visual verdict, §5.10.
- [`../edge/FINAL-edge.md`](../edge/FINAL-edge.md), the densest Call concentration, §5.1, rework §9.
- [`../agents/FINAL-agent-presence.md`](../agents/FINAL-agent-presence.md), the signature moment,
  §5.2, rework §9.
- [`../shell-question/FINAL-shell-ruling.md`](../shell-question/FINAL-shell-ruling.md), the Judge
  slot, §5.3.
- [`../interaction/FINAL-interaction.md`](../interaction/FINAL-interaction.md), the modal whitelist,
  §5.4, which survives whole.
- [`../ia/FINAL-ia.md`](../ia/FINAL-ia.md), the journey gates, §5.5.
- [`../depth/FINAL-depth.md`](../depth/FINAL-depth.md), R-13 and the steer, §5.6.
- [`../language/FINAL-language.md`](../language/FINAL-language.md), the tagline and the house-rule
  definition, §5.7.
- [`../adaptive/FINAL-adaptive-layout.md`](../adaptive/FINAL-adaptive-layout.md), invariant I1,
  §5.8, rework §9.
- [`../clicks/FINAL-click-register.md`](../clicks/FINAL-click-register.md), ten defects on the
  approve path, §5.9.
- Code: `src/lib/ai/loop.server.ts` (`resolveToolMode`, AGT-02, `PAUSE_ON_APPROVAL_TOOLS`),
  `src/lib/ai/trust.server.ts`, `src/lib/ai/trust-ramp.ts`, `src/lib/tool-consequences.ts`,
  `src/lib/consent-classes.ts`, `src/lib/house-rules.functions.ts`, `src/lib/reactor.functions.ts`,
  `src/lib/governance.functions.ts`, `src/lib/ai/runtime.server.ts`,
  `src/lib/approvals-queue.functions.ts`.
</content>
</invoke>
