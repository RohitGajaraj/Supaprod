import { expect, test, describe } from "bun:test";
import { studioToMissionRowStatus, studioToStatusState, studioVerdict } from "./build-status";

describe("studioToMissionRowStatus", () => {
  test("a pending approval always reads as a gate, regardless of the status string", () => {
    expect(studioToMissionRowStatus("running", 1)).toBe("gate");
    expect(studioToMissionRowStatus("completed", 2)).toBe("gate");
  });
  test("waiting_approval reads as a gate even with pendingApprovals stale at 0", () => {
    expect(studioToMissionRowStatus("waiting_approval", 0)).toBe("gate");
  });
  test("running with no pending approval reads as working", () => {
    expect(studioToMissionRowStatus("running", 0)).toBe("working");
  });
  test("queued reads as queued", () => {
    expect(studioToMissionRowStatus("queued", 0)).toBe("queued");
  });
  test("completed, failed, and halted all collapse to done (disambiguated by verdict)", () => {
    expect(studioToMissionRowStatus("completed", 0)).toBe("done");
    expect(studioToMissionRowStatus("failed", 0)).toBe("done");
    expect(studioToMissionRowStatus("halted", 0)).toBe("done");
  });

  test("missions.status 'blocked' (the mission-table gate value, never 'waiting_approval') is a gate", () => {
    expect(studioToMissionRowStatus("blocked", 0)).toBe("gate");
  });
  test("cancelled and completed_with_failures also collapse to done (disambiguated by verdict)", () => {
    expect(studioToMissionRowStatus("cancelled", 0)).toBe("done");
    expect(studioToMissionRowStatus("completed_with_failures", 0)).toBe("done");
  });
  // OBS-10: 'proposed' is the trigger-tick's own HITL gate (a mission an
  // ambient trigger proposed but no human has promoted to 'queued' yet via
  // missions.functions.ts `promoteMission`) — distinct from 'queued', which
  // is already dispatched and running unattended. Reads as a gate, not a
  // quiet queued row, so it is not missed.
  test("proposed (an ambient-trigger mission awaiting promotion) reads as a gate", () => {
    expect(studioToMissionRowStatus("proposed", 0)).toBe("gate");
  });
  test("a genuinely unrecognized status string fails safe to queued, never a false done", () => {
    expect(studioToMissionRowStatus("some_future_status", 0)).toBe("queued");
  });
});

describe("studioToStatusState", () => {
  test("failed and halted map to blocked (madder), not done", () => {
    expect(studioToStatusState("failed", 0)).toBe("blocked");
    expect(studioToStatusState("halted", 0)).toBe("blocked");
  });
  test("completed maps to done", () => {
    expect(studioToStatusState("completed", 0)).toBe("done");
  });
  test("a pending approval overrides to gate", () => {
    expect(studioToStatusState("failed", 1)).toBe("gate");
  });

  test("regression: missions.status 'blocked' is a gate, never the false SHIPPED the adversarial review caught (a mission genuinely waiting on a human gate must never read as done)", () => {
    expect(studioToStatusState("blocked", 0)).toBe("gate");
  });
  test("cancelled and completed_with_failures map to blocked (madder), not a false done", () => {
    expect(studioToStatusState("cancelled", 0)).toBe("blocked");
    expect(studioToStatusState("completed_with_failures", 0)).toBe("blocked");
  });
  test("proposed (an ambient-trigger mission awaiting promotion) reads as a gate", () => {
    expect(studioToStatusState("proposed", 0)).toBe("gate");
  });
  test("an unrecognized status string fails safe to queued, never done", () => {
    expect(studioToStatusState("some_future_status", 0)).toBe("queued");
  });
});

describe("studioVerdict", () => {
  test("failed or halted is always KILL, regardless of changeset state", () => {
    expect(studioVerdict("failed", "merged")).toBe("KILL");
    expect(studioVerdict("halted", null)).toBe("KILL");
  });
  test("a merged changeset on a non-failed mission is SHIP", () => {
    expect(studioVerdict("completed", "merged")).toBe("SHIP");
  });
  test("completed but not merged (e.g. still pr_open) gets no verdict, not a false SHIP", () => {
    expect(studioVerdict("completed", "pr_open")).toBeUndefined();
    expect(studioVerdict("completed", null)).toBeUndefined();
  });
  test("a running or queued mission has no verdict", () => {
    expect(studioVerdict("running", null)).toBeUndefined();
    expect(studioVerdict("queued", null)).toBeUndefined();
  });
  test("cancelled and completed_with_failures are also KILL", () => {
    expect(studioVerdict("cancelled", null)).toBe("KILL");
    expect(studioVerdict("completed_with_failures", "merged")).toBe("KILL");
  });
});
