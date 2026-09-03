/**
 * AN ASK ASKS, THEN SHOWS ITS REASONS, THEN OFFERS THE ANSWERS. IN THAT ORDER.
 *
 * P-53 (A-QUEUE.md). `Gate` carried this invariant and is gone: its twenty
 * call sites moved to `Ask`, `Choice` or `Quiet`, and `Ask` is the one that
 * inherits the shape this file used to pin.
 *
 * ── THE REGRESSION THIS EXISTS TO STOP, WHICH ALREADY SHIPPED ONCE ──────
 * 2026-08-05. A change meant to make agent reasoning "visibly obvious" lifted
 * the evidence OUT of the gate into a titled block placed after it. The
 * actions render last, so that put the reasoning BELOW the Approve button: a
 * person was asked to decide, with a keyboard shortcut, above the reasons for
 * deciding. `Gate.tsx` and `Ask.tsx` both carry the story in their own
 * headers, and `Ask`'s own contract makes the same claim `Gate`'s did: "THE
 * ORDER IS NOT A PROP, and that is the point of having a component at all."
 *
 * ── WHY THIS TEST STILL LIVES WITH SHIP ──────────────────────────────────
 * Ship carried four `Gate`s before P-53; two survive as real `Ask`s ("Take X
 * to production?", the one that reaches customers, and "Send X to
 * customers?", the pending-post publish). The other two turned out not to be
 * binary asks at all on a closer read (a zero state, and a status that is
 * sometimes a multi-verb draft workflow with no real decline) and moved to
 * `Quiet` or a plain heading instead -- see `_authenticated.ship.tsx` itself
 * for that reasoning. This file keeps the promote case, the one that reaches
 * customers.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { render, screen } from "@testing-library/react";

import { Ask } from "@/components/meridian/Ask";

/** True when `a` comes before `b` in document order. */
function precedes(a: Element, b: Element): boolean {
  return Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
}

describe("the order inside an Ask is the component, not the caller's layout", () => {
  it("puts the question above the risk, the risk above the reason, and both above the answers", () => {
    render(
      <Ask
        question='Take "Batch firmware push" to production?'
        risk="Customers see it immediately, and undoing it means a revert."
        reason="Merged 2h ago into Supaprod."
        fallback={{ kind: "irreversible" }}
        answer={{ label: "Promote it", onPress: () => {} }}
        decline={{ label: "Not now", onPress: () => {} }}
      />,
    );

    const question = screen.getByText('Take "Batch firmware push" to production?');
    const risk = screen.getByText(/Customers see it immediately/);
    const reason = screen.getByText(/Merged 2h ago/);
    const answer = screen.getByRole("button", { name: /Promote it/ });
    const decline = screen.getByRole("button", { name: /Not now/ });

    expect(precedes(question, risk)).toBe(true);
    expect(precedes(risk, reason)).toBe(true);
    expect(precedes(reason, answer)).toBe(true);
    expect(precedes(answer, decline)).toBe(true);
  });

  it("keeps the declared default above the answers, never below", () => {
    // The default line is what happens if nobody presses anything, so it
    // reads as a countdown if it sits below the two things a person can do
    // about it instead.
    render(
      <Ask
        question="Publish it?"
        fallback={{ kind: "reversible", whatHappens: "It stays a draft until you decide." }}
        answer={{ label: "Publish it", onPress: () => {} }}
        decline={{ label: "Not yet", onPress: () => {} }}
      />,
    );

    const fallback = screen.getByText(/stays a draft until you decide/);
    const answer = screen.getByRole("button", { name: /Publish it/ });

    expect(precedes(fallback, answer)).toBe(true);
  });

  it("renders the fallback action on the default's own line, not as a third answer", () => {
    // P-50's ruling, carried into `Ask` itself: a third verdict on the
    // default line is the declared default arriving early, not a third
    // button beside the two real answers.
    render(
      <Ask
        question="Let the agent run the migration?"
        fallback={{ kind: "irreversible" }}
        answer={{ label: "Approve", onPress: () => {} }}
        decline={{ label: "Decline", onPress: () => {} }}
        fallbackAction={{ label: "Snooze it", onPress: () => {} }}
      />,
    );

    const fallbackLine = screen.getByText(/Nothing runs until you answer/);
    const snooze = screen.getByRole("button", { name: /Snooze it/ });
    const approve = screen.getByRole("button", { name: /^Approve$/ });

    expect(precedes(fallbackLine, snooze)).toBe(true);
    expect(precedes(snooze, approve)).toBe(true);
  });
});

describe("Ship's own ask argues before it asks for an answer", () => {
  const src = readFileSync(
    fileURLToPath(new URL("../../routes/_authenticated.ship.tsx", import.meta.url)),
    "utf8",
  );

  it("hands the promote its evidence through risk/reason, never as a sibling after the buttons", () => {
    const flat = src.replace(/\s+/g, " ");
    // P-56 (A-QUEUE.md): `Ask.question` is a branded `AskQuestion`, made only
    // by `askQuestion()`, so the literal template this anchor used to match
    // no longer appears verbatim -- the mark is composed, not glued on.
    const gate = flat.slice(
      flat.indexOf('question={askQuestion(`Take "${ready[0].title}" to production`)}'),
    );
    const body = gate.slice(0, gate.indexOf("/>"));
    expect(body.indexOf("reason=")).toBeGreaterThanOrEqual(0);
    expect(body.indexOf("risk=")).toBeGreaterThan(body.indexOf("reason="));
    expect(body.indexOf("answer=")).toBeGreaterThan(body.indexOf("risk="));
    expect(body).toContain("It moves that same commit to the production address.");
  });

  it("is one of exactly two `<Ask`s on this station -- the other two questions were not binary asks", () => {
    const opens = src.match(/<Ask\b/g) ?? [];
    expect(opens.length).toBe(2);
  });
});
