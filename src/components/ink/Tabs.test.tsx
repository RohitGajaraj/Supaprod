import { describe, it, expect } from "bun:test";
import { render, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./Tabs";

describe("Tabs", () => {
  describe("render", () => {
    it("renders tab trigger and content", () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      expect(container.textContent).toContain("Tab 1");
      expect(container.textContent).toContain("Tab 2");
      expect(container.textContent).toContain("Content 1");
    });
  });

  describe("TabsList", () => {
    it("renders with correct background and padding", () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>,
      );

      const list = container.querySelector("[role='tablist']");
      expect(list?.className).toContain("inline-flex");
      expect(list?.className).toContain("h-10");
      expect(list?.className).toContain("bg-[var(--ds-gray-100)]");
      expect(list?.className).toContain("rounded-md");
    });
  });

  describe("TabsTrigger", () => {
    it("renders as a tab button", () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Plan</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Plan content</TabsContent>
        </Tabs>,
      );

      const trigger = container.querySelector("[role='tab']");
      expect(trigger).toBeTruthy();
      expect(trigger?.textContent).toBe("Plan");
    });

    it("renders with correct text styling", () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>,
      );

      const trigger = container.querySelector("[role='tab']");
      expect(trigger?.className).toContain("text-label-14");
      expect(trigger?.className).toContain("font-medium");
    });

    it("highlights active trigger", () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      const triggers = container.querySelectorAll("[role='tab']");
      const activeTrigger = triggers[0];

      expect(activeTrigger.getAttribute("data-state")).toBe("active");
      expect(activeTrigger?.className).toContain(
        "data-[state=active]:bg-[var(--ds-background-100)]",
      );
    });

    it("applies different styling for inactive trigger", () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      const triggers = container.querySelectorAll("[role='tab']");
      const inactiveTrigger = triggers[1];

      expect(inactiveTrigger.getAttribute("data-state")).toBe("inactive");
      expect(inactiveTrigger?.className).toContain("text-[var(--ds-gray-600)]");
    });

    it("transitions text color on hover", () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>,
      );

      const trigger = container.querySelector("[role='tab']");
      expect(trigger?.className).toContain("hover:text-[var(--ds-gray-900)]");
      expect(trigger?.className).toContain("transition-colors");
    });
  });

  describe("TabsContent", () => {
    it("renders content for active tab", () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      expect(container.textContent).toContain("Content 1");
    });

    it("does not render content for inactive tabs", () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      expect(container.textContent).not.toContain("Content 2");
    });

    it("has proper spacing from TabsList", () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>,
      );

      const content = container.querySelector("[role='tabpanel']");
      expect(content?.className).toContain("mt-2");
    });

    it("supports focus ring on content", () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>,
      );

      const content = container.querySelector("[role='tabpanel']");
      expect(content?.className).toContain("focus-visible:ring-2");
      expect(content?.className).toContain("focus-visible:ring-[var(--ds-focus-color)]");
    });
  });

  describe("tab switching", () => {
    it("switches to different tab on click", async () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      const triggers = container.querySelectorAll("[role='tab']");
      const tab2Trigger = triggers[1] as HTMLElement;

      fireEvent.click(tab2Trigger);

      await waitFor(() => {
        expect(container.textContent).toContain("Content 2");
        expect(container.textContent).not.toContain("Content 1");
      });
    });

    it("updates active trigger state on click", async () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      const triggers = container.querySelectorAll("[role='tab']");
      const tab2Trigger = triggers[1];

      fireEvent.click(tab2Trigger);

      await waitFor(() => {
        expect(tab2Trigger.getAttribute("data-state")).toBe("active");
      });
    });
  });

  describe("keyboard navigation", () => {
    it("navigates tabs with arrow keys", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>,
      );

      const triggers = container.querySelectorAll("[role='tab']");
      const tab1Trigger = triggers[0] as HTMLElement;

      tab1Trigger.focus();
      await user.keyboard("{ArrowRight}");

      // After arrow right, should select next tab
      const tab2Trigger = triggers[1];
      expect(tab2Trigger.getAttribute("data-state")).toBe("active");
    });

    it("selects tab on Enter/Space", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      );

      const triggers = container.querySelectorAll("[role='tab']");
      const tab2Trigger = triggers[1] as HTMLElement;

      tab2Trigger.focus();
      await user.keyboard("{Enter}");

      expect(tab2Trigger.getAttribute("data-state")).toBe("active");
    });
  });

  describe("focus management", () => {
    it("applies focus ring styling on focus", () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>,
      );

      const trigger = container.querySelector("[role='tab']") as HTMLElement;
      trigger.focus();

      expect(trigger.className).toContain("focus-visible:ring");
    });

    it("uses correct focus color", () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>,
      );

      const trigger = container.querySelector("[role='tab']");
      expect(trigger?.className).toContain("focus-visible:ring-[var(--ds-focus-color)]");
    });
  });

  describe("motion preference", () => {
    it("disables animations when motion is off", () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>,
      );

      const trigger = container.querySelector("[role='tab']");
      expect(trigger?.className).toContain("data-[motion=off]:transition-none");
    });
  });

  describe("multiple tabs", () => {
    it("renders multiple tab sections", () => {
      const { container } = render(
        <Tabs defaultValue="plan">
          <TabsList>
            <TabsTrigger value="plan">Plan</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="build">Build</TabsTrigger>
            <TabsTrigger value="ship">Ship</TabsTrigger>
            <TabsTrigger value="launch">Launch</TabsTrigger>
            <TabsTrigger value="grow">Grow</TabsTrigger>
          </TabsList>
          <TabsContent value="plan">Planning content</TabsContent>
          <TabsContent value="design">Design content</TabsContent>
          <TabsContent value="build">Build content</TabsContent>
          <TabsContent value="ship">Ship content</TabsContent>
          <TabsContent value="launch">Launch content</TabsContent>
          <TabsContent value="grow">Growth content</TabsContent>
        </Tabs>,
      );

      const triggers = container.querySelectorAll("[role='tab']");
      expect(triggers.length).toBe(6);
      expect(container.textContent).toContain("Planning content");
    });

    it("switches between all tabs correctly", async () => {
      const { container } = render(
        <Tabs defaultValue="plan">
          <TabsList>
            <TabsTrigger value="plan">Plan</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="build">Build</TabsTrigger>
          </TabsList>
          <TabsContent value="plan">Planning</TabsContent>
          <TabsContent value="design">Designing</TabsContent>
          <TabsContent value="build">Building</TabsContent>
        </Tabs>,
      );

      const triggers = container.querySelectorAll("[role='tab']");

      fireEvent.click(triggers[1]);
      await waitFor(() => {
        expect(container.textContent).toContain("Designing");
      });

      fireEvent.click(triggers[2]);
      await waitFor(() => {
        expect(container.textContent).toContain("Building");
      });
    });
  });

  describe("className merge", () => {
    it("merges custom TabsList className", () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList className="custom-list">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>,
      );

      const list = container.querySelector("[role='tablist']");
      expect(list?.className).toContain("custom-list");
      expect(list?.className).toContain("inline-flex");
    });

    it("merges custom TabsTrigger className", () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" className="custom-trigger">
              Tab 1
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>,
      );

      const trigger = container.querySelector("[role='tab']");
      expect(trigger?.className).toContain("custom-trigger");
    });
  });

  describe("ref forwarding", () => {
    it("forwards ref on TabsTrigger", () => {
      const ref = { current: null };
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" ref={ref}>
              Tab 1
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>,
      );

      expect(ref.current).toBeTruthy();
      expect(ref.current?.getAttribute("role")).toBe("tab");
    });
  });
});
