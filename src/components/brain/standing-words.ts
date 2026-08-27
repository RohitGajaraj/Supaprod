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

/** Said when the workspace has approved nothing, with however many drafts wait. */
export function nothingStandingYet(pending: number): string {
  if (pending <= 0) {
    return "Nothing standing yet. The steward reads validated outcomes each week and proposes a rule when the same lesson turns up twice.";
  }
  const what = pending === 1 ? "a rule" : `${pending} rules`;
  const they = pending === 1 ? "it is" : "they are";
  return `Nothing standing yet. The steward has written ${what} out of what shipped, and ${they} waiting on a human.`;
}
