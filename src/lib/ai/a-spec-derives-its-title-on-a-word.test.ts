/**
 * A1 read this on the served Ask panel, 23:31 IST 2026-09-03: the same design
 * gate twice, titled "...tablet checkout completion rate from 67 " -- exactly
 * 120 characters, ending in a trailing space, mid-number. Two defects, one row.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import {
  titleFromSentence,
  derivedSpecTitle,
  TITLE_MAX,
} from "./a-spec-derives-its-title-on-a-word";

const code = (src: string): string =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const SENTENCE =
  "Remove the redundant address re-confirmation step in Relay checkout to increase " +
  "tablet checkout completion rate from 67 percent to 74 percent on tablets";

describe("a derived spec title ends on a word", () => {
  it("keeps A1's sentence whole, because 280 is what the column allows", () => {
    // The old 120 came from `attachments`, a different column with a different
    // budget. This sentence is 151 characters: nothing needed cutting at all.
    expect(SENTENCE.length).toBeGreaterThan(120);
    expect(SENTENCE.length).toBeLessThan(TITLE_MAX);
    expect(titleFromSentence(SENTENCE)).toBe(SENTENCE);
    expect(titleFromSentence(SENTENCE)).not.toEndWith(" ");
  });

  it("never ends mid-word, and never on a trailing space", () => {
    const long = "word ".repeat(200).trim();
    for (const max of [20, 50, 120, TITLE_MAX]) {
      const t = titleFromSentence(long, max);
      expect(t.length).toBeLessThanOrEqual(max);
      expect(t).not.toContain("  ");
      expect(t.replace(/…$/, "")).not.toEndWith(" ");
      // Every character before the marker belongs to a whole word.
      expect(
        t
          .replace(/…$/, "")
          .split(" ")
          .every((w) => w === "word"),
      ).toBe(true);
    }
  });

  it("marks the cut, because a fragment that looks whole is a lie", () => {
    const long = "a".repeat(50) + " " + "b".repeat(50);
    const t = titleFromSentence(long, 60);
    expect(t).toEndWith("…");
    // The marker is INSIDE the budget, not appended past it.
    expect(t.length).toBeLessThanOrEqual(60);
  });

  it("does not mark a title it did not cut", () => {
    expect(titleFromSentence("Short and whole.")).toBe("Short and whole.");
    expect(titleFromSentence("Short and whole.")).not.toContain("…");
  });

  it("leaves no dangling punctuation before the marker", () => {
    const t = titleFromSentence("one two three, four five six seven eight", 20);
    expect(t).not.toContain(",…");
    expect(t).not.toMatch(/[\s,;:.!?-]…$/u);
  });

  it("cuts a single over-long word rather than returning nothing", () => {
    // No boundary to fall back to. The whole-word rule alone would return ""
    // and the caller would print "Untitled spec" for a sentence that exists.
    const t = titleFromSentence("x".repeat(400), 30);
    expect(t.length).toBe(30);
    expect(t).toEndWith("…");
  });

  it("derives from the brief's first sentence, and keeps 'Untitled spec' for nothing", () => {
    expect(derivedSpecTitle(`${SENTENCE}. And a second sentence.`)).toBe(SENTENCE);
    expect(derivedSpecTitle("   ")).toBe("Untitled spec");
    expect(derivedSpecTitle("")).toBe("Untitled spec");
  });

  it("is deterministic, with no model call", () => {
    const src = readFileSync("src/lib/ai/a-spec-derives-its-title-on-a-word.ts", "utf8");
    expect(code(src)).not.toContain("await");
    expect(code(src)).not.toContain("supabase");
  });
});

describe("the brief path is guarded against its twin", () => {
  const REG = code(readFileSync("src/lib/ai/tools/registry.server.ts", "utf8"));
  const GUARD = REG.slice(REG.indexOf("if (!opp && trackId) {"), REG.indexOf("let themeCtx"));

  it("guards the path that actually files specs", () => {
    // The opportunity guard keys on `opportunity_id`, and every spec Helio Labs
    // filed in the last seven days had that NULL, so it never fired once.
    expect(GUARD.length).toBeGreaterThan(0);
    expect(GUARD).toContain('.eq("artifact_kind", "prd")');
    expect(GUARD).toContain('.eq("station", "define")');
    expect(GUARD).toContain('.is("superseded_at", null)');
  });

  it("keys on the track, never on the brief text", () => {
    // Two runs a minute apart do not write identical briefs, so matching text
    // would miss exactly the case that produced the double card.
    expect(GUARD).toContain('.eq("track_id", trackId)');
    expect(GUARD).not.toContain("brief");
  });

  it("returns the existing spec rather than erroring, as the other path does", () => {
    expect(GUARD).toContain("existing: true as const");
    expect(GUARD).toContain("prd_id: existingByTrack.id");
  });

  it("fails OPEN on an unreadable check", () => {
    // A duplicate spec is recoverable; a Define station that refuses to work on
    // a failed read is not. Same rule the opportunity guard states.
    expect(GUARD).toContain("if (liveErr)");
    expect(GUARD).toContain("console.error");
    expect(GUARD).not.toContain("throw");
  });

  it("uses the shared title derivation, so 120 is gone from this path", () => {
    expect(REG).toContain("derivedSpecTitle(brief)");
    expect(REG).not.toContain('.trim().slice(0, 120) || "Untitled spec"');
  });
});
