import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * `/cockpit` OPENS THE BOARD.
 *
 * It was pointed at `/build` under OBS-10, alongside `/missions` and `/fleet`,
 * on the premise that Build had widened to list every agent-mesh mission.
 * Checked 2026-08-27 against the file: `_authenticated.build.index.tsx` holds
 * no `listMissions`, no `listStudioSessions`, and neither `RunsGrid` nor
 * `RunBoard`. Build was narrowed back to a station surface and the doors aimed
 * at it were never re-aimed, so this one opened a page with no list of work.
 *
 * The cockpit's question was "what is happening across everything", and the
 * board is the surface that answers it now: three lanes ordered by what each
 * piece of work needs from a person, missions and spine tracks merged since
 * C2-003. `SURFACE-MAP.md:57` marks this route DELETE, which is S0's call to
 * make; until it is made, an alias that lands on the right surface is strictly
 * better than one that lands on the wrong one.
 *
 * The old `?tab=agents` view stays retired: the roster is Engine Room > Team.
 */
export const Route = createFileRoute("/_authenticated/cockpit")({
  beforeLoad: () => {
    throw redirect({ to: "/today" });
  },
});
