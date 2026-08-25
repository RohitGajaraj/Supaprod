import { createFileRoute, redirect } from "@tanstack/react-router";
import { SIGNED_IN_HOME } from "@/components/shell/post-auth-home";

// v6 Phase 0 / W1: the product-tab Tasks kanban was deleted as human-PM-legacy
// UI. Keep the route file so routeTree.gen.ts stays in sync; redirect bookmarks
// to Today.
// OBS-10: re-pointed straight to /today (was `/`, which then did a second,
// client-side redirect through the public landing page's auth check).
//
// TODAY DOES NOT OWN A TASK LIST, and the sentence that used to stand here said
// it did -- "redirect bookmarks to Today, which owns the surviving task-capture
// list (same `tasks` table)". Corrected 2026-08-21: `_authenticated.today.tsx`
// mentions a task exactly twice, importing `taskStatus` at :22 to colour a
// mission dot at :1147, and calls neither `listTasks` nor `createTask`. The
// surface that actually renders tasks is /plan/spec/$id. This redirect is
// therefore a bookmark catcher and nothing more; it does not deliver a reader
// to their tasks, and the next person to touch it should know that rather than
// inherit the claim. Re-pointing it is a live option and a deliberate call.
export const Route = createFileRoute("/_authenticated/tasks")({
  beforeLoad: () => {
    throw redirect({ to: SIGNED_IN_HOME });
  },
});
