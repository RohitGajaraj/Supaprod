/**
 * WHAT THE BRAIN SAYS WHEN NOTHING IS STANDING YET.
 *
 * The product's central claim is that the record learns and then guides: the
 * steward distils a rule out of validated outcomes, a human approves it, and it
 * goes into every agent's prompt before it acts. `house_rules` is where that
 * lives.
 *
 * MEASURED ON THE LIVE DATABASE, 2026-08-27: 26 rows across 9 workspaces, and
 * EVERY ONE IS `pending`. Not one has ever been approved. So the only thing
 * between the claim and being able to show it is that nobody has read them.
 *
 * THE SENTENCE SAID "A RULE". It read "The steward has written a rule out of
 * what shipped, and it is waiting on a human" whatever the count was, which
 * made twenty-six unattended decisions look like one. The button beside it
 * already carried the number; the sentence a person actually reads did not, and
 * the sentence is the half that decides whether they press the button.
 *
 * Pulled out of the component so the agreement is testable without mounting
 * anything, and so a non-component export does not sit in a file the fast
 * refresh rule watches.
 */

/**
 * Said when the workspace has approved nothing, with however many drafts wait.
 *
 * IT NAMES THE CONSEQUENCE BEFORE ASKING FOR THE DECISION, which it did not.
 * S0 traced why nobody had ever approved one: 15 of the 26 were the loop
 * describing its OWN failures ("the qa and builder agents consistently fail
 * when resolving database integrity issues"), and an approved rule goes
 * VERBATIM into every agent's system prompt. Approving one of those would have
 * told the builder, on every run, that the builder consistently fails. The
 * write now refuses that shape mechanically, so the queue is product knowledge
 * only.
 *
 * But the surface still sent a person to decide without telling them what a
 * yes DOES. A decision that changes how every agent behaves on every run is not
 * one to make from a button label, and the standing arm below already carries
 * this sentence for rules that are live. It belongs on the arm that asks for
 * the decision at least as much.
 */
export function nothingStandingYet(pending: number): string {
  if (pending <= 0) {
    return "Nothing standing yet. The steward reads validated outcomes each week and proposes a rule when the same lesson turns up twice.";
  }
  const what = pending === 1 ? "a rule" : `${pending} rules`;
  const they = pending === 1 ? "it is" : "they are";
  return `Nothing standing yet. The steward has written ${what} out of what shipped, and ${they} waiting on a human. Approving one puts it into every agent's prompt before it acts.`;
}

/**
 * WHY THE RATED COUNTS NEEDED THEIR OWN POPULATION.
 *
 * The recall line read "12,531 recalls on the record · 70 helped, 7
 * contradicted by what happened", three counts on one axis. A reader does the
 * only arithmetic available and gets 70 in 12,531, which is 0.6%, and concludes
 * the brain is surfacing memories nobody uses.
 *
 * That is not what the numbers mean. `memory_recall_log.outcome` DEFAULTS TO
 * `ignored` at insert (memory.server.ts) and is upgraded to `used` or
 * `contradicted` only when a human rates any event in the same trace
 * (feedback.functions.ts). So `ignored` is not a verdict that the memory was
 * passed over. It is the absence of a verdict.
 *
 * Measured on the live database, 2026-08-27: 12,531 recalls, 70 used, 7
 * contradicted, 12,454 still at the default. The true reading is that 91% of
 * the rated recalls helped and 99.4% of recalls were never rated at all, and
 * both of those are worth knowing. The old line said neither and implied
 * something false and gloomier than either.
 *
 * So the rated counts carry their own denominator. `helped + contradicted` IS
 * the rated total, exactly, because the third value means unrated -- no extra
 * query, and no chance of the two numbers being taken from different reads.
 */
export function ratedRecalls(helped: number, contradicted: number): number {
  return Math.max(0, helped) + Math.max(0, contradicted);
}

/** "77 of them rated" / "one of them rated", or null when none were. */
export function ratedPopulation(helped: number, contradicted: number): string | null {
  const rated = ratedRecalls(helped, contradicted);
  if (rated === 0) return null;
  return rated === 1 ? "one of them rated" : `${rated} of them rated`;
}

/**
 * NOTHING IN THE PRODUCT CAN RATE A RECALL, AND THE RATED COUNT IMPLIES
 * OTHERWISE.
 *
 * `ratedPopulation` above gives "77 of them rated" its denominator, which was
 * the fix for a misleading ratio. It left a second implication standing: that
 * rating is something that happens here.
 *
 * `submitFeedback` is the only writer of `memory_recall_log.outcome`. Its only
 * caller is `MessageMetaFooter` in components/chat. THAT COMPONENT IS MOUNTED
 * NOWHERE -- zero importers in src/ outside its own file.
 *
 * Measured on the live database, 2026-08-28: all 77 rated recalls fall between
 * 29 June and 23 July, and the last one was 23 July. Nothing since, because
 * nothing can.
 *
 * So the count is a closed window, and a person reading it is entitled to know
 * that rather than to wonder why their own runs never appear in it. This is the
 * same shape as the guardrail line: the silence has a cause, the cause is ours,
 * and saying so is what stops a reader inventing a worse explanation.
 *
 * IT DOES NOT SAY THE FEATURE IS BROKEN. The path is wired end to end -- a
 * rating bumps `importance`, and importance is in the recall RPC's own ORDER
 * BY, so a rating really would move what the crew reads first. What is missing
 * is the control. Naming the missing half precisely is the difference between a
 * bug report and a fact.
 */
export const RATING_HAS_NO_DOOR =
  "No surface offers this today, so the count is what was rated before the control was taken out.";
