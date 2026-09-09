/**
 * `/ship` IS A DOOR TO OUTCOMES NOW (2026-09-09; P-14b, A-QUEUE.md).
 *
 * The station's two acts -- taking a change to production, and saying
 * something about it afterwards -- are the artifacts tab's now, drawn by
 * `components/ship/ShipRecord.tsx` above the artifacts list, in the order
 * `/ship` drew them. P-14b already ruled the route is deleted once Outcomes
 * carries its blocks; it survives only as this redirect, because a URL a
 * person has bookmarked or a link that is already out in the world must land
 * somewhere real. The route's own header, with the argument for every region
 * and the keep/move/kill pass behind it, is the first thing in ShipRecord.tsx.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/ship")({
  beforeLoad: () => {
    throw redirect({ to: "/outcomes", search: { tab: "artifacts" } });
  },
});
