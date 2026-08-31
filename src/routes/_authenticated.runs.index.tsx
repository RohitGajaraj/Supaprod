import { createFileRoute, redirect } from "@tanstack/react-router";

import { SIGNED_IN_HOME } from "@/components/shell/post-auth-home";

/**
 * `/runs` FOLDS INTO THE BOARD, AND THE BOARD IS `/today` UNTIL THE FOLD LANDS.
 *
 * ── THE BUG THIS FIXES, WHICH THE COMMENT ITSELF DESCRIBED ─────────────────
 * This file said "/runs folds into /today (the board)" and then redirected to
 * `SIGNED_IN_HOME`, which is `/start`. So a person clicking **Runs** in the
 * rail, wanting the list of runs, landed on the composer. The fold exists to
 * turn two doors onto one question into one door, and sending them to a THIRD
 * place is worse than the two it replaced. Seen live 2026-08-27.
 *
 * ── THE ARGUMENT BELOW WAS RIGHT ON 2026-08-27 AND IS BEING OVERTAKEN ─────
 * It said: `SIGNED_IN_HOME` answers *"where does a signed-in person land"* and
 * this route answers *"where did this surface's content go"*, those are
 * different questions, and coupling them let an unrelated decision silently
 * retarget this redirect - which it already had, when the home flipped to
 * `/start` on 2026-08-25 and took `/runs` with it. **That reasoning is sound
 * and it is kept, because it is the reason this file names a route at all.**
 *
 * **What changed is the fact underneath it, not the reasoning.** S0's ruling
 * A01 (2026-08-31) settles F-144: `/today` is itself one of the routes that
 * FOLD, and the board's content moves onto the home. So the two questions stop
 * being different - "where did this surface's content go" and "where does a
 * person land" become one place, and the daylight this comment protected
 * closes.
 *
 * **THE TARGET MOVED, 2026-08-31, IN THE COMMIT THAT FOLDED `/today`.** S0
 * named the hazard and it is now closed: `/today` is itself a redirect to the
 * home, so leaving this pointed at it would bounce a person through two
 * redirects to reach one surface. It names `SIGNED_IN_HOME` directly.
 *
 * **The two questions this comment kept apart have genuinely become one.** They
 * were different while the board was a separate route; now the board IS drawn
 * on the home, so *"where did this surface's content go"* and *"where does a
 * person land"* have the same answer, and the daylight this file protected has
 * closed rather than been ignored.
 *
 * The URL survives as an alias, so every caller linking `/runs` keeps working
 * with no edit, which is why the fold could be approved without a sweep across
 * files. `/runs/$missionId` and the two studio routes under it are untouched: a
 * mission's own detail is not this list.
 */
export const Route = createFileRoute("/_authenticated/runs/")({
  beforeLoad: () => {
    throw redirect({ to: SIGNED_IN_HOME });
  },
});
