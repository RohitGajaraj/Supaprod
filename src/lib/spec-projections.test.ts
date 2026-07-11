import { describe, it, expect } from "bun:test";
import {
  assessDrift,
  composeSpecProjections,
  renderProjectionMarkdown,
  PROJECTION_KINDS,
  type SpecProjectionInput,
  type SpecProjectionKind,
} from "./spec-projections";
import type { OutcomeContract, ContractClause } from "@/lib/discovery.functions";

function clause(text: string, over: Partial<ContractClause> = {}): ContractClause {
  return {
    id: "00000000-0000-0000-0000-000000000000",
    text,
    status: "standing",
    superseded_by: null,
    oracle_kind: null,
    oracle_ref: null,
    created_at: "2026-06-01T00:00:00Z",
    ...over,
  };
}

function contract(over: Partial<OutcomeContract> = {}): OutcomeContract {
  return {
    version: 2,
    intent: "Cut cart abandonment by moving checkout to a single page.",
    evidence_links: [{ source_kind: "signal", source_id: "sig-1", title: "Checkout drop-off" }],
    success_metrics: [
      clause("Cart completion improves by 10%", { oracle_kind: "eval", oracle_ref: "eval-1" }),
      clause("Address step no longer leaks 18% of carts"),
    ],
    non_goals: [clause("Redesigning the payment provider integration")],
    budget: { estimate: "2 engineer-weeks", blast_radius: "Checkout route only" },
    ambiguity_policy: "When unsure, prefer the shorter flow and log the assumption.",
    drafted_by: "human",
    drafted_at: "2026-06-10T00:00:00Z",
    ...over,
  };
}

function input(over: Partial<SpecProjectionInput> = {}): SpecProjectionInput {
  return {
    title: "Move checkout to a single page",
    status: "approved",
    updatedAt: "2026-06-10T00:00:00Z",
    contract: contract(),
    ...over,
  };
}

const GEN = "2026-06-24T09:00:00Z";

describe("composeSpecProjections: the four named views", () => {
  it("produces exactly the PRD, FRD, status, and one-pager projections", () => {
    const set = composeSpecProjections(input(), GEN);
    expect(set.projections.map((p) => p.kind)).toEqual([...PROJECTION_KINDS]);
    expect(set.contractVersion).toBe(2);
    expect(set.generatedOn).toBe("2026-06-24");
  });

  it("stamps the set with the generation date derived from generatedAt", () => {
    const set = composeSpecProjections(input(), GEN);
    expect(set.generatedAt).toBe(GEN);
    expect(set.generatedOn).toBe("2026-06-24");
  });

  it("projects intent, success metrics, and non-goals from the contract into the PRD", () => {
    const set = composeSpecProjections(input(), GEN);
    const prd = set.projections.find((p) => p.kind === "prd")!;
    const joined = prd.sections.map((s) => `${s.heading}\n${s.body}`).join("\n");
    expect(joined).toContain("moving checkout to a single page");
    expect(joined).toContain("Cart completion improves by 10%");
    expect(joined).toContain("Redesigning the payment provider integration");
    expect(joined).toContain("2 engineer-weeks");
  });

  it("annotates each acceptance criterion with its proof oracle in the FRD only", () => {
    const set = composeSpecProjections(input(), GEN);
    const frd = set.projections.find((p) => p.kind === "frd")!;
    const criteria = frd.sections.find((s) => s.heading === "Acceptance criteria")!.body;
    expect(criteria).toContain("graded by an eval");
    expect(criteria).toContain("proof not yet assigned"); // the second, unclassified clause
    const prd = set.projections.find((p) => p.kind === "prd")!;
    const metrics = prd.sections.find((s) => s.heading === "Success metrics")!.body;
    expect(metrics).not.toContain("graded by an eval"); // PRD stays plain
  });

  it("summarizes proof progress and revisions in the status view", () => {
    const set = composeSpecProjections(input(), GEN);
    const status = set.projections.find((p) => p.kind === "status")!;
    const proving = status.sections.find((s) => s.heading === "What we are proving")!.body;
    expect(proving).toContain("2 success metrics on record");
    expect(proving).toContain("1 has a proof oracle assigned");
    expect(status.sections.find((s) => s.heading === "Where it stands")!.body).toContain(
      "approved",
    );
  });

  it("caps the one-pager to the top three metrics and non-goals", () => {
    const many = contract({
      success_metrics: [clause("m1"), clause("m2"), clause("m3"), clause("m4"), clause("m5")],
    });
    const set = composeSpecProjections(input({ contract: many }), GEN);
    const onepager = set.projections.find((p) => p.kind === "onepager")!;
    const success = onepager.sections.find((s) => s.heading === "What success looks like")!.body;
    expect(success).toContain("m3");
    expect(success).not.toContain("m4");
  });

  it("merges contract evidence_links and caller citations into deduped sources on PRD/FRD", () => {
    const set = composeSpecProjections(
      input({ citations: [{ label: "Extra source" }, { label: "Checkout drop-off" }] }),
      GEN,
    );
    const prd = set.projections.find((p) => p.kind === "prd")!;
    const labels = prd.sources.map((s) => s.label);
    expect(labels).toContain("Checkout drop-off");
    expect(labels).toContain("Extra source");
    // "Checkout drop-off" appears once despite being in both lists.
    expect(labels.filter((l) => l === "Checkout drop-off").length).toBe(1);
  });
});

describe("assessDrift: spine currency", () => {
  it("reports current when the contract was drafted at or after the last spec edit", () => {
    const d = assessDrift(input({ updatedAt: "2026-06-10T00:00:00Z" }));
    expect(d.state).toBe("current");
    expect(d.detail).toContain("version 2");
  });

  it("reports stale when the spec changed after the contract was last drafted", () => {
    const d = assessDrift(input({ updatedAt: "2026-06-20T00:00:00Z" }));
    expect(d.state).toBe("stale");
    expect(d.label).toBe("Contract behind spec");
    expect(d.detail).toContain("2026-06-10");
    expect(d.detail).toContain("2026-06-20");
  });

  it("reports no-contract when there is no contract to project from", () => {
    const d = assessDrift(input({ contract: null }));
    expect(d.state).toBe("no-contract");
    const set = composeSpecProjections(input({ contract: null }), GEN);
    expect(set.projections).toEqual([]);
    expect(set.contractVersion).toBeNull();
  });
});

describe("composeSpecProjections: honest degradation", () => {
  it("states missing intent, metrics, budget, and policy plainly rather than inventing them", () => {
    const sparse = contract({
      intent: "",
      success_metrics: [],
      non_goals: [],
      budget: null,
      ambiguity_policy: null,
    });
    const set = composeSpecProjections(input({ contract: sparse }), GEN);
    const prd = set.projections.find((p) => p.kind === "prd")!;
    const bodies = prd.sections.map((s) => s.body).join("\n");
    expect(bodies).toContain("No intent recorded in the contract.");
    expect(bodies).toContain("None recorded in the contract.");
    expect(bodies).toContain("No budget or blast radius recorded in the contract.");
    expect(bodies).toContain("No ambiguity policy recorded in the contract.");
  });

  it("excludes superseded clauses from the projected requirements but counts them as revisions", () => {
    const revised = contract({
      success_metrics: [clause("Standing metric"), clause("Old metric", { status: "superseded" })],
    });
    const set = composeSpecProjections(input({ contract: revised }), GEN);
    const prd = set.projections.find((p) => p.kind === "prd")!;
    const metrics = prd.sections.find((s) => s.heading === "Success metrics")!.body;
    expect(metrics).toContain("Standing metric");
    expect(metrics).not.toContain("Old metric");
    const status = set.projections.find((p) => p.kind === "status")!;
    expect(status.sections.find((s) => s.heading === "Revisions")!.body).toContain(
      "1 clause superseded",
    );
  });
});

describe("renderProjectionMarkdown: artifact", () => {
  it("stamps the markdown with the generation date, drift label, and drift detail", () => {
    const set = composeSpecProjections(input({ updatedAt: "2026-06-20T00:00:00Z" }), GEN);
    const md = renderProjectionMarkdown(set.projections[0], {
      generatedOn: set.generatedOn,
      drift: set.drift,
    });
    expect(md).toContain("# Product requirements (PRD): Move checkout to a single page");
    expect(md).toContain("Generated on 2026-06-24 · Contract behind spec");
    expect(md).toContain("Re-draft the contract");
    expect(md).toContain("## Success metrics");
    expect(md).toContain("Cadence deprecates documents into views");
  });

  it("renders a numbered Sources section for PRD/FRD and none for status/one-pager", () => {
    const set = composeSpecProjections(input(), GEN);
    const prd = set.projections.find((p) => p.kind === "prd")!;
    const prdMd = renderProjectionMarkdown(prd, { generatedOn: set.generatedOn, drift: set.drift });
    expect(prdMd).toContain("## Sources");
    expect(prdMd).toContain("[1] Checkout drop-off");
    const status = set.projections.find((p) => p.kind === "status")!;
    const statusMd = renderProjectionMarkdown(status, {
      generatedOn: set.generatedOn,
      drift: set.drift,
    });
    expect(statusMd).not.toContain("## Sources");
  });

  it("has no em/en dashes or AI-cliché fingerprints across every rendered view", () => {
    const set = composeSpecProjections(input(), GEN);
    for (const kind of PROJECTION_KINDS as readonly SpecProjectionKind[]) {
      const p = set.projections.find((x) => x.kind === kind)!;
      const md = renderProjectionMarkdown(p, { generatedOn: set.generatedOn, drift: set.drift });
      expect(md.includes("—")).toBe(false);
      expect(md.includes("–")).toBe(false);
      expect(md.toLowerCase()).not.toContain("delve");
      expect(md.toLowerCase()).not.toContain("leverage");
    }
  });
});
