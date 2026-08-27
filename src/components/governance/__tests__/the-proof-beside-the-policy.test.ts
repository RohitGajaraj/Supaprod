/**
 * THE BOUNDARY STATED WHAT AGENTS MAY DO AND NEVER THAT THEY HAD.
 *
 * "What can these agents do without asking me" is the founder's question for
 * this screen, and a list of permissions is only half an answer. `tool_calls`
 * carries the other half: 1,996 rows in the last 30 days across 61 distinct
 * tools, measured on the live database on 2026-08-27.
 *
 * These are the four things that sentence must not get wrong.
 */
import { describe, it, expect } from "bun:test";
import { whatTheyActuallyDid, WINDOW_DAYS, type DidAlone } from "../what-they-actually-did";

const label = (n: string) => ({ "studio.commit": "Commit code" })[n] ?? n;

describe("the proof beside the policy", () => {
  /**
   * A NULL COUNT IS A FAILED READ AND MUST DRAW NOTHING. Rendering it as zero
   * would say "your crew has done nothing without asking" on the strength of a
   * query that did not come back, which is the reassuring answer arrived at by
   * omission that R-22 forbids in those words.
   */
  it("a read that did not come back says nothing at all", () => {
    expect(whatTheyActuallyDid({ count: null, newest: null }, label).said).toBeNull();
    expect(whatTheyActuallyDid(null, label).said).toBeNull();
    expect(whatTheyActuallyDid(undefined, label).said).toBeNull();
  });

  /**
   * ZERO IS A DIFFERENT AND USEFUL ANSWER. A person who set eight tools to run
   * alone and finds none has run in a month has learned that the leverage they
   * think they have is not being used.
   */
  it("zero is reported, and is not the same as unknown", () => {
    const r = whatTheyActuallyDid({ count: 0, newest: null }, label);
    expect(r.said).toBe(`None of them has run in the last ${WINDOW_DAYS} days.`);
    expect(r.tool).toBeNull();
  });

  it("counts, names the most recent, and uses the screen's own label", () => {
    const did: DidAlone = {
      count: 412,
      newest: { tool: "studio.commit", at: "2026-08-27T09:00:00Z" },
    };
    const r = whatTheyActuallyDid(did, label);
    expect(r.said).toBe(
      `Your crew has done these 412 times without asking in the last ${WINDOW_DAYS} days.`,
    );
    // The registry name never reaches the surface; §12 keeps it in the code.
    expect(r.tool).toBe("Commit code");
    expect(r.said).not.toContain("studio.commit");
  });

  it("reads as English about one", () => {
    const r = whatTheyActuallyDid({ count: 1, newest: null }, label);
    expect(r.said).toContain("has done one of these without asking");
  });

  /**
   * THE CLAIM IT REFUSES TO MAKE. `tool_calls` does not record whether an
   * approval gated a call, so "these ran unapproved" would be invented out of
   * two facts that do not compose: a tool moved to `auto` last week makes its
   * older calls look unattended. The copy is about what the tools do TODAY.
   */
  it("never claims the calls were unapproved", () => {
    const r = whatTheyActuallyDid({ count: 9, newest: { tool: "x", at: "" } }, label);
    const words = `${r.said}`.toLowerCase();
    expect(words).not.toContain("unapproved");
    expect(words).not.toContain("without approval");
    expect(words).not.toContain("ungated");
  });
});
