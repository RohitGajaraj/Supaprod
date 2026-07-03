import { createFileRoute, redirect } from "@tanstack/react-router";

// /learn folds into Brain's Learnings tab per OBS-10 (IA consolidation).
// Fixed a pre-existing bug here: this redirected to tab=calendar, not
// tab=learnings - landing every /learn bookmark on the wrong tab.
export const Route = createFileRoute("/_authenticated/learn")({
  beforeLoad: () => {
    throw redirect({ to: "/brain", search: { tab: "learnings" } });
  },
});
