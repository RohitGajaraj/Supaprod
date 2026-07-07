import { describe, expect, test } from "bun:test";
import { ageOf, hasSource, displayWho } from "./decisions-shared";
import type { DecisionRow } from "@/lib/decisions.functions";

describe("ageOf", () => {
  test("under a minute reads as 'now'", () => {
    const iso = new Date(Date.now() - 10_000).toISOString();
    expect(ageOf(iso)).toBe("now");
  });

  test("minutes bucket (1-59m)", () => {
    const iso = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(ageOf(iso)).toBe("5m ago");
  });

  test("hours bucket (1-23h)", () => {
    const iso = new Date(Date.now() - 3 * 60 * 60_000).toISOString();
    expect(ageOf(iso)).toBe("3h ago");
  });

  test("days bucket (1-6d)", () => {
    const iso = new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString();
    expect(ageOf(iso)).toBe("2d ago");
  });

  test("7+ days falls back to a locale date string, not an ever-growing day count", () => {
    const then = new Date(Date.now() - 10 * 24 * 60 * 60_000);
    expect(ageOf(then.toISOString())).toBe(
      then.toLocaleDateString([], { month: "short", day: "numeric" }),
    );
  });

  test("a future timestamp does not go negative (floors at 'now')", () => {
    const iso = new Date(Date.now() + 60_000).toISOString();
    expect(ageOf(iso)).toBe("now");
  });
});

describe("hasSource", () => {
  const base: Pick<DecisionRow, "mission_id" | "prd_id" | "meeting_id"> = {
    mission_id: null,
    prd_id: null,
    meeting_id: null,
  };

  test("true when mission_id is set", () => {
    expect(hasSource({ ...base, mission_id: "m1" } as DecisionRow)).toBe(true);
  });

  test("true when prd_id is set", () => {
    expect(hasSource({ ...base, prd_id: "p1" } as DecisionRow)).toBe(true);
  });

  test("true when meeting_id is set", () => {
    expect(hasSource({ ...base, meeting_id: "mt1" } as DecisionRow)).toBe(true);
  });

  test("false when all three source refs are null", () => {
    expect(hasSource({ ...base } as DecisionRow)).toBe(false);
  });
});

describe("displayWho", () => {
  test("null slug reads as 'You' (a manual decision with no agent)", () => {
    expect(displayWho(null)).toBe("You");
  });

  test("the legacy 'builder' agent slug reads as 'Build' (post-rename)", () => {
    expect(displayWho("builder")).toBe("Build");
  });

  test("any other slug passes through verbatim", () => {
    expect(displayWho("critic")).toBe("critic");
    expect(displayWho("scout")).toBe("scout");
  });
});
