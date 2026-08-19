/**
 * The six-dimension risk model.
 *
 * `toolRisk` folds reversibility and scope into one tier and gates enforcement
 * today. These guards protect the four axes added beside it (data exposure,
 * ops impact, verification gap, change surface) and, just as importantly,
 * assert that adding them moved NOTHING about the existing tier. A risk model
 * that quietly reclassifies a tool is worse than no model at all, because the
 * per-agent cap and the min-confirm floor both read the old answer.
 */
import { expect, test, describe } from "bun:test";
import { TOOL_DEFAULTS } from "@/lib/ai/tools/defaults";
import {
  assessTool,
  toolRisk,
  toolRiskProfile,
  CATALOGUED_TOOLS,
  PROFILED_TOOLS,
} from "./tool-consequences";

describe("coverage: the two tables describe the same world", () => {
  test("every side-effecting tool has a risk profile", () => {
    // A tool with a consequence but no profile scores worst-case on all four
    // new axes and can never be auto-approved. That reads as a deliberate
    // policy and is actually a forgotten row, which is the failure this
    // catches at the moment the tool is added rather than months later.
    const missing = CATALOGUED_TOOLS.filter((t) => !PROFILED_TOOLS.includes(t));
    expect(missing).toEqual([]);
  });

  test("no profile describes a tool that does not exist", () => {
    // The other direction: a renamed tool leaves an orphan profile behind that
    // silently stops applying to anything.
    const orphans = PROFILED_TOOLS.filter((t) => !CATALOGUED_TOOLS.includes(t));
    expect(orphans).toEqual([]);
  });

  test("the catalogue is not empty, so the two assertions above mean something", () => {
    // Both set comparisons above pass trivially against two empty tables.
    expect(CATALOGUED_TOOLS.length).toBeGreaterThan(30);
  });
});

/*
 * ── THE ASSERTION THAT WAS MISSING, ADDED 2026-08-19 ──────────────────────
 *
 * The three tests above compare the two tables to EACH OTHER, and they passed
 * while seventeen registry tools were in neither. That is the shape of guard this
 * repo keeps finding: internally consistent, and blind to the thing that actually
 * went wrong.
 *
 * WHAT IT COST. `toolRisk` fails closed, so a tool with no row scored `high`, and
 * `loop.server.ts:186` demotes any high-risk tool from `auto` to `confirm`. An
 * omission was therefore the strictest gate available, applied silently.
 * `cluster.trigger` had been deliberately set to `auto` BECAUSE it was 24 of 60
 * pending approvals; with no row it scored high, was demoted back, and queued
 * anyway at 18 of 53 pending. A decision a person had already taken was being
 * reversed by a missing table row, and no test could see it.
 *
 * IT READS `TOOL_DEFAULTS` RATHER THAN `TOOL_REGISTRY`, deliberately.
 * `registry.server.ts` is a server module and pulling it into a unit test drags
 * the whole runtime in. `TOOL_DEFAULTS` carries one row per registered tool for
 * the seeding path, `every-tool-can-be-named.test.ts` already uses it as the
 * roster for exactly this purpose, and a tool cannot reach the registry without
 * one.
 */
describe("coverage: every registered tool is catalogued", () => {
  const REGISTERED = Object.keys(TOOL_DEFAULTS);

  test("there is a roster to check against", () => {
    // Without this the two assertions below pass against an empty object.
    expect(REGISTERED.length).toBeGreaterThan(50);
  });

  test("no registered tool is missing its consequence", () => {
    const missing = REGISTERED.filter((t) => !CATALOGUED_TOOLS.includes(t));
    expect(
      missing,
      "these tools score `high` by default and are demoted to `confirm`, which is a gate nobody chose",
    ).toEqual([]);
  });

  test("no registered tool is missing its risk profile", () => {
    const missing = REGISTERED.filter((t) => !PROFILED_TOOLS.includes(t));
    expect(missing, "these tools score worst-case on all four axes").toEqual([]);
  });

  test("no catalogue row describes a tool that is no longer registered", () => {
    /*
     * The other direction, and it is not symmetric with the orphan test above:
     * that one compares the two tables, this one compares them to the roster. A
     * tool renamed in the registry leaves rows in BOTH tables, so the two agree
     * with each other and neither applies to anything.
     */
    const orphans = CATALOGUED_TOOLS.filter((t) => !REGISTERED.includes(t));
    expect(orphans, "these rows apply to no registered tool").toEqual([]);
  });

  test("the tool this was found through is no longer gated by an absent row", () => {
    /*
     * Named rather than left to the general rule, because the general rule is what
     * was missing and a regression here has a specific, measurable cost: this tool
     * alone was 34% of the pending approval queue.
     */
    expect(toolRisk("cluster.trigger")).not.toBe("high");
  });

  test("a read is not gated as though nobody knew what it did", () => {
    // The sixteen read-only tools were the bulk of the omission. Every one of them
    // now scores below `high`, which is what stops the demotion firing.
    for (const t of [
      "repo.read",
      "repo.search",
      "repo.tree",
      "github.ci.read",
      "workspace.search",
      "workspace.list_tasks",
      "signals.list",
      "themes.list",
      "sources.status",
      "sources.connect",
      "mission.observe",
      "web.search",
      "web.fetch",
      "web.map",
    ]) {
      expect(toolRisk(t), `${t} is still gated as an unknown`).not.toBe("high");
    }
  });

  test("cataloguing them loosened nothing that should stay tight", () => {
    /*
     * The direction that matters for safety. Everything irreversible, and
     * everything that reaches the repo or the world, must still be `high`. If this
     * list ever shrinks, a write got quietly reclassified.
     */
    for (const t of [
      "studio.pr.merge",
      "studio.revert",
      "studio.commit",
      "studio.sync_branch",
      "github.commit.append",
      "delegate.openhands",
      "release.publish",
      "agent.spawn",
    ]) {
      expect(toolRisk(t), `${t} stopped being high-risk`).toBe("high");
    }
  });
});

describe("adding four axes moved nothing about the existing tier", () => {
  test("assessTool reports exactly the tier toolRisk reports, for every tool", () => {
    for (const t of CATALOGUED_TOOLS) {
      expect(assessTool(t).risk, `${t} changed tier`).toBe(toolRisk(t));
    }
  });

  test("the known anchors still hold", () => {
    // Spot-checks against the documented rules in toolRisk's own comment.
    expect(toolRisk("studio.pr.merge")).toBe("high"); // irreversible
    expect(toolRisk("notes.create")).toBe("low"); // internal + reversible
    expect(toolRisk("github.pr.open")).toBe("medium"); // external + reversible
    expect(toolRisk("nonexistent.tool")).toBe("high"); // fail closed
  });
});

describe("the composite takes the worst axis, never an average", () => {
  test("one disqualifying axis is not diluted by four benign ones", () => {
    // delegate.openhands: narrow on nothing, worst on several. If this ever
    // averages, it lands mid-scale and looks routine.
    const a = assessTool("delegate.openhands");
    expect(a.score).toBe(2);
    expect(a.profile.verificationGap).toBe("unverifiable");
    expect(a.profile.changeSurface).toBe("broad");
  });

  test("it names the axis that drove the score, so a surface can say why", () => {
    const a = assessTool("calendar.create");
    // Narrow surface, but it reaches a real calendar and nothing checks it.
    expect(a.score).toBe(2);
    expect(a.drivenBy).toBeTruthy();
    expect(a.drivenBy).not.toBe("nothing of consequence");
  });

  test("a wholly benign tool scores zero and says so", () => {
    const a = assessTool("notes.create");
    expect(a.score).toBe(0);
    expect(a.drivenBy).toBe("nothing of consequence");
  });
});

describe("the distinction a single tier could not express", () => {
  test("a CI-gated merge and an unchecked handoff are both high, and differ", () => {
    const merge = assessTool("studio.pr.merge");
    const delegate = assessTool("delegate.openhands");
    // Same folded tier...
    expect(merge.risk).toBe("high");
    expect(delegate.risk).toBe("high");
    // ...and not the same call. CI ran before the merge; nothing ran before
    // the third-party agent started. This is the whole reason for the axis.
    expect(merge.profile.verificationGap).toBe("verified");
    expect(delegate.profile.verificationGap).toBe("unverifiable");
  });

  test("a naming pattern would have got the sensitive read wrong", () => {
    // studio.secrets.scan reads the most sensitive data in the product and
    // looks, by name, like its harmless siblings studio.tests.plan.
    expect(toolRiskProfile("studio.secrets.scan").changeSurface).toBe("broad");
    expect(toolRiskProfile("studio.tests.plan").changeSurface).toBe("narrow");
  });

  test("a tool that sounds external and books nothing is scored internal", () => {
    expect(toolRiskProfile("scheduler.propose").dataExposure).toBe("internal");
    expect(toolRiskProfile("calendar.create").dataExposure).toBe("external");
  });
});

describe("auto-approval is stricter than a zero score", () => {
  test("it additionally requires the action to be reversible", () => {
    for (const t of CATALOGUED_TOOLS) {
      const a = assessTool(t);
      if (a.autoApprovable) {
        expect(a.reversibility, `${t} is auto-approvable but not reversible`).toBe("reversible");
        expect(a.score, `${t} is auto-approvable with a non-zero score`).toBe(0);
      }
    }
  });

  test("nothing that leaves the workspace is ever auto-approvable", () => {
    const leaky = CATALOGUED_TOOLS.filter(
      (t) => assessTool(t).autoApprovable && assessTool(t).profile.dataExposure !== "none",
    ).filter((t) => assessTool(t).profile.dataExposure === "external");
    expect(leaky).toEqual([]);
  });

  test("an unknown tool is never auto-approvable", () => {
    // Fail closed: an un-catalogued tool is the worst case on every axis, and
    // must not be waved through by a model that has never seen it.
    const a = assessTool("some.tool.we.never.catalogued");
    expect(a.autoApprovable).toBe(false);
    expect(a.score).toBe(2);
  });

  test("a null tool name is never auto-approvable either", () => {
    // A non-tool gate (a spec, a decision) reaches this with no tool name.
    expect(assessTool(null).autoApprovable).toBe(false);
    expect(assessTool(undefined).autoApprovable).toBe(false);
  });

  test("at least one genuinely safe tool IS auto-approvable", () => {
    // Otherwise the strictness above is satisfied by approving nothing, and
    // the whole model is decorative.
    const approvable = CATALOGUED_TOOLS.filter((t) => assessTool(t).autoApprovable);
    expect(approvable.length).toBeGreaterThan(0);
    // And every one of them must be an internal, reversible, narrow write.
    for (const t of approvable) {
      const p = toolRiskProfile(t);
      expect(p.opsImpact, `${t}`).toBe("none");
      expect(p.changeSurface, `${t}`).toBe("narrow");
    }
  });
});
