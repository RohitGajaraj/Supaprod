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
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TOOL_DEFAULTS } from "@/lib/ai/tools/defaults";
import {
  assessTool,
  toolConsequence,
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

/*
 * ── THE HOP THE GUARD ABOVE TAKES ON TRUST, CLOSED 2026-08-22 ─────────────
 *
 * The block above checks the catalogue against `TOOL_DEFAULTS`, not against the
 * registry. That is one hop short. What makes it hold today is a SECOND guard in
 * a different file — `src/lib/ai/tools/defaults.test.ts`, whose `registeredTools()`
 * reads the registry as source text and asserts `TOOL_DEFAULTS` covers it. So the
 * real chain is
 *
 *     registry source -> TOOL_DEFAULTS -> CONSEQUENCES / RISK_PROFILE
 *                     ^ defaults.test.ts   ^ the block above
 *
 * and a tool the FIRST link misses is invisible to the second. That link is a
 * regex, `/\bdef\(\{\s*\n\s*name:\s*"([^"]+)"/`, which requires the newline
 * between `def({` and `name:`. A def written on one line is registered, absent
 * from TOOL_DEFAULTS, absent from this catalogue, and green in both files —
 * scoring `high`, demoted to `confirm` by `loop.server.ts`, queueing approvals
 * nobody chose. That is the 2026-08-19 defect exactly, arriving through the one
 * door still open.
 *
 * So this block measures the registry AGAIN, independently, and deliberately not
 * the same way: it keys off the `name:`/`category:` pair every ToolDef carries
 * rather than off the `def({` call, so the two guards cannot share a blind spot.
 * Reading source rather than importing is not laziness — `registry.server.ts` is
 * worker-only and pulls in Supabase, the AI runtime and every connector adapter.
 */
describe("coverage: the catalogue is checked against the registry itself", () => {
  /**
   * Tool names read straight from the registry source, via the `name:` +
   * `category:` pair rather than the `def({` call site.
   *
   * Both files are scanned because the four `mission.*` tools live in
   * orchestrator.server.ts and are only imported into the registry array.
   *
   * THE PAIR IS BOUNDED BY A LOOKAHEAD, NOT BY A CHARACTER WINDOW, and that is not
   * a stylistic preference. The first version of this scan allowed 900 characters
   * between `name:` and `category:` and silently dropped `decision.record`, whose
   * description runs 1186 characters — one tool short, and every coverage
   * assertion below would have passed on the reduced set. A window is a guess
   * about how long a description is allowed to get; `(?!\bname:\s*")` instead says
   * the real thing, which is "this tool's category, not the next tool's".
   */
  function registeredToolsFromSource(): string[] {
    const dir = join(process.cwd(), "src/lib/ai/tools");
    const src = ["registry.server.ts", "orchestrator.server.ts"]
      .map((f) => readFileSync(join(dir, f), "utf8"))
      .join("\n");
    return [
      ...src.matchAll(
        /name:\s*"([^"]+)",(?:(?!\bname:\s*")[\s\S])*?category:\s*"(?:read|write|memory|planning)"/g,
      ),
    ].map((m) => m[1]);
  }

  const FROM_SOURCE = registeredToolsFromSource();

  test("the source scan found a plausible registry, and found each tool once", () => {
    /*
     * Every assertion below passes vacuously against an empty or truncated scan,
     * so the scan is checked before it is trusted. The duplicate check guards the
     * other direction: the pair regex walks forward until it finds a `category:`,
     * so if it ever started pairing one tool's name with another's category, the
     * same name would appear twice and show up here first.
     *
     * A FLOOR IS NOT ENOUGH ON ITS OWN, and this test should not be read as if it
     * were. `> 50` would have happily accepted the 58 the first version of this
     * scan returned. What actually catches an off-by-one is the roster comparison
     * in the next test, which names the missing tool instead of counting.
     */
    expect(FROM_SOURCE.length).toBeGreaterThan(50);
    expect([...new Set(FROM_SOURCE)].length).toBe(FROM_SOURCE.length);
  });

  test("the two rosters agree, so neither guard is measuring a partial registry", () => {
    /*
     * The assertion that closes the hop. If the source scan and TOOL_DEFAULTS
     * disagree in EITHER direction, one of them is wrong about what is registered
     * and every downstream coverage test is checking the wrong set. Failing here
     * names the tool, which is the whole work of fixing it.
     */
    const inSourceOnly = FROM_SOURCE.filter((t) => !(t in TOOL_DEFAULTS));
    const inDefaultsOnly = Object.keys(TOOL_DEFAULTS).filter((t) => !FROM_SOURCE.includes(t));
    expect(inSourceOnly, "registered but with no platform default").toEqual([]);
    expect(inDefaultsOnly, "a default for something the registry does not define").toEqual([]);
  });

  test("every tool the registry defines has a consequence and a profile", () => {
    const noConsequence = FROM_SOURCE.filter((t) => !CATALOGUED_TOOLS.includes(t));
    const noProfile = FROM_SOURCE.filter((t) => !PROFILED_TOOLS.includes(t));
    expect(
      noConsequence,
      "these score `high`, get demoted to `confirm`, and queue an approval nobody chose",
    ).toEqual([]);
    expect(noProfile, "these score worst-case on all four axes and can never auto-approve").toEqual(
      [],
    );
  });

  test("no registered tool falls through to the generic default sentence", () => {
    /*
     * The same statement asserted on BEHAVIOUR rather than on set membership, so
     * it survives a change to how the lookup works: if `toolConsequence` stopped
     * consulting the catalogue, the three tests above would still pass on their
     * key lists and this one would not.
     *
     * The default effect is a sentinel — no real tool's effect is that sentence —
     * so this cannot false-alarm on a legitimately severe tool, which is why it is
     * checked here instead of "the profile is maximal on all four axes"
     * (`release.publish` and `delegate.openhands` sit close enough to maximal that
     * the next genuinely dangerous tool would trip it for the wrong reason).
     *
     * `tool-consequences.test.ts` makes this assertion too, scoped to `confirm`
     * and `review` tools, because those are the ones that render the sentence as a
     * 19px gate heading. This one is the whole registry: an `auto` tool with no
     * entry never reaches a gate, but it does score `high` and get demoted into
     * one, which is the defect that put `cluster.trigger` at 34% of the queue.
     */
    const DEFAULT_EFFECT = "Runs the tool with the agent's arguments.";
    const generic = FROM_SOURCE.filter((t) => toolConsequence(t).effect === DEFAULT_EFFECT);
    expect(generic, "these have no catalogue entry at all").toEqual([]);
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
