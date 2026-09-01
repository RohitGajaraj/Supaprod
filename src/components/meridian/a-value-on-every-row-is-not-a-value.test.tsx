/**
 * SIXTEEN CARDS, SIXTEEN COPIES OF ONE SENTENCE (2026-09-01).
 *
 * Photographed on Settings -> Who works here, signed in. Every card in the
 * roster ended with the words "Runs on its own", in the same grey, in the same
 * place -- sixteen times, under a heading that had already said "16 run without
 * asking you, 0 ask first". A value identical on every row distinguishes
 * nothing; it is just the last thing the eye reads before the next card.
 *
 * WHAT MAKES THIS WORTH A TEST rather than a deletion: the rule is conditional,
 * and the condition is the whole point. The line must come BACK the moment one
 * agent behaves differently, because then it is the fastest way to see which.
 * A guard that only asserted "the string is gone" would be satisfied by
 * deleting the feature.
 *
 * The exceptions are never suppressed. An agent waiting on a person and an
 * agent switched off are the two facts a reader came to this page for, and they
 * are also the only two the design spends hue on.
 */
import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";

import { AgentCards, type AgentCard } from "./AgentCards";

function card(slug: string, over: Partial<AgentCard> = {}): AgentCard {
  return { slug, name: slug, role: `What ${slug} is for.`, runsAlone: true, ...over };
}

const noop = () => {};

describe("the steady state prints only when it discriminates", () => {
  it("says nothing when every agent in the roster agrees", () => {
    render(<AgentCards cards={[card("a"), card("b"), card("c")]} onOpen={noop} />);
    expect(screen.queryByText("Runs on its own")).toBeNull();
    // The cards themselves are still there. Suppressing a redundant line is not
    // the same as dropping the row.
    expect(screen.getByText("a")).toBeDefined();
    expect(screen.getByText("c")).toBeDefined();
  });

  it("says it on every card the moment one of them differs", () => {
    render(
      <AgentCards
        cards={[card("a"), card("b"), card("asker", { runsAlone: false })]}
        onOpen={noop}
      />,
    );
    // Both sides are named: "runs alone" only means something next to "asks".
    expect(screen.getAllByText("Runs on its own")).toHaveLength(2);
    expect(screen.getByText("Asks before it acts")).toBeDefined();
  });
});

describe("and an exception is never suppressed", () => {
  it("an agent waiting on a person still says so in a uniform roster", () => {
    render(
      <AgentCards cards={[card("a"), card("b"), card("waits", { waiting: 3 })]} onOpen={noop} />,
    );
    expect(screen.getByText("3 asking you")).toBeDefined();
    // The other two are still uniform among the STEADY cards, so they stay quiet:
    // one agent asking you does not make the other fifteen worth labelling.
    expect(screen.queryByText("Runs on its own")).toBeNull();
  });

  it("a switched-off agent still says so in a uniform roster", () => {
    render(
      <AgentCards cards={[card("a"), card("b"), card("off", { enabled: false })]} onOpen={noop} />,
    );
    expect(screen.getByText("Switched off")).toBeDefined();
    expect(screen.queryByText("Runs on its own")).toBeNull();
  });

  it("a card with no description keeps the line, having nothing else to say", () => {
    render(<AgentCards cards={[card("a", { role: undefined })]} onOpen={noop} />);
    expect(screen.getByText("Runs on its own")).toBeDefined();
  });
});
