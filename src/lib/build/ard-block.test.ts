import { describe, expect, test } from "bun:test";
import { ARD_BLOCK_MAX_CHARS, formatArdWorkOrderBlock, standingClauseTexts } from "./ard-block";
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

function makeArd(successMetrics: ReturnType<typeof clause>[] = [clause("p95 under 200ms")]) {
  return {
    ard_version: "0.1",
    schema_url: "/api/public/ard/schema",
    spec_id: "11111111-1111-1111-1111-111111111111",
    spec_title: "Test spec",
    exported_at: "2026-07-07T00:00:00.000Z",
    contract: {
      version: 1,
      intent: "Ship the thing",
      evidence_links: [],
      success_metrics: successMetrics,
      non_goals: [],
      budget: null,
      ambiguity_policy: null,
      drafted_by: "agent",
      drafted_at: "2026-07-07T00:00:00.000Z",
    },
  } as unknown as ArdDocument;
}

function fencedJson(block: string): string {
  const m = block.match(/```json\n([\s\S]*)\n```/);
  if (!m) throw new Error("no fenced json block found");
  return m[1];
}

describe("formatArdWorkOrderBlock (the ARD rides dispatch, pure part)", () => {
  test("delimits the contract with the oracle headline and a parseable fenced JSON body", () => {
    const block = formatArdWorkOrderBlock(makeArd());
    expect(block).toContain("THE CONTRACT (ARD v0.1), every clause carries its oracle");
    const parsed = JSON.parse(fencedJson(block)) as ArdDocument;
    expect(parsed.spec_id).toBe("11111111-1111-1111-1111-111111111111");
    expect(parsed.contract.success_metrics[0].oracle_kind).toBe("ci");
    expect(block).not.toContain("ARD truncated");
  });

  test("falls back to compact JSON when pretty exceeds the cap (still valid JSON, no truncation)", () => {
    // 30 clauses: pretty ~10k chars (over the cap), compact ~5.5k (under it).
    const ard = makeArd(Array.from({ length: 30 }, (_, i) => clause(`criterion number ${i}`)));
    const pretty = JSON.stringify(ard, null, 2);
    const compact = JSON.stringify(ard);
    expect(pretty.length).toBeGreaterThan(ARD_BLOCK_MAX_CHARS); // guard the fixture's premise
    expect(compact.length).toBeLessThanOrEqual(ARD_BLOCK_MAX_CHARS);

    const block = formatArdWorkOrderBlock(ard);
    expect(fencedJson(block)).toBe(compact);
    expect(JSON.parse(fencedJson(block))).toEqual(JSON.parse(compact));
    expect(block).not.toContain("ARD truncated");
  });

  test("token-caps a huge document honestly: cut at the cap + an explicit truncation notice", () => {
    const ard = makeArd(
      Array.from({ length: 200 }, (_, i) =>
        clause(`a much longer acceptance criterion ${i} `.repeat(4)),
      ),
    );
    expect(JSON.stringify(ard).length).toBeGreaterThan(ARD_BLOCK_MAX_CHARS);

    const block = formatArdWorkOrderBlock(ard);
    expect(fencedJson(block).length).toBe(ARD_BLOCK_MAX_CHARS);
    expect(block).toContain("ARD truncated");
    expect(block).toContain(`${ARD_BLOCK_MAX_CHARS}-char work-order budget`);
  });

  test("honors a custom cap", () => {
    const block = formatArdWorkOrderBlock(makeArd(), 50);
    expect(fencedJson(block).length).toBe(50);
    expect(block).toContain("ARD truncated");
  });
});

describe("standingClauseTexts (BuildSpec.acceptanceCriteria extraction)", () => {
  test("keeps standing non-blank clauses, trims, drops superseded/blank/malformed", () => {
    const texts = standingClauseTexts([
      clause("  keep me  "),
      clause("drop me", "superseded"),
      clause("   "),
      { text: 42, status: "standing" },
      { status: "standing" },
      clause("also keep"),
    ]);
    expect(texts).toEqual(["keep me", "also keep"]);
  });

  test("null / undefined / non-array inputs yield an empty list", () => {
    expect(standingClauseTexts(null)).toEqual([]);
    expect(standingClauseTexts(undefined)).toEqual([]);
    expect(standingClauseTexts("nope" as unknown as [])).toEqual([]);
  });
});
