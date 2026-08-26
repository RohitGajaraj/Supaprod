/**
 * THE MARK MAY NOT SAY "CLEAR" WHEN NOBODY KNOWS.
 *
 * S0's derivation (`src/lib/presence/collision.ts`) is already tested for the
 * rule that keeps it from crying wolf: a shared READ is not a collision. These
 * tests cover the half that is S2's, and the failure they exist to prevent is
 * the opposite one and the more dangerous.
 *
 * **A collision surface fails by reporting people as apart when nobody knows.**
 * Three distinct populations can produce that lie — runs whose correlation was
 * never recorded (F-93), runs whose newest call named no target, and overlaps on
 * work that has no row on this board — and every one of them arrives at the same
 * place: a zero. So each is asserted separately, and the sentence a person reads
 * has to keep them apart.
 *
 * The mirror failure is asserted too, because the brief names it: *"a dedupe
 * screen that returns nothing is worse than none."* A quiet answer must be said
 * OUT LOUD, not drawn as an empty region.
 */
import { describe, expect, it } from "bun:test";

import type { Anchor, Collision } from "@/lib/presence/collision";
import {
  check,
  checkLine,
  contestedOverlapsByMission,
  overlapLine,
  type Overlap,
} from "./overlaps";

const anchor = (over: Partial<Anchor> & Pick<Anchor, "runId">): Anchor => ({
  agentSlug: "engineer",
  missionId: "m1",
  toolName: "prd.revise",
  targetKind: "file",
  targetId: "src/app.ts",
  createdAt: "2026-08-26T15:00:00Z",
  ...over,
});

const collision = (over: Partial<Collision> = {}): Collision => ({
  targetKind: "file",
  targetId: "src/app.ts",
  runs: [
    { runId: "r1", agentSlug: "engineer", toolName: "prd.revise" },
    { runId: "r2", agentSlug: "planner", toolName: "repo.read" },
  ],
  contested: true,
  ...over,
});

describe("which board rows carry a mark", () => {
  it("joins a contested overlap to the mission its run belongs to", () => {
    const map = contestedOverlapsByMission(
      [anchor({ runId: "r1", missionId: "m1" }), anchor({ runId: "r2", missionId: "m2" })],
      [collision()],
    );
    expect(map.size).toBe(2);
    expect(map.get("m1")!.others.map((o) => o.runId)).toEqual(["r2"]);
    expect(map.get("m2")!.others.map((o) => o.runId)).toEqual(["r1"]);
  });

  it("never lists a row against itself", () => {
    const map = contestedOverlapsByMission([anchor({ runId: "r1" })], [collision()]);
    expect(map.get("m1")!.others.some((o) => o.runId === "r1")).toBe(false);
  });

  it("leaves a shared read unmarked — this is the always-on failure", () => {
    const shared = collision({
      contested: false,
      runs: [
        { runId: "r1", agentSlug: "engineer", toolName: "repo.read" },
        { runId: "r2", agentSlug: "planner", toolName: "prd.get" },
      ],
    });
    expect(contestedOverlapsByMission([anchor({ runId: "r1" })], [shared]).size).toBe(0);
  });

  it("draws one line per row, never a list, when a row is in two overlaps", () => {
    const map = contestedOverlapsByMission(
      [anchor({ runId: "r1" }), anchor({ runId: "r1", targetId: "src/other.ts" })],
      [collision(), collision({ targetId: "src/other.ts" })],
    );
    expect(map.size).toBe(1);
    expect(map.get("m1")!.targetId).toBe("src/app.ts");
  });

  it("a run with no mission carries no mark, and is not counted as drawn", () => {
    const map = contestedOverlapsByMission(
      [anchor({ runId: "r1", missionId: null })],
      [collision()],
    );
    expect(map.size).toBe(0);
  });

  it("answers empty while the read has not answered", () => {
    expect(contestedOverlapsByMission(undefined, undefined).size).toBe(0);
  });
});

describe("the line a person reads on the row", () => {
  const one = (toolName: string, agentSlug: string | null = "planner"): Overlap => ({
    targetKind: "file",
    targetId: "src/app.ts",
    others: [{ runId: "r2", agentSlug, toolName, writes: toolName !== "repo.read" }],
  });

  it("says CHANGING when the other one writes, because that is the interruption", () => {
    expect(overlapLine(one("prd.revise"))).toBe("Plan is changing the same file: src/app.ts");
  });

  it("says READING when the other one only reads, because it is not the same event", () => {
    expect(overlapLine(one("repo.read"))).toBe("Plan is reading the same file: src/app.ts");
  });

  it("names a teammate rather than printing the word Agent", () => {
    expect(overlapLine(one("prd.revise", null))).toBe(
      "Another teammate is changing the same file: src/app.ts",
    );
  });

  it("drops the id when it is a row, because a uuid tells a reader nothing", () => {
    expect(
      overlapLine({
        targetKind: "row:prd",
        targetId: "3f0c1f6e-0000-4000-8000-000000000000",
        others: [{ runId: "r2", agentSlug: "planner", toolName: "prd.revise", writes: true }],
      }),
    ).toBe("Plan is changing the same spec");
  });

  it("stops using a verb once there are two, because the row has one line", () => {
    expect(
      overlapLine({
        targetKind: "file",
        targetId: "src/app.ts",
        others: [
          { runId: "r2", agentSlug: "planner", toolName: "prd.revise", writes: true },
          { runId: "r3", agentSlug: "engineer", toolName: "repo.read", writes: false },
        ],
      }),
    ).toBe("Plan and Engineer are on the same file: src/app.ts");
  });

  it("draws nothing rather than an empty mark", () => {
    expect(overlapLine(undefined)).toBeNull();
  });
});

describe("the sentence that makes a quiet answer trustworthy", () => {
  it("says nobody is on the same thing OUT LOUD, rather than drawing nothing", () => {
    expect(checkLine(check([], [], 0), "ready")).toBe("Nobody is on the same thing.");
  });

  it("never calls unrecorded runs clear — the failure that matters here", () => {
    expect(checkLine(check([], [], 2), "ready")).toBe(
      "Nobody is on the same thing. 2 started before we recorded what they touch, so they cannot be checked.",
    );
  });

  it("reads singular for one unrecorded run", () => {
    expect(checkLine(check([], [], 1), "ready")).toContain("so it cannot be checked");
  });

  it("says so when a real overlap has no row on this board to carry it", () => {
    const c = check([anchor({ runId: "r1", missionId: null })], [collision()], 0);
    expect(c).toEqual({ found: 1, drawn: 0, offBoard: 1, unknowable: 0 });
    expect(checkLine(c, "ready")).toBe("1 is on work not listed here.");
  });

  it("stays silent when the marks already say everything", () => {
    const c = check([anchor({ runId: "r1" })], [collision()], 0);
    expect(c.drawn).toBe(1);
    expect(checkLine(c, "ready")).toBeNull();
  });

  it("says it could not read, which is not the same claim as nobody", () => {
    expect(checkLine(null, "failed")).toBe(
      "This could not be read, so it cannot say whether two are on the same thing.",
    );
  });

  it("claims nothing at all while the read is in flight", () => {
    expect(checkLine(null, "pending")).toBeNull();
  });
});
