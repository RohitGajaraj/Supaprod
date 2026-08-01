/**
 * The rotation must be deterministic, bounded and desynchronised.
 *
 * Two indicators chanting the same word in unison read as one animation rather
 * than as two agents working, which quietly undoes the only thing this
 * component exists to communicate.
 */
import { describe, expect, it } from "bun:test";
import { WORKING_WORDS, WORD_HOLD_MS, seedFrom, wordAt } from "./agent-pulse-words";

describe("the working words", () => {
  it("always returns a real word, whatever the tick", () => {
    for (const t of [0, 1, 7, 999, -3, -100000]) {
      expect(WORKING_WORDS).toContain(wordAt(t));
    }
  });

  it("changes on every tick", () => {
    // A rotation that repeats consecutively would look frozen for 5.2 seconds.
    for (let t = 0; t < WORKING_WORDS.length; t++) {
      expect(wordAt(t)).not.toBe(wordAt(t + 1));
    }
  });

  it("gives different agents different starting words", () => {
    const a = seedFrom("prd-writer");
    const b = seedFrom("ux-architect");
    expect(a).not.toBe(b);
    expect(wordAt(0, a)).not.toBe(wordAt(0, b));
  });

  it("is stable for the same agent", () => {
    expect(seedFrom("builder")).toBe(seedFrom("builder"));
  });

  it("treats no seed as a seed of zero rather than as NaN", () => {
    expect(seedFrom(undefined)).toBe(0);
    expect(WORKING_WORDS).toContain(wordAt(3, seedFrom(undefined)));
  });

  it("holds a word long enough to read and not so long it looks frozen", () => {
    expect(WORD_HOLD_MS).toBeGreaterThanOrEqual(2000);
    expect(WORD_HOLD_MS).toBeLessThanOrEqual(4000);
  });

  it("says only things a station actually does", () => {
    // The register is allowed to be unexpected; it is not allowed to be a lie.
    // Every word has to describe real work, so nothing here claims a capability
    // the product does not have.
    expect(WORKING_WORDS.length).toBeGreaterThanOrEqual(12);
    for (const w of WORKING_WORDS) {
      expect(w.trim()).toBe(w);
      expect(w.length).toBeLessThanOrEqual(16);
      expect(w).not.toContain("...");
    }
  });
});
