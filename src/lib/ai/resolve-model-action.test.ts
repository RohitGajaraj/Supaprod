import { describe, it, expect } from "bun:test";
import { resolveModelAction } from "./loop.server";

// AGT-01 — structured-output protocol upgrade. resolveModelAction prefers a
// native tool call when the flag is enabled AND the provider actually
// returned one; every other case falls back to the legacy safeParseAction
// text-parse, which is the CURRENT universal protocol and must stay
// byte-identical in behavior when the flag is off (the backward-
// compatibility guarantee the whole design rests on).

describe("resolveModelAction — native-toolcalling / legacy-text-parse branching", () => {
  it("flag OFF (default): always uses the legacy text parse, even if toolCalls happen to be present", () => {
    const result = {
      output: '{"thought":"t","action":{"type":"final","message":"done"}}',
      toolCalls: [{ name: "tasks.create", args: { title: "x" } }],
    };
    const parsed = resolveModelAction(result, false);
    expect(parsed?.action?.type).toBe("final");
    if (parsed?.action?.type === "final") expect(parsed.action.message).toBe("done");
  });

  it("flag ON + a native tool call present: uses the tool call directly, skipping text parsing entirely", () => {
    const result = {
      output: "I'll create that task.",
      toolCalls: [{ name: "tasks.create", args: { title: "Write the report" } }],
    };
    const parsed = resolveModelAction(result, true);
    expect(parsed?.thought).toBe("I'll create that task.");
    expect(parsed?.action).toEqual({
      type: "tool_call",
      name: "tasks.create",
      args: { title: "Write the report" },
    });
  });

  it("flag ON + empty output text alongside a tool call: thought is left undefined, not an empty string", () => {
    const parsed = resolveModelAction(
      { output: "", toolCalls: [{ name: "tasks.create", args: {} }] },
      true,
    );
    expect(parsed?.thought).toBeUndefined();
  });

  it("flag ON but the provider returned no tool call (plain text reply): falls back to the legacy text parse — the graceful-degradation path", () => {
    const result = { output: '{"thought":"t","action":{"type":"final","message":"ok"}}' };
    const parsed = resolveModelAction(result, true);
    expect(parsed?.action?.type).toBe("final");
  });

  it("flag ON with an empty toolCalls array: also falls back to the legacy text parse (empty array is falsy-length, not 'a tool call happened')", () => {
    const result = {
      output: '{"thought":"t","action":{"type":"final","message":"ok"}}',
      toolCalls: [],
    };
    const parsed = resolveModelAction(result, true);
    expect(parsed?.action?.type).toBe("final");
  });

  it("only ever consumes the FIRST tool call when a provider returns more than one (single-action-per-step architecture, matches today's one-action-per-turn design)", () => {
    const result = {
      output: "",
      toolCalls: [
        { name: "tasks.create", args: { title: "first" } },
        { name: "notes.create", args: { title: "second" } },
      ],
    };
    const parsed = resolveModelAction(result, true);
    expect(parsed?.action).toEqual({
      type: "tool_call",
      name: "tasks.create",
      args: { title: "first" },
    });
  });

  it("flag ON with unparseable garbled text and no tool call: returns null, matching today's exact 'no retry, finalize with raw text' behavior", () => {
    const parsed = resolveModelAction({ output: "not json at all {{{" }, true);
    expect(parsed).toBeNull();
  });
});
