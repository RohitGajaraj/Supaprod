import { describe, it, expect } from "bun:test";
import { resolveToolMode } from "./loop.server";

// AGT-02 - Consent scopes. `resolveToolMode` composes, in strict order:
// seeded mode -> arc dial -> HIGH_RISK_FORCE_REVIEW -> HIGH_RISK_MIN_CONFIRM/
// isHighRiskTool -> low-risk auto-clear -> AGT-02 contract-approved
// reversible auto-clear. "proving" arc is used throughout because it is the
// one arc where resolveApprovalMode(toolMode, arc) leaves "confirm" as
// "confirm" (auto -> confirm, confirm stays confirm) - isolating every test
// below to the branches THIS chain composes, not the arc dial itself.

describe("resolveToolMode - AGT-02 plan-level consent, safety floors preserved", () => {
  it("does not change behavior when the contract is not approved (regression: identical to the pre-AGT-02 chain)", () => {
    expect(resolveToolMode("tasks.create", "confirm", "proving", false)).toBe("auto"); // pre-existing low-risk auto-clear
    expect(resolveToolMode("github.pr.open", "confirm", "proving", false)).toBe("confirm"); // medium risk, no clear without AGT-02
    expect(resolveToolMode("studio.pr.merge", "confirm", "proving", false)).toBe("review"); // force-review floor
    expect(resolveToolMode("calendar.create", "confirm", "proving", false)).toBe("confirm"); // hand-curated floor
  });

  it("auto-clears a genuinely reversible, externally-scoped tool once the contract is approved (the new AGT-02 behavior)", () => {
    expect(resolveToolMode("github.pr.open", "confirm", "proving", true)).toBe("auto");
    expect(resolveToolMode("github.issue.create", "confirm", "proving", true)).toBe("auto");
  });

  it("NEVER auto-clears a HIGH_RISK_MIN_CONFIRM tool even though it is classified reversible and the contract is approved - the safety-floor-preservation case", () => {
    // calendar.create is reversible (tool-consequences.ts) yet hand-floored to
    // at-least-confirm. AGT-02 must not undo that hardening.
    expect(resolveToolMode("calendar.create", "confirm", "proving", true)).toBe("confirm");
  });

  it("NEVER auto-clears a HIGH_RISK_FORCE_REVIEW tool regardless of contract approval - review stays sticky", () => {
    expect(resolveToolMode("studio.pr.merge", "confirm", "proving", true)).toBe("review");
    expect(resolveToolMode("studio.revert", "confirm", "proving", true)).toBe("review");
    expect(resolveToolMode("delegate.openhands", "confirm", "proving", true)).toBe("review");
  });

  it("never touches a tool whose seeded mode is review, contract approved or not (review is sticky through resolveApprovalMode before this chain even runs)", () => {
    expect(resolveToolMode("agent.spawn", "review", "proving", true)).toBe("review");
    expect(resolveToolMode("agent.spawn", "review", "proving", false)).toBe("review");
  });

  it("does not clear a partial-reversibility (not fully reversible) tool even with an approved contract", () => {
    // studio.commit / github.commit.append are "partial", not "reversible" -     // AGT-02's condition is a strict equality on "reversible", so these must
    // stay at confirm.
    // (studio.commit moved to the one-motion consent suite below: founder
    // grant 2026-07-07, ship-week seam 2.)
    expect(resolveToolMode("github.commit.append", "confirm", "proving", true)).toBe("confirm");
  });

  it("fails closed for an uncatalogued tool: the Reversibility default is 'partial', not 'reversible', so it never auto-clears even with an approved contract", () => {
    expect(resolveToolMode("some.unknown.tool", "confirm", "proving", true)).toBe("confirm");
  });

  it("only ever loosens confirm -> auto - never touches a tool that is already auto", () => {
    // ambient arc dials everything to auto before this chain's later branches
    // would matter; confirm-only fields in AGT-02's own condition mean an
    // already-auto tool is simply left alone (mode !== "confirm" short-circuits).
    expect(resolveToolMode("github.pr.open", "auto", "ambient", true)).toBe("auto");
  });
});

describe("resolveToolMode - seam-2 one-motion consent + the bounded CI-fix appender", () => {
  it("an approved contract lifts exactly studio.commit and studio.pr.open to auto (the one-motion consent)", () => {
    expect(resolveToolMode("studio.commit", "confirm", "proving", true)).toBe("auto");
    expect(resolveToolMode("studio.pr.open", "confirm", "proving", true)).toBe("auto");
  });

  it("a tightened arc (proving) still gates the mechanics without a contract", () => {
    // The operator's dial-down is respected: proving keeps confirm at confirm.
    expect(resolveToolMode("studio.commit", "confirm", "proving", false)).toBe("confirm");
    expect(resolveToolMode("studio.pr.open", "confirm", "proving", false)).toBe("confirm");
  });

  it("at trusted the build-lane mechanics run auto with NO contract precondition (founder ruling 2026-07-08)", () => {
    // The dial resolves confirm -> auto at trusted, and the high-risk
    // demotion now skips BUILD_LANE_AUTONOMOUS: the branch and draft PR are
    // reversible; only the review-pinned merge decides what lands.
    expect(resolveToolMode("studio.commit", "confirm", "trusted", false)).toBe("auto");
    expect(resolveToolMode("studio.pr.open", "confirm", "trusted", false)).toBe("auto");
    expect(resolveToolMode("studio.stage", "auto", "trusted", false)).toBe("auto");
  });

  it("one-motion consent never reaches the decisive gates or the other floored tools", () => {
    expect(resolveToolMode("studio.pr.merge", "confirm", "proving", true)).toBe("review");
    expect(resolveToolMode("calendar.create", "confirm", "proving", true)).toBe("confirm");
  });

  it("studio.fix.commit follows the arc dial, not the high-risk floor (its safety lives in the tool's own pr_open + budget guards)", () => {
    // proving tightens seeded auto to confirm (the trust curve still applies)...
    expect(resolveToolMode("studio.fix.commit", "auto", "proving", false)).toBe("confirm");
    // ...but at trusted/ambient it runs unattended instead of being floored.
    expect(resolveToolMode("studio.fix.commit", "auto", "trusted", false)).toBe("auto");
    expect(resolveToolMode("studio.fix.commit", "auto", "ambient", false)).toBe("auto");
    // Without the dedicated branch the isHighRiskTool floor would force
    // confirm here (partial + external classifies high), parking the
    // autonomous fix loop at a gate every iteration.
  });

  it("ci.logs is a low-risk read and auto-clears like any other read tool", () => {
    expect(resolveToolMode("ci.logs", "confirm", "proving", false)).toBe("auto");
  });
});
