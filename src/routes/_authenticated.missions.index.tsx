import { createFileRoute, redirect } from "@tanstack/react-router";

// /missions folded into Build per OBS-10 (IA consolidation): Build widened to
// list every agent-mesh mission (Studio/Build code-gen AND orchestrator
// goal-runs), so this page has no functionality Build lacks. The composer's
// "Run a goal" mode (dispatchStudioSession's sibling, startOrchestratedMission)
// replaces the retired MissionComposer.
export const Route = createFileRoute("/_authenticated/missions/")({
  beforeLoad: () => {
    throw redirect({ to: "/build" });
  },
});
