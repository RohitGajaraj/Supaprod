// Journey chip activation: chips come from journeys.ts data (composer-entry
// journeys only; J7 enters through the outcome gate) and activating one
// emits the journey id for the shell.
import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, mock } from "bun:test";
import { JourneyChips, COMPOSER_JOURNEYS } from "../JourneyChips";

describe("JourneyChips", () => {
  test("the composer set is the composer-entry journeys; J7 (gate entry) is out", () => {
    const ids = COMPOSER_JOURNEYS.map((j) => j.id);
    expect(ids).toContain("j0");
    expect(ids).toContain("j1");
    expect(ids).not.toContain("j7");
    for (const j of COMPOSER_JOURNEYS) expect(j.entry).toBe("composer-chip");
  });

  test("renders one chip per journey with its catalog label", () => {
    render(<JourneyChips onActivate={mock(() => {})} />);
    for (const j of COMPOSER_JOURNEYS) {
      expect(screen.getByText(j.label)).toBeTruthy();
    }
  });

  test("activating a chip emits the journey id", () => {
    const onActivate = mock(() => {});
    const { container } = render(<JourneyChips onActivate={onActivate} />);
    fireEvent.click(container.querySelector('button[data-journey="j3"]')!);
    expect(onActivate).toHaveBeenCalledWith("j3");
    fireEvent.click(container.querySelector('button[data-journey="j0"]')!);
    expect(onActivate).toHaveBeenCalledWith("j0");
  });

  test("the suggested chip carries quiet emphasis, others do not", () => {
    const { container } = render(<JourneyChips onActivate={mock(() => {})} suggestedId="j1" />);
    expect(container.querySelector('button[data-journey="j1"]')!.dataset.suggested).toBe("true");
    expect(container.querySelector('button[data-journey="j4"]')!.dataset.suggested).toBeUndefined();
  });
});
