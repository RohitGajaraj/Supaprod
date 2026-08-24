import { describe, expect, test } from "bun:test";
import {
  statusLabel,
  changesetColor,
  changesetLabel,
  fmtCost,
  fmtCompact,
  summarizeArgs,
} from "./studio-format";

describe("statusLabel", () => {
  test("waiting_approval renders as the human-facing 'at gate'", () => {
    expect(statusLabel("waiting_approval")).toBe("at gate");
  });

  test("every other agent_runs/missions status passes through verbatim", () => {
    for (const s of ["queued", "running", "completed", "halted", "failed"]) {
      expect(statusLabel(s)).toBe(s);
    }
  });
});

describe("changesetColor", () => {
  // Expectations match the REAL role tokens studio-format.ts returns (moss =
  // outcome success, cornflower = live, text-subtle = neutral); the first
  // draft of this suite asserted a token family the app does not use.
  test("merged -> moss (outcome: shipped)", () => {
    expect(changesetColor("merged")).toBe("var(--mrd-pass)");
  });
  test("pr_open -> cornflower (live: under review)", () => {
    expect(changesetColor("pr_open")).toBe("var(--cornflower)");
  });
  test("abandoned -> text-subtle", () => {
    expect(changesetColor("abandoned")).toBe("var(--mrd-mute)");
  });
  test("staged and committed fall back to the neutral text-subtle ladder color", () => {
    expect(changesetColor("staged")).toBe("var(--mrd-mute)");
    expect(changesetColor("committed")).toBe("var(--mrd-mute)");
  });
  test("an unrecognized status also falls back to text-subtle, not undefined", () => {
    expect(changesetColor("some_future_state")).toBe("var(--mrd-mute)");
  });
});

describe("changesetLabel", () => {
  test("pr_open renders as 'PR open'", () => {
    expect(changesetLabel("pr_open")).toBe("PR open");
  });
  test("every other changeset status passes through verbatim", () => {
    for (const s of ["staged", "committed", "merged", "abandoned"]) {
      expect(changesetLabel(s)).toBe(s);
    }
  });
});

describe("fmtCost", () => {
  test("non-finite input (NaN/Infinity) -> '$0.0000', never NaN-in-string", () => {
    expect(fmtCost(NaN)).toBe("$0.0000");
    expect(fmtCost(Infinity)).toBe("$0.0000");
    expect(fmtCost(-Infinity)).toBe("$0.0000");
  });

  test("zero uses 2 decimal places (0 is not > 0)", () => {
    expect(fmtCost(0)).toBe("$0.00");
  });

  test("sub-cent positive values use 4 decimal places", () => {
    expect(fmtCost(0.0032)).toBe("$0.0032");
  });

  test("a cent or more uses 2 decimal places", () => {
    expect(fmtCost(0.01)).toBe("$0.01");
    expect(fmtCost(1.5)).toBe("$1.50");
  });

  test("a negative cost (should not occur, but must not throw) falls to the 2dp branch", () => {
    expect(fmtCost(-1)).toBe("$-1.00");
  });
});

describe("fmtCompact", () => {
  test("under 1000 renders the raw number as a string", () => {
    expect(fmtCompact(0)).toBe("0");
    expect(fmtCompact(999)).toBe("999");
  });

  test("1000-9999 renders one decimal + 'k'", () => {
    expect(fmtCompact(1000)).toBe("1.0k");
    expect(fmtCompact(1500)).toBe("1.5k");
  });

  test("rounding at the top of the 1000-9999 band can tip into '10.0k' before crossing the 10000 threshold", () => {
    expect(fmtCompact(9999)).toBe("10.0k");
  });

  test("10000 and above rounds to a whole 'k' with no decimal", () => {
    expect(fmtCompact(10_000)).toBe("10k");
    expect(fmtCompact(25_500)).toBe("26k");
  });
});

describe("summarizeArgs", () => {
  test("an empty args object renders the explicit placeholder", () => {
    expect(summarizeArgs({})).toBe("(no args)");
  });

  test("null/undefined values are skipped entirely", () => {
    expect(summarizeArgs({ a: null, b: undefined, c: "x" })).toBe("c: x");
  });

  test("string values have internal whitespace runs collapsed to a single space", () => {
    expect(summarizeArgs({ note: "line one\n  line   two" })).toBe("note: line one line two");
  });

  test("a long string value is truncated with an ellipsis at 60 chars", () => {
    const long = "x".repeat(80);
    const result = summarizeArgs({ note: long });
    expect(result).toBe(`note: ${"x".repeat(57)}…`);
  });

  test("array values render as their length, not their contents", () => {
    expect(summarizeArgs({ files: ["a.ts", "b.ts", "c.ts"] })).toBe("files: [3]");
  });

  test("plain object values are JSON-stringified", () => {
    expect(summarizeArgs({ opts: { retries: 2 } })).toBe('opts: {"retries":2}');
  });

  test("number and boolean values are stringified as-is", () => {
    expect(summarizeArgs({ n: 42, ok: true })).toBe("n: 42 · ok: true");
  });

  test("multiple entries are joined with ' · ' in insertion order", () => {
    expect(summarizeArgs({ a: 1, b: "two", c: [1, 2] })).toBe("a: 1 · b: two · c: [2]");
  });

  test("the whole joined line is truncated at the max length with an ellipsis", () => {
    const args = { a: "x".repeat(50), b: "y".repeat(50), c: "z".repeat(50) };
    const result = summarizeArgs(args, 40);
    expect(result.length).toBe(40);
    expect(result.endsWith("…")).toBe(true);
  });
});
