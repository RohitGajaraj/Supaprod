REQ-008: four orphan backends measured; one to delete, two parked with conditions

Background: units 019's queue named getLoopPulse, getRecentExecutedUnattended,
getTodayLanes and getBriefing as complete typed backends with zero consumers.
Two read-only scouts then measured all four against what actually ships. The
verdicts kill the wire-the-orphans queue as written, which is the point of
measuring before building. Every claim below carries file:line in the scout
evidence quoted into units/020.

1. getTodayLanes (today-lanes.functions.ts): REFUSE wholesale, do not wire.
   It resolves workspace via an internal default-workspace RPC (:535) while
   Today scopes client-side by active workspace, so multi-workspace users
   would read another tenant's morning. Lane 1 carries the day-window push
   filter that the-push-lane-cannot-go-blank.test.ts:40-43 exists to ban
   after a measured incident. Lane 3's calibration-misses read has no
   workspace_id filter (:456-464). Cost doubles (~11 queries vs ~5). The
   long-tail audit already called it worse than the Today that shipped.
   Salvage atoms worth re-deriving properly, NOT importing: lane 3's idea
   (a watch/risk read is net-new capability on Today, deduped against the
   assumption-challenge gate items approvals already renders) and lane 2's
   actor attribution column for the existing crew pipeline.

2. getLoopPulse (today.functions.ts:827): DELETE. It was wired once as the
   hero line on old Today and removed in the recompose that defined Today's
   current scope; its runs count renders twice already (AgentInbox working
   group, headline); the rest is a five-number production counter across
   mixed artifact types, which today.tsx:96-102 bans by name ("a tile
   reading 0 ... a number with no taxonomy attached"). It is user-scoped,
   not workspace-scoped, so wiring it anywhere shared would reintroduce the
   two-scopes defect documented for getCompounding. Also fix the stale doc
   claim at docs/features/today.md:42 either way. Deleting shrinks dead
   code with no consumer story; nothing renders it.

3. getRecentExecutedUnattended (today.functions.ts:883): PARK, keep. The
   data is unique (no workspace-wide view of ungated side-effecting tool
   writes exists; cockpit hop flags and the gauntlet ratio cover narrower
   views) and the audit calls it the payoff exhibit of the trust arc. When
   it returns it needs its own unit: heading reinvented without the banned
   word ("ran on its own" measures 12.4/M against unattended's 0.2),
   latency_ms dropped or recessed (mechanism, not outcome), home beside the
   governance narrative rather than a sixth section on Today.

4. getBriefing/composeBriefing (briefing.functions.ts): PARK, keep, rename
   when touched. Its registered home is the Thread canvas-panel
   (surface-registry.ts:587-592, status planned); every existing /today slot
   fails doctrine on contact (headline bans paragraphs by written rule;
   QuietMorning prohibits data by self-declaration). Two preconditions for
   its future wiring: rename BriefingReceipt/receipts/MAX_RECEIPTS to clean
   vocabulary while importers remain zero (receipts is banned everywhere),
   and pick names deliberately against the separately-promised snooze-fed
   "tomorrow's brief" so two different artifacts never share one word.

Division of hands: three of the four live in src/lib/, which sits outside
every lane's declared set, so deletion, renames and any salvage re-derivation
are yours to rule on. My paths carry none of them. If you rule delete on
#2, say the word and I will take the doc-line fix in the same pass since
docs/features/ routes through my docs duties anyway.
