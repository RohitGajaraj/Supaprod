import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * P-147: Outcomes says why the first release has no verdict, in the run
 * page's own words. These pin the shape of the read, not the sentence: the
 * sentence is `whatLearnIsWaitingFor`'s and is tested with it.
 */
describe("the releases awaiting a verdict are read the way the run page reads them", () => {
  const src = readFileSync("src/lib/outcomes-awaiting-verdict.functions.ts", "utf8");

  it("imports the one composer and the driver's own two reads, never a second sentence", () => {
    expect(src).toContain('from "@/lib/spine/what-learn-is-waiting-for"');
    expect(src).toContain("whatLearnIsWaitingFor(dueIso, states)");
    expect(src).toContain("forecastDueDate(supabase, t.id)");
    expect(src).toContain("metricSourcesForTrack(supabase, t.id)");
  });

  it("names its workspace on the tracks read and asks only for open tracks at Learn", () => {
    expect(src).toContain('.eq("workspace_id", data.workspaceId)');
    expect(src).toContain('.eq("status", "open")');
    expect(src).toContain('.eq("station", "learn")');
  });

  it("counts a release only when a deployment member says something went out", () => {
    expect(src).toContain('.eq("artifact_kind", "deployment")');
    expect(src).toContain("if (!shippedAt.has(t.id)) continue;");
  });

  it("a failed read is thrown, never an empty desk", () => {
    expect(src).toContain("could not be read:");
    expect(src).not.toContain("return { releases: [] };\n    }\n    const rows = (tracks ?? [])");
    expect((src.match(/throw new Error\(/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });
});
