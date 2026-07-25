import { createFileRoute, redirect } from "@tanstack/react-router";

// /budgets folded into Engine Room's Spend room per OBS-10 (IA consolidation).
export const Route = createFileRoute("/_authenticated/budgets")({
  beforeLoad: () => {
    throw redirect({ to: "/engine-room", search: { room: "spend" } });
  },
});
