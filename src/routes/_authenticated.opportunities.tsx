import { createFileRoute, redirect } from "@tanstack/react-router";

// /opportunities folded into Discover per OBS-10 (IA consolidation).
export const Route = createFileRoute("/_authenticated/opportunities")({
  beforeLoad: () => {
    throw redirect({ to: "/discover", search: { tab: "opportunities" } });
  },
});
