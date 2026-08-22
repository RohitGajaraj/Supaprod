import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TOOL_DEFAULTS } from "@/lib/ai/tools/defaults";
import {
  toolConsequence,
  isSideEffectingTool,
  isCataloguedTool,
  toolRisk,
  isHighRiskTool,
  isExternalTool,
  filterToolsByRisk,
  READ_ONLY_TOOL_NAMES,
  RISK_RANK,
} from "./tool-consequences";

describe("toolConsequence (existing)", () => {
  it("returns the catalogued consequence for a known tool", () => {
    expect(toolConsequence("studio.pr.merge").reversible).toBe("irreversible");
  });
  it("returns a conservative default for an unknown tool", () => {
    const c = toolConsequence("nope.unknown");
    expect(c.reversible).toBe("partial");
  });
  it("isSideEffectingTool is false for a read and true for anything that leaves a row", () => {
    /*
     * REWRITTEN 2026-08-22. This used to be titled "true only for catalogued
     * tools" and asserted `isSideEffectingTool("nope.unknown") === false`, both
     * of which described the old body, `name in CONSEQUENCES`. That body stopped
     * being a side-effect test the day the catalogue was completed to all 59
     * registry tools; see the function's own comment for what the four callers
     * paid for it.
     */
    expect(isSideEffectingTool("memory.remember")).toBe(true);
    expect(isSideEffectingTool("repo.read")).toBe(false);
    expect(isSideEffectingTool("web.search")).toBe(false);
    // Fail closed: an unrecognised name is not a known read, so it is treated as
    // if it changed something. `toolRisk` and `assessTool` already answer that
    // way, and a predicate that called an unvetted tool "read-only research"
    // would be the one door left open into the never-gate consent class.
    expect(isSideEffectingTool("nope.unknown")).toBe(true);
    // A null name is a non-tool gate rather than a tool, and stays out of it.
    expect(isSideEffectingTool(null)).toBe(false);
    expect(isSideEffectingTool(undefined)).toBe(false);
    expect(isSideEffectingTool("")).toBe(false);
  });

  it("isCataloguedTool still answers the question the old predicate was answering", () => {
    // approval-policy's fail-closed branch asks this one. It has to keep saying
    // yes for a read, or all 20 of them drop back onto always-human.
    expect(isCataloguedTool("repo.read")).toBe(true);
    expect(isCataloguedTool("memory.remember")).toBe(true);
    expect(isCataloguedTool("nope.unknown")).toBe(false);
    expect(isCataloguedTool(null)).toBe(false);
  });
});

/**
 * ── THE MIRROR MAY NOT DRIFT FROM THE REGISTRY ────────────────────────────
 *
 * `isSideEffectingTool` answers from `READ_ONLY_TOOLS`, a hand-kept copy of which
 * registry tools carry `category: "read"`. The registry itself is worker-only —
 * importing `registry.server.ts` into a unit test drags in Supabase, the AI
 * runtime and every connector adapter — so the copy exists for the same reason
 * `EXTERNAL_TOOLS` does, and it can go stale for the same reason too.
 *
 * BOTH DIRECTIONS ARE CHECKED, because they fail differently and neither is
 * visible from the other side:
 *   - a read the registry has and the mirror lacks is a read counted as an
 *     unattended write on /today, in mission detail and in the gauntlet's
 *     autonomy ratio, and filed under "ask first" on the consent surface;
 *   - a name left in the mirror after the registry stops calling it a read is a
 *     WRITE filed as read-only research, which is the never-gate class. That is
 *     the direction a membership test cannot see, and it is the worse one.
 *
 * The scan reads source rather than importing, and pairs `name:` with the
 * `category:` that follows it, bounded by a lookahead rather than a character
 * window. That regex is not invented here: it is the one
 * `tool-risk-six-dimensions.test.ts` arrived at after a 900-character window
 * silently dropped `decision.record`, whose description runs 1186 characters.
 */
describe("isSideEffectingTool mirrors the registry's read category", () => {
  function registryCategories(): Array<[string, string]> {
    const dir = join(process.cwd(), "src/lib/ai/tools");
    // Both files: the four `mission.*` tools are defined in orchestrator.server.ts
    // and only imported into the registry array.
    const src = ["registry.server.ts", "orchestrator.server.ts"]
      .map((f) => readFileSync(join(dir, f), "utf8"))
      .join("\n");
    return [
      ...src.matchAll(
        /name:\s*"([^"]+)",(?:(?!\bname:\s*")[\s\S])*?category:\s*"(read|write|memory|planning)"/g,
      ),
    ].map((m) => [m[1], m[2]] as [string, string]);
  }

  const PAIRS = registryCategories();
  const REGISTRY_READS = PAIRS.filter(([, c]) => c === "read").map(([n]) => n);

  it("read a plausible registry, once per tool, with more than one category in it", () => {
    /*
     * Every assertion below passes vacuously against an empty or truncated scan,
     * and the category floor is not decoration: a regex that lost its second
     * capture group would return `undefined` for every category, find zero reads,
     * and make the drift test pass while measuring nothing.
     */
    expect(PAIRS.length).toBeGreaterThan(50);
    expect([...new Set(PAIRS.map(([n]) => n))].length).toBe(PAIRS.length);
    expect(REGISTRY_READS.length).toBeGreaterThan(10);
    expect(PAIRS.filter(([, c]) => c === "write").length).toBeGreaterThan(10);
  });

  it("says false for every registry read and true for every registry non-read", () => {
    const readsCalledWrites = REGISTRY_READS.filter((t) => isSideEffectingTool(t));
    const writesCalledReads = PAIRS.filter(([n, c]) => c !== "read" && !isSideEffectingTool(n)).map(
      ([n]) => n,
    );
    // Named rather than counted: the failure should print which tool to move,
    // since that is the whole work of fixing it.
    expect(
      readsCalledWrites,
      "the registry calls these reads; they are being counted as unattended writes",
    ).toEqual([]);
    expect(
      writesCalledReads,
      "these change something and are being filed as read-only research, which never gates",
    ).toEqual([]);
  });

  it("holds no name the registry no longer calls a read", () => {
    const orphans = READ_ONLY_TOOL_NAMES.filter((t) => !REGISTRY_READS.includes(t));
    expect(
      orphans,
      "these mirror entries answer for nothing, or for a tool that now writes",
    ).toEqual([]);
  });

  it("keeps the one that reads a diff and writes its verdict on the write side", () => {
    /*
     * Named because it is the pair most likely to be 'corrected' by someone
     * reading the consequence sentences instead of the categories.
     * `studio.review` says "Writes no code and opens nothing" and still persists
     * to `studio_changesets.code_review`, so the registry files it under
     * `planning` and it is side-effecting. `studio.checks.run` runs code in a
     * sandbox that is then destroyed, so the registry deliberately files it under
     * `read` and it is not.
     */
    expect(isSideEffectingTool("studio.review")).toBe(true);
    expect(isSideEffectingTool("studio.checks.run")).toBe(false);
  });
});

describe("toolRisk (FND-0.5 blast radius)", () => {
  it("rates any irreversible tool high", () => {
    expect(toolRisk("studio.pr.merge")).toBe("high"); // external + irreversible
  });
  it("rates an external partial write high (commits leave the workspace)", () => {
    expect(toolRisk("github.commit.append")).toBe("high");
    expect(toolRisk("studio.commit")).toBe("high");
  });
  it("rates an external reversible write medium", () => {
    expect(toolRisk("github.pr.open")).toBe("medium");
    expect(toolRisk("calendar.create")).toBe("medium");
  });
  it("rates an internal partial write medium", () => {
    expect(toolRisk("mission.dispatch")).toBe("medium");
    expect(toolRisk("research.synthesize")).toBe("medium");
  });
  it("rates an internal reversible write low", () => {
    expect(toolRisk("memory.remember")).toBe("low");
    expect(toolRisk("tasks.create")).toBe("low");
    expect(toolRisk("notes.create")).toBe("low");
  });
  it("treats local-only repo ops as internal (staging is not an external write)", () => {
    // studio.stage touches the local git index only; nothing leaves the repo until studio.commit.
    expect(isExternalTool("studio.stage")).toBe(false);
    expect(toolRisk("studio.stage")).toBe("low");
  });
  it("fails closed: a real but uncatalogued tool is high (unknown blast radius = maximal)", () => {
    expect(toolRisk("nope.unknown")).toBe("high");
    expect(isHighRiskTool("nope.unknown")).toBe(true);
  });
  it("a null/absent tool name (a non-tool gate) stays neutral medium, never the high chip", () => {
    expect(toolRisk(null)).toBe("medium");
    expect(toolRisk(undefined)).toBe("medium");
  });
  it("risk is a distinct axis from reversibility (a reversible tool can still be medium)", () => {
    // github.pr.open is reversible yet medium-risk because it is external.
    expect(toolConsequence("github.pr.open").reversible).toBe("reversible");
    expect(toolRisk("github.pr.open")).toBe("medium");
  });
  it("isHighRiskTool agrees with toolRisk", () => {
    expect(isHighRiskTool("studio.pr.merge")).toBe(true);
    expect(isHighRiskTool("memory.remember")).toBe(false);
  });
  it("isExternalTool flags only outside-the-workspace tools", () => {
    expect(isExternalTool("github.pr.open")).toBe(true);
    expect(isExternalTool("memory.remember")).toBe(false);
    expect(isExternalTool(null)).toBe(false);
  });
  it("RISK_RANK orders low < medium < high", () => {
    expect(RISK_RANK.low).toBeLessThan(RISK_RANK.medium);
    expect(RISK_RANK.medium).toBeLessThan(RISK_RANK.high);
  });
});

describe("filterToolsByRisk (FND-0.5 allow-list pre-filter)", () => {
  const tools = [
    "memory.remember", // low
    "mission.dispatch", // medium
    "studio.pr.merge", // high
    "github.pr.open", // medium
  ];

  it("a low cap keeps only low-risk tools, blocking the rest with their tier", () => {
    const r = filterToolsByRisk(tools, "low");
    expect(r.allowed).toEqual(["memory.remember"]);
    expect(r.blocked).toEqual([
      { tool: "mission.dispatch", risk: "medium" },
      { tool: "studio.pr.merge", risk: "high" },
      { tool: "github.pr.open", risk: "medium" },
    ]);
  });

  it("a medium cap allows low + medium, blocks high", () => {
    const r = filterToolsByRisk(tools, "medium");
    expect(r.allowed).toEqual(["memory.remember", "mission.dispatch", "github.pr.open"]);
    expect(r.blocked).toEqual([{ tool: "studio.pr.merge", risk: "high" }]);
  });

  it("a high cap allows everything", () => {
    const r = filterToolsByRisk(tools, "high");
    expect(r.allowed).toEqual(tools);
    expect(r.blocked).toEqual([]);
  });

  it("de-dups while preserving first-occurrence order", () => {
    const r = filterToolsByRisk(["memory.remember", "memory.remember", "tasks.create"], "low");
    expect(r.allowed).toEqual(["memory.remember", "tasks.create"]);
  });

  it("handles an empty tool set", () => {
    const r = filterToolsByRisk([], "high");
    expect(r.allowed).toEqual([]);
    expect(r.blocked).toEqual([]);
  });
});

describe("FND-0.5 min-confirm floor coverage (loop gate uses isHighRiskTool)", () => {
  // The loop gate floors a tool to `confirm` when HIGH_RISK_MIN_CONFIRM.has(name) OR
  // isHighRiskTool(name). These lock the systematic half: every high-blast tool is covered,
  // including the one the hand-maintained set missed, while medium/low tools are NOT escalated
  // by the systematic rule (they rely only on the curated manual set).
  it("catches github.commit.append — the high-blast tool the manual set missed", () => {
    expect(isHighRiskTool("github.commit.append")).toBe(true);
  });
  it("covers the other irreversible / external-partial writers", () => {
    expect(isHighRiskTool("studio.commit")).toBe(true);
    expect(isHighRiskTool("studio.pr.merge")).toBe(true);
  });
  it("does not over-escalate medium tools (they floor only via the curated manual set)", () => {
    expect(isHighRiskTool("github.pr.open")).toBe(false);
    expect(isHighRiskTool("calendar.create")).toBe(false);
  });
  it("never floors low-blast internal writes (they stay auto-eligible)", () => {
    expect(isHighRiskTool("memory.remember")).toBe(false);
    expect(isHighRiskTool("tasks.create")).toBe(false);
  });
});

describe("delegate.openhands (governed delegate-out, #5 wiring)", () => {
  it("is catalogued irreversible, external, and high blast radius", () => {
    expect(toolConsequence("delegate.openhands").reversible).toBe("irreversible");
    expect(isExternalTool("delegate.openhands")).toBe(true);
    expect(toolRisk("delegate.openhands")).toBe("high");
    expect(isHighRiskTool("delegate.openhands")).toBe(true);
  });
});

/**
 * EVERY TOOL THAT CAN REACH AN APPROVAL GATE MUST SAY WHAT IT DOES.
 *
 * THE DEFECT THIS PREVENTS, found on the rendered /today on 2026-08-16.
 * `approvals-queue.functions.ts` sets a tool gate's `title` to
 * `consequence.effect`. `title` becomes the `sp-gate-q` heading: 19px, the size
 * this system reserves for "the gate question, biggest thing on a surface".
 * So an uncatalogued tool printed
 *
 *     "Runs the tool with the agent's arguments."
 *
 * as the question a person was being asked to answer. It names no tool, no
 * object and no consequence.
 *
 * Measured when it was found: 59 registered tools, 36 catalogued, 23 falling
 * through, and SIX of those 23 in `confirm` or `review` mode -- so six tools
 * that can actually reach a gate, including revising a decision, revising a
 * spec, reverting a merged release and spawning sub-agents.
 *
 * THIS IS THE SAME DEFECT `every-tool-can-be-named.test.ts` WAS WRITTEN FOR,
 * one map away. That one holds `ACTION_LABEL`, which had ten entries against 59
 * tools and made six of the seven stations say "working". The fix there was
 * derivation plus a guard; the guard could not see this map, so the shape
 * recurred. A sparse lookup with a generic fallback fails silently and looks
 * finished, which is why it needs a test rather than a review.
 *
 * SCOPED TO GATED TOOLS ON PURPOSE. An `auto` tool never renders an approval
 * card, so requiring a blast-radius sentence for all 59 would be busywork that
 * invites a wave of filler entries -- and a filler consequence is worse than
 * none, because it is a claim. The rule is: if it can stop and ask a person,
 * it must be able to tell them what they are approving.
 */
describe("every tool that can reach an approval gate is catalogued", () => {
  const DEFAULT_EFFECT = "Runs the tool with the agent's arguments.";

  it("has a real registry to check against", () => {
    // A floor, so an emptied registry cannot make the next test pass vacuously.
    expect(Object.keys(TOOL_DEFAULTS).length).toBeGreaterThan(40);
  });

  it("leaves no confirm or review tool on the generic default", () => {
    const gated = Object.entries(TOOL_DEFAULTS)
      .filter(([, d]) => d.mode !== "auto")
      .map(([name]) => name);
    expect(gated.length).toBeGreaterThan(0);

    const generic = gated.filter((name) => toolConsequence(name).effect === DEFAULT_EFFECT);
    // Named rather than counted: the failure should print WHICH tool needs an
    // entry, since that is the whole work of fixing it.
    expect(generic).toEqual([]);
  });

  it("keeps the default reachable for a tool that is not registered at all", () => {
    // The default is not dead code. An unregistered or renamed tool must still
    // degrade to a conservative sentence rather than crash or leak its id.
    expect(toolConsequence("nope.not.a.tool").effect).toBe(DEFAULT_EFFECT);
  });
});
