import { createFileRoute, redirect } from "@tanstack/react-router";

// v6 Phase 0 / W1: the product-tab Tasks kanban was deleted as human-PM-legacy
// UI. Keep the route file so routeTree.gen.ts stays in sync; redirect bookmarks
// to Today, which owns the surviving task-capture list (same `tasks` table).
// OBS-10: re-pointed straight to /today (was `/`, which then did a second,
// client-side redirect through the public landing page's auth check).
export const Route = createFileRoute("/_authenticated/tasks")({
  beforeLoad: () => {
    throw redirect({ to: "/today" });
  },
});
