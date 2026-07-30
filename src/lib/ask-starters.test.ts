/**
 * The rule under test is not "it produces three prompts". It is that it would
 * rather produce NONE than produce one it cannot source.
 *
 * Founder ruling, 2026-07-30: the suggestions must "know the knowledge about
 * the product", and the corollary that matters more, because it is the one a
 * future change will be tempted to break: two true prompts beat six invented
 * ones. Ask's whole claim is that it answers from the workspace's own record,
 * so a fabricated run title in the first thing a person reads teaches them,
 * correctly, that the citations further down are decoration too.
 */
import { describe, test, expect } from "bun:test";
import { starterPrompts, starterStateIsKnownEmpty, type StarterMission } from "./ask-starters";

const running = (title: string): StarterMission => ({
  title,
  status: "running",
  completed_at: null,
});
const done = (title: string, at: string): StarterMission => ({
  title,
  status: "completed",
  completed_at: at,
});

describe("ask-starters: no fact, no prompt", () => {
  test("a workspace with nothing in it gets nothing, never a generic line", () => {
    expect(starterPrompts({ missions: [] })).toEqual([]);
  });

  // A read that FAILED arrives as null, and is not an absence. Both produce no
  // prompts, but only one of them entitles the surface to say "nothing here".
  test("a failed read produces nothing, and does not read as empty", () => {
    expect(starterPrompts({ missions: null })).toEqual([]);
    expect(starterStateIsKnownEmpty({ missions: null })).toBe(false);
    expect(starterStateIsKnownEmpty({ missions: [] })).toBe(true);
  });

  test("a run with no usable title contributes no prompt rather than a blank one", () => {
    expect(starterPrompts({ missions: [running("   ")] })).toEqual([]);
    expect(starterPrompts({ missions: [running("\n\n")] })).toEqual([]);
  });
});

describe("ask-starters: it names what is really there", () => {
  // TWO LINES, NOT A RUN-ON. The subject leads so the eye knows what the line
  // is about before it reads the question; `prompt` is what gets SENT, and it
  // is still a whole sentence.
  test("work in motion is named, not counted, and the subject leads", () => {
    const out = starterPrompts({ missions: [running("Ship SSO login for Beacon")] });
    expect(out).toEqual([
      {
        subject: "Ship SSO login for Beacon",
        question: "What is the crew doing on it?",
        prompt: "What is the crew doing on Ship SSO login for Beacon?",
      },
    ]);
  });

  test("the most recent finished run is the one it asks about", () => {
    const out = starterPrompts({
      missions: [
        done("Older thing", "2026-07-01T00:00:00.000Z"),
        done("The latest thing", "2026-07-29T00:00:00.000Z"),
      ],
    });
    expect(out.map((o) => o.prompt)).toEqual(["What changed when The latest thing finished?"]);
  });

  // `queued` is not motion: nobody is turning on it, so "what is the crew doing"
  // would have no answer. AppFrame's live line draws the same line.
  test("a queued run is not work in motion", () => {
    const out = starterPrompts({
      missions: [{ title: "Not started", status: "queued", completed_at: null }],
    });
    expect(out).toEqual([]);
  });

  test("what needs you first, then what is moving, then what landed", () => {
    const out = starterPrompts({
      missions: [running("In flight"), done("Landed", "2026-07-29T00:00:00.000Z")],
    });
    expect(out.map((o) => o.prompt)).toEqual([
      "What is the crew doing on In flight?",
      "What changed when Landed finished?",
    ]);
  });

  test("never more than three, however much is happening", () => {
    const out = starterPrompts({
      missions: [running("A"), running("B"), running("C"), running("D")],
    });
    expect(out.length).toBe(3);
  });

  test("one subject asks one question, however many rows carry it", () => {
    const out = starterPrompts({ missions: [running("Same run"), running("same run")] });
    expect(out.length).toBe(1);
  });

  // A title is user and model text: it can be a paragraph, and it is going into
  // a button in a 392px pane.
  test("a very long title is cut rather than allowed to break the button", () => {
    const long = "x".repeat(200);
    const out = starterPrompts({ missions: [running(long)] });
    expect(out[0].subject!.length).toBeLessThan(70);
    expect(out[0].subject).toContain("...");
  });

  test("newlines in a title never break the prompt across two lines", () => {
    const out = starterPrompts({ missions: [running("Ship the\n\nfix")] });
    expect(out[0].subject).toBe("Ship the fix");
    expect(out[0].prompt).toBe("What is the crew doing on Ship the fix?");
  });
});
