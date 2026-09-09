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
    // "Moved", not "created", since 2026-09-09: a released hold clears
    // driven_at and stamps updated_at, so this same block is what makes the
    // hold card's "It runs again on its next turn" true on a track of any age.
    expect(block).toContain('.gte("updated_at", freshSince)');
    expect(block).not.toContain('.gte("created_at", freshSince)');
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

/**
 * Lane 1's fifth review, 2026-09-09: "Let Build try again" cleared the hold
 * and stamped `driven_at: now`, which is the one thing a release is not, and
 * which sent the track to the BACK of both sweeps' `driven_at ASC` ordering
 * while the card promised "It runs again on its next turn". The press and the
 * sentence disagreed about when; they agree now.
 */
describe("a released hold is driven within the minute too", () => {
  const track = readFileSync("src/lib/spine/track.functions.ts", "utf8");
  const at = track.indexOf("export const retryStation");
  const release = track.slice(at, track.indexOf("\nexport ", at + 1)).replace(/\s+/g, " ");

  it("the release clears driven_at rather than stamping it", () => {
    expect(at).toBeGreaterThan(-1);
    expect(release).toContain("last_hold: null,");
    expect(release).toContain("driven_at: null,");
    expect(release).not.toContain("driven_at: now,");
  });

  it("and it still resets both ceilings, so the release is a real release", () => {
    expect(release).toContain("attempts: 0,");
    expect(release).toContain("station_drives: 0,");
    expect(release).toContain("deferred_until: null,");
  });
});
