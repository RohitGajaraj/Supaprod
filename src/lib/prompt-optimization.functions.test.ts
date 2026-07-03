import { describe, it, expect } from "bun:test";
import {
  shouldProposeDraft,
  renderFailureEvidence,
  parseDraftedPromptDiff,
  buildProposalNote,
  draftingMessages,
  type FailureReport,
  type GradedFailure,
} from "./prompt-optimization.functions";

function failure(overrides: Partial<GradedFailure> = {}): GradedFailure {
  return {
    caseId: "case-1",
    caseName: "Handles an ambiguous request",
    input: "Do the thing",
    expected: "Asks a clarifying question",
    rubric: null,
    actual: "Invented an assumption and proceeded",
    score: 40,
    judgeReasoning: "Model guessed instead of asking",
    ...overrides,
  };
}

function report(overrides: Partial<FailureReport> = {}): FailureReport {
  return {
    suiteId: "suite-1",
    suiteName: "Planner ambiguity handling",
    passThreshold: 80,
    totalCases: 10,
    failures: [failure(), failure({ caseId: "case-2" })],
    ...overrides,
  };
}

describe("shouldProposeDraft", () => {
  it("requires at least 2 corroborating failures by default", () => {
    expect(shouldProposeDraft(report({ failures: [failure()] }))).toBe(false);
    expect(shouldProposeDraft(report({ failures: [failure(), failure()] }))).toBe(true);
  });

  it("respects a custom minFailures threshold", () => {
    const r = report({ failures: [failure(), failure()] });
    expect(shouldProposeDraft(r, 3)).toBe(false);
    expect(shouldProposeDraft(r, 2)).toBe(true);
  });

  it("a single failure never qualifies, regardless of how severe", () => {
    expect(shouldProposeDraft(report({ failures: [failure({ score: 0 })] }))).toBe(false);
  });
});

describe("renderFailureEvidence", () => {
  it("renders one numbered block per failure with all fields", () => {
    const text = renderFailureEvidence([failure()]);
    expect(text).toContain('[1] Case "Handles an ambiguous request"');
    expect(text).toContain("Input: Do the thing");
    expect(text).toContain("Expected: Asks a clarifying question");
    expect(text).toContain("Actual output: Invented an assumption and proceeded");
    expect(text).toContain("Judge score: 40/100 - Model guessed instead of asking");
  });

  it("falls back to a rubric-judged note when there is no explicit expectation", () => {
    const text = renderFailureEvidence([failure({ expected: null })]);
    expect(text).toContain("Expected: (no explicit expectation, judged by rubric)");
  });

  it("includes the rubric line only when a rubric is present", () => {
    const withRubric = renderFailureEvidence([failure({ rubric: "Must ask before acting" })]);
    expect(withRubric).toContain("Rubric: Must ask before acting");
    const withoutRubric = renderFailureEvidence([failure({ rubric: null })]);
    expect(withoutRubric).not.toContain("Rubric:");
  });

  it("truncates a long actual output per case so one verbose run cannot crowd out the others", () => {
    const long = "x".repeat(1000);
    const text = renderFailureEvidence([failure({ actual: long })]);
    const actualLine = text.split("\n").find((l) => l.startsWith("Actual output:"));
    expect(actualLine!.length).toBeLessThan(600);
  });

  it("caps the number of cases rendered (maxCases)", () => {
    const many = Array.from({ length: 15 }, (_, i) => failure({ caseId: `case-${i}` }));
    const text = renderFailureEvidence(many, 3);
    expect(text.match(/^\[\d+\]/gm)?.length).toBe(3);
  });
});

describe("parseDraftedPromptDiff", () => {
  it("parses a well-formed drafted revision", () => {
    const diff = parseDraftedPromptDiff(
      JSON.stringify({
        revised_system_prompt: "Always ask before assuming.",
        rationale: "Fixes the ambiguity gap.",
      }),
    );
    expect(diff).toEqual({
      revisedSystemPrompt: "Always ask before assuming.",
      rationale: "Fixes the ambiguity gap.",
    });
  });

  it("returns null when revised_system_prompt is empty (no confident fix)", () => {
    expect(
      parseDraftedPromptDiff(
        JSON.stringify({ revised_system_prompt: "", rationale: "no pattern" }),
      ),
    ).toBeNull();
  });

  it("returns null when revised_system_prompt is missing entirely", () => {
    expect(parseDraftedPromptDiff(JSON.stringify({ rationale: "no pattern" }))).toBeNull();
  });

  it("returns null on malformed JSON rather than throwing", () => {
    expect(parseDraftedPromptDiff("not json {{{")).toBeNull();
  });

  it("defaults rationale to an empty string when absent", () => {
    const diff = parseDraftedPromptDiff(JSON.stringify({ revised_system_prompt: "Fix it." }));
    expect(diff?.rationale).toBe("");
  });

  it("trims whitespace from both fields", () => {
    const diff = parseDraftedPromptDiff(
      JSON.stringify({ revised_system_prompt: "  Fix it.  ", rationale: "  because  " }),
    );
    expect(diff).toEqual({ revisedSystemPrompt: "Fix it.", rationale: "because" });
  });
});

describe("buildProposalNote", () => {
  it("cites the failure count, the case rate, the suite name, and the threshold", () => {
    const note = buildProposalNote(report(), "Model was guessing instead of asking.");
    expect(note).toBe(
      'Auto-drafted by RF-07 from 2 graded failures (2 of 10 graded cases) in eval suite "Planner ambiguity handling" (pass threshold 80). Model was guessing instead of asking.',
    );
  });

  it("uses singular phrasing for exactly one failure", () => {
    const note = buildProposalNote(report({ failures: [failure()] }), "");
    expect(note).toContain("1 graded failure ");
    expect(note).not.toContain("1 graded failures");
  });

  it("omits the case-rate parenthetical when totalCases is 0 (unknown)", () => {
    const note = buildProposalNote(report({ totalCases: 0 }), "");
    expect(note).not.toContain("of 0 graded cases");
  });

  it("omits the trailing rationale sentence when rationale is empty", () => {
    const note = buildProposalNote(report(), "");
    expect(note.endsWith("(pass threshold 80).")).toBe(true);
  });

  it("caps the note length at 2000 characters", () => {
    const note = buildProposalNote(report(), "x".repeat(3000));
    expect(note.length).toBe(2000);
  });
});

describe("draftingMessages", () => {
  it("builds a system + user message pair with the current prompt and the evidence embedded", () => {
    const msgs = draftingMessages("You are a helpful agent.", "[1] Case ...");
    expect(msgs).toHaveLength(2);
    expect(msgs[0].role).toBe("system");
    expect(msgs[1].role).toBe("user");
    expect(msgs[1].content).toContain("You are a helpful agent.");
    expect(msgs[1].content).toContain("[1] Case ...");
  });

  it("the system prompt instructs returning an empty revision when no confident fix exists", () => {
    const msgs = draftingMessages("x", "y");
    expect(msgs[0].content).toContain('{"revised_system_prompt":"","rationale"');
  });

  it("wraps the evidence in <untrusted_eval_evidence> tags, matching the chokepoint's own untrusted-content convention (adversarial-review finding: eval-case content is user-authored and must never be treated as instructions)", () => {
    const msgs = draftingMessages("x", "some evidence");
    expect(msgs[1].content).toContain(
      "<untrusted_eval_evidence>\nsome evidence\n</untrusted_eval_evidence>",
    );
  });

  it("the system prompt explicitly warns that the evidence is data, not instructions, regardless of what it claims", () => {
    const msgs = draftingMessages("x", "y");
    expect(msgs[0].content).toContain("<untrusted_eval_evidence>");
    expect(msgs[0].content.toLowerCase()).toContain("never an instruction");
  });
});
