import { createFileRoute } from "@tanstack/react-router";
import { Action, NothingHere, PageHeading } from "@/components/meridian/surface-parts";
import { Surface } from "@/components/meridian/Surface";
import { Board } from "@/components/today/Board";

/**
 * `/today` DRAWS THE BOARD, AND IS ABOUT TO STOP BEING WHERE IT LIVES.
 *
 * The surface is now `src/components/today/Board.tsx`, lifted out whole on
 * 2026-08-31 under S0's ruling A01: the home is `/start` and the board folds
 * INTO it. This file is the old door, kept open and unchanged in behaviour
 * until the new one exists.
 *
 * **It becomes a redirect to `SIGNED_IN_HOME` in the commit that mounts `Board`
 * on the home, and not before.** `/runs` redirects here and moves in that same
 * commit, or it bounces through this file twice.
 */
export const Route = createFileRoute("/_authenticated/today")({
  component: Board,
  head: () => ({ meta: [{ title: "Today · Supaprod" }] }),
  /**
   * THE FRONT DOOR HAD NO FLOOR UNDER IT.
   *
   * Every read on this surface is guarded, and a guarded read is not the only
   * way a page dies. A throw anywhere in the render tree below -- a mission row
   * with a shape the formatter did not expect, a queue item missing a field a
   * child dereferences -- landed on the router's own default, on the one screen
   * a person opens first and the one screen that is supposed to tell them
   * whether their morning is clear. Seven surfaces carry this boundary and this
   * was the only one without it.
   *
   * IT SAYS WHAT IS STILL TRUE, then offers the way out. A page that failed to
   * draw is not a record that lost anything, and the first thing a person needs
   * to know is which of the two happened. `reset` re-renders the tree rather
   * than reloading the tab, so a retry costs nothing and keeps the session.
   */
  errorComponent: ({ error, reset }) => (
    <Surface wide>
      {/* THE RHYTHM IS STATED HERE, BECAUSE NOTHING ELSE STATES IT ANY MORE.
          This was a `PageHead` over a `Block`, and the block reserved 36px above
          itself plus 28px inside. Meridian's `Region` reserves nothing on the
          founder's ruling (see the head of `today.css`), so a branch that
          returns two siblings has to say what sits between them. 40px, the
          number that ruling names, and the same gap the sheet gives every
          section of the surface this branch replaces.

          The `Region` that used to wrap the message is gone rather than ported.
          It carried no title, so it rendered an empty section wrapper, and the
          message needs a container of its own here anyway: this branch IS the
          whole surface, which is the one case `NothingHere` is for rather than
          `NothingYet`. Its `action` slot is where the retry belongs. */}
      <div className="flex flex-col gap-mrd-7">
        <PageHeading
          title="Today did not open."
          sub="Whatever the crew did overnight is still on the record. This is the page failing to draw it."
        />
        <NothingHere
          action={
            <Action variant="primary" onClick={reset}>
              Try again
            </Action>
          }
        >
          {(error as Error)?.message ?? "The reason did not come back with the error."}
        </NothingHere>
      </div>
    </Surface>
  ),
});
