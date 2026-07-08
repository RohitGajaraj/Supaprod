import { expect, test, describe } from "bun:test";
import {
  studioToMissionRowStatus,
  studioToStatusState,
  studioVerdict,
  findPendingApproval,
  stepDotState,
  stepDescription,
  gateTitle,
  gateConsequence,
} from "./build-status";

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
  test("completed stays done", () => {
    expect(studioToMissionRowStatus("completed", 0)).toBe("done");
  });
  test("failed and halted read as their own blocked state, not a false done", () => {
    expect(studioToMissionRowStatus("failed", 0)).toBe("blocked");
    expect(studioToMissionRowStatus("halted", 0)).toBe("blocked");
  });

  test("missions.status 'blocked' (the mission-table gate value, never 'waiting_approval') is a gate", () => {
    expect(studioToMissionRowStatus("blocked", 0)).toBe("gate");
  });
  test("cancelled and completed_with_failures also read as blocked, not a false done", () => {
    expect(studioToMissionRowStatus("cancelled", 0)).toBe("blocked");
    expect(studioToMissionRowStatus("completed_with_failures", 0)).toBe("blocked");
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

describe("findPendingApproval", () => {
  test("returns the first (oldest) pending approval when one exists", () => {
    const approvals = [
      { id: "a1", status: "approved" as const, created_at: "2026-01-01" },
      { id: "a2", status: "pending" as const, created_at: "2026-01-02" },
      { id: "a3", status: "pending" as const, created_at: "2026-01-03" },
    ];
    const result = findPendingApproval(approvals);
    expect(result?.id).toBe("a2");
  });

  test("returns undefined when no pending approvals exist", () => {
    const approvals = [
      { id: "a1", status: "approved" as const, created_at: "2026-01-01" },
      { id: "a2", status: "approved" as const, created_at: "2026-01-02" },
    ];
    const result = findPendingApproval(approvals);
    expect(result).toBeUndefined();
  });

  test("returns undefined for empty approvals array", () => {
    expect(findPendingApproval([])).toBeUndefined();
  });
});

describe("stepDotState", () => {
  test("thought and final steps always return done", () => {
    const thoughtStep = { kind: "thought" as const, text: "thinking" };
    const finalStep = { kind: "final" as const, message: "final message" };
    expect(stepDotState(thoughtStep, [])).toBe("done");
    expect(stepDotState(finalStep, [])).toBe("done");
  });

  test("tool_call step with pending approval returns gate", () => {
    const step = {
      kind: "tool_call" as const,
      name: "merge",
      approval_id: "ap1",
      status: "pending" as const,
    };
    const approvals = [
      { id: "ap1", status: "pending" as const, created_at: "2026-01-01" },
    ];
    expect(stepDotState(step, approvals)).toBe("gate");
  });

  test("tool_call step with executed status returns done", () => {
    const step = {
      kind: "tool_call" as const,
      name: "merge",
      approval_id: undefined,
      status: "executed" as const,
    };
    expect(stepDotState(step, [])).toBe("done");
  });

  test("tool_call step with error status returns blocked", () => {
    const step = {
      kind: "tool_call" as const,
      name: "merge",
      approval_id: undefined,
      status: "error" as const,
    };
    expect(stepDotState(step, [])).toBe("blocked");
  });

  test("tool_call step with denied status returns blocked", () => {
    const step = {
      kind: "tool_call" as const,
      name: "merge",
      approval_id: undefined,
      status: "denied" as const,
    };
    expect(stepDotState(step, [])).toBe("blocked");
  });

  test("tool_call step without approval_id and pending status returns queued", () => {
    const step = {
      kind: "tool_call" as const,
      name: "merge",
      approval_id: undefined,
      status: "pending" as const,
    };
    expect(stepDotState(step, [])).toBe("queued");
  });
});

describe("stepDescription", () => {
  test("tool_call step returns the tool name", () => {
    const step = { kind: "tool_call" as const, name: "studio.pr.merge" };
    expect(stepDescription(step)).toBe("studio.pr.merge");
  });

  test("thought step returns text truncated to 140 chars", () => {
    const longText = "x".repeat(200);
    const step = { kind: "thought" as const, text: longText };
    expect(stepDescription(step)).toBe("x".repeat(140));
    expect(stepDescription(step).length).toBe(140);
  });

  test("final step returns message truncated to 140 chars", () => {
    const longMessage = "y".repeat(200);
    const step = { kind: "final" as const, message: longMessage };
    expect(stepDescription(step)).toBe("y".repeat(140));
    expect(stepDescription(step).length).toBe(140);
  });

  test("text shorter than 140 chars is returned as-is", () => {
    const step = { kind: "thought" as const, text: "Short text" };
    expect(stepDescription(step)).toBe("Short text");
  });
});

describe("gateTitle", () => {
  test("studio.pr.merge returns merge-focused title", () => {
    expect(gateTitle("studio.pr.merge")).toBe("Merge the pull request");
  });

  test("delegate.openhands returns handoff-focused title", () => {
    expect(gateTitle("delegate.openhands")).toBe("Hand off to OpenHands");
  });

  test("unknown tool returns generic 'Run <toolName>' title", () => {
    expect(gateTitle("some.custom.tool")).toBe("Run some.custom.tool");
    expect(gateTitle("another.tool")).toBe("Run another.tool");
  });
});

describe("gateConsequence", () => {
  test("studio.pr.merge explains merge consequence", () => {
    const consequence = gateConsequence("studio.pr.merge");
    expect(consequence).toContain("pull request");
    expect(consequence).toContain("ships");
  });

  test("delegate.openhands explains external agent handoff consequence", () => {
    const consequence = gateConsequence("delegate.openhands");
    expect(consequence).toContain("external coding agent");
    expect(consequence).toContain("cannot be undone");
  });

  test("unknown tool returns generic consequence", () => {
    expect(gateConsequence("some.custom.tool")).toBe("Nothing runs until you decide.");
  });
});
