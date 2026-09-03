/**
 * ── FOUR REGIONS BEFORE THE THING BEING ASKED ─────────────────────────────
 *
 * P-37, shapes 2 and 7. The gate card opened with a "Waiting on you" chip and a
 * subject, then the question, then the facts, then the consequence.
 *
 * The chip was A1's shape 2 exactly: *"Waiting on you." beside a "Run it now"
 * button, two verbs for one state.* **A card that is asking IS the waiting**,
 * and the line at the bottom says since when, so the chip was a third statement
 * of one fact competing with the question for the top of the card.
 *
 * These assertions are the ORDER, which is the design, and not the pixels.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
const GATE = strip(readFileSync("src/components/approvals/CallGate.tsx", "utf8"));

describe("the gate card asks once, and asks first", () => {
  it("no longer states the waiting as a chip above the question", () => {
    // The card asking is the waiting. The clock at the bottom says since when.
    expect(GATE).not.toContain("Waiting on you</span>");
    expect(GATE).not.toContain("bg-mrd-you");
  });

  it("leads with the question", () => {
    const q = GATE.indexOf("{question}");
    expect(q).toBeGreaterThan(-1);
    // Nothing renders above it.
    expect(GATE.indexOf("{subject}")).toBeGreaterThan(q);
    expect(GATE.indexOf("{risk}")).toBeGreaterThan(q);
    expect(GATE.indexOf("lines.map")).toBeGreaterThan(q);
  });

  it("puts the risk BEFORE the facts", () => {
    /*
     * The risk is what changes the answer; the facts are what justify it once
     * you know what is at stake. Reading the facts first is reading evidence
     * for a question you have not been told the weight of.
     */
    expect(GATE.indexOf("{risk}")).toBeLessThan(GATE.indexOf("lines.map"));
  });

  it("keeps the risk and the declared default in SEPARATE slots", () => {
    /*
     * A1 walked the served build and the order on screen was wrong while the
     * component's order was right: `consequence` was carrying the DEFAULT
     * sentence, so the thing read second was "Cancelled unrun: nobody answered
     * by...", and the actual risk sat in `lines` as a fact among facts.
     *
     * A fixed order cannot save a card whose slots are ambiguous, so the two
     * sentences have two names. `consequence` survives only as a deprecated
     * alias while the approvals page migrates, and it renders where the DEFAULT
     * renders, never where the risk does.
     */
    expect(GATE).toContain("risk?: string | null;");
    expect(GATE).toContain("declaredDefault?: string | null;");
    expect(GATE.replace(/\s+/g, " ")).toContain(
      "const fallbackLine = declaredDefault ?? consequence ?? null;",
    );
    expect(GATE.indexOf("{risk}")).toBeLessThan(GATE.indexOf("{fallbackLine}"));
  });

  it("puts the declared default last, above the answers", () => {
    const d = GATE.indexOf("{fallbackLine}");
    expect(d).toBeGreaterThan(GATE.indexOf("lines.map"));
    expect(d).toBeLessThan(GATE.indexOf("{children}"));
  });

  it("puts the clock last, so the card does not read as a countdown", () => {
    const clock = GATE.indexOf("Waiting on you for");
    expect(clock).toBeGreaterThan(GATE.indexOf("lines.map"));
    expect(clock).toBeLessThan(GATE.indexOf("{children}"));
  });

  it("draws no second alarm when it is overdue", () => {
    // An overdue gate was turning the clock accent on a card whose whole
    // existence is the alarm. Weight alone carries "this has been a while".
    expect(GATE.replace(/\s+/g, " ")).toContain('overdue ? "font-semibold" : ""');
    expect(GATE).not.toContain("text-mrd-you");
  });
});
