/**
 * A word that follows a number has to be a noun.
 *
 * WHY THIS EXISTS. The §12 rename table offers two forms for the same idea -
 * "What we found" and "evidence" - and only one of them is a noun. The first is
 * a heading: it is correct over a panel and wrong the instant something counts
 * it. On 2026-08-27 the heading form was written into all three counted
 * vocabularies at once, and every call site that composes `${n} ${word}` began
 * rendering "1 what we found". `describeAttachments` said "It produced 1 what we
 * found, now part of this work." Nothing failed, because nothing was checking.
 *
 * The rule a reader can state: an interrogative opens a question, never a thing.
 * "1 what we found" and "this how it went" are the same mistake, and a map entry
 * beginning with one of those words is a heading that got into a noun slot.
 *
 * This is deliberately a check over the MAPS rather than over a rendered string.
 * The maps are where the mistake is made; a screen test would catch one surface
 * and leave the other eleven to be found by a reader.
 */

import { describe, expect, test } from "bun:test";
import { KIND_WORD } from "./attach";
import { wordFor } from "./chain";
import { artifactWord } from "@/lib/artifact-words";
import { tallyPhrase } from "@/components/design/vocabulary";
import { KIND_LABEL } from "@/components/supaprod/LineageDrawer";

/** The words English uses to open a question. None of them opens a noun. */
const INTERROGATIVES = ["what", "how", "why", "when", "where", "who", "which", "whose"];

function opensAQuestion(phrase: string): boolean {
  const first = phrase.trim().toLowerCase().split(/\s+/)[0];
  return INTERROGATIVES.includes(first ?? "");
}

describe("a counted word is a noun, not a heading", () => {
  test("no word in KIND_WORD opens a question, in either number", () => {
    for (const [kind, word] of Object.entries(KIND_WORD)) {
      expect(
        opensAQuestion(word.one),
        `KIND_WORD.${kind}.one is "${word.one}", which reads "1 ${word.one}"`,
      ).toBe(false);
      expect(
        opensAQuestion(word.many),
        `KIND_WORD.${kind}.many is "${word.many}", which reads "2 ${word.many}"`,
      ).toBe(false);
    }
  });

  test("no word artifactWord hands back opens a question", () => {
    for (const kind of Object.keys(KIND_WORD)) {
      const word = artifactWord(kind);
      expect(
        opensAQuestion(word),
        `artifactWord("${kind}") is "${word}", which reads "this ${word}"`,
      ).toBe(false);
    }
  });

  test("tallyPhrase counts a finding without turning it into a question", () => {
    expect(tallyPhrase([{ kind: "signal", count: 1 }])).toBe("1 finding");
    expect(tallyPhrase([{ kind: "signal", count: 3 }])).toBe("3 findings");
  });

  test("wordFor keeps the singular and the plural in the same family", () => {
    expect(wordFor("signal", 1)).toBe("finding");
    expect(wordFor("signal", 2)).toBe("findings");
  });

  test("KIND_LABEL cannot open a question either, because it is read after a word", () => {
    /*
     * ADDED 2026-08-28, AND IT WAS ALREADY FAILING WHEN IT WAS WRITTEN.
     *
     * This map was the fourth vocabulary and the only one nothing watched.
     * `LineageDrawer` reads it through `.toLowerCase()` into "How this {label}
     * connects across the product lifecycle", so `signal: "What we found"`
     * rendered "How this what we found connects". A demonstrative in front of a
     * heading is the same mistake as a number in front of one, and the guard
     * above could not see it because it only read the three counted maps.
     */
    for (const [kind, label] of Object.entries(KIND_LABEL)) {
      expect(
        opensAQuestion(label),
        `KIND_LABEL["${kind}"] is "${label}", which reads "How this ${label.toLowerCase()} connects"`,
      ).toBe(false);
    }
  });

  test('the heading "What we found" is still the heading, and is not a counted word', () => {
    // Guarding the pairing itself: the panel label and the counted noun are two
    // different jobs, and collapsing them back into one is the original defect.
    expect(KIND_WORD.signal?.one).not.toBe("what we found");
    expect(artifactWord("signal")).not.toBe("what we found");
  });
});
