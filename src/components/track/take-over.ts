import { AGENT_STATIONS, type AgentStation } from "@/lib/agent-vocabulary";
import { previousStation, type SpineRoute } from "@/lib/spine/route";

/**
 * WHAT A PERSON MAY TAKE OVER ON WORK THAT IS ALREADY MOVING.
 *
 * ── WHY THIS EXISTS ────────────────────────────────────────────────────────
 * A run whose only controls are Start and Stop is a batch job with a progress
 * pane in front of it. Steering put one instruction back into moving work; these
 * are the other two moves a person actually makes when what came back is wrong:
 * send a step back to be done again, or do the step yourself and hand the result
 * in. Both server fns landed on `main` with ZERO importers -- this repo's
 * dominant defect, where a capability nobody can reach is indistinguishable
 * from one nobody built.
 *
 * ── UNDO IS ONE STEP, NOT A PICKER ─────────────────────────────────────────
 * `rewindTrackTo` accepts any station and refuses the ones it will not do, so a
 * seven-station picker was available and is still wrong. Undo means undo the
 * last thing, the way it means that everywhere else; pressing it twice goes back
 * twice, which is one gesture repeated rather than a second concept. A picker
 * would also have to draw five controls that exist only to refuse.
 *
 * `previousStation` is the entire derivation, and it reads THIS RUN'S ROUTE
 * rather than the spine order -- so a route that waived Decide sends Plan back
 * to Discover, not to a station this work was never going to visit. Walking
 * `AGENT_STATION_ORDER` instead would have been the bug, and it is the bug that
 * looks correct in every test written against a full route.
 *
 * ── HANDBACK IS DRAWN ONLY WHERE IT CAN ACT ────────────────────────────────
 * `submitStationByHand` refuses anywhere but Build and Ship, because the other
 * five produce a decision, a spec or a design, and a link is not one of those.
 * A control that is always drawn and always refuses teaches a person that this
 * surface lies, so it is absent where it cannot act rather than present and
 * apologetic (SPEC-LAYOUT §5.4).
 */

/** The stations whose outcome a link can honestly stand in for. */
const BY_HAND: ReadonlySet<AgentStation> = new Set<AgentStation>(["build", "ship"]);

export type TakeOver = {
  /** The step to send this work back to, or null when nothing stands behind it. */
  undoTo: AgentStation | null;
  /** The control's own words, carrying the step's name so the press is unambiguous. */
  undoLabel: string | null;
  /** Whether this step's outcome can be handed in as a link. */
  handback: boolean;
  /**
   * Said in place of the controls when neither can do anything. Never null at
   * the same time as a control is offered: this is the line that REPLACES them.
   */
  nothing: string | null;
};

export function takeOver(track: {
  status: "open" | "done" | "abandoned";
  station: AgentStation;
  route: SpineRoute;
}): TakeOver {
  if (track.status !== "open") {
    return {
      undoTo: null,
      undoLabel: null,
      handback: false,
      nothing: "This work is closed, so there is no step to take over.",
    };
  }

  const undoTo = previousStation(track.route, track.station);
  const handback = BY_HAND.has(track.station);

  return {
    undoTo,
    undoLabel: undoTo ? `Send it back to ${AGENT_STATIONS[undoTo].name}` : null,
    handback,
    nothing:
      !undoTo && !handback
        ? "It is at the first step on its route, so there is nothing to send it back to."
        : null,
  };
}

/**
 * What an undo actually did, said in the words of the guarantee behind it.
 *
 * `rewindTrackTo` SUPERSEDES rather than deletes: the row and the thing it made
 * both stay, stamped with when they were set aside. A person pressing undo on
 * work they are about to be graded on needs to know that in the same breath as
 * the press, because "undo" everywhere else in software means the old thing is
 * gone -- and here the record of what happened is the product.
 */
export function undoneLine(to: AgentStation): string {
  const name = AGENT_STATIONS[to].name;
  return `It is back at ${name}. What ${name} and every step after it made is set aside, not deleted.`;
}
