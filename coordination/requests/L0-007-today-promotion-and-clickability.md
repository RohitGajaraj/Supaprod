# REQ-L0-006: Today needs promotion/demotion and clickability - the founder's own lens, audited with file:line

**Kind:** request to LANE 1 (today/** moved to you by R009; nothing of mine is in flight there)
**Blocking:** no
**Raised:** 2026-08-24T03:45+05:30

## Why this reaches you

The founder reviewed Today directly: "it is like stuff... what information
are you giving if something needs to be demoted or promoted? The status
messages are being displayed - is it clickable?" I catalogued the surface
read-only (7 files, 1,066 lines, mount order, clickable-vs-passive audit)
so these arrive as evidence rather than taste. R009 gave the directory to
you; these are his requirements carried intact.

## The audit finding that outranks the rest

**The most decision-relevant sentence on the page does nothing on click,
while the most ambient row type navigates deepest.** The stateSentence
headline ("3 decisions are ready for your review. 1 run is stuck.") is
plain PageHeading text with computed, ranked, dead counts. Meanwhile a
finished run's row navigates to /runs/$missionId.

## Five requests, highest leverage first

1. **Make the headline clickable per clause**: "3 decisions are ready..."
   focuses the open call; "1 run is stuck." opens the stuck run.
2. **Promote contradicting evidence above the fold**: PushedInsights items
   of kind ground_shift / bet_contradiction / assumption_miss challenge
   standing calls, but render BELOW both lanes and below QuietMorning -
   invalidating evidence ranked under finished-run scan bands. Either fold
   a count into stateSentence ("...and 1 standing call was contradicted.")
   or move the block above the crew lane.
3. **Resolve the Ready/Ready collision**: lane heading "Ready for your
   review" (gates) sits directly above inbox group "Ready for you to look
   at" (finished runs). Near-identical words, different populations, two
   inches apart.
4. **Whole-card affordance on PushedInsights cards**: clicking an insight's
   headline is inert prose beside one button; AgentInbox rows already do
   row-level onClick to their destination.
5. **One quiet Door to /approvals**: walking mode covers settling, but
   nothing tells a reader the fuller approvals station exists (e.g. when
   send-back is unavailable for a gate kind).

## Verified non-findings (do not spend time)

No dead files - all seven components mounted, every export consumed, push
data produced by derive-tick. DecisionQueue-vs-/approvals is deliberate
embed-by-design (documented at DecisionQueue.tsx:27-34), not duplication.

## Two micro-items if you are in there anyway

QuietMorning.tsx:15 says "four zero lanes above this" - there are two
lanes since the 2026-08-22 merge. RunState's queued entries cannot render
(Today excludes queued/dispatched deliberately) - leave, it is shared
vocabulary.
