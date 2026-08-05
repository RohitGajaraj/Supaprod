import { describe, it, expect } from "bun:test";
import { TOOL_DEFAULTS } from "@/lib/ai/tools/defaults";
import { ACTION_LABEL, toolActionLabel, stepLabel } from "@/lib/agent-vocabulary";

/**
 * A PERSON MUST BE ABLE TO READ WHAT THE AGENT IS DOING, ON EVERY STATION.
 *
 * THE DEFECT THIS PREVENTS, found by the launch audit 2026-08-05.
 * `ACTION_LABEL` is hand-written and holds TEN entries, every one of them repo,
 * studio or CI. The registry holds 59 tools. So `stepLabel` fell through to the
 * literal word "working" for the other 49, which is EVERY Discover, Decide,
 * Plan, Design, Ship and Learn tool.
 *
 * The effect was uneven in the worst way. In the Build cockpit a person could
 * read "opening a pull request"; on the other six stations the SAME transparency
 * surfaces (AskRunCard, /runs/$missionId, the mission faces, the activity
 * ticker, all of which share this by design) said "working" while an agent
 * drafted their spec, recorded their decision or graded their outcome.
 *
 * For a product whose claim is that the automation is visible, the vocabulary
 * itself was the thing hiding it.
 *
 * The names already existed: TOOL_DEFAULTS carries a written label for all 59,
 * because the boundary screen has to name every tool a person can govern. This
 * holds that they stay reachable, and that the ten hand-written strings keep
 * winning where they read better.
 */

describe("every registered tool can be named to a person", () => {
  const names = Object.keys(TOOL_DEFAULTS);

  it("has a real registry to check against", () => {
    // A sanity floor: if TOOL_DEFAULTS ever empties, the loop below would pass
    // by having nothing to check.
    expect(names.length).toBeGreaterThan(40);
  });

  it("names all of them, with none left as the bare word 'working'", () => {
    const unnamed = names.filter((n) => !toolActionLabel(n));
    expect(unnamed).toEqual([]);
  });

  it("routes a tool_call step through that naming rather than the fallback", () => {
    for (const n of names) {
      expect(stepLabel({ kind: "tool_call", name: n })).not.toBe("working");
    }
  });

  it("keeps the hand-written label where one exists, because it reads better", () => {
    // "reading the repo" beats a derivation of "Repo tree".
    for (const [tool, written] of Object.entries(ACTION_LABEL)) {
      expect(toolActionLabel(tool)).toBe(written);
    }
  });
});

describe("the derivation produces English, not a mangled stem", () => {
  it("doubles the consonant where the verb requires it", () => {
    // The first version of this shipped "scaning for credentials".
    expect(toolActionLabel("studio.secrets.scan")).toBe("scanning for credentials");
  });

  it("drops the silent e rather than keeping it", () => {
    // "Revise a spec" must not become "revisheing" or "reviseing".
    expect(toolActionLabel("prd.revise")).toBe("revising a spec");
  });

  it("never emits a doubled-vowel gerund like 'seing' or 'dying'", () => {
    for (const n of Object.keys(TOOL_DEFAULTS)) {
      const label = toolActionLabel(n) ?? "";
      expect(label).not.toMatch(/\b(se|ye|oe)ing\b/);
    }
  });

  it("never leaks the internal tool id to a person", () => {
    for (const n of Object.keys(TOOL_DEFAULTS)) {
      // A tool id carries a dot; a caption never should.
      expect(toolActionLabel(n)).not.toContain(n);
      expect(stepLabel({ kind: "tool_call", name: n })).not.toContain(".");
    }
  });

  it("still degrades safely for a tool it has never heard of", () => {
    expect(toolActionLabel("not.a.real.tool")).toBeNull();
    expect(stepLabel({ kind: "tool_call", name: "not.a.real.tool" })).toBe("working");
    expect(stepLabel(null)).toBe("starting up");
    expect(stepLabel({ kind: "thought" })).toBe("thinking");
  });
});
