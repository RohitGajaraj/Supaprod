// CrewDrawer (Phase 4): the roster in-context. Pure view (static catalog, no
// providers), so it tests directly. Wired open/close is covered by the smoke.

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, mock } from "bun:test";
import { CrewDrawer } from "../CrewDrawer";
import {
  AGENT_STATION_ORDER,
  castByStation,
  conductorEntry,
  agentDisplayName,
} from "@/lib/agent-vocabulary";

describe("CrewDrawer: the roster in-context", () => {
  test("closed renders nothing (no a11y-tree leak)", () => {
    const { container } = render(<CrewDrawer open={false} onClose={mock(() => {})} />);
    expect(container.querySelector('[data-testid="crew-drawer"]')).toBe(null);
  });

  test("open lists the full canonical roster: conductor + every cast specialist", () => {
    render(<CrewDrawer open onClose={mock(() => {})} />);
    expect(screen.getByTestId("crew-drawer")).toBeTruthy();
    // Compute the total exactly as the drawer does (conductor + cast by station).
    const conductor = conductorEntry();
    const castTotal = AGENT_STATION_ORDER.reduce((n, s) => n + castByStation(s).length, 0);
    const total = (conductor ? 1 : 0) + castTotal;
    expect(total).toBeGreaterThanOrEqual(13);
    expect(screen.getByText(String(total))).toBeTruthy();
    // The conductor is named on the roster.
    if (conductor) {
      expect(screen.getAllByText(agentDisplayName(conductor.slug)).length).toBeGreaterThan(0);
    }
  });

  test("Escape closes, and no cost figures render", () => {
    const onClose = mock(() => {});
    const { container } = render(<CrewDrawer open onClose={onClose} />);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(/credit|token|\$\d/i.test(container.textContent ?? "")).toBe(false);
  });
});
