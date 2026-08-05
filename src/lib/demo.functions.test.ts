/**
 * The /demo page is the second thing a launch visitor sees, and a launch audit
 * on 2026-08-05 found it arguing that the loop stalls: it counted halted runs
 * as "missions in flight", and it headlined "One mission, in motion" over the
 * newest mission, which had been halted for sixteen days.
 *
 * These tests pin the two decisions that fixed it - how a row status becomes
 * an outcome word, and which mission gets to be the demo's climax - against
 * the actual shape of the live demo workspace (32 halted, 1 completed, 0
 * running). They are pure: the server functions do the reads, these helpers do
 * the judging, and the judging is what was wrong.
 */
import { describe, it, expect } from "bun:test";
import {
  missionOutcome,
  stepState,
  missionDemoRank,
  pickDemoMission,
  DELIVERED_MISSION_STATUSES,
  OPEN_MISSION_STATUSES,
  type MissionCandidate,
} from "./demo.functions";

describe("missionOutcome", () => {
  it("does not call a halted mission in flight", () => {
    expect(missionOutcome("halted")).toBe("stopped");
  });

  it("reads a finished mission as delivered", () => {
    for (const s of DELIVERED_MISSION_STATUSES) {
      expect(missionOutcome(s)).toBe("delivered");
    }
  });

  it("keeps a mission that is waiting on a human out of the stopped bucket", () => {
    for (const s of OPEN_MISSION_STATUSES) {
      expect(missionOutcome(s)).toBe("open");
    }
  });

  it("reads every other ending as stopped, never as a win", () => {
    for (const s of ["failed", "cancelled", "completed_with_failures", "", "wat"]) {
      expect(missionOutcome(s)).toBe("stopped");
    }
    expect(missionOutcome(null)).toBe("stopped");
    expect(missionOutcome(undefined)).toBe("stopped");
  });

  it("buckets the live workspace exhaustively: delivered + open + stopped is every mission", () => {
    // The real distribution, verified against the demo workspace.
    const live = [...Array(32).fill("halted"), "completed"];
    const counts = { delivered: 0, open: 0, stopped: 0 };
    for (const s of live) counts[missionOutcome(s)] += 1;
    expect(counts).toEqual({ delivered: 1, open: 0, stopped: 32 });
    expect(counts.delivered + counts.open + counts.stopped).toBe(live.length);
  });
});

describe("stepState", () => {
  it("counts this table's own word for finished", () => {
    // mission_steps writes `done`, not `completed`. Matching only on
    // "completed" reported a finished four-agent trace as zero work done,
    // which is how the delivered mission lost to a stalled one.
    expect(stepState("done")).toBe("done");
    expect(stepState("completed")).toBe("done");
  });

  it("separates work in hand from work not started", () => {
    expect(stepState("running")).toBe("working");
    expect(stepState("dispatched")).toBe("working");
    expect(stepState("planned")).toBe("planned");
  });

  it("never reports an unknown state as done", () => {
    expect(stepState("exploded")).toBe("stopped");
    expect(stepState(null)).toBe("stopped");
  });
});

const mission = (
  id: string,
  status: string,
  createdAt: string,
  finishedAt: string | null = null,
): MissionCandidate => ({ id, title: id, status, createdAt, finishedAt });

describe("missionDemoRank", () => {
  it("ranks a delivered mission with finished work above everything else", () => {
    const delivered = missionDemoRank(mission("a", "completed", "2026-07-09"), 4);
    expect(delivered).toBeLessThan(missionDemoRank(mission("b", "running", "2026-07-20"), 2));
    expect(delivered).toBeLessThan(missionDemoRank(mission("c", "completed", "2026-07-21"), 0));
    expect(delivered).toBeLessThan(missionDemoRank(mission("d", "halted", "2026-07-20"), 3));
  });

  it("ranks a stopped mission last, however recent it is", () => {
    const stopped = missionDemoRank(mission("d", "halted", "2026-08-05"), 3);
    expect(stopped).toBeGreaterThan(missionDemoRank(mission("e", "queued", "2026-01-01"), 0));
  });
});

describe("pickDemoMission", () => {
  it("picks the completed mission with real evidence over the newest halted chore", () => {
    // The live workspace, reduced: the newest mission is the halted chore the
    // page used to headline, and the only completed mission is 11 days older.
    const candidates = [
      mission("add-version-endpoint", "halted", "2026-07-20T13:50:29Z"),
      mission("create-status-function", "halted", "2026-07-20T13:37:19Z"),
      mission("add-todo-md", "halted", "2026-07-09T17:00:00Z"),
      mission("add-version-file", "completed", "2026-07-09T16:48:07Z", "2026-07-09T17:13:05Z"),
    ];
    const finished = new Map([
      ["add-version-file", 4],
      ["add-version-endpoint", 1],
    ]);

    const picked = pickDemoMission(candidates, finished);
    expect(picked?.id).toBe("add-version-file");
    expect(missionOutcome(picked!.status)).toBe("delivered");
  });

  it("prefers the freshest evidence when two missions demonstrate equally well", () => {
    const candidates = [
      mission("older", "completed", "2026-06-01T00:00:00Z", "2026-06-01T01:00:00Z"),
      mission("newer", "completed", "2026-07-01T00:00:00Z", "2026-07-01T01:00:00Z"),
    ];
    const finished = new Map([
      ["older", 3],
      ["newer", 3],
    ]);
    expect(pickDemoMission(candidates, finished)?.id).toBe("newer");
  });

  it("falls back to a live mission when nothing has been delivered", () => {
    const candidates = [
      mission("halted-one", "halted", "2026-07-20T00:00:00Z"),
      mission("running-one", "running", "2026-07-02T00:00:00Z"),
    ];
    const finished = new Map([["running-one", 2]]);
    const picked = pickDemoMission(candidates, finished);
    expect(picked?.id).toBe("running-one");
    expect(missionOutcome(picked!.status)).toBe("open");
  });

  it("still returns a stopped mission when that is all there is, and calls it stopped", () => {
    // The honest floor. The section is not hidden and the mission is not
    // dressed up: the outcome travelling with it is "stopped", which is what
    // the heading and the tone on the page are driven by.
    const candidates = [
      mission("halted-newer", "halted", "2026-07-20T00:00:00Z"),
      mission("halted-with-work", "halted", "2026-07-09T00:00:00Z"),
    ];
    const finished = new Map([["halted-with-work", 2]]);
    const picked = pickDemoMission(candidates, finished);
    expect(picked?.id).toBe("halted-with-work");
    expect(missionOutcome(picked!.status)).toBe("stopped");
  });

  it("returns null only when the workspace holds no missions at all", () => {
    expect(pickDemoMission([], new Map())).toBeNull();
  });

  it("does not fall over on an unparseable timestamp", () => {
    const candidates = [
      mission("bad-date", "completed", "not-a-date", null),
      mission("good-date", "completed", "2026-07-01T00:00:00Z", "2026-07-01T01:00:00Z"),
    ];
    const finished = new Map([
      ["bad-date", 1],
      ["good-date", 1],
    ]);
    expect(pickDemoMission(candidates, finished)?.id).toBe("good-date");
  });
});
