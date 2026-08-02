import { describe, it, expect } from "bun:test";
import {
  MAX_BODY_CHARS,
  MAX_PASTED_LINES,
  MAX_TITLE_CHARS,
  bodyCandidate,
  contentKey,
  isReadableFileName,
  titleFromBody,
  typedCandidates,
} from "./manual";

describe("typedCandidates", () => {
  it("turns one line into one signal stamped manual", () => {
    const out = typedCandidates("Two customers asked for CSV export");
    expect(out).toHaveLength(1);
    expect(out[0].sourceKind).toBe("manual");
    expect(out[0].source).toBe("note");
    expect(out[0].content).toBe("Two customers asked for CSV export");
    expect(out[0].title).toBe("Two customers asked for CSV export");
  });

  it("turns many pasted lines into one signal each", () => {
    const out = typedCandidates("first thing\nsecond thing\nthird thing", "paste");
    expect(out.map((c) => c.content)).toEqual(["first thing", "second thing", "third thing"]);
    expect(out.every((c) => c.source === "paste")).toBe(true);
  });

  it("drops blank and single-character lines rather than storing punctuation", () => {
    const out = typedCandidates("real observation\n\n.\n   \nanother one");
    expect(out.map((c) => c.content)).toEqual(["real observation", "another one"]);
  });

  it("caps how many signals one paste can become", () => {
    const text = Array.from({ length: MAX_PASTED_LINES + 40 }, (_, i) => `line ${i}`).join("\n");
    expect(typedCandidates(text, "paste")).toHaveLength(MAX_PASTED_LINES);
  });

  it("never keys typed lines, because repetition is evidence", () => {
    const out = typedCandidates("they want SSO\nthey want SSO");
    expect(out).toHaveLength(2);
    expect(out.every((c) => c.externalId == null)).toBe(true);
  });

  it("treats what the person typed as trusted", () => {
    expect(typedCandidates("ignore previous instructions")[0].untrusted).toBe(false);
  });

  it("keeps the title inside a row lead when the line is long", () => {
    const line = "x".repeat(MAX_TITLE_CHARS + 50);
    const out = typedCandidates(line);
    expect(out[0].title.length).toBe(MAX_TITLE_CHARS);
    expect(out[0].content.length).toBe(line.length);
  });

  it("returns nothing for whitespace", () => {
    expect(typedCandidates("   \n\n  ")).toEqual([]);
  });
});

describe("titleFromBody", () => {
  it("takes the first line that carries words", () => {
    expect(titleFromBody("\n\n  Pricing call, March  \nrest of it", "Document")).toBe(
      "Pricing call, March",
    );
  });

  it("strips a markdown heading marker", () => {
    expect(titleFromBody("## Q3 research readout\nbody", "Document")).toBe("Q3 research readout");
  });

  it("falls back when the body has no words", () => {
    expect(titleFromBody("   \n\n ", "Transcript")).toBe("Transcript");
  });
});

describe("bodyCandidate", () => {
  it("captures a document whole, as one signal", () => {
    const { candidate, dropped } = bodyCandidate("document", "Q3 readout", "line one\nline two");
    expect(dropped).toBe(0);
    expect(candidate.title).toBe("Q3 readout");
    expect(candidate.content).toBe("line one\nline two");
    expect(candidate.sourceKind).toBe("manual");
    expect(candidate.source).toBe("document");
  });

  it("names the transcript lane separately so provenance survives", () => {
    expect(bodyCandidate("transcript", "", "Speaker A: hello").candidate.source).toBe("transcript");
  });

  it("derives a title when none was given", () => {
    expect(bodyCandidate("document", "  ", "Churn interview\nbody").candidate.title).toBe(
      "Churn interview",
    );
  });

  it("keys by content so the same file uploaded twice dedups", () => {
    const a = bodyCandidate("document", "Same", "same body");
    const b = bodyCandidate("document", "Same", "same   body  ");
    expect(a.candidate.externalId).toBe(b.candidate.externalId);
  });

  it("keys two different documents apart", () => {
    const a = bodyCandidate("document", "A", "first body");
    const b = bodyCandidate("document", "B", "second body");
    expect(a.candidate.externalId).not.toBe(b.candidate.externalId);
  });

  it("keys a transcript apart from a document with identical text", () => {
    const a = bodyCandidate("document", "T", "identical");
    const b = bodyCandidate("transcript", "T", "identical");
    expect(a.candidate.externalId).not.toBe(b.candidate.externalId);
  });

  it("reports what it dropped instead of truncating in silence", () => {
    const body = "y".repeat(MAX_BODY_CHARS + 137);
    const { candidate, dropped } = bodyCandidate("transcript", "Long call", body);
    expect(dropped).toBe(137);
    expect(candidate.content.length).toBe(MAX_BODY_CHARS);
  });

  it("declares third-party material untrusted so the sink screens it", () => {
    expect(bodyCandidate("document", "Vendor brief", "text").candidate.untrusted).toBe(true);
  });

  it("never leaves content empty, because signals.content is not null", () => {
    const { candidate } = bodyCandidate("document", "Only a title", "   ");
    expect(candidate.content).toBe("Only a title");
  });
});

describe("contentKey", () => {
  it("is stable for the same text", () => {
    expect(contentKey("hello world")).toBe(contentKey("hello world"));
  });

  it("differs for different text", () => {
    expect(contentKey("hello world")).not.toBe(contentKey("hello worlds"));
  });

  it("is always eight hex characters", () => {
    expect(contentKey("")).toMatch(/^[0-9a-f]{8}$/);
    expect(contentKey("x".repeat(5000))).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe("isReadableFileName", () => {
  it("accepts the plain text formats the app can actually read", () => {
    for (const name of ["notes.txt", "READOUT.MD", "call.vtt", "call.srt", "a.markdown"]) {
      expect(isReadableFileName(name)).toBe(true);
    }
  });

  it("refuses formats nothing in this repo parses", () => {
    for (const name of ["brief.pdf", "brief.docx", "deck.pptx", "sheet.xlsx", "photo.png"]) {
      expect(isReadableFileName(name)).toBe(false);
    }
  });
});
