/**
 * BOTH PREVIEWS BELOW ARE PRODUCTION ROWS, COPIED WHOLE.
 *
 * `ai_events.output_preview` on trace `899baa5a-edf4-48f4-b1cd-e7873cc71216`,
 * Critique's turn at Design on Helio Labs, read 2026-09-09. The first is CUT --
 * the column ended inside the tool call's arguments, with no closing quote and
 * no closing brace -- and the second is whole. That pair is the entire reason
 * this module scans instead of parsing: `JSON.parse` throws on the first, which
 * is the ordinary case on a busy trace, so an implementation built on it fails
 * exactly where the data is richest.
 */
import { describe, it, expect } from "bun:test";

import {
  readModelStep,
  readJsonString,
  actionLine,
} from "@/components/traces/what-the-model-said";

/** Cut by the column, mid-string, inside `action.args.query`. */
const CLIPPED =
  '{"thought":"I need to review the standing design system and the spec to evaluate the provided prototype designs for differentiating the red status tile shown after an over-the-air firmware reboot from the red status tile shown during a real production outage. The spec explicitly asks to differentiate these two states, and the prototypes propose using amber color (#FF9E44), a static clock icon with circular arrow overlay (no rotation), and the text \'Updating firmware...\' in 14pt Roboto font. I must verify conformance against the standing design language and identify any violations or gaps.", "action":{"type":"tool_call","name":"workspace.search","args":{"query":"standing design system color s';

/** The next call on the same trace, complete, carrying its `reason`. */
const WHOLE =
  '{"thought":"The workspace.search did not return the standing design system\'s color semantics or the \'Fault colour is reserved\' constraint. I need to search more specifically for design system documentation about color usage, especially regarding fault states and planned maintenance indicators.", "action":{"type":"tool_call","name":"workspace.search","args":{"query":"design system color palette fault amber maintenance"},"reason":"I need to locate the official design system rules about color usage to verify whether amber (#FF9E44) is an approved semantic color for planned maintenance states, and whether using it here violates the constraint that \'Fault colour is reserved\'."}}';

describe("what a model call said about itself", () => {
  it("gets the whole thought out of a preview the column cut in half", () => {
    // The case JSON.parse cannot serve. This is the row the trace page was
    // rendering as `{"thought":"I need to review the standing design sys...`.
    expect(() => JSON.parse(CLIPPED)).toThrow();

    const step = readModelStep(CLIPPED);
    expect(step).not.toBeNull();
    expect(step!.thought).toStartWith("I need to review the standing design system and the spec");
    expect(step!.thought).toEndWith("identify any violations or gaps.");
    expect(step!.action?.name).toBe("workspace.search");
    expect(step!.action?.kind).toBe("tool_call");
    // The cut fell after every field this renders, so nothing it shows is
    // partial -- `clipped` is about the fields read, not about the column.
    expect(step!.action?.reason).toBeNull();
  });

  it("reads the reason, which is the field worth the most and was never drawn", () => {
    const step = readModelStep(WHOLE);
    expect(step!.action?.reason).toBe(
      "I need to locate the official design system rules about color usage to verify whether amber (#FF9E44) is an approved semantic color for planned maintenance states, and whether using it here violates the constraint that 'Fault colour is reserved'.",
    );
    expect(step!.clipped).toBe(false);
    expect(actionLine(step!)).toBe("workspace.search");
  });

  it("keeps the quoted phrases inside a thought intact", () => {
    // A thought quoting a design rule is the common case, not the edge one, so
    // the escape decoding is load-bearing rather than defensive.
    expect(readModelStep(WHOLE)!.thought).toContain("'Fault colour is reserved' constraint");
  });

  it("says a value was cut when the cut lands inside a field it renders", () => {
    const cutInThought = '{"thought":"I was about to explain why but the column';
    const step = readModelStep(cutInThought);
    expect(step!.thought).toBe("I was about to explain why but the column");
    expect(step!.clipped).toBe(true);
  });

  it("returns null for a shape that is not a model step, so the caller falls back", () => {
    // A tool RESULT is an array and belongs to a different reader.
    expect(readModelStep('[{"id":"a468f120","kind":"learning","score":0.117}]')).toBeNull();
    // Plain prose output.
    expect(readModelStep("The design conforms to the spec.")).toBeNull();
    // An object carrying none of the four fields tells a reader nothing.
    expect(readModelStep('{"tokens":412,"model":"qwen/qwen-plus"}')).toBeNull();
    expect(readModelStep(null)).toBeNull();
    expect(readModelStep("")).toBeNull();
  });

  it("never returns anything the model did not write", () => {
    // Every string out of this module is a substring of the input, decoded.
    const step = readModelStep(WHOLE)!;
    const flat = WHOLE.replace(/\\'/g, "'");
    for (const s of [step.thought, step.action?.name, step.action?.reason]) {
      if (!s) continue;
      // Compare on the escape-decoded form, since that is what was returned.
      expect(flat.replace(/\\"/g, '"')).toContain(s.slice(0, 40));
    }
  });
});

describe("the string reader underneath", () => {
  it("stops at an unescaped quote and not at an escaped one", () => {
    const r = readJsonString('{"a":"he said \\"no\\" twice","b":1}', "a");
    expect(r!.value).toBe('he said "no" twice');
    expect(r!.clipped).toBe(false);
  });

  it("decodes the escapes JSON.stringify writes", () => {
    expect(readJsonString('{"a":"one\\ntwo\\ttab \\u00e9"}', "a")!.value).toBe("one\ntwo\ttab é");
  });

  it("ends a value where the input ends rather than throwing", () => {
    const r = readJsonString('{"a":"unterminated', "a");
    expect(r!.value).toBe("unterminated");
    expect(r!.clipped).toBe(true);
  });

  it("ends the value where a half-written unicode escape was cut", () => {
    const r = readJsonString('{"a":"caf\\u00', "a");
    expect(r!.value).toBe("caf");
    expect(r!.clipped).toBe(true);
  });

  it("refuses a key that is present but not a string value", () => {
    // `"action":{...}` must not be read as a string, or the reader would return
    // the whole rest of the document as one value.
    expect(readJsonString('{"action":{"type":"tool_call"}}', "action")).toBeNull();
  });

  it("finds nothing when the key is absent", () => {
    expect(readJsonString('{"b":"x"}', "a")).toBeNull();
  });
});
