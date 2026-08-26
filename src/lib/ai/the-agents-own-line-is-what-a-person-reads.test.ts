/**
 * THE AGENT'S OWN LINE IS WHAT A PERSON READS (S3 -> S0, 2026-08-27).
 *
 * `agent_runs.output` is the sentence the run transcript prints. Roughly every
 * second turn in the product shows one, which makes it the single most-read
 * model-written string in the application.
 *
 * `humanizeText` guarded the STREAMED text in `runtime.server.ts` from the day
 * it shipped, and never guarded these writes.
 *
 * MEASURED BY S3 ON LIVE DATA, 2026-08-27: **1,375 of 2,773 rows carried an em
 * or en dash — 49.6 percent — newest that same evening.** Against 0 of 1,484
 * `signals.title` once that column was fixed. **Four separate source sweeps this
 * week could not see it**, because no source scanner reads a database, and the
 * founder was looking straight at it.
 *
 * ── WHY A HELPER AND A TEST, RATHER THAN SEVEN EDITS ───────────────────────
 * There were SEVEN `output:` writes in `loop.server.ts` — the final message, two
 * halt branches, an error, a pause, and two more. Patching them one by one fixes
 * today and invites an eighth tomorrow. So they all go through `runOutput`, and
 * this test fails if any write skips it.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = readFileSync(fileURLToPath(new URL("./loop.server.ts", import.meta.url)), "utf8");

describe("every agent_runs.output write is sanitised", () => {
  it("no write assigns a bare variable", () => {
    // `output: someVar,` with nothing between it and the value. The type
    // declaration `output: string;` is not a write and does not match.
    const bare = [...SRC.matchAll(/output: (?!runOutput)([A-Za-z_]\w*),/g)].map((m) => m[1]);
    expect(bare, `these writes skip runOutput: ${bare.join(", ")}`).toEqual([]);
  });

  it("and there are still several of them, so the helper is doing real work", () => {
    // If this drops to 0 the writes were renamed or moved, and the guard above
    // would pass while checking nothing.
    expect(SRC.split("output: runOutput(").length - 1).toBeGreaterThanOrEqual(5);
  });

  it("the helper runs the same sanitiser the streamed path uses", () => {
    expect(SRC).toContain("function runOutput(");
    expect(SRC).toContain("return humanizeText(text);");
  });
});
