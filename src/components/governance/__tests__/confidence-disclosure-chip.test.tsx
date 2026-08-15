import { describe, test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { ConfidenceDisclosureChip } from "../ConfidenceDisclosureChip";

/**
 * What the chip actually puts on the screen.
 *
 * REWRITTEN 2026-07-29 with the port. The colour assertions are gone: they read
 * `span.style.color` and expected `var(--emerald)`, `var(--text-muted)` and
 * `var(--ember)` from the retired palette. The chip is a `Value` now, so the
 * stylesheet owns every mix and the component declares only a TONE. Reading the
 * tone is the honest test; reading the paint was testing the old system.
 *
 * The `style` prop test is gone too, because the prop is gone: the only caller
 * is CriticBadge, and a component that lets its host inject arbitrary CSS is how
 * a design system drifts one call site at a time.
 */

function tone(container: HTMLElement): string | null {
  return container.querySelector("[data-tone]")?.getAttribute("data-tone") ?? null;
}

describe("ConfidenceDisclosureChip", () => {
  test("renders confidence as a rounded percentage", () => {
    render(<ConfidenceDisclosureChip confidence={0.856} tier="high" />);
    expect(screen.getByText(/86/)).toBeDefined();
  });

  test("clamps confidence to 0 when below range", () => {
    render(<ConfidenceDisclosureChip confidence={-0.5} tier="low" />);
    expect(screen.getByText(/0%/)).toBeDefined();
  });

  test("clamps confidence to 1 when above range", () => {
    render(<ConfidenceDisclosureChip confidence={1.5} tier="high" />);
    expect(screen.getByText(/100%/)).toBeDefined();
  });

  test("rounds to the nearest percent", () => {
    render(<ConfidenceDisclosureChip confidence={0.445} tier="medium" />);
    expect(screen.getByText(/4[45]%/)).toBeDefined();
  });

  test("says 'confident' for the high tier", () => {
    render(<ConfidenceDisclosureChip confidence={0.9} tier="high" />);
    expect(screen.getByText(/confident/)).toBeDefined();
  });

  test("says 'moderate' for the medium tier", () => {
    render(<ConfidenceDisclosureChip confidence={0.5} tier="medium" />);
    expect(screen.getByText(/moderate/)).toBeDefined();
  });

  test("says 'unsure' for the low tier", () => {
    render(<ConfidenceDisclosureChip confidence={0.3} tier="low" />);
    expect(screen.getByText(/unsure/)).toBeDefined();
  });

  test("carries the pass tone for the high tier", () => {
    const { container } = render(<ConfidenceDisclosureChip confidence={0.8} tier="high" />);
    expect(tone(container)).toBe("pass");
  });

  test("carries the quiet tone for the medium tier", () => {
    const { container } = render(<ConfidenceDisclosureChip confidence={0.5} tier="medium" />);
    expect(tone(container)).toBe("quiet");
  });

  test("carries the hold tone for the low tier, never ember", () => {
    const { container } = render(<ConfidenceDisclosureChip confidence={0.3} tier="low" />);
    expect(tone(container)).toBe("hold");
  });

  test("puts every number in the mono data face", () => {
    // Every number, duration, count, identifier and timestamp goes in Num.
    const { container } = render(<ConfidenceDisclosureChip confidence={0.75} tier="high" />);
    expect(container.querySelector("[data-num]")?.textContent).toBe("75%");
  });

  test("discloses the number in its title as well as its text", () => {
    const { container } = render(<ConfidenceDisclosureChip confidence={0.75} tier="high" />);
    const titled = container.querySelector("[title]");
    expect(titled?.getAttribute("title")).toContain("75%");
    expect(titled?.getAttribute("title")).toContain("confidence");
  });

  test("renders zero confidence as 0%", () => {
    render(<ConfidenceDisclosureChip confidence={0} tier="low" />);
    expect(screen.getByText(/0%/)).toBeDefined();
  });

  test("renders full confidence as 100%", () => {
    render(<ConfidenceDisclosureChip confidence={1} tier="high" />);
    expect(screen.getByText(/100%/)).toBeDefined();
  });
});
