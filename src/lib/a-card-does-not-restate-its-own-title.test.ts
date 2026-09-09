/**
 * ── A PROVENANCE LINE THAT NAMES THE TITLE AGAIN IS NOT PROVENANCE ────────
 *
 * READ ON THE SERVED INBOX, 2026-09-09, on the card the entry's own door sends
 * you to. It asked:
 *
 *   Make this call: Show homeowner installer arrival window on order page?
 *
 * and its body ended, after six lines of agent prose:
 *
 *   From Show homeowner installer arrival window on order page
 *
 * The same string, as a dangling clause, on the one card a person is being
 * asked to act on.
 *
 * ── IT WAS CAUSED BY A FIX MADE FOUR HOURS EARLIER, AND THAT IS THE LESSON ─
 * A mission-sourced decision used to be titled "Mission completed: <the
 * mission>" while `source_label` held "<the mission>". Two different strings,
 * so nothing collided and nobody could see the line was redundant. Taking the
 * provenance prefix out of the title at its writer made them identical.
 *
 * The prefix removal was right and stands. What was wrong was stopping at the
 * writer: a defect is a shape rather than a location, and anything downstream
 * that depended on those two values differing had to be swept for. This test
 * exists because that sweep did not happen until the card was read on a screen.
 */
import { describe, expect, it } from "bun:test";
import { provenanceLine } from "./approvals-queue.functions";

describe("the line is dropped when it would repeat the title", () => {
  it("says nothing when the source is named the same as the decision", () => {
    expect(
      provenanceLine(
        "Show homeowner installer arrival window on order page",
        "Show homeowner installer arrival window on order page",
      ),
    ).toBeNull();
  });

  it("ignores case and surrounding space, because a title is not a key", () => {
    // These are human-written strings from two different tables. Matching them
    // byte for byte would let a trailing space put the line back.
    expect(provenanceLine("Reuse saved delivery address", "  reuse saved delivery address ")).toBe(
      null,
    );
  });
});

describe("the line survives wherever it still tells a reader something", () => {
  /*
   * THE MIRROR, and it is the half that matters. Every assertion above is a
   * removal, and a function that returned null for everything would pass all
   * of them while deleting a real fact from every other card in the queue.
   */
  it("names a source that is genuinely different from the title", () => {
    expect(provenanceLine("Reuse saved delivery address at checkout", "Q3 planning meeting")).toBe(
      "From Q3 planning meeting",
    );
  });

  it("still names a source when the title is missing entirely", () => {
    // A decision with no readable title is a real row, and where it came from
    // is then the only thing the card can say about its origin.
    expect(provenanceLine(null, "Roadmap review")).toBe("From Roadmap review");
    expect(provenanceLine("", "Roadmap review")).toBe("From Roadmap review");
  });

  it("says nothing at all when there is no source, rather than an empty From", () => {
    expect(provenanceLine("Anything", null)).toBeNull();
    expect(provenanceLine("Anything", "   ")).toBeNull();
  });

  it("does not treat a title that merely CONTAINS the label as a repeat", () => {
    /*
     * The rule is equality, deliberately. "From checkout" under "Reuse saved
     * delivery address at checkout" is a different claim from the title and a
     * reader learns something from it; a containment test would eat it.
     * Lane 2 measured the same trap on the trace page today -- containment
     * puts a genuine pair and a genuine near-miss at the same number.
     */
    expect(provenanceLine("Reuse saved delivery address at checkout", "checkout")).toBe(
      "From checkout",
    );
  });
});
