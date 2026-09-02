/**
 * P-18 fix, A1's live reproduction (`supaprod.ai`, 2026-09-03): with zero
 * tracks in `listMovingTracks`, the header still said "Engineer is working ·
 * Checkout asks for already-saved delivery address · started 1d ago", read
 * from `missions.status='running'` set on `08-31` while that track's only
 * builder run had moved to `waiting_approval`. Pure, per `genuinely-working
 * .ts`'s own header on why this is not a render test.
 */
import { describe, it, expect } from "bun:test";
import { genuinelyWorkingMissions } from "./genuinely-working";
import type { MissionListRow } from "@/lib/missions.functions";

const mission = (over: Partial<MissionListRow> = {}): MissionListRow =>
  ({
    id: "m-1",
    trackId: null,
    ...over,
  }) as MissionListRow;

describe("genuinelyWorkingMissions: a stored status is a candidate, not a claim", () => {
  it("A1's exact reproduction: a running-status mission with zero moving tracks counts as none", () => {
    const checkout = mission({ id: "m-checkout", trackId: "t-checkout" });
    const result = genuinelyWorkingMissions([checkout], new Set());
    expect(result).toEqual([]);
  });

  it("a mission whose track IS in the moving set still counts", () => {
    const live = mission({ id: "m-live", trackId: "t-live" });
    const result = genuinelyWorkingMissions([live], new Set(["t-live"]));
    expect(result).toEqual([live]);
  });

  it("a mission with no track at all never counts, moving set or not", () => {
    const trackless = mission({ id: "m-old", trackId: null });
    const result = genuinelyWorkingMissions([trackless], new Set(["t-anything"]));
    expect(result).toEqual([]);
  });

  it("mixed: only the one whose track is genuinely moving survives", () => {
    const stale = mission({ id: "m-stale", trackId: "t-stale" });
    const live = mission({ id: "m-live", trackId: "t-live" });
    const result = genuinelyWorkingMissions([stale, live], new Set(["t-live"]));
    expect(result).toEqual([live]);
  });
});
