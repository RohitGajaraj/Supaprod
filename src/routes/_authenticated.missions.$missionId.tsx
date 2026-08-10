import { createFileRoute, redirect } from "@tanstack/react-router";

// /missions/$missionId folded into Build per OBS-10 (IA consolidation): the
// orchestrator-mission detail body (cancel/replay/advance/gate/relay/
// compounding/graph/hops-trace) moved to MissionOrchestratorDetail, rendered
// by /build/$missionId whenever the mission has no 'builder' agent run.
// COLLAPSED 2026-08-10, the same two-hop chain as /studio/$missionId: this
// pointed at /build/$missionId, which is itself a permanent redirect to
// /runs/$missionId. `/build/$missionId`'s own comment noted this route
// "arrives one hop later at the same place, which is correct and costs
// nothing" -- true of correctness, and it did cost something, because a
// redirect chain is a visible stutter on a surface people open from a
// notification. It now goes straight there.
//
// `replace: true` so the intermediate URL never enters history and the back
// button does not walk the reader through a hop they never chose.
export const Route = createFileRoute("/_authenticated/missions/$missionId")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/runs/$missionId",
      params: { missionId: params.missionId },
      replace: true,
    });
  },
});
