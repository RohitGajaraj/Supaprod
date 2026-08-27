/**
 * F-146: `/proof` PUBLISHED AN UNREADABLE LIST AS AN EMPTY ONE.
 *
 * Found by S4. `listPublicDecisions` returned `[]` on an error AND in a bare
 * catch, with no log and no marker, and it feeds **the page whose entire job is
 * showing real decisions as evidence**. So "the database did not answer" and
 * "there are no public decisions" produced the same screen, on the one surface
 * where that distinction IS the product.
 *
 * ── THE SENTENCE THAT MADE IT A LIE RATHER THAN A GAP ──────────────────────
 * The empty state reads: *"No public decisions yet ... That is why this section
 * is honestly empty until one exists."* It is a good sentence and it **claims
 * honesty about an emptiness the page had not established**. The head of the
 * same route says *"We publish our own calibration score. Including the
 * misses."* A page arguing that it publishes numbers it cannot dress up must
 * not quietly publish an empty list it could not read.
 *
 * ── THE ROUTE WAS ALREADY RIGHT AND COULD NOT ACT ──────────────────────────
 * It uses `Promise.allSettled` and already has an honest `tableReady: false`
 * state for the calibration half, with a comment explaining why the route rather
 * than the reader should decide. **But the reader caught internally, so the
 * rejected branch could never fire.** Both halves were needed: a reader that
 * distinguishes, and a page that says which.
 *
 * A missing column still fails soft (`read-failure.ts`): a public marketing page
 * must not 500 because a migration has not landed.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const flat = (t: string) => t.replace(/\s+/g, " ");
const READER = readFileSync(
  fileURLToPath(new URL("./decisions-share.functions.ts", import.meta.url)),
  "utf8",
);
const PAGE = flat(
  readFileSync(fileURLToPath(new URL("../routes/proof.tsx", import.meta.url)), "utf8"),
);

describe("the reader tells a failure from an empty table", () => {
  it("the blanket swallow is gone", () => {
    expect(READER).not.toContain("if (error || !data) return [];");
    expect(READER).not.toContain("} catch {\n      return [];\n    }");
  });

  it("a real failure is raised", () => {
    expect(READER).toContain("The public decisions could not be read");
  });

  it("a missing column still fails soft, because a public page must not 500", () => {
    // Migrations and deploys are two switches with no enforced order.
    expect(READER).toContain("if (isPreMigration(error)) return [];");
  });

  it("and anything genuinely unexpected still degrades, but says so", () => {
    // A marketing page falling over is worse than a quiet one; a silent one is
    // worse than both, which is why this logs.
    expect(READER).toContain("public decisions unavailable");
  });
});

describe("the page says which, which is the half that reaches a person", () => {
  it("the route carries the distinction", () => {
    expect(PAGE).toContain('decisionsUnreadable: dec.status === "rejected"');
  });

  it("and the component reads it", () => {
    expect(PAGE).toContain("const { calibration, decisions, decisionsUnreadable }");
  });

  it("an unreadable list does not claim to be honestly empty", () => {
    /*
     * The whole finding in one assertion. "That is why this section is honestly
     * empty until one exists" is a claim about the record; it must not appear
     * when the record was never read.
     */
    expect(PAGE).toContain("this is not a list of no decisions");
    expect(PAGE).toContain("could not read them");
  });

  it("and the genuinely-empty sentence survives, because it is the right one", () => {
    // The fix must not trade a false claim for a vaguer page. A workspace with
    // no public decisions still gets the sentence that explains why.
    expect(PAGE).toContain("honestly empty until one exists");
  });

  it("neither sentence carries machine punctuation", () => {
    for (const line of [
      "These did not load, so this is not a list of no decisions.",
      "It is a page that could not read them.",
    ]) {
      expect(line).not.toMatch(/[–—]/);
    }
  });
});
