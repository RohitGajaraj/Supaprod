import { describe, expect, test, beforeEach, afterEach, spyOn } from "bun:test";
import * as React from "react";
import { Button, buttonVariants } from "./button";

/**
 * Force `import.meta.env.DEV` on for the deprecation tests, and put it back.
 *
 * The obvious call, defining DEV with only `configurable: true`, throws under bun:
 * 'process.env' only accepts a configurable, writable, and enumerable data
 * descriptor. In bun `import.meta.env` IS `process.env`, so the descriptor needs
 * all three flags. These two tests failed on every machine running bun 1.4.0 while
 * passing elsewhere, and three sessions reported three different pass counts
 * because of it.
 *
 * Restoring needs the same care and for a second reason: `process.env` coerces
 * values to strings, so writing back an `undefined` original would store the
 * STRING "undefined", which is truthy, and would leak DEV=on into every test that
 * ran afterwards. When there was no original, delete the key instead.
 */
function setDevFlag(value: unknown): void {
  const env = import.meta.env as unknown as Record<string, unknown>;
  if (value === undefined) {
    delete env.DEV;
    return;
  }
  Object.defineProperty(env, "DEV", {
    value,
    configurable: true,
    writable: true,
    enumerable: true,
  });
}

describe("Button component variant consolidation", () => {
  // Capture console warnings for deprecation tests
  let consoleWarnSpy: ReturnType<typeof spyOn> | null = null;
  beforeEach(() => {
    consoleWarnSpy = spyOn(console, "warn");
  });
  afterEach(() => {
    consoleWarnSpy?.mockRestore();
  });

  describe("Tempo variant names (correct)", () => {
    test("accent variant exists and renders without warnings", () => {
      const el = Button.render({ variant: "accent", children: "Click me" }, null);
      expect(el).toBeTruthy();
      expect(el.type).toBe("button");
      // Should not warn for Tempo-spec variant names
      expect(consoleWarnSpy?.mock.calls.length).toBe(0);
    });

    test("default variant exists and renders without warnings", () => {
      const el = Button.render({ variant: "default", children: "Save" }, null);
      expect(el).toBeTruthy();
      expect(el.type).toBe("button");
      expect(consoleWarnSpy?.mock.calls.length).toBe(0);
    });

    test("secondary variant exists and renders without warnings", () => {
      const el = Button.render({ variant: "secondary", children: "Cancel" }, null);
      expect(el).toBeTruthy();
      expect(el.type).toBe("button");
      expect(consoleWarnSpy?.mock.calls.length).toBe(0);
    });

    test("tertiary variant exists and renders without warnings", () => {
      const el = Button.render({ variant: "tertiary", children: "Maybe later" }, null);
      expect(el).toBeTruthy();
      expect(el.type).toBe("button");
      expect(consoleWarnSpy?.mock.calls.length).toBe(0);
    });

    test("ghost variant exists and renders without warnings", () => {
      const el = Button.render({ variant: "ghost", children: "Dismiss" }, null);
      expect(el).toBeTruthy();
      expect(el.type).toBe("button");
      expect(consoleWarnSpy?.mock.calls.length).toBe(0);
    });

    test("outline variant exists and renders without warnings", () => {
      const el = Button.render({ variant: "outline", children: "Info" }, null);
      expect(el).toBeTruthy();
      expect(el.type).toBe("button");
      expect(consoleWarnSpy?.mock.calls.length).toBe(0);
    });

    test("link variant exists and renders without warnings", () => {
      const el = Button.render({ variant: "link", children: "Go to docs" }, null);
      expect(el).toBeTruthy();
      expect(el.type).toBe("button");
      expect(consoleWarnSpy?.mock.calls.length).toBe(0);
    });

    test("destructive variant exists and renders without warnings", () => {
      const el = Button.render({ variant: "destructive", children: "Delete" }, null);
      expect(el).toBeTruthy();
      expect(el.type).toBe("button");
      expect(consoleWarnSpy?.mock.calls.length).toBe(0);
    });

    test("warning variant exists and renders without warnings", () => {
      const el = Button.render({ variant: "warning", children: "Careful" }, null);
      expect(el).toBeTruthy();
      expect(el.type).toBe("button");
      expect(consoleWarnSpy?.mock.calls.length).toBe(0);
    });
  });

  describe("Legacy obsidian variant names (backward compatibility)", () => {
    test('obsidian "primary" maps to Tempo "accent" with deprecation warning', () => {
      // Run in a simulated browser context for warning to trigger
      const originalEnv = import.meta.env.DEV;
      setDevFlag(true);
      Object.defineProperty(window, "navigator", { value: { userAgent: "" }, writable: true });

      const el = Button.render({ variant: "primary" as never, children: "Click me" }, null);
      expect(el).toBeTruthy();
      expect(el.type).toBe("button");
      // Should warn about using legacy "primary"
      const warnCalls = consoleWarnSpy?.mock.calls || [];
      const deprecationWarning = warnCalls.some(
        ([msg]) =>
          typeof msg === "string" &&
          msg.includes("variant='primary'") &&
          msg.includes("variant='accent'"),
      );
      expect(deprecationWarning).toBe(true);

      setDevFlag(originalEnv);
    });

    test('obsidian "quiet" maps to Tempo "tertiary" with deprecation warning', () => {
      // Run in a simulated browser context for warning to trigger
      const originalEnv = import.meta.env.DEV;
      setDevFlag(true);
      Object.defineProperty(window, "navigator", { value: { userAgent: "" }, writable: true });

      const el = Button.render({ variant: "quiet" as never, children: "Skip" }, null);
      expect(el).toBeTruthy();
      expect(el.type).toBe("button");
      // Should warn about using legacy "quiet"
      const warnCalls = consoleWarnSpy?.mock.calls || [];
      const deprecationWarning = warnCalls.some(
        ([msg]) =>
          typeof msg === "string" &&
          msg.includes("variant='quiet'") &&
          msg.includes("variant='tertiary'"),
      );
      expect(deprecationWarning).toBe(true);

      setDevFlag(originalEnv);
    });

    test("obsidian secondary variant works without warning (same name as Tempo)", () => {
      const el = Button.render({ variant: "secondary", children: "Cancel" }, null);
      expect(el).toBeTruthy();
      expect(el.type).toBe("button");
      // "secondary" exists in both systems, should not warn
      expect(consoleWarnSpy?.mock.calls.length).toBe(0);
    });

    test("obsidian tertiary variant works without warning (same name as Tempo)", () => {
      const el = Button.render({ variant: "tertiary", children: "Maybe" }, null);
      expect(el).toBeTruthy();
      expect(el.type).toBe("button");
      // "tertiary" exists in both systems, should not warn
      expect(consoleWarnSpy?.mock.calls.length).toBe(0);
    });

    test("obsidian link variant works without warning (same name as Tempo)", () => {
      const el = Button.render({ variant: "link", children: "Docs" }, null);
      expect(el).toBeTruthy();
      expect(el.type).toBe("button");
      // "link" exists in both systems, should not warn
      expect(consoleWarnSpy?.mock.calls.length).toBe(0);
    });
  });

  describe("buttonVariants CVA function", () => {
    test("generates correct class string for accent variant", () => {
      const classes = buttonVariants({ variant: "accent" });
      expect(classes).toContain("bg-[var(--mrd-you)]");
      expect(classes).toContain("text-white");
    });

    test("generates correct class string for default variant", () => {
      const classes = buttonVariants({ variant: "default" });
      expect(classes).toContain("bg-primary");
      expect(classes).toContain("text-primary-foreground");
    });

    test("generates correct class string for secondary variant", () => {
      const classes = buttonVariants({ variant: "secondary" });
      expect(classes).toContain("bg-mrd-lift");
    });

    test("generates correct class string for tertiary variant", () => {
      const classes = buttonVariants({ variant: "tertiary" });
      expect(classes).toContain("bg-transparent");
    });

    test("generates correct class string for destructive variant", () => {
      const classes = buttonVariants({ variant: "destructive" });
      expect(classes).toContain("bg-destructive");
      expect(classes).toContain("text-destructive-foreground");
    });

    test("generates correct class string for warning variant", () => {
      const classes = buttonVariants({ variant: "warning" });
      expect(classes).toContain("bg-mrd-hold");
    });

    test("generates correct class string for link variant", () => {
      const classes = buttonVariants({ variant: "link" });
      expect(classes).toContain("bg-transparent");
      expect(classes).toContain("text-mrd-body");
    });

    test("size variants render correctly", () => {
      const defaultSize = buttonVariants({ size: "default" });
      const smSize = buttonVariants({ size: "sm" });
      const lgSize = buttonVariants({ size: "lg" });

      expect(defaultSize).not.toBe(smSize);
      expect(defaultSize).not.toBe(lgSize);
      expect(smSize).not.toBe(lgSize);
      // Just verify they're all truthy strings
      expect(defaultSize).toBeTruthy();
      expect(smSize).toBeTruthy();
      expect(lgSize).toBeTruthy();
    });
  });

  describe("Button props and attributes", () => {
    test("renders as a button element by default", () => {
      const el = Button.render({ children: "Click" }, null);
      expect(el.type).toBe("button");
      // type attribute is set by the Comp component (which is <button> by default)
    });

    test("disabled prop is passed through", () => {
      const el = Button.render({ disabled: true, children: "Click" }, null);
      expect(el.props.disabled).toBe(true);
    });

    test("loading prop sets aria-busy", () => {
      const el = Button.render({ loading: true, children: "Click" }, null);
      expect(el.props["aria-busy"]).toBe(true);
    });

    test("className is merged with variants", () => {
      const el = Button.render({ className: "custom-class", children: "Click" }, null);
      expect(el.props.className).toContain("custom-class");
    });

    test("children are rendered", () => {
      const el = Button.render({ children: "My Button Text" }, null);
      // The button's children structure includes content wrapped in a span
      expect(el.props.children).toBeTruthy();
    });
  });
});
