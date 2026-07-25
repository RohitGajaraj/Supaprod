// /threads (front-end reimagining Phase 4; founder-approved "Threads"). The
// revisitable home for every conversation. The selected thread rides a `?c=`
// search param so a thread is a shareable deep link. Returning users still land
// on Mission Control; this is the archive behind the one input model.
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ThreadsSurface } from "@/components/mission/ThreadsSurface";
import { RoomChromeShell } from "@/components/mission/RoomChrome";

const searchSchema = z.object({ c: z.string().optional() });

export const Route = createFileRoute("/_authenticated/threads")({
  validateSearch: (s: Record<string, unknown>) => searchSchema.parse(s),
  component: ThreadsPage,
  head: () => ({ meta: [{ title: "Threads · Supaprod" }] }),
});

function ThreadsPage() {
  const { c } = Route.useSearch();
  const navigate = useNavigate();
  // Wrapped in the room chrome, like /brain, /settings and /approvals. This route
  // used to render the surface bare. _authenticated.tsx counts it as a reimagined
  // surface, so the retired AppShell is not mounted here either, which left the
  // page with NO top chrome at all: no brand, no product switcher, no doors back
  // to the room, and no account menu, so no way to sign out.
  return (
    <RoomChromeShell activeDoor="mission">
      <ThreadsSurface
        initialThreadId={c ?? null}
        onSelectThread={(id) => void navigate({ to: "/threads", search: { c: id }, replace: true })}
      />
    </RoomChromeShell>
  );
}
