import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { cancelPendingApprovalsForTrack } from "./a-stop-cancels-its-asks";

/**
 * F-205: a person's Stop used to leave the run's pending approvals on Waiting.
 * The fake client records what it was asked so the test can say what a stop
 * cancels and what it leaves alone.
 */
function fakeClient(opts: {
  runs?: Array<{ id: string }> | null;
  runsError?: string;
  cancelled?: Array<{ id: string }>;
  updateError?: string;
}) {
  const asked: Array<{ patch: Record<string, unknown>; runIds: string[]; status: string }> = [];
  const client = {
    from: (table: string) => ({
      select: () => ({
        eq: () =>
          Promise.resolve(
            table === "agent_runs"
              ? {
                  data: opts.runs ?? [],
                  error: opts.runsError ? { message: opts.runsError } : null,
                }
              : { data: [], error: null },
          ),
      }),
      update: (patch: Record<string, unknown>) => ({
        in: (_col: string, runIds: string[]) => ({
          eq: (_c: string, status: string) => ({
            select: () => {
              asked.push({ patch, runIds, status });
              return Promise.resolve({
                data: opts.cancelled ?? [],
                error: opts.updateError ? { message: opts.updateError } : null,
              });
            },
          }),
        }),
      }),
    }),
  };
  return { client, asked };
}

describe("a stop cancels the questions the run was still asking", () => {
  it("cancels only the pending approvals of the track's own runs, with who and why", async () => {
    const { client, asked } = fakeClient({
      runs: [{ id: "run-1" }, { id: "run-2" }],
      cancelled: [{ id: "a-1" }],
    });
    const r = await cancelPendingApprovalsForTrack(
      client,
      "track-1",
      { userId: "u-1", reason: "Stopped by you." },
      "2026-09-08T08:00:00.000Z",
    );
    expect(r).toEqual({ ok: true, cancelled: 1 });
    expect(asked).toEqual([
      {
        patch: {
          status: "cancelled",
          decided_at: "2026-09-08T08:00:00.000Z",
          decided_by: "u-1",
          decision_reason: "Stopped by you.",
        },
        runIds: ["run-1", "run-2"],
        status: "pending",
      },
    ]);
  });

  it("a track with no runs asked nothing, so nothing is written", async () => {
    const { client, asked } = fakeClient({ runs: [] });
    expect(
      await cancelPendingApprovalsForTrack(client, "t", { userId: null, reason: "x" }),
    ).toEqual({
      ok: true,
      cancelled: 0,
    });
    expect(asked).toEqual([]);
  });

  it("a failed read or write is a refusal in words, never a clean stop", async () => {
    const read = await cancelPendingApprovalsForTrack(
      fakeClient({ runsError: "boom" }).client,
      "t",
      {
        userId: null,
        reason: "x",
      },
    );
    expect(read.ok).toBe(false);
    expect(read.ok ? "" : read.refused).toContain("could not be read: boom");
    const write = await cancelPendingApprovalsForTrack(
      fakeClient({ runs: [{ id: "r" }], updateError: "denied" }).client,
      "t",
      { userId: null, reason: "x" },
    );
    expect(write.ok).toBe(false);
    expect(write.ok ? "" : write.refused).toContain("could not be cancelled: denied");
  });

  it("both stop paths call it: the person's press and the driver's stop branch", () => {
    const tracks = readFileSync("src/lib/spine/track.functions.ts", "utf8");
    const from = tracks.indexOf("export const stopTrack ");
    const end = tracks.indexOf("\nexport ", from + 1);
    const stop = tracks.slice(from, end);
    expect(from).toBeGreaterThan(-1);
    expect(stop).toContain("cancelPendingApprovalsForTrack(");
    const driver = readFileSync("src/lib/spine/driver.server.ts", "utf8");
    const at = driver.indexOf("last_hold_because: STOPPED_BY_YOU");
    expect(at).toBeGreaterThan(-1);
    // Within the stop branch: the cancel follows the hold write, before the return.
    expect(driver.slice(at, at + 2000)).toContain("cancelPendingApprovalsForTrack(");
  });
});
