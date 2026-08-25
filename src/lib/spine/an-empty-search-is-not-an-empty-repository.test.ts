/**
 * F-58. AN EMPTY `repo.search` IS NOT AN EMPTY REPOSITORY — AND BOTH BUILD
 * SEATS READ IT AS ONE, ON THE ONE ROUND THAT EVER REACHED THEM.
 *
 * `repo.search` is GitHub's CODE SEARCH API, which is an index rather than the
 * repository, and private repositories are frequently not in it. An unindexed
 * repo answers `total_count: 0` exactly as a repo with no match does, and from
 * the caller's side the two are indistinguishable.
 *
 * MEASURED ON THE BOUND REPO, 2026-08-25 at 11:52:
 *
 *   gh api "search/code?q=address+repo:RohitGajaraj/relay-homeowner-app"
 *   -> total_count: 0
 *   gh api "repos/RohitGajaraj/relay-homeowner-app/git/trees/main?recursive=1"
 *   -> src/checkout/AddressStep.tsx
 *
 * **The file the work order was about was sitting in the tree the whole time.**
 * The `builder` seat filed *"All searches for 'address', 'checkout', and related
 * terms returned no results, suggesting either the files are not present in this
 * repository or they are named/structured differently"*, and `qa` agreed that
 * the implementation *"does not exist in the codebase yet"*.
 *
 * BOTH AGENTS REASONED CORRECTLY FROM A FALSE PREMISE, which is what makes this
 * a tool defect and not an agent one, and what makes it unfixable by any amount
 * of retrying: every attempt asks the same blind index the same question and
 * gets the same honest zero. Build has never produced anything, and this is why.
 *
 * WHAT THIS FILE GUARDS is the constraint the fix had to satisfy rather than
 * today's sentences: the seat must be sent to an instrument that cannot miss
 * (`repo.tree` is the git trees API — no index, current by construction) BEFORE
 * it is allowed to conclude that code is absent, and `repo.search` must say so
 * in the half of itself the model reads. Everything below is derived from
 * `TOOL_REGISTRY` and `stationCrew`, so a warning that survives only in a source
 * comment, or a redirection that names a tool the agent cannot reach, fails here
 * rather than on a live run.
 */
import { describe, expect, it } from "bun:test";

import { AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";
import { TOOL_DEFAULTS } from "@/lib/ai/tools/defaults";
import { TOOL_REGISTRY } from "@/lib/ai/tools/registry.server";
import { stationCrew } from "./driver";

/**
 * The description the model is actually handed, taken off the registry entry
 * rather than sliced out of the source.
 *
 * That choice is the test: a comment above the description cannot reach this
 * value, so a fix that explains the index problem to the next human reader and
 * not to the agent cannot pass. F-24 settled the same point on `signals.log` —
 * the description is the half the model sees.
 */
const SEARCH_DESCRIPTION = TOOL_REGISTRY["repo.search"]?.description ?? "";

/** Every tool name the platform knows about, from the policy map. */
const KNOWN_TOOLS: ReadonlySet<string> = new Set(Object.keys(TOOL_DEFAULTS));

/**
 * Tool names a piece of prose mentions, recovered from it.
 *
 * Briefs and descriptions name tools in sentences, because an agent reads the
 * instruction and not a schema. Matching `word.word` against the registry's own
 * key set turns that prose back into a checkable claim, and it cannot invent a
 * name: every candidate has to already be a tool. It is also why `package.json`
 * in the builder's F-56 sentence is ignored rather than mistaken for a tool.
 */
function toolsNamedIn(text: string): string[] {
  const candidates = text.match(/\b[a-z][a-z_]*\.[a-z][a-z_]*\b/g) ?? [];
  return [...new Set(candidates.filter((c) => KNOWN_TOOLS.has(c)))];
}

/** Everything one seat is told, job and filing instruction together. */
function briefFor(station: AgentStation, slug: string): string {
  const seat = stationCrew(station).find((s) => s.slug === slug);
  return seat ? `${seat.job} ${seat.file}` : "";
}

const BUILDER = briefFor("build", "builder");
const QA = briefFor("build", "qa");

describe("the tool says what an empty result does not mean", () => {
  it("is still the registry entry it always was", () => {
    expect(TOOL_REGISTRY["repo.search"]).toBeDefined();
    expect(SEARCH_DESCRIPTION.length).toBeGreaterThan(50);
  });

  /**
   * THE CLAIM ITSELF, in the text the model is given. This is the whole finding
   * in one sentence: the agents were not careless, they were told something
   * false by omission.
   */
  it("denies the inference the two seats drew", () => {
    expect(SEARCH_DESCRIPTION).toMatch(/not evidence the code is absent/i);
  });

  /**
   * AND WHY, because a rule with no cause attached is the half an agent drops
   * first — and the cause is what tells it which repos this applies to.
   */
  it("names the cause rather than only asserting the rule", () => {
    expect(SEARCH_DESCRIPTION).toMatch(/code search index/i);
    expect(SEARCH_DESCRIPTION).toMatch(/private repositor/i);
  });

  /**
   * A PROHIBITION WITH NO ALTERNATIVE GETS THE SAME BEHAVIOUR UNDER A NEW NAME.
   * F-24's lesson. The alternative has to be a tool that exists, or this is a
   * brief instructing an impossible call — the shape F-50 was.
   */
  it("sends the caller somewhere that can answer the question", () => {
    const redirect = toolsNamedIn(SEARCH_DESCRIPTION).filter((t) => t !== "repo.search");
    expect(
      redirect.length,
      "the description forbids an inference and offers nothing",
    ).toBeGreaterThan(0);
    for (const tool of redirect) {
      expect(
        TOOL_REGISTRY[tool],
        `repo.search redirects to ${tool}, which is not a tool`,
      ).toBeDefined();
      expect(
        TOOL_DEFAULTS[tool]?.enabled,
        `repo.search redirects to ${tool}, which is not enabled by default and never reaches the prompt`,
      ).toBe(true);
    }
  });

  /**
   * THE TOOL IS NOT BEING RETIRED. On an indexed public repo it is the cheapest
   * way to find a symbol, and its fragments are worth more than a path list. It
   * was only ever the ABSENCE reading that was unsound, so the original purpose
   * has to survive the correction.
   */
  it("keeps what the tool was already for", () => {
    expect(SEARCH_DESCRIPTION).toContain("GitHub code search scoped to the connected repo");
    expect(SEARCH_DESCRIPTION).toContain("Read-only");
  });
});

describe("the builder establishes the layout before it concludes anything", () => {
  it("exists at all", () => {
    expect(BUILDER.trim().length).toBeGreaterThan(50);
  });

  it("names the instrument that cannot miss", () => {
    expect(BUILDER).toContain("repo.tree");
  });

  it("says plainly that an empty search is not an absence", () => {
    expect(BUILDER).toMatch(/not evidence the code is absent/i);
  });

  /**
   * THE THIRD ANSWER. "I could not find it" and "it is not there" have to stay
   * different sentences, and the seat needs a legitimate way to say the second
   * one — otherwise the prohibition just moves the same conclusion into vaguer
   * words. Same shape as F-56's "say the spec cannot be built with what is
   * present", which sits in this seat's brief four sentences later.
   */
  it("gives it somewhere to go when the tree really is empty", () => {
    expect(BUILDER).toMatch(/the repository does not contain it/i);
  });

  /** The F-56 and F-36 sentences are not collateral of this fix. */
  it("keeps everything this seat was already told", () => {
    expect(BUILDER).toContain("package.json");
    expect(BUILDER).toMatch(/cannot add a dependency/i);
    expect(BUILDER).toContain("Stop at anything your boundary does not let you do alone");
    expect(BUILDER).toContain("studio.commit");
  });
});

describe("the checking seat, which is the more expensive half", () => {
  /**
   * `builder` saying "I cannot find it" costs a station attempt. `qa` saying it
   * is a VERDICT, and it was filed as one — *"The implementation … does not
   * exist in the codebase yet"* — against a repository whose tree held the file.
   * A wrong verdict is worse than an error, because an error stops the run and
   * this one reads as diligence. (F-54, one finding earlier, was the same shape
   * with the wrong branch instead of the wrong instrument.)
   */
  it("is sent to the tree before it may judge anything missing", () => {
    expect(QA).toContain("repo.tree");
    expect(QA).toMatch(/before you judge anything to be missing/i);
  });

  it("is told which instrument misled it", () => {
    expect(QA).toContain("repo.search");
    expect(QA).toMatch(/private repositor/i);
  });

  /** F-50's and F-54's sentences are not collateral of this fix either. */
  it("keeps everything this seat was already told", () => {
    expect(QA).toContain("Say plainly what does not meet it");
    expect(QA).toContain("studio.pr.open");
    expect(QA).toContain("studio.pr.merge");
    expect(QA).toContain("Do not pass work you would not sign off");
  });
});

describe("the property, so a new seat cannot reintroduce the defect", () => {
  /**
   * THE INVARIANT, not today's two seats: any seat anywhere in the spine that is
   * told about `repo.search` must also be told about the tree, because being
   * told about the search alone is exactly the state Build was in. Derived from
   * the crew rather than listed, so a seat added to the catalog tomorrow is
   * covered on the day it is written.
   */
  it.each(AGENT_STATION_ORDER)("%s: no seat is left with the search alone", (station) => {
    for (const seat of stationCrew(station as AgentStation)) {
      const brief = `${seat.job} ${seat.file}`;
      if (!brief.includes("repo.search")) continue;
      expect(
        brief,
        `${station}/${seat.slug} is told about repo.search and not about repo.tree, so an unindexed private repo reads to it as an empty one`,
      ).toContain("repo.tree");
    }
  });

  /**
   * AND EVERY REPO TOOL THESE BRIEFS NAME HAS TO BE REACHABLE. A redirection to
   * a tool that is absent from the registry, or disabled in `TOOL_DEFAULTS` and
   * so dropped from the prompt, is a brief instructing a call the agent cannot
   * see — which is the failure this fix would otherwise be trading for.
   */
  it("names only tools that exist and reach the prompt", () => {
    const named = toolsNamedIn(`${BUILDER} ${QA}`);
    expect(named).toContain("repo.tree");
    for (const tool of named) {
      expect(
        TOOL_REGISTRY[tool],
        `a Build brief names ${tool}, which is not in the registry`,
      ).toBeDefined();
      expect(
        TOOL_DEFAULTS[tool]?.enabled,
        `a Build brief names ${tool}, which is not enabled by default`,
      ).toBe(true);
    }
  });

  /**
   * THE SAME THING IN BOTH PLACES. F-32 was found half-fixed because a retired
   * sentence lived in two files and only one was corrected. The tool's
   * redirection and the seats' redirection have to point at the same tools, or a
   * later edit to one of them silently splits the instruction in two.
   */
  it("redirects to the same tools the Build briefs send the seat to", () => {
    const redirect = toolsNamedIn(SEARCH_DESCRIPTION).filter((t) => t !== "repo.search");
    for (const tool of redirect) {
      expect(BUILDER, `repo.search points at ${tool} and the builder brief does not`).toContain(
        tool,
      );
      expect(QA, `repo.search points at ${tool} and the qa brief does not`).toContain(tool);
    }
  });
});
