/**
 * THE DEFECT, READ LIVE ON `/traces/4df54b89`, 2026-09-10.
 *
 * Twelve rows led with "Critique" and six of them with "called qwen/qwen-plus",
 * on a page whose header says "Critique's turn at Design", whose rail says
 * "Who ran it - Critique - 7 calls", and whose detail pane names the model. The
 * brightest position on every row spent itself on two facts the page had
 * already stated twice, while the agent's reasoning sat truncated in the sub.
 */
import { describe, expect, it } from "bun:test";

import { whatEveryRowRepeats } from "./a-constant-is-not-news";

/** The measured trace: one agent, one model, alternating thought and tool. */
const ONE_SEAT = [
  { actor: "Critique", model: "qwen/qwen-plus" },
  { actor: "Critique", model: null },
  { actor: "Critique", model: "qwen/qwen-plus" },
  { actor: "Critique", model: null },
  { actor: "Critique", model: "qwen/qwen-plus" },
];

describe("a fact on every row is not news", () => {
  it("names both constants on the trace this was read off", () => {
    expect(whatEveryRowRepeats(ONE_SEAT)).toEqual({
      actor: "Critique",
      model: "qwen/qwen-plus",
    });
  });

  it("skips rows that do not carry the fact rather than counting them as disagreement", () => {
    /*
     * Half the rows in any trace are tool calls and carry no model. Treating
     * their null as a second value would mean no trace ever had a constant
     * model, and the rule would never fire on the one page it was written for.
     */
    const toolRows = ONE_SEAT.filter((r) => r.model === null);
    expect(toolRows.length).toBeGreaterThan(0);
    expect(whatEveryRowRepeats(ONE_SEAT).model).toBe("qwen/qwen-plus");
  });
});

describe("and it stops the moment the fact becomes the news", () => {
  it("a handoff inside one trace keeps the actor in the lead", () => {
    // Two agents in one trace is real -- the rail draws them as two rows for
    // exactly that reason -- and there the actor is the most important word on
    // the line, because "which of them did this" is the reader's question.
    const handoff = [
      { actor: "Engineer", model: "qwen/qwen-plus" },
      { actor: "Engineer", model: null },
      { actor: "Review", model: "qwen/qwen-plus" },
    ];
    expect(whatEveryRowRepeats(handoff).actor).toBeNull();
    /* The model is still constant, and is still dropped: the two are judged
       separately because they vary for different reasons. */
    expect(whatEveryRowRepeats(handoff).model).toBe("qwen/qwen-plus");
  });

  it("a fallback to a second model keeps the model in the lead", () => {
    const fellBack = [
      { actor: "Critique", model: "qwen/qwen-plus" },
      { actor: "Critique", model: null },
      { actor: "Critique", model: "anthropic/claude" },
    ];
    expect(whatEveryRowRepeats(fellBack).model).toBeNull();
    expect(whatEveryRowRepeats(fellBack).actor).toBe("Critique");
  });
});

describe("what is too small to be a repetition", () => {
  it("one row of a fact is not a constant", () => {
    /*
     * One row cannot repeat anything, and on a trace of a single call the lead
     * is the ONLY place the fact appears in the list at all. The safe
     * direction is to keep it: a dull row costs a reader nothing, and a
     * dropped varying fact costs them the ability to tell two agents apart.
     */
    expect(whatEveryRowRepeats([{ actor: "Critique", model: "qwen/qwen-plus" }])).toEqual({
      actor: null,
      model: null,
    });
  });

  it("and no rows at all is not a constant either", () => {
    expect(whatEveryRowRepeats([])).toEqual({ actor: null, model: null });
  });

  it("an empty string is not a value", () => {
    // A blank actor is a missing one, and two blanks are not agreement.
    expect(
      whatEveryRowRepeats([
        { actor: "", model: "" },
        { actor: "", model: "" },
      ]),
    ).toEqual({ actor: null, model: null });
  });
});
