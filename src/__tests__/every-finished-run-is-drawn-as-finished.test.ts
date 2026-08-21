/**
 * EVERY SPELLING PRODUCTION WRITES IS ENUMERATED HERE, AND THE LIST IS MEASURED.
 *
 * `mapRelayStatus` had a done arm of `completed` and `done`, and a
 * `default: return "idle"`. Counted on `agent_runs` in production 2026-08-20,
 * over 1,825 rows, the table holds exactly six spellings:
 *
 *   completed                  690   37.8%   ->  done
 *   completed_with_failures     618   33.9%   ->  WAS idle
 *   failed                     500   27.4%   ->  failed
 *   halted                       8    0.4%   ->  failed
 *   waiting_approval             7    0.4%   ->  gate
 *   complete                     2    0.1%   ->  WAS idle
 *
 * So 620 runs, 34.0%, were finished and drawn as nothing happening, on two
 * mounted surfaces (DiscoverSurface.tsx and MissionOrchestratorDetail.tsx).
 * Meanwhile `done`, the arm the code did carry, is written zero times.
 *
 * THE REASON IT SURVIVED IS THAT NO TEST ENUMERATED WHAT PRODUCTION WRITES.
 * The mapping was internally consistent and every gate passed. So this file
 * pins the mapping to the measured list rather than to a plausible one, which
 * is also what stops a seventh spelling landing quietly: when a writer invents
 * one, it lands in `default` and reads as idle, and the only thing that can
 * catch that is a list somebody had to update on purpose.
 *
 * The counts above are a snapshot, not a live figure. If a later reader
 * re-measures and finds a seventh spelling, ADD IT HERE, and give it an arm in
 * `relay.ts` rather than widening the fallback.
 */
import { describe, expect, it } from "bun:test";

import { mapRelayStatus, type RelayStatus } from "../lib/relay";

/** The six, exactly as production spells them, with their measured counts. */
const MEASURED: ReadonlyArray<{ status: string; runs: number; expected: RelayStatus }> = [
  { status: "completed", runs: 690, expected: "done" },
  { status: "completed_with_failures", runs: 618, expected: "done" },
  { status: "failed", runs: 500, expected: "failed" },
  { status: "halted", runs: 8, expected: "failed" },
  { status: "waiting_approval", runs: 7, expected: "gate" },
  { status: "complete", runs: 2, expected: "done" },
];

describe("mapRelayStatus covers every status production writes", () => {
  it("maps none of the six measured spellings to idle", () => {
    const drawnIdle = MEASURED.filter(({ status }) => mapRelayStatus(status) === "idle");
    expect(drawnIdle.map((m) => m.status)).toEqual([]);
  });

  it("maps each measured spelling to its ruled relay status", () => {
    for (const { status, expected } of MEASURED) {
      expect(mapRelayStatus(status)).toBe(expected);
    }
  });

  it("accounts for all 1,825 measured rows, so the list is the whole table", () => {
    expect(MEASURED.reduce((n, m) => n + m.runs, 0)).toBe(1825);
  });

  // The trio the defect actually turned on. `complete` is what runAgent writes
  // on the happy path, `completed` is what the loop writes, and
  // `completed_with_failures` is a third of the table. All three are finished.
  it("reads the complete / completed / completed_with_failures trio as done", () => {
    expect(mapRelayStatus("complete")).toBe("done");
    expect(mapRelayStatus("completed")).toBe("done");
    expect(mapRelayStatus("completed_with_failures")).toBe("done");
  });

  // Ruled in relay.ts: the relay asks whether anyone is still working, not
  // whether the work was clean. A run that finished with failures is finished,
  // and the hole in what it shipped belongs to the run detail.
  it("does not draw a run that finished with failures as failed or idle", () => {
    const s = mapRelayStatus("completed_with_failures");
    expect(s).not.toBe("idle");
    expect(s).not.toBe("failed");
  });

  it("keeps the done arm, which production writes zero times", () => {
    expect(mapRelayStatus("done")).toBe("done");
  });

  // The mapper lowercases before switching, so a writer that changes case does
  // not reopen the defect. Whitespace is NOT trimmed today and this records
  // that rather than asserting it should be.
  it("reads the measured spellings case-insensitively", () => {
    expect(mapRelayStatus("COMPLETED_WITH_FAILURES")).toBe("done");
    expect(mapRelayStatus("Complete")).toBe("done");
  });

  it("still falls to idle for a status nothing writes, and for nothing at all", () => {
    expect(mapRelayStatus(null)).toBe("idle");
    expect(mapRelayStatus(undefined)).toBe("idle");
    expect(mapRelayStatus("")).toBe("idle");
    expect(mapRelayStatus("wat")).toBe("idle");
  });
});
