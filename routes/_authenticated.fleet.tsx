import { createFileRoute, redirect } from "@tanstack/react-router";

// /fleet folded into Build per OBS-10 (IA consolidation): the by-AGENT lens is
// now the "By Agent" view-mode tab on Build, not a separate top-level page.
export const Route = createFileRoute("/_authenticated/fleet")({
  beforeLoad: () => {
    throw redirect({ to: "/build", search: { view: "agent" } });
  },
});
