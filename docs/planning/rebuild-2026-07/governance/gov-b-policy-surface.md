# gov-b: The boundary. Designing the surface where the human's job actually lives.

> _Created: 2026-07-29 · Last updated: 2026-08-03_

> _Rebuild 2026-07, governance lane B. Written 2026-07-29 against the binding principle in_
> _[`../GOVERNANCE-PRINCIPLE.md`](../GOVERNANCE-PRINCIPLE.md)._
>
> **Assignment:** if the human's job is to set boundaries rather than approve work, that job needs a
> home. Today it is scattered across three Settings sections plus guardrails in the engine room.
> Design the surface.
>
> **Method:** every claim below was checked against the running code before it was written. Section 1
> corrects the principle document in six places where it is wrong about our own system, and two of
> those corrections are load-bearing enough to change the build order. Nothing here invents a
> parallel system. Every ruling names the function, table or file it lands in.

---

## 0. THE RULING, IN ONE PAGE

**The one sentence:**

> **A boundary is a sentence the user wrote about what their crew may do without them. It is stored,
> it is enforced in the execution path, it names itself on every receipt it causes, and the product
> proposes the next one from the record of the calls the user already made.**

**The word is `House rule`.** It is already ratified in `language/FINAL-language.md` §2.4 with
`guardrail`, `policy`, `gate`, `permission` and `constraint` banned beside it. It needs one amendment
(§2.1) and it needs to become true, because today a house rule is advisory prose in a system prompt
that stops nothing (§1, F2). We do not invent "boundary" as a product word. `Boundary` stays a
doctrine word, the way `register` and `absorbed` are doctrine words in `edge/FINAL-edge.md`.

**A house rule has exactly three shapes, and all three already have storage:**

| Shape | The sentence | Where it is stored today | Enforced today |
| --- | --- | --- | --- |
| **Standing** | `Engineer opens pull requests on its own.` | `agent_tools.mode`, `agent_tool_modes.mode`, `agent_autonomy.arc` | **yes**, `resolveToolMode` |
| **Reach** | `Scout never touches anything outside this workspace.` | `agents.max_tool_risk` | **yes**, `capToolsByRisk` |
| **Ceiling** | `Nothing spends past $5 on one run.` | `agent_runs.mission_spend_cap_usd`, `mission_token_cap` | **yes**, `runtime.server.ts:233` |

The fourth thing users will try to write (`nothing merges on a Friday`) has **no storage and no
enforcement** and must not be offered until it does. `edge/FINAL-edge.md` §3.5 already ships that
exact sentence as example copy. It is copy ahead of wiring today.

**The surface is a pane, not a settings section.** `?pane=rules`, one keystroke, read next to the
work it governs. Settings keeps one row that deep-links into it and owns nothing. This overrides
`ia/FINAL-ia.md` §2.4, which puts `autonomy (Autonomy & approvals)` in the Settings overlay, using
IA's own stated reason for why that is wrong (§5.1).

**The seven claims this document defends:**

1. The product already has a boundary layer. It is three settings sections, one engine room, one
   read-only panel and two silent database functions, and no user could describe it.
2. Two of those pieces contradict ratified doctrine **in production right now** (§1, F1 and F2), and
   both are correctness fixes, not polish.
3. Degrees of autonomy need three words, not seven. The four-rung ladder is deleted from the user's
   view and survives as a write target (§3.3).
4. A person expresses a boundary by completing a sentence with three fixed slots, never by writing a
   rule language, and the slot inventories are all real data (§4).
5. A brand-new workspace is autonomous on arrival, not supervised, and that is defensible in one
   line per default (§6).
6. The approvals queue is the input for its own elimination, and the mechanism is a demotion of the
   queue's own rows into standing sentences (§8).
7. Graduation is the only moment where the machine visibly gets better and the human's leverage
   visibly increases, and the reason it currently lands as a toast is that there is no surface for
   the thing that just changed to land on (§9).

---

## 1. THE CODE AS IT ACTUALLY IS

The principle document's central finding is right: **the machinery exists and the designs ignored
it.** Its inventory is wrong in six places. Four are minor, two change what we build first.

### 1.1 Corrections to `GOVERNANCE-PRINCIPLE.md`

| # | The claim | The verified truth |
| --- | --- | --- |
| C1 | *"`resolveToolMode` classifies all 50 registry tools `auto` / `confirm` / `off`"* | The runtime modes are **`auto` / `confirm` / `review`** (`trust.server.ts:17`). `off` is a legal value of the `agent_tools.mode` column and of `updateToolMode`, but it is a **disablement**, not a mode: `ControlsPanel` filters `mode !== "off"` rows out entirely, and the loop's real disablement path is `agent_tools.enabled`. Three modes, one separate on/off. |
| C2 | *"the mode default is `?? "confirm"`... permission is the fallback and autonomy is the exception, which is the principle inverted in code"* | **This is the one claim that is materially wrong, and it is the document's own headline tell.** `loop.server.ts:1126` fails closed *before* that line: a tool not in `modeOf` is refused outright with `Tool not enabled`. The only calls that reach `?? "confirm"` are the five `ORCHESTRATION_CONTROL_FLOW_TOOLS`, and `isControlFlow` short-circuits the queue branch below, so they never gate. **The `?? "confirm"` fallback cannot cause a single approval.** It is dead defensive code, not an inverted default. |
| C3 | *"Trust arcs... agents earn autonomy from their own record"* | Half true, and the half that is missing matters. `loadAgentArc` returns **`"trusted"`** for an agent with no row (`trust.server.ts:254`, founder ruling 2026-07-08). A new agent does not earn its way up. It **starts** at rung three of four and tightens on evidence of harm. `edge/FINAL-edge.md` §4.2 already ratified this and ruled the default stays. |
| C4 | *"Guardrails: policy evaluated per call, with hits recorded"* | `guardrail_rules` are **regex content filters over model input and output text** (PII, secrets, prompt-injection strings, profanity), evaluated in `runtime.server.ts`. They have nothing to say about what an agent may *do*. They belong to the safety layer, not the boundary layer, and putting them on this surface would be the single fastest way to make it unreadable. |
| C5 | *"House rules: already defined as a standing rule you wrote"* | See F2 and F3 below. Neither the "you wrote" nor the "must stop and ask you" half is true today. |
| C6 | The inventory omits two real boundary controls | **`agents.max_tool_risk`** (`setAgentToolCap`, rendered as `Tool reach`: Unrestricted / Low / Medium / High, enforced by `capToolsByRisk` at `loop.server.ts:542`), and **`consent-classes.ts`**, a four-class consequence model with plain-words postures already rendering in `ControlsPanel`. The second is the most important omission in the document: **it is this surface, already designed and already read-only.** |

### 1.2 The six findings that change the build

**F1. An agent's autonomy widens itself, silently, today. This violates `depth/FINAL-depth.md` R-13
and `edge/FINAL-edge.md` §4.2, both ratified.**

`auto_advance_agent_arc` (migration `20260708150000`) is called after **every completed run** from
`maybeAutoAdvanceArc` (`reflection.server.ts:240`). It promotes `observing -> proving` after 5 clean
runs and `proving -> trusted` after 20, writing `set_by = NULL` to mark the change as machine-made.
No human is asked. No receipt is written.

The failure is not theoretical and it is worse than it first looks. Because the bootstrap default is
already `trusted`, the RPC is a no-op for a fresh workspace. It only fires on agents **an operator
deliberately dialled down**. So its only real effect in production is: *a user tightens an agent, and
five clean runs later the machine quietly undoes the tightening.* That is precisely the behaviour
R-13 exists to forbid, aimed at the one user who asked for the opposite.

**Ruling: delete the promotion branch.** Keep the bootstrap `INSERT ... 'trusted' ON CONFLICT DO
NOTHING` (it is the founder-ruled default and F5 depends on it). Keep any future demotion. The
promotion path is replaced by a proposal through the existing `trust_graduation_proposals` mechanism,
which already does this correctly. This is one migration and the deletion of four lines of PL/pgSQL.

**F2. A house rule is advisory prose. It stops nothing. This violates `edge/FINAL-edge.md` C3.**

`getActiveHouseRulesForWorkspace` returns approved rules, `renderHouseRulesBlock` formats them as
`--- Workspace House Rules (steward-distilled, approved, standing) ---` and `loop.server.ts:591`
pastes that block into the system prompt. That is the entire mechanism. There is no evaluation, no
predicate, no gate, no `guardrail_hits` equivalent, nothing in `resolveToolMode` that reads a rule.

C3 says it in one line: *"A constraint that lives only in a prompt is not a constraint."* It names
the Replit incident, where an agent deleted a production database during a declared code freeze,
because the freeze lived in the instructions and the execution path had no opinion. **We have shipped
the same shape.** `edge/FINAL-edge.md` §3.5 compounds it by publishing the receipt copy
`Engineer stopped because of your rule: nothing merges on a Friday` as though the mechanism existed.

**Ruling, and it is the hardest constraint on this whole design:** the House rules surface may only
offer sentence shapes that resolve to an enforced predicate. Today that is exactly the three shapes
in §0. Free-text rules keep working as prompt guidance and are **relabelled honestly** on the surface
(§2.3) until an enforced predicate for them exists. We do not render a free-text rule beside an
enforced one in the same list with the same weight. That is the lie.

**F3. A human cannot write a house rule. There is no function for it.**

`house-rules.functions.ts` exports `listHouseRules`, `decideHouseRule` and `supersedeHouseRule`. A
rule can only enter the system one way: the weekly steward pass at
`api/public/hooks/house-rules-tick.ts` clusters validated learnings, calls a model, and inserts
`pending` drafts for a human to approve. The only human authoring path is writing *replacement* text
for a rule the machine already drafted.

So the ratified definition, *"a standing rule **you wrote**"*, describes a capability that does not
exist. `createHouseRule` is a required function, not a nice-to-have (§11, B1).

**F4. `consent-classes.ts` is this surface, already built, and read-only.**

Four consequence classes, derived from the same `isSideEffectingTool` / `isExternalTool` / `toolRisk`
primitives the loop enforces with, each with a plain-words posture and a one-line rationale:

| Class | Posture | Rationale, verbatim |
| --- | --- | --- |
| Read-only research | Auto-run | `Safe to run on its own. Nothing to undo.` |
| Internal writes | Ask first | `A quick confirm before each run. Reversible if one slips through.` |
| Stakeholder-facing and external | Draft to you, batch-approve daily | `Supaprod drafts, you release. Auto-send is opt-in, per destination.` |
| Repo writes and irreversible | Always gate | `These never run unattended. You review and release each one.` |

`CONSENT_PHILOSOPHY` is already the memorable line: `Supaprod drafts. You release. Nothing
stakeholder-facing sends itself.` The file's own header says the intent out loud: *"so a person sets
consent once per class instead of tool by tool"*. **It has no setter.** It renders a policy the user
cannot change, below a per-tool control that ignores it. Section 5 makes it the spine of the surface
and gives it the setter.

**F5. The resolved default for a brand-new workspace is more autonomous than anyone has written
down.** Because `loadAgentArc` returns `trusted` and `resolveApprovalMode("confirm", "trusted")`
returns `"auto"`, **every seeded `confirm` tool runs inline on day one** unless a floor catches it.
Full derivation and defence in §6. This is a good default and nobody in the rebuild folder knows it
is the default.

**F6. The same three modes render in three different vocabularies.**

| Where | The words |
| --- | --- |
| `language/FINAL-language.md` §4.4, ratified divergence | `Runs on its own` / `Asks me first` / `I check the output` |
| `ControlsPanel.tsx:113` `OVERSIGHT_STOPS` | `Auto` / `Ask first` / `Review` |
| `_authenticated.settings.tsx:2472` `approvalForAgent` | `runs alone` / `asks first` / `needs review` |
| `consent-classes.ts` postures | `Auto-run` / `Ask first` / `Draft to you` / `Always gate` |

Four vocabularies, three values. §3 rules one.

---

## 2. WHAT A BOUNDARY IS, IN THE USER'S WORDS

### 2.1 The word, and the amendment it needs

**The word is `House rule`.** Ratified, and it is the right word: it is domestic, it is plainly the
user's own, it implies standing rather than per-item, and it is the only word in the judgment
vocabulary that is not about a single item.

The ratified definition is half a definition:

> *A standing rule you wrote that decides when your crew must stop and ask you.*

That covers tightening and misses granting, which is the half the founder's ruling is about. A
product where every house rule adds a stop is a product where the boundary surface is a machine for
manufacturing interrupts. **Amendment, for `language/FINAL-language.md` §2.4:**

> **House rule.** A standing rule you wrote about what your crew does on its own, and what it must
> stop and ask you about.
> _Banned beside it: guardrail, policy, gate, permission, constraint, boundary, rule engine, policy
> engine, automation rule._

Two words are added to the ban list. `boundary` is banned as a **product** word specifically so this
document's own vocabulary cannot leak onto a screen, in the same way `register` and `absorbed` are
doctrine-only in `edge/FINAL-edge.md`. `rule engine` is banned because the entire design in §4 exists
to make sure nobody ever thinks they are configuring one.

### 2.2 The in-app line, revisited

`language/FINAL-language.md` ratified **"You make the calls. Your crew does the work between them."**
The principle document flags it for re-examination and is right to. It reads as per-item approval and
it makes the calls the spine.

**Ruling: replace it.**

> **You write the house rules. Your crew works inside them.**

It survives every test the original passed. Eight words, one syllable each bar two. Both nouns are on
the ratified list. It states the division of labour in the founder's own order (work is the spine,
the rule is the frame). And unlike the original, it is falsifiable by the product: if the user has
written no rules and is approving fourteen things a day, the sentence is visibly a lie, which is
exactly the pressure we want on ourselves.

The `Call` vocabulary is untouched. `Approve` / `Send back` / `Decline` / `Snooze` still govern the
small number of things that genuinely cross a rule. What changes is that a Call is no longer the
thing the product is *about*.

### 2.3 The three shapes, and the one we may not offer yet

A user thinks in sentences, not in axes. But a sentence has to land on storage, so the three shapes
are the three things we can actually store and enforce:

**Standing** answers *how much does this get done without me*.
`Engineer opens pull requests on its own.`
Writes `agent_tool_modes` (per agent and kind of work) or `agent_tools.mode` (whole crew) or
`agent_autonomy.arc` (whole agent, all work). Enforced by `resolveToolMode`.

**Reach** answers *how far may this one go at all*.
`Scout never touches anything outside this workspace.`
Writes `agents.max_tool_risk`. Enforced by `capToolsByRisk`, which removes the tool from the agent's
prompt entirely, so the agent cannot even name it. Reach is stronger than standing and users should
be told so in one clause: **a rule about standing decides who asks; a rule about reach decides who
can.**

**Ceiling** answers *how much may this cost before it stops*.
`Nothing spends past $5 on one run.`
Writes `mission_spend_cap_usd` / `mission_token_cap`. Enforced at `runtime.server.ts:233`, which
halts the run with `Mission spend cap reached`. Today these are per-run values set by whichever caller
happened to pass them and **there is no user-facing control at all**. Wiring a workspace default that
`executeLoop` reads is the single highest value-per-line item on the build list (§11, B2), because a
spend ceiling is the boundary a first-time user most wants and most expects to exist.

**The fourth shape, which we may not offer:** conditional rules over the world.
`Nothing merges on a Friday.` `Anything touching billing comes to me.` `Do not contact a customer
without Reviewer signing off.`
These have no predicate, no evaluator and no storage. They are exactly what F2 is about. They keep
working as prompt guidance and they are rendered on the surface **in a separate band, honestly
labelled** (§5.2, band four): `Written guidance. Your crew reads these. They are not enforced.` That
sentence is uncomfortable and it is the only defensible thing to print. It also does more work than a
year of roadmap: it makes the enforcement gap visible to us every time we open the screen.

### 2.4 What a house rule is not

- **Not a floor.** `studio.pr.merge`, `studio.revert` and `delegate.openhands` are `review`-pinned in
  `HIGH_RISK_FORCE_REVIEW` and never graduate. A production deploy, anything a customer sees, and
  anything spending past a cap are Calls by `edge/FINAL-edge.md` Q2 and are not settings. They render
  on this surface as **facts, in the same list, with no control**, which is what makes the
  controllable rows feel safe (`agents/FINAL-agent-presence.md` §8.3 reached the same conclusion
  independently).
- **Not a guardrail.** Content filtering over model text lives in the engine room's Safety room and
  stays there. The words do not appear on this surface.
- **Not a kill switch.** `setWorkspacePause` is an act, not a rule. It stays where it is.

---

## 3. THE VOCABULARY FOR DEGREES OF AUTONOMY

### 3.1 Three words, ruled once, one file

The lexicon's ratified divergence table wins, verbatim, everywhere:

| Stored value | The user reads | Never |
| --- | --- | --- |
| `auto` | **Runs on its own** | Auto, Autonomous, Unattended, Hands-off, Runs alone |
| `confirm` | **Asks me first** | Confirm, Ask first, Needs confirmation, Gated |
| `review` | **I check the output** | Review, Needs review, Reviewed, Supervised |

One map, one file, `src/lib/autonomy-words.ts`, imported by every renderer. Delete
`OVERSIGHT_STOPS`, delete `approvalForAgent`'s label branch, delete `TRUST_LADDER_LABEL`. Add the
lint rule `no-autonomy-label-literal` beside `no-agent-name-literal` in
`language/FINAL-language.md` §12.3: no string literal may contain one of these three phrases except
through that module.

Note the grammar the founder's frame requires: **all three are written from the user's side, and two
of them contain the word "me".** `Runs on its own` is the only one that does not, because it is the
only one where the user is not in the loop. That is not decoration, it is the sentence teaching the
model.

### 3.2 The consent postures are a fourth word and they must resolve

`consent-classes.ts` adds `Draft to you, batch-approve daily`, which maps to `confirm`. That is a
fourth label for a third value, and under law 1 of the language contract one of them is deleted.

**Ruling:** the class posture is not a mode label, it is a *class description*, and it is rewritten so
it cannot be mistaken for one. The class row reads its posture in the three words plus a consequence
clause:

```
Stakeholder-facing and external      Asks me first
Anything that leaves the workspace but can be taken back.
```

`Supaprod drafts. You release. Nothing stakeholder-facing sends itself.` survives as the surface's
one-line thesis, because it is a claim about the product, not a label on a control. It has one
problem: `Supaprod` is the product speaking its own name in the first person, and
`language/FINAL-language.md` bans `we` / `us` / `our` while allowing the product name. It is legal.
Keep it.

### 3.3 The four-rung ladder is deleted from the user's view

`trust-ladder.ts` names the four `Arc` values `Supervised -> Reviewed -> Trusted -> Autonomous`.
`autonomy-progression.ts` names three of them again as a workspace-wide observational stage.
`agent_autonomy.arc` composes with `agent_tools.mode` through `resolveApprovalMode` to produce the
answer that actually holds.

**Ruling: the rungs never render.** Reasons, in order of weight:

1. **The composition is not intuitable.** `trusted` silently converts every `confirm` tool to `auto`.
   A user who sets a tool to `Asks me first` and an agent to `Trusted` gets an agent that does not
   ask. Four rungs times three modes is twelve states, of which the user can predict maybe four.
2. **`arc` is a deleted word.** `language/FINAL-language.md` §2.8: *"`station`, `face`, `swarm`,
   `lane`, `arc` and `blast radius` are deleted everywhere, code included."* The ladder is the arc
   wearing four nicer names.
3. **A ladder is a dial. This surface is sentences.** The whole design in §4 stands on the claim that
   a person expresses a boundary by completing a sentence. A four-rung slider next to it is the
   settings page we are trying to leave.
4. `Supervised` and `Reviewed` also collide with the agent named Reviewer, which the lexicon already
   flags as the reason the `review` value diverges from its label.

**`setAgentArc` is not deleted.** It becomes the write target for the whole-agent shape of a standing
rule. Writing `Engineer asks me first on everything` calls `setAgentArc(agentId, "proving")`. Writing
`Engineer runs on its own` calls `setAgentArc(agentId, "trusted")`. The user never sees the enum, the
rung, or the word. `ambient` remains reachable only through the explicit whole-crew sentence, which
preserves `trust-ladder.ts`'s honest note that the top rung is always a human click.

`autonomy-progression.ts` is deleted outright. It is a second, observational, non-binding ladder over
a ratio that is never stored, rendered on Today. It is the "two counts disease" the IA bans, applied
to the concept this surface owns.

---

## 4. HOW A PERSON WRITES ONE, WITHOUT A RULE LANGUAGE

### 4.1 The shape: one sentence, three fixed slots, no free text

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   [ Engineer ▾ ]   [ runs on its own ▾ ]   on   [ opening a pull    │
│                                                   request ▾ ]        │
│                                                                      │
│   and stops if it would spend past  [ $5 ▾ ]        (optional)       │
│                                                                      │
│   Right now: Engineer asks you first. This happened 14 times in the  │
│   last 30 days and you approved every one without a change.          │
│                                                                      │
│   [ Write the rule ]                                     Cancel      │
└──────────────────────────────────────────────────────────────────────┘
```

Four properties make this not a rule language:

- **Every slot is a closed list.** There is no operator, no boolean, no nesting, no free text field
  anywhere in the composer. You cannot write a rule that does not compile because you cannot express
  one.
- **The sentence is the whole UI.** No "conditions" section, no "actions" section, no IF and no THEN.
  Reading the row is reading English.
- **The current state is stated before you change it**, drawn from real counts, so the user is never
  editing blind. This is the single line that turns the composer from a settings form into a
  decision.
- **The optional clause is genuinely optional and appears at most once.** Two clauses is a rule
  language.

### 4.2 The slot inventories, all real data

**Slot 1, who.** The thirteen crew names from `crew.ts`, plus one entry at the top: `Your crew`
(whole workspace, writes `agent_tools.mode`). Sourced from `listAgents`. Nothing invented.

**Slot 2, how.** The three words from §3.1. Never more, never fewer. When the chosen combination is
floored, the illegal option is not hidden, it is present and disabled with the reason inline, which
`ModeSegment` already does correctly today (`This tool never runs unattended. Safety floor.`).

**Slot 3, what kind of work.** Two levels, and this is where `consent-classes.ts` earns its place:

| Level | Entries | Source |
| --- | --- | --- |
| Class (default, four entries) | Read-only research · Internal writes · Stakeholder-facing and external · Repo writes and irreversible | `CONSEQUENCE_CLASS_ORDER` |
| One kind of work (expand) | the enabled tools inside that class, by `display_name` | `listTools` filtered `enabled && mode !== "off"` |

The class level is the default because setting consent once per class is the whole point of the file,
and because four choices is a decision while fifty is a chore. The tool level is one click away for
the user who wants `opening a pull request` specifically and not `everything that leaves the
workspace`.

Tool display names need one pass. `Merge Studio PR` and `Open Studio PR` carry a dead noun that
`language/FINAL-language.md` §12.1 bans outright, and `agent_tools.display_name` is a seeded column
that renders directly to users, which puts it in the §4.5 "freeze is not acceptable" category.

**The optional ceiling clause.** Only thresholds with a real enforcement path may appear:

| Clause | Enforced by | Status |
| --- | --- | --- |
| `stops if it would spend past $N` | `runtime.server.ts:233` | **plumbing exists, no workspace-level setting.** B2. |
| `stops after N thousand tokens` | same | same. Probably never exposed; spend is the word a PM has. |
| `only on bets scoring above N` | `event_subscriptions.filter.min_score` | exists, currently buried in `Auto-pipelines` |
| `only within its reach` | `agents.max_tool_risk` | exists, currently a select labelled `Tool reach` |

Nothing else. If a user wants `not on Fridays`, the composer does not have that word, and the empty
state of band four (§5.2) tells them what to do instead: write it down as guidance, and know it is
guidance.

### 4.3 The three ways in, in order of how often they should be used

**Most rules should not be written from this surface at all.** The composer is the fallback.

1. **From a Call you just answered.** After `Approve`, the Commit ceremony
   (`agents/FINAL-agent-presence.md` §9) writes the receipt. When this is the *n*th identical
   approval, the receipt grows one quiet line: `That is 14 in a row. Let Engineer do this alone?`.
   One click writes the rule. This is the mechanism in §8 and it is the primary path.
2. **From a receipt of unattended work.** A thing the crew did alone that you did not like, with a
   quiet `ask me next time` on the receipt itself. This is `agents/FINAL-agent-presence.md` §8.3's
   claw-back ruling and it is correct: *"that is where the feeling occurs, so that is where the
   control belongs."* It writes the tightening rule and calls `revokeTrustGraduation` when the row
   was earned.
3. **From the House rules pane.** Deliberate, for the user who arrived wanting to set something
   before it happens. Also the only place a rule is *edited* or *deleted*.

The ratio is the design target: **paths 1 and 2 should write most rules.** If the pane's composer is
where rules come from, we have built a settings page with better typography.

### 4.4 What the composer refuses to do, and says so

- It will not accept a sentence about time, a person, an amount other than spend, or a named
  external system. The words are not in the lists.
- It will not let a rule loosen a floor. The option is visible and disabled with the reason, never
  absent, because absence teaches nothing.
- It will not accept two rules that contradict. The later one supersedes the earlier, using the
  existing `artifact_lineage` `supersedes` edge that `supersedeHouseRule` already writes, and the
  superseded rule stays readable in the record.

---

## 5. THE SURFACE

### 5.1 Where it lives, and the IA override

**`?pane=rules`, a pane in the one room, keystroke `h`.**

This overrides `ia/FINAL-ia.md` §2.4, which places `autonomy (Autonomy & approvals)` in the Settings
overlay under the Agents group. The override uses IA's own argument, made two paragraphs later in the
same section:

> *"a prompt, a guardrail and a cap are how the engine runs, and their results are read next to them.
> Splitting definition from result across two destinations is how `/engine-room` became unreadable."*

A house rule is the strongest case that argument has. Its result is a Call that did not happen, and
the only place you can see that is beside the work. Three further reasons:

1. **Path 1 and path 2 in §4.3 both write from outside the pane.** A rule written from a receipt has
   to be *visible* somewhere the user can get back to in one keystroke, not three clicks inside a
   modal over the room.
2. **`shell-question/FINAL-shell-ruling.md` item 9** assigns `How do I change how it behaves` to the
   gear. House rules do not change how the app behaves. They change **what your crew is allowed to
   do**, which is item 6's territory (`what is waiting on me`) read from the other end.
3. The founder's 2026-07-29 verdict says the settings **content pane** is the part that is not
   working. Adding the most important new surface in the product to it is the wrong bet.

Settings keeps exactly one row in the Agents group, `House rules`, whose entire body is a sentence
and a link into the pane. No duplicate control. `settings-sections.ts` keeps its shape; the
`autonomy` section id survives as a redirect so no legacy `?section=autonomy` link breaks.

**The shell presence already exists and needs no new chrome.** `agents/FINAL-agent-presence.md` O3
already redefined rail tile 5 as `Your crew`, counting open graduation proposals plus agents whose
standing changed this week. That is the boundary's permanent presence in the nine. Nothing is added
to the shell.

### 5.2 The anatomy: four bands, one screen, no scrolling

The founder's 2026-07-29 density ruling governs: tight, compact, real air, one or two lines per row,
depth one click away.

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
  Reviewer   checks diffs on its own           you, 3 Jul            ›
  Scout      cannot reach outside this workspace  you, 1 Jul         ›

  CEILINGS
  One run stops at                $5.00                   you, 3 Jul  ›
  At most                         5 runs at once           our default ›

  WRITTEN GUIDANCE                              Your crew reads these.
                                                They are not enforced.
  "Prefer boring solutions over clever ones."             accepted 8 Jul ›
  "Ship behind a flag when the change touches checkout."  accepted 8 Jul ›

─────────────────────────────────────────────────────────────────────────────
  2 things crossed a rule this week.                      see them  ›
─────────────────────────────────────────────────────────────────────────────
```

**Band 1, what runs without you.** The four `consent-classes.ts` rows, each with its resolved mode
and its provenance. This is the answer to *"what do I actually have"* in four lines. Click a row to
expand the tools inside it, which is `groupToolsByConsequenceClass` already returning them.

**Band 2, by agent.** Only agents that differ from band 1, so a workspace with no per-agent rules
shows an empty band with one line: `No agent has its own rule. They all follow the four above.`
The header count (`3 differ from above`) is the honest summary.

**Band 3, ceilings.** Spend, and concurrency (`MISSION_CONCURRENCY_CAP`, currently a hard-coded 5
rendered read-only in `ControlsPanel`). Both stated as sentences, both with provenance.

**Band 4, written guidance.** The free-text house rules from the steward pass, under the label that
tells the truth about them. Ordered last on purpose: it is the least powerful band and the one we
want smallest.

**The footer is the honesty line.** `2 things crossed a rule this week` is drawn from real
`agent_approvals` rows whose gate is attributable to a rule. If it reads zero for a workspace with
rules, either the rules are right or they are dead, and the link says which.

**What is not on this screen:** guardrails, kill switch, the trust score, any number between 0 and
100, any meter, any progress bar, the four rung names, `Auto-pipelines` (that is routing, it moves to
the engine room's Safety room), and the recent-runs usage table.

### 5.3 The provenance column, which is the whole trust argument in one word

Every row states where its rule came from, and there are exactly four values:

| Value | Meaning | Source of truth |
| --- | --- | --- |
| `our default` | Nobody chose this. We did, and here is why. | no row exists |
| `you, 12 Jul` | You wrote it. | `agent_tool_modes.source = 'operator'`, `agent_autonomy.set_by` |
| `earned, 12 clean runs` | It asked, you said yes, here is the evidence. | `agent_tool_modes.source = 'graduation'` |
| `always` | A floor. Not a setting. | `HIGH_RISK_FORCE_REVIEW`, `HIGH_RISK_MIN_CONFIRM` |

This directly satisfies constitutional clause C from the principle document: *"a boundary the user did
not set is not policy, it is a default we chose for them. Defaults must be visible, explained, and
changeable."* The word `our default` is the visibility, the row's expansion is the explanation, and
the row itself is the change. `agent_tool_modes.source` already distinguishes `graduation` from
`operator` and `agent_autonomy.set_by` is already `NULL` for machine writes, so three of the four
values need no new storage.

### 5.4 The first visit, and the Engine-Room test

A brand-new workspace opens this pane and sees **band 1 fully populated with four `our default`
rows**, band 2 empty with its one honest line, band 3 with two defaults, band 4 empty. Not a blank
slate, not an onboarding wizard, not a "get started" card. **The product arrives with an opinion and
shows its work**, which is the only defensible answer to "a new user has no record to trust an agent
on" (§6).

The one-sentence empty state under the header on first visit:

> `Your crew is already working inside these. Change any line, or leave them and watch what happens.`

**Engine-Room:** `agent_tools.mode / agent_tool_modes / agent_autonomy.arc / agents.max_tool_risk /
mission_spend_cap_usd -> absorbed into four sentences per band, each with a provenance word -> the
user reads what their crew may do alone in one screen and changes it by completing a sentence.`

The doctrine's own test passes: the mechanism words (`mode`, `arc`, `cap`, `blast radius`, `tool`)
appear nowhere; the outcome is named; depth is one click into a row.

---

## 6. DEFAULTS FOR A BRAND-NEW WORKSPACE

### 6.1 What the defaults resolve to today, derived

A new user gets `seed_default_agent_tools` + `seed_studio_tools`, no `agent_autonomy` rows, no
`agent_tool_modes` rows, and `max_tool_risk = NULL`. Running that through `loadAgentArc` (returns
`trusted`) and then `resolveToolMode`:

| Kind of work | Seeded | Resolved | Because |
| --- | --- | --- | --- |
| Reads, search, repo tree, web search | `auto` | **runs on its own** | never gates: only `write` and `planning` categories reach the queue at all (`loop.server.ts:1150`) |
| Memory | `auto` | **runs on its own** | same |
| Internal writes: tasks, notes, signals, specs, prioritisation | `confirm` | **runs on its own** | `trusted` lifts `confirm` to `auto`; then the low-risk auto-clear would have done it anyway (internal + reversible = `low`) |
| Build lane: stage, commit, open PR, sync branch | `auto` | **runs on its own** | `BUILD_LANE_AUTONOMOUS` exempts them from the high-risk demotion. Founder ruling 2026-07-08 |
| Open a GitHub issue, link a spec to an issue | `confirm` | **runs on its own** | external but reversible = `medium`, so no floor catches it, and `trusted` lifts it |
| Hand off to another agent | `confirm` | **runs on its own** | internal, reversible |
| Create a calendar event | `confirm` | **asks you first** | `HIGH_RISK_MIN_CONFIRM`. Can never reach `auto` at any setting |
| Merge the pull request | `review` | **you check the output** | `HIGH_RISK_FORCE_REVIEW`. Never graduates |
| Roll back a release | `review` | **you check the output** | same |
| Hand a build to an external agent | `review` | **you check the output** | same |
| Any tool not in `CONSEQUENCES` | any | **asks you first** at best | `toolRisk` fails closed to `high` |
| Spend on one run | none | **no ceiling** | nothing sets `mission_spend_cap_usd` by default. **The one indefensible default.** B2 |

### 6.2 The defence, one line per default

The principle document's third constitutional clause requires these to be defensible, not merely
visible. Each of these sentences is printable in the row's expansion.

| Default | The defence |
| --- | --- |
| Reading runs on its own | Reading changes nothing. There is nothing to undo, so there is nothing to approve. |
| Internal writes run on their own | A task, a note or a draft spec lives in your workspace and you can delete it in one click. Asking first would buy a confirmation and cost the whole point. |
| The build lane runs on its own | A branch and a draft pull request are isolated from your code. Nothing reaches your codebase except through the merge, and the merge always stops. |
| Opening an issue runs on its own | It leaves the workspace but you can close it. Reversible and visible is not the same as irreversible. |
| A calendar event asks first | It appears in another person's day. That is not ours to undo. |
| A merge always stops | It puts code in your repository. `edge/FINAL-edge.md` Q2: we cannot undo it from inside this product without asking someone outside to cooperate. |
| A rollback always stops | Customers saw the thing you are rolling back and will see the thing you roll forward to. |
| An unknown tool asks first | We have not written down what it does, so we assume the worst. This is `toolRisk` failing closed and it is the right failure. |
| **Agents start trusted, not supervised** | See below. It is the one default that needs a paragraph. |

**Why a brand-new workspace is trusted, when the user has no record to trust it on.**

This is the assignment's sharpest question and the honest answer is not "because it has earned it".
It has not. The answer is that **the record is not what makes it safe. The floors are.**

`edge/FINAL-edge.md` §4.2 already ruled it and gave the reason: *"it starts working, and it tightens
the moment there is evidence of harm."* The safety property does not come from a probation period, it
comes from four things that hold on run one exactly as hard as on run one thousand:
`resolveApprovalMode` never loosens a tool past its own mode; `toolRisk` demotes every high-blast tool
regardless of standing; `HIGH_RISK_FORCE_REVIEW` never graduates at any setting; and every
irreversible act is a Call by construction, not by policy.

A probation period would buy the *feeling* of safety, at the cost of the product's entire claim in
the first ten minutes. It is also dishonest in a specific way: five clean runs of `tasks.create` tell
you nothing about whether the sixth should be allowed. **Starting supervised and counting to five is
theatre with a number on it.** The floors are the real thing, and they are visible on this surface as
the `always` rows.

**What the user is owed in exchange for this default, and it is not optional:**

1. It is labelled `our default` on every row until they touch it, forever.
2. The one line at the top of the pane is the truth: `Your crew is already working inside these.`
3. **Everything unattended lands in "Done without you"** (`edge/FINAL-edge.md` C2, and `ExecutedCard`
   is 547 lines with zero importers today). Without that, this default is not autonomy, it is
   opacity. This is a hard precondition on shipping the default, not a related improvement.
4. Tightening is always one click, from the receipt, at the moment of the feeling.

**The one default we should change:** there is no spend ceiling. A first run that costs $40 because a
loop went sideways is the fastest way to lose a user permanently, and `mission_spend_cap_usd` is
already enforced. **Ship a workspace default and make it visible on this surface in band 3.** The
number is a pricing question for the founder, not a design question, but the absence of any number is
indefensible.

---

## 7. EDITING A RULE, AND WORK ALREADY IN FLIGHT

Three cases, and they are not symmetric. The asymmetry is the design.

### 7.1 Loosening: takes effect on the next run, never retroactively

You write `Engineer opens pull requests on its own`. There are three approvals sitting in the tray
that Engineer is waiting on.

**Ruling: the three in the tray stay.** They are cleared, not auto-approved, and the pane says so:

> `From now on Engineer opens pull requests on its own. Three are still waiting on you from before.
> Clear them?` `[ Approve all three ]` `[ Leave them ]`

Auto-approving in-flight items on a rule change is the single most dangerous behaviour available on
this surface: it converts one click into N irreversible acts with no per-item read. `Approve all
three` is offered because it is honest and the user is standing right there, and it is a **secondary**
control, never the default action, and never automatic.

Mechanically this is why the rule takes effect at run start: `loop.server.ts` loads `modeOf` once at
line 535 and overlays `agent_tool_modes` immediately after. A rule written mid-run does not reach the
running loop, which is the correct behaviour and should be stated rather than fixed.

### 7.2 Tightening: takes effect immediately, including on work in flight

You write `Engineer asks me first on pull requests` while Engineer is three steps into a run.

**Ruling: it binds the current run at its next tool call.** Safety needs no permission
(`edge/FINAL-edge.md` §4.2), and a tightening that waits politely for the run that worried you to
finish is not a control. Implementation is one read: the loop re-reads `agent_tool_modes` per tool
call rather than once at run start, for tightenings only. The cost is one indexed query per gated
call; the loop already does far more per step.

The receipt is written from the run's side, not the rule's:

> `Engineer stopped. You asked to see pull requests first, 40 seconds ago.`

This is the sentence `edge/FINAL-edge.md` §3.5 wanted (`Engineer stopped because of your rule`) and
it is true for this shape of rule, unlike the Friday example.

### 7.3 Deleting: a rule is superseded, never erased

`supersedeHouseRule` already writes an `artifact_lineage` `supersedes` edge and keeps the old row
readable. Extend the same convention to the standing and reach shapes: deleting a rule reverts the
row to `our default` and leaves the change in the record. A user must be able to ask *"why did this
change in July"* and get an answer.

`revokeTrustGraduation` is the specific case of this for an earned rule and it does not exist
(`agents/FINAL-agent-presence.md` G4 already rules it a hard gate: *"a trust mechanic whose withdrawal
path does not exist is not a trust mechanic"*). It writes a `capability_changes` receipt, and it does
not delete the approved proposal, so the twelve clean runs stay on the agent's record. The ceremony is
gentle by ruling: `Reviewer will ask you again before checking a diff. Its 12 clean runs stay on its
record.`

### 7.4 A floor cannot be edited, and the attempt is answered

Tapping `you check the output` on the merge row does not open a control. It opens the row and states
the reason:

> `This one always stops. Merging puts code in your repository and we cannot take it back from here.`
> `Nothing you can set changes this.`

`agents/FINAL-agent-presence.md` §8.3 is right that this row is what makes the others feel safe.

---

## 8. HOW THE PRODUCT PROPOSES RULES FROM THE RECORD

This is the mechanism that turns the approvals queue into the input for its own elimination, and it
is the one part of this design where nothing has to be invented, only connected.

### 8.1 The mechanism that already runs

`maybeProposeTrustGraduations` fires after every completed run. It reads the last 300 decided
`agent_approvals` for that agent, computes a per-tool clean streak with `computeCleanStreaks`
(`executed` extends, `rejected` or `failed` breaks, everything else is neutral), and at
`TRUST_RAMP_CLEAN_N = 5` writes one `trust_graduation_proposals` row per tool, honouring the ceilings
in `nextRampMode`. A `missed` outcome attributed to that agent inside 30 days blocks every proposal.
Acceptance through `decideTrustGraduation` is the only write path to a graduated mode.

**That is the whole engine.** It is better than the principle document's example sentence, because
`executed` means *you said yes and the tool then ran clean*, which is a stronger claim than
*you approved fourteen*.

### 8.2 Four suggestion families, three of which are new connections of existing data

| Family | Trigger, from real data | The sentence |
| --- | --- | --- |
| **Loosen one kind of work** (exists) | 5 consecutive `executed` for one (agent, tool) | `Reviewer wants to stop asking.` |
| **Loosen a whole class** (new) | every tool in a `consent-classes` class is at `auto` except one, and that one has a clean streak | `Everything else that stays inside your workspace already runs alone. This is the last one asking.` |
| **Tighten** (new, and it must exist) | 2 `rejected` or `sent back` in a row on a tool currently at `auto`, or one `missed` learning attributed to the agent | `Engineer opened three pull requests you sent back. Want to see them first from now on?` |
| **Retire a dead rule** (new) | a rule with zero hits in 90 days | `Nothing has crossed this rule since April. Keep it?` |

The tightening family is not symmetry for its own sake. A suggestion engine that only ever proposes
more autonomy is a machine arguing for its own freedom, and a user will read it that way within a
month. **The engine must be visibly willing to argue against itself**, and the data for it already
exists in `rejection-learning.ts` (`summarizeRejections`, already imported by
`governance.functions.ts` and, as far as I can find, surfaced nowhere a user will look).

### 8.3 The asymmetry law, restated for this surface

`depth/FINAL-depth.md` R-13 and `edge/FINAL-edge.md` §4.2 both rule it and it is binding here:

> **A tightening may apply itself. A loosening may only ever propose.**

With one addition this lane is responsible for: **a tightening that applies itself writes a receipt
naming the evidence.** `Engineer will ask you first on pull requests. Two in a row came back.` A
silent tightening is defensible; an invisible one is not, because the user then cannot find the rule
that is slowing their crew down.

F1 in §1 is the live violation of the first half of this law and is the first thing to fix.

### 8.4 The card, and where it lives

`agents/FINAL-agent-presence.md` §8.2 already designed the graduation card in full and it is good.
This lane adds three things it did not resolve:

1. **The card is not only in the tray.** Its most valuable placement is inline in the Commit receipt,
   at the moment of the *n*th identical approval, because that is when the user is already thinking
   about this exact decision. The tray copy is the fallback for the user who did not act on it there.
2. **Rate limit, hard.** At most one loosening suggestion per agent per week, and at most three open
   across the workspace at any time. A queue of suggestions to eliminate a queue is a joke the user
   will make before we do.
3. **The cooldown gate is real** and `agents/FINAL-agent-presence.md` G2 already rules it: the card
   may not say `it will not ask again for 30 days` until `TRUST_RAMP_COOLDOWN_MS` and its predicate
   in `shouldProposeGraduation` ship in the same commit. Today `decideTrustGraduation(accept: false)`
   writes `rejected` and nothing stops a re-proposal on the next streak.

### 8.5 The measurement that proves this worked

Two numbers, and they must be instrumented before the surface ships or the whole thesis is
unfalsifiable:

- **Calls per shipped run**, over time. This is the number the founder's question is really about. If
  it does not fall, the boundary surface is decoration.
- **Share of standing rules whose provenance is `earned` or `you`, versus `our default`.** If it stays
  near zero after a month of real use, either the suggestions are wrong or nobody trusts them, and
  both are findable.

`depth/FINAL-depth.md` R-12 already requires a decide-path parameter on the merged `decideGate`
function. The rule-provenance dimension lands in the same place, in the same commit.

---

## 9. TRUST GRADUATION AS AN EXPERIENCE

### 9.1 Why it currently lands as a toast

`decideTrustGraduation` works. The proposal is well-guarded. The evidence is countable. And accepting
it produces `"Approved."` in a toast, because **there is nowhere for the thing that just changed to
land.** A graduation changes an agent's standing, and until this document there was no surface that
renders an agent's standing. The moment is flat for a structural reason, not a craft reason.

### 9.2 What this lane adds to `agents/FINAL-agent-presence.md` §8

That document owns the card, the four backing facts, the claw-back placement and the two hard gates.
This lane owns where the change *lands*, which is what makes it feel like leverage rather than
paperwork.

**The Commit ceremony, applied to a graduation.** The four beats
(`agents/FINAL-agent-presence.md` §9) hold, with one substitution at beat 2, which that document
already anticipated (*"if nothing picks it up, no arrow, and the line says what changed instead"*):

```
Beat 1  0-180ms     the card becomes a receipt
                    You let Reviewer check diffs on its own · 14:32

Beat 2  180-450ms   no arrow. The line says what changed:
                    That is one fewer thing waiting on you, from now on.

Beat 3  450-800ms   Reviewer's mark in the Crew Bar settles into its
                    working state. Nothing lights up. It is already going.

Beat 4  800-1200ms  the rail's ember count decrements, and the House rules
                    row for Reviewer writes itself in, provenance
                    "earned, 12 clean runs".
```

**Beat 4 is the whole point and it is the beat that does not exist today.** The user sees the rule
they just created appear on the surface that lists their rules. The abstract act (accepting a
proposal) becomes a concrete object (a line they own, that they can point at, and that they can take
back). That is the difference between a permission granted and a boundary set.

### 9.3 The waiting sentence, and why it is worth building

`depth/FINAL-depth.md` R-13's honesty corollary gives the exact copy:

> `2 more clean runs and I'll ask you to let me stop asking.`

Never `2 more and I stop asking`, which is a promise the product does not keep because graduation
requires a human. It renders on the Call card, quietly, when `computeCleanStreaks` puts that (agent,
tool) within two of `TRUST_RAMP_CLEAN_N`.

This one line is the highest-leverage sentence available to us, for a reason worth stating plainly:
**it makes an approval feel like an investment rather than a tax.** The user is still clicking
approve. But they are now clicking it toward something, and they can see the counter. It converts the
queue from the product's failure mode into the product's training signal, in the user's own
experience, for the cost of one string and one existing function.

### 9.4 The counter-argument, answered

*If graduation is the signature moment, are we not just making a better ceremony for a permission
system?*

No, and the distinction is exactly the principle document's table. A permission is answered in the
moment and blocks. A graduation is answered once and **removes** a class of future blocks. The user
is not approving work; they are deleting a category of interruption. It is the only interaction in
the product whose direct effect is that the product asks them less.

The honest limit: this only holds if the rest of the design does not manufacture new interrupts to
replace the retired ones. §8.4's rate limit is the guard, and §8.5's first number is how we would
find out.

---

## 10. WHAT MUST NOT BE LOST, RENDERED

The principle document names three things that must survive this correction. Each has a specific
rendering on this surface.

**1. Irreversibility is a real floor.** It renders as the `always` provenance value, on rows with no
control, with the reason stated when tapped. Four rows in a default workspace: merge, roll back, hand
off to an external agent, create a calendar event. **A schema change joins them the day it is
built**, per `edge/FINAL-edge.md` §3.3: *"A schema change is a Call at every autonomy level and is the
one Call that can never be granted to Runs on its own."* Add it to `HIGH_RISK_FORCE_REVIEW` in the
same commit as the capability, not after.

**2. Judgment has no oracle.** Which bet to take, and what an outcome means, are not on this surface
at all. There is no slot in the composer that can express them, because slot 3 is a closed list of
tool classes and `Keep` / `Drop` on a bet is not a tool call. This is enforced by the shape of the
composer rather than by a rule, which is the stronger form.

**3. A default we chose is not policy.** It renders as the word `our default` in the provenance
column of every untouched row, and the row's expansion carries the one-line defence from §6.2
verbatim. The lint rule that keeps us honest: every `our default` row must resolve a defence string
from the same module the defaults are defined in, so a default cannot be added without writing the
sentence that justifies it.

**And the fourth, which the principle document states and this surface depends on absolutely:
autonomy is paid for with evidence.** `ExecutedCard.tsx` is 547 lines with zero importers. Until
"Done without you" is mounted and complete, every default in §6 is opacity rather than delegation, and
the whole argument of this document fails. **It is a precondition, not a companion item.**

---

## 11. THE BUILD LIST

Ranked by whether the thing above it is a lie without it.

| # | Item | Why it is here | Size |
| --- | --- | --- | --- |
| **B0** | Mount `ExecutedCard` / "Done without you" | `edge/FINAL-edge.md` C2. Without it the defaults in §6 are opacity. Precondition for everything below. | component exists, needs a home |
| **B1** | `createHouseRule` server fn | F3. The ratified definition says "you wrote"; no such function exists. | small |
| **B2** | Workspace-level spend ceiling, read by `executeLoop` | §6.2. The one indefensible default. Enforcement already exists at `runtime.server.ts:233`. | small |
| **B3** | Delete the promotion branch of `auto_advance_agent_arc` | F1. A live violation of R-13 that silently undoes a user's own tightening. | one migration |
| **B4** | `src/lib/autonomy-words.ts` + the `no-autonomy-label-literal` lint | F6. Four vocabularies, three values. | small |
| **B5** | Setters for the four consequence classes | F4. `consent-classes.ts` renders a policy nobody can change. Writes `agent_tools.mode` for every tool in the class. | medium |
| **B6** | `revokeTrustGraduation` + `capability_changes` receipt | `agents/FINAL-agent-presence.md` G4, hard gate. Grant without ungrant is a safety gap. | small |
| **B7** | The House rules pane, four bands, `?pane=rules` | §5. | large |
| **B8** | The three-slot composer | §4. | medium |
| **B9** | Tightening suggestions from `summarizeRejections` | §8.2. Without it the engine only ever argues for its own freedom. | medium |
| **B10** | `TRUST_RAMP_COOLDOWN_MS` + predicate | `agents/FINAL-agent-presence.md` G2, hard gate on the card's copy. | small |
| **B11** | The waiting sentence on Call cards | §9.3. Highest ratio of felt value to lines of code in this document. | tiny |
| **B12** | Per-tool-call mode re-read for tightenings | §7.2. Makes an immediate tightening actually immediate. | small |
| **B13** | Rule-provenance dimension on `decideGate` | §8.5. Ship with R-12's decide-path parameter. | small |
| **B14** | Rename seeded `agent_tools.display_name` values carrying dead nouns | `language/FINAL-language.md` §4.5. `Merge Studio PR` renders to users. | one migration |
| **B15** | Delete `autonomy-progression.ts` and `trust-ladder.ts` from the user's view | §3.3. Two ladders over a deleted word. | small |

**Deliberately not built:** a rule language, a condition builder, a time-based predicate, a
policy-as-code editor, a per-destination auto-send matrix, and any per-rule simulation or dry-run.
Each is a real product someone will ask for and each converts this surface back into the settings
page it exists to replace.

---

## 12. AMENDMENTS TO RATIFIED CONTRACTS

| Document | Amendment | Reason |
| --- | --- | --- |
| `language/FINAL-language.md` §2.4 | House rule's definition gains the granting half; `boundary`, `rule engine`, `policy engine`, `automation rule` join its ban list | §2.1 |
| `language/FINAL-language.md` §2.7 | `Autonomy` keeps its definition but is no longer a rendered noun. It names the concept in docs. On screen, the three mode words carry it. | §3.1 |
| `language/FINAL-language.md` in-app line | `You make the calls. Your crew does the work between them.` is replaced by `You write the house rules. Your crew works inside them.` | §2.2 |
| `language/FINAL-language.md` §12.3 | new lint `no-autonomy-label-literal` | §3.1 |
| `ia/FINAL-ia.md` §2.4 | The `autonomy` Settings section is replaced by a one-line row linking to `?pane=rules`. The section id survives as a redirect. | §5.1 |
| `edge/FINAL-edge.md` §3.5 | The house rules row's example receipt (`nothing merges on a Friday`) is copy ahead of wiring. Replace with a shape that resolves to an enforced predicate: `Engineer stopped. You asked to see pull requests first.` | F2 |
| `edge/FINAL-edge.md` §4.2 | Ratified and strengthened: add that a self-applied tightening must write a receipt naming its evidence | §8.3 |
| `depth/FINAL-depth.md` R-13 | Ratified unchanged, and F1 identifies the live code that violates it | F1 |
| `agents/FINAL-agent-presence.md` §8.2 | Ratified. This lane adds beat 4 (the rule lands on the House rules pane) and the inline-in-receipt placement | §9.2 |
| `docs/conventions/engine-room-doctrine.md` | No change. The surface passes the Engine-Room Test as written (§5.4) | |

---

## 13. HANDOFF

**To lane A.** Two things from this lane bear directly on the doctrine audit, and both are code facts
rather than opinions, so they should be carried rather than re-litigated: **F1** (`auto_advance_agent_arc`
silently widens autonomy in production, violating R-13 and §4.2, and its only real-world effect is to
undo a user's own tightening) and **F2** (a house rule is prompt text with no enforcement, violating
`edge/FINAL-edge.md` C3, while two ratified documents already publish receipt copy that assumes it is
enforced). Also carry **C2**: the principle document's headline tell about `?? "confirm"` is wrong,
the loop fails closed before that line, and the real inversion story is the opposite one, that a fresh
workspace is already autonomous by default and nobody wrote it down.

**To lane C.** This surface consumes two things it does not own and cannot ship without.
First, **the evidence side**: every default in §6 and every loosening in §8 is only defensible because
`edge/FINAL-edge.md` C2's "Done without you" is complete, and `ExecutedCard.tsx` has zero importers
today. If lane C is sizing what proves autonomy, that component is the hinge. Second, **the receipt
grammar for a rule-caused stop**: §7.2 and §8.3 both need a receipt whose subject is a rule rather
than an agent (`Engineer stopped. You asked to see pull requests first, 40 seconds ago.`), which is a
new receipt shape, and the record must be able to answer *"which rule governed this decision"* as a
first-class field. `edge/FINAL-edge.md` §3.5 already calls that the cheapest legibility win available.

**To whoever authors the next visual direction.** The screen this document describes is four bands of
one-line rows with a right-aligned provenance word, and it is deliberately the least decorated surface
in the product. It is also a good test of the founder's 2026-07-29 colour ruling: monochrome carries
the rows, green and red do not appear at all (nothing here has a status), blue appears only if an
agent named in a row is working right now, and ember appears exactly once, on `+ Write`. If this
screen needs more colour than that to be readable, the information architecture is wrong, not the
palette.

---

## 14. RELATED

- The binding principle: [`../GOVERNANCE-PRINCIPLE.md`](../GOVERNANCE-PRINCIPLE.md)
- The founder's target state: [`../FOUNDER-VERDICT-2026-07-29.md`](../FOUNDER-VERDICT-2026-07-29.md)
- The absorption line and the Q1/Q2/Q3 sorter: [`../edge/FINAL-edge.md`](../edge/FINAL-edge.md)
- The graduation card, the claw-back, the Commit: [`../agents/FINAL-agent-presence.md`](../agents/FINAL-agent-presence.md)
- R-13, the asymmetry law: [`../depth/FINAL-depth.md`](../depth/FINAL-depth.md)
- The words: [`../language/FINAL-language.md`](../language/FINAL-language.md)
- Where panes live: [`../ia/FINAL-ia.md`](../ia/FINAL-ia.md)
- The nine permanently drawn things: [`../shell-question/FINAL-shell-ruling.md`](../shell-question/FINAL-shell-ruling.md)

**Code this document is built on, all verified 2026-07-29:**
`src/lib/ai/loop.server.ts` (`resolveToolMode`, the enablement fail-close at 1126, `modeOf` at 535) ·
`src/lib/ai/trust.server.ts` (`resolveApprovalMode`, `loadAgentArc`, `computeAllAgentTrust`) ·
`src/lib/ai/trust-ramp.ts` (`computeCleanStreaks`, `shouldProposeGraduation`, the two floor sets) ·
`src/lib/ai/reflection.server.ts` (`maybeAutoAdvanceArc`, `maybeProposeTrustGraduations`) ·
`src/lib/trust.functions.ts` (`setAgentArc`, `decideTrustGraduation`) ·
`src/lib/consent-classes.ts` · `src/lib/tool-consequences.ts` · `src/lib/house-rules.functions.ts` ·
`src/lib/guardrails.functions.ts` · `src/lib/governance.functions.ts` ·
`src/lib/approvals-queue.functions.ts` · `src/lib/trust-ladder.ts` ·
`src/lib/autonomy-progression.ts` · `src/lib/settings-sections.ts` ·
`src/components/governance/ControlsPanel.tsx` · `src/routes/_authenticated.settings.tsx` ·
`src/routes/api/public/hooks/house-rules-tick.ts` ·
`supabase/migrations/20260707230000_sw4_trust_ramp.sql` ·
`supabase/migrations/20260708150000_founder_autonomy_defaults.sql`
