/**
 * The one rule: NEVER INVENT A STATUS.
 *
 * The founder asked for a live line "like Claude Code shows waiting for
 * background, running this task, discovering". The tempting build is a carousel
 * of those verbs on a timer, and it is a lie told at four second intervals: the
 * plain chat path in `/api/chat` (`researchMode === "chat"`) emits no progress
 * events at all, so on that path every one of those words would be invented.
 *
 * These pin the vocabulary to two client-observable facts plus whatever the
 * server actually said, so a future change that adds a nicer-sounding verb has
 * to delete a test that explains why it must not.
 */
import { describe, test, expect } from "bun:test";
import { workingLabel } from "./Working";

describe("workingLabel: the server's words win", () => {
  test("a real progress event is shown verbatim", () => {
    expect(workingLabel({ phase: "search", label: "Searching: SSO rollout" }, false)).toBe(
      "Searching: SSO rollout",
    );
    expect(workingLabel({ phase: "workspace", label: "Reading your workspace" }, true)).toBe(
      "Reading your workspace",
    );
  });

  // A status frame arriving with an empty label is a malformed frame, not an
  // instruction to render a blank line where a verb should be.
  test("an empty label falls back rather than rendering nothing", () => {
    expect(workingLabel({ phase: "plan", label: "   " }, false)).toBe("Working");
  });
});

describe("workingLabel: with no event, only what it can see", () => {
  test("nothing has come back yet", () => {
    expect(workingLabel(null, false)).toBe("Working");
  });

  test("tokens are arriving, which is a fact and not a guess", () => {
    expect(workingLabel(null, true)).toBe("Writing the answer");
  });

  test("the whole vocabulary is two words wide, and no verb is invented", () => {
    const everything = [workingLabel(null, false), workingLabel(null, true)];
    expect(everything).toEqual(["Working", "Writing the answer"]);
    for (const invented of ["Discovering", "Thinking", "Consulting the record", "Analyzing"]) {
      expect(everything).not.toContain(invented);
    }
  });
});
