// /artifacts (front-end reimagining Phase 4; founder-approved name "Artifacts").
// The workspace view of everything the loop has made. A per-product tab on the
// Canvas rest face is the follow-up placement; this route is the workspace home
// the founder approved, reached from the room's Artifacts door.
import { createFileRoute } from "@tanstack/react-router";
import { ArtifactsSurface } from "@/components/mission/ArtifactsSurface";
import { RoomChromeShell } from "@/components/mission/RoomChrome";

export const Route = createFileRoute("/_authenticated/artifacts")({
  component: ArtifactsRoute,
  head: () => ({ meta: [{ title: "Artifacts · Supaprod" }] }),
});

/** Wrapped in the room chrome, like /brain, /settings and /approvals.
 *
 * This route used to render the surface bare. _authenticated.tsx counts it as a
 * reimagined surface, so the retired AppShell is not mounted here either, which
 * left the page with NO top chrome at all: no brand, no product switcher, no
 * doors back to the room, and no account menu, so no way to sign out. */
function ArtifactsRoute() {
  return (
    <RoomChromeShell activeDoor="mission">
      <ArtifactsSurface />
    </RoomChromeShell>
  );
}
