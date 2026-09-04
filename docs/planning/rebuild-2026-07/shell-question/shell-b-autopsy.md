# Shell question, position B: the autopsy, and the case against the conversational shell

> _Created: 2026-07-29 · Last updated: 2026-08-03_

> Written 2026-07-28. Assigned position: argue against collapsing the authenticated app into a
> single conversational surface with a preview pane. Every claim below was read out of the archived
> tag, the live `main` tree, or the rebuild doctrine this session, and is cited by file and line.
> Where the brief I was handed was wrong about the code, this document carries the corrected fact
> and says so.
>
> **My verdict:** no. Keep ONE ROOM as ruled in [`ia/FINAL-ia.md`](../ia/FINAL-ia.md). But the
> founder is right about more than the case against usually admits, and section 6 says exactly
> where, and section 8 says what would have to become true for me to change my mind.

---

## 0. THE ANSWER IN ONE PAGE

**The autopsy first, because the one-line verdict is misleading.** What was archived on 2026-07-18
was not a conversational shell. It was a **command bar with nothing behind it**. The room had a
288px rail whose conversation history was a hardcoded sentence, `"History arrives here as passes
accumulate."` The composer did not talk to an agent; it branched on a binary Plan/Build toggle and
called `generatePrd` or `dispatchStudioSession` directly. There was no thread, no memory, no
approval inline, no classification. So the founder's verdict "felt generic (any-AI-chat-app)" is
precise in a way that matters: the rebuild took the chat app's **chrome** and shipped none of the
chat app's **substance**. That is evidence against a stub, not against a shell, and I will not
pretend otherwise.

**The real case against rests on three structural facts and one wiring audit.**

1. **A lifecycle product is not a generation product.** In Lovable, `preview = f(conversation)`. The
   mapping is total: nothing exists that the conversation did not cause, and the preview is a
   complete rendering of the entire state. In Supaprod, the room's state is a function of seven
   stages times N concurrent runs times a federated cross-product queue, and most of it is written
   by things that are not you typing: connectors ingesting signals, crons running drift watch,
   missions finishing while you sleep, other humans approving. **A transcript is a poor container
   for state that is mostly authored by non-you.**
2. **A PM's job is judgment across parallel work, not iteration on one artifact.** The single most
   important daily read in this product is `getApprovalsQueue`, 911 lines federating eight-plus
   sources across every workspace the caller can read
   ([`src/lib/approvals-queue.functions.ts`](../../../../src/lib/approvals-queue.functions.ts)).
   It is priority-ordered, mutable, and cross-product. A conversation is append-only,
   time-ordered, and single-scoped. Rendering that queue as a transcript destroys the two
   properties that make it useful: the order changes, and rows vanish when someone else acts.
3. **Depth behind a summoned surface has already decayed to depth behind nothing, here, twice.**
   `CommandPalette.tsx` is 454 lines of JUMP / SETTINGS / ACT / RECENT / ASK / CATALOG. Its default
   export has **zero importers**; the only thing anyone imports from that file is `GotoShortcuts`
   ([`src/routes/_authenticated.tsx:4`](../../../../src/routes/_authenticated.tsx)). Search in this
   product is currently unreachable. FINAL-ia already named the law: *hidden is not a function of
   depth, it is a function of silence.* A composer-summoned everything is the maximal-silence
   architecture.
4. **The wiring audit kills the premise.** The founder's sentence is *"the user would just be
   asking, typing, and continuing wherever they left off."* Continuing where you left off is
   precisely the one thing the conversation layer provably cannot do today. Verified this session:
   `chat.ts` contains **zero** references to `agent_approvals`; the inline-approvals component that
   would fix that is imported only by a component that is imported only by its own test;
   `checkpoint()` in the agent loop justifies dropping conversation state by citing two tables,
   `agent_run_steps` and `agent_run_messages`, that **do not exist** (one grep hit each across
   `src/` and `supabase/migrations/`, and the hit is the comment itself). The conversation cannot
   remember, cannot approve, and cannot resume.

**And on churn: there is no churn.** v13, the current campaign canon, states it flatly: *"The market
contact is zero. 8 users total: 4 gmail (founder + associates, newest 2026-06-17), 3 internal
@redcadence.app accounts, 1 test account. No organic external user has ever touched the product."*
([`docs/strategy/archive/v13-proof-campaign.md` §1](../../../strategy/archive/v13-proof-campaign.md)). The churn
being optimized is a hypothesis about a population that does not exist. The one observed user is the
founder, and his own diagnosis is on the record: *"Everything is broken and not connecting."* That
is a coherence sentence, not a navigation sentence. **A shell change treats the symptom.**

---

## 1. THE AUTOPSY: WHAT WAS ACTUALLY BUILT ON 2026-07-18

Read from `archive-final-sweep-2026-07-18` (commit `b8266a6a`, 25 commits ahead of main at the time
of archiving) and from the branch's own docs under `docs/planning/rebuild-2026-07/final-sweep/`.

### 1.1 It was an addition, not a replacement

The archived tree still contains every legacy route. `git ls-tree -r archive-final-sweep-2026-07-18
-- src/routes` returns the full old app: `today`, `discover`, `decide`, `plan`, `design`, `build`,
`ship`, `learn`, `brain`, `cockpit`, `engine-room`, `swarm`, `traces`, `evals`, `guardrails`,
`drift`, `missions`, `studio`, and the nine `admin.*` surfaces, **plus** the four new ones:
`_authenticated.home.tsx` (164 lines), `_authenticated.p.$projectId.tsx` (234 lines),
`_authenticated.approvals.tsx` (241), `_authenticated.ink.tsx` (146).

Four new files, roughly 785 lines, laid over an app of eighty-odd authenticated routes. The commit
message for the landing shell is honest about the scope: *"the three-surface IA lands ... InkShell
replaces the LOOP rail"* (`d95b67d0`). It replaced the **rail**. It did not replace the **app**.

This is the first and most reusable finding of the autopsy: **both prior collapses left the old app
alive underneath.** More on why that matters in section 3.

### 1.2 The Home surface was, verbatim, the founder's current proposal

`_authenticated.home.tsx` from the archive:

```tsx
<HomeGreeting />
<h1 ...>What are we building?</h1>
<CommandBar
  variant="hero"
  placeholder="Describe it in a sentence. Any stage works."
  onSubmit={onIntent}
  autoFocus
/>
```

with a doc comment reading: *"Surface 1: Home. One conversational command bar as the hero, recent
projects as quiet cards, at most one proactive suggestion. No dashboards, no widget grids."*

That is the Lovable home screen, faithfully. It shipped, and the same founder rejected it. The
rejection reason on the record is not "the hero was wrong"; it is that the hero led nowhere good.
Which brings us to the room.

### 1.3 The room was not a conversation. This is the load-bearing correction.

`_authenticated.p.$projectId.tsx` from the archive. The left rail, in full:

```tsx
<aside className="... w-72 ...">
  <ModeToggle mode={mode} onChange={setMode} />
  <CommandBar variant="rail" placeholder={`Tell ${data.project.name} what you need`} ... />
  <div>
    <h2 className="ink-kicker mb-2">Recent intent</h2>
    <p className="...">History arrives here as passes accumulate.</p>
  </div>
</aside>
```

**"History arrives here as passes accumulate" is a hardcoded string.** There was no message list, no
persistence, no scrollback. The conversation column of the conversational shell was a promise
rendered as body copy.

And the submit handler:

```tsx
async function handleIntent(text: string) {
  if (mode === "plan") {
    const { prd } = await doGeneratePrd({ data: { brief: text } });
    await doLinkPrd({ data: { prdId: prd.id, projectId } });
    ...
  } else {
    const latestPrdId = data?.plan.prds[0]?.id;
    if (!latestPrdId) { toast.error("Approve a plan first. Build needs a spec to work from."); return; }
    await doDispatchBuild({ data: { prdId: latestPrdId, prompt: text } });
  }
}
```

No intent classification. No agent loop. No tool registry. A two-branch `if` on a manual toggle,
dispatching one of two server functions. Meanwhile `src/routes/api/chat.ts` on the same branch
already had 1186 lines of real SSE streaming, a v3 intent classifier, direct-specialist dispatch by
@mention, and mission creation. **The rebuild did not use it.** It built a worse input beside a
better one.

### 1.4 The gauntlet found the front door broken on first contact

From the branch's own `gauntlet-report.md`, blocker one of eight:

> **Hero command bar dropped the first sentence** (new user: nothing happened; returning user:
> intent stapled to `projects[0]`).

The single input that was the entire thesis of the shell did not work when a judge typed into it.
Blocker two:

> **The what-to-build moment was absent from the live demo** (the single claim the pitch depends
> on).

Both were patched the same night by seeding data. The deferred list then concedes the rest: spine
contrast "real but subtle", a naming collision between Plan-the-mode and Plan-the-stage left
unresolved, a routing console whose every recommendation read "no eval data yet", and stored agent
rationale strings that still leaked tool ids.

**The founder's five counts map exactly onto what the code shows.** "Wrong structure": Home,
Project, Approvals were three doors where the flow is one. "Felt generic": a hero command bar with a
dead history column is, structurally, a chat app skin. "Half-cooked": the front door dropped the
first sentence. "Hid the features": eighty surfaces reachable only through a palette. "Not
self-explanatory": a six-diamond spine with filled-versus-hollow states its own judges called too
subtle to read.

### 1.5 What the autopsy does NOT prove

I will state the limit of my own evidence, because a case built past its evidence is worthless.

**2026-07-18 does not prove that a real conversational shell fails.** It proves that a conversational
*chrome* over an unwired *substance* fails. If someone builds the thing properly, with a persistent
thread, inline gates, memory, and streamed agent work, the 2026-07-18 verdict does not automatically
transfer to it.

So the case against cannot rest there. It rests on sections 2 through 5.

---

## 2. THE SECOND ATTEMPT IS THE BETTER EVIDENCE, AND IT IS STILL RUNNING

The reimagining lane (`sandbox/mission-control-v2`) built the honest version: `MissionShell.tsx`
(657 lines), `MissionShellView.tsx` (429), `faces.tsx` (2781), a real `Thread.tsx` (428) that renders
the briefing, inline gate cards, and streamed Ask messages, a docked `Composer.tsx` (235), and
`ApprovalsTray`, `CrewDrawer`, `WorkingStrip`, `Spine`. Roughly 7,175 lines under
`src/components/mission/` alone. That is on `main` today.

Then read the fidelity audit it produced,
[`docs/planning/front-end-reimagining/fidelity-audit.md:13`](../../archive/retired-design-eras/front-end-reimagining/fidelity-audit.md):

> **Shell incoherence (the bounce).** Only `/m`, `/threads`, `/artifacts` render in the reimagined
> room shell. Every other surface, Settings, Brain, Approvals, Today, Build, Plan, etc., still
> renders inside the OLD Obsidian `AppShell` (the 10-destination rail). ... So moving from the room
> to Settings visibly drops you back into the retired shell. **This is the founder's "it clicks me
> back to the shell again."**

The other two root causes it names: *"Fidelity gap (built thinner than the mockups)"* and *"Seed gap
(thin demo data) ... Even correctly-built surfaces look empty without the rich seed."*

**None of those three is a navigation problem.** Two shells, thin surfaces, empty data. Zero of the
three are fixed by collapsing to a chat box. All three are made *worse* by it, because a chat box
makes thin surfaces easier to leave un-fixed (you just don't summon them) and empty data harder to
notice (nothing renders unless asked).

### 2.1 The two-shell trap is live on `main` right now

[`src/routes/_authenticated.tsx:166-180`](../../../../src/routes/_authenticated.tsx):

```tsx
const isReimaginedSurface =
  isMissionControl ||
  pathname === "/threads" || pathname.startsWith("/threads/") ||
  pathname === "/artifacts" || pathname.startsWith("/artifacts/") ||
  pathname === "/settings" || pathname.startsWith("/settings/") ||
  pathname === "/approvals" || pathname.startsWith("/approvals/") ||
  pathname === "/brain" || pathname.startsWith("/brain/");

...
{isOnboarding || isReimaginedSurface ? <Outlet /> : <AppShell><Outlet /></AppShell>}
```

A hand-maintained pathname allowlist decides which of two entire design systems you get. There are
**75** `_authenticated.*.tsx` route files; **62** of them fall outside that allowlist and still
render in the retired 10-destination Obsidian rail, whose model is still fully alive in
`src/lib/nav-model.ts` (Today, Discover, Decide, Plan, Design, Build, Ship, Learn, Brain, Pulse,
Settings, Admin console).

The room's own legacy route says it out loud
([`src/routes/_authenticated.m.$productId.tsx`](../../../../src/routes/_authenticated.m.$productId.tsx)):

> *Migration state (read before adding a surface): the strangler is only part way. Some legacy
> surfaces still render inside the old AppShell, so there are two answers to "where am I". Closing
> that is the post-demo priority; do not add a NEW surface to the old shell.*

**Two answers to "where am I" is the friction.** Not seven stages on a spine. The founder feels the
bounce, correctly identifies it as friction, and reaches for the remedy that has the most vivid
external example. But the diagnosis in his own repo, written by the lane that shipped the room,
names shell incoherence as root cause number one.

---

## 3. THE CHURN CLAIM, EXAMINED DIRECTLY

The proposal's stated benefit is *"reduce the churn and user friction point."* Take that seriously
and test it.

**Is there churn?** No. v13 §1, the current campaign canon:

> **The market contact is zero.** 8 users total: 4 gmail (founder + associates, newest 2026-06-17),
> 3 internal @redcadence.app accounts, 1 test account. **No organic external user has ever touched
> the product.**

There is no retention curve, no funnel, no session recording, no drop-off point. The word "churn" is
standing in for something real, but the something is not churn. It is the founder's own experience,
and he described it precisely on 2026-07-19
([`front-end-reimagining/problem-statement.md:13`](../../archive/retired-design-eras/front-end-reimagining/problem-statement.md)):

> *"As the founder who designed this, I myself do not understand where to start, what to do, why to
> do, how to end, and if I want to do only certain journeys instead of the entire lifecycle, I don't
> know how. **Everything is broken and not connecting.**"*

Every clause is a coherence complaint. "Where to start" is a first-frame problem. "How to end" is a
loop-closure problem. "Everything is broken and not connecting" is a wiring problem. Not one of them
is "there are too many links in the sidebar."

### 3.1 What is actually broken, verified this session

Each of these survives a shell change untouched, and each of them is a direct cause of the feeling
being attributed to navigation.

| # | Defect | Evidence | Effect the user feels |
| --- | --- | --- | --- |
| 1 | **Two shells, hand-allowlisted** | `_authenticated.tsx:166-180`; 62 of 75 authed routes outside the list; `nav-model.ts` still defines the 10-rail | "It clicks me back to the shell again" |
| 2 | **Ask history never hydrates** | `getConversation` selects `messages.mission_id` and `messages.metadata`; `conversations.functions.ts:27-39` documents them as optional-at-runtime because two migrations race; the clicks-C audit verified live PostgREST returns `42703 column does not exist` and the server fn throws, and nothing reads `hydration.error` | "My chats are gone" |
| 3 | **A new conversation row per send** | same failure makes `ensureConversation` fall into `catch` | `/threads` fills with one-exchange stubs |
| 4 | **The conversation cannot approve** | `grep -c agent_approvals src/routes/api/chat.ts` returns **0**; the stream closes before the loop takes a step | You ask for work, the gate appears somewhere else |
| 5 | **The inline-approvals UI is orphaned** | `PendingApprovalsStrip` lives in `components/obsidian/ask-canvas.tsx` and is imported only by `AskPanel.tsx`, which is imported only by `AskPanel.test.tsx` | The fix for #4 already exists and is unmounted |
| 6 | **Agent resume is amnesiac** | `loop.server.ts:827-867`: `checkpoint()` stores only `latestMessage`/`latestStep`, justified by a comment citing `agent_run_steps` and `agent_run_messages`; **each has exactly one grep hit across `src/` and `supabase/migrations/`, and it is that comment** | A resumed run silently starts over with `steps = []` |
| 7 | **The back half of the loop writes no lineage** | `ARTIFACT_KINDS` (`lineage.functions.ts:7-21`) ends at `capability_change`: no `changeset`, `deployment`, `outcome`, `learning`, `belief`. `GRAPH_NODE_KINDS` (`knowledge-graph-view.ts:18-29`) is shorter still at 10 kinds | The chain physically stops at the spec. "Not connecting", literally |
| 8 | **Search is unreachable** | `CommandPalette` (454 lines) default export: zero importers | Cmd+K catalogue exists, nobody can open it |
| 9 | **Prototype iframes cannot be pointed at** | no `allow-same-origin` on any prototype frame: `faces.tsx:1284` `sandbox="allow-scripts"`, `PreviewPanel.tsx:171`, `DesignScaffoldPanel.tsx:272`, `p.$slug.tsx:141` all `allow-scripts allow-forms allow-modals` | The Lovable "click the button in the preview" loop is not wired |

Item 9 deserves a note. **The brief I was given states as ground truth that "prototypes already
render as live generated UI in a same-origin iframe." That is false**, and the rebuild's own
interaction doctrine already caught it
([`interaction/ix-a-direct-manipulation.md` §1.2](../interaction/ix-a-direct-manipulation.md)):
*"The brief says the Design face ships a same-origin `srcDoc` iframe. It does not. All four render
sites set `sandbox="allow-scripts"` ... and none sets `allow-same-origin`."* A sandboxed frame
without same-origin cannot be scripted from the parent, so the parent cannot resolve a click to an
element. The single interaction that makes chat-plus-preview feel alive in Lovable is, in this
codebase, not merely unbuilt but currently blocked by a security attribute on four render sites.

**Conclusion of section 3.** The friction is not caused by navigation. It is caused by the app being
two apps, by the conversation forgetting, by the loop not writing its own back half, and by surfaces
built thinner than their mockups against empty data. A conversational shell built on top of all nine
defects ships a chat that forgets what you said, cannot show you the gate it just created, and
cannot resume the run it just started, while promising in its own placeholder text that you can
continue where you left off. **It would be the third trip round the loop, and the most expensive
one, because it would be the one that also deletes the structure.**

---

## 4. THE STRUCTURAL CASE: WHAT A PREVIEW PANE WOULD BE A PREVIEW OF

This is the question the brief calls central, and I think it is the right question. My answer is
that it has no good answer today, and that the reason is not a missing feature but a category
difference.

### 4.1 In a generation product, the preview is a total function of the conversation

Lovable, v0, Bolt, Replit Agent, Claude artifacts share a precondition, and it is stronger than "they
have one artifact":

- **The artifact is the entire state.** There is nothing about the project that is not visible in the
  running app or its filesystem.
- **The conversation is the only writer.** Nothing changes unless you type. No cron, no connector, no
  colleague, no background agent finishing at 3am.
- **The mapping is total.** `preview = f(conversation)` for all conversations. Ordering is causal,
  so a transcript is a lossless log of state transitions.

Under those three conditions, chat plus preview is not a design choice, it is a completeness proof.
There is provably nothing else to look at.

Cursor is the partial counter-example the brief raises, and it is worth being precise about why it
works: Cursor has many files but **one workspace state**, one filesystem, and the editor is a
complete view of it. The file tree is not a second navigation, it is an index into a single object.
Cursor also keeps a persistent, always-visible structure (tree, tabs, gutter, problems) and does not
summon them from a prompt.

### 4.2 Supaprod violates all three preconditions

- **The artifact is not the state.** Thirteen artifact kinds across seven stages. Verified above,
  five of the back-half kinds cannot even be *named* by the lineage vocabulary.
- **The conversation is not the only writer.** This is the pitch. v13 §3.2 lists the ambient layer
  as a headline capability: *"routines, morning brief, drift watch, the work that happens while the
  user sleeps."* Connectors ingest signals continuously. Missions run to completion unattended.
  Approvals arrive from other members of a workspace.
- **The mapping is not total, and it is not even a function.** Two runs in flight on the same product
  produce two different truthful answers to "what is happening", which is exactly why FINAL-ia had
  to graft C's per-run Trace as **Spine mode 2**: *"'where the product is' and 'where this piece of
  work is' are different questions and they collide the moment two runs are in flight."*

So: preview of what? Honestly, today, of a spec and a prototype. Two of thirteen. For Discover you
would preview a ranked list of signals and themes. For Decide, a board of bets with a Critic
teardown. For Ship, a deployment with a commit sha and CI state. For Learn, an outcome window
against a metric. Those are not previews of a common object. They are **six different screens**,
which is precisely what `CanvasFace` already is
([`src/components/mission/CanvasFace.tsx`](../../../../src/components/mission/CanvasFace.tsx), and
`faces.tsx` at 2781 lines).

**The honest translation of "chat plus preview" into this product is "composer plus canvas", and the
room already is that.** Which means the founder's proposal is not a new architecture. It is the
current architecture minus the Spine, minus the depth rail, minus the WorkingStrip, minus the fixed
regions. The delta is subtraction of exactly the elements that answer his own five rejection counts.

### 4.3 State is not a conversation, and this is the sharpest edge

Take the founder's own daily question, which the product exists to answer: *what is waiting on me
across four products?*

`getApprovalsQueue` answers it. 911 lines. It federates specs awaiting approval, pending decisions,
memory candidates, house rules, opportunities, design gates, trust graduations, and agent tool
approvals. Read the module doc:

> *Workspace scoping (2026-07-18, Change 3): `workspaceId` is optional. ... a direct RLS-wide read,
> not the workspace-scoped list function: the ... ANY of the caller's workspaces must surface here,
> unless scoped.*

The optionality is deliberate: the unscoped read is "everything waiting on me anywhere." Now list
the properties of that answer and of a chat message, side by side.

| Property | The queue | A conversation |
| --- | --- | --- |
| Order | priority, recomputed on every read | chronological, immutable |
| Membership | rows appear and vanish without you acting | messages only append |
| Scope | cross-product, cross-workspace | one thread, one scope |
| Authorship | mostly agents and other humans | mostly you and one assistant |
| Truth horizon | the present | the past |
| Correct interaction | triage: approve, decline, send back, snooze | read, reply |

A conversation's newest message is the truth of a moment that has passed. A queue's top row is the
truth of right now. Put the queue inside the transcript and the most important thing on screen is
always stale by construction, and it scrolls away. Put it outside the transcript and you have
admitted the shell needs a second region, which is the room.

This is why Lovable can be a chat and Supaprod cannot: **in Lovable nothing changes unless you
type.** In Supaprod, things changing while you are not typing is the product.

### 4.4 A PM iterates on a portfolio, not on an artifact

The generation products optimize the inner loop of making one thing better. That is a genuinely
different job from the one this product is sold into. The investor canon states the target as the PM
work budget, 2.6M PMs, and the in-app line ratified this session is *"You make the calls. Your crew
does the work between them."*
([`language/FINAL-language.md`](../language/FINAL-language.md)).

**"Between them" is the whole argument.** The human's time in this product is spent *between* pieces
of work, comparing four things and choosing. A chat is an instrument for depth on one thing. It is
the wrong instrument for breadth across many, and breadth across many is the job title.

Concretely: a PM with four products and eleven things waiting cannot get to a decision through a
composer, because forming the judgment requires seeing all eleven at once, ranked, with their
consequences. That is a table. It has always been a table. Making them ask for the table one query
at a time is not simplification, it is a per-glance tax on the single most repeated action in the
product.

### 4.5 The crew disappears, and with it the differentiation

The agent-presence doctrine decided this session is unambiguous
([`agents/agents-a-crew-identity.md` §0.4](../agents/agents-a-crew-identity.md)): *"The crew gets a
permanent region of the shell, not a rail tile ... the WorkingStrip becomes the Crew Bar (always
present, all thirteen visible, never empty)."*

A bare composer renders thirteen specialists as one anonymous assistant voice. The three-layer
investor canon (01 the director, 02 the operating system, 03 the company brain) becomes invisible at
exactly the moment the pitch depends on it being visible. An agent-native operating system that
looks like a text box **is** ChatGPT with a system prompt, to any viewer who has not read the deck.

That is not a taste objection. It is the 2026-07-18 verdict "felt generic (any-AI-chat-app)"
restated as a mechanism. The rebuild felt generic because a composer over hidden machinery is
generic. The machinery is the differentiation, and hiding it is the one thing this product cannot
afford.

### 4.6 The depth argument, and the artifact that proves it

FINAL-ia §0.2 states the law and I am adopting it verbatim as the core of my case:

> **hidden is not a function of depth, it is a function of silence.** The 2026-07-18 rebuild lost
> depth to recessed `hidden sm:flex` buttons with no count, no key, no URL. The original 10-rail
> lost depth to rows that never changed. A tile carrying "3 waiting, 2 working, 1 room on watch" is
> louder than a rail row can be.

`CommandPalette.tsx` is the proof by artifact. 454 lines, six sections, built carefully, and its
default export has zero importers. Nobody deleted it. Nobody noticed. It decayed from "depth behind
a palette" to "depth behind nothing" without a single commit saying so, because a silent affordance
generates no evidence of its own absence.

Now generalize: a conversational shell puts **every** capability into that category simultaneously.
147 `*.functions.ts` modules, 726 `createServerFn` call sites, ~50 registered tools, nine admin
surfaces, sixteen settings sections. Behind one text box, all of them are `CommandPalette`: alive in
the tree, unreachable in practice, and structurally incapable of announcing their own decay.

---

## 5. WHY THE PROPOSAL WOULD BE THE THIRD TRIP ROUND THE SAME LOOP

Two poles have failed here, and the founder's proposal is not a third position. It is a return to
the second pole with better intentions.

| | Pole 1 | Pole 2 | The proposal |
| --- | --- | --- | --- |
| Shape | 10-destination rail, everything visible | Home + palette, everything summoned | one composer + preview, everything summoned |
| Verdict | "overwhelming, real learning curve, never states what the platform is for" | "felt generic, hid the features, depth behind the palette read as empty" | untested |
| Mechanism of failure | noise: rows that never change | silence: affordances with no count, no key, no URL | silence, maximized |

The founder's own rejection of pole 2 contains the prediction about the proposal: *hid the features
(depth behind the palette read as empty)*. Removing the palette and replacing it with a composer does
not change the class. It removes the one remaining browsable index.

**The difference in ONE ROOM as ruled is not "more navigation."** It is *counted, keyed, addressable*
depth: a 48px permanent rail whose tiles carry live numbers, keyboard access, and URLs. That is the
only mechanism in any of the proposals that answers the actual observed failure mode, and FINAL-ia
called it the decisive margin. Deleting it to reach a text box gives up the one thing that was
learned from two failures.

---

## 6. WHERE THE FOUNDER IS RIGHT, AND I WILL NOT PRETEND OTHERWISE

Four things in his proposal are correct, and any answer that does not deliver them is answering a
different question.

1. **"Everything can be run through one simple screen" is correct, and is already the ruling.**
   FINAL-ia §1.1: one destination, `/$workspaceSlug/$productSlug`. Everything else is a region, a
   param, a child wearing the same chrome, or an overlay. Signed in, you are in the room; you leave
   it by signing out. He is not being overruled on the destination count. He is being overruled on
   whether the room asserts structure at rest.
2. **"You still have a Settings page" is correct and is already the ruling.** FINAL-ia puts Settings
   as `?config=<group>&section=<id>`, a full-screen scrim over a still-mounted room, Escape returns
   exactly. That is the Lovable pattern, implemented.
3. **The first frame for a brand-new user should be a sentence and an input.** This is his strongest
   point and the room as specified is weakest here: a seven-stage Spine of empty diamonds and a
   Thread with nothing in it is a worse first frame than "What are we building?". But that is a
   **first-run** problem with a first-run answer, and the answer already exists as a chromeless
   route (`/start`, `_authenticated.start.tsx`, deliberately excluded from both shells at
   `_authenticated.tsx:147`). The fix is to make the room's empty state behave like `/start`, not to
   make every state behave like `/start`.
4. **"Continuing wherever they left off" is the correct product feeling and is currently a lie.**
   Defects 2, 3, and 6 in the table above mean the conversation cannot rehydrate, mints a new row per
   send, and resumes runs with an empty step list. He is describing the thing he wants and cannot
   have. **Promoting a broken conversation to the entire shell does not fix it; it removes every
   other way to recover from it.**

There is a fifth, and it is the sharpest thing in his message: *"whatever is happening you can also
take a deeper look."* That is the depth contract, and it is right. The disagreement is only about
whether the door to depth is summoned or standing.

---

## 7. WHAT I RECOMMEND INSTEAD

Not a compromise position dressed as a third way. A specific sequence, ordered by what the evidence
says is actually wrong.

**First, close the two-shell trap.** It is root cause number one in the fidelity audit, it is named
as the post-demo priority in the room's own source comment, and it is the entire physical basis of
"it clicks me back to the shell again." Every authenticated surface wears the room chrome or it does
not exist. Delete `nav-model.ts`'s 10-rail with it. No shell decision of any kind should be made
before this, because **until it is done, no one can evaluate any shell**: what the founder is
reacting to is the seam between two of them.

**Second, fix the conversation before deciding whether to promote it.** Four changes, all small,
all cited above: the `getConversation` column selection, wiring `agent_approvals` into `chat.ts`,
re-mounting `PendingApprovalsStrip` so gates land inline in the thread that created them, and
restoring `conv`/`steps` to `checkpoint()`. When those land, "asking, typing, and continuing where
you left off" becomes true for the first time. **Then, and only then, is the conversational-shell
question answerable on evidence rather than on analogy**, because for the first time the room's
Thread will be a real conversation rather than a stub, and its actual sufficiency can be observed.

**Third, extend `ARTIFACT_KINDS` so the back half of the loop can be previewed at all.** No preview
pane of any shape can render a chain that stops at the spec. This is Phase 3 in FINAL-ia and it is
correctly a hard gate.

**Fourth, give the founder his first frame without giving up the room's structure.** In an empty
product the room collapses to greeting, one sentence, one composer, journey chips. The Spine renders
as a quiet outline of what will happen rather than six dead diamonds. As work accumulates, the
regions fill. The structure is earned rather than asserted at minute one, and it is *the same
screen*, not a second door. This gets pole-2's ten-second warmth without pole-2's silence.

**Fifth, make the composer the default focus of the room, always.** Cursor is instructive: the input
is where your hands are, and the structure is still standing. Nothing about a Spine, a depth rail
and a Crew Bar prevents typing being the first thing you do. The founder's felt need is *"the user
would just be asking, typing"*, and that is a focus-management decision, not an architecture.

---

## 8. WHAT WOULD HAVE TO BE TRUE FOR ME TO BE WRONG

I hold this position because of the evidence, so here is the evidence that would overturn it. If any
three of these become true, re-litigate and I will change my answer.

1. **The lineage vocabulary closes and the loop renders as one continuous object.** If `changeset`,
   `deployment`, `outcome`, `learning`, and `belief` become artifact kinds and every stage writes
   lineage, then for the first time there is a single connected thing that a preview pane could be a
   preview *of*. My strongest structural objection weakens materially.
2. **Prototype frames become scriptable and direct manipulation ships.** Add `allow-same-origin`
   with the security work that implies, land the mark-and-send loop from `ix-a`, and the Lovable
   inner loop becomes real here rather than analogical. Chat-plus-preview earns its precondition.
3. **The federated queue proves renderable inside the thread without losing priority order or
   mutability.** I do not believe this is possible, but it is testable: build the gate cards inline
   with live reordering and vanishing, put eleven items across four products in front of the founder,
   and see whether he can triage them faster than in the tray.
4. **Concurrency turns out not to matter.** If real usage shows PMs run one thing at a time, the
   parallel-work argument collapses and a thread is a fine container. This is the assumption most
   worth testing with the beta wave, because it is load-bearing for my position and currently
   unfalsified in either direction: **eight users, none external, is not evidence for anybody's
   view.**
5. **The room ships coherently and the founder still cannot answer "where am I, what is mine, what is
   next" in ten seconds.** Then the structure genuinely is the problem, my diagnosis is wrong, and
   the conversational shell deserves a real build.

Note what unites 1, 2 and 5: **they all require the coherence and wiring work to happen first.** In
every branch of this decision tree, the next move is the same. That is the strongest practical
argument in this document. The shell question does not need to be answered this week. The two-shell
trap and the amnesiac conversation do, and answering them makes the shell question cheap to answer
correctly later, on evidence, instead of expensively now, on analogy.

---

## 9. THE ONE-PARAGRAPH VERDICT

The archived rebuild was not a conversational shell and its rejection does not settle this, so the
case against stands on the structure and the wiring. The structure: Lovable can be a chat because
its preview is a total function of its conversation and nothing changes unless you type, and none of
those three conditions holds here, which is why the honest translation of "chat plus preview" into
this product is "composer plus canvas", which is the room that was already ruled. The wiring: the
conversation cannot hydrate, cannot carry an approval, and resumes with an empty step list, the
lineage chain stops at the spec, the prototype frames cannot be pointed at, and two design systems
are alive behind a hand-maintained pathname allowlist covering 13 of 75 routes. **The friction the
founder feels is that last fact, not the number of doors**, and there is no churn to reduce because
no external user has ever arrived. Collapse the two shells into the one room already decided, make
the conversation actually remember, let the empty room open on a sentence and an input the way he
wants, and keep the Spine, the depth rail and the Crew Bar, because the one thing learned from both
prior failures is that hidden is a function of silence, and this codebase already contains a
454-line command palette that nobody can open as the proof.
