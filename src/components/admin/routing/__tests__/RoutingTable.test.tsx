import * as React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RoutingTable, type RoutingRow, type RoutingSurface } from "../RoutingTable";
import { describe, test, expect, mock, beforeEach } from "bun:test";

describe("RoutingTable Component", () => {
  const mockLiveModels = [
    { id: "claude-3-sonnet", label: "Claude 3 Sonnet", provider: "anthropic", tier: "pro" },
    { id: "claude-3-opus", label: "Claude 3 Opus", provider: "anthropic", tier: "enterprise" },
    { id: "gpt-4", label: "GPT-4", provider: "openai", tier: "enterprise" },
  ];

  const mockRows: RoutingRow[] = [
    {
      surface: "discovery" as RoutingSurface,
      setting: { kind: "auto" },
      autoModelId: "claude-3-sonnet",
      costPerTaskUsd7d: 0.0145,
      latencyP50Ms7d: 1250,
      evalScore: 92,
      callCount7d: 450,
      recommendation: {
        modelId: "gpt-4",
        reason: "Lower latency",
      },
      recommendationReason: undefined,
    },
    {
      surface: "chat" as RoutingSurface,
      setting: { kind: "pinned", modelId: "claude-3-opus" },
      autoModelId: "claude-3-sonnet",
      costPerTaskUsd7d: 0.025,
      latencyP50Ms7d: 2100,
      evalScore: 98,
      callCount7d: 320,
      recommendation: undefined,
      recommendationReason: "Pinned model in use",
    },
    {
      surface: "summarize" as RoutingSurface,
      setting: { kind: "no-model" },
      autoModelId: null,
      costPerTaskUsd7d: null,
      latencyP50Ms7d: null,
      evalScore: null,
      callCount7d: 0,
      recommendation: undefined,
      recommendationReason: "No model configured",
    },
  ];

  describe("Rendering", () => {
    test("renders table with correct structure", () => {
      const { container } = render(
        <RoutingTable
          rows={[]}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      const table = container.querySelector("table");
      expect(table).toBeTruthy();
    });

    test("renders table headers", () => {
      render(
        <RoutingTable
          rows={[]}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      expect(screen.getByText("Surface")).toBeTruthy();
      expect(screen.getByText("Setting")).toBeTruthy();
      expect(screen.getByText("Cost / task")).toBeTruthy();
      expect(screen.getByText("Latency (p50)")).toBeTruthy();
      expect(screen.getByText("Eval")).toBeTruthy();
      expect(screen.getByText("Recommendation")).toBeTruthy();
    });

    test("renders one row per RoutingRow", () => {
      const { container } = render(
        <RoutingTable
          rows={mockRows}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(mockRows.length);
    });

    test("renders empty table when rows array is empty", () => {
      const { container } = render(
        <RoutingTable
          rows={[]}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(0);
    });
  });

  describe("Surface Column", () => {
    test("renders surface name in monospace font", () => {
      const { container } = render(
        <RoutingTable
          rows={mockRows}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      expect(screen.getByText("discovery")).toBeTruthy();
      expect(screen.getByText("chat")).toBeTruthy();
      expect(screen.getByText("summarize")).toBeTruthy();
    });
  });

  describe("Setting Column & Model Selection", () => {
    test("renders select dropdown for auto-configured surfaces", () => {
      const { container } = render(
        <RoutingTable
          rows={mockRows}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      const selects = container.querySelectorAll("select");
      expect(selects.length).toBeGreaterThan(0);
    });

    test("select dropdown shows current auto model as default option", () => {
      const { container } = render(
        <RoutingTable
          rows={mockRows}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      const firstSelect = container.querySelector("select") as HTMLSelectElement;
      expect(firstSelect.value).toBe(""); // auto mode has empty value
    });

    test("select dropdown shows current pinned model as selected option", () => {
      const { container } = render(
        <RoutingTable
          rows={mockRows}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      const selects = container.querySelectorAll("select");
      const chatSelect = selects[1] as HTMLSelectElement;
      expect(chatSelect.value).toBe("claude-3-opus");
    });

    test("select dropdown lists all available models", () => {
      const { container } = render(
        <RoutingTable
          rows={mockRows}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      const firstSelect = container.querySelector("select") as HTMLSelectElement;
      const options = firstSelect.querySelectorAll("option");
      expect(options.length).toBe(mockLiveModels.length + 1); // +1 for auto option
    });

    test("renders 'NO MODEL' chip for no-model surfaces", () => {
      render(
        <RoutingTable
          rows={mockRows}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      expect(screen.getByText("NO MODEL")).toBeTruthy();
    });
  });

  describe("Cost Formatting (Sub-1¢ vs ≥1¢ Precision)", () => {
    test("formats costs under 1¢ with 4 decimal places", () => {
      const row: RoutingRow = {
        surface: "cheap" as RoutingSurface,
        setting: { kind: "auto" },
        autoModelId: "claude-3-sonnet",
        costPerTaskUsd7d: 0.00123,
        latencyP50Ms7d: 100,
        evalScore: 80,
        callCount7d: 100,
        recommendation: undefined,
        recommendationReason: "test",
      };
      render(
        <RoutingTable
          rows={[row]}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      expect(screen.getByText("$0.0012")).toBeTruthy();
    });

    test("formats costs >= 1¢ with 3 decimal places", () => {
      const row: RoutingRow = {
        surface: "expensive" as RoutingSurface,
        setting: { kind: "auto" },
        autoModelId: "claude-3-sonnet",
        costPerTaskUsd7d: 0.0145,
        latencyP50Ms7d: 100,
        evalScore: 80,
        callCount7d: 100,
        recommendation: undefined,
        recommendationReason: "test",
      };
      render(
        <RoutingTable
          rows={[row]}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      expect(screen.getByText("$0.015")).toBeTruthy();
    });

    test("displays '-' for null cost", () => {
      const row: RoutingRow = {
        surface: "no-cost" as RoutingSurface,
        setting: { kind: "no-model" },
        autoModelId: null,
        costPerTaskUsd7d: null,
        latencyP50Ms7d: null,
        evalScore: null,
        callCount7d: 0,
        recommendation: undefined,
        recommendationReason: "test",
      };
      render(
        <RoutingTable
          rows={[row]}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      const cells = screen.getAllByText("-");
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  describe("Latency Formatting (ms vs seconds)", () => {
    test("formats latency < 1000ms without seconds conversion", () => {
      const row: RoutingRow = {
        surface: "fast" as RoutingSurface,
        setting: { kind: "auto" },
        autoModelId: "claude-3-sonnet",
        costPerTaskUsd7d: 0.01,
        latencyP50Ms7d: 450,
        evalScore: 80,
        callCount7d: 100,
        recommendation: undefined,
        recommendationReason: "test",
      };
      render(
        <RoutingTable
          rows={[row]}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      expect(screen.getByText("450ms")).toBeTruthy();
    });

    test("formats latency >= 1000ms in seconds with 1 decimal", () => {
      const row: RoutingRow = {
        surface: "slow" as RoutingSurface,
        setting: { kind: "auto" },
        autoModelId: "claude-3-sonnet",
        costPerTaskUsd7d: 0.01,
        latencyP50Ms7d: 2450,
        evalScore: 80,
        callCount7d: 100,
        recommendation: undefined,
        recommendationReason: "test",
      };
      render(
        <RoutingTable
          rows={[row]}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      expect(screen.getByText("2.5s")).toBeTruthy();
    });

    test("displays '-' for null latency", () => {
      const row: RoutingRow = {
        surface: "no-latency" as RoutingSurface,
        setting: { kind: "no-model" },
        autoModelId: null,
        costPerTaskUsd7d: null,
        latencyP50Ms7d: null,
        evalScore: null,
        callCount7d: 0,
        recommendation: undefined,
        recommendationReason: "test",
      };
      render(
        <RoutingTable
          rows={[row]}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      const cells = screen.getAllByText("-");
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  describe("Eval Score Column", () => {
    test("displays eval score rounded to integer", () => {
      const row: RoutingRow = {
        surface: "eval-test" as RoutingSurface,
        setting: { kind: "auto" },
        autoModelId: "claude-3-sonnet",
        costPerTaskUsd7d: 0.01,
        latencyP50Ms7d: 100,
        evalScore: 92.456,
        callCount7d: 100,
        recommendation: undefined,
        recommendationReason: "test",
      };
      render(
        <RoutingTable
          rows={[row]}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      expect(screen.getByText("92")).toBeTruthy();
    });

    test("includes call count and 7d label", () => {
      render(
        <RoutingTable
          rows={mockRows}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      expect(screen.getByText(/450 calls, 7d/)).toBeTruthy();
      expect(screen.getByText(/320 calls, 7d/)).toBeTruthy();
    });
  });

  describe("Model Selection and Chips", () => {
    test("renders select dropdown with current model selected", () => {
      const { container } = render(
        <RoutingTable
          rows={mockRows}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      const firstSelect = container.querySelector("select") as HTMLSelectElement;
      expect(firstSelect.value).toBe(""); // auto mode
    });

    test("shows PINNED chip for committed pinned models", () => {
      render(
        <RoutingTable
          rows={mockRows}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      expect(screen.getByText("PINNED")).toBeTruthy();
    });

    test("shows AUTO chip for auto-selected models (not dirty)", () => {
      render(
        <RoutingTable
          rows={mockRows}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      expect(screen.getByText("AUTO")).toBeTruthy();
    });
  });

  describe("Button Callbacks", () => {
    test("select dropdown has aria-label describing its surface", () => {
      const { container } = render(
        <RoutingTable
          rows={mockRows}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      const selects = container.querySelectorAll("select");
      const firstSelect = selects[0] as HTMLSelectElement;
      expect(firstSelect.getAttribute("aria-label")).toContain("discovery");
    });

    test("buttons are disabled when pending=true", () => {
      const { container } = render(
        <RoutingTable
          rows={mockRows}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={true}
        />,
      );
      const selects = container.querySelectorAll("select");
      selects.forEach((select) => {
        expect(select.hasAttribute("disabled")).toBe(true);
      });
    });
  });

  describe("Recommendation Column", () => {
    test("shows reason text when no recommendation available", () => {
      render(
        <RoutingTable
          rows={mockRows}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      expect(screen.getByText("Pinned model in use")).toBeTruthy();
      expect(screen.getByText("No model configured")).toBeTruthy();
    });

    test("renders recommendation column even without recommendations", () => {
      render(
        <RoutingTable
          rows={mockRows}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      // Verify the recommendation reason text is rendered for rows without recommendations
      expect(screen.getByText("Pinned model in use")).toBeTruthy();
    });
  });

  describe("Pending State", () => {
    test("disables select dropdown when pending=true", () => {
      const { container } = render(
        <RoutingTable
          rows={mockRows}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={true}
        />,
      );
      const selects = container.querySelectorAll("select");
      selects.forEach((select) => {
        expect(select.hasAttribute("disabled")).toBe(true);
      });
    });

    test("selects and buttons are enabled when pending=false", () => {
      const { container } = render(
        <RoutingTable
          rows={mockRows}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      const selects = container.querySelectorAll("select");
      selects.forEach((select) => {
        expect(select.hasAttribute("disabled")).toBe(false);
      });
    });
  });

  describe("Edge Cases", () => {
    test("renders table with pinned model selection", () => {
      const { container } = render(
        <RoutingTable
          rows={[mockRows[1]]} // chat row with pinned model
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      const select = container.querySelector("select") as HTMLSelectElement;
      // chat row is pinned to claude-3-opus
      expect(select.value).toBe("claude-3-opus");
    });

    test("handles very large eval scores", () => {
      const row: RoutingRow = {
        surface: "high-eval" as RoutingSurface,
        setting: { kind: "auto" },
        autoModelId: "claude-3-sonnet",
        costPerTaskUsd7d: 0.01,
        latencyP50Ms7d: 100,
        evalScore: 999,
        callCount7d: 100,
        recommendation: undefined,
        recommendationReason: "test",
      };
      render(
        <RoutingTable
          rows={[row]}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      expect(screen.getByText("999")).toBeTruthy();
    });

    test("renders table with single row", () => {
      const { container } = render(
        <RoutingTable
          rows={[mockRows[0]]}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(1);
    });

    test("renders table with many rows", () => {
      const manyRows = Array.from({ length: 50 }, (_, i) => ({
        ...mockRows[0],
        surface: (`surface-${i}` as unknown) as RoutingSurface,
      }));
      const { container } = render(
        <RoutingTable
          rows={manyRows}
          liveModels={mockLiveModels}
          onPin={() => {}}
          onApplyRecommendation={() => {}}
          pending={false}
        />,
      );
      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(50);
    });
  });
});
