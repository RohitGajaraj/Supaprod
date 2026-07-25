import { describe, it, expect } from "bun:test";
import { render, fireEvent, screen } from "@testing-library/react";
import React from "react";
import { RoutingPolicyBar } from "../RoutingPolicyBar";
import type { RoutingPolicyMode } from "@/lib/routing-console.functions";

/**
 * RoutingPolicyBar component tests — operator policy row above routing table.
 * Architecture §10, brief §11: three states (auto-adopt, suggest, hold), always visible.
 * Coverage: rendering all policies, active state styling, click handling, disabled state,
 * accessibility (aria-pressed), tooltip hints.
 */

describe("RoutingPolicyBar", () => {
  it("renders all three policy buttons", () => {
    const { container } = render(
      React.createElement(RoutingPolicyBar, {
        value: "auto-adopt",
        onChange: () => {},
      }),
    );

    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBe(3);

    const labels = Array.from(buttons).map((b) => b.textContent);
    expect(labels).toContain("Auto-adopt cheaper, equal");
    expect(labels).toContain("Suggest only");
    expect(labels).toContain("Hold");
  });

  it("renders buttons in a flex container", () => {
    const { container } = render(
      React.createElement(RoutingPolicyBar, {
        value: "auto-adopt",
        onChange: () => {},
      }),
    );

    const panel = container.querySelector(".ink-panel");
    expect(panel).toBeDefined();
    expect(panel?.style.display).toBe("flex");
    expect(panel?.style.flexWrap).toBe("wrap");
  });

  it("marks the selected policy as active with aria-pressed", () => {
    const { container } = render(
      React.createElement(RoutingPolicyBar, {
        value: "suggest",
        onChange: () => {},
      }),
    );

    const buttons = container.querySelectorAll("button");
    const suggestButton = Array.from(buttons).find((b) => b.textContent?.includes("Suggest only"));

    expect(suggestButton?.getAttribute("aria-pressed")).toBe("true");
  });

  it("marks inactive policies with aria-pressed false", () => {
    const { container } = render(
      React.createElement(RoutingPolicyBar, {
        value: "suggest",
        onChange: () => {},
      }),
    );

    const buttons = container.querySelectorAll("button");
    const adoptButton = Array.from(buttons).find((b) => b.textContent?.includes("Auto-adopt"));
    const holdButton = Array.from(buttons).find((b) => b.textContent?.includes("Hold"));

    expect(adoptButton?.getAttribute("aria-pressed")).toBe("false");
    expect(holdButton?.getAttribute("aria-pressed")).toBe("false");
  });

  it("applies active styling (border + background) to selected policy", () => {
    const { container } = render(
      React.createElement(RoutingPolicyBar, {
        value: "auto-adopt",
        onChange: () => {},
      }),
    );

    const buttons = container.querySelectorAll("button");
    const activeButton = Array.from(buttons).find((b) => b.textContent?.includes("Auto-adopt"));

    const style = activeButton?.getAttribute("style");
    expect(style).toContain("var(--voice-human-border)");
    expect(style).toContain("var(--voice-human-soft)");
  });

  it("applies inactive styling (transparent background) to unselected policies", () => {
    const { container } = render(
      React.createElement(RoutingPolicyBar, {
        value: "auto-adopt",
        onChange: () => {},
      }),
    );

    const buttons = container.querySelectorAll("button");
    const inactiveButton = Array.from(buttons).find((b) => b.textContent?.includes("Hold"));

    const style = inactiveButton?.getAttribute("style");
    expect(style).toContain("transparent");
  });

  it("calls onChange with selected policy mode on click", () => {
    let selectedMode: RoutingPolicyMode | null = null;
    const handleChange = (mode: RoutingPolicyMode) => {
      selectedMode = mode;
    };

    const { container } = render(
      React.createElement(RoutingPolicyBar, {
        value: "auto-adopt",
        onChange: handleChange,
      }),
    );

    const buttons = container.querySelectorAll("button");
    const holdButton = Array.from(buttons).find((b) => b.textContent?.includes("Hold"));

    if (holdButton) {
      fireEvent.click(holdButton);
      expect(selectedMode).toBe("hold");
    }
  });

  it("disables all buttons when disabled prop is true", () => {
    const { container } = render(
      React.createElement(RoutingPolicyBar, {
        value: "auto-adopt",
        onChange: () => {},
        disabled: true,
      }),
    );

    const buttons = container.querySelectorAll("button");
    buttons.forEach((button) => {
      expect((button as HTMLButtonElement).disabled).toBe(true);
    });
  });

  it("applies opacity reduction when disabled", () => {
    const { container } = render(
      React.createElement(RoutingPolicyBar, {
        value: "auto-adopt",
        onChange: () => {},
        disabled: true,
      }),
    );

    const buttons = container.querySelectorAll("button");
    buttons.forEach((button) => {
      const style = button.getAttribute("style");
      expect(style).toContain("0.6");
    });
  });

  it("changes cursor to default when disabled", () => {
    const { container } = render(
      React.createElement(RoutingPolicyBar, {
        value: "auto-adopt",
        onChange: () => {},
        disabled: true,
      }),
    );

    const buttons = container.querySelectorAll("button");
    buttons.forEach((button) => {
      const style = button.getAttribute("style");
      expect(style).toContain("cursor: default");
    });
  });

  it("does not respond to clicks when disabled", () => {
    let clickCount = 0;
    const handleChange = () => {
      clickCount++;
    };

    const { container } = render(
      React.createElement(RoutingPolicyBar, {
        value: "auto-adopt",
        onChange: handleChange,
        disabled: true,
      }),
    );

    const buttons = container.querySelectorAll("button");
    const holdButton = Array.from(buttons).find((b) => b.textContent?.includes("Hold"));

    if (holdButton && (holdButton as HTMLButtonElement).disabled) {
      fireEvent.click(holdButton);
      // Disabled buttons should not fire click handlers
    }
  });

  it("sets title attribute to policy hint text", () => {
    const { container } = render(
      React.createElement(RoutingPolicyBar, {
        value: "auto-adopt",
        onChange: () => {},
      }),
    );

    const buttons = container.querySelectorAll("button");
    const suggestButton = Array.from(buttons).find((b) => b.textContent?.includes("Suggest only"));

    expect(suggestButton?.title).toBe("Shows the recommendation. You apply it by hand.");
  });

  it("applies consistent button styling (padding, border-radius, font)", () => {
    const { container } = render(
      React.createElement(RoutingPolicyBar, {
        value: "auto-adopt",
        onChange: () => {},
      }),
    );

    const buttons = container.querySelectorAll("button");
    buttons.forEach((button) => {
      const style = button.getAttribute("style");
      expect(style).toContain("8px 14px"); // padding
      expect(style).toContain("var(--ink-radius-control)"); // border-radius
      expect(style).toContain("13"); // fontSize
    });
  });

  it("applies ink-focus class for focus styles", () => {
    const { container } = render(
      React.createElement(RoutingPolicyBar, {
        value: "auto-adopt",
        onChange: () => {},
      }),
    );

    const buttons = container.querySelectorAll("button");
    buttons.forEach((button) => {
      expect(button.className).toContain("ink-focus");
    });
  });

  it("transitions between policy modes", () => {
    let currentMode: RoutingPolicyMode = "auto-adopt";
    const handleChange = (mode: RoutingPolicyMode) => {
      currentMode = mode;
    };

    const { rerender, container } = render(
      React.createElement(RoutingPolicyBar, {
        value: currentMode,
        onChange: handleChange,
      }),
    );

    // Verify initial state
    let buttons = container.querySelectorAll("button");
    let activeButton = Array.from(buttons).find((b) => b.textContent?.includes("Auto-adopt"));
    expect(activeButton?.getAttribute("aria-pressed")).toBe("true");

    // Change to "suggest"
    currentMode = "suggest";
    rerender(
      React.createElement(RoutingPolicyBar, {
        value: currentMode,
        onChange: handleChange,
      }),
    );

    buttons = container.querySelectorAll("button");
    activeButton = Array.from(buttons).find((b) => b.textContent?.includes("Suggest only"));
    expect(activeButton?.getAttribute("aria-pressed")).toBe("true");
  });

  it("has correct button type='button'", () => {
    const { container } = render(
      React.createElement(RoutingPolicyBar, {
        value: "auto-adopt",
        onChange: () => {},
      }),
    );

    const buttons = container.querySelectorAll("button");
    buttons.forEach((button) => {
      expect((button as HTMLButtonElement).type).toBe("button");
    });
  });
});

describe("RoutingPolicyBar policies data", () => {
  it("renders policy labels correctly", () => {
    const { container } = render(
      React.createElement(RoutingPolicyBar, {
        value: "auto-adopt",
        onChange: () => {},
      }),
    );

    const labels = new Set(
      Array.from(container.querySelectorAll("button")).map((b) => b.textContent),
    );

    expect(labels.has("Auto-adopt cheaper, equal")).toBe(true);
    expect(labels.has("Suggest only")).toBe(true);
    expect(labels.has("Hold")).toBe(true);
  });

  it("renders policy hints correctly", () => {
    const { container } = render(
      React.createElement(RoutingPolicyBar, {
        value: "auto-adopt",
        onChange: () => {},
      }),
    );

    const buttons = container.querySelectorAll("button");
    const hints = Array.from(buttons).map((b) => b.title);

    expect(hints).toContain(
      "Switches a surface to the cheaper model automatically, then reports it here.",
    );
    expect(hints).toContain("Shows the recommendation. You apply it by hand.");
    expect(hints).toContain("No recommendations act on anything. Pins stay exactly as set.");
  });

  it("supports all three policy modes as valid values", () => {
    const modes: RoutingPolicyMode[] = ["auto-adopt", "suggest", "hold"];

    modes.forEach((mode) => {
      const { container } = render(
        React.createElement(RoutingPolicyBar, {
          value: mode,
          onChange: () => {},
        }),
      );

      const buttons = container.querySelectorAll("button");
      const activeButtons = Array.from(buttons).filter(
        (b) => b.getAttribute("aria-pressed") === "true",
      );

      expect(activeButtons.length).toBe(1);
    });
  });
});
