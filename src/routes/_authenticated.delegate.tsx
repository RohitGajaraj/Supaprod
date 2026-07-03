import { createFileRoute, redirect } from "@tanstack/react-router";

// /delegate folded into Build per OBS-10 (IA consolidation): the by-MISSION
// desk lens is now the "By Lane" view-mode tab on Build, not a separate
// top-level page.
export const Route = createFileRoute("/_authenticated/delegate")({
  beforeLoad: () => {
    throw redirect({ to: "/build", search: { view: "lane" } });
  },
});
