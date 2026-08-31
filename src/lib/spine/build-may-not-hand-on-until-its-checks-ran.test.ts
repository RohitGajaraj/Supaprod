/**
 * BUILD MAY NOT HAND ON UNTIL ITS CHECKS HAVE RUN — F-148, 2026-08-31.
 *
 * ── WHAT WAS WRONG ────────────────────────────────────────────────────────
 * Build's self-check asked for artifact kind `mission`. **The driver writes that
 * itself, at `driver.server.ts:773`, BEFORE any seat runs** — so the only thing
 * the branch asked for was already true every time it was asked, and Build's
 * self-check has never once refused a hand-on. `SPEC-AI-NATIVE-SDLC.md` §2 says
 * it plainly: what shipped as F-76 is a FILING check, not a verification check.
 *
 * Real execution existed the whole time at `studio.checks.run` — a sandboxed
 * clone taking real exit codes from tsc, bun test and lint — as **one skippable
 * instruction with no gate behind it**. Measured 2026-08-31 it had run **ONCE in
 * the product's life**, against 48 `studio.commit`, 9 `studio.pr.open` and 7
 * `studio.pr.merge`.
 *
 * ── WHY IT READS `may_proceed` RATHER THAN RECOMPUTING ────────────────────
 * That is the tool's own word, and it is false BOTH when a check fails AND when
 * the sandbox could not run — the tool "never reports green for checks that did
 * not run". Recomputing from exit codes here would lose the second case, which
 * is the one that matters: a sandbox that could not start is not a pass.
 */
import { describe, expect, it } from "bun:test";

import { verifyStationOutput } from "./driver.server";

/** The one artifact kind Build's old branch asked for — written by the driver. */
const mission = [{ artifactKind: "mission", artifactId: "m1" }] as never;

/**
 * A client that answers the two reads the gate makes: the track's runs, then the
 * newest `studio.checks.run` on those traces.
 */
const client = (opts: { traces?: string[]; result?: unknown; runErr?: string; callErr?: string }) =>
  ({
    from: (table: string) => {
      if (table === "agent_runs") {
        const rows = (opts.traces ?? []).map((t) => ({ trace_id: t }));
        return {
          select: () => ({
            eq: () => ({
              not: async () =>
                opts.runErr
                  ? { data: null, error: { message: opts.runErr } }
                  : { data: rows, error: null },
            }),
          }),
        };
      }
      // tool_calls
      return {
        select: () => ({
          eq: () => ({
            in: () => ({
              order: () => ({
                limit: async () =>
                  opts.callErr
                    ? { data: null, error: { message: opts.callErr } }
                    : {
                        data: opts.result === undefined ? [] : [{ result: opts.result }],
                        error: null,
                      },
              }),
            }),
          }),
        }),
      };
    },
  }) as never;

describe("F-148 · the gate refuses what the filing check could not", () => {
  it("REFUSES when the checks were never run, which is the whole finding", async () => {
    const v = await verifyStationOutput(client({ traces: ["t1"] }), "build", mission, "track-1");
    expect(v.passed).toBe(false);
    expect(v.reason).toContain("never run");
    // It names the tool, because a refusal that does not say the next action is
    // a raw error wearing a sentence (standard #3).
    expect(v.reason).toContain("studio.checks.run");
  });

  it("REFUSES a red verdict and carries the tool's own reason", async () => {
    const v = await verifyStationOutput(
      client({ traces: ["t1"], result: { may_proceed: false, reason: "tsc exited 2" } }),
      "build",
      mission,
      "track-1",
    );
    expect(v.passed).toBe(false);
    expect(v.reason).toContain("tsc exited 2");
  });

  it("REFUSES when the sandbox could not run, which is NOT a pass", async () => {
    // `may_proceed` is false for infra failure too. Recomputing from exit codes
    // would have called this green, which is the case the tool exists to prevent.
    const v = await verifyStationOutput(
      client({ traces: ["t1"], result: { may_proceed: false } }),
      "build",
      mission,
      "track-1",
    );
    expect(v.passed).toBe(false);
    expect(v.reason).toContain("did not clear");
  });

  it("passes only on an explicit may_proceed", async () => {
    const v = await verifyStationOutput(
      client({ traces: ["t1"], result: { may_proceed: true } }),
      "build",
      mission,
      "track-1",
    );
    expect(v.passed).toBe(true);
  });

  it("a MISSING may_proceed is not a pass — absent is not true", async () => {
    const v = await verifyStationOutput(
      client({ traces: ["t1"], result: {} }),
      "build",
      mission,
      "track-1",
    );
    expect(v.passed).toBe(false);
  });
});

describe("F-148 · and the ways it deliberately does NOT refuse", () => {
  it("NOTHING FILED AT ALL never reaches this branch, and that is F-76 not a hole", async () => {
    /*
     * I asserted the opposite first and the code was right. An empty attachment
     * list is caught upstream by `verifyStationOutput`'s own "nothing to read is
     * not a verdict" block, so it never reaches Build's branch and never becomes
     * "no changes were staged".
     *
     * That distinction is the whole of F-76: a station that filed NOTHING is
     * unknowable and is held as `produced-nothing`, which is a different hold
     * with a different remedy from a station that filed something failing its
     * own check. Collapsing them would send a person to inspect a station that
     * is waiting on a crew, or the reverse.
     */
    const v = await verifyStationOutput(client({}), "build", [] as never, "track-1");
    expect(v.passed).toBe(true);
  });

  it("but a change filed with NO mission kind is still refused by the filing check", async () => {
    const v = await verifyStationOutput(
      client({ traces: ["t1"] }),
      "build",
      [{ artifactKind: "prd", artifactId: "p1" }] as never,
      "track-1",
    );
    expect(v.passed).toBe(false);
    expect(v.reason).toContain("staged");
  });

  it("NO trackId degrades to the old filing check, stated rather than discovered", async () => {
    // Two of three call sites only want a reason string for a note; a note does
    // not re-run a gate. The enforcing site passes the track.
    const v = await verifyStationOutput(client({}), "build", mission);
    expect(v.passed).toBe(true);
  });

  it("an UNTRACED run is unknowable, not failing (F-76)", async () => {
    const v = await verifyStationOutput(client({ traces: [] }), "build", mission, "track-1");
    expect(v.passed).toBe(true);
  });

  it("A FAILED READ PASSES, and that is a decision rather than a default", async () => {
    /*
     * Failing closed here would park every Build on this track permanently the
     * moment a query broke, in the hold that counts an attempt, and no operator
     * action clears a gate that is wrong about itself. Failing open loses one
     * gate on one drive; the next drive re-asks.
     */
    expect(
      (await verifyStationOutput(client({ runErr: "boom" }), "build", mission, "track-1")).passed,
    ).toBe(true);
    expect(
      (
        await verifyStationOutput(
          client({ traces: ["t1"], callErr: "boom" }),
          "build",
          mission,
          "track-1",
        )
      ).passed,
    ).toBe(true);
  });
});
