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
