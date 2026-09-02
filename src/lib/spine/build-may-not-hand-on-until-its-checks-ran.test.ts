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
 * A client that answers the three reads the gate makes: the track's runs, the
 * newest `studio.checks.run` on those traces, and the newest changeset's review.
 *
 * The third arrived with the acceptance gate. It defaults to a changeset with no
 * review, which is what every track in the product looked like before
 * `studio.review` was given the spec -- so every assertion below still measures
 * the CI gate alone, and none of them silently started measuring two things.
 */
const client = (opts: {
  traces?: string[];
  result?: unknown;
  runErr?: string;
  callErr?: string;
  /** `code_review` on the newest changeset, when a test wants the third read. */
  review?: unknown;
  reviewErr?: string;
}) =>
  ({
    from: (table: string) => {
      /*
       * THE JOIN IS TWO STEPS, because `studio_changesets` has no `track_id`.
       * The gate reads the track's `mission` members and then the newest
       * changeset on those missions -- see `newestChangesetForTrack`. Both hops
       * are faked here rather than one, because a fake that answered the old
       * one-hop query would have kept passing while the real query returned
       * nothing, which is precisely how this defect survived.
       */
      if (table === "spine_track_members") {
        return {
          select: () => ({
            eq: () => ({
              eq: async () => ({ data: [{ artifact_id: "mission-1" }], error: null }),
            }),
          }),
        };
      }
      if (table === "studio_changesets") {
        return {
          select: () => ({
            in: () => ({
              order: () => ({
                limit: async () =>
                  opts.reviewErr
                    ? { data: null, error: { message: opts.reviewErr } }
                    : { data: [{ code_review: opts.review ?? null }], error: null },
              }),
            }),
          }),
        };
      }
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

/**
 * ── AND DOES IT DO WHAT WAS ASKED FOR — P-02, 2026-09-03 ──────────────────
 *
 * The gate above asks whether CI went green. A change can pass it and build the
 * wrong thing, and Build had no other way to catch that: the qa seat's brief
 * says "Check the change against the spec", and until P-02 `studio.review` had
 * never been shown a spec.
 *
 * It has now, and it returns a verdict per acceptance line. This third check
 * reads that conclusion rather than forming its own -- the same relationship the
 * CI gate has with `studio.checks.run`, and for the same reason: a gate that
 * recomputes its own evidence can disagree with the tool that produced it.
 *
 * A refusal here is the SEND-BACK. It sets `self-check-failed`, which counts an
 * attempt and re-runs Build with `selfCheckNote` naming what its own check
 * refused, so a missed acceptance line returns the work to the builder once
 * rather than being a sentence on a screen nobody acts on.
 */
describe("P-02 · the change has to do what the spec asked for", () => {
  const green = { may_proceed: true };
  const build = (review: unknown) =>
    verifyStationOutput(
      client({ traces: ["t1"], result: green, review }),
      "build",
      mission,
      "track-1",
    );

  it("REFUSES a change the reviewer said missed an acceptance line", async () => {
    const v = await build({
      compared: [
        { line: "The card form accepts an Amex number", held: true },
        { line: "The error names the failing field", held: false, why: "no field is named" },
      ],
    });
    expect(v.passed).toBe(false);
    // Names the line, because "it does not meet the spec" is not something a
    // builder can act on and the line is.
    expect(v.reason).toContain("The error names the failing field");
    expect(v.reason).toContain("1 line");
  });

  it("names several, but not twenty, because the reason is a sentence a person reads", async () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ line: `line ${i}`, held: false }));
    const v = await build({ compared: many });
    expect(v.passed).toBe(false);
    /*
     * THE COUNT IS NOT BOUNDED AND THE LIST IS, and this assertion is why the
     * distinction is written down. The first version of the gate sliced before
     * counting, so nine failing lines reported as five -- a wrong number in
     * front of a person, which is the class of defect this whole packet is
     * about, reproduced inside the fix for it.
     */
    expect(v.reason).toContain("9 lines");
    expect(v.reason).toContain("line 4");
    expect(v.reason).not.toContain("line 5");
    // And it says what it left out rather than trailing off.
    expect(v.reason).toContain("and 4 more");
  });

  it("PASSES when every line held", async () => {
    const v = await build({ compared: [{ line: "The card form accepts Amex", held: true }] });
    expect(v.passed).toBe(true);
  });

  it("PASSES when the spec stated no acceptance lines, which is 117 of 119 specs", async () => {
    /*
     * THE ONE THAT KEEPS THIS GATE FROM PARKING THE PRODUCT. A gate that
     * demanded lines would refuse almost every track in the database on its
     * first Build. No lines is not evidence the change is wrong.
     */
    for (const review of [null, {}, { compared: [] }, { compared: "nope" }, "not json"]) {
      expect((await build(review)).passed).toBe(true);
    }
  });

  it("reads the column whether it arrives as an object or a string", async () => {
    // `code_review` is Json and arrives stringified through at least one path.
    const v = await build(JSON.stringify({ compared: [{ line: "a line", held: false }] }));
    expect(v.passed).toBe(false);
    expect(v.reason).toContain("a line");
  });

  it("does not treat a missing held as a pass", async () => {
    // The safe direction: an unreadable judgment must not read as approval.
    const v = await build({ compared: [{ line: "a line" }] });
    expect(v.passed).toBe(false);
  });

  it("drops a line with no text rather than refusing over a blank", async () => {
    const v = await build({ compared: [{ line: "   ", held: false }] });
    expect(v.passed).toBe(true);
  });

  it("A FAILED READ PASSES here too, on the same reasoning as the two above", async () => {
    const v = await verifyStationOutput(
      client({ traces: ["t1"], result: green, reviewErr: "boom" }),
      "build",
      mission,
      "track-1",
    );
    expect(v.passed).toBe(true);
  });

  it("records the acceptance comparison, so a person can see it was made", async () => {
    // The self-check list is what `track_drives.self_check` stores and what the
    // strip counts. A gate that refuses without recording what it compared is
    // the invisibility this packet is closing, one layer down.
    const v = await build({ compared: [{ line: "a line", held: false }] });
    expect(v.checks.map((c) => c.what)).toContain("The change meets what the spec asked for");
    expect(v.checks.find((c) => c.what === "The change meets what the spec asked for")?.held).toBe(
      false,
    );
  });
});
