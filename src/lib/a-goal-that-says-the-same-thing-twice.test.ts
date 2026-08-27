/**
 * F-121: THE MISSION GOAL SAID THE SAME SENTENCE TWICE (S1 -> S0, 2026-08-27).
 *
 *   goal: row.origin ? `${row.title}. ${row.origin}` : row.title
 *
 * When a track's origin IS its title, that composes the sentence, a full stop,
 * and the sentence again. Live on `6199f3df`, and stored that way in
 * `missions.goal` rather than doubled at render time, so it is a bad row and not
 * a bad render.
 *
 * MEASURED, both populations: 1 of 106 tracks has an origin character-identical
 * to its title, 3 more begin with the title and add to it, and 2 of 397 missions
 * with a goal repeat themselves. Low only because most existing tracks were
 * seeded another way: **the sentence a person types at `/start` becomes both the
 * title and the origin**, so exact-match is the natural result of the newest way
 * to start work.
 *
 * ── THE TEST THIS FILE EXISTS FOR IS THE FIRST ONE ─────────────────────────
 * A rule written to remove duplication is one edit from removing the thing worth
 * reading, and nobody files a bug about a good line going missing. So the suite
 * leads with a real origin that carries its own fact and requires it to survive
 * untouched.
 */
import { describe, expect, it } from "bun:test";

import { ORIGIN_REMAINDER_MIN, originLine, trackGoalSentence } from "@/lib/track-origin";

const TITLE = "The saved address dropdown shows deleted addresses after a customer removes one";

describe("an origin that carries its own fact survives whole", () => {
  const REAL =
    "This became work on its own because 9 signals say it, severity 4, and the cluster is 78% confident these belong together";

  it("is returned untouched", () => {
    expect(originLine(TITLE, REAL)).toBe(REAL);
  });

  it("and the composed goal keeps both halves", () => {
    const goal = trackGoalSentence(TITLE, REAL);
    expect(goal).toBe(`${TITLE}. ${REAL}`);
  });

  it("a merely SIMILAR origin is not trimmed, because only a literal prefix is", () => {
    // Paraphrase, not repetition. Anything cleverer here would be a rule that
    // deletes writing on a judgement call.
    const para = "Deleted saved addresses are still appearing in the dropdown";
    expect(originLine(TITLE, para)).toBe(para);
  });

  it("an origin sharing only an opening clause survives", () => {
    const shared = "The saved address book needs an audit before the next release";
    expect(originLine(TITLE, shared)).toBe(shared);
  });
});

describe("the duplication it was written for", () => {
  it("an identical origin adds nothing", () => {
    expect(originLine(TITLE, TITLE)).toBeNull();
  });

  it("and the goal is then the title alone, said once", () => {
    expect(trackGoalSentence(TITLE, TITLE)).toBe(TITLE);
  });

  it("case and spacing do not save a duplicate", () => {
    // A title reflowed through a model round trip is the same title.
    expect(originLine(TITLE, `  ${TITLE.toUpperCase()}  `)).toBeNull();
    expect(originLine(TITLE, TITLE.replace(/ /g, "  "))).toBeNull();
  });

  it("a prefix keeps only what follows it, without the joining punctuation", () => {
    const extra = "and it happens only on the tablet checkout screen";
    expect(originLine(TITLE, `${TITLE}. ${extra}`)).toBe(extra);
    expect(originLine(TITLE, `${TITLE} - ${extra}`)).toBe(extra);
  });

  it("a scrap left over is dropped rather than shown", () => {
    /*
     * The failure this prevents is a second line reading "...one." under the
     * sentence it came from, which is worse than showing nothing: it looks like
     * a truncation bug and teaches the reader that the second line is noise.
     */
    const scrap = "x".repeat(ORIGIN_REMAINDER_MIN - 1);
    expect(originLine(TITLE, `${TITLE}. ${scrap}`)).toBeNull();
    const kept = "y".repeat(ORIGIN_REMAINDER_MIN);
    expect(originLine(TITLE, `${TITLE}. ${kept}`)).toBe(kept);
  });
});

describe("the empties, none of which may produce a stray full stop", () => {
  it("no origin", () => {
    expect(originLine(TITLE, null)).toBeNull();
    expect(trackGoalSentence(TITLE, null)).toBe(TITLE);
    expect(trackGoalSentence(TITLE, "   ")).toBe(TITLE);
  });

  it("no title", () => {
    expect(originLine(null, "something")).toBe("something");
    // My first version returned ". something" here. A composed sentence should
    // read like one a person wrote, and a leading full stop never does.
    expect(trackGoalSentence(null, "something")).toBe("something");
  });

  it("neither", () => {
    expect(trackGoalSentence(null, null)).toBe("");
  });
});

describe("the driver composes through the rule", () => {
  it("driver.server no longer concatenates title and origin itself", async () => {
    const { readFileSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const SRC = readFileSync(
      fileURLToPath(new URL("./spine/driver.server.ts", import.meta.url)),
      "utf8",
    );
    // Comment lines stripped first: the explanation quotes the old shape, and a
    // guard that matches its own comment is a guard I have already shipped twice.
    const code = SRC.split("\n")
      .filter((l) => !l.trim().startsWith("*") && !l.trim().startsWith("//"))
      .join("\n");
    expect(code).toContain("goal: trackGoalSentence(row.title, row.origin)");
    expect(code).not.toContain("`${row.title}. ${row.origin}`");
  });
});
