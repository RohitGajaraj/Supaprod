// WarmSlot (primitive 6.7): no empty render path, ever. Slot selection is
// own work first, then the honestly badged sample, then the who-acts-next
// line with its one data-creating action.

import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, mock } from "bun:test";
import { WarmSlot, selectWarmSlot } from "../primitives/WarmSlot";

describe("selectWarmSlot", () => {
  test("own work wins over everything", () => {
    expect(selectWarmSlot({ hasOwnWork: true, hasSample: true })).toBe("own-work");
    expect(selectWarmSlot({ hasOwnWork: true, hasSample: false })).toBe("own-work");
  });

  test("the sample preview is next", () => {
    expect(selectWarmSlot({ hasOwnWork: false, hasSample: true })).toBe("sample");
  });

  test("the honest line is the floor, so there is no empty outcome", () => {
    expect(selectWarmSlot({ hasOwnWork: false, hasSample: false })).toBe("line");
  });
});

describe("WarmSlot rendering", () => {
  const line = {
    text: "Nothing to read yet. Connect a source and Watch starts on the next sweep.",
    actionLabel: "Connect a source",
    onAction: () => {},
  };

  test("renders the user's own work plainly, no badge, no dashed frame", () => {
    render(
      <WarmSlot ownWork={<div>3 signals from this week</div>} sample={<div>seeded</div>} line={line} />,
    );
    expect(screen.getByText("3 signals from this week")).toBeTruthy();
    expect(screen.queryByText("Sample")).toBe(null);
    expect(screen.queryByText(line.text)).toBe(null);
  });

  test("renders the sample with the SAMPLE badge and the quiet note", () => {
    render(
      <WarmSlot
        sample={<div>A seeded ranked bet</div>}
        sampleNote="Seeded from the Helio Labs workspace"
        line={line}
      />,
    );
    expect(screen.getByText("A seeded ranked bet")).toBeTruthy();
    expect(screen.getByText("Sample")).toBeTruthy();
    expect(screen.getByText("Seeded from the Helio Labs workspace")).toBeTruthy();
  });

  test("falls back to the honest line plus its one action", () => {
    const onAction = mock(() => {});
    render(<WarmSlot line={{ ...line, onAction }} />);
    expect(screen.getByText(line.text)).toBeTruthy();
    const action = screen.getByText("Connect a source");
    fireEvent.click(action);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  test("the line slot renders without an action when none creates the data", () => {
    const { container } = render(
      <WarmSlot line={{ text: "Nothing needs you. The next sweep is at 2am." }} />,
    );
    expect(screen.getByText("Nothing needs you. The next sweep is at 2am.")).toBeTruthy();
    expect(container.querySelector("button")).toBe(null);
  });

  test("never renders empty: even with every prop absent but line, content exists", () => {
    const { container } = render(<WarmSlot line={{ text: "Memory starts empty and fills as you decide." }} />);
    expect(container.textContent?.trim().length).toBeGreaterThan(0);
  });

  test("false-y children do not count as own work or sample", () => {
    render(<WarmSlot ownWork={false} sample={null} line={line} />);
    expect(screen.getByText(line.text)).toBeTruthy();
  });
});
