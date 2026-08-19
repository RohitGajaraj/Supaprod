/**
 * THE THRESHOLD IS THE COMPONENT, so the boundaries are what this pins.
 *
 * Meridian's colour law is explicit and it is the thing most easily got wrong
 * here: `--mrd-fail` reports an OUTCOME THAT HAPPENED, so it may not appear while
 * a cap is merely close. A bar that goes red at 90% is the product telling a
 * reader they have already hit a ceiling they have not hit, and the reflex when
 * drawing a spend bar is exactly that.
 *
 * WHAT IS NOT ASSERTED: the exact formatted string in every locale. `Intl`
 * decides where the symbol and the separator go, and pinning "$5.00" would pin
 * the machine's locale and pass here while failing in CI. Where a figure is
 * asserted it is asserted through the same `Intl` call the component uses, so the
 * test checks the COMPONENT'S choice of digits rather than the platform's choice
 * of punctuation.
 */
import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Spend, spendState } from "../Spend";

/** The same formatting the component does, so a locale cannot break the test. */
function usd(n: number, digits = 2): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

describe("red means the ceiling was hit, and never that it is close", () => {
  it("stays neutral well under the alert", () => {
    const { container } = render(<Spend label="This run" spent={0} cap={5} />);
    expect(container.innerHTML).not.toContain("mrd-fail");
    expect(container.innerHTML).not.toContain("mrd-hold");
  });

  it("turns amber at the alert and not before", () => {
    // 80% of $5 is exactly $4.00.
    const under = render(<Spend label="This run" spent={3.99} cap={5} />);
    expect(under.container.innerHTML, "amber arrived early").not.toContain("mrd-hold");
    under.unmount();

    const at = render(<Spend label="This run" spent={4} cap={5} />);
    expect(at.container.innerHTML, "amber did not arrive at the alert").toContain("mrd-hold");
    expect(at.container.innerHTML, "red arrived while the cap was merely close").not.toContain(
      "mrd-fail",
    );
  });

  it("turns red only when the cap has actually been reached", () => {
    const under = render(<Spend label="This run" spent={4.99} cap={5} />);
    expect(under.container.innerHTML).not.toContain("mrd-fail");
    under.unmount();

    const at = render(<Spend label="This run" spent={5} cap={5} />);
    expect(at.container.innerHTML).toContain("mrd-fail");
    expect(screen.getByText("Cap reached")).toBeTruthy();
  });

  it("does not go further than red when spend passes the cap", () => {
    // Over-cap happens: a call in flight lands after the ceiling was crossed.
    render(<Spend label="This run" spent={7.4} cap={5} />);
    expect(screen.getByText("Cap reached")).toBeTruthy();
  });

  it("resolves the same state through the exported function, so callers cannot disagree", () => {
    expect(spendState(0, 5, 0.8)).toBe("spending");
    expect(spendState(4, 5, 0.8)).toBe("nearly");
    expect(spendState(5, 5, 0.8)).toBe("spent");
    expect(spendState(9, null, 0.8)).toBe("uncapped");
    expect(spendState(9, 0, 0.8)).toBe("uncapped");
  });
});

describe("proximity survives the colour being removed", () => {
  it("draws the distance as a length, so the bar says it without hue", () => {
    const { container } = render(<Spend label="This run" spent={2.5} cap={5} />);
    const fill = container.querySelector("[aria-hidden] > div");
    expect(fill?.getAttribute("style")).toContain("width: 50%");
  });

  it("says the state in words as well, and says how much room is left", () => {
    /*
     * "$0.62 left" rather than "nearly spent": a reader told to worry works out
     * the remaining amount next, so the component may as well have done it.
     */
    render(<Spend label="This run" spent={4.38} cap={5} />);
    expect(screen.getByText(`${usd(0.62)} left`)).toBeTruthy();
  });

  it("clamps the bar at full rather than overflowing its track", () => {
    const { container } = render(<Spend label="This run" spent={40} cap={5} />);
    const fill = container.querySelector("[aria-hidden] > div");
    expect(fill?.getAttribute("style")).toContain("width: 100%");
  });

  it("keeps the drawing out of the accessible tree, because the text carries it", () => {
    const { container } = render(<Spend label="This run" spent={4} cap={5} />);
    expect(container.querySelector('[role="meter"]')).toBeNull();
    expect(container.querySelector('[role="progressbar"]')).toBeNull();
    // And the fact is still fully available as text.
    expect(container.textContent).toContain(usd(4));
    expect(container.textContent).toContain(usd(5));
  });
});

describe("the money is locale-safe and does not fabricate a zero", () => {
  it("renders the empty case as the two real figures", () => {
    render(<Spend label="This run" spent={0} cap={5} />);
    expect(screen.getByText(usd(0))).toBeTruthy();
    expect(screen.getByText(`of ${usd(5)}`)).toBeTruthy();
  });

  it("shows four decimals under a cent rather than rounding real money to nothing", () => {
    /*
     * `engine-room-glance.ts` states this rule in its own comment and is right:
     * a run that cost eight hundredths of a cent spent real money, and a surface
     * reporting $0.00 tells a reader nothing happened.
     */
    render(<Spend label="Today" spent={0.0008} cap={5} />);
    expect(screen.getByText(usd(0.0008, 4))).toBeTruthy();
  });

  it("goes through Intl rather than a hard-coded symbol", () => {
    // The five existing copies of this formatter in the tree all hard-code `$`
    // and a decimal point, which is wrong in every locale that does not.
    render(<Spend label="This run" spent={1234.5} cap={2000} currency="EUR" />);
    expect(
      screen.getByText(
        new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: "EUR",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(1234.5),
      ),
    ).toBeTruthy();
  });

  it("holds the digits to one width so a changing amount does not jitter", () => {
    const { container } = render(<Spend label="This run" spent={4} cap={5} />);
    const figures = container.querySelector("span.tabular-nums");
    expect(figures, "the figures lost tabular-nums and will shift as they change").toBeTruthy();
    expect(figures?.className).toContain("font-mrd-mono");
  });
});

describe("no cap is a state the product actually has", () => {
  it("says what that means rather than drawing an empty bar", () => {
    render(<Spend label="This run" spent={2.4} cap={null} />);
    expect(screen.getByText("No cap is set, so nothing stops this on spend.")).toBeTruthy();
  });

  it("still reports what has been spent", () => {
    render(<Spend label="This run" spent={2.4} cap={null} />);
    expect(screen.getByText(usd(2.4))).toBeTruthy();
  });

  it("draws no fill at all, because there is no proportion to draw", () => {
    const { container } = render(<Spend label="This run" spent={2.4} cap={null} />);
    expect(container.querySelector("[aria-hidden] > div")).toBeNull();
  });

  it("names no ceiling it does not have", () => {
    const { container } = render(<Spend label="This run" spent={2.4} cap={null} />);
    expect(container.textContent).not.toContain(" of ");
  });
});

describe("the consequence belongs to the caller", () => {
  it("renders a note beside the state when one is given", () => {
    /*
     * Three ceilings with three different consequences: an account cap blocks the
     * next call, a per-track cap stops the work and waits for a person. A
     * component that invented one sentence for all three would be wrong twice.
     */
    render(
      <Spend
        label="This run"
        spent={5}
        cap={5}
        note="The run stopped where it was and is waiting for you."
      />,
    );
    expect(screen.getByText("Cap reached")).toBeTruthy();
    expect(screen.getByText("The run stopped where it was and is waiting for you.")).toBeTruthy();
  });

  it("says nothing at all when there is nothing to say", () => {
    const { container } = render(<Spend label="This run" spent={0.4} cap={5} />);
    expect(container.querySelector("p")).toBeNull();
  });
});

describe("the alert point matches the one the product already uses", () => {
  it("defaults to eighty per cent", () => {
    // `notifications.functions.ts` raises "Approaching spend cap" at 0.8, and two
    // surfaces disagreeing about when to worry is worse than either being wrong.
    expect(spendState(7.99, 10, 0.8), "the alert fired a cent early").toBe("spending");
    expect(spendState(8, 10, 0.8), "the alert did not fire at eighty per cent").toBe("nearly");
    // And a workspace that asked to be warned later is warned later.
    expect(spendState(8, 10, 0.9)).toBe("spending");
  });

  it("takes a caller's threshold, because the product stores one per workspace", () => {
    const { container } = render(<Spend label="Today" spent={5} cap={10} alertAt={0.5} />);
    expect(container.innerHTML).toContain("mrd-hold");
  });
});
