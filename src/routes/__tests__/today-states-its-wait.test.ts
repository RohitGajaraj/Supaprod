import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * THE FRONT DOOR MAY NOT RENDER NOTHING WHILE IT READS.
 *
 * THE DEFECT THIS EXISTS TO KILL, found 2026-08-05. Today opened blank. All
 * three of its regions were written `loading ? null`, so on a cold load the
 * gate, the finished list and the learning were absent at once: a headline over
 * a horizontal rule, for as long as the slower of two server reads took. The
 * route declares no loader either, so the router's `defaultPendingComponent`
 * never covered the gap. A screen reader was handed silence for the whole of it.
 *
 * WHY IT IS WORTH A BUILD-FAILING TEST rather than a review note. `? null` is
 * the tidiest-looking line in any diff. It typechecks, it renders, it never
 * throws, and it reads as restraint. It is also the easiest way in the world to
 * reintroduce: the next person adding a fourth read to Today will copy the shape
 * of the third.
 *
 * THE FOUR LINES THIS DRAWS:
 *
 *   1. NO WAIT RESOLVES TO NOTHING. A read in flight renders the third fact
 *      (docs/conventions/surface-discipline.md §6). "Nothing is waiting on you"
 *      and "cannot reach the queue" are both claims, and while the read is
 *      running neither is known. Printing nothing is not the third option, it is
 *      the absence of an answer.
 *
 *   2. EVERY REGION WAITS ON ITS OWN READ. `loading` is the union of the queue
 *      and the missions list and it belongs to the headline alone, because one
 *      sentence assembled from two counts genuinely needs both. A REGION keyed
 *      off the union stays hidden until the SLOWER read returns, which is
 *      latency the user pays and gets nothing for. That is the founder's backlog
 *      item said exactly: fix the latency, not just the spinner.
 *
 *   3. THE COPY STATES WHAT IS BEING READ, AND NEVER HOW LONG IT TAKES.
 *      "Reading what needs you." is a fact. "Just a moment", a percentage or a
 *      seconds count are all the surface talking about itself.
 *
 *   4. A CLAIM NEVER PRINTS BEFORE ITS READ LANDS. "It learned one thing" is a
 *      block title that asserts a learning exists, so it may not be drawn over a
 *      wait that does not yet know whether one does.
 *
 * Modelled on run-evidence-holds.test.ts and no-fabricated-agent-steps.test.ts:
 * scan the source as TEXT and strip comments first, because the fixed file
 * legitimately describes every banned shape in prose in order to ban it.
 */

const ROUTE = join(import.meta.dir, "..", "_authenticated.today.tsx");

/**
 * Strip comments so prose that NAMES the banned shape does not trip it, while
 * keeping the line count intact: a failure that points at the wrong line costs
 * more than it saves.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
    .replace(/^(\s*)\/\/.*$/gm, "$1");
}

const src = stripComments(readFileSync(ROUTE, "utf8"));

/** Everything the component actually renders, which is where these rules bite. */
const jsx = src.slice(src.indexOf("<Surface"));

/**
 * The offending lines, quoted with their real line numbers. Asserting
 * `expect(src).not.toMatch(...)` prints the entire 600-line route on failure,
 * and a build failure a person has to scroll past is one they learn to skim.
 */
function offenders(source: string, pattern: RegExp): string[] {
  const offset = source === jsx ? src.slice(0, src.indexOf("<Surface")).split("\n").length - 1 : 0;
  return source
    .split("\n")
    .map((line, i) => `${i + 1 + offset}: ${line.trim()}`)
    .filter((line) => pattern.test(line));
}

const waits = [...src.matchAll(/<Loading(\s[^>]*)?>([\s\S]*?)<\/Loading>/g)].map(([, , text]) =>
  text.trim(),
);

/** The three reads Today makes. Each owns a region, so each owns a wait. */
const READS = ["queue", "missions", "learnings"] as const;

describe("Today renders something for every read in flight", () => {
  it("has no wait branch that resolves to nothing", () => {
    // THE DEFECT, in its original form. All three regions were literally this.
    expect(offenders(src, /\bloading\s*\?\s*null/)).toEqual([]);
    expect(offenders(src, /isLoading\s*\?\s*null/)).toEqual([]);
    expect(offenders(src, /isPending\s*\?\s*null/)).toEqual([]);
  });

  it("each read renders the third fact while it is still running", () => {
    for (const read of READS) {
      const waiting = new RegExp(`${read}\\.isLoading\\s*\\?\\s*\\(?\\s*<Loading>`).test(jsx);
      expect({ read, waiting }).toEqual({ read, waiting: true });
    }
    expect(waits.length).toBe(READS.length);
  });

  it("the wait comes from the primitive, which is what carries the live region", () => {
    // Loading is a `<p aria-live="polite">` with a reserved min-height, so
    // hand-rolling one drops the announcement and the reserved height in a single
    // line, and the screen reader going quiet is the half nobody catches in review.
    const imported = /import \{([\s\S]*?)\} from "@\/components\/shell\/primitives";/.exec(src);
    expect(imported).not.toBeNull();
    expect(imported![1]).toContain("Loading");
    expect(offenders(src, /className="sp-loading"/)).toEqual([]);
  });
});

describe("Today's regions do not wait on each other", () => {
  it("the union belongs to the headline and never to a region", () => {
    expect(
      offenders(src, /const loading = queue\.isLoading \|\| missions\.isLoading;/),
    ).toHaveLength(1);
    expect(offenders(jsx, /\bloading\b/)).toEqual([]);
  });

  it("every read that can fail says so, rather than reading as an empty day", () => {
    // A failed read is not "nothing happened". Today already knew this for the
    // queue and the missions list; the learnings read still rendered silence.
    for (const read of READS) {
      const admits = new RegExp(`${read}\\.isError\\s*\\?`).test(jsx);
      expect({ read, admits }).toEqual({ read, admits: true });
    }
  });
});

describe("Today's wait copy is honest", () => {
  it("states what it is reading, as a fact", () => {
    for (const wait of waits) {
      expect(wait).toMatch(/^Reading .+\.$/);
    }
  });

  it("never advertises latency and never invents progress", () => {
    for (const wait of waits) {
      expect(wait).not.toMatch(/%|\bsecond|\bmoment|\balmost|\bhang on|\bplease wait|\bjust a\b/i);
    }
    // No timer walking an index through a list of labels, which is the shape
    // src/__tests__/no-fabricated-agent-steps.test.ts fails the build over.
    expect(offenders(src, /setInterval|setTimeout/)).toEqual([]);
  });

  it("keeps its dashes out of user-facing text", () => {
    for (const wait of waits) {
      expect(wait).not.toMatch(/[–—]/);
    }
  });

  it("no plain database read wears an agent's clothes", () => {
    // surface-discipline §7: `working` is only for a genuinely dispatched agent.
    // Today reads three tables and dispatches nothing.
    expect(offenders(src, /<Loading[^>]*\bworking\b/)).toEqual([]);
    expect(offenders(src, /AgentPulse/)).toEqual([]);
  });
});

describe("Today never prints a claim it has not read yet", () => {
  it("holds back 'It learned one thing' until the learning is in hand", () => {
    const titleAt = jsx.indexOf('<Block title="It learned one thing">');
    const waitAt = jsx.indexOf("<Loading>Reading what it learned.</Loading>");
    expect(titleAt).toBeGreaterThan(-1);
    expect(waitAt).toBeGreaterThan(-1);
    // Siblings in one ternary chain, never the wait nested under the claim: the
    // branch carrying the title is guarded by the learning itself existing.
    expect(waitAt).toBeLessThan(titleAt);
    expect(jsx.slice(waitAt, titleAt)).toMatch(/learning\?\.summary\s*\?/);
  });

  it("the headline shows the date while it counts, rather than a number it lacks", () => {
    // The one region that legitimately says nothing about reading. A headline
    // reading "Reading..." is the surface talking about itself, and the date is a
    // true fact the person came in already holding.
    expect(offenders(src, /if \(loading\) return "Today";/)).toHaveLength(1);
  });
});
