import { describe, expect, test } from "bun:test";
import {
  ARD_BLOCK_MAX_CHARS,
  CLAUSE_TEXT_FLOOR,
  formatArdWorkOrderBlock,
  formatScaffoldHtmlBlock,
  standingClauseTexts,
  type ArdBlockOmission,
} from "./ard-block";
import { ARD_SCAFFOLD_HTML_CAP } from "./design-gate";
import type { ArdDesignSection, ArdDocument } from "@/lib/ard-schema";

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

function makeArd(
  successMetrics: ReturnType<typeof clause>[] = [clause("p95 under 200ms")],
  design?: ArdDesignSection | null,
  extra?: { non_goals?: ReturnType<typeof clause>[]; evidence_links?: unknown[] },
) {
  return {
    ard_version: "0.1",
    schema_url: "/api/public/ard/schema",
    spec_id: "11111111-1111-1111-1111-111111111111",
    spec_title: "Test spec",
    exported_at: "2026-07-07T00:00:00.000Z",
    contract: {
      version: 1,
      intent: "Ship the thing",
      evidence_links: extra?.evidence_links ?? [],
      success_metrics: successMetrics,
      non_goals: extra?.non_goals ?? [],
      budget: null,
      ambiguity_policy: null,
      drafted_by: "agent",
      drafted_at: "2026-07-07T00:00:00.000Z",
    },
    ...(design === undefined ? {} : { design }),
  } as unknown as ArdDocument;
}

/**
 * A mockup the size the design gate actually allows (ARD_SCAFFOLD_HTML_CAP).
 * The whole point of this fixture is that it is REAL-sized: the defect this
 * file guards only appears past the work-order budget, so a 200-char mockup
 * would prove nothing at all.
 */
function bigScaffold(chars: number = ARD_SCAFFOLD_HTML_CAP): string {
  const unit =
    '<section class="row" data-state="idle"><h2 class="t-lg">Pipeline station</h2><p class="muted">Every station shows what it decided and why.</p><button class="btn primary">Approve &amp; continue</button></section>';
  return unit.repeat(Math.ceil(chars / unit.length)).slice(0, chars);
}

function fencedJson(block: string): string {
  const m = block.match(/```json\n([\s\S]*?)\n```/);
  if (!m) throw new Error("no fenced json block found");
  return m[1];
}

type BudgetedDoc = ArdDocument & { omitted_for_budget?: ArdBlockOmission[] };

describe("formatArdWorkOrderBlock (the ARD rides dispatch, pure part)", () => {
  test("delimits the contract with the oracle headline and a parseable fenced JSON body", () => {
    const block = formatArdWorkOrderBlock(makeArd());
    expect(block).toContain("THE CONTRACT (ARD v0.1), every clause carries its oracle");
    const parsed = JSON.parse(fencedJson(block)) as ArdDocument;
    expect(parsed.spec_id).toBe("11111111-1111-1111-1111-111111111111");
    expect(parsed.contract.success_metrics[0].oracle_kind).toBe("ci");
    expect(block).not.toContain("dropped to fit");
  });

  test("falls back to compact JSON when pretty exceeds the cap (still valid JSON, nothing dropped)", () => {
    // 30 clauses: pretty ~10k chars (over the cap), compact ~5.5k (under it).
    const ard = makeArd(Array.from({ length: 30 }, (_, i) => clause(`criterion number ${i}`)));
    const pretty = JSON.stringify(ard, null, 2);
    const compact = JSON.stringify(ard);
    expect(pretty.length).toBeGreaterThan(ARD_BLOCK_MAX_CHARS); // guard the fixture's premise
    expect(compact.length).toBeLessThanOrEqual(ARD_BLOCK_MAX_CHARS);

    const block = formatArdWorkOrderBlock(ard);
    expect(fencedJson(block)).toBe(compact);
    expect(JSON.parse(fencedJson(block))).toEqual(JSON.parse(compact));
    expect(block).not.toContain("dropped to fit");
  });
});

/**
 * THE MOCKUP-SURVIVES REGRESSION. Founder question, 2026-08-05: "how will Build
 * pick up the design and prototype developed in the previous station and
 * deliver code against it?" It could not, because a gate-approved mockup is the
 * LAST field of the LAST key of the ARD and the block met its budget by slicing
 * characters — so the cut landed inside a JSON string literal and invalidated
 * the entire fence, acceptance criteria included.
 */
describe("formatArdWorkOrderBlock with a real 20,000-char mockup", () => {
  const design: ArdDesignSection = {
    memory: [
      { category: "token", title: "Accent color", content: "Indigo 600 for primary actions." },
      { category: "type", title: "Scale", content: "16px base, 1.25 ratio." },
    ],
    flow_steps: [{ label: "Land on the station" }, { label: "Approve the drawing" }],
    scaffold_html: bigScaffold(),
  };
  const ard = makeArd([clause("p95 under 200ms"), clause("zero unhandled 500s")], design);

  test("the fixture is the fatal kind: a character slice of it does NOT parse", () => {
    expect(design.scaffold_html!.length).toBe(20_000);
    const compact = JSON.stringify(ard);
    expect(compact.length).toBeGreaterThan(ARD_BLOCK_MAX_CHARS);
    // This is precisely what the old implementation fenced.
    expect(() => JSON.parse(compact.slice(0, ARD_BLOCK_MAX_CHARS))).toThrow();
  });

  test("the fence parses and the acceptance criteria survive", () => {
    const block = formatArdWorkOrderBlock(ard);
    const parsed = JSON.parse(fencedJson(block)) as BudgetedDoc;

    expect(parsed.contract.success_metrics.map((c) => c.text)).toEqual([
      "p95 under 200ms",
      "zero unhandled 500s",
    ]);
    expect(parsed.contract.intent).toBe("Ship the thing");
    expect(parsed.spec_id).toBe("11111111-1111-1111-1111-111111111111");
  });

  test("the scaffold is dropped as a WHOLE KEY, named in the JSON with how to fetch it", () => {
    const block = formatArdWorkOrderBlock(ard);
    const parsed = JSON.parse(fencedJson(block)) as BudgetedDoc;

    // Deleted, not nulled: null would claim the design station never drew one.
    expect(parsed.design).toBeDefined();
    expect("scaffold_html" in (parsed.design as object)).toBe(false);

    const omission = parsed.omitted_for_budget?.find((o) => o.key === "design.scaffold_html");
    expect(omission).toBeDefined();
    expect(omission!.chars).toBeGreaterThan(20_000); // escaped, so larger than the raw markup
    expect(omission!.recover).toContain("get_ard");
    expect(block).toContain("design.scaffold_html");
  });

  test("what still fits is kept: the smaller design keys are not thrown away with it", () => {
    const block = formatArdWorkOrderBlock(ard);
    const parsed = JSON.parse(fencedJson(block)) as BudgetedDoc;
    expect(parsed.design!.memory.map((m) => m.title)).toEqual(["Accent color", "Scale"]);
    expect(parsed.design!.flow_steps).toEqual([
      { label: "Land on the station" },
      { label: "Approve the drawing" },
    ]);
  });

  test("THE INVARIANT: valid JSON at every size, across the whole drop ladder", () => {
    const loaded = makeArd(
      Array.from({ length: 40 }, (_, i) => clause(`acceptance criterion number ${i} `.repeat(6))),
      design,
      {
        non_goals: Array.from({ length: 20 }, (_, i) => clause(`explicitly out of scope ${i}`)),
        evidence_links: Array.from({ length: 20 }, (_, i) => ({
          source_kind: "signal",
          source_id: `sig-${i}`,
          title: `A piece of evidence numbered ${i}`,
        })),
      },
    );
    // Sweep caps from far below the smallest possible document to far above the
    // whole thing. Every single one must parse — that is the invariant.
    for (let cap = 100; cap <= 40_000; cap += 137) {
      const json = fencedJson(formatArdWorkOrderBlock(loaded, cap));
      expect(() => JSON.parse(json)).not.toThrow();
    }
  });

  test("a document that cannot fit even stripped is sent WHOLE and parseable, and says so", () => {
    const block = formatArdWorkOrderBlock(ard, 300);
    const parsed = JSON.parse(fencedJson(block)) as BudgetedDoc;
    expect(parsed.contract.intent).toBe("Ship the thing");
    expect(block).toContain("ARD over budget");
    expect(block).toContain("sent whole rather than cut");
  });

  test("long clause texts are SHORTENED before the document is declared over budget", () => {
    const wordy = makeArd([clause("x".repeat(4000))]);
    const block = formatArdWorkOrderBlock(wordy, 1200);
    const parsed = JSON.parse(fencedJson(block)) as BudgetedDoc;
    expect(parsed.contract.success_metrics[0].text.length).toBeLessThan(4000);
    expect(parsed.contract.success_metrics[0].text.startsWith("x".repeat(CLAUSE_TEXT_FLOOR))).toBe(
      true,
    );
    expect(parsed.contract.success_metrics[0].text).toContain("trimmed for the work-order budget");
  });

  /**
   * A CLAUSE MUST NEVER GROW WHILE BEING CALLED TRIMMED.
   *
   * THE DEFECT, caught in review before it shipped. CLAUSE_TRIM_MARK is 49
   * characters and CLAUSE_TEXT_FLOOR is 240, so every clause between 241 and
   * 288 characters was replaced by a LONGER string carrying a mark saying it
   * had been shortened for space. `saved` went negative, the `saved > 0` guard
   * turned that into 0 so no receipt was written, and the mutation happened
   * anyway. Measured: thirty 245-character metrics grew the document from
   * 12,994 to 14,279 characters.
   *
   * The test above could not see it, and that is the lesson: it uses a
   * 4,000-character clause, far on the side of the boundary where the
   * arithmetic works. The bug lives in a 48-character window that only a
   * fixture chosen at the boundary can reach.
   */
  test("a clause just past the floor is left alone rather than lengthened", () => {
    // THIRTY clauses, not one, and the count is load-bearing. `trimClauseTexts`
    // only runs once the document is OVER budget, so a single 245-character
    // clause under a 1,000-character cap never reaches it and the test passes
    // whatever the trim does. The first version of this guard did exactly that:
    // planting the defect left it green at 19/19, which is how a guard becomes
    // decoration. The bulk is what forces the ladder down to this rung.
    const justOver = CLAUSE_TEXT_FLOOR + 5;
    const many = Array.from({ length: 30 }, () => clause("y".repeat(justOver)));
    const parsed = JSON.parse(
      fencedJson(formatArdWorkOrderBlock(makeArd(many), 1000)),
    ) as BudgetedDoc;
    for (const m of parsed.contract.success_metrics) {
      expect(m.text.length).toBeLessThanOrEqual(justOver);
    }
  });

  test("no clause length anywhere in the window can be made longer by budgeting", () => {
    // The whole window, not one sample from it. A guard that checks one length
    // inside a range can be satisfied by accident.
    for (let len = CLAUSE_TEXT_FLOOR + 1; len <= CLAUSE_TEXT_FLOOR + 60; len += 3) {
      const many = Array.from({ length: 30 }, () => clause("z".repeat(len)));
      const parsed = JSON.parse(
        fencedJson(formatArdWorkOrderBlock(makeArd(many), 1000)),
      ) as BudgetedDoc;
      const longest = Math.max(...parsed.contract.success_metrics.map((m) => m.text.length));
      expect({ len, longest, grew: longest > len }).toEqual({ len, longest, grew: false });
    }
  });

  test("a spec with no mockup gets no omission notice for one (no chasing a drawing that never existed)", () => {
    const noDrawing = makeArd(
      Array.from({ length: 60 }, (_, i) => clause(`criterion ${i} `.repeat(10))),
      { memory: [], flow_steps: null, scaffold_html: null },
    );
    const block = formatArdWorkOrderBlock(noDrawing, 2000);
    const parsed = JSON.parse(fencedJson(block)) as BudgetedDoc;
    expect(parsed.omitted_for_budget?.some((o) => o.key === "design.scaffold_html")).toBeFalsy();
    expect(block).not.toContain("design.scaffold_html");
  });
});

describe("formatScaffoldHtmlBlock (the mockup gets its own budget)", () => {
  test("fences the markup as html, and claims no approval it cannot verify", () => {
    const block = formatScaffoldHtmlBlock("<main><h1>Hello</h1></main>");
    expect(block).toContain("```html\n<main><h1>Hello</h1></main>\n```");
    expect(block).not.toContain("Mockup truncated");
    /**
     * THIS TEST USED TO ENSHRINE A LIE. It asserted the header said "THE
     * APPROVED MOCKUP (a human passed this markup through the design gate)",
     * which is not knowable here and is often false: `prd_scaffolds` has no
     * status column, the dispatch context reads it by prd_id alone, and the
     * design gate stands down entirely when the design stage is toggled off --
     * a live user switch that also fails open on a read error. A rejected or
     * never-reviewed mockup reached the builder under an assertion that a human
     * had signed it off.
     *
     * So the assertion is inverted: the instruction must survive, the
     * provenance claim must not come back.
     */
    expect(block).toMatch(/build the UI against this markup/i);
    expect(block).not.toMatch(/approved|a human (passed|reviewed|signed)/i);
  });

  test("a 20,000-char mockup rides whole: its own fence, its own budget", () => {
    const html = bigScaffold();
    const block = formatScaffoldHtmlBlock(html);
    expect(block).toContain(html);
    expect(block).not.toContain("Mockup truncated");
  });

  test("blank markup renders nothing rather than an empty promise of a mockup", () => {
    expect(formatScaffoldHtmlBlock("   \n  ")).toBe("");
  });

  test("markup containing a code fence opens a wider fence instead of spilling", () => {
    const html = "<pre>```js\nconst a = 1;\n```</pre>";
    const block = formatScaffoldHtmlBlock(html);
    expect(block).toContain("````html\n");
    expect(block.endsWith("````")).toBe(true);
  });

  test("over its own cap it is cut with an explicit notice (markup, unlike JSON, survives a cut)", () => {
    const block = formatScaffoldHtmlBlock(bigScaffold(500), 200);
    expect(block).toContain("Mockup truncated");
    expect(block).toContain("500 chars");
    expect(block).toContain("Design tab");
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
