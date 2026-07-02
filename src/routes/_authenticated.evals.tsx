import { createFileRoute, redirect } from "@tanstack/react-router";

// /evals folded into Engine Room's Quality room per OBS-10 (IA consolidation).
export const Route = createFileRoute("/_authenticated/evals")({
  beforeLoad: () => {
    throw redirect({ to: "/engine-room", search: { room: "quality", view: "suites" } });
  },
});
