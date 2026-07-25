// /artifacts (front-end reimagining Phase 4; founder-approved name "Artifacts").
// The workspace view of everything the loop has made. A per-product tab on the
// Canvas rest face is the follow-up placement; this route is the workspace home
// the founder approved, reached from the room's Artifacts door.
import { createFileRoute } from "@tanstack/react-router";
import { ArtifactsSurface } from "@/components/mission/ArtifactsSurface";

export const Route = createFileRoute("/_authenticated/artifacts")({
  component: ArtifactsSurface,
  head: () => ({ meta: [{ title: "Artifacts · Supaprod" }] }),
});
