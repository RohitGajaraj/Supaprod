/**
 * THE ROAD AND THE HEADLINE MUST NOT DESCRIBE THE SAME WORK IN WAYS THAT
 * CANNOT BE RECONCILED.
 *
 * THE DEFECT THIS PINS, measured on the served home 2026-09-10 00:43 UTC,
 * workspace A1 delete probe (c8ffbbe7-fd7c-4deb-8b12-36da0944f8ce):
 *
 *   headline   "4 design gates and 2 other calls are waiting for you."
 *   road        build 3 · decide 3 · learn 2 · DESIGN blank, unlit, unpressable
 *
 *   select count(*) from prds where workspace_id = '<ws>'
 *     and design_gate_status = 'pending';                    -> 4
 *   select station, count(*) from spine_tracks where workspace_id = '<ws>'
 *     group by station;              -> build 3, decide 3, learn 2, design 0
 *
 * Both numbers were right. `count` on the road is `spine_tracks.station`; the
 * gates are `prds.design_gate_status`. `APPROVAL_KIND_STATION` already mapped
 * `design_gate -> design`, so the product knew where those four calls
 * belonged -- and the one drawing whose whole job is the through-line drew
 * that station as one nothing had reached.
 *
 * These assertions are about the JOIN, not about any wording. Where a
 * sentence is checked it is checked for the station's name and the count it
 * must carry, never for its phrasing, so improving the copy cannot fail this
 * and losing the fact cannot pass it (`pin-the-claim-not-the-spelling`).
 */
import { describe, test, expect } from "bun:test";

import { JOURNEY_ORDER, type JourneyStation } from "@/components/meridian/Journey";
import { withWaiting } from "@/components/start/journey-of-a-run";
import { captionFor, waitingDoorFor } from "@/components/start/JourneyMap";
import {
  waitingByStation,
  stationsWaitingOnYou,
} from "@/components/start/a-call-waits-at-a-station";
import { AGENT_STATIONS } from "@/lib/agent-vocabulary";

/** The road exactly as it was measured on the served home that night. */
function theMeasuredRoad(): JourneyStation[] {
  const counts: Partial<Record<string, number>> = { decide: 3, build: 3, learn: 2 };
  return JOURNEY_ORDER.map((key) => ({
    key,
    state: counts[key] ? ("waiting" as const) : ("pending" as const),
    ...(counts[key] ? { count: counts[key] } : {}),
  }));
}

/** The four pending design gates, as the queue hands them to the home. */
const FOUR_DESIGN_GATES = ["design_gate", "design_gate", "design_gate", "design_gate"] as const;

describe("a call waits at a station", () => {
  test("a design gate belongs at Design, which is the fact the road was missing", () => {
    expect(waitingByStation(FOUR_DESIGN_GATES)).toEqual({ design: 4 });
  });

  test("kinds the map cannot place stay off the road rather than landing in a bucket", () => {
    // A number in the wrong place is worse on this drawing than one missing
    // from it: these two are workspace-wide, not about one stop.
    expect(waitingByStation(["trust_graduation", "playbook_proposal"])).toEqual({});
  });

  test("calls of different kinds land at their own stations", () => {
    expect(waitingByStation(["design_gate", "decision", "tool_call", "memory_candidate"])).toEqual({
      design: 1,
      decide: 1,
      build: 1,
      learn: 1,
    });
  });

  test("the waiting stations come back in road order, not queue order", () => {
    const waiting = waitingByStation(
      ["learn", "build", "decide"].map(() => "design_gate") as never,
    );
    expect(stationsWaitingOnYou({ learn: 1, decide: 2, design: 1 }, JOURNEY_ORDER)).toEqual([
      "decide",
      "design",
      "learn",
    ]);
    expect(waiting).toEqual({ design: 3 });
  });
});

describe("the road carries what is waiting on you", () => {
  test("THE REGRESSION: Design is no longer blank while four gates wait there", () => {
    const before = theMeasuredRoad().find((s) => s.key === "design")!;
    // The defect, stated so this test fails if the fixture stops reproducing it.
    expect(before.count ?? 0).toBe(0);
    expect(before.waiting ?? 0).toBe(0);

    const after = withWaiting(theMeasuredRoad(), waitingByStation(FOUR_DESIGN_GATES));
    const design = after.find((s) => s.key === "design")!;
    expect(design.waiting).toBe(4);
    // `you` is the road's existing paint for "this stop is on you". Nothing
    // stands at Design, so that is the whole truth of the stop.
    expect(design.state).toBe("you");
  });

  test("a stop where work is actually standing keeps its own state", () => {
    // A run working at a stop outranks a call queued at it: the second number
    // is added, the state is left alone.
    const after = withWaiting(theMeasuredRoad(), { build: 2 });
    const build = after.find((s) => s.key === "build")!;
    expect(build.waiting).toBe(2);
    expect(build.count).toBe(3);
    expect(build.state).toBe("waiting");
  });

  test("a working stop is never repainted as waiting on you", () => {
    const road: JourneyStation[] = [
      { key: "design", state: "working", presences: [{ seat: "ux-architect", colour: "#fff" }] },
    ];
    expect(withWaiting(road, { design: 4 })[0]!.state).toBe("working");
  });

  test("stations with nothing waiting are returned untouched", () => {
    const road = theMeasuredRoad();
    expect(withWaiting(road, {})).toEqual(road);
  });
});

describe("the road says what is waiting, and never contradicts it", () => {
  const stations = withWaiting(theMeasuredRoad(), waitingByStation(FOUR_DESIGN_GATES));

  test("the count and the station both reach the sentence", () => {
    // Nothing is stopped in this fixture, so the waiting rung is the one that
    // speaks. Pinned on the number and the station name, not the wording.
    const line = captionFor({ mode: "map", stations, selected: null })!;
    expect(line).toContain("4");
    expect(line).toContain(AGENT_STATIONS.design.name);
  });

  test("dead work still outranks a queued call", () => {
    const stopped = stations.map((s) =>
      s.key === "build" ? { ...s, state: "stopped" as const } : s,
    );
    const line = captionFor({ mode: "map", stations: stopped, selected: null })!;
    expect(line).toContain(AGENT_STATIONS.build.name);
  });

  test('"nothing is standing" is never said while a call waits', () => {
    // `empty` asks only whether any RUN stands anywhere, so before this it
    // stayed true with four gates on the board.
    const bare: JourneyStation[] = JOURNEY_ORDER.map((key) => ({ key, state: "pending" as const }));
    const withCalls = withWaiting(bare, { design: 4 });
    const line = captionFor({ mode: "map", stations: withCalls, selected: null })!;
    expect(line).toContain("4");
    expect(line).toContain(AGENT_STATIONS.design.name);
    expect(line.toLowerCase()).not.toContain("nothing is standing on the road.");
  });

  test("selecting a stop that only holds calls says so instead of going silent", () => {
    // Reachable only because `Journey` now makes such a stop pressable. The
    // runs list below is empty, so the line has to carry the reason.
    const line = captionFor({ mode: "map", stations, selected: "design" })!;
    expect(line).toContain("4");
    expect(line).toContain(AGENT_STATIONS.design.name);
  });

  test("a selected stop with no runs and no calls still says nothing", () => {
    // The original branch, unchanged: the list below is the thing that is
    // empty and it already says so.
    expect(captionFor({ mode: "map", stations, selected: "ship" })).toBeNull();
  });
});

describe("the door out of the one dead end this created", () => {
  const stations = withWaiting(theMeasuredRoad(), waitingByStation(FOUR_DESIGN_GATES));

  test("a stop holding only calls offers the queue, and it is the queue's real address", () => {
    expect(waitingDoorFor({ mode: "map", stations, selected: "design" })).toEqual({
      label: "Open Inbox",
      to: "/inbox",
    });
  });

  test("no second door anywhere else, because the hero already carries one", () => {
    // Two doors onto one question on one screen is the defect
    // `one-door-per-sentence.test.ts` exists to catch.
    expect(waitingDoorFor({ mode: "map", stations, selected: null })).toBeNull();
    expect(waitingDoorFor({ mode: "map", stations, selected: "build" })).toBeNull();
    expect(waitingDoorFor({ mode: "map", stations, selected: "ship" })).toBeNull();
    expect(waitingDoorFor({ mode: "promise", stations, selected: "design" })).toBeNull();
    expect(waitingDoorFor({ mode: "route", stations, selected: "design" })).toBeNull();
  });
});
