/**
 * A1 read these two on the served approvals page, 2026-09-03:
 *   "...checkout completion rate from 67 ?"
 *   "Ships a merged changeset to production, where customers see it.?"
 * Both from `${item.title}?`. These guards hold the shape and the enforcement.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { askQuestion, wellFormedQuestion } from "@/components/meridian/question";
import { questionForGate } from "../a-question-is-composed-not-punctuated";

describe("a question is composed, not punctuated", () => {
  it("closes A1's two, exactly as they arrived", () => {
    const spec = questionForGate(
      "design_gate",
      "Raise checkout completion rate from 67 ",
    );
    expect(spec).toBe("Approve the design for Raise checkout completion rate from 67?");
    expect(wellFormedQuestion(spec)).toBe(true);

    // The tool gate's title is the CONSEQUENCE, so it never enters the ask.
    const tool = questionForGate(
      "tool_call",
      "Ships a merged changeset to production, where customers see it.",
    );
    expect(tool).toBe("Let this run?");
    expect(tool).not.toContain("changeset");
    expect(wellFormedQuestion(tool)).toBe(true);
  });

  it("places exactly one mark whatever the subject arrived with", () => {
    for (const tail of ["", ".", "!", "?", "…", "  ", " . ", "??"]) {
      const q = askQuestion("Approve the design for", `The address step${tail}`);
      expect(q).toBe("Approve the design for The address step?");
      expect(wellFormedQuestion(q)).toBe(true);
    }
  });

  it("gives every gate family a well-formed question, in both registers", () => {
    const KINDS = [
      "tool_call", "decision", "memory_candidate", "house_rule",
      "trust_graduation", "spec", "opportunity", "assumption_challenge",
      "design_gate", "playbook_proposal",
    ] as const;
    for (const k of KINDS) {
      for (const asPolicy of [false, true]) {
        for (const title of ["A real title.", "", "   ", "Ends in a mark?"]) {
          const q = questionForGate(k, title, asPolicy);
          expect(wellFormedQuestion(q)).toBe(true);
        }
      }
    }
  });

  it("never renders a lone mark when it was given nothing", () => {
    const q = askQuestion("", "");
    expect(q).not.toBe("?");
    expect(wellFormedQuestion(q)).toBe(true);
  });

  it("REFUSES the glued form at the type level, not in a comment", () => {
    // The enforcement is `Ask`'s prop type: only `askQuestion` returns an
    // AskQuestion, so `${title}?` cannot be passed. Verified by the compiler on
    // every build; asserted here so deleting the brand fails a test too.
    const meridian = readFileSync("src/components/meridian/question.ts", "utf8");
    expect(meridian).toContain("declare const ASK_QUESTION: unique symbol");
    expect(meridian).toContain("export type AskQuestion = string &");

    const ask = readFileSync("src/components/meridian/Ask.tsx", "utf8");
    expect(ask).toContain("question: AskQuestion;");
    expect(ask).not.toContain("question: string;");

    // And the call site no longer sniffs whether the data happened to be a
    // question, which is what the old `endsWith("?")` branch was doing.
    const card = readFileSync("src/components/ask/AskGateCard.tsx", "utf8");
    expect(card).toContain("questionForGate(item.kindKey, item.title, asPolicy)");
    expect(card).not.toContain('item.title.endsWith("?")');
  });
});
