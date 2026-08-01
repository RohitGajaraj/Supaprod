/**
 * The loop must accept the action shape models actually emit.
 *
 * FOUND LIVE 2026-08-01, by reading a checkpoint rather than by reasoning about
 * the code. Learn's data-analyst had graded the outcome correctly, chosen
 * `learning.record`, and written a well-formed argument object carrying the
 * verdict, the evidence id and its reasoning. It emitted
 * `{"type":"learning.record","args":{...}}` instead of
 * `{"type":"tool_call","name":"learning.record","args":{...}}`, so `action.name`
 * was undefined, the loop replied "Unknown tool: undefined", and every bit of
 * that work was discarded. The station filed nothing and looked broken. The
 * agent was right.
 *
 * These pin both directions: the mistake is absorbed, and nothing else is.
 */
import { describe, it, expect } from "bun:test";
import { normalizeAction } from "./loop.server";

describe("the action envelope", () => {
  it("reads a tool name that landed in `type`", () => {
    const out = normalizeAction({
      thought: "graded it",
      action: { type: "learning.record", args: { verdict: "missed" } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a = (out as any).action;
    expect(a.type).toBe("tool_call");
    expect(a.name).toBe("learning.record");
    // The arguments must survive untouched; they are the work.
    expect(a.args).toEqual({ verdict: "missed" });
  });

  it("leaves a correctly shaped tool call alone", () => {
    const input = {
      thought: "t",
      action: { type: "tool_call", name: "prd.draft", args: { title: "x" } },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(normalizeAction(input as any)).toEqual(input as any);
  });

  it("leaves a final answer alone", () => {
    const input = { thought: "t", action: { type: "final", message: "done" } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(normalizeAction(input as any)).toEqual(input as any);
  });

  it("does not invent a tool call from an action with no args", () => {
    // Requiring `args` is what stops a future protocol word being rewritten
    // into a phantom tool named after itself.
    const input = { thought: "t", action: { type: "something_new" } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(normalizeAction(input as any)).toEqual(input as any);
  });

  it("does not overwrite a name that is already there", () => {
    const input = {
      thought: "t",
      action: { type: "weird", name: "prd.draft", args: {} },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(normalizeAction(input as any)).toEqual(input as any);
  });

  it("survives a reply with no action at all", () => {
    expect(normalizeAction(null)).toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(normalizeAction({ thought: "t" } as any)).toEqual({ thought: "t" } as any);
  });
});
