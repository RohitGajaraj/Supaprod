import { describe, it, expect } from "bun:test";
import { sortWithinGroup, expiryLabel, expiredAgo, gateHeadline, FAMILY_ORDER } from "./triage";

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

describe("gateHeadline — the outcome, never the tool slug (R2-ATTENTION #3)", () => {
  it("names the catalogued effect in plain words", () => {
    expect(gateHeadline("orchestrator", "mission.plan")).toBe(
      "Chief of Staff wants to plan the mission into a small step-by-step DAG",
    );
    expect(gateHeadline("builder", "studio.stage")).toBe(
      "Engineer wants to stage file changes on the working branch",
    );
    expect(gateHeadline("qa", "studio.pr.merge")).toBe(
      "Review wants to merge the pull request into the branch",
    );
  });

  it("uses only the first sentence of a multi-sentence effect", () => {
    expect(gateHeadline("orchestrator", "scheduler.propose")).toBe(
      "Chief of Staff wants to propose a schedule slot",
    );
  });

  it("keeps the honest slug form for an uncatalogued tool", () => {
    expect(gateHeadline("orchestrator", "totally.unknown")).toBe(
      "Chief of Staff wants to run totally.unknown",
    );
  });

  it("degrades to plain words when agent or tool is missing", () => {
    expect(gateHeadline(null, "mission.plan")).toBe(
      "An agent wants to plan the mission into a small step-by-step DAG",
    );
    expect(gateHeadline("orchestrator", null)).toBe("Chief of Staff is waiting on your call");
  });
});

describe("expiredAgo — honest tense for the quiet Expired group (§9b)", () => {
  const now = Date.parse("2026-07-04T12:00:00Z");

  it("is empty for null, junk, or a future date", () => {
    expect(expiredAgo(null, now)).toBe("");
    expect(expiredAgo("not-a-date", now)).toBe("");
    expect(expiredAgo("2026-07-04T13:00:00Z", now)).toBe("");
  });

  it("counts minutes, hours, then days since expiry", () => {
    expect(expiredAgo("2026-07-04T11:30:00Z", now)).toBe("expired 30m ago");
    expect(expiredAgo("2026-07-04T06:00:00Z", now)).toBe("expired 6h ago");
    expect(expiredAgo("2026-07-01T12:00:00Z", now)).toBe("expired 3d ago");
  });
});
