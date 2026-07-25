import { createFileRoute, redirect } from "@tanstack/react-router";

// /inbox folds into Today per OBS-10 (IA consolidation): approvals are Calls
// on Today, never in the Engine Room door (contract §8) - was pointed at
// /govern?tab=approvals, a stale target now that Today owns the Call queue.
export const Route = createFileRoute("/_authenticated/inbox")({
  beforeLoad: () => {
    throw redirect({ to: "/today" });
  },
});
