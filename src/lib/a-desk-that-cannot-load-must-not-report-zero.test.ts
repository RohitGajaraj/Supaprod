/**
 * F-120: AN UNREADABLE FORECAST DESK REPORTED AN EMPTY ONE, THEN VANISHED.
 *
 * Four reads in `forecast.functions.ts` swallowed their error and returned an
 * empty result, on the one desk whose entire purpose is that overdue calls get
 * answered.
 *
 * ── WHY IT WAS WORSE THAN A WRONG NUMBER ───────────────────────────────────
 * `ForecastDeskPanel` returns null when all three of its reads come back empty.
 * That null is deliberate and right: "an account that has never recorded a
 * forecast should not be shown a desk for settling them". But with the errors
 * swallowed, a total read failure took the same branch, so the desk did not show
 * an error and did not show zero. **It disappeared from the page**, and a person
 * would reasonably conclude they had nothing to settle.
 *
 * The fourth read was the most misleading of all: `summarizeForecastCalls([])`
 * over an unreadable table produces a real-looking rate built on no rows, so the
 * failure rendered as a confident score rather than as a blank.
 *
 * ── THE SIBLING IN THIS SAME FEATURE ALREADY LEARNED THIS ──────────────────
 * `auditDueForecasts` throws, under a comment reading *"A FAILED READ IS NOT AN
 * EMPTY QUEUE, and the old return made the two identical"*. The tick learned it.
 * The desk it feeds did not, which is how one fix stays local to the file it was
 * made in.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const flat = (t: string) => t.replace(/\s+/g, " ");

const FNS = readFileSync(
  fileURLToPath(new URL("./forecast.functions.ts", import.meta.url)),
  "utf8",
);
const PANEL = flat(
  readFileSync(
    fileURLToPath(new URL("../components/learn/ForecastDeskPanel.tsx", import.meta.url)),
    "utf8",
  ),
);

describe("every read says when it failed", () => {
  it("no read returns an empty result on an error any more", () => {
    // The four exact shapes that were there. Named rather than pattern-matched,
    // because a guard I cannot trust is worse than none.
    for (const swallowed of [
      "if (error) return { due: [], total: 0 };",
      "if (error) return { history: [] };",
      "if (error) return { settled: [] };",
      "if (error) return summarizeForecastCalls([]);",
    ]) {
      expect(FNS, swallowed).not.toContain(swallowed);
    }
  });

  it("a MISSING COLUMN still fails soft, which the four tests pinning it were right about", () => {
    /*
     * I nearly bulldozed this. My first version threw on every error, and four
     * existing tests failed with a reason that was better than my change:
     * "Migrations and deploys are two switches with no enforced order, and
     * PostgREST answers an unknown column with an error rather than a null.
     * Throwing here would take the whole Learn desk down, spec outcomes
     * included, because both live on one route."
     *
     * So the two are told apart by a fact rather than a judgement, and the
     * codes are the pair PostgREST already uses. `decideDesignGate` checks the
     * identical pair for the identical reason.
     */
    expect(FNS).toContain('error?.code === "42703" || error?.code === "PGRST204"');
    expect(FNS.split("if (isPreMigration(error))").length - 1).toBe(4);
  });

  it("all four throw with a sentence naming what could not be read", () => {
    expect(FNS).toContain("The forecasts that are due could not be read");
    expect(FNS).toContain("This forecast's history could not be read");
    expect(FNS).toContain("What your crew settled could not be read");
    expect(FNS).toContain("Your forecast record could not be read");
  });

  it("and each carries the underlying message, so it is diagnosable", () => {
    expect(FNS.split("${error.message}").length - 1).toBeGreaterThanOrEqual(4);
  });
});

describe("the desk tells a failure from a zero", () => {
  it("it checks the error state", () => {
    expect(PANEL).toContain("dueQ.isError || agentQ.isError || rateQ.isError");
  });

  it("BEFORE the return-null, which is the whole fix", () => {
    /*
     * Order is the fix. Both branches render nothing visible if you get this
     * wrong, and only one of them is honest.
     */
    const errIdx = PANEL.indexOf("const readFailed =");
    const nullIdx = PANEL.indexOf("=== 0) return null");
    expect(errIdx).toBeGreaterThan(-1);
    expect(nullIdx).toBeGreaterThan(-1);
    expect(errIdx).toBeLessThan(nullIdx);
  });

  it("and the sentence says why an empty desk would have misled them", () => {
    expect(PANEL).toContain("an empty desk here would not mean there is nothing to settle");
  });

  it("the retry refetches all three, because they are one desk", () => {
    expect(PANEL).toContain("void dueQ.refetch()");
    expect(PANEL).toContain("void agentQ.refetch()");
    expect(PANEL).toContain("void rateQ.refetch()");
  });

  it("the zero state still exists for a workspace that genuinely has nothing", () => {
    // The fix must not turn "no empty scaffolding" into empty scaffolding.
    expect(PANEL).toContain("=== 0) return null");
  });
});

describe("the copy carries no machine punctuation", () => {
  const ADDED = [
    "The forecasts that are due could not be read",
    "This forecast's history could not be read",
    "What your crew settled could not be read",
    "Your forecast record could not be read",
    "an empty desk here would not mean there is nothing to settle",
  ];

  it.each(ADDED)("%s has no em or en dash", (line) => {
    expect(line).not.toMatch(/[–—]/);
  });

  it("and every one is actually in the shipped files", () => {
    for (const line of ADDED) {
      expect(flat(FNS).includes(line) || PANEL.includes(line), line).toBe(true);
    }
  });
});
