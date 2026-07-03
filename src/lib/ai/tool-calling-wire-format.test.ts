import { describe, it, expect } from "bun:test";
import { openAiToolsPayload, extractOpenAiToolCalls } from "./runtime.server";

// AGT-01 — the OpenAI-compat/gateway wire-format translation. Tested directly
// (no fetch mocking) since both functions are pure request/response shape
// mappers around the actual provider call.

describe("openAiToolsPayload", () => {
  it("returns an empty object when no tools are given (existing callers unaffected)", () => {
    expect(openAiToolsPayload(undefined)).toEqual({});
    expect(openAiToolsPayload([])).toEqual({});
  });

  it("maps a tool def to the OpenAI function-calling wire shape", () => {
    const payload = openAiToolsPayload([
      { name: "tasks.create", description: "Adds a task.", input_schema: { type: "object" } },
    ]);
    expect(payload).toEqual({
      tools: [
        {
          type: "function",
          function: {
            name: "tasks.create",
            description: "Adds a task.",
            parameters: { type: "object" },
          },
        },
      ],
    });
  });
});

describe("extractOpenAiToolCalls", () => {
  it("returns undefined when there are no tool calls (the common prose-reply case)", () => {
    expect(extractOpenAiToolCalls(undefined)).toBeUndefined();
    expect(extractOpenAiToolCalls([])).toBeUndefined();
  });

  it("parses a well-formed tool call's JSON-string arguments", () => {
    const calls = extractOpenAiToolCalls([
      {
        id: "call_1",
        function: { name: "tasks.create", arguments: '{"title":"Write the report"}' },
      },
    ]);
    expect(calls).toEqual([
      { id: "call_1", name: "tasks.create", args: { title: "Write the report" } },
    ]);
  });

  it("does not throw on malformed arguments JSON — falls back to the raw string rather than dropping the call", () => {
    const calls = extractOpenAiToolCalls([
      { id: "call_1", function: { name: "tasks.create", arguments: "{not valid json" } },
    ]);
    expect(calls).toEqual([{ id: "call_1", name: "tasks.create", args: "{not valid json" }]);
  });

  it("skips an entry with no function name (defensive against a malformed provider response)", () => {
    const calls = extractOpenAiToolCalls([{ id: "call_1", function: { arguments: "{}" } }]);
    expect(calls).toBeUndefined();
  });

  it("defaults missing arguments to an empty object", () => {
    const calls = extractOpenAiToolCalls([{ id: "call_1", function: { name: "mission.observe" } }]);
    expect(calls).toEqual([{ id: "call_1", name: "mission.observe", args: {} }]);
  });
});
