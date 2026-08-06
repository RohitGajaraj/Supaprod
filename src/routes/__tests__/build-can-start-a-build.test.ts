import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * THE STATION WHOSE JOB IS BUILDING COULD NOT START A BUILD.
 *
 * THE FOUNDER'S OWN TEST, verbatim: "Entire purpose of Build, is it done there?
 * Whatever the user wants to, WITHOUT switching the tools or switching into
 * different surfaces." The answer was no, and the station said so itself -- its
 * context panel read "Hand work over on Runs, and it arrives here as the crew
 * writes it."
 *
 * AND THE FUNCTION WAS ALREADY WRITTEN. `dispatchBuilderMission` takes a goal,
 * a prd id, reference links and a mission title, resolves the spec context and
 * starts the run. Defined once in `build.functions.ts`, called NOWHERE. The
 * fourth capability found in this session that was complete and never connected,
 * after the moat's own recommendation, the spec approval and the landing frame.
 *
 * Nothing could catch it. Every file typechecked and every test passed, because
 * an uncalled export is valid code and an absent control leaves no trace except
 * in what never happens.
 */

const HERE = join(import.meta.dir, "..");
const ROUTE = readFileSync(join(HERE, "_authenticated.build.index.tsx"), "utf8");
const LANE = readFileSync(join(HERE, "..", "components", "build", "ReadyToBuild.tsx"), "utf8");
const BUILD_FNS = readFileSync(join(HERE, "..", "lib", "build.functions.ts"), "utf8");

describe("Build can start the work it exists to do", () => {
  it("the dispatch has a caller at last", () => {
    // The whole defect in one assertion. If this ever fails again, the station
    // has gone back to being a viewer.
    expect(LANE).toContain("dispatchBuilderMission");
    expect(LANE).toMatch(/fDispatch\(\{/);
  });

  it("the lane is mounted on the station", () => {
    expect(ROUTE).toContain("<ReadyToBuild />");
    expect(ROUTE).toContain('from "@/components/build/ReadyToBuild"');
  });

  it("offers only APPROVED specs", () => {
    // Building an unapproved spec is exactly what the approval gate exists to
    // prevent. A draft in this list would route around it.
    expect(LANE).toMatch(/status\?: string \}\)\.status === "approved"/);
  });

  it("passes the spec id, so the builder gets its context rather than a sentence", () => {
    // `dispatchBuilderMission` resolves the PRD when given prdId. Sending only
    // a goal string would hand the agent a title and none of the document.
    expect(LANE).toMatch(/prdId: v\.id/);
  });

  /**
   * THE PAYLOAD MUST SATISFY WHAT THE DISPATCH DEMANDS, and this test is here
   * because its own author did not check that.
   *
   * `dispatchBuilderMission` requires an issue from one of THREE sources -- a
   * linked PRD that already carries `github_issue_url`, an `issueNumber` typed
   * in, or `autoCreateIssue` -- and throws otherwise (build.functions.ts:478).
   * The first version of this lane passed none of them. Measured on the live
   * database: 55 approved specs, ZERO with an issue url. So "Build this" threw
   * on every press from the moment it shipped.
   *
   * IT SHIPPED GREEN BECAUSE THIS FILE READS SOURCE TEXT. Every assertion above
   * greps for a string, and a string was present for everything they ask about.
   * A grep cannot know that a required field is absent, because absence has no
   * text to match. That is the lesson, and it is why this assertion is written
   * against the CONTRACT -- the three ways the handler will accept -- rather
   * than against the one spelling the lane happens to use today.
   */
  it("satisfies one of the three ways the dispatch will accept an issue", () => {
    /**
     * COMMENTS STRIPPED FIRST, and this is the whole reason the assertion is
     * worth having.
     *
     * Two earlier versions of this check were vacuous. The first sliced 700
     * characters from `fDispatch({`, and the flag sat past that window behind a
     * comment, so it failed on correct code. The second read the whole
     * `mutationFn` body -- and PASSED with the defect planted, because the
     * comment explaining the fix contains the words `github_issue_url`, which
     * is one of the three strings it greps for. The guard was matching its own
     * documentation.
     *
     * That is the failure mode of every source-text test in this repo, and it
     * is why the ones that work strip comments before asserting.
     */
    const strip = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    const code = strip(LANE);
    const start = code.indexOf("mutationFn:");
    const payload = code.slice(start, code.indexOf("onSuccess:", start));
    const ways = [
      /autoCreateIssue:\s*true/.test(payload),
      /issueNumber:/.test(payload),
      /github_issue_url/.test(payload),
    ];
    expect({ payload: payload.slice(0, 0), satisfied: ways.some(Boolean) }).toEqual({
      payload: "",
      satisfied: true,
    });
  });

  it("the handler still refuses a payload with none of the three", () => {
    // If this throw is ever removed the guard above stops meaning anything, so
    // it is pinned: the test protects the requirement, not just the caller.
    //
    // IT ACCEPTS `refuseDispatch` NOW, AND THAT IS THE REQUIREMENT UNCHANGED.
    // The pin read `throw new Error(` and went red on 2026-08-06 when every
    // pre-durable throw in the handler was MARKED: `refuseDispatch` returns an
    // Error carrying the prefix the panel keys "Nothing was dispatched" on
    // (lib/build/dispatch-refusal.ts), so this site still throws and still
    // throws before anything exists. The requirement is "no issue, no
    // dispatch"; the spelling of the constructor was never the requirement, and
    // this is the fourth formatting-brittle grep this repo has paid for.
    const fn = BUILD_FNS.slice(BUILD_FNS.indexOf("export const dispatchBuilderMission"));
    expect(fn).toMatch(/if \(!issueNumber\) \{[\s\S]{0,300}throw (new Error|refuseDispatch)\(/);
  });

  it("reports pending on the row that is starting, not on all of them", () => {
    // One shared mutation drove six buttons: starting one build said six were
    // starting and disabled five specs nobody touched.
    expect(LANE).toMatch(/start\.variables\?\.id === row\.id/);
  });

  it("names a failure instead of swallowing it", () => {
    // A dispatch that did not happen must never wear the shape of one that did.
    expect(LANE).toMatch(/onError:/);
    expect(LANE).toMatch(/The build did not start/);
    expect(LANE).toMatch(/Nothing was dispatched/);
  });

  it("renders nothing when no spec is waiting", () => {
    expect(LANE).toMatch(/if \(ready\.length === 0\) return null;/);
  });
});

describe("the station stopped telling people to leave", () => {
  it("its context panel no longer says work only arrives from elsewhere", () => {
    // The old line was accurate about a station that could not start anything,
    // and would be a lie about this one. Copy that describes a limitation has
    // to change when the limitation does.
    expect(ROUTE).not.toMatch(/A change is written by a run\. Hand work over on/);
    expect(ROUTE).toMatch(/An approved spec can be started here/);
  });
});

describe("the dispatch it calls is the real one", () => {
  it("still accepts a prd id and a mission title", () => {
    // If the signature narrows, the caller above becomes a lie rather than a
    // bug, and this fails loudly instead.
    const fn = BUILD_FNS.slice(BUILD_FNS.indexOf("export const dispatchBuilderMission"));
    expect(fn.slice(0, 900)).toMatch(/prdId: z\.string\(\)\.uuid\(\)\.optional\(\)/);
    expect(fn.slice(0, 900)).toMatch(/missionTitle: z\.string\(\)/);
  });
});
