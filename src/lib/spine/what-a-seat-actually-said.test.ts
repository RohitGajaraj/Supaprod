/**
 * THE FIXTURE IS THE ONE RUN THAT EVER FINISHED.
 *
 * `d1168015` walked all seven stations -- 15 members across signal, theme,
 * decision, spec, task, prototype, changeset and learning -- and is the only
 * track in this product's history to do it. Read on the served build, the hold
 * card drew eleven lines of raw JSON on it, in a 250px column.
 *
 * The string below is that `agent_runs.output`, shortened where the real one
 * runs long. Not invented: the whole point is that the loop's own preamble sits
 * in front of the model's step, so a check on the first character finds prose
 * and quotes the lot.
 */
import { describe, expect, it } from "bun:test";

import { whatASeatActuallySaid } from "./what-a-seat-actually-said";
import { claimOf } from "./what-it-keeps-saying";

/** The real shape: a sentence the LOOP wrote, then the model's step. */
const STEP_LIMIT =
  'Reached the step limit before finishing. Where it got to: {"thought":"The studio.commit call failed because it requires a message parameter. I need to provide a commit message that describes the changes.", "action":{"type":"tool_call","name":"studio.commit","args":{"message":"feat(checkout): implement tablet-optimized address summary screen"},"reason":"The studio.commit call requires a message parameter, so I need to provide a descriptive commit message."}}';

const PROSE =
  "No repository is connected for this workspace. I cannot proceed with implementing the reschedule functionality without access to the codebase.";

describe("a seat's words, as prose", () => {
  it("finds the thought inside the step the loop pasted after its preamble", () => {
    expect(whatASeatActuallySaid(STEP_LIMIT)).toBe(
      "The studio.commit call failed because it requires a message parameter. I need to provide a commit message that describes the changes.",
    );
  });

  it("takes the THOUGHT and not the action's reason", () => {
    // The thought is what the seat believed about the work; the reason is why
    // it picked the next tool. On a run that got stuck, a person needs the
    // first, and this string carries both.
    expect(whatASeatActuallySaid(STEP_LIMIT)).not.toContain("descriptive commit message");
  });

  it("hands back prose unchanged, because most output IS prose", () => {
    // Rewriting a sentence a model wrote would be this file inventing a voice.
    expect(whatASeatActuallySaid(PROSE)).toBe(PROSE);
  });
});

describe("and it fixed the measure, not only the picture", () => {
  it("the claim was being taken from inside the JSON", () => {
    /*
     * `claimOf` takes the FIRST SENTENCE. On the raw string that sentence ends
     * inside the braces, so the claim two seats were grouped on was punctuation
     * -- the matching, the folding and the section refrain were all reading it.
     * The quote was the visible half of a defect that reached every measure
     * downstream.
     */
    const rawClaim = claimOf(STEP_LIMIT)!;
    expect(rawClaim).toContain("step limit");
    expect(claimOf(whatASeatActuallySaid(STEP_LIMIT))).toBe(
      "The studio.commit call failed because it requires a message parameter.",
    );
  });

  it("and two seats hitting one wall now group on the wall", () => {
    const a = whatASeatActuallySaid(STEP_LIMIT)!;
    const b = whatASeatActuallySaid(
      'Reached the step limit. Where it got to: {"thought":"The studio.commit call failed because it requires a message parameter, so nothing was committed."}',
    )!;
    expect(claimOf(a)).toBeTruthy();
    expect(claimOf(b)).toBeTruthy();
    expect(a).toContain("studio.commit");
    expect(b).toContain("studio.commit");
  });
});

describe("what it refuses to do", () => {
  it("keeps the lead sentence when the braces are unreadable", () => {
    /*
     * Returning the raw string would put JSON back on the screen and returning
     * null would delete a seat's only account of itself. The prose before the
     * brace is what a person or the loop wrote, and it is a sentence either
     * way.
     */
    expect(whatASeatActuallySaid("Something went wrong. Detail: {not json at all")).toBe(
      "Something went wrong. Detail:",
    );
  });

  it("keeps the whole string when there is nothing before the brace either", () => {
    // Better a readable failure than an empty card.
    const opaque = "{oh dear}";
    expect(whatASeatActuallySaid(opaque)).toBe(opaque);
  });

  it("passes null and empty straight through", () => {
    expect(whatASeatActuallySaid(null)).toBeNull();
    expect(whatASeatActuallySaid(undefined)).toBeNull();
    expect(whatASeatActuallySaid("")).toBeNull();
  });

  it("and does not go looking for a brace that is not there", () => {
    const plain = "Nothing was filed for this step.";
    expect(whatASeatActuallySaid(plain)).toBe(plain);
  });
});
