import { describe, expect, it } from "bun:test";

import type { Turn } from "@/lib/spine/activity";
import { hasLiveVisit, liveSeats } from "./TrackActivity";

const turn = (o: Partial<Turn>): Turn => ({
  runId: "r1",
  agentSlug: "scout",
  agentName: "Discovery Scout",
  station: "sense",
  stationName: "Discover",
  at: "2026-08-27T04:00:00.000Z",
  outcome: "done",
  made: [],
  said: null,
  tookMs: null,
  tokens: null,
  stopLine: null,
  usd: 0,
  ...o,
});

/**
 * SPEC-MULTIPLAYER-PRESENCE §2 calls this the easiest place in the product to
 * fake, and says a feature caught staging a state is deleted rather than fixed.
 * The whole defence is that a teammate is drawn only while a run row says it is
 * in flight, so that is what these assert.
 */
describe("which teammates are drawn", () => {
  it("draws nobody when no row says anyone is working", () => {
    const settled = [turn({ outcome: "done" }), turn({ agentSlug: "critic", outcome: "stopped" })];
    expect(liveSeats(settled)).toEqual([]);
    // And it agrees with the boolean the rest of the pane runs on.
    expect(hasLiveVisit(settled)).toBe(false);
  });

  it("counts a seat waiting at a gate as in flight, exactly as the boolean does", () => {
    // `waiting` is mid-visit: the seat is held at a gate, not finished.
    const held = [turn({ outcome: "waiting" })];
    expect(liveSeats(held)).toHaveLength(1);
    expect(liveSeats(held)[0]!.waiting).toBe(true);
    expect(hasLiveVisit(held)).toBe(true);
  });

  it("never disagrees with hasLiveVisit, on any mix", () => {
    /*
     * The two are read by different halves of the surface: the boolean drives
     * polling and the character, the list draws the teammates. If they could
     * disagree the pane would pulse with nobody on it, or draw somebody the rest
     * of the screen says is not there.
     */
    const mixes: Turn[][] = [
      [],
      [turn({ outcome: "done" })],
      [turn({ outcome: "working" })],
      [turn({ outcome: "waiting" }), turn({ agentSlug: "critic", outcome: "done" })],
      [turn({ outcome: "stopped" }), turn({ agentSlug: "builder", outcome: "working" })],
    ];
    for (const turns of mixes) {
      expect(liveSeats(turns).length > 0).toBe(hasLiveVisit(turns));
    }
  });

  it("shows one teammate per seat, however many rows it holds", () => {
    // A seat writes several rows in a visit. A person watching two teammates
    // must not be shown four.
    const noisy = [
      turn({ runId: "a", outcome: "working" }),
      turn({ runId: "b", outcome: "working" }),
      turn({ runId: "c", agentSlug: "builder", agentName: "Studio", outcome: "working" }),
    ];
    const seats = liveSeats(noisy);
    expect(seats).toHaveLength(2);
    expect(seats.map((s) => s.name).sort()).toEqual(["Discovery Scout", "Studio"]);
  });

  it("keeps the waiting flag if any of a seat's rows is waiting", () => {
    const seats = liveSeats([
      turn({ runId: "a", outcome: "working" }),
      turn({ runId: "b", outcome: "waiting" }),
    ]);
    expect(seats).toHaveLength(1);
    expect(seats[0]!.waiting).toBe(true);
  });
});
