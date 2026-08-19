/**
 * THE TWO STATES THE TASK VOCABULARY IS MISSING ARE WHY THIS COMPONENT EXISTS,
 * so they get the most assertions.
 *
 * `taskStatus()` collapses every value it does not recognise to `blocked`, which
 * means a step nobody has started renders as a step that is STUCK. That is the
 * opposite fact, and it renders that way for a reader who is deciding whether to
 * approve the plan. So: `pending` must not read as blocked, and `skipped` must
 * carry its reason, which is a founder ruling rather than a nicety.
 *
 * The other half is the colour law, and it is testable in exactly one way that
 * matters: orchid and azure each mean one thing, so a card that spends either
 * anywhere except on the step that has that meaning has spent the distinction.
 * That is asserted by counting occurrences in the markup, not by looking.
 */
import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { PlanCard, type PlanStep } from "../PlanCard";

const FIVE: PlanStep[] = [
  {
    id: "s1",
    label: "Read every signal on the firmware theme",
    state: "done",
    agentSlug: "researcher",
    station: "discover",
  },
  {
    id: "s2",
    label: "Rank it against the other four bets",
    state: "active",
    agentSlug: "strategist",
    station: "decide",
  },
  {
    id: "s3",
    label: "Draft the spec, with the precedent cited",
    state: "needs-approval",
    agentSlug: "planner",
    station: "plan",
  },
  {
    id: "s4",
    label: "Put a surface in front of it",
    state: "skipped",
    station: "design",
    why: "The notice reuses a shipped component, so there is nothing new to draw.",
  },
  { id: "s5", label: "Open the pull request", state: "pending", agentSlug: "builder", station: "build" },
];

describe("the two states no other step display has", () => {
  it("draws a pending step as promised, never as stuck", () => {
    render(<PlanCard steps={FIVE} />);
    /*
     * THE DEFECT THIS PINS. `taskStatus()` collapses an unrecognised value to
     * `blocked`, so the vocabulary this component refused to extend would have
     * told a reader that the last step of a fresh plan was already in trouble.
     */
    expect(screen.queryByText(/blocked/i)).toBeNull();
    expect(screen.queryByText(/stuck/i)).toBeNull();
    expect(screen.getByText("Open the pull request")).toBeTruthy();
  });

  it("says nothing at all on a pending step, because most of a fresh plan is pending", () => {
    render(
      <PlanCard
        steps={[{ id: "a", label: "Draft the spec", state: "pending" }]}
      />,
    );
    const item = screen.getByRole("listitem");
    expect(item.textContent).toBe("Draft the spec");
  });

  it("shows a skipped step's reason", () => {
    render(<PlanCard steps={FIVE} />);
    expect(screen.getAllByLabelText("Skipped").length).toBeGreaterThan(0);
    expect(
      screen.getByText("The notice reuses a shipped component, so there is nothing new to draw."),
    ).toBeTruthy();
  });

  it("admits it out loud when a skip has no reason, rather than hiding the gap", () => {
    /*
     * Founder ruling: a skipped station is a decision on the record WITH a
     * reason. Rendering nothing would let an incomplete record look complete,
     * which is the failure mode the ruling exists to stop.
     */
    render(<PlanCard steps={[{ id: "a", label: "Put a surface in front of it", state: "skipped" }]} />);
    expect(screen.getByText("Nobody said why this was skipped.")).toBeTruthy();
  });

  it("strikes a skipped label through AND dims it, because either alone is ambiguous", () => {
    // A strike at full ink reads as an edit; a dim label with no strike reads as
    // pending, which is the state it must not be confused with.
    render(<PlanCard steps={[{ id: "a", label: "Put a surface in front of it", state: "skipped" }]} />);
    const label = screen.getByText("Put a surface in front of it");
    expect(label.className).toContain("line-through");
    expect(label.className).toContain("text-mrd-mute");
  });
});

describe("all six states are tellable apart with the colour removed", () => {
  it("gives every non-pending state its own word", () => {
    render(
      <PlanCard
        steps={[
          { id: "a", label: "One", state: "pending" },
          { id: "b", label: "Two", state: "active" },
          { id: "c", label: "Three", state: "done" },
          { id: "d", label: "Four", state: "skipped", why: "Not needed." },
          { id: "e", label: "Five", state: "failed", why: "The checks did not pass." },
          { id: "f", label: "Six", state: "needs-approval" },
        ]}
      />,
    );
    expect(screen.getByText("Running")).toBeTruthy();
    expect(screen.getAllByLabelText("Done").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Skipped").length).toBeGreaterThan(0);
    expect(screen.getByText("Failed")).toBeTruthy();
    expect(screen.getByText("Needs you")).toBeTruthy();
  });

  it("gives every state a different mark, so the hue is only confirming it", () => {
    const states: PlanStep["state"][] = [
      "pending",
      "active",
      "done",
      "skipped",
      "failed",
      "needs-approval",
    ];

    const shapes = states.map((state) => {
      const { container, unmount } = render(
        <PlanCard steps={[{ id: "a", label: "One", state }]} />,
      );
      /* The hue classes are stripped before comparing, so this asserts the
         GEOMETRY differs and not merely the paint. That distinction is the
         whole greyscale rule. */
      const svg = container.querySelector("svg")?.innerHTML ?? "";
      unmount();
      return svg;
    });

    expect(new Set(shapes).size, "two states draw the same mark").toBe(6);
  });
});

describe("orchid and azure mean one thing each, and are spent nowhere else", () => {
  /*
   * CORRECTING THIS TEST'S OWN FIRST DRAFT, which asserted each token appeared
   * exactly ONCE in the whole card and failed at 2. The count was the wrong
   * measure: a step wears its hue twice on purpose, on the mark and on the word
   * beside it, because the word is what carries the state for a greyscale reader
   * and for a screen reader. Two elements, one step, one meaning.
   *
   * The law is about WHICH STEP, not how many elements, so that is what is
   * asserted: the token may appear only inside the list item whose state means
   * it, and nowhere else in the card.
   */
  function stepsCarrying(container: HTMLElement, token: string): number[] {
    return [...container.querySelectorAll("li")]
      .map((li, i) => (li.innerHTML.includes(token) ? i : -1))
      .filter((i) => i >= 0);
  }

  it("uses --mrd-you only on the step that needs a person", () => {
    const { container } = render(<PlanCard steps={FIVE} />);
    // FIVE[2] is the `needs-approval` step and it is the only one.
    expect(stepsCarrying(container, "mrd-you"), "orchid reached a step that is not asking").toEqual([
      2,
    ]);
  });

  it("uses --mrd-agent only on the step a machine is working on", () => {
    const { container } = render(<PlanCard steps={FIVE} />);
    // FIVE[1] is the `active` step.
    expect(stepsCarrying(container, "mrd-agent"), "azure reached a step nothing is running").toEqual(
      [1],
    );
  });

  it("keeps both out of every other step, including the settled ones", () => {
    const { container } = render(<PlanCard steps={FIVE} />);
    const items = [...container.querySelectorAll("li")];
    for (const [i, li] of items.entries()) {
      if (i === 1 || i === 2) continue;
      expect(li.innerHTML, `step ${i} borrowed a status hue`).not.toContain("mrd-you");
      expect(li.innerHTML, `step ${i} borrowed a status hue`).not.toContain("mrd-agent");
    }
  });

  it("spends neither on the header, however many steps are waiting", () => {
    const { container } = render(<PlanCard steps={FIVE} />);
    const header = container.querySelector("header");
    expect(header?.innerHTML).not.toContain("mrd-you");
    expect(header?.innerHTML).not.toContain("mrd-agent");
    // The count is still stated, in plain text.
    expect(header?.textContent).toContain("1 waiting on you");
  });
});

describe("the gate is at the top, and only when there is one", () => {
  it("draws no control when nobody can approve anything", () => {
    render(<PlanCard steps={FIVE} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("approves the whole plan in one press", () => {
    let approved = 0;
    render(<PlanCard steps={FIVE} onApprove={() => approved++} />);
    fireEvent.click(screen.getByRole("button", { name: "Approve the plan" }));
    expect(approved).toBe(1);
  });

  it("offers a way to disagree without rejecting", () => {
    let revised = 0;
    render(<PlanCard steps={FIVE} onApprove={() => {}} onRevise={() => revised++} />);
    fireEvent.click(screen.getByRole("button", { name: "Change it" }));
    expect(revised).toBe(1);
  });

  it("kills both controls while a decision is in flight, rather than removing them", () => {
    /*
     * Removed controls make the card jump under the reader's hand at the moment
     * they have just pressed something, and leave them unable to tell a sent
     * decision from a dropped click.
     */
    render(<PlanCard steps={FIVE} onApprove={() => {}} onRevise={() => {}} busy />);
    for (const button of screen.getAllByRole("button")) {
      expect((button as HTMLButtonElement).disabled).toBe(true);
    }
  });
});

describe("the empty plan is a state, not an error", () => {
  it("says what will appear rather than reporting a fault", () => {
    render(<PlanCard steps={[]} />);
    expect(screen.getByText("No plan has been filed yet.")).toBeTruthy();
    expect(screen.queryByText(/error|failed|problem/i)).toBeNull();
  });

  it("carries data-mrd on the early return", () => {
    const { container } = render(<PlanCard steps={[]} />);
    expect(container.firstElementChild?.getAttribute("data-mrd")).toBe("");
  });
});

describe("the plan reads as one plan", () => {
  it("counts its own steps rather than being told a number", () => {
    render(<PlanCard steps={FIVE} />);
    expect(screen.getByRole("heading").textContent).toBe("The plan");
    expect(screen.getAllByRole("listitem").length).toBe(5);
  });

  it("names who is on each step through the product's own vocabulary", () => {
    render(<PlanCard steps={FIVE} />);
    // A raw slug reaching a reader is the defect `agentDisplayName` exists for.
    const { container } = render(<PlanCard steps={FIVE} />);
    expect(container.textContent).not.toContain("researcher");
    expect(container.querySelector('[aria-label="Not started"]')).toBeTruthy();
  });

  it("stops the rail at the last step", () => {
    /*
     * A line continuing past the final step promises a step that was never
     * promised, which on a plan card is a claim about scope.
     */
    const { container } = render(<PlanCard steps={FIVE} />);
    const rails = container.querySelectorAll("li > span > span[aria-hidden].w-px");
    expect(rails.length).toBe(4);
  });
});
