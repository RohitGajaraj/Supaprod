import { expect, test, describe } from "bun:test";
import {
  findPendingApproval,
  stepDotState,
  stepDescription,
  gateTitle,
  gateConsequence,
} from "./build-status";
import type { LoopStep } from "@/lib/ai/loop.server";
import type { StudioApproval } from "@/lib/studio.functions";

// `MissionSlideOver` itself uses `useQuery`/`useMutation`/`useToast`, all of
// which need a mounted React tree + providers to run; this repo has no
// jsdom/React-Testing-Library dependency (see the sibling
// `__tests__/primitives.test.tsx` header comment), so those code paths are
// covered by the OBS-05 spec's own "Manual checks" tier (§12), not here.
// What IS pure and testable is the derivation logic the component calls into
// (all now in `build-status.ts`): which approval gates the mission, each
// step's dot state, its description, and the gate's plain-words copy.

function approval(overrides: Partial<StudioApproval> = {}): StudioApproval {
  return {
    id: "appr-1",
    tool_name: "studio.pr.merge",
    args: {},
    rationale: null,
    status: "pending",
    created_at: "2026-07-02T10:00:00Z",
    expires_at: null,
    result: null,
    error: null,
    ...overrides,
  };
}

describe("findPendingApproval", () => {
  test("finds the pending approval among decided ones", () => {
    const list = [
      approval({ id: "a1", status: "approved" }),
      approval({ id: "a2", status: "pending" }),
    ];
    expect(findPendingApproval(list)?.id).toBe("a2");
  });

  test("returns undefined when nothing is awaiting a decision (no CallCard should render)", () => {
    const list = [approval({ status: "approved" }), approval({ status: "rejected" })];
    expect(findPendingApproval(list)).toBeUndefined();
  });

  test("returns undefined on an empty list", () => {
    expect(findPendingApproval([])).toBeUndefined();
  });
});

describe("stepDotState", () => {
  const approvals = [approval({ id: "gate-1", status: "pending" })];

  test("a tool_call step whose approval_id matches a pending approval is the live gate", () => {
    const step: LoopStep = {
      kind: "tool_call",
      name: "studio.pr.merge",
      args: {},
      ok: true,
      status: "queued",
      approval_id: "gate-1",
    };
    expect(stepDotState(step, approvals)).toBe("gate");
  });

  test("an executed tool_call with no pending approval is done", () => {
    const step: LoopStep = {
      kind: "tool_call",
      name: "github.pr.open",
      args: {},
      ok: true,
      status: "executed",
    };
    expect(stepDotState(step, approvals)).toBe("done");
  });

  test("an errored or denied tool_call is blocked", () => {
    const errored: LoopStep = {
      kind: "tool_call",
      name: "x",
      args: {},
      ok: false,
      status: "error",
    };
    const denied: LoopStep = {
      kind: "tool_call",
      name: "x",
      args: {},
      ok: false,
      status: "denied",
    };
    expect(stepDotState(errored, [])).toBe("blocked");
    expect(stepDotState(denied, [])).toBe("blocked");
  });

  test("thought and final steps are always done (past-tense narration, never a live state)", () => {
    const thought: LoopStep = { kind: "thought", text: "considering the PR" };
    const final: LoopStep = { kind: "final", message: "done" };
    expect(stepDotState(thought, approvals)).toBe("done");
    expect(stepDotState(final, approvals)).toBe("done");
  });

  test("an approval_id pointing at an already-DECIDED approval does not re-flare as a gate", () => {
    const decided = [approval({ id: "gate-1", status: "approved" })];
    const step: LoopStep = {
      kind: "tool_call",
      name: "studio.pr.merge",
      args: {},
      ok: true,
      status: "executed",
      approval_id: "gate-1",
    };
    expect(stepDotState(step, decided)).toBe("done");
  });
});

describe("stepDescription", () => {
  test("a tool_call step shows the tool name", () => {
    expect(
      stepDescription({
        kind: "tool_call",
        name: "github.pr.open",
        args: {},
        ok: true,
        status: "executed",
      }),
    ).toBe("github.pr.open");
  });
  test("a thought step is truncated to 140 chars, not fabricated", () => {
    const long = "x".repeat(200);
    expect(stepDescription({ kind: "thought", text: long }).length).toBe(140);
  });
  test("a final step shows the message", () => {
    expect(stepDescription({ kind: "final", message: "Shipped the PR." })).toBe("Shipped the PR.");
  });
});

describe("gateTitle / gateConsequence", () => {
  test("studio.pr.merge gets the outcome-named merge copy", () => {
    expect(gateTitle("studio.pr.merge")).toBe("Merge the pull request");
    expect(gateConsequence("studio.pr.merge")).toContain("nothing ships without you");
  });
  test("delegate.openhands names the irreversible hand-off consequence", () => {
    expect(gateTitle("delegate.openhands")).toBe("Hand off to OpenHands");
    expect(gateConsequence("delegate.openhands")).toContain("cannot be undone");
  });
  test("an unknown tool falls back to a plain generic label, not a blank one", () => {
    expect(gateTitle("some.other.tool")).toBe("Run some.other.tool");
    expect(gateConsequence("some.other.tool")).toBe("Nothing runs until you decide.");
  });
});
