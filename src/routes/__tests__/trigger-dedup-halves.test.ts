import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * THE TWO HALVES OF TRIGGER DEDUP MUST SHIP TOGETHER.
 *
 * THE INCIDENT THIS PREVENTS, 2026-08-05, caused by exactly this drift.
 *
 * `autoTitle` used to prefix every proposal title with "[auto] ", and the tick
 * found its own open work by testing for that prefix. The prefix was a machine
 * dedup key living in a DISPLAY column, it leaked to the founder three times, so
 * it was retired: autoTitle now returns a clean title and provenance moved to
 * `missions.auto_trigger_source`.
 *
 * Those are two files. `trigger.ts` shipped and `trigger-tick.ts` did not.
 *
 * With clean titles and a title-based filter, `isAutoMissionTitle` matched
 * NOTHING, `openTitles` came back empty, dedup was silently disabled, and the
 * tick re-proposed its entire backlog every 15 minutes: 15 missions a tick,
 * roughly 1400 a day, into the workspace a launch visitor would land in.
 *
 * NOTHING CAUGHT IT. tsc was clean, because both halves are individually valid
 * TypeScript. The unit tests were clean, because `evaluateTriggers` is pure and
 * was being handed an already-correct `openTitles` by its own tests. It was only
 * found by querying production and noticing missions arriving in fifteens.
 *
 * That is what this test is for: it is a CONSISTENCY check across two files that
 * no type or unit test can see, in the house source-scan style of
 * design-tempo-font-guard.test.ts.
 */

const SRC = join(import.meta.dir, "..", "..");
const read = (rel: string) => readFileSync(join(SRC, rel), "utf8");

const TICK = "routes/api/public/hooks/trigger-tick.ts";
const POLICY = "lib/sensing/trigger.ts";

/** Comments legitimately discuss the retired prefix, so they are stripped first. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

describe("trigger dedup: the two halves agree", () => {
  const tick = stripComments(read(TICK));
  const policy = stripComments(read(POLICY));

  // Guard against a broken reader making everything below pass vacuously.
  it("reads both files", () => {
    expect(tick.length).toBeGreaterThan(500);
    expect(policy.length).toBeGreaterThan(500);
  });

  it("autoTitle does not write the retired marker into a title", () => {
    const body = policy.slice(policy.indexOf("function autoTitle"));
    const fn = body.slice(0, body.indexOf("\n}"));
    expect(fn).not.toContain("AUTO_TITLE_PREFIX");
  });

  it("the tick stamps provenance on the mission it creates", () => {
    expect(tick).toContain('auto_trigger_source: "trigger"');
  });

  it("the tick SELECTS the column it dedups on", () => {
    expect(tick).toMatch(/\.select\("title, status, auto_trigger_source"\)/);
  });

  it("openTitles filters on the column, never on the retired prefix", () => {
    const start = tick.indexOf("const openTitles");
    expect(start).toBeGreaterThan(-1);
    const block = tick.slice(start, start + 500);
    expect(block).toContain("auto_trigger_source");
    // The exact shape of the live incident: a title-prefix test here while
    // autoTitle writes clean titles means dedup matches nothing.
    expect(block).not.toContain("isAutoMissionTitle");
  });

  it("the tick stamps decision provenance too, or the Auto chip goes blank", () => {
    expect(tick).toContain("auto_origin: true");
  });
});
