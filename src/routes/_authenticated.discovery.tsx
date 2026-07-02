import { createFileRoute, redirect } from "@tanstack/react-router";

// /discovery folded into Discover per OBS-10 (IA consolidation).
export const Route = createFileRoute("/_authenticated/discovery")({
  beforeLoad: () => {
    throw redirect({ to: "/discover", search: { tab: "signals" } });
  },
});
