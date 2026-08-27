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

/**
 * Every place an AGENT-DRAFTED decision is written. The last assertion in this
 * file keeps the list honest by walking src/ for any other writer.
 *
 * THIS LIST WAS TOO SHORT FOR TEN DAYS, and the way it was too short is the
 * lesson. It held only the two mission writers, because it was derived by
 * grepping one literal — `source_kind: "mission"`. `decision.record`
 * (lib/ai/tools/registry.server.ts) shipped on 2026-08-01 stamping
 * `source_kind: "agent"` and hard-coding `status: "approved"`, and every check
 * in this file walked straight past it: the per-file loop only visits files
 * already in this array, and the catch-all scan below was looking for the
 * wrong string. A guard scoped to one spelling of the thing it guards is a
 * guard against that spelling, not against the defect.
 *
 * So the scan is keyed on KINDS below rather than on a single literal, and a
 * new agent-drafted origin has to be added there deliberately.
 */
const WRITE_POINTS = [
  "lib/ai/handoff.server.ts",
  "routes/api/public/hooks/trigger-tick.ts",
  "lib/ai/tools/registry.server.ts",
] as const;

/**
 * The `decisions.source_kind` values that mean "an agent drafted this".
 *
 * Deliberately NOT every value in DECISION_SOURCES: 'manual' is a person's own
 * call and gate 2 refuses it by design, and the artifact origins ('prd',
 * 'roadmap', 'meeting'…) are written by paths where a human is already in the
 * loop. These two are the ones where an agent decides and writes unattended,
 * which is exactly the set the gate has to sit on.
 */
const AGENT_DRAFTED_KINDS = ["mission", "agent"] as const;

describe("the decision gate is wired, not merely written", () => {
  it("reads the write points", () => {
    for (const f of WRITE_POINTS) expect(read(f).length).toBeGreaterThan(500);
  });

  for (const f of WRITE_POINTS) {
    it(`${f} decides the status instead of asserting one`, () => {
      const src = stripComments(read(f));
      expect(src).toContain("decideDecisionReview(");
      /*
       * WIDENED 2026-08-26 from the literal `status: gate.status`, because
       * `decision.record` now overrides a gate "approved" to "declined" when the
       * crew passes `call: "do-not-build"` — a refusal, which `decisions.status`
       * previously had no value for and which the spine therefore read as a go.
       *
       * The rule this test is named for is unchanged and still checked: the
       * status must DERIVE from the gate. What it may not be is a bare literal,
       * which is the thing that made an auto-approval unauditable. So it asserts
       * the gate is the source and that no constant is assigned instead.
       */
      expect(src).toContain("gate.status");
      expect(src).not.toMatch(/status: "(approved|pending)",/);
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

  it("no OTHER file emits an agent-drafted decision behind the gate's back", () => {
    // The gate is only a policy if it sits on every door. A writer stamping any
    // agent-drafted source_kind would reopen the queue one row at a time and
    // nothing else in the suite would notice — which is precisely what
    // `decision.record` did between 2026-08-01 and 2026-08-11, while this test
    // was green, because it was checking one literal instead of the set.
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
        for (const kind of AGENT_DRAFTED_KINDS) {
          if (src.includes(`source_kind: "${kind}"`)) offenders.push(`${rel} (${kind})`);
        }
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
