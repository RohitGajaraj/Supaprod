/**
 * ── ONE FACT, ONCE, ON THE FIRST SCREEN OF A NEW WORKSPACE ────────────────
 *
 * READ ON THE SERVED /evidence, 2026-09-09, empty workspace. Before a reader
 * had scrolled:
 *
 *   Your sources have sent nothing yet.
 *   Nothing new since you last looked.
 *   Nothing is connected yet, so there is nothing to read.
 *
 * and further down, "Nothing is connected yet, and you do not have to wait for
 * that." Four statements of one fact on the arrival screen of a brand new
 * workspace, which is the exact surface the founder's complaint is about.
 *
 * The first of them was also WRONG. It claimed "your sources" on a workspace
 * with no source connected, directly above a line saying none is -- and both
 * branches are gated on the same emptiness test, so they always appeared
 * together and always contradicted.
 *
 * `_authenticated.outcomes.tsx` had already named this shape after a dead
 * backend made one page say one thing five times: *"Every one of those
 * sentences is well written. Five of them about one cause is still a wall, and
 * a wall makes the product look far more broken than it is."* Same law, a
 * different surface, unapplied.
 *
 * ── WHY A COUNT WORKS HERE WHERE A SIMILARITY SCORE DOES NOT ──────────────
 * Lane 2 tried to score sameness between two sentences on the trace page and
 * showed no threshold can do it: containment and Jaccard both put a genuine
 * pair and a genuine near-miss at the same number, because a bag of words
 * cannot separate "the same claim" from "that subject, a different predicate".
 *
 * This is not that problem. Nothing here is asked to judge whether two
 * sentences mean the same thing. It counts how many sentences assert ONE
 * known, named fact -- that nothing has arrived -- using the phrasings this
 * page actually uses. A classifier over open text is a guess; a count of a
 * fact we have already identified is arithmetic.
 *
 * WHICH ALSO MEANS THIS GUARD IS HONEST ABOUT ITS OWN REACH. Reworded into a
 * phrasing not listed here, a fifth restatement would pass. That is a real
 * limit and it is written down rather than papered over: the value is that the
 * four known ones cannot come back, and that anybody adding a fifth in these
 * words is stopped.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = readFileSync(join(import.meta.dir, "DiscoverSurface.tsx"), "utf8");
/* Comments only. This file's headers quote every sentence being counted, so
   stripping them is the difference between measuring the page and measuring
   the argument about the page. */
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/**
 * The phrasings this page uses to say "nothing has arrived", counted directly
 * in the source rather than extracted as literals first.
 *
 * THE FIRST VERSION OF THIS PULLED EVERY QUOTED STRING OUT WITH A REGEX AND
 * THEN FILTERED THEM, and it reported one of the two survivors missing. The
 * cause is that pairing quotes left-to-right across a whole TSX file mis-pairs
 * the moment anything shifts the parity -- a JSX attribute, an apostrophe --
 * so the extraction silently loses real strings. It is the same failure as a
 * guard that strips the literal it is hunting: the measurement broke, not the
 * code, and it broke in the direction that looks like a finding.
 *
 * Counting occurrences of a named phrase needs no parsing at all, so there is
 * nothing left to get wrong.
 */
const CLAIMS = {
  "have sent nothing": /have sent nothing/gi,
  "nothing new since": /nothing new since/gi,
  "is connected yet": /is connected yet/gi,
  "nothing has come in": /nothing has come in/gi,
} as const;

const count = (re: RegExp) => (CODE.match(re) ?? []).length;

describe("the empty arrival states its one fact once", () => {
  it("no longer stacks four sentences about one absence", () => {
    /*
     * TWO sentences survive and each has a job only it can do: the headline
     * states the state, and the `Quiet` states the CAUSE and carries the door
     * out. A third is the wall.
     */
    const said = Object.fromEntries(Object.entries(CLAIMS).map(([k, re]) => [k, count(re)]));
    expect(said).toEqual({
      "have sent nothing": 0,
      "nothing new since": 0,
      "is connected yet": 1,
      "nothing has come in": 1,
    });
  });

  it("never claims sources on a workspace that has none", () => {
    // The contradiction, not the wording: the headline and the Quiet always
    // render together, so the headline may not assume what the Quiet denies.
    expect(CODE).not.toContain("Your sources have sent nothing yet");
  });

  it("keeps the half of the capture line that only it can say", () => {
    // The removal must not take the point with it. "You do not have to wait"
    // is the reason to use the box instead of leaving the page, and it is not
    // said anywhere else.
    expect(CODE).toContain("You do not have to wait for a source.");
  });
});

describe("the since-line is still drawn where it is a real answer", () => {
  /*
   * THE MIRROR. Every assertion above is a deletion, and a page that had
   * simply stopped saying anything would satisfy all of them. What was removed
   * is the delta ON AN EMPTY RECORD; the delta itself is the point of the line
   * and has to survive for a workspace that has something to have changed.
   */
  it("renders on a workspace with signals, and not on one without", () => {
    const call = CODE.match(/\{sinceLine[^}]*\?[\s\S]{0,120}?\}/);
    expect(call, "the since-line moved; re-point this test").not.toBeNull();
    expect(call![0]).toContain("!signalsEmpty");
    expect(call![0]).toContain("sinceLine");
  });

  it("uses the emptiness predicate this file already owns", () => {
    // A second spelling of one condition is how two branches come to disagree
    // about what empty means. `signalsEmpty` is defined once and read here.
    expect(CODE).toMatch(/const signalsEmpty =/);
  });
});
