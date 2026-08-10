import { describe, expect, it } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * A DECIDER NOBODY CALLS IS NOT A POLICY.
 *
 * This test exists because of a specific, recent, expensive failure in this
 * repo. `shouldGateForReview` (lib/confidence.ts) was written as the PC-11
 * convention for whether an agent-drafted artifact needs a human. It shipped
 * with a doc comment, a test file, three tiers — and ZERO callers. For as long
 * as it sat there it looked like the product had a review policy. It did not.
 * It had a function.
 *
 * `decideDecisionReview` is the same species of thing and would fail the same
 * way silently: unit tests over a pure function stay green forever while the
 * write points go on writing whatever literal they always wrote. Nothing in
 * tsc or in decision-gate.test.ts can see that, so it is checked here, in the
 * house source-scan style (routes/__tests__/trigger-dedup-halves.test.ts).
 *
 * If you are here because this test failed: the fix is to call the gate at the
 * write point, not to relax the test. A decision status written as a literal is
 * a policy decision made by whoever typed the string.
 */

const SRC = join(import.meta.dir, "..");
const read = (rel: string) => readFileSync(join(SRC, rel), "utf8");

/** Comments legitimately quote the old literals while explaining them. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/** The two places a mission emits a decision. Found by grepping
 *  `source_kind: "mission"`; the third assertion below keeps that list honest. */
const WRITE_POINTS = [
  "lib/ai/handoff.server.ts",
  "routes/api/public/hooks/trigger-tick.ts",
] as const;

describe("the decision gate is wired, not merely written", () => {
  it("reads the write points", () => {
    for (const f of WRITE_POINTS) expect(read(f).length).toBeGreaterThan(500);
  });

  for (const f of WRITE_POINTS) {
    it(`${f} decides the status instead of asserting one`, () => {
      const src = stripComments(read(f));
      expect(src).toContain("decideDecisionReview(");
      expect(src).toContain("status: gate.status");
    });

    it(`${f} records the auto-approval so a human can find and overturn it`, () => {
      expect(stripComments(read(f))).toContain("recordAutoApproval(");
    });

    it(`${f} never writes a decision status as a literal`, () => {
      const src = stripComments(read(f));
      // The exact shape of the defect: `status: "approved"` next to
      // `source_kind: "mission"` is an approval nobody decided and nobody can
      // audit. Mission/run statuses are a different column and are untouched.
      const start = src.indexOf('.from("decisions")');
      expect(start).toBeGreaterThan(-1);
      const block = src.slice(start);
      expect(block).not.toContain('status: "approved"');
      expect(block).not.toContain('status: "pending"');
    });
  }

  it("no OTHER file emits a mission decision behind the gate's back", () => {
    // The gate is only a policy if it sits on every door. A third writer
    // stamping source_kind "mission" would reopen the queue one row at a time
    // and nothing else in the suite would notice.
    const offenders: string[] = [];
    const walk = (dir: string): void => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) {
          if (name === "node_modules" || name === "__tests__") continue;
          walk(full);
          continue;
        }
        if (!name.endsWith(".ts") && !name.endsWith(".tsx")) continue;
        if (name.includes(".test.")) continue;
        const rel = full.slice(SRC.length + 1);
        if (WRITE_POINTS.includes(rel as (typeof WRITE_POINTS)[number])) continue;
        const src = stripComments(readFileSync(full, "utf8"));
        if (src.includes('source_kind: "mission"')) offenders.push(rel);
      }
    };
    walk(SRC);
    expect(offenders).toEqual([]);
  });
});

describe("the PC-11 convention has a caller at last", () => {
  it("shouldGateForReview is used somewhere that is not a test", () => {
    expect(stripComments(read("lib/decision-gate.ts"))).toContain("shouldGateForReview(");
  });
});
