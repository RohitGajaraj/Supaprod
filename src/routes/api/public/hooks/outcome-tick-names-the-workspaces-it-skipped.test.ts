import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A TICK THAT CHECKED NOTHING SAID ok:true, 163 TIMES IN A WEEK.
 *
 * WHAT WAS FOUND. The outcome tick skips any workspace whose GitHub cannot be
 * resolved -- no binding, revoked token, network fault -- and the skip is
 * CORRECT: one workspace's broken connector must not stop the sweep. But the
 * skip was invisible in the one place a person looks. The response carried
 * `checked` and `shipped`, both honestly zero, with no way to tell "nothing
 * was due" apart from "everything due was skipped". recordErrorEvent rows
 * existed, and nobody watches those.
 *
 * WHY IT SURFACED. `max(prds.shipped_at)` sat frozen at 2026-07-25 with 36
 * approved PRDs waiting while the hourly tick returned ok:true 163 times in
 * the week measured. Every waiting PRD was in a skipped group. Same defect
 * class as derive-tick's dead push (see the test beside this one): a silenced
 * subsystem must SAY it is silenced, in its own answer.
 *
 * These assertions follow that file's lessons: comments are stripped before
 * matching so prose never satisfies a test of code, and matches are
 * whitespace-tolerant so the formatter cannot break a test whose behaviour
 * did not change.
 */

const SRC = readFileSync(join(import.meta.dir, "outcome-tick.ts"), "utf8");
const FLAT = SRC.replace(/\s+/g, " ");

/** The resolveGitHub catch body, comment lines stripped. */
function skipCatchBody(): string {
  const fromResolve = SRC.slice(SRC.indexOf("gh = await resolveGitHub"));
  return fromResolve
    .slice(fromResolve.indexOf("} catch (e) {"), fromResolve.indexOf("for (const prd of group)"))
    .split("\n")
    .filter((l) => !l.trim().startsWith("//") && !l.trim().startsWith("*"))
    .join("\n");
}

describe("the outcome tick names the workspaces it skipped", () => {
  it("reads the tick source at all, so nothing below passes vacuously", () => {
    expect(SRC).toContain("resolveGitHub");
    expect(skipCatchBody()).toContain("connector_error");
  });

  it("collects skipped workspaces where the skip happens", () => {
    // Declared BEFORE the workspace loop, so one list spans the whole sweep
    // rather than resetting per group.
    expect(FLAT).toContain("const skippedNoGithub: Array<string | null> = [];");
    expect(SRC.indexOf("const skippedNoGithub")).toBeLessThan(
      SRC.indexOf("for (const [workspaceId, group] of groups)"),
    );
    expect(skipCatchBody()).toContain("skippedNoGithub.push(workspaceId)");
  });

  it("the skip itself stays correct: still continues, still records, never throws", () => {
    // The original behaviour that must survive this fix. A rethrow here would
    // let one workspace's revoked token stop every other workspace's sweep,
    // which is a worse defect than the silence being fixed.
    const body = skipCatchBody();
    expect(body).toContain("continue;");
    expect(body).toContain("await note(e");
    expect(body).not.toMatch(/throw/);
  });

  it("the list reaches the response beside the fields that were already there", () => {
    // The response is the tick's only answer to "did you do anything?", so the
    // new field has to live there -- a variable nothing serializes is the same
    // silence with more steps. The existing fields are asserted too: renaming
    // or dropping one would change what every consumer of this JSON sees.
    const start = FLAT.indexOf("JSON.stringify({ ok: true");
    expect(start).toBeGreaterThan(-1);
    const response = FLAT.slice(start, FLAT.indexOf("})", start));
    for (const field of ["checked", "shipped", "skippedNoGithub", "suggested", "reviews"]) {
      expect(response).toContain(field);
    }
  });
});
