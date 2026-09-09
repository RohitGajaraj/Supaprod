/**
 * ── "SHOWS NO JOURNEY" WAS ABOUT WHERE THE ROAD WAS, NOT HOW IT LOOKED ────
 *
 * The founder on this page: *"a user lands on home and it is not appealing,
 * carries no message, shows no journey."*
 *
 * MEASURED ON THE SERVED HOME, 2026-09-10. The road -- the seven stations,
 * this product's whole model, the one drawing that answers *where is my work*
 * -- rendered **eighth**, at 113px, below the hero, the composer, the three
 * answers, the evidence, the arriving line and the crew. A person had to
 * scroll past six regions of their own backlog to reach the picture that
 * explains what any of it is.
 *
 * The drawing was never the problem. Its position was.
 *
 * ── AND "CARRIES NO MESSAGE" WAS LITERALLY TRUE ───────────────────────────
 * Every region answered a question about the person's own work and none said
 * what the machine DOES. That is fine for an operator who has used it. It is
 * not fine for the founder, who is the one person who has to be able to feel
 * what he built, and it is not fine on day one.
 *
 * ── WHAT IS PINNED, AND IT IS THE ORDER RATHER THAN THE WORDS ─────────────
 * Message · journey · ask · act · evidence · detail. Every one of those is
 * free to be re-worded; what must not come back is the journey below the
 * backlog.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { whatThisDoesForYou } from "./what-this-does-for-you";

const ROUTE = readFileSync(
  join(import.meta.dir, "..", "..", "routes", "_authenticated.start.tsx"),
  "utf8",
);
const at = (marker: string) => {
  const i = ROUTE.indexOf(marker);
  expect(i, `${marker} is not on the entry; re-point this test`).toBeGreaterThan(-1);
  return i;
};

describe("the entry leads with the journey", () => {
  it("draws the road before the backlog, the composer and the evidence", () => {
    const road = at("<JourneyMap");
    for (const later of ["<Hero", "<Composer", "<WhetherItWorked", "<YourRuns"]) {
      expect({ later, afterTheRoad: at(later) > road }).toEqual({ later, afterTheRoad: true });
    }
  });

  it("says what the product does before it draws it", () => {
    // The sentence names a mechanism and every clause of it points at the
    // road directly underneath. Above it, or it is a caption for nothing.
    expect(at("{theMessage ?") < at("<JourneyMap")).toBe(true);
  });

  it("keeps the ask under the picture it is about", () => {
    /*
     * "Design has stopped, and will not move without you" is the road's own
     * caption; "4 design gates are waiting for you" is the hero's sentence.
     * The second reads as the consequence of the first only in that order.
     */
    expect(at("<Hero") < at("<Composer")).toBe(true);
  });

  it("keeps the list last, because it is the detail the rest summarises", () => {
    expect(at("<YourRuns")).toBeGreaterThan(at("<WhetherItWorked"));
  });
});

describe("the sentence the entry says about itself", () => {
  it("names a mechanism rather than a category", () => {
    const said = whatThisDoesForYou({ hasClosedLoop: false })!;
    expect(said).toContain("Seven stations");
    /* No category words and no volume claims: the outward-copy register, which
       binds harder in-product than it does on a landing page. */
    for (const sold of ["platform", "powerful", "seamless", "AI-powered", "workflow"]) {
      expect({ sold, used: said.includes(sold) }).toEqual({ sold, used: false });
    }
  });

  it("stands down for good once a loop has closed", () => {
    /*
     * A line that explains the product to somebody who has watched it work is
     * furniture, and by the third visit it is worse -- it is the product still
     * introducing itself to a person who has shipped with it. `WhetherItWorked`
     * says the same thing better, with that workspace's own evidence in it.
     */
    expect(whatThisDoesForYou({ hasClosedLoop: true })).toBeNull();
  });

  it("says nothing while the read that would know is still out", () => {
    /*
     * THE MIRROR, AND THE FLASH THIS PAGE HAS BEEN REPAIRED FOR TWICE. An
     * unanswered read is not "no closed loop". Introducing the product to
     * somebody who HAS shipped, for the second it takes a query to land, is
     * the worst frame the page can show them. Silence costs nothing.
     */
    expect(whatThisDoesForYou({ hasClosedLoop: false, unknown: true })).toBeNull();
    expect(whatThisDoesForYou({ hasClosedLoop: true, unknown: true })).toBeNull();
  });

  it("is keyed on the same fact its sibling region is, so both never draw", () => {
    const call = ROUTE.match(/const theMessage = whatThisDoesForYou\(\{[\s\S]*?\}\);/);
    expect(call, "the message call moved; re-point this test").not.toBeNull();
    expect(call![0]).toContain("homeReads.data.closed");
  });
});
