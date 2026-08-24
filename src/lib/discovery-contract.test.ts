import { expect, test, describe } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  prdAssistInstructPrompt,
  prdAssistInput,
  supersedeClause,
  deriveOracleClassifications,
} from "./discovery.functions";
import type { ContractClause } from "./discovery.functions";

const NOW = "2026-07-02T23:00:00.000Z";

function clause(over: Partial<ContractClause> = {}): ContractClause {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    text: "Original clause",
    status: "standing",
    superseded_by: null,
    oracle_kind: null,
    oracle_ref: null,
    created_at: "2026-07-01T00:00:00.000Z",
    ...over,
  };
}

describe("supersedeClause (CNV-01) — clauses are individually supersedable, never overwritten in place", () => {
  test("marks the prior clause superseded and appends a new standing replacement", () => {
    const c = clause();
    const result = supersedeClause([c], c.id, "New clause text", NOW);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: c.id, status: "superseded" });
    expect(result[0].text).toBe("Original clause"); // never mutated in place
    expect(result[1]).toMatchObject({
      text: "New clause text",
      status: "standing",
      created_at: NOW,
    });
    expect(result[0].superseded_by).toBe(result[1].id);
    expect(result[1].id).not.toBe(c.id);
  });

  test("leaves other clauses in the array untouched", () => {
    const a = clause({ id: "aaaaaaaa-1111-1111-1111-111111111111", text: "A" });
    const b = clause({ id: "bbbbbbbb-1111-1111-1111-111111111111", text: "B" });
    const result = supersedeClause([a, b], a.id, "A revised", NOW);
    expect(result.find((c) => c.id === b.id)).toEqual(b);
  });

  test("throws when the clause id does not exist", () => {
    const c = clause();
    expect(() => supersedeClause([c], "does-not-exist", "x", NOW)).toThrow("Clause not found");
  });

  test("throws when the clause is already superseded (no double-supersession)", () => {
    const c = clause({ status: "superseded", superseded_by: "some-other-id" });
    expect(() => supersedeClause([c], c.id, "x", NOW)).toThrow("already superseded");
  });

  test("new clause id is a fresh uuid, never colliding with the input", () => {
    const c = clause();
    const result = supersedeClause([c], c.id, "x", NOW);
    expect(result[1].id).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("deriveOracleClassifications (CNV-02) — validates the AI's raw classification JSON before it is trusted", () => {
  test("keeps well-formed entries within range", () => {
    const raw = [
      { index: 0, oracle_kind: "eval" },
      { index: 1, oracle_kind: "ci" },
      { index: 2, oracle_kind: "uat" },
      { index: 3, oracle_kind: "unverifiable" },
    ];
    const m = deriveOracleClassifications(raw, 4);
    expect(m.get(0)).toBe("eval");
    expect(m.get(1)).toBe("ci");
    expect(m.get(2)).toBe("uat");
    expect(m.get(3)).toBe("unverifiable");
  });

  test("drops an out-of-range index rather than trusting it", () => {
    const raw = [
      { index: 5, oracle_kind: "eval" },
      { index: -1, oracle_kind: "eval" },
    ];
    const m = deriveOracleClassifications(raw, 2);
    expect(m.size).toBe(0);
  });

  test("drops an unrecognized oracle_kind", () => {
    const raw = [{ index: 0, oracle_kind: "vibes" }];
    const m = deriveOracleClassifications(raw, 1);
    expect(m.has(0)).toBe(false);
  });

  test("drops a non-integer index", () => {
    const raw = [{ index: 1.5, oracle_kind: "eval" }];
    const m = deriveOracleClassifications(raw, 2);
    expect(m.size).toBe(0);
  });

  test("malformed/missing entries never throw", () => {
    const raw = [null, {}, { index: "not a number" }, undefined];
    expect(() => deriveOracleClassifications(raw, 4)).not.toThrow();
    expect(deriveOracleClassifications(raw, 4).size).toBe(0);
  });

  test("empty input yields an empty map", () => {
    expect(deriveOracleClassifications([], 3).size).toBe(0);
  });
});

/*
 * ── prdAssist: the spec editor's AI-assist door ─────────────────────────────
 *
 * The handler is a `createServerFn` behind auth middleware, so per this repo's
 * convention it is pinned two ways instead of invoked: the exported schema and
 * prompt are parsed and read directly, and the handler body is asserted on the
 * source. What source assertions cannot prove -- that callModel really receives
 * the instruct system prompt at runtime -- is stated here rather than claimed.
 */
const SRC = readFileSync(join(import.meta.dir, "discovery.functions.ts"), "utf8");

/** The prdAssist block, its schema consts included, bounded by the next export. */
function prdAssistSource(): string {
  const start = SRC.indexOf("export const prdAssistInput");
  expect(start).toBeGreaterThan(-1);
  const end = SRC.indexOf("export const promoteSignalToOpportunity", start);
  expect(end).toBeGreaterThan(start);
  return SRC.slice(start, end);
}

describe("prdAssist input — instruct mode bounds", () => {
  test("the legacy verb payload parses unchanged, with no mode invented", () => {
    expect(prdAssistInput.parse({ action: "rewrite", selection: "abc" })).toEqual({
      action: "rewrite",
      selection: "abc",
    });
    expect(
      prdAssistInput.parse({ action: "shorten", selection: "abc", context: "surroundings" }),
    ).toEqual({ action: "shorten", selection: "abc", context: "surroundings" });
  });

  test("instruct mode parses with an instruction in range", () => {
    expect(
      prdAssistInput.parse({
        mode: "instruct",
        instruction: "cut the jargon",
        selection: "leverage synergies",
      }),
    ).toEqual({
      mode: "instruct",
      instruction: "cut the jargon",
      selection: "leverage synergies",
    });
  });

  test("instruct without instruction is refused on the instruction path", () => {
    const r = prdAssistInput.safeParse({ mode: "instruct", selection: "abc" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.path.includes("instruction"))).toBe(true);
  });

  test("a whitespace-only instruction fails the after-trim minimum", () => {
    const r = prdAssistInput.safeParse({ mode: "instruct", instruction: "   ", selection: "abc" });
    expect(r.success).toBe(false);
  });

  test("exactly 2000 trimmed characters passes; 2001 does not", () => {
    expect(
      prdAssistInput.safeParse({ mode: "instruct", instruction: "a".repeat(2000), selection: "x y" })
        .success,
    ).toBe(true);
    expect(
      prdAssistInput.safeParse({
        mode: "instruct",
        instruction: ` ${"a".repeat(1998)} `,
        selection: "x y",
      }).success,
    ).toBe(true);
    const r = prdAssistInput.safeParse({ mode: "instruct", instruction: "a".repeat(2001), selection: "x y" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.path.includes("instruction"))).toBe(true);
  });

  test("padding beyond the raw bound does not sink a trimmed-in-range instruction", () => {
    // The contract measures 1..2000 AFTER trim, so 30 spaces + 1980 chars
    // (raw 2010) must parse.
    expect(
      prdAssistInput.safeParse({
        mode: "instruct",
        instruction: `${" ".repeat(30)}${"a".repeat(1980)}`,
        selection: "x y",
      }).success,
    ).toBe(true);
  });

  test("verb mode still requires an action when no mode names itself", () => {
    const r = prdAssistInput.safeParse({ selection: "abc" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.path.includes("action"))).toBe(true);
  });
});

describe("prdAssist instruct system prompt — senior-PM editor rules", () => {
  test("speaks in the same voice as the fixed verbs", () => {
    expect(prdAssistInstructPrompt).toMatch(/senior PM editor/);
    expect(prdAssistInstructPrompt).toContain("Return Markdown only.");
  });

  test("carries the citation-marker preservation rule", () => {
    expect(prdAssistInstructPrompt).toMatch(/citation markers like \[1\] must survive/i);
  });

  test("preserves markdown structure: headings and lists named explicitly", () => {
    expect(prdAssistInstructPrompt).toMatch(/headings, lists/i);
  });

  test("returns only the edited selection, no preamble or stray fence", () => {
    expect(prdAssistInstructPrompt).toMatch(/ONLY the edited selection text/i);
    expect(prdAssistInstructPrompt).toMatch(/no preamble/i);
    expect(prdAssistInstructPrompt).toMatch(/no code fence unless the selection itself had one/i);
  });

  test("falls back to the smallest reasonable improvement when the selection cannot satisfy the ask", () => {
    expect(prdAssistInstructPrompt).toMatch(/smallest reasonable improvement and note nothing extra/);
  });
});

describe("prdAssist wiring — instruct branch lands, existing verbs untouched", () => {
  test("callModel receives the instruct system prompt through the mode branch", () => {
    const src = prdAssistSource();
    const branch = src.indexOf('if (data.mode === "instruct")');
    expect(branch).toBeGreaterThan(-1);
    // The branch selects the instruct prompt BEFORE any callModel runs below it.
    expect(src.indexOf("{ role: \"system\", content: prdAssistInstructPrompt }", branch)).toBeGreaterThan(branch);
    expect(src).toContain('surface_ref: "assist:instruct"');
    // The instruction reaches the model as part of the user turn, trimmed.
    expect(src).toContain("data.instruction!.trim()");
  });

  test("both branches return the exact existing shape { text }", () => {
    expect(prdAssistSource().split("return { text: result.output };")).toHaveLength(3);
  });

  test("the four fixed verbs are byte-identical to what shipped before", () => {
    const src = prdAssistSource();
    expect(src).toContain(
      '"Rewrite the selection to be sharper, more concrete, and easier to scan. Keep meaning."',
    );
    expect(src).toContain('"Expand the selection with helpful detail, examples, and edge cases. Stay terse."');
    expect(src).toContain('"Critique the selection: assumptions, missing risks, weak metrics. Return as bullets."');
    expect(src).toContain('"Shorten the selection by ~50% without losing meaning."');
    expect(src).toContain('{ role: "system", content: "You are a senior PM editor. Return Markdown only." }');
  });

  test("selection and context constraints are declared once, shared by both modes", () => {
    // Declared once means instruct can never drift from rewrite on what a
    // selection is -- the copies-disagree defect this repo has paid for twice.
    const occurrences = (needle: string) =>
      prdAssistSource().split(needle).length - 1;
    expect(occurrences("selection: z.string().min(2).max(8000)")).toBe(1);
    expect(occurrences("context: z.string().max(8000).optional()")).toBe(1);
  });

  test("mode stays optional, so callers that never send it keep working", () => {
    expect(prdAssistSource()).toContain('mode: z.enum(["instruct"]).optional()');
  });
});
