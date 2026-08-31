import type { BoundaryEvent } from "@/lib/boundary-ledger";

/**
 * HOW A BOUNDARY CROSSING IS LABELLED, AND WHAT THE RECORD IS ALLOWED TO CLAIM.
 *
 * ── WHY THIS IS ITS OWN MODULE ────────────────────────────────────────────
 * Same reason as `ceiling-reality.ts`, `where-the-crew-stands.ts` and
 * `who-chose-this.ts` beside it: it is pure, it decides what a person reads, and
 * the repo's convention is that pure logic gets a `bun test` rather than a
 * mocked render. It lived inside `BoundaryControls.tsx`, whose module scope
 * pulls six server functions, so testing it there meant mocking the page to
 * assert one sentence.
 *
 * ── THE CLAIM THIS EXISTS TO KEEP HONEST (gap #19, §3 H) ──────────────────
 * The page labelled every settled crossing "You allowed it" or "You said no".
 * `agent_approvals.decided_by` is NULL on 18 of 176 answered approvals, so on
 * 10% of rows that "You" is an attribution the data does not support.
 *
 * The important half was measured before any of this was written, because the
 * alarming reading turned out to be the false one: `decided_by <> user_id`
 * returns **0**, so no decision is being credited to the wrong person. It is an
 * UNSUPPORTED attribution rather than a misattribution. Smaller wrong, still the
 * wrong kind on the one surface in this product that functions as an audit
 * trail.
 *
 * ── WHY ONLY TWO OF THE FIVE BRANCH ───────────────────────────────────────
 * `expired` and `blocked` already say nobody answered, and a rule hit carries a
 * null decider BY CONSTRUCTION. Weakening those would print "we do not know who"
 * about a case where there is correctly nobody to know, which is a different
 * false statement rather than a fix. `waiting` has not been decided at all.
 */

/**
 * The words Meridian's `Value` may wear. Kept as a literal here so this module
 * stays free of React; `BoundaryControls` derives the real union from the
 * component and asserts this one is assignable to it, so a change to Meridian
 * fails the build rather than shipping a tone nothing paints.
 *
 * NOT `warn`. My first draft of this list invented it and dropped `agent`, and
 * the assertion in `BoundaryControls` caught both on the first typecheck, which
 * is the entire reason that line exists rather than a comment asking people to
 * remember. The file this was lifted from already said so in its own words:
 * declined and expired "were once `warn`, which Meridian does not have".
 */
export type RecordTone = "pass" | "fail" | "quiet" | "hold" | "agent";

export type CrossingLabel = {
  /** The status word. Short by contract: it renders inside `Value`. */
  text: string;
  tone: RecordTone;
  /**
   * The qualifier, or null when the row needs none.
   *
   * SEPARATE FROM `text` ON PURPOSE. "Allowed, and the record does not name who"
   * inside a `Value` wraps a status chip into a paragraph. The caller joins this
   * onto the row's sub-line, beside the rest of what is known about the row,
   * which is where somebody reading a trail is already looking.
   */
  caveat: string | null;
};

/** Whether this outcome is one a PERSON answers, and therefore one that can be
 *  missing an answerer. The other three are decided by a rule or by a clock. */
export function aPersonAnsweredThis(outcome: BoundaryEvent["outcome"]): boolean {
  return outcome === "allowed" || outcome === "declined";
}

export function crossingLabel(e: Pick<BoundaryEvent, "outcome" | "decidedBy">): CrossingLabel {
  const unattributed = aPersonAnsweredThis(e.outcome) && !e.decidedBy;
  const caveat = unattributed ? "who answered is not on the record" : null;

  switch (e.outcome) {
    case "allowed":
      return { text: e.decidedBy ? "You allowed it" : "Allowed", tone: "pass", caveat };
    case "declined":
      return { text: e.decidedBy ? "You said no" : "Declined", tone: "quiet", caveat };
    case "expired":
      return { text: "Ran out of time", tone: "quiet", caveat: null };
    case "blocked":
      return { text: "Stopped by a rule", tone: "fail", caveat: null };
    default:
      return { text: "Waiting on you", tone: "quiet", caveat: null };
  }
}
