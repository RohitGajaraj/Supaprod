import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * PRESS "BUILD THIS", AND WAIT OUT A WHOLE BUILD BEFORE YOU MAY WATCH IT.
 *
 * `dispatchBuilderMission` awaited `runAgentLoop` inside the request, so the
 * station's one dispatch ran an entire builder session on a Cloudflare Worker
 * request: the button sat on "Starting" for the length of a real build, the run
 * the station exists to let you watch was unreachable until it had finished,
 * and every failure mode of a long request landed on a caller that had been
 * told nothing was dispatched.
 *
 * The sibling path had already solved it. `dispatchStudioSession` goes through
 * `nativeBuildDriver.dispatch`: create the mission, insert a QUEUED
 * `agent_runs` row, return, and let the resume-runs sweeper promote it a minute
 * later with a worker's full budget. This pins that the Build Console does the
 * same, and pins the four other things the same audit found on this panel.
 *
 * Comment-stripped before asserting, because these files describe the defects
 * at length and a raw-text rule would match its own documentation.
 */
const SRC = join(import.meta.dir, "..", "..");
const read = (rel: string) => readFileSync(join(SRC, rel), "utf8");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const SERVER = code(read("lib/build.functions.ts"));
const PANEL = code(read("components/build/ReadyToBuild.tsx"));
const HANDLER = SERVER.slice(
  SERVER.indexOf("export const dispatchBuilderMission"),
  SERVER.indexOf("export type SpecDispatch"),
);

describe("the dispatch queues the build instead of running it", () => {
  test("the inline agent loop is gone from the whole module", () => {
    // Whole-file, because a second call site would put the request-length build
    // back while a handler-scoped rule stayed green.
    expect(SERVER).not.toContain("runAgentLoop");
  });

  test("it dispatches through the seam the Studio path uses", () => {
    expect(HANDLER).toContain("nativeBuildDriver.dispatch(");
  });

  test("it returns the run id, so the caller can navigate on a real run", () => {
    expect(HANDLER).toMatch(/run_id: runId,/);
    expect(HANDLER).toMatch(/run_started: runId !== null,/);
  });

  test("and the caller navigates on exactly that answer", () => {
    expect(PANEL).toMatch(/if \(missionId && r\?\.run_started && !linkError\)/);
  });

  test("the spec is still linked to the mission it created", () => {
    // The prd -> mission edge is what every downstream reader resolves a
    // changeset's spec through, and it is what retires the button below. A
    // dispatch that skipped it produced changesets with a null prd_id, refused
    // ship stamps, and an empty outcome memory pool.
    expect(HANDLER).toContain('parent_kind: "prd"');
    expect(HANDLER).toContain('relation: "dispatched"');
  });

  test("nothing after the issue exists is allowed to throw", () => {
    // Past the GitHub issue there is something durable in the world, so
    // "nothing was dispatched" would be false. Failures are reported on
    // `run_error` instead. The seam's own throw is caught for that reason.
    expect(HANDLER).toMatch(/catch \(e\) \{\s*runError = e instanceof Error/);
  });
});

describe("Build this retires once the spec has a build", () => {
  test("the panel reads the dispatch edge rather than prds.status", () => {
    // Nothing moves `prds.status` on dispatch (only the ship stamp does), so a
    // spec halted three days ago was still 'approved' and still carried a live
    // primary button. The lineage edge is the evidence the dispatch already
    // writes.
    expect(PANEL).toContain("listSpecDispatches");
    expect(PANEL).toContain("Already sent to Build");
  });

  test("the primary becomes the door to the run, and the second press says its cost", () => {
    expect(PANEL).toContain("Open the run");
    expect(PANEL).toContain("Build again");
    expect(PANEL).toContain("Building again mints another mission and another billed run.");
  });

  test("a failed dispatch read does NOT read as never dispatched", () => {
    expect(PANEL).toContain("We could not check whether a build has already been started");
    // And a read still in flight gets its own sentence, so the failure sentence
    // does not become the ordinary one on every first paint.
    expect(PANEL).toContain("has not come back yet");
  });
});

describe("the panel refuses the presses it should never make", () => {
  test("a sample spec is marked and its press is replaced", () => {
    // A spec generated from a seeded example bet would open a real GitHub issue
    // in a customer's repository and bill a real run against invented work. The
    // migration's own column comment requires surfaces to mark it the way
    // /decide marks the bet it came from.
    expect(PANEL).toMatch(/const sample = row\.is_sample === true;/);
    expect(PANEL).toContain("<b>Example</b>");
    expect(PANEL).toContain("Read the example");
  });

  test("is_sample survives the cast, which is where it used to die", () => {
    // The cast asserts a shape rather than verifying one, so a dropped column
    // is invisible to tsc. This is the only thing that catches it.
    expect(PANEL).toMatch(/is_sample\?: boolean \| null;/);
  });

  test("no repo connected opens the gate instead of a raw error", () => {
    // /runs and the spec page both wrap this act in gateDispatch plus
    // RepoGateDialog, which offers the two real paths and retries the
    // interrupted dispatch. Build pressed straight into the mutation.
    expect(PANEL).toContain("gateDispatch({");
    expect(PANEL).toContain("<RepoGateDialog");
    // With the spec id, so the provision path exists at all.
    expect(PANEL).toMatch(/prdId=\{repoGate\?\.prdId \?\? null\}/);
  });
});

describe("nothing on this panel disappears without saying so", () => {
  test("a failed specs read renders a retry rather than nothing", () => {
    // `isError` used to render exactly what an empty list renders: nothing, on
    // the station's only start control, with no word said.
    expect(PANEL).toMatch(/if \(specs\.isError\) \{/);
    expect(PANEL).toContain("The spec list did not load");
    // And the silent null survives for the case it is honest about.
    expect(PANEL).toMatch(/if \(ready\.length === 0\) return null;/);
  });

  test("the window states its remainder and can be opened", () => {
    // "Plan has finished with these" meant the six most recent of 42, and the
    // other 36 could not be started from this station at all.
    expect(PANEL).toMatch(/const beyond = Math\.max\(0, ready\.length - visible\.length\);/);
    expect(PANEL).toContain("are not.");
    /* The reveal moved OUT of the region heading and under the last row: a
       cap's way out belongs to the content, where a reader arrives having
       actually hit the limit, not to the frame where it is announced before
       any of the list has been seen. The arithmetic is what this guard is for
       and it is unchanged, so it is pinned without the retired `more={` prop
       that used to carry it. */
    expect(PANEL).toMatch(/Show \{Math\.min\(beyond, WINDOW_MAX - WINDOW\)\} more/);
  });

  test("the widened window still fits what the side reads accept in one call", () => {
    // Both `listDispatchDesignGates` and `listSpecDispatches` validate
    // `.max(24)`; a larger window would start throwing on the read rather than
    // showing more rows.
    expect(PANEL).toMatch(/const WINDOW_MAX = 24;/);
    const gateFn = SERVER.slice(SERVER.indexOf("export const listDispatchDesignGates"));
    const dispatchFn = SERVER.slice(SERVER.indexOf("export const listSpecDispatches"));
    for (const fn of [gateFn.slice(0, 600), dispatchFn.slice(0, 600)]) {
      expect(fn).toMatch(/\.max\(24\)/);
    }
  });
});
