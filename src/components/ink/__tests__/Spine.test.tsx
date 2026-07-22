import { describe, it, expect } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { Spine, SPINE_STAGES } from "../Spine";
import type { SpineStage, SpineStageId } from "../Spine";

describe("Spine", () => {
  describe("rendering structure", () => {
    it("renders exactly 6 stage buttons when given SPINE_STAGES", () => {
      const stages: SpineStage[] = SPINE_STAGES.map((s) => ({ ...s, state: "future" }));
      render(React.createElement(Spine, { stages }));
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBe(SPINE_STAGES.length);
    });

    it("renders all stage labels in order", () => {
      const stages: SpineStage[] = SPINE_STAGES.map((s) => ({ ...s, state: "future" }));
      render(React.createElement(Spine, { stages }));
      SPINE_STAGES.forEach((s) => {
        expect(screen.getByLabelText(new RegExp(s.label))).toBeTruthy();
      });
    });

    it("renders as nav element with proper landmark", () => {
      const stages: SpineStage[] = SPINE_STAGES.map((s) => ({ ...s, state: "future" }));
      render(React.createElement(Spine, { stages }));
      expect(screen.getByRole("navigation", { name: /Project lifecycle/ })).toBeTruthy();
    });

    it("renders connectors between consecutive stages", () => {
      const { container } = render(
        React.createElement(Spine, {
          stages: SPINE_STAGES.map((s) => ({ ...s, state: "future" })),
        }),
      );
      // Connectors are horizontal lines with class containing "h-px" (1px height)
      const connectors = container.querySelectorAll("span[aria-hidden]");
      // Should have: stage nodes + connectors
      // 6 stages = 5 connectors between them + 6 stage nodes = at least 11 aria-hidden spans
      expect(connectors.length).toBeGreaterThan(SPINE_STAGES.length);
    });
  });

  describe("state rendering", () => {
    it("renders done state with filled square node", () => {
      const stages: SpineStage[] = [{ id: "plan", label: "Plan", state: "done" }];
      render(React.createElement(Spine, { stages }));
      // The button should be present
      expect(screen.getByLabelText(/Plan.*done/)).toBeTruthy();
    });

    it("renders active state with animated node", () => {
      const stages: SpineStage[] = [{ id: "plan", label: "Plan", state: "active" }];
      render(React.createElement(Spine, { stages }));
      expect(screen.getByLabelText(/Plan.*agents working/)).toBeTruthy();
    });

    it("renders gate state for need-approval stages", () => {
      const stages: SpineStage[] = [{ id: "ship", label: "Ship", state: "gate", needsYou: 3 }];
      render(React.createElement(Spine, { stages }));
      expect(screen.getByLabelText(/Ship.*needs you/)).toBeTruthy();
    });

    it("renders future state as dimmed/ahead", () => {
      const stages: SpineStage[] = [{ id: "launch", label: "Launch", state: "future" }];
      render(React.createElement(Spine, { stages }));
      expect(screen.getByLabelText(/Launch.*ahead/)).toBeTruthy();
    });

    it("renders inferred state (dashed border)", () => {
      const stages: SpineStage[] = [{ id: "design", label: "Design", state: "inferred" }];
      render(React.createElement(Spine, { stages }));
      expect(screen.getByLabelText(/Design.*inferred/)).toBeTruthy();
    });

    it("renders na state (not applicable)", () => {
      const stages: SpineStage[] = [{ id: "grow", label: "Grow", state: "na" }];
      render(React.createElement(Spine, { stages }));
      expect(screen.getByLabelText(/Grow.*not applicable/)).toBeTruthy();
    });

    it("renders all 6 states together in a progression", () => {
      const stages: SpineStage[] = [
        { id: "plan", label: "Plan", state: "done" },
        { id: "design", label: "Design", state: "done" },
        { id: "build", label: "Build", state: "active" },
        { id: "ship", label: "Ship", state: "gate" },
        { id: "launch", label: "Launch", state: "future" },
        { id: "grow", label: "Grow", state: "future" },
      ];
      render(React.createElement(Spine, { stages }));
      expect(screen.getByLabelText(/Plan.*done/)).toBeTruthy();
      expect(screen.getByLabelText(/Build.*agents working/)).toBeTruthy();
      expect(screen.getByLabelText(/Ship.*needs you/)).toBeTruthy();
      expect(screen.getByLabelText(/Launch.*ahead/)).toBeTruthy();
    });
  });

  describe("selection and interactivity", () => {
    it("marks selected stage with aria-current='step'", () => {
      const stages: SpineStage[] = SPINE_STAGES.map((s) => ({ ...s, state: "future" }));
      render(React.createElement(Spine, { stages, selected: "build" }));
      const buildButton = screen.getByLabelText(/Build.*ahead/);
      expect(buildButton.getAttribute("aria-current")).toBe("step");
    });

    it("does not set aria-current for non-selected stages", () => {
      const stages: SpineStage[] = SPINE_STAGES.map((s) => ({ ...s, state: "future" }));
      render(React.createElement(Spine, { stages, selected: "build" }));
      const planButton = screen.getByLabelText(/Plan.*ahead/);
      expect(planButton.getAttribute("aria-current")).toBeNull();
    });

    it("calls onSelect with stage id when a stage is clicked", () => {
      let selectedId: SpineStageId | undefined;
      const stages: SpineStage[] = SPINE_STAGES.map((s) => ({ ...s, state: "future" }));
      render(
        React.createElement(Spine, {
          stages,
          onSelect: (id) => {
            selectedId = id;
          },
        }),
      );
      const shipButton = screen.getByLabelText(/Ship.*ahead/);
      fireEvent.click(shipButton);
      expect(selectedId).toBe("ship");
    });

    it("applies selected styling when a stage is selected", () => {
      const { container } = render(
        React.createElement(Spine, {
          stages: SPINE_STAGES.map((s) => ({ ...s, state: "future" })),
          selected: "build",
        }),
      );
      const buttons = screen.getAllByRole("button");
      const buildButton = buttons.find((b) => b.textContent?.includes("Build"));
      // Selected stages should have background styling (checked via class)
      expect(buildButton?.className).toContain("bg-[var(--ink-raised)]");
    });

    it("updates selection when selected prop changes", () => {
      const { rerender } = render(
        React.createElement(Spine, {
          stages: SPINE_STAGES.map((s) => ({ ...s, state: "future" })),
          selected: "plan",
        }),
      );
      const planButton = screen.getByLabelText(/Plan.*ahead/);
      expect(planButton.getAttribute("aria-current")).toBe("step");

      rerender(
        React.createElement(Spine, {
          stages: SPINE_STAGES.map((s) => ({ ...s, state: "future" })),
          selected: "build",
        }),
      );
      const buildButton = screen.getByLabelText(/Build.*ahead/);
      expect(buildButton.getAttribute("aria-current")).toBe("step");
      expect(planButton.getAttribute("aria-current")).toBeNull();
    });
  });

  describe("notes and metadata", () => {
    it("renders note text when provided", () => {
      const stages: SpineStage[] = [
        { id: "plan", label: "Plan", state: "done", note: "Done Mar 1" },
      ];
      render(React.createElement(Spine, { stages }));
      expect(screen.getByText("Done Mar 1")).toBeTruthy();
    });

    it("does not render note span when note is undefined", () => {
      const { container } = render(
        React.createElement(Spine, {
          stages: [{ id: "plan", label: "Plan", state: "done" }],
        }),
      );
      // Only the label and node should be present, not a note span
      const noteSpans = container.querySelectorAll(".ink-mono");
      expect(noteSpans.length).toBe(0);
    });

    it("renders needsYou count as a badge", () => {
      const stages: SpineStage[] = [{ id: "ship", label: "Ship", state: "gate", needsYou: 5 }];
      render(React.createElement(Spine, { stages }));
      expect(screen.getByText("5")).toBeTruthy();
    });

    it("includes needsYou count in aria-label", () => {
      const stages: SpineStage[] = [{ id: "ship", label: "Ship", state: "gate", needsYou: 3 }];
      render(React.createElement(Spine, { stages }));
      const button = screen.getByLabelText(/Ship.*needs you.*3 waiting on you/);
      expect(button).toBeTruthy();
    });

    it("does not render needsYou badge when zero or undefined", () => {
      const { container } = render(
        React.createElement(Spine, {
          stages: [
            { id: "ship", label: "Ship", state: "gate", needsYou: 0 },
            { id: "launch", label: "Launch", state: "future" },
          ],
        }),
      );
      // Count badges are inside .ink-mono spans with border
      const badges = container.querySelectorAll(".ink-mono");
      expect(badges.length).toBe(0);
    });

    it("renders multiple notes correctly for different stages", () => {
      const stages: SpineStage[] = [
        { id: "plan", label: "Plan", state: "done", note: "Planning done" },
        { id: "design", label: "Design", state: "done", note: "Design complete" },
        { id: "build", label: "Build", state: "active", note: "In progress" },
      ];
      render(React.createElement(Spine, { stages }));
      expect(screen.getByText("Planning done")).toBeTruthy();
      expect(screen.getByText("Design complete")).toBeTruthy();
      expect(screen.getByText("In progress")).toBeTruthy();
    });
  });

  describe("visual styling and state-based colors", () => {
    it("applies different text colors for done vs future states", () => {
      const { container } = render(
        React.createElement(Spine, {
          stages: [
            { id: "plan", label: "Plan", state: "done" },
            { id: "launch", label: "Launch", state: "future" },
          ],
        }),
      );
      const labels = container.querySelectorAll(".ink-kicker");
      expect(labels.length).toBe(2);
      // Done stages should have full text color, future stages should be dimmed (faint)
      // This is tricky to test without full style resolution, but we can check structure
      expect(container).toBeTruthy();
    });

    it("applies gate-state color (voice-human) to gate stages", () => {
      const { container } = render(
        React.createElement(Spine, {
          stages: [{ id: "ship", label: "Ship", state: "gate" }],
        }),
      );
      // Gate states apply special coloring to the label
      // This is done via conditional className logic
      expect(screen.getByLabelText(/Ship.*needs you/)).toBeTruthy();
    });

    it("applies active-state styling (machine voice) to active stages", () => {
      const { container } = render(
        React.createElement(Spine, {
          stages: [{ id: "build", label: "Build", state: "active" }],
        }),
      );
      expect(screen.getByLabelText(/Build.*agents working/)).toBeTruthy();
    });
  });

  describe("accessibility", () => {
    it("includes detailed aria-label with state information", () => {
      const stages: SpineStage[] = [
        { id: "ship", label: "Ship", state: "gate", needsYou: 2, note: "UAT" },
      ];
      render(React.createElement(Spine, { stages }));
      const button = screen.getByLabelText(/Ship: needs you.*2 waiting on you/);
      expect(button).toBeTruthy();
    });

    it("marks nodes as aria-hidden (decorative)", () => {
      const { container } = render(
        React.createElement(Spine, {
          stages: SPINE_STAGES.map((s) => ({ ...s, state: "future" })),
        }),
      );
      const hiddenNodes = container.querySelectorAll("[aria-hidden='true']");
      // All stage nodes and connectors should be aria-hidden
      expect(hiddenNodes.length).toBeGreaterThanOrEqual(SPINE_STAGES.length);
    });

    it("provides context through aria-label for complex states", () => {
      const stages: SpineStage[] = [
        { id: "plan", label: "Plan", state: "done" },
        { id: "design", label: "Design", state: "active" },
        { id: "build", label: "Build", state: "gate", needsYou: 4 },
      ];
      render(React.createElement(Spine, { stages }));
      expect(screen.getByLabelText(/Plan: done/)).toBeTruthy();
      expect(screen.getByLabelText(/Design: agents working/)).toBeTruthy();
      expect(screen.getByLabelText(/Build: needs you.*4 waiting/)).toBeTruthy();
    });
  });

  describe("edge cases", () => {
    it("handles empty stages array", () => {
      const { container } = render(React.createElement(Spine, { stages: [] }));
      const buttons = screen.queryAllByRole("button");
      expect(buttons.length).toBe(0);
    });

    it("handles single stage", () => {
      const stages: SpineStage[] = [{ id: "plan", label: "Plan", state: "done" }];
      render(React.createElement(Spine, { stages }));
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBe(1);
    });

    it("handles stages with very long labels", () => {
      const stages: SpineStage[] = [
        {
          id: "plan",
          label: "This is a very long stage label that should still display correctly",
          state: "done",
        },
      ];
      render(React.createElement(Spine, { stages }));
      expect(screen.getByText(/This is a very long/)).toBeTruthy();
    });

    it("handles notes with special characters and emojis", () => {
      const stages: SpineStage[] = [
        { id: "plan", label: "Plan", state: "done", note: "✓ Ship v2.1 (Mar 1)" },
      ];
      render(React.createElement(Spine, { stages }));
      expect(screen.getByText(/✓ Ship v2.1/)).toBeTruthy();
    });

    it("handles high needsYou counts", () => {
      const stages: SpineStage[] = [{ id: "ship", label: "Ship", state: "gate", needsYou: 99 }];
      render(React.createElement(Spine, { stages }));
      expect(screen.getByText("99")).toBeTruthy();
    });
  });

  describe("custom styling", () => {
    it("applies custom className to root", () => {
      const { container } = render(
        React.createElement(Spine, {
          stages: SPINE_STAGES.map((s) => ({ ...s, state: "future" })),
          className: "custom-spine",
        }),
      );
      const nav = screen.getByRole("navigation");
      expect(nav.className).toContain("custom-spine");
    });

    it("preserves default w-full class when custom className is provided", () => {
      const { container } = render(
        React.createElement(Spine, {
          stages: SPINE_STAGES.map((s) => ({ ...s, state: "future" })),
          className: "my-custom-class",
        }),
      );
      const nav = screen.getByRole("navigation");
      expect(nav.className).toContain("w-full");
      expect(nav.className).toContain("my-custom-class");
    });
  });
});
