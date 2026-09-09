/**
 * THE CHIP CAN STAND ALONE, AND THE ROW STILL READS AS A ROW.
 *
 * Three of the twelve registers now return a null headline on purpose, because
 * the chip beside it had already said the whole fact (see `run-now.ts`). That is
 * a shaping decision `run-now.test.ts` proves; whether the CARD survives losing
 * the only text on its top line is a different claim, and this is where it is
 * made -- the state is a momentary load, so there is no reliable moment to
 * catch it on a screen.
 */
import * as React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, test, expect, afterEach } from "bun:test";

import { RunNow, HoldFact } from "@/components/track/RunNow";
import type { Now } from "@/components/track/run-now";

afterEach(cleanup);

const now = (over: Partial<Now> = {}): Now => ({
  register: "reading",
  status: "quiet",
  word: "Reading",
  headline: null,
  line: null,
  pulse: false,
  ...over,
});

describe("a register whose chip says everything", () => {
  test("draws the chip and nothing else on the row", () => {
    render(<RunNow now={now()} />);
    expect(screen.getByText("Reading")).toBeDefined();
    // The whole card, so a stray empty element would show up here.
    expect(screen.getByLabelText("What is happening now").textContent).toBe("Reading");
  });

  test("and is still announced as one region, not as a bare word", () => {
    const { container } = render(<RunNow now={now()} />);
    const region = container.querySelector('[role="status"]');
    expect(region?.getAttribute("aria-live")).toBe("polite");
  });

  test("carries its children even with no headline, so a hold keeps its facts", () => {
    render(
      <RunNow now={now({ register: "abandoned", status: "hold", word: "Abandoned" })}>
        <HoldFact>The founder closed it out.</HoldFact>
      </RunNow>,
    );
    expect(screen.getByText("The founder closed it out.")).toBeDefined();
  });
});

describe("a register that earns its headline", () => {
  test("draws both, and the sub-line under them", () => {
    render(
      <RunNow
        now={now({
          register: "paused",
          status: "hold",
          word: "Stopped",
          headline: "You stopped this.",
          line: "Nothing more is dispatched until you run it again.",
        })}
      />,
    );
    // The one register that repeats its chip on purpose: "Stopped" is the
    // state and "You stopped this" is whose act it was, which is the
    // difference between your stop and the loop giving up.
    expect(screen.getByText("Stopped")).toBeDefined();
    expect(screen.getByText("You stopped this.")).toBeDefined();
    expect(screen.getByText("Nothing more is dispatched until you run it again.")).toBeDefined();
  });
});
