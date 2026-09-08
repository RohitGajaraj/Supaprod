import { createFileRoute, redirect } from "@tanstack/react-router";

/*
 * /prds rendered a bare <Outlet /> with no child route on disk since the
 * P-14 deletions: a person landing here met an empty page. It redirects to
 * Start now, the same shape as the other retired station addresses; a spec
 * itself lives at /plan/spec/$id, and the one remaining writer of a /prds
 * address (research.server.ts) is being re-pointed there.
 */
export const Route = createFileRoute("/_authenticated/prds")({
  beforeLoad: () => {
    throw redirect({ to: "/start", search: true });
  },
});
