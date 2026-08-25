/**
 * THE ENUM AND THE CHECK CONSTRAINT MUST AGREE, and for a while they did not.
 *
 * ── THE DEFECT THIS PINS, WHICH WAS A LIVE CRASH ────────────────────────
 * `learning.record` accepted `verdict: z.enum(["validated","missed","mixed",
 * "uncertain"])` and its description said "Say uncertain rather than guessing".
 * `learnings.verdict` has carried `CHECK (verdict IN ('validated','missed',
 * 'mixed'))` since the table was created, in `20260611161500_f_v5_loop_close_
 * learnings.sql` and again in `20260611175350`, and no migration ever widened it.
 *
 * The insert is checked with `if (error) throw new Error(error.message)`. So an
 * agent that followed the tool's own instruction got a 23514 and the entire tool
 * call failed. The one path that was told to be honest was the one path that
 * crashed, and the more careful the agent, the more often it happened.
 *
 * ── WHY THE FIX IS NOT A FOURTH VALUE ───────────────────────────────────
 * Already ruled, in migration `20260806100000_a_bet_can_be_too_early_to_judge`:
 * a fourth value "would put a row in the precedent pool that every consumer must
 * remember to exclude... A deferral is the ABSENCE of an outcome, not a kind of
 * outcome, and it should not be stored where outcomes are stored." So the enum
 * narrows to the three the database permits, and the description tells an agent
 * with no evidence to not call the tool.
 *
 * WHAT THIS FILE CANNOT CHECK: that the constraint is what the migrations say.
 * Committed SQL is not applied SQL in this repo, and that is Claude's line. What
 * it can check is that the enum matches the constraint AS WRITTEN, and that the
 * failure message names it so the next person does not have to go looking.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { TOOL_REGISTRY } from "@/lib/ai/tools/registry.server";

const tool = TOOL_REGISTRY["learning.record"];

/** Exactly what `learnings_verdict_check` permits, per the creating migration. */
const PERMITTED = ["validated", "missed", "mixed"] as const;

const BASE = {
  summary: "The firmware notice cut reboot tickets from 41 a week to 12, which is past the target.",
};

function parse(input: Record<string, unknown>) {
  return tool.argsSchema.safeParse(input);
}

describe("the enum matches the CHECK constraint the database actually has", () => {
  it("accepts every permitted verdict", () => {
    for (const verdict of PERMITTED) {
      const result = parse({ ...BASE, verdict });
      expect(result.success, verdict).toBe(true);
    }
  });

  it("refuses `uncertain`, which is what used to crash the call", () => {
    /*
     * THE ASSERTION THAT IS THE WHOLE ITEM. If this ever passes again, an obedient
     * agent is getting a Postgres 23514 back instead of a recorded lesson, and the
     * only trace is a failed tool call.
     *
     * FAILURE MESSAGE NAMES THE CONSTRAINT ON PURPOSE. A bare "expected false, got
     * true" sends the next reader to this file; naming `learnings_verdict_check`
     * sends them to the table.
     */
    const result = parse({ ...BASE, verdict: "uncertain" });
    expect(
      result.success,
      "`uncertain` is back in the enum. `learnings.verdict` has CHECK (verdict IN ('validated','missed','mixed')) and the insert throws on error, so this value makes every honest agent call fail with a 23514. If a fourth verdict is genuinely wanted, migration 20260806100000 argues against it and that argument has to be answered first.",
    ).toBe(false);
  });

  it("refuses every other plausible fourth value for the same reason", () => {
    // The shapes somebody would reach for next. All four are the same mistake:
    // storing a deferral where outcomes are stored.
    for (const verdict of ["too_early", "unknown", "pending", "inconclusive", "hold"]) {
      expect(parse({ ...BASE, verdict }).success, verdict).toBe(false);
    }
  });

  it("has exactly three values, so a fourth cannot arrive unnoticed", () => {
    /*
     * Counted rather than listed, because adding a value and adding a test for it
     * is the pattern that keeps an enum and a constraint in step only until
     * somebody adds the value and forgets the test.
     */
    const accepted = [
      ...PERMITTED,
      "uncertain",
      "too_early",
      "unknown",
      "pending",
      "inconclusive",
    ].filter((verdict) => parse({ ...BASE, verdict }).success);
    expect(accepted).toEqual([...PERMITTED]);
  });

  it("still requires a verdict at all", () => {
    expect(parse(BASE).success).toBe(false);
  });
});

describe("the enum and the migration are read from the same place", () => {
  it("finds the constraint in the creating migration, so this file is not guessing", () => {
    /*
     * The transcription guard. `PERMITTED` above is a hand-copied list, and a
     * hand-copied list is exactly what drifts. This reads the migration and
     * asserts the three values are in its CHECK, so if the constraint text ever
     * changes in a NEW migration this test still passes and the one below is the
     * one that would need updating: this asserts the ORIGIN, not the current state,
     * which is why the log says the applied state is Claude's to confirm.
     */
    const sql = readFileSync(
      join(
        import.meta.dir,
        "../../../../../supabase/migrations/20260611161500_f_v5_loop_close_learnings.sql",
      ),
      "utf8",
    );
    const line = sql.split("\n").find((l) => l.includes("verdict") && l.includes("CHECK"));
    expect(line, "the creating migration no longer has a verdict CHECK").toBeTruthy();
    for (const verdict of PERMITTED) {
      expect(line, `${verdict} is not in the constraint`).toContain(`'${verdict}'`);
    }
    expect(line, "the constraint mentions a fourth value").not.toContain("uncertain");
  });
});

describe("the description no longer instructs the agent into a crash", () => {
  const description = tool.description;

  it("does not tell the agent to say `uncertain`", () => {
    // It used to say "Say uncertain rather than guessing", which named the one
    // value the database refuses.
    expect(description).not.toContain("uncertain");
  });

  it("names all three verdicts and says they are all there are", () => {
    for (const verdict of PERMITTED) {
      expect(description, verdict).toContain(verdict);
    }
    expect(description).toContain("the only verdicts there are");
  });

  it("tells an agent with no evidence to not call the tool", () => {
    /*
     * AND NOT TO DEFER, which is the correction worth holding. `prds.outcome_check_by`
     * is the deferral mechanism and it is HUMAN-ONLY: `rearmOutcomeCheck` is reached
     * from `learn/SettlePanel.tsx` and `outcome.functions.ts` and from no agent tool
     * at all. Pointing an agent at it would be pointing it at a hand it does not
     * have, which is the class of claim this repo calls a claim outrunning its
     * wiring, and it would fail as silently as the crash it replaced.
     */
    expect(description).toContain("DO NOT CALL THIS TOOL");

    /*
     * The word "deferral" IS in the description, and correctly: it quotes the
     * ruling for why a fourth verdict does not exist. What must not be there is an
     * instruction to the agent to do the deferring, or the name of the mechanism,
     * because both would point at a hand it does not have. So this checks the
     * imperative forms rather than the noun.
     */
    const said = description.toLowerCase();
    for (const instruction of ["defer it", "defer this", "defer instead", "outcome_check_by"]) {
      expect(said, `it tells the agent to ${instruction}`).not.toContain(instruction);
    }
  });

  it("keeps the ruling's own words for why a deferral is not a verdict", () => {
    expect(description).toContain("absence of an outcome rather than a kind of one");
  });

  it("says what waiting costs, because an agent weighs that against guessing", () => {
    // "nothing is lost by waiting" is the half that makes the instruction
    // followable. Without it, an agent under pressure to file something files
    // something.
    expect(description).toContain("nothing is lost by waiting");
    expect(description).toContain("compounds into later guidance");
  });
});

describe("what a verdict is worth downstream", () => {
  it("previews the verdict it was given", () => {
    expect(tool.preview({ ...BASE, verdict: "missed" })).toContain("missed");
  });

  it("treats all three as equally worth remembering", () => {
    /*
     * `importance` was `a.verdict === "uncertain" ? 3 : 5` and that ternary is now
     * dead: every verdict this tool can be handed is decisive. A `mixed` lesson is
     * not worth less than a `missed` one, it is harder to act on, which is a
     * property of the text rather than of its importance.
     *
     * Asserted against the source because `importance` is passed to
     * `rememberOutcome` inside `run`, which needs a database to reach.
     */
    const source = readFileSync(join(import.meta.dir, "../registry.server.ts"), "utf8");
    // Bounded by the NEXT tool definition rather than a fixed character count.
    // The magic number was 20,000 and F-65's comment pushed `importance: 5,`
    // past it, so the test failed on a change that could not affect what it
    // asserts. A window that ends where the tool ends cannot rot that way.
    const at = source.indexOf('name: "learning.record"');
    const next = source.indexOf('name: "', at + 40);
    const body = source.slice(at, next > at ? next : source.length);
    expect(body).toContain("importance: 5,");
    expect(body.replace(/\/\*[\s\S]*?\*\//g, "")).not.toContain('=== "uncertain"');
  });
});
