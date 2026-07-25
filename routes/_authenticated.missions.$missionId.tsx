import { createFileRoute, redirect } from "@tanstack/react-router";

// /missions/$missionId folded into Build per OBS-10 (IA consolidation): the
// orchestrator-mission detail body (cancel/replay/advance/gate/relay/
// compounding/graph/hops-trace) moved to MissionOrchestratorDetail, rendered
// by /build/$missionId whenever the mission has no 'builder' agent run.
export const Route = createFileRoute("/_authenticated/missions/$missionId")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/build/$missionId", params: { missionId: params.missionId } });
  },
});
