import { describe, it, expect } from "bun:test";
import { parsePersonaBoardReview, PERSONA_KINDS } from "./persona-critic";

describe("parsePersonaBoardReview", () => {
  it("always returns the three fixed seats in order", () => {
    const board = parsePersonaBoardReview({});
    expect(board.map((p) => p.persona)).toEqual(PERSONA_KINDS);
  });

  it("defaults to revise + empty objections for missing/invalid input", () => {
    for (const p of parsePersonaBoardReview(null)) {
      expect(p.verdict).toBe("revise");
      expect(p.objections).toEqual([]);
    }
    for (const p of parsePersonaBoardReview({ exec: { verdict: "bogus" } })) {
      expect(p.verdict).toBe("revise");
    }
  });

  it("passes through valid per-persona verdicts from a keyed object", () => {
    const board = parsePersonaBoardReview({
      exec: { verdict: "ship", objections: [] },
      engineering: { verdict: "kill", objections: ["Infeasible in the timeframe"] },
      customer_of_record: { verdict: "revise", objections: ["Misses the offline case"] },
    });
    const byKind = Object.fromEntries(board.map((p) => [p.persona, p]));
    expect(byKind.exec.verdict).toBe("ship");
    expect(byKind.engineering.verdict).toBe("kill");
    expect(byKind.engineering.objections).toEqual(["Infeasible in the timeframe"]);
    expect(byKind.customer_of_record.objections).toEqual(["Misses the offline case"]);
  });

  it("coerces from an array-of-persona form and normalizes hyphenated keys", () => {
    const board = parsePersonaBoardReview({
      board: [
        { persona: "exec", verdict: "revise", objections: ["Opportunity cost too high"] },
        { persona: "customer-of-record", verdict: "kill", objections: ["Would not adopt"] },
      ],
    });
    const byKind = Object.fromEntries(board.map((p) => [p.persona, p]));
    expect(byKind.exec.objections).toEqual(["Opportunity cost too high"]);
    expect(byKind.customer_of_record.verdict).toBe("kill");
    // engineering was absent from the array; it falls back to the default seat.
    expect(byKind.engineering.verdict).toBe("revise");
    expect(byKind.engineering.objections).toEqual([]);
  });

  it("drops blank / non-string objections", () => {
    const board = parsePersonaBoardReview({
      exec: { verdict: "ship", objections: ["Real objection", "", "   ", 42, null] },
    });
    const exec = board.find((p) => p.persona === "exec")!;
    expect(exec.objections).toEqual(["Real objection"]);
  });

  it("caps objections at 6 per persona", () => {
    const many = Array.from({ length: 20 }, (_, i) => `Objection ${i}`);
    const board = parsePersonaBoardReview({ engineering: { objections: many } });
    const eng = board.find((p) => p.persona === "engineering")!;
    expect(eng.objections).toHaveLength(6);
  });

  it("truncates an overlong objection to 400 chars", () => {
    const board = parsePersonaBoardReview({
      exec: { objections: ["x".repeat(1000)] },
    });
    const exec = board.find((p) => p.persona === "exec")!;
    expect(exec.objections[0].length).toBe(400);
  });

  it("ignores objections that are not an array", () => {
    const board = parsePersonaBoardReview({ exec: { objections: "not an array" } });
    const exec = board.find((p) => p.persona === "exec")!;
    expect(exec.objections).toEqual([]);
  });
});
