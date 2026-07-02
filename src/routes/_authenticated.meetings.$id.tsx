import { createFileRoute, redirect } from "@tanstack/react-router";

// /meetings/$id folds directly into Brain's Calendar tab per OBS-10 (IA
// consolidation), flattening a 2-hop chain (meetings/$id -> calendar ->
// knowledge) and preserving the meeting id.
export const Route = createFileRoute("/_authenticated/meetings/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/knowledge", search: { tab: "calendar", meeting: params.id } });
  },
});
