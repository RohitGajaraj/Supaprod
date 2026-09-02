/**
 * A STOP A PERSON PRESSED HAS TO OUTLIVE THE TAB THEY PRESSED IT IN.
 *
 * ── WHAT STOP DID BEFORE, IN FULL ─────────────────────────────────────────
 * `stopRef.current = () => setLegsLeft(0)`. That is the whole of it. It cancels
 * the automatic steps THIS BROWSER TAB would have bought next; the step already
 * dispatched finishes, which is honest and is why the control has always said
 * "Stop after this step". Then the sweep drives the same track again on its next
 * tick, because nothing on the record ever said a person asked it to stop.
 *
 * So pressing Stop and closing the page had identical effect ten minutes later,
 * which means the control and doing nothing were indistinguishable. That is the
 * affordance failure the run screen has already paid for once on `RunMap`'s own
 * Stop, in its more expensive form: a control that appears to work.
 *
 * ── WHAT THESE TESTS PIN ──────────────────────────────────────────────────
 *  - the read exists, answers from the column, and is exported so it can be
 *    driven at all;
 *  - it FAILS OPEN, which is the opposite of the kill switch beside it, and the
 *    reason is deployment order rather than a view about stopping;
 *  - the check sits AFTER the gate harvest and BEFORE every dispatch decision,
 *    which is the placement the two halves of the behaviour depend on;
 *  - the press clears it and a continuation does not, because a continuation is
 *    the client walking on from a closed window and nobody pressed anything.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { stopRequestedAt } from "./driver.server";
import { STOPPED_BY_YOU } from "./driver";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
const DRIVER = read("./driver.server.ts");
const WATCHED = read("./track.functions.ts");
const MIGRATION = read(
  "../../../supabase/migrations/20260902010000_a_stop_is_a_row_the_driver_reads.sql",
);

/**
 * A Supabase stand-in for one `select ... eq ... maybeSingle` against
 * `spine_tracks`. It can answer with a row, with a PostgREST error, or by
 * throwing, which are the three things the real client does.
 */
function fakeClient(answer: {
  row?: { stop_requested_at: string | null };
  error?: { code?: string; message?: string };
  throws?: boolean;
}) {
  const asked: Array<{ table: string; columns: string; id: string }> = [];
  return {
    asked,
    from(table: string) {
      if (answer.throws) throw new Error("connection reset");
      return {
        select(columns: string) {
          return {
            eq(_col: string, id: string) {
              asked.push({ table, columns, id });
              return {
                maybeSingle: async () => ({
                  data: answer.row ?? null,
                  error: answer.error ?? null,
                }),
              };
            },
          };
        },
      };
    },
  };
}

describe("the stop is a row, so the loop can see it", () => {
  it("answers with the instant a person asked, off the track's own row", async () => {
    const client = fakeClient({ row: { stop_requested_at: "2026-09-02T13:04:00Z" } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- a stand-in for one query
    const at = await stopRequestedAt(client as any, "t1");
    expect(at).toBe("2026-09-02T13:04:00Z");
    expect(client.asked).toEqual([
      { table: "spine_tracks", columns: "stop_requested_at", id: "t1" },
    ]);
  });

  it("answers null when nobody asked, which is the common case", async () => {
    const client = fakeClient({ row: { stop_requested_at: null } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- a stand-in for one query
    expect(await stopRequestedAt(client as any, "t1")).toBeNull();
  });

  /**
   * THE DIRECTION OF FAILURE, WHICH IS THE OPPOSITE OF `isPaused` TEN LINES
   * ABOVE IT IN THE SAME FILE, AND DELIBERATELY.
   *
   * The kill switch fails CLOSED: an unreadable "stop everything" must stop
   * everything. This one must not, and the reason is deployment order. The
   * column arrives in its own migration, and a build carrying this code against
   * a database that has not taken it yet would read an error on every track and
   * freeze the entire product. The cost of failing open is bounded: the sweep
   * asks again on its next tick, so a transient failure delays a stop by one
   * tick rather than dropping it, and the tab that pressed has already cancelled
   * its own steps.
   */
  it("treats a read it cannot make as nobody having asked", async () => {
    const missingColumn = fakeClient({
      error: { code: "42703", message: 'column "stop_requested_at" does not exist' },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- a stand-in for one query
    expect(await stopRequestedAt(missingColumn as any, "t1")).toBeNull();

    const broken = fakeClient({ error: { message: "upstream timeout" } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- a stand-in for one query
    expect(await stopRequestedAt(broken as any, "t1")).toBeNull();

    const thrown = fakeClient({ throws: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- a stand-in for one query
    expect(await stopRequestedAt(thrown as any, "t1")).toBeNull();
  });
});

describe("it blocks the dispatch, in the one place both callers go through", () => {
  /**
   * `driveTrackOnce` is the single door: `driveTrackNow` drives it for a person
   * watching, `track-tick` drives it for the sweep, and neither has its own
   * copy of the rule. A check anywhere else would bind one caller and not the
   * other, which is exactly what the old in-tab Stop did.
   */
  it("is read inside driveTrackOnce and nowhere else", () => {
    expect(DRIVER).toContain("const stoppedAt = await stopRequestedAt(supabase, row.id);");
    const at = DRIVER.indexOf("const stoppedAt = await stopRequestedAt");
    const fn = DRIVER.indexOf("export async function driveTrackOnce(");
    expect(fn).toBeGreaterThan(-1);
    expect(at).toBeGreaterThan(fn);
  });

  /**
   * PLACEMENT IS THE DESIGN, and both halves of it are load-bearing.
   *
   * AFTER the harvest, because an artifact produced through a gate belongs to
   * this track whether or not this tick is allowed to run anything, and a stop
   * that swallowed it would lose work that already happened.
   *
   * BEFORE `decideDrive`, because everything from there on either reads a brief
   * for a seat or dispatches one, and a stop means exactly "start no more
   * seats".
   */
  it("sits after the gate harvest and before any decision to dispatch", () => {
    const harvest = DRIVER.indexOf("const harvested = gates.filed;");
    const check = DRIVER.indexOf("const stoppedAt = await stopRequestedAt");
    const decide = DRIVER.indexOf("const decision = decideDrive({");
    expect(harvest).toBeGreaterThan(-1);
    expect(decide).toBeGreaterThan(-1);
    expect(check).toBeGreaterThan(harvest);
    expect(check).toBeLessThan(decide);
  });

  it("holds `paused` and says who did it, in the column built for that", () => {
    const block = DRIVER.slice(
      DRIVER.indexOf("const stoppedAt = await stopRequestedAt"),
      DRIVER.indexOf("const decision = decideDrive({"),
    );
    expect(block).toContain('last_hold: "paused"');
    expect(block).toContain("last_hold_because: STOPPED_BY_YOU");
    expect(block).toContain('hold: "paused"');
    // The sentence itself, so the surfaces comparing against it cannot drift.
    expect(STOPPED_BY_YOU).toBe("Stopped by you.");
  });

  it("still reports what the gates it harvested produced", () => {
    /*
     * A stop is not a reason to hide work that happened. The line carries
     * `describeAttachments(harvested)` when the harvest filed anything, which is
     * the same shape every other hold path on this function uses.
     */
    const block = DRIVER.slice(
      DRIVER.indexOf("const stoppedAt = await stopRequestedAt"),
      DRIVER.indexOf("const decision = decideDrive({"),
    );
    expect(block).toContain("describeAttachments(harvested)");
    expect(block).toContain("attached: harvested");
  });
});

describe("the way out is the control that made it", () => {
  it("clears the column on a press and never on a continuation", () => {
    const clear = WATCHED.indexOf('if (data.origin === "press") {');
    expect(clear).toBeGreaterThan(-1);
    const block = WATCHED.slice(clear, clear + 600);
    expect(block).toContain("stop_requested_at: null");
    /*
     * A continuation is this client walking on from a step whose window closed.
     * Nobody pressed anything, so a continuation that cleared the column would
     * let a run the person stopped restart itself on the very next tick, which
     * is the whole failure the column exists to prevent. The sweep never clears
     * it either, and the driver has no write to this column at all.
     */
    expect(block).not.toContain("continuation");
  });

  it("refuses honestly rather than reporting a stop it could not make", () => {
    const fn = WATCHED.indexOf("export const stopTrack = createServerFn");
    expect(fn).toBeGreaterThan(-1);
    const block = WATCHED.slice(fn, WATCHED.indexOf("export const driveTrackNow"));
    // A settled run has nothing to stop, and says which kind of settled it is.
    expect(block).toContain("already finished");
    expect(block).toContain("already abandoned");
    // The deploy-order case gets its own words rather than a generic failure.
    expect(block).toContain('error.code === "42703"');
    expect(block).toContain("has not taken the stop column yet");
  });
});

describe("the migration says what it adds and refuses the default-as-data trap", () => {
  it("adds one nullable timestamp and no default", () => {
    expect(MIGRATION).toContain("ADD COLUMN IF NOT EXISTS stop_requested_at timestamptz");
    // A `NOT NULL DEFAULT false` would make "nobody asked" and "asked and
    // withdrawn" the same byte, and a boolean would lose WHEN.
    expect(MIGRATION).not.toMatch(/stop_requested_at\s+boolean/i);
    expect(MIGRATION).not.toMatch(/stop_requested_at[^;]*NOT NULL/i);
  });
});
