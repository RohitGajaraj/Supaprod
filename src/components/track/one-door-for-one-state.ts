/**
 * ── THREE DOORS FOR ONE STATE, AND TWO OF THEM COULD NOT OPEN IT ──────────
 *
 * P-37, shape 1. On the honest run a person looking at one held station was
 * offered, in one breath:
 *
 *   "Stopped, and not on you"      the footer
 *   "Finish it in Settings"        `connections/AskInPlace`, in the pane
 *   "Say what is unsettled"        `track/OpenQuestions`, in the pane
 *   "Let Discover try again"       the hold card's way out
 *
 * NO SINGLE COMPONENT IS WRONG. Each is a good control that knows its own
 * business and nothing about the others, and each renders because its own
 * condition is true. **The screen is wrong, and only the screen can be.** That
 * is why this is a function and not four edits: the decision about which door
 * belongs to a state has to live somewhere that can see the state, once.
 *
 * ── AND TWO OF THEM COULD NOT CLEAR THE HOLD ──────────────────────────────
 *
 * A person whose Discover station has nothing to read is not helped by
 * "Say what is unsettled", and "Finish it in Settings" sends them away to
 * finish something they may already have finished. Offering three doors where
 * one opens teaches that the controls are decorative, which is more expensive
 * than offering none.
 *
 * ── THE VERB COMES FROM THE STATE (A1, amendment 3) ───────────────────────
 *
 * "Connect a source" is wrong whenever a connection already EXISTS and is
 * simply not pointed at this product, which was the case on the honest run. A
 * door that says "connect" to somebody who has connected reads as the product
 * not knowing what it has.
 *
 * ── AND THE SECOND PROMISE IS NOT DROPPED, IT MOVES ───────────────────────
 *
 * R-36's sentence promises two ways on: add a source, or *say what you know*.
 * Both are real, so the second becomes the composer's placeholder in this state
 * rather than a second button (A1, amendment 4). The composer is already on the
 * screen and already takes a sentence; putting the offer where the typing
 * happens makes it at the moment it can be accepted, which a button only
 * announces.
 */

/** What the run screen knows about why this station is not moving. */
export type HoldFacts = {
  /** `spine_tracks.last_hold`, raw. */
  hold: string | null;
  /** A connector exists on this workspace, whatever it is pointed at. */
  hasConnection: boolean;
  /** That connector is pointed at this product. */
  connectionIsBound: boolean;
  /** The product's name, for the door's own sentence. Null when unknown. */
  productName: string | null;
};

export type OneDoor =
  | { door: "point-a-source"; label: string }
  | { door: "connect-a-source"; label: string }
  | { door: "none" };

/**
 * The one door this state gets, or none.
 *
 * `none` is a real answer and the common one: most states are not stuck, and a
 * screen that always finds a door to draw is back to shape 1.
 */
export function oneDoorFor(facts: HoldFacts): OneDoor {
  const stuckOnEvidence =
    facts.hold === "needs-evidence" || facts.hold === "carried-on-your-sentence";
  if (!stuckOnEvidence) return { door: "none" };

  if (facts.hasConnection && !facts.connectionIsBound) {
    /* The connector exists and is not pointed here. Naming the product is the
       difference between a door and an instruction. */
    return {
      door: "point-a-source",
      label: facts.productName
        ? `Point a source at ${facts.productName}`
        : "Point a source at this",
    };
  }
  if (!facts.hasConnection) return { door: "connect-a-source", label: "Connect a source" };

  /*
   * A connection exists AND is bound, and the station still found nothing. No
   * door: the source is wired and simply has nothing to say yet, and inventing
   * a control here would be the fourth door rather than the one.
   */
  return { door: "none" };
}

/**
 * What the composer offers to take while this state stands. Null everywhere
 * else, because a placeholder that changes when nothing is stuck is noise.
 */
export function composerPromiseFor(facts: HoldFacts): string | null {
  const stuckOnEvidence =
    facts.hold === "needs-evidence" || facts.hold === "carried-on-your-sentence";
  return stuckOnEvidence ? "Say what you know, and it carries on from that" : null;
}
