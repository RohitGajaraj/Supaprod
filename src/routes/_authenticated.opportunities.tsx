import { createFileRoute, redirect } from "@tanstack/react-router";

// /opportunities folded into Discover per OBS-10 (IA consolidation). The
// ranked queue is Discover's queue tab since Decide was absorbed (2026-07-11).
export const Route = createFileRoute("/_authenticated/opportunities")({
  beforeLoad: () => {
    throw redirect({ to: "/discover", search: { tab: "queue" } });
  },
});
