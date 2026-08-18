import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * THE STATE THAT DOMINATED PRODUCTION WAS THE ONE THE STATION COULD NOT SAY.
 *
 * /build's headline is assembled from two counts: `live` (a builder run in
 * running/queued) and `gated` (a pending approval). Measured on the live
 * database 2026-08-06: 67 halted missions, 19 completed_with_failures, and 0
 * running. Not one of those 86 mapped to either count, so the headline read
 * "Nothing is being written. Nothing needs you." over a station full of stopped
 * work, and each stopped row fell through to `statusPhrase`, which read the
 * CHANGESET's column and said "staged, not committed", a sentence about work
 * in flight.
 *
 * AND THE FOUR READS THAT FEED IT DISCARDED THEIR ERRORS. supabase-js RESOLVES a
 * refused read, so `{ data }` alone cannot tell "there are none" from "we were
 * not allowed to look". A refused `agent_runs` read produced "Nothing is being
 * written"; a refused `agent_approvals` read produced "Nothing needs you"; a
 * refused `studio_changes` read zeroed every file count in silence. That is
 * absence-as-evidence sitting directly under a headline asserted as fact.
 *
 * Source-text, and comment-stripped before asserting: these files describe the
 * defect at length, and a rule that searched the raw text would match the
 * paragraph warning against it. Same treatment every working grep test in this
 * repo uses.
 */
const SRC = join(import.meta.dir, "..", "..");
const read = (rel: string) => readFileSync(join(SRC, rel), "utf8");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const ENGINE = code(read("lib/build-engine.functions.ts"));
const ROUTE = code(read("routes/_authenticated.build.index.tsx"));

describe("a stopped build is a first-class state on /build", () => {
  test("the item type carries it", () => {
    expect(ENGINE).toMatch(/stopped: boolean;/);
  });

  test("it is sourced from BOTH vocabularies, missions and runs", () => {
    // Either alone leaves a hole: a mission can be 'running' with every run on
    // it failed, and a mission can be 'halted' with no run row at all.
    expect(ENGINE).toContain('"completed_with_failures"');
    expect(ENGINE).toMatch(/const RUN_STOPPED = \[/);
    expect(ENGINE).toMatch(/const MISSION_STOPPED = new Set\(/);
  });

  test("a mission that FINISHED is not stopped by the run its retry survived", () => {
    /**
     * The run half is derived from every run on the mission, not the latest
     * one, and `mission-advance.server.ts` retries a 'failed' run (:531) and
     * CASes a stranded 'queued' run to 'failed' before retrying its step. So a
     * mission that reaches 'completed' commonly still carries a dead run row,
     * and without this guard that row read as "stopped, and nothing is picking
     * it back up", counted in the needs-you half of the headline, over work
     * that finished.
     */
    expect(ENGINE).toMatch(/const MISSION_DONE = new Set\(\["completed", "done"\]\)/);
    expect(ENGINE).toMatch(/else if \(!doneSet\.has\(r\.mission_id\)\) stoppedSet\.add/);
  });

  test("a run in flight outranks one that stopped", () => {
    // A mission that halted and was then resumed is being written, and putting
    // it under "Stopped" would be the same class of wrong answer in reverse.
    expect(ENGINE).toMatch(/stopped:[\s\S]{0,120}!liveSet\.has\(r\.mission_id\)/);
  });

  test("the surface counts it in the half that needs a person", () => {
    expect(ROUTE).toMatch(/const needsYou = gated\.length \+ stopped\.length;/);
  });

  test("the surface gives it its own phrase and its own block", () => {
    expect(ROUTE).toContain("stopped, and nothing is picking it back up");
    /* Pinned on the CLAIM, not on the component's name. The section still
       exists and is still titled "Stopped"; only the chrome it is drawn with
       changed, from the retired `Block` to Meridian's `Region`. A guard that
       names the component fails on every port and protects nothing extra. */
    expect(ROUTE).toMatch(/title="Stopped"/);
  });

  test("the phrase does NOT overwrite a change that landed", () => {
    // "merged" is not undone by the run behind it stopping afterwards.
    expect(ROUTE).toContain("merged, and the run behind it stopped");
  });

  test("the row's mark shows the state, so a long list is scannable", () => {
    expect(ROUTE).toMatch(/item\.stopped\s*\?\s*"failed"/);
  });
});

describe("no read on this surface is allowed to fail into a calm sentence", () => {
  test("all four side reads keep their error", () => {
    for (const name of ["changeErr", "missionErr", "runErr", "gateErr"]) {
      expect({ name, kept: ENGINE.includes(name) }).toEqual({ name, kept: true });
    }
    expect(ENGINE).toMatch(/const unread: BuildWorkUnread = \{/);
  });

  test("a skipped read is not reported as a failed one", () => {
    // No missions in the window means there was nothing to ask about, which is
    // a real answer. Each short-circuit therefore resolves with `error: null`.
    const skips = ENGINE.match(/Promise\.resolve\(\{[\s\S]{0,200}?\}\)/g) ?? [];
    expect(skips.length).toBe(3);
    for (const s of skips) expect(s).toContain("error: null");
  });

  test("the headline stops asserting when the read that feeds it failed", () => {
    expect(ROUTE).toContain("We could not read what is being written");
    expect(ROUTE).toContain("We could not read what is waiting on you.");
    // And the confident sentences survive, for the case they are true of.
    expect(ROUTE).toContain('"Nothing is being written"');
    expect(ROUTE).toContain('"Nothing needs you."');
  });

  test("a failed file-count read is named rather than shown as zeroes", () => {
    // The quietest of the four: the rows are real, every number on them is 0,
    // and nothing said why.
    expect(ROUTE).toContain("every count on these rows reads zero");
  });
});

describe("the ceiling on this station is the one that binds its runs", () => {
  test("both spend calls send the active workspace", () => {
    // Without it `resolveGovernedWorkspace` falls back to the user's DEFAULT
    // workspace, while enforcement reads the ceiling off the workspace the
    // mission carries. A user with two workspaces moved a number that bound
    // nothing they were watching.
    expect(ROUTE).toMatch(
      /fSpend\(\{ data: \{ workspaceId: activeWorkspaceId \?\? undefined \} \}\)/,
    );
    expect(ROUTE).toMatch(/fSetSpend\(\{ data: \{ cap_usd, workspaceId: activeWorkspaceId/);
  });

  test("and the query key carries it, so a workspace switch cannot show the old one", () => {
    expect(ROUTE).toMatch(/queryKey: \["spend-policy", activeWorkspaceId\]/);
  });

  test("a refused write is rendered, not swallowed", () => {
    /**
     * `setWorkspaceSpendPolicy` throws on a role refusal and throws
     * `unconfirmedWrite("that the ceiling moved")` when the update matched no
     * rows, precisely so "the receipt on screen told the person their spend was
     * bounded at a number nothing enforces" could not happen. There was no
     * `onError` here at all, and the input keeps the typed number on screen, so
     * the client re-created exactly that.
     */
    /* Sliced to the whole mutation and not to its first `});`: that boundary
       lands inside `setCapReceipt({ cap });` and made this vacuous. */
    const block = ROUTE.slice(
      ROUTE.indexOf("const setCap = useMutation("),
      ROUTE.indexOf('useSpineStrip("build")'),
    );
    expect(block.length).toBeGreaterThan(0);
    expect(block).toContain("onError: (e: Error) => {");
    expect(block).toContain("setCapError(e.message)");
    expect(ROUTE).toContain("The ceiling did not move.");
    // The stale receipt goes with it: a receipt is what a click CAUSED.
    expect(ROUTE).toContain("setCapReceipt(null)");
    // And the box goes back to the number the server last confirmed.
    expect(ROUTE).toMatch(/key=\{`cap-\$\{spend\.data\.cap_usd \?\? "none"\}-\$\{capReset\}`\}/);
  });
});

describe("the claim release the tool refusal names on /build exists on /build", () => {
  const CLAIMS = code(read("components/build/HeldClaims.tsx"));

  test("the two server fns finally have a caller", () => {
    expect(CLAIMS).toContain("listBuilderClaims");
    expect(CLAIMS).toContain("releaseBuilderClaim");
  });

  test("and the station mounts it", () => {
    expect(ROUTE).toContain("<HeldClaims />");
  });

  test("it says nothing while no claim is held, and speaks when a read fails", () => {
    // "No claim is held" and "we could not find out" are different facts, and
    // a person arrives at this block BECAUSE a build told them a claim exists.
    expect(CLAIMS).toMatch(/if \(!claims\.isError && held\.length === 0\) return null;/);
    expect(CLAIMS).toContain("We could not read which files are held");
  });

  test("a refused release leaves the row looking held, and says why", () => {
    expect(CLAIMS).toContain("onError: (e: Error, claimId) => setFailed(");
  });
});
