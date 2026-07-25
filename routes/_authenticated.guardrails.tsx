import { createFileRoute, redirect } from "@tanstack/react-router";

// /guardrails folded into Engine Room's Safety room per OBS-10 (IA consolidation).
export const Route = createFileRoute("/_authenticated/guardrails")({
  beforeLoad: () => {
    throw redirect({ to: "/engine-room", search: { room: "safety" } });
  },
});
