> _Build spec, MAIN LANE 2026-08-25, produced against the real source. Every claim carries a
> file:line or says UNVERIFIED. **`the-first-run/RULINGS.md` remains the tiebreaker.**_

# BUILD SPEC — L0-1, the inline consent card

**Author: MAIN-lane spec pass, 2026-08-25. Governs `the-first-run/BUILD-QUEUE.md` item L0-1.**
Every existing thing is cited `file:line`. Anything I could not check from the repo is marked **UNVERIFIED**. I edited nothing and started no server.

---

## 0. Ownership, and the three things MAIN must ship before LANE 0 can finish

The card itself is entirely LANE 0's. Its data is not. Split it now so neither lane stalls.

| Piece | Path | Owner | Status |
| --- | --- | --- | --- |
| `TrackConsent` card + its sub-parts | `src/components/track/TrackConsent.tsx` | **LANE 0** | build |
| Mounting it in `TrackRun` | `src/components/track/TrackRun.tsx:65` | **LANE 0** | edit |
| `getTrackGates` server fn | `src/lib/spine/track.functions.ts` | **MAIN** | **does not exist — §1.3** |
| `decideTrackGate` server fn (decide + reason + steer, one call) | `src/lib/spine/track.functions.ts` | **MAIN** | **does not exist — §5.2** |
| `decideTrackGateClass` server fn (the "all" door) | `src/lib/spine/track.functions.ts` | **MAIN** | **does not exist — §3.3** |

**LANE 0: do not stall on these.** Write the card against the exact types in §1.3, §3.3 and §5.2, import them from `@/lib/spine/track.functions`, and if the import does not resolve yet, file `coordination/requests/L0-<n>-track-gate-reads.md` quoting this section verbatim and take L0-2 while you wait. The types below are the contract; MAIN builds to them.

**No new Meridian primitive is required.** §7 states that explicitly so nobody files a spurious gap request.

---

## 1. Where the data comes from

### 1.1 The link is one-way, and this is the single most important fact in the spec

`agent_approvals` has **no track back-reference**. Confirmed against the base table (`supabase/migrations/20260602205139_5f25aeb6-a127-4db9-8df5-d331dbbe5e25.sql:46-63`) and every subsequent `ALTER`: the columns are `id, user_id, agent_id, agent_slug, trace_id, tool_name, args, rationale, status, decided_at, decided_by, result, error, expires_at, created_at, updated_at`, plus `escalation_state / escalated_at / escalated_to` (`20260603205441:94-98`), `decision_reason` (`20260613170000:9`), `run_id / mission_id / workspace_id` (`20260612100000:92-94`), `expiry_notified_at` (`20260702230000:7`), `snoozed_until` (`20260707190000:58`), `execution_claimed_at` (`20260814120000:67`), `expiry_default` (`20260822190000:41`).

The migration that created the link says so in its own words — `supabase/migrations/20260801170000_spine_track_pending_gates.sql`:

> *"WHY A COLUMN RATHER THAN A QUERY. The obvious alternative is to search `agent_approvals` at harvest time for rows belonging to this track. There is no such filter: the table carries user_id, run_id, mission_id and workspace_id, and none of those identify a spine track. Matching on user and time would be the same time-window guess the attachment pass already rejected for lying."*

So the only edge is `spine_tracks.pending_gates`, shape `[{ "id": "<approval uuid>", "station": "<station that asked>" }]`, typed at `src/lib/spine/attach.ts:376`:

```ts
export type PendingGate = { id: string; station: AgentStation };
```

Written by `rememberGates` (`src/lib/spine/driver.server.ts:295-315`) from `gatesOpenedBy` (`src/lib/spine/attach.ts:491-506`), which reads each queued step's own `approval_id`. Causal, never correlational.

### 1.2 What the UI must NOT do — five prohibitions, each with its reason

1. **Never call `getApprovalsQueue` (`src/lib/approvals-queue.functions.ts:151`) and filter for this track.** It has no track filter and `ApprovalQueueItem` (`:108-121`) carries `projectId`, not `trackId`. Any filter you write is a guess.
2. **Never match `agent_approvals` by `user_id` + a time window.** Named and rejected twice: `attach.ts:16-38` and the migration text above.
3. **Never match by `workspace_id` alone.** One workspace runs many tracks; you would show another run's question inside this run.
4. **Never match by `mission_id`.** The driver opens a mission for exactly one station (`driver.server.ts:1189`, cited in `track.functions.ts:980`), so six of seven stations have no mission and the join is empty for them.
5. **Never render a gate the track does not list.** `pending_gates` is the membership statement. An approval row that is pending but absent from `pending_gates` belongs to some other run and is not this card's business.

### 1.3 The read MAIN must build

Add `pending_gates` to `SELECT` at `src/lib/spine/track.functions.ts:159-160` (it is currently absent, which is why `getTrack` at `:335` cannot serve this), and add a second server fn beside `getTrackActivity` (`:941`). `Track` (`:72-107`) gains no field — the gates are their own read with their own cadence.

```ts
/** One question waiting inside one run. Every string is derived, never authored here. */
export type TrackGate = {
  /** agent_approvals.id — the id every decide call posts. */
  approvalId: string;
  /** From pending_gates, NOT re-derived: the station that actually asked. */
  station: AgentStation;
  /** agent_approvals.tool_name. NEVER RENDERED. Keys the catalogue only. See §2.4. */
  toolName: string | null;
  /** agent_approvals.agent_slug. Resolve through agentDisplayName before display. */
  agentSlug: string | null;
  /** agent_approvals.rationale — the agent's own words for why it asked. May be null. */
  rationale: string | null;
  /** agent_approvals.status, lower-cased. Only 'pending' is answerable. */
  status: "pending" | "approved" | "executed" | "rejected" | "failed" | "cancelled" | "expired";
  /** agent_approvals.created_at as epoch ms. Feeds stoppedFor/isOverdue. */
  askedAtMs: number;
  /** agent_approvals.expires_at as epoch ms, or null. */
  expiresAtMs: number | null;
  /** agent_approvals.expiry_default. NULL means the row predates the column (20260822190000). */
  expiryDefault: "proceed" | "cancel" | null;
  /** agent_approvals.snoozed_until as epoch ms, or null. A snoozed gate still holds the run. */
  snoozedUntilMs: number | null;
  /**
   * How many OTHER pending gates in this workspace share this tool_name, this one excluded.
   * Server-counted, never client-inferred. Drives the "Decide all" label and count. §3.3.
   */
  classPendingElsewhere: number;
};

export type TrackGatesResult = {
  /** Answerable now. Ordered oldest first, so the thing that has waited longest reads first. */
  open: TrackGate[];
  /**
   * Listed on the track but no longer answerable (approved-not-yet-run, executed, rejected,
   * failed, expired, cancelled, or the row has vanished). Rendered, never hidden — §4.3.
   */
  settled: TrackGate[];
  /**
   * The track's own hold reason, verbatim from spine_tracks.last_hold. The card renders
   * itself as the answer to this hold only when it reads "waiting-on-a-person".
   */
  holdReason: string | null;
  /** True when pending_gates is non-empty but every id came back unreadable. §4.3. */
  unreadable: boolean;
};

export const getTrackGates: (opts: { data: { trackId: string } }) => Promise<TrackGatesResult>;
```

**Implementation constraints for MAIN**, so the read cannot lie:

- Read `spine_tracks.pending_gates` for `trackId` through the caller's own client (RLS is the authorization, same as `steerTrack` at `:990-994`).
- Then `agent_approvals.select("id,tool_name,agent_slug,rationale,status,created_at,expires_at,expiry_default,snoozed_until").in("id", ids).eq("user_id", userId)`. `.in()` on the remembered ids only — this is the same read `harvestAnsweredGates` does at `driver.server.ts:261-267`.
- A gate id with no row comes back in `settled` with `status` unresolvable — do **not** drop it silently. `harvestGates` (`attach.ts:443`) drops unknown rows on the write side; the read side must still say the id existed.
- On a read error return `unreadable: true` with empty lists. **Fail loud, never fail empty**: an empty card on a held run tells a person nothing needs them, which is the exact lie that killed the last three months.
- `classPendingElsewhere`: one `count` query, `tool_name = X AND status = 'pending' AND workspace_id = <track workspace> AND user_id = <caller> AND id <> this id`. If the track has no `workspace_id`, return `0` and let the card hide the class control entirely — an unscoped class answer is the widening §3.4 forbids.

### 1.4 Client wiring (LANE 0)

```ts
const gates = useQuery({
  queryKey: ["track-gates", trackId],
  queryFn: () => getTrackGates({ data: { trackId } }),
  refetchInterval: 10_000,
});
```

`10_000` matches `TrackActivity`'s cadence exactly (`src/components/spine/TrackActivity.tsx:91`) so the transcript and the question can never be one poll apart. **There is no SSE stream.** `GOAL-lane-0.md` §5 L0-B names `GET /api/tracks/:id/stream`; I checked `src/routes/api/` — it holds `chat.ts`, `mcp.ts`, `plan-gate.ts`, `public/`, `stripe/` and nothing track-shaped. Poll, and say so in your unit file.

`TrackRun` already invalidates two keys on a successful drive (`TrackRun.tsx:79-82`). Add `["track-gates", trackId]` to that list — a drive that opens a gate must make the question appear in the same tick the drive result does.

---

## 2. The card's content

### 2.1 Where it sits

Inside `TrackRun` (`src/components/track/TrackRun.tsx:87-129`), **above** `TrackChain` and `TrackActivity`, and above the "Run it now" `Region` at `:89-125`. Reason: the reference puts the question in the transcript's flow at the point the agent stopped (`design-reference/mobbin-2026-08/cofounder-inline-question.webp` — `Ran 3 actions` → `Running Tool: Ask User Question` → `Waited for the user's answer` → the card). The run control below it is the thing you press *after* answering, so question-then-control is the right vertical order and it matches the Gate ruling at `src/components/meridian/Gate.tsx:8-17`: **anything that argues for the answer sits between the question and the buttons, and nowhere else.**

Render nothing at all when `open.length === 0 && settled.length === 0 && !unreadable`. A card that says "no questions" is a panel on the briefing dashboard `DESIGN-DIRECTION.md` §5 rejects.

### 2.2 Every sentence, and where it comes from

**Rule: no sentence in this component is a string literal describing a tool.** All of it derives from `src/lib/tool-consequences.ts` and `src/lib/ai/approval-expiry.ts`, both client-safe (`tool-consequences.ts:9`, `approval-expiry.ts:68-73`).

| Slot on the card | Exact source | Fallback when the tool is uncatalogued |
| --- | --- | --- |
| **The question** (largest type on the card) | `gateHeadline(gate.toolName)` — `tool-consequences.ts:753-756` | `gateHeadline` already returns `"Nothing here says what this call changes."` Use it. Do not substitute. |
| **Counter** `n/N` | `open.indexOf(gate)+1` / `open.length` | — |
| **Who asked** | `agentDisplayName(gate.agentSlug)` — `src/lib/agent-vocabulary.ts:805`. If null, `castByStation(gate.station)[0]?.name` (`:860`), the same fallback `approvalAgentSlug` uses at `approvals-queue.functions.ts:73-77` | `"An agent on this run"` — this one literal is permitted because it describes our own record's absence, not a tool |
| **Which step asked** | `AGENT_STATIONS[gate.station].name` — `agent-vocabulary.ts:113` | — |
| **When** | `stoppedFor(gate.askedAtMs, now)` and `isOverdue(...)` — `src/components/approvals/stopped-for.ts:28,48`, already in LANE 0's own tree | `askedAtMs` is `created_at`, never null in practice; if it ever is, print the `null` branch CallGate uses at `CallGate.tsx:114-118` |
| **Why it asked** | `gate.rationale`, verbatim, unedited | omit the line entirely. Never write a rationale on the agent's behalf |
| **Can it be undone** | `` `${REVERSIBILITY_LABEL[c.reversible]} · ${c.undo}` `` where `c = toolConsequence(gate.toolName)` — `:758-762`, `:570`. This is the exact line `approvals-queue.functions.ts:516` already builds | `DEFAULT` returns `"Partly reversible · Effect not catalogued. Review the arguments before approving."` — correct and honest. Use it |
| **What decides the risk** | `assessTool(gate.toolName).drivenBy` — `:1521-1552`, one phrase from `DIMENSION_LABEL` (`:1499-1505`), e.g. *"data leaves the workspace"* | `UNKNOWN_PROFILE` (`:1476-1481`) yields worst case. Correct by design |
| **If you do nothing** | `expiryNote(gate.toolName, declared, isoExpiresAt)` — `approval-expiry.ts:163-178`, where `declared = gate.expiryDefault ?? expiryDefaultFor(gate.toolName)` (`:84`) | `expiryDefaultFor` fails closed to `"cancel"` for uncatalogued tools (`:35-44`) |
| **What declining does** | `` `Nothing runs. ${expiryReason(gate.toolName)} is what put this call in front of you.` `` — `expiryReason` at `:124-135` returns a clause like *"it cannot be undone"* | as above |

`expiryNote` needs an ISO string, not epoch — pass the raw `expires_at` through. **MAIN: add `expiresAtIso: string | null` to `TrackGate` alongside `expiresAtMs`, or LANE 0 must reconstruct it and a reconstructed timestamp is a fabricated one.**

### 2.3 A snoozed gate is still a held run

`snoozed_until` (`20260707190000:58-61`) hides a row from the needs-you queue. It does **not** release the track: `decideDrive` refuses on `pendingApprovals > 0` (`src/lib/spine/driver.ts:620`) and `harvestGates` keeps a `pending` row in `stillPending` (`attach.ts:446-449`) regardless of snooze. So inside the run a snoozed gate renders **in `open`, at full weight**, with one extra line: *"You set this aside until \<time\>. The run is still stopped."* Hiding it here would reproduce the original defect one layer down.

### 2.4 The tool name never appears on screen

Ruled, not a preference — `tool-consequences.ts:747-751`:

> *"NO TOOL NAME IN THIS STRING, and that is a ruling, not a taste… An internal identifier is not the thing a person is being asked to judge."*

`toolName` exists on `TrackGate` to key the catalogue and to define the class in §3.3. It may go in a `title=` attribute for a developer; it may not be rendered text. `bun test` guards this class of defect via `UNCATALOGUED_EFFECT` (`:568`) — a surface may assert *"this string must not be showing"*.

---

## 3. The controls

The reference (`cofounder-inline-question.webp`) shows, bottom of card, left to right: **`Decide all`** and **`Decide this one`** as equal-weight outline buttons, then **`Submit`** filled and dead until something is picked. Above them, a hairline and a free-text field reading `Something else`. Above that, two named options each with a one-line explanation, the first carrying a `Recommended` chip. Top-left, a `1/1` counter; top-right, a dismiss.

Our mapping, with three deliberate departures each argued below.

### 3.1 The options are two, not N, and they are verdicts

`agent_approvals` supports exactly one axis: `resolveApproval` takes `decision: "approved" | "rejected"` (`src/lib/governance.functions.ts:449-455`). There is no multi-option question type in the schema. So:

| Option | What it does | Rendered as |
| --- | --- | --- |
| **Let it run** | `verdict: "approve"` on this id | option row 1 |
| **Don't run it** | `verdict: "reject"` on this id | option row 2 |
| **Something else** | free text → **decline + steer** (§3.5) | the escape field |

Draw the option rows exactly as `PlanGate` draws its three answers (`src/components/meridian/PlanGate.tsx:349-394`): borderless, `rounded-mrd-ctl px-mrd-4 py-mrd-3`, hover wash `bg-mrd-hover`, inset focus ring on `--mrd-focus`, a mono digit at `text-mrd-faint` as the accelerator, label at `text-mrd-small font-medium text-mrd-ink`, consequence beneath at `text-mrd-data leading-mrd-prose text-mrd-mute` capped `max-w-[62ch]`. Copy that structure; do not import `PlanGate` (it is an autonomy gate, wrong subject) and do not edit it (it is MAIN's).

Each option's consequence sentence comes from §2.2, never from a literal:
- *Let it run* → `toolConsequence(tool).effect` (the same sentence as the question — so instead render `` `${REVERSIBILITY_LABEL[c.reversible]}. ${c.undo}` ``).
- *Don't run it* → the "What declining does" row from §2.2.

### 3.2 Departure 1 — there is no `Recommended` chip on a verdict

`PlanGate.tsx:52-58` rules this directly:

> *"a house favourite among the three would also be the product making the call it is asking the reader to make."*

And the case is stronger here than there. The agent already recommended running the call — that is *why* the gate exists. Chipping "Recommended" onto **approve** is the product cheering for its own proposal, in front of the buyer `DESIGN-DIRECTION.md` §2b names: a tech lead accountable for merging output they did not write. `approval-policy.ts:22-26` measures what that costs — 93% of in-the-moment prompts approved, which it calls approval fatigue and says outright: *"A gate that is approved 93 times in 100 is not a control, it is a keystroke."* A favourite makes that number worse.

**What replaces it, and it is strictly more useful:** a caption on whichever option matches the declared default, reading **"If you do nothing"**, plus the deadline. It is not a preference — it is `expiry_default`, declared at raise time and never recomputed (`20260822190000` COMMENT), rendered through `expiryNote` (`approval-expiry.ts:163-178`). It gives the reader the same cheap correct answer the reference's chip gives, out of a fact the record can defend. Draw it as a caption, not a `StatusChip` — `StatusWord` has no member for it (`src/components/meridian/StatusChip.tsx:36`) and inventing one would be spending `--mrd-you` on something that is not "a person is required".

**REQ for MAIN:** if you want the literal `Recommended` chip kept, rule on it in `RULINGS.md` and say what fact backs it. I could not find one in the schema.

### 3.3 `Decide all` — answering the class

This is the control the whole item exists for. 90 `cluster.trigger` approvals raised since July, 42 cancelled, 38 expired, 10 pending, **zero ever approved**.

**The class key is `tool_name`, and nothing else.** Not `args` (the 90 differ only by workspace and time), not `agent_slug` (the same tool can be raised by more than one seat).

**Scope, and it is printed on the button, never hidden:**

```
tool_name = <this gate's tool>
AND status = 'pending'
AND workspace_id = <this track's workspace_id>
AND user_id = <caller>
```

The button label states its own reach, built from `classPendingElsewhere`:

> `Answer all 90 questions like this one in this workspace`

Never `Decide all` bare. The reference can afford a bare label because its scope is one conversation; ours crosses runs, and a widening that is stated is not a silent one.

**When approve-all is offered at all.** Only when the call's own declared default is `proceed` — i.e. `expiryDefaultFor(gate.toolName) === "proceed"`, which `approval-expiry.ts:27-33` defines as *reversible AND internal*. The argument is airtight and uses no new policy: if silence would already run each of these on its own, saying yes to all of them at once grants nothing new. `cluster.trigger` qualifies (`tool-consequences.ts:522-526` reversible; absent from `EXTERNAL_TOOLS` at `:782-806`) — so the 90 become answerable. `studio.pr.merge` does not (`:32-36` irreversible) — five merges never go out on one click.

**Decline-all is always offered**, for every tool. Declining N calls can never be worse than each of them expiring, and for the non-`proceed` set `cancel` is already the declared outcome of silence.

**The server fn MAIN must build:**

```ts
export type DecideClassResult = {
  /** Exactly what BulkDecideResult reports, passed through unchanged. */
  decided: Array<{ approvalId: string }>;
  refused: Array<{ approvalId: string; reason: string }>;
  /** Pending members of the class the server did NOT attempt this call (cap, §3.4). */
  remaining: number;
  /** True when the caller asked to approve a class whose declared default is 'cancel'. */
  refusedAsUnsafeClass: boolean;
};

export const decideTrackGateClass: (opts: {
  data: {
    trackId: string;
    toolName: string;
    verdict: "approve" | "reject";
    /** Required on reject. See §5. */
    reason?: string;
  };
}) => Promise<DecideClassResult>;
```

It **must** route every item through the existing single-item path, not a new write. `decideOneApprovalItem` (`approvals-queue.functions.ts:1212-1243`) is already extracted for exactly this reason, and `:1205-1210` says why: *"a bulk endpoint that re-implemented any part of this would be a parallel decision path that drifts."* Reuse `decideApprovalItems` (`:1316`) or call `decideOneApprovalItem` in the same order it does.

### 3.4 What `Decide all` must NOT do — eight prohibitions

1. **It must not write a standing policy.** No `agent_tool_modes` row, no `setCrewToolMode` (`src/lib/crew.functions.ts:505-557`), no mode flip to `auto`. Answering ninety open questions and changing the rule forever are two different acts and the second was never asked for. `approvals-queue.functions.ts:1309-1314` already draws this line for the bulk queue door and says the standing offer *"is separate work and is still owed."* It is still owed. Do not smuggle it in here.
2. **It must not cross `tool_name`.**
3. **It must not cross `workspace_id`.** If the track has no workspace, hide the control (§1.3).
4. **It must not touch a row that is not `status = 'pending'`.** An `approved`-but-unexecuted row is mid-flight (`execution_claimed_at`, `20260814120000`); re-deciding it is the double-merge that migration exists to stop.
5. **It must not act on a set larger than the one it counted.** Count and act in one server call, from one snapshot. The card never sends a client-side list of ids it assembled ten seconds ago.
6. **It must not offer approve-all where `expiryDefaultFor(tool) !== "proceed"`.** Server-enforced, not just hidden in the UI — return `refusedAsUnsafeClass: true`.
7. **It must not exceed `MAX_BULK_DECISIONS` in one request.** That is 50 (`approvals-queue.functions.ts:1265`), and **the live class is 90**. So one press cannot finish it. The card decides in sequential batches, prints running progress from the server's own numbers, and the button re-renders with the true remainder. It must never print "90 answered" when `decided.length` is 50. `:1259-1264` explains why the cap stands; do not raise it to make one button look tidier.
8. **It must not report its own optimism.** Every count on screen after the press comes from `DecideClassResult`, never from what was sent.

### 3.5 The free-text escape — `Something else`

The reference's escape feeds the agent. Ours has one shipped channel that reaches a running agent: `steerTrack` (`src/lib/spine/track.functions.ts:1009-1058`), which inserts into `agent_messages` with `track_id`, `kind: "steer"`, `payload: { message }`, and the loop appends it as operator guidance under a `user` turn (`:1001-1007`), sliced at 2000 chars (`:996-999`).

So the escape is **decline + steer, as one act**, which is precisely the answer `PlanGate.tsx:47-50` says is the one worth copying most exactly:

> *"Its third answer is the one worth copying most exactly, 'No, and tell Claude what to do differently': refusing and redirecting are the same act, so they are one answer rather than a rejection followed by a separate instruction."*

Draw the field with `ReasonField` (`src/components/meridian/forms.tsx:449-476`) — it already owns Enter-to-commit, Escape-to-cancel, and a commit that is dead until the text is non-empty, and its header at `:417-427` records that a fourth hand-rolled copy is the failure mode. Props:

```
id="track-gate-<approvalId>-else"
label="What should it do instead?"
hint="It goes to the agent working this run and stays on the record beside this call."
placeholder="Group only the last two weeks, and leave the archived signals out"
commitLabel="Don't run it, do this instead"
cancelLabel="Back to the answers"
```

**Do not offer free text alongside approve.** Approving executes the tool with the agent's own `args`, unchanged (`executeApproval`, reached at `governance.functions.ts:712`). A note attached to an approval changes nothing about what runs, and a field that looks like it steers and does not is worse than no field.

### 3.6 Submit, and the dismiss

- **`Submit`** in the reference exists because its options are inert until confirmed. Ours are not: two verdicts and an escape are three commit controls, and adding a fourth press between the choice and the effect is the speed bump `PlanGate.tsx:343-348` refuses. **Drop `Submit`.** Each option row commits.
- **The dismiss (`×`)** must not exist. There is nothing to dismiss to — the run is stopped until this is answered (`driver.ts:620`), and a close button that leaves the work frozen is the `/approvals` queue again, one inch smaller. If a person wants to defer, the honest control is **Snooze**, which is real (`snoozeApprovalItem`, `approvals-queue.functions.ts:1469`) and which §2.3 already says still shows the gate.

### 3.7 Which control wears `Approve`

`Approve` (`src/components/meridian/surface-parts.tsx:626-659`) is the only orchid control in the product and its header at `:608-617` binds it to one meaning: *the work is stopped until it is pressed*. That is literally true here. So:

- The **"Let it run"** option row is the one that unblocks → it may use `Approve`, or the borderless PlanGate face with the accent reserved for the standing "Waiting on you" marker. **Pick one accent, not two.** `CallGate.tsx:35-46` allows exactly two on that surface (the marker and the releasing control); if you draw options borderless in the PlanGate style, spend the accent on the marker only and let the rows carry no colour, which is what `PlanGate.tsx:52-58` concluded for the same reason.
- **`Decide all` / decline / snooze** are `Action` (`surface-parts.tsx:548`), `variant="default"` for the two decisions and `variant="quiet"` for snooze, laid out with `Actions` (`:674-689`).
- Every one of them passes `busy={mutation.isPending}`, not just `disabled` — `:559-575` records that 196 call sites announced "unavailable" for the whole round trip of a mutation and that this is the control that spends longest saying nothing.

---

## 4. What happens after answering

### 4.1 Immediately, on screen

1. The answered option row goes `busy`. Nothing is removed yet.
2. On the mutation resolving, the gate moves from `open` to `settled` and renders its outcome sentence from what the server returned — **not from what was clicked**. §4.3.
3. If `open` is now empty, the card's header line changes from *"Waiting on you"* to *"Answered. Picking the work back up."* and §4.2 fires.

### 4.2 What makes the run resume — and a card that skips this has failed the item

The chain, all of it already shipped:

1. `resolveApproval` (`governance.functions.ts:668-716`) takes the decision as a **claim** (`claimApprovalDecision`, `:686`), writes `decision_reason` when given one (`:695-705`), and on approve calls `executeApproval` (`:712`) which runs the tool and stamps the row `executed` or `failed`.
2. The track is **still** `last_hold = 'waiting-on-a-person'` (`driver.server.ts:1420-1427`). **Nothing releases it automatically** except the cron `src/routes/api/public/hooks/track-tick.ts`, which serves ≤5 tracks under one shared 45s deadline. That is the hours-long invisibility `GOAL-lane-0.md` §2 measures.
3. The release is `driveTrackNow` (`track.functions.ts:1139`), **already mounted in `TrackRun` at `:93-95`**. Its first act inside `driveTrackOnce` is `harvestAnsweredGates` (`driver.server.ts:1020` → `:253-292`), which reads the approval rows back, files what they produced into `spine_track_members`, and shrinks `pending_gates` to what is genuinely still open.
4. That count goes straight into `decideDrive` as `pendingApprovals: gates.stillOpen` (`driver.server.ts:1060`), and `driver.ts:620` stops refusing.

**So: on a successful decide, the card must invalidate `["track-gates", trackId]`, `["track-activity", trackId]` and `["spine-track-chain", trackId]`, and then call the same `driveTrackNow` mutation `TrackRun` already holds.** Sequentially — after the decide resolves, never in parallel with it, or the harvest reads the row before `executeApproval` has stamped it and the run stays held for another poll.

Lift that mutation into `TrackRun` and pass it down, or expose a `onAnswered` callback the parent wires to `run.mutate()`. Either is fine; **not doing it is not fine.** A card that answers the question and leaves the run frozen is the /approvals queue with better typography, and it is the exact failure this item exists to end.

### 4.3 Three post-answer states, said honestly

`harvestGates` (`attach.ts:439-460`) treats them differently and so must the card:

| Approval `status` after the answer | What the run does | What the card says |
| --- | --- | --- |
| `executed` | dropped from `pending_gates`, artifact filed, run resumes | *"It ran."* plus the filed artifact count from `DriveNowResult.steps[].produced` (`track.functions.ts:1112`) |
| `failed` | dropped, **no artifact**, run resumes | *"It ran and did not finish."* plus `agent_approvals.error`. Never report a produced artifact |
| `approved`, not yet `executed` | **kept in `stillPending`** (`attach.ts:446-449`) → **run stays held** | *"Answered. The call is still running."* — and do **not** call `driveTrackNow` yet; it will hold again and burn a seat |
| `rejected` / `expired` / `cancelled` | dropped (`attach.ts:450`), run resumes and **the station re-dispatches** | *"It will not run."* — and read §5.4, because it may ask again |

Because `resolveApproval` awaits `executeApproval` inline, the third row should be rare from this card's own press. It is reachable when someone answers the same call in another tab, so handle it. **UNVERIFIED:** whether any path in the spine driver leaves a row at `approved` for longer than one request.

---

## 5. The refusal path — declining must record a reason

### 5.1 Where a reason can go today

Three destinations exist, and **no single shipped call writes all three**:

| Destination | Written by | Column |
| --- | --- | --- |
| The approval row itself | `resolveApproval` when passed `reason` (`governance.functions.ts:449-455`, `:695-705`) | `agent_approvals.decision_reason`, trimmed to 2000 |
| The flywheel | `recordGateSignalCore` (`src/lib/gate-signals.functions.ts:19-31`) | `human_gate_events` — `gate_type: "rejection"`, `subject_type: "tool_call"`, `subject_ref`, `agent_slug`, `tool_name`, `verdict`, `diff_summary` |
| The running agent | `steerTrack` (`track.functions.ts:1044-1050`) | `agent_messages` — `track_id`, `kind: "steer"`, `payload.message` |

### 5.2 The gap MAIN must close, stated precisely

**`decideApprovalItem` cannot carry a reason.** `DecideSchema` is `{ id, kind, verdict }` (`approvals-queue.functions.ts:1182-1197`) — no `reason` field, and `routeDecision`'s `tool_call` branch (`:1360-1368`) calls `resolveApproval` without one. So today:

- `decideApprovalItem` → writes the gate signal, **loses the reason**.
- `resolveApproval` direct → writes the reason, **writes no gate signal**.
- `sendBackApprovalItem` (`:1574`) → writes both plus `approval_feedback`, but **refuses `tool_call`**: `REVISABLE_KINDS = ["spec", "design_gate"]` (`:1510`) and `:1578-1580` throws *"This kind can't be sent back."*

**Required MAIN server fn**, one call, so the card cannot half-write:

```ts
export const decideTrackGate: (opts: {
  data: {
    trackId: string;
    approvalId: string;
    verdict: "approve" | "reject";
    /** REQUIRED when verdict is "reject". Max 2000 — the ceiling both sinks share. */
    reason?: string;
    /** When true and verdict is "reject", also steer the track with `reason`. */
    steer?: boolean;
  };
}) => Promise<{
  ok: boolean;
  /** Status the approval row actually holds afterwards. Drives §4.3. */
  status: string;
  /** True when someone else had already answered it (claimApprovalDecision lost the race). */
  alreadyDecided: boolean;
  reasonRecorded: boolean;
  signalRecorded: boolean;
  steered: boolean;
  problems: string[];
}> ;
```

Order, and it is not arbitrary:

1. Verify `approvalId` is in this track's `pending_gates`. **A decide call that names an approval this track does not own must be refused** — otherwise the card becomes an unscoped write door onto every approval the user holds.
2. `resolveApproval({ approvalId, decision, reason })` — the reason lands before anything else moves, on the same *provenance-first* reasoning as `decideOneApprovalItem:1217-1220`.
3. `recordGateSignalCore(..., { gateType: "rejection", subjectType: "tool_call", subjectRef: approvalId, agentSlug, toolName, verdict: "rejected", diffSummary: reason, workspaceId })` — best-effort, never throws (`gate-signals.functions.ts:24-30`), so telemetry cannot break the gate it observes.
4. If `steer`, `steerTrack({ trackId, message: reason })`.
5. Report every one of the four independently. **A partial write must be reported as partial**, the way `sendBackApprovalItem:1616-1626` reports its own two-write residue.

**Refuse a reject with an empty reason, server-side.** `SendBackSchema` sets the precedent at `:1530-1531`: *"Required: a note-less send-back is a decline."* Here the whole item is that declining records a reason, so the server is the floor, not the form.

### 5.3 What the card does

Declining opens `ReasonField` inline (§3.5). One press, one server call, `steer: true`. The card then prints exactly what landed — *"Recorded, and the agent has been told"* only when `reasonRecorded && steered` are both true. If `steered` is false, say so: *"Recorded on this call. The agent has not been told."*

### 5.4 The re-ask loop, which is real and must be named in the unit file

Hitting a gate deliberately does not count as an attempt (`driver.server.ts:1404-1419`). After a decline the gate is dropped (`attach.ts:450`), the hold clears, and **the same station dispatches again** — and may raise the identical call.

The only place the reason is handed back to an agent is `loop.server.ts:2215`, which appends `Tool "X" was NOT executed (approval rejected)` and **does not include `decision_reason`**. **UNVERIFIED:** whether the spine driver's per-station dispatch reaches that line at all (it opens fresh `runAgentLoop` calls rather than resuming a `waiting_approval` run). Either way, nothing in the spine path carries the decline reason forward.

`steerTrack` is therefore the only shipped channel that does, which is why `steer: true` is the default on decline and not an extra. **REQ for MAIN:** consider adding `decision_reason` to the `loop.server.ts:2215` message. That is `src/lib/**` and out of both lanes' reach.

---

## 6. Copy rules

**The test is what the click does, not what the word sounds like.** From `CLAUDE.md`: *"keep it where a click UNBLOCKS something, use review where it only SHOWS you something."*

| String | Where | Why |
| --- | --- | --- |
| **"Approve"** | Permitted on the option that runs the call, and on nothing else on this card | The run is stopped until it is pressed (`surface-parts.tsx:608-617`) |
| **"Let it run"** | Preferred over "Approve" for the option row | Names the effect. `PlanGate.tsx:110-118` — a category is not a decision, a nameable act is |
| **"Review"** | **Banned on every control here.** Nothing on this card only shows | |
| **"Decide all …"** | Must carry its scope and its count | §3.3 |
| **"Waiting on you"** | The standing marker, once, at the top | `Gate.tsx:73-76`, `CallGate.tsx:91-93` |
| *receipts · ledger · company brain · decision layer · unattended · first run · provenance* | **Banned everywhere** | `CLAUDE.md` positioning canon |
| *remembers · stores · logs*, as verbs of the brain | **Banned everywhere** | same |
| *audit trail · shared brain* | Permitted | same |
| Any present-tense claim of accumulated learning | **Banned** | same |
| Station names (`sense`, `decide`, …) | Permitted **only** as the step that asked, inside the run | The ruling: stations are a progress display, never a menu or a customer-facing noun |
| "the crew", "bet", "the call" as a noun | Avoid | `REIMAGINING.md` §7 records these still leaking through the product after the 5.9M-word audit |
| Any tool name | **Banned in rendered text** | `tool-consequences.ts:747-751` |
| `"Runs the tool with the agent's arguments."` | **Must never render** | `DEFAULT.effect`; `gateHeadline` exists to keep it off screen (`:711-756`) |

No dramatic phrasing. The test is whether the founder would say the sentence out loud in a meeting.

---

## 7. Meridian: no gap, and this is deliberate

I checked every element against `src/components/meridian/`. **Nothing here requires a new primitive or a new `--mrd-*` token.** Do not file a gap request for this item.

| Element | Covered by |
| --- | --- |
| Card ground, question, recessed evidence, age line | `src/components/approvals/CallGate.tsx:56-162` — **in LANE 0's own tree.** Compose or fork it; do not rebuild it |
| Option rows with per-option consequence | `PlanGate.tsx:349-394`'s exact class string. Copy the structure into `src/components/track/` — `rounded-mrd-ctl`, `bg-mrd-hover`, `--mrd-focus`, `text-mrd-small`, `text-mrd-data`, `text-mrd-mute`, `text-mrd-ink` are all live |
| Free-text escape | `forms.tsx:449` `ReasonField` |
| Controls | `surface-parts.tsx:548` `Action`, `:626` `Approve`, `:674` `Actions` |
| "Waiting on you" marker | `bg-mrd-you` / `text-mrd-you`, as `CallGate.tsx:91-93` |
| "If you do nothing" caption | plain text at `text-mrd-nano tracking-mrd-label text-mrd-mute` on `bg-mrd-sink`. **Not** `StatusChip` — `StatusWord` (`StatusChip.tsx:36`) has no member for it and adding one would spend `--mrd-you`'s meaning |
| The clock | `stopped-for.ts:28,48`, LANE 0's own file. `use-elapsed.ts:39` is for a live-ticking active step, not for a wait |
| Motion | `--mrd-d-press` via `style={{ transitionDuration: "var(--mrd-d-press)" }}`, as `PlanGate.tsx:376`. A raw duration is a bug |

---

## 8. Acceptance — how to prove it, not assert it

BUILD-QUEUE L0-1 lists four; these are those, made checkable.

1. **A track holding `waiting-on-a-person` shows the ask on `/track/:id` without navigating away.** Playwright: navigate, **wait for the question text**, then screenshot. Do not measure straight after `navigate` — you will read the loading state.
2. **The consequence sentence comes from `tool-consequences.ts`, never a literal.** Two assertions: (a) a text assertion that the rendered question equals `gateHeadline(tool)` for a known tool; (b) a source assertion that `TrackConsent.tsx` contains no string matching `/^(Opens|Merges|Creates|Runs|Regroups|Appends|Writes|Hands) /` — every one of those openers belongs to `CONSEQUENCES` and any copy of one is a fork.
3. **Declining records a reason.** Assert the decline path is unreachable with an empty field (the commit is dead — `forms.tsx:478-482`), and that the mutation payload carries `reason`. **You have no database**, so assert on the call, name it as unverified end-to-end in your unit file, and file a request for MAIN to run:
   ```sql
   select id, tool_name, status, decision_reason, decided_at
     from agent_approvals where id = '<the id you declined>';
   select gate_type, verdict, diff_summary from human_gate_events
    where subject_ref = '<same id>';
   ```
4. **A mount is not a render.** `<TrackConsent />` in the tree proves nothing. Screenshot, or assert on real text.
5. **Answering resumes the run.** Assert that a successful decide invalidates the three query keys **and** fires the `driveTrackNow` mutation. This is the one criterion most likely to be skipped and it is the point of the item.
6. **The class control states its own scope.** Assert the button's accessible name contains both the number and the word "workspace".

Gates before push: `bunx tsc --noEmit`, `bun test`, `bun run lint`, each run alone. **Never pipe a gate into `tail`.** 12 test failures are pre-existing; do not claim them and do not fix them silently.

---

## 9. Open questions for MAIN

1. **`Recommended`.** I replaced it with the declared expiry default (§3.2), against `PlanGate.tsx:52-58`. If the reference's chip is wanted literally, rule on what fact backs it.
2. **`MAX_BULK_DECISIONS` = 50 against a live class of 90.** I specified batching (§3.4 #7). Confirm, or rule that the cap moves and say what bounds the request instead.
3. **Class scope crosses runs.** I scoped to workspace and made the reach visible in the label. Confirm this is the widening you intended.
4. **`decision_reason` never reaches the agent** (§5.4). `loop.server.ts:2215` is `src/lib/**` and neither lane can touch it.
5. **`expiresAtIso`** must be added to `TrackGate` or `expiryNote` cannot be called honestly (§2.2).

---

## 10. UNVERIFIED

- The production counts (59 tracks / 90 approvals / 84 routes / 14 forecasts) are MAIN's measurements, taken as given. I ran no SQL.
- Whether the spine driver's next dispatch after a decline ever reaches `loop.server.ts:2215`.
- Whether an approval can persist at `approved`-not-`executed` long enough to be seen from this card in practice (§4.3 row 3).
- `GOAL-lane-0.md` §5 L0-B names `GET /api/tracks/:id/stream`. It does not exist under `src/routes/api/`. The spec assumes polling throughout.
- I did not open the rendered card in a browser; the layout claims in §3.1 come from `PlanGate.tsx` and `CallGate.tsx` source, and from `design-reference/mobbin-2026-08/cofounder-inline-question.webp`, which I did open.