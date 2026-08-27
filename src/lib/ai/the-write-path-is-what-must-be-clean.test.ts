/**
 * A COLUMN TOTAL ANSWERS A QUESTION ABOUT HISTORY (S1 → S0, 2026-08-27).
 *
 * This is the methodological finding, and it is worth more than the fix.
 *
 * `agent_runs.output` was wrapped at seven sites and backfilled, and the column
 * then read **0 dashed of 2,777**. Two sessions confirmed that zero, and one of
 * them deleted a render-side bridge on the strength of it.
 *
 * The column was clean and the write path was open. S1 asked the only question
 * that distinguishes them — **how many rows created SINCE the fix carry one** —
 * and the answer was **9, newest 23:30:21 UTC**.
 *
 * After a backfill, a column total says nothing whatsoever about whether the
 * path is closed. It measures the backfill.
 *
 * ── WHAT WAS ACTUALLY OPEN ─────────────────────────────────────────────────
 * An eighth writer, in a different file: `agents.functions.ts` writes the
 * model's own text straight to `agent_runs.output`. And `decisions.rationale`
 * had never been sanitised at all — the newest row in that table carried an em
 * dash on the Decide card, which is the most important surface in the product.
 *
 * The rule this repo keeps re-learning: **sanitise where a value is WRITTEN, not
 * only where it arrives.** A sink is one place; the paths into it are many, and
 * one of them is always missed.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const read = (f: string) => readFileSync(fileURLToPath(new URL(f, import.meta.url)), "utf8");
const AGENTS = read("../agents.functions.ts");
const REGISTRY = read("./tools/registry.server.ts");
const LOOP = read("./loop.server.ts");

describe("every writer of agent_runs.output sanitises", () => {
  it("loop.server.ts routes all of its writes through runOutput", () => {
    const bare = [...LOOP.matchAll(/output: (?!runOutput)([A-Za-z_]\w*),/g)].map((m) => m[1]);
    expect(bare, `unsanitised in loop.server.ts: ${bare.join(", ")}`).toEqual([]);
  });

  it("and so does the eighth writer, in agents.functions.ts", () => {
    // The one the column total hid. It writes the MODEL'S OWN TEXT.
    expect(AGENTS).toContain("output: humanizeText(output + tag)");
  });

  it("including the failure path, which is also a sentence somebody reads", () => {
    expect(AGENTS).toContain('humanizeText(e instanceof Error ? e.message : "Failed")');
  });
});

describe("the decision card, which is the most-read surface in the product", () => {
  it("title and rationale are sanitised at the sink", () => {
    expect(REGISTRY).toContain("title: humanizeText(a.title)");
    expect(REGISTRY).toContain("rationale: humanizeText(a.rationale)");
  });

  it("and so is every alternative that was weighed", () => {
    expect(REGISTRY).toContain("a.alternatives_considered.map((x) => humanizeText(x))");
  });

  it("THE FORECAST MOST OF ALL, because it can never be corrected", () => {
    /*
     * `forecast_claim` is immutable by database trigger: "a forecast you can
     * edit after the outcome is a retrospective, not a forecast". This insert is
     * the only chance to write it clean, for anyone, ever.
     */
    expect(REGISTRY).toContain("forecast_claim: humanizeText(a.forecast_claim)");
    expect(REGISTRY).toContain(
      "forecast_how_we_will_know: humanizeText(a.forecast_how_we_will_know)",
    );
  });
});
