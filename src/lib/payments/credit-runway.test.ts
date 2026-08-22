/**
 * Two invariants, and they fail for different reasons.
 *
 *  1. A REFUSAL TO SPEND IS NOT A MODEL FAILING. The credit halt's message is
 *     the only channel the callers that record `agent_runs.failure_kind` ever
 *     read, so the wording IS the taxonomy. This pins the wording against the
 *     classifier that consumes it, and against the CHECK constraint that has to
 *     accept the answer, because a value outside that list is swallowed by a
 *     `catch` and the row simply loses its kind.
 *
 *  2. THE WARNING IS DENOMINATED IN TIME. Every case here is calculated from
 *     the production burn measured on 2026-08-22 (731 credits over 80.15
 *     minutes on the one real workspace = 9.12 credits a minute), so a change
 *     that quietly reverts the threshold to a fixed count fails on numbers that
 *     actually happened rather than on invented ones.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";

import { classifyFailureCode } from "@/lib/observability/gates";
import { LOW_CREDITS_WARN } from "@/lib/entitlements";
import {
  BURN_WINDOW_MINUTES,
  RUNWAY_WARN_MINUTES,
  burnPerMinute,
  runwayMessage,
  runwayMinutes,
  shouldWarnRunway,
  warnThresholdCredits,
} from "./credit-runway";

/** Production, 2026-08-22, workspaces.is_sample = false, surface 'agent'. */
const OBSERVED_CREDITS = 731;
const OBSERVED_MINUTES = 80.15;
const OBSERVED_RATE = OBSERVED_CREDITS / OBSERVED_MINUTES; // 9.12 credits/min
const FREE_GRANT = 750;

const RUNTIME = readFileSync(join(process.cwd(), "src", "lib", "ai", "runtime.server.ts"), "utf8");

describe("the credit refusal is classified as money, not as a model failure", () => {
  /** The sentence `assertAccountCredits` actually throws, rendered with real numbers. */
  function thrownRefusalMessage(): string {
    // Pinned against the source rather than by importing the module: importing
    // runtime.server.ts pulls the whole chokepoint (and its env) into a unit
    // test, and what needs guarding is the literal a future edit would reword.
    //
    // Anchored on the two interpolations rather than on "the first backtick
    // after the constructor", because the argument for this wording is written
    // in the comment directly above it and that prose quotes identifiers in
    // backticks — a positional match reads the comment, not the code.
    const body = RUNTIME.slice(RUNTIME.indexOf("new CreditExhaustedError("));
    const m = body.match(/`([^`]*\$\{balance\}[^`]*\$\{projected\}[^`]*)`/);
    expect(m).not.toBeNull();
    return (m![1] as string).replace("${balance}", "0").replace("${projected}", "16");
  }

  test("the thrown message classifies as budget_kill", () => {
    expect(classifyFailureCode(thrownRefusalMessage())).toBe("budget_kill");
  });

  test("it is specifically NOT model_error", () => {
    // The whole defect in one line. Production carried 381 agent_runs rows with
    // failure_kind='model_error' and all 381 were this refusal.
    expect(classifyFailureCode(thrownRefusalMessage())).not.toBe("model_error");
  });

  test("the wording this replaced is the one that fell through to model_error", () => {
    // Kept so the reason the sentence is worded this way cannot be lost.
    expect(
      classifyFailureCode("Account credit balance (0) is below the projected cost (16)."),
    ).toBe("model_error");
  });

  test("the kind it now produces is a legal agent_runs.failure_kind", () => {
    // A value outside the CHECK list is rejected by Postgres, and every writer
    // wraps that update in a try/catch that only console.errors — so an illegal
    // kind does not fail loudly, it just leaves the column null again.
    const dir = join(process.cwd(), "supabase", "migrations");
    const defining = readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .sort()
      .map((f) => readFileSync(join(dir, f), "utf8"))
      .filter((sql) => sql.includes("failure_kind in ("));
    expect(defining.length).toBeGreaterThan(0);
    const last = defining[defining.length - 1]!;
    const list = last.slice(last.indexOf("failure_kind in ("));
    expect(list).toContain("'budget_kill'");
  });
});

describe("burn rate", () => {
  test("a window with no debits is not a rate", () => {
    expect(burnPerMinute(0, BURN_WINDOW_MINUTES)).toBe(0);
  });

  test("a zero-length window cannot produce a rate", () => {
    expect(burnPerMinute(500, 0)).toBe(0);
  });

  test("reproduces the observed production rate", () => {
    expect(burnPerMinute(OBSERVED_CREDITS, OBSERVED_MINUTES)).toBeCloseTo(9.12, 2);
  });
});

describe("runway", () => {
  test("an idle account has unbounded runway, not zero", () => {
    // The trap this exists to avoid: reading 'not spending' as 'about to die'
    // and mailing every quiet account.
    expect(runwayMinutes(500, 0)).toBe(Number.POSITIVE_INFINITY);
  });

  test("an empty balance has no runway at any rate", () => {
    expect(runwayMinutes(0, OBSERVED_RATE)).toBe(0);
  });

  test("the old fixed threshold was eleven minutes of the observed burn", () => {
    // This is the finding, asserted rather than described.
    expect(runwayMinutes(LOW_CREDITS_WARN, OBSERVED_RATE)).toBeCloseTo(11.0, 1);
  });
});

describe("the warn threshold is derived from the account's own burn", () => {
  test("an idle account keeps exactly today's behaviour", () => {
    expect(warnThresholdCredits(0, FREE_GRANT)).toBe(LOW_CREDITS_WARN);
  });

  test("it can never warn later than the banner it supersedes", () => {
    for (const rate of [0, 0.01, 0.5, 1, 5, 9.12, 100]) {
      expect(warnThresholdCredits(rate, FREE_GRANT)).toBeGreaterThanOrEqual(LOW_CREDITS_WARN);
    }
  });

  test("at the observed burn it is 548 credits, not 100", () => {
    // 9.12 credits/min * 60 min. Five and a half times the old threshold, and
    // the thing that turns eleven minutes of notice into sixty.
    expect(warnThresholdCredits(OBSERVED_RATE, FREE_GRANT)).toBe(
      Math.ceil(OBSERVED_RATE * RUNWAY_WARN_MINUTES),
    );
    expect(warnThresholdCredits(OBSERVED_RATE, FREE_GRANT)).toBe(548);
  });

  test("it is capped at the grant, because a grant smaller than the lead time cannot be warned about early", () => {
    // 20 credits a minute for an hour is 1,200 credits against a 750 grant:
    // there is no balance at which an hour's notice exists, so the cap makes the
    // threshold the grant itself rather than a number that fires on call one of
    // every cycle and stops meaning anything.
    expect(warnThresholdCredits(20, FREE_GRANT)).toBe(FREE_GRANT);
  });
});

describe("the warn decision", () => {
  const base = {
    projected: 16,
    ratePerMinute: OBSERVED_RATE,
    monthlyGrantCredits: FREE_GRANT,
  };

  test("fires while there is still an hour of work left to save", () => {
    const v = shouldWarnRunway({ ...base, balance: 560 });
    expect(v.warn).toBe(true);
    expect(v.thresholdCredits).toBe(548);
  });

  test("stays quiet on a full pool", () => {
    expect(shouldWarnRunway({ ...base, balance: 750 }).warn).toBe(false);
  });

  test("stays quiet on an idle account however low the balance", () => {
    expect(shouldWarnRunway({ ...base, balance: 120, ratePerMinute: 0 }).warn).toBe(false);
  });

  test("does not warn about a pool that is already gone", () => {
    // The refusal owns that story. A 'running low' mail alongside a halt is noise.
    expect(shouldWarnRunway({ ...base, balance: 10 }).warn).toBe(false);
  });

  test("fires on a burst that lifted the threshold past a balance already under it", () => {
    // The case a was-above/is-below crossing test cannot see, which is why the
    // decision is a level and not an edge: the account was under 548 before the
    // rate that made 548 the threshold was ever measured.
    const v = shouldWarnRunway({ ...base, balance: 300 });
    expect(v.warn).toBe(true);
  });

  test("reports the runway it is warning about", () => {
    const v = shouldWarnRunway({ ...base, balance: 560 });
    expect(v.minutesLeft).toBeCloseTo((560 - 16) / OBSERVED_RATE, 1);
    expect(v.minutesLeft).toBeLessThan(RUNWAY_WARN_MINUTES);
  });
});

describe("the message a person actually receives", () => {
  test("carries the balance, the rate and the time left", () => {
    const v = shouldWarnRunway({
      balance: 560,
      projected: 16,
      ratePerMinute: OBSERVED_RATE,
      monthlyGrantCredits: FREE_GRANT,
    });
    const msg = runwayMessage(v, 544);
    expect(msg).toContain("544 AI credits left");
    expect(msg).toContain("9.1 credits a minute");
    expect(msg).toMatch(/about 60 minutes of agent work/);
  });

  test("says nothing about a rate when there is no rate to report", () => {
    const v = shouldWarnRunway({
      balance: 120,
      projected: 1,
      ratePerMinute: 0,
      monthlyGrantCredits: FREE_GRANT,
    });
    expect(runwayMessage(v, 119)).not.toContain("credits a minute");
  });
});
