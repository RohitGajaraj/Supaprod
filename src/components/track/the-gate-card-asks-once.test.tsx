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
 *
 * ── RETIRED FROM `approvals/CallGate.tsx` TO `track/TrackConsent.tsx` (P-53) ─
 * CallGate is deleted. Its one remaining composer's answer area -- numbered
 * custom buttons, an inline decline-reason field, a class-wide "answer all N"
 * action, a snooze that stays a fourth verb -- does not fit `Ask`'s fixed
 * question/risk/reason/fallback/answer/decline shape, which has no `children`
 * slot at all. Rather than force it or leave `CallGate` alive for one caller,
 * `TrackConsent.tsx` carries CallGate's exact render as `GateCard`, its own
 * last hand-built gate. This file moved with it; every invariant below is
 * unchanged, read off `GateCard` instead of `CallGate`.
 */
import { afterEach, describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { render, screen, cleanup } from "@testing-library/react";

import { GateCard } from "@/components/track/TrackConsent";

afterEach(cleanup);

const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
const SRC = strip(readFileSync("src/components/track/TrackConsent.tsx", "utf8"));
/** `GateCard`'s own function body, so a match cannot be satisfied by a
 *  neighbour (`TrackConsent` itself also mentions `risk`, `lines`, etc). */
const GATE = (() => {
  const start = SRC.indexOf("export function GateCard(");
  expect(start, "GateCard is not exported from TrackConsent.tsx any more").toBeGreaterThan(-1);
  const open = SRC.indexOf("{", SRC.indexOf(")", start));
  let depth = 0;
  for (let i = open; i < SRC.length; i += 1) {
    if (SRC[i] === "{") depth += 1;
    else if (SRC[i] === "}") {
      depth -= 1;
      if (depth === 0) return SRC.slice(start, i + 1);
    }
  }
  throw new Error("GateCard has no closing brace");
})();

/** True when `a` comes before `b` in document order. */
function precedes(a: Element, b: Element): boolean {
  return Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
}

describe("the gate card asks once, and asks first", () => {
  it("carries no chip: a card that is asking IS the waiting", () => {
    expect(GATE).not.toContain("Waiting on you</span>");
    expect(GATE).not.toContain("bg-mrd-you");
  });

  it("leads with the question, then the subject, then the risk, then the facts", () => {
    render(
      <GateCard
        question="Let it run?"
        subject="tablet-track"
        since={null}
        now={0}
        lines={["A fact."]}
        risk="It cannot be undone."
      />,
    );
    const question = screen.getByText("Let it run?");
    const subject = screen.getByText("tablet-track");
    const risk = screen.getByText("It cannot be undone.");
    const fact = screen.getByText("A fact.");
    expect(precedes(question, subject)).toBe(true);
    expect(precedes(subject, risk)).toBe(true);
    expect(precedes(risk, fact)).toBe(true);
  });

  it("keeps the risk and the declared default in SEPARATE slots", () => {
    /*
     * A1 walked the served build and the order on screen was wrong while the
     * component's order was right: `consequence` was carrying the DEFAULT
     * sentence, so the thing read second was "Cancelled unrun: nobody answered
     * by...", and the actual risk sat in `lines` as a fact among facts.
     *
     * A fixed order cannot save a card whose slots are ambiguous, so the two
     * sentences have two names, and P-53's `GateCard` kept both.
     */
    expect(GATE).toContain("risk?: string | null;");
    expect(GATE).toContain("declaredDefault?: string | null;");
    render(
      <GateCard
        question="Let it run?"
        since={null}
        now={0}
        lines={[]}
        risk="It cannot be undone."
        declaredDefault="Cancelled unrun: nobody answered by Sun, Sep 6."
      />,
    );
    const risk = screen.getByText("It cannot be undone.");
    const fallback = screen.getByText("Cancelled unrun: nobody answered by Sun, Sep 6.");
    expect(precedes(risk, fallback)).toBe(true);
  });

  it("the deprecated consequence alias never came back", () => {
    // P-51 (A-QUEUE.md): the alias existed only while the two composers
    // migrated to risk/declaredDefault, and P-53 deleted CallGate outright.
    // A prop named `consequence` reappearing on the one gate card left would
    // be the same regression under a new roof.
    expect(GATE).not.toMatch(/\bconsequence\??:\s/);
    expect(GATE).not.toContain("consequence,");
    expect(GATE).not.toContain("consequence ??");
  });

  it("puts the declared default last, above the answers", () => {
    render(
      <GateCard
        question="Let it run?"
        since={null}
        now={0}
        lines={["A fact."]}
        declaredDefault="Nothing runs until you answer."
      >
        <button type="button">Approve</button>
      </GateCard>,
    );
    const fact = screen.getByText("A fact.");
    const fallback = screen.getByText("Nothing runs until you answer.");
    const answer = screen.getByRole("button", { name: "Approve" });
    expect(precedes(fact, fallback)).toBe(true);
    expect(precedes(fallback, answer)).toBe(true);
  });

  it("puts the clock last, so the card does not read as a countdown", () => {
    const since = Date.now() - 60_000;
    render(
      <GateCard question="Let it run?" since={since} now={Date.now()} lines={["A fact."]}>
        <button type="button">Approve</button>
      </GateCard>,
    );
    const fact = screen.getByText("A fact.");
    const clock = screen.getByText(/Waiting on you for/);
    const answer = screen.getByRole("button", { name: "Approve" });
    expect(precedes(fact, clock)).toBe(true);
    expect(precedes(clock, answer)).toBe(true);
  });

  it("draws no second alarm when it is overdue", () => {
    // An overdue gate was turning the clock accent on a card whose whole
    // existence is the alarm. Weight alone carries "this has been a while".
    expect(GATE.replace(/\s+/g, " ")).toContain('overdue ? "font-semibold" : ""');
    expect(GATE).not.toContain("text-mrd-you");
  });
});
