import { createFileRoute, redirect } from "@tanstack/react-router";
import { SIGNED_IN_HOME } from "@/components/shell/post-auth-home";

// /runs folds into /today (the board). The board shows sections of work
// (waiting on you, running, finished) with a door to the full list at
// /inbox. The two studio-specific routes (/runs/$missionId/build and
// /runs/$missionId/spec) remain and link from the run detail.
export const Route = createFileRoute("/_authenticated/runs/")({
  beforeLoad: () => {
    throw redirect({ to: SIGNED_IN_HOME });
  },
});
