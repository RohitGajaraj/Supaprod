import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * `/swarm` FOLDS INTO THE BOARD, AND THE BOARD IS `/today`.
 *
 * F-144/145/146: Rail consolidation folds all list/view routes into one board.
 * The board is `/today` (the home surface showing work in flight + composer).
 * The URL survives as an alias, so links to `/swarm` keep working.
 */
export const Route = createFileRoute("/_authenticated/swarm")({
  beforeLoad: () => {
    throw redirect({ to: "/today" });
  },
});
