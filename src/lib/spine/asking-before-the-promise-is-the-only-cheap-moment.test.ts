/**
 * ASKING BEFORE THE PROMISE IS THE ONLY CHEAP MOMENT (S1 -> S0, 2026-08-27).
 *
 * `metric-probe.server.ts` could answer *"is what you just promised checkable?"*
 * from the day it shipped, and **nothing ever asked it**. Repo-wide its only
 * importer was its own test, so the module `SPEC-BUILD-PATHS` §2 ranks FIRST of
 * the five runnables was dead code.
 *
 * The failure it prevents is silent and late. A forecast is captured, the
 * horizon arrives weeks later, and only then does anyone find the observable was
 * never readable. There is no verdict to set against the forecast, which is the
 * single thing this product claims.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = readFileSync(fileURLToPath(new URL("./track.functions.ts", import.meta.url)), "utf8");
const FN = SRC.slice(SRC.indexOf("export const checkForecastObservable"));

describe("the probe is reachable from a surface at last", () => {
  it("is exported as a server fn, not a bare async function", () => {
    // Both probe exports take a SupabaseClient, so a component cannot call
    // them. That is the whole reason this wrapper had to exist.
    expect(FN).toContain("createServerFn");
    expect(FN).toContain("requireSupabaseAuth");
  });

  it("calls the real probe rather than reimplementing the answer", () => {
    expect(FN).toContain("isForecastCheckable(context.supabase");
  });
});

describe("THE SIGNATURE IS THE FEATURE: it takes the words, not an id", () => {
  it("accepts howWeWillKnow, the forecast's own sentence", () => {
    expect(FN).toContain("howWeWillKnow");
  });

  it("and takes NO decisionId, so it can be asked before the row exists", () => {
    /*
     * Narrowing this to a decision id would move the answer to after the
     * promise was written, which is precisely the timing that makes it
     * worthless. S1 asked for this explicitly and they are right.
     */
    expect(FN).not.toContain("decisionId");
    expect(FN).not.toContain("decision_id");
  });
});

describe("`because` is passed through, never reworded", () => {
  it("returns the probe's own sentence", () => {
    // It already names the next action where there is one. A second copy on a
    // surface is how one message comes to disagree with itself.
    expect(FN).toContain("checkable: boolean; because: string");
    expect(FN).not.toContain("because: `");
  });
});
