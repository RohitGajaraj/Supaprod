# The Named-Journey Catalog

> _Created: 2026-08-03 · Last updated: 2026-08-03_

> Front-end reimagining, Phase R deliverable. Created 2026-07-19.
> Answers the founder's core test directly: where do I start, what happens next, how do I run just a slice.
> Every journey below maps to server functions that exist today in `src/lib/*.functions.ts`. Claim never outruns wiring: where the wiring is thin, the journey carries a GAP line instead of a promise.

## Ground truth this catalog is built on

- The loop spine: `nav-model.ts` fixes the 7 stages (01 Discover, 02 Decide, 03 Plan, 04 Design, 05 Build, 06 Ship, 07 Learn) plus Today, Brain, Pulse.
- The one pull point: `approvals-queue.functions.ts` federates ten gate families into one queue with one decide entry point (`decideApprovalItem`): tool_call, decision, memory_candidate, house_rule, trust_graduation, spec, opportunity, assumption_challenge, design_gate, playbook_proposal.
- Stage capability, verified per domain module:
  - Discover: `createSignal`, `bulkImportSignals`, clustering (`clusterSignalsCore`), ranked opportunities, `runCriticReview`, `runWedgeTeardown`, brief alignment (`brief-opportunity.functions.ts`), Researcher Watchtower (`researcher.functions.ts`).
  - Decide: `decisions.functions.ts` (create/update, assumption extraction, `resolveAssumptionChallenge`), decision precedent, fan-out exploration (`dispatchExploration`, 3 parallel children reconciled into one review card).
  - Plan: `generatePrd`, `prdAssist`, `generateTaskGraph`, roadmap, specs with Critic review and `status: review`.
  - Design: `design-scaffold.functions.ts` (AI HTML mockup from the spec, design-memory-aware, design Critic lens, `decideDesignGate`), per-workspace `design_stage_enabled` toggle.
  - Build: the native BuildDriver (BD-1, `build/native.server.ts`) wrapping the home-grown agent loop; `dispatchStudioSession` (mission + queued agent_runs), changeset diff/revisions, hunk-level accept/reject, constraints and touch-list enforcement, CI refresh, preview, `provisionRepoForSpec`, `canDispatchToRepo`, `triggerDeploy`.
  - Ship: `captureDeployments`, `listDeployments`, `promoteToProduction`, `rollbackRelease`, `generateReleaseNotes`, `generateLaunchKit` (channel copy), `launch-plan.functions.ts` (positioning from the decision's WHY, checklist, armed outcome-check window).
  - Learn: `outcome.functions.ts` (`getOutcomeData`, `checkPrdShipped`, `recordOutcome` writing outcome memory + supersession inference), `loops.functions.ts` (governed recurring passes with receipts), gauntlet proof metrics, changelog, stakeholder updates.
  - The one input: Ask dispatches missions with live canvas blocks (`ask-canvas.functions.ts`) and nothing evaporates (`ask-promote.functions.ts` promotes answers to notes/decisions/tasks).

---

## Part A: Six stakeholder lenses

Each lens gets the value story in their own language, then the journeys they actually run. Journey IDs refer to Part B.

### A1. The brand-new user (first 10 minutes)

**Value story in their words:** "It looked at my product and told me what to build, showed me why, and asked me one question. I answered, and it started building. I never had to learn the tool; the loop on the screen was the tool."

**What they must never feel:** ten destinations, an empty room, a palette they have to guess into.

**Journeys they run:** J-START (their whole first session), then J1 (What should we build next?) as their first real run. The demo seed (`demo.functions.ts`) means J1 has evidence in it on minute one.

**Lens verdict on the design:** the spine must read as a sentence on first paint (signals in, decisions in the middle, shipped software out, learnings back to the start). The composer's journey chips are the only start affordance they need.

### A2. The power user (daily operator)

**Value story:** "I clear my gates in five minutes, keep three slices running in parallel, and put the boring passes on loops. The machine works while I sleep; the queue is my inbox and it is always short."

**Journeys they run:** J-GATES (the sweep) first thing, J4 (Build this feature) several times a week, J-LOOP (put it on a loop), J3 (Just write the PRD) as a fast lane, J2 (Tear this idea down) before committing anything big.

**Lens verdict:** keyboard-first gate clearing, a Working strip that shows every in-flight slice at once, and journey chips that accept an artifact reference ("build SPEC-14") without a picker dance.

### A3. The working PM (feature owner, reports upward)

**Value story:** "My week is: catch up, decide, hand off, report. Supaprod does the drafting, the evidence pulling, and the status writing; I do the judgment. Every decision I make is on the record with its why, so I never re-litigate."

**Journeys they run:** J-CATCHUP (the daily briefing) every morning, J1 weekly, J3 constantly, J6 (Launch what we shipped) at release time, J-REPORT (update stakeholders) every Friday, J7 (How did it land?) after each launch.

**Lens verdict:** the Thread's daily Briefing is their anchor; gate cards must carry enough evidence to decide without leaving the card; the stakeholder pack must be one action from any shipped artifact.

### A4. The principal product leader (portfolio, precedent, delegation)

**Value story:** "I set the brief once (vision, ICP, positioning, top bets) and everything downstream cites it. When a bet's assumption breaks, the system challenges the standing decision instead of letting it rot. I audit by asking, not by digging."

**Journeys they run:** J-BRIEF (teach it your product) quarterly, J-PRECEDENT (answer from the record: "why did we decide X", decision precedent + lineage) in every review, J2 on every big bet, J-GATES with trust graduation (delegating autonomy deliberately, gate family `trust_graduation`), J7 across the portfolio.

**Lens verdict:** assumption challenges surfacing in the same queue as everything else is the killer feature for this lens; name it plainly ("This decision may no longer hold").

### A5. The product designer

**Value story:** "The spec arrives already wearing our brand because the system learned our design memory. I review a live mockup, not a paragraph. My gate is a real gate: Build cannot start until I say the design is right."

**Journeys they run:** J5 (Design this) as their home slice, J-BRIEF's design-memory half (one-time brand feed in Settings), J4 as an observer (does the built thing match the approved mockup: `design-parity`).

**Lens verdict:** the Design canvas face must render the interactive scaffold in an iframe, side by side with what it will replace; the design gate card must show the mockup, not describe it.

### A6. The investor (10-minute demo)

**Value story:** "This is not a chat wrapper. I watched a signal become a ranked bet, a bet become a decision with a recorded why, a decision become a PR, and a shipped feature write a learning back into the system. The human touched it four times, each time at a named gate. The moat is the accumulated decision record, and I can see it accumulating."

**Journeys they run (watch):** J0 (the full loop) compressed on demo data, then J-PROOF (prove the value: gauntlet metrics, acceptance rate, value receipts, cost per outcome).

**Lens verdict:** the spine's slice highlight IS the demo. Machine color moving left to right, ember pulsing where the founder clicks approve, the Learn arrow feeding back to Discover: that single visual carries the pitch.

---

## Part B: The journey catalog

Format per journey: Name, Entry, Stages, Start state, What the agents do, Human gates, DONE + handoff, Next step suggested. "Entry" names the three canonical doors: a composer chip (typed or clicked), a spine node click, or a gate card in the Approvals tray.

### J-START: "Show me around" (first session)

- **Entry:** automatic on first sign-in; skippable; re-entry via composer chip "Show me around".
- **Stages:** the whole spine, read-only, on seeded demo data (`demo.functions.ts`, demo credentials doc).
- **Start state:** empty workspace or fresh demo seed.
- **Agents:** none run; the tour replays a completed loop from seed data so every canvas face has real content.
- **Human gates:** none. One optional action at the end: "Connect a source" or "Try: What should we build next?".
- **DONE:** the user has seen one artifact at every stage and knows the ember color means "your move".
- **Next step:** composer pre-filled with the J1 chip.

### J1: "What should we build next?" (the flagship slice)

- **Entry:** composer chip; also spine node 01; also Today's briefing ("3 new signals clustered overnight").
- **Stages:** 01 Discover into 02 Decide.
- **Start state:** any signals present (connected sources, `bulkImportSignals`, pasted notes, Researcher Watchtower finds). Works from zero: the Researcher can go fetch market signal first.
- **Agents:** cluster signals into themes (`clusterSignalsCore`), draft opportunities, rank them, align each against the standing top bets (`getBriefAlignment`), run the Critic on the top candidates (`runCriticReview`), grade the outcome contract.
- **Human gates:** ONE: the ranked-bets review. Critic-flagged opportunities (`opportunity` gate family: "Critic said revise/kill") and the keep/kill call (`decision` family). Approve moves the bet to Now on the roadmap; reject drops it, on the record.
- **DONE + handoff:** a ranked, Critic-reviewed bet list; the approved bet sits at the top of Decide with its evidence chain. Hands you: the bet, its signal citations, the Critic verdict, brief alignment.
- **Next step:** "Tear this down first?" (J2) or "Write the spec" (J3).

### J2: "Tear this idea down" (the adversarial slice)

- **Entry:** composer chip with an idea typed inline, OR the "tear it down" action on any opportunity/spec card.
- **Stages:** 02 Decide (with a Discover read-back for evidence).
- **Start state:** an idea, in any form: raw text in the composer, an existing opportunity, or a spec. Nothing else needed.
- **Agents:** the Critic runs the wedge teardown (`runWedgeTeardown`): strongest case against, risks ranked, what evidence would change the verdict. Optionally fan out "explore this from all sides" (`dispatchExploration`): three parallel children (draft, eval, risks) reconciled into ONE composite review card (`decideFanoutBatch`).
- **Human gates:** ONE: the verdict card. Proceed anyway (recorded with the risk acknowledged), revise (sends it back with the Critic's asks attached), or kill (recorded, precedent for next time).
- **DONE + handoff:** a teardown verdict on the record, attached to the idea forever. Hands you: the risk list, the counter-case, the evidence asks.
- **Next step:** survived: "Write the spec" (J3). Killed: "Back to the bets" (J1).

### J3: "Just write the PRD" (the fast lane)

- **Entry:** composer chip ("write the PRD for ..."), spine node 03, or the "spec it" action on an approved bet.
- **Stages:** 03 Plan only. Explicitly enterable with NOTHING upstream: a bare idea in the composer is a valid start.
- **Start state:** an approved opportunity (rich path: citations flow in) or a raw sentence (bare path: the agent asks Brain for context and precedent, same RAG index `generatePrd` already reads).
- **Agents:** draft the cited spec (`generatePrd`), assist on revisions (`prdAssist`), extract the assumptions the spec stands on, generate the task graph (`generateTaskGraph`), run the Critic, grade the outcome contract (what "landed" will mean, decided now).
- **Human gates:** ONE: spec review (`spec` gate family, `status: review`). Approve marks it approved and logs the decision; reject returns it to draft with your notes.
- **DONE + handoff:** an approved, cited spec with assumptions on watch and a task graph. Hands you: the document, exportable/shareable, plus the outcome contract.
- **Next step:** design stage on: "Design it" (J5). Off: "Build it" (J4). Or exit here; the spec is a complete deliverable on its own. Nothing dead-ends: an approved spec card always shows its two forward doors.

### J4: "Build this feature" (the hands-of-the-machine slice)

- **Entry:** composer chip ("build SPEC-14"), spine node 05, or the forward door on an approved spec/design gate.
- **Stages:** 05 Build (04 Design gate first when the workspace has the design stage enabled).
- **Start state:** an approved spec plus a reachable repo. `canDispatchToRepo` checks honestly; no repo yet: `provisionRepoForSpec` creates one in the user's own GitHub account with the starter template. First-run repo setup is part of the journey, not a support ticket.
- **Agents:** the native BuildDriver (BD-1) dispatches the work order as a mission (`dispatchStudioSession`): plan, write code, stage a changeset, run CI (`refreshStudioCi`), respect constraints and the touch list, render a preview. The user can steer mid-flight (`steerStudioSession`) and the operator brake (cancel) always works.
- **Human gates:** (1) any confirm/review-mode tool call the loop hits (`tool_call` family, risk-graded, with the agent's track record on the card); (2) the changeset review: hunk-level accept/reject (`applyStagedHunkSelection`, `rejectStagedFile`), then apply. Trust graduation offers appear here over time ("this agent, 12 clean approvals in a row: let it run without asking?").
- **DONE + handoff:** applied changeset, green CI, preview URL, PR opened on the user's repo. Hands you: the diff, the revision history, the receipt trail (every step traced).
- **Next step:** "Ship it" (J6). Or "revert" stays one click away (`revertToRevision`).

### J5: "Design this" (the designer's slice)

- **Entry:** composer chip, spine node 04, or the forward door on an approved spec. Only offered where `design_stage_enabled` is on; where off, the spine renders 04 as a quiet pass-through, never a broken step.
- **Stages:** 04 Design.
- **Start state:** a spec (approved or in progress). Brand/design memory should already be fed (see J-BRIEF); without it the scaffold honestly falls back to a generic look and says so.
- **Agents:** generate the interactive HTML mockup from the spec, in the workspace's own design language (design-memory-aware prompt), run the design Critic lens on it.
- **Human gates:** ONE: the design gate (`design_gate` family). The card shows the live mockup. Approve unblocks Build for this spec; reject keeps the gate closed with your notes feeding the next scaffold pass.
- **DONE + handoff:** an approved mockup bound to the spec; Build's work order inherits it. Hands you: the prototype itself (viewable, shareable).
- **Next step:** "Build it" (J4).

### J6: "Launch what we shipped" (the GTM slice)

- **Entry:** composer chip, spine node 06, or the forward door on an applied changeset.
- **Stages:** 06 Ship.
- **Start state:** a shipped or shippable changeset (`checkPrdShipped` verifies against the real repo; deployments captured via `captureDeployments`).
- **Agents:** promote preview to production (`promoteToProduction`, with `rollbackRelease` as the standing undo), generate release notes, generate the launch kit (changelog, blog, email, social, docs copy) and the launch plan above it: positioning derived from the decision's own WHY, a checklist, and an armed outcome-check window with a check-by date.
- **Human gates:** (1) the promote-to-production call (routed through the tool-call gate when agent-executed); (2) launch-kit copy review before anything leaves the building. The kit is drafts, never auto-published.
- **DONE + handoff:** live in production, changelog entry written, launch copy in hand, outcome check armed with a date.
- **Next step:** "Check how it landed on [date]" (J7), pre-armed. Optionally "Update stakeholders" (J-REPORT).

### J7: "How did it land?" (the closing slice)

- **Entry:** the armed outcome-check surfacing on Today/Briefing at the check-by date; composer chip; spine node 07.
- **Stages:** 07 Learn, feeding back into 01.
- **Start state:** a shipped PRD with an outcome contract (from J3) and ideally the check window armed (from J6). Also enterable cold on any shipped artifact.
- **Agents:** assemble the outcome evidence (`getOutcomeData`: repo state, deployment record, available analytics), grade against the outcome contract, and on `recordOutcome`: write the learning into memory with importance scoring, infer supersessions (which standing assumptions this outcome breaks: those become `assumption_challenge` gates upstream), distill repeated learnings into house-rule and playbook proposals.
- **Human gates:** (1) the outcome attestation itself (did it land: the human records the verdict with the evidence in front of them); (2) downstream: memory graduation, house rules, playbook proposals, assumption challenges, each arriving later in the one queue.
- **DONE + handoff:** the loop visibly closes: the Learn node fires its return arrow, and the learning shows up as context the next time J1 runs. Hands you: the learning on the record, the challenged assumptions flagged.
- **Next step:** "What should we build next?" (J1), now smarter. This is the moment the compounding is FELT; the UI must stage it.

### J0: "Take it from signal to shipped" (the full loop)

- **Entry:** composer chip; also what a completed J1 naturally rolls into if the user keeps saying yes.
- **Stages:** all seven.
- **Start state:** anything J1 accepts.
- **Agents and gates:** J1 then J2 (optional) then J3 then J5 (if enabled) then J4 then J6 then J7, each stage's DONE flowing into the next stage's start state, with every gate above appearing in sequence. The full loop is a chain of the slices, not a separate machine: this is the core architectural claim of the catalog. Build the slices; the full loop is their composition.
- **DONE:** the J7 close, with the whole run readable left to right on the spine as one continuous slice highlight.
- **Next step:** J1 again. The loop icon on the spine (07 back to 01) is not decoration; it is this journey's next-step affordance.

### Lens-surfaced journeys (beyond the charter's minimum six)

### J-GATES: "Clear my gates" (the operator's sweep)

- **Entry:** the Approvals tray (the single pull point), its count badge, or composer ("what needs me").
- **Stages:** none and all: gates from every stage land in one queue.
- **Start state:** any pending items across the ten families.
- **Agents:** none run during the sweep; every card was prepared by an earlier journey and carries its evidence, consequence lines ("Approve: runs the action / Reject: agent stands down"), and the agent's track record.
- **Human gates:** the journey IS the gates. Keyboard-first: approve/reject/skip, filter buckets (proposals, gates, memory, spend).
- **DONE + handoff:** empty queue. The signature moment: each approval visibly releases work (the spine's machine color starts moving where the decision unblocked it).
- **Next step:** whatever the last approval unblocked, offered by name ("SPEC-14 is now building: watch it?").

### J-CATCHUP: "Catch me up" (the working PM's morning)

- **Entry:** landing on the room (the daily Briefing auto-seeds via `ensureTodayBrief`); composer ("catch me up").
- **Stages:** read-only across all.
- **Start state:** any; honest when quiet ("nothing moved overnight").
- **Agents:** the briefing agent composes what moved, what finished, what needs you, what the watchtower found.
- **Human gates:** none; every line links into the journey it came from.
- **DONE:** read it; the "needs you" lines route into J-GATES.
- **Next step:** J-GATES when nonempty, else the most advanced in-flight slice.

### J-BRIEF: "Teach it your product" (the setup journey)

- **Entry:** Settings, plus first-run prompts; composer ("here's our strategy").
- **Stages:** feeds all; runs in none.
- **Start state:** empty or stale brief.
- **Agents:** structure what you feed: the brief (vision, ICP, positioning, top bets as versioned items with watched assumptions), design memory (brand feed), researcher targets, product context. The brief is injected into every mission's system prompt: editing it visibly changes the next Discovery output, which is the verification moment the UI should stage.
- **Human gates:** the standing items themselves (edits supersede prior rows, on the record).
- **DONE + handoff:** agents that speak your language and rank against your bets.
- **Next step:** "See it applied: run What should we build next?" (J1).

### J-LOOP: "Put it on a loop" (the automation journey)

- **Entry:** the "make this recurring" action on any completed pass; Settings > Loops; composer.
- **Stages:** whichever pass the loop wraps.
- **Start state:** a pass kind worth repeating (`LOOP_KINDS`).
- **Agents:** the loop-tick cron runs the pass on your cadence; every run writes a receipt (when, what happened, what it cost).
- **Human gates:** creating/pausing the loop is yours; anything a run produces still lands in the one queue. Autonomy without silent action.
- **DONE:** the loop exists and shows its run history. **Next step:** "Its findings will land in your queue."

### J-PRECEDENT: "Answer from the record" (the leader's audit)

- **Entry:** composer only ("why did we decide X", "what do we know about Y"): this is Ask running over Brain, decisions, lineage, and precedent.
- **Stages:** none; reads the record.
- **Agents:** retrieve, cite, and answer; precedent matching for "have we faced this before".
- **Human gates:** none, but nothing evaporates: any answer can be promoted to a note, decision, or task (`ask-promote`).
- **DONE:** an answer with citations into the actual artifacts. **Next step:** open the cited artifact, or promote the answer.

### J-PROOF: "Prove the value" (the investor/leader readout)

- **Entry:** Pulse; composer ("show me the numbers").
- **Stages:** reads across all.
- **Agents:** none; computed metrics only, honest when sparse ("not enough data yet", never an invented number): acceptance rate, ritual retention, value receipts, cost per outcome.
- **Human gates:** none. **DONE:** the readout, exportable. **Next step:** the stakeholder pack (J-REPORT).

### J-REPORT: "Update stakeholders" (the Friday journey)

- **Entry:** composer; the "brief the team" action on any shipped artifact; Ship's forward door.
- **Stages:** reads 01..07, writes nothing to them.
- **Agents:** compose the stakeholder update/pack from the record (what shipped, why, what's next, receipts linked).
- **Human gates:** ONE: review the draft before it leaves. **DONE:** the pack in hand. **Next step:** back to the room.

---

## Part C: How a journey renders on the spine

The spine is the full-width 01..07 strip in Mission Control. A journey is a **slice highlight** on it:

1. **Extent.** The journey's touched stages light; untouched stages stay dim but present (the whole loop is always visible, so a slice never pretends to be the product). J3 lights only 03; J0 lights everything.
2. **Entry and exit caps.** The slice's first stage carries an "entered here" cap and the last a "hands off here" cap, each labeled in plain words ("Starts from: your idea" / "Ends with: an approved spec"). This is the direct answer to "where do I start and how do I end".
3. **Per-stage state color.** Within the slice: machine color = agents working now (with the working strip's verb: "clustering", "drafting", "staging"), **ember = waiting on you** (the stage owning the pending gate pulses; clicking it opens that gate card, not a dashboard), done-check = stage complete with its artifact chip attached (click = canvas jumps to that artifact's face), dim-in-slice = queued, not started.
4. **The gate is on the spine, not beside it.** Ember on a stage and the corresponding card in the Approvals tray are the same object; approving from either place clears both. One count, one source (the 2026-07-18 ruling, kept).
5. **Skipped-stage honesty.** A stage the workspace has off (Design with `design_stage_enabled` false) renders as a slim pass-through node inside a slice, labeled on hover ("Design stage is off for this workspace: turn on in Settings"). Never hidden, never fake.
6. **The return arrow.** 07 to 01 is a drawn edge. When J7 records an outcome that challenges an assumption or feeds a learning, the edge animates once and the affected upstream stage briefly glints. The compounding loop becomes something you SEE happen, not a diagram in the pitch deck.
7. **Multiple slices.** Concurrent journeys stack as thin lanes under the spine (capped; overflow into the Working strip). One lane is always "focused" and owns the canvas; clicking another lane swaps focus. This is how "I run three slices in parallel" stays legible.
8. **Where state comes from.** Stage completion derives from `stage_events` + artifact statuses; working state from missions/agent_runs; ember state from the approvals queue filtered to the slice's artifacts (`projectId`/kind mapping already returned per queue item).
9. **Composer chips are spine previews.** Hovering a journey chip in the composer pre-lights the slice it would run, before you commit. Cheapest possible answer to "what will this do".

---

## What Supaprod should steal

Concrete, implementable, all from this catalog's own findings:

1. **Build the slices, compose the loop.** J0 must be implemented as the chain of J1..J7 sharing DONE-to-start handoffs, not as a separate orchestration. Concretely: every journey's DONE state emits a typed handoff object (artifact ref + suggested-next journey id) and every journey's start accepts one. This single contract kills the "everything is broken and not connecting" verdict.
2. **The forward door rule.** Every artifact card in every canvas face renders its next-step journey chip(s) inline (approved spec: "Design it" / "Build it"; applied changeset: "Ship it"; shipped PRD: "Check how it landed"). Nothing dead-ends becomes a lintable UI rule: a CI check over the surface registry asserting every artifact type declares at least one forward door.
3. **Journey chips accept arguments.** The composer parses "build SPEC-14", "tear down [pasted idea]", "why did we decide X". Chip + free text is one grammar, not two features. This is what makes one input model actually replace three.
4. **Approval cards carry consequence pairs.** The queue already computes "Approve: runs the action / Reject: agent stands down" per family. Put that exact pair on every gate card as the button subtext. It teaches the gate model for free, card by card.
5. **Stage the two magic moments.** (a) Approve-releases-work: on gate approval, animate the spine's machine color starting to move at the unblocked stage within 1s (optimistic, from the decide mutation). (b) The 07-to-01 return arrow glint on outcome recording. These two are the demo and the retention hook; budget real design time on them.
6. **Ember only ever means "your move".** Reserve the brand color exclusively for gate states, entry caps, and the approve action, in-app and in the spine. The queue's `kindTone` already distinguishes human/machine/neutral; render it faithfully and the grayscale test passes itself.
7. **Slice-scoped everything.** The Working strip, the Thread, and the Approvals tray all accept the focused slice as a filter (the queue already supports workspace scoping and returns projectId per item; extend the same pattern to a slice/artifact scope client-side). "Run just a slice" must also mean "see just a slice".
8. **First-run repo provisioning inside J4.** `provisionRepoForSpec` exists; surface it as a step card inside the Build journey ("No repo yet. Create one in your GitHub: [name]"), never as a Settings prerequisite that blocks the journey with a dead end.
9. **The briefing links into journeys, not pages.** Every J-CATCHUP line deep-links to a journey position (gate card, running mission, finished artifact face), not to a destination route. Kill "go to page X" language everywhere.
10. **Honest-when-sparse as a component.** Gauntlet already refuses to invent numbers. Make "not enough data yet" a standard canvas-face state with the one action that would create the data ("Connect analytics", "Run your first loop"). Empty states become journey entries.

---

## GAP lines (backend honesty)

GAP: No spend-gate read exists. The approvals queue declares a "spend" filter bucket but nothing routes into it (`approvals-queue.functions.ts` says so explicitly). Either build the spend-gate read/resolver or drop the bucket from the tray until it is real; shipping an always-empty bucket re-creates the "half-cooked" verdict.

GAP: "How did it land?" (J7) is human-attested, not measured. `recordOutcome` records the human's verdict and `getOutcomeData` assembles repo/deploy evidence, but there is no wired automatic pull of live product metrics against the outcome contract at the check-by date (product-analytics/funnel modules exist as surfaces, not as an outcome-grading feed). The journey works end to end as attestation; the UI must present it as "record how it landed", not "we measured how it landed", until the metric feed exists.

GAP: No first-class journey-run record. Journey state must be derived per render from stage_events, artifact statuses, missions, and the approvals queue. Derivation works for display, but "resume the slice I started Tuesday", naming a run, and the multi-lane stack (Part C.7) would each be far sturdier with a lightweight journey_runs row (id, journey kind, anchor artifact, entered/exited stages, status). Without it the front end carries the reconstruction burden on every load.

GAP: Launch kit copy has no outbound channel wiring. `generateLaunchKit` produces changelog/blog/email/social/docs drafts, but nothing sends or schedules them (no email/social publish integration in the connector registry for this path). J6 must end at "copy in hand", and the UI should offer copy-out affordances, not imply publishing.

GAP: No live terminal/log-stream face for Build. The Build canvas face can honestly show the plan, staged diff, CI state, and preview (all wired), plus run steps from traces, but there is no pty/terminal streaming primitive for the "code+terminal" face the charter sketches. Either scope the face to diff+steps+CI (honest today) or build a step-log streaming read before promising a terminal.

GAP: J2 on a raw pasted idea needs a lightweight artifact. `runWedgeTeardown` and `runCriticReview` operate on existing opportunities/specs; tearing down a composer-pasted idea requires first creating a throwaway opportunity row (wired via `createSignal`/opportunity creation, but the one-step "paste and tear down" composition does not exist as a single server call). Small seam, worth one function so the flagship adversarial demo is one action.
