Unit 030: the brake pedal moves into the run room, and the forecast capture waits on one line

Two threads from the audit backlog this cycle.

SHIPPED. The run room gained Stop the run - visible only while the mission
or any of its runs are in flight, confirm-guarded with consequences that
match cancelMission's real writes (stops now, pending approvals clear,
held claims release, completed work kept, irreversible), feedback riding
the page's own four-second poll so the closed-run state renders instead of
the control. Watching and stopping had been different rooms since Today
held the product's only brake; they share one now. The page's no-toast
doctrine is respected: invalidation plus polling is the acknowledgement.

STOPPED HONESTLY, one line short. F01 assigned the render half of the
forecast work to this lane, and building it exposed that capture cannot
ship yet either: recordJudgment accepts the trio, but its only caller on
the human path - the status-update handler at discovery.functions.ts:1628
- forwards no forecast, and that handler's input schema does not carry the
fields. One lib change (accept optional trio in the update fn's input,
forward into the recordJudgment call) unlocks both the Decide offer UI and
the approvals render my earlier builder staged against. Documented with
the exact call site rather than shipped as a silent drop. The same trace
re-confirmed the three approvals-side drops from unit 029 stand.

Also checked: integration.discover.test.tsx is NOT stale - six passing
tests against the live capture region; the earlier scout note was wrong
and dies here rather than becoming a deletion.

Subagent infrastructure flaked hard tonight (three consecutive network
deaths); the wave went to direct execution instead, sequentially, which
is why this unit ships one control rather than four builds. The queue it
leaves is explicit: Decide forecast step (UI ready to build the moment
the passthrough lands), approvals render (same gate), Plan/Design
forecast Lines (same read), teardown steps 3 to 6.

Gates: tsc 0, full suite 0 fail with only the proven pre-existing
load-order flake as a non-failure error.
