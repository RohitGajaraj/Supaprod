# Depth B - The Agentic Conversation

> _Created: 2026-07-28 · Last updated: 2026-08-03_

> Rebuild 2026-07 · depth layer · angle B of three
> Written 2026-07-28 against the live tree at `36cca7c5`. Every claim below was read in code this
> session. Where the brief I was given is wrong, I say so in the margin and correct it.

---

## 0. What this document is

The founder's loudest ask: **Ask must act, and must ask permission inline in the chat, not in a
different room.** This is the buildable contract for that. It covers the turn anatomy, the exact
`src/routes/api/chat.ts` changes, the one-queue-two-surfaces rule, long-running actions that
outlive the session, denial and mid-run steering, and the visible trust arc.

It is written to the standing rule that **a claim never outruns the wiring**. Every item below is
tagged:

| Tag | Meaning |
| --- | --- |
| **EXISTS** | Working in the tree today. I read it. |
| **WIRE** | Both ends exist; nothing connects them. Small, high-leverage. |
| **BUILD** | Genuinely new code. |
| **FIX** | Currently broken. Verified defect with a file and line. |

---

## 1. Ground-truth corrections (read this before anything else)

The brief I was handed is mostly right about the engine and mostly wrong about the UI. Five
corrections, all verified:

### 1.1 The inline approval UI was built. Then it was unmounted.

The brief says *"neither `AskPanel.tsx` nor `use-ask-stream.ts` nor `src/components/mission/composer/*`
render `agent_approvals` at all."*

That is wrong about `AskPanel.tsx`. `src/components/obsidian/ask-canvas.tsx` (403 lines, the
"CMD-0 Command Canvas") renders, inside the Ask thread:

- `ProgressBlock` - the run's last five loop steps with status dots
- `ApprovalGateBlock` - pending `agent_approvals` for the mission, with **inline Approve / Reject**
  buttons wired to `decideApproval` (`src/lib/agent_loop.functions.ts:74`)
- `PendingApprovalsStrip` - a standing strip at the top of the panel showing any gate pending
  anywhere, decidable in place
- `MemoryBlock` (what the run drew on) and `CriticBlock`

It is mounted at `src/components/obsidian/AskPanel.tsx:249-253` (per message, keyed on
`msg.mission_id`) and `:1326` (the strip). It has realtime push via
`src/hooks/use-approval-push.ts`.

**And it is dead code.** `src/routes/_authenticated.tsx:201-208` says it plainly:

> *"The retired CommandPalette and AskPanel components stay in the tree source but are unmounted
> (Addendum 1.1 rule 8)"*

The live Ask surface is `GlobalComposer` → `ComposerOverlay` → `ThreadMessage`
(`src/components/mission/composer/`), driven by `src/hooks/use-ask-stream.ts`. Inside the Mission
Control room (`/m/*`), `MissionShell.tsx` owns its own composer and `Thread.tsx`.

So the founder's complaint is exactly correct about the shipping product, but the diagnosis
"nobody built it" is wrong. **Somebody built it for a surface that was subsequently retired.** The
work is not lost; it is orphaned. That changes the plan from "build" to "port and finish", which is
a much cheaper first move.

### 1.2 In the live app, a dispatched mission vanishes from the conversation completely

`src/components/mission/composer/Thread.tsx` does render inline gates - but they come from
`getApprovalsQueue` (the workspace-wide queue), they render at the **top of the thread**, capped at
3 (`INLINE_GATE_CAP`, `Thread.tsx:29`), and they are **not tied to the turn that produced them**.
The only thing `Thread.tsx` does with `msg.mission_id` is at line 346:

```tsx
{settled && msg.meta && !msg.mission_id ? (<PromoteRow ... />) : null}
```

It uses the mission link solely to *suppress* the promote chips. No progress. No receipt. No
mission-scoped gate.

And `GlobalComposer` - the Ask you get on every screen outside `/m/*` - renders `ThreadMessage`
directly (`GlobalComposer.tsx:30,139`), never `Thread`. **It shows no gates at all.** Ask a
mission-class question from `/today`, and the assistant says *"You can track the progress of the
specialist agents and approve their decisions inline below"* (`chat.ts:568`) - and then nothing
appears below. The product tells the user a lie in its own voice.

### 1.3 There are not two queues. There are three surfaces and two write paths, and they diverge

The brief frames this as "inline vs `/approvals` must not become two queues". The read layer is
already better than that: `decideApprovalItem` (`approvals-queue.functions.ts:718`) routes
`tool_call` straight to `resolveApproval`, so `/approvals` and the Mission Control thread already
share a write path.

The real defect is that the **Ask surface uses a different one**:

| Surface | Server fn | Sets `escalation_state` | Records `human_gate_events` | Captures `decision_reason` |
| --- | --- | --- | --- | --- |
| `/approvals`, Mission Control thread | `resolveApproval` (`governance.functions.ts:384`) | ✅ `resolved` | ❌ **never** | ✅ |
| Ask canvas (`ask-canvas.tsx`) | `decideApproval` (`agent_loop.functions.ts:74`) | ❌ leaves `pending` | ✅ `recordGateSignalCore` | ❌ no param |

Consequences, both verified:

- **Permanent:** every tool-call decision made on the primary queue surface produces **no
  `human_gate_events` row**. That is the RPT-32 correction signal - the single highest-value
  learning event the product has (`src/lib/gate-signals.ts:1-14` says so itself). The trust arc,
  the per-agent correction rate, and the graduation proposals are all blind to every decision made
  where users actually decide. This does not self-heal.
- **Transient:** a decision made in Ask leaves `escalation_state='pending'`, so the gate keeps
  haunting `getGovernanceOverview` (`governance.functions.ts:65`) and
  `stakeholder-update.functions.ts:192` until the `approvals-tick` cron reconciles it
  (`approvals-tick.ts:106-140`, every minute). Ugly, self-healing, low severity.

**FIX - one decide path.** Merge into a single `decideGate` in `governance.functions.ts` that does
all four writes, then delete `agent_loop.functions.ts:decideApproval`'s body and re-export the
merged one for backwards compatibility. See §4.

### 1.4 Resume is broken. A performance pass on 2026-07-23 deleted the run's memory.

This is the most severe finding in this document and it sits directly under the founder's
requirement (d).

`checkpoint()` in `src/lib/ai/loop.server.ts:827-867` writes this `state`:

```
agent, workspaceId, model, traceId, goal,
latestMessage, latestStep, stepCount, messageCount,
approvalsQueued, recalledMemories, injectedApprovalIds
```

It no longer writes `conv` or `steps`. Its own comment (line 832) justifies this:

```
// Full history is already in agent_run_steps and agent_run_messages;
// checkpoint is for recovery state only.
```

**`agent_run_steps` and `agent_run_messages` do not exist.** Not in
`src/integrations/supabase/types.ts`, not in any file in `supabase/migrations/`, not anywhere in
`src/` except that one comment. The commit is `2d73a156` (2026-07-23, *"Implement 9 performance
optimizations"*). The O(n²) fix was real; the premise it rested on was not.

Three downstream failures, all mechanical:

1. **`resumeAgentLoop` loses everything.** `loop.server.ts:1409` gates rehydration on
   `cp.state.conv`, which is now always undefined. So every resume falls into the `else` branch,
   rebuilds a fresh system prompt, sets `steps = []` - and then continues from
   `startStep = cp.step_index`. The agent wakes up at step 4 of 6 with no memory of steps 0-3.
   Every approval-gated run, every worker-eviction recovery, every cron resume.
2. **`injectedApprovalIds` never persists** (same dead branch), so `loop.server.ts:1487-1520`
   re-injects every decided approval outcome on every resume.
3. **The Ask progress block can never render.** `getAskMissionCanvas`
   (`ask-canvas.functions.ts:62-66`) reads `state?.steps ?? []`, which is now always `[]`, and
   `ProgressBlock` bails on `run.steps.length === 0` (`ask-canvas.tsx:78`). Even if you remounted
   `AskPanel` tomorrow, the progress block would show nothing.

No front-end work fixes any of this. §5 specifies the durable event log that fixes all three at
once and simultaneously provides the stream source for §3.

### 1.5 ZeroEntropy is not a product dependency. Sentry is not installed. Say so plainly.

The founder's mandate names *"PostHog, ZeroEntropy for graph, and I believe we are using Sentry
for error catching."* Verified:

- **ZeroEntropy:** `ZEROENTROPY_API_KEY` is in `.env`, and `zembed-1` is referenced in the
  founder's `~/.claude/CLAUDE.md` as the embedding model for **gbrain**, his local developer
  knowledge brain. It appears **zero times** in `src/`. The product's own embeddings run through
  `src/lib/rag/embed.server.ts`. It is not a graph engine and it is not in Supaprod.
- **Sentry:** not in `package.json`. `src/lib/observability/errors.ts` is a façade with no vendor
  behind it. Same for PostHog.
- **What actually exists** is a substantial first-party telemetry estate: `ai_events` (every model
  call with surface/model/tokens/cost/latency/trace), `tool_calls`, `human_gate_events`,
  `approval_feedback`, `activation_events`, `product_analytics`, `error_events`, `memory_recall_log`.

For this angle that is good news, not bad. **Every instrument the agentic conversation needs is
already first-party.** Nothing in §§2-7 waits on the AFD initiative. I have deliberately specified
the conversation's telemetry against the tables that exist. The vendor question belongs to another
angle; do not let it block this one.

### 1.6 Smaller corrections

- `PAUSE_ON_APPROVAL_TOOLS` (`loop.server.ts:74`) is only four tools: `studio.commit`,
  `studio.pr.open`, `studio.pr.merge`, `delegate.openhands`. Every **other** confirm/review gate
  queues an approval and the loop **keeps going** with *"Do not retry. Continue planning or
  finalize."* (`loop.server.ts:1198`). The brief's "the run pauses" is true only for the shipping
  four. This matters enormously for the turn anatomy: most gates do not stop the machine.
- `getApprovalsQueue` fetches `args` from `listGovernApprovals` (`governance.functions.ts:236`)
  and then **never uses them** when building the `tool_call` card
  (`approvals-queue.functions.ts:362-390`). The arguments a user is being asked to authorize are
  loaded into memory and thrown away.
- `agent_approvals` has no `run_id`→`conversation_id` path. `missions` has no `conversation_id`
  column. The link is one-way only: `messages.mission_id → missions.id`
  (`20260607100000_chat_messages_mission_id.sql`). §3.4 adds the reverse.
- Realtime publication currently contains **only** `agent_approvals`. `agent_runs` and `messages`
  were both dropped (`20260611085122`, `20260614210153`).
- The `/approvals` card's risk chip derives from `agent_tools.mode`
  (`governance.functions.ts:277-283`), not from `toolRisk()` in `tool-consequences.ts`. Two
  different notions of "high risk" on two surfaces.

---

## 2. The decision: Ask stops being a panel

**Recommendation: Ask becomes the application's primary surface, and every other screen becomes a
canvas it can point at.** Not a panel, not an overlay, not a dock.

The founder gave authority to override his own prior rulings where they are wrong. Two prior
rulings are wrong and I am overriding both:

- **OBS-12 (2026-07-02)** retired the full-page `/chat` route and rebuilt Ask as a 420px
  right-docked slide-over, explicitly scoping out a second pane.
- **Front-end reimagining Phase 2** replaced that with a centered `ComposerOverlay` summoned by
  ⌘J/⌘K.

Both decisions optimized for *calm* - the Engine-Room doctrine's "calm front, deep engine". That
was the right instinct applied to the wrong object. The Engine Room doctrine says machinery hides
behind a door. **An agent doing work on your behalf is not machinery. It is the work.** Hiding it
is what produces the exact failure the founder is complaining about: the conversation loses the
thread of its own work.

The mechanical evidence that the panel form is the problem, not the polish:

1. A 420px column cannot legibly render a tool call's arguments. `ApprovalGateRow`
   (`ask-canvas.tsx:115-186`) shows `agent_slug · tool_name` and a rationale string. It cannot show
   the diff, the target, the blast radius. The queue card can (`approvals-queue.functions.ts:362`)
   because it has a page.
2. An overlay is modal. A mission that runs for six minutes cannot live inside something the user
   dismisses to keep working. `ComposerOverlay` collapses the dock while open
   (`MissionShell.tsx:12-16`) - the conversation and the work are mutually exclusive.
3. The strongest tell: `ProgressBlock` truncates to the **last five steps**
   (`ask-canvas.tsx:81`) and `stepDescription` truncates each to `step.name` or 140 chars
   (`build-status.ts:128-132`). That is not restraint. That is a component apologizing for its
   container.

### 2.1 The shape

```
┌──────────────────────────────────────────────────────────────────────┐
│  Supaprod            [product ▾]              [3 waiting]  [account] │
├──────────────────────────────┬───────────────────────────────────────┤
│                              │                                       │
│   THE CONVERSATION           │   THE CANVAS                          │
│   (always present, owns      │   (what the conversation is           │
│    the left column)          │    pointing at, or empty)             │
│                              │                                       │
│   · user turns               │   · a spec, a trace waterfall,        │
│   · plan statements          │     a lineage graph, a diff,          │
│   · tool proposals + gates   │     a decision record                 │
│   · receipts                 │   · deep-linkable, closeable          │
│   · long-run tiles           │                                       │
│                              │                                       │
│  ┌────────────────────────┐  │                                       │
│  │ ask or instruct...       │  │                                       │
│  └────────────────────────┘  │                                       │
└──────────────────────────────┴───────────────────────────────────────┘
```

This is not new architecture. It is `docs/features/command-canvas.md`'s original design, which its
own 2026-06-20 correction note records as having been abandoned *because Ask was a 420px panel* - a constraint I am now removing. The document is explicit that CMD-1/CMD-2 were meant to "revisit
the layout question directly". This is that revisit.

Route: **`/` (the authenticated index) becomes the conversation.** `/m/$productId` (Mission
Control) is absorbed into it - that room already tried to be this and got most of the way
(`MissionShell.tsx` owns `useAskStream` + gates + a canvas region with `StageCanvasFace`). The
canvas column takes a `?canvas=` search param so any state is a shareable deep link.

### 2.2 What survives from the current work

| Keep | Where it goes |
| --- | --- |
| `useAskStream` (`src/hooks/use-ask-stream.ts`) | The conversation's engine, unchanged in shape, extended in §3 |
| `parseSseLine` (`src/lib/ask-sse.ts`) | Extended additively; contract preserved (§3.1) |
| `ask-canvas.tsx` blocks | Ported out of `obsidian/` into `src/components/converse/`, un-truncated |
| `Thread.tsx` / `ThreadMessage` | The conversation column's renderer |
| `MissionShellView`'s canvas region | The canvas column |
| `/approvals` route | Stays. It is the *inbox* view of the same gates (§4.3) |
| `AskPanel.tsx` (1438 lines, unmounted) | **Delete.** It is a fork of `use-ask-stream` and will rot |

### 2.3 The honest cost

This is the largest single change in the rebuild. It touches `_authenticated.tsx`,
`MissionShell.tsx`, `GlobalComposer.tsx`, and every route's assumption about its own chrome. It is
worth it because **every other item in this document depends on the conversation having room to
show its work**, and because the alternative - polishing a 420px panel - is what produced the
founder's dissatisfaction in the first place.

If it must be phased: §§3-5 (the streaming, the one decide path, the durable log) are independent
of the surface change and should land first. They make the *current* surface honest. The surface
change makes it good.

---

## 3. The turn anatomy, and the exact `chat.ts` changes

### 3.1 The SSE contract, and why extending it is safe

`src/lib/ask-sse.ts:28-53` parses one `data:` line by **key presence**, in this order:

```
status → meta → block → persisted → choices[0].delta → ignored
```

An unrecognized top-level key falls through to `{ kind: "ignored" }`, which every consumer skips
(`use-ask-stream.ts:338`). **Therefore new frame types are strictly additive and cannot break the
contract-locked `meta` frame**, provided they:

1. use a top-level key not in `{status, meta, block, persisted, choices}`;
2. do not nest a `status` key at the top level (it would be caught by the first branch);
3. still emit exactly one `meta` frame immediately before `[DONE]` on every path.

Rule 3 is the actual contract (`chat.ts:78-86`) and it is preserved verbatim below.

### 3.2 The five new frames

Added to `SseEvent` in `src/lib/ask-sse.ts` - **BUILD**, ~40 lines, pure, unit-testable against the
existing `ask-sse` test file.

```ts
/** The machine states its plan before it acts. One per turn, before any tool frame. */
| { kind: "plan"; plan: { summary: string; steps: string[]; missionId: string | null } }

/** A tool call proposed or executed. `phase` distinguishes the three moments. */
| { kind: "tool"; tool: ToolFrame }

/** A gate needs a human. Carries everything the inline card renders - no second fetch. */
| { kind: "gate"; gate: GateFrame }

/** A tool finished. The receipt that stays in the thread forever. */
| { kind: "receipt"; receipt: ReceiptFrame }

/** The run outlived the response. The client stops reading and starts subscribing. */
| { kind: "handoff"; handoff: { runId: string; missionId: string; resumeAt: string } }
```

```ts
export type ToolFrame = {
  phase: "proposed" | "running" | "done" | "denied" | "error";
  callId: string;            // `${runId}:${stepIndex}` - stable, matches the idempotency key
  name: string;              // e.g. "studio.pr.open"
  label: string;             // gateTitle(name) - plain words, never the mechanism
  args: Record<string, unknown>;   // THE ARGUMENTS, MADE LEGIBLE. see §3.3
  reason: string | null;     // the model's own `call.reason`
  stepIndex: number;
};

export type GateFrame = {
  approvalId: string;
  callId: string;            // ties the gate to its tool frame in the same turn
  toolName: string;
  label: string;
  args: Record<string, unknown>;
  rationale: string | null;
  // WHY THIS NEEDED PERMISSION - the resolveToolMode chain, made legible (§7)
  why: {
    mode: "confirm" | "review";
    cause: "risk_floor" | "review_pinned" | "arc_dial" | "seeded" | "not_reversible";
    seededMode: "auto" | "confirm" | "review";
    arc: "observing" | "proving" | "trusted" | "ambient";
    risk: "low" | "medium" | "high";
    reversible: "reversible" | "partial" | "irreversible";
    undo: string;            // toolConsequence(name).undo
    graduatable: boolean;    // nextRampMode(current, name) !== null
    streak: number;          // computeCleanStreaks() for this (agent, tool)
    streakNeeded: number;    // TRUST_RAMP_CLEAN_N === 5
  };
  pausesRun: boolean;        // PAUSE_ON_APPROVAL_TOOLS.has(toolName)
  expiresAt: string | null;
};

export type ReceiptFrame = {
  callId: string;
  approvalId: string | null;
  toolName: string;
  ok: boolean;
  verdict: "executed" | "denied" | "expired" | "failed";
  summary: string;           // one plain sentence
  auditRef: string | null;   // e.g. "MIS·7E7D59" - feeds <AuditTag/>
  traceId: string | null;    // deep-links /traces/$traceId
  latencyMs: number | null;
  decidedBy: "you" | "agent" | "expired" | null;
};
```

`parseSseLine` gains five guards before the `choices` branch. No existing branch moves.

### 3.3 Making arguments legible

This is the difference between an approval and a rubber stamp. A raw JSON blob is not consent.

**BUILD** - `src/lib/tool-args-legible.ts`, pure and client-safe, sitting beside
`tool-consequences.ts` and following its exact shape (a static map, conservative default, never
model output):

```ts
export type LegibleArg = { label: string; value: string; emphasis?: "path" | "count" | "danger" };

/** Per-tool projection of raw args into the two-to-four facts a human needs.
 *  Unknown tools fall back to the top three scalar keys, stringified - honest,
 *  never fabricated. Mirrors CONSEQUENCES's "keep in sync with TOOL_REGISTRY" rule. */
export function legibleArgs(toolName: string, args: unknown): LegibleArg[];
```

Worked examples, drawn from the four tools that actually pause a run:

| Tool | What the card shows |
| --- | --- |
| `studio.pr.open` | `repo` · `branch` · `N files` · the touch-list from `studio_changesets.allowed_paths` |
| `studio.pr.merge` | `PR #123` · `into main` · `CI green (4 checks)` · **`Cannot be undone`** |
| `studio.commit` | `N files` · the paths, capped at 5 with `+N more` · `message` |
| `delegate.openhands` | the task text · target repo · **`External agent. Cannot be recalled.`** |

The `emphasis: "danger"` flag drives the one visual escalation the card is allowed
(`docs/design/archive/tempo-v5.md` §restraint budget: one signal per card).

### 3.4 The `chat.ts` changes, line by line

Today, `src/routes/api/chat.ts:552-651` does this on a mission-class prompt:

```ts
runAgentLoop(supabase, userId, {...}).catch(err => console.error(...));   // :557 fire-and-forget
// ...
controller.enqueue(...text + mission_id...);                              // :595
controller.enqueue(...meta...);                                           // :607
controller.enqueue(`data: [DONE]`); controller.close();                   // :610
```

The response closes before the loop has taken a single step. That is the whole bug.

**The fix is not to run the loop inside the response.** That would trade a lost thread for a lost
run: a Worker eviction mid-stream would kill work the checkpoint system exists to protect. The
loop must stay durable. **The stream becomes a tail of the durable log, with a handoff when the
response can no longer wait.**

Replace `chat.ts:552-651` with:

```ts
// 3. Dispatch the mission, then TAIL it. The loop still runs durably (checkpoints
//    + the resume-runs cron); this response is a live view onto it, never its owner.
if (isMission && startingAgent && workspaceId) {
  const mission = await createMission(...);                       // unchanged, :555
  await supabase.from("messages").insert({ role: "user", ... });  // unchanged, :562

  // NEW: the reverse link. Without it a resumed run cannot find its thread.
  await supabase.from("agent_runs").update({ conversation_id: body.conversationId })
    .eq("mission_id", mission.id);                                // see migration §3.5

  // The loop still starts fire-and-forget - durability is unchanged.
  runAgentLoop(supabase, userId, {...}).catch(...);               // unchanged, :557

  return new Response(new ReadableStream({
    async start(controller) {
      const send = (o: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(o)}\n\n`));

      // (i) the sentence, with mission_id, exactly as today (delta frame unchanged)
      send({ choices: [{ delta: { content: text, mission_id: mission.id } }] });

      // (ii) tail run_events until the run parks, finishes, or we hit the budget
      const outcome = await tailRunEvents(supabase, {
        missionId: mission.id,
        send,                                   // emits plan / tool / gate / receipt
        signal: missionStreamAbort.signal,
        budgetMs: TAIL_BUDGET_MS,               // 55_000
      });

      // (iii) the handoff, when the work outlives the response
      if (outcome.kind === "still_running" || outcome.kind === "waiting_approval") {
        send({ handoff: { runId: outcome.runId, missionId: mission.id,
                          resumeAt: new Date().toISOString() } });
      }

      // (iv) THE CONTRACT, UNCHANGED: exactly one meta, then [DONE].
      send({ meta: missionMeta });
      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();

      // (v) persistence, unchanged (chat.ts:614-650)
    },
    cancel() { missionStreamAbort.abort(); },
  }), { headers: getSseHeaders(corsOrigin) });
}
```

**BUILD** - `src/lib/ai/run-tail.server.ts`, ~140 lines. Polls `run_events` (§5) by
`(mission_id, seq)` cursor at 400ms, maps each row to its frame, returns
`{ kind: "completed" | "waiting_approval" | "still_running" | "failed", runId }`.
Polling, not realtime: this is server-to-Postgres inside one Worker invocation, where a cursor read
is simpler and cheaper than a websocket, and `run_events` is append-only with a monotonic `seq`.

Notes on the budget: Cloudflare Workers impose no wall-clock ceiling on a streaming response, but
they do bill CPU and they do evict. 55s is chosen to sit under every intermediary's default idle
timeout while covering the ~85th percentile of a 6-step loop. Past it, the handoff frame fires and
the client switches to the subscription in §6.

### 3.5 Migrations

```sql
-- 20260729_120000_conversation_run_link.sql
ALTER TABLE public.agent_runs
  ADD COLUMN IF NOT EXISTS conversation_id uuid
  REFERENCES public.conversations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_agent_runs_conversation
  ON public.agent_runs(conversation_id) WHERE conversation_id IS NOT NULL;

-- the reverse of messages.mission_id, so a resumed run can post its receipt
-- back into the thread that asked for it.
```

### 3.6 The full turn, as the user experiences it

```
you  ──  Open a PR for the checkout-latency fix and merge it if CI is green.

Supaprod
  ▸ PLAN                                                    [MIS·7E7D59]
    Three steps. Open a draft PR from the staged changeset, wait for CI,
    merge if it comes back green.

  ▸ ran  read the changeset                                        0.4s ✓
         changeset 4A21B9 · 6 files · feat/checkout-latency
                                          ── receipt, collapsed by default

  ▸ WAITING ON YOU                                          expires in 7d
    ┌──────────────────────────────────────────────────────────────┐
    │  Open a draft pull request                                   │
    │                                                              │
    │  repo      RohitGajaraj/Supaprod                             │
    │  branch    feat/checkout-latency → main                      │
    │  files     6   src/lib/checkout/*.ts, src/routes/api/pay.ts  │
    │                                                              │
    │  Reversible · Close the PR. Nothing merges.                  │
    │                                                              │
    │  Why I'm asking: this writes to your repo, so it sits above  │
    │  the confirm floor no matter how much I've earned.           │
    │  Build has run this clean 3 times. 2 more and I stop asking. │
    │                                                              │
    │   [ Approve ]   [ Deny ]   [ Change something ]              │
    │    runs it now   I stand down   tell me what to do instead   │
    └──────────────────────────────────────────────────────────────┘

  (you approve)

  ▸ ran  opened a draft pull request                               1.8s ✓
         PR #412 · github.com/.../pull/412       [you approved · 11:04]

  ▸ WORKING  waiting on CI                    started 11:04 · still going
    ┌──────────────────────────────────────────────────────────────┐
    │  This will keep running whether or not you stay.             │
    │  I'll post here when it lands.        [ Watch ] [ Steer ]    │
    └──────────────────────────────────────────────────────────────┘
```

Every element maps to a frame: `plan` · `receipt` · `gate` · `receipt` · `handoff`.

Voice notes, binding (`docs/conventions/ui-voice.md`, `engine-room-doctrine.md`): buttons are
plain words with a consequence line under each. Never "Reject" - **"Deny"**, because reject is what
you do to a person's idea and deny is what you do to a request. Never "Execute" - **"Approve ·
runs it now"**. The mechanism name (`studio.pr.open`) appears only in the receipt's mono detail
line, never as the card's title.

---

## 4. One source of truth, two surfaces

### 4.1 The rule

> A gate is a row in `agent_approvals`. It has exactly one write path. Every surface is a *view*
> and every surface calls the *same function*. A decision anywhere resolves it everywhere, in one
> round trip, with no cron in the loop.

### 4.2 The merged decide path - FIX + WIRE

**FIX** - `src/lib/governance.functions.ts`. Rename `resolveApproval` → `decideGate` and make it do
all four writes that are currently split across two functions:

```ts
export const decideGate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(/* { approvalId, decision: "approved"|"rejected", reason?, steer? } */)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    // 1. read prior FIRST (from agent_loop.functions.ts:80-91) - needed for
    //    attribution AND to fire the gate signal only on a genuine first decision
    const { data: prior } = await supabase.from("agent_approvals")
      .select("status,agent_slug,tool_name,run_id,mission_id,workspace_id")
      .eq("id", data.approvalId).eq("user_id", userId).maybeSingle();

    // 2. the decision + escalation clear + reason  (from governance.functions.ts:388-415)
    await supabase.from("agent_approvals").update({
      status: data.decision,
      escalation_state: "resolved",          // ← Ask's path never set this
      decided_at: new Date().toISOString(),
      decided_by: userId,
      decision_reason: data.reason?.trim().slice(0, 2000) ?? null,
    }).eq("id", data.approvalId).eq("user_id", userId);

    // 3. the correction signal  (from agent_loop.functions.ts:108-119)
    //    ← the queue's path NEVER did this. permanent data loss until now.
    if (prior?.status === "pending") {
      await recordGateSignalCore(supabase, userId, {
        gateType: data.decision === "approved" ? "approval" : "rejection",
        subjectType: "tool_call", subjectRef: data.approvalId,
        agentSlug: prior.agent_slug, toolName: prior.tool_name,
        verdict: data.decision, diffSummary: data.steer ?? null,
        workspaceId: prior.workspace_id,
      });
    }

    // 4. NEW: a denial or a steer is guidance, not silence. §6.2
    if (data.decision === "rejected" && (data.reason || data.steer) && prior?.mission_id) {
      await injectSteer(supabase, userId, prior.mission_id, data.steer ?? data.reason!);
    }

    // 5. NEW: the receipt lands in the originating thread. §6.3
    await postGateReceipt(supabase, userId, data.approvalId);

    if (data.decision === "approved") {
      return { ok: true, executed: true, result: await executeApproval(supabase, userId, data.approvalId) };
    }
    return { ok: true, executed: false };
  });
```

Then:

- `src/lib/agent_loop.functions.ts:74` - replace the body of `decideApproval` with a delegation to
  `decideGate`. Keep the export; `ask-canvas.tsx:200`, `:250` and `governance.functions.test.ts`
  import it.
- `src/lib/approvals-queue.functions.ts:723` - `case "tool_call"` calls `decideGate` instead of
  `resolveApproval`.
- `src/lib/governance.functions.ts` - keep `resolveApproval` as a one-line alias for one release,
  then delete. `deployments.functions.ts:237` writes `escalation_state` directly and must be
  audited in the same pass.

**After this change there is exactly one function in the codebase that decides a tool-call gate.**
Grep-enforceable: `agent_approvals` + `.update({ status:` should return exactly one non-test hit.

### 4.3 The two surfaces

| | The conversation (inline) | `/approvals` (the queue) |
| --- | --- | --- |
| **Question it answers** | "This turn produced a gate. Decide it without leaving." | "What is waiting on me across everything?" |
| **Scope** | Gates whose `run_id` belongs to this thread's runs | Workspace-wide, all 10 families |
| **Shows** | Full args, the why-chain, the streak, three verbs | Grouped by project, j/k navigation, filter tabs, batch |
| **Write path** | `decideGate` | `decideGate` |
| **Read path** | `gate` SSE frame, then `getConversationGates` (§6.1) | `getApprovalsQueue` |

They are not redundant. The inline gate is *decision at the point of context*; the queue is
*decision at the point of triage*. What must never happen is a gate appearing in one and not the
other, or clearing in one and not the other.

### 4.4 The invalidation contract - WIRE

Both surfaces already have the plumbing; it is not connected.

- `src/hooks/use-approval-push.ts` subscribes to `agent_approvals` INSERT/UPDATE filtered by
  `user_id` (migration `20260716120000` put the table in the realtime publication). It currently
  invalidates only `["ask-pending-approvals"]` and `["ask-mission-canvas"]` - the two keys owned by
  the **unmounted** panel.

**FIX** - one query key set, invalidated by one hook:

```ts
const GATE_KEYS = [
  ["approvals", "queue"],        // /approvals + the needs-you pill + the rail badge
  ["conversation", "gates"],     // the inline cards
  ["needs-you"],                 // Today
  ["mission-approvals"],         // Build cards (use-mission-approvals.ts)
  ["spec-approvals"],
];
```

`useApprovalPush` invalidates all five. Mount it once, at the shell. Delete the per-surface 4s and
30s polls in `ask-canvas.tsx:264` and `MissionCanvasBlocks` - realtime plus a single 60s safety-net
refetch is enough, and the 4s poll against `getAskMissionCanvas` is a meaningful cost line at scale
(it runs six queries per tick).

**This also satisfies the founder ruling of 2026-07-18 already recorded in
`MissionShell.tsx:5-7`: "ONE COUNT ONE SOURCE".** It is currently honored for the count and
violated for the queue.

---

## 5. Long-running work: the durable log

This section fixes §1.4 and simultaneously provides the tail source for §3.4. One table does both.

### 5.1 `run_events` - BUILD

```sql
-- 20260729_121000_run_events.sql
-- The durable, append-only narrative of an agent run. This is the table the
-- 2026-07-23 checkpoint comment assumed existed ("agent_run_steps and
-- agent_run_messages") and which was never created - see loop.server.ts:832.
--
-- One row per observable moment. Feeds: the live SSE tail, the conversation
-- replay on reload, the run detail view, and the resume rehydration.
CREATE TABLE IF NOT EXISTS public.run_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id        uuid NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  mission_id    uuid REFERENCES public.missions(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL,
  workspace_id  uuid,
  seq           integer NOT NULL,           -- monotonic within run_id; the tail cursor
  step_index    integer NOT NULL,
  kind          text NOT NULL CHECK (kind IN
                  ('plan','thought','tool_proposed','tool_running','tool_done',
                   'gate_opened','gate_decided','steer','receipt','final','error')),
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  trace_id      text,
  approval_id   uuid REFERENCES public.agent_approvals(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id, seq)
);
CREATE INDEX idx_run_events_tail    ON public.run_events (mission_id, seq);
CREATE INDEX idx_run_events_run     ON public.run_events (run_id, seq);
ALTER TABLE public.run_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY run_events_own ON public.run_events
  FOR SELECT USING (user_id = auth.uid());
-- writes are service-role only (the loop runs server-side)

ALTER PUBLICATION supabase_realtime ADD TABLE public.run_events;
```

Retention: a nightly prune keeps 90 days of `run_events` (a hook alongside the existing 36 under
`src/routes/api/public/hooks/`). The `ai_events` trace remains the permanent record; `run_events`
is the *narrative*, and narratives can age out.

### 5.2 The loop writes it - WIRE

`src/lib/ai/loop.server.ts`, inside `executeLoop`. A single local helper next to `checkpoint`:

```ts
let seq = s.startSeq ?? 0;
const emit = async (kind: RunEventKind, payload: unknown, approvalId?: string) => {
  if (!runId) return;
  try {
    await supabase.from("run_events").insert({
      run_id: runId, mission_id: ctx.missionId, user_id: userId,
      workspace_id: workspaceId, seq: seq++, step_index: i,
      kind, payload, trace_id: traceId, approval_id: approvalId ?? null,
    });
  } catch (e) { console.error("run_event emit failed:", e); }   // never fatal
};
```

Call sites, all inside the existing `for (let i = s.startStep; ...)` loop:

| Where | Emit |
| --- | --- |
| after `resolveModelAction` returns a `thought` | `emit("thought", { text })` |
| before the mode check, `loop.server.ts:1132` | `emit("tool_proposed", { name, args, reason })` |
| the approval insert, `:1136-1160` | `emit("gate_opened", {...}, appr.id)` |
| the pause branch, `:1172-1196` | `emit("plan", { paused: true, reason: pauseMsg })` |
| before `def.run`, `:1213` | `emit("tool_running", { name })` |
| after success, `:1230` | `emit("tool_done", { name, ok: true, latency, result })` |
| the catch, `:1252` | `emit("error", { name, message })` |
| `finalize()` | `emit("final", { message })` |

Eight insertions, all one-liners, all non-fatal. This is the "WIRE" that makes the conversation
able to narrate itself.

### 5.3 Restore the checkpoint - FIX

`loop.server.ts:827-867`. The O(n²) concern was real; the answer is not to delete history but to
stop *rewriting* it. With `run_events` carrying the narrative, the checkpoint reverts to carrying
what resume genuinely needs - and `conv` is exactly that, because the model needs its own
conversation back:

```ts
state: {
  agent, workspaceId, model, traceId, goal: s.goal,
  conv,                     // ← RESTORED. resumeAgentLoop:1409 gates on it.
  stepCount: steps.length,  // steps themselves now live in run_events
  approvalsQueued,
  recalledMemories: s.recalledMemories,
  injectedApprovalIds: s.injectedApprovalIds,
  seq,                      // ← so the resumed run continues the sequence
}
```

The O(n²) is bounded by `maxSteps = 6` and each `conv` entry is capped at 2000 chars
(`loop.server.ts:1244`). Worst case is roughly 6 upserts of a ~24KB jsonb. That is not the hot path
the optimization pass thought it was; the actual win in `2d73a156` was elsewhere. If the write
volume still worries anyone, upsert `conv` only every other step - but do not ship a resume that
starts amnesiac.

`resumeAgentLoop:1354-1360` additionally must set `steps` from `run_events` rather than `[]`, so
`anyToolStepFailed(steps)` at `finalize()` (`:1536`) tells the truth about a resumed run:

```ts
const { data: priorEvents } = await supabase.from("run_events")
  .select("kind,payload,seq").eq("run_id", runId).order("seq");
steps = replayStepsFromEvents(priorEvents ?? []);   // pure, unit-testable
```

**Regression test, mandatory** - `src/lib/ai/loop.server.test.ts` already has a
`describe("resumeAgentLoop")` block at line 193 with a TODO at line 394 (*"Expected: resumeAgentLoop
blocks until approval executed"*). Add: *a run checkpointed at step 3 with a 5-message `conv`
resumes with that same `conv` and non-empty `steps`.* That one assertion would have caught
`2d73a156` on the day it landed.

### 5.4 What a long-running action looks like in the conversation

Three states, three renderings. The turn never becomes a dead end.

**Still running when the response closes** - the `handoff` frame fires. The turn renders a
**working tile**:

```
▸ WORKING   opening the pull request        started 11:04 · 2m 10s
  This keeps running whether or not you stay.     [ Watch ]  [ Steer ]
```

`Watch` opens the run in the canvas column (`?canvas=run:<runId>`), which subscribes to
`run_events` over realtime and appends live. `Steer` is §6.2.

**Parked on a gate** - the `gate` frame already arrived, so the card is right there. The tile
reads `WAITING ON YOU` and the run's `agent_runs.status` is `waiting_approval` (written at
`loop.server.ts:1182`). The `resume-runs` cron (`* * * * *`,
`20260626061818`) sweeps it within 60s of the last blocking approval clearing
(`resume-runs.ts:154-180`, which correctly treats both `pending` and `approved`-but-unexecuted as
blocking).

**Resumed after the user left** - the run finishes under the cron. `postGateReceipt` (§6.3) posts
an assistant message into the originating `conversation_id` (now reachable via the §3.5 column).
The user returns to a thread where the work completed itself, with a receipt, in sequence. **This is
the single most important behavior in this document.** A conversation you can walk away from and
come back to is what separates an agent from a chatbot.

Reload mid-run rehydrates identically: `hydrateMessages` (`src/lib/ask-thread.ts`) plus a
`run_events` replay for any message carrying a `mission_id`. Same renderer, same frames, sourced
from the table instead of the stream.

---

## 6. Denial, steering, and the receipt

### 6.1 Reading gates without the stream - WIRE

**BUILD** - `getConversationGates` in a new `src/lib/converse.functions.ts`:

```ts
/** Every gate belonging to any run this conversation started, decided or not.
 *  The inline cards' read path on reload, and the invalidation target for
 *  ["conversation","gates",conversationId]. */
export const getConversationGates = createServerFn({ method: "GET" })
  // agent_runs.conversation_id (§3.5) → agent_approvals.run_id
  // returns the same GateFrame shape the SSE emits, so ONE renderer serves both.
```

The shape-identity matters: the inline gate card must never have two code paths, one for live and
one for reloaded. It renders `GateFrame`, whatever produced it.

### 6.2 A denial is guidance, not silence - BUILD

Today a denial is a bare toast: `"Rejected."` (`ask-canvas.tsx:206`) or `"Rejected. Noted for next
time."` (`_authenticated.approvals.tsx:40`). The second is a promise the product does not keep - nothing is noted anywhere a model will ever read.

The gate card gets **three verbs**, not two:

| Verb | What it does |
| --- | --- |
| **Approve** | `decideGate({ decision: "approved" })` → `executeApproval` → receipt |
| **Deny** | `decideGate({ decision: "rejected", reason })` - reason optional but prompted once |
| **Change something** | `decideGate({ decision: "rejected", steer })` - the steer is required |

`Change something` is the founder's mid-run steering, surfaced at the exact moment it is useful. It
already has an engine:

**`injectSteer`** - **WIRE**, extracted from `steerStudioSession`
(`src/lib/studio.functions.ts:974-1005`), which today hardcodes `to_agent_slug: "builder"` and
requires a `missionId`. Generalize it to take the run's own agent, and call it from `decideGate`
step 4:

```ts
await supabase.from("agent_messages").insert({
  user_id, workspace_id, mission_id,
  to_agent_id: agent.id, to_agent_slug: agent.slug,
  kind: "steer", payload: { message: steerText },
});
```

The loop already consumes these. `loop.server.ts:876-922` reads unconsumed `kind='steer'` messages
at the top of every step, injects them as
`"Operator steering (mid-session guidance - follow it): ..."`, and marks them consumed **only after**
the checkpoint persists them - so a steer can never be both consumed and lost. That machinery is
correct and untouched. It has simply never had a UI.

**A steer can also be typed as a plain turn.** If the user types into the composer while a run is
live, the conversation offers a chip: `Send to the running mission →`. Same `injectSteer`. This is
the "it should be like ChatGPT" instinct done right - you keep talking, and the machine is
listening while it works.

Denial copy, in the product's voice:

```
▸ you denied  open a draft pull request                        11:06
  "not until the migration lands"
  Build stood down and will not retry this. It knows why.
```

That last sentence is only writable because the reason reaches `decision_reason`, `diff_summary` on
the `human_gate_events` row, and the run's own `conv` via the steer injection. Three places, one
user action, no fabrication.

### 6.3 The receipt - BUILD

`postGateReceipt(supabase, userId, approvalId)` in `src/lib/converse.functions.ts`. Runs at the end
of `decideGate` **and** from `executeApproval`'s completion path
(`loop.server.ts:1637-1650`), so a cron-resumed execution posts too.

It writes a `run_events` row of kind `receipt` and, when the originating conversation is no longer
streaming, an assistant `messages` row carrying the receipt in `metadata` (the column exists,
`20260612120000`).

The receipt is permanent, collapsed by default, and always carries:

- what ran, in plain words (`gateTitle`, `build-status.ts:137`)
- who decided and when - **"you approved · 11:04"** or **"ran on its own"**
- the outcome, one sentence
- an `<AuditTag kind="mission" id={missionId}/>` - the existing component
  (`src/components/supaprod/AuditTag.tsx`), which opens `AuditLineageSheet`
- a `trace_id` link to `/traces/$traceId` - the 861-line waterfall that already exists and that
  nothing currently links to from a conversation

That last point is the hand-off to **Depth A / Depth C**: the receipt is where the conversation
becomes an entry point into the lineage graph. When the founder asks *"why did we decide this"*, the
conversation is the surface that answers, and the receipt is the link it follows.

**Note for the lineage angle:** `recordLineage` is called from
`ai/tools/registry.server.ts:2546` but **not** from `executeApproval`. A tool that runs via the
approval path therefore writes no lineage edge at all. Fixing that is one call inside
`executeApproval`'s success branch (`loop.server.ts:1637`), and it belongs to whoever owns the
lineage vocabulary - but it must be fixed, because approvals are exactly the high-consequence
actions whose lineage matters most.

---

## 7. The trust arc, made visible

The founder asked for two things the product currently cannot say: **why did this need permission**,
and **what would make it stop asking**. Both answers already exist in code. Neither has ever been
rendered.

### 7.1 Why it asked - deriving the `why` block

`resolveToolMode` (`loop.server.ts:153-211`) composes six ordered rules to reach a mode. The
function is already pure and exported precisely so the ordering is unit-testable. **Make it also
return its reason.**

**BUILD** - a sibling in the same file, so the two can never drift:

```ts
export type ModeCause =
  | "review_pinned"    // HIGH_RISK_FORCE_REVIEW
  | "risk_floor"       // HIGH_RISK_MIN_CONFIRM | isHighRiskTool
  | "arc_dial"         // the agent's arc tightened it (observing/proving)
  | "seeded"           // the tool's own agent_tools.mode
  | "not_reversible";  // failed the AGT-02 contract auto-clear

export function explainToolMode(
  toolName: string, rawToolMode: ToolMode, arc: Arc, contractApproved: boolean,
): { mode: ToolMode; cause: ModeCause } // same branches, returns the branch taken
```

Copy per cause - plain, first person, never the mechanism:

| Cause | What the card says |
| --- | --- |
| `review_pinned` | "This one always comes to you. It ships code, and that decision stays yours." |
| `risk_floor` | "This writes outside Supaprod, so it sits above the automatic line no matter how much I've earned." |
| `arc_dial` | "I'm still proving myself on this workspace. Everything I do comes to you until that changes." |
| `seeded` | "You set this tool to ask first." |
| `not_reversible` | "Your spec is approved, so I run reversible work on my own. This one can't be undone." |

### 7.2 What would stop it asking

`src/lib/ai/trust-ramp.ts` already computes everything needed:

- `computeCleanStreaks(rows)` - consecutive `executed` decisions per tool, resetting on
  `rejected`/`failed` (`:82-100`)
- `TRUST_RAMP_CLEAN_N = 5` (`:19`)
- `nextRampMode(current, toolName)` - returns `null` for tools that can never graduate
  (`:57-63`)
- `shouldProposeGraduation` - the one gate that writes a proposal, blocked by
  `outcomeBlocked` when the agent has a `missed` outcome in the 30-day window (`:112-125`)

So the card can say, truthfully:

```
Build has run this clean 3 times. 2 more and I stop asking.
```

or, when it cannot graduate:

```
This one always comes to you. I don't get to earn it.
```

or, when a bad outcome froze the ramp - and this is the sentence that proves the brain is a brain
and not a filing cabinet:

```
I was close to earning this. Then PRD·8C2A1F missed, and the ramp reset.
```

That last line is only sayable because `shouldProposeGraduation`'s `outcomeBlocked` flag is derived
from `learnings.verdict = 'missed'`. **WIRE** - thread the blocking learning's id through the
`GraduationCheck` so the copy can name it. Roughly a dozen lines in
`src/lib/trust.functions.ts`'s proposal builder.

### 7.3 The arc, always in view

The conversation header carries one quiet chip: the active agent's arc and score, from
`computeAllAgentTrust` (`src/lib/ai/trust.server.ts`). Clicking it opens the trust ledger in the
canvas column. Note the default is `trusted`, not `observing` (`loop.server.ts` /
`trust.server.ts:loadAgentArc`, founder ruling 2026-07-08: *"autonomous by default"*). The chip
must therefore read as a **state the user can tighten**, never as a badge the agent earned - the
copy is "Build runs on its own · tighten", not "Build: trusted ✓".

---

## 8. Telemetry for this surface

Against tables that exist. Nothing here waits on the AFD initiative (§1.5).

| Question | Source |
| --- | --- |
| Does Ask actually act, or only talk? | `ai_events` where `surface='chat'`, joined to `missions` on `surface_ref` → conversation → `messages.mission_id`. The ratio of mission-class turns to chat turns is the headline number for this whole rebuild. |
| Do people decide inline or bounce to the queue? | `human_gate_events` needs a `surface` column - **BUILD**, one nullable text column, set by `decideGate` from a new caller-supplied `surface: "conversation" \| "queue" \| "build"`. Without it this question is unanswerable. |
| Time from gate opened to gate decided | `agent_approvals.created_at → decided_at`. `listGovernApprovals` already computes the median (`governance.functions.ts:288-294`); surface it per-surface once the column above lands. |
| Do gates expire unattended? | `agent_approvals.status='expired'`, written by `approvals-tick`. A rising rate is the clearest signal the inline card is not working. |
| Does the trust arc actually loosen over time? | `computeCleanStreaks` over time + `agent_tool_modes` rows written on accepted graduations. If nothing ever graduates, the arc is theater. |
| Do denials teach anything? | `human_gate_events` where `gate_type='rejection'` **and** `diff_summary IS NOT NULL`. Today that count is structurally zero, because no denial path captures a reason. It should be the metric this whole angle is judged on. |

The one honest gap: nothing today records **which surface a decision was made on**. Adding
`human_gate_events.surface` is the single highest-value telemetry change in this document, and it
is one column plus one parameter.

---

## 9. Build order

Each step is independently shippable and independently verifiable. Steps 1-4 improve the current
surface without touching it; step 5 is the surface change.

| # | Work | Tag | Files | Gate |
| --- | --- | --- | --- | --- |
| 1 | Restore `conv` to the checkpoint; rehydrate `steps` from `run_events`; add the regression test | **FIX** | `ai/loop.server.ts:827,1409`, `ai/loop.server.test.ts:193` | A run checkpointed at step 3 resumes with its conversation intact |
| 2 | `run_events` table + `emit()` at the 8 loop call sites + the 90-day prune hook | **BUILD** | migration, `ai/loop.server.ts` | A completed run has a readable narrative in `run_events` |
| 3 | One decide path: `decideGate`; rewire all three callers; add `human_gate_events.surface` | **FIX** | `governance.functions.ts:384`, `agent_loop.functions.ts:74`, `approvals-queue.functions.ts:723` | Every gate decision writes a `human_gate_events` row, from every surface |
| 4 | SSE frames + `run-tail.server.ts` + `chat.ts:552-651` + `agent_runs.conversation_id` | **BUILD** | `ask-sse.ts`, `api/chat.ts`, migration | A mission-class turn streams `plan`/`tool`/`gate`/`receipt`; the `meta` frame is byte-identical |
| 5 | The conversation surface: `/` becomes conversation + canvas; port `ask-canvas.tsx`; delete `AskPanel.tsx` | **BUILD** | `_authenticated.tsx`, `components/converse/*` | A gate renders with full args in the turn that produced it |
| 6 | Three verbs + `injectSteer` + `postGateReceipt` | **BUILD/WIRE** | `converse.functions.ts`, `studio.functions.ts:974` | A denial with a reason reaches the running agent's next step |
| 7 | `explainToolMode` + the why-block + the streak line | **BUILD/WIRE** | `ai/loop.server.ts:153`, `trust-ramp.ts`, `trust.functions.ts` | Every gate says why it asked and what would stop it |
| 8 | `useApprovalPush` invalidates all five keys; drop the 4s/30s polls | **WIRE** | `hooks/use-approval-push.ts` | Deciding in one surface updates the other within one round trip |

Steps 1 and 3 are bug fixes to shipped behavior and should land regardless of what happens to the
rest of this plan.

---

## 10. Hand-off to the other two angles

**To the lineage/audit angle (Depth A):**

- The receipt (§6.3) is the conversation's entry point into lineage. It carries `<AuditTag/>` and a
  `trace_id`. Whatever vocabulary you settle on, the receipt renders it.
- `executeApproval` (`loop.server.ts:1608-1698`) calls **no** `recordLineage`. Every approved
  high-consequence tool therefore writes zero lineage. One call in its success branch.
- `run_events` (§5.1) is the narrative layer beneath lineage: lineage says *what connects to what*,
  `run_events` says *what happened, in order, and who authorized it*. They should link by
  `trace_id`, which both already carry.
- `AUDIT_KINDS` (`src/lib/audit-id.ts:43-62`) has no kind for a run, an approval, or a receipt.
  If the conversation is to show audit ids on its own turns - and it should - that vocabulary needs
  `RUN` and `GATE` entries.

**To the analytics angle (Depth C):**

- §8's table is the conversation's instrumentation. It is entirely first-party.
- The one column I am asking you to own: `human_gate_events.surface`. Everything about where users
  actually decide depends on it.
- Please carry §1.5 forward verbatim. ZeroEntropy is the founder's local dev brain, not a product
  dependency; PostHog and Sentry are not installed. Any plan that assumes otherwise will produce a
  claim that outruns its wiring, which is precisely the failure mode this repo has a standing rule
  against.

**Shared constraint for all three:** `parseSseLine` (`src/lib/ask-sse.ts`) is the one contract
nobody may break. It is safe to extend by adding top-level keys; it is not safe to reorder its
branches or to nest a `status` key. The `meta`-before-`[DONE]` invariant holds on every path,
including every failure path.

---

## Appendix - verification log

Everything asserted above was read this session. Load-bearing anchors:

| Claim | Where I verified it |
| --- | --- |
| `chat.ts` fires the loop and closes the stream | `src/routes/api/chat.ts:552-651` |
| The SSE parser dispatches on key presence, unknown keys ignored | `src/lib/ask-sse.ts:28-53` |
| `AskPanel` and its canvas are unmounted | `src/routes/_authenticated.tsx:201-208` |
| The live Ask renders `ThreadMessage`, never `Thread`, off `/m/*` | `src/components/mission/composer/GlobalComposer.tsx:30,139` |
| `Thread.tsx` uses `mission_id` only to hide promote chips | `src/components/mission/composer/Thread.tsx:346` |
| Inline gate cap is 3, sourced workspace-wide | `Thread.tsx:29,369` |
| Two decide paths with divergent writes | `governance.functions.ts:384` vs `agent_loop.functions.ts:74` |
| `decideApprovalItem` already routes `tool_call` to `resolveApproval` | `approvals-queue.functions.ts:723-731` |
| Only `resolveApproval` clears `escalation_state`; only `decideApproval` logs a gate signal | both handlers, read in full |
| The escalation divergence self-heals via cron | `api/public/hooks/approvals-tick.ts:106-140` |
| Checkpoint no longer writes `conv`/`steps` | `ai/loop.server.ts:827-867` |
| `agent_run_steps` / `agent_run_messages` do not exist | grep across `src/`, `supabase/migrations/`, `types.ts` - one hit, the comment itself |
| Resume gates rehydration on the now-absent `conv` | `ai/loop.server.ts:1409` |
| The canvas reads `state.steps`, always `[]` | `lib/ask-canvas.functions.ts:62-66`, `ask-canvas.tsx:78` |
| The commit that did it | `git log -S"stepCount: steps.length"` → `2d73a156`, 2026-07-23 |
| Only 4 tools pause the run | `ai/loop.server.ts:74-79` |
| The steer engine exists and is consumed | `studio.functions.ts:974-1005`, `ai/loop.server.ts:876-922` |
| `getApprovalsQueue` fetches `args` and discards them | `governance.functions.ts:236` vs `approvals-queue.functions.ts:362-390` |
| `tool_call` gates cannot be sent back | `approvals-queue.functions.ts:848` (`REVISABLE_KINDS`) |
| Trust ramp constants and the outcome block | `ai/trust-ramp.ts:19,57-63,82-125` |
| Default arc is `trusted`, not `observing` | `ai/trust.server.ts:loadAgentArc` |
| `missions` has no `conversation_id`; `messages.mission_id → missions.id` | `types.ts`, `20260607100000_chat_messages_mission_id.sql` |
| Realtime publication holds only `agent_approvals` | net of all `ALTER PUBLICATION` migrations |
| Both crons run every minute | `20260626061818`, `20260707202000_sw6_cron_truth.sql` |
| No PostHog, no Sentry, no ZeroEntropy in `src/` | `package.json`, grep across `src/` |
