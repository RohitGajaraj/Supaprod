/**
 * SHIP EXITS ON A RELEASE, NOT ON HAVING FORMED A VIEW.
 *
 * ── WHAT HAPPENED AT 06:30:48 UTC ON 2026-09-04 ──────────────────────────
 * The tablet track's release-verifier read the workspace brief, found the spec
 * still a draft and the design gate still pending, and filed a DECLINED
 * decision: *"Do not ship until PRD approved and design gate cleared."* That is
 * the seat doing its job exactly right.
 *
 * Eighteen minutes later the sweep advanced the track from Ship to Learn.
 *
 * Nothing had been released. No release gate was raised, no promote happened,
 * and Learn sat down to grade a 2026-09-09 forecast about a change no customer
 * can reach. The product was marking its own homework on work that does not
 * exist.
 *
 * ── THE SHAPE, WHICH THIS REPO HAS PAID FOR BEFORE ───────────────────────
 * Every gate on the advance asks about an ARTIFACT. `producedThisVisit` asks
 * whether the station filed anything; `STATION_NEEDS.learn` asks whether a
 * spec, a changeset or a deployment exists. A declined decision is an artifact,
 * so it answered yes to both.
 *
 * F-72 and P-03 are the same sentence one station earlier: *"Not one of them
 * asks whether Build's work is OVER."* Ship's work is not over because Ship has
 * an opinion. It is over when something is live.
 *
 * ── AND A DECLINE IS NOT A FAILURE ───────────────────────────────────────
 * The seat did not malfunction and retrying changes nothing: the spec is a
 * draft and the gate is pending, and no station can approve either. That is
 * `waiting-on-a-person` by definition, and the hold carries the seat's OWN
 * rationale, because the rationale names the two calls somebody has to make and
 * a person told only "Ship is waiting on you" would go looking for them.
 */

/** What the record says about whether this work actually went out. */
export type ReleaseFacts = {
  /** A production deployment with the provider's own success on it. */
  liveInProduction: boolean;
  /**
   * A person recorded that it shipped elsewhere. `submitStationByHand` writes
   * `claimed`, never `success`, and that distinction is kept everywhere: this
   * is a person's word, and a person's word is enough to leave Ship.
   */
  handedBack: boolean;
  /** The newest release decision that said no, and why, when there is one. */
  declinedBecause: string | null;
  /** False when a read failed. Nothing is concluded from a failed read. */
  known: boolean;
};

export type ShipExit =
  | { leave: true; because: string }
  | { leave: false; hold: "waiting-on-a-person"; because: string }
  | { leave: false; hold: null; because: string };

/**
 * The sentence a person reads when the release was declined.
 *
 * Carries the seat's rationale VERBATIM. It names the prerequisites, and a
 * paraphrase would be this file inventing a second answer to a question the
 * seat already answered better.
 */
export function declinedLine(because: string): string {
  const said = because.trim().replace(/\s+/g, " ");
  return (
    `The release was declined and nothing has gone live: ${said} ` +
    `Ship stays here until that is answered; sending it on would grade an outcome no customer can reach.`
  );
}

/** May this track leave Ship? */
export function shipMayLeave(f: ReleaseFacts): ShipExit {
  /*
   * A READ THAT FAILED IS NOT PERMISSION. It is also not a refusal that should
   * park a track on a person: `hold: null` leaves the ordinary path to decide,
   * which is the same rule `newestChangesetForTrack` follows -- a read we could
   * not make is not evidence about the work.
   */
  if (!f.known) {
    return { leave: false, hold: null, because: "What this released could not be read." };
  }
  if (f.liveInProduction) {
    return { leave: true, because: "A production deploy is on the record." };
  }
  if (f.handedBack) {
    return { leave: true, because: "A person recorded that this shipped." };
  }
  if (f.declinedBecause) {
    return {
      leave: false,
      hold: "waiting-on-a-person",
      because: declinedLine(f.declinedBecause),
    };
  }
  return {
    leave: false,
    hold: null,
    because: "Nothing is live for this work yet, so Ship is not finished.",
  };
}

/**
 * May Learn start?
 *
 * The same question from the other side, and it is asked separately on purpose.
 * Ship's exit can be bypassed -- a person can rewind a track, a route can waive
 * a station -- and Learn grading an unshipped change is the harm either path
 * leads to. A grade is a claim about what happened in the world; there is
 * nothing in the world yet.
 */
export function learnMayStart(f: ReleaseFacts): { start: boolean; because: string } {
  if (!f.known) {
    /* Unlike Ship's exit, an unreadable record does NOT stop Learn. Learn is
       the end of the route and refusing it on a failed read would strand
       finished work with no way forward, which is worse than grading late. */
    return { start: true, because: "What this released could not be read." };
  }
  if (f.liveInProduction || f.handedBack) {
    return { start: true, because: "This shipped, so there is an outcome to grade." };
  }
  return {
    start: false,
    because:
      "Nothing has shipped for this work, so there is no outcome to grade yet. " +
      "A forecast graded against a change nobody can use is a claim about nothing.",
  };
}
