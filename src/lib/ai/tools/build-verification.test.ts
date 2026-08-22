/**
 * The wiring gate for Build's pre-pull-request verification tools.
 *
 * A verification tool is only worth registering if it actually RUNS. Four
 * separate layers can each silently stop one: the platform default, the static
 * risk catalogue, the per-agent blast-radius cap, and the runtime floor
 * composition. Three of them fail closed on an uncatalogued tool, so the way
 * this feature dies is not a crash but a demotion nobody notices, after which
 * the loop's cheapest path is to skip the check and open the pull request
 * anyway. That is the exact state these tools were written to end.
 *
 * So the wiring is asserted here rather than assumed, in both directions: the
 * checks run without a gate, AND nothing about adding them lowered a floor that
 * was already there.
 */
import { describe, it, expect } from "bun:test";
import { TOOL_DEFAULTS } from "./defaults";
import { toolRisk, isSideEffectingTool, isExternalTool } from "@/lib/tool-consequences";
import { capToolsByRisk } from "@/lib/agent-tool-cap";
import { resolveToolMode } from "@/lib/ai/loop.server";
import {
  HIGH_RISK_FORCE_REVIEW,
  HIGH_RISK_MIN_CONFIRM,
  BUILD_LANE_AUTONOMOUS,
} from "@/lib/ai/trust-ramp";

const VERIFICATION_TOOLS = [
  "studio.review",
  "studio.secrets.scan",
  "studio.tests.plan",
  "studio.deps.audit",
] as const;

describe("Build verification tools: they run, without a gate in front of them", () => {
  it("every one has a platform default and it is auto", () => {
    // A gate you have to ask permission to run is not a gate.
    for (const tool of VERIFICATION_TOOLS) {
      expect(TOOL_DEFAULTS[tool], `${tool} has no platform default`).toBeDefined();
      expect(TOOL_DEFAULTS[tool].mode, `${tool} must default to auto`).toBe("auto");
      expect(TOOL_DEFAULTS[tool].enabled).toBe(true);
    }
  });

  it("every one is catalogued low risk, so the generic high-risk demotion never reaches it", () => {
    // toolRisk returns "high" for anything it has never heard of. An
    // uncatalogued check would be demoted to confirm on every single call.
    for (const tool of VERIFICATION_TOOLS) {
      expect(toolRisk(tool), `${tool} is not catalogued in tool-consequences`).toBe("low");
      expect(isExternalTool(tool), `${tool} writes nothing outside the workspace`).toBe(false);
    }
  });

  it("survives even the strictest per-agent blast-radius cap", () => {
    // A scoped agent losing its code review is the quietest possible way for
    // this feature to stop existing.
    const rows = VERIFICATION_TOOLS.map((tool_name) => ({ tool_name }));
    expect(capToolsByRisk(rows, "low")).toEqual(rows);
  });

  it("resolves to auto through the full runtime floor composition, on every arc", () => {
    for (const tool of VERIFICATION_TOOLS) {
      for (const arc of ["proving", "trusted"] as const) {
        expect(resolveToolMode(tool, "auto", arc, false), `${tool} on ${arc}`).toBe("auto");
        // Even an account that dialed the tool to confirm clears the low-risk
        // path, so the check still runs rather than stranding on an approval.
        expect(resolveToolMode(tool, "confirm", arc, false), `${tool} on ${arc}`).toBe("auto");
      }
    }
  });

  it("carries no risk floor, because it has no consequence to floor", () => {
    for (const tool of VERIFICATION_TOOLS) {
      expect(HIGH_RISK_FORCE_REVIEW.has(tool), `${tool} must not force review`).toBe(false);
      expect(HIGH_RISK_MIN_CONFIRM.has(tool), `${tool} must not require confirm`).toBe(false);
      // Not in BUILD_LANE_AUTONOMOUS either: that set exempts a tool from the
      // high-risk demotion, and a low-risk read never meets it. Adding a read
      // tool there would blur what the set means.
      expect(BUILD_LANE_AUTONOMOUS.has(tool)).toBe(false);
    }
  });
});

describe("Build verification tools: nothing they added lowered an existing floor", () => {
  it("keeps the four irreversible tools pinned exactly where they were", () => {
    // Verification is what makes autonomy defensible, never a reason to relax
    // the gate it feeds. A clean review verdict is evidence for a human, not a
    // substitute for one.
    for (const tool of ["release.publish", "studio.pr.merge", "studio.revert"]) {
      expect(TOOL_DEFAULTS[tool].mode, `${tool} must stay at review`).toBe("review");
      expect(HIGH_RISK_FORCE_REVIEW.has(tool), `${tool} must stay force-review`).toBe(true);
      expect(resolveToolMode(tool, "auto", "trusted", true), `${tool} floor`).toBe("review");
    }
    expect(TOOL_DEFAULTS["delegate.openhands"].mode).toBe("review");
  });

  it("leaves the build lane's own autonomy set untouched", () => {
    expect([...BUILD_LANE_AUTONOMOUS].sort()).toEqual([
      "studio.commit",
      "studio.pr.open",
      "studio.stage",
    ]);
  });

  it("leaves the commit and merge mechanics at the modes they already had", () => {
    expect(TOOL_DEFAULTS["studio.stage"].mode).toBe("auto");
    expect(TOOL_DEFAULTS["studio.commit"].mode).toBe("confirm");
    expect(TOOL_DEFAULTS["studio.pr.open"].mode).toBe("confirm");
    expect(TOOL_DEFAULTS["studio.fix.commit"].mode).toBe("auto");
  });

  it("counts three of the four as reads, and the reviewer as a write", () => {
    /*
     * THE UPDATE THIS ASSERTION ASKED FOR, made 2026-08-22. It used to expect
     * `true` from all four and from `ci.logs`, and its comment said so plainly:
     * `isSideEffectingTool` was `name in CONSEQUENCES`, every catalogued read
     * tripped it, and "the day that predicate is fixed, this assertion is where
     * the expectation gets updated". That day is today. The predicate now answers
     * from the registry's `category`, so:
     *
     * `ci.logs`, `studio.secrets.scan`, `studio.tests.plan` and
     * `studio.deps.audit` are `category: "read"` and answer false, which is what
     * they always were — they read a diff, a PR, a lockfile, and write nowhere.
     *
     * `studio.review` is not a read and answers true. That is not the old bug
     * surviving in one place: it is `category: "planning"`, and it persists its
     * verdict to `studio_changesets.code_review`, so something outlives the call.
     * The three above are the ones that leave no trace, and the predicate can now
     * tell the difference — which is the point of fixing it.
     *
     * None of this changes what it takes to RUN any of the four. That is decided
     * by `TOOL_DEFAULTS`, `toolRisk` and `resolveToolMode`, all asserted above and
     * all untouched by this. What it changes is how a completed call is COUNTED:
     * three of these stop being reported as work the loop carried unattended.
     */
    for (const tool of [
      "ci.logs",
      "studio.secrets.scan",
      "studio.tests.plan",
      "studio.deps.audit",
    ]) {
      expect(isSideEffectingTool(tool), `${tool} reads and writes nothing`).toBe(false);
    }
    expect(isSideEffectingTool("studio.review"), "it writes its verdict to the changeset").toBe(
      true,
    );
    // The four still resolve to auto and still carry no floor; that is asserted
    // in the block above and neither claim moved.
    expect(VERIFICATION_TOOLS.filter((t) => isSideEffectingTool(t))).toEqual(["studio.review"]);
  });
});
