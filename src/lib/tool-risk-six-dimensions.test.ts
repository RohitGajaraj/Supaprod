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
