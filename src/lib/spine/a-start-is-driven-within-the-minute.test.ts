import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * Lane 2, 2026-09-08: a run started from the home's composer sat with
 * driven_at null and no seat for ninety seconds because only the run screen's
 * own `?start=true` effect made the first drive. The start belongs to the
 * server: the minute sweep drives a fresh, never-driven open track.
 */
describe("a start is driven within the minute, wherever it was pressed", () => {
  const src = readFileSync("src/routes/api/public/hooks/resume-runs.ts", "utf8");
  const from = src.indexOf("A START IS DRIVEN WITHIN THE MINUTE");
  const end = src.indexOf("return new Response(", from);
  const block = src.slice(from, end);

  it("the minute sweep picks up fresh open tracks nobody has driven", () => {
    expect(from).toBeGreaterThan(-1);
    expect(block).toContain('.eq("status", "open")');
    expect(block).toContain('.is("driven_at", null)');
    expect(block).toContain('.is("stop_requested_at", null)');
    expect(block).toContain('.gte("created_at", freshSince)');
  });

  it("drives each as the sweep's own work, bounded, and one that throws does not stop the pass", () => {
    expect(block.replace(/\s+/g, " ")).toContain(
      'driveTrackOnce( admin as unknown as SupabaseClient, row, "sweep", sweepStartedAt, )',
    );
    expect(block).toContain(".limit(3)");
    expect(block).toContain("freshFailed.push(");
  });

  it("the response says what it started", () => {
    expect(src).toContain("freshTracksDriven: freshTracks,");
  });
});
