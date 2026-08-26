/**
 * OBSERVED BEHAVIOUR IS EVIDENCE TOO (2026-08-27).
 *
 * `signals.log` defined a signal as *"evidence that EXISTS, in the words of the
 * source (user feedback, a support ticket, an interview quote)"*. Every example
 * was a verbatim human utterance, so a crew reading it concluded that MEASURED
 * BEHAVIOUR is not a signal.
 *
 * ── WHAT IT COST, MEASURED ─────────────────────────────────────────────────
 * Track `a30238f5` is about letting returning customers reuse a saved delivery
 * address. Its workspace holds **258 signals, 33 tagged `redundant-address-entry`
 * and 18 `address-friction`**. All three Discover agents found the evidence and
 * refused it on the definition:
 *
 *   "no user-sourced signals exist ... all available references
 *    (41% abandonment on address re-confirm, session replays)"
 *
 * It filed **zero artifacts across twelve drives** and went terminal on the F-43
 * ceiling. So did the other sense-entry track. Both sense-entry tracks on the
 * real workspace died at the first station, in a workspace full of evidence.
 *
 * ── THE FIX IS A DEFINITION, NOT A LOOSENING ───────────────────────────────
 * The two refusals in this description exist for good reasons and neither
 * wanted this. One forbids filing the ABSENCE of evidence (the loop eating its
 * own exhaust). The other forbids citing the product's OWN artifacts (F-73, a
 * PRD cited as customer evidence). A session replay and an abandonment rate are
 * neither: they come from outside the loop and they are about the world.
 *
 * This file pins the widening AND both refusals, because the danger in widening
 * a definition is that the next edit takes the refusals with it.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = readFileSync(
  fileURLToPath(new URL("./tools/registry.server.ts", import.meta.url)),
  "utf8",
);
const at = SRC.indexOf('name: "signals.log"');
const DESC = SRC.slice(at, SRC.indexOf("category:", at));

describe("a signal is anything from outside the loop, about the world", () => {
  it("admits observed behaviour by name", () => {
    for (const kind of ["session replay", "abandonment measurement", "error rate"]) {
      expect(DESC.toLowerCase(), `${kind} is still excluded`).toContain(kind);
    }
  });

  it("still admits the spoken kinds", () => {
    for (const kind of ["user feedback", "support ticket", "interview"]) {
      expect(DESC.toLowerCase()).toContain(kind);
    }
  });

  it("and states the test in one line a crew can apply", () => {
    expect(DESC).toContain("came from outside this product");
    expect(DESC).toContain("not that it is a sentence somebody said");
  });
});

describe("THE TWO REFUSALS SURVIVE THE WIDENING", () => {
  it("filing the absence of evidence is still forbidden", () => {
    // The loop eating its own exhaust: 'No signals found' is an answer, not a
    // signal, and filing it puts a run's own failure into the evidence pool.
    expect(DESC).toContain("NEVER log the absence of evidence");
    expect(DESC).toContain("Finding nothing and filing nothing is a correct");
  });

  it("citing the product's own work is still forbidden", () => {
    // F-73: a track cleared Discover by citing ANOTHER track's PRD as evidence
    // about the world.
    expect(DESC).toContain("NEVER cite this product's own work as a source");
    expect(DESC).toContain("the refusal is not a bug to work around");
  });

  it("and the widening never mentions an artifact kind as an example", () => {
    // The failure mode of this edit: admitting "a PRD" as observed behaviour.
    const examples = DESC.slice(0, DESC.indexOf("NEVER log"));
    for (const own of ["prd", "spec", "decision", "changeset", "mission", "forecast"]) {
      expect(examples.toLowerCase(), `${own} leaked into the examples`).not.toContain(` ${own}`);
    }
  });
});
