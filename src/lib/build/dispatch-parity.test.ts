import { describe, expect, test } from "bun:test";
import { ardDispatchBlock, assembleBuilderGoal } from "../build.functions";
import type { ArdDocument } from "@/lib/ard-schema";

function clause(text: string, status: "standing" | "superseded" = "standing") {
  return {
    id: "00000000-0000-0000-0000-000000000000",
    text,
    status,
    superseded_by: null,
    oracle_kind: "ci" as const,
    oracle_ref: null,
    created_at: "2026-07-07T00:00:00.000Z",
  };
}

function makeContract(overrides: Record<string, unknown> = {}) {
  return {
    version: 1,
    intent: "Ship the thing",
    evidence_links: [],
    success_metrics: [clause("p95 under 200ms"), clause("drop me", "superseded")],
    non_goals: [],
    budget: null,
    ambiguity_policy: null,
    drafted_by: "agent",
    drafted_at: "2026-07-07T00:00:00.000Z",
    ...overrides,
  };
}

const PRD = {
  id: "11111111-1111-1111-1111-111111111111",
  title: "Test spec",
  contract: makeContract(),
};

function fencedJson(block: string): string {
  const m = block.match(/```json\n([\s\S]*)\n```/);
  if (!m) throw new Error("no fenced json block found");
  return m[1];
}

describe("ardDispatchBlock (mission 3.3: the Build Console fold matches the Studio fold)", () => {
  test("a spec with a compiled contract yields the delimited ARD block + standing criteria", () => {
    const ard = ardDispatchBlock(PRD);
    expect(ard).not.toBeNull();
    expect(ard!.block).toContain("THE CONTRACT (ARD v0.1), every clause carries its oracle");
    const doc = JSON.parse(fencedJson(ard!.block)) as ArdDocument;
    expect(doc.spec_id).toBe(PRD.id);
    expect(doc.spec_title).toBe(PRD.title);
    expect(doc.schema_url).toBe("/api/public/ard/schema");
    expect(doc.contract.intent).toBe("Ship the thing");
    // Standing clauses only become the acceptance bar; superseded ones do not.
    expect(ard!.acceptanceCriteria).toEqual(["p95 under 200ms"]);
  });

  test("all-superseded metrics: the block still rides, criteria stay null", () => {
    const ard = ardDispatchBlock({
      ...PRD,
      contract: makeContract({ success_metrics: [clause("old bar", "superseded")] }),
    });
    expect(ard).not.toBeNull();
    expect(ard!.acceptanceCriteria).toBeNull();
  });

  test("no usable contract yields null: missing, invalid, or blank intent", () => {
    expect(ardDispatchBlock(null)).toBeNull();
    expect(ardDispatchBlock({ ...PRD, contract: undefined })).toBeNull();
    expect(ardDispatchBlock({ ...PRD, contract: { not: "a contract" } })).toBeNull();
    expect(ardDispatchBlock({ ...PRD, contract: makeContract({ intent: "   " }) })).toBeNull();
  });
});

describe("assembleBuilderGoal (the Build Console dispatch payload IS the ARD)", () => {
  test("embeds the ARD block and acceptance criteria after the prose", () => {
    const goal = assembleBuilderGoal({
      issueNumber: 42,
      intent: "Add a rate limiter",
      prd: PRD,
      ard: ardDispatchBlock(PRD),
      referenceLinks: ["https://example.com/spec"],
    });
    // THE TOOL CHAIN CHANGED ON 2026-08-06 AND THIS ASSERTION FOLLOWED IT.
    // This used to require `idempotency_key="issue-42"`, which named the
    // `github.pr.open` path. The work order now tells the builder to stage,
    // commit and open the PR through Studio -- studio.stage, studio.commit,
    // studio.pr.open -- and to put "Closes #N" in the PR body so the merge
    // closes the issue. `build.functions.ts`'s own header records why: a Build
    // Console run no longer produces a github.pr.open tool_call at all, and
    // `studio_changesets` keyed on mission_id is what every mounted reader
    // already uses. What this test still guarantees is the thing that matters --
    // the work order names the issue it is closing and the chain it must use.
    expect(goal).toContain(`issue #42`);
    expect(goal).toMatch(/studio\.stage[\s\S]*studio\.commit[\s\S]*studio\.pr\.open/);
    expect(goal).toContain("Closes #42");
    expect(goal).toContain("User intent:\nAdd a rate limiter");
    expect(goal).toContain(`Linked spec: "${PRD.title}" (id ${PRD.id})`);
    // The machine-readable contract rides the work order, after the prose.
    const doc = JSON.parse(fencedJson(goal)) as ArdDocument;
    expect(doc.spec_id).toBe(PRD.id);
    expect(goal.indexOf("THE CONTRACT (ARD")).toBeGreaterThan(goal.indexOf("Linked spec:"));
    expect(goal).toContain("Acceptance criteria (every one must hold):\n- p95 under 200ms");
    expect(goal).toContain("References:\n- https://example.com/spec");
  });

  test("a spec without a contract dispatches prose only (no phantom contract)", () => {
    const prd = { id: PRD.id, title: PRD.title };
    const goal = assembleBuilderGoal({
      issueNumber: 7,
      intent: "Fix the flaky test",
      prd,
      ard: ardDispatchBlock(prd),
    });
    expect(goal).toContain(`Linked spec: "${PRD.title}"`);
    expect(goal).not.toContain("THE CONTRACT (ARD");
    expect(goal).not.toContain("Acceptance criteria");
  });

  test("no linked spec: the plain issue work order is unchanged", () => {
    const goal = assembleBuilderGoal({
      issueNumber: 9,
      intent: "Rename the button",
      prd: null,
      ard: null,
    });
    expect(goal).toContain("Pick up GitHub issue #9");
    expect(goal).not.toContain("Linked spec");
    expect(goal).not.toContain("THE CONTRACT (ARD");
  });
});

/**
 * THE DESIGN SECTIONS WERE THE 2026-08-06 FIX AND HAD NO TEST AT ALL.
 *
 * They used to reach the agent only inside the ARD's `design` key, and
 * `ardDispatchBlock` returns null before it looks at `design` when the spec has
 * no compiled Outcome Contract. Every one of the 41 approved specs carries
 * `contract = '{}'`, so the design station's output was computed and discarded
 * on 100% of Build Console dispatches. `assembleBuilderGoal` now carries the
 * prose sections independently, and these three tests pin the two halves of
 * that contract: what a spec WITH design gets, and what a spec with none gets.
 *
 * The second is the one that matters most and is the ordinary case.
 * Re-measured 2026-08-06: 13 of the 41 approved specs have no drawing, no flow
 * and no workspace design memory, so `formatDesignDispatchSections` hands this
 * function `[]`. An empty labelled heading would be worse than nothing — it is
 * the design station asserting it had nothing to say, and a builder told that
 * builds past a mockup it should have gone looking for. So the contract is that
 * `[]` is INDISTINGUISHABLE from absent, which is stronger and less brittle
 * than grepping the output for a heading that must not appear.
 */
describe("assembleBuilderGoal carries the design station independently of the ARD", () => {
  const MOCKUP = "THE MOCKUP FOR THIS SPEC (approved):\n```html\n<main/>\n```";

  test("a spec with no contract still carries the design sections", () => {
    const prd = { id: PRD.id, title: PRD.title };
    const goal = assembleBuilderGoal({
      issueNumber: 5,
      intent: "Build the screen",
      prd,
      ard: ardDispatchBlock(prd),
      designSections: [MOCKUP],
    });
    // No contract compiled, so no ARD -- and the mockup rides anyway.
    expect(goal).not.toContain("THE CONTRACT (ARD");
    expect(goal).toContain(MOCKUP);
    expect(goal.indexOf(MOCKUP)).toBeGreaterThan(goal.indexOf("Linked spec:"));
  });

  test("no design: an empty list is the same work order as none at all", () => {
    const prd = { id: PRD.id, title: PRD.title };
    const args = { issueNumber: 5, intent: "Build the screen", prd, ard: ardDispatchBlock(prd) };
    expect(assembleBuilderGoal({ ...args, designSections: [] })).toBe(assembleBuilderGoal(args));
  });

  test("with both, the design is read before the contract that grades it", () => {
    const goal = assembleBuilderGoal({
      issueNumber: 5,
      intent: "Build the screen",
      prd: PRD,
      ard: ardDispatchBlock(PRD),
      designSections: [MOCKUP],
    });
    expect(goal.indexOf(MOCKUP)).toBeLessThan(goal.indexOf("THE CONTRACT (ARD"));
  });
});
