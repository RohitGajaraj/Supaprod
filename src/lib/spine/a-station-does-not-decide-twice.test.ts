/**
 * ── A STATION DOES NOT DECIDE TWICE WHAT IT ALREADY DECIDED ──────────────────
 *
 * Track d2263583, measured 2026-09-09: fourteen decisions, five distinct
 * titles, thirteen declined. The strategist proposed and the critic declined
 * the same call every ten minutes for three hours fifty-one minutes, about
 * 2,289 credits, each repeat carrying a full rationale and three alternatives.
 * Across production, 60 decisions on 29 tracks, 20 declined, on 8 of them.
 * The record was there to read and nothing read it.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { alreadyDeclinedRefusal } from "./a-call-on-your-sentence-is-yours-to-make";

const prior = (over: Record<string, unknown> = {}) => ({
  title: "Run an A/B on the address step",
  status: "declined",
  rationale: "No A/B evidence exists for this surface yet.",
  ...over,
});

describe("a station does not decide twice what it already decided", () => {
  it("refuses the same title this track already declined, and says why it was", () => {
    const said = alreadyDeclinedRefusal("Run an A/B on the address step", [prior()]);
    expect(said).toContain("already decided");
    expect(said).toContain("No A/B evidence exists for this surface yet.");
    // It tells the seat what to do, not only that it may not proceed.
    expect(said).toContain("address that reason");
    expect(said).toContain("make a different call");
  });

  it("reads the same call typed differently as the same call", () => {
    for (const t of [
      "  Run an A/B on the address step  ",
      "run an a/b on the address step",
      "Run an  A/B   on the address step",
    ]) {
      expect(alreadyDeclinedRefusal(t, [prior()])).not.toBeNull();
    }
  });

  it("lets a different call through, and a decision that was not declined", () => {
    expect(alreadyDeclinedRefusal("Ship the address step as it stands", [prior()])).toBeNull();
    expect(
      alreadyDeclinedRefusal("Run an A/B on the address step", [prior({ status: "approved" })]),
    ).toBeNull();
    expect(
      alreadyDeclinedRefusal("Run an A/B on the address step", [prior({ status: "pending" })]),
    ).toBeNull();
    expect(alreadyDeclinedRefusal("anything", [])).toBeNull();
    expect(alreadyDeclinedRefusal("anything", null)).toBeNull();
  });

  it("still refuses when the decline recorded no reason, without inventing one", () => {
    const said = alreadyDeclinedRefusal("Run an A/B on the address step", [
      prior({ rationale: null }),
    ]);
    expect(said).toContain("already decided");
    expect(said).not.toContain("The reason on the record");
  });

  it("the tool reads the track's own record before it writes", () => {
    const REG = readFileSync("src/lib/ai/tools/registry.server.ts", "utf8");
    const at = REG.indexOf('name: "decision.record"');
    const tool = REG.slice(at, REG.indexOf("const learningRecord = def(", at));
    expect(tool).toContain("alreadyDeclinedRefusal(a.title,");
    expect(tool).toContain('.eq("artifact_kind", "decision")');
    // Before the write, or it is not a guard.
    expect(tool.indexOf("alreadyDeclinedRefusal(")).toBeLessThan(tool.indexOf(".insert("));
  });
});
