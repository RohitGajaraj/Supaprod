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
import type { ApprovalFilter, ApprovalKind } from "@/lib/approvals-queue.functions";

/**
 * Singular and plural, in the words a person would use out loud.
 *
 * ── TWO OF THESE WERE STILL THE SCHEMA'S WORDS (2026-09-14) ────────────────
 * The rule above is right and two entries did not meet it. `design_gate` read
 * "design gate" and `assumption_challenge` read "assumption challenge" -- both
 * are the column value with the underscore taken out, and neither is a phrase a
 * founder says out loud. Read live on the served entry, they composed the
 * product's largest sentence: *"20 design gates and 33 other calls are waiting
 * for you."* A *gate* is this system's own mechanism noun (it is what the
 * driver calls a paused tool call), and a *challenge* names the machine's
 * activity rather than the person's job.
 *
 * What the person is actually being asked to do is sign off a design, and
 * re-check an assumption that new evidence contradicts. Named as the ask, the
 * same sentence reads *"20 designs to sign off and 33 other decisions"*, which
 * a stranger can act on without learning anything about how this product is
 * built. The KIND is untouched -- only the words are.
 */
const NAMES: Record<ApprovalKind, [one: string, many: string]> = {
  design_gate: ["design to sign off", "designs to sign off"],
  assumption_challenge: ["assumption to re-check", "assumptions to re-check"],
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
 * ONE PASS, BOTH PARTITIONS (P-129, A-QUEUE.md). Served Waiting, 12:14 IST
 * 09-04: the heading's own families summed to 53 while the filter row's
 * own tabs summed to 52, and a minute later the pair disagreed again by a
 * different amount. The heading was built from `visibleItems` -- the
 * ACTIVE FILTER's own slice -- while every tab's count was built from
 * `allItems`, the whole queue. Two different lists, asked to describe
 * either the same thing or two DIFFERENT things depending on which filter
 * happened to be active, and nothing forced them to agree.
 *
 * The fix is not a reconciliation step; it is refusing to have two lists at
 * all. Both the heading (via `queueShape`, keyed on `kindKey`) and the tabs
 * (via this function, keyed on `filterBucket`) must be called with the SAME
 * array -- the whole queue, `allItems`, never the active filter's slice, so
 * the heading keeps describing the whole workload no matter which tab is
 * open. `all` is that array's own length; every other key is how many of
 * its items carry that `filterBucket`, so the parts can never outrun the
 * whole by construction.
 */
export function queueCounts(
  items: readonly { filterBucket: Exclude<ApprovalFilter, "all"> }[],
): Record<ApprovalFilter, number> {
  const c: Record<ApprovalFilter, number> = {
    all: items.length,
    proposals: 0,
    gates: 0,
    memory: 0,
    spend: 0,
  };
  for (const it of items) c[it.filterBucket] += 1;
  return c;
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
  /*
   * ── A SHAPE IS NOT A TOTAL, AND IT IS NOT AN INVENTORY EITHER ────────────
   *
   * This joined every family with commas, and on the founder's own queue that
   * produced, in the page's largest type, 143 characters and seven clauses:
   *
   *   "20 design gates, 12 assumption challenges, 9 decisions, 4 house rules,
   *    3 agent actions, 3 opportunities and 2 memory notes waiting for you."
   *
   * The home's hero reads THE SAME ROWS through THE SAME `queueShape` and says
   * "20 design gates and 33 other calls are waiting for you." Two surfaces,
   * one function, one queue, and one sentence a person can hold against one
   * they cannot. (Found by Lane 1 walking the Inbox, 2026-09-09.)
   *
   * This file's own name carries the rule and the enumeration broke it: name
   * the largest family, count the rest. The breakdown is not lost -- the filter
   * row under this heading carries every family with its own count, built from
   * the same `allItems` by `queueCounts` so the two cannot disagree, and it
   * carries them as a row of pressable tabs, which is better than prose at
   * exactly this job.
   *
   * THE WORDS ARE THE HERO'S, DELIBERATELY. Round five kept finding two
   * surfaces describing one fact differently; matching the sentence is the
   * cheapest way for these two never to again.
   */
  const biggest = shape[0]!;
  const total = shape.reduce((n, f) => n + f.n, 0);
  const others = total - biggest.n;
  const list =
    others > 0
      ? `${biggest.label} and ${others} ${others === 1 ? "other call is" : "other calls are"}`
      : `${biggest.label} ${biggest.n === 1 ? "is" : "are"}`;
  // "Waiting for you" and not "ready for you": these are things a person has not
  // reached, and the page's own note prefers the verb that owes them nothing.
  return floor ? `At least ${list} waiting for you.` : `${list} waiting for you.`;
}
