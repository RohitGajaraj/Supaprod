import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * EVERY EXIT FROM THE SETTLE GATE WROTE A PERMANENT VERDICT.
 *
 * `learnings.verdict` is constrained on the live database to exactly
 * `validated | missed | mixed` (verified 2026-08-06 against pg_constraint).
 * Three judgments, no fourth door. So a person looking at a bet that shipped
 * last week -- or one whose metric has not moved because nothing could have
 * moved it yet -- had to pick one of three permanent answers or walk away from
 * the queue and leave it sitting there.
 *
 * WHY THIS IS A MOAT DEFECT, NOT A UI GAP. These rows ARE the precedent pool.
 * `getFocusNext` and the Decide ranking read settled outcomes to re-rank the
 * next call. Recording "it did not work" about a bet that has not had time to
 * work teaches the brain something false, and the product's entire claim is that
 * it learns from this record and guides the next decision. A wrong verdict here
 * does not sit still; it compounds.
 *
 * THE FIX IS NOT A FOURTH VERDICT. Adding `too_early` to the constraint would put
 * a value in the pool that every consumer must remember to filter -- the exact
 * shape of the `is_sample` defect this repo has now paid for twice. The product
 * already models "come back later": `listPendingOutcomes` builds the desk from
 * shipped-and-unsettled specs UNION launch plans whose `check_by` has arrived, so
 * a `check_by` in the future already means not yet due.
 *
 * AND THE CAPABILITY ALREADY EXISTED. `rearmOutcomeCheck` is validated,
 * error-checked, and its only door was on `LaunchPlanPanel` -- a DIFFERENT
 * surface. That is precisely why the station audited as unable to finish its own
 * job: the answer existed and Learn could not reach it.
 */

const ROOT = join(import.meta.dir, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

/**
 * COMMENTS STRIPPED BEFORE ASSERTING. This is the FOURTH time in one session a
 * grep test in this repo matched its own explanatory prose -- here the panel's
 * comment says why it does NOT use `rearmOutcomeCheck`, and the assertion that
 * it is absent found the word in that sentence. The others:
 * `build-completes-the-round-trip`, `derive-tick`, and a `github_issue_url`
 * grep on 2026-08-05. The rule is simple and I keep relearning it: a test that
 * documents a bad pattern in prose must read CODE ONLY.
 */
const stripComments = (src: string) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((l) => !l.trim().startsWith("//"))
    .join("\n");

const PANEL = stripComments(read(join("components", "learn", "SettlePanel.tsx")));
const LAUNCH = read(join("lib", "launch-plan.functions.ts"));
const OUTCOME = read(join("lib", "outcome.functions.ts"));
/** `listPendingOutcomes` and the `readPendingOutcomes` core it calls, code
 *  only and bounded at the next export, for the
 *  assertions that COUNT occurrences. Counting on raw source counts the prose
 *  that explains the pattern as well as the pattern, which is the same trap the
 *  stripComments note above was written for. */
const QUEUE_CODE = (() => {
  const code = stripComments(OUTCOME);
  const from = code.indexOf("export const listPendingOutcomes");
  const to = code.indexOf("export const listAgentSettledOutcomes");
  return code.slice(from, to > from ? to : undefined);
})();

describe("Learn can dispose of a bet without judging it", () => {
  it("offers the third answer on the gate", () => {
    expect(PANEL).toMatch(/Too early to tell/);
  });

  it("reuses the server function that already existed", () => {
    // A second function doing this would drift from the one LaunchPlanPanel
    // calls, and the two surfaces would disagree about what "come back later"
    // means.
    expect(PANEL).toMatch(/useServerFn\(deferOutcomeCheck\)/);
    // NOT launch-plan's rearm: that one ends in `.single()` and throws on zero
    // rows, and a launch plan is not guaranteed to exist for a shipped spec.
    expect(PANEL).not.toMatch(/rearmOutcomeCheck/);
  });

  it("writes NO verdict, which is the entire point", () => {
    // If this ever called recordOutcome it would be the defect wearing the fix's
    // label: a permanent judgment behind a button that promises not to make one.
    const defer = PANEL.slice(
      PANEL.indexOf("const defer = useMutation("),
      PANEL.indexOf("const settle = useMutation("),
    );
    expect(defer).toMatch(/fDefer\(\{ data: \{ prdId: v\.target\.prdId, days: 14 \} \}\)/);
    expect(defer).not.toMatch(/fRecord|recordOutcome|verdict:/);
  });

  it("does not claim the ranking moved, because it did not", () => {
    // The settle path invalidates learnings, the impact ledger and opportunities
    // because those genuinely changed. Deferring changes only the desk. Claiming
    // otherwise would be the same dishonesty one layer down.
    const defer = PANEL.slice(
      PANEL.indexOf("const defer = useMutation("),
      PANEL.indexOf("const settle = useMutation("),
    );
    expect(defer).toMatch(/queryKey: \["outcome-pending"\]/);
    for (const q of ["learnings", "impact-ledger", "opportunities"]) {
      expect({ q, claimed: defer.includes(`queryKey: ["${q}"]`) }).toEqual({ q, claimed: false });
    }
  });

  it("says when it comes back, rather than just disappearing", () => {
    // A bet that vanishes off the desk with no return date reads as dropped.
    const defer = PANEL.slice(
      PANEL.indexOf("const defer = useMutation("),
      PANEL.indexOf("const settle = useMutation("),
    );
    expect(defer).toMatch(/It comes\s*\n?\s*back to this desk on/);
    expect(defer).toMatch(/r\.checkBy/);
  });

  it("admits it when the date did not move", () => {
    // supabase-js resolves a refused write; the server fn checks error and
    // throws, and this must not swallow that into a success-shaped receipt.
    const defer = PANEL.slice(
      PANEL.indexOf("const defer = useMutation("),
      PANEL.indexOf("const settle = useMutation("),
    );
    expect(defer).toMatch(/onError/);
    expect(defer).toMatch(/failed: true/);
    expect(defer).toMatch(/still waiting on you/);
  });

  it("is offered only where it is honest — never over an existing verdict", () => {
    // Once an agent has settled it, the truthful moves are overturn or leave it.
    // "Not yet" on top of a written verdict would contradict the record.
    const actions = PANEL.slice(PANEL.indexOf("<Actions>"));
    expect(actions).toMatch(/\{!settledByAgent \? \([\s\S]{0,400}Too early to tell/);
  });
});

describe("the mechanism it rides is the one the desk already reads", () => {
  it("writes the SPEC, which always exists, not a launch plan which may not", () => {
    const fn = OUTCOME.slice(OUTCOME.indexOf("export const deferOutcomeCheck"));
    expect(fn.slice(0, 2600)).toMatch(/\.from\("prds"\)/);
    expect(fn.slice(0, 2600)).toMatch(/outcome_check_by: checkBy/);
  });

  it("checks the write landed, because supabase-js resolves a refusal", () => {
    // Without .select() and an empty-rows check this reports "you gave it more
    // time" over a bet still sitting on the desk, due now, exactly as before.
    const fn = OUTCOME.slice(OUTCOME.indexOf("export const deferOutcomeCheck"));
    expect(fn.slice(0, 2600)).toMatch(/\.select\("id"\)/);
    expect(fn.slice(0, 2600)).toMatch(/rows\.length === 0/);
    expect(fn.slice(0, 2600)).toMatch(/if \(error\) throw new Error\(error\.message\)/);
  });

  it("counts the deferrals, because a bet put off repeatedly is signal", () => {
    const fn = OUTCOME.slice(OUTCOME.indexOf("export const deferOutcomeCheck"));
    expect(fn.slice(0, 2600)).toMatch(/outcome_deferred_count: nextCount/);
  });

  it("and the desk genuinely honours the date, so deferring removes it", () => {
    // If the queue stopped reading it, the button would do nothing visible and
    // the bet would return on the next load -- teaching people it is broken.
    const q = OUTCOME.slice(OUTCOME.indexOf("export async function readPendingOutcomes"));
    expect(q.slice(0, 4000)).toMatch(/outcome_check_by\.lte\./);
  });

  it("keeps never-deferred specs on the desk, which is nearly all of them", () => {
    // THE LOUDEST WAY TO GET THIS WRONG. `outcome_check_by` is NULL for every
    // spec never deferred, and a bare `.lte()` drops NULLs in SQL -- emptying
    // the desk of everything EXCEPT previously deferred bets.
    const q = OUTCOME.slice(OUTCOME.indexOf("export async function readPendingOutcomes"));
    expect(q.slice(0, 4000)).toMatch(/outcome_check_by\.is\.null/);
  });

  it("honours it in EVERY population, not just the one it was written for", () => {
    /**
     * THE HALF THAT DID NOT LAND, and the two tests above passed straight over
     * it because a single match anywhere satisfied them.
     *
     * The desk is a union of two populations: specs that shipped and carry no
     * outcome, and specs whose `launch_plans.check_by` has passed. Only the
     * first read the deferral date. So a spec in both populations was excluded
     * by the first query and put straight back by the second, on the very next
     * refetch, while the receipt said "It comes back to this desk on
     * <date+14>". Not reachable on today's data (all 7 launch_plans carry the
     * same `check_by` and all 7 sit on already-settled specs), which is exactly
     * why a data-blind structural test is the one that catches it.
     *
     * Asserted as a RATIO rather than a count of two, so a third population
     * added later inherits the rule instead of quietly escaping it.
     */
    const q = QUEUE_CODE;
    // A population is a read that selects the spec columns. Since the desk
    // became two hops (a-pending-outcomes-read-is-2-hops.test.ts) the columns
    // are spliced into a select that also names the embeds, and the
    // window-closed population reads them THROUGH `launch_plans`, so the
    // anchor is the splice, not a bare `.select(PRD_COLS)`.
    const reads = (q.match(/\$\{PRD_COLS\}/g) ?? []).length;
    const clauses = (q.match(/outcome_check_by\.is\.null,outcome_check_by\.lte\./g) ?? []).length;
    expect({ reads, clauses }).toEqual({ reads, clauses: reads });
    expect(reads).toBeGreaterThanOrEqual(2);
  });
});
