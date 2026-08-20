/**
 * A DECLARED DEFAULT MUST SURVIVE THE RUNTIME.
 *
 * `TOOL_DEFAULTS` is where a policy is WRITTEN DOWN: this tool runs on its own,
 * that one asks first, this third one always goes to review. Three separate
 * mechanisms downstream can quietly overrule a line of it, and when they do the
 * declaration keeps reading as though it were in force. That is the worst shape
 * a policy file can take, because the person reading it believes it.
 *
 * The three, each measured by running it rather than reasoned about:
 *
 *   (a) `toolRisk` scores an external partial write "high", and `resolveToolMode`
 *       demotes high-and-auto to "confirm" unless the tool sits in
 *       `BUILD_LANE_AUTONOMOUS`. So a tool declared `auto` queues an approval
 *       anyway and nothing said so. The existing guard in
 *       `tool-consequences.test.ts` scopes itself to `d.mode !== "auto"` on
 *       purpose, so every tool in this class sits outside it by construction.
 *
 *   (b) the loop only creates an approval when the tool's registry category is
 *       `write` or `planning`. A tool declared `confirm` in any other category
 *       runs unattended, and its declaration is decoration.
 *
 *   (c) a risk cap drops every tool above its tier, and because an uncatalogued
 *       tool scores "high" a cap can drop the READS and keep the WRITES. That
 *       tightens an agent by taking away its ability to look at anything while
 *       leaving its ability to change things. `tool-consequences.ts` predicts
 *       exactly this in its own comment and nothing checked it.
 *
 * `CONSEQUENCES` and `RISK_PROFILE` are module-private, so everything here goes
 * through the public surface of `tool-consequences.ts`.
 *
 * HOW THE TWO OPEN CASES ARE HELD. (a) and (b) each have offenders on this tree
 * whose fix lives in a file this test may not touch, so each is asserted with
 * `toEqual` against a named list rather than against `[]`. That is a ratchet in
 * both directions: a NEW offender fails, and a FIXED offender fails too, because
 * the list has to shrink in the same change. Neither can go quiet.
 */
import { describe, it, expect } from "bun:test";
import { TOOL_DEFAULTS } from "@/lib/ai/tools/defaults";
import { TOOL_REGISTRY } from "./registry.server";
import { resolveToolMode } from "@/lib/ai/loop.server";
import {
  CATALOGUED_TOOLS,
  PROFILED_TOOLS,
  filterToolsByRisk,
  toolRisk,
} from "@/lib/tool-consequences";

const ALL_TOOLS = Object.keys(TOOL_DEFAULTS);

/** The category the loop reads when it decides whether to open an approval. */
function categoryOf(tool: string): string {
  return TOOL_REGISTRY[tool]?.category ?? "not-registered";
}

/**
 * The loop's approval branch is `!isControlFlow && isWrite && ...`, and `isWrite`
 * is `category === "write" || category === "planning"` (`ai/loop.server.ts`).
 * Anything outside those two categories cannot reach a gate whatever its
 * declared mode says.
 */
const GATEABLE_CATEGORIES = new Set(["write", "planning"]);

/**
 * Tools whose declared confirm or review can never reach a gate and are meant
 * not to. `ORCHESTRATION_CONTROL_FLOW_TOOLS` in `ai/loop.server.ts` is the set
 * the loop exempts by name and it is module-private, so its members are restated
 * here rather than imported. An entry with no reason should fail review.
 */
const CONTROL_FLOW_EXEMPT: Record<string, string> = {
  "mission.plan": "orchestrator control flow, exempted at the loop's gate by name",
  "mission.dispatch": "orchestrator control flow, exempted at the loop's gate by name",
  "mission.observe": "orchestrator control flow, exempted at the loop's gate by name",
  "mission.finalize": "orchestrator control flow, exempted at the loop's gate by name",
  "critic.evaluate": "advisory verdict, exempted at the loop's gate by name (DEC-02-LOOP)",
};

/**
 * (a) OPEN, and the fix is not in this file's reach.
 *
 * `studio.sync_branch` is catalogued as an external partial write, so `toolRisk`
 * scores it high and the demotion in `resolveToolMode` catches it. Its three
 * lane-mates (`studio.stage`, `studio.commit`, `studio.pr.open`) escape by
 * sitting in `BUILD_LANE_AUTONOMOUS`; this one does not, and
 * `docs/planning/rebuild-2026-07/governance/gov-b-policy-surface.md` lists it in
 * that lane and states it "runs on its own", which is the opposite of what the
 * runtime does. Either the set gains a fourth member in `ai/trust-ramp.ts` or
 * the declaration in `defaults.ts` and that table both come down to `confirm`.
 * `build-verification.test.ts` pins the set to exactly three, so this is a
 * decision rather than a typo, and neither file is in this item's reach.
 */
const DECLARED_AUTO_STILL_DEMOTED = ["studio.sync_branch resolved confirm (risk high)"];

/**
 * (b) OPEN, two entries, and they fail in opposite directions.
 *
 * `web.crawl` is genuinely a read: it changes nothing, and `tool-consequences.ts`
 * says so at its own row. Its `confirm` exists because it spends real credits,
 * and the loop's gate has no notion of spend, only of category. Recategorising a
 * crawl as a write to force the gate would make every risk, audit and boundary
 * surface misreport what it does, so this one needs the loop to admit a
 * spend-gated read, which is a change to `ai/loop.server.ts`.
 *
 * `memory.promote` is the other way round. Promoting a lesson from one agent's
 * scope to the whole workspace IS a write to shared state, and its `confirm`
 * exists so a person signs off on what every agent will then recall. Category
 * `memory` names its domain, not its effect. This one is a category correction
 * in `ai/tools/registry.server.ts`, which this item may not edit.
 */
const DECLARED_GATE_UNREACHABLE = [
  "web.crawl declares confirm in category read",
  "memory.promote declares confirm in category memory",
];

/** The reads an agent cannot do its job without. A cap that removes these has
 *  made the agent more dangerous rather than less. */
const CORE_READS = ["workspace.search", "repo.read", "signals.list"];

describe("the catalogue is real, so no loop below passes by having nothing to check", () => {
  it("has a tool registry above the floor", () => {
    expect(ALL_TOOLS.length).toBeGreaterThan(40);
  });

  it("has a consequence catalogue and a risk profile above the floor", () => {
    expect(CATALOGUED_TOOLS.length).toBeGreaterThan(40);
    expect(PROFILED_TOOLS.length).toBeGreaterThan(40);
  });

  it("has the core reads declared at all", () => {
    expect(CORE_READS.filter((t) => !(t in TOOL_DEFAULTS))).toEqual([]);
  });
});

describe("(a) a tool declared auto resolves to auto on the most permissive arc", () => {
  it("holds for every declared-auto tool, on ambient, with no contract", () => {
    const demoted = ALL_TOOLS.filter((name) => TOOL_DEFAULTS[name]?.mode === "auto")
      .map((name) => ({ name, resolved: resolveToolMode(name, "auto", "ambient", false) }))
      .filter((r) => r.resolved !== "auto")
      // Named, never counted. Knowing WHICH tool is demoted is the whole work of
      // fixing it; a number tells the next reader nothing at all.
      .map((r) => `${r.name} resolved ${r.resolved} (risk ${toolRisk(r.name)})`)
      .sort();
    expect(demoted).toEqual([...DECLARED_AUTO_STILL_DEMOTED].sort());
  });
});

describe("(b) a tool declared confirm or review can actually reach the gate", () => {
  it("holds for every non-auto tool, or it is a named control-flow exemption", () => {
    const unreachable = ALL_TOOLS.filter((name) => TOOL_DEFAULTS[name]?.mode !== "auto")
      .filter((name) => !GATEABLE_CATEGORIES.has(categoryOf(name)))
      .filter((name) => !(name in CONTROL_FLOW_EXEMPT && CONTROL_FLOW_EXEMPT[name].length > 20))
      .map(
        (name) => `${name} declares ${TOOL_DEFAULTS[name]?.mode} in category ${categoryOf(name)}`,
      )
      .sort();
    expect(unreachable).toEqual([...DECLARED_GATE_UNREACHABLE].sort());
  });
});

describe("(c) a risk cap must not block reads while permitting writes", () => {
  const capped = filterToolsByRisk([...ALL_TOOLS], "low");

  it("keeps the core reads inside the tightest cap", () => {
    const dropped = CORE_READS.filter((t) => !capped.allowed.includes(t)).map(
      (t) => `${t} blocked at risk ${toolRisk(t)}`,
    );
    expect(dropped).toEqual([]);
  });

  /** The shape the measurement found: a permitted set with nothing but writes in
   *  it. Read from the cap's own output so the failure message carries the census
   *  that explains it rather than a bare false. */
  function writeOnly(tools: string[]): { onlyWrites: boolean; categories: string[] } {
    const categories = [...new Set(tools.map(categoryOf))].sort();
    const onlyWrites = categories.length > 0 && categories.every((c) => c === "write");
    return { onlyWrites, categories };
  }

  it("does not hand back a permitted set made only of writes", () => {
    const got = writeOnly(capped.allowed);
    expect(got).toEqual({ onlyWrites: false, categories: got.categories });
  });

  it("would say so if it did, which is why the assertion above is worth reading", () => {
    // A positive control rather than a plant. Making the whole repo's low-risk
    // set write-only takes sixteen catalogue edits, so the discrimination is
    // proved by handing the same predicate an input it must reject. Without this
    // a predicate that always answered "not only writes" would look identical.
    const writes = capped.allowed.filter((t) => categoryOf(t) === "write");
    expect(writes.length).toBeGreaterThan(0);
    expect(writeOnly(writes).onlyWrites).toBe(true);
  });
});
