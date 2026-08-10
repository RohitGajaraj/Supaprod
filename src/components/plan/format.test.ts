import { describe, expect, test } from "bun:test";
import {
  splitCitationMarkers,
  decisionOptionLabel,
  specStateWords,
  stripAutoPrefix,
  isAutoTitle,
  readingLoad,
  openingLine,
  firstProseOffset,
  READ_BUDGET_MINUTES,
  READ_WORDS_PER_MINUTE,
} from "./format";

// The suites for `stateChip`, `citesLabel`, `specRecommendation` and
// `measureCaps` went with the functions on 2026-08-10. All four had zero
// consumers in `src/` and all four returned the retired vocabulary (ALL-CAPS
// mono labels, the moss/marigold/glacier tone names), which no `--sp-*`
// primitive can render. Their tests were the only thing keeping them alive.

describe("specStateWords", () => {
  test("every value the check constraint allows reads as plain words", () => {
    expect(specStateWords("draft")).toBe("Drafting");
    expect(specStateWords("review")).toBe("In review");
    expect(specStateWords("approved")).toBe("Approved");
    expect(specStateWords("shipped")).toBe("Shipped");
  });
  test("never echoes a raw enum it does not recognise", () => {
    // The defect this closes is the editor's subtitle printing `{prd.status}`
    // straight from the column, so falling back to the value would reopen it.
    expect(specStateWords("")).toBe("Drafting");
    expect(specStateWords("weird")).toBe("Drafting");
  });
});

describe("decisionOptionLabel", () => {
  test("strips the [auto] prefix at render", () => {
    expect(decisionOptionLabel("[auto] Investigate checkout drop-off")).toBe(
      "Investigate checkout drop-off",
    );
  });
  test("prefix strip is case-insensitive", () => {
    expect(decisionOptionLabel("[AUTO] Ship the fix")).toBe("Ship the fix");
  });
  test("short titles pass through untouched", () => {
    expect(decisionOptionLabel("Keep the pricing page")).toBe("Keep the pricing page");
  });
  test("long titles cut on a word boundary, never mid-word", () => {
    const long = `The slow checkout flow is costing us thousands every single week ${"and the team knows it well".repeat(3)}`;
    const out = decisionOptionLabel(long, 40);
    expect(out.endsWith("…")).toBe(true);
    const body = out.slice(0, -1);
    // the cut lands after a full word from the source string
    expect(long.startsWith(body)).toBe(true);
    expect(long.charAt(body.length)).toBe(" ");
  });
  test("a single unbroken token falls back to a hard cut", () => {
    const out = decisionOptionLabel("x".repeat(200), 40);
    expect(out.length).toBeLessThanOrEqual(41);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("splitCitationMarkers", () => {
  test("no markers returns the whole string as one text segment", () => {
    expect(splitCitationMarkers("plain text")).toEqual([{ type: "text", value: "plain text" }]);
  });
  test("single marker mid-string", () => {
    expect(splitCitationMarkers("evidence[1] supports this")).toEqual([
      { type: "text", value: "evidence" },
      { type: "citation", index: 1 },
      { type: "text", value: " supports this" },
    ]);
  });
  test("marker at the very start and end", () => {
    expect(splitCitationMarkers("[2]start end[3]")).toEqual([
      { type: "citation", index: 2 },
      { type: "text", value: "start end" },
      { type: "citation", index: 3 },
    ]);
  });
  test("multiple adjacent markers", () => {
    expect(splitCitationMarkers("claim[1][2]")).toEqual([
      { type: "text", value: "claim" },
      { type: "citation", index: 1 },
      { type: "citation", index: 2 },
    ]);
  });
  test("empty string", () => {
    expect(splitCitationMarkers("")).toEqual([]);
  });
});

/**
 * The budget is the research's one hard implication for a long document: it has
 * to be readable straight through in ten minutes with no narrator. These pin
 * the arithmetic and, more importantly, the SHAPE of the answer, because the
 * surface prints "over by N words" and an off-by-one there is a sentence that
 * tells a writer to cut the wrong amount.
 */
describe("readingLoad", () => {
  const words = (n: number) => "word ".repeat(n).trim();

  test("an empty document claims no minutes at all", () => {
    expect(readingLoad("")).toEqual({ words: 0, minutes: 0, over: false, overBy: 0 });
    expect(readingLoad("   \n\n  ").words).toBe(0);
  });

  test("a document with any words in it never rounds down to zero minutes", () => {
    const load = readingLoad("just a handful of words here");
    expect(load.words).toBe(6);
    expect(load.minutes).toBe(1);
    expect(load.over).toBe(false);
  });

  test("exactly at the budget is inside it, one word past is over", () => {
    const budget = READ_BUDGET_MINUTES * READ_WORDS_PER_MINUTE;
    expect(readingLoad(words(budget)).over).toBe(false);
    const past = readingLoad(words(budget + 1));
    expect(past.over).toBe(true);
    expect(past.overBy).toBe(1);
  });

  test("markdown structure is not counted, because nobody reads it", () => {
    // A heading's hashes and a bullet's dash would otherwise make a structured
    // spec look longer than the prose one saying the same amount.
    const structured = readingLoad("## Goals\n\n- one thing\n- another thing\n");
    const plain = readingLoad("Goals one thing another thing");
    expect(structured.words).toBe(plain.words);
  });

  test("a fenced code block is not prose and does not count", () => {
    const load = readingLoad("Intro line.\n\n```\n" + words(500) + "\n```\n");
    expect(load.words).toBe(2);
  });
});

describe("openingLine", () => {
  test("returns the first sentence, which is the highest-leverage text there is", () => {
    expect(openingLine("Checkout loses a fifth of its users at the bank link. More follows.")).toBe(
      "Checkout loses a fifth of its users at the bank link.",
    );
  });
  test("skips a leading heading, because a title is not an argument", () => {
    expect(openingLine("# Bank link drop-off\n\nWe lose a fifth of users here.")).toBe(
      "We lose a fifth of users here.",
    );
  });
  test("skips bullets, quotes and rules to find where the prose starts", () => {
    expect(openingLine("---\n\n> quoted\n\n- a bullet\n\nThe argument starts here.")).toBe(
      "The argument starts here.",
    );
  });
  test("a line with no terminator is returned whole", () => {
    expect(openingLine("An opening with no full stop")).toBe("An opening with no full stop");
  });
  test("an unwritten document has no opening line rather than an invented one", () => {
    expect(openingLine("")).toBeNull();
    expect(openingLine("# Just a title\n")).toBeNull();
  });
});

/**
 * The renderer marks the lede by SOURCE POSITION rather than by "the first
 * paragraph I happened to draw", because React can render a subtree twice for
 * one commit and a flag set on the first pass leaves the second with no lede.
 * These pin the offset against the two things it must agree with: the string
 * `openingLine` returns, and the line that string came from.
 */
describe("firstProseOffset", () => {
  const at = (body: string) => {
    const off = firstProseOffset(body);
    return off === null ? null : body.slice(off);
  };

  test("points at the character the opening line starts on", () => {
    const body = "# Bank link drop-off\n\nWe lose a fifth of users here. And then more.";
    expect(at(body)).toBe("We lose a fifth of users here. And then more.");
  });

  test("skips the same structure openingLine skips", () => {
    const body = "---\n\n> quoted\n\n- a bullet\n\nThe argument starts here.";
    expect(at(body)?.startsWith(openingLine(body)!)).toBe(true);
  });

  test("survives leading whitespace on the line", () => {
    const body = "\n\n   Indented prose starts here.";
    expect(at(body)).toBe("Indented prose starts here.");
  });

  test("has no offset when there is no prose", () => {
    expect(firstProseOffset("")).toBeNull();
    expect(firstProseOffset("# Just a title\n")).toBeNull();
  });
});

// The `[auto]` marker is a dedup key for the sensing tick, never copy. It has
// leaked to the founder twice, most recently through Today's evidence bullet
// (`From [auto] Investigate the "Alert Fatigue..." cluster`), because
// `decisions.source_label` is derived from a raw mission title. These pin the
// helper that fix relies on, using the real titles that leaked.
describe("stripAutoPrefix", () => {
  test("strips the marker from a real leaked title", () => {
    expect(
      stripAutoPrefix(
        '[auto] Investigate the "Alert Fatigue Leading to Feature Disengagement" cluster',
      ),
    ).toBe('Investigate the "Alert Fatigue Leading to Feature Disengagement" cluster');
  });

  test("leaves a human-authored title untouched", () => {
    expect(stripAutoPrefix("Build next: fix checkout before anything else on Relay")).toBe(
      "Build next: fix checkout before anything else on Relay",
    );
  });

  test("is idempotent, so stripping twice cannot eat real text", () => {
    const once = stripAutoPrefix("[auto] Watch: review recent signals");
    expect(stripAutoPrefix(once)).toBe(once);
    expect(once).toBe("Watch: review recent signals");
  });

  test("only strips a LEADING marker, never one inside the sentence", () => {
    expect(stripAutoPrefix("Review the [auto] tagging rule")).toBe(
      "Review the [auto] tagging rule",
    );
  });

  test("isAutoTitle still recognises the origin after the text is cleaned", () => {
    const raw = '[auto] Investigate the "Redundant Data Entry" cluster';
    expect(isAutoTitle(raw)).toBe(true);
    // The provenance chip reads the RAW title; the visible text reads the clean one.
    expect(isAutoTitle(stripAutoPrefix(raw))).toBe(false);
  });
});
