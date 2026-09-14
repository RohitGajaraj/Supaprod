import { describe, expect, it } from "bun:test";
import { Glob } from "bun";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A LINK THIS PRODUCT BUILDS ITSELF MUST LAND ON A PAGE THIS PRODUCT SERVES.
 *
 * ── WHAT WAS MEASURED, 2026-09-14 ─────────────────────────────────────────
 * Driven signed in against the served product, `https://supaprod.ai/brain`
 * renders the 404 page: *"There is no page at this address."* The surface was
 * renamed to `/outcomes` and most callers moved with it. FIVE did not, and every
 * one of them was a link shown to a person:
 *
 *   src/lib/ask-record.ts                     an Ask citation on a decision
 *   src/lib/ai/research.server.ts             a RAG source, and the decisions snapshot
 *   src/lib/artifacts.functions.ts            every doc row's href
 *   src/components/knowledge/LearningDetail.tsx  the decision a graded outcome grades
 *
 * Those are the worst possible places for a dead link. The product's entire
 * claim is that its work is evidenced, and a citation is where a person goes to
 * check. Sending them to a not-found page does more damage than showing no
 * citation at all, because it converts "here is the proof" into "the proof is
 * missing".
 *
 * ── WHY A GUARD AND NOT JUST THE FIX ──────────────────────────────────────
 * The rename was done properly and this still happened, because a route string
 * inside a template literal or a `href:` field is invisible to `tsc`, to the
 * router, and to every reachability check in this repo:
 * `no-surface-nobody-can-reach.test.ts` asks whether a SURFACE has inbound
 * links, which is the opposite question, and it happily counts a link to a
 * surface that no longer exists.
 *
 * So the retired addresses are listed and the tree is scanned for them. This is
 * cheap, it is exact, and it fails on the day somebody reintroduces one.
 */

const SRC = join(import.meta.dir, "..");

/**
 * Addresses that no longer resolve, with where they went.
 *
 * ONLY ROUTES THAT ACTUALLY 404. A route that still redirects is a working
 * address and belongs nowhere near this list -- putting one here would forbid a
 * link that works, which is how a guard starts costing more than it saves.
 * `/brain` was checked in a browser rather than inferred from the absence of a
 * route file.
 */
const RETIRED: ReadonlyArray<{ path: string; wentTo: string; why: string }> = [
  {
    path: "/brain",
    wentTo: "/outcomes",
    why: "renamed; `?tab=` and the `decision`/`learning` drills carry over unchanged",
  },
];

/** Source the product ships, excluding tests and their fixtures. */
function shipped(): Array<[name: string, code: string]> {
  return [...new Glob("**/*.{ts,tsx}").scanSync({ cwd: SRC, absolute: true })]
    .filter((f) => !f.includes(".test.") && !f.includes("__tests__"))
    .map((f) => [f.slice(SRC.length + 1), readFileSync(f, "utf8")]);
}

/**
 * Comments are stripped, and this test needed it as much as any in the repo.
 *
 * Seven of the surviving mentions of `/brain` are prose explaining that the
 * address is retired, including the sentence recording that `/artifacts`
 * redirects to it. A scan that read those would fail on its own documentation,
 * which this repo has now paid for four separate times -- and one of those was
 * my own docblock in `waiting-on-a-date-is-not-waiting-in-a-queue.server.test.ts`
 * earlier in this same session.
 */
function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

describe("no link the product builds points at a retired address", () => {
  it("names something to scan, so a broken scan cannot read as clean", () => {
    const files = shipped();
    expect(files.length).toBeGreaterThan(400);
    /* And the scanner sees a route string in the shape these are written in. */
    expect(stripComments('const x = { href: "/outcomes?tab=docs" };')).toContain("/outcomes?tab=");
  });

  it("finds no live reference to a route that 404s", () => {
    const offenders: string[] = [];
    for (const [name, code] of shipped()) {
      const live = stripComments(code);
      for (const { path } of RETIRED) {
        /*
         * The address as a LINK: quoted, or opening a query or template
         * interpolation. Deliberately not a bare substring -- `/brain` is a real
         * directory name (`src/components/brain`) and a real module prefix
         * (`lib/brain-insights.functions`), and matching those would make this
         * guard unusable on the day it was written.
         */
        const asLink = new RegExp(`["'\`]${path}(["'?#]|\\$\\{)`, "g");
        for (const hit of live.matchAll(asLink)) {
          const line = live.slice(0, hit.index).split("\n").length;
          offenders.push(`${name}:${line}`);
        }
      }
    }
    expect(
      offenders,
      [
        "A link points at an address that returns 404:",
        ...RETIRED.map((r) => `  ${r.path} -> ${r.wentTo}  (${r.why})`),
        "",
        "Verified in a browser, signed in: the old path renders the 404 page.",
        "A citation that dead-ends is worse than no citation, because it turns",
        '"here is the proof" into "the proof is missing".',
      ].join("\n"),
    ).toEqual([]);
  });

  it("the replacement really is served, so this test is not just moving the break", () => {
    /*
     * THE MIRROR. Repointing every link at a second dead address would satisfy
     * the assertion above. Each destination has to be a route this repo actually
     * defines, and the tab names used in the queries have to be ones the target
     * parses.
     */
    const routes = [...new Glob("routes/**/*.tsx").scanSync({ cwd: SRC, absolute: false })].join(
      "\n",
    );
    for (const { wentTo } of RETIRED) {
      const file = `_authenticated${wentTo.replace("/", ".")}`;
      expect({ wentTo, hasRoute: routes.includes(file) }).toEqual({ wentTo, hasRoute: true });
    }
    /* The two tabs every repointed link uses are real on the destination. */
    const outcomes = readFileSync(join(SRC, "routes", "_authenticated.outcomes.tsx"), "utf8");
    for (const tab of ["decisions", "docs"]) {
      expect({ tab, known: outcomes.includes(`"${tab}"`) }).toEqual({ tab, known: true });
    }
  });
});
