/**
 * A TURN REPORTS WHAT THE RECORD MEASURED, AND NOTHING THE AGENT SAID.
 *
 * ── WHY THIS FILE EXISTS ────────────────────────────────────────────────
 * The transcript now prints a per-turn rollup: how long the seat worked, what it
 * burned, and why it stopped. Every one of those three has an obvious wrong
 * implementation that typechecks, passes review, and lies:
 *
 *   1. TREAT A ZERO AS A MEASUREMENT. Counted on production 2026-08-25 over the
 *      2,272 runs carrying a `track_id`: `duration_ms` is a real elapsed time on
 *      1,355, NULL on 175, and a hardcoded **0 on 742** -- and every single one
 *      of those 742 has `tokens_used > 0`, so not one is a run that genuinely
 *      took no time. `run-analytics.ts` names the cause independently in its own
 *      header: *"`duration_ms` was a hardcoded 0 in both finalize paths"*.
 *      Rendering that as `0s` puts a fabricated instant next to a 65,000-token
 *      turn. `tokens_used` is `NOT NULL`, so a hole in it can only be spelled 0,
 *      and 570 track-linked runs spell it that way.
 *
 *   2. READ THE REFUSAL OUT OF THE AGENT'S PROSE. On the fixture track the Build
 *      seat wrote *"I cannot proceed... the repository tree could not be
 *      retrieved"* onto a row whose own status column says `completed_with_failures`.
 *      Grading turns by that sentence is F-54's defect handed a bigger
 *      microphone: a seat's narrative disagreed with its own tool calls on every
 *      track since the checking seat existed. Only `halted_reason` and
 *      `failure_kind` are written by the platform, so only they may be quoted.
 *
 *   3. PRINT AN ENGINE SLUG. `halted_reason` holds TWO vocabularies at once and
 *      both are live: `out_of_credit` (8 rows) and a whole sentence the stall
 *      sweeper writes (8 rows). One needs spelling out and framing; the other
 *      would stutter if framed again.
 *
 * Every figure below is taken from real rows on track `7977dc06`, so a change
 * that breaks these breaks the screen a person is actually looking at.
 */
import { describe, expect, it } from "bun:test";

import { buildActivity, type MemberRow, type RunRow } from "./activity";

const run = (o: Partial<RunRow> & { id: string; created_at: string }): RunRow => ({
  agent_slug: "builder",
  agent_name: "Studio",
  status: "completed",
  output: null,
  spend_used_usd: 0,
  ...o,
});

/** One turn built from one row, which is all any of these needs. */
const turnOf = (o: Partial<RunRow>, members: MemberRow[] = []) =>
  buildActivity({
    runs: [run({ id: "r1", created_at: "2026-08-25T11:26:23Z", ...o })],
    members,
  })[0];

describe("how long the seat worked", () => {
  it("reports a real elapsed time", () => {
    // The Discovery Scout turn that opened the fixture track.
    expect(turnOf({ duration_ms: 76207 }).tookMs).toBe(76207);
  });

  it("refuses a hardcoded zero, which 742 track runs carry while burning tokens", () => {
    // THE FAIL DIRECTION. If this ever returns 0 the transcript prints "0s"
    // against a turn that spent 19,301 tokens, which is the exact class of claim
    // this product keeps filing findings about.
    expect(turnOf({ duration_ms: 0, tokens_used: 19301 }).tookMs).toBeNull();
  });

  it("refuses a null, and refuses it the same way as a zero", () => {
    expect(turnOf({ duration_ms: null }).tookMs).toBeNull();
    // Absent entirely, which is what a deploy that has not migrated the column
    // hands this module.
    expect(turnOf({}).tookMs).toBeNull();
  });

  it("refuses a value that is not a number at all", () => {
    expect(turnOf({ duration_ms: Number.NaN }).tookMs).toBeNull();
    expect(turnOf({ duration_ms: -1 }).tookMs).toBeNull();
  });
});

describe("what the turn burned", () => {
  it("reports a real count", () => {
    expect(turnOf({ tokens_used: 65732 }).tokens).toBe(65732);
  });

  it("reads a zero as a hole, because the column cannot spell one any other way", () => {
    // `tokens_used` is NOT NULL. 570 track-linked runs sit at 0, almost all of
    // them `failed`, and 397 of those carry `failure_kind: model_error` -- which
    // means they REACHED a model and the finalizer never wrote what it cost.
    expect(turnOf({ status: "failed", tokens_used: 0 }).tokens).toBeNull();
  });
});

describe("why the record says it stopped", () => {
  it("spells out the halt slug and frames it as a sentence", () => {
    // The one halted run on the fixture track.
    expect(turnOf({ status: "halted", halted_reason: "out_of_credit" }).stopLine).toBe(
      "Stopped: out of credit.",
    );
  });

  it("leaves a reason that is already prose exactly as the sweeper wrote it", () => {
    const written =
      "Stopped automatically: no progress for 4 hours. The run checkpointed and then went quiet, so its worker is presumed gone. Nothing it had already done was undone.";
    expect(turnOf({ status: "halted", halted_reason: written }).stopLine).toBe(written);
  });

  it("falls back to the failure kind, which is always a slug", () => {
    expect(turnOf({ status: "failed", failure_kind: "model_error" }).stopLine).toBe(
      "Stopped: model error.",
    );
  });

  it("prefers the halt reason when a row carries both", () => {
    expect(
      turnOf({ status: "halted", halted_reason: "out_of_credit", failure_kind: "model_error" })
        .stopLine,
    ).toBe("Stopped: out of credit.");
  });

  it("says nothing when neither column says anything", () => {
    // `outcome` already carries THAT it stopped. This carries WHY, and there is
    // no honest why here, so there is no line.
    expect(turnOf({ status: "failed" }).stopLine).toBeNull();
    expect(turnOf({ status: "halted", halted_reason: "   " }).stopLine).toBeNull();
  });

  it("NEVER reads the agent's own words, however plainly they admit a refusal", () => {
    /*
     * THE ONE THAT MATTERS. This is the real output of the Build seat on track
     * 7977dc06, on a row whose status column says it completed. A future edit
     * that scans this text for "cannot proceed" would make the screen more
     * dramatic and less true, and it would be inheriting F-54 wholesale.
     */
    const t = turnOf({
      status: "completed_with_failures",
      output:
        "Repository access failed: GitHub 404 on /repos/RohitGajaraj/helio-prism-build. I cannot proceed with implementation work without mapping the project structure first.",
    });
    expect(t.stopLine).toBeNull();
    // The prose is still carried, verbatim, for a person to read beside the
    // record. It is shown; it is never graded.
    expect(t.said).toContain("I cannot proceed");
  });
});

describe("the turn still carries what it filed, which is the unfakeable half", () => {
  it("credits the artifact that landed inside the turn's window", () => {
    const t = turnOf({ id: "r1", created_at: "2026-08-25T11:23:03Z" }, [
      {
        artifact_kind: "prd",
        artifact_id: "b401ccd4-030a-47b9-adb9-507f153d2f71",
        station: "define",
        created_at: "2026-08-25T11:23:46Z",
      },
    ]);
    expect(t.made).toEqual([
      { kind: "prd", word: "spec", id: "b401ccd4-030a-47b9-adb9-507f153d2f71" },
    ]);
  });

  it("leaves a refused turn with an empty list, whatever its status says", () => {
    expect(turnOf({ status: "completed_with_failures" }).made).toEqual([]);
  });
});
