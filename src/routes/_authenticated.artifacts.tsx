import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * /artifacts, kept alive permanently. It is now /brain?tab=artifacts.
 *
 * Founder ruling 2026-07-30. A reachability audit found this surface orphaned:
 * its only inbound link was MissionShell's Artifacts door, and MissionShell is
 * the retired Mission Control chrome that AppFrame replaced, so nothing live
 * reached it. Artifacts is not a sixth rail item, it is a view inside Brain:
 * Brain holds what we decided and learned, Artifacts holds what we made, and
 * they are two halves of one record. The reasoning in full is in the headers of
 * `_authenticated.brain.tsx` and `@/components/brain/ArtifactsView.tsx`.
 *
 * An existing URL never dies in this repo (see `_authenticated.build.$missionId.tsx`),
 * so the route file stays, routeTree.gen.ts stays in sync, and every bookmark,
 * pasted link and stale nav call lands on the tab. `replace` because this hop
 * is not a place anyone should be able to go back to.
 */
export const Route = createFileRoute("/_authenticated/artifacts")({
  beforeLoad: () => {
    throw redirect({ to: "/brain", search: { tab: "artifacts" }, replace: true });
  },
});
