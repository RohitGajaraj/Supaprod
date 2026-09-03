/**
 * ── A QUEUE IS A SHAPE, NOT A TOTAL (P-56, from P-55's first finding) ─────
 *
 * The served Helio Labs approvals page said "66 decisions are ready for you"
 * and, below it, "65 pieces of work are stopped, waiting on you". Same rows:
 * `rest` is `visibleItems` minus the card already open, so the second number is
 * the first minus one, and a visitor totals them and reads 131 obligations
 * where there are 66. The shell and `/today` were fixed for this exact defect
 * on 2026-08-21 (`AppFrame.tsx:1206`); this surface, the one the shell counts
 * FOR, never got it.
 *
 * ── AND WHY THE TOTAL GOES EVEN AFTER IT IS SAID ONCE ────────────────────
 *
 * "66 decisions are ready for you" is a wall. Measured on production
 * 2026-09-03, those 66 are: 35 design gates, 10 assumption challenges, 8
 * decisions, 4 agent actions, 4 house rules, 3 opportunities, 2 memory notes --
 * and three families with nothing in them at all. A person told "66" learns
 * only that they are behind. A person told "35 design gates" knows where to
 * start, and that one afternoon on one family clears half of it.
 *
 * The count is not hidden: it is the sum of what is named, and every part is on
 * screen. What is removed is the number a person cannot act on.
 *
 * ── THE NAMES ARE THE PERSON'S, NOT THE SCHEMA'S (law 6.4) ───────────────
 *
 * `design_gate` is "design gates"; `tool_call` is "agent actions", never "tool
 * calls", because the tool is ours and the action is theirs. `trust_graduation`
 * is "standing permissions", which is what granting one does.
 */
import type { ApprovalKind } from "@/lib/approvals-queue.functions";

/** Singular and plural, in the words a person would use out loud. */
const NAMES: Record<ApprovalKind, [one: string, many: string]> = {
  design_gate: ["design gate", "design gates"],
  assumption_challenge: ["assumption challenge", "assumption challenges"],
  decision: ["decision", "decisions"],
  tool_call: ["agent action", "agent actions"],
  house_rule: ["house rule", "house rules"],
  opportunity: ["opportunity", "opportunities"],
  memory_candidate: ["memory note", "memory notes"],
  spec: ["spec", "specs"],
  playbook_proposal: ["playbook", "playbooks"],
  trust_graduation: ["standing permission", "standing permissions"],
};

export type FamilyCount = { kind: ApprovalKind; n: number; label: string };

/**
 * The families present, largest first, zeros omitted.
 *
 * Ties break on the family's own name so the order is stable between renders.
 * A queue whose sections reshuffle on every poll is unreadable, and the counts
 * change often enough for that to be a real effect rather than a hypothetical.
 */
export function queueShape(kinds: readonly ApprovalKind[]): FamilyCount[] {
  const counts = new Map<ApprovalKind, number>();
  for (const k of kinds) counts.set(k, (counts.get(k) ?? 0) + 1);

  return (
    [...counts.entries()]
      .filter(([, n]) => n > 0)
      .map(([kind, n]) => {
        const name = NAMES[kind];
        // An unmapped family is a real possibility when a new kind reaches this
        // page before this file does. It is counted and named generically rather
        // than dropped: a queue that silently omits a family is the defect this
        // page already had once, in `design_gate`.
        const [one, many] = name ?? ["item", "items"];
        const noun = n === 1 ? one : many;
        return { kind, n, noun, label: `${n} ${noun}` };
      })
      // Ties break on the WORD, not the schema key. Both are stable; only one is
      // the order a reader can predict, and `tool_call` sorting after `house_rule`
      // while "agent actions" sorts before "house rules" is a seam the schema name
      // would have put on the screen.
      .sort((a, b) => (b.n !== a.n ? b.n - a.n : a.noun.localeCompare(b.noun)))
      .map(({ kind, n, label }) => ({ kind, n, label }))
  );
}

/**
 * The heading sentence.
 *
 * `floor` is the capped-read case: a family standing exactly on `FAMILY_LIMIT`
 * has almost certainly been cut, so the sentence says "at least" and never
 * states a shape as if it were complete.
 *
 * Long tails are NOT truncated. Every family on the page is named, because the
 * whole point is that a person can see where the work is; hiding the small ones
 * behind "and 4 more" would put a number back that they cannot act on.
 */
export function shapeSentence(shape: FamilyCount[], floor: boolean): string {
  if (shape.length === 0) return "";
  const parts = shape.map((f) => f.label);
  const list =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  // "Waiting for you" and not "ready for you": these are things a person has not
  // reached, and the page's own note prefers the verb that owes them nothing.
  return floor ? `At least ${list} waiting for you.` : `${list} waiting for you.`;
}
