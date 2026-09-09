/**
 * ── A UNION IS MEMBERSHIP, NOT A CAST ────────────────────────────────────────
 *
 * Lane 1's `sourceMark` find, 2026-09-09: `(explicit as SourceMark)` inside an
 * `if (explicit)`, so the fallback beside it was unreachable and the cast did
 * all the work. Any string a caller put in `mark` came back typed as a mark,
 * and both the glyph and the name lookup indexed on it. Their census pattern,
 * applied to this lane: grep `as <UnionName>`, then sort into three piles.
 * Derived from the type's own record, safe. Guarded by a membership test,
 * safe. Everything else is a claim, and the hardest to see are the casts
 * sitting INSIDE a truthiness check, because the check makes them look
 * guarded while checking the wrong thing.
 *
 * Two on this lane were claims and both are narrowed. This pins the shape so
 * the next one has to be a check too.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { asSelfImproveMode } from "./self-improve-governance";

describe("a union is membership, not a cast", () => {
  it("a mode is what the list holds, and anything else is the fallback", () => {
    expect(asSelfImproveMode("auto", "scheduled")).toBe("auto");
    expect(asSelfImproveMode("off", "scheduled")).toBe("off");
    // The shapes a cast would have let through, wearing the type of a mode.
    expect(asSelfImproveMode("banana", "scheduled")).toBe("scheduled");
    expect(asSelfImproveMode(null, "scheduled")).toBe("scheduled");
    expect(asSelfImproveMode(undefined, "off")).toBe("off");
    expect(asSelfImproveMode([], "scheduled")).toBe("scheduled");
    expect(asSelfImproveMode({ mode: "auto" }, "scheduled")).toBe("scheduled");
    expect(asSelfImproveMode(0, "scheduled")).toBe("scheduled");
  });

  it("the reader of the column asks the list rather than casting the row", () => {
    const src = readFileSync("src/lib/self-improve.functions.ts", "utf8");
    expect(src).toContain('asSelfImproveMode(row?.mode, "scheduled")');
    // The cast this replaced, on a column that carries no CHECK constraint.
    expect(src).not.toContain("row?.mode as SelfImproveMode");
  });

  it("the graph says so when its own round trip carries a kind nothing defines", () => {
    /*
     * Deliberately NOT narrowed away: these keys are written by this module's
     * own writers, so an unknown kind means the round trip is broken rather
     * than that a caller sent rubbish. Dropping the node hides one that
     * exists and drawing it silently claims a kind that does not, so it
     * reports and passes the value through unchanged.
     */
    const src = readFileSync("src/lib/knowledge-graph-view.ts", "utf8");
    expect(src).toContain("(GRAPH_NODE_KINDS as readonly string[]).includes(raw)");
    expect(src).toContain("carries a kind nothing defines");
  });
});
