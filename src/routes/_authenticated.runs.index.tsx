import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * `/runs` FOLDS INTO THE BOARD, AND THE BOARD IS `/today`.
 *
 * ── THE BUG THIS FIXES, WHICH THE COMMENT ITSELF DESCRIBED ─────────────────
 * This file said "/runs folds into /today (the board)" and then redirected to
 * `SIGNED_IN_HOME`, which is `/start`. So a person clicking **Runs** in the
 * rail, wanting the list of runs, landed on the composer. The fold exists to
 * turn two doors onto one question into one door, and sending them to a THIRD
 * place is worse than the two it replaced. Seen live 2026-08-27.
 *
 * ── WHY THIS NAMES `/today` RATHER THAN THE HOME CONSTANT ──────────────────
 * `SIGNED_IN_HOME` is a real seam and a good one: it answers *"where does a
 * signed-in person land"*, and it exists so that question can be re-answered in
 * one line (`post-auth-home.ts`). **That is a different question from this
 * one.** This route answers *"where did this surface's content go"*, and the
 * answer is the board, permanently, because that is where the content went.
 *
 * Coupling them let an unrelated decision silently retarget this redirect, and
 * it already had: the home flipped to `/start` on 2026-08-25 and took `/runs`
 * with it. If the home flips again, this should still open the board.
 *
 * The URL survives as an alias, so every caller linking `/runs` keeps working
 * with no edit, which is why the fold could be approved without a sweep across
 * files. `/runs/$missionId` and the two studio routes under it are untouched: a
 * mission's own detail is not this list.
 */
export const Route = createFileRoute("/_authenticated/runs/")({
  beforeLoad: () => {
    throw redirect({ to: "/today" });
  },
});
