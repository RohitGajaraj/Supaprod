/**
 * P-18 (A-QUEUE.md): "A test asserts the top bar's count equals the number of
 * tracks with a running `agent_runs` row, not `status='open'`. Today it says
 * '3 runs are moving' with 0 runs in 24 h."
 *
 * THE DEFECT. `movingRuns` used to be `openTracks.data` (open `spine_tracks`
 * rows) filtered to `drivenAt` inside the last five minutes -- a proxy for
 * "recently touched", not a claim that a seat is running THIS INSTANT. A
 * dispatch that finished in under a second touches `driven_at` the same way
 * one still mid-run does, so the header could say "N runs are moving" over
 * zero live `agent_runs` rows: this packet's own reproduction.
 *
 * THE FIX, PROVEN HERE. `movingRuns` now reads `listMovingTracks`
 * (`track.functions.ts`), which is `listRunsForStart`'s own `workingByTrack`
 * query factored out: `agent_runs.status IN ('running','queued',
 * 'in_progress')` joined by `track_id`, never inferred from elapsed time.
 *
 * SOURCE-SCAN, matching `a-headline-that-reads-an-error-must-recompute-
 * on-it.test.ts`'s own reasoning for this file: `AppFrame.tsx` renders inside
 * a router, a query client and a workspace provider, and standing all three up
 * to read one derived array would test the harness more than the rule.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const APP_FRAME = readFileSync("src/components/shell/AppFrame.tsx", "utf8");
const TRACK_FUNCTIONS = readFileSync("src/lib/spine/track.functions.ts", "utf8");

describe("the shell's moving-runs count no longer guesses from elapsed time", () => {
  it("movingRuns is fed by listMovingTracks, not a driven_at cutoff", () => {
    expect(APP_FRAME).toContain("const fetchMovingTracks = useServerFn(listMovingTracks);");
    expect(APP_FRAME).toContain("const movingRuns = React.useMemo(() => moving.data ?? []");
    // The five-minute driven_at proxy this replaces must be genuinely gone,
    // not just unreferenced by movingRuns -- a stray copy left over would be
    // one query pretending to be retired while still running.
    expect(APP_FRAME).not.toContain("drivenAt !== null && new Date(t.drivenAt)");
  });

  it("the shell's error and loading states cover the new read, not just the old one", () => {
    // Same defect class `a-headline-that-reads-an-error-must-recompute-
    // on-it.test.ts` pins for openTracks: a query movingRuns depends on that
    // is missing from the surrounding guards is a read that can die silently.
    expect(APP_FRAME).toContain("missions.isError || openTracks.isError || moving.isError");
    expect(APP_FRAME).toContain("missions.isLoading || openTracks.isLoading || moving.isLoading");
  });
});

describe("listMovingTracks reads a real running seat, not spine_tracks.status alone", () => {
  const fn = TRACK_FUNCTIONS.slice(
    TRACK_FUNCTIONS.indexOf("export const listMovingTracks"),
    TRACK_FUNCTIONS.indexOf("export const getTrack ="),
  );

  it("is exported and reachable from the shell", () => {
    expect(
      fn.length,
      "listMovingTracks was not found between its own export and getTrack's",
    ).toBeGreaterThan(0);
    expect(APP_FRAME).toContain("listMovingTracks, listTracks");
  });

  it("queries agent_runs for a live status, the same set listRunsForStart's workingByTrack uses", () => {
    expect(fn).toContain('.from("agent_runs")');
    expect(fn).toContain('.in("status", ["running", "queued", "in_progress"])');
  });

  it("open tracks alone are not enough: a track only counts once agent_runs confirms it", () => {
    // spine_tracks.status = 'open' narrows to candidates; the moving set is
    // the intersection with agent_runs, never spine_tracks status by itself.
    expect(fn).toContain('.eq("status", "open")');
    expect(fn).toContain("open.filter((t) => moving.has(t.id))");
  });
});
