import { createFileRoute, redirect } from "@tanstack/react-router";

// /roadmap folded into Plan per OBS-10 (IA consolidation): Plan (OBS-07) is
// the Now/Next/Later outcome roadmap reborn, a closer match than the interim
// Opportunities redirect this route carried before Plan existed.
export const Route = createFileRoute("/_authenticated/roadmap")({
  beforeLoad: () => {
    throw redirect({ to: "/plan", search: { view: "roadmap" } });
  },
});
