import { createFileRoute, redirect } from "@tanstack/react-router";

// /meetings folds directly into Brain's Calendar tab per OBS-10 (IA
// consolidation), flattening a 2-hop chain (meetings -> calendar -> knowledge).
export const Route = createFileRoute("/_authenticated/meetings")({
  beforeLoad: () => {
    throw redirect({ to: "/knowledge", search: { tab: "calendar" } });
  },
});
