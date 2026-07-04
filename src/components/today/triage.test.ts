import { describe, it, expect } from "bun:test";
import { sortWithinGroup, expiryLabel, FAMILY_ORDER } from "./triage";

describe("sortWithinGroup — expiring soonest floats first (DESIGN-LOOM §8b)", () => {
  it("puts the call expiring soonest first, expired before live", () => {
    const rows = sortWithinGroup([
      { id: "later", expiresAt: 3000, raisedAt: 1 },
      { id: "expired", expiresAt: 100, raisedAt: 2 },
      { id: "soon", expiresAt: 2000, raisedAt: 3 },
    ]);
    expect(rows.map((r) => r.id)).toEqual(["expired", "soon", "later"]);
  });

  it("never-expiring calls follow every expiring one, newest first", () => {
    const rows = sortWithinGroup([
      { id: "old-open", expiresAt: null, raisedAt: 10 },
      { id: "new-open", expiresAt: null, raisedAt: 90 },
      { id: "gated", expiresAt: 5000, raisedAt: 1 },
    ]);
    expect(rows.map((r) => r.id)).toEqual(["gated", "new-open", "old-open"]);
  });

  it("does not mutate its input", () => {
    const input = [
      { id: "b", expiresAt: 2, raisedAt: 1 },
      { id: "a", expiresAt: 1, raisedAt: 1 },
    ];
    sortWithinGroup(input);
    expect(input[0].id).toBe("b");
  });
});

describe("expiryLabel — honest tenses, absence over fabrication (§9b)", () => {
  const now = Date.parse("2026-07-04T12:00:00Z");

  it("is empty when the call never expires or the date is junk", () => {
    expect(expiryLabel(null, now)).toBe("");
    expect(expiryLabel("not-a-date", now)).toBe("");
  });

  it("says EXPIRED once the window has passed", () => {
    expect(expiryLabel("2026-07-04T11:00:00Z", now)).toBe("EXPIRED");
  });

  it("counts minutes under an hour, hours under two days, then days", () => {
    expect(expiryLabel("2026-07-04T12:30:00Z", now)).toBe("EXPIRES IN 30M");
    expect(expiryLabel("2026-07-04T18:00:00Z", now)).toBe("EXPIRES IN 6H");
    expect(expiryLabel("2026-07-07T12:00:00Z", now)).toBe("EXPIRES IN 3D");
  });
});

describe("FAMILY_ORDER — the highest-stakes family leads", () => {
  it("keeps tool gates first, then build calls, then re-examinations", () => {
    expect(FAMILY_ORDER).toEqual(["ship", "build", "reexamine"]);
  });
});
