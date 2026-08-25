/**
 * A station that was refused is not a station that failed.
 *
 * On 2026-08-25 track `8391835f` reached `build` — the furthest any track had
 * gone — and both Build seats came back saying the same thing:
 *
 * > **builder:** *"I cannot proceed... I lack access to the repository. The
 * > GitHub authentication failed when trying to explore the codebase."*
 * > **qa:** *"GitHub repository access is unavailable (401 authentication
 * > errors)."*
 *
 * The driver had no word for that. All eight hold reasons described the WORK —
 * it filed nothing, it filed the wrong thing, it ran long, it ran out of money
 * — so a locked door was recorded as `produced-nothing`, whose line to a person
 * reads *"This station ran but filed nothing... **It will try again.**"*
 *
 * It tried three times, at 04:00:52, 04:10:31 and 04:20:31, failing identically.
 * Then at 04:30:02 the attempts ceiling handed the work to `decideCorrection`,
 * which did exactly what it is built to do — *"the fix may live at an earlier
 * station"* — and sent the track from `build` back to `define`. **The work it
 * threw away was correct**: a faithful spec, six well-scoped tasks and a real
 * prototype. Rewriting them could not have opened GitHub.
 *
 * This is the same rule as the halt branch one level out, and that one is
 * already written down in `driver.server.ts`: *a run the loop HALTED is not a
 * station that failed.* Neither is a run whose tools were REFUSED.
 *
 * THE NARROWNESS IS THE POINT. If this matched every tool error, a genuine
 * defect would hide behind a hold that says "not your fault" and the attempts
 * ceiling would stop protecting anything. Only errors that mean THE DOOR WAS
 * LOCKED count, and `status: "denied"` — a person declining an approval — is
 * deliberately excluded, because that is the governance floor working and it
 * already has `waiting-on-a-person`.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

import {
  refusedTool,
  HOLD_LINE,
  holdLine,
  REPO_ROOT_ACCESS_REFUSED,
  type ToolStepLike,
} from "./driver";
import { TERMINAL_HOLDS } from "./correction";

const call = (over: Partial<ToolStepLike> = {}): ToolStepLike => ({
  kind: "tool_call",
  name: "studio.stage",
  status: "error",
  ...over,
});

describe("what counts as being refused", () => {
  it("catches the 401 that actually stopped the run", () => {
    const hit = refusedTool([call({ error: "GitHub API 401: Bad credentials" })]);
    expect(hit).not.toBeNull();
    expect(hit?.tool).toBe("studio.stage");
  });

  it("catches the other shapes a locked door arrives in", () => {
    for (const error of [
      "Request failed with status 403",
      "Unauthorized",
      "Forbidden",
      "authentication failed",
      "permission denied for table themes",
      "token has expired",
      "GITHUB_APP_PRIVATE_KEY is not set. GitHub App connect is setup pending.",
    ]) {
      expect({ error, refused: refusedTool([call({ error })]) !== null }).toEqual({
        error,
        refused: true,
      });
    }
  });

  /**
   * F-57 — GitHub answers 404, not 401, for a repo an App installation cannot
   * see, on purpose, so private repos do not leak their existence. A bare 404
   * can never be a refusal sign (see the negatives below), so the tool layer
   * stamps ONE pinned sentence when — and only when — the 404 was on the
   * repository ROOT of a repo a workspace binding names. The error here is
   * built FROM the imported constant, never retyped: if the stamp and the sign
   * ever drift apart, this test is the one that says so.
   */
  it("catches the stamped repo-root 404, which is a locked door wearing a 404", () => {
    const stamped =
      `GitHub answered 404 for the repository root of o/r, which the workspace binding names — ` +
      `${REPO_ROOT_ACCESS_REFUSED}. Grant the GitHub App access to o/r, or re-bind the repo on Connectors.`;
    const hit = refusedTool([call({ name: "repo.tree", error: stamped })]);
    expect(hit).not.toBeNull();
    expect(hit?.tool).toBe("repo.tree");
  });

  /** R-16 asks for a failure that NAMES what failed. */
  it("returns the tool and the message, so the hold can say which door", () => {
    const hit = refusedTool([call({ name: "studio.commit", error: "401 Bad credentials" })]);
    expect(hit?.tool).toBe("studio.commit");
    expect(hit?.error).toContain("401");
  });
});

describe("what must NOT count, which is what keeps the hold honest", () => {
  /**
   * THE ASSERTION THAT MATTERS MOST. A widened list would let a real defect
   * claim it was refused, and the attempts ceiling would stop protecting
   * anything at all.
   */
  it("ignores ordinary tool failures, which ARE the station's problem", () => {
    for (const error of [
      "opportunity_id must be a uuid",
      "Not found",
      "prd.draft requires either opportunity_id or brief",
      "rate limited, try again",
      "unexpected end of JSON input",
    ]) {
      expect({ error, refused: refusedTool([call({ error })]) !== null }).toEqual({
        error,
        refused: false,
      });
    }
  });

  /**
   * The narrowness F-57 depends on. Only the ROOT of a bound repo earns the
   * stamp, and only the stamp is a sign — a 404 on a deeper path is a wrong
   * file name, and a bare root 404 with no binding proves nothing about
   * access. If either of these ever counted, every typo'd path would file
   * `tools-refused` and stop the attempts ceiling from protecting anything.
   */
  it("ignores plain GitHub 404s, which are the station's own problem", () => {
    for (const error of [
      'GitHub 404 on /repos/o/r/contents/src/x.ts: {"message":"Not Found"}',
      "GitHub 404 on /repos/o/r: Not Found",
    ]) {
      expect({ error, refused: refusedTool([call({ error })]) !== null }).toEqual({
        error,
        refused: false,
      });
    }
  });

  /** A person declining an approval is governance working, not a broken door. */
  it("ignores a denied approval", () => {
    expect(refusedTool([call({ status: "denied", error: "403 forbidden" })])).toBeNull();
  });

  it("ignores a step that is not a tool call, and one that succeeded", () => {
    expect(refusedTool([{ kind: "final", status: "error", error: "401" }])).toBeNull();
    expect(refusedTool([call({ status: "executed", error: "401" })])).toBeNull();
  });

  it("ignores an error-less error step rather than guessing", () => {
    expect(refusedTool([call({ error: "" })])).toBeNull();
    expect(refusedTool([call({ error: null })])).toBeNull();
  });

  it("is null on an empty run", () => {
    expect(refusedTool([])).toBeNull();
  });
});

describe("the hold stops the loop spending on a locked door", () => {
  /**
   * Terminal for the SWEEP. `RESUMABLE_HOLDS` works by re-checking whether an
   * ask has been met, and "is GitHub reachable again" can only be answered by
   * dispatching a paid run — so a resumable version would spend an agent every
   * tick to be told no.
   */
  it("is terminal, so the sweep stops giving it slots", () => {
    expect(TERMINAL_HOLDS).toContain("tools-refused");
  });

  /**
   * The line must not promise a retry, because there will not be one and
   * `produced-nothing` promising exactly that is how this went unnoticed for
   * three attempts and a correction.
   */
  it("does not tell the person it will try again", () => {
    expect(HOLD_LINE["tools-refused"].toLowerCase()).not.toContain("try again");
    expect(HOLD_LINE["tools-refused"]).toContain("Reconnect it");
  });

  it("says plainly that it is the connection and not the work", () => {
    expect(HOLD_LINE["tools-refused"]).toContain("the connection rather than the work");
  });

  it("is named after the station it happened at, like the other station holds", () => {
    expect(holdLine("tools-refused", { station: "build" })).not.toContain("This station");
  });
});

/**
 * THE FIRST VERSION OF THIS FIX SHIPPED, DEPLOYED, AND DID NOT FIRE.
 *
 * It read only the in-memory `LoopStep[]` the dispatch returned. On 2026-08-25
 * it was live for the 05:20 tick on track `8391835f` and the station still held
 * `produced-nothing`, while `tool_calls` carried the proof — twice, at 05:10:12
 * and 05:20:12:
 *
 *   repo.tree | ok=false | "GitHub 401 on /repos/RohitGajaraj/Test-Project-Cadence"
 *
 * The step plumbing between the dispatch and the verdict is not something the
 * driver can observe from where the verdict is made, and **a fix that depends on
 * something it cannot check is a fix that cannot be trusted**. So the record is
 * now the authority: `tool_calls` is written by the tool layer itself, which is
 * the same evidence a person would use to answer the question.
 *
 * `trace_id` is the only key the two tables share — `agent_runs` has no
 * `trace_id` column (confirmed: the join errors with 42703) — which is why the
 * ids are carried down from each `runAgentLoop` result rather than looked up.
 */
describe("the refusal is proved against the record, not only the run's own account", () => {
  const SERVER = readFileSync(
    fileURLToPath(new URL("./driver.server.ts", import.meta.url)),
    "utf8",
  );
  const SERVER_CODE = SERVER.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  it("collects the trace of every seat it dispatches", () => {
    expect(SERVER_CODE).toContain("if (result.trace_id) traceIds.push(result.trace_id);");
  });

  it("falls back to tool_calls when the steps did not carry it", () => {
    expect(SERVER_CODE).toContain("refusedToolInTraces");
    expect(SERVER_CODE).toMatch(/refusedTool\(steps\) \?\? \(await refusedToolInTraces/);
  });

  /** Cheap path first: no query at all when the steps already answer. */
  it("only queries when the in-memory account came up empty", () => {
    expect(SERVER_CODE).toMatch(/refusedTool\(steps\) \?\?/);
  });

  /** And only on the path where the station already filed nothing. */
  it("never runs on a station that produced", () => {
    expect(SERVER_CODE).toMatch(/producedThisVisit\s*\n?\s*\?\s*null/);
  });

  it("joins on trace_id, the only key the two tables share", () => {
    expect(SERVER_CODE).toContain('.in("trace_id", traceIds)');
    expect(SERVER_CODE).toContain('.eq("ok", false)');
  });

  /**
   * A read that failed proves nothing, so it claims nothing — the same rule
   * `getTrackArtifacts` follows for `missing`. Reporting "refused" because the
   * query broke would be the same class of lie in the other direction.
   */
  it("claims nothing when its own read fails", () => {
    expect(SERVER_CODE).toContain("if (error || !data) return null;");
  });
});
