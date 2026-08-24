# REQ-L0-018: Decide route-side lifts

**From:** LANE 0
**Filed:** 2026-08-24T23:20+05:30

From the Decide census (engine half shipped in L0-032):

1. **Bulk approve mount.** decideApprovalItems (approvals-queue.functions.ts:1316)
   is built, tested, mounted nowhere. The governance doctrine's "you approved
   14 of these without changes - let Engineer do it alone?" policy offer has
   never had a surface.
2. **Decided history.** "What did I approve yesterday" has no answer: the
   settled trail is session state by design; no decided-history view exists
   for nine of the ten families.
3. **Snooze list.** Snoozes are a black hole - no surface lists or cancels
   approval_snoozes.
4. **Sent-back notes.** approval_feedback rows render only as an aggregate
   rework count; the person cannot see their own note later.
5. **ForecastDesk cross-link.** Due forecasts render as a muted chip on
   ledger rows with no urgency and no door to the grading desk on Learn.
