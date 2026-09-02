/**
 * F-72. BUILD HANDED ON A CHANGESET THAT HAD NEVER LEFT THE PLATFORM.
 *
 * Measured on the live acceptance run, 2026-08-25:
 *
 * ```
 * 16:40:40  studio.stage   ok
 * 16:40:55  studio.stage   ok
 * 16:41:16  studio.stage   ok      <- no studio.commit, no studio.pr.open
 * 16:41:21  build -> ship  (sweep) <- four seconds later
 * 16:50     ship: github.ci.read FALSE, produced-nothing
 * ```
 *
 * **WHY BOTH EXISTING GATES PASSED IT, which is the defect.**
 * `STATION_ARTIFACT.build` is `createdBy: "studio.stage"`, so staging alone files
 * Build's artifact and `producedThisVisit` is true. `STATION_NEEDS.ship` asks for
 * a `changeset`, and a staged row **is** a changeset, so `needIsMet` is true.
 * **Both ask whether a thing of the right KIND exists. Neither asks whether it is
 * FINISHED.**
 *
 * The cost is a cycle, not a wrong row: Ship finds no pull request, files
 * nothing, burns its attempts, and the correction sends the work back to Build —
 * the 13:21 and 14:50 bounces repeating at ~90 seconds of real crew work each.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

import { STATION_ARTIFACT } from "@/lib/spine/attach";
import { STATION_NEEDS } from "@/lib/spine/correction";

const DRIVER = readFileSync(fileURLToPath(new URL("./driver.server.ts", import.meta.url)), "utf8");

describe("the two gates that let it through are still exactly as they were", () => {
  /**
   * Pinned so the reason this happened cannot quietly change underneath the fix.
   * If either of these moves, the new gate may be redundant — or may be the only
   * thing standing.
   */
  it("Build's artifact is still filed by staging", () => {
    expect(STATION_ARTIFACT.build.createdBy).toBe("studio.stage");
    expect(STATION_ARTIFACT.build.kind).toBe("changeset");
  });

  it("Ship still asks only for a changeset by KIND, which a staged row satisfies", () => {
    expect(STATION_NEEDS.ship.kinds).toContain("changeset");
  });
});

describe("Build will not hand on a change that never left the platform", () => {
  const gate = DRIVER.slice(DRIVER.indexOf("F-72."), DRIVER.indexOf("if (!needIsMet("));

  /*
   * ── AND FOR ITS WHOLE LIFE THIS GATE NEVER FIRED (found 2026-09-03) ──────
   *
   * These assertions passed from the day they were written and the gate did
   * nothing, because they checked that the query was WRITTEN, never that it
   * could return a row. It read `studio_changesets` with `.eq("track_id",
   * row.id)`, and that table has twenty-two columns of which `track_id` is not
   * one -- the link to a track is `mission_id`. PostgREST answers an unknown
   * column with 42703 and no rows, the error was not read, and `csStatus` was
   * null on every track ever driven.
   *
   * Found only when the same wrong join was copied into two NEW gates and one of
   * them was watched on a live run. The lesson this file should carry: a source
   * guard proves the shape of a decision, and it cannot prove the query behind it
   * reaches anything. That half needs the database.
   */
  it("refuses when the newest changeset is still staged", () => {
    expect(gate).toContain('csStatus === "staged"');
  });

  it("reads the changeset through the mission, which is the only link that exists", () => {
    expect(gate).toContain("await newestChangesetForTrack(supabase, row.id,");
    const reader = DRIVER.slice(
      DRIVER.indexOf("async function newestChangesetForTrack("),
      DRIVER.indexOf("async function openBranchForTrack("),
    );
    expect(reader).toContain('.eq("artifact_kind", "mission")');
    expect(reader).toContain('.in("mission_id", missionIds)');
    // The column that never existed, gone from the whole driver.
    expect(DRIVER).not.toMatch(/from\("studio_changesets"\)[\s\S]{0,200}?track_id/);
  });

  /**
   * REFUSES ON ONE VALUE, does not allow-list the rest. `committed`, `pr_open`
   * and `merged` all mean a branch exists for Ship to point at; a status added
   * later should keep working by default rather than silently blocking every
   * track until someone remembers this line.
   */
  it("names only the failing status, so a future status is not blocked by omission", () => {
    for (const ok of ["committed", "pr_open", "merged"]) {
      expect(gate, `${ok} must not be enumerated`).not.toContain(`"${ok}"`);
    }
  });

  /**
   * READ FRESH, not from `attached`. A crew may stage and then commit inside one
   * visit; judging it on the row it created first would hold work that is
   * genuinely finished — which would be a worse bug than the one being fixed.
   */
  it("reads the changeset's current status rather than the visit's own rows", () => {
    // Now a property of the shared reader rather than of this call site, which
    // is what stops the next gate re-deriving it and getting it wrong again.
    const reader = DRIVER.slice(
      DRIVER.indexOf("async function newestChangesetForTrack("),
      DRIVER.indexOf("async function openBranchForTrack("),
    );
    expect(reader).toMatch(/order\("created_at", \{ ascending: false \}\)/);
    expect(reader).toContain(".limit(1)");
  });

  /**
   * The hold has to be the resumable one. `produced-nothing` counts against the
   * station and would push a track that DID work toward `given-up`;
   * `nothing-to-hand-on` says the work is not ready to pass on, which is what
   * actually happened.
   */
  it("holds as nothing-to-hand-on, not produced-nothing", () => {
    expect(gate).toContain('last_hold: "nothing-to-hand-on"');
    expect(gate).not.toContain('last_hold: "produced-nothing"');
  });

  /** F-24: a refusal that does not say what to do next gets the same behaviour under a new name. */
  it("tells the crew exactly which two calls are missing", () => {
    expect(gate).toContain("studio.commit");
    expect(gate).toContain("studio.pr.open");
  });

  it("applies to Build only, so no other station inherits a changeset rule", () => {
    expect(gate).toContain('station === "build"');
  });
});
