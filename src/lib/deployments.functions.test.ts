import { describe, test, expect } from "bun:test";
import { attachDeploymentToTrackSafe } from "@/lib/deployments.functions";
import { trackIdByChangeset } from "@/lib/changelog";

/**
 * P-30 (A-QUEUE.md). `spine_track_members` held zero `deployment` rows ever
 * measured (P-28 census) against 42+ successful promotes on record. Not
 * because `attach.ts`'s `TOOL_PRODUCTS["release.publish"]` entry was wrong --
 * it was correct the whole time -- but because nothing ever called the write:
 * `release.publish` (the agent's tool) is the only door dispatched through
 * `driveTrackOnce`, and `promoteToProduction` (the person's, straight off
 * `/ship`) calls the same core directly and was invisible to the spine
 * regardless. `attachDeploymentToTrackSafe` is filed at that shared core
 * (`promoteChangesetToProductionCore`) so both doors write the same row.
 */

type Upsert = { table: string; values: unknown; onConflict: string | undefined };

function fakeDb(opts: { runs: Array<{ mission_id: string | null; track_id: string | null }> }) {
  const upserts: Upsert[] = [];
  const db = {
    from(table: string) {
      if (table === "agent_runs") {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          order() {
            return Promise.resolve({ data: opts.runs, error: null });
          },
        };
      }
      if (table === "spine_track_members") {
        return {
          upsert(values: unknown, upsertOpts: { onConflict?: string }) {
            upserts.push({ table, values, onConflict: upsertOpts?.onConflict });
            return Promise.resolve({ error: null });
          },
        };
      }
      throw new Error(`fakeDb: unexpected table ${table}`);
    },
  };
  return { db, upserts };
}

describe("attachDeploymentToTrackSafe", () => {
  test("files the member on the track its own mission's run belongs to", async () => {
    const { db, upserts } = fakeDb({
      runs: [{ mission_id: "m-1", track_id: "t-1" }],
    });

    await attachDeploymentToTrackSafe(db as never, "cs-1", "m-1", "d-1");

    expect(upserts).toHaveLength(1);
    expect(upserts[0]!.values).toEqual({
      track_id: "t-1",
      artifact_kind: "deployment",
      artifact_id: "d-1",
      station: "ship",
    });
    expect(upserts[0]!.onConflict).toBe("track_id,artifact_kind,artifact_id");
  });

  test("agrees with listChangelog's own resolution -- the member lands on the SAME track the run screen would open", async () => {
    // The exact two-hop fixture shape `changelog.test.ts` exercises: a
    // changeset naming a mission, and that mission's own run naming a track.
    const changesets = [{ id: "cs-1", mission_id: "m-1" }];
    const runs = [{ mission_id: "m-1", track_id: "t-1" }];
    const { db, upserts } = fakeDb({ runs });

    await attachDeploymentToTrackSafe(db as never, "cs-1", "m-1", "d-1");

    const trackViaChangelog = trackIdByChangeset(changesets, runs).get("cs-1");
    expect((upserts[0]!.values as { track_id: string }).track_id).toBe(trackViaChangelog);
  });

  test("stays silent, and writes nothing, when the changeset has no mission", async () => {
    const { db, upserts } = fakeDb({ runs: [] });

    await attachDeploymentToTrackSafe(db as never, "cs-1", null, "d-1");

    expect(upserts).toHaveLength(0);
  });

  test("stays silent when the mission was never dispatched through a track (R-35)", async () => {
    const { db, upserts } = fakeDb({
      runs: [{ mission_id: "m-1", track_id: null }],
    });

    await attachDeploymentToTrackSafe(db as never, "cs-1", "m-1", "d-1");

    expect(upserts).toHaveLength(0);
  });

  test("a write failure is absorbed -- the deployment row already exists regardless", async () => {
    const runs = [{ mission_id: "m-1", track_id: "t-1" }];
    const db = {
      from(table: string) {
        if (table === "agent_runs") {
          return {
            select() {
              return this;
            },
            eq() {
              return this;
            },
            order() {
              return Promise.resolve({ data: runs, error: null });
            },
          };
        }
        return {
          upsert() {
            throw new Error("connection reset");
          },
        };
      },
    };

    // Must not throw: this runs after the deploy has already gone live.
    await expect(
      attachDeploymentToTrackSafe(db as never, "cs-1", "m-1", "d-1"),
    ).resolves.toBeUndefined();
  });
});
