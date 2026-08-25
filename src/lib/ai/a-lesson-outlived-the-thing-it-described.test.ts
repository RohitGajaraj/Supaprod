/**
 * A reflection had no shelf life, so a broken integration became a rule.
 *
 * `autoReflect` fires whenever a run completes cleanly. **Declining is a
 * clean completion** — the agent did its job and reported that it could not
 * justify the work — so a decline is distilled into a lesson, written in the
 * second person, and recalled forever.
 *
 * In workspace `0b792d52` that produced 53 standing prohibitions:
 *
 *   SELECT count(*), count(*) FILTER (WHERE content ILIKE 'you must not%'
 *                                        OR content ILIKE 'you must decline%')
 *     FROM agent_memory WHERE workspace_id = '0b792d52-...';
 *   -- 308 | 53
 *
 * They were being read back. At 03:10:01 on 2026-08-25 the `strategist`
 * recalled four memories before it ran, three of which ordered it to decline;
 * it declined, and wrote a fifth. The `critic` repeated it 26 seconds later.
 * The join is `memory_recall_log` -> `agent_memory`, and the prohibitions had
 * crossed subjects: a notification track was declined on lessons written
 * about dark mode, because recall is semantic and "no evidence" matches
 * everything.
 *
 * The condition underneath was real and repairable — `scout_targets` is 0
 * rows in that workspace, so no primary evidence could exist. The defect is
 * that a fact about that day was stored as a law.
 *
 * WHAT THIS FILE GUARDS is the one-sided failure. A malformed or missing flag
 * must EXPIRE the lesson, never keep it: a lesson wrongly expired is
 * re-learned on the next run, and a transient one wrongly kept is the whole
 * paragraph above.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

import { namesACurrentCondition } from "./reflection.server";

const SRC = readFileSync(fileURLToPath(new URL("./reflection.server.ts", import.meta.url)), "utf8");

/**
 * The source with comments stripped.
 *
 * This file's own reasoning quotes the sentence it exists to keep out, and a
 * test that reads its neighbour's comments will pass on prose while the code
 * beneath it says the opposite. Assert on the code.
 */
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("a lesson that depends on today gets a shelf life", () => {
  it("asks the model whether the lesson depends on the workspace's current state", () => {
    expect(CODE).toContain('"depends_on_current_state":boolean');
  });

  it("writes the column that already existed and that nothing ever set", () => {
    expect(CODE).toContain("expires_at: expiresAt");
  });

  /**
   * THE ASSERTION THAT MATTERS. `=== false ? null : <expiry>` means only an
   * explicit, well-formed "this is durable" earns permanence. `?? true`
   * inverted — or a truthiness check — would hand every malformed response a
   * permanent memory, which is exactly the bug.
   */
  it("expires the lesson unless the model explicitly said it was durable", () => {
    // The shape changed the same hour it shipped: the flag alone was not enough
    // (see the second describe below), so keeping a lesson forever now needs the
    // flag AND a text that names no system. The claim is unchanged — only an
    // explicit, well-formed durable answer earns permanence — so this assertion
    // moved with it rather than being deleted.
    expect(CODE).toContain("parsed?.depends_on_current_state === false");
    expect(CODE).toMatch(/=== false && !namesACurrentCondition\(lesson\)\s*\n?\s*\?\s*null/);
  });

  it("keeps the window short enough that a repaired condition stops speaking", () => {
    expect(CODE).toContain("7 * 24 * 60 * 60 * 1000");
  });

  /**
   * Kept on the row rather than only in the expiry, so a later reader can ask
   * why a memory died without re-deriving it from the timestamp.
   */
  it("records the model's own claim on the memory", () => {
    expect(CODE).toContain("depends_on_current_state: parsed?.depends_on_current_state ?? null");
  });
});

describe("the instruction that manufactured the prohibitions is gone", () => {
  /**
   * A lesson is about METHOD. The prompt previously asked only for a lesson
   * "in second person", and second person plus a failed run reliably produces
   * "You must not ...".
   */
  it("tells the agent a lesson is about how it works, not about what the workspace holds", () => {
    expect(CODE).toContain(
      "A lesson is about HOW YOU WORK, not about what this workspace currently contains",
    );
  });

  it("forbids the standing prohibition by name", () => {
    expect(CODE).toContain("Never write a standing prohibition on work you may not do");
  });
});

describe("the reasoning stays with the mechanism", () => {
  /**
   * This is the second time a recall default has stalled the whole product
   * (the first was the 30-day evidence window). Both were one constant. A
   * bare `7` invites the third.
   */
  it("records the measurement and the date next to the rule", () => {
    const prose = SRC.replace(/\n\s*\* ?/g, " ").replace(/\s+/g, " ");
    expect(prose).toContain("2026-08-25");
    expect(prose).toContain("53");
    expect(prose).toContain("scout_targets");
  });
});

/**
 * THE FLAG WAS MEASURED THE SAME HOUR AND FOUND TO BE ONE-SIDED.
 *
 * In the first five reflections written after `depends_on_current_state`
 * shipped, the model answered `false` — durable — **every time**, including
 * twice for lessons that existed only because GitHub was returning 401 that
 * afternoon. Asked "is this about how you work?", a model will nearly always
 * say yes, because almost any lesson can be phrased that way. **A self-report
 * that is never negative is not a classifier**, so the flag is kept and no
 * longer trusted alone.
 */
describe("a lesson that names a system does not get to be permanent", () => {
  it("expires the two real lessons that a 401 produced", () => {
    for (const lesson of [
      "You must halt immediately and report GitHub authentication failure instead of attempting partial work.",
      "You must verify authentication and repository access before attempting spec validation.",
    ]) {
      expect({ lesson, transient: namesACurrentCondition(lesson) }).toEqual({
        lesson,
        transient: true,
      });
    }
  });

  it("expires the lessons that taught the workspace to refuse", () => {
    for (const lesson of [
      "You must decline workstreams when primary evidence is absent and telemetry infrastructure is broken.",
      "You must verify customer demand with falsifiable evidence such as ingested Canny signals or active scout targets.",
    ]) {
      expect(namesACurrentCondition(lesson)).toBe(true);
    }
  });

  /**
   * THE OTHER HALF, and the one that keeps this from being a blanket expiry.
   * A lesson about method names no system and stays permanent.
   */
  it("leaves a lesson about method alone", () => {
    for (const lesson of [
      "You should prioritize defining clear success metrics early when drafting complex PRDs.",
      "You must derive concrete, executable tasks from the spec's explicit requirements.",
      "You must distinguish between internal audit findings and verbatim customer quotes.",
    ]) {
      expect({ lesson, transient: namesACurrentCondition(lesson) }).toEqual({
        lesson,
        transient: false,
      });
    }
  });

  it("is wired into the expiry, not merely exported", () => {
    expect(CODE).toContain("!namesACurrentCondition(lesson)");
  });

  /**
   * The failure stays one-sided in BOTH mechanisms: a missing flag expires, and
   * a flag that says durable is overridden when the text names a system. A
   * lesson wrongly expired is re-learned next run; a transient one wrongly kept
   * is what this file's header is about.
   */
  it("requires BOTH the flag and the text to keep a lesson forever", () => {
    expect(CODE).toMatch(/=== false && !namesACurrentCondition\(lesson\)/);
  });
});
