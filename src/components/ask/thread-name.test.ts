import { describe, it, expect } from "bun:test";
import { threadName } from "./thread-name";

const ASKED =
  "Design a user flow where previously entered address information is auto-populated or confirmed with a single click, removing the need for manual re-entry.";

describe("what to call a thread nobody renamed", () => {
  it("names it by what was actually asked", () => {
    // The real row: 24 of 84 conversations carry the default title while
    // holding a message exactly like this one.
    const name = threadName("New conversation", ASKED)!;
    expect(name.startsWith("Design a user flow where previously entered")).toBe(true);
    expect(name.endsWith("…")).toBe(true);
    expect(name.length).toBeLessThanOrEqual(61);
  });

  it("never overrules a name a person chose", () => {
    /*
     * Renaming a thread is a person saying what it is about, and nothing
     * derived may overrule that -- however much better the first message reads.
     */
    expect(threadName("Checkout rework", ASKED)).toBe("Checkout rework");
    expect(threadName("  Checkout rework  ", ASKED)).toBe("Checkout rework");
  });

  it("cuts on a word, not through one", () => {
    /*
     * The property is about the ORIGINAL, not the result: whatever we kept must
     * end where the source had a space, so the last word is whole. My first
     * version asserted the result did not end in a non-space before the
     * ellipsis, which is true of every word cut and therefore tested nothing.
     */
    const name = threadName("New conversation", ASKED)!;
    const kept = name.replace(/…$/, "");
    expect(ASKED.startsWith(kept)).toBe(true);
    expect(ASKED[kept.length]).toBe(" ");
  });

  it("takes a short message whole, with no ellipsis", () => {
    expect(threadName("New conversation", "Fix the checkout bug")).toBe("Fix the checkout bug");
    expect(threadName("", "Fix the checkout bug")).toBe("Fix the checkout bug");
  });

  it("hard-cuts a single very long token rather than throwing it away", () => {
    const blob = "x".repeat(200);
    const name = threadName("New conversation", blob)!;
    expect(name.length).toBe(61);
  });

  it("says nothing when the thread really is new", () => {
    // No chosen name and no message: it IS new, and the caller's own empty
    // wording beats anything derived from nothing.
    expect(threadName("New conversation", "")).toBeNull();
    expect(threadName("New conversation", null)).toBeNull();
    expect(threadName(null, undefined)).toBeNull();
  });
});
