import { describe, expect, test } from "bun:test";

import { mergeActivityRows, transitionLine } from "./activity-rows";
import type { TrackTransition } from "@/lib/spine/track.functions";
import type { Turn } from "@/lib/spine/activity";

const turn = (runId: string, at: string): Turn =>
  ({
    runId,
    agentSlug: "strategist",
    agentName: "Strategist",
    station: "decide",
    stationName: "Decide",
    at,
    outcome: "done",
    made: [],
  }) as unknown as Turn;

const move = (
  at: string,
  to: string,
  drivenVia: TrackTransition["drivenVia"],
): TrackTransition => ({
  from: "sense",
  to,
  at,
  drivenVia,
});

describe("transitionLine", () => {
  test("the three known origins each name their cause, distinctly", () => {
    expect(transitionLine("press")).toBe("you pressed run here");
    expect(transitionLine("sweep")).toBe("the run moved on its own");
    expect(transitionLine("continuation")).toBe("it carried on by itself");
  });

  test("an unknown or pre-split origin claims nothing about a person", () => {
    expect(transitionLine(null)).toBeNull();
    expect(transitionLine("foreground")).toBeNull();
  });
});

describe("mergeActivityRows", () => {
  const t1 = turn("r1", "2026-08-25T10:00:00Z");
  const t2 = turn("r2", "2026-08-25T10:20:00Z");

  test("turns and moves interleave newest first, not as two lists", () => {
    const rows = mergeActivityRows([t1, t2], [move("2026-08-25T10:10:00Z", "decide", "sweep")]);
    expect(rows.map((r) => r.key)).toEqual([
      "turn:r2",
      "move:2026-08-25T10:10:00Z:decide",
      "turn:r1",
    ]);
  });

  test("a move with no provable driver is dropped entirely, never drawn vague", () => {
    const rows = mergeActivityRows(
      [t1],
      [
        move("2026-08-25T10:05:00Z", "decide", null),
        move("2026-08-25T10:06:00Z", "define", "foreground"),
      ],
    );
    expect(rows.map((r) => r.kind)).toEqual(["turn"]);
  });

  test("a tie keeps the turn ahead of the move at the same instant", () => {
    const rows = mergeActivityRows([t2], [move("2026-08-25T10:20:00Z", "decide", "press")]);
    expect(rows.map((r) => r.kind)).toEqual(["turn", "move"]);
  });

  test("station words resolve through the display map, never a raw slug", () => {
    const rows = mergeActivityRows([], [move("2026-08-25T10:10:00Z", "design", "sweep")]);
    const only = rows[0];
    expect(only.kind === "move" ? only.toName : null).toBe("Design");
  });
});
