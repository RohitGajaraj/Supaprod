import { describe, test, expect } from "bun:test";
import { cockpitVerdict, relTime } from "../VerifyCockpit";
import { ROOM_TAB_META } from "@/lib/engine-room-glance";

// RPT-31 - The Agent Inbox (verification cockpit). VerifyCockpit itself is
// hook-driven (useQuery / useServerFn) with no DOM renderer in this repo, so
// these tests cover the PURE logic it exports plus the tab registration that
// makes the feature reachable at all (the two wiring points that, if broken,
// make the cockpit invisible or say the wrong thing).

describe("cockpitVerdict", () => {
  test("clear queue and no changes reads as all-clear, not a fabricated number", () => {
    const v = cockpitVerdict(0, 0);
    expect(v).toContain("Nothing is waiting on you");
    expect(v).toContain("no applied changes on the record yet");
  });

  test("pluralizes a single pending approval and a single applied change", () => {
    const v = cockpitVerdict(1, 1);
    expect(v).toContain("1 approval waiting on you");
    expect(v).toContain("1 applied change to verify or roll back");
  });

  test("pluralizes multiple pending approvals and applied changes", () => {
    const v = cockpitVerdict(3, 5);
    expect(v).toContain("3 approvals waiting on you");
    expect(v).toContain("5 applied changes to verify or roll back");
  });

  test("carries no em or en dashes (humanized-output law)", () => {
    const v = cockpitVerdict(2, 4);
    expect(v.includes("—")).toBe(false); // em dash
    expect(v.includes("–")).toBe(false); // en dash
  });
});

describe("relTime", () => {
  const now = new Date("2026-07-11T12:00:00.000Z").getTime();

  test("returns empty string for a null timestamp", () => {
    expect(relTime(null, now)).toBe("");
  });

  test("reads sub-minute deltas as just now", () => {
    expect(relTime(new Date(now - 30 * 1000).toISOString(), now)).toBe("just now");
  });

  test("reads minutes, hours, and days", () => {
    expect(relTime(new Date(now - 5 * 60_000).toISOString(), now)).toBe("5m ago");
    expect(relTime(new Date(now - 3 * 3_600_000).toISOString(), now)).toBe("3h ago");
    expect(relTime(new Date(now - 2 * 86_400_000).toISOString(), now)).toBe("2d ago");
  });

  test("never renders a negative (future) delta", () => {
    expect(relTime(new Date(now + 60_000).toISOString(), now)).toBe("");
  });
});

describe("record room tab registration", () => {
  const verify = ROOM_TAB_META.record.find((t) => t.id === "verify");

  test("the verify tab exists and is ordered first (the room's default view)", () => {
    expect(verify).toBeDefined();
    expect(ROOM_TAB_META.record[0]!.id).toBe("verify");
  });

  test("wears the plain label with the technical term underneath", () => {
    expect(verify!.label).toBe("What just happened");
    expect(verify!.technical).toBe("Verification cockpit");
  });

  test("its descriptor carries no em or en dashes", () => {
    expect(verify!.descriptor.includes("—")).toBe(false);
    expect(verify!.descriptor.includes("–")).toBe(false);
  });
});
