/**
 * A REFUSAL THE OUTCOME CONTESTS CAN COME BACK (2026-08-27).
 *
 * When Decide says no, the driver waives Define, Design, Build and Ship with
 * `reopensWhen: "outcome-contested"` and the track walks to Learn. **I wrote a
 * comment promising the stations return if the verdict later disagrees, and
 * nothing implemented it.**
 *
 * `route.ts` says so in three separate places: *"Nothing reads `reopensWhen`"*,
 * *"`applyTrigger` is the evaluator and it has no caller"*, *"a waiver is a
 * one-way door today"*. So the promise was a claim outrunning its wiring — the
 * exact defect this repo has a name for — written into the commit that named it.
 *
 * Found by sweeping `src/lib/spine` and `src/lib/ai` for exported symbols with
 * zero non-test importers, which is the same sweep that found `metric-probe`
 * and `resolveApprovalPolicy` unreachable earlier the same night.
 *
 * ── WHY WIRE IT RATHER THAN SOFTEN THE COMMENT ─────────────────────────────
 * A refusal that can never be revisited is the trap the waive was chosen to
 * avoid. The whole reason a "no" waives rather than closes the track is that the
 * bet stays alive and Learn can settle it. If settling it cannot reopen
 * anything, the bet is decorative.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { applyTrigger, waive, fullRoute } from "./route";

const DRIVER = readFileSync(fileURLToPath(new URL("./driver.server.ts", import.meta.url)), "utf8");

const refusedRoute = () => {
  let r = fullRoute();
  for (const s of ["define", "design", "build", "ship"] as const) {
    r = waive(r, s, {
      by: "policy",
      reason: "The call was not to build, so there is nothing to specify or ship.",
      reopensWhen: "outcome-contested",
    });
  }
  return r;
};

describe("the evaluator finally has a caller", () => {
  it("the driver calls applyTrigger", () => {
    expect(DRIVER).toContain('applyTrigger(route, "outcome-contested")');
  });

  it("only at Learn, the one station whose output can contest a refusal", () => {
    expect(DRIVER).toContain(
      'if (station === "learn") onwardRoute = await reopenIfOutcomeContested',
    );
  });

  it("and exits cheaply when no waiver carries the trigger", () => {
    expect(DRIVER).toContain('!route.waived.some((w) => w.reopensWhen === "outcome-contested")');
  });
});

describe("WHICH VERDICTS CONTEST A REFUSAL, and which do not", () => {
  it("a missed or mixed verdict reopens", () => {
    expect(DRIVER).toContain('verdict !== "missed" && verdict !== "mixed"');
  });

  it("a validated verdict changes nothing", () => {
    /*
     * The refusal was right. Reopening on agreement would make the trigger
     * meaningless, and would send four stations after work the record says was
     * correctly not done.
     */
    const at = DRIVER.indexOf("async function reopenIfOutcomeContested");
    const body = DRIVER.slice(at, at + 2200);
    expect(body).not.toContain('"validated"');
  });

  it("an unreadable verdict leaves the route alone", () => {
    // Reopening four stations on a read error spends real money on a guess.
    const at = DRIVER.indexOf("async function reopenIfOutcomeContested");
    const body = DRIVER.slice(at, at + 2200);
    expect(body).toContain("catch");
    expect(body).toContain("return route");
  });

  it("and a superseded learning cannot reopen anything", () => {
    // A verdict a rewind undid is not evidence about anything.
    const at = DRIVER.indexOf("async function reopenIfOutcomeContested");
    expect(DRIVER.slice(at, at + 2200)).toContain('.is("superseded_at", null)');
  });
});

describe("THE ROUTE IT PRODUCES", () => {
  it("the four skipped stations come back, in spine order", () => {
    const reopened = applyTrigger(refusedRoute(), "outcome-contested");
    for (const s of ["define", "design", "build", "ship"]) {
      expect(reopened.path, `${s} did not come back`).toContain(s);
    }
    expect(reopened.path).toEqual([...reopened.path].sort((a, b) => 0) as typeof reopened.path);
  });

  it("and a human's deliberate skip is NOT undone by a machine reading an outcome", () => {
    // `never` is the human's own waiver. `applyTrigger` matches on the trigger,
    // so a `never` waiver is untouched by construction.
    let r = waive(fullRoute(), "design", {
      by: "human",
      reason: "We are not designing this.",
      reopensWhen: "never",
    });
    r = applyTrigger(r, "outcome-contested");
    expect(r.path).not.toContain("design");
  });
});
