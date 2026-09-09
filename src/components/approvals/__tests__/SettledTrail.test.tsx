/**
 * THE SETTLED LINE RENDERS, AND THE DOOR IS REACHABLE FROM IT.
 *
 * `a-settled-line-is-not-the-button-you-pressed.test.ts` proves the sentences
 * and the door's rule. It cannot prove either reaches the screen, and this one
 * could not be checked by hand: the settled trail only exists after a verdict
 * lands, and the only verdicts available are on production gates, where
 * pressing Approve in order to look at the confirmation is not a thing to do.
 *
 * So the claim "it renders" is made here rather than by nobody.
 *
 * ── AND THE DOOR RENDERS ON NOTHING TODAY, WHICH IS DATA, NOT CODE ──────────
 * Measured 2026-09-09 on production: 21 gates are pending, 14 carry a `run_id`,
 * and **all 14 of those runs have a null `track_id`** -- they were created on 16
 * and 17 July, before the loop wrote the link. Modern gates do resolve (48 of 64
 * cancelled, 31 of 46 expired), so the door lights up for anything raised now
 * and for nothing in the queue as it stands. That is why this file, and not a
 * screenshot, is the evidence.
 */
import * as React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, test, expect, afterEach } from "bun:test";

import { SettledTrail, type SettledLine } from "@/components/approvals/SettledTrail";

afterEach(cleanup);

const RUN = "Reschedule installer visit from order page";

const line = (over: Partial<SettledLine> = {}): SettledLine => ({
  id: "queue-1",
  verb: "You approved",
  consequence: "The agent may run it.",
  at: "2:14 PM",
  ...over,
});

describe("what you settled", () => {
  test("draws nothing at all before the first verdict", () => {
    const { container } = render(<SettledTrail lines={[]} />);
    expect(container.textContent).toBe("");
  });

  test("says what you did, what it caused, and when", () => {
    render(<SettledTrail lines={[line()]} />);
    expect(screen.getByText("You approved")).toBeDefined();
    expect(screen.getByText("The agent may run it.")).toBeDefined();
    expect(screen.getByText("2:14 PM")).toBeDefined();
  });

  test("and is announced, because a keyboard settle is otherwise silent", () => {
    // Carried from the primitive this replaced; the defect was found by an
    // accessibility audit and was true on every gate in the product.
    const { container } = render(<SettledTrail lines={[line()]} />);
    const row = container.querySelector('[role="status"]');
    expect(row).not.toBeNull();
    expect(row?.getAttribute("aria-live")).toBe("polite");
  });
});

describe("the door out to the run", () => {
  test("is a real link, named by the run", () => {
    render(
      <SettledTrail
        lines={[line({ door: { href: "/track/t-1", lead: "Watch it carry on", title: RUN } })]}
      />,
    );
    const a = screen.getByRole("link");
    expect(a.getAttribute("href")).toBe("/track/t-1");
    expect(a.textContent).toBe(`Watch it carry on: ${RUN}`);
  });

  test("is absent when the call sat on no run, which is most families", () => {
    render(<SettledTrail lines={[line()]} />);
    expect(screen.queryByRole("link")).toBeNull();
  });

  test("breaks the line rather than pushing the clock around", () => {
    // `basis-full` is the whole reason the confirmation keeps its shape at any
    // title length: verb, consequence, clock hard right, door underneath.
    render(
      <SettledTrail
        lines={[line({ door: { href: "/track/t-1", lead: "The run it came from", title: RUN } })]}
      />,
    );
    expect(screen.getByRole("link").className).toContain("basis-full");
  });

  test("a failed write keeps its own shape and still offers the run", () => {
    render(
      <SettledTrail
        lines={[
          line({
            verb: "Nothing changed",
            consequence: "This was already decided.",
            failed: true,
            door: { href: "/track/t-1", lead: "The run it came from", title: RUN },
          }),
        ]}
      />,
    );
    // Red is the outcome, never a success shape over a failed write.
    expect(screen.getByText("Nothing changed").className).toContain("text-mrd-fail");
    // "Already decided" raises the question the run answers.
    expect(screen.getByRole("link")).toBeDefined();
  });
});
