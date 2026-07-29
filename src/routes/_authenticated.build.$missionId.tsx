import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * /build/$missionId, kept alive permanently. It is now /runs/$missionId.
 *
 * See `_authenticated.build.index.tsx` for why the rename happened. The search
 * state is carried across so a deep link to a particular tab still lands on
 * that tab rather than dumping the reader at the top of the run.
 *
 * `/missions/$missionId` already redirected here; it now arrives one hop later
 * at the same place, which is correct and costs nothing.
 */
export const Route = createFileRoute("/_authenticated/build/$missionId")({
  beforeLoad: ({ params, search }) => {
    throw redirect({
      to: "/runs/$missionId",
      params: { missionId: params.missionId },
      search: search as never,
      replace: true,
    });
  },
});
