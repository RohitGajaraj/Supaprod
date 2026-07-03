import { createFileRoute, redirect } from "@tanstack/react-router";

// /cockpit absorbed into /build per OBS-10 (IA consolidation; /missions itself
// folded into Build). The old ?tab=agents view is retired — the agent roster
// lives in Engine Room > Team.
export const Route = createFileRoute("/_authenticated/cockpit")({
  beforeLoad: () => {
    throw redirect({ to: "/build" });
  },
});
