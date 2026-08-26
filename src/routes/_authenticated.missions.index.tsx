import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * `/missions` OPENS THE BOARD, BECAUSE THAT IS WHERE MISSIONS ARE LISTED.
 *
 * ── THE RULING THIS SUPERSEDES, AND WHY ITS PREMISE EXPIRED ────────────────
 * This route redirected to `/build` under OBS-10, and the reason it gave was a
 * good one at the time: *"Build widened to list every agent-mesh mission
 * (Studio/Build code-gen AND orchestrator goal-runs), so this page has no
 * functionality Build lacks."*
 *
 * **That is no longer true.** Checked 2026-08-27 against the file rather than
 * remembered: `_authenticated.build.index.tsx` contains no `listMissions`, no
 * `listStudioSessions`, and neither `RunsGrid` nor `RunBoard`. Build was
 * narrowed back to a station surface, and nothing updated the door that had
 * been pointed at it. So `/missions` opened a page with no mission list on it.
 *
 * A fold is only honest while the place it folds INTO still holds the content.
 * When that stops being true the fold has quietly become a dead end, and the
 * comment explaining it reads as justification for a state nobody rechecked.
 *
 * ── WHERE THEY ACTUALLY ARE ────────────────────────────────────────────────
 * The board. It lists missions in three lanes by what each one needs from a
 * person, and since C2-003 it merges spine tracks into the same lanes, so it is
 * the only surface that shows every piece of work whichever engine drives it.
 * `SURFACE-MAP.md:55` says the same: `FOLD → board`.
 *
 * `missions/$missionId` is untouched. A mission's own detail is a different
 * question from the list, and it needs its own ruling rather than being carried
 * along by this one.
 */
export const Route = createFileRoute("/_authenticated/missions/")({
  beforeLoad: () => {
    throw redirect({ to: "/today" });
  },
});
