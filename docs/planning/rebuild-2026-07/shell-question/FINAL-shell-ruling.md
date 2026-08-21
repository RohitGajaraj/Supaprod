# FINAL SHELL RULING: the room is conversational at its centre and structural at its edges

> The deciding architect's ruling, 2026-07-29. Answers the founder's 2026-07-28 proposal that the
> app collapse into one conversational surface with a preview pane.
>
> Reads `shell-a-case-for.md`, `shell-b-autopsy.md`, `shell-c-preconditions.md`, `ia/FINAL-ia.md`,
> `craft-law.md`, and the sibling rulings in `agents/FINAL-agent-presence.md`,
> `depth/FINAL-depth.md`, `interaction/FINAL-interaction.md`, `language/FINAL-language.md`.
>
> **This document overrides `ia/FINAL-ia.md` on four named specifics (§5). It does not overturn the
> ONE ROOM ruling.** Where it and FINAL-ia disagree, this wins, and every override is named with its
> justification. Where it and `agents/FINAL-agent-presence.md` disagree, that document wins on the
> crew and this one wins on the pane. Where it and `language/FINAL-language.md` disagree, language
> wins on words.
>
> Every code fact below was read or run against the live tree this session. Where a position paper
> or the brief was wrong, the corrected fact is carried, not the claim. §1.2 lists eight corrections,
> including two against shell-b that the tree has already repaired.

---

## 0. THE RULING IN ONE PAGE

**The founder is right about the feeling and wrong about the mechanism, and the gap between those
two is smaller than any of the three position papers made it look.**

He asked for one screen where you type, see what is happening, and can look deeper. That is what
ONE ROOM already is. The real question was never "chat or structure". It was **how much structure
the room asserts when nobody is asking for it**, and both prior failures in this repo were answers
to that question: the 10-rail asserted structure that never changed, and the Ink shell asserted
none at all.

The ruling:

> **The room is one screen. Its centre is conversational: one composer that starts, steers, judges,
> questions and finds, and never navigates. Its edges are structural: nine things are permanently
> drawn and may never be summoned, because a user must be able to answer "where am I, what is mine,
> who is working, what is waiting" without knowing a single word to type.**

The nine are listed in §3.2. Everything not on that list may be summoned. That is the whole
architecture and it is deliberately a short list.

**On the preview pane, which the brief called the central question: it has a good answer, and it is
not the one Lovable has.** The pane holds **the work in hand**, and what it renders is **the current
consequence of that work**: what changed, and what it now looks like. That answer holds for all
fourteen forms the work takes (§2.4), it survives sentences and sessions, and it is the reason the
pane deserves the largest region on screen. Lovable's pane is a consequence viewer too. Its
consequence just happens to always be a running app, because it only ever does one thing.

**On the shell shape: no, the app does not collapse into chat plus preview, and the reason is not
taste.** Seven of seven reference products added a manager over the chat between October 2025 and
July 2026 (shell-c §3), every one of them at the moment work became parallel and long-running.
Supaprod starts past that threshold: thirteen agents, runs that pause on a human and resume by cron
sweep, up to five products on a paid tier. Adopting the 2024 shape in 2026 means adopting the shape
the references outgrew. The manager stays. It gets smaller, it gets labelled in words, and it loses
two of its seven rows.

**On the diagnosis, without flattery: the friction is not navigational and a shell change treats the
symptom.** Verified today: two shells behind a hand-maintained pathname allowlist over 76 routes;
`chat.ts` has zero occurrences of "approval" across 1186 lines so a conversation cannot narrate its
own most important event; `checkpoint()` writes `latestMessage` and `latestStep` while the resume
path reads `cp.state.conv`, a key nothing has ever written, so **every resumed run restarts with an
empty step history at a partly spent step budget**; `ARTIFACT_KINDS` stops at `capability_change` so
the chain physically cannot cross Build; all four prototype iframes set `sandbox="allow-scripts"`
with no `allow-same-origin`, so the pointing gesture the whole proposal rests on is currently
blocked by a security attribute. Those five are the "everything is broken and not connecting" the
founder described. None of them is fixed by a shell.

**On the demo: nothing in this document ships before 2026-07-31.** The re-record runs on the current
room plus the five demo-lane items already ruled in `depth/FINAL-depth.md` §11.1 and
`interaction/FINAL-interaction.md` §17. §8 says why, and says what a three-day shell rewrite would
cost.

---

## 1. GROUND TRUTH

### 1.1 Verified this session, in the live tree

| Fact | Evidence |
| --- | --- |
| `chat.ts` cannot carry a gate | `grep -c approval src/routes/api/chat.ts` returns **0** across 1186 lines |
| A gated tool pauses the run | `loop.server.ts:67-75` `PAUSE_ON_APPROVAL_TOOLS`, status `waiting_approval` |
| **Resume is amnesiac, and worse than shell-b said** | `loop.server.ts:835` is the only writer of `agent_run_checkpoints.state` and it writes `latestMessage`/`latestStep`. `loop.server.ts:1412` gates rehydration on `(cp.state).conv`, which **nothing has ever written**. So the else-branch always runs: `steps = []`, `conv = [system, goal]`, and `startStep = cp.step_index`. A run paused at step 4 of 6 resumes with no memory of steps 1 to 4 and two steps of budget left |
| The comment justifying that cites two tables that do not exist | `loop.server.ts:832` names `agent_run_steps` and `agent_run_messages`; one grep hit each across `src/` and `supabase/`, and the hit is the comment |
| The palette is unmounted | `CommandPalette.tsx` is referenced by two files. `EmptyState.tsx:15` mentions it in a doc comment. `_authenticated.tsx:4` imports only `GotoShortcuts`. `_authenticated.tsx:204` calls it "the retired CommandPalette". **The palette UI is mounted nowhere and search is unreachable** |
| The two-shell allowlist is live | `_authenticated.tsx:166-180`, a hand-maintained pathname list; **76** `_authenticated.*.tsx` files |
| The chain stops at Build | `lineage.functions.ts:7-20` `ARTIFACT_KINDS` ends at `capability_change`; no `changeset`, `deployment`, `outcome`, `learning`, `belief` |
| Pointing is blocked | `faces.tsx:1284` `sandbox="allow-scripts"`; `PreviewPanel.tsx:171`, `DesignScaffoldPanel.tsx:272`, `p.$slug.tsx:141` all `allow-scripts allow-forms allow-modals`. **None sets `allow-same-origin`** |
| Threads have no finder | `conversations.functions.ts` exports exactly five: list (limit 50), get, create, delete, rename. No search, pin, archive, folder or filter |
| Multi-product is sold | `entitlements.ts:194` free 2, pro 3, max 5, team/enterprise unlimited |
| The queue is federated and cross-workspace | `approvals-queue.functions.ts`, 911 lines, `workspaceId` deliberately optional |
| The canvas contract exists | `CanvasFace.tsx` 231 lines, `faces.tsx` 2781 lines / 102KB with eight renderers and a router |

### 1.2 Corrections carried

| # | Claim | Correction |
| --- | --- | --- |
| C1 | The brief: "prototypes already render as live generated UI in a **same-origin** iframe" | **False.** No render site sets `allow-same-origin`. The frame runs at a null origin and the parent cannot script it. Direct manipulation needs `postMessage` validated on `event.source`, and `interaction/FINAL-interaction.md` already rules this |
| C2 | shell-b defect 2: "Ask history never hydrates, the server fn throws on 42703" | **Repaired in the tree.** `conversations.functions.ts:39-58` now tries enriched columns and falls back to `id,role,content,model,created_at` on `42703`. The PC-36 hardening landed. Carry the fix, not the defect |
| C3 | shell-b defect 3: "a new conversation row per send" | **Repaired.** `use-ask-stream.ts:195-219` adopts-and-validates the stored id before minting a new one |
| C4 | Implied by C2 and C3: the thread now resumes | **Only on the same browser.** `readScopedConversationId` reads `window.localStorage` (`use-ask-stream.ts:68-77`). A new device, a second browser or an incognito window has no thread. "Continue where you left off" is still a client-state promise |
| C5 | The brief: 721 server functions, 41 routes, 13 artifact types | 726 `createServerFn` across 147 to 153 modules; **76** `_authenticated.*.tsx`; the work-object table has thirteen rows and `Learning` is a fourteenth in the record layer. This document covers fourteen |
| C6 | shell-a: counts should render **only when non-zero** | **Rejected, §5.6.** A count that is invisible at zero is invisible on day one, which is every new user's only day one. That is the "hid the features" verdict with a numeral bolted on |
| C7 | shell-b: "there is no churn, therefore the friction claim is hypothetical" | Half right. There is no churn (v13 §1: 8 users, none external). But the friction is not hypothetical: it is the founder's, it is reproducible, and five verified defects cause it. §7 |
| C8 | shell-b: "no shell decision should be made before the two-shell trap closes" | **Rejected as sequencing advice, accepted as ordering.** The decision costs nothing to make now and everything to make late, because P1 through P9 are ordered by it. What must not happen before the trap closes is shell *construction*, and §9 orders it that way |

---

## 2. THE PREVIEW, ANSWERED

### 2.1 What a preview actually is

The brief frames the asymmetry as artifact count: Lovable has one, we have thirteen. That framing
produces the wrong question, because it treats the pane as a **viewer of a thing**.

A preview is not a viewer of a thing. It is a **viewer of a consequence**. The reason Lovable's pane
feels alive is not that an app is in it. It is that the app **changes when you speak**, and the pane
is where you watch your sentence take effect. `preview = f(conversation)` is a statement about
causality, not about nouns. Strip the causality and you have an iframe.

That reframing dissolves the asymmetry, because consequence is exactly what Supaprod produces at
every stage. It does not produce one artifact fourteen times. It carries one subject forward and the
subject changes form, and each change of form is a consequence of something the crew or the human
just did.

### 2.2 The ruling

> **The pane holds the work in hand, and renders the current consequence of that work at whatever
> stage it has reached.**

"The work in hand" is a server query, not a UI state. Adopted from shell-a §2.2 with one change,
marked:

```
the work in hand :=
  1. a unit with an open call on it            your judgment is blocking
  2. else a unit with a live run               the crew is mid-work
  3. else the most recently touched un-closed unit
  4. else the product's furthest-right closed stage
  5. else first light
```

**The change: rule 5 is not "nothing has happened yet".** Per `agents/FINAL-agent-presence.md` R11,
first light starts one real run before the user types, so rule 5 resolves to rule 2 within seconds
of a workspace existing. First light is a state the pane holds for about four seconds, not a state
it lives in.

Five properties, each answering a failure that killed something here before:

| Property | Consequence |
| --- | --- |
| Its identity is a row, not the last message | You can ask ten questions and the pane does not move. The ChatGPT-with-a-side-panel failure is structurally impossible |
| Its default is a server query, not client state | Resume is free, identical on a new device, in incognito, and for the colleague you paste the link to. This is the founder's actual requirement, satisfied by having nothing to remember |
| It moves when the work moves, and only then | Which is the only time anyone wants the largest region on screen to change |
| It is singular, and so is judgment | A human judges one thing at a time. Parallelism belongs to the Crew Bar and the Floor, which `agents/FINAL-agent-presence.md` §5.1 and §5.2 already rule |
| It is overridable and the override is drawn | `?focus=<kind>:<id>` pins it; pinned renders a pin plus "back to the work in hand", at rest, never hover-only |

### 2.3 The honest limit, stated plainly

shell-c is right and I am not softening it: **two of seven stages produce a runnable artifact.**
Design and Build. The other five produce documents, lists, ledgers and reports. A document rendered
in a pane is a document in a pane. It is not a progress bar.

The answer is not to pretend otherwise. It is that the **frame** is what buys the pane its pixels
when the body is text. Every renderer mounts `ArtifactFrame` with three slots and all three are
mandatory:

- **Judge.** What is being asked of you, in the product's words, with two or three answers. Empty
  when nothing is asked. Never absent.
- **Reach.** The body, at the smallest unit that means anything: a hunk, a clause, an element, a
  row, a step.
- **Trace.** The receipt line plus the chain strip: who made this, when, from what, what it fed.

A document with a verdict bar, an attribution and a chain is not a document. It is a decision in
progress, and that is worth the largest region on screen at any stage. `artifact-frame.test.ts`
fails when a registered renderer omits a slot. **That test is the anti-generic gate**, because a
chat app's side panel has none of the three.

### 2.4 The fourteen, covered

`⟨strip⟩` is the seven-segment stage drawing in the pane header, current stage lit. It is
**run state for the thing in the pane**, distinct from the header Spine, which is product state.
See §5.3.

| # | Form | Stage | Consequence rendered | Judge slot asks | Built? |
| --- | --- | --- | --- | --- | --- |
| 1 | Signal | 01 | the evidence card: source, verbatim, who, when, link out | Is this real? Keep / Ignore | `EvidenceFace:238` |
| 2 | Pattern | 01 | N signals stacked under the shared claim, each peelable | Does this add up? Promote / Split / Drop | `EvidenceFace` + `clusterTrigger` |
| 3 | Bet | 02 | the case, the rank, the stated risk, Critic's counter beside it | Keep or drop? | `DecisionFace:481` |
| 4 | Call | any | **not its own body.** A call renders as the Judge slot on the thing it is about | Approve / Send back / Decline / Snooze | `ApprovalsTray.tsx`, re-homed §5.4 |
| 5 | Decision | 02 | what you decided, when, why, what it cost, the precedent it sets | closed; a forward door instead | `listDecisions`, `RestFace:2444` |
| 6 | Spec | 03 | parsed doc: sections, numbered clauses, citations inline | Ship this? Approve / Send back | `SpecFace:772`, `parseSpecSections()` at `faces.tsx:620` |
| 7 | Prototype | 04 | **the sandboxed iframe, the Lovable pane exactly**, with Use / Point | Does this look right? | `PrototypeFace:1132`, iframe `:1281` |
| 8 | Run | 05 | the ledger: plan in waves, `6 of up to 24`, landed steps with tool names and latencies | mid-run tool approvals, inline | `CodeFace:2091` |
| 9 | Step | 05 | one step: tool, args, reason, result, error, cost | approve / deny when the tool is `confirm` | **structure exists, thrown away.** `LoopStep` is a typed union at `loop.server.ts:214-227`; `faces.tsx:1647-1688` renders `output.slice(-2000)` into a `<pre>`. A render fix, not a backend one |
| 10 | Change | 05 | the diff, hunk by hunk, keep or drop each, live count in the header | Commit 8 hunks / Send back with a note | `applyStagedHunkSelection:1816`, `rejectStagedFile:1872`, `ChangesPanel` |
| 11 | Preview | 06 | **the deployed URL, live.** The one place Lovable's literal answer is correct | Ship it? | `deployments.functions.ts:39,99` |
| 12 | Release | 06 | what shipped: notes, changelog entry, commit range | closed; forward door to Learn | `ShipFace:2197` |
| 13 | Outcome | 07 | the metric against the number the bet promised, with delta and window | Did it work? | `GrowthFace:2315` |
| 14 | Learning | 07 | the belief: confidence, streak, what it changed, when it stopped you | Keep this belief? | `brain-insights`, `decision-precedent`, `gate-signals` (written, called from nowhere) |

Fourteen for fourteen. Eight renderers exist. Four are re-renders of data already on the client
(Step, Change, Preview, Learning). Two are new bodies inside an existing face (Pattern, and Call as
a Judge slot). **Nothing here requires a new engine.**

### 2.5 What this is a preview OF, in one sentence for the founder

The pane shows the thing your crew is carrying right now, in whatever shape it has reached, with
what it wants from you across the top of it and where it came from underneath it. When the work
moves, the pane moves and the little seven-step drawing on it slides one step. When you ask a
question, nothing moves.

---

## 3. THE SPLIT: WHAT IS CONVERSATIONAL, WHAT IS STRUCTURAL

A hedge that says "a bit of both" fails. Here is the line, drawn mechanically. Anything on the
structural list may never be summoned. Anything not on it may be.

### 3.1 Conversational: the composer does all of this, and never navigates

| # | Act | Wired to |
| --- | --- | --- |
| 1 | **Start** work at any of the seven stages | `chat.ts:377-395` classifier, `createMission:503`, `journeyForIntent` |
| 2 | **Steer** work in flight | `studio.functions.ts:974` `steerStudioSession` |
| 3 | **Ask** anything, answered in the thread with citations, **pane does not move** | `chat.ts` streaming path |
| 4 | **Judge**: approve, send back, decline, snooze, by typing or by clicking the Judge slot | `decideApprovalItem`, `sendBackApprovalItem` |
| 5 | **Change a thing you pointed at**: mark an element, a clause, a hunk, then say what should change | `interaction/FINAL-interaction.md`, phase 1 |
| 6 | **Name, rename, share, delete** an artifact | existing artifact functions |
| 7 | **Find**: search runs through the composer and its results land in the pane | new `searchConversations` + artifact search, §5.9 |
| 8 | **Address one specialist** by name | `chat.ts:321` `@slug` direct dispatch |

**The law that makes this different from 2026-07-18: the composer never calls `navigate()`.** The
archived rebuild's `onIntent` created a project and navigated away, which made the composer a menu
with a text field in it, which is why it needed three doors. Here the composer changes what is in
front of you, in place. There is nowhere to navigate to.

`composer-never-navigates.test.ts` fails when any module in the composer's call graph imports a
navigation primitive. This is the single most load-bearing test in the rebuild.

**One addition, because misclassification is this shell's sharpest possible failure.** Before
dispatch, the classification renders as a one-line stamp under the composer:

```
[ ship the autofill fix                                              ]
  this will start a run                                       change ⌄
```

Plus a one-key undo for the first five seconds of a fresh run. "I asked a question and it started a
run" gets a visible pre-commit and a cheap reversal, never a confidence score.

### 3.2 Structural: the nine, permanently drawn

| # | The question it answers without typing | Where it is drawn | Region |
| --- | --- | --- | --- |
| 1 | Where is this product in its loop | the seven-segment Spine in the header, always product state | header |
| 2 | What am I looking at and where is it in its own run | the compact stage strip in the pane header, always run state | pane |
| 3 | What is being asked of me about this thing | the Judge slot, a permanent frame slot, empty not absent | pane |
| 4 | Who made this | attribution on every artifact; named voices in the thread | pane, thread |
| 5 | Who is working right now, and who is employed but quiet | the Crew Bar, thirteen marks, always | crew bar |
| 6 | What is waiting on me anywhere; what we know; who is working; what happened; what we made | five labelled rail rows with live counts | rail |
| 7 | Where did this come from, what did it feed | the chain strip on every artifact | pane |
| 8 | What products exist and what state each is in | the workspace zoom, `/$ws` | destination |
| 9 | How do I change how it behaves | the gear, the config overlay | header |

Everything else is summonable: the palette, the deck, the map, the engine room, admin, every
setting, every archive, every filter.

**The test that keeps the list honest:** `no-typing-only.test.ts` fails when any registered
capability's only reachable path requires typing. The palette may accelerate. It may never be a
capability's sole door. That is the line proposal C crossed in the IA round and it is the line that
killed the last rebuild.

---

## 4. THE SEVEN TESTS, RUN

| # | Test | Verdict |
| --- | --- | --- |
| 1 | **Preview** | **Passes, with a stated limit.** One answer, the consequence of the work in hand, holds for all fourteen forms (§2.4). The limit is real: five of seven stages render documents, and the three-slot frame is what makes a document worth the pane rather than pretending it runs (§2.3) |
| 2 | **Generic** | **Passes.** Grayscale, logo removed, count the nouns that could not appear in ChatGPT: a seven-segment loop drawing with one segment lit; a Judge slot reading `Approve the spec?` rather than `Continue`; thread rows that are receipts with agent names, durations and doors; thirteen crew marks with three lit; a live locus reading `Engineer, writing the change, autofill.tsx, 4m20s, 6 of up to 24`; five labelled rail rows with live counts; an intent stamp under the composer. **Seven.** The archived Home screen scored zero: a date, an input, three cards, one sentence |
| 3 | **Empty** | **Passes, and this is where shell-a is overruled.** Depth is not summoned. Five rail rows are drawn in words with live counts, and at zero they carry a last-event age or a one-line invitation, never a silent glyph. shell-a's non-zero-only rule would have made the entire depth layer invisible to every new user on their only first day |
| 4 | **State** | **Passes.** "What is waiting on me across everything" is answered by the ember row's count without typing, by the tray at one keystroke, and cross-product by the workspace zoom. A federated, priority-ordered, mutable queue is not renderable as a transcript and this ruling does not try (shell-b §4.3 is unrefuted) |
| 5 | **Resume** | **Fails today, and the fix is backend.** The pane's default is a server query so the *shell* resumes perfectly. But the *thread* resumes only in the same browser (C4) and the *run* resumes amnesiac (§1.1). Both are cheap fixes and both are ordered before any shell work (§9) |
| 6 | **Crew** | **Passes.** Thirteen marks permanently in the Crew Bar, named voices in the thread, attribution on every artifact, one live locus with a name and a verb, a rail row counting who is working. `presence.test.ts` fails when a room with a live run renders no agent name at any breakpoint |
| 7 | **Honesty** | **The proposal treats a symptom.** §7 |

---

## 5. THE DELTAS TO ONE ROOM

Twelve. Four override `ia/FINAL-ia.md`. Eight are additions or ratifications of sibling rulings.

### 5.1 D1: the destination count is two, not one. **Overrides FINAL-ia §1.1**

FINAL-ia lists H1 (no workspace-level view) and H2 (no cross-product search) as unresolved, and R11
predicts a customer complaint before September. `entitlements.ts:194` sells three products on Pro
and five on Max. A dropdown is not a surface, and a paying customer's second product must not be
reachable only by a URL they memorised.

> **The room has a zoom level.** `/$ws` is the room at workspace scope. `/$ws/$product` is the room
> at product scope. Same header, same thread, same crew bar, same composer, same rail. Not a second
> chrome and not a dashboard.

At workspace scope:

- The **pane** holds one row per product, each carrying the same seven-segment stage drawing, what
  is waiting, what is running, and the last event with its age. **One drawing at three scales**
  (header per product, pane header per run, portfolio row per product) is a system, and a system is
  what human-made looks like under `craft-law.md` §3.
- The **thread** holds the cross-product briefing.
- The **rail** counts switch to workspace scope and say so in one word. That resolves H1's scope
  toggle by making scope a property of the address rather than a control.
- The **composer** at workspace scope routes to a product or creates one.

This is not a dashboard, because a dashboard is a grid of widgets *about* the loop sitting next to
the loop. This is the same drawing repeated, which is a list.

### 5.2 D2: the line and the Spine merge into one header band

FINAL-ia draws six regions plus a rail. `agents/FINAL-agent-presence.md` R4 promotes the
WorkingStrip into a permanent Crew Bar. That is seven regions, and the founder asked for five.

Merge the 36px line and the Spine band into one **56px header**: mark, workspace/product switcher,
the seven-segment drawing with per-stage state, the gear, the account chip. Dense headers are what
Linear and Vercel ship and the Spine is already only two text lines tall.

**Six regions: header, thread, pane, crew bar, composer, rail.** Six with a defensible reason for
each, rather than five by deletion.

### 5.3 D3: the Spine loses its two modes. **Overrides FINAL-ia §1.4**

FINAL-ia gives the Spine a `PRODUCT` / `RUN · mission #182` mode label, and then names R10: if the
label is subtle, users will think the product regressed when a run dims five stages. A mode with a
warning attached to it is a mode that will be misread.

> **The header Spine is always product state. It never switches modes.** It answers "where is this
> product in its loop" and it is the ten-second-comprehension pixel that answers pole one's third
> failure ("never states what the platform is for").
>
> **Run state moves onto the artifact**, as a compact seven-segment strip in the pane header,
> roughly 120px, current stage lit. It answers "where is this piece of work".

Two drawings, two subjects, two scales, no mode, no label, nothing to misread. R10 is deleted rather
than mitigated.

This also captures shell-a's best argument without its cost. shell-a wanted the Spine off the chrome
because a full-width bar at the top of a screen invites clicks and becomes navigation. That risk is
real and is handled by affordance rather than placement: the header Spine has no hover lift, no
pointer cursor on segments, and exactly one click behaviour, setting `?stage=` which changes the
canvas face and never the destination. Digits `1` to `7` already do it, so the click is an
accelerator.

And it delivers shell-a's teaching animation. The strip on the artifact slides `03` to `04` when the
work moves, in place, 250ms. That is how the loop teaches itself without a tour, and it is the answer
to "I do not know how to end".

### 5.4 D4: the gate becomes a slot on the artifact first, a queue second. **Overrides FINAL-ia §2.7**

FINAL-ia calls the gate "one deliberate duplication: three renderings from one query". Correct, but
it ranks them wrong. `/approvals` is currently a destination and `chat.ts` has zero occurrences of
"approval", so a run dispatched from the conversation goes silent in the conversation and reappears
on another screen. **The conversation loses the thread of its own work.** That is the single
strongest argument in the founder's proposal and it is a live defect, not a preference.

> **A call renders as the Judge slot on the thing it is a call about.** The Judge slot is a
> permanent frame slot, empty when nothing is asked, never absent.
>
> **The tray survives** as the `g` pane for the cross-cutting, cross-product, priority-ordered
> queue, which is not renderable as a bar on one artifact (shell-b §4.3).
>
> **One numeric count, on the ember rail row, and nowhere else** (already ruled in
> `agents/FINAL-agent-presence.md` §5.1).

The verdict bar answers "the call on the thing in front of me". The tray answers "every call
anywhere". Both read one query.

### 5.5 D5: the pane gets a defined subject and an enforced frame

`ia/FINAL-ia.md` specifies seven canvas faces but never states what determines the canvas's subject
at rest, which is the omission that lets a canvas drift into "whatever the last click was about".

Add: `getWorkInHand`, **one** server function, **one** query key, computed server-side (§2.2). Add
`ArtifactFrame` with Judge, Reach and Trace as mandatory slots, and `artifact-frame.test.ts`.

This is a P1 gate, not cleanup. Five queries per room render is jank against a Cloudflare Workers
subrequest budget, and the entire resume story is this one query being right instantly.

### 5.6 D6: the depth rail goes from seven icon tiles to five labelled rows. **Overrides FINAL-ia §2.2**

Two changes, in opposite directions, and both are needed.

**Fewer rows.** Seven becomes five: `Your call` (g), `What we know` (k), `Who is working` (c),
`What happened` (r), `What we made` (m).

- `What we said` (threads) **merges into** `What happened`. A conversation is a thing that happened.
  Two rows for the record is a distinction users do not feel.
- `How it is running` (spend, quality, safety) **moves into the config overlay** as a sixth group.
  It is operator work, not a daily PM question, and FINAL-ia's own argument for keeping definition
  next to result is satisfied inside the overlay. Prominence should match frequency.

**Louder rows.** The rail is not 48px of icons with hover-revealed labels. An icon that needs a
hover to be readable is a recessed door with a count bolted on, which is the exact mechanism
FINAL-ia bans by name.

> The rail is **168px, five rows, each an icon plus a word label plus a live count, at rest, at
> every viewport at or above 1200px.** Below 1200px it collapses to 56px with counts, and the labels
> move to a sheet reached in one tap. `interaction/FINAL-interaction.md` §14 already overruled
> "seven tiles at every breakpoint" on arithmetic; this completes that correction.

It sits on the **right** edge. Left edges are navigators; right edges are inspectors, in Figma, in
Photoshop, in devtools, in Linear. We have no left rail, so nothing about this reads as the ten-rail
returning.

**shell-a's non-zero-only proposal is rejected.** It is the most seductive idea in the three papers
and it inverts the failure: a count that appears only when non-zero is invisible on day one, when
every count is zero, for every new user. shell-a's own escape ("the keys still work") is a power-user
answer to a discoverability problem, which is the same mistake as putting search behind `⌘K` when
`⌘K` opens the composer. FINAL-ia's zero-count law stands: a hairline dot plus the row's last-event
age, or its one-line invitation. **Silence is the enemy, not emptiness.**

### 5.7 D7: thread rows are receipts by default and messages by exception

Ratifies `agents/FINAL-agent-presence.md` R8 and shell-a §3.4. Most rows in the thread are landed
work:

```
Engineer wrote 3 files.
  the change   4m20s   receipt
```

A log made mostly of things that **happened** reads nothing like a log made of things that were
**said**. Streamed reasoning is never a primary row; a thought collapses to a single quiet line with
no checkmark. Thirteen named voices with one owned verb each is a team channel. One anonymous voice
is a chat app, and that is most of what "generic" means.

### 5.8 D8: one composer, one intent stamp, one undo

Replaces all three of today's inputs: the `⌘J` Ask panel, the `⌘K` palette-as-composer, and the
sentence chip. `⌘K` returns to the palette per FINAL-ia §6.7. `⌘.` opens the composer with whatever
you last pointed at attached, carrying human words and never an id.

### 5.9 D9: search returns, and not only through the palette

`conversations.functions.ts` has no search and the palette is unmounted, so finding anything is
currently impossible. The fix is two-sided and both sides are required:

1. `searchConversations` with a messages FTS index, plus artifact search, both reachable **from the
   composer** (type a phrase, results land in the pane) and **from the `r` and `m` rows** (a search
   field inside each pane).
2. `⌘K` mounts the palette as an accelerator.

> **SUPERSEDED 2026-08-21 — the palette is retired, not mounted.** The clause is left standing so the reversal can be checked. Every job it reserved the palette for is now done by something mounted (`GotoShortcuts`, `RailFind`, `ShortcutSheet`), and ⌘K is Ask's by the founder's 2026-07-30 call, so it had no key left. Record and the case for keeping it: `docs/decisions/palette-retired-2026-08.md`.


This is the highest-value single item in shell-c's list. It is precondition P9, the founder's
literal stated goal, and it is satisfied by a list in every one of the seven reference products.

### 5.10 D10: `mounted.test.ts`

The mechanical cause of the palette's decay was not architecture. It was that **nothing failed when
it stopped being mounted.** Someone wrote a comment saying it was retired and the build stayed
green.

> `mounted.test.ts` fails when any component under `src/components/**` has zero importers outside
> its own test file.

That test catches, today: `CommandPalette` (454), `ExecutedCard` (547), `AttentionBell` (97),
`TracesPanel` (189), `MemoryView` (201), `MemoryExpiryBanner` (85), `CostPerOutcomeChip` (109),
`ActivationFunnelPanel` (342), `ProviderCard` (173), `ProductBindingPicker` (130),
`ApiKeyConnectDialog` (85). Roughly 2,400 lines of built-and-forgotten interface.

Run it in report-only mode from day one so the real number is known at the start rather than
discovered at the end. Make it fail at P9.

### 5.11 D11: the thread's identity moves to the server

`readScopedConversationId` reads localStorage. Add a server-side last-active conversation per user
and scope, so the thread follows the user to a new device, a second browser, and the colleague's
screen during a demo. Small, and it converts "continue where you left off" from a claim into a fact.

### 5.12 D12: restore `conv` and `steps` to `checkpoint()`

Ratifies `depth/FINAL-depth.md` §11.1 D1, independently confirmed here (§1.1). Roughly 30 lines plus
a resume regression test. **The founder's stated goal is literally this bug.** Everything else in
this document is a shell; this is the thing that actually forgets.

---

## 6. WHY THIS IS NOT A THIRD TRIP ROUND THE LOOP

Both prior failures share one root, and neither is about how much is on screen.

| | Pole 1: the 10-rail | Pole 2: the Ink shell | This ruling |
| --- | --- | --- | --- |
| Shape | ten destinations, everything visible | home plus palette, everything summoned | one room, nine things drawn, everything else summonable |
| Verdict | "overwhelming, real learning curve, never states what the platform is for" | "felt generic, hid the features, depth behind the palette read as empty" | tested in §4 |
| Mechanism of failure | **noise**: ten rows that never changed | **silence**: affordances with no count, no key, no URL | the nine are counted, keyed, addressable, labelled in words, and test-enforced |

**Not overwhelming**, because there is no navigation model to learn. Six regions, one input, one
primary subject, zero destinations to choose between at any moment. The only thing to learn is the
loop, and the loop teaches itself by animating on the artifact you are already looking at (D3). Both
prior failures asked the user to hold a **map**. This asks them to hold a **subject**.

**Not generic**, because the composer never navigates (§3.1) and there is always a real subject on
the other side of the conversation with a maker's name, a judgment and a provenance chain attached
(§2.3). The 2026-07-18 rebuild was not rejected for being conversational. It was rejected for having
a conversation with nothing on the other side of it: a hero input, a hardcoded string reading
`"History arrives here as passes accumulate."` where the history should have been, and a two-branch
`if` on a manual toggle where the agent loop should have been, while `chat.ts` sat on the same branch
with 1186 lines of the real thing, unused.

**Not empty**, because depth is reached two ways and neither is summoned: pulled out of the object
in front of you (receipt line, chain strip, "see the chain"), and behind five permanently labelled
counted rows. Plus `mounted.test.ts`, which is the only mechanism in any of the four documents that
prevents decay rather than merely discouraging it. Architecture does not stop rot. A failing build
does.

---

## 7. THE HONEST DIAGNOSIS

**There is no churn.** v13 §1: eight users, four gmail accounts belonging to the founder and
associates, three internal accounts, one test account, no organic external user ever. There is no
retention curve to improve and no funnel to widen. The word "churn" in the proposal is standing in
for something real, but the something is the founder's own experience of his own product.

**And that experience is caused by brokenness, not by navigation.** His own words on 2026-07-19:
*"I myself do not understand where to start, what to do, why to do, how to end... Everything is
broken and not connecting."* Every clause is a coherence complaint. Five verified causes:

| # | Defect | The feeling it produces |
| --- | --- | --- |
| 1 | Two shells behind a hand-maintained pathname allowlist over 76 routes (`_authenticated.tsx:166-180`) | "It clicks me back to the shell again" |
| 2 | `chat.ts` has zero occurrences of `approval`; the loop pauses and the gate appears on a different screen | "I asked for work and then it went quiet" |
| 3 | `checkpoint()` writes `latestMessage`/`latestStep`; resume reads `cp.state.conv`, never written; every resumed run restarts with `steps = []` at a partly spent budget | "It forgot what it was doing" |
| 4 | `ARTIFACT_KINDS` ends at `capability_change`; the chain cannot cross Build | "Not connecting", literally |
| 5 | No `allow-same-origin` on any of four prototype frames; the parent cannot resolve a click to an element | the pointing gesture the whole proposal rests on does not exist yet |

**A shell change fixes none of these.** A conversational shell built on top of them would ship a chat
that cannot show you the gate it just created, cannot resume the run it just started, and cannot
draw the chain it just extended, while promising in its own placeholder text that you can continue
where you left off. That is the third trip round the loop and the most expensive one, because it is
the one that also deletes the structure.

**The founder should be told this plainly, because he is the one paying for the wrong fix.** His
instinct about the feel is correct. The felt simplicity of Lovable comes from scoping a thin shell
to one unit of work and putting a legible manager around it. Supaprod can have that feel. It gets
there by making the room thinner and the manager honest, not by deleting the manager, and above all
by fixing the five things that actually broke.

**Two corrections in his favour, and they matter.** Shell-b's evidence that the conversation "cannot
remember" is partly stale: `getConversation` now falls back on `42703` and `ensureConversation` now
adopts the stored thread. The conversation layer is in better shape than the case against it claimed.
What remains broken is the *agent's* memory (defect 3) and the *device* boundary (C4), and both are
small fixes. So the version of his proposal that says "make the thread the spine of the experience"
is closer to buildable than shell-b allows.

---

## 8. THE DEMO, 2026-07-31

Two working days plus a recording day.

> **Nothing in this document ships before 2026-07-31.**

The re-record runs on the current room plus the five demo-lane items already ruled in
`depth/FINAL-depth.md` §11.1 (restore `conv`/`steps`; one decide path; the inline gate in the live
composer; six lineage edges; delete the cross-tenant analytics landmine) and the phase-1 interaction
set in `interaction/FINAL-interaction.md` §17. Every one of those is a pure addition or a bug fix.
None moves a region.

**Two of them are, by accident, the founder's proposal working correctly**, which is the best
available evidence for this ruling and the fastest available win:

1. **The inline gate** (FINAL-depth D3). Today the demo has to navigate to `/approvals` on camera to
   unblock a run the viewer was watching. After D3 the call arrives in the thread where the work was
   narrated. That single change is what "everything happens through one screen" means in practice,
   and it costs about 250 lines.
2. **The resume fix** (FINAL-depth D1). Today the demo's central beat, approve and continue, shows an
   agent resuming amnesiac at step 4 of 6. On camera that reads as the agent forgetting what it was
   doing, because it is. About 30 lines.

**What a three-day shell rewrite would cost:** the last time this repo shipped a shell in a hurry,
the gauntlet found the hero input dropped the first sentence a judge typed, and the verdict included
"half-cooked, internal inconsistencies". Six regions, a new destination, a rail rebuild and a
fourteen-renderer frame contract is not three days. Attempting it produces the fourth rejection.

**After the recording**, the shell work starts at §9 P1.

---

## 9. THE SEQUENCE

Slots into `ia/FINAL-ia.md` §8's ten phases. Only the changes are listed.

| Phase | What changes here | Gate |
| --- | --- | --- |
| **Now to Jul 31** | Demo lane only (§8). No region moves | the recording |
| **P0** | Add `mounted.test.ts`, `composer-never-navigates.test.ts`, `no-typing-only.test.ts`, `artifact-frame.test.ts`, all in report-only mode. Extend `room-url.ts` for `/$ws` | the real orphan count is known at the start |
| **P1** | **Close the two-shell trap first**, exactly as shell-b argues. Delete the allowlist; every authenticated route wears the room chrome. Merge the line and the Spine (D2). The Crew Bar becomes real per `agents/FINAL-agent-presence.md` P1 | all 76 routes render one chrome. Screenshot every one |
| **P1.5** | **The four wiring fixes, before any pane redesign**: restore `conv`/`steps` (D12); wire `agent_approvals` into `chat.ts`; server-side last-active thread (D11); `searchConversations` plus FTS (D9) | a run started in the thread pauses, asks, resumes and remembers. Then, and only then, is the thread a real conversation |
| **P2** | The rail as five labelled rows at 168px (D6). `getWorkInHand` (D5). Engine moves into the config overlay | a user reaches every depth row without knowing a URL, and can read what each one is without hovering |
| **P3** | One landing. The workspace zoom `/$ws` (D1) | H1 and H2 are closed rather than deferred |
| **P4** | Extend `ARTIFACT_KINDS`; derive `GRAPH_NODE_KINDS` from it; add the back-half `recordLineage` calls; wire `gate-signals`. **Unchanged hard gate** | `getKnowledgeGraph` on a seeded workspace returns a connected graph from signal to belief |
| **P5** | The seven faces, each mounting `ArtifactFrame` with three slots. The pane header stage strip (D3). Judge slot on every renderer (D4) | `artifact-frame.test.ts` green for every registered renderer |
| **P6 to P8** | As FINAL-ia. Plus thread rows as receipts (D7), one composer with the intent stamp (D8) | as FINAL-ia |
| **P9** | Flip all four new tests from report-only to failing | zero orphans, zero typing-only capabilities, zero navigating composers |

**The ordering is load-bearing and it is shell-b's contribution, adopted whole:** the two-shell trap
and the wiring come before the pane. Until P1 and P1.5 land, nobody can evaluate any shell, because
what the founder is reacting to is the seam between two of them and a conversation that forgets.

---

## 10. RISKS

| # | Risk | Mitigation |
| --- | --- | --- |
| R1 | **The 168px rail is a bigger region than FINAL-ia's 48px, and someone will read five labelled rows as the ten-rail returning** | Right edge, not left. Five, not ten. Live counts, not static rows. If a cold user calls it navigation in testing, collapse to 56px with counts and move the labels into a one-tap sheet, but never to hover-only |
| R2 | **The workspace zoom is a second address and second addresses breed** | One rule, tested: `/$ws` and `/$ws/$product` are the only two, and `destinations.test.ts` fails on a third. The zoom shares every region; it is a scope, not a screen |
| R3 | **Two stage drawings could read as two Spines** | They never render at the same scale and never in the same region. The header one is 7 numbered segments with state labels; the pane one is a 120px unlabelled strip inside the artifact's own header. Test with someone who has two runs in flight |
| R4 | **`getWorkInHand` joins gates, runs and recency; slow or wrong, and the whole thesis fails** | One server fn, one query key, optimistic decrement on gate decisions, a skeleton that never shows a wrong subject. P2 gate |
| R5 | **Intent misclassification: "I asked a question and it started a run"** | The pre-commit intent stamp, the `@agent` bypass, the five-second undo. Measure the classifier against a labelled set before P5 |
| R6 | **The pane is singular; real work is plural** | The Floor is not optional and ships with the pane, per `agents/FINAL-agent-presence.md` §5.2 |
| R7 | **Fourteen renderers, fourteen chances to drift, which is exactly how "half-cooked" happened** | `artifact-frame.test.ts` from P0 in report-only mode so the number is known before the work starts |
| R8 | **The demo freeze slips and someone starts P1 early** | P1 deletes the shell allowlist, which touches all 76 routes. Starting it before the recording risks the recording. Name it in the session handoff |
| R9 | **`mounted.test.ts` produces a large red number and gets disabled** | Report-only until P9 with the count tracked per phase. A number that goes down every phase is a working test; a number nobody looks at is the palette again |
| R10 | **Direct manipulation stays blocked** because `allow-same-origin` never lands, so the pointing loop that justifies the pane never arrives | It is phase 1 of `interaction/FINAL-interaction.md` and gated on the probe plus the `no-same-origin-sandbox` lint. If it slips past P5, the Prototype renderer degrades to mark-by-region honestly rather than pretending |
| R11 | **This ruling looks to the founder like a rejection of his idea** | It is not, and §11 says so in his terms. He asked for one screen where you type and see and can look deeper. He gets it. What he does not get is the deletion of the five things a PM needs to see without asking |

---

## 11. ONE PARAGRAPH FOR THE FOUNDER

You sign in and you are in one room, at the same address every time, and you never leave it. In the
middle is the thing your crew is carrying right now, in whatever shape it has reached: a bet, a spec,
a mockup you can click, a diff, a live preview, a number against the number you promised. Across the
top of that thing is what it wants from you, if it wants anything, with two buttons, on the thing
itself, never on another screen. Underneath it is who made it and where it came from. On its header
is a small seven-step drawing that slides one step every time the work moves, which is how you learn
the loop without anyone teaching it to you. Down the left is the conversation, and most of what is in
it is not talk, it is work that landed, with an agent's name and a receipt you can open. Along the
bottom are your thirteen workers, always all thirteen, with the busy ones lit and one line saying who
is doing what to which file and for how long. Then the box you type in, which starts work, steers it,
answers questions, makes calls, and changes anything you point at, and which never takes you
anywhere, because there is nowhere to go. On the right edge are five rows with words on them and live
numbers beside them: what needs your call, what we know, who is working, what happened, what we made.
Those five are the only things I am keeping that you did not ask for, and I am keeping them because a
number you can see is the difference between a product that has depth and a product that had depth
and forgot. Settings is the gear, and the room stays behind it so you can see what you changed. And
if you have three products, the same room zooms out and shows you all three with the same drawing on
each. That is one screen, one input, one subject, and five things you never have to remember a word
to find.

---

## APPENDIX: evidence index

| Claim | Where |
| --- | --- |
| Chat cannot carry a gate | `grep -c approval src/routes/api/chat.ts` = 0 |
| Resume amnesia | `src/lib/ai/loop.server.ts:827-866` (writer), `:1406-1483` (reader gating on `cp.state.conv`) |
| Nonexistent tables in the justifying comment | `loop.server.ts:832`; one grep hit each for `agent_run_steps`, `agent_run_messages` |
| Palette unmounted | `src/components/supaprod/CommandPalette.tsx`; `_authenticated.tsx:4`, `:204`; `EmptyState.tsx:15` (comment only) |
| Two shells | `src/routes/_authenticated.tsx:166-180`; 76 `_authenticated.*.tsx` |
| Chain stops at Build | `src/lib/lineage.functions.ts:7-20` |
| Pointing blocked | `faces.tsx:1284`, `PreviewPanel.tsx:171`, `DesignScaffoldPanel.tsx:272`, `p.$slug.tsx:141` |
| No thread finder | `src/lib/conversations.functions.ts`, five exports |
| Hydration repaired | `src/lib/conversations.functions.ts:39-58` |
| Thread id is client state | `src/hooks/use-ask-stream.ts:68-77`, `:195-219` |
| Multi-product sold | `src/lib/entitlements.ts:194` |
| Federated queue | `src/lib/approvals-queue.functions.ts`, 911 lines |
| Canvas contract and renderers | `CanvasFace.tsx` (231), `faces.tsx` (2781) |
| Loop pause semantics | `src/lib/ai/loop.server.ts:67-75` |
| Sibling rulings this defers to | `agents/FINAL-agent-presence.md` R4, R8, R11; `interaction/FINAL-interaction.md` §14, §17; `depth/FINAL-depth.md` §11.1; `language/FINAL-language.md` |
