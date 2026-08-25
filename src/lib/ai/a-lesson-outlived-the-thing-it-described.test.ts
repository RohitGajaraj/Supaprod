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
    expect(CODE).toContain("parsed?.depends_on_current_state === false");
    expect(CODE).toMatch(/=== false\s*\?\s*null/);
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
