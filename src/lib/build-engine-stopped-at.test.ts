/**
 * "Stopped 2 minutes ago" about a build that died last week.
 *
 * `/build`'s Stopped region aged its rows by `updatedAt`, which is the
 * CHANGESET's last touch. That is the right key to sort "most recently touched"
 * by and the wrong answer to "how long has this been stopped". The two agree
 * only when the last thing that happened to a changeset was the run dying — so
 * any edit, retry or status write after the death resets a stopped row's age
 * and the surface reports a fresh number for work nothing has picked up in days.
 *
 * **A surface reading a column no writer sets for the event it describes** is
 * the same class of defect as the three wrong numbers of 2026-08-22, and it is
 * why `stoppedAt` is a separate field rather than a redefinition of `updatedAt`:
 * the sort still needs the old one.
 *
 * Reported by LANE 0's Build census as item 3 of REQ-L0-019, routed to MAIN as
 * queue item 25 because it is a read-model defect rather than a layout one.
 */
import { describe, expect, it } from "bun:test";

import { runEndedAt } from "./build-engine.functions";

describe("when a dead run actually ended", () => {
  /** The exact case: the loop stamps `halted_at` when it stops a run. */
  it("prefers the halt stamp, which is the only exact answer", () => {
    expect(
      runEndedAt({
        halted_at: "2026-08-20T10:00:00.000Z",
        created_at: "2026-08-19T00:00:00.000Z",
        duration_ms: 5_000,
      }),
    ).toBe("2026-08-20T10:00:00.000Z");
  });

  /**
   * A run that FAILED rather than halted leaves no end stamp, but it does leave
   * how long it ran. Reconstructing the end from the start is better than
   * reporting the start as if it were the end.
   */
  it("reconstructs the end from the start and the duration when there is no halt stamp", () => {
    expect(
      runEndedAt({ halted_at: null, created_at: "2026-08-20T10:00:00.000Z", duration_ms: 90_000 }),
    ).toBe("2026-08-20T10:01:30.000Z");
  });

  it("falls back to the start when there is no duration either", () => {
    expect(runEndedAt({ halted_at: null, created_at: "2026-08-20T10:00:00.000Z" })).toBe(
      "2026-08-20T10:00:00.000Z",
    );
  });

  it("ignores a duration that is absent, zero or nonsense rather than trusting it", () => {
    const at = "2026-08-20T10:00:00.000Z";
    expect(runEndedAt({ created_at: at, duration_ms: 0 })).toBe(at);
    expect(runEndedAt({ created_at: at, duration_ms: -5 })).toBe(at);
    expect(runEndedAt({ created_at: at, duration_ms: Number.NaN })).toBe(at);
    expect(runEndedAt({ created_at: at, duration_ms: null })).toBe(at);
  });

  it("survives an unparseable start rather than inventing a date", () => {
    expect(runEndedAt({ created_at: "not a date", duration_ms: 1000 })).toBe("not a date");
  });

  /**
   * THE DIRECTION THIS MUST FAIL IN. A row with nothing to go on answers
   * "unknown", never "now": a made-up recent timestamp on a build that died last
   * week is worse than an absent one, because the surface would state it with
   * the same confidence as a real reading.
   */
  it("answers unknown rather than now when it has nothing", () => {
    expect(runEndedAt({})).toBeNull();
    expect(runEndedAt({ halted_at: null, created_at: null, duration_ms: 4000 })).toBeNull();
  });
});

describe("the read model keeps the two clocks apart", () => {
  it("carries stoppedAt as its own field, so the sort key is untouched", async () => {
    const { readFileSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const src = readFileSync(
      fileURLToPath(new URL("./build-engine.functions.ts", import.meta.url)),
      "utf8",
    );
    expect(src).toContain("stoppedAt: string | null;");
    // `updatedAt` still comes off the changeset, because sorting by "most
    // recently touched" is what it is for and that is still correct.
    expect(src).toContain("updatedAt: r.updated_at");
    // And the halt time is read from the runs, not from the changeset.
    expect(src).toContain("halted_at,created_at,duration_ms");
  });

  /**
   * Null on a healthy row, and null when the runs read failed. The surface must
   * then say nothing rather than fall back to `updatedAt`, which is the wrong
   * number wearing a confident face.
   */
  it("is null unless the row is actually stopped", async () => {
    const { readFileSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const src = readFileSync(
      fileURLToPath(new URL("./build-engine.functions.ts", import.meta.url)),
      "utf8",
    );
    const at = src.indexOf("stoppedAt:\n");
    const emit = src.slice(at, at + 260);
    expect(emit).toContain("stoppedSet.has(r.mission_id)");
    expect(emit).toContain("!liveSet.has(r.mission_id)");
    expect(emit).toContain(": null");
  });
});
