/**
 * A SCREEN THAT HAS STOPPED SCREENING LOOKS EXACTLY LIKE ONE NOTHING TRIPS.
 *
 * `guardrail_hits` on the live database: 10 rows in June, 8,525 in July across
 * 9 workspaces, and then a cliff. The newest row is 2026-07-25 while `agent_runs`
 * carries 2,570 runs in the 30 days since, against 27 enabled rules. The page
 * showed a list of July rows and said nothing about the gap.
 *
 * These are the four things the line above that list must not get wrong.
 */
import { describe, it, expect } from "bun:test";
import { guardrailSilence, QUIET_DAYS } from "../guardrail-silence";

const DAY = 86_400_000;
const now = Date.parse("2026-08-27T12:00:00Z");
const ago = (days: number) => ({ created_at: new Date(now - days * DAY).toISOString() });

describe("a screen that stopped screening", () => {
  it("stays silent while the list answers the question itself", () => {
    // A line reading "last fired 2 hours ago" over a row stamped 2h is noise,
    // and noise is how a page teaches people to skim past the line that matters.
    const r = guardrailSilence([ago(0), ago(3)], now);
    expect(r.said).toBeNull();
    expect(r.action).toBeNull();
  });

  it("speaks the moment the newest hit crosses a week", () => {
    expect(guardrailSilence([ago(QUIET_DAYS - 1)], now).said).toBeNull();
    const spoke = guardrailSilence([ago(QUIET_DAYS)], now);
    expect(spoke.said).toBe("Nothing has tripped a rule in 7 days.");
    expect(spoke.quietDays).toBe(QUIET_DAYS);
  });

  it("reports the real gap, at the size the live database has", () => {
    const r = guardrailSilence([ago(33), ago(40)], now);
    expect(r.said).toBe("Nothing has tripped a rule in 33 days.");
    expect(r.action).toContain("Try it first");
  });

  /**
   * A caller reordering the read would otherwise turn this into "days since the
   * OLDEST hit", which reads as an alarm forever and would be believed the first
   * time and ignored after.
   */
  it("takes the newest hit whatever order the rows arrive in", () => {
    const oldestFirst = guardrailSilence([ago(40), ago(33), ago(1)], now);
    expect(oldestFirst.said).toBeNull();
  });

  it("says something useful, not reassuring, when nothing was ever caught", () => {
    const r = guardrailSilence([], now);
    expect(r.said).toBe("No rule has caught anything here.");
    expect(r.quietDays).toBeNull();
    // The old copy offered two readings and picked neither: "either nothing has
    // tripped a rule, or no calls have run through them yet". It could not tell
    // them apart. Neither can this, so it names the control that can.
    expect(r.action).toContain("Try it first");
    expect(r.said).not.toContain("no calls");
  });

  it("never diagnoses a cause it cannot see", () => {
    for (const r of [guardrailSilence([], now), guardrailSilence([ago(33)], now)]) {
      const words = `${r.said} ${r.action}`.toLowerCase();
      expect(words).not.toContain("broken");
      expect(words).not.toContain("not working");
      expect(words).not.toContain("failed");
    }
  });
});

/**
 * THE CLIFF WAS COVERAGE, NOT A BROKEN MECHANISM, and the correction matters
 * more than the original finding.
 *
 * S0 traced it: `callModel` screens unless a caller opts out and the loop never
 * does, so the absence of the word "guardrail" in loop.server.ts is the absence
 * of an OPT-OUT. Measured instead, 2026-08-27:
 *
 *   27 rules, across                3 workspaces
 *   workspaces that ran in 30 days  13
 *   of those, with ANY rule          2
 *
 * July's hits were on workspaces that had rules and were busy then; the traffic
 * moved to workspaces with nothing configured. So the first version of this
 * module told ELEVEN WORKSPACES OUT OF THIRTEEN that "nothing has tripped a
 * rule in 33 days", which reads as "yours are quiet" when the truth is "you
 * have none". An alarm about the wrong thing is how a person learns to ignore
 * the next one.
 */
describe("no rules of your own is not a quiet screen", () => {
  it("says what is actually true of the majority case", () => {
    const r = guardrailSilence([], now, 0);
    expect(r.said).toBe(
      "You have not written any rules of your own, so only the built-ins have screened anything here.",
    );
    expect(r.quietDays).toBeNull();
  });

  it("and says it even when old hits exist, because they were not yours", () => {
    // A workspace can carry hits from rules that have since been deleted.
    // "Nothing has tripped a rule in 33 days" would be an alarm about rules
    // that are not there.
    const r = guardrailSilence([ago(33)], now, 0);
    expect(r.said).toContain("not written any rules of your own");
    expect(r.said).not.toContain("33 days");
  });

  it("a workspace that HAS rules still gets the silence alarm", () => {
    const r = guardrailSilence([ago(33)], now, 4);
    expect(r.said).toBe("Nothing has tripped a rule in 33 days.");
  });

  /* Omitting the count keeps the old behaviour, so a caller that has not been
     taught to pass it is not silently given the wrong sentence. */
  it("an unknown rule count falls back rather than guessing zero", () => {
    expect(guardrailSilence([ago(33)], now).said).toBe("Nothing has tripped a rule in 33 days.");
    expect(guardrailSilence([], now).said).toBe("No rule has caught anything here.");
  });
});

/**
 * AN EMPTY HIT LIST IS NOT AN UNSCREENED WORKSPACE, AND THE PAGE HAS TO SAY SO.
 *
 * S0 traced the path: `callModel` screens every call unless a caller opts OUT,
 * and the loop never does. `loadGuardrails` returns `withFloor(...)` on both
 * branches, so a workspace that configured nothing is still screened. A call
 * matching no rule correctly writes NO ROW.
 *
 * S4 made it urgent. Measured 2026-08-27: `guardrail_hits` is largely PLANTED.
 * 7,225 rows on sample workspaces share a microsecond a month apart, out of the
 * demo seed migration; even the 1,310 on real workspaces carry 24 rows at one
 * instant with the SAME rule_id, which a single screening event cannot produce.
 * The table cannot be cited in either direction. So the one thing a reader can
 * safely be told is what the silence means, and it is the opposite of what an
 * empty list under the heading "What they caught" suggests.
 */
describe("an empty list is not an unchecked workspace", () => {
  it("every sentence that mentions the tester says the screening happens first", () => {
    for (const r of [
      guardrailSilence([], now, 0),
      guardrailSilence([], now, 4),
      guardrailSilence([ago(33)], now, 4),
    ]) {
      expect(r.action).toContain("Every call is screened");
      expect(r.action).toContain("Try it first");
      // The order matters: what the silence MEANS, then what to DO about it.
      expect(r.action!.indexOf("screened")).toBeLessThan(r.action!.indexOf("Try it first"));
    }
  });

  it("and it never offers the reassuring reading of an empty list", () => {
    const words = (guardrailSilence([], now, 4).action ?? "").toLowerCase();
    expect(words).not.toContain("nothing to worry");
    expect(words).not.toContain("you are protected");
  });
});
