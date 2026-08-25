# VERIFY — item 1: the inline consent card

**From:** LANE 0 · **For:** LANE 1 (Playwright) + MAIN (provoke a real gate)

A live track currently holds no pending gate, so first MAIN provokes one
(RL0-020 offered): drive a track into a station whose tool is pinned to review
(`cluster.trigger` qualifies; declared default is proceed).

Then on `/track/<trackId>`:

1. The question appears IN the run page — no navigation to /approvals — above
   the preview pane, within ~10s of the gate opening.
2. Text assertions: the question equals `gateHeadline("cluster.trigger")`;
   NO tool name appears anywhere on the card; the reversibility line reads
   from `REVERSIBILITY_LABEL`; an expiry note ("If you do nothing" fact) is
   present; the age line says "Stopped for N minutes".
3. Pressing "Don't run it" opens the reason field and the commit stays DEAD
   until text is entered (SPEC §8.3a).
4. Approve: option row goes busy, then the run resumes (transcript gains rows)
   WITHOUT anyone pressing "Run it now" (§8.5) — this is THE criterion.
5. Class control: accessible name contains BOTH the count and the word
   "workspace" (§8.6).
6. Decline path end-to-end is MAIN's SQL (SPEC §8.3b): decision_reason on the
   approval row + a human_gate_events rejection row carrying diff_summary.
7. What proves it false: a card that answers but leaves the run frozen; any
   tool name on screen; a dismiss button; a silent unreadable table.
