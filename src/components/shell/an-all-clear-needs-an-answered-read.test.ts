import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * NO SURFACE MAY SAY "NOTHING" ON BEHALF OF A READ THAT DID NOT ANSWER.
 *
 * ── THE CLASS, WHICH THIS REPO KEEPS PAYING FOR ────────────────────────────
 * Three shapes of the same defect were live on 2026-08-27, all found in one
 * sweep, none visible in a screenshot because each one renders as a calm
 * screen:
 *
 *   1. The shell's live line guarded `missions.isError` while the sentence it
 *      protects counts TWO reads — `running` from missions and `movingRuns`
 *      from the tracks feed (`openTracks` until P-18, `moving` since — both
 *      are still guarded). A refused tracks read fell through to the literal
 *      "Ready for the first run". The guard was checking the wrong query.
 *   2. `AgentRelay` drew "All quiet. Nothing needs you right now." whenever
 *      `q.data` was undefined, which is true of an idle workspace, a read
 *      still in flight, and a read that REFUSED. One sentence, three
 *      situations, and the third is a confident all-clear produced by a fault.
 *   3. Upstream of both, `listTracks` used to return `[]` on error, so a
 *      refusal and an empty workspace were literally the same value. S0 fixed
 *      that at 042a47952, which is what makes the client-side guards below
 *      able to see anything at all.
 *
 * ── WHY THIS IS ASSERTED IN SOURCE ─────────────────────────────────────────
 * The honest test would render each component with a failing query and read
 * the DOM. These two live inside the shell and a relay strip, both of which
 * need a router, a query client, a workspace provider and a server-fn runtime;
 * standing all four up would test the harness more than the rule. The
 * PROPERTY here is structural — a guard exists and precedes the claim — and
 * `today-states-its-wait.test.ts` already establishes reading a route's source
 * to pin a contract that lives in its shape.
 *
 * The cost is stated plainly: this asserts the guard is WRITTEN, not that the
 * pixels are right. It stops the specific regression, which is a future edit
 * dropping one of the two reads from a condition, or moving the all-clear
 * above the branch that earns it.
 */

/**
 * Source with comments removed.
 *
 * NOT OPTIONAL, and the first version of this file proved it. Both fixes carry
 * long comments that QUOTE the sentences being guarded, so a plain `indexOf`
 * for the claim found the prose describing it rather than the code, and the
 * ordering assertion failed against a file that was entirely correct. A guard
 * that reads comments is measuring the explanation, not the behaviour.
 */
const read = (p: string) =>
  readFileSync(join(import.meta.dir, p), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

describe("the shell's live line", () => {
  const SRC = read("AppFrame.tsx");

  it("guards BOTH reads its sentence counts, not just the first", () => {
    const memo = SRC.match(/const liveLead = React\.useMemo\(\(\) => \{([\s\S]*?)\n {2}\}/);
    expect(memo, "liveLead is no longer a useMemo with a statement body").not.toBeNull();
    const body = memo![1]!;

    // The claim at the end of the chain is the one that must not be reachable
    // from a failed read.
    expect(body).toContain('"Ready for the first run"');

    const guardAt = body.search(/if \(.*isError.*\)\s*return/s);
    expect(guardAt, "no failure guard at all in the live line").toBeGreaterThan(-1);
    expect(guardAt, "the all-clear is reachable before any failure is consulted").toBeLessThan(
      body.indexOf('"Ready for the first run"'),
    );

    // BOTH names, because the sentence counts both populations. `running`
    // comes from missions and `movingRuns` from `moving` (P-18); guarding one
    // leaves the other free to fail silently, which is exactly what shipped.
    const guard = body.slice(guardAt, body.indexOf("return", guardAt));
    expect(guard, "the live line no longer consults missions").toContain("missions.isError");
    expect(guard, "the live line no longer consults the moving-tracks read").toContain(
      "moving.isError",
    );
  });
  it("says nothing while any read the sentence stands on is still out", () => {
    /*
     * CAUGHT ON A COLD LOAD OF THE SERVED HOME, 2026-09-09. The header printed
     * "Ready for the first run" with the workspace name still blank: missions
     * and the seats had answered empty in the first beat, and the guard named
     * only those two, so the line fell through to the first-run invitation
     * while `openTracks` was still in flight. F-217 had made that read
     * load-bearing the same morning, since the idle fact is the newest OPEN
     * RUN when one moved after the last finish, and the guard was not widened
     * with it. A guard naming a subset of the reads its sentence stands on is
     * not a guard.
     */
    const memo = SRC.match(/const liveLead = React\.useMemo\(\(\) => \{([\s\S]*?)\n {2}\}/);
    expect(memo).not.toBeNull();
    const body = memo![1]!;
    const at = body.search(/if \(missions\.isLoading[\s\S]{0,160}?return null;/);
    expect(at, "no loading guard in the live line").toBeGreaterThan(-1);
    const guard = body.slice(at, at + 240);
    for (const read of ["missions.isLoading", "runningNow.isLoading", "openTracks.isLoading"]) {
      expect({ read, guarded: guard.includes(read) }).toEqual({ read, guarded: true });
    }
    expect(at).toBeLessThan(body.indexOf('"Ready for the first run"'));
  });
});

describe("the home's hero", () => {
  const SRC = read("../start/Hero.tsx");

  it("earns its all-clear: a null queue count is unread, never zero", () => {
    /* Fourth review, 2026-09-09: `input.waiting ?? 0` turned a refused or
       unanswered queue read into "Nothing you started is waiting on you."
       The guard is the null check, and it must come before the claim. */
    const claimAt = SRC.indexOf("Nothing you started is waiting on you.");
    expect(claimAt, "the all-clear sentence is gone; re-point this test").toBeGreaterThan(-1);

    const unreadAt = SRC.indexOf("input.waiting == null");
    expect(unreadAt, "the hero no longer tells an unread queue from an empty one").toBeGreaterThan(
      -1,
    );
    expect(unreadAt).toBeLessThan(claimAt);

    // The claim is drawn only when `unread` is false, on the branch the
    // binding gates.
    const tail = SRC.slice(unreadAt, claimAt);
    expect(tail).toContain("unread");
  });
});

describe("the relay strip", () => {
  const SRC = read("../agents/AgentRelay.tsx");

  it("earns its all-clear: failure speaks, an unanswered read stays silent", () => {
    const claimAt = SRC.indexOf("All quiet.");
    expect(claimAt, "the all-clear sentence is gone; re-point this test").toBeGreaterThan(-1);

    const errAt = SRC.indexOf("q.isError");
    const noDataAt = SRC.search(/if \(!q\.data\)\s*return/);
    expect(errAt, "a refused read no longer says anything").toBeGreaterThan(-1);
    expect(noDataAt, "an unanswered read is no longer held back").toBeGreaterThan(-1);

    // Both must come BEFORE the all-clear, or the sentence is reachable from a
    // read that cannot support it.
    expect(errAt).toBeLessThan(claimAt);
    expect(noDataAt).toBeLessThan(claimAt);
  });
});
