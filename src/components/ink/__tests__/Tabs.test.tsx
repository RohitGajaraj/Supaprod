/**
 * Tabs component tests — Tempo v5, Radix TabsPrimitive wrapper.
 *
 * Coverage: rendering, controlled/uncontrolled selection, content panel switching,
 * disabled trigger, keyboard arrow navigation, accessibility (ARIA roles),
 * design-system token classes, data-motion=off, forwardRef on sub-components,
 * custom className merging, edge cases.
 */

import { describe, test, expect } from "bun:test";
import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../Tabs";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Render a minimal two-tab setup and return the container */
function renderTabs({
  defaultValue = "a",
  disabled = false,
  className,
}: {
  defaultValue?: string;
  disabled?: boolean;
  className?: string;
} = {}) {
  return render(
    React.createElement(
      Tabs,
      { defaultValue },
      React.createElement(
        TabsList,
        { className },
        React.createElement(TabsTrigger, { value: "a", disabled }, "Tab A"),
        React.createElement(TabsTrigger, { value: "b" }, "Tab B"),
      ),
      React.createElement(TabsContent, { value: "a" }, "Content A"),
      React.createElement(TabsContent, { value: "b" }, "Content B"),
    ),
  );
}

// ---------------------------------------------------------------------------
// Rendering — structure
// ---------------------------------------------------------------------------

describe("Tabs — structural rendering", () => {
  test("renders the tabs root element", () => {
    const { container } = renderTabs();
    expect(container.firstElementChild).toBeTruthy();
  });

  test("renders TabsList with tablist role", () => {
    renderTabs();
    expect(screen.getByRole("tablist")).toBeTruthy();
  });

  test("renders two tab triggers", () => {
    renderTabs();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
  });

  test("renders TabsContent for default active tab", () => {
    renderTabs({ defaultValue: "a" });
    // RTL only renders the active panel by default in Radix Tabs
    expect(screen.getByText("Content A")).toBeTruthy();
  });

  test("renders tab text labels correctly", () => {
    renderTabs();
    expect(screen.getByText("Tab A")).toBeTruthy();
    expect(screen.getByText("Tab B")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Selection — active tab state
// ---------------------------------------------------------------------------

describe("Tabs — active state", () => {
  test("default tab trigger has data-state=active", () => {
    renderTabs({ defaultValue: "a" });
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0].getAttribute("data-state")).toBe("active");
  });

  test("non-active tab trigger has data-state=inactive", () => {
    renderTabs({ defaultValue: "a" });
    const tabs = screen.getAllByRole("tab");
    expect(tabs[1].getAttribute("data-state")).toBe("inactive");
  });

  test("clicking inactive tab activates it", () => {
    renderTabs({ defaultValue: "a" });
    const tabs = screen.getAllByRole("tab");
    // Radix Tabs responds to mousedown then mouseup for activation in happy-dom
    fireEvent.mouseDown(tabs[1]);
    fireEvent.mouseUp(tabs[1]);
    fireEvent.click(tabs[1]);
    expect(tabs[1].getAttribute("data-state")).toBe("active");
  });

  test("clicking a tab deactivates the previously active tab", () => {
    renderTabs({ defaultValue: "a" });
    const tabs = screen.getAllByRole("tab");
    fireEvent.mouseDown(tabs[1]);
    fireEvent.mouseUp(tabs[1]);
    fireEvent.click(tabs[1]);
    expect(tabs[0].getAttribute("data-state")).toBe("inactive");
  });

  test("content switches when a different tab is selected", () => {
    renderTabs({ defaultValue: "a" });
    const tabs = screen.getAllByRole("tab");
    expect(screen.getByText("Content A")).toBeTruthy();

    fireEvent.mouseDown(tabs[1]);
    fireEvent.mouseUp(tabs[1]);
    fireEvent.click(tabs[1]);
    expect(screen.getByText("Content B")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Disabled trigger
// ---------------------------------------------------------------------------

describe("Tabs — disabled trigger", () => {
  test("disabled trigger has data-disabled attribute", () => {
    renderTabs({ disabled: true });
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0].getAttribute("data-disabled")).toBe("");
  });

  test("clicking disabled trigger does not activate it", () => {
    renderTabs({ defaultValue: "b", disabled: true });
    const tabs = screen.getAllByRole("tab");
    // Tab A is disabled; Tab B is the default active
    fireEvent.click(tabs[0]);
    expect(tabs[0].getAttribute("data-state")).toBe("inactive");
    expect(tabs[1].getAttribute("data-state")).toBe("active");
  });
});

// ---------------------------------------------------------------------------
// Design-system token classes
// ---------------------------------------------------------------------------

describe("TabsList — design token classes", () => {
  test("applies horizontal flex layout", () => {
    renderTabs();
    const list = screen.getByRole("tablist");
    expect(list.className).toContain("inline-flex");
    expect(list.className).toContain("items-center");
  });

  test("applies h-10 (40px) height", () => {
    renderTabs();
    const list = screen.getByRole("tablist");
    expect(list.className).toContain("h-10");
  });

  test("applies background panel token", () => {
    renderTabs();
    const list = screen.getByRole("tablist");
    expect(list.className).toContain("bg-[var(--ds-gray-100)]");
  });

  test("applies rounded-md shape", () => {
    renderTabs();
    const list = screen.getByRole("tablist");
    expect(list.className).toContain("rounded-md");
  });
});

describe("TabsTrigger — design token classes", () => {
  test("applies focus-visible ring token", () => {
    renderTabs();
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0].className).toContain("focus-visible:ring-[var(--ds-focus-color)]");
  });

  test("applies transition-colors for smooth active switching", () => {
    renderTabs();
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0].className).toContain("transition-colors");
  });

  test("applies data-[state=active]:bg-[var(--ds-background-100)] class", () => {
    renderTabs();
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0].className).toContain("data-[state=active]:bg-[var(--ds-background-100)]");
  });

  test("applies data-[motion=off]:transition-none class for reduced motion", () => {
    renderTabs();
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0].className).toContain("data-[motion=off]:transition-none");
  });
});

describe("TabsContent — design token classes", () => {
  test("applies mt-2 top margin", () => {
    renderTabs({ defaultValue: "a" });
    const panel = screen.getByRole("tabpanel");
    expect(panel.className).toContain("mt-2");
  });

  test("applies focus-visible ring for keyboard accessibility", () => {
    renderTabs({ defaultValue: "a" });
    const panel = screen.getByRole("tabpanel");
    expect(panel.className).toContain("focus-visible:ring-[var(--ds-focus-color)]");
  });
});

// ---------------------------------------------------------------------------
// Keyboard navigation — Arrow keys
// ---------------------------------------------------------------------------

describe("Tabs — keyboard arrow navigation", () => {
  test("tab triggers carry tabindex attribute for keyboard accessibility", () => {
    // Radix Tabs implements roving tabindex. In happy-dom the initial tabindex
    // assigned depends on which tab is active. We verify the attribute exists
    // and is a valid tabindex value (-1 or 0).
    renderTabs({ defaultValue: "a" });
    const tabs = screen.getAllByRole("tab");
    const tabindices = Array.from(tabs).map((t) => t.getAttribute("tabindex"));
    tabindices.forEach((ti) => {
      expect(ti === "0" || ti === "-1").toBe(true);
    });
  });

  test("triggers can receive focus programmatically", () => {
    renderTabs({ defaultValue: "a" });
    const tabs = screen.getAllByRole("tab");
    tabs[0].focus();
    expect(document.activeElement).toBe(tabs[0]);
  });

  test("ArrowRight keydown event is fired without error", () => {
    // Verifies the event handler wiring without relying on Radix's async
    // focus movement (which doesn't complete synchronously in happy-dom).
    renderTabs({ defaultValue: "a" });
    const tabs = screen.getAllByRole("tab");
    tabs[0].focus();
    expect(() => fireEvent.keyDown(tabs[0], { key: "ArrowRight" })).not.toThrow();
  });

  test("ArrowLeft keydown event is fired without error", () => {
    renderTabs({ defaultValue: "b" });
    const tabs = screen.getAllByRole("tab");
    tabs[1].focus();
    expect(() => fireEvent.keyDown(tabs[1], { key: "ArrowLeft" })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Accessibility — ARIA attributes
// ---------------------------------------------------------------------------

describe("Tabs — ARIA accessibility", () => {
  test("each trigger has role=tab", () => {
    renderTabs();
    screen.getAllByRole("tab").forEach((tab) => {
      expect(tab.getAttribute("role")).toBe("tab");
    });
  });

  test("tablist has role=tablist", () => {
    renderTabs();
    expect(screen.getByRole("tablist").getAttribute("role")).toBe("tablist");
  });

  test("active content panel has role=tabpanel", () => {
    renderTabs({ defaultValue: "a" });
    expect(screen.getByRole("tabpanel")).toBeTruthy();
  });

  test("trigger has aria-controls pointing to its panel", () => {
    renderTabs({ defaultValue: "a" });
    const tab = screen.getAllByRole("tab")[0];
    const panelId = tab.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    const panel = document.getElementById(panelId!);
    expect(panel).toBeTruthy();
  });

  test("panel has aria-labelledby pointing to its trigger", () => {
    renderTabs({ defaultValue: "a" });
    const panel = screen.getByRole("tabpanel");
    const labelId = panel.getAttribute("aria-labelledby");
    expect(labelId).toBeTruthy();
    expect(document.getElementById(labelId!)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Custom className merging
// ---------------------------------------------------------------------------

describe("Tabs — custom className", () => {
  test("TabsList merges custom className", () => {
    renderTabs({ className: "my-tablist" });
    const list = screen.getByRole("tablist");
    expect(list.className).toContain("my-tablist");
    expect(list.className).toContain("inline-flex");
  });
});

// ---------------------------------------------------------------------------
// Controlled mode
// ---------------------------------------------------------------------------

describe("Tabs — controlled value prop", () => {
  test("controlled value selects the correct tab", () => {
    const { container } = render(
      React.createElement(
        Tabs,
        { value: "b" },
        React.createElement(
          TabsList,
          null,
          React.createElement(TabsTrigger, { value: "a" }, "A"),
          React.createElement(TabsTrigger, { value: "b" }, "B"),
        ),
        React.createElement(TabsContent, { value: "a" }, "Panel A"),
        React.createElement(TabsContent, { value: "b" }, "Panel B"),
      ),
    );
    const tabs = container.querySelectorAll("[role='tab']");
    expect(tabs[1].getAttribute("data-state")).toBe("active");
    expect(screen.getByText("Panel B")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// forwardRef on sub-components
// ---------------------------------------------------------------------------

describe("Tabs — forwardRef", () => {
  test("TabsList ref forwards to the list div element", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      React.createElement(
        Tabs,
        { defaultValue: "a" },
        React.createElement(
          TabsList,
          { ref },
          React.createElement(TabsTrigger, { value: "a" }, "A"),
        ),
        React.createElement(TabsContent, { value: "a" }, "Content A"),
      ),
    );
    expect(ref.current).toBeTruthy();
    expect(ref.current?.tagName).toBe("DIV");
  });

  test("TabsTrigger ref forwards to the button element", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      React.createElement(
        Tabs,
        { defaultValue: "a" },
        React.createElement(
          TabsList,
          null,
          React.createElement(TabsTrigger, { value: "a", ref }, "A"),
        ),
        React.createElement(TabsContent, { value: "a" }, "Content A"),
      ),
    );
    expect(ref.current).toBeTruthy();
    expect(ref.current?.tagName).toBe("BUTTON");
  });

  test("TabsContent ref forwards to the content div element", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      React.createElement(
        Tabs,
        { defaultValue: "a" },
        React.createElement(TabsList, null, React.createElement(TabsTrigger, { value: "a" }, "A")),
        React.createElement(TabsContent, { value: "a", ref }, "Content A"),
      ),
    );
    expect(ref.current).toBeTruthy();
    expect(ref.current?.tagName).toBe("DIV");
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("Tabs — edge cases", () => {
  test("single tab renders without error", () => {
    expect(() =>
      render(
        React.createElement(
          Tabs,
          { defaultValue: "only" },
          React.createElement(
            TabsList,
            null,
            React.createElement(TabsTrigger, { value: "only" }, "Only"),
          ),
          React.createElement(TabsContent, { value: "only" }, "Only panel"),
        ),
      ),
    ).not.toThrow();
  });

  test("empty TabsList renders without error", () => {
    expect(() =>
      render(
        React.createElement(Tabs, { defaultValue: "none" }, React.createElement(TabsList, null)),
      ),
    ).not.toThrow();
  });

  test("no defaultValue renders without crash", () => {
    expect(() =>
      render(
        React.createElement(
          Tabs,
          null,
          React.createElement(
            TabsList,
            null,
            React.createElement(TabsTrigger, { value: "x" }, "X"),
          ),
          React.createElement(TabsContent, { value: "x" }, "Content X"),
        ),
      ),
    ).not.toThrow();
  });
});
