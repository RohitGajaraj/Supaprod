// /threads (front-end reimagining Phase 4; founder-approved "Threads"). The
// revisitable home for every conversation. The selected thread rides a `?c=`
// search param so a thread is a shareable deep link. Returning users still land
// on Mission Control; this is the archive behind the one input model.
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ThreadsSurface } from "@/components/mission/ThreadsSurface";

const searchSchema = z.object({ c: z.string().optional() });

export const Route = createFileRoute("/_authenticated/threads")({
  validateSearch: (s: Record<string, unknown>) => searchSchema.parse(s),
  component: ThreadsPage,
  head: () => ({ meta: [{ title: "Threads · Supaprod" }] }),
});

function ThreadsPage() {
  const { c } = Route.useSearch();
  const navigate = useNavigate();
  return (
    <ThreadsSurface
      initialThreadId={c ?? null}
      onSelectThread={(id) => void navigate({ to: "/threads", search: { c: id }, replace: true })}
    />
  );
}
