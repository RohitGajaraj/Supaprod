/**
 * A DECISION NOT TO BUILD MUST STOP THE BUILDING (2026-08-26).
 *
 * The Decide brief tells the crew, in these words: *"A 'no' is a decision and
 * you file it the same way as a yes."* On 2026-08-26 a strategist did exactly
 * that on track `a30238f5` — *"Do not implement address reuse until post-fix
 * abandonment evidence emerges"* — with a real, checkable forecast behind it.
 *
 * **The spine walked it on to Define anyway.** `decisions.status` offers
 * `approved`, `pending`, `standing` and `superseded`, and NOTHING THAT MEANS NO,
 * so the refusal was stored `approved` and read as a go. Four stations of agents
 * were about to specify, design and build the thing the one station whose job is
 * stopping work had just refused.
 *
 * That is the most expensive defect this loop can have. Decide exists to prevent
 * spend, and it could not.
 *
 * ── WHY WAIVE, AND NOT CLOSE THE TRACK ─────────────────────────────────────
 * A refusal is not the end of the work. It is an answer with a bet attached, and
 * that bet comes due 2026-10-15 with an observable anyone can check. Closing the
 * track would throw it away and the loop would never learn whether the "no" was
 * right. So the four building stations are waived and the track walks
 * **Decide → Learn**, which the spine already knows how to express.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { waive, nextStation, fullRoute } from "./route";

const DRIVER = readFileSync(fileURLToPath(new URL("./driver.server.ts", import.meta.url)), "utf8");
const REGISTRY = readFileSync(
  fileURLToPath(new URL("../ai/tools/registry.server.ts", import.meta.url)),
  "utf8",
);

describe("the crew can say no, and the row can hold it", () => {
  it("decision.record takes the call", () => {
    expect(REGISTRY).toContain('call: z.enum(["build", "do-not-build"]).default("build")');
  });

  it("defaults to build, so no existing decision silently becomes a refusal", () => {
    expect(REGISTRY).toContain('.default("build")');
  });

  it("a refusal is stored as declined, which no other status means", () => {
    expect(REGISTRY).toContain('a.call === "do-not-build" && gate.status === "approved"');
    expect(REGISTRY).toContain('"declined"');
  });

  it("and a refusal never skips a review that was going to happen anyway", () => {
    // A no-go with a provenance problem is not more trustworthy for being a no,
    // so only an "approved" is overridden.
    expect(REGISTRY).toContain('gate.status === "approved" ? "declined" : gate.status');
  });
});

describe("the driver reads it and stops the build", () => {
  it("asks only at Decide, because that is the only station that can refuse", () => {
    expect(DRIVER).toContain('station === "decide"');
    expect(DRIVER).toContain("decisionWasRefusal(supabase, row.id)");
  });

  it("waives the four building stations, not the whole route", () => {
    expect(DRIVER).toContain('["define", "design", "build", "ship"]');
  });

  it("with a reason a person can read", () => {
    expect(DRIVER).toContain("The call was not to build");
  });

  it("and a trigger that brings them back if the refusal turns out wrong", () => {
    expect(DRIVER).toContain('reopensWhen: "outcome-contested"');
  });

  it("an unreadable decision keeps the ordinary route", () => {
    /*
     * Fail-soft to false. Guessing "refused" on a row it could not read would
     * silently cancel four stations of real work, which is the more expensive
     * way to be wrong.
     */
    const at = DRIVER.indexOf("async function decisionWasRefusal");
    const body = DRIVER.slice(at, at + 1200);
    expect(body).toContain("catch");
    expect(body).toContain("return false");
  });
});

describe("THE ROUTE IT PRODUCES: Decide goes straight to Learn", () => {
  it("waiving the four leaves learn as the next stop after decide", () => {
    let route = fullRoute();
    for (const s of ["define", "design", "build", "ship"] as const) {
      route = waive(route, s, {
        by: "policy",
        reason: "The call was not to build, so there is nothing to specify or ship.",
        reopensWhen: "outcome-contested",
      });
    }
    expect(nextStation(route, "decide")).toBe("learn");
  });

  it("and the forecast still has somewhere to be settled", () => {
    // The whole reason this waives rather than closing: Learn is where the bet
    // is graded, and a refusal carries a bet like any other decision.
    let route = fullRoute();
    for (const s of ["define", "design", "build", "ship"] as const) {
      route = waive(route, s, {
        by: "policy",
        reason: "x",
        reopensWhen: "outcome-contested",
      });
    }
    expect(route.path).toContain("learn");
  });
});
