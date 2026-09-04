# Shell A: the case FOR the conversational shell, and its design

> _Created: 2026-07-29 · Last updated: 2026-08-03_

> Lane A of the shell question, 2026-07-28. Position argued at full strength: **the founder is
> right, the app should collapse into one conversational surface with a pane, and here is what the
> pane is a preview of.**
>
> Every file, line number, enum and count below was read or run against live code this session.
> Where the brief's ground truth was wrong, this document carries the corrected fact and says so.
> This is a case, not a ruling. The deciding architect arbitrates.

---

## 0. THE ONE PARAGRAPH

The objection to a chat-plus-pane shell is that Lovable has one artifact and Supaprod has thirteen,
so there is nothing to preview. **That objection reads the list wrong.** Signal, Pattern, Bet,
Call, Decision, Spec, Prototype, Run, Step, Change, Preview, Release, Outcome, Learning are not
fourteen subjects. They are **fourteen consecutive states of one subject**, and this repository
already stores the edges between them: `artifact_lineage`, written by `recordLineage`
(`src/lib/lineage.functions.ts:26`), with relations `promoted · cites · derived-from · depends-on ·
validates · supersedes · contradicts` (`src/lib/knowledge-graph-view.ts:32-41`). Lovable's pane is
a window onto a chain of length one. Ours is a window onto a chain of length fourteen. That is a
**renderer** problem, not an architecture problem, and renderers are the cheapest thing in the
building: `src/components/mission/CanvasFace.tsx` is a 231-line contract and
`src/components/mission/faces.tsx` already implements eight renderers behind it with a router at
`:2764`. The one-contract-many-renderers answer is not a proposal. It is merged code.

So: **the pane holds the work in hand.** One deterministic subject, rendered at whatever stage it
currently occupies, with the loop drawn on the artifact rather than on the chrome. Five regions
total. The composer never navigates; it changes what is in front of you. That single inversion is
the entire difference between this and the 2026-07-18 shell, whose composer literally called
`navigate()` (verified below), and it is the reason this does not read generic.

---

## 1. GROUND TRUTH, VERIFIED THIS SESSION

### 1.1 Confirmed

| Claim | Verified |
| --- | --- |
| One CanvasFace contract, many renderers, already built | `CanvasFace.tsx` (231 lines) + `faces.tsx` (2781 lines): `EvidenceFace:238`, `DecisionFace:481`, `SpecFace:772`, `PrototypeFace:1132`, `CodeFace:2091`, `ShipFace:2197`, `GrowthFace:2315`, `RestFace:2444`, router `StageCanvasFace:2764` |
| Prototypes render as live generated UI in an iframe | `faces.tsx:1281-1288`, `srcDoc={scaffoldHtml}` |
| Hunk-level accept and reject already implemented | `studio.functions.ts:1816` `applyStagedHunkSelection` (with `expectedUpdatedAt` optimistic concurrency), `:1872` `rejectStagedFile`; surfaced in `ChangesPanel.tsx` (1367 lines) |
| Mid-run steering exists | `studio.functions.ts:974` `steerStudioSession` |
| Real SSE streaming, intent classification, mission dispatch | `src/routes/api/chat.ts` (1186 lines): classifier at `:377-395`, `createMission` at `:503`, `advanceMissionCore` at `:552`, `runAgentLoop` at `:563` |
| Threads persist | `chat.ts:275` `conversations`, `:301`/`:510`/`:687` `messages`, keyed on `conversation_id` |
| Tool approvals do NOT surface inline in chat | zero matches for `approval` in the whole of `chat.ts`. The loop queues them (`loop.server.ts:8`, `:69-71`, run PAUSES at `waiting_approval`) and they land in `/approvals`. **The conversation loses the thread of its own work. This is the strongest single argument for the founder's proposal and it is a live defect.** |
| 50-tool registry | `registry.server.ts:3177` `TOOL_REGISTRY`, 50 entries counted in the composition array |
| `LoopStep` is a structured union | `loop.server.ts:214-227`: `thought` / `tool_call` (with `name`, `args`, `reason`, `ok`, `result`, `error`, `approval_id`, `status`) / `final` |
| Landing today is incoherent | login bounces `/` → public landing → `/m` → resolve → room; `nav-model.ts` "home" points at `/today`; onboarding completion points at `/today` |

### 1.2 Corrections to the brief

| # | The brief said | Verified |
| --- | --- | --- |
| G1 | "721 server functions" | **726** `createServerFn` call sites across **153** modules in `src/lib`. Directionally right, cite the measured number. |
| G2 | "`CommandPalette.tsx` is 454 lines ... with **zero importers**" | Almost right, and the precise version is worse for the palette. The file has two exports: `CommandPalette()` at `:83` and `GotoShortcuts()` at `:419`. The **only** import anywhere in `src/` is `GotoShortcuts` (`_authenticated.tsx:4`), a keybinding helper. `<CommandPalette />` is rendered nowhere. `_authenticated.tsx:204` says so in a comment: *"The retired CommandPalette and AskPanel components stay in the tree source but are unmounted."* So: 336 lines of JUMP/SETTINGS/ACT/RECENT/ASK/CATALOG surface, deliberately unmounted, ten days after being the designated home of depth. |
| G3 | (implied) prototypes render same-origin | They do not. All four render sites set `sandbox="allow-scripts"` with **no** `allow-same-origin`, so the frame runs at a null origin and the parent cannot touch its DOM. Reach-in must be `postMessage`, validated on `event.source`, never `event.origin`. This is a correctness fact and it constrains §3.3. |
| G4 | thirteen artifact types, listed as ending `... Outcome, Learning` | The language contract's work-object table (`FINAL-language.md` §2.3) has thirteen rows ending `... Outcome`, and includes **Step**; **Learning** lives in §2.5 (the record layer). This document covers **fourteen** and says which is which, because a design that covers thirteen and gets asked about the fourteenth has failed. |
| G5 | 41 routes | **75** `_authenticated.*.tsx` files today. |

### 1.3 The scale of the surfaces being collapsed

`_authenticated.today.tsx` is 1543 lines. `_authenticated.settings.tsx` is 3433 lines.
`faces.tsx` is 2781. `ChangesPanel.tsx` is 1367. `registry.server.ts` is 3243. The engine is not
the problem. Seventy-five doors onto it are.

---

## 2. THE QUESTION: WHAT IS THE PANE A PREVIEW OF

### 2.1 The three candidates, tested to destruction

**Candidate B: the pane is THE PRODUCT ITSELF in its current state.**

This is Lovable's literal answer and it is seductive because it gives one stable subject that never
needs a rule. It fails on three counts here.

1. **We do not host the product.** The Build engine writes into the customer's repo and opens a
   pull request. The product's current state is a deployment we *read* through
   `RepoProvider.readDeployments` and persist into `deployments`
   (`deployments.functions.ts:39-99`). We can show it. We do not own it, and we cannot show it
   before the first release exists.
2. **It is the wrong subject for five of seven stages.** While Strategist ranks bets or Analyst
   reads an outcome, the product has not changed. A pane showing an unchanged app during Discover,
   Decide, Plan and Learn is a screensaver, and a screensaver in the largest region on screen is
   exactly the "felt empty" verdict returning.
3. **It has no answer for a workspace on day one**, which is the only state a new customer sees.

**Rejected as the frame. Grafted as a renderer:** at stage 06 the product's deployed preview *is*
the right thing in the pane, and §2.5 row 11 puts it there.

**Candidate C: the pane follows the conversation's focus, holding the artifact under discussion.**

This is the trap, and it is the one that produces ChatGPT-with-a-side-panel.

1. **Conversation focus and work focus diverge constantly.** You ask "why did we kill the speed
   claim?" while Engineer is writing code. If the pane follows the sentence, asking a question
   *destroys your workspace*. You then have to navigate back, and there is nothing to navigate
   back to, because the pane had no independent state.
2. **It cannot be resumed.** A pane whose state is "whatever the last message was about" gives a
   returning user whatever they happened to type before closing the laptop. That is the opposite of
   the founder's own requirement ("continuing wherever they left off").
3. **It cannot be linked.** There is no address for "what the conversation is currently about".

**Rejected as the frame. Grafted as an affordance:** an answer that names something the pane is not
holding carries a door (`Open the decision →`). A proposal, never an automatic move. Movement of
the largest region on screen is always either the user's act or the work's act, never a side effect
of a question.

**Candidate A: the pane holds the CURRENT PIECE OF WORK, whatever its type, one contract and many
renderers.** This wins, but "current piece of work" is vague, and vague is how you get generic. It
needs a mechanical definition before it is worth anything.

### 2.2 THE RULING: the pane holds THE WORK IN HAND

> **The pane renders the newest un-closed unit of work in this product, at its current stage, in
> that stage's renderer.**

One noun for it: **the work in hand**. It is defined by a query, not by UI state:

```
the work in hand :=
  1. a unit with an open call on it                          (your judgment is blocking)
  2. else a unit with a live run                             (the crew is mid-work)
  3. else the most recently touched un-closed unit           (where you were)
  4. else the product's furthest-right closed stage          (what we last finished)
  5. else first light                                        (nothing has happened yet)
```

Five properties fall out, and each one answers an objection that killed a previous attempt:

| Property | Consequence |
| --- | --- |
| **It survives sentences.** Its identity is a row, not the last message. | You can ask ten questions and the pane does not move. Candidate C's failure is structurally impossible. |
| **It survives sessions.** The default is a server query, not client state. | Resume is free, identical on a new device, in incognito, and for the teammate you paste the link to. §6. |
| **It changes exactly when the work changes.** | Which is the only time anyone wants the largest region on screen to move. And when it moves it *teaches*, because the stage strip animates. §4. |
| **It is singular, and judgment is singular.** | A human judges one thing at a time. Parallelism belongs to the strip, not the pane. §5. |
| **It is overridable and the override is visible.** | `?focus=<kind>:<id>` pins the pane; pinned renders a pin glyph plus "back to the work in hand", always drawn, never hover-only. |

### 2.3 The structural asymmetry is false, and here is the proof

The brief states: *"Lovable, v0, Bolt and Claude artifacts share a precondition that may not hold
here: they have ONE artifact. Supaprod produces a chain of DIFFERENT artifact types."*

Read the chain again:

```
Signal → Pattern → Bet → Call → Decision → Spec → Prototype → Run → Step
       → Change → Preview → Release → Outcome → Learning
```

Every arrow in that line is a **relation this codebase already writes**. `recordLineage` inserts
`{parent_kind, parent_id, child_kind, child_id, relation}` and is idempotent on a unique index
(`lineage.functions.ts:26`). `ARTIFACT_KINDS` (`:7-21`) enumerates thirteen kinds. `GRAPH_RELATIONS`
(`knowledge-graph-view.ts:32-41`) enumerates the seven verbs that connect them, including
`promoted`, which is precisely "this became that".

So the sentence "Supaprod has thirteen artifacts" is true in the same way that "a caterpillar and a
butterfly are two animals" is true. **One thing is being carried forward and changing form.** The
form changes fourteen times. Each form needs a renderer. Fourteen renderers behind one frame is
not an architectural problem; it is an afternoon per renderer, and eight of them are already
written.

Cursor is the right analogue and the brief half-spots it: many files, one editor. The editor does
not follow your sentence. It holds the file you are working on. Substitute "artifact form" for
"file" and "canvas" for "editor" and you have this design exactly. The only thing Cursor gets for
free that we must build is that a file is self-evidently one type. We have fourteen, so we make the
**frame** invariant and let the **body** vary. That is what `CanvasFace` already does: identical
`SurfaceHeader`, identical working triple, identical designed loading/empty/error, per-face body
(`CanvasFace.tsx:1-24`).

### 2.4 One frame, three slots, enforced

Every renderer mounts `ArtifactFrame` with all three of:

- **Judge** - the verdict bar. What is being asked of you, in your product's words, with two or
  three answers. Empty when nothing is asked, never absent.
- **Reach** - the body, at the smallest unit that means anything. A hunk, a clause, an element, a
  row, a step.
- **Trace** - the receipt line plus the `ChainStrip`: who made this, when, from what, what it fed.

This is ix-b's law L2 and it is testable: `artifact-frame.test.ts` fails when a registered renderer
does not mount all three slots. **That test is the anti-generic gate.** A pane whose contents always
name a maker, a judgment and a provenance chain cannot be mistaken for a chat app's side panel,
because a chat app's side panel has none of the three.

### 2.5 The fourteen, covered

`⟨strip⟩` = the seven-stage drawing on the pane header, with the current stage lit.

| # | Form | Stage | Pane body | Verdict bar asks | Composer means, with this in hand | Built? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **Signal** | 01 | The evidence card: source, verbatim quote, who said it, when, link out | *Is this real?* Keep / Ignore | "find more like this" | `EvidenceFace:238` |
| 2 | **Pattern** | 01 | The cluster: N signals stacked under the shared claim, each peelable to its signal | *Does this add up?* Promote to bet / Split / Drop | "what else supports this" | `EvidenceFace` (clustering exists, `clusterTrigger` tool) |
| 3 | **Bet** | 02 | The case, the rank, the stated risk, Critic's counter-argument beside it | *Keep or drop?* | "tear this down" · "what would it cost" | `DecisionFace:481`, `OpportunityQueue` |
| 4 | **Call** | any | **The call renders as the verdict bar on whatever it is a call about**, not as its own object | Approve / Send back / Decline / Snooze | "why is this waiting" | `ApprovalsTray.tsx` (as a tray; §7 re-homes it) |
| 5 | **Decision** | 02 | What you decided, when, why, what it cost, and the precedent it now sets | nothing (closed); a `NextLine` door instead | "what did this change" | `listDecisions`, rendered in `RestFace:2444` |
| 6 | **Spec** | 03 | The parsed doc: sections, numbered clauses, citations inline | *Ship this?* Approve / Send back | with a clause marked: "make this say X" | `SpecFace:772`; `parseSpecSections()` at `faces.tsx:620` already returns `{overview, sections:[{title, items:[{num,text}], prose}]}` |
| 7 | **Prototype** | 04 | **The sandboxed iframe. This is literally the Lovable pane, already shipping.** Use / Point mode toggle | *Does this look right?* | with an element marked: "make this button secondary" | `PrototypeFace:1132`, iframe at `:1281`; `prototype_messages` + `prototype_attachments` fully provisioned with RLS and empty, so marks need **zero migration** |
| 8 | **Run** | 05 | The ledger: the plan drawn in waves, the step counter `6 of up to 24`, landed steps with tool names and latencies | mid-run tool approvals, inline | "stop" · "also do X" (`steerStudioSession` exists) | `CodeFace:2091` + `BuildDeck` |
| 9 | **Step** | 05 | One step's card: tool, args, reason, result, error, cost | approve / deny, when the tool's mode is `confirm` | "why did you do that" | **Structure exists and is thrown away.** `LoopStep` is a typed union (`loop.server.ts:214-227`); `faces.tsx:1647-1688` renders `output.slice(-2000)` into a `<pre>`. Fix is a render, not a backend. |
| 10 | **Change** | 05 | The diff, hunk by hunk, each with keep/drop, live count in the header | *Commit 8 hunks* / *Send back with a note* | with a hunk marked: "why this change" | `computeHunks` / `applyStagedHunkSelection` / `rejectStagedFile` all exist; `ChangesPanel.tsx` renders them |
| 11 | **Preview** | 06 | **The deployed URL, live.** Candidate B, correct here and only here | *Ship it?* | "what changed since production" | `deployments` table, `readDeployments`, `listDeployments:99` |
| 12 | **Release** | 06 | What shipped: the notes, the changelog entry, the commit range | nothing; `NextLine` to Learn | "write the announcement" | `ShipFace:2197` |
| 13 | **Outcome** | 07 | The metric against the number the bet promised to move, with the delta and the window | *Did it work?* | "why did it move" | `GrowthFace:2315` |
| 14 | **Learning** | 07 | The belief card: confidence, streak, what it changed, and the time it stopped you | *Keep this belief?* | "show me the chain" | `brain-insights`, `decision-precedent`, `memory-compounding`; `gate-signals.functions.ts` is fully written and **called from nowhere** |

**Fourteen for fourteen.** Eight renderers exist today, four more are re-renders of data already on
the client (Step, Change, Preview, Learning), and two are new bodies inside an existing face
(Pattern, Call-as-verdict-bar). Nothing here requires a new engine.

### 2.6 What the pane holds at each stage of the loop, in sequence

One journey, one product, one pane. Nothing below is a navigation.

| Moment | Pane holds | Strip says | Thread's newest row |
| --- | --- | --- | --- |
| You type "what should we build next?" | patterns from the last sweep, ranked | `Scout read 4 sources · 2m ago` | `Scout watched 4 sources.` |
| Strategist finishes ranking | the top bet, its case, its risk | `Strategist ranked 11 bets · done` | `Strategist ranked 11 bets.` |
| Critic red-teams it | same bet, Critic's counter beside the case | `Critic challenging · 40s` | `Critic flagged the pricing assumption.` |
| You approve | the bet, now a decision, precedent line appearing | `1 waiting → 0` | `You kept it. Writer is drafting.` |
| Writer drafts | the spec, clauses filling in as they land | `Writer drafting · step 3 of up to 6` | `Writer cited 3 signals.` |
| A call arrives | **same spec**, verdict bar appears on it | `1 waiting` | `NEEDS YOU · Approve the spec?` |
| You approve | spec closes, Designer starts, strip animates 03 → 04 | `Designer mapping` | `Designer is mapping the flow.` |
| Designer renders | the prototype, in an iframe, clickable | `Designer done` | `Designer rendered 1 screen.` |
| You mark a button | same prototype, pin `1` on the button, mark in the thread margin | unchanged | `you: make this secondary` |
| Engineer runs | the run ledger: plan in waves, steps landing | `Engineer writing · 6 of up to 24` | `Engineer opened autofill.tsx.` |
| A tool needs consent | **same ledger**, verdict bar on the step | `1 waiting` | `NEEDS YOU · Let Engineer open the PR?` |
| Run completes | the change, hunk by hunk | `Reviewer checking · 2 of up to 6` | `Reviewer checked the diff.` |
| You commit 8 of 9 | the preview deployment, live | `Preview ready` | `Your reason on hunk 9 went to the Brain.` |
| You ship | the release: notes, changelog, commits | `Publisher announcing` | `Publisher wrote the changelog.` |
| Two weeks later | the outcome: the metric against the promise | `Analyst measured` | `Analyst: +4.2%, the bet promised +3%.` |
| You give the verdict | the learning, now a belief with a streak | `1 new belief` | `The Brain kept it. It will argue for this next time.` |

The pane moved eight times in a full loop. It moved because the **work** moved. It never moved
because a sentence did.

---

## 3. THE SHELL

### 3.1 Five regions. Not six, not ten.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ◈  helio-labs / relay ▾                    05 Build · Run 41       ⚙   ◉     │ 36  THE LINE
├────────────────────────────┬─────────────────────────────────────────────────┤
│                            │  ⟨01─02─03─04─[05]─06─07⟩   Run 41 · Fix the    │
│  THREAD            400px   │                              checkout redirect  │
│                            │  ─────────────────────────────────────────────  │
│  09:14  you                │  NEEDS YOU   Let Engineer open the pull request?│  THE PANE
│    ship the autofill fix   │  [ Approve ]  [ Send back ]   why? ⌄            │
│                            │  ─────────────────────────────────────────────  │
│  Chief of Staff routed it  │  wave 1 ────────────────────────────────────    │
│  to Engineer.              │   ✓ read the spec              1.2s             │
│                            │   ✓ opened autofill.tsx        0.4s             │
│  Engineer wrote 3 files.   │   ✓ wrote 3 files              38s              │
│    → the change  ↗  4m20s  │   ▲ open the pull request      waiting on you   │
│                            │  ─────────────────────────────────────────────  │
│  ◉1 make this secondary    │  Engineer · from SPEC-52 · fed by Run 41        │
│                            │  ← the spec        the change →                 │
├────────────────────────────┴─────────────────────────────────────────────────┤
│ ●  Engineer  writing the change · autofill.tsx    4m20s   6 of up to 24       │ 28  THE STRIP
│                              3 working · 1 waiting · 2 new receipts        ⌄  │
├──────────────────────────────────────────────────────────────────────────────┤
│  [ Ask, or tell your crew what to do ]                      ◉1 ×    ⌘.  ⌘⏎   │     THE COMPOSER
└──────────────────────────────────────────────────────────────────────────────┘
```

**The line · the thread · the pane · the strip · the composer.** Every one is permanent. None is
conditionally rendered. That is the whole shell.

### 3.2 The line (36px)

Mark · workspace/product switcher · **the stamp** · gear · account. Nothing else, ever.

The stamp reads `05 Build · Run 41`: where the work in hand is, and what it is. Six characters
answer "where am I" ninety-five percent of the time. It is not a control.

### 3.3 The pane, and where the Spine went

**Ruling: the seven-stage Spine is drawn on the pane header, not on the chrome.**

FINAL-ia gives the Spine a full-width region and defends it as *"the single most important pixel in
the product: on frame one you can see the whole thing you bought."* That argument is right and the
placement is wrong, for one reason: **a full-width stage bar in the chrome is a navigation rail
wearing a state costume.** Users click things at the top of a screen. The moment they do, the Spine
is navigation, the seven stages are seven destinations again, and we are back at the ten-rail app.

Attached to the artifact it is unambiguously state, and it is *better* state:

- It still draws all seven on frame one. Ten-second comprehension is preserved exactly.
- It **moves when the work moves**, in place, 250ms. That animation teaches the loop without a
  tour, an onboarding wall, or a tooltip. The founder's own complaint was "I don't know how to
  end"; watching the lit segment travel 03 → 04 → 05 → 06 answers it by demonstration.
- It cannot be misread as navigation because it is inside the object it describes.
- Product mode is the same drawing with no artifact in hand, painted from `getLoopState`
  (`loop-state.functions.ts:327`). One drawing, two subjects, always labelled by what sits under it.

Below the strip: the artifact title, then the three slots (§2.4), then the chain strip
(`← the spec   the change →`). Backward peels, forward moves.

**The prototype's mode toggle lives here** (`Use` / `Point`), because a prototype is the one form
where clicks are ambiguous. Everything else is markable always, so it gets no toggle: never render
a control for a choice that does not exist. Reach-in is `postMessage` validated on `event.source`,
because the frame is null-origin (§1.2 G3) and `allow-scripts` plus `allow-same-origin` is a
documented sandbox escape.

### 3.4 The thread (400px)

Capped, left, scrolls independently. **Most rows in it are not messages.** They are landed steps
with receipts:

```
Engineer wrote 3 files.
  → the change  ↗   4m20s   receipt
```

This is the single highest-leverage anti-generic decision in the document, and it comes straight
from the agents-b thesis: *"A checkpoint is a fact. A token is a claim."* A chat log made mostly of
things that **happened** reads nothing like a chat log made of things that were **said**. Streamed
reasoning is banned from the thread as a primary row; a thought collapses to `⋯ thought` with no
checkmark, per the same doctrine.

Agents speak in their own names, under the language contract's grammar (`FINAL-language.md` §3.3):
no article, present continuous while live, past simple for a receipt, never "the X agent".
`Critic flagged this bet.` **Thirteen named voices with one owned verb each is not a chat. It is a
team channel.** A generic AI chat has exactly one voice, and that is most of what "generic" means.

Marks live here as margin lines beside their pins (ix-a §5.1: the Thread is the margin).

### 3.5 The strip (28px)

Permanent, directly above the composer. One live line plus a census.

- The live locus is the run with the most recent `last_checkpoint_at`, so it does not flicker
  between agents on every poll.
- Elapsed advances client-side between polls; the step counter **never** does, because a step
  advance is a fact and may only come from data.
- One pulse, on the live locus only. Five pulsing dots is a Christmas tree.
- `w` expands it upward into the Floor: one row per live run, fixed 32px, wave gutters from
  `mission_steps.depends_on`, deterministic sort that does not re-sort while you are looking.
  The Canvas shortens; nothing is covered.
- **At zero it never says "All quiet" alone.** It says the last event with its age:
  `Nothing is running. Last: Engineer opened PR #204, 14 minutes ago.` Emptiness plus a last event
  is presence; emptiness alone is absence, and absence is the founder's entire complaint.

**The strip's right end carries the depth counts, and only the non-zero ones.**
`3 working · 1 waiting · 2 new receipts · 1 belief expiring`. See §7 for why this replaces the
seven-tile rail rather than sitting beside it.

### 3.6 The composer

One input. It replaces all three of today's (⌘J Ask panel, ⌘K palette, sentence chip).

- Placeholder: `Ask, or tell your crew what to do`. Never "Message Supaprod".
- `⌘.` opens it with whatever you last pointed at attached; `⌘J` opens it empty. Same panel. `.` is
  Cursor's inline-edit key, so the muscle memory is already in the user's hands.
- The selection rides as a dismissable mono chip left of the caret, carrying human words, never an
  id. `Esc` clears the selection before it closes anything else.
- **The composer never navigates.** See §4.

---

## 4. HOW WORK APPEARS

Three things can happen when you press enter. The interface must say which **before** you send, not
after.

| Intent | What happens | Pane |
| --- | --- | --- |
| **Question** | Answered in the thread, with citations | does not move |
| **Instruction** | Creates or advances work | moves to the new work in hand, **visibly**, stage strip animating |
| **Judgment** | Applies to the call in the pane's verdict bar | verdict bar resolves in place |

The classifier already exists and already returns exactly what is needed:
`{is_mission, suggested_title, goal, mode}` (`chat.ts:377-395`). `@Writer` prefixed input bypasses
it entirely and dispatches straight to that agent (`chat.ts:321`), which is the power-user escape.

**One addition, and it is the answer to "if I click this, what happens":** the classification
renders as a one-line intent stamp under the composer before dispatch.

```
[ ship the autofill fix                                              ]
  → this will start a run                                    change ⌄
```

Plus a one-key undo for the first five seconds of a run. Misclassification is the sharpest failure
this shell can have ("I asked a question and it started a run"), so it gets a visible pre-commit
and a cheap reversal, not a confidence score.

**The composer never calls `navigate()`.** This is the load-bearing sentence of the whole document
and §8 explains why.

---

## 5. HOW THE CREW STAYS VISIBLE IN A CHAT-SHAPED PRODUCT

Four layers, by attention, none of them a "meet the crew" grid (banned: you never meet thirteen).

1. **In the thread, by name and by receipt.** First appearance of any agent is
   `Critic flagged this bet` with the receipt attached, never a card explaining what Critic does.
   Introduced by work, never by bio.
2. **In the strip, as a census.** Zero attention. `3 working · 1 waiting`, with one named agent on
   the live line.
3. **In the Floor, as a plan executing.** One second of attention. Waves make parallelism read as
   an orchestra rather than as noise: three agents inside `wave 1` is *the plan running in
   parallel*; three agents with no visible structure is *three things happening*, which is
   alarming. Same data, one hairline and one gutter label apart.
4. **In the pane, as attribution.** `CanvasFace` already takes `agentSlug` and renders the
   attribution atom in `SurfaceHeader` (`CanvasFace.tsx:60-61`). Every artifact says who made it.

And the negative rule that matters most: **no agent ever speaks as "Assistant" and no output is
ever unattributed.** The current app ships two competing name sets simultaneously (`AGENT_FACES`
with Scout/Strategist/Critic/Scribe kept "for back-compat" at `agent-vocabulary.ts:66`, against
`SPECIALIST_CATALOG`'s verb names), so one user reading two screens sees two different crews. That
is fixed by the language contract's roster and it must land in the same phase as this shell, or the
crew is invisible for the worst possible reason: it is visible twice, differently.

---

## 6. HOW YOU RESUME EXACTLY WHERE YOU LEFT OFF

The founder's words: *"the user would just be asking, typing, and continuing wherever they left
off."*

**You never resume a UI state. You resume a piece of work, and a piece of work is a row.**

1. **The address never changes.** `/$ws/$product`, every session, every user, every state. The
   content adapts; the address does not. This kills the current three-way disagreement between
   `/`, `/m` and `/today`, and the two-page-load login bounce with it. `/m` and `/m/$productId`
   survive forever as resolvers so every recorded demo and pasted link keeps working.
2. **The pane's default is the deterministic query in §2.2**, computed server-side in **one**
   call. Nothing is remembered on the client, so it is identical on a new device, in an incognito
   window, and for the colleague you send the link to.
3. **The thread is the same thread**, already persisted (`chat.ts:275`, `:301`, `:510`). It opens
   scrolled to your last read with a hairline ` - while you were gone - ` above the rest.
4. **The strip answers "what happened".** At zero it carries the last event and its age. That is
   the whole "what changed while I was away" surface, in 28 pixels.
5. **`?focus=` pins.** If you left something pinned, the URL says so, so a reload restores it and a
   paste reproduces it. The pin is drawn, with `back to the work in hand` beside it.

Total state to restore: **zero**. The founder's requirement is satisfied not by remembering
anything but by making the default a function of the data.

---

## 7. WHERE SETTINGS AND DEPTH LIVE

### 7.1 Settings: the gear, exactly where every product on earth puts it

One click to a full-screen overlay **over a still-mounted room**; Escape returns to the exact pane
state. Two clicks to any of the 16 sections. `settings-sections.ts` already models 5 groups and 16
sections and `normalizeSection` already preserves every legacy `?section=` id, so this is a mount
change, not a rewrite. The room's polling suspends (not its mount) while the overlay is open, so
3433 lines of settings do not render on top of seven live queries.

The founder named this himself: *"if you want to access it, you still have a Settings page."*
Agreed, unchanged, done.

### 7.2 Depth: behind the artifact, not behind a palette

**The palette failed here, and the receipt is in §1.2 G2.** 336 lines of JUMP/SETTINGS/ACT/RECENT/
ASK/CATALOG, deliberately unmounted, ten days after being designated the home of depth. Depth
behind a palette decayed to depth behind nothing. Search is currently unreachable. This design does
not put anything load-bearing behind it. The palette ships, and it is never the answer to "where is
X".

**Depth is reached by pulling on the thing that has depth.** Every artifact in the pane carries:

- a **receipt line** under it (who, when, what it cost),
- a **ChainStrip** beside it (`← what it came from   what it fed →`),
- a **see the chain** door into the map at `?focus=<kind>:<id>&depth=2`.

You never navigate to provenance. You pull it out of the object in front of you. That is the only
depth model that cannot decay, because it has no separate surface to be forgotten on.

### 7.3 The seven counted tiles become one line, and this is an improvement

FINAL-ia's depth rail is 48px on the right edge, seven tiles, live counts, permanent. Its own risk
register names the danger: **R2, "the zero-count rail is the original disease. A tile that reads 0
forever is exactly a rail row that never changes."** It then defends against R2 with a zero-count
law requiring per-tile last-event ages and per-tile invitations, in seven places.

In a two-column shell the right edge **is** the pane, so a full-height rail is a sixth region and
it re-introduces a navigation model at 48px. The counts survive; the region does not.

> **The counts move to the strip's right end, and only non-zero counts render.**

`3 working · 1 waiting · 2 new receipts · 1 belief expiring`. Clicking any count opens that depth
as a 420px over-panel **across the pane only** (`?pane=`), with the line, thread, strip and
composer all still live.

This is strictly better than seven permanent tiles, for the reason the last two rebuilds both
missed: **hidden is not a function of depth, it is a function of silence - and a count that appears
only when it is non-zero is louder than a count that is always there and usually zero.** The 10-rail
failure and FINAL-ia's own R2 are the same failure. Non-zero-only is the fix, it costs zero pixels
at rest, and the anti-silence guarantee moves to the strip's zero line, which is **one** place
instead of seven and is guaranteed to have content (a product with no last event is a product in
first light, which has its own card).

Keyboard access is unchanged: `g k r m t c e` reach the panes whether or not their counts are
currently drawn, so a power user is never gated on a badge appearing.

### 7.4 The one re-home that fixes a live defect

`/approvals` stops being a destination. **A call renders as the verdict bar on the thing it is a
call about** (§2.5 row 4). The tray survives as the *overflow* for calls that are not about the
work in hand, opened by the `1 waiting` count.

This is the direct fix for the defect verified in §1.1: `chat.ts` has zero occurrences of
`approval`, the loop pauses at `waiting_approval`, and the human is asked to go to a different
screen to unblock a run they were watching. **The conversation currently loses the thread of its own
work.** Putting the call on the artifact is the entire founder proposal working correctly, and it is
the single strongest argument for this shell.

---

## 8. WHY THIS DOES NOT READ GENERIC

### 8.1 What actually went wrong on 2026-07-18, read from its own code

The verdict was *"felt generic (any-AI-chat-app)"* and *"hid the features (depth behind the palette
read as empty)"*. Here is the screen that earned it, from the archive tag.

`archive-final-sweep-2026-07-18:src/components/home/HomeGreeting.tsx` in full, minus imports:

```tsx
export function HomeGreeting({ now = new Date() }: { now?: Date }) {
  const date = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  return <p className="ink-kicker mb-6">{date}</p>;
}
```

`archive-final-sweep-2026-07-18:src/routes/_authenticated.home.tsx` composed exactly four things:
`<HomeGreeting/>`, `<CommandBar/>`, `<ProjectList/>`, `<SuggestionLine/>`. Its own header comment
reads: *"One conversational command bar as the hero, recent projects as quiet cards, at most one
proactive suggestion."*

**That screen contains zero product-specific nouns.** A date, an input, three cards, one sentence.
Swap the logo and it is ChatGPT with project cards. Nothing on it names a loop, a stage, an agent, a
call, a receipt, or a run.

And the second, deeper failure, in the same file:

```tsx
async function onIntent(intent: string) {
  const mentioned = projects.find(...);
  if (mentioned) { await navigate({ to: "/p/$projectId", ... }); return; }
  const created = await doCreateProject({ ... });
  await navigate({ to: "/p/$projectId", params: { projectId: newId }, search: { intent } });
}
```

**The composer's entire job was to pick a door.** It created a project and navigated away. A
composer that navigates is a menu with a text field in it. That is why three doors
(Home/Project/Approvals) fragmented one flow: the shell needed doors because the input was a router.

### 8.2 The inversion

| 2026-07-18 | This design |
| --- | --- |
| Composer calls `navigate()` | Composer changes what is in front of you, in place. There is nowhere to navigate to. |
| Home screen at rest: date, input, cards | At rest: the work in hand, with its stage strip, its verdict bar, its receipts |
| One voice, unattributed | Thirteen named voices, one owned verb each, every output attributed |
| Depth behind a palette | Depth pulled out of the object; palette load-bearing for nothing |
| Three surfaces, one flow | One surface, one flow |

**2026-07-18 was not rejected for being conversational. It was rejected for having a conversation
with nothing on the other side of it.** The fix is not less conversation. It is a real subject on
the other side, permanently.

### 8.3 The grayscale test, run

Strip the color, strip the brand, and count the nouns on screen at rest that could not appear in
ChatGPT.

2026-07-18 home: **zero.**

This shell, on a real workspace: **six.**

1. A seven-step drawing with one step lit, attached to the object it describes.
2. A verdict bar naming a judgment in the product's own words: `Approve the spec?` Not `Continue`,
   not `Regenerate`.
3. Thread rows that are receipts with agent names, durations and doors, not messages.
4. A strip with a named agent doing a named thing to a named file, an elapsed clock, and a step
   counter reading `6 of up to 24` (honest, because `adaptiveStepBudget` computes a real ceiling).
5. A composer that shows what it is about to do before you send it.
6. A `⌘.` chip carrying whatever you last pointed at.

Every one of those is a product-specific noun that exists because of the engine underneath. That is
the test, and it is the one that should gate the build: **a shell passes when a screenshot of it at
rest is unmistakable with the logo removed.**

### 8.4 And why it does not read overwhelming either

The other pole. The original app failed as *"overwhelming, real learning curve, never states what
the platform is for."* This shell has **five regions, one input, one primary object, and zero
navigation**. There is nothing to learn about where things are, because there is one place. The
only thing to learn is the loop, and the loop teaches itself by animating on the object you are
already looking at.

Both previous failures share one root: the app asked the user to hold a **map**. This asks them to
hold a **subject**.

---

## 9. WHAT THIS DELETES

| Dies | Count today |
| --- | --- |
| Authenticated destinations | 75 route files → **1** destination + 5 workbench children |
| The 10-destination loop rail | gone; the loop is drawn on the artifact |
| `/today` | 1543 lines pulling `getGreeting`, `getTodayLanes`, `getApprovalsQueue`, `listFanoutBatches`, `listLearnings`, `getProductContext`, `getAgentFleet`. Every one of those has a home in this shell. |
| `/approvals` as a destination | the verdict bar on the artifact, plus overflow |
| The seven-tile depth rail as a region | non-zero counts on the strip |
| Three input models | one composer, `⌘.` for "with this attached" |
| Two diff renderers, two hand-rolled LCS implementations | one component, `studio-hunks.ts` only |
| Two live agent name sets | one roster |
| The palette as information architecture | it ships; it is load-bearing for nothing (it already is not: zero mounts) |

The engine is untouched. 726 server functions, 50 tools, the agent loop with pause and resume, and
every migration stay exactly as they are. **This is a face change with a deletion list, which is
what "simplifies the product enormously" means mechanically.**

---

## 10. WHAT WOULD BREAK IT (honest, and each has a gate)

| # | Risk | Why it is real | Gate |
| --- | --- | --- | --- |
| A1 | **The work-in-hand query must be one server call.** It joins gates, runs and recency. Five calls on every room render is jank on a Cloudflare Workers subrequest budget, and the whole thesis is that the pane is right instantly. | the entire resume story is this query | one `getWorkInHand` server fn, one query key, optimistic decrement on gate decisions, and a skeleton that never shows a wrong subject. P1 gate, not cleanup. |
| A2 | **Misclassification in the input path.** "I asked a question and it started a run" is the sharpest failure this shell can have, and the classifier is a model call. | `chat.ts:377` is already a live model call on every non-`@` input | the pre-commit intent stamp (§4), the `@Agent` bypass, and a 5-second one-key undo on a fresh run. Measure the classifier against a labelled set before P3. |
| A3 | **The pane is singular; real work is plural.** A customer with three runs will hit this in week one. | the design optimizes for the single work-in-hand PM, which is the right first user and not the only one | the Floor is not optional. It ships in the same phase as the pane, not after. |
| A4 | **Fourteen renderers, fourteen chances to drift.** | this is how "half-cooked, internal inconsistencies" happened last time | `artifact-frame.test.ts` fails when a registered renderer does not mount judge, reach and trace. Turn it on at P0 in report-only mode so the real number is known at the start. |
| A5 | **`?focus=` pinning is a mode, and modes get forgotten.** | the pinned pane silently stops following the work | pinned state renders a pin plus `back to the work in hand`, drawn at rest, never hover-only (ix-b L3). |
| A6 | **Collapsing the Spine onto the artifact could read as losing it.** | it is the ten-second-comprehension pixel and FINAL-ia is right about that | test with a cold user: can they name all seven stages after ten seconds on a live workspace? If not, the Spine returns to the chrome and the pane header carries a compact copy. This is the one call in this document I would happily lose. |
| A7 | **A shell with no navigation has no escape valve for the operator.** Admin, cross-product, and "show me everything you can do" have no rail to live on. | H1/H5 in FINAL-ia are unresolved and this design does not resolve them either | admin stays in the config overlay at 3 clicks; cross-product gets the scope toggle on the panes; the composer's overflow carries one honest `Everything Supaprod can do` door so the catalogue is never palette-only. |

---

## 11. ONE PARAGRAPH FOR THE FOUNDER

You sign in and you are looking at the work in hand: the one thing that is furthest along and not
finished. On it is drawn the whole loop, with the current step lit, so on frame one you can see the
entire machine you bought and exactly where this piece of it is. Under that drawing is the thing
itself, in whatever shape it is currently in, and if the crew is waiting on you, the question is a
bar across the top of it with two buttons, on the thing being asked about, never on another screen.
Down the left is the conversation, and most of what is in it is not talk, it is work that landed,
with the agent's name and a receipt you can open. Along the bottom, one line, one named agent, one
clock, one honest step counter, and any count that is not zero. Then the box you type in. You ask a
question and the work does not move. You give an instruction and the work moves, visibly, and the
loop drawing slides one step, which is how you learn the loop without anyone teaching it to you. You
point at a button in a prototype or a line in a diff and say what should change, and it goes into
that same box with the thing you pointed at attached. Settings is the gear, one click, and the room
stays behind it so you can see what you changed. There is no menu, no rail, no dashboard, and no
second screen, because there is only one subject and the whole product is about carrying it
forward: a signal becomes a pattern becomes a bet becomes a decision becomes a spec becomes a
prototype becomes a change becomes a release becomes an outcome becomes something we now believe.
That is one thing changing form fourteen times, and this is the window onto it.

---

## APPENDIX: evidence index

| Claim | File:line |
| --- | --- |
| One canvas contract | `src/components/mission/CanvasFace.tsx:1-24`, `:55-80` |
| Eight renderers, one router | `src/components/mission/faces.tsx:238, 481, 772, 1132, 2091, 2197, 2315, 2444, 2764` |
| Prototype iframe, null origin | `faces.tsx:1281-1288` (`sandbox="allow-scripts"`, no `allow-same-origin`) |
| Prototype demo fiction in shipped code | `faces.tsx:1267` hardcoded URL bar, `:1276` hardcoded `Interactive · V4` badge |
| Structured steps thrown away | `loop.server.ts:214-227` vs `faces.tsx:1647-1688` (`output.slice(-2000)` in a `<pre>`) |
| Hunk judgment + optimistic concurrency | `studio.functions.ts:1816`, `:1872`; `src/lib/ai/studio-hunks.ts` |
| Mid-run steering | `studio.functions.ts:974` |
| Spec clause ontology | `faces.tsx:620` `parseSpecSections()` |
| Lineage chain | `lineage.functions.ts:7-26`; `knowledge-graph-view.ts:32-41` |
| Loop state | `loop-state.functions.ts:327` `getLoopState` |
| Deployments / preview | `deployments.functions.ts:39`, `:99` |
| Chat: classifier, dispatch, persistence | `chat.ts:275, 301, 321, 377-395, 503, 510, 552, 563` |
| Chat has no inline approvals | zero matches for `approval` in `chat.ts` (1186 lines) |
| Approvals tray, one source | `ApprovalsTray.tsx:1-24` |
| Palette unmounted | `CommandPalette.tsx:83` (never rendered), `:419` `GotoShortcuts` (the only import), `_authenticated.tsx:4`, `:204` |
| 2026-07-18 home screen | `archive-final-sweep-2026-07-18:src/components/home/HomeGreeting.tsx`, `:src/routes/_authenticated.home.tsx` (`onIntent` calls `navigate`) |
| Scale | 726 `createServerFn` across 153 modules · 50 tools (`registry.server.ts:3177`) · 75 `_authenticated.*.tsx` · `today` 1543 · `settings` 3433 · `ChangesPanel` 1367 |
