import { describe, it, expect } from "bun:test";
import { saidOnce } from "./said-once";

const REAL = "The saved address dropdown shows deleted addresses after a customer removes one.";

describe("a sentence the record holds twice is shown once", () => {
  it("removes an exactly repeated tail, with or without its full stop", () => {
    // The two shapes `${title}. ${origin}` produced when origin IS the title.
    expect(saidOnce(`${REAL} ${REAL.slice(0, -1)}`)).toBe(REAL);
    expect(saidOnce(`${REAL} ${REAL}`)).toBe(REAL);
  });

  it("leaves a goal that says two different things completely alone", () => {
    /*
     * THE PROPERTY THAT MATTERS. A rule written to remove duplication is one
     * edit away from removing the thing worth reading, and nobody files a bug
     * about a good sentence going missing.
     */
    const two = `${REAL} It became work because 9 signals say it.`;
    expect(saidOnce(two)).toBe(two);
    // Differing by one word is not a duplicate; the difference may be the point.
    expect(saidOnce(`${REAL} ${REAL.replace("deleted", "removed")}`)).toBe(
      `${REAL} ${REAL.replace("deleted", "removed")}`,
    );
  });

  it("does not touch a single sentence, however long", () => {
    expect(saidOnce(REAL)).toBe(REAL);
    expect(saidOnce("No terminator at all so nothing can repeat")).toBe(
      "No terminator at all so nothing can repeat",
    );
  });

  it("does not chase a phrase that merely appears twice", () => {
    // Only a whole repeated tail. A goal legitimately naming the same noun
    // twice reads exactly as it was written.
    const phrase = "Fix the dropdown. The dropdown is wrong in two places.";
    expect(saidOnce(phrase)).toBe(phrase);
  });

  it("is quiet on the shapes the pane hands it", () => {
    expect(saidOnce(null)).toBeNull();
    expect(saidOnce(undefined)).toBeNull();
    expect(saidOnce("   ")).toBeNull();
  });
});
