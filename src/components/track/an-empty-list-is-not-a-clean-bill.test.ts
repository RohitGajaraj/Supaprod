import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import {
  answerRecord,
  canRaiseOne,
  openQuestionsLine,
  openQuestionsState,
  proceedRecord,
  raisedRecord,
} from "./an-empty-list-is-not-a-clean-bill";

/** The two real lists on record, verbatim from `agent_messages`. */
const REAL = [
  "Should the PRD include mockups for the 1-tap confirm UI?",
  "Are there existing fraud model versioning conventions to follow?",
];

/** One handoff carrying `open_questions` exactly as S0's reader narrows it. */
const h = (openQuestions: readonly string[] | null) => ({ openQuestions });
/** The 140-of-143 shape: a handoff that never filed the field at all. */
const SILENT = h(null);

describe("the three absences are three different answers", () => {
  it("a failed read is never drawn as 'none'", () => {
    // R-16, and the dominant defect class in this repo.
    expect(openQuestionsState({ handoffs: null, stationRan: true })).toEqual({
describe("the three absences are three different answers", () => {
  it("a failed read is never drawn as 'none'", () => {
    // R-16, and the dominant defect class in this repo.
    expect(openQuestionsState({ questions: null, stationRan: true })).toEqual({
      kind: "cannot-tell",
    });
  });

  it("a failed read on a station that has not run is STILL a failed read", () => {
    /*
     * Order matters: reporting this as "not yet" converts our ignorance into a
     * fact about the work.
     */
    expect(openQuestionsState({ handoffs: null, stationRan: false }).kind).toBe("cannot-tell");
  });

  it("not-yet and filed-none are not the same state", () => {
    expect(openQuestionsState({ handoffs: [SILENT], stationRan: false }).kind).toBe("not-yet");
    expect(openQuestionsState({ handoffs: [h([])], stationRan: true }).kind).toBe("filed-none");
  });

  it("A SILENCE IS NOT A STATED NONE -- the 140-of-143 case", () => {
    /*
     * S0's reader keeps `null` (never filed the field) apart from `[]` (filed it
     * and said none). 140 of 143 handoffs are the former. Collapsing them would
     * turn 140 silences into 140 clean bills on the one field 2.1 rules is a
     * defect rather than a clean bill.
     */
    expect(openQuestionsState({ handoffs: [SILENT], stationRan: true }).kind).toBe("said-nothing");
    expect(openQuestionsState({ handoffs: [h([])], stationRan: true }).kind).toBe("filed-none");
    expect(openQuestionsState({ handoffs: [], stationRan: true }).kind).toBe("said-nothing");
  });

  it("one handoff that filed the field outranks the silent ones beside it", () => {
    // A station that handed on three times and answered once HAS answered.
    expect(openQuestionsState({ handoffs: [SILENT, h([]), SILENT], stationRan: true }).kind).toBe(
      "filed-none",
    );
  });

  it("gathers questions across handoffs and does not count a repeat twice", () => {
    /*
     * A question restated in a second handoff is one unsettled thing, not two.
     * The opposite call from `what-it-produced.ts`, which counts repeated
     * FILINGS because that is the fact revealing a jam -- a repeated question
     * reveals nothing.
     */
    const s = openQuestionsState({
      handoffs: [h([REAL[0]]), h([REAL[0], REAL[1]]), SILENT],
      stationRan: true,
    });
    expect(s).toEqual({ kind: "asked", questions: [REAL[0], REAL[1]] });
  });

  it("keeps the questions verbatim when there are some", () => {
    expect(openQuestionsState({ handoffs: [h(REAL)], stationRan: true })).toEqual({
    expect(openQuestionsState({ questions: null, stationRan: false }).kind).toBe("cannot-tell");
  });

  it("not-yet and filed-none are not the same state", () => {
    expect(openQuestionsState({ questions: [], stationRan: false }).kind).toBe("not-yet");
    expect(openQuestionsState({ questions: [], stationRan: true }).kind).toBe("filed-none");
  });

  it("keeps the questions verbatim when there are some", () => {
    expect(openQuestionsState({ questions: REAL, stationRan: true })).toEqual({
      kind: "asked",
      questions: REAL,
    });
  });
});

describe("the section ALWAYS speaks, and that is the whole of #29", () => {
  it("never returns null or an empty line, in any state", () => {
    const states = [
      openQuestionsState({ handoffs: null, stationRan: true }),
      openQuestionsState({ handoffs: [SILENT], stationRan: false }),
      openQuestionsState({ handoffs: [SILENT], stationRan: true }),
      openQuestionsState({ handoffs: [h([])], stationRan: true }),
      openQuestionsState({ handoffs: [h(REAL)], stationRan: true }),
      openQuestionsState({ questions: null, stationRan: true }),
      openQuestionsState({ questions: [], stationRan: false }),
      openQuestionsState({ questions: [], stationRan: true }),
      openQuestionsState({ questions: REAL, stationRan: true }),
    ];
    for (const s of states) {
      const line = openQuestionsLine(s, "Discover");
      expect(line.length, `${s.kind} said nothing`).toBeGreaterThan(0);
    }
  });

  it("says an empty list is not a clean bill, WITHOUT accusing the station", () => {
    const line = openQuestionsLine(
      openQuestionsState({ handoffs: [h([])], stationRan: true }),
      "Discover",
    );
    expect(line).toContain("not a clean bill");
      openQuestionsState({ questions: [], stationRan: true }),
      "Discover",
    );
    expect(line).toContain("not the same as nothing being unsettled");
    /*
     * The spec says "Discover filing zero open questions means it did not look."
     * That is a general claim used to justify making the field load-bearing. On
     * screen it would be an accusation about ONE run that this surface cannot
     * check, and equally consistent with a genuinely simple problem.
     */
    expect(line).not.toMatch(/did not look|didn't look|lazy|failed to/i);
  });

  it("counts in words a person would say", () => {
    expect(
      openQuestionsLine(
        openQuestionsState({ handoffs: [h([REAL[0]])], stationRan: true }),
        "Discover",
      ),
    ).toBe("Discover left one thing unsettled.");
    expect(
      openQuestionsLine(openQuestionsState({ handoffs: [h(REAL)], stationRan: true }), "Discover"),
      openQuestionsLine(openQuestionsState({ questions: [REAL[0]], stationRan: true }), "Discover"),
    ).toBe("Discover left one thing unsettled.");
    expect(
      openQuestionsLine(openQuestionsState({ questions: REAL, stationRan: true }), "Discover"),
    ).toBe("Discover left 2 things unsettled.");
  });
});

describe("what a person may do, and where the door is shut", () => {
  it("offers the raise control when the station filed none, the inversion 4.3 asks for", () => {
    expect(canRaiseOne(openQuestionsState({ handoffs: [h([])], stationRan: true }))).toBe(true);
    expect(canRaiseOne(openQuestionsState({ questions: [], stationRan: true }))).toBe(true);
  });

  it("STILL offers it when we could not read the list, because no dead end, ever", () => {
    /*
     * This asserted `false` until the pane was driven. On a real Discover stop
     * the section rendered "I could not read what was left unsettled" with no
     * control beneath it: a sentence saying "I don't know" and offering nothing,
     * which SESSION-1 unit 5 forbids.
     *
     * The original reasoning treated the record as a mutation of the list. It is
     * not -- an answer is an independent track-scoped steer, so naming something
     * unsettled is valid whether or not we ever read what the station filed.
     */
    expect(canRaiseOne(openQuestionsState({ handoffs: null, stationRan: true }))).toBe(true);
  });

  it("does not offer it before the station has run", () => {
    expect(canRaiseOne(openQuestionsState({ handoffs: [SILENT], stationRan: false }))).toBe(false);
    expect(canRaiseOne(openQuestionsState({ questions: null, stationRan: true }))).toBe(true);
  });

  it("does not offer it before the station has run", () => {
    expect(canRaiseOne(openQuestionsState({ questions: [], stationRan: false }))).toBe(false);
  });
});

describe("proceed anyway is an ANSWER, never a dismissal", () => {
  it("writes a record, and the record still says the question is open", () => {
    const r = proceedRecord(REAL[1]);
    expect(r).toContain(REAL[1]);
    expect(r).toContain("still open");
  });

  it("is the same kind of record as an answer, so the transcript treats it the same", () => {
    /*
     * A dismissal would remove the question and leave the record saying nothing
     * was ever unsettled -- the exact state `filed-none` exists to flag.
     */
    expect(proceedRecord(REAL[1]).startsWith("Answering ")).toBe(true);
    expect(answerRecord(REAL[1], "Yes, v2 conventions").startsWith("Answering ")).toBe(true);
  });
});

describe("a record carries its question verbatim", () => {
  it("an answer is readable a week later without a lookup", () => {
    expect(answerRecord(REAL[0], "No, ship it without mockups")).toBe(
      `Answering "${REAL[0]}": No, ship it without mockups`,
    );
  });

  it("trims the person's typing without touching the question's meaning", () => {
    expect(answerRecord("  Q?  ", "  A  ")).toBe('Answering "Q?": A');
  });

  it("a raised question is the same message shape, not an eighth message kind", () => {
    expect(raisedRecord("  Who owns the fraud model?  ")).toBe(
      "Raising an open question: Who owns the fraud model?",
    );
  });
});

describe("the vocabulary law", () => {
  it("never puts a schema word on a surface", () => {
    /*
     * Acceptance: "nothing on screen says intent.md, open_questions or payload."
     * Asserting on the LINES rather than the file, so a comment discussing the
     * field (this file is full of them) cannot fail the guard and get it
     * softened -- the mistake `agent-vocabulary.test.ts` explicitly avoided.
     */
    const lines = [
      openQuestionsLine(openQuestionsState({ handoffs: null, stationRan: true }), "Discover"),
      openQuestionsLine(openQuestionsState({ handoffs: [SILENT], stationRan: false }), "Discover"),
      openQuestionsLine(openQuestionsState({ handoffs: [SILENT], stationRan: true }), "Discover"),
      openQuestionsLine(openQuestionsState({ handoffs: [h([])], stationRan: true }), "Discover"),
      openQuestionsLine(openQuestionsState({ handoffs: [h(REAL)], stationRan: true }), "Discover"),
      openQuestionsLine(openQuestionsState({ questions: null, stationRan: true }), "Discover"),
      openQuestionsLine(openQuestionsState({ questions: [], stationRan: false }), "Discover"),
      openQuestionsLine(openQuestionsState({ questions: [], stationRan: true }), "Discover"),
      openQuestionsLine(openQuestionsState({ questions: REAL, stationRan: true }), "Discover"),
      answerRecord("Q?", "A"),
      proceedRecord("Q?"),
      raisedRecord("Q?"),
    ];
    for (const line of lines) {
      expect(line, line).not.toMatch(/intent\.md|open_questions|payload|artifact|schema/i);
    }
  });

  it("does not invent a second ask mechanism, because the record is a steer", () => {
    /*
     * QUEUE-S1.md: "Do not build a second ask mechanism." The guard is that this
     * module produces TEXT for the existing `steerTrack` path and holds no
     * writer of its own.
     */
    const src = readFileSync(
      new URL("./an-empty-list-is-not-a-clean-bill.ts", import.meta.url).pathname,
      "utf8",
    );
    expect(src).not.toMatch(/createServerFn|supabase|\.insert\(|useMutation/);
  });
});
