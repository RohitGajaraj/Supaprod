import { describe, expect, test } from "bun:test";
import {
  buildActiveRulesBlock,
  buildRetroDigest,
  isoWeekKey,
  parseRetroDraft,
  snippetOf,
  startOfDayUtc,
  type ScreenedRun,
} from "@/lib/ai/nightly-retro";

describe("parseRetroDraft", () => {
  test("keeps well-formed rules", () => {
    const out = parseRetroDraft(
      JSON.stringify({
        rules: [
          { rule_text: "always lint migrations", rationale: "recurred", source_indices: [1, 3] },
        ],
      }),
    );
    expect(out).toHaveLength(1);
    expect(out[0].rule_text).toBe("always lint migrations");
    expect(out[0].source_indices).toEqual([1, 3]);
  });

  test("drops rules missing rule_text or source_indices", () => {
    const out = parseRetroDraft(
      JSON.stringify({
        rules: [
          { rationale: "no text", source_indices: [1, 2] },
          { rule_text: "  ", source_indices: [1] },
          { rule_text: "no indices" },
          { rule_text: "good", rationale: "ok", source_indices: [2] },
        ],
      }),
    );
    expect(out).toHaveLength(1);
    expect(out[0].rule_text).toBe("good");
  });

  test("returns [] on a non-array rules field", () => {
    expect(parseRetroDraft(JSON.stringify({ rules: "nope" }))).toEqual([]);
  });

  test("returns [] on malformed JSON, never throws", () => {
    expect(parseRetroDraft("{not json")).toEqual([]);
    expect(parseRetroDraft("")).toEqual([]);
  });
});

describe("buildRetroDigest", () => {
  const runs: ScreenedRun[] = [
    { agent: "build", status: "halted", failure: "auth_missing", snippet: "wire the oauth flow" },
    { agent: "critic", status: "ok", failure: null, snippet: "" },
  ];

  test("numbers 1-based and includes trusted fields", () => {
    const out = buildRetroDigest(runs);
    const lines = out.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(
      "[1] agent=build status=halted failure=auth_missing :: wire the oauth flow",
    );
    expect(lines[1]).toBe("[2] agent=critic status=ok");
  });

  test("falls back to 'unknown' for empty agent/status", () => {
    const out = buildRetroDigest([{ agent: "", status: "", failure: null, snippet: "x" }]);
    expect(out).toBe("[1] agent=unknown status=unknown :: x");
  });
});

describe("snippetOf", () => {
  test("collapses whitespace and truncates", () => {
    expect(snippetOf("  a\n\n b   c ", 100)).toBe("a b c");
    expect(snippetOf("abcdef", 3)).toBe("abc...");
  });

  test("empty for null / undefined / blank", () => {
    expect(snippetOf(null)).toBe("");
    expect(snippetOf(undefined)).toBe("");
    expect(snippetOf("   ")).toBe("");
  });
});

describe("buildActiveRulesBlock", () => {
  test("says none when empty", () => {
    expect(buildActiveRulesBlock([])).toBe("Rules already in force: (none yet)");
    expect(buildActiveRulesBlock(["  ", ""])).toBe("Rules already in force: (none yet)");
  });

  test("bullets the live rules", () => {
    expect(buildActiveRulesBlock(["rule a", "rule b"])).toBe(
      "Rules already in force (do not restate these):\n- rule a\n- rule b",
    );
  });
});

describe("date helpers", () => {
  test("startOfDayUtc zeroes the time", () => {
    expect(startOfDayUtc(new Date("2026-07-12T18:42:11.000Z"))).toBe("2026-07-12T00:00:00.000Z");
  });

  test("isoWeekKey is deterministic", () => {
    // 2026-07-12 is a Sunday, ISO week 28.
    expect(isoWeekKey(new Date("2026-07-12T09:00:00.000Z"))).toBe("2026-W28");
  });
});
