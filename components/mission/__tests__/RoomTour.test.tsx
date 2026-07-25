// RoomTour (Phase 4): the opt-in guided tour. Pure view (its own step state,
// null-safe DOM ring), tests without providers.

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, mock } from "bun:test";
import { RoomTour } from "../RoomTour";

describe("RoomTour: opt-in, skippable, five stops", () => {
  test("closed renders nothing", () => {
    const { container } = render(<RoomTour open={false} onClose={mock(() => {})} />);
    expect(container.querySelector('[data-testid="room-tour"]')).toBe(null);
  });

  test("opens on the first stop and walks to Done", () => {
    const onClose = mock(() => {});
    render(<RoomTour open onClose={onClose} />);
    expect(screen.getByTestId("room-tour")).toBeTruthy();
    expect(screen.getByText("1 / 5")).toBeTruthy();
    expect(screen.getByText("The loop")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getByText("2 / 5")).toBeTruthy();
    // Walk to the last stop.
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getByText("5 / 5")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("Skip tour and Escape both close, and no cost figures render", () => {
    const onClose = mock(() => {});
    const { container } = render(<RoomTour open onClose={onClose} />);
    fireEvent.click(screen.getByText("Skip tour"));
    expect(onClose).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(/credit|token|\$\d/i.test(container.textContent ?? "")).toBe(false);
  });
});
