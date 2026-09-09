import { APPROVAL_KINDS, type ApprovalKind } from "@/lib/approvals-queue.functions";

/**
 * WHAT YOUR VERDICT CAUSED, in the past tense, per family.
 *
 * ── THE DEFECT THIS EXISTS TO CLOSE ─────────────────────────────────────────
 * `SettledTrail`'s own docstring states the ruling it was built to satisfy
 * (agents/FINAL-agent-presence.md R10): *"A toast confirms that your click
 * REGISTERED; this renders what your click CAUSED."* The trail was then fed
 * `item.approveConsequence`, which is the **label under the Approve button on
 * the pending card**. So the record of a completed judgement read:
 *
 *     You approved   Approve · unblocks Build for this spec   2:14 PM
 *
 * An imperative, in the present tense, still offering the choice you had just
 * made, with the card's own bullet separator dragged into prose, printed one
 * word after "You approved". The surface whose entire job is to prove your
 * judgement left a mark was quoting the control you pressed.
 *
 * ── AND THE SENTENCES FOR IT WERE ALREADY WRITTEN, AND UNREACHABLE ──────────
 * The route held a `SETTLED_APPROVE` map of ten past-tense sentences -- "Spec
 * approved. It becomes precedent.", "Kept. It moves to Now on the roadmap." --
 * behind `item.approveConsequence ?? SETTLED_APPROVE[kind]`. `approveConsequence`
 * is a non-optional `string` on `ApprovalItem` and all ten families set it, so
 * the `??` never fell through and **not one of those sentences had ever
 * rendered.** Somebody did this work and an operator order discarded it.
 *
 * ── WHY NO TEST CAUGHT IT, WHICH IS THE PART WORTH REMEMBERING ──────────────
 * `decideSettledLine` HAS a suite. Its fixture is
 *
 *     { id, sourceId, kindKey, title, timestamp } as ApprovalQueueItem
 *
 * -- a partial object cast through the type, carrying no `approveConsequence`,
 * because the cast made the compiler stop asking. So every assertion ran down
 * the fallback branch that production never takes, and the branch production
 * always takes was never once executed. A cast fixture does not merely fail to
 * cover a branch; it silently covers the WRONG one and reports green.
 *
 * ── WHAT THESE SAY THAT THE CONTROL LABELS CANNOT ───────────────────────────
 * A control label answers "what will this button do?" and is written in the
 * infinitive. A settled line answers "what did I just cause?" and is written in
 * the perfect. They are different sentences about the same fact and neither can
 * stand in for the other.
 *
 * Four of the ten old approve sentences were the bare word "Approved.", which
 * beside the verb "You approved" is the same word twice, eight pixels apart --
 * the restatement class S1 and I have been cutting across the run screen all
 * week. Those four are written out here.
 *
 * And every DECLINE in the product printed one string: "Declined. Noted for
 * next time." That is family `decision`'s real consequence -- its own control
 * label says "Reject · noted for next time" -- generalised to all ten. It is
 * simply false of most of them: declining a spec sends it back to draft,
 * declining a playbook retires it for good, declining a house rule discards the
 * rule. Ten outcomes, one sentence, on the surface where judgement is the
 * product.
 */

/** What approving caused. Perfect tense, and never the verb again. */
export const APPROVED: Record<ApprovalKind, string> = {
  /* "Approved." before. The agent asked to run something and may now run it;
     whether it still will is `gatesLiveWork`'s question, answered by the door
     below rather than by this sentence, which would otherwise have to hedge. */
  tool_call: "The agent may run it.",
  /* "Approved." before. `rejectConsequence` for this family is the one place
     the old blanket decline sentence was true, which is how it spread. */
  decision: "The decision stands on the record.",
  memory_candidate: "In. It guides the next call.",
  /* "Approved." before, against a control label reading "becomes a standing
     rule" -- the whole content, dropped. */
  house_rule: "It is a standing rule from now on.",
  /* "Approved." before. Deliberately not "the agent is autonomous": the grant
     is a step on a ladder, not a release from oversight. */
  trust_graduation: "That agent needs you for less from here.",
  spec: "It becomes precedent for what comes after.",
  opportunity: "Kept. It moves to Now on the roadmap.",
  assumption_challenge: "The decision is open for review again.",
  design_gate: "This spec can now dispatch to Build.",
  playbook_proposal: "The method is adopted.",
};

/** What declining caused. Ten families, ten outcomes. */
export const DECLINED: Record<ApprovalKind, string> = {
  tool_call: "The agent stands down and will not run it.",
  decision: "Noted for next time.",
  memory_candidate: "Nothing changes. It will not guide the next call.",
  house_rule: "The rule is discarded.",
  trust_graduation: "That agent keeps the reach it had.",
  spec: "It goes back to draft.",
  opportunity: "Dropped from the backlog.",
  assumption_challenge: "The decision keeps standing as decided.",
  design_gate: "The gate stays closed.",
  playbook_proposal: "Retired for good. It will not be proposed again.",
};

/**
 * THE DOOR OUT OF THE INBOX AND INTO THE WORK (S1's fifth review, [0] and [7]).
 *
 * A call raised on a run reached the Inbox with no way back to it, so a person
 * could answer a gate and never watch the work carry on -- the layers not
 * stitching, from the one screen where the stitch is the whole point. The
 * pending card grew that door; the settled line, which is what remains on
 * screen the instant a judgement lands, did not.
 *
 * ── THE LEAD IS A CLAIM, SO IT IS SPLIT ON A FACT WE HOLD ───────────────────
 * "Watch it carry on" says the work is still moving. Measured on production
 * (`still-holds-work.ts`, the same field): of 29 pending gates, 14 sit on a
 * live run and 15 have no mission at all. On those 15 the phrase would be a
 * promise nothing in the read supports -- the exact class of claim this product
 * has been paying down all week -- so only `gatesLiveWork === true` earns it.
 *
 * `null` is NOT collapsed into either side, per that field's own docstring: it
 * means we could not say, and "the run it came from" is true whatever the
 * answer turns out to be.
 *
 * NO DOOR WITHOUT WORDS. Both branches carry the run's title, on the rule the
 * pending card's door already states: an id behind a link reading "open the
 * run" names nothing, and a door a person cannot recognise is not one they
 * press. A title we could not read yields no door at all.
 */
export type SettledDoor = { href: string; lead: string; title: string };

export function doorToTheRun(
  gatesLiveWork: boolean | null | undefined,
  run: { trackId: string | null | undefined; title: string | null | undefined } | null | undefined,
): SettledDoor | null {
  if (!run?.trackId || !run.title) return null;
  return {
    href: `/track/${run.trackId}`,
    lead: gatesLiveWork === true ? "Watch it carry on" : "The run it came from",
    title: run.title,
  };
}

/** Every family is spoken for, so a new one cannot ship speechless. */
export const EVERY_KIND_IS_ANSWERED = APPROVAL_KINDS.every(
  (k) => Boolean(APPROVED[k]) && Boolean(DECLINED[k]),
);
