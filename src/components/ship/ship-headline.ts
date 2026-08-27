/**
 * WHAT THE SHIP STATION SAYS AT THE TOP, WITHOUT CONTRADICTING THE GATE.
 *
 * ── WHAT WAS ON SCREEN ────────────────────────────────────────────────────
 * Photographed at 1440 against the live workspace:
 *
 *     Nothing is waiting to go out.
 *     1 release on the record, and it has not been announced.
 *
 *     [Waiting on you]
 *     "Batch firmware push scheduler" is still a draft.     [ Send for approval ]
 *
 * The headline and the gate are eight lines apart and they disagree. Something
 * plainly IS waiting to go out, and it is waiting on the person reading.
 *
 * ── WHY BOTH HALVES WERE CORRECT ──────────────────────────────────────────
 * The headline counted announcements with `status === "pending"` -- sent for
 * approval and awaiting a decision -- and there are none. The gate takes
 * `pending ?? draft`, so with nothing pending it falls to the draft. Each was
 * right about its own fact; neither could see the other's. That is the same
 * shape as three regions announcing one dead session, and as a `ReadFailed`
 * whose detail and children each answered separately.
 *
 * ── THE RULE ──────────────────────────────────────────────────────────────
 * A draft nobody has sent IS waiting to go out. It is waiting on the person
 * rather than on an approver, and saying so is the difference between a station
 * that reports its queue and one that tells you what needs you. The two states
 * are not merged into one count, because "waiting on an approver" and "waiting
 * on you" are different jobs and the second is the one a reader can act on.
 */

export type ShipWaiting = {
  /** Announcements sent for approval and not yet decided. */
  pending: number;
  /** Announcements still in draft, which nobody has sent. */
  drafts: number;
};

/**
 * The station's headline, or null while the counts are unknown.
 *
 * Null is deliberate and is the loading contract every other headline on this
 * product follows: a heading that cannot know its count says nothing rather
 * than guessing zero, because zero is a claim.
 */
export function shipHeadline(w: ShipWaiting | null | undefined): string | null {
  if (!w) return null;

  if (w.pending > 0) {
    return w.pending === 1
      ? "One announcement is waiting to go out."
      : `${w.pending} announcements are waiting to go out.`;
  }

  /*
   * NOTHING PENDING, BUT A DRAFT IS STILL SOMETHING WAITING. Named as waiting
   * on the reader, because that is the fact that makes it actionable and it is
   * what the gate below already says. A draft is not "nothing".
   */
  if (w.drafts > 0) {
    return w.drafts === 1
      ? "One announcement is waiting on you."
      : `${w.drafts} announcements are waiting on you.`;
  }

  return "Nothing is waiting to go out.";
}
