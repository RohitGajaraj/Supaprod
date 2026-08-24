import { describe, expect, test } from "bun:test";
import * as React from "react";
import { Button as ObsidianButton } from "@/components/obsidian/primitives";
import { Button as TempoButton } from "@/components/ui/button";

describe("Button consolidation: obsidian re-exports unified Tempo Button", () => {
  test("obsidian Button is the unified Tempo Button", () => {
    // Both exports should be the same component
    expect(ObsidianButton.displayName).toBe(TempoButton.displayName);
    expect(ObsidianButton.displayName).toBe("Button");
  });

  describe("Obsidian-to-Tempo variant mapping works", () => {
    test("secondary variant (same in both) renders", () => {
      const el = ObsidianButton.render({ variant: "secondary", children: "Cancel" }, null);
      expect(el).toBeTruthy();
      expect(el.type).toBe("button");
    });

    test("tertiary variant (same in both) renders", () => {
      const el = ObsidianButton.render({ variant: "tertiary", children: "Maybe" }, null);
      expect(el).toBeTruthy();
      expect(el.type).toBe("button");
    });

    test("link variant (same in both) renders", () => {
      const el = ObsidianButton.render({ variant: "link", children: "Docs" }, null);
      expect(el).toBeTruthy();
      expect(el.type).toBe("button");
    });

    test("size prop works (sm)", () => {
      const el = ObsidianButton.render({ size: "sm", children: "Small" }, null);
      expect(el).toBeTruthy();
      expect(el.type).toBe("button");
      // Class names should include size styling
      expect(el.props.className).toContain("px");
    });

    test("size prop works (default)", () => {
      const el = ObsidianButton.render({ size: "default", children: "Normal" }, null);
      expect(el).toBeTruthy();
      expect(el.type).toBe("button");
      // Class names should include size styling
      expect(el.props.className).toContain("px");
    });

    test("loading prop works", () => {
      const el = ObsidianButton.render({ loading: true, children: "Wait" }, null);
      expect(el).toBeTruthy();
      expect(el.props["aria-busy"]).toBe(true);
    });

    test("disabled prop works", () => {
      const el = ObsidianButton.render({ disabled: true, children: "Nope" }, null);
      expect(el).toBeTruthy();
      expect(el.props.disabled).toBe(true);
    });

    test("className is merged correctly", () => {
      const el = ObsidianButton.render(
        { variant: "tertiary", className: "my-custom-class", children: "Test" },
        null,
      );
      expect(el.props.className).toContain("my-custom-class");
    });

    test("onClick handler is passed through", () => {
      const onClick = () => console.log("clicked");
      const el = ObsidianButton.render({ onClick, children: "Click me" }, null);
      expect(el.props.onClick).toBe(onClick);
    });
  });

  describe("New Tempo variants work when called from obsidian import", () => {
    test("can use accent variant (new Tempo grammar)", () => {
      const el = ObsidianButton.render({ variant: "accent", children: "Primary CTA" }, null);
      expect(el).toBeTruthy();
      expect(el.type).toBe("button");
      // accent should render with ember color
      expect(el.props.className).toContain("bg-[var(--ember)]");
    });

    test("can use default variant (new Tempo grammar)", () => {
      const el = ObsidianButton.render({ variant: "default", children: "Save" }, null);
      expect(el).toBeTruthy();
      expect(el.type).toBe("button");
      // default should render with neutral gray
      expect(el.props.className).toContain("bg-primary");
    });

    test("can use destructive variant (new Tempo grammar)", () => {
      const el = ObsidianButton.render({ variant: "destructive", children: "Delete" }, null);
      expect(el).toBeTruthy();
      expect(el.type).toBe("button");
      // destructive should render with red color
      expect(el.props.className).toContain("bg-destructive");
    });

    test("can use warning variant (new Tempo grammar)", () => {
      const el = ObsidianButton.render({ variant: "warning", children: "Careful" }, null);
      expect(el).toBeTruthy();
      expect(el.type).toBe("button");
      // warning should render with the hold face (R013 item 2: Tempo amber left)
      expect(el.props.className).toContain("bg-mrd-hold");
    });
  });

  describe("Real-world usage patterns", () => {
    test("typical form button usage works", () => {
      const el = ObsidianButton.render(
        {
          variant: "secondary",
          size: "sm",
          onClick: () => {},
          children: "Save Changes",
        },
        null,
      );
      expect(el).toBeTruthy();
      expect(el.type).toBe("button");
      expect(el.props.onClick).toBeInstanceOf(Function);
    });

    test("loading state with callback", () => {
      const onClick = () => console.log("submit");
      const el = ObsidianButton.render(
        {
          variant: "default",
          loading: true,
          onClick,
          children: "Submit",
        },
        null,
      );
      expect(el).toBeTruthy();
      expect(el.props["aria-busy"]).toBe(true);
      expect(el.props.onClick).toBe(onClick);
    });

    test("disabled confirmation pattern", () => {
      const el = ObsidianButton.render(
        {
          variant: "destructive",
          disabled: true,
          onClick: () => {},
          children: "Delete Account",
        },
        null,
      );
      expect(el).toBeTruthy();
      expect(el.props.disabled).toBe(true);
    });

    test("tertiary action pattern (low emphasis)", () => {
      const el = ObsidianButton.render(
        {
          variant: "tertiary",
          size: "sm",
          onClick: () => {},
          children: "Undo",
        },
        null,
      );
      expect(el).toBeTruthy();
      // Tertiary should be transparent at rest
      expect(el.props.className).toContain("bg-transparent");
    });
  });
});
