import { describe, it, expect } from "bun:test";
import { taskAsked } from "./handoff-said";

/** The exact payload shape a real row carries, trimmed to the fields read. */
const REAL = {
  task: "Draft a Product Requirements Document detailing the functionality, user stories, and technical requirements for enabling saved delivery address reuse.",
  context: {
    attempt: 1,
    rationale: "Translate the strategic decision into a clear, detailed specification.",
    mission_step_idx: 3,
  },
  memory_refs: [{ id: "29c1950a", summary: "Correction closed on ..." }],
};

describe("what was actually asked when the work changed hands", () => {
  it("reads the sender's own instruction out of a real payload", () => {
    expect(taskAsked(REAL)).toBe(REAL.task);
  });

  it("falls back to the rationale, but never ahead of the task", () => {
    // `task` says what was wanted; `rationale` says why the hop happened. A row
    // that showed the second while the first existed would answer a question
    // nobody asked.
    expect(taskAsked({ context: { rationale: "Because the spec was approved." } })).toBe(
      "Because the spec was approved.",
    );
    expect(taskAsked(REAL)).toBe(REAL.task);
  });

  it("says nothing rather than composing a sentence", () => {
    /*
     * THE PROPERTY THAT MATTERS MOST. A handoff row that invented a plausible
     * instruction would be worse than one that stayed quiet -- it is exactly
     * what SPEC-PRESENCE forbids: a state the data cannot prove is a state you
     * do not draw.
     */
    for (const empty of [null, undefined, {}, { task: "" }, { task: "   " }, "a string", 42, []]) {
      expect(taskAsked(empty)).toBeNull();
    }
    expect(taskAsked({ context: { rationale: "" } })).toBeNull();
  });
});
