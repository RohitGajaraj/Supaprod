import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * /build, kept alive permanently. It is now /runs.
 *
 * A run was never the build leg. `missions.current_agent_id` can be any of the
 * thirteen agents, `agentStation()` maps it across all seven stations, and the
 * run detail already branched to `MissionOrchestratorDetail` for missions with
 * no builder run at all. The route was called Build for one reason: it is a
 * leftover from the Builder -> Studio -> Build rename, and the name was telling
 * users the spine covered one stage of seven.
 *
 * Founder, 2026-07-29: "runs are not only for the build part, it is for the
 * entire life cycle. If a run is only for the build part, then what happens to
 * the other six?" They do not go anywhere. They are stages INSIDE a run, which
 * is what the seven-stage strip renders and what `getRunStages` reads from the
 * record.
 *
 * This file does not get deleted. Links to /build are in commits, in chat, and
 * on video, and this repo's rule is that an existing URL keeps working (the
 * same reason /m/$productId is kept alive forever). It upgrades itself in the
 * address bar instead of dying.
 */
export const Route = createFileRoute("/_authenticated/build/")({
  beforeLoad: () => {
    throw redirect({ to: "/runs", replace: true });
  },
});
