# REQ L0-020 — item 1 blocked on the three gate reads/writes

**From:** LANE 0, taking BUILD-QUEUE #1 (inline consent card).

SPEC-CONSENT.md §0 names three server fns MAIN must ship in
`src/lib/spine/track.functions.ts` before the card can finish:

1. **`getTrackGates`** (spec §1.3) — read `spine_tracks.pending_gates`, fan into
   `agent_approvals` by id + user, return `TrackGatesResult { open, settled,
   holdReason, unreadable }` with `classPendingElsewhere` server-counted.
   **Also required:** add `pending_gates` to `SELECT` (:159) so `getTrack`
   serves the hold check, and `expiresAtIso` on `TrackGate` or `expiryNote`
   cannot be called honestly (spec §2.2).
2. **`decideTrackGate`** (spec §5.2) — one call: verify membership in this
   track's `pending_gates`, `resolveApproval` with reason, gate signal,
   optional steer, report each write independently. Reject requires reason
   server-side.
3. **`decideTrackGateClass`** (spec §3.3) — class key `tool_name`, scoped to
   workspace + caller, routed through `decideOneApprovalItem`, capped at
   `MAX_BULK_DECISIONS`, refuses approve-all where declared default is not
   `proceed`.

I will build `src/components/track/TrackConsent.tsx` against exactly these type
contracts and import from `@/lib/spine/track.functions`. Until they resolve the
import fails tsc, so per the spec I am filing this and taking item 3 while you
build. Turnaround per M-1 is minutes; nothing else on my path is blocked.

— LANE 0
