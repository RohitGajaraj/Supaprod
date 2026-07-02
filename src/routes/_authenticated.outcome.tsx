import { createFileRoute, redirect } from "@tanstack/react-router";

// /outcome folds directly into Brain's Learnings tab per OBS-10 (IA
// consolidation), flattening a 2-hop chain (outcome -> learn -> knowledge)
// that also silently dropped this route's own tab=outcomes param.
export const Route = createFileRoute("/_authenticated/outcome")({
  beforeLoad: () => {
    throw redirect({ to: "/knowledge", search: { tab: "learnings" } });
  },
});
