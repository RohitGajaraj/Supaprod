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

/*
 * ── A ROAD THAT OPENS A PAGE SAYS ITS OWN NAME ────────────────────────────
 *
 * `ROAD_NAME` was `aria-label` only, and that was RIGHT while the road sat
 * fourth: the caption underneath says something about the WORK, and a heading
 * saying "Where your work stands" over it is the furniture `JourneyMap`'s own
 * header records removing.
 *
 * Moving the road to first changed what the removal was true of. A page cannot
 * open on the bare word "Discover". That is law 20 with the arrow reversed --
 * usually a change arrives at a destination it did not look at; here the
 * destination moved under a decision that was correct where it stood.
 *
 * It also makes the MODE visible, which is worth having on its own: the three
 * names are three different subjects -- work that has started, the road every
 * run travels, the road THIS sentence will take -- and a drawing that changes
 * subject silently is the ambiguity the route preview was nearly not built
 * over.
 */
describe("the road names itself where it leads, and nowhere else", () => {
  const MAP = readFileSync(join(import.meta.dir, "JourneyMap.tsx"), "utf8");

  it("draws the name only when it is the page's first region", () => {
    expect(MAP).toContain("{leads ? <Eyebrow>{ROAD_NAME[mode]}</Eyebrow> : null}");
  });

  it("defaults to silent, so a road inside another frame stays unframed", () => {
    // A heading appearing inside somebody else's panel is the furniture all
    // over again, and every other caller draws in one.
    expect(MAP).toContain("leads = false");
  });

  it("is switched on where the entry draws it", () => {
    const call = ROUTE.slice(ROUTE.indexOf("<JourneyMap"), ROUTE.indexOf("<JourneyMap") + 400);
    expect(call).toContain("leads");
  });

  it("names the mode rather than a fixed word", () => {
    /*
     * THE MIRROR. A hard-coded "Where your work stands" would pass the first
     * assertion and would be wrong in two of three modes -- and the one it is
     * wrong in is the composer preview, where the drawing has changed subject
     * and the name is the only thing that says so.
     */
    expect(MAP).toContain("ROAD_NAME[mode]");
    const names = MAP.match(/const ROAD_NAME[\s\S]{0,220}?\};/)?.[0] ?? "";
    for (const mode of ["promise", "map", "route"]) {
      expect({ mode, named: names.includes(`${mode}:`) }).toEqual({ mode, named: true });
    }
  });
});

/*
 * ── THE THREE LAYERS, IN THE ORDER THE REPO SAYS TO REVEAL THEM ───────────
 *
 * The product is three layers -- **01 the DIRECTOR** (tells you what to
 * build), **02 the operating system** (runs the lifecycle), **03 the brain**
 * (remembers, and guides) -- and `docs/pitch/repositioning-2026-07-22.md`
 * states the discipline: *"three layers revealed in strict order: door → body
 * → brain."*
 *
 * The founder's complaint about this product is that *"layers 1, 2 and 3 do
 * not stitch together."* Measured on this page today: 02 led, 03 was fifth,
 * and **01 -- the wedge, the thing the product claims to be FOR -- was
 * tenth**, five regions below the box a person would type its suggestion into.
 *
 * The ranked bets ARE the director: this workspace's own opportunities,
 * ordered, each one a sentence a person can start. The composer is where you
 * say the thing; this is the product saying what it would say. Two halves of
 * one act, half a screen apart.
 */
describe("the three layers stitch together", () => {
  it("puts the director's offer with the door a person types into", () => {
    expect(at("<ExampleJobs")).toBeGreaterThan(at("<Composer"));
    /* Before anything that is about work already started. Those are the body,
       and the director is the door. */
    expect(at("<ExampleJobs")).toBeLessThan(at("<YourRuns"));
    expect(at("<ExampleJobs")).toBeLessThan(at("<HomeAnswers"));
  });

  it("keeps the brain after the body, which is the stated order", () => {
    // door -> body -> brain. The bet is what the machine believes and whether
    // it held; it reads as evidence only once you have seen the work it is
    // about.
    expect(at("<WhetherItWorked")).toBeGreaterThan(at("<JourneyMap"));
    expect(at("<BetStillOpen")).toBeGreaterThan(at("<Composer"));
  });

  it("still draws the director only where there is something to direct", () => {
    /*
     * MEASURED ACROSS THE PRODUCT: Helio Labs 92 opportunities, My Workspace
     * 19, My workspace 6 -- and A1 delete probe ZERO, where this correctly
     * shows nothing. The director cannot direct with no evidence, and a
     * surface that invented three example sentences for that case was removed
     * once already.
     */
    const guard = ROUTE.slice(at("<ExampleJobs") - 300, at("<ExampleJobs"));
    expect(guard).toContain("bets.data.length > 0");
  });
});

/*
 * ── THE PAGE OPENS WITH A STATEMENT, AND THE HERO OWNS THE INSTRUCTION ────
 *
 * The first draft of this sentence opened *"Say what should change..."*, and
 * the hero's own first-run line is *"Say it in one sentence. You will watch it
 * happen on the run's own page..."*. On a first visit -- the state this
 * sentence exists for -- the page would have carried three sentences about
 * saying a sentence, stacked with the road between them.
 *
 * That is the founder's *"dump of data and content"*, introduced by the change
 * that was meant to answer it.
 */
describe("the message states, the hero instructs", () => {
  const HERO = readFileSync(join(import.meta.dir, "Hero.tsx"), "utf8");

  it("does not open the page with an imperative", () => {
    const said = whatThisDoesForYou({ hasClosedLoop: false })!;
    expect({
      said,
      opensWithAnOrder: /^(Say|Tell|Start|Type|Ask|Write|Press)\b/.test(said),
    }).toEqual({ said, opensWithAnOrder: false });
  });

  it("does not repeat the verb the hero's first-run line is built on", () => {
    /*
     * The hero says "Say it in one sentence" on the exact state this draws in.
     * Two sentences agreeing 250px apart are worse than two contradicting: a
     * reader cannot tell which is the surface's own claim.
     */
    const said = whatThisDoesForYou({ hasClosedLoop: false })!;
    expect(HERO).toContain("Say it in one sentence");
    expect({ overlaps: said.includes("Say it") || said.startsWith("Say") }).toEqual({
      overlaps: false,
    });
  });
});
