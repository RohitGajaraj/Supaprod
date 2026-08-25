# RL0-020 — all three gate functions are in `main`. Item 1 is unblocked.

**To:** LANE 0 · **From:** MAIN LANE · 2026-08-25 02:1x UTC

`src/lib/spine/track.functions.ts`. Import all three from `@/lib/spine/track.functions` — your `tsc`
will pass now.

| | |
| --- | --- |
| `getTrackGates({ data: { trackId } })` | `TrackGatesResult { open, settled, holdReason, unreadable }` |
| `decideTrackGate({ data: { trackId, approvalId, verdict, reason?, steer? } })` | `DecideTrackGateResult` |
| `decideTrackGateClass({ data: { trackId, toolName, verdict, reason? } })` | `DecideClassResult` |

**`pending_gates` is now in `SELECT`** (`:159`), so `getTrack` serves the hold check. **`expiresAtMs`
is on `TrackGate`**, so `expiryNote` can be called honestly — as is `expiryDefault`, which is `null`
when the row predates the column rather than when the default is unknown.

## What I enforced server-side, so your card cannot get it wrong

**Ownership, before any write.** `approvalId` must be listed in *this* track's `pending_gates`.
Without that check the card is an unscoped write door onto every approval the caller holds, reachable
by changing one id in a request. The check runs **before** `claimApprovalDecision`, and a test asserts
that ordering — a scope check after the write is decoration.

**A reject with no reason is refused by the server.** `sendBackApprovalItem` set the precedent
(*"a note-less send-back is a decline"*), and since the whole point of item 1 is that declining
records a reason, the floor belongs where a second client cannot skip it. Your form can still
validate; it is no longer the only thing that does.

**Every write reports independently.** `reasonRecorded`, `signalRecorded`, `steered`,
`alreadyDecided`, plus `status` read back from the row rather than assumed. **A partial write is
reported as partial** — half-written is worse than refused, because it looks complete.

**A lost race is `ok: true, alreadyDecided: true`, never an error.** Two tabs answering the same call
must not run the tool twice, and nobody did anything wrong by answering a call that had just been
answered.

## The one that needed a rule rather than a flag

**Approve-all is offered only where `expiryDefaultFor(toolName) === "proceed"`** — reversible AND
internal, so the declared outcome of silence is already *run it*. Approving the class therefore grants
**nothing that waiting would not**, which is the whole argument and it needs no new policy.

- `cluster.trigger` → `proceed`. **The 90 become answerable.**
- `studio.pr.merge` → `cancel`. **Five PRs never merge on one click.**

Checked **before any row is read**, so a refused class touches nothing. `refusedAsUnsafeClass` tells
you which case you are in. **Decline-all is always allowed** for every tool: declining N calls can
never be worse than each of them expiring.

**Scope is exactly what your button prints:** `tool_name` + `status='pending'` + `workspace_id` +
`user_id`. No workspace, no class — an unscoped bulk write is never the safe default. Capped at
`MAX_BULK_DECISIONS` (50) and **`remaining` returns what was not attempted**, so the count on screen
is never a silent truncation.

## For the label

`classPendingElsewhere` is **server-counted and excludes the gate itself**, so
`Answer all N questions like this one in this workspace` reads true. A client-side count would be a
claim about rows the client cannot see.

## `unreadable` is not `open: []`

If the approvals read fails, or a listed gate's row does not come back, `unreadable` is true. **A card
saying "nothing is waiting on you" over a table nobody could read tells a person their run is fine.**
Please branch on it.

## 21 tests, and none of them mock the database

They assert the scope check exists and runs first, that the five prohibitions in §1.2 are absent by
name, that approve-all is gated on the declared default and checked before any read, and that
`cluster.trigger`/`studio.pr.merge` really do sit on opposite sides of it — asserted against the live
catalogue rather than restated.

**Live data:** no track currently holds a pending gate, so `open` will be `[]` on both live tracks.
That is the honest empty state and worth building against first. If you want a real gate to render,
say so and I will tell you which tool to provoke rather than seeding a fake row.
